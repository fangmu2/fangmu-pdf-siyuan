/**
 * 知识图谱服务 - 知识关联推荐
 * @fileoverview 基于标签/关键词/内容相似度，推荐潜在关联的节点
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/**
 * 知识节点接口
 */
interface KnowledgeNode {
  id: string
  content: string
  tags: string[]
  type: string
}

/**
 * 关联推荐接口
 */
export interface AssociationRecommendation {
  /** 源节点 ID */
  sourceNodeId: string
  /** 目标节点 ID */
  targetNodeId: string
  /** 置信度（0-1） */
  confidence: number
  /** 推荐理由 */
  reason: string
  /** 关联类型 */
  associationType: 'tag' | 'keyword' | 'semantic' | 'citation'
}

/**
 * 从思维导图节点提取知识节点
 */
function extractKnowledgeNode(node: FreeMindMapNode): KnowledgeNode {
  const content = `${node.data.title || ''} ${node.data.content || ''}`.trim()
  const tags = node.data.tags || []

  return {
    id: node.id,
    content,
    tags,
    type: node.type,
  }
}

/**
 * 分词函数（简单实现）
 */
function tokenize(text: string): string[] {
  if (!text) return []

  // 中文分词：按标点符号和空格分割
  const chineseChars = text.match(/[\u4E00-\u9FA5]+/g) || []
  const words = text
    .toLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter((w) => w.length > 1) // 过滤单字符

  // 合并中文和英文词汇
  const allWords = [...words]
  chineseChars.forEach((char) => {
    if (char.length >= 2) {
      allWords.push(char)
    }
  })

  return allWords
}

/**
 * 提取关键词（基于词频）
 */
function extractKeywords(content: string, maxKeywords = 10): string[] {
  const words = tokenize(content)

  // 统计词频
  const freq = new Map<string, number>()
  words.forEach((word) => {
    freq.set(word, (freq.get(word) || 0) + 1)
  })

  // 按词频排序
  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)

  return sorted.map(([word]) => word)
}

/**
 * 计算文本相似度（余弦相似度）
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = tokenize(text1)
  const words2 = tokenize(text2)

  if (words1.length === 0 || words2.length === 0) {
    return 0
  }

  // 构建词袋
  const allWords = new Set([...words1, ...words2])
  const vector1 = Array.from(allWords).map((w) =>
    words1.filter((x) => x === w).length,
  )
  const vector2 = Array.from(allWords).map((w) =>
    words2.filter((x) => x === w).length,
  )

  // 计算余弦相似度
  const dotProduct = vector1.reduce((sum, v, i) => sum + v * vector2[i], 0)
  const norm1 = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0))
  const norm2 = Math.sqrt(vector2.reduce((sum, v) => sum + v * v, 0))

  if (norm1 === 0 || norm2 === 0) {
    return 0
  }

  return dotProduct / (norm1 * norm2)
}

/**
 * 基于标签的关联分析
 */
function findTagAssociations(nodes: KnowledgeNode[]): AssociationRecommendation[] {
  const recommendations: AssociationRecommendation[] = []

  // 构建标签索引
  const tagIndex = new Map<string, string[]>()
  nodes.forEach((node) => {
    node.tags.forEach((tag) => {
      if (!tagIndex.has(tag)) {
        tagIndex.set(tag, [])
      }
      tagIndex.get(tag)!.push(node.id)
    })
  })

  // 查找共享标签的节点
  tagIndex.forEach((nodeIds, tag) => {
    if (nodeIds.length < 2) return

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        recommendations.push({
          sourceNodeId: nodeIds[i],
          targetNodeId: nodeIds[j],
          confidence: 0.8, // 标签匹配置信度较高
          reason: `共享标签：${tag}`,
          associationType: 'tag',
        })
      }
    }
  })

  return recommendations
}

/**
 * 基于关键词的关联分析
 */
function findKeywordAssociations(nodes: KnowledgeNode[]): AssociationRecommendation[] {
  const recommendations: AssociationRecommendation[] = []

  // 提取关键词并构建索引
  const keywordIndex = new Map<string, string[]>()

  nodes.forEach((node) => {
    const keywords = extractKeywords(node.content)
    keywords.forEach((keyword) => {
      if (!keywordIndex.has(keyword)) {
        keywordIndex.set(keyword, [])
      }
      keywordIndex.get(keyword)!.push(node.id)
    })
  })

  // 查找共享关键词的节点
  keywordIndex.forEach((nodeIds, keyword) => {
    if (nodeIds.length < 2) return

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        recommendations.push({
          sourceNodeId: nodeIds[i],
          targetNodeId: nodeIds[j],
          confidence: 0.6, // 关键词匹配置信度中等
          reason: `共享关键词：${keyword}`,
          associationType: 'keyword',
        })
      }
    }
  })

  return recommendations
}

/**
 * 基于内容相似度的关联分析
 */
function findSemanticAssociations(nodes: KnowledgeNode[]): AssociationRecommendation[] {
  const recommendations: AssociationRecommendation[] = []

  // 两两计算相似度
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateTextSimilarity(
        nodes[i].content,
        nodes[j].content,
      )

      if (similarity > 0.7) { // 阈值 0.7
        recommendations.push({
          sourceNodeId: nodes[i].id,
          targetNodeId: nodes[j].id,
          confidence: similarity,
          reason: `内容相似度：${(similarity * 100).toFixed(0)}%`,
          associationType: 'semantic',
        })
      }
    }
  }

  return recommendations
}

/**
 * 分析知识关联
 * @param nodes 思维导图节点列表
 * @returns 关联推荐列表（按置信度降序排列）
 */
export function analyzeAssociations(
  nodes: FreeMindMapNode[],
): AssociationRecommendation[] {
  if (nodes.length < 2) {
    return []
  }

  const knowledgeNodes = nodes.map(extractKnowledgeNode)
  const recommendations: AssociationRecommendation[] = []

  // 1. 基于标签的关联
  const tagAssociations = findTagAssociations(knowledgeNodes)
  recommendations.push(...tagAssociations)

  // 2. 基于关键词的关联
  const keywordAssociations = findKeywordAssociations(knowledgeNodes)
  recommendations.push(...keywordAssociations)

  // 3. 基于内容相似度的关联
  const semanticAssociations = findSemanticAssociations(knowledgeNodes)
  recommendations.push(...semanticAssociations)

  // 4. 排序并去重
  const sorted = recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .filter((rec, index, arr) => {
      // 去重：相同节点对只保留最高置信度
      const key = `${rec.sourceNodeId}-${rec.targetNodeId}`
      const prevKey = index > 0
        ? `${arr[index - 1].sourceNodeId}-${arr[index - 1].targetNodeId}`
        : null
      return key !== prevKey
    })

  // 5. 过滤低置信度推荐并限制数量
  return sorted
    .filter((rec) => rec.confidence >= 0.5) // 置信度阈值 0.5
    .slice(0, 50) // 最多返回 50 个推荐
}

/**
 * 获取关联类型名称
 */
export function getAssociationTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    tag: '标签关联',
    keyword: '关键词关联',
    semantic: '内容相似',
    citation: '引用关联',
  }
  return typeNames[type] || '未知关联'
}

/**
 * 获取关联类型图标
 */
export function getAssociationTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    tag: '🏷️',
    keyword: '🔑',
    semantic: '📝',
    citation: '📚',
  }
  return icons[type] || '🔗'
}
