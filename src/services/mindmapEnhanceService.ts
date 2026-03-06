/**
 * 脑图增强服务
 * 提供脑图坐标持久化、节点多卡片关联、反向链接等功能
 */

import type { Card } from '../types/card'
import type {
  MindMapLayout,
  MindMapNode,
} from '../types/mindmap'
import {
  getBlock,
  sqlQuery,
  updateBlockAttrs,
} from '../api/siyuanApi'

/**
 * 脑图节点扩展属性
 */
export interface ExtendedMindMapNode extends MindMapNode {
  /** 关联的多张卡片 ID 列表 */
  cardIds: string[]
  /** 节点备注 */
  note?: string
  /** 节点图标 */
  icon?: string
  /** 节点颜色 */
  color?: string
  /** 创建时间 */
  createdAt?: number
  /** 更新时间 */
  updatedAt?: number
}

/**
 * 脑图反向链接信息
 */
export interface MindMapBacklink {
  /** 脑图 ID */
  mindMapId: string
  /** 脑图名称 */
  mindMapName: string
  /** 所属学习集 ID */
  studySetId: string
  /** 节点 ID */
  nodeId: string
  /** 节点标题 */
  nodeTitle: string
  /** 节点在脑图中的路径 */
  nodePath: string[]
}

/**
 * 脑图节点统计
 */
export interface NodeStats {
  /** 总节点数 */
  totalNodes: number
  /** 关联卡片数 */
  linkedCards: number
  /** 多卡片关联节点数 */
  multiCardNodes: number
  /** 折叠节点数 */
  collapsedNodes: number
  /** 最大深度 */
  maxDepth: number
}

/**
 * 保存脑图节点坐标
 */
export async function saveNodePositions(
  mindMapId: string,
  nodes: ExtendedMindMapNode[],
): Promise<boolean> {
  try {
    // 将节点数据序列化为 JSON 字符串
    const mindMapData = JSON.stringify({
      nodes,
      updatedAt: Date.now(),
    })

    await updateBlockAttrs({
      blockId: mindMapId,
      attrs: {
        'custom-mindmap-data': mindMapData,
        'custom-mindmap-updated': Date.now().toString(),
      },
    })

    return true
  } catch (error) {
    console.error('[saveNodePositions] 保存节点坐标失败:', error)
    return false
  }
}

/**
 * 加载脑图节点坐标
 */
export async function loadNodePositions(
  mindMapId: string,
): Promise<{
  nodes: ExtendedMindMapNode[]
  viewport?: {
    scale: number
    offsetX: number
    offsetY: number
  }
} | null> {
  try {
    const block = await getBlock(mindMapId)

    if (!block) {
      return null
    }

    const mindMapDataStr = block['custom-mindmap-data'] as string

    if (!mindMapDataStr) {
      return null
    }

    const data = JSON.parse(mindMapDataStr)

    return {
      nodes: data.nodes as ExtendedMindMapNode[],
      viewport: data.viewport,
    }
  } catch (error) {
    console.error('[loadNodePositions] 加载节点坐标失败:', error)
    return null
  }
}

/**
 * 为脑图节点添加关联卡片
 */
export async function addNodeCard(
  mindMapId: string,
  nodeId: string,
  cardId: string,
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    // 如果 cardIds 不存在，初始化
    if (!node.cardIds) {
      node.cardIds = node.cardId ? [node.cardId] : []
    }

    // 添加新卡片 ID（去重）
    if (!node.cardIds.includes(cardId)) {
      node.cardIds.push(cardId)
    }

    node.updatedAt = Date.now()

    return await saveNodePositions(mindMapId, nodes)
  } catch (error) {
    console.error('[addNodeCard] 添加关联卡片失败:', error)
    return false
  }
}

/**
 * 从脑图节点移除关联卡片
 */
export async function removeNodeCard(
  mindMapId: string,
  nodeId: string,
  cardId: string,
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    if (node.cardIds) {
      node.cardIds = node.cardIds.filter((id) => id !== cardId)
    }

    node.updatedAt = Date.now()

    return await saveNodePositions(mindMapId, nodes)
  } catch (error) {
    console.error('[removeNodeCard] 移除关联卡片失败:', error)
    return false
  }
}

/**
 * 获取节点关联的所有卡片
 */
export async function getNodeCards(
  mindMapId: string,
  nodeId: string,
): Promise<Card[]> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node || !node.cardIds || node.cardIds.length === 0) {
      return []
    }

    // 查询所有关联的卡片
    const cardIds = node.cardIds.map((id) => `'${id}'`).join(',')
    const stmt = `SELECT * FROM blocks WHERE id IN (${cardIds})`
    const result = await sql({ stmt })

    return (result || []).map((block) => ({
      id: block.id,
      type: (block['custom-card-type'] as any) || 'card',
      content: block.content || '',
      sourceLocation: {
        docId: block['custom-card-source-doc-id'] || '',
        blockId: block['custom-card-source-block-id'] || '',
        pdfPath: block['custom-card-source-pdf'] || '',
        page: block['custom-card-source-page'] ? Number.parseInt(block['custom-card-source-page']) : undefined,
      },
      studySetId: block['custom-card-study-set-id'] || '',
      tags: block['custom-card-tags'] ? (block['custom-card-tags'] as string).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      status: (block['custom-card-status'] as any) || 'new',
      difficulty: Number.parseInt(block['custom-card-difficulty']) || 1,
      createdAt: block.created || Date.now(),
      updatedAt: block.updated || Date.now(),
    }))
  } catch (error) {
    console.error('[getNodeCards] 获取关联卡片失败:', error)
    return []
  }
}

/**
 * 查找卡片被哪些脑图节点引用（反向链接）
 */
export async function getCardBacklinks(cardId: string): Promise<MindMapBacklink[]> {
  try {
    // 查询所有包含该卡片 ID 的脑图块
    const stmt = `SELECT * FROM blocks WHERE custom-mindmap-data IS NOT NULL AND custom-mindmap-data != ''`
    const result = await sqlQuery(stmt)

    const backlinks: MindMapBacklink[] = []

    for (const block of result || []) {
      const mindMapId = block.id
      const mindMapDataStr = block['custom-mindmap-data'] as string

      try {
        const data = JSON.parse(mindMapDataStr)
        const nodes = data.nodes as ExtendedMindMapNode[]

        // 查找包含该卡片 ID 的节点
        const nodePath: string[] = []
        const matchingNode = findNodeByCardId(nodes, cardId, nodePath)

        if (matchingNode) {
          backlinks.push({
            mindMapId,
            mindMapName: block.content || '未命名脑图',
            studySetId: block['custom-mindmap-study-set-id'] as string || '',
            nodeId: matchingNode.id,
            nodeTitle: matchingNode.title,
            nodePath: [...nodePath, matchingNode.title],
          })
        }
      } catch (e) {
        console.error('[getCardBacklinks] 解析脑图数据失败:', e)
      }
    }

    return backlinks
  } catch (error) {
    console.error('[getCardBacklinks] 获取反向链接失败:', error)
    return []
  }
}

/**
 * 获取脑图节点的反向链接（哪些卡片引用了这个节点）
 */
export async function getNodeBacklinks(
  mindMapId: string,
  nodeId: string,
): Promise<Card[]> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node || !node.cardIds || node.cardIds.length === 0) {
      return []
    }

    // 查询所有关联的卡片
    const cardIds = node.cardIds.map((id) => `'${id}'`).join(',')
    const stmt = `SELECT * FROM blocks WHERE id IN (${cardIds})`
    const result = await sql({ stmt })

    return (result || []).map((block) => ({
      id: block.id,
      type: (block['custom-card-type'] as any) || 'card',
      content: block.content || '',
      sourceLocation: {
        docId: block['custom-card-source-doc-id'] || '',
        blockId: block['custom-card-source-block-id'] || '',
        pdfPath: block['custom-card-source-pdf'] || '',
        page: block['custom-card-source-page'] ? Number.parseInt(block['custom-card-source-page']) : undefined,
      },
      studySetId: block['custom-card-study-set-id'] || '',
      tags: block['custom-card-tags'] ? (block['custom-card-tags'] as string).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      status: (block['custom-card-status'] as any) || 'new',
      difficulty: Number.parseInt(block['custom-card-difficulty']) || 1,
      createdAt: block.created || Date.now(),
      updatedAt: block.updated || Date.now(),
    }))
  } catch (error) {
    console.error('[getNodeBacklinks] 获取反向链接失败:', error)
    return []
  }
}

/**
 * 设置节点样式
 */
export async function setNodeStyle(
  mindMapId: string,
  nodeId: string,
  style: {
    color?: string
    icon?: string
  },
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    if (style.color) {
      node.color = style.color
    }
    if (style.icon) {
      node.icon = style.icon
    }

    node.updatedAt = Date.now()

    return await saveNodePositions(mindMapId, nodes)
  } catch (error) {
    console.error('[setNodeStyle] 设置节点样式失败:', error)
    return false
  }
}

/**
 * 设置节点备注
 */
export async function setNodeNote(
  mindMapId: string,
  nodeId: string,
  note: string,
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const node = findNodeById(nodes, nodeId)
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    node.note = note
    node.updatedAt = Date.now()

    return await saveNodePositions(mindMapId, nodes)
  } catch (error) {
    console.error('[setNodeNote] 设置节点备注失败:', error)
    return false
  }
}

/**
 * 获取脑图统计信息
 */
export async function getMindMapStats(mindMapId: string): Promise<NodeStats> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    let totalNodes = 0
    let linkedCards = 0
    let multiCardNodes = 0
    let collapsedNodes = 0
    let maxDepth = 0

    const countNodes = (nodeList: ExtendedMindMapNode[], depth: number) => {
      for (const node of nodeList) {
        totalNodes++

        if (depth > maxDepth) {
          maxDepth = depth
        }

        if (node.collapsed) {
          collapsedNodes++
        }

        if (node.cardIds && node.cardIds.length > 0) {
          linkedCards += node.cardIds.length
          if (node.cardIds.length > 1) {
            multiCardNodes++
          }
        } else if (node.cardId) {
          linkedCards++
        }

        if (node.children && node.children.length > 0) {
          countNodes(node.children, depth + 1)
        }
      }
    }

    countNodes(nodes, 1)

    return {
      totalNodes,
      linkedCards,
      multiCardNodes,
      collapsedNodes,
      maxDepth,
    }
  } catch (error) {
    console.error('[getMindMapStats] 获取统计失败:', error)
    return {
      totalNodes: 0,
      linkedCards: 0,
      multiCardNodes: 0,
      collapsedNodes: 0,
      maxDepth: 0,
    }
  }
}

/**
 * 保存脑图视口状态
 */
export async function saveViewport(
  mindMapId: string,
  viewport: {
    scale: number
    offsetX: number
    offsetY: number
  },
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    const mindMapData = JSON.stringify({
      nodes,
      viewport,
      updatedAt: Date.now(),
    })

    await updateBlockAttrs({
      blockId: mindMapId,
      attrs: {
        'custom-mindmap-data': mindMapData,
      },
    })

    return true
  } catch (error) {
    console.error('[saveViewport] 保存视口状态失败:', error)
    return false
  }
}

/**
 * 递归查找节点
 */
function findNodeById(
  nodes: ExtendedMindMapNode[],
  nodeId: string,
): ExtendedMindMapNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId)
      if (found) return found
    }
  }
  return null
}

/**
 * 递归查找包含指定卡片 ID 的节点
 */
function findNodeByCardId(
  nodes: ExtendedMindMapNode[],
  cardId: string,
  path: string[],
  parentTitle?: string,
): ExtendedMindMapNode | null {
  for (const node of nodes) {
    const currentPath = parentTitle ? [...path, parentTitle] : path

    // 检查节点是否关联了该卡片
    if (node.cardIds && node.cardIds.includes(cardId)) {
      return node
    }

    // 检查子节点
    if (node.children && node.children.length > 0) {
      const found = findNodeByCardId(node.children, cardId, currentPath, node.title)
      if (found) return found
    }
  }
  return null
}

/**
 * 导出脑图数据（包含所有节点和关联）
 */
export async function exportMindMap(mindMapId: string): Promise<{
  id: string
  name: string
  studySetId: string
  layout: MindMapLayout
  nodes: ExtendedMindMapNode[]
  stats: NodeStats
  exportedAt: number
} | null> {
  try {
    const block = await getBlock(mindMapId)
    if (!block) {
      return null
    }

    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }
    const stats = await getMindMapStats(mindMapId)

    return {
      id: mindMapId,
      name: block.content || '未命名脑图',
      studySetId: block['custom-mindmap-study-set-id'] as string || '',
      layout: (block['custom-mindmap-layout'] as MindMapLayout) || 'mindmap',
      nodes,
      stats,
      exportedAt: Date.now(),
    }
  } catch (error) {
    console.error('[exportMindMap] 导出脑图失败:', error)
    return null
  }
}

/**
 * 保存脑图布局设置
 */
export async function saveMindMapLayout(
  mindMapId: string,
  layout: MindMapLayout,
): Promise<boolean> {
  try {
    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-layout': layout,
      },
    })
    return true
  } catch (error) {
    console.error('[saveMindMapLayout] 保存脑图布局失败:', error)
    return false
  }
}

/**
 * 加载脑图布局设置
 */
export async function loadMindMapLayout(
  mindMapId: string,
): Promise<MindMapLayout> {
  try {
    const block = await getBlock(mindMapId)
    if (!block) {
      return 'mindmap'
    }
    return (block['custom-mindmap-layout'] as MindMapLayout) || 'mindmap'
  } catch (error) {
    console.error('[loadMindMapLayout] 加载脑图布局失败:', error)
    return 'mindmap'
  }
}

/**
 * 获取所有支持的布局类型
 */
export function getSupportedLayouts(): Array<{
  value: MindMapLayout
  label: string
  icon: string
  description: string
}> {
  return [
    {
      value: 'mindmap',
      label: '思维导图',
      icon: '🧠',
      description: '经典的放射状思维导图，适合发散性思考',
    },
    {
      value: 'tree',
      label: '树状图',
      icon: '🌳',
      description: '自上而下的树形结构，适合层级分明的内容',
    },
    {
      value: 'fishbone',
      label: '鱼骨图',
      icon: '🐟',
      description: '鱼骨形状，适合因果分析和问题诊断',
    },
    {
      value: 'timeline',
      label: '时间轴',
      icon: '📅',
      description: '线性时间轴，适合展示事件发展脉络',
    },
    {
      value: 'vertical',
      label: '垂直图',
      icon: '⬇️',
      description: '垂直向下展开，适合纵向对比',
    },
  ]
}

/**
 * 获取布局配置
 */
export function getLayoutConfig(layout: MindMapLayout): {
  direction: string
  spacingHorizontal: number
  spacingVertical: number
  nodeMinHeight: number
  paddingX: number
  paddingY: number
  lineWidth: number
  lineCurve: number
  fishbone?: boolean
  timeline?: boolean
} {
  const configs: Record<MindMapLayout, any> = {
    mindmap: {
      direction: 'right',
      spacingHorizontal: 120,
      spacingVertical: 12,
      nodeMinHeight: 24,
      paddingX: 20,
      paddingY: 10,
      lineWidth: 2,
      lineCurve: 0.5,
    },
    tree: {
      direction: 'down',
      spacingHorizontal: 50,
      spacingVertical: 60,
      nodeMinHeight: 24,
      paddingX: 24,
      paddingY: 8,
      lineWidth: 1.5,
      lineCurve: 0.3,
    },
    fishbone: {
      direction: 'right',
      spacingHorizontal: 80,
      spacingVertical: 40,
      nodeMinHeight: 28,
      paddingX: 20,
      paddingY: 12,
      lineWidth: 2,
      lineCurve: 0.2,
      fishbone: true,
    },
    timeline: {
      direction: 'right',
      spacingHorizontal: 150,
      spacingVertical: 60,
      nodeMinHeight: 32,
      paddingX: 16,
      paddingY: 10,
      lineWidth: 3,
      lineCurve: 0,
      timeline: true,
    },
    vertical: {
      direction: 'down',
      spacingHorizontal: 40,
      spacingVertical: 50,
      nodeMinHeight: 22,
      paddingX: 20,
      paddingY: 8,
      lineWidth: 1.5,
      lineCurve: 0.4,
    },
  }

  return configs[layout] || configs.mindmap
}

/**
 * 脑图演示模式数据
 */
export interface MindMapPresentationStep {
  /** 步骤序号 */
  stepIndex: number
  /** 展开的节点 ID 列表 */
  expandedNodeIds: string[]
  /** 当前聚焦的节点 ID */
  focusedNodeId?: string
  /** 步骤说明 */
  description?: string
}

/**
 * 脑图演示模式配置
 */
export interface MindMapPresentation {
  /** 演示 ID */
  id: string
  /** 演示名称 */
  name: string
  /** 脑图 ID */
  mindMapId: string
  /** 演示步骤列表 */
  steps: MindMapPresentationStep[]
  /** 当前步骤索引 */
  currentStepIndex: number
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 节点编号配置
 */
export interface NodeNumberingConfig {
  /** 是否启用编号 */
  enabled: boolean
  /** 编号格式：'1' | '1.1' | '1.1.1' | 'A' | 'A.1' */
  format: 'numeric' | 'decimal' | 'alpha' | 'alpha-numeric'
  /** 编号前缀 */
  prefix?: string
  /** 编号后缀 */
  suffix?: string
  /** 是否包含根节点 */
  includeRoot: boolean
}

/**
 * 生成节点编号（递归）
 */
export function generateNodeNumbers(
  nodes: ExtendedMindMapNode[],
  config: NodeNumberingConfig,
  parentNumber: string = '',
): ExtendedMindMapNode[] {
  if (!config.enabled) {
    return nodes
  }

  return nodes.map((node, index) => {
    const nodeCopy: ExtendedMindMapNode = { ...node }

    // 生成当前节点的编号
    let nodeNumber = ''

    switch (config.format) {
      case 'numeric':
        // 简单数字：1, 2, 3...
        nodeNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`
        break
      case 'decimal':
        // 十进制：1.0, 1.1, 1.2...
        nodeNumber = parentNumber ? `${parentNumber}.${index}` : `${index}`
        break
      case 'alpha':
        // 字母：A, B, C...
        const letter = String.fromCharCode(65 + index)
        nodeNumber = parentNumber ? `${parentNumber}.${letter}` : letter
        break
      case 'alpha-numeric':
        // 混合：A1, A2, B1, B2...
        const parentLetter = parentNumber ? parentNumber.match(/[A-Z]/)?.[0] || 'A' : 'A'
        const num = parentNumber ? Number.parseInt(parentNumber) || 1 : index + 1
        nodeNumber = parentNumber ? `${parentLetter}${num}` : `${parentLetter}${index + 1}`
        break
    }

    // 添加前缀和后缀
    const fullNumber = `${config.prefix || ''}${nodeNumber}${config.suffix || ''}`

    // 将编号存储到节点数据中
    nodeCopy.number = fullNumber
    nodeCopy.numberingConfig = config

    // 递归处理子节点
    if (nodeCopy.children && nodeCopy.children.length > 0) {
      nodeCopy.children = generateNodeNumbers(nodeCopy.children, config, nodeNumber)
    }

    return nodeCopy
  })
}

/**
 * 保存节点编号配置
 */
export async function saveNodeNumberingConfig(
  mindMapId: string,
  config: NodeNumberingConfig,
): Promise<boolean> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }

    // 生成编号
    const numberedNodes = generateNodeNumbers(nodes, config)

    // 保存节点数据和编号配置
    const mindMapData = JSON.stringify({
      nodes: numberedNodes,
      numberingConfig: config,
      updatedAt: Date.now(),
    })

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-data': mindMapData,
        'custom-mindmap-numbering': JSON.stringify(config),
      },
    })

    return true
  } catch (error) {
    console.error('[saveNodeNumberingConfig] 保存节点编号配置失败:', error)
    return false
  }
}

/**
 * 加载节点编号配置
 */
export async function loadNodeNumberingConfig(
  mindMapId: string,
): Promise<NodeNumberingConfig | null> {
  try {
    const block = await getBlock(mindMapId)
    if (!block) {
      return null
    }

    const configStr = block['custom-mindmap-numbering'] as string
    if (!configStr) {
      return null
    }

    return JSON.parse(configStr) as NodeNumberingConfig
  } catch (error) {
    console.error('[loadNodeNumberingConfig] 加载节点编号配置失败:', error)
    return null
  }
}

/**
 * 创建演示模式
 */
export async function createPresentation(
  mindMapId: string,
  name: string,
): Promise<MindMapPresentation> {
  const presentation: MindMapPresentation = {
    id: `pres_${Date.now()}`,
    name,
    mindMapId,
    steps: [],
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // 保存到块属性
  await updateBlockAttrs({
    id: mindMapId,
    attrs: {
      'custom-mindmap-presentation': JSON.stringify(presentation),
    },
  })

  return presentation
}

/**
 * 加载演示模式
 */
export async function loadPresentation(
  mindMapId: string,
): Promise<MindMapPresentation | null> {
  try {
    const block = await getBlock(mindMapId)
    if (!block) {
      return null
    }

    const presentationStr = block['custom-mindmap-presentation'] as string
    if (!presentationStr) {
      return null
    }

    return JSON.parse(presentationStr) as MindMapPresentation
  } catch (error) {
    console.error('[loadPresentation] 加载演示模式失败:', error)
    return null
  }
}

/**
 * 添加演示步骤
 */
export async function addPresentationStep(
  mindMapId: string,
  step: Omit<MindMapPresentationStep, 'stepIndex'>,
): Promise<boolean> {
  try {
    const presentation = await loadPresentation(mindMapId)
    if (!presentation) {
      return false
    }

    const newStep: MindMapPresentationStep = {
      ...step,
      stepIndex: presentation.steps.length,
    }

    presentation.steps.push(newStep)
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return true
  } catch (error) {
    console.error('[addPresentationStep] 添加演示步骤失败:', error)
    return false
  }
}

/**
 * 删除演示步骤
 */
export async function removePresentationStep(
  mindMapId: string,
  stepIndex: number,
): Promise<boolean> {
  try {
    const presentation = await loadPresentation(mindMapId)
    if (!presentation) {
      return false
    }

    presentation.steps = presentation.steps.filter((s) => s.stepIndex !== stepIndex)

    // 重新索引步骤
    presentation.steps = presentation.steps.map((s, i) => ({
      ...s,
      stepIndex: i,
    }))
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return true
  } catch (error) {
    console.error('[removePresentationStep] 删除演示步骤失败:', error)
    return false
  }
}

/**
 * 更新演示步骤
 */
export async function updatePresentationStep(
  mindMapId: string,
  stepIndex: number,
  updates: Partial<MindMapPresentationStep>,
): Promise<boolean> {
  try {
    const presentation = await loadPresentation(mindMapId)
    if (!presentation) {
      return false
    }

    const step = presentation.steps.find((s) => s.stepIndex === stepIndex)
    if (!step) {
      return false
    }

    Object.assign(step, updates)
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return true
  } catch (error) {
    console.error('[updatePresentationStep] 更新演示步骤失败:', error)
    return false
  }
}

/**
 * 设置当前演示步骤
 */
export async function setCurrentPresentationStep(
  mindMapId: string,
  stepIndex: number,
): Promise<boolean> {
  try {
    const presentation = await loadPresentation(mindMapId)
    if (!presentation) {
      return false
    }

    presentation.currentStepIndex = stepIndex
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return true
  } catch (error) {
    console.error('[setCurrentPresentationStep] 设置当前演示步骤失败:', error)
    return false
  }
}

/**
 * 获取当前演示步骤
 */
export async function getCurrentPresentationStep(
  mindMapId: string,
): Promise<MindMapPresentationStep | null> {
  const presentation = await loadPresentation(mindMapId)
  if (!presentation || presentation.steps.length === 0) {
    return null
  }

  return presentation.steps[presentation.currentStepIndex] || null
}

/**
 * 下一步
 */
export async function nextPresentationStep(
  mindMapId: string,
): Promise<MindMapPresentationStep | null> {
  const presentation = await loadPresentation(mindMapId)
  if (!presentation) {
    return null
  }

  if (presentation.currentStepIndex < presentation.steps.length - 1) {
    presentation.currentStepIndex++
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return presentation.steps[presentation.currentStepIndex]
  }

  return presentation.steps[presentation.steps.length - 1]
}

/**
 * 上一步
 */
export async function previousPresentationStep(
  mindMapId: string,
): Promise<MindMapPresentationStep | null> {
  const presentation = await loadPresentation(mindMapId)
  if (!presentation) {
    return null
  }

  if (presentation.currentStepIndex > 0) {
    presentation.currentStepIndex--
    presentation.updatedAt = Date.now()

    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return presentation.steps[presentation.currentStepIndex]
  }

  return presentation.steps[0]
}

/**
 * 删除演示模式
 */
export async function deletePresentation(
  mindMapId: string,
): Promise<boolean> {
  try {
    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': '',
      },
    })

    return true
  } catch (error) {
    console.error('[deletePresentation] 删除演示模式失败:', error)
    return false
  }
}

/**
 * 自动生成演示步骤（从脑图结构）
 */
export async function autoGeneratePresentation(
  mindMapId: string,
  name: string,
  options: {
    /** 按深度生成步骤 */
    byDepth: boolean
    /** 按分支生成步骤 */
    byBranch: boolean
    /** 每步最大节点数 */
    maxNodesPerStep: number
  } = {
    byDepth: true,
    byBranch: false,
    maxNodesPerStep: 10,
  },
): Promise<MindMapPresentation | null> {
  try {
    const { nodes } = await loadNodePositions(mindMapId) || { nodes: [] }
    if (nodes.length === 0) {
      return null
    }

    const presentation: MindMapPresentation = {
      id: `pres_${Date.now()}`,
      name,
      mindMapId,
      steps: [],
      currentStepIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // 按深度生成步骤
    if (options.byDepth) {
      const depthSteps = generateStepsByDepth(nodes, options.maxNodesPerStep)
      presentation.steps.push(...depthSteps)
    }

    // 按分支生成步骤
    if (options.byBranch) {
      const branchSteps = generateStepsByBranch(nodes, options.maxNodesPerStep)
      presentation.steps.push(...branchSteps)
    }

    // 如果没有生成步骤，创建一个默认步骤
    if (presentation.steps.length === 0) {
      presentation.steps.push({
        stepIndex: 0,
        expandedNodeIds: nodes.map((n) => n.id),
        description: '显示所有节点',
      })
    }

    // 保存演示模式
    await updateBlockAttrs({
      id: mindMapId,
      attrs: {
        'custom-mindmap-presentation': JSON.stringify(presentation),
      },
    })

    return presentation
  } catch (error) {
    console.error('[autoGeneratePresentation] 自动生成演示失败:', error)
    return null
  }
}

/**
 * 按深度生成步骤
 */
function generateStepsByDepth(
  nodes: ExtendedMindMapNode[],
  maxNodesPerStep: number,
): MindMapPresentationStep[] {
  const steps: MindMapPresentationStep[] = []
  const maxDepth = getMaxDepth(nodes)

  for (let depth = 1; depth <= maxDepth; depth++) {
    const nodeIdsAtDepth = getNodeIdsAtDepth(nodes, depth)

    if (nodeIdsAtDepth.length > 0) {
      steps.push({
        stepIndex: steps.length,
        expandedNodeIds: nodeIdsAtDepth,
        focusedNodeId: nodeIdsAtDepth[0],
        description: `第 ${depth} 层节点（共${nodeIdsAtDepth.length}个）`,
      })
    }
  }

  return steps
}

/**
 * 按分支生成步骤
 */
function generateStepsByBranch(
  nodes: ExtendedMindMapNode[],
  maxNodesPerStep: number,
): MindMapPresentationStep[] {
  const steps: MindMapPresentationStep[] = []

  const collectBranch = (nodeList: ExtendedMindMapNode[], path: string[]) => {
    for (const node of nodeList) {
      const currentPath = [...path, node.title]

      // 如果是叶子节点或达到最大节点数，创建一个步骤
      if (!node.children || node.children.length === 0) {
        steps.push({
          stepIndex: steps.length,
          expandedNodeIds: [node.id],
          focusedNodeId: node.id,
          description: `分支：${currentPath.join(' → ')}`,
        })
      } else {
        // 递归处理子节点
        collectBranch(node.children, currentPath)
      }
    }
  }

  collectBranch(nodes, [])

  return steps
}

/**
 * 获取脑图最大深度
 */
function getMaxDepth(nodes: ExtendedMindMapNode[]): number {
  let maxDepth = 0

  const calculateDepth = (nodeList: ExtendedMindMapNode[], depth: number) => {
    for (const node of nodeList) {
      if (depth > maxDepth) {
        maxDepth = depth
      }
      if (node.children && node.children.length > 0) {
        calculateDepth(node.children, depth + 1)
      }
    }
  }

  calculateDepth(nodes, 1)
  return maxDepth
}

/**
 * 获取指定深度的节点 ID 列表
 */
function getNodeIdsAtDepth(
  nodes: ExtendedMindMapNode[],
  targetDepth: number,
): string[] {
  const nodeIds: string[] = []

  const collectAtDepth = (nodeList: ExtendedMindMapNode[], depth: number) => {
    for (const node of nodeList) {
      if (depth === targetDepth) {
        nodeIds.push(node.id)
      } else if (node.children && node.children.length > 0) {
        collectAtDepth(node.children, depth + 1)
      }
    }
  }

  collectAtDepth(nodes, targetDepth)
  return nodeIds
}

/**
 * 导出服务对象
 */
export const mindmapEnhanceService = {
  // 坐标持久化
  saveNodePositions,
  loadNodePositions,
  saveViewport,

  // 多卡片关联
  addNodeCard,
  removeNodeCard,
  getNodeCards,

  // 反向链接
  getCardBacklinks,
  getNodeBacklinks,

  // 节点样式和备注
  setNodeStyle,
  setNodeNote,

  // 统计
  getMindMapStats,

  // 导出
  exportMindMap,

  // 布局管理
  saveMindMapLayout,
  loadMindMapLayout,
  getSupportedLayouts,
  getLayoutConfig,

  // 节点编号（新增）
  generateNodeNumbers,
  saveNodeNumberingConfig,
  loadNodeNumberingConfig,

  // 演示模式（新增）
  createPresentation,
  loadPresentation,
  addPresentationStep,
  removePresentationStep,
  updatePresentationStep,
  setCurrentPresentationStep,
  getCurrentPresentationStep,
  nextPresentationStep,
  previousPresentationStep,
  deletePresentation,
  autoGeneratePresentation,
}
