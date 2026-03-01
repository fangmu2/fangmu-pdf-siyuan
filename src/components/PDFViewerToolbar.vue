<template>
  <div class="pdf-viewer-toolbar">
    <!-- 左侧工具栏 -->
    <div class="toolbar-left">
      <!-- 导航按钮 -->
      <button
        class="tool-btn"
        @click="$emit('prev-page')"
        :disabled="currentPage <= 1"
        title="上一页 (PageUp)"
      >
        <span>◀</span>
      </button>
      <button
        class="tool-btn"
        @click="$emit('next-page')"
        :disabled="currentPage >= totalPages"
        title="下一页 (PageDown)"
      >
        <span>▶</span>
      </button>

      <!-- 页码输入 -->
      <div class="page-input-group">
        <input
          type="number"
          :value="currentPage"
          @change="$emit('go-to-page', $event.target.value)"
          min="1"
          :max="totalPages"
          class="page-input"
        />
        <span class="page-total">/ {{ totalPages }}</span>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 阅读模式切换 -->
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: viewMode === 'single' }"
          @click="$emit('set-view-mode', 'single')"
          title="单页模式"
        >
          <span>📄</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: viewMode === 'double' }"
          @click="$emit('set-view-mode', 'double')"
          title="双页模式"
        >
          <span>📖</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: viewMode === 'continuous' }"
          @click="$emit('set-view-mode', 'continuous')"
          title="连续滚动"
        >
          <span>📜</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 缩放控制 -->
      <div class="zoom-group">
        <button
          class="tool-btn"
          @click="$emit('zoom-out')"
          title="缩小"
        >
          <span>🔍-</span>
        </button>
        <select
          :value="zoomLevel"
          @change="$emit('set-zoom', parseFloat($event.target.value))"
          class="zoom-select"
        >
          <option v-for="level in zoomLevels" :key="level" :value="level">
            {{ Math.round(level * 100) }}%
          </option>
          <option value="fit-width">适应宽度</option>
          <option value="fit-page">适应页面</option>
          <option value="actual">实际大小</option>
        </select>
        <button
          class="tool-btn"
          @click="$emit('zoom-in')"
          title="放大"
        >
          <span>🔍+</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 旋转 -->
      <button
        class="tool-btn"
        @click="$emit('rotate')"
        title="顺时针旋转"
      >
        <span>🔄</span>
      </button>
    </div>

    <!-- 右侧工具栏 -->
    <div class="toolbar-right">
      <!-- 进度条 -->
      <div class="progress-group">
        <span class="progress-label">进度</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ Math.round(progress) }}%</span>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 侧边栏切换 -->
      <button
        class="tool-btn"
        :class="{ active: showOutline }"
        @click="$emit('toggle-outline')"
        title="目录"
      >
        <span>📑</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: showThumbnails }"
        @click="$emit('toggle-thumbnails')"
        title="缩略图"
      >
        <span>🖼️</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: showBookmarks }"
        @click="$emit('toggle-bookmarks')"
        title="书签"
      >
        <span>🔖</span>
      </button>

      <div class="toolbar-divider"></div>

      <!-- 深色模式 -->
      <button
        class="tool-btn"
        :class="{ active: darkMode }"
        @click="$emit('toggle-dark-mode')"
        title="深色模式"
      >
        <span>🌙</span>
      </button>

      <!-- 更多选项 -->
      <div class="dropdown">
        <button class="tool-btn dropdown-toggle" title="更多选项">
          <span>⋮</span>
        </button>
        <div class="dropdown-menu">
          <button @click="$emit('add-bookmark')" class="dropdown-item">
            <span>🔖</span> 添加书签
          </button>
          <button @click="$emit('search')" class="dropdown-item">
            <span>🔍</span> 搜索
          </button>
          <hr class="dropdown-divider" />
          <button @click="$emit('export')" class="dropdown-item">
            <span>📤</span> 导出
          </button>
          <button @click="$emit('settings')" class="dropdown-item">
            <span>⚙️</span> 设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PDFViewMode } from '@/types/pdfViewer';

interface Props {
  currentPage: number;
  totalPages: number;
  viewMode: PDFViewMode;
  zoomLevel: number;
  progress: number;
  showOutline: boolean;
  showThumbnails: boolean;
  showBookmarks: boolean;
  darkMode: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'prev-page'): void;
  (e: 'next-page'): void;
  (e: 'go-to-page', page: number): void;
  (e: 'set-view-mode', mode: PDFViewMode): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'set-zoom', level: number): void;
  (e: 'rotate'): void;
  (e: 'toggle-outline'): void;
  (e: 'toggle-thumbnails'): void;
  (e: 'toggle-bookmarks'): void;
  (e: 'toggle-dark-mode'): void;
  (e: 'add-bookmark'): void;
  (e: 'search'): void;
  (e: 'export'): void;
  (e: 'settings'): void;
}>();

const zoomLevels = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0
];
</script>

<style scoped lang="scss">
.pdf-viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-theme-divider);
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  span {
    font-size: 16px;
  }
}

.tool-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--b3-theme-divider);
  margin: 0 4px;
}

.page-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;

  .page-input {
    width: 50px;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    text-align: center;
    font-size: 12px;

    &:focus {
      border-color: var(--b3-theme-primary);
      outline: none;
    }
  }

  .page-total {
    color: var(--b3-theme-text-secondary);
  }
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 2px;

  .zoom-select {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    font-size: 12px;
    cursor: pointer;

    &:focus {
      border-color: var(--b3-theme-primary);
      outline: none;
    }
  }
}

.progress-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;

  .progress-label {
    color: var(--b3-theme-text-secondary);
  }

  .progress-bar {
    width: 100px;
    height: 6px;
    background: var(--b3-theme-divider);
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: var(--b3-theme-primary);
      transition: width 0.3s;
    }
  }

  .progress-text {
    min-width: 35px;
    text-align: right;
    color: var(--b3-theme-text-secondary);
  }
}

.dropdown {
  position: relative;

  .dropdown-toggle {
    width: 32px;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    min-width: 160px;
    padding: 4px 0;
    margin-top: 4px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-divider);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: none;
  }

  &:hover .dropdown-menu {
    display: block;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    text-align: left;

    &:hover {
      background: var(--b3-theme-primary-light);
    }

    span {
      font-size: 14px;
    }
  }

  .dropdown-divider {
    margin: 4px 0;
    border: none;
    border-top: 1px solid var(--b3-theme-divider);
  }
}
</style>
