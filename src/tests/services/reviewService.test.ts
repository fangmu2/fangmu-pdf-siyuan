/**
 * 复习服务测试
 */

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { reviewService } from '../../services/reviewService'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as any

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockReviewCard = {
    id: 'test-card-id',
    title: '测试卡片',
    content: '测试内容',
    type: 'flashcard',
    front: '问题',
    back: '答案',
    srsParams: {
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lastReview: Date.now(),
      nextReview: Date.now(),
    },
    status: 'learning',
    difficulty: 3,
  }

  const mockReviewResult = {
    cardId: 'test-card-id',
    quality: 4,
    responseTime: 5000,
    reviewedAt: Date.now(),
  }

  describe('startReviewSession', () => {
    it('should start a review session successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'test-session-id',
            studySetId: 'test-study-set-id',
            mode: 'normal',
            cards: [mockReviewCard],
            totalCards: 10,
          },
        }),
      })

      const result = await reviewService.startReviewSession(
        'test-study-set-id',
        'normal',
        {
          newCardsLimit: 20,
          reviewLimit: 200,
        },
      )

      expect(result.sessionId).toBe('test-session-id')
      expect(result.mode).toBe('normal')
    })

    it('should start a new cards session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'test-session-id',
            mode: 'new',
            cards: [mockReviewCard],
          },
        }),
      })

      const result = await reviewService.startReviewSession(
        'test-study-set-id',
        'new',
      )

      expect(result.mode).toBe('new')
    })

    it('should start a wrong cards session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'test-session-id',
            mode: 'wrong',
            cards: [mockReviewCard],
          },
        }),
      })

      const result = await reviewService.startReviewSession(
        'test-study-set-id',
        'wrong',
      )

      expect(result.mode).toBe('wrong')
    })

    it('should start a random test session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'test-session-id',
            mode: 'random',
            cards: [mockReviewCard],
          },
        }),
      })

      const result = await reviewService.startReviewSession(
        'test-study-set-id',
        'random',
      )

      expect(result.mode).toBe('random')
    })
  })

  describe('getNextCard', () => {
    it('should get next card from session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: mockReviewCard,
        }),
      })

      const result = await reviewService.getNextCard('test-session-id')

      expect(result).toEqual(mockReviewCard)
    })

    it('should return null when no more cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      const result = await reviewService.getNextCard('test-session-id')

      expect(result).toBeNull()
    })
  })

  describe('submitReview', () => {
    it('should submit a review result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            nextReview: Date.now() + 86400000,
            interval: 1,
            easeFactor: 2.5,
          },
        }),
      })

      const result = await reviewService.submitReview(
        'test-session-id',
        mockReviewResult,
      )

      expect(result.nextReview).toBeDefined()
      expect(result.interval).toBe(1)
    })

    it('should handle different quality scores', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            nextReview: Date.now() + 86400000 * 3,
            interval: 3,
            easeFactor: 2.6,
          },
        }),
      })

      const result = await reviewService.submitReview('test-session-id', {
        ...mockReviewResult,
        quality: 5,
      })

      expect(result.interval).toBeGreaterThan(1)
    })
  })

  describe('endReviewSession', () => {
    it('should end a review session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            sessionId: 'test-session-id',
            reviewedCount: 10,
            correctCount: 8,
            averageResponseTime: 4500,
          },
        }),
      })

      const result = await reviewService.endReviewSession('test-session-id')

      expect(result.reviewedCount).toBe(10)
      expect(result.correctCount).toBe(8)
    })
  })

  describe('getSessionStats', () => {
    it('should get session statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            totalCards: 20,
            reviewedCards: 10,
            correctCards: 8,
            remainingCards: 10,
            accuracy: 0.8,
            averageResponseTime: 4500,
          },
        }),
      })

      const stats = await reviewService.getSessionStats('test-session-id')

      expect(stats.totalCards).toBe(20)
      expect(stats.accuracy).toBe(0.8)
    })
  })

  describe('getDueCards', () => {
    it('should get due cards for study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            dueCards: [mockReviewCard],
            totalDue: 15,
            newCards: 5,
          },
        }),
      })

      const result = await reviewService.getDueCards('test-study-set-id')

      expect(result.dueCards).toHaveLength(1)
      expect(result.totalDue).toBe(15)
    })

    it('should limit the number of due cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            dueCards: [mockReviewCard, mockReviewCard, mockReviewCard],
            totalDue: 50,
            newCards: 10,
          },
        }),
      })

      const result = await reviewService.getDueCards('test-study-set-id', {
        limit: 20,
      })

      expect(result.dueCards.length).toBeLessThanOrEqual(20)
    })
  })

  describe('getNewCards', () => {
    it('should get new cards for study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockReviewCard],
        }),
      })

      const result = await reviewService.getNewCards('test-study-set-id', 10)

      expect(result).toHaveLength(1)
    })
  })

  describe('getWrongCards', () => {
    it('should get wrong cards for study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockReviewCard],
        }),
      })

      const result = await reviewService.getWrongCards('test-study-set-id')

      expect(result).toHaveLength(1)
    })
  })

  describe('getReviewHistory', () => {
    it('should get review history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            history: [
              {
                cardId: 'card-1',
                quality: 4,
                reviewedAt: Date.now() - 86400000,
              },
              {
                cardId: 'card-2',
                quality: 5,
                reviewedAt: Date.now(),
              },
            ],
            totalReviews: 100,
          },
        }),
      })

      const result = await reviewService.getReviewHistory('test-study-set-id')

      expect(result.history).toHaveLength(2)
      expect(result.totalReviews).toBe(100)
    })

    it('should filter history by date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            history: [],
            totalReviews: 10,
          },
        }),
      })

      const now = Date.now()
      const weekAgo = now - 7 * 86400000

      await reviewService.getReviewHistory('test-study-set-id', {
        startDate: weekAgo,
        endDate: now,
      })

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('getReviewStats', () => {
    it('should get review statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            totalReviews: 500,
            correctReviews: 400,
            accuracy: 0.8,
            averageResponseTime: 4000,
            streakDays: 7,
            lastReviewDate: Date.now(),
          },
        }),
      })

      const stats = await reviewService.getReviewStats('test-study-set-id')

      expect(stats.totalReviews).toBe(500)
      expect(stats.accuracy).toBe(0.8)
      expect(stats.streakDays).toBe(7)
    })
  })

  describe('cancelSession', () => {
    it('should cancel a review session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await reviewService.cancelSession('test-session-id')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/review/cancelSession',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('skipCard', () => {
    it('should skip a card in session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await reviewService.skipCard('test-session-id', 'card-id')

      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
