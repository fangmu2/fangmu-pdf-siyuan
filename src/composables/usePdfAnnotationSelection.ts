// src/composables/usePdfAnnotationSelection.ts
/**
 * PDF 标注批量选择组合式函数
 * 支持点选（Ctrl+ 点击）和框选（Shift+ 拖拽）两种选择方式
 */

import type { PDFAnnotation } from '../types/annotation'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

/**
 * 框选区域
 */
export interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
  width: number
  height: number
  visible: boolean
}

/**
 * 选择状态
 */
export interface UseAnnotationSelectionOptions {
  /** 标注列表 */
  annotations: PDFAnnotation[]
  /** 容器元素引用 */
  containerRef: HTMLElement | null
}

/**
 * PDF 标注批量选择
 */
export function usePdfAnnotationSelection(options: UseAnnotationSelectionOptions) {
  // 已选择的标注 ID 集合
  const selectedIds = ref<Set<string>>(new Set())

  // 框选状态
  const selectionBox = reactive<SelectionBox>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    width: 0,
    height: 0,
    visible: false,
  })

  // 是否正在框选
  const isSelecting = ref(false)

  // 计算属性：已选择的标注列表
  const selectedAnnotations = computed(() => {
    return options.annotations.filter((ann) => selectedIds.value.has(ann.id))
  })

  // 计算属性：是否已选择
  const isSelected = (annotation: PDFAnnotation) => {
    return selectedIds.value.has(annotation.id)
  }

  // 计算属性：选择数量
  const selectionCount = computed(() => selectedIds.value.size)

  /**
   * 切换选择状态（点选）
   * - 按住 Ctrl/Cmd 点击：切换单个标注的选择状态
   * - 不按修饰键点击：清除其他选择，只选择当前标注
   */
  const toggleSelection = (annotation: PDFAnnotation, event?: MouseEvent) => {
    const isCtrlPressed = event?.ctrlKey || event?.metaKey

    if (!isCtrlPressed) {
      // 不按 Ctrl 时，清除其他选择
      if (selectedIds.value.has(annotation.id)) {
        // 如果已经是唯一选中的，取消选择
        if (selectedIds.value.size === 1) {
          selectedIds.value.delete(annotation.id)
        }
      } else {
        // 否则只选择当前这个
        selectedIds.value.clear()
        selectedIds.value.add(annotation.id)
      }
    } else {
      // 按 Ctrl 时，切换选择状态
      if (selectedIds.value.has(annotation.id)) {
        selectedIds.value.delete(annotation.id)
      } else {
        selectedIds.value.add(annotation.id)
      }
    }
  }

  /**
   * 开始框选
   */
  const startBoxSelection = (event: MouseEvent) => {
    if (!event.shiftKey || !options.containerRef) return

    isSelecting.value = true
    const rect = options.containerRef.getBoundingClientRect()
    selectionBox.startX = event.clientX - rect.left
    selectionBox.startY = event.clientY - rect.top
    selectionBox.endX = selectionBox.startX
    selectionBox.endY = selectionBox.startY
    selectionBox.width = 0
    selectionBox.height = 0
    selectionBox.visible = true
  }

  /**
   * 更新框选
   */
  const updateBoxSelection = (event: MouseEvent) => {
    if (!isSelecting.value || !options.containerRef) return

    const rect = options.containerRef.getBoundingClientRect()
    selectionBox.endX = event.clientX - rect.left
    selectionBox.endY = event.clientY - rect.top

    // 计算宽度和高度（支持从右向左、从下向上拖拽）
    selectionBox.width = selectionBox.endX - selectionBox.startX
    selectionBox.height = selectionBox.endY - selectionBox.startY
  }

  /**
   * 结束框选
   */
  const endBoxSelection = () => {
    if (!isSelecting.value) return

    isSelecting.value = false
    selectionBox.visible = false

    // 计算框选区域（处理负值）
    const box = {
      left: Math.min(selectionBox.startX, selectionBox.endX),
      top: Math.min(selectionBox.startY, selectionBox.endY),
      right: Math.max(selectionBox.startX, selectionBox.endX),
      bottom: Math.max(selectionBox.startY, selectionBox.endY),
    }

    // 如果框选区域太小，忽略
    if (box.right - box.left < 10 || box.bottom - box.top < 10) {
      return
    }

    // 检测框选区域内的标注
    const annotationsInBox = detectAnnotationsInBox(box)

    // 将框选的标注添加到选择中
    annotationsInBox.forEach((ann) => {
      selectedIds.value.add(ann.id)
    })
  }

  /**
   * 检测框选区域内的标注
   * 通过查询 DOM 元素来检测
   */
  const detectAnnotationsInBox = (box: {
    left: number
    top: number
    right: number
    bottom: number
  }): PDFAnnotation[] => {
    if (!options.containerRef) return []

    const result: PDFAnnotation[] = []

    // 获取所有标注元素
    const annotationElements = options.containerRef.querySelectorAll('[data-annotation-id]')

    annotationElements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const containerRect = options.containerRef!.getBoundingClientRect()

      // 转换为容器内的相对坐标
      const elementBox = {
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        right: rect.right - containerRect.left,
        bottom: rect.bottom - containerRect.top,
      }

      // 检测是否有交集
      const hasIntersection = !(
        elementBox.right < box.left
        || elementBox.left > box.right
        || elementBox.bottom < box.top
        || elementBox.top > box.bottom
      )

      if (hasIntersection) {
        const annotationId = element.getAttribute('data-annotation-id')
        if (annotationId) {
          const annotation = options.annotations.find((ann) => ann.id === annotationId)
          if (annotation) {
            result.push(annotation)
          }
        }
      }
    })

    return result
  }

  /**
   * 清除所有选择
   */
  const clearSelection = () => {
    selectedIds.value.clear()
  }

  /**
   * 选择所有标注
   */
  const selectAll = () => {
    options.annotations.forEach((ann) => {
      selectedIds.value.add(ann.id)
    })
  }

  /**
   * 取消选择指定标注
   */
  const deselect = (annotationId: string) => {
    selectedIds.value.delete(annotationId)
  }

  /**
   * 批量选择一组标注
   */
  const selectMultiple = (annotationIds: string[]) => {
    annotationIds.forEach((id) => {
      selectedIds.value.add(id)
    })
  }

  // 事件处理函数
  const handleMouseDown = (event: MouseEvent) => {
    startBoxSelection(event)
  }

  const handleMouseMove = (event: MouseEvent) => {
    updateBoxSelection(event)
  }

  const handleMouseUp = () => {
    endBoxSelection()
  }

  // 生命周期：绑定全局鼠标事件
  onMounted(() => {
    if (options.containerRef) {
      options.containerRef.addEventListener('mousedown', handleMouseDown)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  })

  onBeforeUnmount(() => {
    if (options.containerRef) {
      options.containerRef.removeEventListener('mousedown', handleMouseDown)
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    // 状态
    selectedIds,
    selectionBox,
    isSelecting,

    // 计算属性
    selectedAnnotations,
    selectionCount,

    // 方法
    isSelected,
    toggleSelection,
    clearSelection,
    selectAll,
    deselect,
    selectMultiple,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
  }
}

export default usePdfAnnotationSelection
