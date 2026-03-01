<template>
  <div
    class="pdf-mindmap-sidebar"
    :class="{
      'is-collapsed': !visible,
      'is-expanded': visible,
      [`theme-${currentTheme}`]: true
    }"
    :style="sidebarStyle"
  >
    <!-- 切换按钮 -->
    <div
      class="sidebar-toggle"
      :class="{ 'is-collapsed': !visible }"
      @click="toggleSidebar"
    >
      <svg v-if="visible" class="toggle-icon" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      <svg v-else class="toggle-icon" viewBox="0 0 24 24">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      <span v-if="!visible" class="toggle-text">思维导图</span>
    </div>

    <!-- 分隔条（仅在展开时显示） -->
    <div
      v-if="visible"
      class="resize-handle"
      @mousedown="startResize"
    />

    <!-- 侧边栏内容 -->
    <div v-show="visible" class="sidebar-content">
      <!-- 头部工具栏 -->
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          <svg class="title-icon" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          思维导图
        </h3>
        <div class="header-actions">
          <button
            class="action-btn"
            :class="{ active: autoSyncEnabled }"
            :title="autoSyncEnabled ? '自动同步已开启' : '自动同步已关闭'"
            @click="toggleAutoSync"
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <button
            class="action-btn"
            title="立即同步"
            @click="syncNow"
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <button
            class="action-btn"
            title="清空导图"
            @click="confirmClear"
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 画布区域 -->
      <div class="sidebar-body">
        <!-- 空状态引导 -->
        <MindMapEmptyState
          v-if="showEmptyState && !isLoading"
          @add-demo-node="handleAddDemoNode"
          @import-existing="handleImportExisting"
        />

        <!-- 思维导图 -->
        <FreeCanvasViewer
          v-else-if="canvasReady && mindMapBlockId && nodes && nodes.length > 0"
          ref="canvasRef"
          :block-id="mindMapBlockId"
          :study-set-id="props.studySetId || ''"
          :read-only="false"
          :show-grid="true"
          :show-controls="true"
          :show-mini-map="false"
          :show-toolbar="true"
          :show-search="false"
          :show-filter="false"
          @node-click="handleNodeClick"
        />

        <!-- 加载状态 -->
        <div v-else-if="isLoading" class="loading-state">
          <div class="loading-spinner" />
          <span>{{ importProgress > 0 ? `导入中... ${importProgress}%` : '加载中...' }}</span>
        </div>

        <!-- 无数据提示（非空状态） -->
        <div v-else-if="!showEmptyState && (!nodes || nodes.length === 0)" class="empty-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>暂无思维导图数据</span>
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="sidebar-footer">
        <span class="status-text">
          {{ nodeCount }} 个节点
        </span>
        <span class="status-divider">|</span>
        <span class="status-text">
          {{ lastSyncTime ? `上次同步：${formatTime(lastSyncTime)}` : '未同步' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import FreeCanvasViewer from './MindMapFreeCanvas/FreeCanvasViewer.vue';
import MindMapEmptyState from './MindMapEmptyState.vue';
import { useFreeMindMapStore } from '../stores/freeMindMapStore';
import type { PDFAnnotation } from '../types/annotation';
import type { FreeMindMapNode } from '../types/mindmapFree';
import { saveMindMapToBlock as saveToBlock } from '../services/freeMindMapDataIntegrationService';

// Props
interface Props {
  pdfDocId: string;
  studySetId?: string;
  visible?: boolean;
  width?: number;
  annotations?: PDFAnnotation[];
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
  visible: false,
  width: 350,
  annotations: () => []
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:width', value: number): void;
  (e: 'node-click', nodeId: string): void;
  (e: 'sync-request'): void;
  (e: 'annotation-click', annotationId: string): void;
  (e: 'node-created', nodeId: string): void;
}

const emit = defineEmits<Emits>();

// 颜色映射配置
const COLOR_MAP: Record<string, string> = {
  yellow: '#FFD700',
  green: '#6BCB77',
  blue: '#4D96FF',
  red: '#FF6B6B',
  purple: '#9B59B6',
  orange: '#FECA57'
};

// Store
const mindMapStore = useFreeMindMapStore();
const { nodes, edges } = storeToRefs(mindMapStore);

// Refs
const canvasRef = ref<InstanceType<typeof FreeCanvasViewer> | null>(null);
const canvasReady = ref(false);
const autoSyncEnabled = ref(true);
const lastSyncTime = ref<number | null>(null);
const isResizing = ref(false);
const currentWidth = ref(props.width);

// 思维导图块 ID
const mindMapBlockId = ref<string>('');

// 空状态相关
const showEmptyState = ref(false);
const isLoading = ref(false);
const importProgress = ref(0);

// Computed
const sidebarStyle = computed(() => ({
  width: props.visible ? `${currentWidth.value}px` : '32px'
}));

const nodeCount = computed(() => nodes.value?.length || 0);

const currentTheme = computed(() => {
  if (typeof window !== 'undefined' && (window as any).siyuan?.config?.appearance?.mode) {
    return (window as any).siyuan.config.appearance.mode === 1 ? 'dark' : 'light';
  }
  return 'light';
});

// Methods
const toggleSidebar = (): void => {
  emit('update:visible', !props.visible);
};

const toggleAutoSync = (): void => {
  autoSyncEnabled.value = !autoSyncEnabled.value;
  localStorage.setItem('pdfMindMapAutoSync', String(autoSyncEnabled.value));
};

const syncNow = (): void => {
  emit('sync-request');
  lastSyncTime.value = Date.now();
};

const confirmClear = (): void => {
  if (typeof window !== 'undefined' && window.confirm) {
    if (window.confirm('确定要清空当前思维导图吗？此操作不可恢复。')) {
      mindMapStore.reset();
      lastSyncTime.value = Date.now();
      showEmptyState.value = true;
    }
  }
};

const handleNodeClick = (node: any): void => {
  const nodeId = typeof node === 'string' ? node : node?.id;
  emit('node-click', nodeId);
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 从标注创建节点数据
 */
function createNodeFromAnnotation(annotation: PDFAnnotation, pageIndex: number = 0, nodeIndex: number = 0): FreeMindMapNode {
  const headerColor = COLOR_MAP[annotation.color] || COLOR_MAP.yellow;

  // 计算位置（按页码水平分布，同一页内垂直分布）
  const baseX = 50 + pageIndex * 240;
  const baseY = 50 + nodeIndex * 140;

  // 确保 nodes.value 已初始化
  if (!nodes.value) {
    nodes.value = [];
  }

  const node = mindMapStore.createNode({
    type: 'textCard',
    title: annotation.text.slice(0, 50) + (annotation.text.length > 50 ? '...' : ''),
    content: annotation.text,
    position: { x: baseX, y: baseY },
    annotationId: annotation.id
  });

  // 设置额外数据
  if (node.data) {
    node.data.page = annotation.page;
    node.data.color = headerColor;
    node.data.pdfPath = annotation.pdfPath;
    node.data.rect = annotation.rect;
  }

  // 设置样式
  node.style = {
    ...node.style,
    width: 200,
    minWidth: 140,
    maxWidth: 220
  };

  console.log('[PdfMindMapSidebar] 创建节点:', node.id, '来自标注:', annotation.id);
  return node;
}

/**
 * 导入已有摘录到思维导图
 */
async function importExistingAnnotations() {
  console.log('[PdfMindMapSidebar] 开始导入已有摘录, annotations数量:', props.annotations?.length);

  // 空值检查
  if (!props.pdfDocId) {
    console.warn('[PdfMindMapSidebar] pdfDocId 为空，跳过导入');
    showEmptyState.value = true;
    return;
  }

  // 确保 nodes 已初始化
  if (!nodes.value) {
    nodes.value = [];
  }

  // 如果没有标注数据，检查是否已有节点
  if (!props.annotations || props.annotations.length === 0) {
    console.log('[PdfMindMapSidebar] 没有标注数据');
    showEmptyState.value = nodes.value.length === 0;
    return;
  }

  isLoading.value = true;
  importProgress.value = 0;

  try {
    // 获取已有节点 ID 集合
    const existingNodeIds = new Set(
      nodes.value.map(n => n.data?.annotationId).filter(Boolean)
    );
    console.log('[PdfMindMapSidebar] 已有节点数:', nodes.value.length, '已导入标注数:', existingNodeIds.size);

    // 过滤未导入的摘录
    const newAnnotations = props.annotations.filter(
      a => a && a.id && !existingNodeIds.has(a.id)
    );

    console.log('[PdfMindMapSidebar] 需要导入的新摘录数:', newAnnotations.length);

    if (newAnnotations.length === 0) {
      // 没有新摘录，但已有节点存在
      showEmptyState.value = nodes.value.length === 0;
      isLoading.value = false;
      return;
    }

    // 按页码分组排序
    const grouped = newAnnotations.reduce((acc, ann) => {
      const page = ann.page || 1;
      if (!acc[page]) acc[page] = [];
      acc[page].push(ann);
      return acc;
    }, {} as Record<number, typeof newAnnotations>);

    // 批量创建节点（按页码顺序）
    const sortedPages = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    let createdCount = 0;
    const totalCount = newAnnotations.length;

    for (const page of sortedPages) {
      const items = grouped[page];
      const pageIndex = sortedPages.indexOf(page);

      for (let i = 0; i < items.length; i++) {
        const annotation = items[i];
        createNodeFromAnnotation(annotation, pageIndex, i);
        createdCount++;

        // 更新进度
        importProgress.value = Math.round((createdCount / totalCount) * 100);

        // 延迟避免阻塞 UI
        if (createdCount % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }

    // 保存到思维导图块
    await saveMindMapToBlock();

    // 应用自动布局
    applyPageBasedLayout();

    showEmptyState.value = nodes.value.length === 0;
    console.log('[PdfMindMapSidebar] 导入完成，共创建', createdCount, '个节点，当前总节点数:', nodes.value.length);
  } catch (error) {
    console.error('[PdfMindMapSidebar] 导入摘录失败:', error);
  } finally {
    isLoading.value = false;
    importProgress.value = 0;
  }
}

/**
 * 应用基于页码的布局
 */
function applyPageBasedLayout() {
  if (!nodes.value || nodes.value.length === 0) return;

  // 按页码分组节点
  const nodesByPage = nodes.value.reduce((acc, node) => {
    const page = node.data?.page || 0;
    if (!acc[page]) acc[page] = [];
    acc[page].push(node);
    return acc;
  }, {} as Record<number, typeof nodes.value>);

  // 按页码排序
  const sortedPages = Object.keys(nodesByPage).sort((a, b) => Number(a) - Number(b));

  // 重新排列节点位置
  sortedPages.forEach((page, pageIndex) => {
    const pageNodes = nodesByPage[page];
    pageNodes.forEach((node, nodeIndex) => {
      node.position.x = 50 + pageIndex * 240;
      node.position.y = 50 + nodeIndex * 140;
    });
  });

  console.log('[PdfMindMapSidebar] 布局应用完成，节点数:', nodes.value.length);
}

/**
 * 保存思维导图到块（使用数据集成服务）
 */
async function saveMindMapToBlock() {
  if (!mindMapBlockId.value) {
    console.warn('[PdfMindMapSidebar] 无法保存：mindMapBlockId 为空');
    return;
  }

  // 确保 nodes 和 edges 已初始化
  if (!nodes.value) nodes.value = [];
  if (!edges.value) edges.value = [];

  try {
    const data = {
      nodes: nodes.value,
      edges: edges.value,
      viewport: { zoom: 1, x: 0, y: 0 },
      layout: 'free' as const
    };

    await saveToBlock(mindMapBlockId.value, data);
    console.log('[PdfMindMapSidebar] 思维导图已保存，节点数:', nodes.value.length);
  } catch (error) {
    console.error('[PdfMindMapSidebar] 保存思维导图失败:', error);
  }
}

/**
 * 处理添加示例卡片
 */
function handleAddDemoNode() {
  // 确保 nodes 已初始化
  if (!nodes.value) {
    nodes.value = [];
  }

  const demoNode = mindMapStore.createNode({
    type: 'textCard',
    title: '示例卡片',
    content: '这是一个示例卡片，演示如何创建思维导图节点。\n\n你可以在 PDF 中选择文本，然后点击"创建标注"按钮来创建自己的卡片。',
    position: { x: 50, y: 50 },
    annotationId: 'demo-' + Date.now()
  });

  // 设置额外数据
  if (demoNode.data) {
    demoNode.data.page = 1;
    demoNode.data.color = COLOR_MAP.yellow;
  }
  demoNode.style = {
    ...demoNode.style,
    width: 200,
    minWidth: 140,
    maxWidth: 220
  };

  showEmptyState.value = false;
  saveMindMapToBlock();
  emit('node-created', demoNode.id);
  console.log('[PdfMindMapSidebar] 示例节点已创建:', demoNode.id);
}

/**
 * 处理导入已有摘录
 */
function handleImportExisting() {
  importExistingAnnotations();
}

// 处理标注创建事件
const handleAnnotationCreatedEvent = (event: CustomEvent): void => {
  console.log('[PdfMindMapSidebar] 收到 annotation-created 事件', event.detail);

  if (!autoSyncEnabled.value) {
    console.log('[PdfMindMapSidebar] 自动同步已关闭，跳过处理');
    return;
  }

  const { annotation } = event.detail as { annotation: PDFAnnotation };
  if (!annotation) {
    console.warn('[PdfMindMapSidebar] 事件中没有 annotation 数据');
    return;
  }

  console.log('[PdfMindMapSidebar] 收到标注创建事件:', annotation.id, '文本:', annotation.text?.slice(0, 30));

  // 确保 nodes 已初始化
  if (!nodes.value) {
    nodes.value = [];
  }

  // 检查是否已存在相同 annotationId 的节点
  const existingNode = nodes.value.find(n => n.data?.annotationId === annotation.id);
  if (existingNode) {
    console.log('[PdfMindMapSidebar] 节点已存在，跳过创建');
    return;
  }

  // 计算新节点的位置（基于已有节点数量）
  const pageIndex = Math.floor(nodes.value.length / 3);
  const nodeIndex = nodes.value.length % 3;

  // 创建节点
  const newNode = createNodeFromAnnotation(annotation, pageIndex, nodeIndex);
  showEmptyState.value = false;

  // 保存
  saveMindMapToBlock();
  lastSyncTime.value = Date.now();

  emit('node-created', newNode.id);
  console.log('[PdfMindMapSidebar] 节点创建完成:', newNode.id);
};

/**
 * 处理标注更新事件
 */
const handleAnnotationUpdatedEvent = (event: CustomEvent): void => {
  const { annotation } = event.detail as { annotation: PDFAnnotation };
  if (!annotation) return;

  // 查找并更新对应节点
  const nodeIndex = nodes.value.findIndex(
    n => n.data?.annotationId === annotation.id
  );
  if (nodeIndex !== -1) {
    const node = nodes.value[nodeIndex];
    mindMapStore.updateNode({
      id: node.id,
      title: annotation.text.slice(0, 50) + (annotation.text.length > 50 ? '...' : ''),
      content: annotation.text,
      style: {
        ...node.style,
        backgroundColor: COLOR_MAP[annotation.color]
      }
    });
    saveMindMapToBlock();
  }
};

/**
 * 处理标注删除事件
 */
const handleAnnotationDeletedEvent = (event: CustomEvent): void => {
  const annotationId = (event as any).detail?.annotationId;
  if (!annotationId) return;

  // 查找并删除对应节点
  const nodeIndex = nodes.value.findIndex(
    n => n.data?.annotationId === annotationId
  );
  if (nodeIndex !== -1) {
    nodes.value.splice(nodeIndex, 1);
    saveMindMapToBlock();

    // 如果删除后没有节点了，显示空状态
    if (nodes.value.length === 0) {
      showEmptyState.value = true;
    }
  }
};

/**
 * 初始化思维导图块 ID
 * 注意：pdfDocId 可能是 PDF 路径（如 /data/assets/xxx.pdf），不是有效的思源块 ID
 * 我们需要使用 localStorage 存储一个虚拟的块 ID 映射
 */
async function initMindMapBlockId() {
  if (!props.pdfDocId) return;

  try {
    // 生成唯一存储键：studySet_pdf_path
    const storageKey = `mindmap-block-${props.studySetId || 'default'}-${encodeURIComponent(props.pdfDocId)}`;

    // 尝试从 localStorage 获取已保存的块 ID
    let savedBlockId = localStorage.getItem(storageKey);

    if (!savedBlockId) {
      // 生成一个虚拟的唯一 ID（格式：temp_时间戳_随机数）
      // 这个 ID 不会用于思源 API 调用，仅用于标识这个 PDF 的思维导图
      savedBlockId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(storageKey, savedBlockId);
    }

    mindMapBlockId.value = savedBlockId;
    console.log('[PdfMindMapSidebar] 思维导图块 ID 已初始化:', mindMapBlockId.value);
  } catch (error) {
    console.error('[PdfMindMapSidebar] 初始化思维导图块 ID 失败:', error);
    // 生成一个临时的块 ID
    mindMapBlockId.value = `temp-fallback-${Date.now()}`;
  }
}

// Resize handling
let startX = 0;
let startWidth = 0;

const startResize = (e: MouseEvent): void => {
  isResizing.value = true;
  startX = e.clientX;
  startWidth = currentWidth.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (e: MouseEvent): void => {
  if (!isResizing.value) return;

  const delta = startX - e.clientX;
  const newWidth = Math.max(300, Math.min(startWidth + delta, window.innerWidth * 0.5));
  currentWidth.value = newWidth;
  emit('update:width', newWidth);
};

const stopResize = (): void => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  localStorage.setItem('pdfMindMapSidebarWidth', String(currentWidth.value));
};

// Lifecycle
onMounted(async () => {
  isLoading.value = true;

  // 恢复用户偏好设置
  const savedWidth = localStorage.getItem('pdfMindMapSidebarWidth');
  if (savedWidth) {
    currentWidth.value = parseInt(savedWidth, 10);
    emit('update:width', currentWidth.value);
  }

  const savedAutoSync = localStorage.getItem('pdfMindMapAutoSync');
  if (savedAutoSync !== null) {
    autoSyncEnabled.value = savedAutoSync === 'true';
  }

  // 初始化画布
  await nextTick();
  canvasReady.value = true;

  // 初始化思维导图块 ID
  await initMindMapBlockId();

  // 加载思维导图数据
  if (mindMapBlockId.value) {
    try {
      await mindMapStore.loadMindMap(mindMapBlockId.value);
    } catch (error) {
      console.error('[PdfMindMapSidebar] 加载思维导图失败:', error);
    }
  }

  // 延迟导入已有摘录（避免阻塞 UI）
  setTimeout(() => {
    importExistingAnnotations();
  }, 300);

  // 监听标注事件
  window.addEventListener('annotation-created', handleAnnotationCreatedEvent as EventListener);
  window.addEventListener('annotation-updated', handleAnnotationUpdatedEvent as EventListener);
  window.addEventListener('annotation-deleted', handleAnnotationDeletedEvent as EventListener);

  console.log('[PdfMindMapSidebar] 已注册标注事件监听');

  isLoading.value = false;
});

onUnmounted(() => {
  window.removeEventListener('annotation-created', handleAnnotationCreatedEvent as EventListener);
  window.removeEventListener('annotation-updated', handleAnnotationUpdatedEvent as EventListener);
  window.removeEventListener('annotation-deleted', handleAnnotationDeletedEvent as EventListener);
  console.log('[PdfMindMapSidebar] 已移除标注事件监听');

  if (isResizing.value) {
    stopResize();
  }
});

watch(() => props.pdfDocId, async (newId: string, oldId: string) => {
  if (newId && newId !== oldId) {
    console.log('[PdfMindMapSidebar] pdfDocId 变化:', oldId, '->', newId);
    isLoading.value = true;

    // 重置状态
    mindMapStore.reset?.() || (nodes.value = [], edges.value = []);

    // 重新初始化块 ID
    await initMindMapBlockId();

    // 加载思维导图数据
    if (mindMapBlockId.value) {
      try {
        await mindMapStore.loadMindMap(mindMapBlockId.value);
        console.log('[PdfMindMapSidebar] 已加载思维导图数据，节点数:', nodes.value?.length || 0);
      } catch (error) {
        console.error('[PdfMindMapSidebar] 加载思维导图失败:', error);
        nodes.value = [];
      }
    }

    // 重新导入摘录
    setTimeout(() => {
      importExistingAnnotations();
      isLoading.value = false;
    }, 300);
  }
});

defineExpose({
  refresh: () => (canvasRef.value as any)?.refresh?.(),
  fitView: () => (canvasRef.value as any)?.fitView?.()
});
</script>

<style scoped lang="scss">
.pdf-mindmap-sidebar {
  display: flex;
  height: 100%;
  max-height: 100%;
  background: var(--b3-theme-background);
  border-left: 1px solid var(--b3-border-color);
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;

  &.is-collapsed {
    width: 32px;
  }

  &.is-expanded {
    min-width: 300px;
  }

  &.theme-dark {
    --sidebar-bg: #1e1e1e;
    --header-bg: #252526;
    --border-color: #3c3c3c;
    --text-color: #cccccc;
    --text-secondary: #858585;
  }

  &.theme-light {
    --sidebar-bg: #fafafa;
    --header-bg: #f3f3f3;
    --border-color: #e0e0e0;
    --text-color: #333333;
    --text-secondary: #666666;
  }
}

.sidebar-toggle {
  width: 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  background: var(--header-bg);
  cursor: pointer;
  transition: background 0.2s;
  writing-mode: vertical-rl;
  text-orientation: mixed;

  &:hover {
    background: var(--b3-theme-primary-light);
  }

  &.is-collapsed {
    writing-mode: horizontal-tb;
  }
}

.toggle-icon {
  width: 16px;
  height: 16px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.toggle-text {
  font-size: 12px;
  color: var(--text-color);
  white-space: nowrap;
}

.resize-handle {
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;

  &:hover,
  &:active {
    background: var(--b3-theme-primary);
  }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  margin-left: 4px;
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.title-icon {
  width: 18px;
  height: 18px;
  color: var(--b3-theme-primary);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
    color: var(--text-secondary);
  }

  &:hover {
    background: var(--b3-theme-primary-light);

    svg {
      color: var(--b3-theme-primary);
    }
  }

  &.active {
    background: var(--b3-theme-primary-light);

    svg {
      color: var(--b3-theme-primary);
    }
  }
}

.sidebar-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--header-bg);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.status-divider {
  opacity: 0.5;
}
</style>
