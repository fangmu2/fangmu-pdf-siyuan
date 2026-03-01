/**
 * 卡片系统增强服务
 * 提供卡片难度标记、状态流转、批量操作等功能
 */

import { cardService } from './cardService';
import { studySetService } from './studySetService';
import { updateBlockAttrs, sql } from '../api';
import type { Card, CardStatus, CardFilter } from '../types/card';

/**
 * 卡片状态流转配置
 */
export const STATUS_TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  'new': ['learning', 'suspended'],
  'learning': ['review', 'suspended', 'new'],
  'review': ['learning', 'suspended'],
  'suspended': ['new', 'learning']
};

/**
 * 难度等级配置
 */
export const DIFFICULTY_CONFIG: Record<number, {
  label: string;
  color: string;
  description: string;
}> = {
  1: {
    label: '非常简单',
    color: '#4CAF50',
    description: '完全掌握，几乎不会忘记'
  },
  2: {
    label: '简单',
    color: '#8BC34A',
    description: '基本掌握，偶尔需要提示'
  },
  3: {
    label: '中等',
    color: '#FFC107',
    description: '部分掌握，需要定期复习'
  },
  4: {
    label: '困难',
    color: '#FF9800',
    description: '较难掌握，需要频繁复习'
  },
  5: {
    label: '非常困难',
    color: '#F44336',
    description: '难以掌握，需要重点关注'
  }
};

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 总数量 */
  total: number;
  /** 成功数量 */
  success: number;
  /** 失败数量 */
  failed: number;
  /** 失败详情 */
  errors: Array<{
    cardId: string;
    error: string;
  }>;
}

/**
 * 设置卡片难度
 */
export async function setCardDifficulty(
  cardId: string,
  difficulty: number
): Promise<boolean> {
  if (difficulty < 1 || difficulty > 5) {
    throw new Error('难度值必须在 1-5 之间');
  }

  try {
    await updateBlockAttrs({
      id: cardId,
      attrs: {
        'custom-card-difficulty': difficulty.toString()
      }
    });
    return true;
  } catch (error) {
    console.error('[setCardDifficulty] 设置难度失败:', error);
    return false;
  }
}

/**
 * 批量设置卡片难度
 */
export async function batchSetCardDifficulty(
  cardIds: string[],
  difficulty: number
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    total: cardIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (const cardId of cardIds) {
    try {
      const success = await setCardDifficulty(cardId, difficulty);
      if (success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({ cardId, error: '设置失败' });
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        cardId,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  return result;
}

/**
 * 转换卡片状态
 */
export async function transitionCardStatus(
  cardId: string,
  toStatus: CardStatus
): Promise<boolean> {
  try {
    // 获取当前状态（从数据库查询）
    const currentStatus = await getCardCurrentStatus(cardId);

    // 检查状态转换是否合法
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(toStatus)) {
      throw new Error(`不允许的状态转换：${currentStatus} -> ${toStatus}`);
    }

    await updateBlockAttrs({
      id: cardId,
      attrs: {
        'custom-card-status': toStatus
      }
    });

    return true;
  } catch (error) {
    console.error('[transitionCardStatus] 状态转换失败:', error);
    return false;
  }
}

/**
 * 获取卡片当前状态
 */
async function getCardCurrentStatus(cardId: string): Promise<CardStatus> {
  const stmt = `SELECT * FROM blocks WHERE id = '${cardId}'`;
  const result = await sql({ stmt });

  if (result && result.length > 0) {
    const attrs = result[0];
    return (attrs['custom-card-status'] as CardStatus) || 'new';
  }

  return 'new';
}

/**
 * 批量转换卡片状态
 */
export async function batchTransitionCardStatus(
  cardIds: string[],
  toStatus: CardStatus
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    total: cardIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (const cardId of cardIds) {
    try {
      const success = await transitionCardStatus(cardId, toStatus);
      if (success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({ cardId, error: '状态转换失败' });
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        cardId,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  return result;
}

/**
 * 添加卡片标签
 */
export async function addCardTags(
  cardId: string,
  tags: string[]
): Promise<boolean> {
  try {
    const currentTags = await getCardTags(cardId);
    const newTags = [...new Set([...currentTags, ...tags])];

    await updateBlockAttrs({
      id: cardId,
      attrs: {
        'custom-card-tags': newTags.join(',')
      }
    });

    return true;
  } catch (error) {
    console.error('[addCardTags] 添加标签失败:', error);
    return false;
  }
}

/**
 * 移除卡片标签
 */
export async function removeCardTags(
  cardId: string,
  tags: string[]
): Promise<boolean> {
  try {
    const currentTags = await getCardTags(cardId);
    const newTags = currentTags.filter(tag => !tags.includes(tag));

    await updateBlockAttrs({
      id: cardId,
      attrs: {
        'custom-card-tags': newTags.join(',')
      }
    });

    return true;
  } catch (error) {
    console.error('[removeCardTags] 移除标签失败:', error);
    return false;
  }
}

/**
 * 获取卡片标签
 */
async function getCardTags(cardId: string): Promise<string[]> {
  const stmt = `SELECT * FROM blocks WHERE id = '${cardId}'`;
  const result = await sql({ stmt });

  if (result && result.length > 0) {
    const tagsStr = result[0]['custom-card-tags'] as string;
    if (tagsStr) {
      return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  return [];
}

/**
 * 批量添加标签
 */
export async function batchAddCardTags(
  cardIds: string[],
  tags: string[]
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    total: cardIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (const cardId of cardIds) {
    try {
      const success = await addCardTags(cardId, tags);
      if (success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({ cardId, error: '添加标签失败' });
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        cardId,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  return result;
}

/**
 * 批量删除卡片
 */
export async function batchDeleteCards(
  cardIds: string[]
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    total: cardIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (const cardId of cardIds) {
    try {
      await cardService.deleteCard(cardId);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        cardId,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }

  return result;
}

/**
 * 批量移动卡片到另一个学习集
 */
export async function batchMoveCards(
  cardIds: string[],
  targetStudySetId: string
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    total: cardIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  // 验证目标学习集存在
  try {
    await studySetService.getStudySet(targetStudySetId);
  } catch (error) {
    throw new Error('目标学习集不存在');
  }

  for (const cardId of cardIds) {
    try {
      await updateBlockAttrs({
        id: cardId,
        attrs: {
          'custom-card-study-set-id': targetStudySetId
        }
      });
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        cardId,
        error: error instanceof Error ? error.message : '移动失败'
      });
    }
  }

  return result;
}

/**
 * 根据筛选条件查询卡片
 */
export async function queryCardsByFilter(
  filter: CardFilter,
  notebookId?: string
): Promise<Card[]> {
  const conditions: string[] = [];

  // 按状态筛选
  if (filter.status && filter.status.length > 0) {
    const statusList = filter.status.map(s => `'${s}'`).join(',');
    conditions.push(`custom-card-status IN (${statusList})`);
  }

  // 按难度范围筛选
  if (filter.difficulty && filter.difficulty.length === 2) {
    conditions.push(`custom-card-difficulty >= ${filter.difficulty[0]}`);
    conditions.push(`custom-card-difficulty <= ${filter.difficulty[1]}`);
  }

  // 按标签筛选
  if (filter.tags && filter.tags.length > 0) {
    for (const tag of filter.tags) {
      conditions.push(`custom-card-tags LIKE '%${tag}%'`);
    }
  }

  // 按来源 PDF 筛选
  if (filter.sourcePdfPath) {
    conditions.push(`custom-card-source-pdf = '${filter.sourcePdfPath}'`);
  }

  if (conditions.length === 0) {
    return [];
  }

  const whereClause = conditions.join(' AND ');
  let stmt = `SELECT * FROM blocks WHERE type IN ('d', 's', 'p') AND (${whereClause})`;

  if (notebookId) {
    stmt = `SELECT * FROM blocks WHERE box = '${notebookId}' AND type IN ('d', 's', 'p') AND (${whereClause})`;
  }

  try {
    const result = await sql({ stmt });
    return (result || []).map(blockToCard);
  } catch (error) {
    console.error('[queryCardsByFilter] 查询失败:', error);
    return [];
  }
}

/**
 * 将块转换为卡片对象
 */
function blockToCard(block: any): Card {
  const tagsStr = block['custom-card-tags'] as string;
  return {
    id: block.id,
    type: (block['custom-card-type'] as any) || 'card',
    content: block.content || '',
    sourceLocation: {
      docId: block['custom-card-source-doc-id'] || '',
      blockId: block['custom-card-source-block-id'] || '',
      pdfPath: block['custom-card-source-pdf'] || '',
      page: block['custom-card-source-page'] ? parseInt(block['custom-card-source-page']) : undefined,
      rect: block['custom-card-source-rect'] ? JSON.parse(block['custom-card-source-rect']) : undefined
    },
    studySetId: block['custom-card-study-set-id'] || '',
    tags: tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    status: (block['custom-card-status'] as CardStatus) || 'new',
    difficulty: parseInt(block['custom-card-difficulty']) || 1,
    createdAt: block.created || Date.now(),
    updatedAt: block.updated || Date.now()
  };
}

/**
 * 获取所有标签（用于标签系统）
 */
export async function getAllTags(notebookId?: string): Promise<Array<{
  name: string;
  count: number;
}>> {
  let stmt = `SELECT custom-card-tags FROM blocks WHERE custom-card-tags IS NOT NULL AND custom-card-tags != ''`;

  if (notebookId) {
    stmt = `SELECT custom-card-tags FROM blocks WHERE box = '${notebookId}' AND custom-card-tags IS NOT NULL AND custom-card-tags != ''`;
  }

  try {
    const result = await sql({ stmt });
    const tagCount = new Map<string, number>();

    for (const row of result || []) {
      const tagsStr = row['custom-card-tags'] as string;
      if (tagsStr) {
        const tags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
        for (const tag of tags) {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        }
      }
    }

    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('[getAllTags] 获取标签失败:', error);
    return [];
  }
}

/**
 * 获取难度统计
 */
export async function getDifficultyStats(studySetId?: string): Promise<Record<number, number>> {
  let stmt = `SELECT custom-card-difficulty, COUNT(*) as count FROM blocks WHERE custom-card-difficulty IS NOT NULL`;

  if (studySetId) {
    stmt += ` AND custom-card-study-set-id = '${studySetId}'`;
  }

  stmt += ` GROUP BY custom-card-difficulty`;

  try {
    const result = await sql({ stmt });
    const difficultyStats: Record<number, number> = {};

    for (const row of result || []) {
      const difficulty = parseInt(row['custom-card-difficulty']);
      const count = parseInt(row['count']);
      if (!isNaN(difficulty) && !isNaN(count)) {
        difficultyStats[difficulty] = count;
      }
    }

    return difficultyStats;
  } catch (error) {
    console.error('[getDifficultyStats] 获取难度统计失败:', error);
    return {};
  }
}

/**
 * 获取状态统计
 */
export async function getStatusStats(studySetId?: string): Promise<Record<CardStatus, number>> {
  let stmt = `SELECT custom-card-status, COUNT(*) as count FROM blocks WHERE custom-card-status IS NOT NULL`;

  if (studySetId) {
    stmt += ` AND custom-card-study-set-id = '${studySetId}'`;
  }

  stmt += ` GROUP BY custom-card-status`;

  try {
    const result = await sql({ stmt });
    const resultStats: Record<CardStatus, number> = {
      'new': 0,
      'learning': 0,
      'review': 0,
      'suspended': 0
    };

    for (const row of result || []) {
      const status = row['custom-card-status'] as CardStatus;
      const count = parseInt(row['count']);
      if (status && !isNaN(count)) {
        resultStats[status] = count;
      }
    }

    return resultStats;
  } catch (error) {
    console.error('[getStatusStats] 获取状态统计失败:', error);
    return resultStats;
  }
}

/**
 * 导出服务对象
 */
export const cardEnhanceService = {
  // 难度管理
  setCardDifficulty,
  batchSetCardDifficulty,
  getDifficultyStats,

  // 状态管理
  transitionCardStatus,
  batchTransitionCardStatus,
  getStatusStats,

  // 标签管理
  addCardTags,
  removeCardTags,
  batchAddCardTags,
  getAllTags,

  // 批量操作
  batchDeleteCards,
  batchMoveCards,

  // 查询筛选
  queryCardsByFilter,

  // 配置
  STATUS_TRANSITIONS,
  DIFFICULTY_CONFIG
};
