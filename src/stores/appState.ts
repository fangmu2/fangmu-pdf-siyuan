/**
 * 应用全局状态 Store
 * 管理视图模式、面板显示、标注创建等 UI 状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AnnotationLevel, ExtractMode } from '../types/annotation'

/**
 * 活动面板类型
 */
export type PanelType = 
  | 'learningSet' 
  | 'cardBox' 
  | 'review' 
  | 'smartStudy' 
  | 'settings' 
  | 'contextView' 
  | 'keywordLibrary' 
  | 'memoryContext'

/**
 * 视图模式
 */
export type ViewMode = 'split' | 'list' | 'mindmap'

/**
 * 应用状态接口
 */
export interface AppState {
  /** 视图模式 */
  viewMode: ViewMode
  /** 是否全屏 */
  isFullscreen: boolean
  /** 活动面板状态 */
  activePanels: Record<PanelType, boolean>
  /** 标注级别 */
  currentLevel: AnnotationLevel
  /** 摘录模式 */
  extractMode: ExtractMode
  /** 是否正在创建标注 */
  creatingAnnotation: boolean
  /** 标注面板宽度 */
  annotationWidth: number
  /** 思维导图面板宽度 */
  mindmapWidth: number
  /** 今日复习数量 */
  todayReviewCount: number
}

/**
 * 应用状态 Store
 */
export const useAppStateStore = defineStore('appState', () => {
  // 状态
  const viewMode = ref<ViewMode>('split')
  const isFullscreen = ref(false)
  const activePanels = ref<Record<PanelType, boolean>>({
    learningSet: false,
    cardBox: false,
    review: false,
    smartStudy: false,
    settings: false,
    contextView: false,
    keywordLibrary: false,
    memoryContext: false,
  })
  const currentLevel = ref<AnnotationLevel>('text')
  const extractMode = ref<ExtractMode>('text')
  const creatingAnnotation = ref(false)
  const annotationWidth = ref(360)
  const mindmapWidth = ref(400)
  const todayReviewCount = ref(0)

  // Getters
  const activePanelCount = computed(() => {
    return Object.values(activePanels.value).filter(Boolean).length
  })

  const isPanelActive = computed(() => {
    return (panel: PanelType) => activePanels.value[panel]
  })

  // Actions
  /**
   * 切换面板显示状态
   */
  function togglePanel(panel: PanelType) {
    activePanels.value[panel] = !activePanels.value[panel]
  }

  /**
   * 设置面板显示状态
   */
  function setPanelActive(panel: PanelType, active: boolean) {
    activePanels.value[panel] = active
  }

  /**
   * 关闭所有面板
   */
  function closeAllPanels() {
    Object.keys(activePanels.value).forEach((key) => {
      activePanels.value[key as PanelType] = false
    })
  }

  /**
   * 切换视图模式
   */
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  /**
   * 循环切换视图模式
   */
  function toggleView() {
    const modes: ViewMode[] = ['split', 'list', 'mindmap']
    const currentIndex = modes.indexOf(viewMode.value)
    viewMode.value = modes[(currentIndex + 1) % 3]
  }

  /**
   * 切换全屏模式
   */
  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
  }

  /**
   * 设置全屏状态
   */
  function setFullscreen(fullscreen: boolean) {
    isFullscreen.value = fullscreen
  }

  /**
   * 设置标注级别
   */
  function setCurrentLevel(level: AnnotationLevel) {
    currentLevel.value = level
  }

  /**
   * 设置摘录模式
   */
  function setExtractMode(mode: ExtractMode) {
    extractMode.value = mode
  }

  /**
   * 设置标注创建状态
   */
  function setCreatingAnnotation(creating: boolean) {
    creatingAnnotation.value = creating
  }

  /**
   * 设置标注面板宽度
   */
  function setAnnotationWidth(width: number) {
    if (width >= 280 && width <= 600) {
      annotationWidth.value = width
    }
  }

  /**
   * 设置思维导图面板宽度
   */
  function setMindmapWidth(width: number) {
    if (width >= 280 && width <= 600) {
      mindmapWidth.value = width
    }
  }

  /**
   * 设置今日复习数量
   */
  function setTodayReviewCount(count: number) {
    todayReviewCount.value = count
  }

  /**
   * 从 localStorage 恢复状态
   */
  function restoreFromLocalStorage() {
    const saved = localStorage.getItem('appState')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.viewMode) viewMode.value = parsed.viewMode
        if (parsed.annotationWidth) annotationWidth.value = parsed.annotationWidth
        if (parsed.mindmapWidth) mindmapWidth.value = parsed.mindmapWidth
      } catch (e) {
        console.error('[AppState] 恢复状态失败:', e)
      }
    }
  }

  /**
   * 保存状态到 localStorage
   */
  function saveToLocalStorage() {
    localStorage.setItem('appState', JSON.stringify({
      viewMode: viewMode.value,
      annotationWidth: annotationWidth.value,
      mindmapWidth: mindmapWidth.value,
    }))
  }

  return {
    // State
    viewMode,
    isFullscreen,
    activePanels,
    currentLevel,
    extractMode,
    creatingAnnotation,
    annotationWidth,
    mindmapWidth,
    todayReviewCount,
    // Getters
    activePanelCount,
    isPanelActive,
    // Actions
    togglePanel,
    setPanelActive,
    closeAllPanels,
    setViewMode,
    toggleView,
    toggleFullscreen,
    setFullscreen,
    setCurrentLevel,
    setExtractMode,
    setCreatingAnnotation,
    setAnnotationWidth,
    setMindmapWidth,
    setTodayReviewCount,
    restoreFromLocalStorage,
    saveToLocalStorage,
  }
})
