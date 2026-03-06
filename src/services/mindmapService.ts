/**
 * 脑图服务
 * MarginNote 4 风格学习插件 - 脑图相关服务
 *
 * 注意：此服务需要集成 mymind 插件
 * 参考：https://github.com/ebAobS/mymind
 */

import type { PDFAnnotation } from '../types/annotation'
import type {
  CreateMindMapOptions,
  MindMap,
  MindMapNode,
} from '../types/mindmap'

/**
 * 脑图服务类
 */
export class MindMapService {
  private static instance: MindMapService | null = null

  private constructor() {}

  static getInstance(): MindMapService {
    if (!MindMapService.instance) {
      MindMapService.instance = new MindMapService()
    }
    return MindMapService.instance
  }

  /**
   * 从标注创建脑图节点
   *
   * @param annotations - 标注列表
   * @param rootTitle - 根节点标题
   * @returns 脑图节点树
   */
  createNodesFromAnnotations(
    annotations: PDFAnnotation[],
    rootTitle: string = '思维导图',
  ): MindMapNode {
    // 创建根节点
    const rootNode: MindMapNode = {
      id: `root-${Date.now()}`,
      cardId: '',
      title: rootTitle,
      position: {
        x: 0,
        y: 0,
      },
      collapsed: false,
      children: [],
    }

    // 按级别分组
    const groupedByLevel = new Map<string, PDFAnnotation[]>()
    for (const ann of annotations) {
      const level = ann.level || 'text'
      if (!groupedByLevel.has(level)) {
        groupedByLevel.set(level, [])
      }
      groupedByLevel.get(level)!.push(ann)
    }

    // 为每个级别创建分支
    for (const [level, levelAnnotations] of groupedByLevel) {
      const levelNode: MindMapNode = {
        id: `level-${level}`,
        cardId: '',
        title: this.getLevelLabel(level),
        position: {
          x: 0,
          y: 0,
        },
        collapsed: false,
        children: [],
      }

      // 为该级别的每个标注创建子节点
      for (const ann of levelAnnotations) {
        const childNode: MindMapNode = {
          id: ann.id,
          cardId: ann.blockId,
          title: ann.text || (ann.isImage ? '[图片]' : ''),
          position: {
            x: 0,
            y: 0,
          },
          collapsed: false,
          children: [],
        }

        levelNode.children.push(childNode)
      }

      rootNode.children.push(levelNode)
    }

    return rootNode
  }

  /**
   * 创建空脑图
   *
   * @param options - 创建选项
   * @returns 脑图对象
   */
  createMindMap(options: CreateMindMapOptions): MindMap {
    const rootId = `mindmap-${Date.now()}`

    return {
      id: rootId,
      title: options.title || '思维导图',
      root: {
        id: `${rootId}-root`,
        text: options.rootText || '中心主题',
        children: [],
        layout: options.layout || 'right',
        expanded: true,
      },
      layout: options.layout || 'right',
      theme: options.theme || 'default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  /**
   * 添加节点到脑图
   *
   * @param mindMap - 脑图对象
   * @param parentNodeId - 父节点 ID
   * @param nodeText - 节点文本
   * @param position - 插入位置（'before' | 'after' | 'child'）
   * @returns 更新后的脑图
   */
  addNode(
    mindMap: MindMap,
    parentNodeId: string,
    nodeText: string,
    position: 'before' | 'after' | 'child' = 'child',
  ): MindMap {
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: nodeText,
      children: [],
      layout: mindMap.layout,
      expanded: true,
    }

    const updatedRoot = this.findAndModifyNode(
      mindMap.root,
      parentNodeId,
      (node, isTarget) => {
        if (isTarget) {
          if (position === 'child') {
            node.children = [...node.children, newNode]
          }
          return node
        }

        // 查找子节点
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].id === parentNodeId) {
            if (position === 'before') {
              node.children = [...node.children.slice(0, i), newNode, ...node.children.slice(i)]
            } else if (position === 'after') {
              node.children = [...node.children.slice(0, i + 1), newNode, ...node.children.slice(i + 1)]
            }
            return node
          }
        }

        // 递归处理子节点
        for (const child of node.children) {
          const result = this.findAndModifyNode(child, parentNodeId, (n, isT) => {
            if (isT) {
              if (position === 'child') {
                n.children = [...n.children, newNode]
              }
              return n
            }
            return this.findAndModifyNodeInPlace(n, parentNodeId, newNode, position)
          })
          if (result !== child) {
            return {
              ...node,
              children: node.children.map((c) => c === child ? result : c),
            }
          }
        }

        return node
      },
    )

    return {
      ...mindMap,
      root: updatedRoot,
      updatedAt: Date.now(),
    }
  }

  private findAndModifyNodeInPlace(
    node: MindMapNode,
    targetId: string,
    newNode: MindMapNode,
    position: 'before' | 'after' | 'child',
  ): MindMapNode {
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].id === targetId) {
        if (position === 'child') {
          node.children[i].children = [...node.children[i].children, newNode]
        } else if (position === 'before') {
          node.children = [...node.children.slice(0, i), newNode, ...node.children.slice(i)]
        } else if (position === 'after') {
          node.children = [...node.children.slice(0, i + 1), newNode, ...node.children.slice(i + 1)]
        }
        return node
      }
    }

    for (const child of node.children) {
      this.findAndModifyNodeInPlace(child, targetId, newNode, position)
    }

    return node
  }

  private findAndModifyNode(
    node: MindMapNode,
    targetId: string,
    modifier: (node: MindMapNode, isTarget: boolean) => MindMapNode,
  ): MindMapNode {
    if (node.id === targetId) {
      return modifier(node, true)
    }

    const modifiedChildren = node.children.map((child) =>
      this.findAndModifyNode(child, targetId, modifier),
    )

    return modifier({
      ...node,
      children: modifiedChildren,
    }, false)
  }

  /**
   * 删除节点
   *
   * @param mindMap - 脑图对象
   * @param nodeId - 要删除的节点 ID
   * @returns 更新后的脑图
   */
  deleteNode(mindMap: MindMap, nodeId: string): MindMap {
    const deleteNodeFromTree = (node: MindMapNode): MindMapNode | null => {
      if (node.id === nodeId) {
        return null
      }

      const filteredChildren = node.children
        .map((child) => deleteNodeFromTree(child))
        .filter((child): child is MindMapNode => child !== null)

      return {
        ...node,
        children: filteredChildren,
      }
    }

    const updatedRoot = deleteNodeFromTree(mindMap.root)

    if (!updatedRoot) {
      // 不能删除根节点，返回原脑图
      return mindMap
    }

    return {
      ...mindMap,
      root: updatedRoot,
      updatedAt: Date.now(),
    }
  }

  /**
   * 更新节点文本
   *
   * @param mindMap - 脑图对象
   * @param nodeId - 节点 ID
   * @param newText - 新文本
   * @returns 更新后的脑图
   */
  updateNodeText(mindMap: MindMap, nodeId: string, newText: string): MindMap {
    const updatedRoot = this.findAndModifyNode(
      mindMap.root,
      nodeId,
      (node, isTarget) => isTarget
        ? {
            ...node,
            text: newText,
          }
        : node,
    )

    return {
      ...mindMap,
      root: updatedRoot,
      updatedAt: Date.now(),
    }
  }

  /**
   * 切换节点展开/折叠状态
   *
   * @param mindMap - 脑图对象
   * @param nodeId - 节点 ID
   * @returns 更新后的脑图
   */
  toggleNodeExpanded(mindMap: MindMap, nodeId: string): MindMap {
    const updatedRoot = this.findAndModifyNode(
      mindMap.root,
      nodeId,
      (node, isTarget) => isTarget
        ? {
            ...node,
            expanded: !node.expanded,
          }
        : node,
    )

    return {
      ...mindMap,
      root: updatedRoot,
      updatedAt: Date.now(),
    }
  }

  /**
   * 获取节点路径（从根节点到目标节点）
   *
   * @param node - 起始节点
   * @param targetId - 目标节点 ID
   * @param path - 当前路径
   * @returns 节点路径
   */
  getNodePath(node: MindMapNode, targetId: string, path: MindMapNode[] = []): MindMapNode[] | null {
    if (node.id === targetId) {
      return [...path, node]
    }

    for (const child of node.children) {
      const result = this.getNodePath(child, targetId, [...path, node])
      if (result) {
        return result
      }
    }

    return null
  }

  /**
   * 统计节点数量
   *
   * @param node - 起始节点
   * @returns 节点数量
   */
  countNodes(node: MindMapNode): number {
    let count = 1
    for (const child of node.children) {
      count += this.countNodes(child)
    }
    return count
  }

  /**
   * 获取级别标签
   */
  private getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      title1: '📑 一级标题',
      title2: '📑 二级标题',
      title3: '📑 三级标题',
      text: '📝 正文标注',
    }
    return labels[level] || level
  }

  /**
   * 导出脑图为 Markdown
   *
   * @param node - 起始节点
   * @param indent - 缩进级别
   * @returns Markdown 字符串
   */
  exportToMarkdown(node: MindMapNode, indent = 0): string {
    const prefix = '  '.repeat(indent)
    let result = `${prefix}- ${node.text}\n`

    for (const child of node.children) {
      result += this.exportToMarkdown(child, indent + 1)
    }

    return result
  }

  /**
   * 导出脑图为 OPML（可用于导入其他脑图工具）
   *
   * @param mindMap - 脑图对象
   * @returns OPML XML 字符串
   */
  exportToOpml(mindMap: MindMap): string {
    const nodeToOutline = (node: MindMapNode, indent = 0): string => {
      const prefix = '  '.repeat(indent)
      const nodeText = (node.title || node.text || '').replace(/"/g, '"')
      let result = `${prefix}<outline text="${nodeText}"`

      if (node.children.length > 0) {
        result += '>\n'
        for (const child of node.children) {
          result += nodeToOutline(child, indent + 1)
        }
        result += `${prefix}</outline>\n`
      } else {
        result += '/>\n'
      }

      return result
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${mindMap.title || 'Mind Map'}</title>
  </head>
  <body>
${nodeToOutline(mindMap.root, 2)}  </body>
</opml>`
  }
}

// 导出单例
export const mindMapService = MindMapService.getInstance()
