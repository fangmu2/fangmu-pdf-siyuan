/**
 * 学习集状态管理 Store
 * 遵循 .clinerules.md 规范
 */

import type { Card } from '../types/card'
import type { StudySet } from '../types/studySet'
import { defineStore } from 'pinia'
import {
  computed,
  ref,
} from 'vue'
import { postApi } from '../api/siyuanApi'
import { cardService } from '../services/cardService'
import { studySetService } from '../services/studySetService'

/**
 * 学习集状态
 */
export interface LearningSetState {
  /** 所有学习集列表 */
  studySets: StudySet[]
  /** 当前选中的学习集 ID */
  currentStudySetId: string | null
  /** 当前学习集的卡片列表 */
  cards: Card[]
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 学习集 Store
 */
export const useLearningSetStore = defineStore('learningSet', () => {
  // 状态
  const studySets = ref<StudySet[]>([])
  const currentStudySetId = ref<string | null>(null)
  const cards = ref<Card[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const currentStudySet = computed<StudySet | null>(() => {
    if (!currentStudySetId.value) return null
    return studySets.value.find((s) => s.id === currentStudySetId.value) || null
  })

  const currentCards = computed<Card[]>(() => {
    if (!currentStudySetId.value) return []
    return cards.value.filter((c) => c.studySetId === currentStudySetId.value)
  })

  const cardCount = computed<number>(() => currentCards.value.length)

  const stats = computed(() => {
    const cardStats = cardService.countCards(currentCards.value)
    return {
      total: cardStats.total,
      new: cardStats.new,
      learning: cardStats.learning,
      review: cardStats.review,
      suspended: cardStats.suspended,
    }
  })

  // Actions
  /**
   * 加载所有学习集
   */
  async function fetchStudySets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const sets = await studySetService.getAllStudySets()
      studySets.value = sets
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载学习集失败'
      console.error('[LearningSetStore] 加载学习集失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载当前学习集的卡片
   */
  async function fetchCards(): Promise<void> {
    if (!currentStudySetId.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const loadedCards = await cardService.getCardsByStudySetId(currentStudySetId.value)
      cards.value = loadedCards
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载卡片失败'
      console.error('[LearningSetStore] 加载卡片失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建学习集
   */
  async function createStudySet(name: string, description?: string): Promise<StudySet | null> {
    loading.value = true
    error.value = null

    try {
      const studySet = await studySetService.createStudySet(name, description)
      studySets.value.push(studySet)
      return studySet
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建学习集失败'
      console.error('[LearningSetStore] 创建学习集失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新学习集
   */
  async function updateStudySet(studySet: StudySet): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await studySetService.updateStudySet(studySet)
      const index = studySets.value.findIndex((s) => s.id === studySet.id)
      if (index !== -1) {
        studySets.value[index] = { ...studySet }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新学习集失败'
      console.error('[LearningSetStore] 更新学习集失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除学习集
   */
  async function deleteStudySet(studySetId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await studySetService.deleteStudySet(studySetId)
      studySets.value = studySets.value.filter((s) => s.id !== studySetId)
      if (currentStudySetId.value === studySetId) {
        currentStudySetId.value = null
        cards.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除学习集失败'
      console.error('[LearningSetStore] 删除学习集失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择学习集
   */
  function selectStudySet(studySetId: string): void {
    currentStudySetId.value = studySetId
    fetchCards()
  }

  /**
   * 添加卡片到当前学习集
   */
  async function addCard(card: Card): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await cardService.saveCard(card)
      cards.value.push(card)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加卡片失败'
      console.error('[LearningSetStore] 添加卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新卡片
   */
  async function updateCard(card: Card): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await cardService.saveCard(card)
      const index = cards.value.findIndex((c) => c.id === card.id)
      if (index !== -1) {
        cards.value[index] = { ...card }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新卡片失败'
      console.error('[LearningSetStore] 更新卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除卡片
   */
  async function deleteCard(cardId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await cardService.deleteCard(cardId)
      cards.value = cards.value.filter((c) => c.id !== cardId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除卡片失败'
      console.error('[LearningSetStore] 删除卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据
   */
  async function refresh(): Promise<void> {
    await fetchStudySets()
    if (currentStudySetId.value) {
      await fetchCards()
    }
  }

  /**
   * 清空错误
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 批量移动标注到目标学习集
   */
  async function moveAnnotationsToSet(
    annotationIds: string[],
    targetSetId: string,
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // 批量更新标注的学习集 ID
      const updates = annotationIds.map((id) => ({
        id,
        updates: { studySetId: targetSetId },
      }))

      // 批量 API 调用
      await Promise.all(
        updates.map((update) =>
          postApi('/api/block/updateBlock', {
            id: update.id,
            data: update.updates,
          }),
        ),
      )

      // 更新本地状态
      cards.value = cards.value.filter((c) => !annotationIds.includes(c.id))

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量移动失败'
      console.error('[LearningSetStore] 批量移动失败:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量删除标注
   */
  async function deleteAnnotations(
    annotationIds: string[],
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // 批量 API 调用删除
      await Promise.all(
        annotationIds.map((id) =>
          postApi('/api/block/deleteBlock', {
            id,
          }),
        ),
      )

      // 更新本地状态
      cards.value = cards.value.filter((c) => !annotationIds.includes(c.id))

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量删除失败'
      console.error('[LearningSetStore] 批量删除失败:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    studySets,
    currentStudySetId,
    cards,
    loading,
    error,

    // Getters
    currentStudySet,
    currentCards,
    cardCount,
    stats,

    // Actions
    fetchStudySets,
    fetchCards,
    createStudySet,
    updateStudySet,
    deleteStudySet,
    selectStudySet,
    addCard,
    updateCard,
    deleteCard,
    refresh,
    clearError,
    moveAnnotationsToSet,
    deleteAnnotations,
  }
})

export default useLearningSetStore
