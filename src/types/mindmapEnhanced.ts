/**
 * 增强脑图类型定义
 * MarginNote 4 风格学习插件 - 增强脑图功能
 */


/**
 * 脑图节点类型
 */
export enum MindMapNodeType {
  ROOT = 'root', // 根节点
  BRANCH = 'branch', // 分支节点
  FREE = 'free', // 自由节点
  GROUP = 'group', // 分组节点
}

/**
 * 脑图连线类型
 */
export enum MindMapLinkType {
  DEFAULT = 'default', // 默认连线
  DASHED = 'dashed', // 虚线
  DOTTED = 'dotted', // 点线
  CURVED = 'curved', // 曲线
  STRAIGHT = 'straight', // 直线
}

/**
 * 脑图节点关系
 */
export interface MindMapRelation {
  type: 'parent' | 'child' | 'sibling' | 'link'
  targetId: string
  label?: string
}

/**
 * 脑图连线
 */
export interface MindMapLink {
  id: string
  sourceId: string // 源节点 ID
  targetId: string // 目标节点 ID
  type: MindMapLinkType
  color?: string
  strokeWidth?: number
  label?: string // 连线标签/关系说明
  labelPosition?: number // 标签位置 0-1
  controlPoints?: { // 控制点（用于曲线）
    x: number
    y: number
  }[]
  createdAt: number
  updatedAt: number
}

/**
 * 增强脑图节点
 */
export interface EnhancedMindMapNode {
  id: string
  type: MindMapNodeType
  content: string
  parentId?: string
  childrenIds: string[]
  linkedNodeIds: string[] // 通过连线关联的节点
  position: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    fontSize?: number
    fontWeight?: string | number
    color?: string
    icon?: string
  }
  note?: string // 节点备注
  collapsed?: boolean // 是否折叠
  cardIds?: string[] // 关联的卡片 ID
  tags?: string[] // 节点标签
  metadata?: Record<string, any>
  createdAt: number
  updatedAt: number
}

/**
 * 增强脑图数据
 */
export interface EnhancedMindMapData {
  id: string
  title: string
  rootId: string
  nodes: Record<string, EnhancedMindMapNode>
  links: MindMapLink[]
  freeNodes: EnhancedMindMapNode[] // 自由节点列表
  viewport?: {
    x: number
    y: number
    zoom: number
  }
  theme?: MindMapTheme
  createdAt: number
  updatedAt: number
}

/**
 * 脑图主题
 */
export interface MindMapTheme {
  id: string
  name: string
  colors: {
    root: string
    branch: string
    free: string
    link: string
    background: string
    text: string
  }
  nodeStyle: {
    borderRadius: number
    borderWidth: number
    padding: number
  }
  linkStyle: {
    type: MindMapLinkType
    color: string
    strokeWidth: number
  }
}

/**
 * 脑图主题预设
 */
export const MINDMAP_THEMES: MindMapTheme[] = [
  {
    id: 'default',
    name: '默认主题',
    colors: {
      root: '#4a90d9',
      branch: '#5fb3d9',
      free: '#77c977',
      link: '#999999',
      background: '#ffffff',
      text: '#333333',
    },
    nodeStyle: {
      borderRadius: 8,
      borderWidth: 2,
      padding: 12,
    },
    linkStyle: {
      type: MindMapLinkType.CURVED,
      color: '#4a90d9',
      strokeWidth: 2,
    },
  },
  {
    id: 'dark',
    name: '深色主题',
    colors: {
      root: '#5a9fe9',
      branch: '#6fc3e9',
      free: '#87d987',
      link: '#aaaaaa',
      background: '#1e1e1e',
      text: '#ffffff',
    },
    nodeStyle: {
      borderRadius: 8,
      borderWidth: 2,
      padding: 12,
    },
    linkStyle: {
      type: MindMapLinkType.CURVED,
      color: '#5a9fe9',
      strokeWidth: 2,
    },
  },
  {
    id: 'classic',
    name: '经典主题',
    colors: {
      root: '#8b4513',
      branch: '#a0522d',
      free: '#cd853f',
      link: '#8b4513',
      background: '#fff8dc',
      text: '#333333',
    },
    nodeStyle: {
      borderRadius: 4,
      borderWidth: 1,
      padding: 10,
    },
    linkStyle: {
      type: MindMapLinkType.STRAIGHT,
      color: '#8b4513',
      strokeWidth: 1,
    },
  },
  {
    id: 'modern',
    name: '现代主题',
    colors: {
      root: '#6366f1',
      branch: '#818cf8',
      free: '#a5b4fc',
      link: '#6366f1',
      background: '#fafafa',
      text: '#1f2937',
    },
    nodeStyle: {
      borderRadius: 12,
      borderWidth: 2,
      padding: 14,
    },
    linkStyle: {
      type: MindMapLinkType.CURVED,
      color: '#6366f1',
      strokeWidth: 2,
    },
  },
  {
    id: 'minimal',
    name: '极简主题',
    colors: {
      root: '#333333',
      branch: '#666666',
      free: '#999999',
      link: '#cccccc',
      background: '#ffffff',
      text: '#333333',
    },
    nodeStyle: {
      borderRadius: 0,
      borderWidth: 1,
      padding: 8,
    },
    linkStyle: {
      type: MindMapLinkType.STRAIGHT,
      color: '#333333',
      strokeWidth: 1,
    },
  },
]

/**
 * 创建唯一 ID
 */
export function createId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建脑图连线
 */
export function createMindMapLink(
  sourceId: string,
  targetId: string,
  type: MindMapLinkType = MindMapLinkType.DEFAULT,
  label?: string,
): MindMapLink {
  const now = Date.now()
  return {
    id: createId('link'),
    sourceId,
    targetId,
    type,
    label,
    strokeWidth: 2,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 创建增强脑图节点
 */
export function createEnhancedNode(
  content: string,
  type: MindMapNodeType = MindMapNodeType.BRANCH,
  parentId?: string,
): EnhancedMindMapNode {
  const now = Date.now()
  return {
    id: createId('node'),
    type,
    content,
    parentId,
    childrenIds: [],
    linkedNodeIds: [],
    position: {
      x: 0,
      y: 0,
    },
    style: {},
    collapsed: false,
    cardIds: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 获取节点在画布上的实际位置
 */
export function getNodeCanvasPosition(
  node: EnhancedMindMapNode,
  nodes: Record<string, EnhancedMindMapNode>,
): { x: number, y: number } {
  let x = node.position.x
  let y = node.position.y

  // 如果是自由节点，直接返回
  if (node.type === MindMapNodeType.FREE) {
    return {
      x,
      y,
    }
  }

  // 累加父节点的位置
  let currentParentId = node.parentId
  while (currentParentId && nodes[currentParentId]) {
    const parent = nodes[currentParentId]
    x += parent.position.x
    y += parent.position.y
    currentParentId = parent.parentId
  }

  return {
    x,
    y,
  }
}

/**
 * 计算两点之间的连线路径
 */
export function calculateLinkPath(
  source: EnhancedMindMapNode,
  target: EnhancedMindMapNode,
  linkType: MindMapLinkType = MindMapLinkType.CURVED,
): string {
  const sourcePos = getNodeCanvasPosition(source, { [source.id]: source })
  const targetPos = getNodeCanvasPosition(target, { [target.id]: target })

  // 获取节点尺寸（使用默认值或实际尺寸）
  const sourceWidth = source.size?.width || 100
  const sourceHeight = source.size?.height || 40
  const targetWidth = target.size?.width || 100
  const targetHeight = target.size?.height || 40

  // 计算连接点（从节点边缘到边缘）
  const startX = sourcePos.x + sourceWidth / 2
  const startY = sourcePos.y + sourceHeight / 2
  const endX = targetPos.x + targetWidth / 2
  const endY = targetPos.y + targetHeight / 2

  if (linkType === MindMapLinkType.STRAIGHT) {
    // 直线路径
    return `M ${startX} ${startY} L ${endX} ${endY}`
  } else if (linkType === MindMapLinkType.CURVED) {
    // 曲线路径（贝塞尔曲线）
    const controlX1 = startX + Math.abs(endX - startX) / 2
    const controlY1 = startY
    const controlX2 = endX - Math.abs(endX - startX) / 2
    const controlY2 = endY

    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
  } else {
    // 默认路径
    return `M ${startX} ${startY} L ${endX} ${endY}`
  }
}

/**
 * 序列化脑图为 Markdown
 */
export function mindMapToMarkdown(mindMap: EnhancedMindMapData): string {
  let md = `# ${mindMap.title}\n\n`

  // 输出节点树
  function outputNode(nodeId: string, indent: number = 0): string {
    const node = mindMap.nodes[nodeId]
    if (!node) return ''

    const prefix = '  '.repeat(indent)
    let result = `${prefix}- ${node.content}\n`

    if (node.note) {
      result += `${prefix}  > 💡 ${node.note}\n`
    }

    if (node.tags && node.tags.length > 0) {
      result += `${prefix}  > 🏷️ ${node.tags.map((t) => `#${t}`).join(' ')}\n`
    }

    if (node.cardIds && node.cardIds.length > 0) {
      result += `${prefix}  > 📇 关联 ${node.cardIds.length} 张卡片\n`
    }

    for (const childId of node.childrenIds) {
      result += outputNode(childId, indent + 1)
    }

    return result
  }

  const rootNode = mindMap.nodes[mindMap.rootId]
  if (rootNode) {
    md += outputNode(mindMap.rootId)
  }

  // 输出自由节点
  if (mindMap.freeNodes && mindMap.freeNodes.length > 0) {
    md += `\n## 自由节点\n\n`
    for (const node of mindMap.freeNodes) {
      md += `- ${node.content}\n`
    }
  }

  // 输出连线
  if (mindMap.links && mindMap.links.length > 0) {
    md += `\n## 节点连线\n\n`
    for (const link of mindMap.links) {
      const sourceNode = mindMap.nodes[link.sourceId]
      const targetNode = mindMap.nodes[link.targetId]
      if (sourceNode && targetNode) {
        md += `- ${sourceNode.content} → ${targetNode.content}`
        if (link.label) {
          md += ` (${link.label})`
        }
        md += `\n`
      }
    }
  }

  return md
}

export default MindMapNodeType
