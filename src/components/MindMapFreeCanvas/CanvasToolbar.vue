<script setup lang="ts">
/**
 * 画布工具栏组件
 * 提供思维导图操作的快捷工具按钮
 */

import { computed } from 'vue'
import type { FreeMindMapLayout } from '@/types/mindmapFree'

interface Props {
  /** 当前布局模式 */
  layout: FreeMindMapLayout
  /** 当前缩放比例 */
  zoom: number
  /** 是否显示网格 */
  showGrid: boolean
  /** 是否只读模式 */
  readOnly?: boolean
  /** 是否全屏模式 */
  isFullscreen: boolean
  /** 是否有活动搜索 */
  hasActiveSearch?: boolean
  /** 是否有活动过滤器 */
  hasActiveFilter?: boolean
  /** 网格大小 */
  gridSize?: number
  /** 是否启用吸附 */
  snapEnabled?: boolean
  /** 所有标签列表 */
  allTags?: string[]
  /** 当前选中的过滤标签 */
  selectedTag?: string
  /** 是否显示导航器 */
  showNavigator?: boolean
}

interface Emits {
  (e: 'add-node', type: 'textCard' | 'imageCard'): void
  (e: 'add-group'): void
  (e: 'auto-layout', direction: 'horizontal' | 'vertical'): void
  (e: 'tree-layout'): void  // 树状布局
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'zoom-reset'): void
  (e: 'fit-view'): void
  (e: 'toggle-grid'): void
  (e: 'toggle-snap'): void
  (e: 'set-grid-size', size: number): void
  (e: 'toggle-fullscreen'): void
  (e: 'toggle-search'): void
  (e: 'toggle-filter'): void
  (e: 'toggle-navigator'): void
  (e: 'save'): void
  (e: 'export'): void
  (e: 'generate-from-pdf'): void  // 从 PDF 标注生成
  (e: 'filter-by-tag', tag: string): void  // 按标签过滤
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  layout: 'free',
  zoom: 1,
  showGrid: true,
  isFullscreen: false,
  hasActiveSearch: false,
  hasActiveFilter: false,
  gridSize: 20,
  snapEnabled: true,
  allTags: () => [],
  selectedTag: '',
  showNavigator: false
})

const emit = defineEmits<Emits>()

// 布局选项
const layoutOptions = [
  { value: 'free', label: '自由', icon: '🎨' },
  { value: 'tree', label: '树状', icon: '🌳' },
  { value: 'vertical', label: '垂直', icon: '⬇️' },
  { value: 'horizontal', label: '水平', icon: '➡️' }
]

// 计算缩放百分比
const zoomPercent = computed(() => Math.round(props.zoom * 100) + '%')
</script>

<template>
  <div class="freemind-toolbar">
    <!-- 左侧：添加节点 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn"
        :disabled="readOnly"
        @click="emit('add-node', 'textCard')"
        title="添加文本卡片 (T)"
      >
        <span class="freemind-toolbar-icon">📝</span>
        <span class="freemind-toolbar-label">文本</span>
      </button>
      <button
        class="freemind-toolbar-btn"
        :disabled="readOnly"
        @click="emit('add-node', 'imageCard')"
        title="添加图片卡片 (I)"
      >
        <span class="freemind-toolbar-icon">🖼️</span>
        <span class="freemind-toolbar-label">图片</span>
      </button>
      <button
        class="freemind-toolbar-btn"
        :disabled="readOnly"
        @click="emit('add-group')"
        title="添加分组 (G)"
      >
        <span class="freemind-toolbar-icon">📁</span>
        <span class="freemind-toolbar-label">分组</span>
      </button>
    </div>

    <div class="freemind-toolbar-divider" />

    <!-- 从 PDF 生成 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-primary"
        :disabled="readOnly"
        @click="emit('generate-from-pdf')"
        title="从当前 PDF 标注生成思维导图"
      >
        <span class="freemind-toolbar-icon">🧠</span>
        <span class="freemind-toolbar-label">从 PDF 生成</span>
      </button>
    </div>

    <div class="freemind-toolbar-divider" />

    <!-- 布局模式 -->
    <div class="freemind-toolbar-group">
      <div class="freemind-toolbar-label">布局：</div>
      <div class="freemind-toolbar-btn-group">
        <button
          v-for="option in layoutOptions"
          :key="option.value"
          class="freemind-toolbar-btn freemind-toolbar-btn-icon"
          :class="{ active: layout === option.value }"
          :disabled="readOnly && option.value !== 'free'"
          @click="emit('auto-layout', option.value as 'horizontal' | 'vertical')"
          :title="option.label + '布局'"
        >
          {{ option.icon }}
        </button>
      </div>
    </div>

    <div class="freemind-toolbar-divider" />

    <!-- 视图控制 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        @click="emit('zoom-out')"
        title="缩小 (Ctrl+-)"
      >
        <span class="freemind-toolbar-icon">🔍</span>
      </button>
      <span class="freemind-toolbar-zoom">{{ zoomPercent }}</span>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        @click="emit('zoom-in')"
        title="放大 (Ctrl++))"
      >
        <span class="freemind-toolbar-icon">🔎</span>
      </button>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        @click="emit('zoom-reset')"
        title="重置缩放 (Ctrl+0)"
      >
        <span class="freemind-toolbar-icon">1:1</span>
      </button>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        @click="emit('fit-view')"
        title="适应视图 (Ctrl+F)"
      >
        <span class="freemind-toolbar-icon">📐</span>
      </button>
    </div>

    <div class="freemind-toolbar-divider" />

    <!-- 显示选项 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: showGrid }"
        @click="emit('toggle-grid')"
        title="切换网格显示"
      >
        <span class="freemind-toolbar-icon">⊞</span>
      </button>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: snapEnabled }"
        @click="emit('toggle-snap')"
        title="切换网格吸附"
      >
        <span class="freemind-toolbar-icon">🧲</span>
      </button>
      <select
        class="freemind-toolbar-select"
        :value="gridSize"
        @change="emit('set-grid-size', Number(($event.target as HTMLSelectElement).value))"
        title="选择网格大小"
      >
        <option :value="10">10px</option>
        <option :value="20">20px</option>
        <option :value="50">50px</option>
      </select>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: isFullscreen }"
        @click="emit('toggle-fullscreen')"
        title="全屏模式 (F11)"
      >
        <span class="freemind-toolbar-icon">{{ isFullscreen ? '📐' : '📐' }}</span>
      </button>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: showNavigator }"
        @click="emit('toggle-navigator')"
        title="显示画布导航器"
      >
        <span class="freemind-toolbar-icon">🗺️</span>
      </button>
    </div>

    <div class="freemind-toolbar-divider" />

    <!-- 搜索和过滤 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: hasActiveSearch }"
        @click="emit('toggle-search')"
        title="搜索节点 (Ctrl+F)"
      >
        <span class="freemind-toolbar-icon">🔍</span>
      </button>
      <button
        class="freemind-toolbar-btn freemind-toolbar-btn-icon"
        :class="{ active: hasActiveFilter }"
        @click="emit('toggle-filter')"
        title="过滤节点 (Ctrl+Shift+F)"
      >
        <span class="freemind-toolbar-icon">🎛️</span>
      </button>
      <!-- 标签过滤器 -->
      <div v-if="allTags && allTags.length > 0" class="freemind-toolbar-group">
        <div class="freemind-toolbar-divider" />
        <select
          class="freemind-toolbar-select"
          :value="selectedTag"
          @change="emit('filter-by-tag', ($event.target as HTMLSelectElement).value)"
          title="按标签过滤"
        >
          <option value="">全部标签</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">
            🏷️ {{ tag }}
          </option>
        </select>
      </div>
    </div>

    <div class="freemind-toolbar-spacer" />

    <!-- 右侧：保存和导出 -->
    <div class="freemind-toolbar-group">
      <button
        class="freemind-toolbar-btn"
        :disabled="readOnly"
        @click="emit('save')"
        title="保存 (Ctrl+S)"
      >
        <span class="freemind-toolbar-icon">💾</span>
        <span class="freemind-toolbar-label">保存</span>
      </button>
      <button
        class="freemind-toolbar-btn"
        @click="emit('export')"
        title="导出图片"
      >
        <span class="freemind-toolbar-icon">📤</span>
        <span class="freemind-toolbar-label">导出</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.freemind-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--siyuan-bg, #fff);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  overflow-x: auto;
  white-space: nowrap;
}

.freemind-toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.freemind-toolbar-divider {
  width: 1px;
  height: 28px;
  background: var(--siyuan-border, #e0e0e0);
  margin: 0 4px;
}

.freemind-toolbar-spacer {
  flex: 1;
}

.freemind-toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  transition: all 0.2s;
}

.freemind-toolbar-btn:hover:not(:disabled) {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.freemind-toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.freemind-toolbar-btn.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.freemind-toolbar-btn-icon {
  padding: 6px 8px;
  min-width: 32px;
  justify-content: center;
}

.freemind-toolbar-btn-group {
  display: flex;
  gap: 2px;
}

.freemind-toolbar-icon {
  font-size: 16px;
}

.freemind-toolbar-label {
  font-size: 12px;
}

.freemind-toolbar-zoom {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 4px;
  min-width: 45px;
  text-align: center;
}

.freemind-toolbar-select {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 4px;
  min-width: 70px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.freemind-toolbar-select:hover {
  border-color: var(--siyuan-primary, #409eff);
}

.freemind-toolbar-select:focus {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 滚动条样式 */
.freemind-toolbar::-webkit-scrollbar {
  height: 4px;
}

.freemind-toolbar::-webkit-scrollbar-track {
  background: transparent;
}

.freemind-toolbar::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 2px;
}

.freemind-toolbar::-webkit-scrollbar-thumb:hover {
  background: var(--siyuan-secondary-text, #999);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .freemind-toolbar {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .freemind-toolbar-btn {
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-toolbar-btn:hover:not(:disabled) {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .freemind-toolbar-divider {
    background: var(--siyuan-border, #444);
  }

  .freemind-toolbar-zoom {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
  }
}
</style>
