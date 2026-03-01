<template>
  <div class="search-history-container">
    <!-- 搜索历史列表 -->
    <div class="search-history-list">
      <!-- 标题栏 -->
      <div class="search-history-header" v-if="showHeader">
        <h3 class="search-history-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 6px;">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          {{ title || '搜索历史' }}
        </h3>
        <div class="search-history-actions">
          <button
            v-if="history.length > 0"
            class="action-btn"
            @click="clearAll"
            :title="'清空历史'"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="history.length === 0" class="search-history-empty">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.2">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <p>暂无搜索历史</p>
        <p class="empty-hint">开始搜索后，历史记录将显示在这里</p>
      </div>

      <!-- 历史列表 -->
      <div v-else class="history-items">
        <div
          v-for="item in displayedHistory"
          :key="item.id"
          class="history-item"
          @click="selectHistory(item)"
        >
          <div class="history-item-content">
            <div class="history-item-main">
              <svg class="history-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <span class="history-query">{{ item.query }}</span>
            </div>
            <div class="history-item-meta">
              <span class="history-count">{{ item.resultCount }} 个结果</span>
              <span class="history-scope" v-if="item.scope !== 'current'">{{ getScopeLabel(item.scope) }}</span>
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            </div>
          </div>
          <button
            class="delete-btn"
            @click.stop="deleteItem(item.id)"
            :title="'删除此项'"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <!-- 展开/收起按钮 -->
        <button
          v-if="history.length > maxDisplay"
          class="toggle-more-btn"
          @click="toggleExpand"
        >
          <span>{{ isExpanded ? '收起' : `查看全部 ${history.length} 条` }}</span>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            :class="{ 'rotated': isExpanded }"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.59L18 10l-6 6-6-6z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { SearchHistoryItem, SearchScope } from '../types/search';
import {
  searchHistoryService,
  getSearchHistory,
  addSearchHistory
} from '../services/searchHistoryService';

// Props
const props = withDefaults(defineProps<{
  /** 标题 */
  title?: string;
  /** 是否显示标题栏 */
  showHeader?: boolean;
  /** 最大显示数量 */
  maxDisplay?: number;
  /** 点击时是否自动添加到历史 */
  autoAdd?: boolean;
}>(), {
  showHeader: true,
  maxDisplay: 10,
  autoAdd: true,
});

// Emits
const emit = defineEmits<{
  (e: 'select', item: SearchHistoryItem): void;
  (e: 'search', query: string): void;
}>();

// 状态
const history = ref<SearchHistoryItem[]>([]);
const isExpanded = ref(false);
let unsubscribe: (() => void) | null = null;

// 显示的歷史
const displayedHistory = computed(() => {
  if (isExpanded.value) {
    return history.value;
  }
  return history.value.slice(0, props.maxDisplay);
});

// 加载历史记录
const loadHistory = () => {
  history.value = getSearchHistory();
};

// 获取范围标签
const getScopeLabel = (scope: SearchScope): string => {
  const labels: Record<SearchScope, string> = {
    current: '当前',
    all: '全部',
    pdf: 'PDF',
    mindmap: '脑图',
    cards: '卡片',
  };
  return labels[scope] || scope;
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 选择历史记录
const selectHistory = (item: SearchHistoryItem) => {
  emit('select', item);
  emit('search', item.query);

  // 更新历史记录的访问时间（重新添加到前面）
  if (props.autoAdd) {
    addSearchHistory(item.query, item.resultCount, item.options, item.scope);
  }
};

// 删除单条记录
const deleteItem = (id: string) => {
  searchHistoryService.deleteHistory(id);
  loadHistory();
};

// 清空所有
const clearAll = () => {
  if (confirm('确定要清空所有搜索历史吗？')) {
    searchHistoryService.clearHistory();
    loadHistory();
  }
};

// 切换展开/收起
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 监听变化
onMounted(() => {
  loadHistory();
  unsubscribe = searchHistoryService.subscribe(loadHistory);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
.search-history-container {
  background: var(--b3-theme-background);
  border-radius: 8px;
  overflow: hidden;
}

.search-history-list {
  max-height: 400px;
  overflow-y: auto;
}

/* 标题栏 */
.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.search-history-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.search-history-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--b3-theme-error-light);
  color: var(--b3-theme-error);
}

/* 空状态 */
.search-history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.search-history-empty svg {
  margin-bottom: 12px;
}

.search-history-empty p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

/* 历史列表 */
.history-items {
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 4px;
}

.history-item:hover {
  background: var(--b3-theme-surface-hover);
}

.history-item:active {
  background: var(--b3-theme-surface-active);
}

.history-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.history-item-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-icon {
  color: var(--b3-theme-on-surface-light);
  flex-shrink: 0;
}

.history-query {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.history-count {
  flex-shrink: 0;
}

.history-scope {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--b3-theme-surface-hover);
  font-size: 10px;
}

.history-time {
  margin-left: auto;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--b3-theme-error-light);
  color: var(--b3-theme-error);
}

/* 展开更多按钮 */
.toggle-more-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 8px;
}

.toggle-more-btn:hover {
  background: var(--b3-theme-surface-hover);
}

.toggle-more-btn svg {
  transition: transform 0.2s ease;
}

.toggle-more-btn svg.rotated {
  transform: rotate(180deg);
}
</style>
