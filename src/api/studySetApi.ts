/**
 * 学习集 API
 * MarginNote 4 风格学习插件 - 学习集相关思源 API 调用
 */

import {
  createDoc,
  getBlockAttrs,
  updateBlockAttrs,
  insertBlock,
  sqlQuery,
} from '../api/siyuanApi';
import type { StudySet, StudySetBlockAttributes } from '../types/studySet';
import { studySetService } from '../services/studySetService';
import type { Card } from '../types/card';

/**
 * 创建学习集文档
 *
 * @param studySet - 学习集对象
 * @param notebookId - 笔记本 ID
 * @returns 创建的文档 ID
 */
export async function createStudySetDoc(
  studySet: StudySet,
  notebookId: string
): Promise<string> {
  try {
    // 创建文档
    const result = await createDoc({
      notebookId,
      parentDocId: '',
      title: studySet.name,
    });

    if (!result || !result[0]?.doOperations?.[0]?.id) {
      throw new Error('创建学习集文档失败');
    }

    const docId = result[0].doOperations[0].id;

    // 设置文档根块属性
    const attributes = studySetService.toBlockAttributes(studySet);
    await updateBlockAttrs({
      blockId: docId,
      attrs: attributes,
    });

    // 创建基础结构
    await createStudySetStructure(docId);

    return docId;
  } catch (error) {
    console.error('创建学习集文档失败:', error);
    throw error;
  }
}

/**
 * 创建学习集基础结构
 *
 * @param docId - 文档 ID
 */
async function createStudySetStructure(docId: string): Promise<void> {
  // 创建标题块
  await insertBlock({
    dataType: 'heading',
    data: '学习集概览',
    parentBlockId: docId,
  });

  // 创建统计信息块
  await insertBlock({
    dataType: 'paragraph',
    data: '卡片数量：0 | 待复习：0 | 已掌握：0',
    parentBlockId: docId,
  });

  // 创建卡片列表标题
  await insertBlock({
    dataType: 'heading',
    data: '卡片列表',
    parentBlockId: docId,
  });

  // 创建卡片容器
  await insertBlock({
    dataType: 'blockquote',
    data: '',
    parentBlockId: docId,
  });
}

/**
 * 更新学习集
 *
 * @param studySet - 学习集对象
 * @returns 是否成功
 */
export async function updateStudySetDoc(studySet: StudySet): Promise<boolean> {
  try {
    const attributes = studySetService.toBlockAttributes(studySet);
    await updateBlockAttrs({
      blockId: studySet.id,
      attrs: attributes,
    });
    return true;
  } catch (error) {
    console.error('更新学习集失败:', error);
    return false;
  }
}

/**
 * 获取学习集
 *
 * @param docId - 文档 ID
 * @returns 学习集对象（如果存在）
 */
export async function getStudySetByDocId(docId: string): Promise<StudySet | null> {
  try {
    const attrs = await getBlockAttrs({ blockId: docId }) as unknown as Record<string, string>;

    // 检查是否是学习集
    if (attrs.type !== 'study_set') {
      return null;
    }

    return studySetService.parseFromBlockAttributes(docId, attrs);
  } catch (error) {
    console.error('获取学习集失败:', error);
    return null;
  }
}

/**
 * 查询所有学习集
 *
 * @returns 学习集列表
 */
export async function queryAllStudySets(): Promise<StudySet[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type = 'd'
    AND custom-type = 'study_set'
  `;

  try {
    const result = await sqlQuery(sql);
    return result.map(row =>
      studySetService.parseFromBlockAttributes(row.id, row as unknown as Record<string, string>)
    );
  } catch (error) {
    console.error('查询学习集失败:', error);
    return [];
  }
}

/**
 * 删除学习集
 *
 * @param docId - 文档 ID
 * @returns 是否成功
 */
export async function deleteStudySetDoc(docId: string): Promise<boolean> {
  // TODO: 实现删除
  console.warn('删除学习集功能尚未实现');
  return false;
}

/**
 * 获取学习集中的所有卡片
 *
 * @param studySetId - 学习集 ID
 * @returns 卡片列表
 */
export async function getStudySetCards(studySetId: string): Promise<Card[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE custom-card_study_set_id = :studySetId
    AND (custom-type = 'card' OR custom-type = 'flashcard')
  `;

  try {
    const result = await sqlQuery(sql, { studySetId });
    return result.map(row => {
      // 使用 cardService 解析
      const card = studySetService // 这里需要 cardService
      return {} as Card;
    });
  } catch (error) {
    console.error('获取学习集卡片失败:', error);
    return [];
  }
}

/**
 * 获取学习集统计
 *
 * @param studySetId - 学习集 ID
 * @returns 统计信息
 */
export async function getStudySetStats(studySetId: string): Promise<{
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueToday: number;
  masteredCards: number;
} | null> {
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0);

  const sql = `
    SELECT
      custom-card_status as status,
      custom-type as type,
      custom-card_srs_interval as interval,
      custom-card_srs_next_review as next_review
    FROM blocks
    WHERE custom-card_study_set_id = :studySetId
    AND (custom-type = 'card' OR custom-type = 'flashcard')
  `;

  try {
    const result = await sqlQuery(sql, { studySetId });

    const stats = {
      totalCards: result.length,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      dueToday: 0,
      masteredCards: 0,
    };

    for (const row of result) {
      const status = row['custom-card_status'];
      const type = row['custom-type'];
      const interval = parseInt(row['custom-card_srs_interval'] || '0');
      const nextReview = parseInt(row['custom-card_srs_next_review'] || '0');

      if (status === 'new') stats.newCards++;
      else if (status === 'learning') stats.learningCards++;
      else if (status === 'review') stats.reviewCards++;

      if (type === 'flashcard') {
        if (nextReview <= now) stats.dueToday++;
        if (interval >= 21) stats.masteredCards++;
      }
    }

    return stats;
  } catch (error) {
    console.error('获取学习集统计失败:', error);
    return null;
  }
}

/**
 * 添加卡片到学习集
 *
 * @param studySetId - 学习集 ID
 * @param cardId - 卡片 ID
 * @returns 是否成功
 */
export async function addCardToStudySet(
  studySetId: string,
  cardId: string
): Promise<boolean> {
  try {
    await updateBlockAttrs({
      blockId: cardId,
      attrs: {
        'card_study_set_id': studySetId,
      },
    });
    return true;
  } catch (error) {
    console.error('添加卡片到学习集失败:', error);
    return false;
  }
}

/**
 * 从学习集移除卡片
 *
 * @param studySetId - 学习集 ID
 * @param cardId - 卡片 ID
 * @returns 是否成功
 */
export async function removeCardFromStudySet(
  studySetId: string,
  cardId: string
): Promise<boolean> {
  try {
    await updateBlockAttrs({
      blockId: cardId,
      attrs: {
        'card_study_set_id': '',
      },
    });
    return true;
  } catch (error) {
    console.error('从学习集移除卡片失败:', error);
    return false;
  }
}
