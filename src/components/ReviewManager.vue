<template>
  <div class="review-manager">
    <!-- 顶部统计卡片 -->
    <div class="review-manager__stats">
      <div class="stat-card">
        <div class="stat-card__icon">📚</div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ stats.totalCards }}</div>
          <div class="stat-card__label">总卡片数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">⏰</div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ stats.dueToday }}</div>
          <div class="stat-card__label">今日到期</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">✅</div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ stats.learnedCards }}</div>
          <div class="stat-card__label">已掌握</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon">🔥</div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ stats.streak }}</div>
          <div class="stat-card__label">连续天数</div>
        </div>
      </div>
    </div>

    <!-- 学习集选择 -->
    <div class="review-manager__section">
      <div class="section-header">
        <h3 class="section-title">选择学习集</h3>
      </div>
      <div class="study-set-list">
        <div
          v-for="set in learningSets"
          :key="set.id"
          :class="['study-set-item', { active: selectedSetId === set.id }]"
          @click="selectStudySet(set.id)"
        >
          <div class="study-set-item__info">
            <div class="study-set-item__name">{{ set.name }}</div>
            <div class="study-set-item__desc">{{ set.description }}</div>
          </div>
          <div class="study-set-item__stats">
            <span class="study-set-item__stat">
              📝 {{ getCardCount(set.id) }}
            </span>
            <span class="study-set-item__stat due">
              ⏰ {{ getDueCount(set.id) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 复习模式选择 -->
    <div class="review-manager__section">
      <div class="section-header">
        <h3 class="section-title">复习模式</h3>
      </div>
      <div class="mode-selector">
        <button
          :class="['mode-btn', { active: reviewMode === 'normal' }]"
          @click="reviewMode = 'normal'"
        >
          <span class="mode-btn__icon">📖</span>
          <span class="mode-btn__title">普通复习</span>
          <span class="mode-btn__desc">复习所有到期卡片</span>
        </button>
        <button
          :class="['mode-btn', { active: reviewMode === 'new' }]"
          @click="reviewMode = 'new'"
        >
          <span class="mode-btn__icon">🆕</span>
          <span class="mode-btn__title">学习新卡</span>
          <span class="mode-btn__desc">学习未学过的卡片</span>
        </button>
        <button
          :class="['mode-btn', { active: reviewMode === 'wrong' }]"
          @click="reviewMode = 'wrong'"
        >
          <span class="mode-btn__icon">❌</span>
          <span class="mode-btn__title">错题复习</span>
          <span class="mode-btn__desc">复习经常出错的卡片</span>
        </button>
        <button
          :class="['mode-btn', { active: reviewMode === 'random' }]"
          @click="reviewMode = 'random'"
        >
          <span class="mode-btn__icon">🎲</span>
          <span class="mode-btn__title">随机测试</span>
          <span class="mode-btn__desc">随机抽取卡片测试</span>
        </button>
      </div>
    </div>

    <!-- 复习设置 -->
    <div class="review-manager__section">
      <div class="section-header">
        <h3 class="section-title">复习设置</h3>
      </div>
      <div class="settings-list">
        <div class="setting-item">
          <div class="setting-item__label">
            <span>每日新卡数</span>
            <span class="setting-item__hint">每天最多学习的新卡片数量</span>
          </div>
          <div class="setting-item__control">
            <input
              v-model.number="settings.dailyNewCards"
              type="number"
              min="1"
              max="100"
              class="setting-input"
            />
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-item__label">
            <span>每日复习上限</span>
            <span class="setting-item__hint">每天最多复习的卡片数量</span>
          </div>
          <div class="setting-item__control">
            <input
              v-model.number="settings.dailyReviewLimit"
              type="number"
              min="10"
              max="1000"
              class="setting-input"
            />
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-item__label">
            <span>复习算法</span>
            <span class="setting-item__hint">间隔重复算法选择</span>
          </div>
          <div class="setting-item__control">
            <select v-model="settings.algorithm" class="setting-select">
              <option value="sm2">SM-2（经典算法）</option>
              <option value="fsrs">FSRS（最新算法）</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 开始复习按钮 -->
    <div class="review-manager__actions">
      <button
        class="start-review-btn"
        :disabled="!canStartReview"
        @click="handleStartReview"
      >
        <span class="start-review-btn__icon">🚀</span>
        <span class="start-review-btn__text">
          {{ canStartReview ? '开始复习' : '暂无待复习卡片' }}
        </span>
        <span v-if="selectedSetId && getDueCount(selectedSetId) > 0" class="start-review-btn__badge">
          {{ getDueCount(selectedSetId) }}
        </span>
      </button>
    </div>

    <!-- 复习日历 -->
    <div class="review-manager__section">
      <div class="section-header">
        <h3 class="section-title">复习日历</h3>
        <div class="calendar-nav">
          <button class="calendar-nav__btn" @click="prevMonth">◀</button>
          <span class="calendar-nav__label">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
          <button class="calendar-nav__btn" @click="nextMonth">▶</button>
        </div>
      </div>
      <div class="calendar">
        <div class="calendar__header">
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="calendar__day-header">
            {{ day }}
          </div>
        </div>
        <div class="calendar__body">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="['calendar__day', {
              'is-today': day.isToday,
              'is-selected': day.isSelected,
              'has-review': day.reviewCount > 0
            }]"
            @click="selectDate(day)"
          >
            <div class="calendar__day-num">{{ day.day }}</div>
            <div v-if="day.reviewCount > 0" class="calendar__day-dot">{{ day.reviewCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLearningSetStore } from '../stores/learningSetStore';
import { useCardStore } from '../stores/cardStore';
import { useReviewStore } from '../stores/reviewStore';
import { reviewService } from '../services/reviewService';
import type { StudySet } from '../types/studySet';
import type { Card, FlashCard } from '../types/card';

const emit = defineEmits<{
  (e: 'start-review', queue: FlashCard[], mode: string): void;
}>();

const learningSetStore = useLearningSetStore();
const cardStore = useCardStore();
const reviewStore = useReviewStore();

// 选中的学习集
const selectedSetId = ref<string>('');

// 复习模式
const reviewMode = ref<'normal' | 'new' | 'wrong' | 'random'>('normal');

// 复习设置
const settings = ref({
  dailyNewCards: 20,
  dailyReviewLimit: 200,
  algorithm: 'sm2' as 'sm2' | 'fsrs',
});

// 日历状态
const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth());
const selectedDate = ref<Date | null>(null);

// 统计数据
const stats = ref({
  totalCards: 0,
  dueToday: 0,
  learnedCards: 0,
  streak: 0,
});

// 计算属性
const learningSets = computed(() => learningSetStore.learningSets);
const cards = computed(() => cardStore.cards);

const canStartReview = computed(() => {
  if (!selectedSetId.value) return false;
  const dueCount = getDueCount(selectedSetId.value);
  return dueCount > 0 || reviewMode.value !== 'normal';
});

// 日历天数
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: Array<{
    day: number;
    date: string;
    reviewCount: number;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  // 添加上月的日期
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    days.push({
      day,
      date: date.toISOString().split('T')[0],
      reviewCount: 0,
      isToday: false,
      isSelected: false,
    });
  }

  // 添加当月的日期
  const today = new Date();
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      day: i,
      date: dateStr,
      reviewCount: Math.floor(Math.random() * 10), // TODO: 从实际数据获取
      isToday: date.toDateString() === today.toDateString(),
      isSelected: selectedDate.value?.toDateString() === date.toDateString(),
    });
  }

  // 添加下月的日期
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      day: i,
      date: date.toISOString().split('T')[0],
      reviewCount: 0,
      isToday: false,
      isSelected: false,
    });
  }

  return days;
});

// 方法
function selectStudySet(id: string) {
  selectedSetId.value = id;
}

function getCardCount(setId: string): number {
  const set = learningSets.value.find(s => s.id === setId);
  return set?.cardIds?.length || 0;
}

function getDueCount(setId: string): number {
  const setCards = cards.value.filter(c => c.studySetId === setId && c.type === 'flashcard');
  const now = Date.now();
  return setCards.filter(c => {
    const flashCard = c as FlashCard;
    return flashCard.srs?.nextReview && flashCard.srs.nextReview <= now;
  }).length;
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function selectDate(day: any) {
  selectedDate.value = new Date(day.date);
}

async function handleStartReview() {
  if (!selectedSetId.value) return;

  // 获取复习队列
  const setCards = cards.value.filter(c => c.studySetId === selectedSetId.value);
  let queue: FlashCard[] = [];

  if (reviewMode.value === 'normal') {
    // 普通复习：获取到期卡片
    const now = Date.now();
    queue = setCards
      .filter(c => c.type === 'flashcard')
      .map(c => c as FlashCard)
      .filter(c => c.srs?.nextReview && c.srs.nextReview <= now);
  } else if (reviewMode.value === 'new') {
    // 学习新卡
    queue = setCards
      .filter(c => c.type === 'flashcard' && c.status === 'new')
      .map(c => c as FlashCard)
      .slice(0, settings.value.dailyNewCards);
  } else if (reviewMode.value === 'wrong') {
    // 错题复习：选择经常出错的卡片
    queue = setCards
      .filter(c => c.type === 'flashcard')
      .map(c => c as FlashCard)
      .filter(c => c.srs && c.srs.easeFactor < 2.0)
      .slice(0, 20);
  } else if (reviewMode.value === 'random') {
    // 随机测试
    const shuffled = [...setCards]
      .filter(c => c.type === 'flashcard')
      .sort(() => Math.random() - 0.5);
    queue = shuffled.slice(0, 10).map(c => c as FlashCard);
  }

  if (queue.length === 0) {
    alert('暂无可复习的卡片');
    return;
  }

  emit('start-review', queue, reviewMode.value);
}

// 加载数据
onMounted(async () => {
  // 加载学习集
  if (learningSets.value.length === 0) {
    await learningSetStore.fetchStudySets();
  }

  // 加载卡片
  if (cards.value.length === 0) {
    await cardStore.fetchCards();
  }

  // 计算统计数据
  const flashCards = cards.value.filter(c => c.type === 'flashcard') as FlashCard[];
  const now = Date.now();

  stats.value = {
    totalCards: cards.value.length,
    dueToday: flashCards.filter(c => c.srs?.nextReview && c.srs.nextReview <= now).length,
    learnedCards: flashCards.filter(c => c.status === 'review' || c.status === 'learning').length,
    streak: await reviewService.getStreak(cards.value),
  };

  // 选择第一个学习集
  if (learningSets.value.length > 0) {
    selectedSetId.value = learningSets.value[0].id;
  }
});
</script>

<style scoped lang="scss">
.review-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--b3-theme-background);

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  &__section {
    background: var(--b3-theme-surface);
    border-radius: 12px;
    padding: 16px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    padding: 16px 0;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 12px;
  border: 1px solid var(--b3-theme-divider);

  &__icon {
    font-size: 32px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--b3-theme-primary-light);
    border-radius: 12px;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    margin-top: 2px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0;
}

.study-set-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.study-set-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    background: var(--b3-theme-primary-light);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
  }

  &__desc {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__stats {
    display: flex;
    gap: 12px;
  }

  &__stat {
    font-size: 13px;
    color: var(--b3-theme-color);

    &.due {
      color: var(--b3-theme-warning);
    }
  }
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--b3-theme-background);
  border: 2px solid var(--b3-theme-divider);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary);
    color: white;

    .mode-btn__desc {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &__icon {
    font-size: 32px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
  }

  &__desc {
    font-size: 11px;
    color: var(--b3-theme-color-light);
    text-align: center;
  }
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--b3-theme-divider);

  &:last-child {
    border-bottom: none;
  }

  &__label {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span:first-child {
      font-size: 14px;
      font-weight: 500;
      color: var(--b3-theme-color);
    }
  }

  &__hint {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__control {
    .setting-input,
    .setting-select {
      width: 120px;
      padding: 8px 12px;
      border: 1px solid var(--b3-theme-divider);
      border-radius: 6px;
      background: var(--b3-theme-background);
      color: var(--b3-theme-color);
      font-size: 13px;

      &:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
      }
    }
  }
}

.start-review-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 48px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    font-size: 24px;
  }

  &__text {
    font-weight: 500;
  }

  &__badge {
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: var(--b3-theme-error);
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

.calendar {
  &__header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  &__day-header {
    text-align: center;
    font-size: 12px;
    color: var(--b3-theme-color-light);
    padding: 8px 0;
  }

  &__body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &:hover {
      background: var(--b3-theme-primary-light);
    }

    &.is-today {
      background: var(--b3-theme-primary);
      color: white;

      .calendar__day-num {
        font-weight: 600;
      }
    }

    &.is-selected {
      border: 2px solid var(--b3-theme-primary);
    }

    &.has-review {
      &::after {
        content: '';
        position: absolute;
        bottom: 4px;
        width: 4px;
        height: 4px;
        background: var(--b3-theme-success);
        border-radius: 50%;
      }
    }

    &-num {
      font-size: 13px;
    }

    &-dot {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--b3-theme-warning);
      color: white;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 12px;

  &__btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary);
      color: white;
      border-color: var(--b3-theme-primary);
    }
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
    min-width: 100px;
    text-align: center;
  }
}
</style>
