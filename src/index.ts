import { createPinia } from "pinia"
import { Plugin } from "siyuan"
import {
  createApp,
  h,
} from "vue"
import App from "./App.vue"
import "./styles/app.css" // 引入面板样式

export default class PDFMindMapPlugin extends Plugin {
  private panelEl: HTMLElement | null = null
  private vueApp: any = null
  private isResizing = false

  async onload() {
    // 1. 注册顶栏按钮
    this.addTopBar({
      icon: "iconGraph", // 使用思源内置的图标，也可以替换为自己的 iconfont
      title: this.i18n.name || "PDF 思维导图", // 鼠标悬浮提示，国际化名称
      position: "right", // 按钮位置：右对齐
      callback: () => {
        this.togglePanel() // 点击按钮时切换面板显示
      },
    })
  }

  // 切换面板显示/隐藏的核心逻辑
  private togglePanel() {
    if (this.panelEl) {
      // 如果面板存在，则关闭（卸载）
      this.closePanel()
    } else {
      // 如果面板不存在，则打开（挂载）
      this.openPanel()
    }
  }

  private openPanel() {
    // 1. 创建一个挂载点（div元素）
    this.panelEl = document.createElement("div")
    this.panelEl.id = "plugin-pdf-mindmap-panel" // 设置 ID，方便 CSS 定位
    document.body.appendChild(this.panelEl) // 添加到 body 根节点

    // 2. 创建并挂载 Vue 应用
    // 使用 h 函数渲染 App 组件，并传入 plugin 实例，方便在组件内调用 API
    const pinia = createPinia()
    this.vueApp = createApp({
      render: () => h(App, { plugin: this }),
    })
    this.vueApp.use(pinia)
    this.vueApp.mount(this.panelEl)

    // 3. 添加拖动调整宽度功能
    this.setupResize()
  }

  private closePanel() {
    // 移除拖动事件监听
    this.removeResizeListeners()

    if (this.vueApp) {
      this.vueApp.unmount() // 卸载 Vue 应用
      this.vueApp = null
    }
    if (this.panelEl) {
      this.panelEl.remove() // 从 DOM 中移除元素
      this.panelEl = null
    }
  }

  // 设置拖动调整宽度
  private setupResize() {
    if (!this.panelEl) return

    const panel = this.panelEl
    let startX = 0
    let startWidth = 0

    const onMouseDown = (e: MouseEvent) => {
      // 只在左侧边缘 6px 范围内触发
      const rect = panel.getBoundingClientRect()
      if (e.clientX - rect.left > 10) return

      // 如果是全屏模式，不允许调整
      if (panel.classList.contains('fullscreen')) return

      this.isResizing = true
      startX = e.clientX
      startWidth = rect.width
      panel.classList.add('resizing')

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isResizing) return

      const deltaX = startX - e.clientX // 向左拖动增加宽度
      const newWidth = startWidth + deltaX

      // 限制最小和最大宽度
      const minWidth = 400
      const maxWidth = window.innerWidth * 0.95

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        panel.style.width = `${newWidth}px`
      }
    }

    const onMouseUp = () => {
      this.isResizing = false
      panel.classList.remove('resizing')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    };

    // 保存引用以便清理
    (panel as any)._resizeHandler = onMouseDown
    panel.addEventListener('mousedown', onMouseDown)
  }

  private removeResizeListeners() {
    if (this.panelEl && (this.panelEl as any)._resizeHandler) {
      this.panelEl.removeEventListener('mousedown', (this.panelEl as any)._resizeHandler)
    }
  }

  // 插件卸载时的清理工作（例如用户禁用插件时）
  onunload() {
    this.closePanel()
  }
}
