/**
 * 多画布与图层系统服务
 * @fileoverview 封装画布、图层的数据操作和思源 API 交互
 */

import type {
  CanvasConfig,
  LayerConfig,
  CanvasReference,
  CrossCanvasNodeLink,
  CreateCanvasParams,
  UpdateCanvasParams,
  UpdateLayerParams,
  CanvasStats,
  CanvasListItem
} from '@/types/canvas'
import type { FreeMindMapNode, FreeMindMapEdge } from '@/types/mindmapFree'
import { sql, createBlock, updateBlock, getBlock } from '@/api'

/**
 * 画布数据块属性键名
 */
const CANVAS_DATA_KEY = 'custom-canvas-data'
const CANVAS_LAYERS_KEY = 'custom-canvas-layers'
const CANVAS_REFERENCES_KEY = 'custom-canvas-references'
const CANVAS_LINKS_KEY = 'custom-canvas-links'

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 获取当前时间戳
 */
function now(): number {
  return Date.now()
}

/**
 * 创建默认图层配置
 */
function createDefaultLayers(): LayerConfig[] {
  return [
    {
      id: 'layer-background',
      name: '背景层',
      type: 'background',
      visible: true,
      locked: false,
      order: 0,
      opacity: 1,
      color: '#e0e0e0'
    },
    {
      id: 'layer-nodes',
      name: '节点层',
      type: 'nodes',
      visible: true,
      locked: false,
      order: 1,
      opacity: 1,
      color: '#409eff'
    },
    {
      id: 'layer-annotations',
      name: '标注层',
      type: 'annotations',
      visible: true,
      locked: false,
      order: 2,
      opacity: 0.8,
      color: '#67c23a'
    },
    {
      id: 'layer-handwriting',
      name: '手绘层',
      type: 'handwriting',
      visible: true,
      locked: false,
      order: 3,
      opacity: 1,
      color: '#e6a23c'
    }
  ]
}

/**
 * 创建新画布
 * @param params 创建参数
 * @returns 画布配置
 */
export async function createCanvas(params: CreateCanvasParams): Promise<CanvasConfig> {
  const canvasId = generateId()
  const timestamp = now()

  const canvas: CanvasConfig = {
    id: canvasId,
    name: params.name,
    studySetId: params.studySetId,
    pdfDocId: params.pdfDocId,
    layout: params.layout || 'free',
    nodes: [],
    edges: [],
    layers: createDefaultLayers(),
    viewport: {
      zoom: 1,
      x: 0,
      y: 0
    },
    showGrid: true,
    backgroundColor: params.backgroundColor || '#ffffff',
    createdAt: timestamp,
    updatedAt: timestamp
  }

  // 保存到思源块属性
  await saveCanvasToBlock(canvas)

  return canvas
}

/**
 * 获取画布配置
 * @param canvasId 画布 ID
 * @returns 画布配置
 */
export async function getCanvas(canvasId: string): Promise<CanvasConfig | null> {
  try {
    // 尝试从思源块属性加载
    const block = await getBlock(canvasId)
    if (!block) {
      return null
    }

    const attrs = block.attrs || {}
    const dataStr = attrs[CANVAS_DATA_KEY]

    if (!dataStr) {
      return null
    }

    return JSON.parse(dataStr)
  } catch (error) {
    console.error('[CanvasService] 获取画布失败:', error)
    return null
  }
}

/**
 * 获取所有画布列表
 * @param studySetId 学习集 ID（可选，用于筛选）
 * @returns 画布列表项列表
 */
export async function getAllCanvases(studySetId?: string): Promise<CanvasListItem[]> {
  try {
    // 查询所有画布块
    const sqlQuery = `
      SELECT * FROM blocks
      WHERE type = 'p'
        AND attrs LIKE '%${CANVAS_DATA_KEY}%'
    `

    const result = await sql({ sql: sqlQuery })
    const items: CanvasListItem[] = []

    if (result && result.code === 0 && result.data) {
      for (const block of result.data) {
        const attrs = block.attrs || {}
        const dataStr = attrs[CANVAS_DATA_KEY]

        if (dataStr) {
          try {
            const canvas: CanvasConfig = JSON.parse(dataStr)

            // 如果指定了学习集 ID，进行筛选
            if (studySetId && canvas.studySetId !== studySetId) {
              continue
            }

            items.push({
              id: canvas.id,
              name: canvas.name,
              studySetId: canvas.studySetId,
              pdfPath: canvas.pdfDocId,
              nodeCount: canvas.nodes?.length || 0,
              lastUpdatedAt: canvas.updatedAt,
              isActive: false
            })
          } catch (e) {
            console.error('[CanvasService] 解析画布数据失败:', e)
          }
        }
      }
    }

    // 按更新时间排序
    items.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)

    return items
  } catch (error) {
    console.error('[CanvasService] 获取画布列表失败:', error)
    return []
  }
}

/**
 * 更新画布配置
 * @param params 更新参数
 * @returns 是否成功
 */
export async function updateCanvas(params: UpdateCanvasParams): Promise<boolean> {
  try {
    const existingCanvas = await getCanvas(params.id)
    if (!existingCanvas) {
      console.error('[CanvasService] 画布不存在:', params.id)
      return false
    }

    const updatedCanvas: CanvasConfig = {
      ...existingCanvas,
      name: params.name ?? existingCanvas.name,
      layout: params.layout ?? existingCanvas.layout,
      nodes: params.nodes ?? existingCanvas.nodes,
      edges: params.edges ?? existingCanvas.edges,
      viewport: params.viewport ?? existingCanvas.viewport,
      layers: params.layers ?? existingCanvas.layers,
      updatedAt: now()
    }

    await saveCanvasToBlock(updatedCanvas)
    return true
  } catch (error) {
    console.error('[CanvasService] 更新画布失败:', error)
    return false
  }
}

/**
 * 删除画布
 * @param canvasId 画布 ID
 * @returns 是否成功
 */
export async function deleteCanvas(canvasId: string): Promise<boolean> {
  try {
    // 删除思源块
    const result = await sql({
      sql: `DELETE FROM blocks WHERE id = '${canvasId}'`
    })

    return result?.code === 0
  } catch (error) {
    console.error('[CanvasService] 删除画布失败:', error)
    return false
  }
}

/**
 * 保存画布到思源块属性
 * @param canvas 画布配置
 */
async function saveCanvasToBlock(canvas: CanvasConfig): Promise<void> {
  const data = {
    id: canvas.id,
    name: canvas.name,
    studySetId: canvas.studySetId,
    pdfDocId: canvas.pdfDocId,
    layout: canvas.layout,
    nodes: canvas.nodes,
    edges: canvas.edges,
    viewport: canvas.viewport,
    showGrid: canvas.showGrid,
    backgroundColor: canvas.backgroundColor,
    createdAt: canvas.createdAt,
    updatedAt: canvas.updatedAt
  }

  const layersData = canvas.layers

  try {
    // 检查块是否存在
    const existingBlock = await getBlock(canvas.id)

    if (existingBlock) {
      // 更新现有块
      await updateBlock({
        id: canvas.id,
        attrs: {
          [CANVAS_DATA_KEY]: JSON.stringify(data),
          [CANVAS_LAYERS_KEY]: JSON.stringify(layersData),
          'custom-canvas-name': canvas.name,
          'custom-canvas-studyset': canvas.studySetId
        }
      })
    } else {
      // 创建新块
      await createBlock({
        data: {
          id: canvas.id,
          content: `画布：${canvas.name}`,
          type: 'p',
          attrs: {
            [CANVAS_DATA_KEY]: JSON.stringify(data),
            [CANVAS_LAYERS_KEY]: JSON.stringify(layersData),
            'custom-canvas-name': canvas.name,
            'custom-canvas-studyset': canvas.studySetId
          }
        }
      })
    }
  } catch (error) {
    console.error('[CanvasService] 保存画布到块属性失败:', error)
    throw error
  }
}

/**
 * 获取画布的图层配置
 * @param canvasId 画布 ID
 * @returns 图层配置列表
 */
export async function getCanvasLayers(canvasId: string): Promise<LayerConfig[]> {
  try {
    const block = await getBlock(canvasId)
    if (!block) {
      return createDefaultLayers()
    }

    const attrs = block.attrs || {}
    const layersStr = attrs[CANVAS_LAYERS_KEY]

    if (!layersStr) {
      return createDefaultLayers()
    }

    return JSON.parse(layersStr)
  } catch (error) {
    console.error('[CanvasService] 获取图层配置失败:', error)
    return createDefaultLayers()
  }
}

/**
 * 更新图层配置
 * @param canvasId 画布 ID
 * @param layerParams 图层更新参数
 * @returns 是否成功
 */
export async function updateLayer(
  canvasId: string,
  layerParams: UpdateLayerParams
): Promise<boolean> {
  try {
    const layers = await getCanvasLayers(canvasId)
    const layerIndex = layers.findIndex(l => l.id === layerParams.id)

    if (layerIndex === -1) {
      console.error('[CanvasService] 图层不存在:', layerParams.id)
      return false
    }

    layers[layerIndex] = {
      ...layers[layerIndex],
      name: layerParams.name ?? layers[layerIndex].name,
      visible: layerParams.visible ?? layers[layerIndex].visible,
      locked: layerParams.locked ?? layers[layerIndex].locked,
      order: layerParams.order ?? layers[layerIndex].order,
      opacity: layerParams.opacity ?? layers[layerIndex].opacity
    }

    // 按 order 排序
    layers.sort((a, b) => a.order - b.order)

    // 保存更新后的图层配置
    const block = await getBlock(canvasId)
    if (block) {
      await updateBlock({
        id: canvasId,
        attrs: {
          [CANVAS_LAYERS_KEY]: JSON.stringify(layers)
        }
      })
    }

    return true
  } catch (error) {
    console.error('[CanvasService] 更新图层失败:', error)
    return false
  }
}

/**
 * 添加新图层
 * @param canvasId 画布 ID
 * @param layer 图层配置
 * @returns 是否成功
 */
export async function addLayer(canvasId: string, layer: Omit<LayerConfig, 'id'>): Promise<boolean> {
  try {
    const layers = await getCanvasLayers(canvasId)

    const newLayer: LayerConfig = {
      ...layer,
      id: generateId()
    }

    layers.push(newLayer)

    // 保存更新后的图层配置
    const block = await getBlock(canvasId)
    if (block) {
      await updateBlock({
        id: canvasId,
        attrs: {
          [CANVAS_LAYERS_KEY]: JSON.stringify(layers)
        }
      })
    }

    return true
  } catch (error) {
    console.error('[CanvasService] 添加图层失败:', error)
    return false
  }
}

/**
 * 删除图层
 * @param canvasId 画布 ID
 * @param layerId 图层 ID
 * @returns 是否成功
 */
export async function deleteLayer(canvasId: string, layerId: string): Promise<boolean> {
  try {
    const layers = await getCanvasLayers(canvasId)
    const filteredLayers = layers.filter(l => l.id !== layerId)

    if (filteredLayers.length === layers.length) {
      return false // 图层不存在
    }

    // 保存更新后的图层配置
    const block = await getBlock(canvasId)
    if (block) {
      await updateBlock({
        id: canvasId,
        attrs: {
          [CANVAS_LAYERS_KEY]: JSON.stringify(filteredLayers)
        }
      })
    }

    return true
  } catch (error) {
    console.error('[CanvasService] 删除图层失败:', error)
    return false
  }
}

/**
 * 获取画布统计信息
 * @param canvasId 画布 ID
 * @returns 统计信息
 */
export async function getCanvasStats(canvasId: string): Promise<CanvasStats | null> {
  try {
    const canvas = await getCanvas(canvasId)
    if (!canvas) {
      return null
    }

    const visibleLayers = canvas.layers.filter(l => l.visible)
    const lockedLayers = canvas.layers.filter(l => l.locked)

    return {
      canvasId: canvas.id,
      nodeCount: canvas.nodes.length,
      edgeCount: canvas.edges.length,
      layerCount: canvas.layers.length,
      visibleLayerCount: visibleLayers.length,
      lockedLayerCount: lockedLayers.length,
      lastUpdatedAt: canvas.updatedAt
    }
  } catch (error) {
    console.error('[CanvasService] 获取统计信息失败:', error)
    return null
  }
}

/**
 * 创建画布引用
 * @param sourceCanvasId 源画布 ID
 * @param targetCanvasId 目标画布 ID
 * @param nodeIds 引用的节点 ID 列表
 * @param referenceType 引用类型
 * @returns 画布引用
 */
export async function createCanvasReference(
  sourceCanvasId: string,
  targetCanvasId: string,
  nodeIds: string[],
  referenceType: 'node' | 'layer' | 'all' = 'node'
): Promise<CanvasReference | null> {
  try {
    const reference: CanvasReference = {
      id: generateId(),
      sourceCanvasId,
      targetCanvasId,
      nodeIds,
      referenceType,
      createdAt: now()
    }

    // 保存引用到源画布
    const sourceBlock = await getBlock(sourceCanvasId)
    if (sourceBlock) {
      const existingRefsStr = sourceBlock.attrs?.[CANVAS_REFERENCES_KEY]
      const existingRefs: CanvasReference[] = existingRefsStr ? JSON.parse(existingRefsStr) : []
      existingRefs.push(reference)

      await updateBlock({
        id: sourceCanvasId,
        attrs: {
          [CANVAS_REFERENCES_KEY]: JSON.stringify(existingRefs)
        }
      })
    }

    return reference
  } catch (error) {
    console.error('[CanvasService] 创建画布引用失败:', error)
    return null
  }
}

/**
 * 获取画布引用列表
 * @param canvasId 画布 ID
 * @returns 画布引用列表
 */
export async function getCanvasReferences(canvasId: string): Promise<CanvasReference[]> {
  try {
    const block = await getBlock(canvasId)
    if (!block) {
      return []
    }

    const refsStr = block.attrs?.[CANVAS_REFERENCES_KEY]
    return refsStr ? JSON.parse(refsStr) : []
  } catch (error) {
    console.error('[CanvasService] 获取画布引用失败:', error)
    return []
  }
}

/**
 * 创建跨画布节点关联
 * @param sourceCanvasId 源画布 ID
 * @param sourceNodeId 源节点 ID
 * @param targetCanvasId 目标画布 ID
 * @param targetNodeId 目标节点 ID
 * @param linkType 关联类型
 * @param description 关联说明
 * @returns 跨画布节点关联
 */
export async function createCrossCanvasLink(
  sourceCanvasId: string,
  sourceNodeId: string,
  targetCanvasId: string,
  targetNodeId: string,
  linkType: 'reference' | 'relation' | 'seeAlso' = 'relation',
  description?: string
): Promise<CrossCanvasNodeLink | null> {
  try {
    const link: CrossCanvasNodeLink = {
      id: generateId(),
      source: {
        canvasId: sourceCanvasId,
        nodeId: sourceNodeId
      },
      target: {
        canvasId: targetCanvasId,
        nodeId: targetNodeId
      },
      linkType,
      description,
      createdAt: now()
    }

    // 保存关联到两个画布
    for (const canvasId of [sourceCanvasId, targetCanvasId]) {
      const block = await getBlock(canvasId)
      if (block) {
        const existingLinksStr = block.attrs?.[CANVAS_LINKS_KEY]
        const existingLinks: CrossCanvasNodeLink[] = existingLinksStr ? JSON.parse(existingLinksStr) : []

        // 检查是否已存在
        const exists = existingLinks.some(
          l =>
            (l.source.canvasId === sourceCanvasId && l.source.nodeId === sourceNodeId) ||
            (l.target.canvasId === targetCanvasId && l.target.nodeId === targetNodeId)
        )

        if (!exists) {
          existingLinks.push(link)
          await updateBlock({
            id: canvasId,
            attrs: {
              [CANVAS_LINKS_KEY]: JSON.stringify(existingLinks)
            }
          })
        }
      }
    }

    return link
  } catch (error) {
    console.error('[CanvasService] 创建跨画布关联失败:', error)
    return null
  }
}

/**
 * 获取跨画布节点关联列表
 * @param canvasId 画布 ID
 * @returns 跨画布节点关联列表
 */
export async function getCrossCanvasLinks(canvasId: string): Promise<CrossCanvasNodeLink[]> {
  try {
    const block = await getBlock(canvasId)
    if (!block) {
      return []
    }

    const linksStr = block.attrs?.[CANVAS_LINKS_KEY]
    return linksStr ? JSON.parse(linksStr) : []
  } catch (error) {
    console.error('[CanvasService] 获取跨画布关联失败:', error)
    return []
  }
}

/**
 * 删除跨画布关联
 * @param linkId 关联 ID
 * @returns 是否成功
 */
export async function deleteCrossCanvasLink(linkId: string): Promise<boolean> {
  try {
    // 需要从所有画布中删除该关联
    const canvases = await getAllCanvases()

    for (const canvasItem of canvases) {
      const block = await getBlock(canvasItem.id)
      if (block) {
        const linksStr = block.attrs?.[CANVAS_LINKS_KEY]
        if (linksStr) {
          const links: CrossCanvasNodeLink[] = JSON.parse(linksStr)
          const filteredLinks = links.filter(l => l.id !== linkId)

          if (filteredLinks.length !== links.length) {
            await updateBlock({
              id: canvasItem.id,
              attrs: {
                [CANVAS_LINKS_KEY]: JSON.stringify(filteredLinks)
              }
            })
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error('[CanvasService] 删除跨画布关联失败:', error)
    return false
  }
}
