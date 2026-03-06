/**
 * PDF 管理 Composable
 * 封装 PDF 加载、切换、页码管理等逻辑
 */

import { computed, ref, watch } from 'vue'
import type { LearningSet } from '../services/learningSetService'
import { LearningSetService } from '../services/learningSetService'
import type { PDFAnnotation } from '../types/annotation'
import { useLearningSetStore } from '../stores/learningSetStore'

/**
 * PDF 管理
 */
export function usePdfManagement() {
  const learningSetStore = useLearningSetStore()

  // 内部状态
  const currentPage = ref(1)
  const totalPages = ref(0)
  const annotations = ref<PDFAnnotation[]>([])
  const highlightAnnotation = ref<PDFAnnotation | null>(null)

  // Computed
  /**
   * 当前 PDF ID（从学习集获取）
   */
  const currentPdfId = computed<string | null>(() => {
    const set = learningSetStore.currentStudySet as unknown as LearningSet | null
    if (!set) return null
    return set.currentPdfId || set.pdfs?.[0]?.id || null
  })

  /**
   * 当前 PDF
   */
  const currentPdf = computed(() => {
    const set = learningSetStore.currentStudySet as unknown as LearningSet | null
    if (!set) return null
    if (!currentPdfId.value) return set.pdfs[0] || null
    return set.pdfs.find((p) => p.id === currentPdfId.value) || set.pdfs[0] || null
  })

  /**
   * 当前学习集（转换为 LearningSet 类型）
   */
  const currentLearningSet = computed(() => {
    return learningSetStore.currentStudySet as unknown as LearningSet | null
  })

  /**
   * 当前 PDF 的标注列表
   */
  const currentPdfAnnotations = computed<PDFAnnotation[]>(() => {
    if (!currentPdf.value) return []
    return annotations.value.filter((a) => a.pdfPath === currentPdf.value!.path)
  })

  // Actions
  /**
   * 加载标注列表
   */
  const loadAnnotations = () => {
    if (!currentLearningSet.value) {
      annotations.value = []
      return
    }
    annotations.value = currentLearningSet.value.annotations || []
  }

  /**
   * 切换 PDF
   */
  const onPdfSwitch = (newPdfId: string) => {
    if (!currentLearningSet.value || !newPdfId) return

    // 保存当前进度
    if (currentPdf.value) {
      LearningSetService.updateLearningSetPdf(
        currentLearningSet.value.id,
        currentPdf.value.id,
        {
          currentPage: currentPage.value,
          totalPages: totalPages.value,
        }
      )
    }

    // 切换 PDF
    const set = LearningSetService.switchLearningSetPdf(
      currentLearningSet.value.id,
      newPdfId
    )

    if (set) {
      const pdf = LearningSetService.getCurrentPdf(set)
      if (pdf) {
        currentPage.value = pdf.currentPage
        totalPages.value = pdf.totalPages
      }
      // 重新加载标注
      loadAnnotations()
    }
  }

  /**
   * 处理 PDF 加载完成
   */
  const handlePdfLoaded = (numPages: number) => {
    totalPages.value = numPages
    if (currentLearningSet.value && currentPdf.value) {
      LearningSetService.updateLearningSetPdf(
        currentLearningSet.value.id,
        currentPdf.value.id,
        { totalPages: numPages }
      )
    }
  }

  /**
   * 处理页码变化
   */
  const handlePageChange = (page: number) => {
    currentPage.value = page
    if (currentLearningSet.value && currentPdf.value) {
      LearningSetService.saveProgress(
        currentLearningSet.value.id,
        currentPdf.value.path,
        page
      )
    }
  }

  /**
   * 保存当前状态
   */
  const saveCurrentState = () => {
    if (currentLearningSet.value && currentPdf.value) {
      LearningSetService.updateLearningSetPdf(
        currentLearningSet.value.id,
        currentPdf.value.id,
        {
          currentPage: currentPage.value,
          totalPages: totalPages.value,
        }
      )
      LearningSetService.updateLearningSet(currentLearningSet.value.id, {
        annotationCount: annotations.value.length,
      })
    }
  }

  /**
   * 切换学习集
   */
  const switchLearningSet = async (setId: string) => {
    saveCurrentState()
    const set = LearningSetService.switchLearningSet(setId)
    if (set) {
      const pdf = LearningSetService.getCurrentPdf(set)
      if (pdf) {
        currentPage.value = pdf.currentPage
        totalPages.value = pdf.totalPages
      } else {
        currentPage.value = 1
        totalPages.value = 0
      }
      annotations.value = set.annotations || []
      highlightAnnotation.value = null
    }
  }

  /**
   * 处理标注点击
   */
  const handleAnnotationClick = (ann: PDFAnnotation) => {
    highlightAnnotation.value = ann
    if (currentLearningSet.value) {
      const pdf = currentLearningSet.value.pdfs.find((p) => p.path === ann.pdfPath)
      if (pdf && pdf.id !== currentPdfId.value) {
        // 需要切换 PDF
        onPdfSwitch(pdf.id)
        currentPage.value = ann.page
      } else {
        currentPage.value = ann.page
      }
    }
  }

  /**
   * 添加标注到列表
   */
  const addAnnotation = (annotation: PDFAnnotation) => {
    annotations.value.push(annotation)
  }

  /**
   * 从列表中删除标注
   */
  const removeAnnotation = (annotationId: string) => {
    annotations.value = annotations.value.filter((a) => a.id !== annotationId)
  }

  /**
   * 更新标注
   */
  const updateAnnotation = (annotation: PDFAnnotation) => {
    const index = annotations.value.findIndex((a) => a.id === annotation.id)
    if (index !== -1) {
      annotations.value[index] = { ...annotation }
    }
  }

  // 监听学习集变化
  watch(
    () => learningSetStore.currentStudySetId,
    (newId) => {
      if (newId) {
        loadAnnotations()
      } else {
        annotations.value = []
        highlightAnnotation.value = null
        currentPage.value = 1
        totalPages.value = 0
      }
    }
  )

  return {
    // State
    currentPage,
    totalPages,
    annotations,
    highlightAnnotation,
    // Computed
    currentLearningSet,
    currentPdfId,
    currentPdf,
    currentPdfAnnotations,
    // Actions
    loadAnnotations,
    onPdfSwitch,
    handlePdfLoaded,
    handlePageChange,
    saveCurrentState,
    switchLearningSet,
    handleAnnotationClick,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
  }
}
