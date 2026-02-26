<template>
  <div class="card-box-board">
    <!-- 工具栏 -->
    <div class="card-box-board__toolbar">
      <div class="card-box-board__toolbar-left">
        <div class="card-box-board__view-toggle">
          <button
            :class="['card-box-board__view-btn', { active: viewMode === 'board' }]"
            @click="viewMode = 'board'"
            title="看板视图"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/>
            </svg>
          </button>
          <button
            :class="['card-box-board__view-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
            title="列表视图"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-box-board__toolbar-right">
        <div class="card-box-board__filter">
          <select v-model="filterStudySet" class="card-box-board__select">
            <option value="">全部学习集</option>
            <option v-for="ss in studySets" :key="ss.id" :value="ss.id">
              {{ ss.name }}
            </option>
          </select>
          <select v-model="filterTag" class="card-box-board__select">
            <option value="">全部标签</option>
            <option v-for="tag in allTags" :key="tag" :value="tag">
              #{{ tag }}
            </option>
          </select>
        </div>
        <button class="b3-button b3-button--primary b3-button--small" @click="handleCreateCard">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          新建卡片
        </button>
      </div>
    </div>

    <!-- 看板视图 -->
    <div v-if="viewMode === 'board'" class="card-box-board__kanban">
      <!-- 新卡片列 -->
      <div class="kanban-column kanban-column--new">
        <div class="kanban-column__header">
          <span class="kanban-column__icon">🆕</span>
          <span class="kanban-column__title">新卡片</span>
          <span class="kanban-column__count">{{ newCards.length }}</span>
        </div>
        <div class="kanban-column__content">
          <div
            v-for="card in newCards"
            :key="card.id"
            :class="['kanban-card', { 'kanban-card--selected': selectedCardId === card.id }]"
            @click="handleCardSelect(card)"
            @dragstart="handleDragStart($event, card)"
          >
            <div class="kanban-card__content">
              <span class="kanban-card__text">{{ truncateText(card.content, 60) }}</span>
              <div class="kanban-card__meta">
                <span class="kanban-card__tag" v-if="card.tags?.length">
                  #{{ card.tags[0] }}
                </span>
                <span class="kanban-card__time">{{ formatTime(card.created) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习中列 -->
      <div class="kanban-column kanban-column--learning">
        <div class="kanban-column__header">
          <span class="kanban-column__icon">📖</span>
          <span class="kanban-column__title">学习中</span>
          <span class="kanban-column__count">{{ learningCards.length }}</span>
        </div>
        <div class="kanban-column__content">
          <div
            v-for="card in learningCards"
            :key="card.id"
            :class="['kanban-card', { 'kanban-card--selected': selectedCardId === card.id }]"
            @click="handleCardSelect(card)"
            @dragstart="handleDragStart($event, card)"
          >
            <div class="kanban-card__content">
              <span class="kanban-card__text">{{ truncateText(card.content, 60) }}</span>
              <div class="kanban-card__meta">
                <span class="kanban-card__tag" v-if="card.tags?.length">
                  #{{ card.tags[0] }}
                </span>
                <span class="kanban-card__time">{{ formatTime(card.updated) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 复习中列 -->
      <div class="kanban-column kanban-column--review">
        <div class="kanban-column__header">
          <span class="kanban-column__icon">⏰</span>
          <span class="kanban-column__title">复习中</span>
          <span class="kanban-column__count">{{ reviewCards.length }}</span>
        </div>
        <div class="kanban-column__content">
          <div
            v-for="card in reviewCards"
            :key="card.id"
            :class="['kanban-card', { 'kanban-card--selected': selectedCardId === card.id }]"
            @click="handleCardSelect(card)"
            @dragstart="handleDragStart($event, card)"
          >
            <div class="kanban-card__content">
              <span class="kanban-card__text">{{ truncateText(card.content, 60) }}</span>
              <div class="kanban-card__meta">
                <span class="kanban-card__tag" v-if="card.tags?.length">
                  #{{ card.tags[0] }}
                </span>
                <span class="kanban-card__time" :class="{ 'kanban-card__time--due': isDue(card) }">
                  {{ formatNextReview(card.srs?.nextReview) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已完成列 -->
      <div class="kanban-column kanban-column--mastered">
        <div class="kanban-column__header">
          <span class="kanban-column__icon">✅</span>
          <span class="kanban-column__title">已掌握</span>
          <span class="kanban-column__count">{{ masteredCards.length }}</span>
        </div>
        <div class="kanban-column__content">
          <div
            v-for="card in masteredCards"
            :key="card.id"
            :class="['kanban-card', { 'kanban-card--selected': selectedCardId === card.id }]"
            @click="handleCardSelect(card)"
            @dragstart="handleDragStart($event, card)"
          >
            <div class="kanban-card__content">
              <span class="kanban-card__text">{{ truncateText(card.content, 60) }}</span>
              <div class="kanban-card__meta">
                <span class="kanban-card__tag" v-if="card.tags?.length">
                  #{{ card.tags[0] }}
                </span>
                <span class="kanban-card__time">{{ formatTime(card.updated) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="card-box-board__list">
      <div class="list-header">
        <div class="list-header__cell list-header__cell--content">内容</div>
        <div class="list-header__cell list-header__cell--status">状态</div>
        <div class="list-header__cell list-header__cell--tags">标签</div>
        <div class="list-header__cell list-header__cell--study-set">学习集</div>
        <div class="list-header__cell list-header__cell--updated">更新时间</div>
        <div class="list-header__cell list-header__cell--actions">操作</div>
      </div>
      <div class="list-body">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          :class="['list-row', { 'list-row--selected': selectedCardId === card.id }]"
          @click="handleCardSelect(card)"
        >
          <div class="list-row__cell list-row__cell--content">
            {{ truncateText(card.content, 80) }}
          </div>
          <div class="list-row__cell list-row__cell--status">
            <span :class="['status-badge', `status-badge--${card.status}`]">
              {{ getStatusLabel(card.status) }}
            </span>
          </div>
          <div class="list-row__cell list-row__cell--tags">
            <span v-for="tag in card.tags?.slice(0, 3)" :key="tag" class="tag-badge">
              #{{ tag }}
            </span>
          </div>
          <div class="list-row__cell list-row__cell--study-set">
            {{ getStudySetName(card.studySetId) }}
          </div>
          <div class="list-row__cell list-row__cell--updated">
            {{ formatTime(card.updated) }}
          </div>
          <div class="list-row__cell list-row__cell--actions">
            <button class="icon-btn" @click.stop="handleEditCard(card)" title="编辑">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="icon-btn" @click.stop="handleDeleteCard(card)" title="删除">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedCards.length > 0" class="card-box-board__bulk-actions">
      <span class="bulk-actions__count">已选择 {{ selectedCards.length }} 张卡片</span>
      <div class="bulk-actions__buttons">
        <button class="b3-button b3-button--outline b3-button--small" @click="handleBulkMove">
          移动学习集
        </button>
        <button class="b3-button b3-button--outline b3-button--small" @click="handleBulkAddTag">
          添加标签
        </button>
        <button class="b3-button b3-button--outline b3-button--small" @click="handleBulkDelete">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Card, StudySet } from '../types';
import { cardService } from '../services/cardService';
import { studySetService } from '../services/studySetService';
import { truncateText } from '../utils';

interface Props {
  studySetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
});

const emit = defineEmits<{
  (e: 'card-select', card: Card): void;
  (e: 'card-create'): void;
  (e: 'card-edit', card: Card): void;
  (e: 'card-delete', card: Card): void;
  (e: 'cards-move', cardIds: string[], studySetId: string): void;
  (e: 'cards-delete', cardIds: string[]): void;
}>();

// 视图模式
const viewMode = ref<'board' | 'list'>('board');

// 筛选
const filterStudySet = ref('');
const filterTag = ref('');

// 选中状态
const selectedCardId = ref<string | null>(null);
const selectedCards = ref<string[]>([]);

// 数据
const cards = ref<Card[]>([]);
const studySets = ref<StudySet[]>([]);

// 加载数据
const loadCards = async () => {
  // TODO: 从 API 加载卡片
  cards.value = cardService.getAllCards();
};

const loadStudySets = async () => {
  // TODO: 从 API 加载学习集
  studySets.value = studySetService.getAllStudySets();
};

watch(() => props.studySetId, loadCards, { immediate: true });
loadStudySets();

// 所有标签
const allTags = computed(() => {
  const tags = new Set<string>();
  cards.value.forEach(card => {
    card.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
});

// 筛选后的卡片
const filteredCards = computed(() => {
  return cards.value.filter(card => {
    if (props.studySetId && card.studySetId !== props.studySetId) return false;
    if (filterStudySet.value && card.studySetId !== filterStudySet.value) return false;
    if (filterTag.value && !card.tags?.includes(filterTag.value)) return false;
    return true;
  });
});

// 按状态分组的卡片
const newCards = computed(() => filteredCards.value.filter(c => c.status === 'new'));
const learningCards = computed(() => filteredCards.value.filter(c => c.status === 'learning'));
const reviewCards = computed(() => filteredCards.value.filter(c => c.status === 'review'));
const masteredCards = computed(() => filteredCards.value.filter(c => c.status === 'mastered'));

// 事件处理
const handleCardSelect = (card: Card) => {
  selectedCardId.value = card.id;
  emit('card-select', card);
};

const handleCreateCard = () => {
  emit('card-create');
};

const handleEditCard = (card: Card) => {
  emit('card-edit', card);
};

const handleDeleteCard = (card: Card) => {
  emit('card-delete', card);
};

// 拖拽相关
const handleDragStart = (event: DragEvent, card: Card) => {
  event.dataTransfer?.setData('text/plain', card.id);
};

// 批量操作
const handleBulkMove = () => {
  // TODO: 显示学习集选择对话框
  console.log('批量移动:', selectedCards.value);
};

const handleBulkAddTag = () => {
  // TODO: 显示标签输入对话框
  console.log('批量添加标签:', selectedCards.value);
};

const handleBulkDelete = () => {
  if (confirm(`确定删除选中的 ${selectedCards.value.length} 张卡片吗？`)) {
    emit('cards-delete', selectedCards.value);
  }
};

// 辅助函数
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    new: '新卡片',
    learning: '学习中',
    review: '复习中',
    mastered: '已掌握',
  };
  return labels[status] || status;
};

const getStudySetName = (studySetId?: string): string => {
  if (!studySetId) return '-';
  const ss = studySets.value.find(s => s.id === studySetId);
  return ss?.name || '-';
};

const isDue = (card: Card): boolean => {
  if (!card.srs?.nextReview) return false;
  return card.srs.nextReview <= Date.now();
};

const formatNextReview = (nextReview?: number): string => {
  if (!nextReview) return '-';
  const diff = nextReview - Date.now();
  if (diff <= 0) return '待复习';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟后`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时后`;
  return `${Math.floor(diff / 86400000)}天后`;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString();
};
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.card-box-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02), rgba(139, 92, 246, 0.02));
  overflow: hidden;
}

.card-box-board__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-theme-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent);
  backdrop-filter: blur(8px);
}

.card-box-board__view-toggle {
  display: flex;
  border: 1px solid var(--b3-theme-border);
  border-radius: 6px;
  overflow: hidden;
}

.card-box-board__view-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.card-box-board__filter {
  display: flex;
  gap: 8px;
  margin-right: 12px;
}

.card-box-board__select {
  padding: 6px 10px;
  border: 1px solid var(--b3-theme-border);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.card-box-board__kanban {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  height: 100%;
}

.kanban-column {
  min-width: 280px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-background-light);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.1);
  overflow: hidden;
  transition: all 0.2s $ease-default;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(99, 102, 241, 0.2);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 2px solid var(--b3-theme-border);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent);

    .title {
      background: linear-gradient(90deg, var(--b3-theme-color), var(--b3-theme-color-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__icon {
    font-size: 18px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  &__title {
    flex: 1;
    color: var(--b3-theme-color);
    font-weight: 600;
  }

  &__count {
    padding: 2px 10px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.08));
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  &__content {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    background: linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.02));
  }

  &--new &__header {
    border-bottom-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent);
  }

  &--learning &__header {
    border-bottom-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent);
  }

  &--review &__header {
    border-bottom-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent);
  }

  &--mastered &__header {
    border-bottom-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent);
  }
}

.kanban-card {
  padding: 14px;
  background: linear-gradient(135deg, var(--b3-theme-surface), rgba(255, 255, 255, 0.5));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s $ease-spring;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &--selected {
    border-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.05));
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__text {
    font-size: 13px;
    color: var(--b3-theme-color);
    line-height: 1.6;
    font-weight: 400;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tag {
    font-size: 11px;
    padding: 3px 8px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
    border-radius: 6px;
    color: #6366f1;
    font-weight: 500;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }

  &__time {
    font-size: 11px;
    color: var(--b3-theme-color-light);

    &--due {
      color: #f59e0b;
      font-weight: 600;
      background: rgba(245, 158, 11, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

// 列表视图
.card-box-board__list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  padding: 10px 16px;
  background: var(--b3-theme-background-light);
  border-bottom: 1px solid var(--b3-theme-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-color-light);

  &__cell {
    padding: 0 8px;

    &--content { flex: 2; }
    &--status { width: 80px; }
    &--tags { width: 150px; }
    &--study-set { width: 120px; }
    &--updated { width: 100px; }
    &--actions { width: 80px; }
  }
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-row {
  display: flex;
  padding: 10px 16px;
  border-bottom: 1px solid var(--b3-theme-border);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-background-light);
  }

  &--selected {
    background: var(--b3-theme-primary-lightest);
  }

  &__cell {
    padding: 0 8px;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--b3-theme-color);

    &--content {
      flex: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.status-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &--new {
    background: var(--b3-theme-success-light);
    color: var(--b3-theme-success);
  }

  &--learning {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }

  &--review {
    background: var(--b3-theme-warning-light);
    color: var(--b3-theme-warning);
  }

  &--mastered {
    background: var(--b3-theme-success-light);
    color: var(--b3-theme-success);
  }
}

.tag-badge {
  padding: 2px 6px;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-color-light);
  margin-right: 4px;
}

.icon-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--b3-theme-color-light);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface);
    color: var(--b3-theme-primary);
  }
}

// 批量操作
.card-box-board__bulk-actions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-theme-border);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;

  &__count {
    font-size: 13px;
    color: var(--b3-theme-color);
    font-weight: 500;
  }

  &__buttons {
    display: flex;
    gap: 8px;
  }
}
</style>
