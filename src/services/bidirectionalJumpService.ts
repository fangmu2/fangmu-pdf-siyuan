/**
 * PDF 与导图双向跳转增强服务
 * @fileoverview 实现点击导图节点高亮 PDF 对应区域，PDF 滚动时自动定位导图节点
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/**
 * PDF 区域高亮事件参数
 */
export interface HighlightPdfRegionParams {
  /** PDF 文件路径 */
  pdfPath: string
  /** PDF 页码 */
  page: number
  /** PDF 选区坐标 [x, y, width, height] */
  rect: [number, number, number, number]
  /** 高亮颜色（可选） */
  highlightColor?: string
  /** 持续时间（毫秒，可选） */
  duration?: number
}

/**
 * PDF 滚动位置
 */
export interface PdfScrollPosition {
  /** PDF 页码 */
  page: number
  /** 选区坐标（可选） */
  rect?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * 节点定位结果
 */
export interface NodeLocationResult {
  /** 是否找到节点 */
  found: boolean
  /** 节点 ID（找到时） */
  nodeId?: string
  /** 节点（找到时） */
  node?: FreeMindMapNode
  /** 匹配度（0-1） */
  matchScore?: number
  /** 关联的标注 ID */
  annotationId?: string
}

/**
 * 高亮 PDF 区域
 * @param node 思维导图节点
 * @returns 高亮参数，如果节点没有 PDF 关联则返回 null
 */
export function highlightPdfRegion(node: FreeMindMapNode): HighlightPdfRegionParams | null {
  // 从节点获取 PDF 位置信息
  if (node.data.annotationId) {
    // 需要从思源 API 获取标注详情
    // 这里返回参数供调用方使用
    const pdfPath = node.data.pdfPath
    const pdfPage = node.data.pdfPage ?? node.data.page
    const rect = node.data.rect

    if (pdfPath && pdfPage && rect) {
      return {
        pdfPath,
        page: pdfPage,
        rect,
        highlightColor: '#FFEB3B', // 默认黄色高亮
        duration: 2000, // 默认 2 秒
      }
    }
  }

  return null
}

/**
 * 根据 PDF 位置查找对应的思维导图节点
 * @param nodes 所有节点列表
 * @param position PDF 滚动位置
 * @returns 节点定位结果
 */
export function findNodeByPdfPosition(
  nodes: FreeMindMapNode[],
  position: PdfScrollPosition,
): NodeLocationResult {
  // 查找匹配页码的节点
  const pageNodes = nodes.filter(
    (n) => n.data.pdfPage === position.page || n.data.page === position.page,
  )

  if (pageNodes.length === 0) {
    return { found: false }
  }

  // 如果有精确的 rect 匹配
  if (position.rect) {
    const exactMatch = pageNodes.find((n) => {
      const nodeRect = n.data.rect
      if (!nodeRect) return false

      // 比较坐标（允许 10px 误差）
      const tolerance = 10
      return (
        Math.abs(nodeRect[0] - position.rect!.x) < tolerance
        && Math.abs(nodeRect[1] - position.rect!.y) < tolerance
      )
    })

    if (exactMatch) {
      return {
        found: true,
        nodeId: exactMatch.id,
        node: exactMatch,
        matchScore: 1.0,
        annotationId: exactMatch.data.annotationId,
      }
    }
  }

  // 没有精确匹配时，返回第一个页码匹配的节点
  const firstMatch = pageNodes[0]
  return {
    found: true,
    nodeId: firstMatch.id,
    node: firstMatch,
    matchScore: 0.8, // 页码匹配但不精确
    annotationId: firstMatch.data.annotationId,
  }
}

/**
 * 获取所有与 PDF 关联的节点
 * @param nodes 所有节点列表
 * @returns 与 PDF 关联的节点列表
 */
export function getPdfLinkedNodes(nodes: FreeMindMapNode[]): FreeMindMapNode[] {
  return nodes.filter(
    (n) => n.data.pdfPath && (n.data.pdfPage || n.data.page),
  )
}

/**
 * 按 PDF 页码分组节点
 * @param nodes 所有节点列表
 * @returns 按页码分组的节点 Map
 */
export function groupNodesByPdfPage(
  nodes: FreeMindMapNode[],
): Map<number, FreeMindMapNode[]> {
  const groups = new Map<number, FreeMindMapNode[]>()

  getPdfLinkedNodes(nodes).forEach((node) => {
    const page = node.data.pdfPage ?? node.data.page ?? 0
    if (!groups.has(page)) {
      groups.set(page, [])
    }
    groups.get(page)!.push(node)
  })

  return groups
}

/**
 * 滚动到思维导图节点
 * @param nodeId 节点 ID
 * @param options 滚动选项
 */
export function scrollToNode(
  nodeId: string,
  options: {
    /** 是否平滑滚动 */
    smooth?: boolean
    /** 缩放级别 */
    zoom?: number
    /** 高亮显示 */
    highlight?: boolean
    /** 高亮颜色 */
    highlightColor?: string
  } = {},
): void {
  // 发射自定义事件，由画布组件监听处理
  const event = new CustomEvent('scroll-to-node', {
    detail: {
      nodeId,
      smooth: options.smooth ?? true,
      zoom: options.zoom,
      highlight: options.highlight ?? true,
      highlightColor: options.highlightColor ?? '#409EFF',
    },
  })

  window.dispatchEvent(event)
}

/**
 * 高亮思维导图节点
 * @param nodeId 节点 ID
 * @param options 高亮选项
 */
export function highlightNode(
  nodeId: string,
  options: {
    /** 高亮颜色 */
    color?: string
    /** 持续时间（毫秒） */
    duration?: number
    /** 是否闪烁效果 */
    blink?: boolean
  } = {},
): void {
  const event = new CustomEvent('highlight-node', {
    detail: {
      nodeId,
      color: options.color ?? '#409EFF',
      duration: options.duration ?? 2000,
      blink: options.blink ?? false,
    },
  })

  window.dispatchEvent(event)
}

/**
 * PDF 滚动时自动定位节点
 * @param nodes 所有节点列表
 * @param scrollPosition PDF 滚动位置
 * @param options 定位选项
 * @returns 定位结果
 */
export function autoLocateNodeByPdfScroll(
  nodes: FreeMindMapNode[],
  scrollPosition: PdfScrollPosition,
  options: {
    /** 是否自动滚动到节点 */
    autoScroll?: boolean
    /** 是否高亮节点 */
    autoHighlight?: boolean
    /** 最小匹配度（0-1） */
    minMatchScore?: number
  } = {},
): NodeLocationResult {
  const result = findNodeByPdfPosition(nodes, scrollPosition)

  if (result.found && result.nodeId) {
    // 检查匹配度
    if ((result.matchScore ?? 0) >= (options.minMatchScore ?? 0.8)) {
      // 自动滚动到节点
      if (options.autoScroll ?? true) {
        scrollToNode(result.nodeId, {
          smooth: true,
          highlight: options.autoHighlight ?? true,
        })
      }

      // 高亮节点
      if (options.autoHighlight ?? true) {
        highlightNode(result.nodeId, {
          duration: 2000,
        })
      }
    }
  }

  return result
}

/**
 * 从 PDF 标注获取节点信息
 * @param annotation 标注数据
 * @returns 思维导图节点数据片段
 */
export function createNodeFromAnnotation(annotation: {
  id: string
  pdfPath: string
  page: number
  rect?: [number, number, number, number]
  text?: string
  color?: string
}): Partial<FreeMindMapNode['data']> {
  return {
    annotationId: annotation.id,
    pdfPath: annotation.pdfPath,
    pdfPage: annotation.page,
    rect: annotation.rect,
    title: annotation.text?.substring(0, 50) || 'PDF 摘录',
    color: annotation.color,
  }
}

/**
 * 批量高亮多个节点对应的 PDF 区域
 * @param nodes 节点列表
 * @param options 批量高亮选项
 */
export function batchHighlightPdfRegions(
  nodes: FreeMindMapNode[],
  options: {
    /** 高亮颜色 */
    highlightColor?: string
    /** 每个高亮的间隔时间（毫秒） */
    interval?: number
    /** 持续时间（毫秒） */
    duration?: number
  } = {},
): void {
  const highlightParams: HighlightPdfRegionParams[] = []

  nodes.forEach((node) => {
    const params = highlightPdfRegion(node)
    if (params) {
      highlightParams.push({
        ...params,
        highlightColor: options.highlightColor ?? params.highlightColor,
        duration: options.duration ?? params.duration,
      })
    }
  })

  // 依次触发高亮
  highlightParams.forEach((params, index) => {
    setTimeout(() => {
      const event = new CustomEvent('batch-highlight-pdf', {
        detail: params,
      })
      window.dispatchEvent(event)
    }, index * (options.interval ?? 500))
  })
}

/**
 * 清除所有 PDF 高亮
 */
export function clearPdfHighlights(): void {
  const event = new CustomEvent('clear-pdf-highlights')
  window.dispatchEvent(event)
}

/**
 * 清除所有节点高亮
 */
export function clearNodeHighlights(): void {
  const event = new CustomEvent('clear-node-highlights')
  window.dispatchEvent(event)
}

/**
 * 监听 PDF 滚动事件
 * @param callback 回调函数
 * @returns 取消监听函数
 */
export function onPdfScroll(
  callback: (position: PdfScrollPosition) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail as PdfScrollPosition
    callback(detail)
  }

  window.addEventListener('pdf-scroll', handler)

  return () => {
    window.removeEventListener('pdf-scroll', handler)
  }
}

/**
 * 监听节点点击事件
 * @param callback 回调函数
 * @returns 取消监听函数
 */
export function onNodeClick(
  callback: (node: FreeMindMapNode) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail as FreeMindMapNode
    callback(detail)
  }

  window.addEventListener('mindmap-node-click', handler)

  return () => {
    window.removeEventListener('mindmap-node-click', handler)
  }
}

/**
 * 设置双向联动
 * @param nodes 节点列表
 * @param options 联动选项
 */
export function setupBidirectionalLinkage(
  nodes: FreeMindMapNode[],
  options: {
    /** 是否启用节点点击高亮 PDF */
    enableNodeToPdf?: boolean
    /** 是否启用 PDF 滚动定位节点 */
    enablePdfToNode?: boolean
    /** PDF 滚动定位延迟（毫秒） */
    pdfScrollDelay?: number
  } = {},
): () => void {
  const cleanupFunctions: Array<() => void> = []

  // 节点点击 -> 高亮 PDF
  if (options.enableNodeToPdf ?? true) {
    const onNodeClickCleanup = onNodeClick((node) => {
      const params = highlightPdfRegion(node)
      if (params) {
        const event = new CustomEvent('highlight-pdf-region', {
          detail: params,
        })
        window.dispatchEvent(event)
      }
    })
    cleanupFunctions.push(onNodeClickCleanup)
  }

  // PDF 滚动 -> 定位节点
  if (options.enablePdfToNode ?? true) {
    const onPdfScrollCleanup = onPdfScroll((position) => {
      setTimeout(() => {
        autoLocateNodeByPdfScroll(nodes, position, {
          autoScroll: true,
          autoHighlight: true,
          minMatchScore: 0.8,
        })
      }, options.pdfScrollDelay ?? 300)
    })
    cleanupFunctions.push(onPdfScrollCleanup)
  }

  // 返回清理函数
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup())
  }
}

/**
 * 双向跳转服务版本
 */
export const BIDIRECTIONAL_JUMP_VERSION = '1.0.0'
