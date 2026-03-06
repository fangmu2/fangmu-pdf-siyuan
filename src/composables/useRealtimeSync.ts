/**
 * 实时同步组合式函数 - PDF 摘录与思维导图联动
 * @description 提供实时同步的组合式 API
 * @version 1.2.30
 */

import type { PDFAnnotation } from '../types/annotation'
import type {
  AnnotationNodeMapping,
  RealtimeSyncConfig,
  UseRealtimeSyncOptions,
  UseRealtimeSyncReturn,
} from '../types/pdfMindMapSidebar'
import { storeToRefs } from 'pinia'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { getRealtimeSyncService } from '../services/realtimeSyncService'
import { useFreeMindMapStore } from '../stores/freeMindMapStore'

/**
 * 实时同步组合式函数
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}): UseRealtimeSyncReturn {
  const {
    pdfDocId,
    autoInit = true,
    config: userConfig = {},
  } = options

  // 服务实例
  const syncService = getRealtimeSyncService()

  // Store
  const mindMapStore = useFreeMindMapStore()
  const {
    nodes,
    edges,
  } = storeToRefs(mindMapStore)

  // 本地状态
  const isInitialized = ref(false)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  const pendingCount = ref(0)
  const error = ref<string | null>(null)

  // 计算属性 - 使用服务层的新方法
  const isEnabled = computed(() => syncService.getIsEnabled())
  const mappingCount = computed(() => syncService.getMappingCount())
  const queueLength = computed(() => syncService.getQueueLength())

  /**
   * 初始化同步服务
   */
  const init = (config?: Partial<RealtimeSyncConfig>): void => {
    if (isInitialized.value) return

    syncService.init({
      enableRealtimeSync: true,
      syncDelay: 500,
      autoCreateNode: true,
      highlightOnSelect: true,
      syncColorMapping: true,
      batchSize: 10,
      layoutStrategy: 'auto',
      ...userConfig,
      ...config,
    })

    // 注册事件监听器
    setupEventListeners()

    isInitialized.value = true
    console.log('[useRealtimeSync] 初始化完成')
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = (): void => {
    // 监听创建节点事件
    window.addEventListener('mindmap-create-node', handleCreateNode as EventListener)
    window.addEventListener('mindmap-update-node', handleUpdateNode as EventListener)
    window.addEventListener('mindmap-delete-node', handleDeleteNode as EventListener)
    window.addEventListener('mindmap-highlight-node', handleHighlightNode as EventListener)
  }

  /**
   * 清理事件监听器
   */
  const cleanupEventListeners = (): void => {
    window.removeEventListener('mindmap-create-node', handleCreateNode as EventListener)
    window.removeEventListener('mindmap-update-node', handleUpdateNode as EventListener)
    window.removeEventListener('mindmap-delete-node', handleDeleteNode as EventListener)
    window.removeEventListener('mindmap-highlight-node', handleHighlightNode as EventListener)
  }

  /**
   * 处理创建节点事件
   */
  const handleCreateNode = (event: CustomEvent): void => {
    const { annotation } = event.detail as { annotation: PDFAnnotation }
    if (!annotation) return

    try {
      // 检查是否已存在对应节点
      const existingNode = nodes.value.find(
        (n) => n.data?.annotationId === annotation.id,
      )

      if (existingNode) {
        console.log('[useRealtimeSync] 节点已存在，跳过创建:', annotation.id)
        return
      }

      // 创建新节点
      const node = syncService.createNodeFromAnnotation(annotation, nodes.value)

      // 添加到 Store
      mindMapStore.addNode(node)

      // 添加映射关系
      syncService.addMapping({
        annotationId: annotation.id,
        nodeId: node.id,
        pdfPage: annotation.page,
        pdfRect: annotation.rect,
        canvasPosition: node.position,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      lastSyncTime.value = Date.now()
      console.log('[useRealtimeSync] 节点创建成功:', node.id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建节点失败'
      console.error('[useRealtimeSync] 创建节点失败:', err)
    }
  }

  /**
   * 处理更新节点事件
   */
  const handleUpdateNode = (event: CustomEvent): void => {
    const { annotation } = event.detail as { annotation: PDFAnnotation }
    if (!annotation) return

    try {
      const nodeId = syncService.getNodeIdByAnnotationId(annotation.id)
      if (!nodeId) {
        console.warn('[useRealtimeSync] 未找到对应节点:', annotation.id)
        return
      }

      // 更新节点数据
      mindMapStore.updateNodeData(nodeId, {
        title: annotation.text.slice(0, 50) + (annotation.text.length > 50 ? '...' : ''),
        content: annotation.text,
        page: annotation.page,
        updatedAt: Date.now(),
      })

      lastSyncTime.value = Date.now()
      console.log('[useRealtimeSync] 节点更新成功:', nodeId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新节点失败'
      console.error('[useRealtimeSync] 更新节点失败:', err)
    }
  }

  /**
   * 处理删除节点事件
   */
  const handleDeleteNode = (event: CustomEvent): void => {
    const { annotationId } = event.detail as { annotationId: string }
    if (!annotationId) return

    try {
      const nodeId = syncService.getNodeIdByAnnotationId(annotationId)
      if (!nodeId) {
        console.warn('[useRealtimeSync] 未找到对应节点:', annotationId)
        return
      }

      // 删除节点
      mindMapStore.deleteNode(nodeId)

      lastSyncTime.value = Date.now()
      console.log('[useRealtimeSync] 节点删除成功:', nodeId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除节点失败'
      console.error('[useRealtimeSync] 删除节点失败:', err)
    }
  }

  /**
   * 处理高亮节点事件
   */
  const handleHighlightNode = (event: CustomEvent): void => {
    const { annotationId } = event.detail as { annotationId: string }
    if (!annotationId) return

    try {
      const nodeId = syncService.getNodeIdByAnnotationId(annotationId)
      if (!nodeId) {
        console.warn('[useRealtimeSync] 未找到对应节点:', annotationId)
        return
      }

      // 触发高亮事件
      window.dispatchEvent(new CustomEvent('mindmap-focus-node', {
        detail: {
          nodeId,
          highlight: true,
        },
      }))

      console.log('[useRealtimeSync] 节点高亮:', nodeId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '高亮节点失败'
      console.error('[useRealtimeSync] 高亮节点失败:', err)
    }
  }

  /**
   * 处理标注创建
   */
  const handleAnnotationCreated = (annotation: PDFAnnotation): void => {
    syncService.handleAnnotationCreated(annotation)
  }

  /**
   * 处理标注更新
   */
  const handleAnnotationUpdated = (annotation: PDFAnnotation): void => {
    syncService.handleAnnotationUpdated(annotation)
  }

  /**
   * 处理标注删除
   */
  const handleAnnotationDeleted = (annotationId: string): void => {
    syncService.handleAnnotationDeleted(annotationId)
  }

  /**
   * 处理标注选中
   */
  const handleAnnotationSelected = (annotation: PDFAnnotation): void => {
    syncService.handleAnnotationSelected(annotation)
  }

  /**
   * 手动同步所有标注
   */
  const syncAllAnnotations = (annotations: PDFAnnotation[]): void => {
    annotations.forEach((annotation, index) => {
      setTimeout(() => {
        handleAnnotationCreated(annotation)
      }, index * 100) // 错峰创建，避免卡顿
    })
  }

  /**
   * 根据节点查找标注 ID
   */
  const getAnnotationIdByNode = (nodeId: string): string | null => {
    return syncService.getAnnotationIdByNodeId(nodeId)
  }

  /**
   * 根据标注查找节点 ID
   */
  const getNodeIdByAnnotation = (annotationId: string): string | null => {
    return syncService.getNodeIdByAnnotationId(annotationId)
  }

  /**
   * 启用/禁用实时同步
   */
  const toggleSync = (enabled?: boolean): void => {
    const newValue = enabled !== undefined ? enabled : !syncService.getConfig().enableRealtimeSync
    syncService.updateConfig({ enableRealtimeSync: newValue })
  }

  /**
   * 更新配置
   */
  const updateConfig = (config: Partial<RealtimeSyncConfig>): void => {
    syncService.updateConfig(config)
  }

  /**
   * 获取当前配置
   */
  const getConfig = (): RealtimeSyncConfig => {
    return syncService.getConfig()
  }

  /**
   * 清空所有数据
   */
  const clear = (): void => {
    syncService.clear()
    lastSyncTime.value = null
    error.value = null
  }

  /**
   * 导出映射数据
   */
  const exportMappings = (): AnnotationNodeMapping[] => {
    return syncService.exportMappings()
  }

  /**
   * 导入映射数据
   */
  const importMappings = (mappings: AnnotationNodeMapping[]): void => {
    syncService.importMappings(mappings)
  }

  // 生命周期
  onMounted(() => {
    if (autoInit) {
      init()
    }
  })

  onUnmounted(() => {
    cleanupEventListeners()
  })

  // 监听 pdfDocId 变化
  watch(() => pdfDocId, (newId, oldId) => {
    if (newId && newId !== oldId) {
      clear()
      init()
    }
  })

  return {
    // 状态
    isInitialized,
    isSyncing,
    isEnabled,
    lastSyncTime,
    pendingCount,
    error,
    mappingCount,
    queueLength,

    // 方法
    init,
    handleAnnotationCreated,
    handleAnnotationUpdated,
    handleAnnotationDeleted,
    handleAnnotationSelected,
    syncAllAnnotations,
    getAnnotationIdByNode,
    getNodeIdByAnnotation,
    toggleSync,
    updateConfig,
    getConfig,
    clear,
    exportMappings,
    importMappings,
  }
}

export default useRealtimeSync
