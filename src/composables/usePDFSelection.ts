// src/composables/usePDFSelection.ts
import { ref, onBeforeUnmount } from 'vue'
import type { PDFAnnotation, ExtractMode } from '@/types/annotation'
import { getSelectionRect } from '@/utils/pdf'

/**
 * PDF 选择器 Composable
 * 负责文本选择和图片框选功能
 */
export function usePDFSelection() {
  // 选择状态
  const isSelecting = ref(false)
  const selectionStart = ref({ x: 0, y: 0 })
  const selectedAnnotation = ref<PDFAnnotation | null>(null)

  // 全局选择锁（防止跨 HMR 重复触发）
  const SELECTION_LOCK_DURATION = 2000
  let lastImageSelectTime = 0

  const getGlobalLock = () => {
    if (typeof window === 'undefined') {
      return {
        locked: false,
        text: '',
        time: 0,
        lastEmittedText: '',
      }
    }
    ;(window as any).__PDF_SELECTION_LOCK__ ||= {
      locked: false,
      text: '',
      time: 0,
      lastEmittedText: '',
    }
    return (window as any).__PDF_SELECTION_LOCK__
  }

  /**
   * 处理文本选择
   */
  const handleTextSelection = (
    textLayerRef: HTMLElement | null,
    extractMode: ExtractMode | undefined,
    currentPage: number,
    selectedAnnotationType: 'highlight' | 'underline' | 'strikethrough' | 'wavy',
    selectedHighlightColor: string,
    emit: (event: 'text-selected', data: {
      text: string
      page: number
      rect: [number, number, number, number] | null
      annotationType?: 'highlight' | 'underline' | 'strikethrough' | 'wavy'
      color?: string
    }) => void,
  ) => {
    // 图片模式下不处理文本选择
    if (extractMode === 'image') return

    const lock = getGlobalLock()
    const now = Date.now()

    // 全局锁检查：如果正在处理中，直接返回
    if (lock.locked) {
      return
    }

    // 立即设置全局锁，防止竞态条件
    lock.locked = true

    const releaseLock = () => {
      lock.locked = false
    }

    if (!textLayerRef) {
      releaseLock()
      return
    }

    const selection = window.getSelection()
    if (!selection || !selection.toString().trim()) {
      releaseLock()
      return
    }

    const text = selection.toString().trim()

    // 检查是否是最近发出过的相同文本
    if (text === lock.lastEmittedText && (now - lock.time) < SELECTION_LOCK_DURATION) {
      releaseLock()
      return
    }

    // 更新锁的文本和时间
    lock.text = text
    lock.time = now
    lock.lastEmittedText = text

    const rect = getSelectionRect(textLayerRef)

    emit('text-selected', {
      text,
      page: currentPage,
      rect,
      annotationType: selectedAnnotationType,
      color: selectedHighlightColor,
    })

    // 延迟释放锁
    setTimeout(() => {
      lock.locked = false
      setTimeout(() => {
        if (lock.lastEmittedText === text) {
          lock.lastEmittedText = ''
        }
      }, SELECTION_LOCK_DURATION)
    }, 500)
  }

  /**
   * 开始图片框选
   */
  const startImageSelect = (
    e: MouseEvent,
    imageSelectLayerRef: HTMLElement | null,
    extractMode: ExtractMode | undefined,
  ): { x: number, y: number } | null => {
    if (extractMode !== 'image' || !imageSelectLayerRef) return null

    isSelecting.value = true
    const rect = imageSelectLayerRef.getBoundingClientRect()
    const start = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    selectionStart.value = start

    // 创建选择框元素
    const selectionDiv = document.createElement('div')
    selectionDiv.className = 'image-selection-box'
    selectionDiv.style.cssText = `
      position: absolute;
      border: 2px solid #1890ff;
      background: rgba(24, 144, 255, 0.2);
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.5);
      left: ${start.x}px;
      top: ${start.y}px;
      width: 0;
      height: 0;
    `
    imageSelectLayerRef.appendChild(selectionDiv)

    return start
  }

  /**
   * 更新图片框选
   */
  const updateImageSelect = (
    e: MouseEvent,
    imageSelectLayerRef: HTMLElement | null,
    selectionDiv: HTMLDivElement | null,
  ) => {
    if (!isSelecting.value || !selectionDiv || !imageSelectLayerRef) return

    const rect = imageSelectLayerRef.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const left = Math.min(selectionStart.value.x, currentX)
    const top = Math.min(selectionStart.value.y, currentY)
    const width = Math.abs(currentX - selectionStart.value.x)
    const height = Math.abs(currentY - selectionStart.value.y)

    selectionDiv.style.left = `${left}px`
    selectionDiv.style.top = `${top}px`
    selectionDiv.style.width = `${width}px`
    selectionDiv.style.height = `${height}px`
  }

  /**
   * 结束图片框选
   */
  const endImageSelect = (
    e: MouseEvent,
    imageSelectLayerRef: HTMLElement | null,
    selectionDiv: HTMLDivElement | null,
    canvasRef: HTMLCanvasElement | null,
    currentPageObj: any,
    currentViewport: any,
    currentPage: number,
    emit: (event: 'image-selected', data: {
      canvasRect: { x: number, y: number, width: number, height: number }
      pdfRect: [number, number, number, number]
      page: number
    }) => void,
  ) => {
    if (!isSelecting.value || !selectionDiv || !imageSelectLayerRef || !canvasRef) return

    // 防抖
    const now = Date.now()
    if (now - lastImageSelectTime < 500) {
      isSelecting.value = false
      selectionDiv.remove()
      return
    }
    lastImageSelectTime = now

    isSelecting.value = false

    const rect = imageSelectLayerRef.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const left = Math.min(selectionStart.value.x, currentX)
    const top = Math.min(selectionStart.value.y, currentY)
    const width = Math.abs(currentX - selectionStart.value.x)
    const height = Math.abs(currentY - selectionStart.value.y)

    selectionDiv.remove()

    if (width < 10 || height < 10) return

    // 计算 PDF 坐标
    const canvas = canvasRef
    const canvasCssWidth = canvas.offsetWidth

    if (currentPageObj && currentViewport) {
      const viewport = currentPageObj.getViewport({ scale: 1 })
      const pdfScale = viewport.width / canvasCssWidth

      const pdfX1 = left * pdfScale
      const pdfY1 = viewport.height - (top + height) * pdfScale
      const pdfX2 = (left + width) * pdfScale
      const pdfY2 = viewport.height - top * pdfScale

      emit('image-selected', {
        canvasRect: {
          x: left,
          y: top,
          width,
          height,
        },
        pdfRect: [pdfX1, pdfY1, pdfX2, pdfY2],
        page: currentPage,
      })
    }
  }

  /**
   * 设置选中的标注
   */
  const setSelectedAnnotation = (annotation: PDFAnnotation | null) => {
    selectedAnnotation.value = annotation
  }

  /**
   * 获取选中的标注
   */
  const getSelectedAnnotation = () => selectedAnnotation.value

  /**
   * 清理
   */
  const cleanup = () => {
    isSelecting.value = false
    selectedAnnotation.value = null
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // State
    isSelecting,
    selectedAnnotation,

    // Methods
    handleTextSelection,
    startImageSelect,
    updateImageSelect,
    endImageSelect,
    setSelectedAnnotation,
    getSelectedAnnotation,
    cleanup,
  }
}
