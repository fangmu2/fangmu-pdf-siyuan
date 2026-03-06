<template>
  <div class="card-box-board-view">
    <!-- 工具栏 -->
    <div class="board-toolbar">
      <div class="toolbar-left">
        <SyButton
          v-for="type in columnTypes"
          :key="type.value"
          :type="currentColumnType === type.value ? 'primary' : 'text'"
          size="small"
          @click="currentColumnType = type.value"
        >
          {{ type.label }}
        </SyButton>
      </div>

      <div class="toolbar-right">
        <SyButton
          icon="filter"
          @click="showFilterPanel = true"
        >
          筛选
        </SyButton>
        <SyButton
          icon="sort"
          @click="showSortMenu = !showSortMenu"
        >
          排序
        </SyButton>
        <SyButton
          icon="star"
          @click="showFilterPresets = true"
        >
          预设
        </SyButton>
      </div>
    </div>

    <!-- 排序菜单 -->
    <div
      v-if="showSortMenu"
      class="sort-menu-dropdown"
    >
      <div class="sort-options">
        <div
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-option"
          :class="{ active: currentSort.field === option.value }"
          @click="selectSort(option.value)"
        >
          <span>{{ option.label }}</span>
          <span
            v-if="currentSort.field === option.value"
            class="sort-order"
          >
            {{ currentSort.order === 'asc' ? '↑' : '↓' }}
          </span>
        </div>
      </div>
      <div
        class="sort-order-toggle"
        @click="toggleSortOrder"
      >
        切换顺序：{{ currentSort.order === 'asc' ? '升序' : '降序' }}
      </div>
    </div>

    <!-- 看板视图 -->
    <div class="board-container">
      <div class="board-columns">
        <div
          v-for="column in board.columns"
          :key="column.id"
          class="board-column"
          :style="{ borderTopColor: column.color }"
        >
          <!-- 列头 -->
          <div
            class="column-header"
            @click="column.collapsed = !column.collapsed"
          >
            <div
              class="column-title"
              :style="{ color: column.color }"
            >
              <span
                class="column-color-dot"
                :style="{ backgroundColor: column.color }"
              ></span>
              {{ column.title }}
            </div>
            <div class="column-actions">
              <span class="card-count">{{ column.cards.length }}</span>
              <button class="collapse-btn">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                  :style="{ transform: column.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 列内容 -->
          <div
            v-show="!column.collapsed"
            class="column-content"
          >
            <div class="card-list">
              <div
                v-for="card in column.cards"
                :key="card.id"
                class="card-item"
                @click="selectCard(card)"
                @dblclick="editCard(card)"
              >
                <div class="card-content">
                  <div class="card-text">
                    {{ card.content.slice(0, 100) }}{{ card.content.length > 100 ? '...' : '' }}
                  </div>
                  <div class="card-meta">
                    <span
                      v-if="card.tags?.length"
                      class="card-tag"
                    >{{ card.tags[0] }}</span>
                    <span
                      class="card-status"
                      :class="card.status"
                    >{{ formatStatus(card.status) }}</span>
                    <span
                      class="card-difficulty"
                      :class="`diff-${card.difficulty}`"
                    >
                      {{ '★'.repeat(card.difficulty) }}{{ '☆'.repeat(5 - card.difficulty) }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <button
                    class="delete-btn"
                    title="删除"
                    @click.stop="deleteCard(card)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div
      v-if="showFilterPanel"
      class="dialog-overlay"
      @click.self="showFilterPanel = false"
    >
      <div class="dialog filter-panel">
        <div class="dialog-header">
          <h3>筛选卡片</h3>
          <button
            class="close-btn"
            @click="showFilterPanel = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <!-- 状态筛选 -->
          <div class="filter-section">
            <label class="filter-label">状态</label>
            <div class="filter-checkboxes">
              <label
                v-for="status in allStatuses"
                :key="status.value"
                class="checkbox-label"
              >
                <input
                  v-model="filterOptions.statuses"
                  type="checkbox"
                  :value="status.value"
                />
                <span
                  class="status-dot"
                  :style="{ backgroundColor: status.color }"
                ></span>
                {{ status.label }}
              </label>
            </div>
          </div>

          <!-- 难度筛选 -->
          <div class="filter-section">
            <label class="filter-label">难度</label>
            <div class="filter-checkboxes">
              <label
                v-for="diff in difficulties"
                :key="diff.value"
                class="checkbox-label"
              >
                <input
                  v-model="filterOptions.difficulties"
                  type="checkbox"
                  :value="diff.value"
                />
                {{ diff.label }}
              </label>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-section">
            <label class="filter-label">标签</label>
            <div class="tag-filter">
              <SyInput
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
            <SyInput
              v-model="filterOptions.searchQuery"
              placeholder="搜索卡片内容..."
              prefix-icon="search"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <SyButton @click="resetFilters">
            重置
          </SyButton>
          <SyButton
            icon="star"
            @click="saveAsPreset"
          >
            保存为预设
          </SyButton>
          <SyButton
            type="primary"
            @click="applyFilters"
          >
            应用
          </SyButton>
        </div>
      </div>
    </div>

    <!-- 筛选预设列表 -->
    <div
      v-if="showFilterPresets"
      class="dialog-overlay"
      @click.self="showFilterPresets = false"
    >
      <div class="dialog filter-presets-dialog">
        <div class="dialog-header">
          <h3>筛选预设</h3>
          <button
            class="close-btn"
            @click="showFilterPresets = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div
            v-if="presets.length === 0"
            class="empty-state"
          >
            <p>暂无保存的筛选预设</p>
          </div>
          <div
            v-else
            class="preset-list"
          >
            <div
              v-for="preset in presets"
              :key="preset.id"
              class="preset-item"
              @click="loadPreset(preset)"
            >
              <div class="preset-info">
                <span class="preset-name">{{ preset.name }}</span>
                <span class="preset-date">{{ formatDate(preset.updatedAt) }}</span>
              </div>
              <button
                class="delete-preset-btn"
                @click.stop="deletePreset(preset.id)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存预设对话框 -->
    <div
      v-if="showSavePreset"
      class="dialog-overlay"
      @click.self="showSavePreset = false"
    >
      <div class="dialog save-preset-dialog">
        <div class="dialog-header">
          <h3>保存为预设</h3>
          <button
            class="close-btn"
            @click="showSavePreset = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <SyInput
            v-model="presetName"
            placeholder="输入预设名称..."
            autofocus
          />
        </div>
        <div class="dialog-footer">
          <SyButton @click="showSavePreset = false">
            取消
          </SyButton>
          <SyButton
            type="primary"
            @click="confirmSavePreset"
          >
            保存
          </SyButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BoardColumnType,
  FilterOptions,
  FilterPreset,
  SortOptions,
} from '../services/cardBoxService'
import type { Card } from '../types/card'
import {
  computed,
  ref,
} from 'vue'
import {

  cardBoxService,



} from '../services/cardBoxService'
import SyButton from './SiyuanTheme/SyButton.vue'
import SyInput from './SiyuanTheme/SyInput.vue'

const props = defineProps<{
  cards: Card[]
  studySetId?: string
}>()

const emit = defineEmits<{
  (e: 'select', card: Card): void
  (e: 'edit', card: Card): void
  (e: 'delete', card: Card): void
  (e: 'update'): void
}>()

// 列类型选项
const columnTypes = [
  {
    value: 'status' as BoardColumnType,
    label: '按状态',
  },
  {
    value: 'tag' as BoardColumnType,
    label: '按标签',
  },
  {
    value: 'difficulty' as BoardColumnType,
    label: '按难度',
  },
]

// 排序选项
const sortOptions = [
  {
    value: 'created',
    label: '创建时间',
  },
  {
    value: 'updated',
    label: '更新时间',
  },
  {
    value: 'difficulty',
    label: '难度',
  },
  {
    value: 'status',
    label: '状态',
  },
  {
    value: 'nextReview',
    label: '复习时间',
  },
  {
    value: 'title',
    label: '标题',
  },
]

// 状态选项
const allStatuses = [
  {
    value: 'new',
    label: '新学',
    color: '#4CAF50',
  },
  {
    value: 'learning',
    label: '学习中',
    color: '#2196F3',
  },
  {
    value: 'review',
    label: '待复习',
    color: '#FF9800',
  },
  {
    value: 'suspended',
    label: '已暂停',
    color: '#9E9E9E',
  },
]

// 难度选项
const difficulties = [
  {
    value: 1,
    label: '非常简单',
  },
  {
    value: 2,
    label: '简单',
  },
  {
    value: 3,
    label: '中等',
  },
  {
    value: 4,
    label: '困难',
  },
  {
    value: 5,
    label: '非常困难',
  },
]

// 响应式数据
const currentColumnType = ref<BoardColumnType>('status')
const currentSort = ref<SortOptions>({
  field: 'created',
  order: 'desc',
})
const showSortMenu = ref(false)
const showFilterPanel = ref(false)
const showFilterPresets = ref(false)
const showSavePreset = ref(false)
const presetName = ref('')
const tagSearchQuery = ref('')
const presets = ref<FilterPreset[]>([])

// 筛选选项
const filterOptions = ref<FilterOptions>({
  statuses: [],
  tags: [],
  difficulties: [],
  searchQuery: '',
})

// 看板数据
const board = computed(() => {
  // 应用筛选
  let filteredCards = cardBoxService.applyFilters(props.cards, filterOptions.value)

  // 应用排序
  filteredCards = cardBoxService.applySort(filteredCards, currentSort.value)

  // 生成看板
  return cardBoxService.generateBoard(filteredCards, currentColumnType.value)
})

// 获取所有标签
const allTags = computed(() => {
  return cardBoxService.getAllTags(props.cards)
})

// 过滤标签
const filteredTags = computed(() => {
  if (!tagSearchQuery.value) return allTags.value
  return allTags.value.filter((tag) =>
    tag.tag.toLowerCase().includes(tagSearchQuery.value.toLowerCase()),
  )
})

// 格式化状态
const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    new: '新学',
    learning: '学习中',
    review: '待复习',
    suspended: '已暂停',
  }
  return map[status] || status
}

// 格式化日期
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 选择排序
const selectSort = (field: string) => {
  currentSort.value.field = field
}

// 切换排序顺序
const toggleSortOrder = () => {
  currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
}

// 选择卡片
const selectCard = (card: Card) => {
  emit('select', card)
}

// 编辑卡片
const editCard = (card: Card) => {
  emit('edit', card)
}

// 删除卡片
const deleteCard = (card: Card) => {
  if (confirm('确定要删除这张卡片吗？')) {
    emit('delete', card)
  }
}

// 切换标签选择
const toggleTag = (tag: string) => {
  if (!filterOptions.value.tags) {
    filterOptions.value.tags = []
  }
  const index = filterOptions.value.tags.indexOf(tag)
  if (index > -1) {
    filterOptions.value.tags.splice(index, 1)
  } else {
    filterOptions.value.tags.push(tag)
  }
}

// 应用筛选
const applyFilters = () => {
  showFilterPanel.value = false
  emit('update')
}

// 重置筛选
const resetFilters = () => {
  filterOptions.value = {
    statuses: [],
    tags: [],
    difficulties: [],
    searchQuery: '',
  }
  tagSearchQuery.value = ''
}

// 保存为预设
const saveAsPreset = () => {
  showSavePreset.value = true
}

// 确认保存预设
const confirmSavePreset = async () => {
  if (!presetName.value) return

  const preset: FilterPreset = {
    id: `preset-${Date.now()}`,
    name: presetName.value,
    filters: { ...filterOptions.value },
    sort: { ...currentSort.value },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await cardBoxService.saveFilterPreset(preset)
  await loadPresets()
  showSavePreset.value = false
  presetName.value = ''
}

// 加载预设
const loadPresets = async () => {
  presets.value = await cardBoxService.loadFilterPresets()
}

// 加载预设
const loadPreset = (preset: FilterPreset) => {
  filterOptions.value = { ...preset.filters }
  if (preset.sort) {
    currentSort.value = { ...preset.sort }
  }
  showFilterPresets.value = false
  emit('update')
}

// 删除预设
const deletePreset = async (presetId: string) => {
  if (confirm('确定要删除这个预设吗？')) {
    await cardBoxService.deleteFilterPreset(presetId)
    await loadPresets()
  }
}

// 初始化
loadPresets()
</script>

<style scoped lang="scss">
.card-box-board-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// 工具栏
.board-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  position: relative;
}

// 排序菜单
.sort-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  box-shadow: var(--b3-point-shadow);
  z-index: 100;
  min-width: 150px;
  margin-top: 4px;
}

.sort-options {
  padding: 8px;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.active {
    background: var(--b3-theme-primary-light, rgba(0, 123, 255, 0.1));
    color: var(--b3-theme-primary);
  }
}

.sort-order-toggle {
  padding: 8px 12px;
  border-top: 1px solid var(--b3-border-color);
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

// 看板容器
.board-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16px;
}

.board-columns {
  display: flex;
  gap: 16px;
  height: 100%;
}

// 看板列
.board-column {
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 350px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border-top: 3px solid;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--b3-border-color);
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.column-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-count {
  padding: 2px 8px;
  background: var(--b3-theme-surface-hover);
  border-radius: 12px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--b3-theme-on-surface-light);
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

// 卡片列表
.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
    transform: translateY(-2px);
    box-shadow: var(--b3-point-shadow);
  }
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
  width: 24px;
  height: 24px;
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
  max-width: 500px;
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

// 筛选预设
.filter-presets-dialog {
  max-width: 400px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-name {
  font-weight: 500;
}

.preset-date {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.delete-preset-btn {
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

// 保存预设
.save-preset-dialog {
  max-width: 400px;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
}
</style>
