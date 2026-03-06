<!-- src/components/KeywordLibrary.vue -->
<template>
  <div class="keyword-library">
    <!-- 工具栏 -->
    <div class="keyword-toolbar">
      <div class="toolbar-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索关键词..."
          class="toolbar-search"
        />
      </div>

      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'list' }]"
          title="列表视图"
          @click="viewMode = 'list'"
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
          class="toolbar-btn"
          :class="[{ active: viewMode === 'cloud' }]"
          title="词云视图"
          @click="viewMode = 'cloud'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'grid' }]"
          title="网格视图"
          @click="viewMode = 'grid'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4zm0 6h4v-4h-4v4zm6 0h4v-4h-4v4zm0 6h4v-4h-4v4zm0-6h4v-4h-4v4z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <select
          v-model="colorFilter"
          class="toolbar-select"
        >
          <option value="">
            所有颜色
          </option>
          <option value="red">
            红色
          </option>
          <option value="orange">
            橙色
          </option>
          <option value="yellow">
            黄色
          </option>
          <option value="green">
            绿色
          </option>
          <option value="blue">
            蓝色
          </option>
          <option value="purple">
            紫色
          </option>
        </select>
      </div>
    </div>

    <!-- 关键词内容 -->
    <div class="keyword-content">
      <!-- 列表视图 -->
      <div
        v-if="viewMode === 'list'"
        class="keyword-list"
      >
        <div
          v-for="group in groupedKeywords"
          :key="group.letter"
          class="keyword-group"
        >
          <div class="keyword-group__header">
            <span class="keyword-group__letter">{{ group.letter }}</span>
            <span class="keyword-group__count">{{ group.keywords.length }} 个关键词</span>
          </div>
          <div class="keyword-group__items">
            <div
              v-for="keyword in group.keywords"
              :key="keyword.id"
              class="keyword-item"
              :class="[`keyword-item--${keyword.color}`]"
              @click="handleKeywordClick(keyword)"
            >
              <div class="keyword-item__header">
                <span class="keyword-item__name">{{ keyword.name }}</span>
                <span
                  class="keyword-item__color-dot"
                  :style="{ backgroundColor: getColorValue(keyword.color) }"
                ></span>
              </div>
              <div class="keyword-item__meta">
                <span class="keyword-item__count">{{ keyword.count }} 篇笔记</span>
                <span class="keyword-item__date">{{ formatDate(keyword.lastUsed) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 词云视图 -->
      <div
        v-else-if="viewMode === 'cloud'"
        class="keyword-cloud"
      >
        <div class="cloud-container">
          <span
            v-for="keyword in keywords"
            :key="keyword.id"
            class="cloud-word"
            :class="[`cloud-word--${keyword.color}`]"
            :style="{ fontSize: `${getFontSize(keyword.count)}px` }"
            @click="handleKeywordClick(keyword)"
          >
            {{ keyword.name }}
          </span>
        </div>
      </div>

      <!-- 网格视图 -->
      <div
        v-else-if="viewMode === 'grid'"
        class="keyword-grid"
      >
        <div
          v-for="keyword in filteredKeywords"
          :key="keyword.id"
          class="keyword-card"
          :class="[`keyword-card--${keyword.color}`]"
          @click="handleKeywordClick(keyword)"
        >
          <div class="keyword-card__header">
            <span
              class="keyword-card__dot"
              :style="{ backgroundColor: getColorValue(keyword.color) }"
            ></span>
            <span class="keyword-card__name">{{ keyword.name }}</span>
          </div>
          <div class="keyword-card__count">
            {{ keyword.count }} 篇笔记
          </div>
          <div class="keyword-card__date">
            最后使用：{{ formatDate(keyword.lastUsed) }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredKeywords.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <p>暂无关键词</p>
        <p class="empty-hint">
          关键词将从您的笔记中自动提取
        </p>
      </div>
    </div>

    <!-- 侧边栏 - 关键词详情 -->
    <div
      v-if="selectedKeyword"
      class="keyword-sidebar"
    >
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span
            class="sidebar-color-dot"
            :style="{ backgroundColor: getColorValue(selectedKeyword.color) }"
          ></span>
          <h3>{{ selectedKeyword.name }}</h3>
        </div>
        <button
          class="sidebar-close"
          @click="closeSidebar"
        >
          ×
        </button>
      </div>
      <div class="sidebar-content">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-value">{{ selectedKeyword.count }}</span>
            <span class="stat-label">篇笔记</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatDate(selectedKeyword.firstUsed) }}</span>
            <span class="stat-label">首次使用</span>
          </div>
        </div>

        <div class="related-notes">
          <h4>相关笔记</h4>
          <div class="notes-list">
            <div
              v-for="note in selectedKeyword.notes"
              :key="note.id"
              class="note-item"
              @click="handleNoteClick(note)"
            >
              <div class="note-item__title">
                {{ note.title }}
              </div>
              <div class="note-item__date">
                {{ formatDate(note.created) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../types/card'
import {
  computed,
  ref,
  watch,
} from 'vue'

interface Keyword {
  id: string
  name: string
  color: string
  count: number
  firstUsed: number
  lastUsed: number
  notes: { id: string, title: string, created: number }[]
}

interface KeywordGroup {
  letter: string
  keywords: Keyword[]
}

interface Props {
  cards: Card[]
}

const props = withDefaults(defineProps<Props>(), {
  cards: () => [],
})

const emit = defineEmits<{
  (e: 'keyword-select', keyword: Keyword): void
  (e: 'note-click', note: { id: string, title: string }): void
}>()

// 状态
const viewMode = ref<'list' | 'cloud' | 'grid'>('list')
const searchQuery = ref('')
const colorFilter = ref('')
const selectedKeyword = ref<Keyword | null>(null)
const keywords = ref<Keyword[]>([])

// 颜色值映射
const colorValues: Record<string, string> = {
  red: '#ef5350',
  orange: '#ff9800',
  yellow: '#ffeb3b',
  green: '#66bb6a',
  blue: '#42a5f5',
  purple: '#ab47bc',
}

// 获取颜色值
const getColorValue = (color: string): string => {
  return colorValues[color] || colorValues.blue
}

// 从卡片提取关键词
const extractKeywords = (): Keyword[] => {
  const keywordMap = new Map<string, Keyword>()
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

  props.cards.forEach((card) => {
    const content = card.content || card.front || ''
    const tags = card.tags || []

    // 从标签提取
    tags.forEach((tag) => {
      if (!keywordMap.has(tag)) {
        const colorIndex = tag.length % colors.length
        keywordMap.set(tag, {
          id: `tag-${tag}`,
          name: tag,
          color: colors[colorIndex],
          count: 0,
          firstUsed: card.created,
          lastUsed: card.updated,
          notes: [],
        })
      }

      const keyword = keywordMap.get(tag)!
      keyword.count++
      keyword.lastUsed = Math.max(keyword.lastUsed, card.updated)
      keyword.firstUsed = Math.min(keyword.firstUsed, card.created)
      keyword.notes.push({
        id: card.id,
        title: `${(card.content || card.front || '').slice(0, 30)}...`,
        created: card.created,
      })
    })

    // 从内容提取关键词（简单实现：2-4 字中文词组）
    const matches = content.match(/[\u4E00-\u9FA5]{2,4}/g)
    if (matches) {
      // 限制提取数量
      matches.slice(0, 10).forEach((match) => {
        if (!keywordMap.has(match)) {
          const colorIndex = match.length % colors.length
          keywordMap.set(match, {
            id: `kw-${match}`,
            name: match,
            color: colors[colorIndex],
            count: 0,
            firstUsed: card.created,
            lastUsed: card.updated,
            notes: [],
          })
        }

        const keyword = keywordMap.get(match)!
        keyword.count++
        keyword.lastUsed = Math.max(keyword.lastUsed, card.updated)
        keyword.firstUsed = Math.min(keyword.firstUsed, card.created)
        keyword.notes.push({
          id: card.id,
          title: `${(card.content || card.front || '').slice(0, 30)}...`,
          created: card.created,
        })
      })
    }
  })

  return Array.from(keywordMap.values()).sort((a, b) => b.count - a.count)
}

// 按字母分组
const groupedKeywords = computed((): KeywordGroup[] => {
  const groups: Map<string, Keyword[]> = new Map()

  filteredKeywords.value.forEach((keyword) => {
    const letter = keyword.name[0].toUpperCase()
    const key = letter.match(/[A-Z]/) ? letter : '#'

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(keyword)
  })

  return Array.from(groups.entries())
    .map(([letter, keywords]) => ({
      letter,
      keywords: keywords.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter))
})

// 过滤后的关键词
const filteredKeywords = computed(() => {
  let result = keywords.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((k) => k.name.toLowerCase().includes(query))
  }

  // 颜色过滤
  if (colorFilter.value) {
    result = result.filter((k) => k.color === colorFilter.value)
  }

  return result
})

// 获取字体大小（词云用）
const getFontSize = (count: number): number => {
  const maxCount = Math.max(...keywords.value.map((k) => k.count), 1)
  const minSize = 14
  const maxSize = 36
  const ratio = count / maxCount
  return minSize + (maxSize - minSize) * ratio
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 处理关键词点击
const handleKeywordClick = (keyword: Keyword) => {
  selectedKeyword.value = keyword
  emit('keyword-select', keyword)
}

// 处理笔记点击
const handleNoteClick = (note: { id: string, title: string }) => {
  emit('note-click', note)
}

// 关闭侧边栏
const closeSidebar = () => {
  selectedKeyword.value = null
}

// 监听数据变化
watch(() => props.cards, () => {
  keywords.value = extractKeywords()
}, {
  immediate: true,
  deep: true,
})
</script>

<style scoped lang="scss">
.keyword-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.keyword-toolbar {
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

.toolbar-search {
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  width: 200px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.toolbar-select {
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;

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

/* 内容区 */
.keyword-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 列表视图 */
.keyword-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.keyword-group {
  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--b3-border-color);
  }

  &__letter {
    font-size: 18px;
    font-weight: 700;
    color: var(--b3-theme-primary);
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.keyword-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border-left: 3px solid var(--b3-theme-border);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--red { border-left-color: #ef5350; }
  &--orange { border-left-color: #ff9800; }
  &--yellow { border-left-color: #ffeb3b; }
  &--green { border-left-color: #66bb6a; }
  &--blue { border-left-color: #42a5f5; }
  &--purple { border-left-color: #ab47bc; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  &__meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }
}

/* 词云视图 */
.keyword-cloud {
  height: 100%;
}

.cloud-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.cloud-word {
  padding: 6px 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &--red { background: rgba(239, 83, 80, 0.15); color: #ef5350; }
  &--orange { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
  &--yellow { background: rgba(255, 235, 59, 0.15); color: #f57f17; }
  &--green { background: rgba(102, 187, 106, 0.15); color: #66bb6a; }
  &--blue { background: rgba(66, 165, 245, 0.15); color: #42a5f5; }
  &--purple { background: rgba(171, 71, 188, 0.15); color: #ab47bc; }
}

/* 网格视图 */
.keyword-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.keyword-card {
  padding: 14px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--red { border-top: 3px solid #ef5350; }
  &--orange { border-top: 3px solid #ff9800; }
  &--yellow { border-top: 3px solid #ffeb3b; }
  &--green { border-top: 3px solid #66bb6a; }
  &--blue { border-top: 3px solid #42a5f5; }
  &--purple { border-top: 3px solid #ab47bc; }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    margin-bottom: 4px;
  }

  &__date {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }
}

/* 侧边栏 */
.keyword-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
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
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }
}

.sidebar-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
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

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;

  & .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--b3-theme-primary);
  }

  & .stat-label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    margin-top: 4px;
  }
}

.related-notes h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color-light);
  text-transform: uppercase;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item {
  padding: 10px 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-primary-light);
  }

  &__title {
    font-size: 13px;
    color: var(--b3-theme-on-surface);
    line-height: 1.4;
  }

  &__date {
    font-size: 11px;
    color: var(--b3-theme-color-light);
    margin-top: 4px;
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
