<template>
  <div class="card-list">
    <!-- 工具栏 -->
    <div class="card-list__toolbar">
      <!-- 搜索框 -->
      <div class="card-list__search">
        <input
          v-model="searchQuery"
          class="card-list__input"
          type="text"
          placeholder="搜索卡片内容..."
        />
      </div>

      <!-- 筛选器 -->
      <div class="card-list__filters">
        <select v-model="filterStatus" class="card-list__select">
          <option value="">全部状态</option>
          <option value="new">新卡片</option>
          <option value="learning">学习中</option>
          <option value="review">复习中</option>
          <option value="suspended">已暂停</option>
        </select>

        <select v-model="sortBy" class="card-list__select">
          <option value="created">创建时间</option>
          <option value="updated">更新时间</option>
          <option value="difficulty">难度</option>
          <option value="nextReview">下次复习</option>
        </select>

        <button
          :class="['card-list__sort-btn', { active: sortOrder === 'asc' }]"
          @click="toggleSortOrder"
        >
          <span v-if="sortOrder === 'asc'">↑</span>
          <span v-else>↓</span>
        </button>
      </div>

      <!-- 批量操作 -->
      <div class="card-list__bulk-actions" v-if="selectedCards.length > 0">
        <span class="card-list__selected-count">已选 {{ selectedCards.length }} 张</span>
        <button class="card-list__action-btn" @click="handleBulkConvert">转为闪卡</button>
        <button class="card-list__action-btn" @click="handleBulkTag">批量标签</button>
        <button class="card-list__action-btn card-list__action-btn--danger" @click="handleBulkDelete">删除</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="card-list__stats">
      <div class="stat-item">
        <span class="stat-item__value">{{ stats.total }}</span>
        <span class="stat-item__label">总计</span>
      </div>
      <div class="stat-item stat-item--new">
        <span class="stat-item__value">{{ stats.new }}</span>
        <span class="stat-item__label">新卡片</span>
      </div>
      <div class="stat-item stat-item--learning">
        <span class="stat-item__value">{{ stats.learning }}</span>
        <span class="stat-item__label">学习中</span>
      </div>
      <div class="stat-item stat-item--review">
        <span class="stat-item__value">{{ stats.review }}</span>
        <span class="stat-item__label">复习中</span>
      </div>
      <div class="stat-item stat-item--due">
        <span class="stat-item__value">{{ stats.dueToday }}</span>
        <span class="stat-item__label">待复习</span>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div class="card-list__content">
      <div v-if="filteredCards.length === 0" class="card-list__empty">
        <span>暂无卡片</span>
      </div>

      <div v-else class="card-list__cards">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          :class="['card-item', { selected: selectedCards.includes(card.id) }]"
          @click="handleCardClick(card)"
        >
          <!-- 复选框 -->
          <input
            type="checkbox"
            :checked="selectedCards.includes(card.id)"
            @change="toggleSelection(card.id)"
            @click.stop
            class="card-item__checkbox"
          />

          <!-- 卡片内容 -->
          <div class="card-item__content">
            <div class="card-item__header">
              <span :class="['card-item__type', `card-item__type--${card.type}`]">
                {{ card.type === 'flashcard' ? '闪卡' : '卡片' }}
              </span>
              <span :class="['card-item__status', `card-item__status--${card.status}`]">
                {{ getStatusLabel(card.status) }}
              </span>
            </div>

            <div class="card-item__text">
              <template v-if="card.type === 'flashcard'">
                <span class="card-item__front">{{ (card as FlashCard).front }}</span>
              </template>
              <template v-else>
                <span class="card-item__excerpt">{{ truncateText(card.content, 100) }}</span>
              </template>
            </div>

            <div class="card-item__meta">
              <div class="card-item__tags">
                <span v-for="tag in card.tags.slice(0, 3)" :key="tag" class="card-item__tag">
                  {{ tag }}
                </span>
                <span v-if="card.tags.length > 3" class="card-item__tag-more">
                  +{{ card.tags.length - 3 }}
                </span>
              </div>
              <span class="card-item__difficulty">难度：{{ card.difficulty }}</span>
              <span v-if="card.type === 'flashcard'" class="card-item__review">
                复习：{{ formatNextReview((card as FlashCard).srs.nextReview) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="card-item__actions">
            <button
              v-if="card.sourceLocation?.pdfPath"
              class="card-item__action-btn card-item__action-btn--pdf"
              @click.stop="handleNavigateToPdf(card)"
              title="跳转到PDF源位置"
            >
              📄 定位
            </button>
            <button class="card-item__action-btn" @click.stop="handleEdit(card)">
              编辑
            </button>
            <button
              v-if="card.type !== 'flashcard'"
              class="card-item__action-btn card-item__action-btn--primary"
              @click.stop="handleConvertToFlashCard(card)"
            >
              转为闪卡
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Card, FlashCard } from '../types/card';
import { cardService } from '../services/cardService';
import { truncateText } from '../utils';
import { formatNextReview } from '../review/sm2';
import { navigateToCardPdf } from '../services/pdfExcerptService';

interface Props {
  cards: Card[];
  studySetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
});

const emit = defineEmits<{
  (e: 'select', card: Card): void;
  (e: 'edit', card: Card): void;
  (e: 'convert', card: Card): void;
  (e: 'delete', card: Card): void;
}>();

// 搜索和筛选
const searchQuery = ref('');
const filterStatus = ref('');
const sortBy = ref('created');
const sortOrder = ref<'asc' | 'desc'>('desc');
const selectedCards = ref<string[]>([]);

// 计算统计
const stats = computed(() => {
  return cardService.countCards(props.cards);
});

// 筛选和排序卡片
const filteredCards = computed(() => {
  let result = [...props.cards];

  // 搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(card => {
      if (card.content.toLowerCase().includes(query)) return true;
      if (card.type === 'flashcard') {
        const fc = card as FlashCard;
        if (fc.front.toLowerCase().includes(query) || fc.back.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    });
  }

  // 状态筛选
  if (filterStatus.value) {
    result = result.filter(card => card.status === filterStatus.value);
  }

  // 排序
  result = cardService.sortCards(result, {
    sortBy: sortBy.value as any,
    sortOrder: sortOrder.value,
  });

  return result;
});

// 获取状态标签
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: '新卡片',
    learning: '学习中',
    review: '复习中',
    suspended: '已暂停',
  };
  return labels[status] || status;
}

// 切换排序顺序
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}

// 切换选择
function toggleSelection(cardId: string) {
  const index = selectedCards.value.indexOf(cardId);
  if (index === -1) {
    selectedCards.value.push(cardId);
  } else {
    selectedCards.value.splice(index, 1);
  }
}

// 卡片点击
function handleCardClick(card: Card) {
  emit('select', card);
}

// 编辑卡片
function handleEdit(card: Card) {
  emit('edit', card);
}

// 转换为闪卡
function handleConvertToFlashCard(card: Card) {
  emit('convert', card);
}

// 批量转换
function handleBulkConvert() {
  selectedCards.value.forEach(id => {
    const card = props.cards.find(c => c.id === id);
    if (card && card.type !== 'flashcard') {
      emit('convert', card);
    }
  });
  selectedCards.value = [];
}

// 批量标签
function handleBulkTag() {
  // TODO: 实现批量标签功能
  console.log('批量标签', selectedCards.value);
  selectedCards.value = [];
}

// 批量删除
function handleBulkDelete() {
  selectedCards.value.forEach(id => {
    const card = props.cards.find(c => c.id === id);
    if (card) {
      emit('delete', card);
    }
  });
  selectedCards.value = [];
}

// 跳转到 PDF 源位置
async function handleNavigateToPdf(card: Card) {
  try {
    const success = await navigateToCardPdf(card);
    if (!success) {
      console.warn('[CardList] 无法跳转到 PDF，卡片可能不是 PDF 摘录');
    }
  } catch (error) {
    console.error('[CardList] 跳转到 PDF 失败:', error);
  }
}
</script>

<style scoped lang="scss">
.card-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid var(--b3-theme-border);
  }

  &__search {
    flex: 1;
    min-width: 200px;
  }

  &__input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__filters {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__select {
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 13px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__sort-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;

    &:hover {
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }

    &.active {
      background: var(--b3-theme-primary);
      color: white;
      border-color: var(--b3-theme-primary);
    }
  }

  &__bulk-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  &__selected-count {
    font-size: 13px;
    color: var(--b3-theme-color-light);
  }

  &__action-btn {
    padding: 6px 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    font-size: 13px;
    cursor: pointer;

    &:hover {
      background: var(--b3-theme-background-light);
    }

    &--danger {
      border-color: var(--b3-theme-error);
      color: var(--b3-theme-error);

      &:hover {
        background: var(--b3-theme-error);
        color: white;
      }
    }
  }

  &__stats {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    background: var(--b3-theme-background-light);

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      &__value {
        font-size: 20px;
        font-weight: 600;
        color: var(--b3-theme-color);
      }

      &__label {
        font-size: 11px;
        color: var(--b3-theme-color-light);
      }

      &--new &__value {
        color: var(--b3-theme-success);
      }

      &--learning &__value {
        color: var(--b3-theme-warning);
      }

      &--review &__value {
        color: var(--b3-theme-primary);
      }

      &--due &__value {
        color: var(--b3-theme-error);
      }
    }
  }

  &__content {
    flex: 1;
    overflow: auto;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--b3-theme-color-light);
  }

  &__cards {
    display: flex;
    flex-direction: column;
  }
}

.card-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-theme-border-light);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--b3-theme-background-light);
  }

  &.selected {
    background: var(--b3-theme-primary-light);
  }

  &__checkbox {
    margin-top: 4px;
    cursor: pointer;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__type,
  &__status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;

    &--card {
      background: var(--b3-theme-background);
      color: var(--b3-theme-color);
    }

    &--flashcard {
      background: var(--b3-theme-primary-light);
      color: var(--b3-theme-primary);
    }

    &--new {
      background: var(--b3-theme-success-light);
      color: var(--b3-theme-success);
    }

    &--learning {
      background: var(--b3-theme-warning-light);
      color: var(--b3-theme-warning);
    }

    &--review {
      background: var(--b3-theme-primary-light);
      color: var(--b3-theme-primary);
    }

    &--suspended {
      background: var(--b3-theme-error-light);
      color: var(--b3-theme-error);
    }
  }

  &__text {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--b3-theme-color);
    line-height: 1.5;
  }

  &__front {
    font-weight: 500;
  }

  &__excerpt {
    color: var(--b3-theme-color-light);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__tags {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  &__tag {
    padding: 2px 6px;
    background: var(--b3-theme-background);
    border-radius: 4px;
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__tag-more {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__difficulty,
  &__review {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__action-btn {
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }

    &--primary {
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);

      &:hover {
        background: var(--b3-theme-primary);
        color: white;
      }
    }

    &--pdf {
      border-color: #8b5cf6;
      color: #8b5cf6;

      &:hover {
        background: #8b5cf6;
        color: white;
      }
    }
  }
}
</style>
