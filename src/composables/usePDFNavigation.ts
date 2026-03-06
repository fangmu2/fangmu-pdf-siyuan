// src/composables/usePDFNavigation.ts
import { ref, onBeforeUnmount } from 'vue'

/**
 * PDF 导航器 Composable
 * 负责页面导航、缩放控制
 */
export function usePDFNavigation(
  initialPage: number = 1,
  initialScale: number = 1.0,
) {
  // 导航状态
  const currentPage = ref(initialPage)
  const scale = ref(initialScale)
  const viewMode = ref<'single' | 'double' | 'continuous'>('single')
  const rotation = ref(0)
  const darkMode = ref(false)

  // 缩放级别选项
  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]

  // 翻页按钮状态
  const showRightNav = ref(false)

  /**
   * 跳转到指定页面
   */
  const goToPage = (page: number, totalPages: number, emit?: (event: 'page-change', page: number) => void) => {
    if (page < 1 || page > totalPages) return
    if (page === currentPage.value) return

    currentPage.value = page
    emit?.('page-change', page)
  }

  /**
   * 上一页
   */
  const prevPage = (emit?: (event: 'page-change', page: number) => void) => {
    goToPage(currentPage.value - 1, Infinity, emit)
  }

  /**
   * 下一页
   */
  const nextPage = (totalPages: number, emit?: (event: 'page-change', page: number) => void) => {
    goToPage(currentPage.value + 1, totalPages, emit)
  }

  /**
   * 放大
   */
  const zoomIn = (onZoomChange?: () => void) => {
    if (scale.value < 3.0) {
      scale.value = Math.min(scale.value + 0.1, 3.0)
      onZoomChange?.()
    }
  }

  /**
   * 缩小
   */
  const zoomOut = (onZoomChange?: () => void) => {
    if (scale.value > 0.3) {
      scale.value = Math.max(scale.value - 0.1, 0.3)
      onZoomChange?.()
    }
  }

  /**
   * 设置缩放级别
   */
  const setZoom = (newScale: number, onZoomChange?: () => void) => {
    scale.value = newScale
    onZoomChange?.()
  }

  /**
   * 设置视图模式
   */
  const setViewMode = (mode: 'single' | 'double' | 'continuous') => {
    viewMode.value = mode
  }

  /**
   * 旋转页面
   */
  const rotate = () => {
    rotation.value = (rotation.value + 90) % 360
  }

  /**
   * 切换深色模式
   */
  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }

  /**
   * 键盘翻页处理
   */
  const handlePageKeyDown = (
    e: KeyboardEvent,
    totalPages: number,
    emit?: (event: 'page-change', page: number) => void,
    onZoomIn?: () => void,
    onZoomOut?: () => void,
  ) => {
    // 如果焦点在输入框中，不处理
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).isContentEditable
    )) {
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        prevPage(emit)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        nextPage(totalPages, emit)
        break
      case 'PageUp':
        e.preventDefault()
        prevPage(emit)
        break
      case 'PageDown':
        e.preventDefault()
        nextPage(totalPages, emit)
        break
      case 'Home':
        e.preventDefault()
        goToPage(1, totalPages, emit)
        break
      case 'End':
        e.preventDefault()
        goToPage(totalPages, totalPages, emit)
        break
      case '-':
      case '_':
        e.preventDefault()
        zoomOut(onZoomOut)
        break
      case '=':
      case '+':
        e.preventDefault()
        zoomIn(onZoomIn)
        break
    }
  }

  /**
   * 计算阅读进度
   */
  const calculateProgress = (totalPages: number) => {
    if (totalPages === 0) return 0
    return (currentPage.value / totalPages) * 100
  }

  /**
   * 获取缩放级别列表
   */
  const getZoomLevels = () => zoomLevels

  /**
   * 同步外部页码变化
   */
  const syncExternalPage = (newPage: number) => {
    currentPage.value = newPage
  }

  /**
   * 清理
   */
  const cleanup = () => {
    currentPage.value = 1
    scale.value = 1.0
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    // State
    currentPage,
    scale,
    viewMode,
    rotation,
    darkMode,
    showRightNav,

    // Computed
    zoomLevels,

    // Methods
    goToPage,
    prevPage,
    nextPage,
    zoomIn,
    zoomOut,
    setZoom,
    setViewMode,
    rotate,
    toggleDarkMode,
    handlePageKeyDown,
    calculateProgress,
    getZoomLevels,
    syncExternalPage,
    cleanup,
  }
}
