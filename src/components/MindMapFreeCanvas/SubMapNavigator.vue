<template>
  <div
    v-if="visible && history.history.length > 0"
    class="submap-navigator"
  >
    <div class="breadcrumb-container">
      <!-- 返回上级按钮 -->
      <button
        v-if="canGoBack"
        class="back-btn"
        :disabled="!canGoBack"
        title="返回上级脑图"
        @click="handleGoBack"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      <!-- 面包屑路径 -->
      <div class="breadcrumb-path">
        <template
          v-for="(item, index) in breadcrumbPath"
          :key="item.mapId"
        >
          <!-- 路径项 -->
          <button
            class="breadcrumb-item"
            :class="{ active: index === currentIndex }"
            @click="handleNavigateTo(index)"
          >
            <span class="item-icon">
              <svg
                v-if="index === 0"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
              </svg>
            </span>
            <span class="item-title">{{ item.title }}</span>
            <span
              v-if="item.depth > 0"
              class="item-depth"
            >L{{ item.depth }}</span>
          </button>

          <!-- 分隔符 -->
          <span
            v-if="index < breadcrumbPath.length - 1"
            class="breadcrumb-separator"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </span>
        </template>
      </div>

      <!-- 历史记录按钮 -->
      <div class="history-actions">
        <button
          v-if="canGoForward"
          class="forward-btn"
          title="前进"
          @click="handleGoForward"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="navigator-stats">
      <span class="stat-item">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
        深度：{{ currentIndex }}
      </span>
      <span class="stat-divider">|</span>
      <span class="stat-item">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
        共 {{ history.history.length }} 层
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 子脑图导航组件 - 面包屑导航
 * 用于在主脑图和子脑图之间切换
 */

import type { MindMapNavigationHistory } from '@/services/freeMindMapService'
import { computed } from 'vue'

interface Props {
  /** 导航历史 */
  history: MindMapNavigationHistory
  /** 是否显示 */
  visible?: boolean
}

interface Emits {
  /** 导航到指定历史位置 */
  (e: 'navigate', index: number): void
  /** 返回上级 */
  (e: 'back'): void
  /** 前进 */
  (e: 'forward'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})

const emit = defineEmits<Emits>()

// 计算当前索引
const currentIndex = computed(() => props.history.currentIndex)

// 计算面包屑路径
const breadcrumbPath = computed(() =>
  props.history.history.slice(0, props.history.currentIndex + 1),
)

// 是否可以返回
const canGoBack = computed(() => props.history.currentIndex > 0)

// 是否可以前进
const canGoForward = computed(() =>
  props.history.currentIndex < props.history.history.length - 1,
)

// 处理导航
function handleNavigateTo(index: number) {
  emit('navigate', index)
}

// 处理返回
function handleGoBack() {
  emit('back')
}

// 处理前进
function handleGoForward() {
  emit('forward')
}
</script>

<style scoped>
.submap-navigator {
  position: relative;
  background: var(--siyuan-bg, #fff);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn,
.forward-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 4px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover:not(:disabled),
.forward-btn:hover {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-color: var(--siyuan-primary, #409eff);
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  padding: 0 8px;
}

.breadcrumb-path::-webkit-scrollbar {
  height: 4px;
}

.breadcrumb-path::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 2px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--siyuan-text, #333);
}

.breadcrumb-item:hover {
  background: var(--siyuan-hover-bg, #f0f0f0);
}

.breadcrumb-item.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  font-weight: 500;
}

.item-icon {
  display: flex;
  align-items: center;
}

.item-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-depth {
  font-size: 11px;
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.breadcrumb-item.active .item-depth {
  background: rgba(255, 255, 255, 0.2);
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: var(--siyuan-text-secondary, #999);
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.navigator-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--siyuan-text-secondary, #666);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-divider {
  color: var(--siyuan-border, #ccc);
}
</style>
