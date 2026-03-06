<!-- src/components/layout/AppHeader.vue -->
<template>
  <div class="panel-header">
    <div class="header-left">
      <button
        class="header-btn learning-set-btn"
        :class="{ active: activePanels.learningSet }"
        title="学习集管理"
        @click="$emit('toggle-panel', 'learningSet')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
        <span class="btn-text">学习集</span>
      </button>
      <button
        class="header-btn card-box-btn"
        :class="{ active: activePanels.cardBox }"
        title="卡片盒"
        @click="$emit('toggle-panel', 'cardBox')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v2zm0 4h6v2h-6v2z" />
        </svg>
        <span class="btn-text">卡片</span>
      </button>
      <button
        class="header-btn review-btn"
        :class="{ active: activePanels.review }"
        title="开始复习"
        @click="$emit('toggle-panel', 'review')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
        <span class="btn-text">复习</span>
      </button>
      <button
        class="header-btn smart-btn"
        :class="{ active: activePanels.smartStudy }"
        title="智能学习集"
        @click="$emit('toggle-panel', 'smartStudy')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <span class="btn-text">智能</span>
      </button>
      <button
        class="header-btn context-btn"
        :class="{ active: activePanels.contextView }"
        title="上下文搜索"
        @click="$emit('toggle-panel', 'contextView')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <span class="btn-text">搜索</span>
      </button>
      <button
        class="header-btn keyword-btn"
        :class="{ active: activePanels.keywordLibrary }"
        title="关键词库"
        @click="$emit('toggle-panel', 'keywordLibrary')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 14H7v-2h10v2zm0-5H7V9h10v2z" />
        </svg>
        <span class="btn-text">词库</span>
      </button>
      <button
        class="header-btn memory-btn"
        :class="{ active: activePanels.memoryContext }"
        title="场景记忆"
        @click="$emit('toggle-panel', 'memoryContext')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        <span class="btn-text">记忆</span>
      </button>
      <button
        class="header-btn mindmap-btn"
        :class="{ active: viewMode === 'mindmap' }"
        title="思维导图（树状）"
        @click="$emit('toggle-view')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        <span class="btn-text">导图</span>
      </button>
      <button
        class="header-btn link-view-btn"
        :class="{ active: false }"
        title="PDF+ 思维导图联动（MarginNote 风格）"
        :disabled="!currentPdf"
        @click="$emit('show-pdf-mindmap-link')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
        <span class="btn-text">联动</span>
      </button>
      <button
        class="header-btn settings-btn"
        :class="{ active: activePanels.settings }"
        title="设置"
        @click="$emit('toggle-panel', 'settings')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
        <span class="btn-text">设置</span>
      </button>
      <div class="header-divider"></div>
      <div class="header-title">
        <span class="title-main">{{ currentLearningSet?.name || 'MarginNote 学习' }}</span>
        <span
          v-if="currentPdf"
          class="title-sub"
        >{{ currentPdf.name }}</span>
      </div>
    </div>
    <div class="header-right">
      <div
        v-if="todayReviewCount > 0"
        class="header-review-count"
      >
        <span class="review-count-icon">✓</span>
        <span class="review-count-text">{{ todayReviewCount }}</span>
      </div>
      <button
        class="header-btn icon-btn"
        :title="viewMode === 'split' ? '切换到列表视图' : '切换到分屏视图'"
        @click="$emit('toggle-view')"
      >
        <svg
          v-if="viewMode === 'split'"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M3 5v14h18V5H3zm16 12H5V7h14v10z" />
        </svg>
      </button>
      <button
        class="header-btn icon-btn"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        @click="$emit('toggle-fullscreen')"
      >
        <svg
          v-if="isFullscreen"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
        </svg>
      </button>
      <button
        class="header-btn icon-btn close-btn"
        title="关闭"
        @click="$emit('close')"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PanelType, ViewMode } from '../../stores/appState'
import type { LearningSet } from '../../services/learningSetService'
import type { LearningSetPdf } from '../../services/learningSetService'

interface Props {
  activePanels: Record<PanelType, boolean>
  viewMode: ViewMode
  isFullscreen: boolean
  todayReviewCount: number
  currentLearningSet: LearningSet | null
  currentPdf: LearningSetPdf | null
}

defineProps<Props>()

interface Emits {
  (e: 'toggle-panel', panel: PanelType): void
  (e: 'toggle-view'): void
  (e: 'toggle-fullscreen'): void
  (e: 'close'): void
  (e: 'show-pdf-mindmap-link'): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
@import '../../styles/variables.scss';

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 48px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;

  &:hover {
    background: var(--b3-theme-surface-light);
  }

  &.active {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }

  &.icon-btn {
    padding: 8px;
  }

  &.close-btn:hover {
    background: var(--b3-theme-error-light);
    color: var(--b3-theme-error);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--b3-border-color);
  margin: 0 4px;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  .title-main {
    font-weight: 600;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .title-sub {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
}

.header-review-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--b3-theme-primary-light);
  border-radius: 12px;
  color: var(--b3-theme-primary);
  font-size: 12px;
  font-weight: 600;
}
</style>
