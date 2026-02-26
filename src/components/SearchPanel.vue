<!-- src/components/SearchPanel.vue -->
<template>
  <div class="search-panel" :class="{ 'panel-open': isOpen }">
    <!-- 搜索面板切换按钮 -->
    <button class="search-toggle-btn" @click="togglePanel" :title="isOpen ? '关闭搜索' : '搜索 (Ctrl+F)'">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    </button>

    <!-- 搜索面板内容 -->
    <div class="search-content">
      <!-- 搜索输入区 -->
      <div class="search-input-area">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="搜索内容..."
            class="search-input"
            @input="handleSearchInput"
            @keydown.enter="goToNextResult"
            @keydown.shift.enter="goToPrevResult"
            @keydown.escape="closePanel"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="search-result-count" v-if="searchResults.length > 0">
          {{ currentResultIndex + 1 }} / {{ searchResults.length }}
        </div>
      </div>

      <!-- 搜索选项 -->
      <div class="search-options">
        <label class="search-option">
          <input type="checkbox" v-model="searchOptions.caseSensitive" />
          <span>区分大小写</span>
        </label>
        <label class="search-option">
          <input type="checkbox" v-model="searchOptions.wholeWord" />
          <span>全字匹配</span>
        </label>
        <label class="search-option">
          <input type="checkbox" v-model="searchOptions.useRegex" />
          <span>正则表达式</span>
        </label>
      </div>

      <!-- 搜索结果列表 -->
      <div class="search-results-list" ref="resultsListRef">
        <div v-if="isSearching" class="search-loading">
          <div class="b3-spin"></div>
          <span>搜索中...</span>
        </div>
        <div v-else-if="searchResults.length === 0 && searchQuery" class="search-no-results">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" opacity="0.3">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <p>未找到匹配内容</p>
        </div>
        <div
          v-for="(result, index) in searchResults"
          :key="result.id"
          :class="['search-result-item', { active: index === currentResultIndex }]"
          @click="selectResult(result)"
        >
          <div class="result-header">
            <span class="result-title">{{ result.title || '卡片' }}</span>
            <span class="result-page">第 {{ result.page }} 页</span>
          </div>
          <div class="result-content">
            <span v-html="highlightMatch(result.text)"></span>
          </div>
          <div class="result-meta">
            <span class="result-type" :class="result.type">{{ getTypeLabel(result.type) }}</span>
            <span class="result-date">{{ formatDate(result.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="search-navigation" v-if="searchResults.length > 0">
        <button @click="goToPrevResult" class="nav-btn" title="上一个 (Shift+Enter)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.59L18 14l-6-6-6 6z"/>
          </svg>
          上一个
        </button>
        <button @click="goToNextResult" class="nav-btn" title="下一个 (Enter)">
          下一个
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.59L18 10l-6 6-6-6z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { Card } from '../types/card';
import { cardService } from '../services/cardService';

interface SearchResult {
  id: string;
  text: string;
  title?: string;
  page: number;
  type: string;
  createdAt: number;
  matchIndex: number;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

const props = defineProps<{
  studySetId?: string;
  cards?: Card[];
}>();

const emit = defineEmits<{
  (e: 'result-select', result: SearchResult): void;
  (e: 'navigate-to', page: number, cardId: string): void;
}>();

// 状态
const isOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const currentResultIndex = ref(0);
const isSearching = ref(false);
const searchOptions = ref<SearchOptions>({
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
});

const searchInputRef = ref<HTMLInputElement>();
const resultsListRef = ref<HTMLDivElement>();

// 切换面板
const togglePanel = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

// 关闭面板
const closePanel = () => {
  isOpen.value = false;
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  currentResultIndex.value = 0;
  searchInputRef.value?.focus();
};

// 处理搜索输入
const handleSearchInput = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    currentResultIndex.value = 0;
    return;
  }
  performSearch();
};

// 执行搜索
const performSearch = async () => {
  isSearching.value = true;

  // 防抖
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    let cardsToSearch = props.cards || [];

    // 如果没有传入卡片，从服务获取
    if (cardsToSearch.length === 0 && props.studySetId) {
      cardsToSearch = await cardService.getCardsByStudySetId(props.studySetId);
    }

    const query = searchQuery.value.trim();
    const options = searchOptions.value;

    // 构建正则表达式
    let pattern: RegExp;
    try {
      const flags = options.caseSensitive ? 'g' : 'gi';
      if (options.useRegex) {
        pattern = new RegExp(query, flags);
      } else {
        // 转义特殊字符
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (options.wholeWord) {
          pattern = new RegExp(`\\b${escaped}\\b`, flags);
        } else {
          pattern = new RegExp(escaped, flags);
        }
      }
    } catch (e) {
      // 正则表达式无效，使用普通搜索
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, options.caseSensitive ? 'g' : 'gi');
    }

    const results: SearchResult[] = [];

    for (const card of cardsToSearch) {
      const text = card.content || '';
      const match = pattern.exec(text);

      if (match) {
        results.push({
          id: card.id,
          text: truncateText(text, 200),
          title: card.title || getCardTitle(card),
          page: card.sourceLocation.page || 1,
          type: card.type,
          createdAt: card.createdAt,
          matchIndex: match.index,
        });
      }
    }

    searchResults.value = results;
    currentResultIndex.value = 0;
  } catch (error) {
    console.error('搜索失败:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

// 获取卡片标题
const getCardTitle = (card: Card): string => {
  if (card.type === 'flashcard') {
    return (card as any).front || '闪卡';
  }
  return '卡片';
};

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 高亮匹配内容
const highlightMatch = (text: string): string => {
  if (!searchQuery.value) return text;

  try {
    const flags = searchOptions.value.caseSensitive ? 'g' : 'gi';
    const pattern = new RegExp(
      searchOptions.value.useRegex
        ? searchQuery.value
        : searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      flags
    );
    return text.replace(pattern, '<mark>$&</mark>');
  } catch (e) {
    return text;
  }
};

// 获取类型标签
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    card: '卡片',
    flashcard: '闪卡',
    excerpt: '摘录',
    handwriting: '手写',
  };
  return labels[type] || type;
};

// 格式化日期
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 选择结果
const selectResult = (result: SearchResult) => {
  emit('result-select', result);
  emit('navigate-to', result.page, result.id);
};

// 上一个结果
const goToPrevResult = () => {
  if (searchResults.value.length === 0) return;
  currentResultIndex.value = Math.max(0, currentResultIndex.value - 1);
  scrollToResult(currentResultIndex.value);
};

// 下一个结果
const goToNextResult = () => {
  if (searchResults.value.length === 0) return;
  currentResultIndex.value = Math.min(searchResults.value.length - 1, currentResultIndex.value + 1);
  scrollToResult(currentResultIndex.value);
};

// 滚动到结果
const scrollToResult = (index: number) => {
  nextTick(() => {
    const resultsList = resultsListRef.value;
    if (!resultsList) return;

    const items = resultsList.querySelectorAll('.search-result-item');
    const item = items[index] as HTMLElement;
    if (!item) return;

    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
};

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + F 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    togglePanel();
  }

  // Escape 关闭搜索
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault();
    closePanel();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.search-panel {
  position: fixed;
  top: 60px;
  right: 0;
  width: 320px;
  max-height: calc(100vh - 120px);
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 200;
  transform: translateX(100%);
  transition: transform 0.2s ease;
}

.search-panel.panel-open {
  transform: translateX(0);
}

.search-toggle-btn {
  position: fixed;
  top: 70px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 201;
  transition: all 0.15s ease;
}

.search-toggle-btn:hover {
  background: var(--b3-theme-primary);
  color: white;
}

.search-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 搜索输入区 */
.search-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--b3-theme-on-surface-light);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 36px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--b3-theme-primary);
}

.clear-btn {
  position: absolute;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.clear-btn:hover {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
}

.search-result-count {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  white-space: nowrap;
}

/* 搜索选项 */
.search-options {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.search-option {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  user-select: none;
}

.search-option input {
  cursor: pointer;
}

/* 搜索结果列表 */
.search-results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-loading,
.search-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.search-loading {
  flex-direction: row;
  gap: 12px;
}

.search-no-results svg {
  margin-bottom: 12px;
}

.search-no-results p {
  margin: 0;
  font-size: 14px;
}

.search-result-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 8px;
}

.search-result-item:hover {
  background: var(--b3-theme-surface-hover);
}

.search-result-item.active {
  background: var(--b3-theme-primary-light);
  border: 1px solid var(--b3-theme-primary);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.result-page {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.result-content {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-content :deep(mark) {
  background: rgba(255, 217, 61, 0.5);
  color: var(--b3-theme-on-surface);
  padding: 1px 4px;
  border-radius: 2px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-on-surface);
}

.result-type.flashcard {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.result-type.excerpt {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

.result-date {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin-left: auto;
}

/* 导航按钮 */
.search-navigation {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
}

.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover {
  background: var(--b3-theme-surface);
  border-color: var(--b3-theme-primary);
  color: var(--b3-theme-primary);
}
</style>
