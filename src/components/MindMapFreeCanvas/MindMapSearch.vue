<template>
  <div class="mindmap-search-panel" :class="{ 'is-open': showPanel }">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input
        v-model="localQuery"
        type="text"
        class="search-input"
        :placeholder="t('mindmap.search.placeholder')"
        @keyup.enter="executeSearch"
        @keydown.esc="clearSearch"
        @focus="showHistory = true"
        @blur="delayedHideHistory"
      />
      <button
        v-if="localQuery"
        class="clear-btn"
        @click="clearSearch"
        :title="t('common.clear')"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- 搜索选项 -->
    <div class="search-options">
      <label class="option-checkbox">
        <input
          type="checkbox"
          v-model="searchOptions.caseSensitive"
        />
        <span>{{ t('mindmap.search.caseSensitive') }}</span>
      </label>
      <label class="option-checkbox">
        <input
          type="checkbox"
          v-model="searchOptions.wholeWord"
        />
        <span>{{ t('mindmap.search.wholeWord') }}</span>
      </label>
      <label class="option-checkbox">
        <input
          type="checkbox"
          v-model="searchOptions.useRegex"
        />
        <span>{{ t('mindmap.search.regex') }}</span>
      </label>
    </div>

    <!-- 搜索字段选择 -->
    <div class="search-fields">
      <span class="fields-label">{{ t('mindmap.search.searchIn') }}:</span>
      <label class="field-checkbox" v-for="field in availableFields" :key="field">
        <input
          type="checkbox"
          :checked="searchOptions.searchFields?.includes(field as any)"
          @change="toggleSearchField(field)"
        />
        <span>{{ t(`mindmap.search.fields.${field}`) }}</span>
      </label>
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasActiveSearch" class="search-results">
      <div class="results-header">
        <span class="results-count">
          <template v-if="isSearching">
            {{ t('mindmap.search.searching') }}
          </template>
          <template v-else>
            {{ t('mindmap.search.results', { count: searchStats?.uniqueNodes || 0, total: searchStats?.totalMatches || 0 }) }}
            <span class="search-time">({{ searchStats?.searchTime }}ms)</span>
          </template>
        </span>
        <div class="navigation-btns">
          <button
            class="nav-btn"
            @click="goToPreviousMatch"
            :disabled="!searchResult || currentMatchIndex < 0"
            :title="t('mindmap.search.previous')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <span class="match-index">
            {{ searchResult && currentMatchIndex >= 0 ? currentMatchIndex + 1 : 0 }} / {{ searchResult?.matchedNodeIds.length || 0 }}
          </span>
          <button
            class="nav-btn"
            @click="goToNextMatch"
            :disabled="!searchResult || currentMatchIndex < 0"
            :title="t('mindmap.search.next')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 结果列表 -->
      <div class="results-list">
        <div
          v-for="(match, index) in displayedMatches"
          :key="match.nodeId + index"
          class="result-item"
          :class="{ 'is-current': isCurrentMatch(match.nodeId) }"
          @click="focusNode(match.nodeId)"
        >
          <div class="result-title">
            <span class="node-title">{{ match.title }}</span>
            <span v-if="match.page" class="page-badge">P{{ match.page }}</span>
          </div>
          <div v-if="match.snippet" class="result-snippet">
            <span v-html="highlightMatch(match.snippet)"></span>
          </div>
          <div class="result-meta">
            <span v-if="match.field" class="field-tag">{{ t(`mindmap.search.fields.${match.field}`) }}</span>
            <span v-if="match.tags?.length" class="tags">
              <span v-for="tag in match.tags.slice(0, 3)" :key="tag" class="tag">#{{ tag }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="showHistory && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <span>{{ t('mindmap.search.history') }}</span>
        <button class="clear-history-btn" @click="clearHistory">
          {{ t('mindmap.search.clearHistory') }}
        </button>
      </div>
      <div class="history-list">
        <div
          v-for="item in searchHistory"
          :key="item.id"
          class="history-item"
          @click="selectHistory(item)"
        >
          <svg class="history-icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span class="history-query">{{ item.query }}</span>
          <span class="history-count">{{ item.resultCount }}</span>
          <button class="delete-history-btn" @click.stop="deleteHistoryItem(item.id)">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasActiveSearch && !showHistory" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <p>{{ t('mindmap.search.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMindMapSearch } from '@/composables/useMindMapSearch'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import type { SearchHistoryItem } from '@/types/mindMapSearch'

const props = defineProps<{
  nodes: FreeMindMapNode[]
  showPanel: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showPanel', value: boolean): void
  (e: 'focus-node', nodeId: string): void
}>()

const { t } = useI18n()

// 使用组合式函数
const {
  searchQuery,
  searchOptions,
  searchResult,
  isSearching,
  searchStats,
  searchHistory,
  hasActiveSearch,
  currentMatchIndex,
  executeSearch,
  updateSearchQuery,
  clearSearch,
  goToPreviousMatch,
  goToNextMatch,
  deleteHistoryItem,
  clearHistory
} = useMindMapSearch(() => props.nodes, {
  autoSearch: true,
  searchDebounce: 300
})

// 本地状态
const localQuery = ref('')
const showHistory = ref(false)
const historyHideTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 可用搜索字段
const availableFields = ['title', 'content', 'note', 'tag']

// 同步本地查询
watch(() => props.showPanel, (val) => {
  if (val) {
    localQuery.value = searchQuery.value
  }
})

// 切换搜索字段
function toggleSearchField(field: string) {
  const fields = searchOptions.value.searchFields || []
  const index = fields.indexOf(field as any)
  if (index > -1) {
    fields.splice(index, 1)
  } else {
    fields.push(field as any)
  }
  searchOptions.value.searchFields = [...fields]
}

// 显示搜索结果
const displayedMatches = computed(() => {
  if (!searchResult.value) return []

  return searchResult.value.matchedNodeIds.map(nodeId => {
    const node = props.nodes.find(n => n.id === nodeId)
    const match = searchResult.value?.matches.find(m => m.nodeId === nodeId)

    // 生成摘要
    let snippet = ''
    if (node?.data.content) {
      const content = node.data.content
      if (match && match.field === 'content') {
        const start = Math.max(0, match.highlightStart - 20)
        const end = Math.min(content.length, match.highlightStart + match.highlightLength + 20)
        snippet = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
      } else {
        snippet = content.slice(0, 100) + (content.length > 100 ? '...' : '')
      }
    }

    return {
      nodeId,
      title: node?.data.title || t('mindmap.node.untitled'),
      page: node?.data.page,
      snippet,
      field: match?.field,
      tags: node?.data.tags
    }
  })
})

// 检查是否是当前匹配
function isCurrentMatch(nodeId: string): boolean {
  if (!searchResult.value || currentMatchIndex.value < 0) return false
  return searchResult.value.matchedNodeIds[currentMatchIndex.value] === nodeId
}

// 高亮匹配文本
function highlightMatch(text: string): string {
  if (!searchQuery.value || !text) return text
  try {
    const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  } catch {
    return text
  }
}

// 聚焦节点
function focusNode(nodeId: string) {
  emit('focus-node', nodeId)
}

// 选择历史记录
function selectHistory(item: SearchHistoryItem) {
  localQuery.value = item.query
  searchQuery.value = item.query
  executeSearch(item.query)
  showHistory.value = false
}

// 延迟隐藏历史
function delayedHideHistory() {
  if (historyHideTimer.value) {
    clearTimeout(historyHideTimer.value)
  }
  historyHideTimer.value = setTimeout(() => {
    showHistory.value = false
  }, 200)
}
</script>

<style scoped lang="scss">
.mindmap-search-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 320px;
  max-height: 80vh;
  background: var(--siyuan-block-bg);
  border: 1px solid var(--siyuan-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.is-open {
    display: flex;
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--siyuan-border);
  gap: 8px;

  .search-icon {
    color: var(--siyuan-text-secondary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: var(--siyuan-text);

    &::placeholder {
      color: var(--siyuan-text-secondary);
    }
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--siyuan-text-secondary);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--siyuan-hover-bg);
    }
  }
}

.search-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--siyuan-border);

  .option-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--siyuan-text-secondary);
    cursor: pointer;

    input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }
  }
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--siyuan-border);

  .fields-label {
    font-size: 12px;
    color: var(--siyuan-text-secondary);
  }

  .field-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--siyuan-text-secondary);
    cursor: pointer;

    input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }
  }
}

.search-results {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--siyuan-border);

  .results-count {
    font-size: 12px;
    color: var(--siyuan-text-secondary);

    .search-time {
      font-size: 11px;
      opacity: 0.7;
    }
  }

  .navigation-btns {
    display: flex;
    align-items: center;
    gap: 4px;

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: var(--siyuan-hover-bg);
      color: var(--siyuan-text);
      cursor: pointer;
      border-radius: 4px;

      &:hover:not(:disabled) {
        background: var(--siyuan-primary);
        color: white;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .match-index {
      font-size: 12px;
      color: var(--siyuan-text);
      min-width: 50px;
      text-align: center;
    }
  }
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.result-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-hover-bg);
  }

  &.is-current {
    background: var(--siyuan-primary-light);
    border-left: 3px solid var(--siyuan-primary);
  }

  .result-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;

    .node-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--siyuan-text);
    }

    .page-badge {
      font-size: 11px;
      padding: 1px 6px;
      background: var(--siyuan-primary);
      color: white;
      border-radius: 10px;
    }
  }

  .result-snippet {
    font-size: 12px;
    color: var(--siyuan-text-secondary);
    margin-bottom: 4px;
    line-height: 1.4;

    mark {
      background: var(--siyuan-primary-light);
      color: var(--siyuan-primary);
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: 8px;

    .field-tag {
      font-size: 11px;
      padding: 1px 6px;
      background: var(--siyuan-border);
      color: var(--siyuan-text-secondary);
      border-radius: 4px;
    }

    .tags {
      display: flex;
      gap: 4px;

      .tag {
        font-size: 11px;
        color: var(--siyuan-primary);
      }
    }
  }
}

.search-history {
  border-top: 1px solid var(--siyuan-border);
  max-height: 200px;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--siyuan-text-secondary);
  border-bottom: 1px solid var(--siyuan-border);

  .clear-history-btn {
    font-size: 11px;
    padding: 2px 8px;
    border: none;
    background: transparent;
    color: var(--siyuan-text-secondary);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--siyuan-hover-bg);
    }
  }
}

.history-list {
  padding: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-hover-bg);
  }

  .history-icon {
    color: var(--siyuan-text-secondary);
    flex-shrink: 0;
  }

  .history-query {
    flex: 1;
    font-size: 13px;
    color: var(--siyuan-text);
  }

  .history-count {
    font-size: 11px;
    color: var(--siyuan-text-secondary);
  }

  .delete-history-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: var(--siyuan-text-secondary);
    cursor: pointer;
    border-radius: 4px;
    opacity: 0;

    &:hover {
      background: var(--siyuan-danger-light);
      color: var(--siyuan-danger);
    }
  }

  &:hover .delete-history-btn {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .empty-icon {
    color: var(--siyuan-text-secondary);
    opacity: 0.3;
    margin-bottom: 16px;
  }

  p {
    font-size: 13px;
    color: var(--siyuan-text-secondary);
  }
}
</style>
