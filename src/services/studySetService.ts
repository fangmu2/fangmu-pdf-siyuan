/**
 * 学习集管理服务
 * MarginNote 4 风格学习插件 - 学习集 CRUD 操作
 */

import type { Card } from '../types/card'
import type {
  StudySet,
  StudySetBlockAttributes,
} from '../types/studySet'
import { cardService } from './cardService'
import {
  createStudySetBlock,
  getAllStudySetBlocks,
  getCardsByStudySetId,
  updateStudySetBlock,
} from './dataPersistenceService'

// 内存缓存
let studySetsCache: StudySet[] = []
let cacheLoaded = false

/**
 * 加载学习集缓存
 */
async function loadStudySetsCache(): Promise<void> {
  if (cacheLoaded) return

  try {
    studySetsCache = await getAllStudySetBlocks()

    // 加载每个学习集的卡片 ID 列表
    for (const studySet of studySetsCache) {
      const cards = await getCardsByStudySetId(studySet.id)
      studySet.cardIds = cards.map(card => card.id)
    }

    cacheLoaded = true
  } catch (error) {
    console.error('加载学习集缓存失败:', error)
    studySetsCache = []
  }
}

/**
 * 学习集管理服务类
 */
class StudySetService {
  /**
   * 创建新学习集
   */
  async createStudySet(
    name: string,
    description: string = '',
    pdfPaths: string[] = [],
  ): Promise<StudySet> {
    const now = Date.now()

    const studySet: StudySet = {
      id: `studyset_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      cardIds: [],
      pdfPaths,
      notebookId: '',
      reviewSettings: {
        dailyNewCards: 20,
        algorithm: 'SM2',
      },
    }

    try {
      await createStudySetBlock(studySet)
      studySetsCache.push(studySet)
    } catch (error) {
      console.error('创建学习集失败:', error)
      throw error
    }

    return studySet
  }

  /**
   * 将 StudySet 对象转换为块属性
   */
  toBlockAttributes(studySet: StudySet): StudySetBlockAttributes {
    return {
      type: 'study_set',
      study_set_name: studySet.name,
      study_set_description: studySet.description,
      study_set_pdf_count: studySet.pdfPaths?.length.toString() || '0',
      study_set_card_count: studySet.cardIds?.length.toString() || '0',
      study_set_created: studySet.createdAt.toString(),
      study_set_updated: studySet.updatedAt.toString(),
      study_set_notebook_id: studySet.notebookId,
      study_set_algorithm: studySet.reviewSettings?.algorithm || 'SM2',
      study_set_daily_new_cards: studySet.reviewSettings?.dailyNewCards.toString() || '20',
    }
  }

  /**
   * 从块属性解析 StudySet 对象
   */
  parseFromBlockAttributes(docId: string, attrs: Record<string, string>): StudySet {
    return {
      id: docId,
      name: attrs.study_set_name || '未命名学习集',
      description: attrs.study_set_description || '',
      coverImage: undefined,
      notebookId: attrs.study_set_notebook_id || '',
      pdfPaths: [],
      cardIds: [],
      mindmapId: undefined,
      reviewSettings: {
        dailyNewCards: Number.parseInt(attrs.study_set_daily_new_cards || '20'),
        algorithm: (attrs.study_set_algorithm as 'SM2' | 'FSRS') || 'SM2',
      },
      createdAt: Number.parseInt(attrs.study_set_created || Date.now().toString()),
      updatedAt: Number.parseInt(attrs.study_set_updated || Date.now().toString()),
    }
  }

  /**
   * 获取所有学习集
   */
  async getAllStudySets(): Promise<StudySet[]> {
    await loadStudySetsCache()
    return studySetsCache
  }

  /**
   * 获取指定学习集
   */
  async getStudySet(id: string): Promise<StudySet | null> {
    await loadStudySetsCache()
    return studySetsCache.find((ss) => ss.id === id) || null
  }

  /**
   * 更新学习集
   */
  async updateStudySet(studySet: StudySet): Promise<void> {
    studySet.updatedAt = Date.now()

    try {
      await updateStudySetBlock(studySet)

      const index = studySetsCache.findIndex((ss) => ss.id === studySet.id)
      if (index >= 0) {
        studySetsCache[index] = studySet
      }
    } catch (error) {
      console.error('更新学习集失败:', error)
      throw error
    }
  }

  /**
   * 删除学习集
   */
  async deleteStudySet(id: string): Promise<boolean> {
    const studySet = await this.getStudySet(id)
    if (!studySet) {
      console.error('[删除学习集] 学习集不存在:', id)
      return false
    }

    try {
      // 1. 删除所有关联卡片
      const cardPromises = studySet.cardIds.map(cardId => cardService.deleteCard(cardId).catch(err => {
        console.error(`[删除学习集] 删除卡片 ${cardId} 失败:`, err)
      }))
      await Promise.all(cardPromises)

      // 2. 删除思维导图块（如果存在）
      if (studySet.mindmapId) {
        try {
          const { deleteBlock } = await import('../api/siyuanApi')
          await deleteBlock(studySet.mindmapId)
        } catch (error) {
          console.error('[删除学习集] 删除思维导图块失败:', error)
        }
      }

      // 3. 删除学习集文档本身
      try {
        const { deleteBlock } = await import('../api/siyuanApi')
        await deleteBlock(id)
      } catch (error) {
        console.error('[删除学习集] 删除学习集文档失败:', error)
      }

      // 4. 从 localStorage 移除
      localStorage.removeItem(`study-set-${id}`)

      // 5. 从缓存移除
      studySetsCache = studySetsCache.filter((ss) => ss.id !== id)

      console.log('[删除学习集] 成功删除:', id)
      return true
    } catch (error) {
      console.error('[删除学习集失败]', error)
      return false
    }
  }

  /**
   * 添加卡片到学习集
   */
  async addCardToStudySet(cardId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId)
    if (!studySet) {
      throw new Error('学习集不存在')
    }

    // 更新卡片的学习集 ID
    const card = await cardService.getCard(cardId)
    if (card) {
      card.studySetId = studySetId
      await cardService.saveCard(card)

      // 更新缓存
      if (!studySet.cards) {
        studySet.cards = []
      }
      if (!studySet.cards.find((c) => c.id === cardId)) {
        studySet.cards.push(card)
      }
    }
  }

  /**
   * 从学习集移除卡片
   */
  async removeCardFromStudySet(cardId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId)
    if (!studySet) {
      throw new Error('学习集不存在')
    }

    // 更新卡片的学习集 ID 为空
    const card = await cardService.getCard(cardId)
    if (card) {
      card.studySetId = ''
      await cardService.saveCard(card)

      // 更新缓存
      if (studySet.cards) {
        studySet.cards = studySet.cards.filter((c) => c.id !== cardId)
      }
    }
  }

  /**
   * 获取学习集的卡片
   */
  async getStudySetCards(studySetId: string): Promise<Card[]> {
    return getCardsByStudySetId(studySetId)
  }

  /**
   * 获取学习集统计
   */
  async getStudySetStats(studySetId: string): Promise<{
    totalCards: number
    newCards: number
    learningCards: number
    reviewCards: number
    masteredCards: number
    dueCards: number
  }> {
    const cards = await this.getStudySetCards(studySetId)
    const now = Date.now()

    return {
      totalCards: cards.length,
      newCards: cards.filter((c) => c.status === 'new').length,
      learningCards: cards.filter((c) => c.status === 'learning').length,
      reviewCards: cards.filter((c) => c.status === 'review').length,
      masteredCards: cards.filter((c) => c.status === 'mastered').length,
      dueCards: cards.filter((c) => {
        if (c.type !== 'flashcard') return false
        return (c as any).srs?.nextReview <= now
      }).length,
    }
  }

  /**
   * 获取学习集进度
   */
  async getStudySetProgress(studySetId: string): Promise<{
    progressPercentage: number
    totalCards: number
    learnedCards: number
  }> {
    const cards = await this.getStudySetCards(studySetId)
    const learnedCards = cards.filter((c) => c.status === 'learning' || c.status === 'review' || c.status === 'mastered').length
    const totalCards = cards.length

    return {
      progressPercentage: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
      totalCards,
      learnedCards,
    }
  }

  /**
   * 批量添加卡片到学习集
   */
  async batchAddCardsToStudySet(cardIds: string[], studySetId: string): Promise<void> {
    for (const cardId of cardIds) {
      await this.addCardToStudySet(cardId, studySetId)
    }
  }

  /**
   * 移动卡片到另一个学习集
   */
  async moveCardToStudySet(cardId: string, fromStudySetId: string, toStudySetId: string): Promise<void> {
    await this.removeCardFromStudySet(cardId, fromStudySetId)
    await this.addCardToStudySet(cardId, toStudySetId)
  }

  /**
   * 获取包含指定 PDF 的学习集
   */
  async getStudySetsByPdf(pdfId: string): Promise<StudySet[]> {
    await loadStudySetsCache()
    return studySetsCache.filter((ss) => ss.pdfs?.some((p) => p.id === pdfId))
  }

  /**
   * 添加 PDF 到学习集
   */
  async addPdfToStudySet(pdfId: string, pdfName: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId)
    if (!studySet) {
      throw new Error('学习集不存在')
    }

    if (!studySet.pdfs) {
      studySet.pdfs = []
    }

    if (!studySet.pdfs.some((p) => p.id === pdfId)) {
      studySet.pdfs.push({
        id: pdfId,
        name: pdfName,
      })
      await this.updateStudySet(studySet)
    }
  }

  /**
   * 从学习集移除 PDF
   */
  async removePdfFromStudySet(pdfId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId)
    if (!studySet) {
      throw new Error('学习集不存在')
    }

    if (studySet.pdfs) {
      studySet.pdfs = studySet.pdfs.filter((p) => p.id !== pdfId)
      await this.updateStudySet(studySet)
    }
  }
}

// 导出单例
export const studySetService = new StudySetService()
export default studySetService
