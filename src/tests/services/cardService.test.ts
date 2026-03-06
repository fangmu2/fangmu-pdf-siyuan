/**
 * 卡片服务测试
 */

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  CardFormData,
  cardService,
  SRSParams,
} from '../../services/cardService'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as any

describe('cardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockSRSParams: SRSParams = {
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastReview: Date.now(),
    nextReview: Date.now() + 86400000,
  }

  const mockCardData: CardFormData = {
    title: '测试卡片',
    content: '测试内容',
    studySetId: 'test-study-set-id',
    type: 'normal',
    status: 'new',
    difficulty: 3,
    tags: ['标签 1', '标签 2'],
    srsParams: mockSRSParams,
  }

  const mockApiResponse = {
    code: 0,
    msg: '',
    data: {
      id: 'test-card-id',
      title: '测试卡片',
      content: '测试内容',
      studySetId: 'test-study-set-id',
      type: 'normal',
      status: 'new',
      difficulty: 3,
      tags: ['标签 1', '标签 2'],
      srsParams: mockSRSParams,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }

  describe('createCard', () => {
    it('should create a card successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      })

      const result = await cardService.createCard(mockCardData)

      expect(result).toEqual(mockApiResponse.data)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/create',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
        }),
      )
    })

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1,
          msg: '创建失败',
        }),
      })

      await expect(
        cardService.createCard(mockCardData),
      ).rejects.toThrow('创建失败')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        cardService.createCard(mockCardData),
      ).rejects.toThrow('Network error')
    })
  })

  describe('getCard', () => {
    it('should get a specific card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      })

      const result = await cardService.getCard('test-card-id')

      expect(result).toEqual(mockApiResponse.data)
      expect(result.title).toBe('测试卡片')
    })

    it('should handle card not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1,
          msg: '卡片不存在',
        }),
      })

      await expect(cardService.getCard('non-existent-id'))
        .rejects
        .toThrow('卡片不存在')
    })
  })

  describe('updateCard', () => {
    it('should update a card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      const updateData = {
        id: 'test-card-id',
        title: '更新后的标题',
        content: '更新后的内容',
      }

      await cardService.updateCard(updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/update',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    it('should update card status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.updateCardStatus('test-card-id', 'learning')

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should update card difficulty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.updateCardDifficulty('test-card-id', 4)

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.deleteCard('test-card-id')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/delete',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('getCardsByStudySet', () => {
    it('should get cards by study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockApiResponse.data],
        }),
      })

      const result = await cardService.getCardsByStudySet('test-study-set-id')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('测试卡片')
    })

    it('should return empty array when no cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [],
        }),
      })

      const result = await cardService.getCardsByStudySet('empty-study-set')

      expect(result).toEqual([])
    })
  })

  describe('getCardsByStatus', () => {
    it('should get cards by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockApiResponse.data],
        }),
      })

      const result = await cardService.getCardsByStatus('new')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('new')
    })
  })

  describe('addTag', () => {
    it('should add a tag to card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.addTag('test-card-id', '新标签')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/addTag',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('removeTag', () => {
    it('should remove a tag from card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.removeTag('test-card-id', '旧标签')

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('batch operations', () => {
    it('should batch update card status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.batchUpdateStatus(
        ['card-1', 'card-2', 'card-3'],
        'learning',
      )

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should batch add tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.batchAddTags(
        ['card-1', 'card-2'],
        '批量标签',
      )

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should batch delete cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await cardService.batchDelete(['card-1', 'card-2'])

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/batchDelete',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('searchCards', () => {
    it('should search cards by keyword', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockApiResponse.data],
        }),
      })

      const result = await cardService.searchCards('测试')

      expect(result).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/card/search',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    it('should search cards with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockApiResponse.data],
        }),
      })

      const result = await cardService.searchCards('', {
        studySetId: 'test-study-set-id',
        status: 'new',
        tags: ['标签 1'],
      })

      expect(result).toHaveLength(1)
    })
  })

  describe('getCardStats', () => {
    it('should get card statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: {
            totalCards: 100,
            newCards: 20,
            learningCards: 50,
            masteredCards: 30,
            dueToday: 15,
          },
        }),
      })

      const stats = await cardService.getCardStats('test-study-set-id')

      expect(stats.totalCards).toBe(100)
      expect(stats.dueToday).toBe(15)
    })
  })
})
