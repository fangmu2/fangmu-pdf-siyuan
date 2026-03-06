/**
 * 复习 API
 * MarginNote 4 风格学习插件 - 复习相关思源 API 调用
 */

import type { ReviewRecord } from '../types/review'
import {
  insertBlock,
  sqlQuery,
  updateBlockAttrs,
} from './siyuanApi'

// 避免循环依赖，本地定义类型
interface ReviewRecordLocal {
  id: string
  cardId: string
  studySetId: string
  quality: number
  reviewedAt: number
  timeSpent: number
  correct: boolean
}

/**
 * 创建复习记录文档（如果不存在）
 *
 * @returns 复习记录文档 ID
 */
export async function getOrCreateReviewRecordDoc(): Promise<string> {
  // TODO: 检查是否存在复习记录文档，不存在则创建
  // 这里可以创建一个专门的文档来存储复习记录
  return ''
}

/**
 * 保存复习记录
 *
 * @param record - 复习记录
 * @param parentBlockId - 父块 ID
 * @returns 是否成功
 */
export async function saveReviewRecord(
  record: ReviewRecord,
  parentID: string,
): Promise<boolean> {
  try {
    // 创建复习记录块
    const result = await insertBlock({
      dataType: 'query-code',
      data: JSON.stringify({
        cardId: record.cardId,
        quality: record.quality,
        previousInterval: record.previousInterval,
        newInterval: record.newInterval,
        previousEaseFactor: record.previousEaseFactor,
        newEaseFactor: record.newEaseFactor,
        previousRepetitions: record.previousRepetitions,
        newRepetitions: record.newRepetitions,
      }),
      parentID,
    })

    if (result && result[0]?.doOperations?.[0]?.id) {
      const blockId = result[0].doOperations[0].id

      // 设置属性
      await updateBlockAttrs({
        blockId,
        attrs: {
          type: 'review_record',
          review_card_id: record.cardId,
          review_study_set_id: record.studySetId,
          review_quality: record.quality.toString(),
          review_reviewed_at: record.reviewedAt.toString(),
        },
      })

      return true
    }

    return false
  } catch (error) {
    console.error('保存复习记录失败:', error)
    return false
  }
}

/**
 * 批量保存复习记录
 *
 * @param records - 复习记录列表
 * @param parentBlockId - 父块 ID
 * @returns 成功保存的数量
 */
export async function batchSaveReviewRecords(
  records: ReviewRecord[],
  parentID: string,
): Promise<number> {
  let successCount = 0

  for (const record of records) {
    const success = await saveReviewRecord(record, parentID)
    if (success) {
      successCount++
    }
  }

  return successCount
}

/**
 * 获取卡片的复习历史
 *
 * @param cardId - 卡片 ID
 * @param limit - 限制数量
 * @returns 复习记录列表
 */
export async function getCardReviewHistory(
  cardId: string,
  limit: number = 50,
): Promise<ReviewRecord[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE custom-review_card_id = :cardId
    AND custom-type = 'review_record'
    ORDER BY custom-review_reviewed_at DESC
    LIMIT :limit
  `

  try {
    const result = await sqlQuery(sql, {
      cardId,
      limit: limit.toString(),
    })

    return result.map((row) => ({
      id: row.id,
      cardId: row['custom-review_card_id'],
      studySetId: row['custom-review_study_set_id'],
      reviewedAt: Number.parseInt(row['custom-review_reviewed_at'] || '0'),
      quality: Number.parseInt(row['custom-review_quality'] || '0'),
      previousInterval: Number.parseInt(row['custom-review_prev_interval'] || '0'),
      newInterval: Number.parseInt(row['custom-review_new_interval'] || '0'),
      previousEaseFactor: Number.parseFloat(row['custom-review_prev_ease'] || '0'),
      newEaseFactor: Number.parseFloat(row['custom-review_new_ease'] || '0'),
      previousRepetitions: Number.parseInt(row['custom-review_prev_reps'] || '0'),
      newRepetitions: Number.parseInt(row['custom-review_new_reps'] || '0'),
    } as ReviewRecord))
  } catch (error) {
    console.error('获取复习历史失败:', error)
    return []
  }
}

/**
 * 获取学习集的复习历史
 *
 * @param studySetId - 学习集 ID
 * @param startDate - 开始时间戳
 * @param endDate - 结束时间戳
 * @returns 复习记录列表
 */
export async function getStudySetReviewHistory(
  studySetId: string,
  startDate?: number,
  endDate?: number,
): Promise<ReviewRecord[]> {
  let sql = `
    SELECT * FROM blocks
    WHERE custom-review_study_set_id = :studySetId
    AND custom-type = 'review_record'
  `

  const params: Record<string, string> = { studySetId }

  if (startDate) {
    sql += ` AND custom-review_reviewed_at >= :startDate`
    params.startDate = startDate.toString()
  }

  if (endDate) {
    sql += ` AND custom-review_reviewed_at <= :endDate`
    params.endDate = endDate.toString()
  }

  try {
    const result = await sqlQuery(sql, params)

    return result.map((row) => ({
      id: row.id,
      cardId: row['custom-review_card_id'],
      studySetId: row['custom-review_study_set_id'],
      reviewedAt: Number.parseInt(row['custom-review_reviewed_at'] || '0'),
      quality: Number.parseInt(row['custom-review_quality'] || '0'),
      previousInterval: Number.parseInt(row['custom-review_prev_interval'] || '0'),
      newInterval: Number.parseInt(row['custom-review_new_interval'] || '0'),
      previousEaseFactor: Number.parseFloat(row['custom-review_prev_ease'] || '0'),
      newEaseFactor: Number.parseFloat(row['custom-review_new_ease'] || '0'),
      previousRepetitions: Number.parseInt(row['custom-review_prev_reps'] || '0'),
      newRepetitions: Number.parseInt(row['custom-review_new_reps'] || '0'),
    } as ReviewRecord))
  } catch (error) {
    console.error('获取学习集复习历史失败:', error)
    return []
  }
}

/**
 * 获取复习统计
 *
 * @param studySetId - 学习集 ID（可选）
 * @param days - 统计天数
 * @returns 每日复习统计
 */
export async function getReviewStats(
  studySetId?: string,
  days: number = 30,
): Promise<{ date: string, count: number, avgQuality: number }[]> {
  const now = Date.now()
  const startDate = now - days * 24 * 60 * 60 * 1000

  let sql = `
    SELECT
      custom-review_reviewed_at as reviewed_at,
      custom-review_quality as quality
    FROM blocks
    WHERE custom-type = 'review_record'
  `

  const params: Record<string, string> = {
    startDate: startDate.toString(),
  }

  if (studySetId) {
    sql += ` AND custom-review_study_set_id = :studySetId`
    params.studySetId = studySetId
  }

  sql += ` AND custom-review_reviewed_at >= :startDate`

  try {
    const result = await sqlQuery(sql, params)

    // 按日期分组统计
    const statsMap = new Map<string, { count: number, totalQuality: number }>()

    for (const row of result) {
      const reviewedAt = Number.parseInt(row['custom-review_reviewed_at'] || '0')
      const quality = Number.parseInt(row['custom-review_quality'] || '0')

      // 转换为日期字符串 (YYYY-MM-DD)
      const date = new Date(reviewedAt).toISOString().split('T')[0]

      const existing = statsMap.get(date) || {
        count: 0,
        totalQuality: 0,
      }
      existing.count++
      existing.totalQuality += quality
      statsMap.set(date, existing)
    }

    // 转换为数组并排序
    return Array.from(statsMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgQuality: Math.round((data.totalQuality / data.count) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('获取复习统计失败:', error)
    return []
  }
}

/**
 * 保存复习会话
 *
 * @param session - 复习会话
 * @returns 是否成功
 */
export async function saveReviewSession(session: any): Promise<boolean> {
  try {
    // 保存会话元数据到 local storage 作为临时存储
    const sessions = JSON.parse(localStorage.getItem('review_sessions') || '[]')
    sessions.push({
      id: session.id,
      studySetId: session.studySetId,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      stats: session.stats,
      recordCount: session.records?.length || 0,
    })
    localStorage.setItem('review_sessions', JSON.stringify(sessions))

    // TODO: 未来可以扩展到思源数据库存储
    console.log('[reviewApi] 保存复习会话成功:', session.id)
    return true
  } catch (error) {
    console.error('保存复习会话失败:', error)
    return false
  }
}

/**
 * 获取今日复习概览
 *
 * @param studySetId - 学习集 ID（可选）
 * @returns 今日复习概览
 */
export async function getTodayReviewOverview(studySetId?: string): Promise<{
  totalReviewed: number
  avgQuality: number
  streakDays: number
  nextReviewCount: number
} | null> {
  const stats = await getReviewStats(studySetId, 1)

  if (stats.length === 0) {
    return {
      totalReviewed: 0,
      avgQuality: 0,
      streakDays: 0,
      nextReviewCount: 0,
    }
  }

  const todayStats = stats[stats.length - 1]

  // 计算连续天数
  const streakDays = await calculateStreakDays()

  // TODO: 获取下次复习数量
  const nextReviewCount = 0

  return {
    totalReviewed: todayStats.count,
    avgQuality: todayStats.avgQuality,
    streakDays,
    nextReviewCount,
  }
}

/**
 * 计算连续学习天数
 */
async function calculateStreakDays(): Promise<number> {
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = today.getTime()

  // 检查今天是否已经复习过
  const todayRecords = await getReviewRecordsByDateRange(currentDate, currentDate + 86400000)
  if (todayRecords.length === 0) {
    // 如果今天还没复习，检查昨天
    currentDate -= 86400000
  }

  // 计算连续天数
  while (true) {
    const dayStart = currentDate
    const dayEnd = dayStart + 86400000

    const dayRecords = await getReviewRecordsByDateRange(dayStart, dayEnd)

    if (dayRecords.length > 0) {
      streak++
      currentDate -= 86400000
    } else {
      break
    }
  }

  return streak
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
    AND custom_type = 'review_record'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt <= ${endDate}
  `

  if (studySetId) {
    sql += ` AND custom_studySetId = '${studySetId}'`
  }

  const result = await sqlQuery(sql)
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

/**
 * 获取复习记录（日期范围）
 * 注意：此函数在 reviewApi 和 dataPersistenceService 中都有定义，这里使用 apiQuery 直接调用
 */
export async function getReviewRecordsByDateRange(
  startDate: number,
  endDate?: number,
): Promise<ReviewRecordLocal[]> {
  const end = endDate || Date.now()

  const sql = `
    SELECT * FROM blocks
    WHERE type = 'p'
    AND custom_type = 'review_record'
    AND custom_reviewedAt >= ${startDate}
    AND custom_reviewedAt < ${end}
  `

  const result = await sqlQuery(sql)

  return (result || []).map((row) => ({
    id: row.custom_id || `review_${row.id}`,
    cardId: row.custom_cardId,
    studySetId: row.custom_studySetId || '',
    quality: Number.parseInt(row.custom_quality) || 0,
    reviewedAt: Number.parseInt(row.custom_reviewedAt) || 0,
    timeSpent: Number.parseInt(row.custom_timeSpent) || 0,
    correct: row.custom_correct === 'true',
    previousInterval: Number.parseInt(row.custom_prev_interval) || 0,
    newInterval: Number.parseInt(row.custom_new_interval) || 0,
    previousEaseFactor: Number.parseFloat(row.custom_prev_ease) || 2.5,
    newEaseFactor: Number.parseFloat(row.custom_new_ease) || 2.5,
    previousRepetitions: Number.parseInt(row.custom_prev_reps) || 0,
    newRepetitions: Number.parseInt(row.custom_new_reps) || 0,
  } as ReviewRecordLocal))
}
