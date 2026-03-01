<template>
  <div class="card-timeline-view">
    <!-- 工具栏 -->
    <div class="timeline-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">时间类型：</span>
        <sy-button
          v-for="type in timeTypes"
          :key="type.value"
          @click="currentTimeType = type.value"
          :type="currentTimeType === type.value ? 'primary' : 'text'"
          size="small"
        >
          {{ type.label }}
        </sy-button>
      </div>

      <div class="toolbar-right">
        <sy-button @click="showFilterPanel = true" icon="filter">
          筛选
        </sy-button>
      </div>
    </div>

    <!-- 时间线 -->
    <div class="timeline-container">
      <div class="timeline-groups">
        <div
          v-for="group in timelineGroups"
          :key="group.date"
          class="timeline-group"
        >
          <!-- 组头 -->
          <div class="group-header" :class="group.groupType">
            <div class="group-title">
              <span class="group-icon">{{ getGroupIcon(group.groupType) }}</span>
              <span>{{ group.formattedDate }}</span>
            </div>
            <span class="group-count">{{ group.cards.length }} 张卡片</span>
          </div>

          <!-- 组内容 -->
          <div class="group-content">
            <div class="timeline-items">
              <div
                v-for="item in group.cards"
                :key="`${item.card.id}-${item.timeType}`"
                class="timeline-item"
                @click="selectCard(item.card)"
                @dblclick="editCard(item.card)"
              >
                <!-- 时间线节点 -->
                <div class="timeline-node" :class="getGroupTypeClass(group.groupType)">
                  <div class="node-dot"></div>
                  <div class="node-line"></div>
                </div>

                <!-- 卡片内容 -->
                <div class="timeline-card">
                  <div class="card-time">{{ item.formattedDate }}</div>
                  <div class="card-content">
                    <div class="card-text">{{ item.card.content.slice(0, 120) }}{{ item.card.content.length > 120 ? '...' : '' }}</div>
                    <div class="card-meta">
                      <span class="card-tag" v-if="item.card.tags?.length">{{ item.card.tags[0] }}</span>
                      <span class="card-status" :class="item.card.status">{{ formatStatus(item.card.status) }}</span>
                      <span class="card-difficulty" :class="`diff-${item.card.difficulty}`">
                        {{ '★'.repeat(item.card.difficulty) }}
                      </span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button @click.stop="deleteCard(item.card)" class="delete-btn" title="删除">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="timelineGroups.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" class="empty-icon">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
        <p>暂无卡片数据</p>
        <sy-button @click="$emit('add')" type="primary">添加卡片</sy-button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilterPanel" class="dialog-overlay" @click.self="showFilterPanel = false">
      <div class="dialog filter-panel">
        <div class="dialog-header">
          <h3>筛选卡片</h3>
          <button @click="showFilterPanel = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <!-- 状态筛选 -->
          <div class="filter-section">
            <label class="filter-label">状态</label>
            <div class="filter-checkboxes">
              <label v-for="status in allStatuses" :key="status.value" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="status.value"
                  v-model="filterOptions.statuses"
                />
                <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
                {{ status.label }}
              </label>
            </div>
          </div>

          <!-- 难度筛选 -->
          <div class="filter-section">
            <label class="filter-label">难度</label>
            <div class="filter-checkboxes">
              <label v-for="diff in difficulties" :key="diff.value" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="diff.value"
                  v-model="filterOptions.difficulties"
                />
                {{ diff.label }}
              </label>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-section">
            <label class="filter-label">标签</label>
            <div class="tag-filter">
              <sy-input
                v-model="tagSearchQuery"
                placeholder="输入标签搜索..."
                size="small"
              />
              <div class="tag-list">
                <span
                  v-for="tag in filteredTags"
                  :key="tag.tag"
                  class="tag-chip"
                  :class="{ selected: filterOptions.tags?.includes(tag.tag) }"
                  @click="toggleTag(tag.tag)"
                >
                  {{ tag.tag }} ({{ tag.count }})
                </span>
              </div>
            </div>
          </div>

          <!-- 搜索 -->
          <div class="filter-section">
            <label class="filter-label">搜索</label>
            <sy-input
              v-model="filterOptions.searchQuery"
              placeholder="搜索卡片内容..."
              prefix-icon="search"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <sy-button @click="resetFilters">重置</sy-button>
          <sy-button @click="applyFilters" type="primary">应用</sy-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SyButton from './SiyuanTheme/SyButton.vue';
import SyInput from './SiyuanTheme/SyInput.vue';
import { cardBoxService, type FilterOptions } from '../services/cardBoxService';
import type { Card } from '../types/card';

const props = defineProps<{
  cards: Card[];
  studySetId?: string;
}>();

const emit = defineEmits<{
  (e: 'select', card: Card): void;
  (e: 'edit', card: Card): void;
  (e: 'delete', card: Card): void;
  (e: 'add'): void;
  (e: 'update'): void;
}>();

// 时间类型选项
const timeTypes = [
  { value: 'created' as const, label: '创建时间' },
  { value: 'updated' as const, label: '更新时间' },
  { value: 'reviewed' as const, label: '复习时间' }
];

// 状态选项
const allStatuses = [
  { value: 'new', label: '新学', color: '#4CAF50' },
  { value: 'learning', label: '学习中', color: '#2196F3' },
  { value: 'review', label: '待复习', color: '#FF9800' },
  { value: 'suspended', label: '已暂停', color: '#9E9E9E' }
];

// 难度选项
const difficulties = [
  { value: 1, label: '非常简单' },
  { value: 2, label: '简单' },
  { value: 3, label: '中等' },
  { value: 4, label: '困难' },
  { value: 5, label: '非常困难' }
];

// 响应式数据
const currentTimeType = ref<'created' | 'updated' | 'reviewed'>('created');
const showFilterPanel = ref(false);
const tagSearchQuery = ref('');

// 筛选选项
const filterOptions = ref<FilterOptions>({
  statuses: [],
  tags: [],
  difficulties: [],
  searchQuery: ''
});

// 时间线数据
const timelineGroups = computed(() => {
  // 应用筛选
  let filteredCards = cardBoxService.applyFilters(props.cards, filterOptions.value);

  // 生成时间线
  return cardBoxService.generateTimeline(filteredCards, currentTimeType.value);
});

// 获取所有标签
const allTags = computed(() => {
  return cardBoxService.getAllTags(props.cards);
});

// 过滤标签
const filteredTags = computed(() => {
  if (!tagSearchQuery.value) return allTags.value;
  return allTags.value.filter(tag =>
    tag.tag.toLowerCase().includes(tagSearchQuery.value.toLowerCase())
  );
});

// 格式化状态
const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'new': '新学',
    'learning': '学习中',
    'review': '待复习',
    'suspended': '已暂停'
  };
  return map[status] || status;
};

// 获取组图标
const getGroupIcon = (groupType: string) => {
  const icons: Record<string, string> = {
    'today': '📅',
    'yesterday': '📅',
    'thisWeek': '📆',
    'thisMonth': '🗓️',
    'older': '📁'
  };
  return icons[groupType] || '📁';
};

// 获取组类型样式类
const getGroupTypeClass = (groupType: string) => {
  return `group-${groupType}`;
};

// 选择卡片
const selectCard = (card: Card) => {
  emit('select', card);
};

// 编辑卡片
const editCard = (card: Card) => {
  emit('edit', card);
};

// 删除卡片
const deleteCard = (card: Card) => {
  if (confirm('确定要删除这张卡片吗？')) {
    emit('delete', card);
  }
};

// 切换标签选择
const toggleTag = (tag: string) => {
  if (!filterOptions.value.tags) {
    filterOptions.value.tags = [];
  }
  const index = filterOptions.value.tags.indexOf(tag);
  if (index > -1) {
    filterOptions.value.tags.splice(index, 1);
  } else {
    filterOptions.value.tags.push(tag);
  }
};

// 应用筛选
const applyFilters = () => {
  showFilterPanel.value = false;
  emit('update');
};

// 重置筛选
const resetFilters = () => {
  filterOptions.value = {
    statuses: [],
    tags: [],
    difficulties: [],
    searchQuery: ''
  };
  tagSearchQuery.value = '';
};
</script>

<style scoped lang="scss">
.card-timeline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// 工具栏
.timeline-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

// 时间线容器
.timeline-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.timeline-groups {
  max-width: 900px;
  margin: 0 auto;
}

// 时间线组
.timeline-group {
  margin-bottom: 32px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  margin-bottom: 16px;

  &.today { border-left: 4px solid #4CAF50; }
  &.yesterday { border-left: 4px solid #8BC34A; }
  &.thisWeek { border-left: 4px solid #2196F3; }
  &.thisMonth { border-left: 4px solid #FF9800; }
  &.older { border-left: 4px solid #9E9E9E; }
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.group-icon {
  font-size: 18px;
}

.group-count {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.group-content {
  padding-left: 20px;
}

// 时间线项
.timeline-items {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 16px;
  cursor: pointer;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;

  .node-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    z-index: 1;
  }

  .node-line {
    flex: 1;
    width: 2px;
    background: var(--b3-border-color);
    min-height: 40px;
  }

  &.group-today .node-dot { background: #4CAF50; }
  &.group-yesterday .node-dot { background: #8BC34A; }
  &.group-thisWeek .node-dot { background: #2196F3; }
  &.group-thisMonth .node-dot { background: #FF9800; }
  &.group-older .node-dot { background: #9E9E9E; }
}

.timeline-item:last-child .node-line {
  display: none;
}

// 时间线卡片
.timeline-card {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
    transform: translateX(4px);
    box-shadow: var(--b3-point-shadow);
  }
}

.card-time {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  min-width: 60px;
  padding-top: 2px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  margin-bottom: 8px;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tag {
  padding: 2px 8px;
  background: var(--b3-theme-surface-hover);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.card-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;

  &.new { background: #e8f5e9; color: #4CAF50; }
  &.learning { background: #e3f2fd; color: #2196F3; }
  &.review { background: #fff3e0; color: #FF9800; }
  &.suspended { background: #f5f5f5; color: #9E9E9E; }
}

.card-difficulty {
  padding: 2px 4px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);

  &.diff-1 { color: #4CAF50; }
  &.diff-2 { color: #8BC34A; }
  &.diff-3 { color: #FFC107; }
  &.diff-4 { color: #FF9800; }
  &.diff-5 { color: #F44336; }
}

.card-actions {
  display: flex;
  gap: 4px;
}

.delete-btn {
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
    background: rgba(var(--b3-theme-danger-rgb), 0.2);
    color: var(--b3-theme-danger);
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);

  .empty-icon {
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
  }
}

// 对话框
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
  }
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

// 筛选面板
.filter-panel {
  max-width: 600px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.filter-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tag-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.tag-chip {
  padding: 4px 12px;
  background: var(--b3-theme-surface);
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    background: var(--b3-theme-primary);
    color: white;
  }
}
</style>
