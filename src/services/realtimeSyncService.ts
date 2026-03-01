/**
 * 实时同步服务 - PDF 摘录与思维导图实时联动
 * @description 监听 PDF 摘录事件，自动同步到思维导图
 * @version 1.2.30
 */

import type {
  RealtimeSyncConfig,
  AnnotationNodeMapping,
  SyncQueueItem,
  CoordinateTransformResult
} from '../types/pdfMindMapSidebar';
import type { FreeMindMapNode as MindMapNode } from '../types/mindmapFree';
import type { PDFAnnotation } from '../types/annotation';

// 简单的防抖实现（服务层不依赖 VueUse）
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 默认配置
const DEFAULT_CONFIG: RealtimeSyncConfig = {
  enableRealtimeSync: true,
  syncDelay: 500,
  autoCreateNode: true,
  highlightOnSelect: true,
  syncColorMapping: true,
  batchSize: 10,
  layoutStrategy: 'auto'
};

// 颜色映射表
const COLOR_MAP: Record<string, string> = {
  yellow: '#FFD700',
  green: '#6BCB77',
  blue: '#4D96FF',
  red: '#FF6B6B',
  purple: '#9B59B6',
  orange: '#FECA57'
};

class RealtimeSyncService {
  private config: RealtimeSyncConfig = { ...DEFAULT_CONFIG };
  private mappings: AnnotationNodeMapping[] = [];
  private syncQueue: SyncQueueItem[] = [];
  private isProcessing = false;
  private lastSyncTime: number | null = null;

  // 获取状态的方法
  public getIsEnabled(): boolean {
    return this.config.enableRealtimeSync;
  }

  public getQueueLength(): number {
    return this.syncQueue.length;
  }

  public getMappingCount(): number {
    return this.mappings.length;
  }

  /**
   * 初始化服务
   */
  init(config?: Partial<RealtimeSyncConfig>): void {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
    console.log('[RealtimeSyncService] 初始化完成', this.config);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RealtimeSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): RealtimeSyncConfig {
    return { ...this.config };
  }

  /**
   * PDF 坐标转导图坐标
   */
  transformCoordinates(
    pdfRect: [number, number, number, number],
    pageHeight: number,
    _canvasWidth: number,
    existingNodes: MindMapNode[]
  ): CoordinateTransformResult {
    const [x1, y1, x2, y2] = pdfRect;

    // 基础位置计算
    let x = 50 + (existingNodes.length % 3) * 220;
    let y = 50 + Math.floor(existingNodes.length / 3) * 150;

    // 根据页码调整 Y 轴位置（实现按页分组）
    const pageOffset = Math.floor(y1 / pageHeight) * 300;
    y += pageOffset;

    // 避免重叠检测
    const position = this.avoidOverlap(x, y, existingNodes);

    return {
      x: position.x,
      y: position.y,
      width: Math.min(200, Math.max(140, (x2 - x1) * 0.5)),
      height: Math.min(120, Math.max(60, (y2 - y1) * 0.5))
    };
  }

  /**
   * 避免节点重叠
   */
  private avoidOverlap(
    x: number,
    y: number,
    existingNodes: MindMapNode[],
    maxAttempts: number = 10
  ): { x: number; y: number } {
    let newX = x;
    let newY = y;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const hasOverlap = existingNodes.some(node => {
        const dx = Math.abs(node.position.x - newX);
        const dy = Math.abs(node.position.y - newY);
        return dx < 180 && dy < 100; // 最小间距
      });

      if (!hasOverlap) {
        break;
      }

      // 向右下方偏移
      newX += 40;
      newY += 30;
      attempts++;
    }

    return { x: newX, y: newY };
  }

  /**
   * 创建节点数据
   */
  createNodeFromAnnotation(
    annotation: PDFAnnotation,
    existingNodes: MindMapNode[]
  ): MindMapNode {
    const color = this.config.syncColorMapping
      ? COLOR_MAP[annotation.color] || COLOR_MAP.yellow
      : COLOR_MAP.yellow;

    const position = this.transformCoordinates(
      annotation.rect,
      800, // 默认页高
      600, // 默认画布宽
      existingNodes
    );

    return {
      id: `annotation-${annotation.id}`,
      type: annotation.isImage ? 'image' : 'card',
      position: {
        x: position.x,
        y: position.y
      },
      data: {
        annotationId: annotation.id,
        title: annotation.text.slice(0, 50) + (annotation.text.length > 50 ? '...' : ''),
        content: annotation.text,
        page: annotation.page,
        color: color,
        imageUrl: annotation.imagePath || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      style: {
        width: position.width,
        minWidth: '140px',
        maxWidth: '220px'
      }
    };
  }

  /**
   * 添加同步队列项
   */
  addToQueue(item: SyncQueueItem): void {
    // 去重检查
    const exists = this.syncQueue.find(
      q => q.annotationId === item.annotationId && q.type === item.type
    );

    if (exists) {
      // 更新现有项
      exists.data = item.data;
      exists.timestamp = Date.now();
    } else {
      this.syncQueue.push({
        ...item,
        timestamp: Date.now()
      });
    }

    // 触发处理
    this.debouncedProcessQueue();
  }

  /**
   * 防抖处理队列
   */
  private debouncedProcessQueue = debounce(
    () => this.processQueue(),
    500
  );

  /**
   * 处理同步队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 批量处理
      const batch = this.syncQueue.splice(0, this.config.batchSize);

      for (const item of batch) {
        await this.processSyncItem(item);
      }

      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('[RealtimeSyncService] 处理队列失败:', error);
    } finally {
      this.isProcessing = false;

      // 如果还有剩余项，继续处理
      if (this.syncQueue.length > 0) {
        this.debouncedProcessQueue();
      }
    }
  }

  /**
   * 处理单个同步项
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'create':
        // 创建节点 - 通过事件通知外部处理
        window.dispatchEvent(new CustomEvent('mindmap-create-node', {
          detail: { annotation: item.data }
        }));
        break;

      case 'update':
        window.dispatchEvent(new CustomEvent('mindmap-update-node', {
          detail: { annotation: item.data }
        }));
        break;

      case 'delete':
        window.dispatchEvent(new CustomEvent('mindmap-delete-node', {
          detail: { annotationId: item.annotationId }
        }));
        break;

      case 'highlight':
        window.dispatchEvent(new CustomEvent('mindmap-highlight-node', {
          detail: { annotationId: item.annotationId }
        }));
        break;
    }
  }

  /**
   * 处理标注创建
   */
  handleAnnotationCreated(annotation: PDFAnnotation): void {
    if (!this.config.enableRealtimeSync || !this.config.autoCreateNode) {
      return;
    }

    this.addToQueue({
      type: 'create',
      annotationId: annotation.id,
      data: annotation
    });
  }

  /**
   * 处理标注更新
   */
  handleAnnotationUpdated(annotation: PDFAnnotation): void {
    if (!this.config.enableRealtimeSync) {
      return;
    }

    this.addToQueue({
      type: 'update',
      annotationId: annotation.id,
      data: annotation
    });
  }

  /**
   * 处理标注删除
   */
  handleAnnotationDeleted(annotationId: string): void {
    if (!this.config.enableRealtimeSync) {
      return;
    }

    this.addToQueue({
      type: 'delete',
      annotationId: annotationId,
      data: null
    });

    // 移除映射
    this.mappings = this.mappings.filter(
      m => m.annotationId !== annotationId
    );
  }

  /**
   * 处理标注选中
   */
  handleAnnotationSelected(annotation: PDFAnnotation): void {
    if (!this.config.enableRealtimeSync || !this.config.highlightOnSelect) {
      return;
    }

    this.addToQueue({
      type: 'highlight',
      annotationId: annotation.id,
      data: annotation
    });
  }

  /**
   * 添加映射关系
   */
  addMapping(mapping: AnnotationNodeMapping): void {
    const exists = this.mappings.find(
      m => m.annotationId === mapping.annotationId
    );

    if (exists) {
      Object.assign(exists, mapping, { updatedAt: Date.now() });
    } else {
      this.mappings.push(mapping);
    }
  }

  /**
   * 根据标注 ID 获取节点 ID
   */
  getNodeIdByAnnotationId(annotationId: string): string | null {
    const mapping = this.mappings.find(m => m.annotationId === annotationId);
    return mapping?.nodeId || null;
  }

  /**
   * 根据节点 ID 获取标注 ID
   */
  getAnnotationIdByNodeId(nodeId: string): string | null {
    const mapping = this.mappings.find(m => m.nodeId === nodeId);
    return mapping?.annotationId || null;
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.syncQueue = [];
    this.mappings = [];
    this.lastSyncTime = null;
  }

  /**
   * 导出映射数据
   */
  exportMappings(): AnnotationNodeMapping[] {
    return [...this.mappings];
  }

  /**
   * 导入映射数据
   */
  importMappings(mappings: AnnotationNodeMapping[]): void {
    this.mappings = [...mappings];
  }
}

// 单例实例
let instance: RealtimeSyncService | null = null;

export function getRealtimeSyncService(): RealtimeSyncService {
  if (!instance) {
    instance = new RealtimeSyncService();
  }
  return instance;
}

export function resetRealtimeSyncService(): void {
  instance = null;
}

export { RealtimeSyncService };
export default getRealtimeSyncService;
