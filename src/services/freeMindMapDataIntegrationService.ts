/**
 * 自由画布思维导图数据集成服务
 * @fileoverview 处理自由画布思维导图与现有标注数据的集成
 */

import type { PDFAnnotation } from '@/types/annotation'
import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'
import { getAnnotationsForPdf } from '@/api/annotationApi'
import {
  getBlock,
  postApi,
} from '@/api/siyuanApi'


/**
 * 思维导图块属性名
 */
const MINDMAP_ATTRS = {
  /** 思维导图数据 JSON */
  DATA: 'custom-freemind-data',
  /** 关联的 PDF 路径 */
  PDF_PATH: 'custom-freemind-pdf',
  /** 关联的学习集 ID */
  STUDY_SET_ID: 'custom-freemind-studyset',
  /** 最后同步时间 */
  LAST_SYNC: 'custom-freemind-last-sync',
  /** 思维导图版本 */
  VERSION: 'custom-freemind-version',
  /** === MarginNote 4 兼容性字段 === */
  /** 节点类型（用于单个节点的块属性） */
  NODE_TYPE: 'custom-node-type',
  /** 原始节点 ID（克隆/引用） */
  SOURCE_NODE_ID: 'custom-source-node-id',
  /** 子脑图 ID */
  SUBMAP_ID: 'custom-submap-id',
  /** 是否同步修改 */
  SYNC_CHANGES: 'custom-sync-changes',
}

/**
 * 思维导图数据版本
 */
const MINDMAP_DATA_VERSION = '1.0.0'

/**
 * P0-2: 获取默认思维导图数据
 */
function createDefaultMindMapData(): {
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} {
  return {
    nodes: [],
    edges: [],
    viewport: {
      zoom: 1,
      x: 0,
      y: 0,
    },
    layout: 'free',
  }
}

/**
 * 从思源块属性加载思维导图数据
 * @param blockId 思维导图块 ID
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），直接返回 null，因为临时 ID 不对应真实的思源块
 */
export async function loadMindMapFromBlock(blockId: string): Promise<{
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} | null> {
  console.log('[FreeMindMapDataIntegration] loadMindMapFromBlock 开始, blockId:', blockId)

  // 检查是否是临时 ID（temp- 开头），临时 ID 不对应真实的思源块
  if (blockId.startsWith('temp-')) {
    // Validate temporary ID format: temp-[alphanumeric]+
    const tempIdRegex = /^temp-[a-zA-Z0-9_-]+$/
    if (!tempIdRegex.test(blockId)) {
      console.warn('[FreeMindMapDataIntegration] 无效的临时 ID 格式:', blockId)
      return null
    }
    
    console.log('[FreeMindMapDataIntegration] 临时 ID，从 localStorage 加载数据')
    const storageKey = `freemindmap-data-${blockId}`
    const dataStr = localStorage.getItem(storageKey)
    console.log('[FreeMindMapDataIntegration] localStorage key:', storageKey, 'data 存在:', !!dataStr)
    
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr)
        console.log('[FreeMindMapDataIntegration] 从 localStorage 加载成功，nodes:', data.nodes?.length)
        
        // Validate loaded data structure
        if (!data.nodes || !Array.isArray(data.nodes)) {
          console.warn('[FreeMindMapDataIntegration] localStorage 数据格式无效，使用默认数据')
          return createDefaultMindMapData()
        }
        
        return {
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewport: data.viewport || {
            zoom: 1,
            x: 0,
            y: 0,
          },
          layout: data.layout || 'free',
        }
      } catch (e) {
        console.error('[FreeMindMapDataIntegration] 解析 localStorage 数据失败:', e)
        // Fallback to default data on parse error
        return createDefaultMindMapData()
      }
    }
    
    console.log('[FreeMindMapDataIntegration] localStorage 无数据，返回默认数据')
    return createDefaultMindMapData()
  }

  // 验证块 ID 格式（思源标准格式：20240101120000-abc1234）
  if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
    console.warn('[FreeMindMapDataIntegration] 无效的块 ID 格式:', blockId)
    return null
  }

  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })

    const dataJson = attrs?.[MINDMAP_ATTRS.DATA]
    if (!dataJson) {
      return null
    }

    const data = JSON.parse(dataJson)
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
      viewport: data.viewport || {
        zoom: 1,
        x: 0,
        y: 0,
      },
      layout: data.layout || 'free',
    }
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 加载思维导图数据失败:', error)
    return null
  }
}

/**
 * 保存思维导图数据到思源块属性
 * @param blockId 思维导图块 ID
 * @param data 思维导图数据
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），则保存到 localStorage
 */
export async function saveMindMapToBlock(
  blockId: string,
  data: {
    nodes: FreeMindMapNode[]
    edges: FreeMindMapEdge[]
    viewport: { zoom: number, x: number, y: number }
    layout: 'free' | 'tree' | 'vertical' | 'horizontal'
  },
): Promise<void> {
  try {
    // 检查是否是临时 ID（temp- 开头）
    if (blockId.startsWith('temp-')) {
      // 保存到 localStorage
      const storageKey = `freemindmap-data-${blockId}`
      const dataStr = JSON.stringify(data)
      localStorage.setItem(storageKey, dataStr)
      console.log('[FreeMindMapDataIntegration] 数据已保存到 localStorage:', storageKey)
      return
    }

    // 验证块 ID 格式（思源标准格式）
    if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
      console.warn('[FreeMindMapDataIntegration] 无效的块 ID 格式，保存到 localStorage:', blockId)
      const storageKey = `freemindmap-data-${blockId}`
      localStorage.setItem(storageKey, JSON.stringify(data))
      return
    }

    const attrs: { [key: string]: string } = {
      [MINDMAP_ATTRS.DATA]: JSON.stringify(data),
      [MINDMAP_ATTRS.VERSION]: MINDMAP_DATA_VERSION,
      [MINDMAP_ATTRS.LAST_SYNC]: Date.now().toString(),
    }

    await postApi('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs,
    })
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 保存思维导图数据失败:', error)
    throw error
  }
}

/**
 * 获取思维导图关联的 PDF 路径
 * @param blockId 思维导图块 ID
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），则从 localStorage 读取
 */
export async function getMindMapPdfPath(blockId: string): Promise<string | null> {
  // 检查是否是临时 ID
  if (blockId.startsWith('temp-')) {
    const storageKey = `freemindmap-pdf-${blockId}`
    return localStorage.getItem(storageKey)
  }

  // 验证块 ID 格式
  if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
    const storageKey = `freemindmap-pdf-${blockId}`
    return localStorage.getItem(storageKey)
  }

  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })
    return attrs?.[MINDMAP_ATTRS.PDF_PATH] || null
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 获取 PDF 路径失败:', error)
    return null
  }
}

/**
 * 设置思维导图关联的 PDF 路径
 * @param blockId 思维导图块 ID
 * @param pdfPath PDF 路径
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），则保存到 localStorage
 */
export async function setMindMapPdfPath(blockId: string, pdfPath: string): Promise<void> {
  // 检查是否是临时 ID
  if (blockId.startsWith('temp-')) {
    const storageKey = `freemindmap-pdf-${blockId}`
    localStorage.setItem(storageKey, pdfPath)
    console.log('[FreeMindMapDataIntegration] PDF 路径已保存到 localStorage:', storageKey)
    return
  }

  // 验证块 ID 格式
  if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
    const storageKey = `freemindmap-pdf-${blockId}`
    localStorage.setItem(storageKey, pdfPath)
    return
  }

  try {
    await postApi('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs: {
        [MINDMAP_ATTRS.PDF_PATH]: pdfPath,
      },
    })
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 设置 PDF 路径失败:', error)
    throw error
  }
}

/**
 * 从 PDF 标注自动生成思维导图节点
 * @param pdfPath PDF 路径
 * @param blockId 思维导图块 ID
 */
export async function generateMindMapFromPdfAnnotations(
  pdfPath: string,
  blockId: string,
): Promise<FreeMindMapNode[]> {
  // 获取 PDF 的所有标注
  const annotations = await getAnnotationsForPdf(pdfPath)

  if (annotations.length === 0) {
    return []
  }

  // 将标注转换为思维导图节点
  const nodes: FreeMindMapNode[] = []
  const edges: FreeMindMapEdge[] = []

  // 创建根节点
  const rootNode: FreeMindMapNode = {
    id: `root-${Date.now()}`,
    type: 'textCard',
    data: {
      title: 'PDF 标注思维导图',
      content: `共 ${annotations.length} 个标注`,
      level: 'title',
      color: '#409eff',
    },
    position: {
      x: 0,
      y: 0,
    },
  }
  nodes.push(rootNode)

  // 按页码分组标注
  const annotationsByPage = new Map<number, PDFAnnotation[]>()
  for (const ann of annotations) {
    const pageAnns = annotationsByPage.get(ann.page) || []
    pageAnns.push(ann)
    annotationsByPage.set(ann.page, pageAnns)
  }

  // 为每个页码创建分组节点
  let yOffset = 150
  const pageNodes: FreeMindMapNode[] = []

  for (const [page, pageAnns] of annotationsByPage.entries()) {
    const pageNode: FreeMindMapNode = {
      id: `page-${page}`,
      type: 'group',
      data: {
        title: `第 ${page} 页`,
        content: `${pageAnns.length} 个标注`,
        level: 'h1',
        color: '#67c23a',
      },
      position: {
        x: 300,
        y: yOffset,
      },
    }
    pageNodes.push(pageNode)
    yOffset += 200

    // 为每个标注创建卡片节点
    let cardOffset = 0
    for (const ann of pageAnns) {
      const cardNode: FreeMindMapNode = {
        id: `card-${ann.id}`,
        type: 'textCard',
        data: {
          title: (ann.text || '[图片]').slice(0, 50) + ((ann.text?.length || 0) > 50 ? '...' : ''),
          content: ann.text || '',
          level: ann.level || 'text',
          color: ann.color || 'yellow',
          annotationId: ann.id,
          page: ann.page,
          pdfPath: ann.pdfPath,
          rect: ann.rect,
        },
        position: {
          x: 500,
          y: yOffset + cardOffset * 80,
        },
      }
      nodes.push(cardNode)

      // 创建连线：页码节点 -> 卡片节点
      edges.push({
        id: `edge-page-${page}-card-${ann.id}`,
        source: pageNode.id,
        target: cardNode.id,
        type: 'default',
      })

      cardOffset++
    }

    // 创建连线：根节点 -> 页码节点
    edges.push({
      id: `edge-root-page-${page}`,
      source: rootNode.id,
      target: pageNode.id,
      type: 'default',
    })
  }

  nodes.push(...pageNodes)

  // 保存思维导图数据
  await saveMindMapToBlock(blockId, {
    nodes,
    edges,
    viewport: {
      zoom: 1,
      x: 0,
      y: 0,
    },
    layout: 'free',
  })

  // 设置关联的 PDF 路径
  await setMindMapPdfPath(blockId, pdfPath)

  return nodes
}

/**
 * 同步思维导图节点到思源标注
 * @param blockId 思维导图块 ID
 * @param nodes 思维导图节点
 *
 * 实现说明：
 * 1. 遍历所有节点，查找关联的 annotationId/cardId
 * 2. 更新思源块的内容和属性
 * 3. 确保脑图和 PDF 标注数据一致
 */
export async function syncMindMapToAnnotations(
  blockId: string,
  nodes: FreeMindMapNode[],
): Promise<void> {
  try {
    console.log('[同步服务] 开始同步脑图到标注，节点数量:', nodes.length)

    // 遍历所有节点
    for (const node of nodes) {
      // 如果有 annotationId，更新对应的思源块
      if (node.data.annotationId) {
        await syncNodeToAnnotation(node)
      }

      // 如果有 cardId，更新对应的卡片块
      if (node.data.cardId) {
        await syncNodeToCard(node)
      }
    }

    // 更新最后同步时间
    await postApi('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs: {
        [MINDMAP_ATTRS.LAST_SYNC]: Date.now().toString(),
      },
    })

    console.log('[同步服务] 同步完成')
  } catch (error) {
    console.error('[同步服务] 同步失败:', error)
    throw error
  }
}

/**
 * 同步单个节点到标注
 */
async function syncNodeToAnnotation(node: FreeMindMapNode): Promise<void> {
  if (!node.data.annotationId) return

  try {
    // 获取标注块信息
    const block = await getBlock({ id: node.data.annotationId })
    if (!block) {
      console.warn('[同步服务] 标注块不存在:', node.data.annotationId)
      return
    }

    // 更新标注内容（如果需要）
    const content = node.data.content || node.data.title
    if (content && content !== (block as any).content) {
      await postApi('/api/block/updateBlock', {
        blockID: node.data.annotationId,
        data: content,
      })
    }

    // 更新标注属性（颜色、级别等）
    const attrs: Record<string, string> = {}
    if (node.data.color) {
      attrs['custom-color'] = node.data.color
    }
    if (node.data.level) {
      attrs['custom-level'] = node.data.level
    }

    if (Object.keys(attrs).length > 0) {
      await postApi('/api/attr/setBlockAttrs', {
        id: node.data.annotationId,
        attrs,
      })
    }

    console.log('[同步服务] 节点同步到标注:', node.id, '->', node.data.annotationId)
  } catch (error) {
    console.error('[同步服务] 同步节点到标注失败:', error)
  }
}

/**
 * 同步单个节点到卡片
 */
async function syncNodeToCard(node: FreeMindMapNode): Promise<void> {
  if (!node.data.cardId) return

  try {
    // 获取卡片块信息
    const block = await getBlock({ id: node.data.cardId })
    if (!block) {
      console.warn('[同步服务] 卡片块不存在:', node.data.cardId)
      return
    }

    // 更新卡片内容
    const content = node.data.content || node.data.title
    if (content && content !== (block as any).content) {
      await postApi('/api/block/updateBlock', {
        blockID: node.data.cardId,
        data: content,
      })
    }

    console.log('[同步服务] 节点同步到卡片:', node.id, '->', node.data.cardId)
  } catch (error) {
    console.error('[同步服务] 同步节点到卡片失败:', error)
  }
}

/**
 * 获取思维导图关联的学习集 ID
 * @param blockId 思维导图块 ID
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），则从 localStorage 读取
 */
export async function getMindMapStudySetId(blockId: string): Promise<string | null> {
  // 检查是否是临时 ID
  if (blockId.startsWith('temp-')) {
    const storageKey = `freemindmap-studyset-${blockId}`
    return localStorage.getItem(storageKey)
  }

  // 验证块 ID 格式
  if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
    const storageKey = `freemindmap-studyset-${blockId}`
    return localStorage.getItem(storageKey)
  }

  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })
    return attrs?.[MINDMAP_ATTRS.STUDY_SET_ID] || null
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 获取学习集 ID 失败:', error)
    return null
  }
}

/**
 * 设置思维导图关联的学习集 ID
 * @param blockId 思维导图块 ID
 * @param studySetId 学习集 ID
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），则保存到 localStorage
 */
export async function setMindMapStudySetId(blockId: string, studySetId: string): Promise<void> {
  // 检查是否是临时 ID
  if (blockId.startsWith('temp-')) {
    const storageKey = `freemindmap-studyset-${blockId}`
    localStorage.setItem(storageKey, studySetId)
    console.log('[FreeMindMapDataIntegration] 学习集 ID 已保存到 localStorage:', storageKey)
    return
  }

  // 验证块 ID 格式
  if (!/^\d{14}-[a-z0-9]{7}$/.test(blockId)) {
    const storageKey = `freemindmap-studyset-${blockId}`
    localStorage.setItem(storageKey, studySetId)
    return
  }

  try {
    await postApi('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs: {
        [MINDMAP_ATTRS.STUDY_SET_ID]: studySetId,
      },
    })
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 设置学习集 ID 失败:', error)
    throw error
  }
}

/**
 * 从思维导图数据中提取所有关联的标注 ID
 * @param nodes 思维导图节点
 */
export function extractAnnotationIdsFromMindMap(nodes: FreeMindMapNode[]): string[] {
  const ids = new Set<string>()
  for (const node of nodes) {
    if (node.data.annotationId) {
      ids.add(node.data.annotationId)
    }
  }
  return Array.from(ids)
}

/**
 * 检查思维导图节点是否有关联的标注
 * @param node 思维导图节点
 */
export function hasAnnotation(node: FreeMindMapNode): boolean {
  return !!node.data.annotationId
}

/**
 * 获取思维导图节点关联的标注内容
 * @param node 思维导图节点
 */
export function getAnnotationContent(node: FreeMindMapNode): string | null {
  return node.data.content || node.data.title || null
}

/**
 * 创建默认思维导图数据（用于降级处理）
 */
function createDefaultMindMapData(): {
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} {
  return {
    nodes: [],
    edges: [],
    viewport: {
      zoom: 1,
      x: 0,
      y: 0,
    },
    layout: 'free',
  }
}
