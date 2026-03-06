/**
 * 自由画布思维导图版本历史服务
 * @fileoverview 管理思维导图的版本历史，支持版本创建、恢复、删除
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'
import { postApi } from '@/api/siyuanApi'

/**
 * 思维导图版本数据结构
 */
export interface MindMapVersion {
  /** 版本 ID */
  id: string
  /** 思维导图块 ID */
  blockId: string
  /** 版本号 */
  version: number
  /** 版本名称 */
  name: string
  /** 版本描述 */
  description?: string
  /** 创建时间 */
  createdAt: number
  /** 创建者 */
  createdBy?: string
  /** 节点数据快照 */
  nodes: FreeMindMapNode[]
  /** 连线数据快照 */
  edges: FreeMindMapEdge[]
  /** 视图状态 */
  viewport: { zoom: number, x: number, y: number }
  /** 布局模式 */
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
}

/**
 * 版本历史属性名
 */
const VERSION_ATTRS = {
  /** 版本历史 JSON */
  HISTORY: 'custom-freemind-history',
  /** 当前版本号 */
  CURRENT_VERSION: 'custom-freemind-current-version',
  /** 自动保存间隔（秒） */
  AUTO_SAVE_INTERVAL: 'custom-freemind-auto-save-interval',
}

/**
 * 默认自动保存间隔（5 分钟）
 */
const DEFAULT_AUTO_SAVE_INTERVAL = 300

/**
 * 最大版本数量
 */
const MAX_VERSIONS = 50

/**
 * 生成唯一 ID
 */
function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 获取思维导图的版本历史
 * @param blockId 思维导图块 ID
 */
export async function getVersionHistory(blockId: string): Promise<MindMapVersion[]> {
  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })

    const historyJson = attrs?.[VERSION_ATTRS.HISTORY]
    if (!historyJson) {
      return []
    }

    return JSON.parse(historyJson) as MindMapVersion[]
  } catch (error) {
    console.error('[FreeMindMapVersionService] 获取版本历史失败:', error)
    return []
  }
}

/**
 * 创建新版本
 * @param blockId 思维导图块 ID
 * @param data 思维导图数据
 * @param options 选项
 */
export async function createVersion(
  blockId: string,
  data: {
    nodes: FreeMindMapNode[]
    edges: FreeMindMapEdge[]
    viewport: { zoom: number, x: number, y: number }
    layout: 'free' | 'tree' | 'vertical' | 'horizontal'
  },
  options: {
    name?: string
    description?: string
    createdBy?: string
  } = {},
): Promise<MindMapVersion> {
  const history = await getVersionHistory(blockId)

  // 获取当前版本号
  const currentVersion = history.length > 0 ? Math.max(...history.map((v) => v.version)) : 0
  const newVersion = currentVersion + 1

  const version: MindMapVersion = {
    id: generateVersionId(),
    blockId,
    version: newVersion,
    name: options.name || `版本 ${newVersion}`,
    description: options.description,
    createdAt: Date.now(),
    createdBy: options.createdBy,
    nodes: JSON.parse(JSON.stringify(data.nodes)), // 深拷贝
    edges: JSON.parse(JSON.stringify(data.edges)),
    viewport: { ...data.viewport },
    layout: data.layout,
  }

  history.push(version)

  // 限制版本数量
  if (history.length > MAX_VERSIONS) {
    history.splice(0, history.length - MAX_VERSIONS)
  }

  // 保存版本历史
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [VERSION_ATTRS.HISTORY]: JSON.stringify(history),
      [VERSION_ATTRS.CURRENT_VERSION]: newVersion.toString(),
    },
  })

  return version
}

/**
 * 恢复指定版本
 * @param blockId 思维导图块 ID
 * @param versionId 版本 ID
 */
export async function restoreVersion(
  blockId: string,
  versionId: string,
): Promise<{
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} | null> {
  const history = await getVersionHistory(blockId)
  const version = history.find((v) => v.id === versionId)

  if (!version) {
    console.error('[FreeMindMapVersionService] 版本不存在:', versionId)
    return null
  }

  // 创建恢复版本的新版本（用于回滚）
  const currentData = {
    nodes: history[history.length - 1]?.nodes || [],
    edges: history[history.length - 1]?.edges || [],
    viewport: history[history.length - 1]?.viewport || {
      zoom: 1,
      x: 0,
      y: 0,
    },
    layout: history[history.length - 1]?.layout || 'free' as const,
  }

  await createVersion(blockId, currentData, {
    name: `恢复前备份`,
    description: `恢复到版本 ${version.version} 前的自动备份`,
  })

  return {
    nodes: JSON.parse(JSON.stringify(version.nodes)),
    edges: JSON.parse(JSON.stringify(version.edges)),
    viewport: { ...version.viewport },
    layout: version.layout,
  }
}

/**
 * 删除指定版本
 * @param blockId 思维导图块 ID
 * @param versionId 版本 ID
 */
export async function deleteVersion(blockId: string, versionId: string): Promise<boolean> {
  const history = await getVersionHistory(blockId)
  const index = history.findIndex((v) => v.id === versionId)

  if (index === -1) {
    return false
  }

  history.splice(index, 1)

  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [VERSION_ATTRS.HISTORY]: JSON.stringify(history),
    },
  })

  return true
}

/**
 * 获取指定版本详情
 * @param blockId 思维导图块 ID
 * @param versionId 版本 ID
 */
export async function getVersionDetail(
  blockId: string,
  versionId: string,
): Promise<MindMapVersion | null> {
  const history = await getVersionHistory(blockId)
  return history.find((v) => v.id === versionId) || null
}

/**
 * 获取最新版本
 * @param blockId 思维导图块 ID
 */
export async function getLatestVersion(blockId: string): Promise<MindMapVersion | null> {
  const history = await getVersionHistory(blockId)
  if (history.length === 0) {
    return null
  }
  return history[history.length - 1]
}

/**
 * 比较两个版本的差异
 * @param version1 版本 1
 * @param version2 版本 2
 */
export function compareVersions(version1: MindMapVersion, version2: MindMapVersion): {
  addedNodes: FreeMindMapNode[]
  removedNodes: FreeMindMapNode[]
  modifiedNodes: FreeMindMapNode[]
  addedEdges: FreeMindMapEdge[]
  removedEdges: FreeMindMapEdge[]
  modifiedEdges: FreeMindMapEdge[]
} {
  const addedNodes: FreeMindMapNode[] = []
  const removedNodes: FreeMindMapNode[] = []
  const modifiedNodes: FreeMindMapNode[] = []
  const addedEdges: FreeMindMapEdge[] = []
  const removedEdges: FreeMindMapEdge[] = []
  const modifiedEdges: FreeMindMapEdge[] = []

  // 比较节点
  const nodes1Map = new Map(version1.nodes.map((n) => [n.id, n]))
  const nodes2Map = new Map(version2.nodes.map((n) => [n.id, n]))

  // 查找新增和修改的节点
  for (const [id, node2] of nodes2Map.entries()) {
    const node1 = nodes1Map.get(id)
    if (!node1) {
      addedNodes.push(node2)
    } else {
      // 检查是否修改
      if (
        node1.data.title !== node2.data.title
        || node1.data.content !== node2.data.content
        || node1.position.x !== node2.position.x
        || node1.position.y !== node2.position.y
      ) {
        modifiedNodes.push(node2)
      }
    }
  }

  // 查找删除的节点
  for (const [id, node1] of nodes1Map.entries()) {
    if (!nodes2Map.has(id)) {
      removedNodes.push(node1)
    }
  }

  // 比较连线
  const edges1Map = new Map(version1.edges.map((e) => [e.id, e]))
  const edges2Map = new Map(version2.edges.map((e) => [e.id, e]))

  for (const [id, edge2] of edges2Map.entries()) {
    const edge1 = edges1Map.get(id)
    if (!edge1) {
      addedEdges.push(edge2)
    } else if (
      edge1.source !== edge2.source
      || edge1.target !== edge2.target
      || edge1.type !== edge2.type
    ) {
      modifiedEdges.push(edge2)
    }
  }

  for (const [id, edge1] of edges1Map.entries()) {
    if (!edges2Map.has(id)) {
      removedEdges.push(edge1)
    }
  }

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    modifiedEdges,
  }
}

/**
 * 启用自动保存版本
 * @param blockId 思维导图块 ID
 * @param intervalSeconds 保存间隔（秒）
 */
export async function enableAutoSave(
  blockId: string,
  intervalSeconds: number = DEFAULT_AUTO_SAVE_INTERVAL,
): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [VERSION_ATTRS.AUTO_SAVE_INTERVAL]: intervalSeconds.toString(),
    },
  })
}

/**
 * 禁用自动保存版本
 * @param blockId 思维导图块 ID
 */
export async function disableAutoSave(blockId: string): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [VERSION_ATTRS.AUTO_SAVE_INTERVAL]: '0',
    },
  })
}

/**
 * 获取自动保存间隔
 * @param blockId 思维导图块 ID
 */
export async function getAutoSaveInterval(blockId: string): Promise<number> {
  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })
    const interval = Number.parseInt(attrs?.[VERSION_ATTRS.AUTO_SAVE_INTERVAL] || '0')
    return interval > 0 ? interval : 0
  } catch (error) {
    console.error('[FreeMindMapVersionService] 获取自动保存间隔失败:', error)
    return 0
  }
}

/**
 * 自动保存版本（如果启用了自动保存）
 * @param blockId 思维导图块 ID
 * @param data 思维导图数据
 */
export async function autoSaveVersion(
  blockId: string,
  data: {
    nodes: FreeMindMapNode[]
    edges: FreeMindMapEdge[]
    viewport: { zoom: number, x: number, y: number }
    layout: 'free' | 'tree' | 'vertical' | 'horizontal'
  },
): Promise<MindMapVersion | null> {
  const interval = await getAutoSaveInterval(blockId)
  if (interval <= 0) {
    return null
  }

  const history = await getVersionHistory(blockId)
  const now = Date.now()

  // 检查是否需要自动保存（距离上次保存超过间隔时间）
  const lastVersion = history[history.length - 1]
  if (lastVersion && now - lastVersion.createdAt < interval * 1000) {
    return null
  }

  return createVersion(blockId, data, {
    name: `自动保存`,
    description: `自动保存于 ${new Date(now).toLocaleString()}`,
  })
}

/**
 * 清空版本历史
 * @param blockId 思维导图块 ID
 */
export async function clearHistory(blockId: string): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [VERSION_ATTRS.HISTORY]: '',
      [VERSION_ATTRS.CURRENT_VERSION]: '0',
    },
  })
}
