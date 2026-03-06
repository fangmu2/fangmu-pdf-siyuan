// src/composables/usePDFLoader.ts
import { ref, onBeforeUnmount } from 'vue'
import { getFileAsBlob } from '@/api/siyuanApi'
import { getOrLoadPdf } from '@/utils/pdf'

/**
 * PDF 加载器 Composable
 * 负责 PDF 文档的加载、初始化和清理
 */
export function usePDFLoader() {
  const loading = ref(false)
  const error = ref('')
  const totalPages = ref(0)
  const pdfDoc = ref<any>(null)
  const currentBlobUrl = ref<string | null>(null)

  /**
   * 加载 PDF 文档
   */
  const loadPdf = async (pdfPath: string): Promise<any | null> => {
    if (!pdfPath) {
      error.value = 'PDF 路径为空'
      return null
    }

    loading.value = true
    error.value = ''

    try {
      // 获取 PDF 文件 Blob
      const blob = await getFileAsBlob(pdfPath)

      // 清理旧的 Blob URL
      if (currentBlobUrl.value) {
        URL.revokeObjectURL(currentBlobUrl.value)
      }
      currentBlobUrl.value = URL.createObjectURL(blob)

      // 如果 PDF 文档已加载且路径相同，直接返回
      if (pdfDoc.value && pdfDoc.value._path === pdfPath) {
        return pdfDoc.value
      }

      // 销毁旧的 PDF 文档
      if (pdfDoc.value) {
        pdfDoc.value.destroy()
      }

      // 加载新的 PDF 文档
      pdfDoc.value = await getOrLoadPdf(currentBlobUrl.value)
      pdfDoc.value._path = pdfPath
      totalPages.value = pdfDoc.value.numPages

      return pdfDoc.value
    } catch (e: any) {
      console.error('PDF 加载失败:', e)
      error.value = e.message || '加载失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取 PDF 文档
   */
  const getPdfDoc = () => pdfDoc.value

  /**
   * 获取指定页面
   */
  const getPage = async (pageNum: number) => {
    if (!pdfDoc.value) {
      throw new Error('PDF 文档未加载')
    }
    return await pdfDoc.value.getPage(pageNum)
  }

  /**
   * 获取目录
   */
  const getOutline = async () => {
    if (!pdfDoc.value) {
      return []
    }
    try {
      return await pdfDoc.value.getOutline()
    } catch (e) {
      console.error('获取目录失败:', e)
      return []
    }
  }

  /**
   * 通过目的地导航到页面
   */
  const navigateToDestination = async (dest: any): Promise<number | null> => {
    if (!pdfDoc.value) {
      return null
    }

    try {
      let destination = dest
      if (typeof dest === 'string') {
        destination = await pdfDoc.value.getDestination(dest)
      }
      if (destination) {
        const ref = destination[0]
        const pageIndex = await pdfDoc.value.getPageIndex(ref)
        return pageIndex + 1
      }
      return null
    } catch (e) {
      console.error('导航失败:', e)
      return null
    }
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (pdfDoc.value) {
      pdfDoc.value.destroy()
      pdfDoc.value = null
    }
    if (currentBlobUrl.value) {
      URL.revokeObjectURL(currentBlobUrl.value)
      currentBlobUrl.value = null
    }
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // State
    loading,
    error,
    totalPages,
    pdfDoc,

    // Methods
    loadPdf,
    getPdfDoc,
    getPage,
    getOutline,
    navigateToDestination,
    cleanup,
  }
}
