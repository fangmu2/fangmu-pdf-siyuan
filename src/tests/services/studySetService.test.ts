/**
 * 学习集服务测试
 */

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  ReviewSettings,
  StudySetFormData,
  studySetService,
} from '../../services/studySetService'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as any

describe('studySetService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  const mockStudySet: StudySetFormData = {
    name: '测试学习集',
    description: '测试描述',
    notebookId: 'test-notebook-id',
    reviewSettings: {
      dailyNewCards: 20,
      dailyReviewLimit: 200,
      algorithm: 'SM2',
    } as ReviewSettings,
  }

  const mockApiResponse = {
    code: 0,
    msg: '',
    data: {
      id: 'test-study-set-id',
      name: '测试学习集',
      description: '测试描述',
      notebookId: 'test-notebook-id',
      reviewSettings: {
        dailyNewCards: 20,
        dailyReviewLimit: 200,
        algorithm: 'SM2',
      },
      cards: [],
      pdfs: [],
    },
  }

  describe('createStudySet', () => {
    it('should create a study set successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      })

      const result = await studySetService.createStudySet(mockStudySet)

      expect(result).toEqual(mockApiResponse.data)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/studySet/create',
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
        studySetService.createStudySet(mockStudySet),
      ).rejects.toThrow('创建失败')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        studySetService.createStudySet(mockStudySet),
      ).rejects.toThrow('Network error')
    })
  })

  describe('getAllStudySets', () => {
    it('should get all study sets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [mockApiResponse.data],
        }),
      })

      const result = await studySetService.getAllStudySets()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('测试学习集')
    })

    it('should return empty array when no study sets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: [],
        }),
      })

      const result = await studySetService.getAllStudySets()

      expect(result).toEqual([])
    })
  })

  describe('getStudySet', () => {
    it('should get a specific study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      })

      const result = await studySetService.getStudySet('test-id')

      expect(result).toEqual(mockApiResponse.data)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/studySet/get',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('updateStudySet', () => {
    it('should update a study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      const updateData = {
        id: 'test-id',
        name: '更新后的名称',
      }

      await studySetService.updateStudySet(updateData)

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('deleteStudySet', () => {
    it('should delete a study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await studySetService.deleteStudySet('test-id')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/studySet/delete',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('addCardToStudySet', () => {
    it('should add a card to study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await studySetService.addCardToStudySet('study-set-id', 'card-id')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/studySet/addCard',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })

  describe('removeCardFromStudySet', () => {
    it('should remove a card from study set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          data: null,
        }),
      })

      await studySetService.removeCardFromStudySet('study-set-id', 'card-id')

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('getStudySetStats', () => {
    it('should get study set statistics', async () => {
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

      const stats = await studySetService.getStudySetStats('study-set-id')

      expect(stats.totalCards).toBe(100)
      expect(stats.dueToday).toBe(15)
    })
  })
})
