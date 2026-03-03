/**
 * PDF 跳转服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  jumpToPDF,
  queryPDFFromAnnotation,
  queryPDFFromCard,
  extractPDFLocationFromNode,
  type PDFLocation
} from '../../services/pdfJumpService'

// Mock postApi
vi.mock('@/api/siyuanApi', () => ({
  postApi: vi.fn()
}))

const { postApi } = await import('@/api/siyuanApi')

describe('pdfJumpService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('queryPDFFromAnnotation', () => {
    it('should query PDF location from annotation with file-annotation-ref', async () => {
      const mockAnnotationId = '20240101120000-abc1234'
      const mockBlock = {
        id: mockAnnotationId,
        type: 'NodeTextMark',
        content: '测试标注内容',
        ial: {
          'file-annotation-ref': 'assets/test.pdf?path=/data/assets/test.pdf&page=5&rect=100,200,300,400'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromAnnotation(mockAnnotationId)

      expect(result).toEqual({
        pdfPath: '/data/assets/test.pdf',
        page: 5,
        rect: [100, 200, 300, 400],
        blockId: mockAnnotationId
      })
      expect(postApi).toHaveBeenCalledWith('/api/block/getBlock', { id: mockAnnotationId })
    })

    it('should query PDF location from annotation with custom attributes', async () => {
      const mockAnnotationId = '20240101120000-abc1234'
      const mockBlock = {
        id: mockAnnotationId,
        type: 'p',
        content: '测试内容',
        ial: {
          'custom-annotation-pdf-path': '/data/assets/custom.pdf',
          'custom-annotation-page': '10',
          'custom-annotation-rect': '[50,100,200,300]'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromAnnotation(mockAnnotationId)

      expect(result).toEqual({
        pdfPath: '/data/assets/custom.pdf',
        page: 10,
        rect: [50, 100, 200, 300],
        blockId: mockAnnotationId
      })
    })

    it('should return null when annotation not found', async () => {
      vi.mocked(postApi).mockResolvedValueOnce(null)

      const result = await queryPDFFromAnnotation('non-existent-id')

      expect(result).toBeNull()
    })

    it('should return null when no PDF info in annotation', async () => {
      const mockBlock = {
        id: '20240101120000-abc1234',
        type: 'p',
        content: '普通段落',
        ial: {}
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromAnnotation('20240101120000-abc1234')

      expect(result).toBeNull()
    })

    it('should handle API error', async () => {
      vi.mocked(postApi).mockRejectedValueOnce(new Error('API error'))

      const result = await queryPDFFromAnnotation('error-id')

      expect(result).toBeNull()
    })

    it('should handle textMark type with textMarkData', async () => {
      const mockAnnotationId = '20240101120000-abc1234'
      const mockBlock = {
        id: mockAnnotationId,
        type: 'NodeTextMark',
        textMarkType: 'file-annotation-ref',
        textMarkData: {
          ref: 'assets/test.pdf?path=/data/assets/test.pdf&page=3&rect=80,150,280,350'
        },
        ial: {}
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromAnnotation(mockAnnotationId)

      expect(result).toEqual({
        pdfPath: '/data/assets/test.pdf',
        page: 3,
        rect: [80, 150, 280, 350],
        blockId: mockAnnotationId
      })
    })
  })

  describe('queryPDFFromCard', () => {
    it('should query PDF location from card with custom attributes', async () => {
      const mockCardId = '20240101120000-card001'
      const mockBlock = {
        id: mockCardId,
        type: 'p',
        content: '卡片内容',
        ial: {
          'custom-pdf-path': '/data/assets/card-pdf.pdf',
          'custom-page': '7',
          'custom-rect': '[120,220,320,420]'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromCard(mockCardId)

      expect(result).toEqual({
        pdfPath: '/data/assets/card-pdf.pdf',
        page: 7,
        rect: [120, 220, 320, 420],
        blockId: mockCardId
      })
    })

    it('should query PDF location from cloned card via source-node-id', async () => {
      const mockCardId = '20240101120000-card001'
      const mockSourceId = '20240101120000-ann001'
      
      // 第一次调用返回卡片信息（包含 source-node-id）
      const mockCardBlock = {
        id: mockCardId,
        type: 'p',
        content: '克隆卡片',
        ial: {
          'custom-source-node-id': mockSourceId
        }
      }

      // 第二次调用返回源标注信息
      const mockAnnotationBlock = {
        id: mockSourceId,
        type: 'NodeTextMark',
        content: '原始标注',
        ial: {
          'file-annotation-ref': 'assets/original.pdf?path=/data/assets/original.pdf&page=2&rect=60,180,260,380'
        }
      }

      vi.mocked(postApi)
        .mockResolvedValueOnce(mockCardBlock)
        .mockResolvedValueOnce(mockAnnotationBlock)

      const result = await queryPDFFromCard(mockCardId)

      expect(result).toEqual({
        pdfPath: '/data/assets/original.pdf',
        page: 2,
        rect: [60, 180, 260, 380],
        blockId: mockCardId
      })
      expect(postApi).toHaveBeenCalledTimes(2)
    })

    it('should return null when card not found', async () => {
      vi.mocked(postApi).mockResolvedValueOnce(null)

      const result = await queryPDFFromCard('non-existent-card')

      expect(result).toBeNull()
    })

    it('should return null when card has no PDF info', async () => {
      const mockBlock = {
        id: '20240101120000-card001',
        type: 'p',
        content: '普通卡片',
        ial: {}
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromCard('20240101120000-card001')

      expect(result).toBeNull()
    })

    it('should handle card with file-annotation-ref', async () => {
      const mockCardId = '20240101120000-card001'
      const mockBlock = {
        id: mockCardId,
        type: 'p',
        content: '直接引用 PDF 的卡片',
        ial: {
          'file-annotation-ref': 'assets/direct.pdf?path=/data/assets/direct.pdf&page=1&rect=0,0,100,100'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await queryPDFFromCard(mockCardId)

      expect(result).toEqual({
        pdfPath: '/data/assets/direct.pdf',
        page: 1,
        rect: [0, 0, 100, 100],
        blockId: mockCardId
      })
    })
  })

  describe('extractPDFLocationFromNode', () => {
    it('should extract from docRef if present', async () => {
      const nodeData = {
        docRef: {
          pdfPath: '/data/assets/docref.pdf',
          page: 4,
          rect: [10, 20, 30, 40]
        }
      }

      const result = await extractPDFLocationFromNode(nodeData)

      expect(result).toEqual({
        pdfPath: '/data/assets/docref.pdf',
        page: 4,
        rect: [10, 20, 30, 40],
        blockId: undefined
      })
      // 不应该调用 API
      expect(postApi).not.toHaveBeenCalled()
    })

    it('should query from annotationId when present', async () => {
      const nodeData = {
        annotationId: '20240101120000-ann001'
      }

      const mockBlock = {
        id: nodeData.annotationId,
        type: 'NodeTextMark',
        content: '标注',
        ial: {
          'file-annotation-ref': 'assets/from-node.pdf?path=/data/assets/from-node.pdf&page=6&rect=11,22,33,44'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await extractPDFLocationFromNode(nodeData)

      expect(result).toEqual({
        pdfPath: '/data/assets/from-node.pdf',
        page: 6,
        rect: [11, 22, 33, 44],
        blockId: nodeData.annotationId
      })
    })

    it('should query from cardId when present', async () => {
      const nodeData = {
        cardId: '20240101120000-card001'
      }

      const mockBlock = {
        id: nodeData.cardId,
        type: 'p',
        content: '卡片',
        ial: {
          'custom-pdf-path': '/data/assets/card-node.pdf',
          'custom-page': '8'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockBlock)

      const result = await extractPDFLocationFromNode(nodeData)

      expect(result).toEqual({
        pdfPath: '/data/assets/card-node.pdf',
        page: 8,
        blockId: nodeData.cardId
      })
    })

    it('should return null when no valid data', async () => {
      const nodeData = {
        randomField: 'value'
      }

      const result = await extractPDFLocationFromNode(nodeData)

      expect(result).toBeNull()
    })

    it('should prioritize annotationId over cardId when both present', async () => {
      const nodeData = {
        annotationId: '20240101120000-ann001',
        cardId: '20240101120000-card001'
      }

      const mockAnnotationBlock = {
        id: nodeData.annotationId,
        type: 'NodeTextMark',
        content: '标注',
        ial: {
          'file-annotation-ref': 'assets/priority.pdf?path=/data/assets/priority.pdf&page=9&rect=99,88,77,66'
        }
      }

      vi.mocked(postApi).mockResolvedValueOnce(mockAnnotationBlock)

      const result = await extractPDFLocationFromNode(nodeData)

      expect(result).toEqual({
        pdfPath: '/data/assets/priority.pdf',
        page: 9,
        rect: [99, 88, 77, 66],
        blockId: nodeData.annotationId
      })
      // 不应该查询 cardId
      expect(postApi).toHaveBeenCalledTimes(1)
    })
  })

  describe('jumpToPDF', () => {
    it('should successfully jump to PDF location', async () => {
      const location: PDFLocation = {
        pdfPath: '/data/assets/test.pdf',
        page: 5,
        rect: [100, 200, 300, 400],
        blockId: '20240101120000-abc1234'
      }

      // Mock postApi for openPDFDocument
      vi.mocked(postApi).mockResolvedValueOnce({})

      // Mock window.postMessage
      const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {})

      const result = await jumpToPDF(location)

      expect(result).toBe(true)
      expect(postMessageSpy).toHaveBeenCalledTimes(3) // OPEN_PDF, PDF_GOTO_PAGE, PDF_HIGHLIGHT_RECT
    })

    it('should handle jump without rect', async () => {
      const location: PDFLocation = {
        pdfPath: '/data/assets/test.pdf',
        page: 3
      }

      const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
      vi.mocked(postApi).mockResolvedValueOnce({})

      const result = await jumpToPDF(location)

      expect(result).toBe(true)
      expect(postMessageSpy).toHaveBeenCalledTimes(2) // OPEN_PDF, PDF_GOTO_PAGE
    })

    it('should return false when opening PDF fails', async () => {
      const location: PDFLocation = {
        pdfPath: '/data/assets/nonexistent.pdf',
        page: 1
      }

      vi.mocked(postApi).mockResolvedValueOnce(null)

      const result = await jumpToPDF(location)

      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const location: PDFLocation = {
        pdfPath: '/data/assets/error.pdf',
        page: 1
      }

      vi.mocked(postApi).mockRejectedValueOnce(new Error('Network error'))

      const result = await jumpToPDF(location)

      expect(result).toBe(false)
    })
  })
})
