/**
 * XMind 导出服务
 * 将思维导图导出为 XMind 格式（.xmind）
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/**
 * XMind 工作簿结构
 */
interface XMindWorkbook {
  rootTopic: XMindTopic
  sheet: {
    id: string
    title: string
    rootTopic: XMindTopic
  }
  relationships: XMindRelationship[]
}

/**
 * XMind 主题结构
 */
interface XMindTopic {
  id: string
  title: string
  label?: string
  note?: string
  markers?: string[]
  labels?: string[]
  href?: string
  children?: {
    attached?: XMindTopic[]
    detached?: XMindTopic[]
  }
  boundaries?: XMindBoundary[]
  summaries?: XMindSummary[]
}

/**
 * XMind 关联关系
 */
interface XMindRelationship {
  id: string
  title?: string
  categoryId?: string
  from: string
  to: string
}

/**
 * XMind 边界
 */
interface XMindBoundary {
  id: string
  title: string
  range: string[]
}

/**
 * XMind 概要
 */
interface XMindSummary {
  id: string
  title: string
  range: string[]
}

/**
 * 将思维导图节点转换为 XMind 格式
 * @param rootNode 根节点
 * @param allNodes 所有节点列表
 * @param allEdges 所有连线列表
 * @returns XMind 工作簿对象
 */
export function convertToXMind(
  rootNode: FreeMindMapNode,
  allNodes: FreeMindMapNode[],
  allEdges: FreeMindMapEdge[],
): XMindWorkbook {
  // 构建节点映射
  const nodeMap = new Map<string, FreeMindMapNode>()
  allNodes.forEach((node) => nodeMap.set(node.id, node))

  // 递归转换节点
  function convertTopic(node: FreeMindMapNode): XMindTopic {
    const topic: XMindTopic = {
      id: node.id,
      title: node.data.title || '无标题',
      label: node.data.subMapSummary,
      note: node.data.content || undefined,
      markers: [],
      labels: node.data.color ? [node.data.color] : undefined,
    }

    // 查找子节点（通过 parentId 或连线关系）
    const childNodes = allNodes.filter((n) =>
      n.data.parentId === node.id
      || allEdges.some((e) => e.source === node.id && e.target === n.id),
    )

    if (childNodes.length > 0) {
      topic.children = {
        attached: childNodes.map((child) => convertTopic(child)),
      }
    }

    return topic
  }

  // 转换关联关系
  const relationships: XMindRelationship[] = allEdges
    .filter((edge) => edge.type === 'default' || edge.animated)
    .map((edge, index) => ({
      id: `rel_${index}`,
      title: edge.style?.strokeWidth?.toString(),
      from: edge.source,
      to: edge.target,
    }))

  // 创建根主题
  const rootTopic = convertTopic(rootNode)

  return {
    rootTopic,
    sheet: {
      id: `sheet_${Date.now()}`,
      title: rootNode.data.title || '思维导图',
      rootTopic,
    },
    relationships,
  }
}

/**
 * 生成 XMind JSON 字符串
 * @param workbook XMind 工作簿对象
 * @returns JSON 字符串
 */
export function generateXMindJSON(workbook: XMindWorkbook): string {
  return JSON.stringify(workbook, null, 2)
}

/**
 * 导出思维导图为 XMind 文件
 * @param rootNode 根节点
 * @param allNodes 所有节点
 * @param allEdges 所有连线
 * @param filename 文件名（不含扩展名）
 * @returns Blob 对象
 */
export function exportAsXMind(
  rootNode: FreeMindMapNode,
  allNodes: FreeMindMapNode[],
  allEdges: FreeMindMapEdge[],
  _filename: string = 'mindmap',
): Blob {
  const workbook = convertToXMind(rootNode, allNodes, allEdges)
  const jsonContent = generateXMindJSON(workbook)

  // 创建 Blob
  const blob = new Blob([jsonContent], { type: 'application/json' })

  return blob
}

/**
 * 下载 XMind 文件
 * @param blob 文件 Blob
 * @param filename 文件名
 */
export function downloadXMind(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xmind`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
