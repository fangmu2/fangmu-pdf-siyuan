<template>
  <div class="pdf-tab-bar">
    <!-- 标签页列表 -->
    <div
      ref="tabListRef"
      class="pdf-tab-bar__list"
      @wheel="handleWheel"
    >
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="pdf-tab-bar__tab"
        :class="[
          { 'pdf-tab-bar__tab--active': tab.id === activeTabId },
          { 'pdf-tab-bar__tab--loading': !tab.loaded },
        ]"
        draggable="true"
        @click="handleTabClick(tab.id)"
        @contextmenu.prevent="handleContextMenu($event, tab.id)"
        @dragstart="handleDragStart($event, tab.id)"
        @dragover.prevent
        @drop="handleDrop($event, tab.id)"
      >
        <!-- 加载指示器 -->
        <span
          v-if="!tab.loaded"
          class="pdf-tab-bar__loading"
        >
          <span class="pdf-tab-bar__loading-spinner"></span>
        </span>

        <!-- 文件图标 -->
        <span class="pdf-tab-bar__icon">📄</span>

        <!-- 标签名称 -->
        <span
          class="pdf-tab-bar__name"
          :title="tab.path"
        >
          {{ tab.name }}
        </span>

        <!-- 进度指示 -->
        <span
          v-if="tab.progress > 0"
          class="pdf-tab-bar__progress"
        >
          {{ tab.progress }}%
        </span>

        <!-- 修改标记 -->
        <span
          v-if="tab.hasChanges"
          class="pdf-tab-bar__changed"
        >●</span>

        <!-- 关闭按钮 -->
        <button
          class="pdf-tab-bar__close"
          title="关闭"
          @click.stop="handleClose(tab.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="pdf-tab-bar__actions">
      <!-- 新建标签按钮 -->
      <button
        class="pdf-tab-bar__action"
        title="打开新 PDF"
        :disabled="tabCount >= maxTabs"
        @click="handleNewTab"
      >
        +
      </button>

      <!-- 更多操作下拉 -->
      <div class="pdf-tab-bar__more">
        <button
          class="pdf-tab-bar__action"
          title="更多操作"
          @click="toggleMoreMenu"
        >
          ⋮
        </button>
        <div
          v-if="showMoreMenu"
          class="pdf-tab-bar__menu"
        >
          <button @click="handleCloseOthers">
            关闭其他
          </button>
          <button @click="handleCloseRight">
            关闭右侧
          </button>
          <button @click="handleCloseAll">
            关闭所有
          </button>
          <hr />
          <button @click="handleCopyPath">
            复制文件路径
          </button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="pdf-tab-bar__context-menu"
      :style="{
        left: `${contextMenu.x}px`, top: `${contextMenu.y}px`,
      }"
    >
      <button @click="handleContextClose">
        关闭
      </button>
      <button @click="handleContextCloseOthers">
        关闭其他
      </button>
      <button @click="handleContextCloseRight">
        关闭右侧
      </button>
      <hr />
      <button @click="handleContextCopyPath">
        复制路径
      </button>
    </div>

    <!-- 遮罩层（点击关闭菜单） -->
    <div
      v-if="contextMenu.visible || showMoreMenu"
      class="pdf-tab-bar__overlay"
      @click="closeMenus"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import {
  usePdfTabStore,
} from '../stores/pdfTabStore'

// Props
interface Props {
  /** 最大标签页数量 */
  maxTabs?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxTabs: 10,
})

// Emits
const emit = defineEmits<{
  (e: 'tab-click', tabId: string): void
  (e: 'tab-close', tabId: string): void
  (e: 'tab-new'): void
  (e: 'tab-change', tabId: string): void
}>()

// Store
const pdfTabStore = usePdfTabStore()
const {
  tabs,
  activeTabId,
  tabCount,
} = storeToRefs(pdfTabStore)

// Refs
const tabListRef = ref<HTMLDivElement | null>(null)

// 状态
const showMoreMenu = ref(false)
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  tabId: '' as string,
})

// 拖拽状态
const dragTabId = ref<string | null>(null)

// 方法
const handleTabClick = (tabId: string): void => {
  pdfTabStore.activateTab(tabId)
  emit('tab-click', tabId)
}

const handleClose = (tabId: string): void => {
  emit('tab-close', tabId)
}

const handleNewTab = (): void => {
  emit('tab-new')
}

const toggleMoreMenu = (): void => {
  showMoreMenu.value = !showMoreMenu.value
}

const closeMenus = (): void => {
  showMoreMenu.value = false
  contextMenu.value.visible = false
}

const handleContextMenu = (event: MouseEvent, tabId: string): void => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tabId,
  }
}

const handleContextClose = (): void => {
  emit('tab-close', contextMenu.value.tabId)
  closeMenus()
}

const handleContextCloseOthers = (): void => {
  pdfTabStore.closeOtherTabs(contextMenu.value.tabId)
  closeMenus()
}

const handleContextCloseRight = (): void => {
  pdfTabStore.closeTabsToRight(contextMenu.value.tabId)
  closeMenus()
}

const handleContextCopyPath = (): void => {
  const tab = tabs.value.find((t) => t.id === contextMenu.value.tabId)
  if (tab) {
    navigator.clipboard.writeText(tab.path)
  }
  closeMenus()
}

const handleCloseOthers = (): void => {
  if (activeTabId.value) {
    pdfTabStore.closeOtherTabs(activeTabId.value)
  }
  closeMenus()
}

const handleCloseRight = (): void => {
  if (activeTabId.value) {
    pdfTabStore.closeTabsToRight(activeTabId.value)
  }
  closeMenus()
}

const handleCloseAll = (): void => {
  pdfTabStore.closeAllTabs()
  closeMenus()
}

const handleCopyPath = (): void => {
  if (activeTabId.value) {
    const tab = tabs.value.find((t) => t.id === activeTabId.value)
    if (tab) {
      navigator.clipboard.writeText(tab.path)
    }
  }
  closeMenus()
}

// 滚轮切换标签页
const handleWheel = (event: WheelEvent): void => {
  if (event.deltaY > 0) {
    pdfTabStore.nextTab()
  } else {
    pdfTabStore.prevTab()
  }
}

// 拖拽排序
const handleDragStart = (event: DragEvent, tabId: string): void => {
  dragTabId.value = tabId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', tabId)
  }
}

const handleDrop = (event: DragEvent, targetTabId: string): void => {
  if (!dragTabId.value || dragTabId.value === targetTabId) return

  const fromIndex = pdfTabStore.getTabIndex(dragTabId.value)
  const toIndex = pdfTabStore.getTabIndex(targetTabId)

  if (fromIndex !== -1 && toIndex !== -1) {
    pdfTabStore.moveTab(fromIndex, toIndex)
  }

  dragTabId.value = null
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent): void => {
  // Ctrl+Tab 或 Ctrl+PageDown: 下一个标签
  if ((event.ctrlKey && event.key === 'Tab')
    || (event.ctrlKey && event.key === 'PageDown')) {
    event.preventDefault()
    pdfTabStore.nextTab()
  }

  // Ctrl+Shift+Tab 或 Ctrl+PageUp: 上一个标签
  if ((event.ctrlKey && event.shiftKey && event.key === 'Tab')
    || (event.ctrlKey && event.key === 'PageUp')) {
    event.preventDefault()
    pdfTabStore.prevTab()
  }

  // Ctrl+W: 关闭当前标签
  if (event.ctrlKey && event.key === 'w') {
    event.preventDefault()
    if (activeTabId.value) {
      emit('tab-close', activeTabId.value)
    }
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pdf-tab-bar {
  display: flex;
  align-items: center;
  background: var(--b3-theme-background, #fff);
  border-bottom: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  height: 36px;
  user-select: none;
}

.pdf-tab-bar__list {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pdf-tab-bar__list::-webkit-scrollbar {
  display: none;
}

.pdf-tab-bar__tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 36px;
  min-width: 100px;
  max-width: 200px;
  background: var(--b3-theme-surface, #f5f5f5);
  border-right: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.pdf-tab-bar__tab:hover {
  background: var(--b3-theme-surface-light, #ebebeb);
}

.pdf-tab-bar__tab--active {
  background: var(--b3-theme-background, #fff);
  border-bottom: 2px solid var(--b3-theme-primary, #1890ff);
}

.pdf-tab-bar__tab--loading {
  opacity: 0.7;
}

.pdf-tab-bar__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
}

.pdf-tab-bar__loading-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--b3-theme-surface-lighter, #e0e0e0);
  border-top-color: var(--b3-theme-primary, #1890ff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pdf-tab-bar__icon {
  font-size: 14px;
  flex-shrink: 0;
}

.pdf-tab-bar__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--b3-theme-on-surface, #333);
}

.pdf-tab-bar__progress {
  font-size: 11px;
  color: var(--b3-theme-on-surface-variant, #666);
  flex-shrink: 0;
}

.pdf-tab-bar__changed {
  color: var(--b3-theme-primary, #1890ff);
  font-size: 12px;
  flex-shrink: 0;
}

.pdf-tab-bar__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-variant, #666);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.pdf-tab-bar__tab:hover .pdf-tab-bar__close {
  opacity: 1;
}

.pdf-tab-bar__close:hover {
  background: var(--b3-theme-surface-lighter, #e0e0e0);
  color: var(--b3-theme-on-surface, #333);
}

.pdf-tab-bar__actions {
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 2px;
}

.pdf-tab-bar__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-variant, #666);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.pdf-tab-bar__action:hover:not(:disabled) {
  background: var(--b3-theme-surface-light, #ebebeb);
  color: var(--b3-theme-on-surface, #333);
}

.pdf-tab-bar__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-tab-bar__more {
  position: relative;
}

.pdf-tab-bar__menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--b3-theme-background, #fff);
  border: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 120px;
  padding: 4px 0;
}

.pdf-tab-bar__menu button {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--b3-theme-on-surface, #333);
  cursor: pointer;
}

.pdf-tab-bar__menu button:hover {
  background: var(--b3-theme-surface-light, #ebebeb);
}

.pdf-tab-bar__menu hr {
  border: none;
  border-top: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  margin: 4px 0;
}

.pdf-tab-bar__context-menu {
  position: fixed;
  background: var(--b3-theme-background, #fff);
  border: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  padding: 4px 0;
}

.pdf-tab-bar__context-menu button {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--b3-theme-on-surface, #333);
  cursor: pointer;
}

.pdf-tab-bar__context-menu button:hover {
  background: var(--b3-theme-surface-light, #ebebeb);
}

.pdf-tab-bar__context-menu hr {
  border: none;
  border-top: 1px solid var(--b3-theme-surface-lighter, #e0e0e0);
  margin: 4px 0;
}

.pdf-tab-bar__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .pdf-tab-bar {
    background: var(--b3-theme-background, #1e1e1e);
    border-bottom-color: var(--b3-theme-surface-lighter, #333);
  }

  .pdf-tab-bar__tab {
    background: var(--b3-theme-surface, #252525);
    border-right-color: var(--b3-theme-surface-lighter, #333);
  }

  .pdf-tab-bar__tab:hover {
    background: var(--b3-theme-surface-light, #2d2d2d);
  }

  .pdf-tab-bar__tab--active {
    background: var(--b3-theme-background, #1e1e1e);
  }

  .pdf-tab-bar__name {
    color: var(--b3-theme-on-surface, #e0e0e0);
  }

  .pdf-tab-bar__close {
    color: var(--b3-theme-on-surface-variant, #999);
  }

  .pdf-tab-bar__close:hover {
    background: var(--b3-theme-surface-lighter, #333);
    color: var(--b3-theme-on-surface, #e0e0e0);
  }

  .pdf-tab-bar__action {
    color: var(--b3-theme-on-surface-variant, #999);
  }

  .pdf-tab-bar__action:hover:not(:disabled) {
    background: var(--b3-theme-surface-light, #2d2d2d);
    color: var(--b3-theme-on-surface, #e0e0e0);
  }

  .pdf-tab-bar__menu,
  .pdf-tab-bar__context-menu {
    background: var(--b3-theme-background, #1e1e1e);
    border-color: var(--b3-theme-surface-lighter, #333);
  }

  .pdf-tab-bar__menu button,
  .pdf-tab-bar__context-menu button {
    color: var(--b3-theme-on-surface, #e0e0e0);
  }

  .pdf-tab-bar__menu button:hover,
  .pdf-tab-bar__context-menu button:hover {
    background: var(--b3-theme-surface-light, #2d2d2d);
  }
}
</style>
