// src/composables/useAnnotationDrag.ts
/**
 * 标注拖拽逻辑组合式函数
 * 负责拖拽开始、拖拽中、放置等拖拽相关逻辑
 */

import type { PDFAnnotation } from '@/types/annotation'
import { ref } from 'vue'

/**
 * 拖拽状态
 */
export interface UseAnnotationDragReturn {
  // 状态
  draggingId: string | null
  dragOverId: string | null
  dragTip: string

  // 方法
  handleDragStart: (e: DragEvent, annotation: PDFAnnotation) => void
  handleDragEnd: () => void
  handleDragOver: (e: DragEvent, annotation: PDFAnnotation) => void
  handleDragLeave: () => void
  handleDrop: (e: DragEvent, targetAnnotation: PDFAnnotation, allAnnotations: PDFAnnotation[]) => void
  clearDragState: () => void

  // 工具函数
  validateDrop: (sourceId: string, targetAnnotation: PDFAnnotation, allAnnotations: PDFAnnotation[]) => { valid: boolean, message?: string }
}

/**
 * 标注拖拽逻辑
 */
export function useAnnotationDrag(
  onMerge: (sourceId: string, targetId: string) => void
): UseAnnotationDragReturn {
  // 拖拽状态
  const draggingId = ref<string | null>(null)
  const dragOverId = ref<string | null>(null)
  const dragTip = ref<string>('')

  /**
   * 验证放置是否合法
   */
  const validateDrop = (
    sourceId: string,
    targetAnnotation: PDFAnnotation,
    allAnnotations: PDFAnnotation[]
  ): { valid: boolean, message?: string } => {
    // 不能拖动到自己身上
    if (sourceId === targetAnnotation.id) {
      return { valid: false, message: '不能拖动到自身' }
    }

    // 检查是否会造成循环引用（目标不能是源的子节点）
    let current = targetAnnotation
    while (current.parentId) {
      if (current.parentId === sourceId) {
        return { valid: false, message: '不能将标注合并到它自己的子标注中' }
      }
      const parent = allAnnotations.find(a => a.id === current.parentId)
      if (!parent) break
      current = parent
    }

    // 检查源标注的所有子节点（如果源是父节点，不允许合并到子节点）
    const sourceAnnotation = allAnnotations.find(a => a.id === sourceId)
    if (sourceAnnotation) {
      // 检查目标是否是源的后代
      let checkTarget = targetAnnotation
      while (checkTarget.parentId) {
        if (checkTarget.parentId === sourceId) {
          return { valid: false, message: '不能将子标注合并到其父标注中' }
        }
        const parent = allAnnotations.find(a => a.id === checkTarget.parentId)
        if (!parent) break
        checkTarget = parent
      }
    }

    return { valid: true }
  }

  /**
   * 清除拖拽状态
   */
  const clearDragState = () => {
    draggingId.value = null
    dragOverId.value = null
    dragTip.value = ''
  }

  /**
   * 拖拽开始
   */
  const handleDragStart = (e: DragEvent, annotation: PDFAnnotation) => {
    draggingId.value = annotation.id
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', annotation.id)
    }
    dragTip.value = `拖动到目标标注上方释放以合并`
  }

  /**
   * 拖拽结束
   */
  const handleDragEnd = () => {
    clearDragState()
  }

  /**
   * 拖拽悬停
   */
  const handleDragOver = (e: DragEvent, annotation: PDFAnnotation) => {
    e.preventDefault()
    if (draggingId.value && draggingId.value !== annotation.id) {
      e.dataTransfer!.dropEffect = 'move'
      dragOverId.value = annotation.id
    }
  }

  /**
   * 拖拽离开
   */
  const handleDragLeave = () => {
    dragOverId.value = null
  }

  /**
   * 放置
   */
  const handleDrop = (e: DragEvent, targetAnnotation: PDFAnnotation, allAnnotations: PDFAnnotation[]) => {
    e.preventDefault()

    const sourceId = e.dataTransfer?.getData('text/plain')
    if (!sourceId || sourceId === targetAnnotation.id) {
      clearDragState()
      return
    }

    // 验证放置是否合法
    const validation = validateDrop(sourceId, targetAnnotation, allAnnotations)
    if (!validation.valid) {
      dragTip.value = validation.message || '无效的操作'
      setTimeout(() => { dragTip.value = '' }, 2000)
      clearDragState()
      return
    }

    // 发出合并事件
    onMerge(sourceId, targetAnnotation.id)

    dragTip.value = '合并成功！'
    setTimeout(() => { dragTip.value = '' }, 1500)

    clearDragState()
  }

  return {
    // 状态
    draggingId: draggingId.value,
    dragOverId: dragOverId.value,
    dragTip: dragTip.value,

    // 方法
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearDragState,

    // 工具函数
    validateDrop,
  }
}

export default useAnnotationDrag
