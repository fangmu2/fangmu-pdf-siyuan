/**
 * 虚拟渲染组合式函数
 * 提供基于视口的节点过滤功能，优化大画布性能
 * @fileoverview 仅渲染可见区域内的节点，提升性能
 */

import type {
  ComputedRef,
  Ref,
} from 'vue'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import {
  computed,

  ref,

} from 'vue'

/**
 * 视口接口
 */
export interface Viewport {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 虚拟渲染配置
 */
export interface VirtualRenderingConfig {
  /** 渲染缓冲区大小（像素） */
  bufferSize?: number
  /** 是否启用虚拟渲染 */
  enabled?: boolean
  /** 最小节点数量阈值（少于这个数量时禁用虚拟渲染） */
  minNodeThreshold?: number
}

/**
 * 虚拟渲染返回值
 */
export interface UseVirtualRenderingReturn {
  // 状态
  viewport: Ref<Viewport>
  enabled: Ref<boolean>

  // 计算属性
  visibleNodes: ComputedRef<FreeMindMapNode[]>
  visibleNodeIds: ComputedRef<Set<string>>

  // 方法
  updateViewport: (newViewport: Viewport) => void
  updateViewportSize: (width: number, height: number) => void
  isNodeVisible: (node: FreeMindMapNode) => boolean
  setEnabled: (value: boolean) => void
  getNodeBuffer: (nodeId: string) => FreeMindMapNode | null
}

/**
 * 虚拟渲染组合式函数
 * @param nodesRef 节点列表引用
 * @param config 配置选项
 */
export function useVirtualRendering(
  nodesRef: Ref<FreeMindMapNode[]>,
  config: VirtualRenderingConfig = {},
): UseVirtualRenderingReturn {
  const {
    bufferSize = 100, // 渲染缓冲区
    enabled = true,
    minNodeThreshold = 50, // 少于 50 个节点时不启用虚拟渲染
  } = config

  /** 视口状态 */
  const viewport = ref<Viewport>({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  })

  /** 是否启用虚拟渲染 */
  const enabledRef = ref(enabled)

  /**
   * 计算可见节点（带缓冲区）
   */
  const visibleNodes = computed(() => {
    const allNodes = nodesRef.value

    // 节点数量少于阈值时，返回所有节点
    if (!enabledRef.value || allNodes.length < minNodeThreshold) {
      return allNodes
    }

    const padding = bufferSize

    return allNodes.filter((node) => {
      const nodeWidth = node.style?.width ? Number.parseFloat(node.style.width as string) : 200
      const nodeHeight = node.style?.height ? Number.parseFloat(node.style.height as string) : 60

      // 判断节点是否在视口内（带缓冲）
      return (
        node.position.x + nodeWidth > viewport.value.x - padding
        && node.position.x < viewport.value.x + viewport.value.width + padding
        && node.position.y + nodeHeight > viewport.value.y - padding
        && node.position.y < viewport.value.y + viewport.value.height + padding
      )
    })
  })

  /**
   * 计算可见节点 ID 集合（用于快速查找）
   */
  const visibleNodeIds = computed(() => {
    const ids = new Set<string>()
    visibleNodes.value.forEach((node) => {
      ids.add(node.id)
    })
    return ids
  })

  /**
   * 更新视口
   */
  function updateViewport(newViewport: Viewport): void {
    viewport.value = { ...newViewport }
  }

  /**
   * 更新视口尺寸
   */
  function updateViewportSize(width: number, height: number): void {
    viewport.value.width = width
    viewport.value.height = height
  }

  /**
   * 判断节点是否可见
   */
  function isNodeVisible(node: FreeMindMapNode): boolean {
    const nodeWidth = node.style?.width ? Number.parseFloat(node.style.width as string) : 200
    const nodeHeight = node.style?.height ? Number.parseFloat(node.style.height as string) : 60

    const padding = bufferSize

    return (
      node.position.x + nodeWidth > viewport.value.x - padding
      && node.position.x < viewport.value.x + viewport.value.width + padding
      && node.position.y + nodeHeight > viewport.value.y - padding
      && node.position.y < viewport.value.y + viewport.value.height + padding
    )
  }

  /**
   * 设置是否启用虚拟渲染
   */
  function setEnabled(value: boolean): void {
    enabledRef.value = value
  }

  /**
   * 获取节点的缓冲区（用于预加载）
   */
  function getNodeBuffer(nodeId: string): FreeMindMapNode | null {
    const node = nodesRef.value.find((n) => n.id === nodeId) || null
    return node
  }

  return {
    // 状态
    viewport,
    enabled: enabledRef,

    // 计算属性
    visibleNodes,
    visibleNodeIds,

    // 方法
    updateViewport,
    updateViewportSize,
    isNodeVisible,
    setEnabled,
    getNodeBuffer,
  }
}
