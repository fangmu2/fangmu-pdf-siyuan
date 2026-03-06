<!-- src/components/MemoryContext.vue -->
<template>
  <div class="memory-context">
    <!-- 工具栏 -->
    <div class="memory-toolbar">
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="[{ active: viewMode === 'timeline' }]"
          title="时间线视图"
          @click="viewMode = 'timeline'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
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
        <button
          class="toolbar-btn toolbar-btn-primary"
          title="记录当前场景"
          @click="captureCurrentContext"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
          </svg>
          <span>记录场景</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="memory-content">
      <!-- 时间线视图 -->
      <div
        v-if="viewMode === 'timeline'"
        class="memory-timeline"
      >
        <div
          v-for="memory in memories"
          :key="memory.id"
          class="memory-item"
          :class="[{ 'memory-item--selected': selectedMemory?.id === memory.id }]"
          @click="selectMemory(memory)"
        >
          <div class="memory-time">
            <div class="memory-time__date">
              {{ formatDate(memory.timestamp) }}
            </div>
            <div class="memory-time__clock">
              {{ formatTime(memory.timestamp) }}
            </div>
          </div>
          <div class="memory-connector"></div>
          <div class="memory-content-card">
            <div class="memory-header">
              <span
                class="memory-type"
                :class="`memory-type--${memory.type}`"
              >
                {{ getTypeLabel(memory.type) }}
              </span>
              <button
                class="memory-delete"
                @click.stop="deleteMemory(memory)"
              >
                ×
              </button>
            </div>
            <div class="memory-body">
              <div
                v-if="memory.title"
                class="memory-title"
              >
                {{ memory.title }}
              </div>
              <div
                v-if="memory.description"
                class="memory-description"
              >
                {{ memory.description }}
              </div>

              <!-- 上下文信息 -->
              <div
                v-if="memory.context"
                class="memory-context-info"
              >
                <div
                  v-if="memory.context.pdf"
                  class="context-row"
                >
                  <span class="context-icon">📄</span>
                  <span class="context-text">{{ memory.context.pdf }}</span>
                </div>
                <div
                  v-if="memory.context.page"
                  class="context-row"
                >
                  <span class="context-icon">📑</span>
                  <span class="context-text">第 {{ memory.context.page }} 页</span>
                </div>
                <div
                  v-if="memory.context.doc"
                  class="context-row"
                >
                  <span class="context-icon">📝</span>
                  <span class="context-text">{{ memory.context.doc }}</span>
                </div>
                <div
                  v-if="memory.context.selectedText"
                  class="context-row"
                >
                  <span class="context-icon">💬</span>
                  <span class="context-text">{{ memory.context.selectedText }}</span>
                </div>
              </div>

              <!-- 标签 -->
              <div
                v-if="memory.tags?.length"
                class="memory-tags"
              >
                <span
                  v-for="tag in memory.tags"
                  :key="tag"
                  class="memory-tag"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 网格视图 -->
      <div
        v-else-if="viewMode === 'grid'"
        class="memory-grid"
      >
        <div
          v-for="memory in memories"
          :key="memory.id"
          class="memory-grid-item"
          :class="[{ 'memory-grid-item--selected': selectedMemory?.id === memory.id }]"
          @click="selectMemory(memory)"
        >
          <div class="grid-item-header">
            <span
              class="grid-item-type"
              :class="`memory-type--${memory.type}`"
            >
              {{ getTypeLabel(memory.type) }}
            </span>
            <span class="grid-item-time">{{ formatDateTime(memory.timestamp) }}</span>
          </div>
          <div class="grid-item-body">
            <div
              v-if="memory.title"
              class="grid-item-title"
            >
              {{ memory.title }}
            </div>
            <div
              v-if="memory.description"
              class="grid-item-description"
            >
              {{ memory.description }}
            </div>
          </div>
          <div class="grid-item-footer">
            <span
              v-if="memory.context?.pdf"
              class="grid-item-pdf"
            >
              📄 {{ getPdfName(memory.context.pdf) }}
            </span>
            <span
              v-if="memory.tags?.length"
              class="grid-item-tags"
            >
              {{ memory.tags.length }} 个标签
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="memories.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
        </svg>
        <p>暂无场景记忆</p>
        <p class="empty-hint">
          点击右上角按钮记录当前场景
        </p>
      </div>
    </div>

    <!-- 侧边栏 - 场景详情 -->
    <div
      v-if="selectedMemory"
      class="memory-sidebar"
    >
      <div class="sidebar-header">
        <h3>场景详情</h3>
        <button
          class="sidebar-close"
          @click="closeSidebar"
        >
          ×
        </button>
      </div>
      <div class="sidebar-content">
        <!-- 回放按钮 -->
        <button
          class="replay-btn"
          @click="replayMemory"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>回放场景</span>
        </button>

        <!-- 详细信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">时间</span>
            <span class="detail-value">{{ formatDateTime(selectedMemory.timestamp) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">类型</span>
            <span class="detail-value">{{ getTypeLabel(selectedMemory.type) }}</span>
          </div>
          <div
            v-if="selectedMemory.title"
            class="detail-row"
          >
            <span class="detail-label">标题</span>
            <span class="detail-value">{{ selectedMemory.title }}</span>
          </div>
          <div
            v-if="selectedMemory.description"
            class="detail-row"
          >
            <span class="detail-label">描述</span>
            <span class="detail-value">{{ selectedMemory.description }}</span>
          </div>
        </div>

        <!-- 上下文信息 -->
        <div
          v-if="selectedMemory.context"
          class="detail-section"
        >
          <h4>上下文信息</h4>
          <div
            v-if="selectedMemory.context.pdf"
            class="detail-row"
          >
            <span class="detail-label">PDF 文件</span>
            <span class="detail-value">{{ selectedMemory.context.pdf }}</span>
          </div>
          <div
            v-if="selectedMemory.context.page"
            class="detail-row"
          >
            <span class="detail-label">页码</span>
            <span class="detail-value">第 {{ selectedMemory.context.page }} 页</span>
          </div>
          <div
            v-if="selectedMemory.context.doc"
            class="detail-row"
          >
            <span class="detail-label">文档</span>
            <span class="detail-value">{{ selectedMemory.context.doc }}</span>
          </div>
          <div
            v-if="selectedMemory.context.selectedText"
            class="detail-row"
          >
            <span class="detail-label">选中文字</span>
            <span class="detail-value">{{ selectedMemory.context.selectedText }}</span>
          </div>
        </div>

        <!-- 标签 -->
        <div
          v-if="selectedMemory.tags?.length"
          class="detail-section"
        >
          <h4>标签</h4>
          <div class="detail-tags">
            <span
              v-for="tag in selectedMemory.tags"
              :key="tag"
              class="detail-tag"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- 关联笔记 -->
        <div
          v-if="selectedMemory.relatedNotes?.length"
          class="detail-section"
        >
          <h4>关联笔记</h4>
          <div class="related-notes">
            <div
              v-for="note in selectedMemory.relatedNotes"
              :key="note.id"
              class="related-note"
              @click="handleNoteClick(note)"
            >
              <div class="related-note__title">
                {{ note.title }}
              </div>
              <div class="related-note__date">
                {{ formatDate(note.created) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 记录场景对话框 -->
    <div
      v-if="showCaptureDialog"
      class="dialog-overlay"
      @click.self="showCaptureDialog = false"
    >
      <div class="dialog">
        <div class="dialog-header">
          <h3>记录当前场景</h3>
          <button
            class="dialog-close"
            @click="showCaptureDialog = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">标题</label>
            <input
              v-model="newMemory.title"
              type="text"
              placeholder="输入场景标题..."
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="newMemory.description"
              placeholder="描述当前场景..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">标签（用逗号分隔）</label>
            <input
              v-model="newMemory.tagsInput"
              type="text"
              placeholder="例如：学习，重要，复习"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">类型</label>
            <select
              v-model="newMemory.type"
              class="form-select"
            >
              <option value="note">
                笔记
              </option>
              <option value="highlight">
                摘录
              </option>
              <option value="thought">
                想法
              </option>
              <option value="question">
                问题
              </option>
              <option value="review">
                复习
              </option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            class="btn-cancel"
            @click="showCaptureDialog = false"
          >
            取消
          </button>
          <button
            class="btn-confirm"
            @click="confirmCapture"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../types/card'
import {
  onMounted,
  ref,
} from 'vue'

interface MemoryContext {
  pdf?: string
  page?: number
  doc?: string
  selectedText?: string
}

interface Memory {
  id: string
  timestamp: number
  type: 'note' | 'highlight' | 'thought' | 'question' | 'review'
  title?: string
  description?: string
  context?: MemoryContext
  tags?: string[]
  relatedNotes?: { id: string, title: string, created: number }[]
}

interface Props {
  cards: Card[]
  currentPdf?: string
  currentPage?: number
  currentDoc?: string
}

const props = withDefaults(defineProps<Props>(), {
  cards: () => [],
  currentPdf: '',
  currentPage: 0,
  currentDoc: '',
})

const emit = defineEmits<{
  (e: 'memory-select', memory: Memory): void
  (e: 'memory-replay', memory: Memory): void
  (e: 'note-click', note: { id: string, title: string }): void
}>()

// 状态
const viewMode = ref<'timeline' | 'grid'>('timeline')
const memories = ref<Memory[]>([])
const selectedMemory = ref<Memory | null>(null)
const showCaptureDialog = ref(false)
const newMemory = ref<{
  title: string
  description: string
  tagsInput: string
  type: 'note' | 'highlight' | 'thought' | 'question' | 'review'
}>({
  title: '',
  description: '',
  tagsInput: '',
  type: 'note',
})

// 类型标签
const typeLabels: Record<string, string> = {
  note: '笔记',
  highlight: '摘录',
  thought: '想法',
  question: '问题',
  review: '复习',
}

// 获取类型标签
const getTypeLabel = (type: string): string => {
  return typeLabels[type] || type
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化日期时间
const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取 PDF 名称
const getPdfName = (pdfPath: string): string => {
  return pdfPath.split('/').pop() || pdfPath
}

// 选择场景
const selectMemory = (memory: Memory) => {
  selectedMemory.value = memory
  emit('memory-select', memory)
}

// 关闭侧边栏
const closeSidebar = () => {
  selectedMemory.value = null
}

// 删除场景
const deleteMemory = (memory: Memory) => {
  const index = memories.value.findIndex((m) => m.id === memory.id)
  if (index > -1) {
    memories.value.splice(index, 1)
  }
  if (selectedMemory.value?.id === memory.id) {
    selectedMemory.value = null
  }
  saveMemories()
}

// 回放场景
const replayMemory = () => {
  if (!selectedMemory.value) return
  emit('memory-replay', selectedMemory.value)

  // 如果有上下文信息，尝试恢复
  const memory = selectedMemory.value
  if (memory.context?.pdf) {
    console.log('回放 PDF:', memory.context.pdf)
  }
  if (memory.context?.selectedText) {
    console.log('回放选中文字:', memory.context.selectedText)
  }
}

// 处理笔记点击
const handleNoteClick = (note: { id: string, title: string }) => {
  emit('note-click', note)
}

// 捕获当前场景
const captureCurrentContext = () => {
  newMemory.value = {
    title: '',
    description: '',
    tagsInput: '',
    type: 'note',
  }
  showCaptureDialog.value = true
}

// 确认捕获
const confirmCapture = () => {
  const tags = newMemory.value.tagsInput
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter((t) => t)

  const memory: Memory = {
    id: `memory-${Date.now()}`,
    timestamp: Date.now(),
    type: newMemory.value.type,
    title: newMemory.value.title || undefined,
    description: newMemory.value.description || undefined,
    tags: tags.length > 0 ? tags : undefined,
    context: {
      pdf: props.currentPdf || undefined,
      page: props.currentPage || undefined,
      doc: props.currentDoc || undefined,
    },
    relatedNotes: [],
  }

  memories.value.unshift(memory)
  saveMemories()
  showCaptureDialog.value = false
}

// 保存场景记忆
const saveMemories = () => {
  localStorage.setItem('memory-contexts', JSON.stringify(memories.value))
}

// 加载场景记忆
const loadMemories = () => {
  const saved = localStorage.getItem('memory-contexts')
  if (saved) {
    memories.value = JSON.parse(saved)
  }
}

// 从卡片加载相关记忆
watch(() => props.cards, () => {
  // 当卡片变化时，可以为最近的卡片创建关联记忆
  if (props.cards.length > 0) {
    const latestCard = props.cards[0]
    if (latestCard && memories.value.length > 0) {
      const latestMemory = memories.value[0]
      // 如果是最近创建的，关联起来
      if (Date.now() - latestMemory.timestamp < 60000) {
        latestMemory.relatedNotes = [{
          id: latestCard.id,
          title: `${(latestCard.content || latestCard.front || '').slice(0, 30)}...`,
          created: latestCard.created,
        }]
        saveMemories()
      }
    }
  }
}, { deep: true })

onMounted(() => {
  loadMemories()
})
</script>

<style scoped lang="scss">
.memory-context {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.memory-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar-spacer {
  flex: 1;
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

  &-primary {
    display: inline-flex;
    gap: 6px;
    width: auto;
    padding: 6px 12px;
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}

/* 内容区 */
.memory-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 时间线视图 */
.memory-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-item {
  display: flex;
  gap: 16px;
  cursor: pointer;

  &--selected {
    .memory-content-card {
      border-color: var(--b3-theme-primary);
      box-shadow: 0 0 0 3px var(--b3-theme-primary-light);
    }
  }
}

.memory-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  min-width: 100px;

  &__date {
    font-size: 12px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__clock {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }
}

.memory-connector {
  width: 2px;
  background: var(--b3-border-color);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--b3-theme-primary);
  }
}

.memory-content-card {
  flex: 1;
  padding: 14px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.memory-type {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;

  &--note { background: rgba(66, 165, 245, 0.15); color: #42a5f5; }
  &--highlight { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
  &--thought { background: rgba(156, 39, 176, 0.15); color: #ab47bc; }
  &--question { background: rgba(244, 67, 54, 0.15); color: #f44336; }
  &--review { background: rgba(102, 187, 106, 0.15); color: #66bb6a; }
}

.memory-delete {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-background);
    color: var(--b3-theme-error);
  }
}

.memory-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.memory-description {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.5;
}

.memory-context-info {
  padding: 10px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-top: 8px;
}

.context-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.context-icon {
  font-size: 14px;
}

.context-text {
  flex: 1;
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.memory-tag {
  padding: 3px 8px;
  background: var(--b3-theme-background);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-primary);
}

/* 网格视图 */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.memory-grid-item {
  padding: 14px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  cursor: pointer;
  transition: all 0.15s ease;

  &--selected {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 3px var(--b3-theme-primary-light);
  }

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.grid-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.grid-item-type {
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.grid-item-time {
  font-size: 11px;
  color: var(--b3-theme-color-light);
}

.grid-item-body {
  margin-bottom: 12px;
}

.grid-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin-bottom: 6px;
}

.grid-item-description {
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grid-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--b3-theme-color-light);
}

.grid-item-pdf {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 侧边栏 */
.memory-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
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

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
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

.replay-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--b3-theme-primary);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 20px;

  &:hover {
    opacity: 0.9;
  }
}

.detail-section {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--b3-theme-color-light);
    text-transform: uppercase;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-label {
  color: var(--b3-theme-color-light);
  font-weight: 500;
}

.detail-value {
  color: var(--b3-theme-on-surface);
  text-align: right;
  max-width: 60%;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag {
  padding: 4px 10px;
  background: var(--b3-theme-background);
  border-radius: 4px;
  font-size: 12px;
  color: var(--b3-theme-primary);
}

.related-notes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-note {
  padding: 10px;
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

/* 对话框 */
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
  z-index: 100;
}

.dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--b3-theme-color);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.form-textarea {
  resize: vertical;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;

  &:hover {
    opacity: 0.9;
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
