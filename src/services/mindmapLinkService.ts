/**
 * 脑图连线服务
 * MarginNote 4 风格学习插件 - 脑图连线和自由节点管理
 */

import {
  calculateLinkPath,
  createEnhancedNode,
  createMindMapLink,
  EnhancedMindMapData,
  EnhancedMindMapNode,
  getNodeCanvasPosition,
  MINDMAP_THEMES,
  MindMapLink,
  MindMapLinkType,
  MindMapNodeType,
} from '@/types/mindmapEnhanced'

/**
 * 脑图连线服务类
 */
class MindMapLinkService {
  /**
   * 添加连线
   */
  addLink(
    mindMap: EnhancedMindMapData,
    sourceId: string,
    targetId: string,
    type: MindMapLinkType = MindMapLinkType.DEFAULT,
    label?: string,
  ): MindMapLink {
    if (sourceId === targetId) {
      throw new Error('不能创建指向自身的连线')
    }

    // 检查是否已存在相同连线
    const existingLink = mindMap.links.find(
      (link) => link.sourceId === sourceId && link.targetId === targetId,
    )
    if (existingLink) {
      throw new Error('该连线已存在')
    }

    const link = createMindMapLink(sourceId, targetId, type, label)
    mindMap.links.push(link)

    // 更新节点的关联列表
    const sourceNode = mindMap.nodes[sourceId]
    const targetNode = mindMap.nodes[targetId]

    if (sourceNode && !sourceNode.linkedNodeIds.includes(targetId)) {
      sourceNode.linkedNodeIds.push(targetId)
      sourceNode.updatedAt = Date.now()
    }

    if (targetNode && !targetNode.linkedNodeIds.includes(sourceId)) {
      targetNode.linkedNodeIds.push(sourceId)
      targetNode.updatedAt = Date.now()
    }

    mindMap.updatedAt = Date.now()
    return link
  }

  /**
   * 移除连线
   */
  removeLink(mindMap: EnhancedMindMapData, linkId: string): boolean {
    const linkIndex = mindMap.links.findIndex((link) => link.id === linkId)
    if (linkIndex === -1) {
      return false
    }

    const link = mindMap.links[linkIndex]

    // 从节点的关联列表中移除
    const sourceNode = mindMap.nodes[link.sourceId]
    const targetNode = mindMap.nodes[link.targetId]

    if (sourceNode) {
      sourceNode.linkedNodeIds = sourceNode.linkedNodeIds.filter((id) => id !== link.targetId)
      sourceNode.updatedAt = Date.now()
    }

    if (targetNode) {
      targetNode.linkedNodeIds = targetNode.linkedNodeIds.filter((id) => id !== link.sourceId)
      targetNode.updatedAt = Date.now()
    }

    // 删除连线
    mindMap.links.splice(linkIndex, 1)
    mindMap.updatedAt = Date.now()

    return true
  }

  /**
   * 更新连线
   */
  updateLink(
    mindMap: EnhancedMindMapData,
    linkId: string,
    updates: Partial<MindMapLink>,
  ): MindMapLink | null {
    const link = mindMap.links.find((l) => l.id === linkId)
    if (!link) {
      return null
    }

    Object.assign(link, updates, { updatedAt: Date.now() })
    mindMap.updatedAt = Date.now()

    return link
  }

  /**
   * 获取节点的所有连线
   */
  getNodeLinks(mindMap: EnhancedMindMapData, nodeId: string): MindMapLink[] {
    return mindMap.links.filter(
      (link) => link.sourceId === nodeId || link.targetId === nodeId,
    )
  }

  /**
   * 获取连线的 SVG 路径
   */
  getLinkPath(
    mindMap: EnhancedMindMapData,
    link: MindMapLink,
  ): string {
    const sourceNode = mindMap.nodes[link.sourceId]
    const targetNode = mindMap.nodes[link.targetId]

    if (!sourceNode || !targetNode) {
      return ''
    }

    return calculateLinkPath(sourceNode, targetNode, link.type)
  }

  /**
   * 获取连线的样式
   */
  getLinkStyle(link: MindMapLink, themeId?: string): Record<string, string | number> {
    const theme = MINDMAP_THEMES.find((t) => t.id === themeId) || MINDMAP_THEMES[0]

    return {
      "stroke": link.color || theme.colors.link,
      'stroke-width': link.strokeWidth || theme.linkStyle.strokeWidth,
      "fill": 'none',
      'stroke-dasharray': link.type === MindMapLinkType.DASHED
        ? '5,5'
        : link.type === MindMapLinkType.DOTTED ? '2,2' : 'none',
    }
  }

  /**
   * 添加自由节点
   */
  addFreeNode(
    mindMap: EnhancedMindMapData,
    content: string,
    position: { x: number, y: number },
  ): EnhancedMindMapNode {
    const node = createEnhancedNode(content, MindMapNodeType.FREE)
    node.position = position
    node.style = {
      backgroundColor: MINDMAP_THEMES[0].colors.free,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#5a9f5a',
    }

    mindMap.freeNodes.push(node)
    mindMap.updatedAt = Date.now()

    return node
  }

  /**
   * 移除自由节点
   */
  removeFreeNode(mindMap: EnhancedMindMapData, nodeId: string): boolean {
    const index = mindMap.freeNodes.findIndex((node) => node.id === nodeId)
    if (index === -1) {
      return false
    }

    mindMap.freeNodes.splice(index, 1)
    mindMap.updatedAt = Date.now()

    return true
  }

  /**
   * 更新自由节点
   */
  updateFreeNode(
    mindMap: EnhancedMindMapData,
    nodeId: string,
    updates: Partial<EnhancedMindMapNode>,
  ): EnhancedMindMapNode | null {
    const node = mindMap.freeNodes.find((n) => n.id === nodeId)
    if (!node) {
      return null
    }

    Object.assign(node, updates, { updatedAt: Date.now() })
    mindMap.updatedAt = Date.now()

    return node
  }

  /**
   * 移动自由节点
   */
  moveFreeNode(
    mindMap: EnhancedMindMapData,
    nodeId: string,
    position: { x: number, y: number },
  ): EnhancedMindMapNode | null {
    const node = mindMap.freeNodes.find((n) => n.id === nodeId)
    if (!node) {
      return null
    }

    node.position = position
    node.updatedAt = Date.now()
    mindMap.updatedAt = Date.now()

    return node
  }

  /**
   * 将自由节点转换为分支节点
   */
  convertToBranchNode(
    mindMap: EnhancedMindMapData,
    nodeId: string,
    parentId: string,
  ): EnhancedMindMapNode | null {
    const freeNodeIndex = mindMap.freeNodes.findIndex((n) => n.id === nodeId)
    if (freeNodeIndex === -1) {
      return null
    }

    const parentNode = mindMap.nodes[parentId]
    if (!parentNode) {
      return null
    }

    const freeNode = mindMap.freeNodes[freeNodeIndex]

    // 创建新的分支节点
    const branchNode = createEnhancedNode(freeNode.content, MindMapNodeType.BRANCH, parentId)
    branchNode.position = {
      x: 0,
      y: 0,
    } // 相对于父节点的位置
    branchNode.style = freeNode.style
    branchNode.note = freeNode.note
    branchNode.cardIds = freeNode.cardIds
    branchNode.tags = freeNode.tags

    // 添加到父节点的子节点列表
    parentNode.childrenIds.push(branchNode.id)

    // 添加到节点列表
    mindMap.nodes[branchNode.id] = branchNode

    // 从自由节点列表移除
    mindMap.freeNodes.splice(freeNodeIndex, 1)

    mindMap.updatedAt = Date.now()

    return branchNode
  }

  /**
   * 将分支节点转换为自由节点
   */
  convertToFreeNode(
    mindMap: EnhancedMindMapData,
    nodeId: string,
    position: { x: number, y: number },
  ): EnhancedMindMapNode | null {
    const node = mindMap.nodes[nodeId]
    if (!node || node.type === MindMapNodeType.ROOT) {
      return null // 根节点不能转换
    }

    // 从父节点的子节点列表移除
    if (node.parentId) {
      const parentNode = mindMap.nodes[node.parentId]
      if (parentNode) {
        parentNode.childrenIds = parentNode.childrenIds.filter((id) => id !== nodeId)
      }
    }

    // 创建自由节点
    const freeNode = createEnhancedNode(node.content, MindMapNodeType.FREE)
    freeNode.position = position
    freeNode.style = node.style
    freeNode.note = node.note
    freeNode.cardIds = node.cardIds
    freeNode.tags = node.tags

    // 添加到自由节点列表
    mindMap.freeNodes.push(freeNode)

    // 从节点列表移除原节点（及其子树）
    this.removeNodeAndChildren(mindMap, nodeId)

    mindMap.updatedAt = Date.now()

    return freeNode
  }

  /**
   * 递归移除节点及其子节点
   */
  private removeNodeAndChildren(mindMap: EnhancedMindMapData, nodeId: string): void {
    const node = mindMap.nodes[nodeId]
    if (!node) return

    // 递归移除子节点
    for (const childId of node.childrenIds) {
      this.removeNodeAndChildren(mindMap, childId)
    }

    // 移除节点
    delete mindMap.nodes[nodeId]
  }

  /**
   * 获取所有自由节点
   */
  getFreeNodes(mindMap: EnhancedMindMapData): EnhancedMindMapNode[] {
    return mindMap.freeNodes
  }

  /**
   * 获取所有连线
   */
  getLinks(mindMap: EnhancedMindMapData): MindMapLink[] {
    return mindMap.links
  }

  /**
   * 检查两个节点之间是否有连线
   */
  hasLink(mindMap: EnhancedMindMapData, sourceId: string, targetId: string): boolean {
    return mindMap.links.some(
      (link) => link.sourceId === sourceId && link.targetId === targetId,
    )
  }

  /**
   * 获取节点的连接关系图
   */
  getNodeConnections(mindMap: EnhancedMindMapData, nodeId: string): {
    incoming: MindMapLink[]
    outgoing: MindMapLink[]
  } {
    const incoming = mindMap.links.filter((link) => link.targetId === nodeId)
    const outgoing = mindMap.links.filter((link) => link.sourceId === nodeId)

    return {
      incoming,
      outgoing,
    }
  }

  /**
   * 序列化脑图为 JSON
   */
  toJSON(mindMap: EnhancedMindMapData): string {
    return JSON.stringify(mindMap, null, 2)
  }

  /**
   * 从 JSON 解析脑图
   */
  fromJSON(json: string): EnhancedMindMapData {
    return JSON.parse(json)
  }

  /**
   * 导出脑图为 SVG
   */
  exportToSVG(mindMap: EnhancedMindMapData, containerId: string): string {
    const theme = mindMap.theme || MINDMAP_THEMES[0]

    // 计算边界
    let minX = Infinity; let minY = Infinity
    let maxX = -Infinity; let maxY = -Infinity

    // 考虑所有节点
    Object.values(mindMap.nodes).forEach((node) => {
      const pos = getNodeCanvasPosition(node, mindMap.nodes)
      const width = node.size?.width || 100
      const height = node.size?.height || 40
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      maxX = Math.max(maxX, pos.x + width)
      maxY = Math.max(maxY, pos.y + height)
    })

    mindMap.freeNodes.forEach((node) => {
      const width = node.size?.width || 100
      const height = node.size?.height || 40
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + width)
      maxY = Math.max(maxY, node.position.y + height)
    })

    const padding = 50
    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    // 生成 SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX - padding} ${minY - padding} ${width} ${height}">`

    // 背景
    svg += `<rect width="100%" height="100%" fill="${theme.colors.background}"/>`

    // 绘制连线
    mindMap.links.forEach((link) => {
      const path = this.getLinkPath(mindMap, link)
      const style = this.getLinkStyle(link, theme.id)
      svg += `<path d="${path}" stroke="${style.stroke}" stroke-width="${style['stroke-width']}" fill="none" stroke-dasharray="${style['stroke-dasharray']}"/>`
    })

    // 绘制节点
    Object.values(mindMap.nodes).forEach((node) => {
      const pos = getNodeCanvasPosition(node, mindMap.nodes)
      const nodeWidth = node.size?.width || 100
      const nodeHeight = node.size?.height || 40
      const style = node.style || {}

      svg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}"
        fill="${style.backgroundColor || theme.colors.branch}"
        stroke="${style.borderColor || 'transparent'}"
        stroke-width="${style.borderWidth || 0}"
        rx="${style.borderRadius || 8}"/>`

      svg += `<text x="${pos.x + nodeWidth / 2}" y="${pos.y + nodeHeight / 2}"
        text-anchor="middle" dominant-baseline="middle"
        fill="${style.color || theme.colors.text}"
        font-size="${style.fontSize || 14}">${node.content}</text>`
    })

    // 绘制自由节点
    mindMap.freeNodes.forEach((node) => {
      const nodeWidth = node.size?.width || 100
      const nodeHeight = node.size?.height || 40
      const style = node.style || {}

      svg += `<rect x="${node.position.x}" y="${node.position.y}" width="${nodeWidth}" height="${nodeHeight}"
        fill="${style.backgroundColor || theme.colors.free}"
        stroke="${style.borderColor || 'transparent'}"
        stroke-width="${style.borderWidth || 0}"
        rx="${style.borderRadius || 8}"/>`

      svg += `<text x="${node.position.x + nodeWidth / 2}" y="${node.position.y + nodeHeight / 2}"
        text-anchor="middle" dominant-baseline="middle"
        fill="${style.color || theme.colors.text}"
        font-size="${style.fontSize || 14}">${node.content}</text>`
    })

    svg += '</svg>'
    return svg
  }
}

// 导出单例
export const mindMapLinkService = new MindMapLinkService()
export default mindMapLinkService
