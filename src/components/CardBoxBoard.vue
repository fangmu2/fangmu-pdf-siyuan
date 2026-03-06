<!-- src/components/CardBoxBoard.vue - 卡片盒看板视图 -->
<template>
  <div class="card-box-board">
    <!-- 工具栏 -->
    <div class="card-box-board__toolbar">
      <!-- 视图切换 -->
      <div class="view-switcher">
        <button
          class="view-btn"
          :class="[{ active: currentView === 'board' }]"
          title="看板视图"
          @click="currentView = 'board'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
        </button>
        <button
          class="view-btn"
          :class="[{ active: currentView === 'list' }]"
          title="列表视图"
          @click="currentView = 'list'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
          </svg>
        </button>
        <button
          class="view-btn"
          :class="[{ active: currentView === 'timeline' }]"
          title="时间线视图"
          @click="currentView = 'timeline'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.68 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </button>
      </div>

      <!-- 分组方式 -->
      <div
        v-if="currentView === 'board'"
        class="group-selector"
      >
        <span class="group-selector__label">分组：</span>
        <select
          v-model="groupBy"
          class="group-select"
        >
          <option value="tag">
            按标签
          </option>
          <option value="status">
            按状态
          </option>
          <option value="difficulty">
            按难度
          </option>
          <option value="source">
            按来源
          </option>
        </select>
      </div>

      <!-- 排序方式 -->
      <div class="sort-selector">
        <span class="sort-selector__label">排序：</span>
        <select
          v-model="sortBy"
          class="sort-select"
        >
          <option value="created">
            创建时间
          </option>
          <option value="updated">
            更新时间
          </option>
          <option value="nextReview">
            下次复习
          </option>
          <option value="difficulty">
            难度
          </option>
          <option value="alphabetical">
            字母顺序
          </option>
        </select>
        <button
          class="sort-order-btn"
          :class="[{ reverse: sortOrder === 'desc' }]"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
        >
          <svg
            v-if="sortOrder === 'asc'"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
          </svg>
        </button>
      </div>

      <!-- 筛选器 -->
      <div class="filter-section">
        <button
          class="filter-btn"
          @click="showFilterPanel = !showFilterPanel"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
          筛选
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索卡片..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 筛选面板 -->
    <transition name="slide-down">
      <div
        v-if="showFilterPanel"
        class="filter-panel"
      >
        <div class="filter-panel__section">
          <span class="filter-panel__label">状态</span>
          <div class="filter-options">
            <label
              v-for="status in statusOptions"
              :key="status.value"
              class="filter-option"
            >
              <input
                v-model="filters.status"
                type="checkbox"
                :value="status.value"
              />
              <span class="filter-option__label">{{ status.label }}</span>
            </label>
          </div>
        </div>
        <div class="filter-panel__section">
          <span class="filter-panel__label">难度</span>
          <div class="difficulty-filter">
            <input
              v-model.number="filters.difficultyMin"
              type="range"
              min="1"
              max="5"
              class="difficulty-range"
            />
            <span class="difficulty-value">≥ {{ filters.difficultyMin }}</span>
          </div>
        </div>
        <div class="filter-panel__section">
          <span class="filter-panel__label">标签</span>
          <div class="tag-filter">
            <select
              v-model="filters.tags"
              multiple
              class="tag-select"
            >
              <option
                v-for="tag in allTags"
                :key="tag"
                :value="tag"
              >
                {{ tag }}
              </option>
            </select>
          </div>
        </div>
        <div class="filter-panel__actions">
          <button
            class="clear-filters-btn"
            @click="clearFilters"
          >
            清除筛选
          </button>
        </div>
      </div>
    </transition>

    <!-- 看板视图 -->
    <div
      v-if="currentView === 'board' && groupedCards.length > 0"
      class="board-view"
    >
      <div
        v-for="group in groupedCards"
        :key="group.key"
        class="board-column"
      >
        <div class="board-column__header">
          <span class="board-column__title">{{ group.title }}</span>
          <span class="board-column__count">{{ group.cards.length }}</span>
        </div>
        <div class="board-column__content">
          <div
            v-for="card in group.cards"
            :key="card.id"
            class="card-item"
            :class="[`card-item--${card.status}`]"
            @click="handleCardClick(card)"
          >
            <div class="card-item__title">
              {{ card.title || '无标题' }}
            </div>
            <div
              v-if="card.content"
              class="card-item__content"
            >
              {{ truncateText(card.content, 50) }}
            </div>
            <div class="card-item__meta">
              <span
                v-if="card.tags.length > 0"
                class="card-item__tags"
              >
                <span
                  v-for="tag in card.tags.slice(0, 3)"
                  :key="tag"
                  class="card-item__tag"
                >
                  {{ tag }}
                </span>
              </span>
              <div class="card-item__info">
                <span
                  class="card-item__difficulty"
                  :class="`difficulty-${card.difficulty}`"
                >
                  {{ '★'.repeat(card.difficulty) }}{{ '☆'.repeat(5 - card.difficulty) }}
                </span>
                <span
                  v-if="card.nextReview"
                  class="card-item__review"
                >
                  {{ formatNextReview(card.nextReview) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div
      v-else-if="currentView === 'list'"
      class="list-view"
    >
      <table class="card-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>内容</th>
            <th>状态</th>
            <th>标签</th>
            <th>难度</th>
            <th>下次复习</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="card in filteredAndSortedCards"
            :key="card.id"
            class="card-table__row"
            @click="handleCardClick(card)"
          >
            <td class="card-table__cell">
              {{ card.title || '无标题' }}
            </td>
            <td class="card-table__cell card-table__cell--content">
              {{ truncateText(card.content, 30) }}
            </td>
            <td class="card-table__cell">
              <span
                class="status-badge"
                :class="[`status-${card.status}`]"
              >
                {{ getStatusLabel(card.status) }}
              </span>
            </td>
            <td class="card-table__cell">
              <span
                v-for="tag in card.tags.slice(0, 3)"
                :key="tag"
                class="table-tag"
              >
                {{ tag }}
              </span>
            </td>
            <td class="card-table__cell">
              <span :class="`difficulty-${card.difficulty}`">
                {{ '★'.repeat(card.difficulty) }}
              </span>
            </td>
            <td class="card-table__cell">
              {{ formatNextReview(card.nextReview) }}
            </td>
            <td class="card-table__cell">
              {{ formatTime(card.updatedAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 时间线视图 -->
    <div
      v-else-if="currentView === 'timeline'"
      class="timeline-view"
    >
      <div
        v-for="(group, date) in timelineGroups"
        :key="date"
        class="timeline-group"
      >
        <div class="timeline-group__header">
          <span class="timeline-group__date">{{ formatDateGroup(date) }}</span>
          <span class="timeline-group__count">{{ group.length }} 张卡片</span>
        </div>
        <div class="timeline-group__content">
          <div
            v-for="card in group"
            :key="card.id"
            class="timeline-item"
            :class="[`timeline-item--${card.status}`]"
            @click="handleCardClick(card)"
          >
            <div class="timeline-item__marker"></div>
            <div class="timeline-item__content">
              <div class="timeline-item__title">
                {{ card.title || '无标题' }}
              </div>
              <div class="timeline-item__meta">
                <span class="timeline-item__time">{{ formatTime(card.createdAt) }}</span>
                <span
                  v-if="card.tags.length > 0"
                  class="timeline-item__tags"
                >
                  <span
                    v-for="tag in card.tags.slice(0, 3)"
                    :key="tag"
                    class="timeline-item__tag"
                  >
                    {{ tag }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="empty-state"
    >
      <div class="empty-state__icon">
        📭
      </div>
      <div class="empty-state__title">
        暂无卡片
      </div>
      <div class="empty-state__desc">
        {{ searchQuery ? '没有找到匹配的卡片' : '开始创建你的第一张卡片吧' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../types/card'
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useCardStore } from '../stores/cardStore'

interface Props {
  studySetId?: string
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: undefined,
})

const emit = defineEmits<{
  (e: 'card-click', card: Card): void
}>()

const cardStore = useCardStore()

// 视图状态
const currentView = ref<'board' | 'list' | 'timeline'>('board')
const showFilterPanel = ref(false)

// 分组和排序
const groupBy = ref<'tag' | 'status' | 'difficulty' | 'source'>('status')
const sortBy = ref<'created' | 'updated' | 'nextReview' | 'difficulty' | 'alphabetical'>('updated')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 搜索和筛选
const searchQuery = ref('')
const filters = ref({
  status: [] as string[],
  tags: [] as string[],
  difficultyMin: 1,
})

// 状态选项
const statusOptions = [
  {
    value: 'new',
    label: '新卡片',
  },
  {
    value: 'learning',
    label: '学习中',
  },
  {
    value: 'review',
    label: '复习中',
  },
  {
    value: 'suspended',
    label: '已暂停',
  },
]

// 计算属性：所有标签
const allTags = computed(() => {
  const tagSet = new Set<string>()
  cards.value.forEach((card) => {
    card.tags?.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

// 计算属性：卡片列表
const cards = computed(() => {
  let result = props.studySetId
    ? cardStore.cards.filter((c) => c.studySetId === props.studySetId)
    : cardStore.cards

  // 应用筛选
  if (filters.value.status.length > 0) {
    result = result.filter((c) => filters.value.status.includes(c.status))
  }
  if (filters.value.tags.length > 0) {
    result = result.filter((c) =>
      c.tags?.some((tag) => filters.value.tags.includes(tag)),
    )
  }
  if (filters.value.difficultyMin > 1) {
    result = result.filter((c) => c.difficulty >= filters.value.difficultyMin)
  }

  // 应用搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((c) =>
      c.title?.toLowerCase().includes(query)
      || c.content?.toLowerCase().includes(query),
    )
  }

  // 应用排序
  result = [...result].sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'created':
        comparison = (a.createdAt || 0) - (b.createdAt || 0)
        break
      case 'updated':
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0)
        break
      case 'nextReview':
        comparison = (a.nextReview || 0) - (b.nextReview || 0)
        break
      case 'difficulty':
        comparison = (a.difficulty || 0) - (b.difficulty || 0)
        break
      case 'alphabetical':
        comparison = (a.title || '').localeCompare(b.title || '')
        break
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

// 计算属性：筛选和排序后的卡片
const filteredAndSortedCards = computed(() => cards.value)

// 计算属性：分组卡片（看板视图）
const groupedCards = computed(() => {
  const groups: Map<string, Card[]> = new Map()

  cards.value.forEach((card) => {
    let key: string
    let title: string

    switch (groupBy.value) {
      case 'tag':
        key = card.tags?.[0] || '无标签'
        title = key
        break
      case 'status':
        key = card.status
        title = getStatusLabel(card.status)
        break
      case 'difficulty':
        key = String(card.difficulty)
        title = `难度 ${card.difficulty}`
        break
      case 'source':
        key = card.sourceId || 'unknown'
        title = '来源'
        break
      default:
        key = 'other'
        title = '其他'
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(card)
  })

  return Array.from(groups.entries()).map(([key, cards]) => ({
    key,
    title,
    cards,
  }))
})

// 计算属性：时间线分组
const timelineGroups = computed(() => {
  const groups: Map<string, Card[]> = new Map()

  cards.value.forEach((card) => {
    const date = new Date(card.createdAt || Date.now()).toISOString().split('T')[0]
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(card)
  })

  // 按日期排序
  return new Map(
    Array.from(groups.entries()).sort((a, b) =>
      sortOrder.value === 'asc'
        ? a[0].localeCompare(b[0])
        : b[0].localeCompare(a[0]),
    ),
  )
})

// 方法
function truncateText(text: string, length: number): string {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: '新卡片',
    learning: '学习中',
    review: '复习中',
    suspended: '已暂停',
  }
  return labels[status] || status
}

function formatNextReview(timestamp?: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return '已到期'
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  if (days <= 7) return `${days}天后`
  return date.toLocaleDateString('zh-CN')
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

function formatDateGroup(date: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (date === today) return '今天'
  if (date === yesterday) return '昨天'

  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return d.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  })
}

function clearFilters() {
  filters.value = {
    status: [],
    tags: [],
    difficultyMin: 1,
  }
  searchQuery.value = ''
}

function handleCardClick(card: Card) {
  emit('card-click', card)
}

// 生命周期
onMounted(async () => {
  if (cardStore.cards.length === 0) {
    await cardStore.fetchCards()
  }
})
</script>

<style scoped lang="scss">
.card-box-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--b3-theme-divider);
    flex-wrap: wrap;
  }
}

.view-switcher {
  display: flex;
  gap: 4px;

  .view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary-light);
      border-color: var(--b3-theme-primary);
    }

    &.active {
      background: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: white;
    }
  }
}

.group-selector,
.sort-selector {
  display: flex;
  align-items: center;
  gap: 8px;

  &__label {
    font-size: 13px;
    color: var(--b3-theme-color-light);
  }

  .group-select,
  .sort-select {
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--b3-theme-divider);
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
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.reverse {
    transform: rotate(180deg);
  }
}

.filter-section {
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary-light);
      border-color: var(--b3-theme-primary);
    }
  }
}

.search-box {
  margin-left: auto;

  .search-input {
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 13px;
    width: 200px;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
      width: 250px;
    }
  }
}

.filter-panel {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-theme-divider);

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
    text-transform: uppercase;
  }

  &__actions {
    margin-left: auto;
  }
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  &__label {
    font-size: 13px;
    color: var(--b3-theme-color);
  }
}

.difficulty-filter {
  display: flex;
  align-items: center;
  gap: 12px;

  .difficulty-range {
    width: 120px;
    cursor: pointer;
  }

  .difficulty-value {
    font-size: 13px;
    color: var(--b3-theme-color);
    min-width: 30px;
  }
}

.tag-select {
  min-height: 80px;
  padding: 8px;
  border: 1px solid var(--b3-theme-divider);
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

.clear-filters-btn {
  height: 30px;
  padding: 0 16px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-error-light);
    border-color: var(--b3-theme-error);
    color: var(--b3-theme-error);
  }
}

.board-view {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  height: 100%;
}

.board-column {
  min-width: 280px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  max-height: 100%;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--b3-theme-divider);
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    background: var(--b3-theme-background);
    padding: 2px 8px;
    border-radius: 10px;
  }

  &__content {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.card-item {
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
    margin-bottom: 8px;
  }

  &__content {
    font-size: 13px;
    color: var(--b3-theme-color-light);
    margin-bottom: 8px;
    line-height: 1.5;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__tag {
    font-size: 11px;
    color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
    padding: 2px 6px;
    border-radius: 4px;
  }

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__difficulty {
    font-size: 12px;
    color: var(--b3-theme-warning);

    &.difficulty-1 { color: #9e9e9e; }
    &.difficulty-2 { color: #ff9800; }
    &.difficulty-3 { color: #ffc107; }
    &.difficulty-4 { color: #ff9800; }
    &.difficulty-5 { color: #f44336; }
  }

  &__review {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }

  &--new { border-left: 3px solid var(--b3-theme-primary); }
  &--learning { border-left: 3px solid var(--b3-theme-warning); }
  &--review { border-left: 3px solid var(--b3-theme-success); }
  &--suspended { border-left: 3px solid var(--b3-theme-color-light); }
}

.list-view {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.card-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
    border-bottom: 2px solid var(--b3-theme-divider);
    white-space: nowrap;
  }

  tbody tr {
    border-bottom: 1px solid var(--b3-theme-divider);
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--b3-theme-primary-light);
    }
  }

  &__cell {
    padding: 12px 16px;
    font-size: 13px;
    color: var(--b3-theme-color);

    &--content {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;

  &.status-new { background: var(--b3-theme-primary-light); color: var(--b3-theme-primary); }
  &.status-learning { background: var(--b3-theme-warning-light); color: var(--b3-theme-warning); }
  &.status-review { background: var(--b3-theme-success-light); color: var(--b3-theme-success); }
  &.status-suspended { background: var(--b3-theme-background); color: var(--b3-theme-color-light); }
}

.table-tag {
  display: inline-block;
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 4px;
}

.timeline-view {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.timeline-group {
  margin-bottom: 24px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--b3-theme-divider);
  }

  &__date {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: var(--b3-theme-primary-light);
  }

  &__marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--b3-theme-primary);
    flex-shrink: 0;
    margin-top: 4px;
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-color);
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__time {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__tags {
    display: flex;
    gap: 4px;
  }

  &__tag {
    font-size: 11px;
    color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
    padding: 2px 6px;
    border-radius: 4px;
  }

  &--new { &__marker { background: var(--b3-theme-primary); } }
  &--learning { &__marker { background: var(--b3-theme-warning); } }
  &--review { &__marker { background: var(--b3-theme-success); } }
  &--suspended { &__marker { background: var(--b3-theme-color-light); } }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;

  &__icon {
    font-size: 64px;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    color: var(--b3-theme-color);
  }

  &__desc {
    font-size: 14px;
    color: var(--b3-theme-color-light);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
