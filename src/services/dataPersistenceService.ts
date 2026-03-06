/**
 * 数据持久化服务
 * 负责将卡片、学习集、复习记录保存到思源笔记的块中
 */

import type {
  Card,
  FlashCard,
  ReviewRecord,
  StudySet,
} from '../types'
import { api } from '../api'

// 数据库名称
const DB_NAME = 'marginnote_learning'

// 块类型定义
export const BLOCK_TYPES = {
  STUDY_SET: 'study_set',
  CARD: 'card',
  REVIEW_RECORD: 'review_record',
} as const

// 块属性前缀
export const ATTR_PREFIX = 'custom-'

/**
 * 辅助函数：判断是否为闪卡
 */
function isFlashCard(card: Card): card is FlashCard {
  return card.type === 'flashcard'
}

/**
 * 获取或创建数据库
 */
export async function getOrCreateDatabase(): Promise<string> {
  // 首先尝试通过 SQL 查找已存在的数据库文档
  const sql = `SELECT root_id as id FROM blocks WHERE type = 'd' AND content LIKE '${DB_NAME}' LIMIT 1`
  const result = await api.sqlQuery(sql)

  if (result && result.length > 0) {
    return result[0].id
  }

  // 获取默认笔记本
  const notebooks = await api.lsNotebooks()
  const notebookList = notebooks.notebooks || []
  if (notebookList.length === 0) {
    // 创建新笔记本
    const newNotebook = await api.createNotebook(DB_NAME)
    // 创建文档
    const docId = await api.createDocWithMd(
      newNotebook.id,
      DB_NAME,
      `# ${DB_NAME}\n\nMarginNote 风格学习插件的数据存储`,
    )
    return docId
  }

  // 使用第一个笔记本创建文档
  const firstNotebook = notebookList[0]
  const docId = await api.createDocWithMd(
    firstNotebook.id,
    DB_NAME,
    `# ${DB_NAME}\n\nMarginNote 风格学习插件的数据存储`,
  )

  return docId
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
  `

  const result = await api.sqlQuery(sql)
  return result?.[0] || null
}

/**
 * 创建学习集块
 */
export async function createStudySetBlock(studySet: StudySet): Promise<string> {
  // 获取或创建数据库文档
  const dbId = await getOrCreateDatabase()

  const md = `# ${studySet.name}\n\n${studySet.description || ''}`

  const docId = await api.createDocWithMd(
    dbId,
    studySet.name,
    md,
  )

  // 设置自定义属性
  await api.setBlockAttrs(docId, {
    [`${ATTR_PREFIX}id`]: studySet.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.STUDY_SET,
    [`${ATTR_PREFIX}name`]: studySet.name,
    [`${ATTR_PREFIX}description`]: studySet.description || '',
    [`${ATTR_PREFIX}createdAt`]: studySet.createdAt.toString(),
    [`${ATTR_PREFIX}updatedAt`]: studySet.updatedAt.toString(),
  })

  return docId
}

/**
 * 更新学习集块
 */
export async function updateStudySetBlock(studySet: StudySet): Promise<void> {
  const block = await getStudySetBlock(studySet.id)

  if (!block) {
    await createStudySetBlock(studySet)
    return
  }

  await api.updateBlockAttrs(block.id, {
    [`${ATTR_PREFIX}name`]: studySet.name,
    [`${ATTR_PREFIX}description`]: studySet.description || '',
    [`${ATTR_PREFIX}updatedAt`]: studySet.updatedAt.toString(),
  })
}

/**
 * 获取所有学习集块
 */
export async function getAllStudySetBlocks(): Promise<StudySet[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type = 'd'
    AND custom_type = '${BLOCK_TYPES.STUDY_SET}'
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => {
    let pdfPaths: string[] = []
    let cardIds: string[] = []

    if (block.custom_pdfPaths) {
      try {
        pdfPaths = JSON.parse(block.custom_pdfPaths)
      } catch (error) {
        console.error('[JSON 解析失败] PDF 路径数据:', block.custom_pdfPaths, error)
        pdfPaths = []
      }
    }

    if (block.custom_cardIds) {
      try {
        cardIds = JSON.parse(block.custom_cardIds)
      } catch (error) {
        console.error('[JSON 解析失败] 卡片 ID 数据:', block.custom_cardIds, error)
        cardIds = []
      }
    }

    return {
      id: block.custom_id,
      name: block.custom_name || '未命名',
      description: block.custom_description || '',
      notebookId: block.box || '',
      pdfPaths,
      cardIds,
      reviewSettings: {
        dailyNewCards: 10,
        algorithm: 'SM2' as const,
      },
      createdAt: Number.parseInt(block.custom_createdAt) || Date.now(),
      updatedAt: Number.parseInt(block.custom_updatedAt) || Date.now(),
    }
  })
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
  `

  const result = await api.sqlQuery(sql)
  return result?.[0] || null
}

/**
 * 创建卡片块
 */
export async function createCardBlock(card: Card, parentDocId?: string): Promise<string> {
  const dbId = await getOrCreateDatabase()

  // 根据卡片类型创建不同的块
  const md = isFlashCard(card)
    ? `**问题：** ${card.front}\n\n**答案：** ${card.back}`
    : `${card.content}`

  const result = await api.insertBlock(
    'markdown',
    md,
    undefined,
    undefined,
    parentDocId || dbId,
  )

  // 设置自定义属性
  const attrs: Record<string, string> = {
    [`${ATTR_PREFIX}id`]: card.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.CARD,
    [`${ATTR_PREFIX}cardType`]: card.type,
    [`${ATTR_PREFIX}status`]: card.status,
    [`${ATTR_PREFIX}studySetId`]: card.studySetId || '',
    [`${ATTR_PREFIX}createdAt`]: card.createdAt.toString(),
    [`${ATTR_PREFIX}updatedAt`]: card.updatedAt.toString(),
  }

  if (isFlashCard(card)) {
    attrs[`${ATTR_PREFIX}front`] = card.front
    attrs[`${ATTR_PREFIX}back`] = card.back
    attrs[`${ATTR_PREFIX}srs`] = JSON.stringify(card.srs)
  } else {
    if (card.content) attrs[`${ATTR_PREFIX}content`] = card.content
  }

  if (card.tags?.length) attrs[`${ATTR_PREFIX}tags`] = JSON.stringify(card.tags)
  if (card.sourceLocation?.pdfPath) attrs[`${ATTR_PREFIX}sourcePdf`] = card.sourceLocation.pdfPath
  if (card.sourceLocation?.page) attrs[`${ATTR_PREFIX}sourcePage`] = card.sourceLocation.page.toString()

  // result 的类型是 IResdoOperations[]，但实际返回的是包含 doOperations 数组的对象
  const blockId = (result as any)?.doOperations?.[0]?.id
  if (!blockId) {
    throw new Error('创建卡片块失败：无法获取块 ID')
  }

  await api.setBlockAttrs(blockId, attrs)

  return blockId
}

/**
 * 更新卡片块
 */
export async function updateCardBlock(card: Card): Promise<void> {
  const block = await getCardBlock(card.id)

  if (!block) {
    await createCardBlock(card)
    return
  }

  const md = isFlashCard(card)
    ? `**问题：** ${card.front}\n\n**答案：** ${card.back}`
    : `${card.content}`

  await api.updateBlock('markdown', md, block.id)

  const attrs: Record<string, string> = {
    [`${ATTR_PREFIX}status`]: card.status,
    [`${ATTR_PREFIX}updatedAt`]: card.updatedAt.toString(),
  }

  if (isFlashCard(card)) {
    attrs[`${ATTR_PREFIX}front`] = card.front
    attrs[`${ATTR_PREFIX}back`] = card.back
    attrs[`${ATTR_PREFIX}srs`] = JSON.stringify(card.srs)
  } else {
    if (card.content) attrs[`${ATTR_PREFIX}content`] = card.content
  }

  if (card.tags?.length) attrs[`${ATTR_PREFIX}tags`] = JSON.stringify(card.tags)

  await api.updateBlockAttrs(block.id, attrs)
}

/**
 * 获取所有卡片块
 */
export async function getAllCardBlocks(): Promise<Card[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE type IN ('p', 'i')
    AND custom_type = '${BLOCK_TYPES.CARD}'
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      content: block.custom_content || '',
      sourceLocation: {
        docId: block.root_id,
        blockId: block.id,
        pdfPath: block.custom_sourcePdf,
        page: block.custom_sourcePage ? Number.parseInt(block.custom_sourcePage) : undefined,
      },
      studySetId: block.custom_studySetId,
      tags: [],
      status: block.custom_status || 'new',
      difficulty: 3,
      createdAt: Number.parseInt(block.custom_createdAt) || Date.now(),
      updatedAt: Number.parseInt(block.custom_updatedAt) || Date.now(),
    }

    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags)
      } catch (e) {
        card.tags = [block.custom_tags]
      }
    }

    // 如果是闪卡类型，需要构建 FlashCard
    if (card.type === 'flashcard') {
      const flashCard = card as FlashCard
      if (block.custom_front) flashCard.front = block.custom_front
      if (block.custom_back) flashCard.back = block.custom_back
      if (block.custom_srs) {
        try {
          flashCard.srs = JSON.parse(block.custom_srs)
        } catch (e) {
          console.warn('[数据持久化] JSON 解析失败:', block.custom_srs, e)
          // 提供默认 SRS 参数
          flashCard.srs = {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: Date.now(),
          }
        }
      }
    }

    return card
  })
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
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      content: block.custom_content || '',
      sourceLocation: {
        docId: block.root_id,
        blockId: block.id,
        pdfPath: block.custom_sourcePdf,
        page: block.custom_sourcePage ? Number.parseInt(block.custom_sourcePage) : undefined,
      },
      studySetId,
      tags: [],
      status: block.custom_status || 'new',
      difficulty: 3,
      createdAt: Number.parseInt(block.custom_createdAt) || Date.now(),
      updatedAt: Number.parseInt(block.custom_updatedAt) || Date.now(),
    }

    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags)
      } catch (e) {
        card.tags = [block.custom_tags]
      }
    }

    // 如果是闪卡类型
    if (card.type === 'flashcard') {
      const flashCard = card as FlashCard
      if (block.custom_front) flashCard.front = block.custom_front
      if (block.custom_back) flashCard.back = block.custom_back
      if (block.custom_srs) {
        try {
          flashCard.srs = JSON.parse(block.custom_srs)
        } catch (e) {
          console.warn('[数据持久化] JSON 解析失败:', block.custom_srs, e)
          // 提供默认 SRS 参数
          flashCard.srs = {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: Date.now(),
          }
        }
      }
    }

    return card
  })
}

/**
 * 删除卡片块
 */
export async function deleteCardBlock(cardId: string): Promise<void> {
  const block = await getCardBlock(cardId)

  if (block) {
    await api.deleteBlock(block.id)
  }
}

/**
 * 创建复习记录块
 */
export async function createReviewRecord(record: ReviewRecord): Promise<string> {
  const dbId = await getOrCreateDatabase()

  const md = `复习记录 - ${new Date(record.reviewedAt).toLocaleString()}`

  const result = await api.insertBlock('markdown', md, undefined, undefined, dbId)

  // result 的类型是 IResdoOperations[]，但实际返回的是包含 doOperations 数组的对象
  const blockId = (result as any)?.doOperations?.[0]?.id
  if (!blockId) {
    throw new Error('创建复习记录失败：无法获取块 ID')
  }

  await api.setBlockAttrs(blockId, {
    [`${ATTR_PREFIX}id`]: record.id,
    [`${ATTR_PREFIX}type`]: BLOCK_TYPES.REVIEW_RECORD,
    [`${ATTR_PREFIX}cardId`]: record.cardId,
    [`${ATTR_PREFIX}studySetId`]: record.studySetId,
    [`${ATTR_PREFIX}quality`]: record.quality.toString(),
    [`${ATTR_PREFIX}reviewedAt`]: record.reviewedAt.toString(),
    [`${ATTR_PREFIX}previousInterval`]: record.previousInterval.toString(),
    [`${ATTR_PREFIX}newInterval`]: record.newInterval.toString(),
    [`${ATTR_PREFIX}previousEaseFactor`]: record.previousEaseFactor.toString(),
    [`${ATTR_PREFIX}newEaseFactor`]: record.newEaseFactor.toString(),
    [`${ATTR_PREFIX}previousRepetitions`]: record.previousRepetitions.toString(),
    [`${ATTR_PREFIX}newRepetitions`]: record.newRepetitions.toString(),
  })

  return blockId
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
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => ({
    id: block.custom_id,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId,
    quality: Number.parseInt(block.custom_quality) as any,
    reviewedAt: Number.parseInt(block.custom_reviewedAt),
    previousInterval: Number.parseInt(block.custom_previousInterval) || 0,
    newInterval: Number.parseInt(block.custom_newInterval) || 0,
    previousEaseFactor: Number.parseFloat(block.custom_previousEaseFactor) || 2.5,
    newEaseFactor: Number.parseFloat(block.custom_newEaseFactor) || 2.5,
    previousRepetitions: Number.parseInt(block.custom_previousRepetitions) || 0,
    newRepetitions: Number.parseInt(block.custom_newRepetitions) || 0,
  }))
}

/**
 * 获取指定日期的复习记录
 */
export async function getReviewRecordsByDate(date: string): Promise<ReviewRecord[]> {
  const startDate = new Date(date).getTime()
  const endDate = startDate + 86400000 // 一天的毫秒数

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt < ${endDate}
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => ({
    id: block.custom_id || `review_${block.id}`,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId || '',
    quality: Number.parseInt(block.custom_quality) as any,
    reviewedAt: Number.parseInt(block.custom_reviewedAt) || 0,
    previousInterval: Number.parseInt(block.custom_previousInterval) || 0,
    newInterval: Number.parseInt(block.custom_newInterval) || 0,
    previousEaseFactor: Number.parseFloat(block.custom_previousEaseFactor) || 2.5,
    newEaseFactor: Number.parseFloat(block.custom_newEaseFactor) || 2.5,
    previousRepetitions: Number.parseInt(block.custom_previousRepetitions) || 0,
    newRepetitions: Number.parseInt(block.custom_newRepetitions) || 0,
  }))
}

/**
 * 获取日期范围内的复习记录
 */
export async function getReviewRecordsByDateRange(startDate: number, endDate?: number): Promise<ReviewRecord[]> {
  const end = endDate || Date.now()

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt < ${end}
  `

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => ({
    id: block.custom_id || `review_${block.id}`,
    cardId: block.custom_cardId,
    studySetId: block.custom_studySetId || '',
    quality: Number.parseInt(block.custom_quality) as any,
    reviewedAt: Number.parseInt(block.custom_reviewedAt) || 0,
    previousInterval: Number.parseInt(block.custom_previousInterval) || 0,
    newInterval: Number.parseInt(block.custom_newInterval) || 0,
    previousEaseFactor: Number.parseFloat(block.custom_previousEaseFactor) || 2.5,
    newEaseFactor: Number.parseFloat(block.custom_newEaseFactor) || 2.5,
    previousRepetitions: Number.parseInt(block.custom_previousRepetitions) || 0,
    newRepetitions: Number.parseInt(block.custom_newRepetitions) || 0,
  }))
}

/**
 * 获取复习统计数据
 */
export async function getReviewStats(startDate?: number, endDate?: number): Promise<{
  totalReviewed: number
  correctCount: number
  incorrectCount: number
  totalTimeSpent: number
  byQuality: Record<number, number>
  byStudySet: Record<string, number>
}> {
  let whereClause = ''
  if (startDate && endDate) {
    whereClause = `AND custom_reviewedAt >= ${startDate} AND custom_reviewedAt < ${endDate}`
  }

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    ${whereClause}
  `

  const result = await api.sqlQuery(sql)
  const records = result || []

  const stats = {
    totalReviewed: records.length,
    correctCount: records.filter((r: any) => Number.parseInt(r.custom_quality) >= 3).length,
    incorrectCount: records.filter((r: any) => Number.parseInt(r.custom_quality) < 3).length,
    totalTimeSpent: 0,
    byQuality: {} as Record<number, number>,
    byStudySet: {} as Record<string, number>,
  }

  records.forEach((r: any) => {
    const quality = Number.parseInt(r.custom_quality) || 0
    stats.byQuality[quality] = (stats.byQuality[quality] || 0) + 1

    const studySetId = r.custom_studySetId || 'unknown'
    stats.byStudySet[studySetId] = (stats.byStudySet[studySetId] || 0) + 1
  })

  return stats
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
  `

  if (studySetId) {
    sql += ` AND custom_studySetId = '${studySetId}'`
  }

  const result = await api.sqlQuery(sql)

  return (result || []).map((block: any) => {
    const card: Card = {
      id: block.custom_id,
      type: block.custom_cardType || 'excerpt',
      content: block.custom_content || '',
      sourceLocation: {
        docId: block.root_id,
        blockId: block.id,
        pdfPath: block.custom_sourcePdf,
        page: block.custom_sourcePage ? Number.parseInt(block.custom_sourcePage) : undefined,
      },
      studySetId: block.custom_studySetId,
      tags: [],
      status: block.custom_status || 'new',
      difficulty: 3,
      createdAt: Number.parseInt(block.custom_createdAt) || Date.now(),
      updatedAt: Number.parseInt(block.custom_updatedAt) || Date.now(),
    }

    if (block.custom_tags) {
      try {
        card.tags = JSON.parse(block.custom_tags)
      } catch (e) {
        card.tags = [block.custom_tags]
      }
    }

    // 如果是闪卡类型
    if (card.type === 'flashcard') {
      const flashCard = card as FlashCard
      if (block.custom_front) flashCard.front = block.custom_front
      if (block.custom_back) flashCard.back = block.custom_back
      if (block.custom_srs) {
        try {
          flashCard.srs = JSON.parse(block.custom_srs)
        } catch (e) {
          console.warn('[数据持久化] JSON 解析失败:', block.custom_srs, e)
          // 提供默认 SRS 参数
          flashCard.srs = {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: Date.now(),
          }
        }
      }
    }

    return card
  })
}

/**
 * 获取复习日历数据（每月每天的复习数量）
 */
export async function getReviewCalendarData(
  year: number,
  month: number,
  studySetId?: string,
): Promise<Record<number, number>> {
  const startDate = new Date(year, month, 1).getTime()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()

  let sql = `
    SELECT custom_reviewedAt as reviewedAt
    FROM blocks
    WHERE type = 'p'
    AND custom_type = '${BLOCK_TYPES.REVIEW_RECORD}'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt <= ${endDate}
  `

  if (studySetId) {
    sql += ` AND custom_studySetId = '${studySetId}'`
  }

  const result = await api.sqlQuery(sql)
  const records = result || []

  // 按天分组统计
  const calendar: Record<number, number> = {}
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 初始化所有天数为 0
  for (let day = 1; day <= daysInMonth; day++) {
    calendar[day] = 0
  }

  // 统计每天的复习数量
  for (const row of records) {
    const reviewedAt = Number.parseInt(row.reviewedAt) || 0
    const date = new Date(reviewedAt)
    const day = date.getDate()
    calendar[day] = (calendar[day] || 0) + 1
  }

  return calendar
}
