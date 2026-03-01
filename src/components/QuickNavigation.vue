<template>
  <div class="quick-navigation" v-if="visible">
    <!-- 遮罩层 -->
    <div class="overlay" @click="close"></div>

    <!-- 导航面板 -->
    <div class="navigation-panel" :class="{ 'show-bookmarks': showBookmarks }">
      <!-- 搜索区域 -->
      <div class="search-area">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="搜索卡片、思维导图、文档、标注... (Ctrl+K)"
            class="search-input"
            @keydown.esc="close"
            @keydown.up.prevent="navigateUp"
            @keydown.down.prevent="navigateDown"
            @keydown.enter="selectCurrent"
          />
          <kbd class="shortcut-hint">ESC</kbd>
        </div>

        <!-- 类型筛选 -->
        <div class="filter-tabs">
          <button
            v-for="type in filterTypes"
            :key="type.value"
            :class="['filter-tab', { active: selectedTypes.includes(type.value) }]"
            @click="toggleType(type.value)"
          >
            <span class="tab-icon">{{ type.icon }}</span>
            <span>{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- 搜索结果 / 书签 -->
      <div class="results-area">
        <!-- 书签面板 -->
        <div v-if="showBookmarks" class="bookmarks-panel">
          <div class="panel-header">
            <h3>书签</h3>
            <div class="header-actions">
              <button @click="showBookmarks = false" class="back-btn" title="返回搜索">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="bookmarks-list">
            <div
              v-for="bookmark in filteredBookmarks"
              :key="bookmark.id"
              :class="['bookmark-item', { selected: selectedIndex === bookmark.id }]"
              @click="navigateTo(bookmark)"
              @mouseenter="selectedIndex = bookmark.id"
            >
              <div class="item-icon" :class="bookmark.type">
                <span v-if="bookmark.type === 'card'">📝</span>
                <span v-else-if="bookmark.type === 'mindmap'">🧠</span>
                <span v-else-if="bookmark.type === 'document'">📄</span>
                <span v-else-if="bookmark.type === 'annotation'">🏷️</span>
              </div>
              <div class="item-content">
                <div class="item-title">{{ bookmark.title }}</div>
                <div class="item-meta">
                  <span class="item-type">{{ getTypeLabel(bookmark.type) }}</span>
                  <span v-if="bookmark.tags?.length" class="item-tags">
                    <span v-for="tag in bookmark.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <button @click.stop="removeBookmark(bookmark.id)" class="remove-btn" title="删除书签">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="filteredBookmarks.length === 0" class="empty-state">
              <p>暂无书签</p>
              <p class="hint">在搜索结果中点击 ⭐ 添加书签</p>
            </div>
          </div>
        </div>

        <!-- 搜索结果面板 -->
        <div v-else class="search-results-panel">
          <!-- 无搜索内容时显示历史记录 -->
          <div v-if="!searchQuery" class="recent-section">
            <div class="section-header">
              <h3>最近访问</h3>
              <div class="section-actions">
                <button @click="showBookmarks = true" class="bookmarks-link" title="查看书签">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                  书签
                </button>
                <button @click="clearHistory" class="clear-link" title="清除历史记录">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l7.58-4.81c.54-.34.54-1.12 0-1.46L9.54 6.98c-.67-.43-1.54.05-1.54.84z"/>
                  </svg>
                  清除
                </button>
              </div>
            </div>
            <div class="history-list">
              <div
                v-for="item in recentHistory"
                :key="item.id"
                :class="['history-item', { selected: selectedIndex === item.id }]"
                @click="navigateTo(item)"
                @mouseenter="selectedIndex = item.id"
              >
                <div class="item-icon" :class="item.type">
                  <span v-if="item.type === 'card'">📝</span>
                  <span v-else-if="item.type === 'mindmap'">🧠</span>
                  <span v-else-if="item.type === 'document'">📄</span>
                  <span v-else-if="item.type === 'annotation'">🏷️</span>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-meta">
                    <span class="item-type">{{ getTypeLabel(item.type) }}</span>
                    <span class="item-time">{{ formatTime(item.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 搜索结果显示 -->
          <div v-else class="search-results">
            <div class="results-header">
              <span class="results-count">{{ searchResults.length }} 个结果</span>
            </div>
            <div class="results-list">
              <div
                v-for="(result, index) in searchResults"
                :key="result.targetId"
                :class="['result-item', { selected: selectedIndex === result.targetId }]"
                @click="navigateTo(result)"
                @mouseenter="selectedIndex = result.targetId"
              >
                <div class="item-icon" :class="result.type">
                  <span v-if="result.type === 'card'">📝</span>
                  <span v-else-if="result.type === 'mindmap'">🧠</span>
                  <span v-else-if="result.type === 'document'">📄</span>
                  <span v-else-if="result.type === 'annotation'">🏷️</span>
                </div>
                <div class="item-content">
                  <div class="item-title" v-html="highlightMatch(result.label)"></div>
                  <div class="item-description" v-html="highlightMatch(result.description || '')"></div>
                </div>
                <div class="item-actions">
                  <button
                    @click.stop="toggleBookmark(result)"
                    class="bookmark-btn"
                    :class="{ active: isBookmarked(result.targetId) }"
                    :title="isBookmarked(result.targetId) ? '删除书签' : '添加书签'"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="footer-hints">
        <span class="hint"><kbd>↑↓</kbd> 导航</span>
        <span class="hint"><kbd>Enter</kbd> 打开</span>
        <span class="hint"><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { navigationService, type NavigationHistoryItem, type BookmarkItem } from '../services/navigationService';

const props = defineProps<{
  studySetId?: string;
}>();

const emit = defineEmits<{
  (e: 'navigate', item: NavigationHistoryItem | { targetId: string; type: string }): void;
  (e: 'close'): void;
}>();

// 可见性
const visible = ref(false);
const showBookmarks = ref(false);

// 搜索状态
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const selectedIndex = ref<string | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// 筛选类型
const filterTypes = [
  { value: 'card', label: '卡片', icon: '📝' },
  { value: 'mindmap', label: '脑图', icon: '🧠' },
  { value: 'document', label: '文档', icon: '📄' },
  { value: 'annotation', label: '标注', icon: '🏷️' }
];

const selectedTypes = ref<string[]>(['card', 'mindmap', 'document', 'annotation']);

// 历史记录
const recentHistory = ref<NavigationHistoryItem[]>([]);

// 书签
const bookmarks = ref<BookmarkItem[]>([]);

const filteredBookmarks = computed(() => {
  if (!searchQuery.value) return bookmarks.value;
  return bookmarks.value.filter(b =>
    b.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 加载数据
onMounted(async () => {
  await loadData();
  setupKeyboardListener();
});

onUnmounted(() => {
  removeKeyboardListener();
});

// 监听搜索
watch(searchQuery, async (newQuery) => {
  if (newQuery) {
    await performSearch();
  } else {
    searchResults.value = [];
  }
  selectedIndex.value = null;
});

// 加载数据
async function loadData() {
  recentHistory.value = navigationService.getHistory(10);
  bookmarks.value = navigationService.getBookmarks();
}

// 设置键盘监听
function setupKeyboardListener() {
  document.addEventListener('keydown', handleGlobalKeydown);
}

function removeKeyboardListener() {
  document.removeEventListener('keydown', handleGlobalKeydown);
}

function handleGlobalKeydown(e: KeyboardEvent) {
  // Ctrl+K 或 Cmd+K 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    open();
  }
}

// 打开/关闭
function open() {
  visible.value = true;
  searchQuery.value = '';
  showBookmarks.value = false;
  selectedIndex.value = null;
  loadData();
  setTimeout(() => searchInput.value?.focus(), 100);
}

function close() {
  visible.value = false;
  emit('close');
}

// 搜索
async function performSearch() {
  const results = await navigationService.search(searchQuery.value, {
    studySetId: props.studySetId,
    types: selectedTypes.value as any[],
    limit: 20
  });
  searchResults.value = results;
}

// 导航
function navigateUp() {
  const items = getNavigableItems();
  const currentIndex = items.findIndex(i => i.id === selectedIndex.value);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
  selectedIndex.value = items[prevIndex]?.id || null;
}

function navigateDown() {
  const items = getNavigableItems();
  const currentIndex = items.findIndex(i => i.id === selectedIndex.value);
  const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
  selectedIndex.value = items[nextIndex]?.id || null;
}

function getNavigableItems() {
  if (showBookmarks.value) {
    return filteredBookmarks.value.map(b => ({ id: b.id, ...b }));
  }
  if (searchQuery.value) {
    return searchResults.value;
  }
  return recentHistory.value;
}

function selectCurrent() {
  const items = getNavigableItems();
  const selectedItem = items.find(i => i.id === selectedIndex.value);
  if (selectedItem) {
    navigateTo(selectedItem);
  } else if (items.length > 0) {
    navigateTo(items[0]);
  }
}

// 跳转到目标
function navigateTo(item: any) {
  // 添加历史记录
  if (!showBookmarks.value && 'title' in item) {
    navigationService.addHistory({
      type: item.type,
      title: item.title,
      blockId: item.blockId || item.targetId,
      studySetId: item.studySetId,
      preview: item.description
    });
  }

  emit('navigate', item);
  close();
}

// 书签操作
function toggleBookmark(item: any) {
  const isBookmarked = bookmarks.value.some(b => b.blockId === item.targetId);
  if (isBookmarked) {
    const bookmark = bookmarks.value.find(b => b.blockId === item.targetId);
    if (bookmark) {
      navigationService.removeBookmark(bookmark.id);
      bookmarks.value = bookmarks.value.filter(b => b.id !== bookmark.id);
    }
  } else {
    const newBookmark = navigationService.addBookmark({
      type: item.type,
      title: item.label,
      blockId: item.targetId,
      studySetId: props.studySetId
    });
    bookmarks.value.push(newBookmark);
  }
}

function isBookmarked(targetId: string): boolean {
  return bookmarks.value.some(b => b.blockId === targetId);
}

function removeBookmark(id: string) {
  navigationService.removeBookmark(id);
  bookmarks.value = bookmarks.value.filter(b => b.id !== id);
}

// 类型筛选
function toggleType(type: string) {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value = selectedTypes.value.filter(t => t !== type);
  } else {
    selectedTypes.value.push(type);
  }
}

// 清除历史记录
function clearHistory() {
  navigationService.clearHistory();
  recentHistory.value = [];
}

// 工具函数
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    card: '卡片',
    mindmap: '脑图',
    document: '文档',
    annotation: '标注'
  };
  return typeMap[type] || type;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function highlightMatch(text: string): string {
  if (!searchQuery.value || !text) return text;
  const regex = new RegExp(`(${searchQuery.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 暴露方法给父组件
defineExpose({ open, close });
</script>

<style scoped lang="scss">
.quick-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

.navigation-panel {
  position: absolute;
  top: 10vh;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-height: 80vh;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// 搜索区域
.search-area {
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: var(--b3-theme-on-surface-light);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 40px;
  border: none;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  color: var(--b3-theme-on-background);

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--b3-theme-primary);
  }
}

.shortcut-hint {
  padding: 4px 8px;
  background: var(--b3-theme-surface-hover);
  border-radius: 4px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border-color: var(--b3-theme-primary);
  }
}

.tab-icon {
  font-size: 14px;
}

// 结果区域
.results-area {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
  max-height: 50vh;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
  }
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

// 列表项
.bookmarks-list, .history-list, .results-list {
  padding: 8px;
}

.bookmark-item, .history-item, .result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover, &.selected {
    background: var(--b3-theme-surface-hover);
  }
}

.item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 18px;
  flex-shrink: 0;

  &.card { background: rgba(66, 133, 244, 0.1); }
  &.mindmap { background: rgba(234, 67, 53, 0.1); }
  &.document { background: rgba(52, 168, 83, 0.1); }
  &.annotation { background: rgba(251, 188, 5, 0.1); }
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-background);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  :deep(mark) {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    padding: 1px 4px;
    border-radius: 2px;
  }
}

.item-description {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;

  :deep(mark) {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    padding: 1px 4px;
    border-radius: 2px;
  }
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.item-type {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  color: var(--b3-theme-on-surface-light);
}

.item-time {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.item-tags {
  display: flex;
  gap: 4px;
}

.tag {
  font-size: 10px;
  padding: 1px 4px;
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
  border-radius: 3px;
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  .bookmark-item:hover &, .history-item:hover &, .result-item:hover & {
    opacity: 1;
  }
}

.bookmark-btn, .remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface-hover);
    color: var(--b3-theme-primary);
  }

  &.active {
    color: var(--b3-theme-primary);
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--b3-theme-on-surface-light);

  .hint {
    font-size: 12px;
    margin-top: 8px;
  }
}

// 最近访问区域
.recent-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;

    h3 {
      margin: 0;
      font-size: 13px;
      color: var(--b3-theme-on-surface-light);
    }
  }

  .section-actions {
    display: flex;
    gap: 8px;
  }

  .bookmarks-link, .clear-link {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface-light);
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-surface-hover);
    }
  }
}

// 搜索结果
.search-results {
  .results-header {
    padding: 8px 16px;

    .results-count {
      font-size: 12px;
      color: var(--b3-theme-on-surface-light);
    }
  }
}

// 底部提示
.footer-hints {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);

  kbd {
    padding: 2px 6px;
    background: var(--b3-theme-background);
    border-radius: 4px;
    font-size: 11px;
    border: 1px solid var(--b3-border-color);
  }
}
</style>
