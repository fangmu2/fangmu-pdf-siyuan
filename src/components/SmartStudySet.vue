<!-- src/components/SmartStudySet.vue - 智能学习集组件 -->
<template>
  <div class="smart-study-set">
    <!-- 智能学习集列表 -->
    <div class="smart-study-set__list">
      <div class="smart-study-set__header">
        <h3 class="smart-study-set__title">
          📚 智能学习集
        </h3>
        <button
          class="smart-study-set__add-btn"
          title="创建智能学习集"
          @click="showCreateDialog = true"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>

      <div
        v-if="smartSets.length === 0"
        class="smart-study-set__empty"
      >
        <span class="smart-study-set__empty-icon">💡</span>
        <p class="smart-study-set__empty-text">
          暂无智能学习集
        </p>
        <p class="smart-study-set__empty-hint">
          创建基于筛选条件的智能学习集
        </p>
      </div>

      <div
        v-for="set in smartSets"
        :key="set.id"
        class="smart-study-set__item"
        :class="[{ active: selectedSetId === set.id }]"
        @click="selectSmartSet(set)"
      >
        <div class="smart-study-set__item-info">
          <span class="smart-study-set__item-name">{{ set.name }}</span>
          <span class="smart-study-set__item-count">{{ set.cardCount || 0 }} 张卡片</span>
        </div>
        <div class="smart-study-set__item-actions">
          <button
            class="smart-study-set__item-btn"
            title="编辑"
            @click.stop="editSmartSet(set)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
          <button
            class="smart-study-set__item-btn"
            title="删除"
            @click.stop="deleteSmartSet(set)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选条件预览 -->
    <div
      v-if="selectedSet"
      class="smart-study-set__preview"
    >
      <div class="smart-study-set__preview-header">
        <h4 class="smart-study-set__preview-title">
          筛选条件
        </h4>
        <button
          class="smart-study-set__refresh-btn"
          title="刷新"
          @click="refreshPreview"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </div>

      <div class="smart-study-set__conditions">
        <div
          v-if="selectedSet.filters.status?.length"
          class="condition-item"
        >
          <span class="condition-item__label">状态：</span>
          <span class="condition-item__value">
            <span
              v-for="status in selectedSet.filters.status"
              :key="status"
              class="condition-tag"
              :class="[`condition-tag--${status}`]"
            >
              {{ getStatusLabel(status) }}
            </span>
          </span>
        </div>

        <div
          v-if="selectedSet.filters.tags?.length"
          class="condition-item"
        >
          <span class="condition-item__label">标签：</span>
          <span class="condition-item__value">
            <span
              v-for="tag in selectedSet.filters.tags"
              :key="tag"
              class="condition-tag"
            >
              {{ tag }}
            </span>
          </span>
        </div>

        <div
          v-if="selectedSet.filters.difficultyMin"
          class="condition-item"
        >
          <span class="condition-item__label">难度：</span>
          <span class="condition-item__value">
            ≥ {{ selectedSet.filters.difficultyMin }} 星
          </span>
        </div>

        <div
          v-if="selectedSet.filters.sourceDocId"
          class="condition-item"
        >
          <span class="condition-item__label">来源：</span>
          <span class="condition-item__value">
            {{ getSourceName(selectedSet.filters.sourceDocId) }}
          </span>
        </div>

        <div class="condition-item condition-item--sort">
          <span class="condition-item__label">排序：</span>
          <span class="condition-item__value">
            {{ getSortLabel(selectedSet.sortBy) }} {{ selectedSet.sortOrder === 'asc' ? '↑' : '↓' }}
          </span>
        </div>
      </div>

      <div class="smart-study-set__preview-actions">
        <button
          class="apply-filters-btn"
          @click="applyFilters"
        >
          应用筛选条件
        </button>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <div
      v-if="showCreateDialog"
      class="dialog-overlay"
      @click="closeDialog"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog__header">
          <h3 class="dialog__title">
            {{ editingSet ? '编辑智能学习集' : '创建智能学习集' }}
          </h3>
          <button
            class="dialog__close"
            @click="closeDialog"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div class="dialog__content">
          <div class="form-item">
            <label class="form-item__label">名称</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="例如：待复习卡片、重点难点..."
            />
          </div>

          <div class="form-item">
            <label class="form-item__label">描述（可选）</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="描述这个智能学习集的用途..."
            ></textarea>
          </div>

          <div class="form-section">
            <label class="form-section__title">筛选条件</label>

            <div class="form-item">
              <label class="form-item__label">状态</label>
              <div class="checkbox-group">
                <label
                  v-for="status in statusOptions"
                  :key="status.value"
                  class="checkbox-item"
                >
                  <input
                    v-model="formData.filters.status"
                    type="checkbox"
                    :value="status.value"
                  />
                  <span>{{ status.label }}</span>
                </label>
              </div>
            </div>

            <div class="form-item">
              <label class="form-item__label">标签</label>
              <select
                v-model="formData.filters.tags"
                multiple
                class="form-select"
              >
                <option
                  v-for="tag in allTags"
                  :key="tag"
                  :value="tag"
                >
                  {{ tag }}
                </option>
              </select>
              <span class="form-item__hint">按住 Ctrl/Cmd 多选</span>
            </div>

            <div class="form-item">
              <label class="form-item__label">最小难度</label>
              <div class="range-input">
                <input
                  v-model.number="formData.filters.difficultyMin"
                  type="range"
                  min="1"
                  max="5"
                  class="form-range"
                />
                <span class="range-value">{{ formData.filters.difficultyMin }} 星</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-section__title">排序设置</label>

            <div class="form-item form-item--inline">
              <label class="form-item__label">排序方式</label>
              <select
                v-model="formData.sortBy"
                class="form-select form-select--inline"
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

              <label class="form-item__label form-item__label--margin">顺序</label>
              <select
                v-model="formData.sortOrder"
                class="form-select form-select--inline"
              >
                <option value="asc">
                  升序 ↑
                </option>
                <option value="desc">
                  降序 ↓
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="dialog__footer">
          <button
            class="btn btn--secondary"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            class="btn btn--primary"
            @click="saveSmartSet"
          >
            {{ editingSet ? '保存' : '创建' }}
          </button>
        </div>
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

// 智能学习集接口
interface SmartStudySetItem {
  id: string
  name: string
  description?: string
  filters: {
    status?: string[]
    tags?: string[]
    difficultyMin?: number
    sourceDocId?: string
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
  cardCount?: number
}

const emit = defineEmits<{
  (e: 'apply-filters', filters: SmartStudySetItem['filters'], sort: { by: string, order: string }): void
}>()

const cardStore = useCardStore()

// 状态
const smartSets = ref<SmartStudySetItem[]>([])
const selectedSetId = ref<string>('')
const showCreateDialog = ref(false)
const editingSet = ref<SmartStudySetItem | null>(null)

// 表单数据
const formData = ref<SmartStudySetItem>({
  id: '',
  name: '',
  description: '',
  filters: {
    status: [],
    tags: [],
    difficultyMin: 1,
  },
  sortBy: 'updated',
  sortOrder: 'desc',
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

// 计算属性
const selectedSet = computed(() =>
  smartSets.value.find((s) => s.id === selectedSetId.value),
)

const allTags = computed(() => {
  const tagSet = new Set<string>()
  cardStore.cards.forEach((card) => {
    card.tags?.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

// 方法
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: '新卡片',
    learning: '学习中',
    review: '复习中',
    suspended: '已暂停',
  }
  return labels[status] || status
}

function getSortLabel(sortBy: string): string {
  const labels: Record<string, string> = {
    created: '创建时间',
    updated: '更新时间',
    nextReview: '下次复习',
    difficulty: '难度',
    alphabetical: '字母顺序',
  }
  return labels[sortBy] || sortBy
}

function getSourceName(docId: string): string {
  // TODO: 从文档列表中获取名称
  return '文档'
}

function selectSmartSet(set: SmartStudySetItem) {
  selectedSetId.value = set.id
}

function editSmartSet(set: SmartStudySetItem) {
  editingSet.value = set
  formData.value = { ...set }
  showCreateDialog.value = true
}

function deleteSmartSet(set: SmartStudySetItem) {
  if (confirm(`确定要删除智能学习集"${set.name}"吗？`)) {
    smartSets.value = smartSets.value.filter((s) => s.id !== set.id)
    if (selectedSetId.value === set.id) {
      selectedSetId.value = ''
    }
    saveToStorage()
  }
}

function refreshPreview() {
  if (selectedSet.value) {
    const cards = filterCards(selectedSet.value.filters)
    selectedSet.value.cardCount = cards.length
  }
}

function filterCards(filters: SmartStudySetItem['filters']): Card[] {
  let result = [...cardStore.cards]

  if (filters.status?.length) {
    result = result.filter((c) => filters.status!.includes(c.status))
  }
  if (filters.tags?.length) {
    result = result.filter((c) =>
      c.tags?.some((tag) => filters.tags!.includes(tag)),
    )
  }
  if (filters.difficultyMin && filters.difficultyMin > 1) {
    result = result.filter((c) => c.difficulty >= filters.difficultyMin)
  }
  if (filters.sourceDocId) {
    result = result.filter((c) => c.sourceId === filters.sourceDocId)
  }

  return result
}

function applyFilters() {
  if (selectedSet.value) {
    emit('apply-filters', selectedSet.value.filters, {
      by: selectedSet.value.sortBy,
      order: selectedSet.value.sortOrder,
    })
  }
}

function saveSmartSet() {
  if (!formData.value.name.trim()) {
    alert('请输入名称')
    return
  }

  if (editingSet.value) {
    // 编辑模式
    const index = smartSets.value.findIndex((s) => s.id === editingSet.value!.id)
    if (index !== -1) {
      smartSets.value[index] = {
        ...formData.value,
        id: editingSet.value.id,
      }
    }
  } else {
    // 创建模式
    const newSet: SmartStudySetItem = {
      ...formData.value,
      id: `smart_${Date.now()}`,
    }
    smartSets.value.push(newSet)
    selectedSetId.value = newSet.id
  }

  saveToStorage()
  closeDialog()
}

function saveToStorage() {
  localStorage.setItem('smart-study-sets', JSON.stringify(smartSets.value))
}

function loadFromStorage() {
  const stored = localStorage.getItem('smart-study-sets')
  if (stored) {
    try {
      smartSets.value = JSON.parse(stored)
    } catch (e) {
      console.error('加载智能学习集失败:', e)
    }
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingSet.value = null
  formData.value = {
    id: '',
    name: '',
    description: '',
    filters: {
      status: [],
      tags: [],
      difficultyMin: 1,
    },
    sortBy: 'updated',
    sortOrder: 'desc',
  }
}

// 生命周期
onMounted(() => {
  loadFromStorage()
  if (cardStore.cards.length === 0) {
    cardStore.fetchCards()
  }
})
</script>

<style scoped lang="scss">
.smart-study-set {
  display: flex;
  gap: 16px;
  height: 100%;
  padding: 16px;
  background: var(--b3-theme-background);

  &__list {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: white;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;

    &-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    &-text {
      font-size: 14px;
      color: var(--b3-theme-color);
      margin: 0 0 4px;
    }

    &-hint {
      font-size: 12px;
      color: var(--b3-theme-color-light);
    }
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--b3-theme-surface);
    border-radius: 8px;
    margin-bottom: 8px;
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

    &-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    &-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--b3-theme-color);
    }

    &-count {
      font-size: 11px;
      color: var(--b3-theme-color-light);
    }

    &-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover &-actions {
      opacity: 1;
    }

    &-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid var(--b3-theme-divider);
      border-radius: 4px;
      background: var(--b3-theme-background);
      color: var(--b3-theme-color);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--b3-theme-primary);
        border-color: var(--b3-theme-primary);
        color: white;
      }
    }
  }

  &__preview {
    flex: 1;
    background: var(--b3-theme-surface);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  &__preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__preview-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: white;
    }
  }

  &__conditions {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__preview-actions {
    margin-top: auto;
    padding-top: 16px;
  }
}

.condition-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
    flex-shrink: 0;
  }

  &__value {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  &--sort {
    margin-top: auto;
    background: var(--b3-theme-primary-light);
  }
}

.condition-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);

  &--new { background: var(--b3-theme-primary-light); color: var(--b3-theme-primary); }
  &--learning { background: var(--b3-theme-warning-light); color: var(--b3-theme-warning); }
  &--review { background: var(--b3-theme-success-light); color: var(--b3-theme-success); }
  &--suspended { background: var(--b3-theme-background); color: var(--b3-theme-color-light); }
}

.apply-filters-btn {
  width: 100%;
  padding: 12px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}

/* 对话框样式 */
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
  width: 500px;
  max-height: 80vh;
  background: var(--b3-theme-surface);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-theme-divider);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-background);
    }
  }

  &__content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-theme-divider);
  }
}

.form-item {
  margin-bottom: 16px;

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-color);
    margin-bottom: 8px;
  }

  &__hint {
    display: block;
    font-size: 11px;
    color: var(--b3-theme-color-light);
    margin-top: 4px;
  }

  &--inline {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__label--margin {
    margin-left: 12px;
  }
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-select {
  cursor: pointer;

  &--inline {
    width: auto;
    min-width: 120px;
  }
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--b3-theme-color);
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.range-input {
  display: flex;
  align-items: center;
  gap: 12px;

  .form-range {
    flex: 1;
    cursor: pointer;
  }

  .range-value {
    font-size: 13px;
    color: var(--b3-theme-color);
    min-width: 50px;
  }
}

.form-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--b3-theme-divider);

  &:last-child {
    border-bottom: none;
  }

  &__title {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--b3-theme-color-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &--secondary {
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    border: 1px solid var(--b3-theme-divider);

    &:hover {
      background: var(--b3-theme-divider);
    }
  }

  &--primary {
    background: var(--b3-theme-primary);
    color: white;
    border: none;

    &:hover {
      background: var(--b3-theme-primary-dark);
    }
  }
}
</style>
