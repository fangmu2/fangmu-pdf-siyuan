<template>
  <div class="breadcrumb-container" :class="{ 'compact': compact }">
    <nav class="breadcrumb-nav" aria-label="面包屑导航">
      <ol class="breadcrumb-list">
        <template v-for="(item, index) in items" :key="index">
          <!-- 面包屑项 -->
          <li class="breadcrumb-item" :class="{ 'active': index === currentIndex }">
            <!-- 分隔符 -->
            <svg
              v-if="index > 0"
              class="breadcrumb-separator"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>

            <!-- 可点击的项 -->
            <button
              v-if="item.path && index !== currentIndex"
              class="breadcrumb-link"
              @click="handleClick(item, index)"
              :title="item.label"
            >
              <!-- 首页图标 -->
              <svg
                v-if="item.type === 'home'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>

              <!-- 学习集图标 -->
              <svg
                v-else-if="item.type === 'studySet'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>

              <!-- 卡片图标 -->
              <svg
                v-else-if="item.type === 'card'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
              </svg>

              <!-- 脑图图标 -->
              <svg
                v-else-if="item.type === 'mindmap'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z"/>
              </svg>

              <!-- PDF 图标 -->
              <svg
                v-else-if="item.type === 'pdf'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
              </svg>

              <!-- 复习图标 -->
              <svg
                v-else-if="item.type === 'review'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>

              <!-- 搜索图标 -->
              <svg
                v-else-if="item.type === 'search'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>

              <!-- 设置图标 -->
              <svg
                v-else-if="item.type === 'settings'"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>

              <span class="breadcrumb-label">{{ item.label }}</span>
            </button>

            <!-- 当前项（不可点击） -->
            <span v-else class="breadcrumb-current" :title="item.label">
              <!-- 首页图标 -->
              <svg
                v-if="item.type === 'home'"
                class="breadcrumb-current-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>

              <!-- 学习集图标 -->
              <svg
                v-else-if="item.type === 'studySet'"
                class="breadcrumb-current-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>

              <span class="breadcrumb-label-text">{{ item.label }}</span>
            </span>
          </li>
        </template>
      </ol>
    </nav>

    <!-- 更多操作 -->
    <div v-if="showActions" class="breadcrumb-actions">
      <button
        v-if="items.length > 1"
        class="action-btn"
        @click="handleBack"
        :title="'返回上一级'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <button
        v-if="items.length > 1"
        class="action-btn"
        @click="handleHome"
        :title="'返回首页'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { BreadcrumbItem, BreadcrumbType } from '../types/search';

// Props
const props = withDefaults(defineProps<{
  /** 导航项列表 */
  items?: BreadcrumbItem[];
  /** 当前路径 */
  currentPath?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 最大显示项数（超过则隐藏中间） */
  maxItems?: number;
}>(), {
  items: () => [],
  compact: false,
  showActions: true,
  maxItems: 5,
});

// Emits
const emit = defineEmits<{
  (e: 'navigate', item: BreadcrumbItem, index: number): void;
  (e: 'back'): void;
  (e: 'home'): void;
}>();

// 当前索引
const currentIndex = computed(() => {
  if (props.items.length === 0) return -1;
  return props.items.length - 1;
});

// 处理点击
const handleClick = (item: BreadcrumbItem, index: number) => {
  emit('navigate', item, index);
};

// 返回上一级
const handleBack = () => {
  emit('back');
};

// 返回首页
const handleHome = () => {
  emit('home');
};
</script>

<style scoped>
.breadcrumb-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border-bottom: 1px solid var(--b3-border-color);
}

.breadcrumb-container.compact {
  padding: 4px 8px;
}

/* 导航列表 */
.breadcrumb-nav {
  flex: 1;
  overflow: hidden;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.breadcrumb-separator {
  color: var(--b3-theme-on-surface-light);
  opacity: 0.5;
  flex-shrink: 0;
}

/* 链接项 */
.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.breadcrumb-link:hover {
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-primary);
}

.breadcrumb-link:active {
  background: var(--b3-theme-surface-active);
}

/* 当前项 */
.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--b3-theme-primary);
  font-weight: 500;
  white-space: nowrap;
}

.breadcrumb-current-icon {
  color: var(--b3-theme-primary);
}

.breadcrumb-label-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮 */
.breadcrumb-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.action-btn:hover {
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-on-surface);
}

.action-btn:active {
  background: var(--b3-theme-surface-active);
}
</style>
