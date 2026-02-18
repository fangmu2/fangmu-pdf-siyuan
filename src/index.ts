import { Plugin } from "siyuan";
import { createApp, h } from "vue";
import App from "./App.vue";
import "./styles/app.css"; // 引入面板样式

export default class PDFMindMapPlugin extends Plugin {
  private panelEl: HTMLElement | null = null;
  private vueApp: any = null;

  async onload() {
    // 1. 注册顶栏按钮
    this.addTopBar({
      icon: "iconGraph", // 使用思源内置的图标，也可以替换为自己的 iconfont
      title: this.i18n.name || "PDF 思维导图", // 鼠标悬浮提示，国际化名称
      position: "right", // 按钮位置：右对齐
      callback: () => {
        this.togglePanel(); // 点击按钮时切换面板显示
      }
    });
  }

  // 切换面板显示/隐藏的核心逻辑
  private togglePanel() {
    if (this.panelEl) {
      // 如果面板存在，则关闭（卸载）
      this.closePanel();
    } else {
      // 如果面板不存在，则打开（挂载）
      this.openPanel();
    }
  }

  private openPanel() {
    // 1. 创建一个挂载点（div元素）
    this.panelEl = document.createElement("div");
    this.panelEl.id = "plugin-pdf-mindmap-panel"; // 设置 ID，方便 CSS 定位
    document.body.appendChild(this.panelEl); // 添加到 body 根节点

    // 2. 创建并挂载 Vue 应用
    // 使用 h 函数渲染 App 组件，并传入 plugin 实例，方便在组件内调用 API
    this.vueApp = createApp({
      render: () => h(App, { plugin: this }),
    });
    this.vueApp.mount(this.panelEl);
  }

  private closePanel() {
    if (this.vueApp) {
      this.vueApp.unmount(); // 卸载 Vue 应用
      this.vueApp = null;
    }
    if (this.panelEl) {
      this.panelEl.remove(); // 从 DOM 中移除元素
      this.panelEl = null;
    }
  }

  // 插件卸载时的清理工作（例如用户禁用插件时）
  onunload() {
    this.closePanel();
  }
}
