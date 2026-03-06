/**
 * 复习状态管理 Store
 * 遵循 .clinerules.md 规范
 */

import type {
  Card,
  FlashCard,
} from '../types/card'
import type {
  ReviewRecord,
  ReviewSession,
  ReviewStats,
} from '../types/review'
import { defineStore } from 'pinia'
import {
  computed,
  ref,
} from 'vue'
import { fsrsReviewService } from '../services/fsrsReviewService'
import { reviewService } from '../services/reviewService'

/**
 * 复习评分（1-4 对应 Again/Hard/Good/Easy）
 */
export type ReviewRating = 1 | 2 | 3 | 4

/**
 * 复习 Store
 */
export const useReviewStore = defineStore('review', () => {
  // 状态
  const reviewQueue = ref<Card[]>([])
  const currentCard = ref<Card | null>(null)
  const currentIndex = ref<number>(0)
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

  // 是否使用 FSRS 算法
  const useFSRS = ref<boolean>(false)

  // Getters
  const totalCards = computed<number>(() => reviewQueue.value.length)

  const progress = computed<number>(() => {
    if (totalCards.value === 0) return 0
    return Math.round((currentIndex.value / totalCards.value) * 100)
  })

  const remainingCards = computed<number>(() => {
    return totalCards.value - currentIndex.value
  })

  const dueCardsCount = ref<number>(0)

  // Actions
  /**
   * 获取复习队列
   */
  async function fetchReviewQueue(studySetId?: string, newCardLimit: number = 20): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let queue: Card[]

      if (useFSRS.value) {
        queue = await fsrsReviewService.getFSRSReviewQueue(studySetId)
      } else {
        queue = await reviewService.getReviewQueue(studySetId, newCardLimit)
      }

      reviewQueue.value = queue
      dueCardsCount.value = queue.length
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取复习队列失败'
      console.error('[ReviewStore] 获取复习队列失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始复习
   */
  function startReview(studySetId?: string): void {
    if (reviewQueue.value.length === 0) {
      isReviewing.value = false
      return
    }

    isReviewing.value = true
    currentIndex.value = 0
    currentCard.value = reviewQueue.value[0]
    showAnswer.value = false
    nextReviewTime.value = null
    memoryRetrievability.value = null

    // 创建复习会话
    session.value = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      endTime: 0,
      totalCards: reviewQueue.value.length,
      reviewedCards: [],
      studySetId,
    }

    // 重置统计
    sessionStats.value = {
      reviewed: 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    }
  }

  /**
   * 显示答案
   */
  function showAnswerCard(): void {
    showAnswer.value = true

    // 如果是 FSRS，计算记忆可提取性
    if (useFSRS.value && currentCard.value?.type === 'flashcard') {
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

      if (useFSRS.value) {
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
          rating,
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

      // 添加到已复习列表
      if (session.value) {
        session.value.reviewedCards.push(reviewRecord)
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
        completeReview()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '评分失败'
      console.error('[ReviewStore] 评分失败:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 完成复习
   */
  function completeReview(): void {
    if (session.value) {
      session.value.endTime = Date.now()
    }

    isReviewing.value = false
    showAnswer.value = false
    currentCard.value = null
    memoryRetrievability.value = null
    nextReviewTime.value = null
  }

  /**
   * 结束复习
   */
  function endReview(): void {
    completeReview()

    // 清空队列
    reviewQueue.value = []
    currentIndex.value = 0
    session.value = null
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
    } else {
      completeReview()
    }
  }

  /**
   * 设置是否使用 FSRS 算法
   */
  function setUseFSRS(value: boolean): void {
    useFSRS.value = value
  }

  /**
   * 获取到期卡片数量
   */
  async function fetchDueCardsCount(studySetId?: string): Promise<void> {
    try {
      if (useFSRS.value) {
        const queue = await fsrsReviewService.getFSRSReviewQueue(studySetId)
        dueCardsCount.value = queue.length
      } else {
        const queue = await reviewService.getReviewQueue(studySetId, 0)
        dueCardsCount.value = queue.length
      }
    } catch (e) {
      console.error('[ReviewStore] 获取到期卡片数量失败:', e)
      dueCardsCount.value = 0
    }
  }

  /**
   * 获取复习统计
   */
  async function fetchReviewStats(studySetId?: string): Promise<ReviewStats> {
    try {
      const stats = await reviewService.getReviewStats(studySetId)
      return stats
    } catch (e) {
      console.error('[ReviewStore] 获取复习统计失败:', e)
      return {
        totalReviewed: 0,
        correctRate: 0,
        streak: 0,
        totalCards: 0,
        cardsLearned: 0,
        accuracy: 0,
      }
    }
  }

  /**
   * 清空错误
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // 状态
    reviewQueue,
    currentCard,
    currentIndex,
    loading,
    error,
    isReviewing,
    showAnswer,
    session,
    sessionStats,
    nextReviewTime,
    memoryRetrievability,
    useFSRS,

    // Getters
    totalCards,
    progress,
    remainingCards,
    dueCardsCount,

    // Actions
    fetchReviewQueue,
    startReview,
    showAnswerCard,
    rateCard,
    completeReview,
    endReview,
    skipCard,
    setUseFSRS,
    fetchDueCardsCount,
    fetchReviewStats,
    clearError,
  }
})

export default useReviewStore
