import type {
  ComputedRef,
  Ref,
} from 'vue'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

/**
 * PDF 思维导图侧边栏组合式函数
 * 管理侧边栏的可见性、宽度、自动同步等状态
 */
export interface UsePdfMindMapSidebarOptions {
  /** 默认宽度 */
  defaultWidth?: number
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度（相对于视口宽度的比例） */
  maxWidthRatio?: number
  /** 默认是否可见 */
  defaultVisible?: boolean
  /** 默认自动同步状态 */
  defaultAutoSync?: boolean
}

export interface UsePdfMindMapSidebarReturn {
  /** 侧边栏是否可见 */
  visible: Ref<boolean>
  /** 当前宽度 */
  width: Ref<number>
  /** 自动同步是否启用 */
  autoSyncEnabled: Ref<boolean>
  /** 是否正在调整大小 */
  isResizing: Ref<boolean>
  /** 上次同步时间 */
  lastSyncTime: Ref<number | null>
  /** 切换侧边栏可见性 */
  toggle: () => void
  /** 显示侧边栏 */
  show: () => void
  /** 隐藏侧边栏 */
  hide: () => void
  /** 设置宽度 */
  setWidth: (newWidth: number) => void
  /** 重置为默认宽度 */
  resetWidth: () => void
  /** 切换自动同步 */
  toggleAutoSync: () => void
  /** 更新同步时间 */
  updateSyncTime: () => void
  /** 开始调整大小 */
  startResize: (e: MouseEvent) => void
  /** 保存用户偏好 */
  savePreferences: () => void
  /** 加载用户偏好 */
  loadPreferences: () => void
  /** 样式对象（用于绑定到元素） */
  sidebarStyle: ComputedRef<{ width: string }>
  /** CSS 类名（用于主题适配） */
  themeClass: ComputedRef<string>
}

const STORAGE_KEYS = {
  WIDTH: 'pdfMindMapSidebarWidth',
  VISIBLE: 'pdfMindMapSidebarVisible',
  AUTO_SYNC: 'pdfMindMapAutoSync',
} as const

export function usePdfMindMapSidebar(
  options: UsePdfMindMapSidebarOptions = {},
): UsePdfMindMapSidebarReturn {
  const {
    defaultWidth = 350,
    minWidth = 280,
    maxWidthRatio = 0.5,
    defaultVisible = false,
    defaultAutoSync = true,
  } = options

  // State
  const visible = ref(defaultVisible)
  const width = ref(defaultWidth)
  const autoSyncEnabled = ref(defaultAutoSync)
  const isResizing = ref(false)
  const lastSyncTime = ref<number | null>(null)

  // Resize state
  let resizeStartX = 0
  let resizeStartWidth = 0

  // Computed
  const sidebarStyle = computed(() => ({
    width: visible.value ? `${width.value}px` : '32px',
  }))

  const themeClass = computed(() => {
    if (typeof window !== 'undefined' && window.siyuan?.config?.appearance?.mode) {
      return window.siyuan.config.appearance.mode === 1 ? 'theme-dark' : 'theme-light'
    }
    return 'theme-light'
  })

  // Methods
  const toggle = (): void => {
    visible.value = !visible.value
    savePreferences()
  }

  const show = (): void => {
    visible.value = true
    savePreferences()
  }

  const hide = (): void => {
    visible.value = false
    savePreferences()
  }

  const setWidth = (newWidth: number): void => {
    const maxWidth = typeof window !== 'undefined'
      ? window.innerWidth * maxWidthRatio
      : 800
    width.value = Math.max(minWidth, Math.min(newWidth, maxWidth))
  }

  const resetWidth = (): void => {
    width.value = defaultWidth
    savePreferences()
  }

  const toggleAutoSync = (): void => {
    autoSyncEnabled.value = !autoSyncEnabled.value
    savePreferences()
  }

  const updateSyncTime = (): void => {
    lastSyncTime.value = Date.now()
  }

  const handleResize = (e: MouseEvent): void => {
    if (!isResizing.value) return

    const delta = resizeStartX - e.clientX
    const newWidth = Math.max(minWidth, Math.min(resizeStartWidth + delta, window.innerWidth * maxWidthRatio))
    width.value = newWidth
  }

  const stopResize = (): void => {
    if (!isResizing.value) return

    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)

    if (typeof document !== 'undefined') {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    savePreferences()
  }

  const startResize = (e: MouseEvent): void => {
    isResizing.value = true
    resizeStartX = e.clientX
    resizeStartWidth = width.value

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const savePreferences = (): void => {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.WIDTH, String(width.value))
      localStorage.setItem(STORAGE_KEYS.VISIBLE, String(visible.value))
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(autoSyncEnabled.value))
    } catch (error) {
      console.warn('Failed to save sidebar preferences:', error)
    }
  }

  const loadPreferences = (): void => {
    if (typeof localStorage === 'undefined') return

    try {
      const savedWidth = localStorage.getItem(STORAGE_KEYS.WIDTH)
      const savedVisible = localStorage.getItem(STORAGE_KEYS.VISIBLE)
      const savedAutoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC)

      if (savedWidth) {
        const parsedWidth = Number.parseInt(savedWidth, 10)
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth) {
          width.value = parsedWidth
        }
      }

      if (savedVisible !== null) {
        visible.value = savedVisible === 'true'
      }

      if (savedAutoSync !== null) {
        autoSyncEnabled.value = savedAutoSync === 'true'
      }
    } catch (error) {
      console.warn('Failed to load sidebar preferences:', error)
    }
  }

  // Lifecycle
  onMounted(() => {
    loadPreferences()
  })

  onUnmounted(() => {
    if (isResizing.value) {
      stopResize()
    }
  })

  return {
    visible,
    width,
    autoSyncEnabled,
    isResizing,
    lastSyncTime,
    toggle,
    show,
    hide,
    setWidth,
    resetWidth,
    toggleAutoSync,
    updateSyncTime,
    startResize,
    savePreferences,
    loadPreferences,
    sidebarStyle,
    themeClass,
  }
}

export default usePdfMindMapSidebar
