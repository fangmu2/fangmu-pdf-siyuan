/**
 * useMindMap Composable
 * 思维导图操作逻辑封装
 * 遵循 .clinerules.md 规范
 */

import type {
  Ref,
} from 'vue'
import type { PDFAnnotation } from '../types/annotation'
import type {
  MindMap,
  MindMapLayout,
  MindMapTheme,
} from '../types/mindmap'
import {
  onMounted,
  ref,
} from 'vue'
import { mindmapEnhanceService } from '../services/mindmapEnhanceService'
import { mindmapService } from '../services/mindmapService'

/**
 * useMindMap 参数接口
 */
export interface UseMindMapOptions {
  /** 学习集 ID */
  studySetId?: string
  /** 初始脑图 ID */
  initialMindMapId?: string
  /** 是否启用自动加载 */
  autoLoad?: boolean
}

/**
 * useMindMap 返回值接口
 */
export interface UseMindMapReturn {
  // 状态
  mindMaps: Ref<MindMap[]>
  currentMindMap: Ref<MindMap | null>
  currentMindMapId: Ref<string | undefined>
  loading: Ref<boolean>
  error: Ref<string | null>

  // 脑图操作
  createMindMap: (title?: string, layout?: MindMapLayout) => Promise<MindMap | null>
  deleteMindMap: (mindMapId: string) => Promise<void>
  selectMindMap: (mindMapId: string) => void

  // 节点操作
  addNode: (parentNodeId: string, nodeText: string, position?: 'before' | 'after' | 'child') => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  updateNodeText: (nodeId: string, newText: string) => Promise<void>
  toggleNodeExpanded: (nodeId: string) => Promise<void>
  addNodeCard: (nodeId: string, cardId: string) => Promise<void>
  removeNodeCard: (nodeId: string, cardId: string) => Promise<void>

  // 布局操作
  changeLayout: (layout: MindMapLayout) => Promise<void>
  changeTheme: (theme: MindMapTheme) => Promise<void>

  // 从标注生成
  generateFromAnnotations: (annotations: PDFAnnotation[], rootTitle?: string) => Promise<MindMap | null>

  // 导出
  exportToMarkdown: () => string | null
  exportToOpml: () => string | null

  // 统计
  getNodeCount: () => number

  // 刷新
  refresh: () => Promise<void>
}

/**
 * 思维导图 Composable
 * @param options - 配置选项
 * @returns 思维导图操作相关的方法和状态
 */
export function useMindMap(options: UseMindMapOptions = {}): UseMindMapReturn {
  const {
    studySetId,
    initialMindMapId,
    autoLoad = true,
  } = options

  // 状态
  const mindMaps = ref<MindMap[]>([])
  const currentMindMap = ref<MindMap | null>(null)
  const currentMindMapId = ref<string | undefined>(initialMindMapId)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * 加载脑图列表
   */
  async function loadMindMaps(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      if (studySetId) {
        // 从服务层获取脑图列表
        const maps = await mindmapEnhanceService.getAllMindMaps(studySetId)
        mindMaps.value = maps

        // 如果指定了初始脑图 ID，尝试选中它
        if (initialMindMapId) {
          const found = maps.find((m) => m.id === initialMindMapId)
          if (found) {
            currentMindMap.value = found
            currentMindMapId.value = found.id
          }
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载脑图失败'
      console.error('[useMindMap] 加载脑图失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建脑图
   */
  async function createMindMap(title?: string, layout?: MindMapLayout): Promise<MindMap | null> {
    loading.value = true
    try {
      const newMindMap = mindmapService.createMindMap({
        studySetId,
        title,
        layout,
      })

      // 保存到思源
      // 这里需要调用思源的创建块 API
      // const block = await createBlock({ ... });

      mindMaps.value.push(newMindMap)
      currentMindMap.value = newMindMap
      currentMindMapId.value = newMindMap.id

      return newMindMap
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建脑图失败'
      console.error('[useMindMap] 创建脑图失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除脑图
   */
  async function deleteMindMap(mindMapId: string): Promise<void> {
    loading.value = true
    try {
      // 调用思源的删除块 API
      // await deleteBlock({ id: mindMapId });

      mindMaps.value = mindMaps.value.filter((m) => m.id !== mindMapId)
      if (currentMindMapId.value === mindMapId) {
        currentMindMapId.value = undefined
        currentMindMap.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除脑图失败'
      console.error('[useMindMap] 删除脑图失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择脑图
   */
  function selectMindMap(mindMapId: string): void {
    currentMindMapId.value = mindMapId
    currentMindMap.value = mindMaps.value.find((m) => m.id === mindMapId) || null
  }

  /**
   * 添加节点
   */
  async function addNode(
    parentNodeId: string,
    nodeText: string,
    position: 'before' | 'after' | 'child' = 'child',
  ): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    loading.value = true
    try {
      const updatedMap = mindmapService.addNode(
        currentMindMap.value,
        parentNodeId,
        nodeText,
        position,
      )

      // 保存到思源
      // await updateBlockAttrs({ id: currentMindMap.value.id, attrs: { ... } });

      currentMindMap.value = updatedMap

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = updatedMap
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加节点失败'
      console.error('[useMindMap] 添加节点失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除节点
   */
  async function deleteNode(nodeId: string): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    loading.value = true
    try {
      const updatedMap = mindmapService.deleteNode(currentMindMap.value, nodeId)

      // 保存到思源
      // await updateBlockAttrs({ id: currentMindMap.value.id, attrs: { ... } });

      currentMindMap.value = updatedMap

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = updatedMap
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除节点失败'
      console.error('[useMindMap] 删除节点失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新节点文本
   */
  async function updateNodeText(nodeId: string, newText: string): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    loading.value = true
    try {
      const updatedMap = mindmapService.updateNodeText(
        currentMindMap.value,
        nodeId,
        newText,
      )

      // 保存到思源
      // await updateBlockAttrs({ id: currentMindMap.value.id, attrs: { ... } });

      currentMindMap.value = updatedMap

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = updatedMap
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新节点失败'
      console.error('[useMindMap] 更新节点失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换节点展开/折叠状态
   */
  async function toggleNodeExpanded(nodeId: string): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    try {
      const updatedMap = mindmapService.toggleNodeExpanded(currentMindMap.value, nodeId)
      currentMindMap.value = updatedMap

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = updatedMap
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '切换节点状态失败'
      console.error('[useMindMap] 切换节点状态失败:', e)
      throw e
    }
  }

  /**
   * 为节点添加关联卡片
   */
  async function addNodeCard(nodeId: string, cardId: string): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    try {
      await mindmapEnhanceService.addNodeCard(currentMindMap.value.id, nodeId, cardId)

      // 重新加载脑图数据以获取最新的卡片关联
      await loadMindMaps()
      selectMindMap(currentMindMapId.value!)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加关联卡片失败'
      console.error('[useMindMap] 添加关联卡片失败:', e)
      throw e
    }
  }

  /**
   * 移除节点关联的卡片
   */
  async function removeNodeCard(nodeId: string, cardId: string): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    try {
      await mindmapEnhanceService.removeNodeCard(currentMindMap.value.id, nodeId, cardId)

      // 重新加载脑图数据
      await loadMindMaps()
      selectMindMap(currentMindMapId.value!)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '移除关联卡片失败'
      console.error('[useMindMap] 移除关联卡片失败:', e)
      throw e
    }
  }

  /**
   * 切换脑图布局
   */
  async function changeLayout(layout: MindMapLayout): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    loading.value = true
    try {
      currentMindMap.value.layout = layout

      // 保存到思源
      // await updateBlockAttrs({ id: currentMindMap.value.id, attrs: { ... } });

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = { ...currentMindMap.value }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '切换布局失败'
      console.error('[useMindMap] 切换布局失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换脑图主题
   */
  async function changeTheme(theme: MindMapTheme): Promise<void> {
    if (!currentMindMap.value) {
      throw new Error('未选择脑图')
    }

    loading.value = true
    try {
      currentMindMap.value.theme = theme

      // 保存到思源
      // await updateBlockAttrs({ id: currentMindMap.value.id, attrs: { ... } });

      // 更新列表中的脑图
      const index = mindMaps.value.findIndex((m) => m.id === currentMindMapId.value)
      if (index !== -1) {
        mindMaps.value[index] = { ...currentMindMap.value }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '切换主题失败'
      console.error('[useMindMap] 切换主题失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 从标注生成脑图
   */
  async function generateFromAnnotations(
    annotations: PDFAnnotation[],
    rootTitle?: string,
  ): Promise<MindMap | null> {
    loading.value = true
    try {
      const rootNode = mindmapService.createNodesFromAnnotations(annotations, rootTitle)

      const newMindMap: MindMap = {
        id: `mindmap-${Date.now()}`,
        studySetId,
        title: rootTitle || '思维导图',
        root: rootNode,
        layout: 'mindmap',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // 保存到思源
      // await createBlock({ ... });

      mindMaps.value.push(newMindMap)
      currentMindMap.value = newMindMap
      currentMindMapId.value = newMindMap.id

      return newMindMap
    } catch (e) {
      error.value = e instanceof Error ? e.message : '生成脑图失败'
      console.error('[useMindMap] 生成脑图失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出为 Markdown
   */
  function exportToMarkdown(): string | null {
    if (!currentMindMap.value?.root) {
      return null
    }
    return mindmapService.exportToMarkdown(currentMindMap.value.root)
  }

  /**
   * 导出为 OPML
   */
  function exportToOpml(): string | null {
    if (!currentMindMap.value) {
      return null
    }
    return mindmapService.exportToOpml(currentMindMap.value)
  }

  /**
   * 获取节点数量
   */
  function getNodeCount(): number {
    if (!currentMindMap.value?.root) {
      return 0
    }
    return mindmapService.countNodes(currentMindMap.value.root)
  }

  /**
   * 刷新脑图列表
   */
  async function refresh(): Promise<void> {
    await loadMindMaps()
    if (currentMindMapId.value) {
      selectMindMap(currentMindMapId.value)
    }
  }

  // 自动加载
  if (autoLoad) {
    onMounted(() => {
      loadMindMaps()
    })
  }

  return {
    // 状态
    mindMaps,
    currentMindMap,
    currentMindMapId,
    loading,
    error,

    // 脑图操作
    createMindMap,
    deleteMindMap,
    selectMindMap,

    // 节点操作
    addNode,
    deleteNode,
    updateNodeText,
    toggleNodeExpanded,
    addNodeCard,
    removeNodeCard,

    // 布局操作
    changeLayout,
    changeTheme,

    // 从标注生成
    generateFromAnnotations,

    // 导出
    exportToMarkdown,
    exportToOpml,

    // 统计
    getNodeCount,

    // 刷新
    refresh,
  }
}

export default useMindMap
