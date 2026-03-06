/**
 * 卡片 API
 * MarginNote 4 风格学习插件 - 卡片相关思源 API 调用
 */

import type {
  Card,
  FlashCard,
} from '../types/card'
import {
  deleteBlock,
  getBlockAttrs,
  insertBlock,
  updateBlockAttrs,
} from '../api/siyuanApi'
import { cardService } from '../services/cardService'

/**
 * 创建卡片块
 *
 * @param card - 卡片对象
 * @param parentBlockId - 父块 ID（学习集文档中的块）
 * @param previousBlockId - 前一个块 ID（用于排序）
 * @returns 创建的块 ID
 */
export async function createCardBlock(
  card: Card,
  parentID: string,
  previousID?: string,
): Promise<string> {
  const attributes = cardService.toBlockAttributes(card)

  // 根据卡片类型创建不同的块
  const dataType = card.type === 'flashcard' ? 'query-code' : 'paragraph'

  try {
    const result = await insertBlock({
      dataType,
      data: card.content,
      parentID,
      previousID,
    })

    // 设置块属性
    if (result && result[0]?.doOperations?.[0]?.id) {
      const blockId = result[0].doOperations[0].id
      // 传递块属性，确保类型匹配
      await setCardAttributes(blockId, attributes as unknown as Record<string, string>)
      return blockId
    }

    throw new Error('创建卡片块失败')
  } catch (error) {
    console.error('创建卡片块失败:', error)
    throw error
  }
}

/**
 * 更新卡片块
 *
 * @param card - 卡片对象
 * @returns 是否成功
 */
export async function updateCardBlock(card: Card): Promise<boolean> {
  const attributes = cardService.toBlockAttributes(card)

  try {
    await updateBlockAttrs({
      blockId: card.id,
      attrs: attributes,
    })
    return true
  } catch (error) {
    console.error('更新卡片块失败:', error)
    return false
  }
}

/**
 * 删除卡片块
 *
 * @param blockId - 块 ID
 * @returns 是否成功
 */
export async function deleteCardBlock(blockId: string): Promise<boolean> {
  try {
    await deleteBlock(blockId)
    return true
  } catch (error) {
    console.error('删除卡片块失败:', error)
    return false
  }
}

/**
 * 设置卡片属性
 *
 * @param blockId - 块 ID
 * @param attributes - 属性对象
 */
export async function setCardAttributes(
  blockId: string,
  attributes: Record<string, string>,
): Promise<void> {
  try {
    await updateBlockAttrs({
      blockId,
      attrs: attributes,
    })
  } catch (error) {
    console.error('设置卡片属性失败:', error)
    throw error
  }
}

/**
 * 获取卡片属性
 *
 * @param blockId - 块 ID
 * @returns 卡片对象（如果存在）
 */
export async function getCardByBlockId(blockId: string): Promise<Card | FlashCard | null> {
  try {
    const attrs = await getBlockAttrs(blockId)

    // 检查是否是卡片
    if (attrs.type !== 'card' && attrs.type !== 'flashcard') {
      return null
    }

    return cardService.parseFromBlockAttributes(blockId, attrs)
  } catch (error) {
    console.error('获取卡片失败:', error)
    return null
  }
}

/**
 * 通过 SQL 查询卡片
 *
 * @param studySetId - 学习集 ID（可选）
 * @param status - 状态筛选（可选）
 * @returns 卡片列表
 */
export async function queryCards(
  studySetId?: string,
  status?: string,
): Promise<(Card | FlashCard)[]> {
  let _sql = `
    SELECT * FROM blocks
    WHERE type IN ('d', 's', 'p')
    AND (
      custom-type = 'card' OR custom-type = 'flashcard'
    )
  `

  const _params: Record<string, string> = {}

  if (studySetId) {
    _sql += ` AND custom-card_study_set_id = :studySetId`
    _params.studySetId = studySetId
  }

  if (status) {
    _sql += ` AND custom-card_status = :status`
    _params.status = status
  }

  try {
    // TODO: 实现 SQL 查询
    // const result = await window.siyuan.api.sqlQuery(sql, params);
    // return result.map(row => cardService.parseFromBlockAttributes(row.id, row));
    return []
  } catch (error) {
    console.error('查询卡片失败:', error)
    return []
  }
}

/**
 * 查询到期复习的闪卡
 *
 * @param studySetId - 学习集 ID（可选）
 * @returns 到期闪卡列表
 */
export async function queryDueFlashCards(studySetId?: string): Promise<FlashCard[]> {
  const now = Date.now()

  let _sql = `
    SELECT * FROM blocks
    WHERE custom-type = 'flashcard'
    AND custom-card_srs_next_review <= :now
  `

  const _params: Record<string, string> = {
    now: now.toString(),
  }

  if (studySetId) {
    _sql += ` AND custom-card_study_set_id = :studySetId`
    _params.studySetId = studySetId
  }

  try {
    // TODO: 实现 SQL 查询
    // const result = await window.siyuan.api.sqlQuery(sql, params);
    // return result.map(row => cardService.parseFromBlockAttributes(row.id, row) as FlashCard);
    return []
  } catch (error) {
    console.error('查询到期闪卡失败:', error)
    return []
  }
}

/**
 * 批量创建卡片
 *
 * @param cards - 卡片列表
 * @param parentBlockId - 父块 ID
 * @returns 创建的块 ID 列表
 */
export async function batchCreateCards(
  cards: Card[],
  parentID: string,
): Promise<string[]> {
  const blockIds: string[] = []
  let previousBlockId: string | undefined

  for (const card of cards) {
    try {
      const blockId = await createCardBlock(card, parentID, previousBlockId)
      blockIds.push(blockId)
      previousBlockId = blockId
    } catch (error) {
      console.error(`创建卡片 ${card.content.slice(0, 20)}... 失败:`, error)
    }
  }

  return blockIds
}

/**
 * 将卡片转换为闪卡
 *
 * @param card - 普通卡片
 * @param front - 正面内容
 * @param back - 反面内容
 * @returns 更新后的闪卡
 */
export async function convertToFlashCard(
  card: Card,
  front: string,
  back: string,
): Promise<FlashCard | null> {
  try {
    const flashCard = await cardService.upgradeToFlashCard(card, front, back)
    const success = await updateCardBlock(flashCard)

    if (success) {
      return flashCard
    }

    return null
  } catch (error) {
    console.error('转换为闪卡失败:', error)
    return null
  }
}

/**
 * 记录复习历史
 *
 * @returns 是否成功
 */
export async function recordReviewHistory(): Promise<boolean> {
  try {
    // 将复习记录存储到 localStorage 作为临时存储
    // 格式：{ date: 'YYYY-MM-DD', count: number }
    const today = new Date().toISOString().split('T')[0]
    const history = JSON.parse(localStorage.getItem('review_history') || '[]')

    const todayRecord = history.find((r: any) => r.date === today)
    if (todayRecord) {
      todayRecord.count = (todayRecord.count || 0) + 1
    } else {
      history.push({
        date: today,
        count: 1,
      })
    }

    // 保留最近 365 天的记录
    const recentHistory = history.slice(-365)
    localStorage.setItem('review_history', JSON.stringify(recentHistory))

    // TODO: 未来可以扩展到思源数据库存储
    console.log('[cardApi] 记录复习历史成功:', today)
    return true
  } catch (error) {
    console.error('记录复习历史失败:', error)
    return false
  }
}
