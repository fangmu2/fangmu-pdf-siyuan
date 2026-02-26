/**
 * 数据持久化服务
 * 负责将卡片、学习集、复习记录保存到思源笔记的块中
 */

import { api } from '../api';
import type { Card, StudySet, ReviewRecord } from '../types';

// 数据库名称
const DB_NAME = 'marginnote_learning';

// 块类型定义
export const BLOCK_TYPES = {
  STUDY_SET: 'study_set',
  CARD: 'card',
  REVIEW_RECORD: 'review_record',
} as const;

// 块属性前缀
export const ATTR_PREFIX = 'custom-';

/**
 * 获取或创建数据库
 */
export async function getOrCreateDatabase(): Promise<string> {
  // 首先尝试查找已存在的数据库
  const existingDb = await api.getDocByHPath(`/${DB_NAME}`);

  if (existingDb) {
    return existingDb.id;
  }

  // 创建新的数据库文档
  const notebook = await api.getNotebookByPath(DB_NAME);
  if (notebook) {
    return notebook.id;
  }

  // 创建新笔记本
  const result = await api.createDocWithMd(
    DB_NAME,
    `# ${DB_NAME}\n\nMarginNote 风格学习插件的数据存储`
  );

  return result.id;
}

/**
 * 获取学习集块
 */
export async function getStudySetBlock(studySetId: string): Promise<any> {
  const sql = `
    SELECT * FROM blocks
    WHERE type = 'd'
    AND custom_id = '${studySetId}'
    AND custom_type = '${BLOCK_TYPES.STUDY_SET}'
    LIMIT 1
  `;

  const result = await api.sqlQuery(sql);
  return result?.[0] || null;
}

/**
 * 创建学习集块
 */
export async function createStudySetBlock(studySet: StudySet): Promise<string> {
  const dbId = await getOrCreateDatabase();

  const md = `# ${studySet.name}\n\n${studySet.description || ''}`;

  const result = await api.createDocWithMd(
    `${DB_NAME}/${studySet.name}`,
    md
  );

  // 设置自定义属性
  await api.setBlockAttrs(result.id, {
    [`${ATTR_PREFIX}id`]: studySet.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.STUDY_SET,
    [`${ATTR_PREFIX}name`]: studySet.name,
    [`${ATTR_PREFIX}description`]: studySet.description || '',
    [`${ATTR_PREFIX}created`]: studySet.created.toString(),
    [`${ATTR_PREFIX}updated`]: studySet.updated.toString(),
  });

  return result.id;
}

/**
 * 更新学习集块
 */
export async function updateStudySetBlock(studySet: StudySet): Promise<void> {
  const block = await getStudySetBlock(studySet.id);

  if (!block) {
    await createStudySetBlock(studySet);
    return;
  }

  await api.updateBlockAttrs(block.id, {
    [`${ATTR_PREFIX}name`]: studySet.name,
    [`${ATTR_PREFIX}description`]: studySet.description || '',
    [`${ATTR_PREFIX}updated`]: studySet.updated.toString(),
  });
}

/**
 * 获取所有学习集块
 */
export async function getAllStudySetBlocks(): Promise<StudySet[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type = 'd'
    AND custom_type = '${BLOCK_TYPES.STUDY_SET}'
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => ({
    id: block.custom_id,
    name: block.custom_name || '未命名',
    description: block.custom_description || '',
    created: parseInt(block.custom_created) || Date.now(),
    updated: parseInt(block.custom_updated) || Date.now(),
    cards: [],
    pdfs: [],
  }));
}

/**
 * 获取卡片块
 */
export async function getCardBlock(cardId: string): Promise<any> {
  const sql = `
    SELECT * FROM blocks
    WHERE type IN ('p', 'i')
    AND custom_id = '${cardId}'
    AND custom_type = '${BLOCK_TYPES.CARD}'
    LIMIT 1
  `;

  const result = await api.sqlQuery(sql);
  return result?.[0] || null;
}

/**
 * 创建卡片块
 */
export async function createCardBlock(card: Card, parentDocId?: string): Promise<string> {
  const dbId = await getOrCreateDatabase();

  // 根据卡片类型创建不同的块
  const md = card.type === 'flashcard'
    ? `**问题：** ${card.front}\n\n**答案：** ${card.back}`
    : `${card.content}`;

  const result = await api.insertBlock(
    parentDocId || dbId,
    md,
    card.type === 'flashcard' ? 'i' : 'p'
  );

  // 设置自定义属性
  const attrs: Record<string, string> = {
    [`${ATTR_PREFIX}id`]: card.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.CARD,
    [`${ATTR_PREFIX}cardType`]: card.type,
    [`${ATTR_PREFIX}status`]: card.status,
    [`${ATTR_PREFIX}studySetId`]: card.studySetId || '',
    [`${ATTR_PREFIX}created`]: card.created.toString(),
    [`${ATTR_PREFIX}updated`]: card.updated.toString(),
  };

  if (card.front) attrs[`${ATTR_PREFIX}front`] = card.front;
  if (card.back) attrs[`${ATTR_PREFIX}back`] = card.back;
  if (card.content) attrs[`${ATTR_PREFIX}content`] = card.content;
  if (card.tags?.length) attrs[`${ATTR_PREFIX}tags`] = JSON.stringify(card.tags);
  if (card.sourcePdf) attrs[`${ATTR_PREFIX}sourcePdf`] = card.sourcePdf;
  if (card.sourcePage) attrs[`${ATTR_PREFIX}sourcePage`] = card.sourcePage.toString();
  if (card.srs) {
    attrs[`${ATTR_PREFIX}srs`] = JSON.stringify(card.srs);
  }

  await api.setBlockAttrs(result.data[0].id, attrs);

  return result.data[0].id;
}

/**
 * 更新卡片块
 */
export async function updateCardBlock(card: Card): Promise<void> {
  const block = await getCardBlock(card.id);

  if (!block) {
    await createCardBlock(card);
    return;
  }

  const md = card.type === 'flashcard'
    ? `**问题：** ${card.front}\n\n**答案：** ${card.back}`
    : `${card.content}`;

  await api.updateBlock(block.id, md);

  const attrs: Record<string, string> = {
    [`${ATTR_PREFIX}status`]: card.status,
    [`${ATTR_PREFIX}updated`]: card.updated.toString(),
  };

  if (card.front) attrs[`${ATTR_PREFIX}front`] = card.front;
  if (card.back) attrs[`${ATTR_PREFIX}back`] = card.back;
  if (card.content) attrs[`${ATTR_PREFIX}content`] = card.content;
  if (card.tags?.length) attrs[`${ATTR_PREFIX}tags`] = JSON.stringify(card.tags);
  if (card.srs) {
    attrs[`${ATTR_PREFIX}srs`] = JSON.stringify(card.srs);
  }

  await api.updateBlockAttrs(block.id, attrs);
}

/**
 * 获取所有卡片块
 */
export async function getAllCardBlocks(): Promise<Card[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type IN ('p', 'i')
    AND custom_type = '${BLOCK_TYPES.CARD}'
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      status: block.custom_status || 'new',
      studySetId: block.custom_studySetId,
      created: parseInt(block.custom_created) || Date.now(),
      updated: parseInt(block.custom_updated) || Date.now(),
    };

    if (block.custom_front) card.front = block.custom_front;
    if (block.custom_back) card.back = block.custom_back;
    if (block.custom_content) card.content = block.custom_content;
    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags);
      } catch (e) {
        card.tags = [block.custom_tags];
      }
    }
    if (block.custom_sourcePdf) card.sourcePdf = block.custom_sourcePdf;
    if (block.custom_sourcePage) card.sourcePage = parseInt(block.custom_sourcePage);
    if (block.custom_srs) {
      try {
        card.srs = JSON.parse(block.custom_srs);
      } catch (e) {}
    }

    return card;
  });
}

/**
 * 获取指定学习集的卡片
 */
export async function getCardsByStudySetId(studySetId: string): Promise<Card[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type IN ('p', 'i')
    AND custom_type = '${BLOCK_TYPES.CARD}'
    AND custom_studySetId = '${studySetId}'
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      status: block.custom_status || 'new',
      studySetId: studySetId,
      created: parseInt(block.custom_created) || Date.now(),
      updated: parseInt(block.custom_updated) || Date.now(),
    };

    if (block.custom_front) card.front = block.custom_front;
    if (block.custom_back) card.back = block.custom_back;
    if (block.custom_content) card.content = block.custom_content;
    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags);
      } catch (e) {
        card.tags = [block.custom_tags];
      }
    }
    if (block.custom_srs) {
      try {
        card.srs = JSON.parse(block.custom_srs);
      } catch (e) {}
    }

    return card;
  });
}

/**
 * 删除卡片块
 */
export async function deleteCardBlock(cardId: string): Promise<void> {
  const block = await getCardBlock(cardId);

  if (block) {
    await api.deleteBlock(block.id);
  }
}

/**
 * 创建复习记录块
 */
export async function createReviewRecord(record: ReviewRecord): Promise<string> {
  const dbId = await getOrCreateDatabase();

  const md = `复习记录 - ${new Date(record.reviewedAt).toLocaleString()}`;

  const result = await api.insertBlock(dbId, md, 'p');

  await api.setBlockAttrs(result.data[0].id, {
    [`${ATTR_PREFIX}id`]: record.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.REVIEW_RECORD,
    [`${ATTR_PREFIX}cardId`]: record.cardId,
    [`${ATTR_PREFIX}studySetId`]: record.studySetId || '',
    [`${ATTR_PREFIX}quality`]: record.quality.toString(),
    [`${ATTR_PREFIX}reviewedAt`]: record.reviewedAt.toString(),
    [`${ATTR_PREFIX}timeSpent`]: (record.timeSpent || 0).toString(),
    [`${ATTR_PREFIX}correct`]: record.correct ? 'true' : 'false',
  });

  return result.data[0].id;
}

/**
 * 获取卡片的复习记录
 */
export async function getReviewRecordsByCardId(cardId: string): Promise<ReviewRecord[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_cardId = '${cardId}'
    ORDER BY custom_reviewedAt DESC
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => ({
    id: block.custom_id,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId,
    quality: parseInt(block.custom_quality),
    reviewedAt: parseInt(block.custom_reviewedAt),
    timeSpent: parseInt(block.custom_timeSpent) || 0,
    correct: block.custom_correct === 'true',
  }));
}

/**
 * 获取指定日期的复习记录
 */
export async function getReviewRecordsByDate(date: string): Promise<ReviewRecord[]> {
  const startDate = new Date(date).getTime();
  const endDate = startDate + 86400000; // 一天的毫秒数

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt < ${endDate}
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => ({
    id: block.custom_id || `review_${block.id}`,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId || '',
    quality: parseInt(block.custom_quality) || 0,
    reviewedAt: parseInt(block.custom_reviewedAt) || 0,
    timeSpent: parseInt(block.custom_timeSpent) || 0,
    correct: block.custom_correct === 'true',
    previousInterval: parseInt(block.custom_prev_interval) || 0,
    newInterval: parseInt(block.custom_new_interval) || 0,
    previousEaseFactor: parseFloat(block.custom_prev_ease) || 2.5,
    newEaseFactor: parseFloat(block.custom_new_ease) || 2.5,
    previousRepetitions: parseInt(block.custom_prev_reps) || 0,
    newRepetitions: parseInt(block.custom_new_reps) || 0,
  }));
}

/**
 * 获取日期范围内的复习记录
 */
export async function getReviewRecordsByDateRange(startDate: number, endDate?: number): Promise<ReviewRecord[]> {
  const end = endDate || Date.now();

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt < ${end}
  `;

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => ({
    id: block.custom_id || `review_${block.id}`,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId || '',
    quality: parseInt(block.custom_quality) || 0,
    reviewedAt: parseInt(block.custom_reviewedAt) || 0,
    timeSpent: parseInt(block.custom_timeSpent) || 0,
    correct: block.custom_correct === 'true',
    previousInterval: parseInt(block.custom_prev_interval) || 0,
    newInterval: parseInt(block.custom_new_interval) || 0,
    previousEaseFactor: parseFloat(block.custom_prev_ease) || 2.5,
    newEaseFactor: parseFloat(block.custom_new_ease) || 2.5,
    previousRepetitions: parseInt(block.custom_prev_reps) || 0,
    newRepetitions: parseInt(block.custom_new_reps) || 0,
  }));
}

/**
 * 获取复习统计数据
 */
export async function getReviewStats(startDate?: number, endDate?: number): Promise<{
  totalReviewed: number;
  correctCount: number;
  incorrectCount: number;
  totalTimeSpent: number;
  byQuality: Record<number, number>;
  byStudySet: Record<string, number>;
}> {
  let whereClause = '';
  if (startDate && endDate) {
    whereClause = `AND custom_reviewedAt >= ${startDate} AND custom_reviewedAt < ${endDate}`;
  }

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    ${whereClause}
  `;

  const result = await api.sqlQuery(sql);
  const records = result || [];

  const stats = {
    totalReviewed: records.length,
    correctCount: records.filter((r: any) => r.custom_correct === 'true').length,
    incorrectCount: records.filter((r: any) => r.custom_correct === 'false').length,
    totalTimeSpent: records.reduce((sum: number, r: any) => sum + (parseInt(r.custom_timeSpent) || 0), 0),
    byQuality: {} as Record<number, number>,
    byStudySet: {} as Record<string, number>,
  };

  records.forEach((r: any) => {
    const quality = parseInt(r.custom_quality) || 0;
    stats.byQuality[quality] = (stats.byQuality[quality] || 0) + 1;

    const studySetId = r.custom_studySetId || 'unknown';
    stats.byStudySet[studySetId] = (stats.byStudySet[studySetId] || 0) + 1;
  });

  return stats;
}

/**
 * 搜索卡片
 */
export async function searchCards(query: string, studySetId?: string): Promise<Card[]> {
  let sql = `
    SELECT * FROM blocks
    WHERE type IN ('p', 'i')
    AND custom_type = '${BLOCK_TYPES.CARD}'
    AND (custom_content LIKE '%${query}%'
         OR custom_front LIKE '%${query}%'
         OR custom_back LIKE '%${query}%')
  `;

  if (studySetId) {
    sql += ` AND custom_studySetId = '${studySetId}'`;
  }

  const result = await api.sqlQuery(sql);

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      status: block.custom_status || 'new',
      studySetId: block.custom_studySetId,
      created: parseInt(block.custom_created) || Date.now(),
      updated: parseInt(block.custom_updated) || Date.now(),
    };

    if (block.custom_front) card.front = block.custom_front;
    if (block.custom_back) card.back = block.custom_back;
    if (block.custom_content) card.content = block.custom_content;
    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags);
      } catch (e) {
        card.tags = [block.custom_tags];
      }
    }
    if (block.custom_sourcePdf) card.sourcePdf = block.custom_sourcePdf;
    if (block.custom_sourcePage) card.sourcePage = parseInt(block.custom_sourcePage);
    if (block.custom_srs) {
      try {
        card.srs = JSON.parse(block.custom_srs);
      } catch (e) {}
    }

    return card;
  });
}

/**
 * 获取复习日历数据（每月每天的复习数量）
 */
export async function getReviewCalendarData(
  year: number,
  month: number,
  studySetId?: string
): Promise<Record<number, number>> {
  const startDate = new Date(year, month, 1).getTime();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

  let sql = `
    SELECT custom_reviewedAt as reviewedAt
    FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt <= ${endDate}
  `;

  if (studySetId) {
    sql += ` AND custom_studySetId = '${studySetId}'`;
  }

  const result = await api.sqlQuery(sql);
  const records = result || [];

  // 按天分组统计
  const calendar: Record<number, number> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 初始化所有天数为 0
  for (let day = 1; day <= daysInMonth; day++) {
    calendar[day] = 0;
  }

  // 统计每天的复习数量
  for (const row of records) {
    const reviewedAt = parseInt(row.reviewedAt) || 0;
    const date = new Date(reviewedAt);
    const day = date.getDate();
    calendar[day] = (calendar[day] || 0) + 1;
  }

  return calendar;
}
