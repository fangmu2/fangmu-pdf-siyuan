/**
 * 思维导图链接图谱增强组合式函数
 * @fileoverview 提供跨分支关联、远程知识联系、一键跳转等功能的 Vue 3 组合式 API
 */

import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
  CrossBranchLink,
  RemoteKnowledgeLink,
  NodeLinkRelation,
  ViewportFocusConfig,
  LayoutSuggestion,
  FreeMindMapNode,
  FreeMindMapEdge
} from '@/types/mindmapFree'
import {
  createCrossBranchLink as createCrossBranchLinkService,
  getCrossBranchLinks as getCrossBranchLinksService,
  deleteCrossBranchLink as deleteCrossBranchLinkService,
  createRemoteKnowledgeLink as createRemoteKnowledgeLinkService,
  getRemoteKnowledgeLinks as getRemoteKnowledgeLinksService,
  deleteRemoteKnowledgeLink as deleteRemoteKnowledgeLinkService,
  analyzeNodeLinks,
  createViewportFocusConfig,
  getNodePosition,
  generateLayoutSuggestions,
  crossLinkToVueFlowEdge,
  remoteLinkToVueFlowEdge
} from '@/services/mindmapLinkEnhanceService'

export interface UseMindMapLinkEnhanceOptions {
  /** 思维导图块 ID */
  mindMapBlockId: Ref<string>
  /** 节点列表引用 */
  nodes: Ref<FreeMindMapNode[]>
  /** 连线列表引用 */
  edges: Ref<FreeMindMapEdge[]>
  /** 是否启用链接图谱增强 */
  enabled?: boolean
}

export interface UseMindMapLinkEnhanceReturn {
  // 跨分支关联
  crossLinks: Ref<CrossBranchLink[]>
  loadingCrossLinks: Ref<boolean>
  createCrossBranchLink: (
    sourceNodeId: string,
    targetNodeId: string,
    linkType?: CrossBranchLink['linkType'],
    label?: string
  ) => Promise<CrossBranchLink | null>
  deleteCrossBranchLink: (linkId: string) => Promise<boolean>
  getCrossLinkEdge: (link: CrossBranchLink) => Partial<FreeMindMapEdge>

  // 远程知识联系
  remoteLinks: Ref<RemoteKnowledgeLink[]>
  loadingRemoteLinks: Ref<boolean>
  createRemoteKnowledgeLink: (
    sourceNodeId: string,
    targetId: string,
    targetType: RemoteKnowledgeLink['targetType'],
    linkType?: RemoteKnowledgeLink['linkType'],
    description?: string
  ) => Promise<RemoteKnowledgeLink | null>
  deleteRemoteKnowledgeLink: (linkId: string) => Promise<boolean>
  getRemoteLinkEdge: (link: RemoteKnowledgeLink) => Partial<FreeMindMapEdge>

  // 节点链接分析
  getNodeLinks: (nodeId: string) => NodeLinkRelation
  allNodeLinks: ComputedRef<Map<string, NodeLinkRelation>>

  // 一键跳转
  focusOnNode: (
    nodeId: string,
    zoom?: number,
    highlight?: boolean,
    highlightColor?: string
  ) => void
  viewportConfig: Ref<ViewportFocusConfig | null>

  // 智能布局建议
  layoutSuggestions: Ref<LayoutSuggestion[]>
  refreshLayoutSuggestions: () => void
  applySuggestion: (suggestion: LayoutSuggestion) => { nodeId: string; x: number; y: number }[]

  // 刷新数据
  refreshAll: () => Promise<void>
}

/**
 * 思维导图链接图谱增强组合式函数
 */
export function useMindMapLinkEnhance(
  options: UseMindMapLinkEnhanceOptions
): UseMindMapLinkEnhanceReturn {
  const {
    mindMapBlockId,
    nodes,
    edges,
    enabled = true
  } = options

  // ==================== 跨分支关联 ====================

  const crossLinks = ref<CrossBranchLink[]>([])
  const loadingCrossLinks = ref(false)

  /**
   * 加载跨分支关联
   */
  async function loadCrossLinks(): Promise<void> {
    if (!enabled || !mindMapBlockId.value) return

    loadingCrossLinks.value = true
    try {
      crossLinks.value = await getCrossBranchLinksService(mindMapBlockId.value)
    } catch (error) {
      console.error('[useMindMapLinkEnhance] 加载跨分支关联失败:', error)
      crossLinks.value = []
    } finally {
      loadingCrossLinks.value = false
    }
  }

  /**
   * 创建跨分支关联
   */
  async function createCrossBranchLink(
    sourceNodeId: string,
    targetNodeId: string,
    linkType: CrossBranchLink['linkType'] = 'relation',
    label?: string
  ): Promise<CrossBranchLink | null> {
    if (!enabled || !mindMapBlockId.value) return null

    const result = await createCrossBranchLinkService(
      mindMapBlockId.value,
      sourceNodeId,
      targetNodeId,
      linkType,
      label
    )

    if (result) {
      crossLinks.value.push(result)
    }

    return result
  }

  /**
   * 删除跨分支关联
   */
  async function deleteCrossBranchLink(linkId: string): Promise<boolean> {
    if (!enabled || !mindMapBlockId.value) return false

    const success = await deleteCrossBranchLinkService(mindMapBlockId.value, linkId)
    if (success) {
      crossLinks.value = crossLinks.value.filter(l => l.id !== linkId)
    }
    return success
  }

  /**
   * 获取跨分支关联的 Vue Flow 连线配置
   */
  function getCrossLinkEdge(link: CrossBranchLink): Partial<FreeMindMapEdge> {
    return crossLinkToVueFlowEdge(link)
  }

  // ==================== 远程知识联系 ====================

  const remoteLinks = ref<RemoteKnowledgeLink[]>([])
  const loadingRemoteLinks = ref(false)

  /**
   * 加载远程知识联系
   */
  async function loadRemoteLinks(): Promise<void> {
    if (!enabled || !mindMapBlockId.value) return

    loadingRemoteLinks.value = true
    try {
      remoteLinks.value = await getRemoteKnowledgeLinksService(mindMapBlockId.value)
    } catch (error) {
      console.error('[useMindMapLinkEnhance] 加载远程知识联系失败:', error)
      remoteLinks.value = []
    } finally {
      loadingRemoteLinks.value = false
    }
  }

  /**
   * 创建远程知识联系
   */
  async function createRemoteKnowledgeLink(
    sourceNodeId: string,
    targetId: string,
    targetType: RemoteKnowledgeLink['targetType'],
    linkType: RemoteKnowledgeLink['linkType'] = 'relation',
    description?: string
  ): Promise<RemoteKnowledgeLink | null> {
    if (!enabled || !mindMapBlockId.value) return null

    const result = await createRemoteKnowledgeLinkService(
      mindMapBlockId.value,
      sourceNodeId,
      targetId,
      targetType,
      linkType,
      description
    )

    if (result) {
      remoteLinks.value.push(result)
    }

    return result
  }

  /**
   * 删除远程知识联系
   */
  async function deleteRemoteKnowledgeLink(linkId: string): Promise<boolean> {
    if (!enabled || !mindMapBlockId.value) return false

    const success = await deleteRemoteKnowledgeLinkService(mindMapBlockId.value, linkId)
    if (success) {
      remoteLinks.value = remoteLinks.value.filter(l => l.id !== linkId)
    }
    return success
  }

  /**
   * 获取远程知识联系的 Vue Flow 连线配置
   */
  function getRemoteLinkEdge(link: RemoteKnowledgeLink): Partial<FreeMindMapEdge> {
    return remoteLinkToVueFlowEdge(link)
  }

  // ==================== 节点链接分析 ====================

  /**
   * 获取节点的链接关系
   */
  function getNodeLinks(nodeId: string): NodeLinkRelation {
    return analyzeNodeLinks(nodeId, nodes.value, edges.value, crossLinks.value, remoteLinks.value)
  }

  /**
   * 所有节点的链接关系映射
   */
  const allNodeLinks = computed(() => {
    const map = new Map<string, NodeLinkRelation>()
    nodes.value.forEach(node => {
      map.set(node.id, getNodeLinks(node.id))
    })
    return map
  })

  // ==================== 一键跳转 ====================

  const viewportConfig = ref<ViewportFocusConfig | null>(null)

  /**
   * 聚焦到节点
   */
  function focusOnNode(
    nodeId: string,
    zoom?: number,
    highlight: boolean = true,
    highlightColor?: string
  ): void {
    const config = createViewportFocusConfig(nodeId, zoom, highlight, highlightColor)
    viewportConfig.value = config

    // 触发自定义事件，由组件处理视图定位
    const event = new CustomEvent('mindmap-focus-node', {
      detail: config
    })
    window.dispatchEvent(event)
  }

  // ==================== 智能布局建议 ====================

  const layoutSuggestions = ref<LayoutSuggestion[]>([])

  /**
   * 刷新布局建议
   */
  function refreshLayoutSuggestions(): void {
    if (!enabled) return

    layoutSuggestions.value = generateLayoutSuggestions(nodes.value, edges.value)
  }

  /**
   * 应用布局建议
   */
  function applySuggestion(suggestion: LayoutSuggestion): { nodeId: string; x: number; y: number }[] {
    // 这里返回位置更新，实际由组件应用
    const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
    const updates: { nodeId: string; x: number; y: number }[] = []

    const { layoutConfig } = suggestion
    const spacing = 150
    const verticalSpacing = 100

    if (suggestion.type === 'cluster' && layoutConfig.groups) {
      let startX = 0
      for (const group of layoutConfig.groups) {
        const groupNodes = group.nodeIds.map(id => nodeMap.get(id)).filter(Boolean) as FreeMindMapNode[]
        if (groupNodes.length === 0) continue

        groupNodes.forEach((node, index) => {
          updates.push({
            nodeId: node.id,
            x: startX + (index % 5) * spacing,
            y: Math.floor(index / 5) * verticalSpacing
          })
        })

        startX += Math.ceil(group.nodeIds.length / 5) * spacing + 100
      }
    }

    return updates
  }

  // ==================== 刷新所有数据 ====================

  async function refreshAll(): Promise<void> {
    await Promise.all([
      loadCrossLinks(),
      loadRemoteLinks()
    ])
    refreshLayoutSuggestions()
  }

  // ==================== 生命周期 ====================

  onMounted(() => {
    if (enabled) {
      refreshAll()
    }
  })

  // 监听思维导图块 ID 变化
  watch(mindMapBlockId, () => {
    if (enabled) {
      refreshAll()
    }
  })

  // 监听节点/连线变化，更新布局建议
  watch([nodes, edges], () => {
    if (enabled) {
      refreshLayoutSuggestions()
    }
  }, { deep: true })

  // ==================== 返回 ====================

  return {
    // 跨分支关联
    crossLinks,
    loadingCrossLinks,
    createCrossBranchLink,
    deleteCrossBranchLink,
    getCrossLinkEdge,

    // 远程知识联系
    remoteLinks,
    loadingRemoteLinks,
    createRemoteKnowledgeLink,
    deleteRemoteKnowledgeLink,
    getRemoteLinkEdge,

    // 节点链接分析
    getNodeLinks,
    allNodeLinks,

    // 一键跳转
    focusOnNode,
    viewportConfig,

    // 智能布局建议
    layoutSuggestions,
    refreshLayoutSuggestions,
    applySuggestion,

    // 刷新数据
    refreshAll
  }
}

export default useMindMapLinkEnhance
