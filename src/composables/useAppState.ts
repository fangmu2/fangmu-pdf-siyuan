/**
 * 应用状态管理 Composable
 * 封装全局 UI 状态和操作的组合式函数
 */

import { watch } from 'vue'
import { useAppStateStore, type PanelType, type ViewMode } from '../stores/appState'
import { useLearningSetStore } from '../stores/learningSetStore'

/**
 * 应用状态管理
 */
export function useAppState() {
  const appStore = useAppStateStore()
  const learningSetStore = useLearningSetStore()

  /**
   * 切换面板显示状态
   */
  const togglePanel = (panel: PanelType) => {
    appStore.togglePanel(panel)
  }

  /**
   * 设置面板显示状态
   */
  const setPanelActive = (panel: PanelType, active: boolean) => {
    appStore.setPanelActive(panel, active)
  }

  /**
   * 关闭所有面板
   */
  const closeAllPanels = () => {
    appStore.closeAllPanels()
  }

  /**
   * 切换视图模式 (split -> list -> mindmap -> split)
   */
  const toggleView = () => {
    appStore.toggleView()
  }

  /**
   * 设置视图模式
   */
  const setViewMode = (mode: ViewMode) => {
    appStore.setViewMode(mode)
  }

  /**
   * 切换全屏模式
   */
  const toggleFullscreen = () => {
    const wasFullscreen = appStore.isFullscreen
    appStore.toggleFullscreen()
    
    // 处理 DOM class
    const panel = document.getElementById('plugin-pdf-mindmap-panel')
    if (panel) {
      panel.classList.toggle('fullscreen', !wasFullscreen)
    }
  }

  /**
   * 设置全屏状态
   */
  const setFullscreen = (fullscreen: boolean) => {
    appStore.setFullscreen(fullscreen)
    const panel = document.getElementById('plugin-pdf-mindmap-panel')
    if (panel) {
      panel.classList.toggle('fullscreen', fullscreen)
    }
  }

  /**
   * 设置标注级别
   */
  const setCurrentLevel = (level: typeof appStore.currentLevel) => {
    appStore.setCurrentLevel(level)
  }

  /**
   * 设置摘录模式
   */
  const setExtractMode = (mode: typeof appStore.extractMode) => {
    appStore.setExtractMode(mode)
  }

  /**
   * 设置标注创建状态
   */
  const setCreatingAnnotation = (creating: boolean) => {
    appStore.setCreatingAnnotation(creating)
  }

  /**
   * 设置标注面板宽度
   */
  const setAnnotationWidth = (width: number) => {
    appStore.setAnnotationWidth(width)
  }

  /**
   * 设置思维导图面板宽度
   */
  const setMindmapWidth = (width: number) => {
    appStore.setMindmapWidth(width)
  }

  /**
   * 设置今日复习数量
   */
  const setTodayReviewCount = (count: number) => {
    appStore.setTodayReviewCount(count)
  }

  /**
   * 初始化：从 localStorage 恢复状态
   */
  const init = () => {
    appStore.restoreFromLocalStorage()
  }

  /**
   * 清理：保存状态到 localStorage
   */
  const cleanup = () => {
    appStore.saveToLocalStorage()
  }

  // 监听学习集变化，关闭所有面板
  watch(
    () => learningSetStore.currentStudySetId,
    () => {
      closeAllPanels()
    }
  )

  // 监听视图模式变化，保存到 localStorage
  watch(
    () => appStore.viewMode,
    () => {
      appStore.saveToLocalStorage()
    }
  )

  // 监听面板宽度变化，保存到 localStorage
  watch(
    () => [appStore.annotationWidth, appStore.mindmapWidth],
    () => {
      appStore.saveToLocalStorage()
    }
  )

  return {
    // State
    viewMode: appStore.viewMode,
    isFullscreen: appStore.isFullscreen,
    activePanels: appStore.activePanels,
    currentLevel: appStore.currentLevel,
    extractMode: appStore.extractMode,
    creatingAnnotation: appStore.creatingAnnotation,
    annotationWidth: appStore.annotationWidth,
    mindmapWidth: appStore.mindmapWidth,
    todayReviewCount: appStore.todayReviewCount,
    // Getters
    activePanelCount: appStore.activePanelCount,
    isPanelActive: appStore.isPanelActive,
    // Actions
    togglePanel,
    setPanelActive,
    closeAllPanels,
    toggleView,
    setViewMode,
    toggleFullscreen,
    setFullscreen,
    setCurrentLevel,
    setExtractMode,
    setCreatingAnnotation,
    setAnnotationWidth,
    setMindmapWidth,
    setTodayReviewCount,
    init,
    cleanup,
  }
}
