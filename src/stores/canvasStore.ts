/**
 * 多画布与图层系统状态管理
 * @fileoverview 使用 Pinia 管理画布、图层的全局状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CanvasConfig,
  LayerConfig,
  CanvasReference,
  CrossCanvasNodeLink,
  CanvasListItem,
  CanvasStats,
  CreateCanvasParams,
  UpdateCanvasParams,
  UpdateLayerParams
} from '@/types/canvas'
import {
  createCanvas as createCanvasApi,
  getCanvas as getCanvasApi,
  getAllCanvases as getAllCanvasesApi,
  updateCanvas as updateCanvasApi,
  deleteCanvas as deleteCanvasApi,
  getCanvasLayers as getCanvasLayersApi,
  updateLayer as updateLayerApi,
  addLayer as addLayerApi,
  deleteLayer as deleteLayerApi,
  getCanvasStats as getCanvasStatsApi,
  createCanvasReference as createCanvasReferenceApi,
  getCanvasReferences as getCanvasReferencesApi,
  createCrossCanvasLink as createCrossCanvasLinkApi,
  getCrossCanvasLinks as getCrossCanvasLinksApi,
  deleteCrossCanvasLink as deleteCrossCanvasLinkApi
} from '@/services/canvasService'

/**
 * 画布状态 Store
 */
export const useCanvasStore = defineStore('canvas', () => {
  // ==================== State ====================

  /** 当前激活的画布 ID */
  const activeCanvasId = ref<string>('')

  /** 画布列表 */
  const canvasList = ref<CanvasListItem[]>([])

  /** 当前画布配置 */
  const currentCanvas = ref<CanvasConfig | null>(null)

  /** 当前图层配置 */
  const layers = ref<LayerConfig[]>([])

  /** 画布引用列表 */
  const references = ref<CanvasReference[]>([])

  /** 跨画布关联列表 */
  const crossCanvasLinks = ref<CrossCanvasNodeLink[]>([])

  /** 画布统计信息 */
  const stats = ref<CanvasStats | null>(null)

  /** 加载状态 */
  const isLoading = ref(false)

  /** 错误信息 */
  const errorMessage = ref<string>('')

  /** 是否已初始化 */
  const isInitialized = ref(false)

  // ==================== Getters ====================

  /** 获取当前激活的画布 */
  const activeCanvas = computed(() => {
    return canvasList.value.find(c => c.id === activeCanvasId.value) || null
  })

  /** 获取当前画布的节点层 */
  const nodesLayer = computed(() => {
    return layers.value.find(l => l.type === 'nodes') || null
  })

  /** 获取当前画布的背景层 */
  const backgroundLayer = computed(() => {
    return layers.value.find(l => l.type === 'background') || null
  })

  /** 获取当前画布的手绘层 */
  const handwritingLayer = computed(() => {
    return layers.value.find(l => l.type === 'handwriting') || null
  })

  /** 获取当前画布的标注层 */
  const annotationsLayer = computed(() => {
    return layers.value.find(l => l.type === 'annotations') || null
  })

  /** 获取可见图层列表 */
  const visibleLayers = computed(() => {
    return layers.value.filter(l => l.visible)
  })

  /** 获取锁定图层列表 */
  const lockedLayers = computed(() => {
    return layers.value.filter(l => l.locked)
  })

  /** 获取当前画布是否可编辑 */
  const isEditable = computed(() => {
    // 如果节点层被锁定，则不可编辑
    return !nodesLayer.value?.locked
  })

  // ==================== Actions ====================

  /**
   * 初始化画布系统
   * @param studySetId 学习集 ID
   */
  async function initializeCanvas(studySetId: string): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await loadCanvasList(studySetId)
      isInitialized.value = true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '初始化失败'
      console.error('[CanvasStore] 初始化画布系统失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载画布列表
   * @param studySetId 学习集 ID
   */
  async function loadCanvasList(studySetId?: string): Promise<void> {
    try {
      const list = await getAllCanvasesApi(studySetId)
      canvasList.value = list

      // 如果没有激活的画布，选择第一个
      if (!activeCanvasId.value && list.length > 0) {
        activeCanvasId.value = list[0].id
      }

      // 更新激活状态
      canvasList.value = canvasList.value.map(c => ({
        ...c,
        isActive: c.id === activeCanvasId.value
      }))
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载画布列表失败'
      console.error('[CanvasStore] 加载画布列表失败:', error)
      throw error
    }
  }

  /**
   * 创建新画布
   * @param params 创建参数
   */
  async function createCanvas(params: CreateCanvasParams): Promise<CanvasConfig | null> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const canvas = await createCanvasApi(params)
      currentCanvas.value = canvas
      activeCanvasId.value = canvas.id

      // 重新加载画布列表
      await loadCanvasList(params.studySetId)

      // 加载图层配置
      await loadLayers(canvas.id)

      return canvas
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '创建画布失败'
      console.error('[CanvasStore] 创建画布失败:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载画布配置
   * @param canvasId 画布 ID
   */
  async function loadCanvas(canvasId: string): Promise<boolean> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const canvas = await getCanvasApi(canvasId)
      if (!canvas) {
        errorMessage.value = '画布不存在'
        return false
      }

      currentCanvas.value = canvas
      activeCanvasId.value = canvasId

      // 加载图层配置
      await loadLayers(canvasId)

      // 加载引用和关联
      await loadReferences(canvasId)
      await loadCrossCanvasLinks(canvasId)

      // 加载统计信息
      await loadStats(canvasId)

      // 更新画布列表中的激活状态
      canvasList.value = canvasList.value.map(c => ({
        ...c,
        isActive: c.id === canvasId
      }))

      return true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载画布失败'
      console.error('[CanvasStore] 加载画布失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新画布配置
   * @param params 更新参数
   */
  async function updateCanvas(params: UpdateCanvasParams): Promise<boolean> {
    try {
      const success = await updateCanvasApi(params)
      if (success && params.id === activeCanvasId.value) {
        // 重新加载当前画布
        await loadCanvas(params.id)
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '更新画布失败'
      console.error('[CanvasStore] 更新画布失败:', error)
      return false
    }
  }

  /**
   * 删除画布
   * @param canvasId 画布 ID
   */
  async function removeCanvas(canvasId: string): Promise<boolean> {
    try {
      const success = await deleteCanvasApi(canvasId)
      if (success) {
        // 从列表中移除
        canvasList.value = canvasList.value.filter(c => c.id !== canvasId)

        // 如果删除的是当前画布，切换到第一个画布
        if (canvasId === activeCanvasId.value) {
          if (canvasList.value.length > 0) {
            await loadCanvas(canvasList.value[0].id)
          } else {
            currentCanvas.value = null
            activeCanvasId.value = ''
            layers.value = []
          }
        }
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '删除画布失败'
      console.error('[CanvasStore] 删除画布失败:', error)
      return false
    }
  }

  /**
   * 切换画布
   * @param canvasId 画布 ID
   */
  async function switchCanvas(canvasId: string): Promise<void> {
    if (canvasId === activeCanvasId.value) return

    await loadCanvas(canvasId)
  }

  /**
   * 加载图层配置
   * @param canvasId 画布 ID
   */
  async function loadLayers(canvasId: string): Promise<void> {
    try {
      layers.value = await getCanvasLayersApi(canvasId)
    } catch (error) {
      console.error('[CanvasStore] 加载图层配置失败:', error)
      throw error
    }
  }

  /**
   * 更新图层配置
   * @param layerParams 图层更新参数
   */
  async function updateLayerConfig(layerParams: UpdateLayerParams): Promise<boolean> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return false
    }

    try {
      const success = await updateLayerApi(activeCanvasId.value, layerParams)
      if (success) {
        // 重新加载图层
        await loadLayers(activeCanvasId.value)
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '更新图层失败'
      console.error('[CanvasStore] 更新图层失败:', error)
      return false
    }
  }

  /**
   * 添加新图层
   * @param layer 图层配置（不含 ID）
   */
  async function addLayerConfig(layer: Omit<LayerConfig, 'id'>): Promise<boolean> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return false
    }

    try {
      const success = await addLayerApi(activeCanvasId.value, layer)
      if (success) {
        // 重新加载图层
        await loadLayers(activeCanvasId.value)
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '添加图层失败'
      console.error('[CanvasStore] 添加图层失败:', error)
      return false
    }
  }

  /**
   * 删除图层
   * @param layerId 图层 ID
   */
  async function removeLayerConfig(layerId: string): Promise<boolean> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return false
    }

    try {
      const success = await deleteLayerApi(activeCanvasId.value, layerId)
      if (success) {
        // 重新加载图层
        await loadLayers(activeCanvasId.value)
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '删除图层失败'
      console.error('[CanvasStore] 删除图层失败:', error)
      return false
    }
  }

  /**
   * 加载画布引用
   * @param canvasId 画布 ID
   */
  async function loadReferences(canvasId: string): Promise<void> {
    try {
      references.value = await getCanvasReferencesApi(canvasId)
    } catch (error) {
      console.error('[CanvasStore] 加载画布引用失败:', error)
    }
  }

  /**
   * 创建画布引用
   * @param targetCanvasId 目标画布 ID
   * @param nodeIds 节点 ID 列表
   * @param referenceType 引用类型
   */
  async function createCanvasRef(
    targetCanvasId: string,
    nodeIds: string[],
    referenceType: 'node' | 'layer' | 'all' = 'node'
  ): Promise<CanvasReference | null> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return null
    }

    try {
      const reference = await createCanvasReferenceApi(
        activeCanvasId.value,
        targetCanvasId,
        nodeIds,
        referenceType
      )
      if (reference) {
        await loadReferences(activeCanvasId.value)
      }
      return reference
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '创建引用失败'
      console.error('[CanvasStore] 创建引用失败:', error)
      return null
    }
  }

  /**
   * 加载跨画布关联
   * @param canvasId 画布 ID
   */
  async function loadCrossCanvasLinks(canvasId: string): Promise<void> {
    try {
      crossCanvasLinks.value = await getCrossCanvasLinksApi(canvasId)
    } catch (error) {
      console.error('[CanvasStore] 加载跨画布关联失败:', error)
    }
  }

  /**
   * 创建跨画布关联
   * @param sourceNodeId 源节点 ID
   * @param targetCanvasId 目标画布 ID
   * @param targetNodeId 目标节点 ID
   * @param linkType 关联类型
   * @param description 关联说明
   */
  async function createCrossCanvasLink(
    sourceNodeId: string,
    targetCanvasId: string,
    targetNodeId: string,
    linkType: 'reference' | 'relation' | 'seeAlso' = 'relation',
    description?: string
  ): Promise<CrossCanvasNodeLink | null> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return null
    }

    try {
      const link = await createCrossCanvasLinkApi(
        activeCanvasId.value,
        sourceNodeId,
        targetCanvasId,
        targetNodeId,
        linkType,
        description
      )
      if (link) {
        await loadCrossCanvasLinks(activeCanvasId.value)
      }
      return link
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '创建关联失败'
      console.error('[CanvasStore] 创建关联失败:', error)
      return null
    }
  }

  /**
   * 删除跨画布关联
   * @param linkId 关联 ID
   */
  async function removeCrossCanvasLink(linkId: string): Promise<boolean> {
    try {
      const success = await deleteCrossCanvasLinkApi(linkId)
      if (success && activeCanvasId.value) {
        await loadCrossCanvasLinks(activeCanvasId.value)
      }
      return success
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '删除关联失败'
      console.error('[CanvasStore] 删除关联失败:', error)
      return false
    }
  }

  /**
   * 加载画布统计信息
   * @param canvasId 画布 ID
   */
  async function loadStats(canvasId: string): Promise<void> {
    try {
      stats.value = await getCanvasStatsApi(canvasId)
    } catch (error) {
      console.error('[CanvasStore] 加载统计信息失败:', error)
    }
  }

  /**
   * 更新画布节点和连线
   * @param nodes 节点列表
   * @param edges 连线列表
   */
  async function updateCanvasNodesAndEdges(
    nodes: CanvasConfig['nodes'],
    edges: CanvasConfig['edges']
  ): Promise<boolean> {
    if (!activeCanvasId.value) {
      errorMessage.value = '没有激活的画布'
      return false
    }

    return updateCanvas({
      id: activeCanvasId.value,
      nodes,
      edges
    })
  }

  /**
   * 重置状态
   */
  function reset(): void {
    activeCanvasId.value = ''
    canvasList.value = []
    currentCanvas.value = null
    layers.value = []
    references.value = []
    crossCanvasLinks.value = []
    stats.value = null
    isLoading.value = false
    errorMessage.value = ''
    isInitialized.value = false
  }

  return {
    // State
    activeCanvasId,
    canvasList,
    currentCanvas,
    layers,
    references,
    crossCanvasLinks,
    stats,
    isLoading,
    errorMessage,
    isInitialized,
    // Getters
    activeCanvas,
    nodesLayer,
    backgroundLayer,
    handwritingLayer,
    annotationsLayer,
    visibleLayers,
    lockedLayers,
    isEditable,
    // Actions
    initializeCanvas,
    loadCanvasList,
    createCanvas,
    loadCanvas,
    updateCanvas,
    removeCanvas,
    switchCanvas,
    loadLayers,
    updateLayerConfig,
    addLayerConfig,
    removeLayerConfig,
    loadReferences,
    createCanvasRef,
    loadCrossCanvasLinks,
    createCrossCanvasLink,
    removeCrossCanvasLink,
    loadStats,
    updateCanvasNodesAndEdges,
    reset
  }
})
