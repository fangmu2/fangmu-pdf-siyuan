<script setup lang="ts">
/**
 * 悬浮工具栏组件
 * MarginNote 风格的快捷操作工具栏
 */

import { computed } from 'vue'

export interface ToolbarButton {
  id: string
  icon: string
  tooltip: string
  shortcut?: string
  active?: boolean
}

const props = defineProps<{
  // 是否显示网格
  showGrid?: boolean
  // 是否启用自动同步
  autoSync?: boolean
  // 当前布局模式
  layout?: string
}>()

const emit = defineEmits<{
  (e: 'add-text-card'): void
  (e: 'add-image-card'): void
  (e: 'add-group'): void
  (e: 'auto-layout'): void
  (e: 'fit-view'): void
  (e: 'toggle-grid'): void
  (e: 'toggle-sync'): void
  (e: 'change-layout', layout: string): void
}>()

// 工具栏按钮配置
const toolbarButtons = computed<ToolbarButton[]>(() => [
  { id: 'text', icon: 'T', tooltip: '添加文字卡片', shortcut: 'N' },
  { id: 'image', icon: '🖼️', tooltip: '添加图片卡片', shortcut: 'I' },
  { id: 'group', icon: '📦', tooltip: '添加分组', shortcut: 'G' },
])

const layoutButtons = computed<ToolbarButton[]>(() => [
  { id: 'free', icon: '🔓', tooltip: '自由布局', active: props.layout === 'free' },
  { id: 'tree', icon: '🌳', tooltip: '树状布局', active: props.layout === 'tree' },
  { id: 'vertical', icon: '⬇️', tooltip: '垂直布局', active: props.layout === 'vertical' },
  { id: 'horizontal', icon: '➡️', tooltip: '水平布局', active: props.layout === 'horizontal' },
])

// 处理按钮点击
function handleButtonClick(action: string): void {
  switch (action) {
    case 'text':
      emit('add-text-card')
      break
    case 'image':
      emit('add-image-card')
      break
    case 'group':
      emit('add-group')
      break
    case 'auto-layout':
      emit('auto-layout')
      break
    case 'fit-view':
      emit('fit-view')
      break
  }
}

// 处理布局切换
function handleLayoutChange(layout: string): void {
  emit('change-layout', layout)
}
</script>

<template>
  <div class="marginnote-floating-toolbar">
    <!-- 节点添加工具组 -->
    <div class="toolbar-group">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.id"
        class="toolbar-btn"
        @click="handleButtonClick(btn.id)"
      >
        <span class="btn-icon">{{ btn.icon }}</span>
        <span class="btn-tooltip">
          {{ btn.tooltip }}
          <span v-if="btn.shortcut" class="btn-shortcut">{{ btn.shortcut }}</span>
        </span>
      </button>
    </div>

    <!-- 分隔线 -->
    <div class="toolbar-divider" />

    <!-- 视图控制工具组 -->
    <div class="toolbar-group">
      <button
        class="toolbar-btn"
        @click="handleButtonClick('auto-layout')"
      >
        <span class="btn-icon">🔤</span>
        <span class="btn-tooltip">自动布局</span>
      </button>
      <button
        class="toolbar-btn"
        @click="handleButtonClick('fit-view')"
      >
        <span class="btn-icon">🔍</span>
        <span class="btn-tooltip">适应视图</span>
      </button>
    </div>

    <!-- 分隔线 -->
    <div class="toolbar-divider" />

    <!-- 布局选择工具组 -->
    <div class="toolbar-group">
      <button
        v-for="btn in layoutButtons"
        :key="btn.id"
        class="toolbar-btn"
        :class="{ active: btn.active }"
        @click="handleLayoutChange(btn.id)"
      >
        <span class="btn-icon">{{ btn.icon }}</span>
        <span class="btn-tooltip">{{ btn.tooltip }}</span>
      </button>
    </div>

    <!-- 分隔线 -->
    <div class="toolbar-divider" />

    <!-- 设置工具组 -->
    <div class="toolbar-group">
      <button
        class="toolbar-btn"
        :class="{ active: showGrid }"
        @click="$emit('toggle-grid')"
      >
        <span class="btn-icon">▦</span>
        <span class="btn-tooltip">显示网格</span>
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: autoSync }"
        @click="$emit('toggle-sync')"
      >
        <span class="btn-icon">🔄</span>
        <span class="btn-tooltip">自动同步</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.marginnote-floating-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1000;
  animation: toolbarSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes toolbarSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

.toolbar-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--siyuan-text, #333);
  font-size: 18px;
}

.toolbar-btn:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: scale(1.05);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-btn.active {
  background: rgba(64, 158, 255, 0.2);
  color: var(--siyuan-primary, #409eff);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.btn-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  padding: 6px 10px;
  background: rgba(30, 30, 30, 0.95);
  color: #fff;
  font-size: 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-btn:hover .btn-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

.btn-shortcut {
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .marginnote-floating-toolbar {
    background: rgba(45, 45, 45, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .toolbar-divider {
    background: rgba(255, 255, 255, 0.15);
  }

  .toolbar-btn {
    color: var(--siyuan-text, #e0e0e0);
  }

  .toolbar-btn:hover {
    background: rgba(64, 158, 255, 0.2);
  }

  .toolbar-btn.active {
    background: rgba(64, 158, 255, 0.3);
    color: #64b5f6;
  }
}

/* 小屏幕适配 */
@media (max-width: 768px) {
  .marginnote-floating-toolbar {
    top: auto;
    bottom: 16px;
    right: 50%;
    transform: translateX(50%);
    flex-wrap: wrap;
    max-width: calc(100vw - 32px);
    justify-content: center;
  }

  .toolbar-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}
</style>
