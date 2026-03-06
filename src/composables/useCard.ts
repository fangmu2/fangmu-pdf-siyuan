/**
 * useCard Composable
 * 卡片操作逻辑封装
 * 遵循 .clinerules.md 规范：
 * - 使用 Composition API + <script setup>
 * - 封装通用逻辑，以 use 开头
 * - 严禁使用 any 类型
 */

import type {
  ComputedRef,
  Ref,
} from 'vue'
import type { PDFAnnotation } from '../types/annotation'
import type {
  Card,
  CardFilter,
  CardSortOptions,
  CardStatus,
  CardType,
  FlashCard,
} from '../types/card'
import {
  computed,
  onMounted,
  reactive,
  ref,
} from 'vue'
import { cardEnhanceService } from '../services/cardEnhanceService'
import { cardService } from '../services/cardService'

/**
 * useCard 参数接口
 */
export interface UseCardOptions {
  /** 学习集 ID */
  studySetId?: string
  /** 初始筛选条件 */
  initialFilter?: CardFilter
  /** 初始排序选项 */
  initialSort?: CardSortOptions
  /** 是否启用自动加载 */
  autoLoad?: boolean
}

/**
 * useCard 返回值接口
 */
export interface UseCardReturn {
  // 状态
  cards: Ref<Card[]>
  filteredCards: ComputedRef<Card[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  // 筛选和排序
  filter: Ref<CardFilter>
  sortOptions: Ref<CardSortOptions>
  applyFilter: () => Promise<void>
  applySort: () => Promise<void>

  // 卡片操作
  createCard: (
    content: string,
    sourceLocation: { docId: string, blockId: string, pdfPath?: string, page?: number },
    type?: CardType,
  ) => Promise<Card | null>
  createFlashCard: (
    front: string,
    back: string,
    content: string,
    sourceLocation: { docId: string, blockId: string, pdfPath?: string, page?: number },
  ) => Promise<FlashCard | null>
  updateCard: (card: Card | FlashCard) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  createFromAnnotation: (annotation: PDFAnnotation) => Promise<Card | null>

  // 状态流转
  transitionCardStatus: (cardId: string, toStatus: CardStatus) => Promise<boolean>
  updateCardDifficulty: (cardId: string, difficulty: number) => Promise<boolean>
  addCardTags: (cardId: string, tags: string[]) => Promise<boolean>
  removeCardTags: (cardId: string, tags: string[]) => Promise<boolean>

  // 批量操作
  batchDeleteCards: (cardIds: string[]) => Promise<void>
  batchMoveCards: (cardIds: string[], targetStudySetId: string) => Promise<void>
  batchSetDifficulty: (cardIds: string[], difficulty: number) => Promise<void>
  batchAddTags: (cardIds: string[], tags: string[]) => Promise<void>

  // 统计
  getCardStats: () => {
    total: number
    new: number
    learning: number
    review: number
    suspended: number
  }

  // 刷新
  refresh: () => Promise<void>
}

/**
 * 卡片 Composable
 * @param options - 配置选项
 * @returns 卡片操作相关的方法和状态
 */
export function useCard(options: UseCardOptions = {}): UseCardReturn {
  const {
    studySetId,
    initialFilter = {},
    initialSort = {
      sortBy: 'created',
      sortOrder: 'desc',
    },
    autoLoad = true,
  } = options

  // 状态
  const cards = ref<Card[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const filter = reactive<CardFilter>({ ...initialFilter })
  const sortOptions = reactive<CardSortOptions>({ ...initialSort })

  // 筛选后的卡片
  const filteredCards = computed<Card[]>(() => {
    let result = [...cards.value]

    // 应用筛选
    if (Object.keys(filter).length > 0) {
      result = cardService.filterCards(result, filter)
    }

    // 应用排序
    result = cardService.sortCards(result, sortOptions)

    return result
  })

  /**
   * 加载卡片
   */
  async function loadCards(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let loadedCards: Card[]

      if (studySetId) {
        loadedCards = await cardService.getCardsByStudySetId(studySetId)
      } else {
        loadedCards = await cardService.getAllCards()
      }

      cards.value = loadedCards
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载卡片失败'
      console.error('[useCard] 加载卡片失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 应用筛选
   */
  async function applyFilter(): Promise<void> {
    // 筛选在 computed 中自动应用，这里可以添加额外的逻辑
    console.log('[useCard] 应用筛选:', filter)
  }

  /**
   * 应用排序
   */
  async function applySort(): Promise<void> {
    // 排序在 computed 中自动应用，这里可以添加额外的逻辑
    console.log('[useCard] 应用排序:', sortOptions)
  }

  /**
   * 创建卡片
   */
  async function createCard(
    content: string,
    sourceLocation: { docId: string, blockId: string, pdfPath?: string, page?: number },
    type: CardType = 'card',
  ): Promise<Card | null> {
    if (!studySetId) {
      error.value = '未指定学习集 ID'
      return null
    }

    loading.value = true
    try {
      const card = await cardService.createCard(content, studySetId, sourceLocation, type)
      cards.value.push(card)
      return card
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建卡片失败'
      console.error('[useCard] 创建卡片失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建闪卡
   */
  async function createFlashCard(
    front: string,
    back: string,
    content: string,
    sourceLocation: { docId: string, blockId: string, pdfPath?: string, page?: number },
  ): Promise<FlashCard | null> {
    if (!studySetId) {
      error.value = '未指定学习集 ID'
      return null
    }

    loading.value = true
    try {
      const card = await cardService.createFlashCard(front, back, studySetId, content, sourceLocation)
      cards.value.push(card)
      return card
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建闪卡失败'
      console.error('[useCard] 创建闪卡失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新卡片
   */
  async function updateCard(card: Card | FlashCard): Promise<void> {
    loading.value = true
    try {
      await cardService.saveCard(card)
      const index = cards.value.findIndex((c) => c.id === card.id)
      if (index !== -1) {
        cards.value[index] = { ...card }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新卡片失败'
      console.error('[useCard] 更新卡片失败:', e)
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
    try {
      await cardService.deleteCard(cardId)
      cards.value = cards.value.filter((c) => c.id !== cardId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除卡片失败'
      console.error('[useCard] 删除卡片失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 从标注创建卡片
   */
  async function createFromAnnotation(annotation: PDFAnnotation): Promise<Card | null> {
    if (!studySetId) {
      error.value = '未指定学习集 ID'
      return null
    }

    loading.value = true
    try {
      const card = await cardService.createFromAnnotation(annotation, studySetId)
      cards.value.push(card)
      return card
    } catch (e) {
      error.value = e instanceof Error ? e.message : '从标注创建卡片失败'
      console.error('[useCard] 从标注创建卡片失败:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 转换卡片状态
   */
  async function transitionCardStatus(cardId: string, toStatus: CardStatus): Promise<boolean> {
    try {
      const success = await cardEnhanceService.transitionCardStatus(cardId, toStatus)
      if (success) {
        const card = cards.value.find((c) => c.id === cardId)
        if (card) {
          card.status = toStatus
        }
      }
      return success
    } catch (e) {
      error.value = e instanceof Error ? e.message : '状态转换失败'
      console.error('[useCard] 状态转换失败:', e)
      return false
    }
  }

  /**
   * 更新卡片难度
   */
  async function updateCardDifficulty(cardId: string, difficulty: number): Promise<boolean> {
    try {
      const success = await cardEnhanceService.setCardDifficulty(cardId, difficulty)
      if (success) {
        const card = cards.value.find((c) => c.id === cardId)
        if (card) {
          card.difficulty = difficulty
        }
      }
      return success
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新难度失败'
      console.error('[useCard] 更新难度失败:', e)
      return false
    }
  }

  /**
   * 添加卡片标签
   */
  async function addCardTags(cardId: string, tags: string[]): Promise<boolean> {
    try {
      const success = await cardEnhanceService.addCardTags(cardId, tags)
      if (success) {
        const card = cards.value.find((c) => c.id === cardId)
        if (card) {
          card.tags = [...new Set([...card.tags, ...tags])]
        }
      }
      return success
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加标签失败'
      console.error('[useCard] 添加标签失败:', e)
      return false
    }
  }

  /**
   * 移除卡片标签
   */
  async function removeCardTags(cardId: string, tags: string[]): Promise<boolean> {
    try {
      const success = await cardEnhanceService.removeCardTags(cardId, tags)
      if (success) {
        const card = cards.value.find((c) => c.id === cardId)
        if (card) {
          card.tags = card.tags.filter((t) => !tags.includes(t))
        }
      }
      return success
    } catch (e) {
      error.value = e instanceof Error ? e.message : '移除标签失败'
      console.error('[useCard] 移除标签失败:', e)
      return false
    }
  }

  /**
   * 批量删除卡片
   */
  async function batchDeleteCards(cardIds: string[]): Promise<void> {
    loading.value = true
    try {
      await cardEnhanceService.batchDeleteCards(cardIds)
      cards.value = cards.value.filter((c) => !cardIds.includes(c.id))
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量删除失败'
      console.error('[useCard] 批量删除失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量移动卡片
   */
  async function batchMoveCards(cardIds: string[], targetStudySetId: string): Promise<void> {
    loading.value = true
    try {
      await cardEnhanceService.batchMoveCards(cardIds, targetStudySetId)
      cards.value = cards.value.filter((c) => !cardIds.includes(c.id))
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量移动失败'
      console.error('[useCard] 批量移动失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量设置难度
   */
  async function batchSetDifficulty(cardIds: string[], difficulty: number): Promise<void> {
    loading.value = true
    try {
      await cardEnhanceService.batchSetCardDifficulty(cardIds, difficulty)
      cardIds.forEach((id) => {
        const card = cards.value.find((c) => c.id === id)
        if (card) {
          card.difficulty = difficulty
        }
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量设置难度失败'
      console.error('[useCard] 批量设置难度失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量添加标签
   */
  async function batchAddTags(cardIds: string[], tags: string[]): Promise<void> {
    loading.value = true
    try {
      await cardEnhanceService.batchAddCardTags(cardIds, tags)
      cardIds.forEach((id) => {
        const card = cards.value.find((c) => c.id === id)
        if (card) {
          card.tags = [...new Set([...card.tags, ...tags])]
        }
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量添加标签失败'
      console.error('[useCard] 批量添加标签失败:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取卡片统计
   */
  function getCardStats(): {
    total: number
    new: number
    learning: number
    review: number
    suspended: number
  } {
    return cardService.countCards(cards.value)
  }

  /**
   * 刷新卡片列表
   */
  async function refresh(): Promise<void> {
    await loadCards()
  }

  // 自动加载
  if (autoLoad) {
    onMounted(() => {
      loadCards()
    })
  }

  return {
    // 状态
    cards,
    filteredCards,
    loading,
    error,

    // 筛选和排序
    filter,
    sortOptions,
    applyFilter,
    applySort,

    // 卡片操作
    createCard,
    createFlashCard,
    updateCard,
    deleteCard,
    createFromAnnotation,

    // 状态流转
    transitionCardStatus,
    updateCardDifficulty,
    addCardTags,
    removeCardTags,

    // 批量操作
    batchDeleteCards,
    batchMoveCards,
    batchSetDifficulty,
    batchAddTags,

    // 统计
    getCardStats,

    // 刷新
    refresh,
  }
}

export default useCard
