/**
 * 标签云组件
 * 可视化展示热门标签，支持点击筛选
 */

<template>
  <div class="tag-cloud-container" :class="{ 'compact': compact }">
    <!-- 标题栏 -->
    <div class="tag-cloud-header" v-if="showHeader">
      <h3 class="tag-cloud-title">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 6px;">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
        </svg>
        {{ title || '标签云' }}
      </h3>
      <div class="tag-cloud-actions">
        <button
          v-if="tags.length > config.maxTags"
          class="action-btn"
          @click="toggleExpand"
          :title="isExpanded ? '收起' : '展开'"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            :class="{ 'rotated': isExpanded }"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.59L18 10l-6 6-6-6z"/>
          </svg>
        </button>
        <button
          v-if="searchable"
          class="action-btn"
          @click="toggleSearch"
          :title="isSearching ? '关闭搜索' : '搜索标签'"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div v-if="isSearching" class="tag-search-box">
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        placeholder="搜索标签..."
        class="tag-search-input"
        @input="handleSearch"
        @keydown.escape="closeSearch"
      />
      <button v-if="searchQuery" @click="clearSearch" class="search-clear-btn">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- 标签云内容 -->
    <div class="tag-cloud-content" :style="contentStyle">
      <!-- 统计信息 -->
      <div v-if="showStats && statistics" class="tag-stats">
        <span class="stat-item">
          <span class="stat-value">{{ statistics.totalTags }}</span>
          <span class="stat-label">标签</span>
        </span>
        <span class="stat-item">
          <span class="stat-value">{{ statistics.totalUsage }}</span>
          <span class="stat-label">使用</span>
        </span>
      </div>

      <!-- 标签列表 -->
      <div class="tag-list" :class="layout">
        <template v-for="tag in displayedTags" :key="tag.tag">
          <button
            v-if="clickable"
            class="tag-item tag-btn"
            :style="getTagStyle(tag)"
            @click="handleTagClick(tag)"
            :title="`${tag.tag} (${tag.count}次使用)`"
          >
            <span class="tag-text">{{ tag.tag }}</span>
            <span v-if="showCount" class="tag-count">{{ tag.count }}</span>
          </button>
          <div
            v-else
            class="tag-item"
            :style="getTagStyle(tag)"
            :title="`${tag.tag} (${tag.count}次使用)`"
          >
            <span class="tag-text">{{ tag.tag }}</span>
            <span v-if="showCount" class="tag-count">{{ tag.count }}</span>
          </div>
        </template>
      </div>

      <!-- 空状态 -->
      <div v-if="displayedTags.length === 0" class="tag-empty">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.2">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
        </svg>
        <p>{{ searchQuery ? '未找到匹配的标签' : '暂无标签' }}</p>
        <p v-if="searchQuery" class="empty-hint">试试其他关键词</p>
      </div>
    </div>

    <!-- 最近使用标签 -->
    <div v-if="showRecent && statistics?.recentTags.length" class="recent-tags">
      <h4 class="recent-title">最近使用</h4>
      <div class="recent-list">
        <button
          v-for="tag in statistics.recentTags.slice(0, 5)"
          :key="tag.tag"
          class="recent-tag"
          :style="{ color: tag.color }"
          @click="handleTagClick(tag)"
        >
          {{ tag.tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import type { TagCloudItem, TagStatistics, TagCloudConfig } from '../types/search';
import { tagCloudService } from '../services/tagCloudService';
import { Card } from '../types/card';

// Props
const props = withDefaults(defineProps<{
  /** 卡片数据 */
  cards?: Card[];
  /** 标签数据（可选，直接传入） */
  tags?: TagCloudItem[];
  /** 学习集 ID 过滤 */
  studySetId?: string;
  /** 标题 */
  title?: string;
  /** 是否显示标题栏 */
  showHeader?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否显示计数 */
  showCount?: boolean;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示最近使用 */
  showRecent?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 布局方式 */
  layout?: 'cloud' | 'list' | 'inline';
  /** 最大显示标签数 */
  maxTags?: number;
  /** 配置 */
  config?: Partial<TagCloudConfig>;
}>(), {
  showHeader: true,
  compact: false,
  clickable: true,
  showCount: true,
  showStats: false,
  showRecent: false,
  searchable: false,
  layout: 'cloud',
  maxTags: 50,
});

// Emits
const emit = defineEmits<{
  (e: 'tag-click', tag: TagCloudItem): void;
  (e: 'tag-filter', tag: string): void;
}>();

// 状态
const isExpanded = ref(false);
const isSearching = ref(false);
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement>();

// 更新标签云服务配置
if (props.config) {
  tagCloudService.updateConfig({
    ...props.config,
    maxTags: props.maxTags,
  });
}

// 计算标签数据
const statistics = computed<TagStatistics | null>(() => {
  if (props.tags && props.tags.length > 0) {
    // 如果直接传入了标签数据
    const totalUsage = props.tags.reduce((sum, tag) => sum + tag.count, 0);
    return {
      totalTags: props.tags.length,
      totalUsage,
      topTags: props.tags,
      recentTags: [],
      byStudySet: {},
    };
  }

  if (props.cards && props.cards.length > 0) {
    return tagCloudService.extractTagStatistics(props.cards, props.studySetId);
  }

  return null;
});

// 显示的标签
const displayedTags = computed<TagCloudItem[]>(() => {
  if (!statistics.value) return [];

  let tags = statistics.value.topTags;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    tags = tags.filter(tag => tag.tag.toLowerCase().includes(query));
  }

  // 限制数量
  if (!isExpanded.value && tags.length > props.maxTags) {
    tags = tags.slice(0, props.maxTags);
  }

  return tags;
});

// 内容区样式
const contentStyle = computed(() => {
  return {
    maxHeight: isExpanded.value || props.layout !== 'cloud' ? 'none' : '300px',
    overflow: isExpanded.value ? 'visible' : 'auto',
  };
});

// 获取标签样式
const getTagStyle = (tag: TagCloudItem) => {
  const fontSize = tagCloudService.getFontSize(tag.weight);
  return {
    fontSize: `${fontSize}px`,
    color: tag.color,
  };
};

// 切换展开/收起
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 切换搜索
const toggleSearch = () => {
  isSearching.value = !isSearching.value;
  if (isSearching.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  } else {
    searchQuery.value = '';
  }
};

// 关闭搜索
const closeSearch = () => {
  isSearching.value = false;
  searchQuery.value = '';
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
  searchInputRef.value?.focus();
};

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
};

// 处理标签点击
const handleTagClick = (tag: TagCloudItem) => {
  emit('tag-click', tag);
  emit('tag-filter', tag.tag);
};

// 监听配置变化
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    tagCloudService.updateConfig(newConfig);
  }
}, { deep: true });

watch(() => props.maxTags, (newMaxTags) => {
  tagCloudService.updateConfig({ maxTags: newMaxTags });
});
</script>

<style scoped>
.tag-cloud-container {
  background: var(--b3-theme-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--b3-border-color);
}

.tag-cloud-container.compact {
  padding: 12px;
}

/* 标题栏 */
.tag-cloud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tag-cloud-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.tag-cloud-actions {
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
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-on-surface);
}

.action-btn svg.rotated {
  transform: rotate(180deg);
}

/* 搜索框 */
.tag-search-box {
  position: relative;
  margin-bottom: 12px;
}

.tag-search-input {
  width: 100%;
  height: 32px;
  padding: 0 28px 0 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.tag-search-input:focus {
  border-color: var(--b3-theme-primary);
}

.search-clear-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
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

.search-clear-btn:hover {
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-on-surface);
}

/* 内容区 */
.tag-cloud-content {
  transition: max-height 0.3s ease;
}

/* 统计信息 */
.tag-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b3-border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--b3-theme-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin-top: 2px;
}

/* 标签列表 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list.cloud {
  justify-content: flex-start;
  line-height: 1.8;
}

.tag-list.list {
  flex-direction: column;
  gap: 4px;
}

.tag-list.inline {
  gap: 6px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.tag-btn {
  border: 1px solid transparent;
}

.tag-btn:hover {
  background: var(--b3-theme-surface-hover);
  border-color: currentColor;
  transform: translateY(-1px);
}

.tag-list.list .tag-item {
  justify-content: space-between;
  padding: 8px 12px;
  width: 100%;
}

.tag-list.inline .tag-item {
  padding: 2px 8px;
  font-size: 12px;
}

.tag-text {
  line-height: 1.4;
}

.tag-count {
  font-size: 11px;
  opacity: 0.7;
  font-weight: 400;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 6px;
  border-radius: 10px;
}

/* 空状态 */
.tag-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.tag-empty svg {
  margin-bottom: 12px;
}

.tag-empty p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

/* 最近使用标签 */
.recent-tags {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--b3-border-color);
}

.recent-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-on-surface-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-tag {
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--b3-theme-surface);
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.recent-tag:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}
</style>
