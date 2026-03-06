/**
 * useLearningSet Composable
 * 学习集操作逻辑封装
 * 遵循 .clinerules.md 规范
 */

import type {
  Ref,
} from 'vue'
import type { Card } from '../types/card'
import type { StudySet } from '../types/studySet'
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { cardService } from '../services/cardService'
import { studySetService } from '../services/studySetService'

/**
 * useLearningSet 参数接口
 */
export interface UseLearningSetOptions {
  /** 初始学习集 ID */
  initialStudySetId?: string
  /** 是否启用自动加载 */
  autoLoad?: boolean
}

/**
 * useLearningSet 返回值接口
 */
export interface UseLearningSetReturn {
  // 状态
  studySets: Ref<StudySet[]>
  currentStudySet: Ref<StudySet | null>
  currentStudySetId: Ref<string | undefined>
  cards: Ref<Card[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  // 学习集操作
  createStudySet: (name: string, description?: string) => Promise<StudySet | null>
  updateStudySet: (studySet: StudySet) => Promise<void>
  deleteStudySet: (studySetId: string) => Promise<void>
  selectStudySet: (studySetId: string) => void

  // 卡片操作（在当前学习集内）
  addCard: (card: Card) => Promise<void>
  removeCard: (cardId: string) => Promise<void>
  updateCardInSet: (card: Card) => Promise<void>

  // 统计
  getStudySetStats: (studySetId: string) => Promise<{
    totalCards: number
    newCards: number
    learningCards: number
    reviewCards: number
    dueCards: number
  }>

  // 刷新
  refresh: () => Promise<void>
  refreshCards: () => Promise<void>
}

/**
 * 学习集 Composable
 * @param options - 配置选项
 * @returns 学习集操作相关的方法和状态
 */
export function useLearningSet(options: UseLearningSetOptions = {}): UseLearningSetReturn {
  const {
    initialStudySetId,
    autoLoad = true,
  } = options

  // 状态
  const studySets = ref<StudySet[]>([])
  const currentStudySet = ref<StudySet | null>(null)
  const currentStudySetId = ref<string | undefined>(initialStudySetId)
  const cards = ref<Card[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 当前学习集的卡片（computed）
  const currentCards = computed<Card[]>(() => {
    if (currentStudySetId.value) {
      return cards.value.filter((c) => c.studySetId === currentStudySetId.value)
    }
    return []
  })

  /**
   * 加载所有学习集
   */
  async function loadStudySets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const sets = await studySetService.getAllStudySets()
      studySets.value = sets

      // 如果指定了初始学习集 ID，尝试选中它
      if (initialStudySetId) {
        const found = sets.find((s) => s.id === initialStudySetId)
        if (found) {
          currentStudySet.value = found
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载学习集失败'
      console.error('[useLearningSet] 加载学习集失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载当前学习集的卡片
   */
  async function loadCards(): Promise<void> {
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
      console.error('[useLearningSet] 加载卡片失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建学习集
   */
  async function createStudySet(name: string, description?: string): Promise<StudySet | null> {
    loading.value = true
    try {
      const studySet = await studySetService.createStudySet(name, description)
      studySets.value.push(studySet)
      return studySet
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建学习集失败'
      console.error('[useLearningSet] 创建学习集失败:', e)
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
    try {
      await studySetService.updateStudySet(studySet)
      const index = studySets.value.findIndex((s) => s.id === studySet.id)
      if (index !== -1) {
        studySets.value[index] = { ...studySet }
      }
      if (currentStudySet.value?.id === studySet.id) {
        currentStudySet.value = { ...studySet }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新学习集失败'
      console.error('[useLearningSet] 更新学习集失败:', e)
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
    try {
      await studySetService.deleteStudySet(studySetId)
      studySets.value = studySets.value.filter((s) => s.id !== studySetId)
      if (currentStudySetId.value === studySetId) {
        currentStudySetId.value = undefined
        currentStudySet.value = null
        cards.value = []
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除学习集失败'
      console.error('[useLearningSet] 删除学习集失败:', e)
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
    currentStudySet.value = studySets.value.find((s) => s.id === studySetId) || null
    loadCards()
  }

  /**
   * 添加卡片到当前学习集
   */
  async function addCard(card: Card): Promise<void> {
    if (!currentStudySetId.value) {
      throw new Error('未选择学习集')
    }

    loading.value = true
    try {
      await cardService.saveCard(card)
      cards.value.push(card)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加卡片失败'
      console.error('[useLearningSet] 添加卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 从当前学习集移除卡片
   */
  async function removeCard(cardId: string): Promise<void> {
    loading.value = true
    try {
      await cardService.deleteCard(cardId)
      cards.value = cards.value.filter((c) => c.id !== cardId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '移除卡片失败'
      console.error('[useLearningSet] 移除卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新当前学习集内的卡片
   */
  async function updateCardInSet(card: Card): Promise<void> {
    loading.value = true
    try {
      await cardService.saveCard(card)
      const index = cards.value.findIndex((c) => c.id === card.id)
      if (index !== -1) {
        cards.value[index] = { ...card }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新卡片失败'
      console.error('[useLearningSet] 更新卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取学习集统计
   */
  async function getStudySetStats(studySetId: string): Promise<{
    totalCards: number
    newCards: number
    learningCards: number
    reviewCards: number
    dueCards: number
  }> {
    try {
      const studySetCards = cards.value.filter((c) => c.studySetId === studySetId)
      const stats = cardService.countCards(studySetCards)

      // 计算到期卡片数
      const now = Date.now()
      const dueCards = studySetCards.filter((c) => {
        if (c.type === 'flashcard') {
          return (c as any).srs?.nextReview && (c as any).srs.nextReview <= now
        }
        return false
      }).length

      return {
        totalCards: stats.total,
        newCards: stats.new,
        learningCards: stats.learning,
        reviewCards: stats.review,
        dueCards,
      }
    } catch (e) {
      console.error('[useLearningSet] 获取统计失败:', e)
      return {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        dueCards: 0,
      }
    }
  }

  /**
   * 刷新学习集列表
   */
  async function refresh(): Promise<void> {
    await loadStudySets()
    if (currentStudySetId.value) {
      await loadCards()
    }
  }

  /**
   * 刷新卡片列表
   */
  async function refreshCards(): Promise<void> {
    await loadCards()
  }

  // 自动加载
  if (autoLoad) {
    onMounted(() => {
      loadStudySets()
      if (initialStudySetId) {
        loadCards()
      }
    })
  }

  return {
    // 状态
    studySets,
    currentStudySet,
    currentStudySetId,
    cards: currentCards,
    loading,
    error,

    // 学习集操作
    createStudySet,
    updateStudySet,
    deleteStudySet,
    selectStudySet,

    // 卡片操作
    addCard,
    removeCard,
    updateCardInSet,

    // 统计
    getStudySetStats,

    // 刷新
    refresh,
    refreshCards,
  }
}

export default useLearningSet
