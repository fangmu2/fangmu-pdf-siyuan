/**
 * useReview Composable
 * 复习会话操作逻辑封装
 * 遵循 .clinerules.md 规范
 */

import type { Ref } from 'vue'
import type {
  Card,
  FlashCard,
} from '../types/card'
import type {
  ReviewQuality,
  ReviewRecord,
  ReviewSession,
} from '../types/review'
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { fsrsReviewService } from '../services/fsrsReviewService'
import { reviewService } from '../services/reviewService'

/**
 * 复习评分（1-4 对应 Again/Hard/Good/Easy）
 */
export type ReviewRating = 1 | 2 | 3 | 4

/**
 * useReview 参数接口
 */
export interface UseReviewOptions {
  /** 学习集 ID（可选，不传则获取所有到期卡片） */
  studySetId?: string
  /** 是否使用 FSRS 算法（默认使用简化 SM-2） */
  useFSRS?: boolean
  /** 每日新卡上限 */
  newCardLimit?: number
  /** 是否启用自动加载 */
  autoLoad?: boolean
}

/**
 * useReview 返回值接口
 */
export interface UseReviewReturn {
  // 状态
  reviewQueue: Ref<Card[]>
  currentCard: Ref<Card | null>
  currentIndex: Ref<number>
  totalCards: Ref<number>
  loading: Ref<boolean>
  error: Ref<string | null>
  isReviewing: Ref<boolean>
  showAnswer: Ref<boolean>

  // 复习会话
  session: Ref<ReviewSession | null>
  sessionStats: Ref<{
    reviewed: number
    again: number
    hard: number
    good: number
    easy: number
  }>

  // 复习操作
  startReview: () => Promise<void>
  showAnswerCard: () => void
  rateCard: (rating: ReviewRating) => Promise<void>
  skipCard: () => void
  endReview: () => void

  // FSRS 特有
  nextReviewTime: Ref<number | null>
  memoryRetrievability: Ref<number | null>

  // 统计
  getDueCardsCount: () => Promise<number>
  getReviewStats: (studySetId?: string) => Promise<{
    totalReviewed: number
    correctRate: number
    streak: number
  }>
}

/**
 * 复习 Composable
 * @param options - 配置选项
 * @returns 复习操作相关的方法和状态
 */
export function useReview(options: UseReviewOptions = {}): UseReviewReturn {
  const {
    studySetId,
    useFSRS = false,
    newCardLimit = 20,
    autoLoad = false,
  } = options

  // 状态
  const reviewQueue = ref<Card[]>([])
  const currentCard = ref<Card | null>(null)
  const currentIndex = ref<number>(0)
  const totalCards = ref<number>(0)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const isReviewing = ref<boolean>(false)
  const showAnswer = ref<boolean>(false)

  // 复习会话
  const session = ref<ReviewSession | null>(null)
  const sessionStats = ref({
    reviewed: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })

  // FSRS 特有状态
  const nextReviewTime = ref<number | null>(null)
  const memoryRetrievability = ref<number | null>(null)

  /**
   * 获取复习队列
   */
  async function fetchReviewQueue(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let queue: Card[]

      if (useFSRS) {
        // 使用 FSRS 算法
        queue = await fsrsReviewService.getFSRSReviewQueue(studySetId)
      } else {
        // 使用简化 SM-2 算法
        queue = await reviewService.getReviewQueue(studySetId, newCardLimit)
      }

      reviewQueue.value = queue
      totalCards.value = queue.length
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取复习队列失败'
      console.error('[useReview] 获取复习队列失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始复习
   */
  async function startReview(): Promise<void> {
    await fetchReviewQueue()

    if (reviewQueue.value.length === 0) {
      isReviewing.value = false
      return
    }

    isReviewing.value = true
    currentIndex.value = 0
    currentCard.value = reviewQueue.value[0]
    showAnswer.value = false

    // 创建复习会话
    session.value = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      endTime: 0,
      totalCards: reviewQueue.value.length,
      reviewedCards: [],
      studySetId,
    }
  }

  /**
   * 显示答案
   */
  function showAnswerCard(): void {
    showAnswer.value = true

    // 如果是 FSRS，计算记忆可提取性
    if (useFSRS && currentCard.value?.type === 'flashcard') {
      const flashCard = currentCard.value as FlashCard
      if (flashCard.srs) {
        const prediction = fsrsReviewService.getMemoryPrediction(flashCard.srs)
        memoryRetrievability.value = prediction.currentRetrievability
      }
    }
  }

  /**
   * 评分卡片
   */
  async function rateCard(rating: ReviewRating): Promise<void> {
    if (!currentCard.value) {
      return
    }

    loading.value = true

    try {
      let reviewRecord: ReviewRecord

      if (useFSRS) {
        // 使用 FSRS 处理复习
        const result = await fsrsReviewService.processCardReview(
          currentCard.value as FlashCard,
          rating,
        )
        reviewRecord = result.reviewRecord

        // 更新下次复习时间
        if (result.nextReviewTime) {
          nextReviewTime.value = result.nextReviewTime
        }
      } else {
        // 使用简化 SM-2 处理复习
        reviewRecord = await reviewService.processReview(
          currentCard.value.id,
          rating as ReviewQuality,
        )
      }

      // 更新会话统计
      sessionStats.value.reviewed++
      switch (rating) {
        case 1:
          sessionStats.value.again++
          break
        case 2:
          sessionStats.value.hard++
          break
        case 3:
          sessionStats.value.good++
          break
        case 4:
          sessionStats.value.easy++
          break
      }

      // 更新卡片状态
      if (reviewRecord.card) {
        const index = reviewQueue.value.findIndex((c) => c.id === reviewRecord.card?.id)
        if (index !== -1) {
          reviewQueue.value[index] = reviewRecord.card
        }
      }

      // 移动到下一张卡片
      currentIndex.value++
      if (currentIndex.value < reviewQueue.value.length) {
        currentCard.value = reviewQueue.value[currentIndex.value]
        showAnswer.value = false
        memoryRetrievability.value = null
        nextReviewTime.value = null
      } else {
        // 复习完成
        endReview()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '评分失败'
      console.error('[useReview] 评分失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 跳过卡片
   */
  function skipCard(): void {
    currentIndex.value++
    if (currentIndex.value < reviewQueue.value.length) {
      currentCard.value = reviewQueue.value[currentIndex.value]
      showAnswer.value = false
      memoryRetrievability.value = null
      nextReviewTime.value = null
    }
  }

  /**
   * 结束复习
   */
  function endReview(): void {
    isReviewing.value = false
    showAnswer.value = false
    currentCard.value = null
    memoryRetrievability.value = null
    nextReviewTime.value = null

    if (session.value) {
      session.value.endTime = Date.now()
      session.value = null
    }

    // 清空队列
    reviewQueue.value = []
    currentIndex.value = 0
    totalCards.value = 0
  }

  /**
   * 获取到期卡片数量
   */
  async function getDueCardsCount(): Promise<number> {
    try {
      if (useFSRS) {
        const queue = await fsrsReviewService.getFSRSReviewQueue(studySetId)
        return queue.length
      } else {
        const queue = await reviewService.getReviewQueue(studySetId, 0)
        return queue.length
      }
    } catch (e) {
      console.error('[useReview] 获取到期卡片数量失败:', e)
      return 0
    }
  }

  /**
   * 获取复习统计
   */
  async function getReviewStats(studySetId?: string): Promise<{
    totalReviewed: number
    correctRate: number
    streak: number
  }> {
    try {
      const stats = await reviewService.getReviewStats(studySetId)
      return {
        totalReviewed: stats.totalReviewed || 0,
        correctRate: stats.correctRate || 0,
        streak: stats.streak || 0,
      }
    } catch (e) {
      console.error('[useReview] 获取复习统计失败:', e)
      return {
        totalReviewed: 0,
        correctRate: 0,
        streak: 0,
      }
    }
  }

  // 键盘快捷键处理
  function handleKeyDown(event: KeyboardEvent): void {
    if (!isReviewing.value) {
      return
    }

    // 空格键显示答案
    if (event.code === 'Space' && !showAnswer.value) {
      event.preventDefault()
      showAnswerCard()
      return
    }

    // 数字键 1-4 评分
    if (showAnswer.value) {
      switch (event.key) {
        case '1':
          event.preventDefault()
          rateCard(1)
          break
        case '2':
          event.preventDefault()
          rateCard(2)
          break
        case '3':
          event.preventDefault()
          rateCard(3)
          break
        case '4':
          event.preventDefault()
          rateCard(4)
          break
      }
    }
  }

  // 自动加载和生命周期
  if (autoLoad) {
    onMounted(() => {
      fetchReviewQueue()
    })
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    // 状态
    reviewQueue,
    currentCard,
    currentIndex,
    totalCards,
    loading,
    error,
    isReviewing,
    showAnswer,

    // 复习会话
    session,
    sessionStats,

    // 复习操作
    startReview,
    showAnswerCard,
    rateCard,
    skipCard,
    endReview,

    // FSRS 特有
    nextReviewTime,
    memoryRetrievability,

    // 统计
    getDueCardsCount,
    getReviewStats,
  }
}

export default useReview
