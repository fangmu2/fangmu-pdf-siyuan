// src/composables/usePDFRenderer.ts
import { ref, onBeforeUnmount } from 'vue'
import type { PDFPageProxy } from 'pdfjs-dist'
import { renderPage as renderPageUtil, renderTextLayer as renderTextLayerUtil } from '@/utils/pdf'

/**
 * PDF 渲染器 Composable
 * 负责 PDF 页面的 Canvas 渲染和文本层渲染
 */
export function usePDFRenderer() {
  const currentRenderTask = ref<{ cancel: () => void } | null>(null)
  const currentViewport = ref<any>(null)
  const renderedPages = ref<number[]>([])

  /**
   * 渲染页面到 Canvas
   */
  const renderPageToCanvas = async (
    page: PDFPageProxy,
    canvas: HTMLCanvasElement,
    containerWidth: number,
    scale: number,
  ): Promise<any> => {
    // 取消之前的渲染任务
    if (currentRenderTask.value) {
      currentRenderTask.value.cancel()
      currentRenderTask.value = null
    }

    try {
      const viewport = await renderPageUtil(page, canvas, containerWidth * scale)

      currentRenderTask.value = {
        cancel: () => {
          console.log('[usePDFRenderer] 渲染任务已取消')
        },
      }

      currentViewport.value = viewport
      currentRenderTask.value = null

      return viewport
    } catch (e: any) {
      if (e.name === 'RenderingCancelledException') {
        console.log('[usePDFRenderer] 渲染已取消')
        throw e
      }
      console.error('渲染页面失败:', e)
      throw e
    }
  }

  /**
   * 渲染文本层
   */
  const renderTextLayer = async (
    page: PDFPageProxy,
    textLayerDiv: HTMLElement,
    viewport: any,
  ): Promise<void> => {
    await renderTextLayerUtil(page, textLayerDiv, viewport)
  }

  /**
   * 连续滚动模式渲染多页
   */
  const renderContinuousScroll = async (
    pdfDoc: any,
    pageContainer: HTMLElement,
    currentPageNum: number,
    totalPages: number,
    containerWidth: number,
    scale: number,
    renderPageHighlights: (pageNum: number, highlightDiv: HTMLElement, viewport: any) => void,
  ) => {
    if (!pdfDoc || !pageContainer) return

    try {
      // 清空容器
      pageContainer.innerHTML = ''

      // 渲染当前页及前后各 2 页（共 5 页）
      const pagesToRender: number[] = []
      const startPage = Math.max(1, currentPageNum - 2)
      const endPage = Math.min(totalPages, currentPageNum + 2)

      for (let i = startPage; i <= endPage; i++) {
        pagesToRender.push(i)
      }

      renderedPages.value = pagesToRender

      // 为每页创建容器
      for (const pageNum of pagesToRender) {
        const page = await pdfDoc.getPage(pageNum)
        const canvas = document.createElement('canvas')
        canvas.className = 'pdf-canvas continuous-page-canvas'

        const viewport = await renderPageUtil(page, canvas, containerWidth * scale)

        // 创建页面容器
        const pageWrapper = document.createElement('div')
        pageWrapper.className = 'continuous-page-wrapper'
        pageWrapper.dataset.pageNumber = String(pageNum)
        pageWrapper.appendChild(canvas)

        // 创建文本层容器
        const textLayerDiv = document.createElement('div')
        textLayerDiv.className = 'pdf-text-layer continuous-text-layer'
        pageWrapper.appendChild(textLayerDiv)

        // 渲染文本层
        await renderTextLayerUtil(page, textLayerDiv, viewport)

        // 创建高亮层容器
        const highlightDiv = document.createElement('div')
        highlightDiv.className = 'highlight-layer continuous-highlight-layer'
        highlightDiv.style.width = `${viewport.width}px`
        highlightDiv.style.height = `${viewport.height}px`
        pageWrapper.appendChild(highlightDiv)

        // 存储页面数据
        pageWrapper.dataset.viewport = JSON.stringify({
          scale: viewport.scale,
          width: viewport.width,
          height: viewport.height,
        })

        pageContainer.appendChild(pageWrapper)

        // 渲染该页的标注高亮
        renderPageHighlights(pageNum, highlightDiv, viewport)
      }

      // 滚动到当前页
      const currentPageWrapper = pageContainer.querySelector(`[data-page-number="${currentPageNum}"]`)
      if (currentPageWrapper) {
        currentPageWrapper.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    } catch (e: any) {
      console.error('连续滚动渲染失败:', e)
      throw e
    }
  }

  /**
   * 取消当前渲染
   */
  const cancelRender = () => {
    if (currentRenderTask.value) {
      currentRenderTask.value.cancel()
      currentRenderTask.value = null
    }
  }

  /**
   * 获取当前 viewport
   */
  const getViewport = () => currentViewport.value

  /**
   * 清理
   */
  const cleanup = () => {
    cancelRender()
    renderedPages.value = []
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // State
    currentViewport,
    renderedPages,

    // Methods
    renderPageToCanvas,
    renderTextLayer,
    renderContinuousScroll,
    cancelRender,
    getViewport,
    cleanup,
  }
}
