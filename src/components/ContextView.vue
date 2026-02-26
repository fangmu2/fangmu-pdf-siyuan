<!-- src/components/ContextView.vue -->
<template>
  <div class="context-view">
    <!-- 工具栏 -->
    <div class="context-toolbar">
      <div class="toolbar-group">
        <button
          v-for="engine in searchEngines"
          :key="engine.id"
          :class="['toolbar-btn', { active: currentEngine === engine.id }]"
          @click="currentEngine = engine.id"
          :title="engine.name"
        >
          <span class="engine-icon">{{ engine.icon }}</span>
          <span class="engine-name">{{ engine.name }}</span>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <button @click="toggleSidebar" class="toolbar-btn" title="切换侧边栏">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M4 18h16V6H4v12zM3 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="context-search">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="`在${currentEngineName}中搜索...`"
        class="search-input"
        @keydown.enter="performSearch"
      />
      <button @click="performSearch" class="search-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="context-content">
      <!-- 选中内容预览 -->
      <div v-if="selectedText" class="selected-preview">
        <div class="preview-header">
          <span class="preview-title">当前选择</span>
          <button @click="clearSelection" class="preview-clear">×</button>
        </div>
        <div class="preview-text">{{ selectedText }}</div>
      </div>

      <!-- 搜索结果 -->
      <div class="search-results">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在搜索...</p>
        </div>

        <div v-else-if="searchError" class="error-state">
          <p>{{ searchError }}</p>
        </div>

        <div v-else-if="searchResults.length > 0" class="results-list">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="result-item"
            @click="handleResultClick(result)"
          >
            <div class="result-title">{{ result.title }}</div>
            <div class="result-snippet">{{ result.snippet }}</div>
            <div class="result-url">{{ result.url }}</div>
          </div>
        </div>

        <div v-else class="empty-results">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <p>暂无结果</p>
          <p class="empty-hint">输入关键词开始搜索</p>
        </div>
      </div>
    </div>

    <!-- 侧边栏 - 快速链接 -->
    <div v-if="showSidebar" class="context-sidebar">
      <div class="sidebar-header">
        <h3>快速访问</h3>
        <button @click="toggleSidebar" class="sidebar-close">×</button>
      </div>
      <div class="sidebar-content">
        <div class="quick-links">
          <a
            v-for="link in quickLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            class="quick-link"
          >
            <span class="quick-link-icon">{{ link.icon }}</span>
            <span class="quick-link-text">{{ link.name }}</span>
          </a>
        </div>

        <div class="recent-searches">
          <h4>最近搜索</h4>
          <div
            v-for="(query, index) in recentSearches"
            :key="index"
            class="recent-search"
            @click="searchQuery = query; performSearch()"
          >
            {{ query }}
          </div>
        </div>
      </div>
    </div>

    <!-- 内嵌浏览器 -->
    <div v-if="embeddedUrl" class="embedded-browser">
      <div class="browser-header">
        <button @click="closeEmbeddedBrowser" class="browser-back">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span class="browser-title">{{ embeddedTitle }}</span>
        <button @click="closeEmbeddedBrowser" class="browser-close">×</button>
      </div>
      <iframe :src="embeddedUrl" class="browser-frame" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source?: string;
}

interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  searchUrl: string;
  apiUrl?: string;
}

interface QuickLink {
  name: string;
  url: string;
  icon: string;
}

interface Props {
  selectedText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedText: ''
});

const emit = defineEmits<{
  (e: 'result-select', result: SearchResult): void;
}>();

// 搜索引擎配置
const searchEngines: SearchEngine[] = [
  {
    id: 'wikipedia',
    name: '维基百科',
    icon: '📖',
    searchUrl: 'https://zh.wikipedia.org/wiki/',
    apiUrl: 'https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*'
  },
  {
    id: 'googlescholar',
    name: '谷歌学术',
    icon: '🎓',
    searchUrl: 'https://scholar.google.com/scholar?q='
  },
  {
    id: 'bing',
    name: '必应',
    icon: '🔍',
    searchUrl: 'https://www.bing.com/search?q=',
    apiUrl: 'https://api.bing.microsoft.com/v7.0/search?q={query}'
  },
  {
    id: 'zhihu',
    name: '知乎',
    icon: '📝',
    searchUrl: 'https://www.zhihu.com/search?type=content&q='
  },
];

// 快速链接
const quickLinks: QuickLink[] = [
  { name: '维基百科', url: 'https://zh.wikipedia.org', icon: '📖' },
  { name: '谷歌学术', url: 'https://scholar.google.com', icon: '🎓' },
  { name: '百度学术', url: 'https://xueshu.baidu.com', icon: '📚' },
  { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📟' },
  { name: '知乎', url: 'https://www.zhihu.com', icon: '📝' },
];

// 状态
const currentEngine = ref('wikipedia');
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const isLoading = ref(false);
const searchError = ref('');
const showSidebar = ref(true);
const recentSearches = ref<string[]>([]);
const embeddedUrl = ref('');
const embeddedTitle = ref('');

// 当前搜索引擎
const currentEngineName = computed(() => {
  return searchEngines.find(e => e.id === currentEngine.value)?.name || '';
});

// 获取当前搜索引擎
const getCurrentEngine = () => {
  return searchEngines.find(e => e.id === currentEngine.value);
};

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return;

  isLoading.value = true;
  searchError.value = '';
  searchResults.value = [];

  // 保存到最近搜索
  if (!recentSearches.value.includes(searchQuery.value)) {
    recentSearches.value.unshift(searchQuery.value);
    if (recentSearches.value.length > 10) {
      recentSearches.value.pop();
    }
    saveRecentSearches();
  }

  const engine = getCurrentEngine();
  if (!engine) return;

  try {
    // 如果有 API，调用 API 获取结果
    if (engine.apiUrl) {
      await searchWithApi(engine);
    } else {
      // 否则直接打开搜索页面
      openSearchPage(engine);
    }
  } catch (error) {
    searchError.value = '搜索失败，请稍后重试';
    console.error('Search error:', error);
  } finally {
    isLoading.value = false;
  }
};

// 使用 API 搜索
const searchWithApi = async (engine: SearchEngine) => {
  const query = encodeURIComponent(searchQuery.value);
  const apiUrl = engine.apiUrl?.replace('{query}', query);

  const response = await fetch(apiUrl!);
  const data = await response.json();

  if (engine.id === 'wikipedia') {
    searchResults.value = (data.query?.search || []).map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      url: `${engine.searchUrl}${encodeURIComponent(item.title)}`,
      source: 'wikipedia'
    }));
  } else {
    searchResults.value = (data.webPages?.value || []).map((item: any) => ({
      title: item.name,
      snippet: item.snippet,
      url: item.url,
      source: engine.id
    }));
  }
};

// 打开搜索页面
const openSearchPage = (engine: SearchEngine) => {
  const url = engine.searchUrl + encodeURIComponent(searchQuery.value);
  embeddedUrl.value = url;
  embeddedTitle.value = `${engine.name}: ${searchQuery.value}`;
};

// 处理结果点击
const handleResultClick = (result: SearchResult) => {
  emit('result-select', result);
  // 可以选择打开内嵌浏览器或外部链接
  window.open(result.url, '_blank');
};

// 打开内嵌浏览器
const openEmbeddedBrowser = (url: string, title: string) => {
  embeddedUrl.value = url;
  embeddedTitle.value = title;
};

// 关闭内嵌浏览器
const closeEmbeddedBrowser = () => {
  embeddedUrl.value = '';
  embeddedTitle.value = '';
};

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

// 清除选择
const clearSelection = () => {
  emit('result-select', { title: '', snippet: '', url: '' });
};

// 保存最近搜索
const saveRecentSearches = () => {
  localStorage.setItem('context-view-recent-searches', JSON.stringify(recentSearches.value));
};

// 加载最近搜索
const loadRecentSearches = () => {
  const saved = localStorage.getItem('context-view-recent-searches');
  if (saved) {
    recentSearches.value = JSON.parse(saved);
  }
};

// 监听选中文字变化
watch(() => props.selectedText, (text) => {
  if (text) {
    searchQuery.value = text;
    performSearch();
  }
});

onMounted(() => {
  loadRecentSearches();
});

onUnmounted(() => {
  // 清理
});
</script>

<style scoped lang="scss">
.context-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.context-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.engine-icon {
  font-size: 14px;
}

/* 搜索框 */
.context-search {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.search-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--b3-theme-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
}

/* 主内容区 */
.context-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  position: relative;
}

/* 选中内容预览 */
.selected-preview {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border-left: 4px solid var(--b3-theme-primary);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-color-light);
  text-transform: uppercase;
}

.preview-clear {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-background);
  }
}

.preview-text {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
  line-height: 1.5;
  max-height: 100px;
  overflow: auto;
}

/* 搜索结果 */
.search-results {
  min-height: 200px;
}

.loading-state,
.error-state,
.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--b3-theme-border);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  margin-bottom: 6px;
}

.result-snippet {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-url {
  font-size: 11px;
  color: var(--b3-theme-color-light);
}

/* 侧边栏 */
.context-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 240px;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.sidebar-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-background);
  }
}

.sidebar-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  text-decoration: none;
  color: var(--b3-theme-on-surface);
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }
}

.recent-searches h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-color-light);
  text-transform: uppercase;
}

.recent-search {
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }
}

/* 内嵌浏览器 */
.embedded-browser {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--b3-theme-background);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
}

.browser-back,
.browser-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--b3-theme-background);
  }
}

.browser-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--b3-theme-color);
}

.browser-frame {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
}
</style>
