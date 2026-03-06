<!-- src/components/TimelineView.vue -->
<template>
  <div class="timeline-view">
    <!-- 工具栏 -->
    <div class="timeline-toolbar">
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'month' }]"
          title="按月视图"
          @click="viewMode = 'month'"
        >
          月
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'week' }]"
          title="按周视图"
          @click="viewMode = 'week'"
        >
          周
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'day' }]"
          title="按日视图"
          @click="viewMode = 'day'"
        >
          日
        </button>
      </div>

      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          title="上一个周期"
          @click="prevPeriod"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          title="下一个周期"
          @click="nextPeriod"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
        <button
          class="toolbar-btn toolbar-btn-primary"
          title="回到今天"
          @click="goToToday"
        >
          今天
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group toolbar-info">
        <span class="period-label">{{ periodLabel }}</span>
      </div>
    </div>

    <!-- 时间线内容 -->
    <div
      ref="contentRef"
      class="timeline-content"
    >
      <!-- 月视图 -->
      <div
        v-if="viewMode === 'month'"
        class="timeline-month-view"
      >
        <div
          v-for="month in monthData"
          :key="month.label"
          class="timeline-month"
        >
          <div class="timeline-month__header">
            <h3 class="timeline-month__title">
              {{ month.label }}
            </h3>
            <span class="timeline-month__count">{{ month.count }} 张卡片</span>
          </div>
          <div class="timeline-month__cards">
            <div
              v-for="card in month.cards"
              :key="card.id"
              class="timeline-card"
              :class="[`timeline-card--${card.type}`]"
              @click="handleCardClick(card)"
            >
              <div class="timeline-card__date">
                {{ formatDate(card.created) }}
              </div>
              <div class="timeline-card__content">
                {{ card.content || card.front }}
              </div>
              <div class="timeline-card__meta">
                <span
                  v-if="card.sourcePdf"
                  class="timeline-card__pdf"
                >
                  📄 {{ getPdfName(card.sourcePdf) }}
                </span>
                <span
                  v-if="card.tags?.length"
                  class="timeline-card__tags"
                >
                  <span
                    v-for="tag in card.tags"
                    :key="tag"
                    class="timeline-card__tag"
                  >
                    #{{ tag }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div
        v-else-if="viewMode === 'week'"
        class="timeline-week-view"
      >
        <div
          v-for="week in weekData"
          :key="week.label"
          class="timeline-week"
        >
          <div class="timeline-week__header">
            <h3 class="timeline-week__title">
              {{ week.label }}
            </h3>
            <span class="timeline-week__count">{{ week.count }} 张卡片</span>
          </div>
          <div class="timeline-week__cards">
            <div
              v-for="card in week.cards"
              :key="card.id"
              class="timeline-card"
              :class="[`timeline-card--${card.type}`]"
              @click="handleCardClick(card)"
            >
              <div class="timeline-card__date">
                {{ formatDate(card.created) }}
              </div>
              <div class="timeline-card__content">
                {{ card.content || card.front }}
              </div>
              <div class="timeline-card__meta">
                <span
                  v-if="card.sourcePdf"
                  class="timeline-card__pdf"
                >
                  📄 {{ getPdfName(card.sourcePdf) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 日视图 -->
      <div
        v-else-if="viewMode === 'day'"
        class="timeline-day-view"
      >
        <div
          v-for="day in dayData"
          :key="day.label"
          class="timeline-day"
          :class="[{ 'timeline-day--today': day.isToday }]"
        >
          <div class="timeline-day__header">
            <div class="timeline-day__info">
              <h3 class="timeline-day__title">
                {{ day.label }}
              </h3>
              <span class="timeline-day__weekday">{{ day.weekday }}</span>
            </div>
            <span class="timeline-day__count">{{ day.count }} 张卡片</span>
          </div>
          <div class="timeline-day__cards">
            <div
              v-for="card in day.cards"
              :key="card.id"
              class="timeline-card"
              :class="[`timeline-card--${card.type}`]"
              @click="handleCardClick(card)"
            >
              <div class="timeline-card__time">
                {{ formatTime(card.created) }}
              </div>
              <div class="timeline-card__content">
                {{ card.content || card.front }}
              </div>
              <div class="timeline-card__meta">
                <span
                  v-if="card.sourcePdf"
                  class="timeline-card__pdf"
                >
                  📄 {{ getPdfName(card.sourcePdf) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="allCards.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
        <p>暂无内容</p>
        <p class="empty-state-hint">
          创建的卡片将按时间顺序显示在这里
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../types/card'
import {
  computed,
  ref,
} from 'vue'

interface TimelineItem {
  label: string
  weekday?: string
  count: number
  cards: Card[]
  isToday?: boolean
}

interface Props {
  cards: Card[]
}

const props = withDefaults(defineProps<Props>(), {
  cards: () => [],
})

const emit = defineEmits<{
  (e: 'card-click', card: Card): void
}>()

const contentRef = ref<HTMLDivElement>()
const viewMode = ref<'month' | 'week' | 'day'>('month')
const currentDate = ref(new Date())

// 获取所有卡片（按创建时间排序）
const allCards = computed(() => {
  return [...props.cards].sort((a, b) => b.created - a.created)
})

// 月数据
const monthData = computed(() => {
  const months: TimelineItem[] = []
  const cardsByMonth = new Map<string, Card[]>()

  for (const card of allCards.value) {
    const date = new Date(card.created)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!cardsByMonth.has(monthKey)) {
      cardsByMonth.set(monthKey, [])
    }
    cardsByMonth.get(monthKey)!.push(card)
  }

  for (const [monthKey, cards] of cardsByMonth.entries()) {
    const [year, month] = monthKey.split('-').map(Number)
    months.push({
      label: `${year}年${month}月`,
      count: cards.length,
      cards: cards.sort((a, b) => b.created - a.created),
    })
  }

  return months.sort((a, b) => {
    return new Date(b.cards[0]?.created || 0).getTime() - new Date(a.cards[0]?.created || 0).getTime()
  })
})

// 周数据
const weekData = computed(() => {
  const weeks: TimelineItem[] = []
  const cardsByWeek = new Map<string, Card[]>()

  for (const card of allCards.value) {
    const date = new Date(card.created)
    const weekKey = getWeekKey(date)

    if (!cardsByWeek.has(weekKey)) {
      cardsByWeek.set(weekKey, [])
    }
    cardsByWeek.get(weekKey)!.push(card)
  }

  for (const [weekKey, cards] of cardsByWeek.entries()) {
    const [year, week] = weekKey.split('-W').map(Number)
    const weekStart = getWeekStart(year, week)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    weeks.push({
      label: `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`,
      count: cards.length,
      cards: cards.sort((a, b) => b.created - a.created),
    })
  }

  return weeks.sort((a, b) => {
    return new Date(b.cards[0]?.created || 0).getTime() - new Date(a.cards[0]?.created || 0).getTime()
  })
})

// 日数据
const dayData = computed(() => {
  const days: TimelineItem[] = []
  const cardsByDay = new Map<string, Card[]>()
  const today = new Date().toISOString().split('T')[0]

  for (const card of allCards.value) {
    const date = new Date(card.created)
    const dayKey = date.toISOString().split('T')[0]

    if (!cardsByDay.has(dayKey)) {
      cardsByDay.set(dayKey, [])
    }
    cardsByDay.get(dayKey)!.push(card)
  }

  for (const [dayKey, cards] of cardsByDay.entries()) {
    const date = new Date(dayKey)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]

    days.push({
      label: `${date.getMonth() + 1}月${date.getDate()}日`,
      weekday,
      count: cards.length,
      cards: cards.sort((a, b) => b.created - a.created),
      isToday: dayKey === today,
    })
  }

  return days.sort((a, b) => {
    return new Date(b.cards[0]?.created || 0).getTime() - new Date(a.cards[0]?.created || 0).getTime()
  })
})

// 周期标签
const periodLabel = computed(() => {
  const now = currentDate.value
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })
})

// 获取周标识
const getWeekKey = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// 获取周开始日期
const getWeekStart = (year: number, week: number): Date => {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayNum = jan4.getUTCDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setUTCDate(jan4.getUTCDate() - dayNum + 1 + (week - 1) * 7)
  return weekStart
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取 PDF 名称
const getPdfName = (pdfPath: string): string => {
  return pdfPath.split('/').pop() || pdfPath
}

// 上一个周期
const prevPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() - 1)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() - 7)
  } else {
    date.setDate(date.getDate() - 1)
  }
  currentDate.value = date
}

// 下一个周期
const nextPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() + 1)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() + 7)
  } else {
    date.setDate(date.getDate() + 1)
  }
  currentDate.value = date
}

// 回到今天
const goToToday = () => {
  currentDate.value = new Date()
}

// 卡片点击
const handleCardClick = (card: Card) => {
  emit('card-click', card)
}
</script>

<style scoped lang="scss">
.timeline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.timeline-toolbar {
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
  padding-right: 8px;
  margin-right: 8px;
  border-right: 1px solid var(--b3-border-color);

  &:last-child {
    border-right: none;
  }
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-info {
  display: flex;
  align-items: center;
  color: var(--b3-theme-on-surface);
  font-size: 14px;
}

.period-label {
  min-width: 120px;
  text-align: center;
  font-weight: 500;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
  }

  &-primary {
    background: var(--b3-theme-primary);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}

/* 内容区域 */
.timeline-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 月视图 */
.timeline-month-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.timeline-month {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--b3-border-color);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

/* 周视图 */
.timeline-week-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.timeline-week {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--b3-border-color);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

/* 日视图 */
.timeline-day-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-day {
  &--today {
    .timeline-day__header {
      background: var(--b3-theme-primary-light);
      border-radius: 8px;
      padding: 8px 12px;
    }

    .timeline-day__title {
      color: var(--b3-theme-primary);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__info {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__weekday {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 12px;
    border-left: 2px solid var(--b3-border-color);
  }
}

/* 卡片样式 */
.timeline-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

  &--flashcard {
    border-left: 3px solid var(--b3-theme-warning);
  }

  &--excerpt {
    border-left: 3px solid var(--b3-theme-primary);
  }

  &__date {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__time {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__content {
    font-size: 13px;
    color: var(--b3-theme-on-surface);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__pdf {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &__tags {
    display: flex;
    gap: 6px;
  }

  &__tag {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--b3-theme-background);
    border-radius: 4px;
    color: var(--b3-theme-primary);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
  padding: 40px;

  svg {
    margin-bottom: 16px;
  }

  p {
    margin: 8px 0;
  }

  &-hint {
    font-size: 12px;
    opacity: 0.7;
  }
}
</style>
