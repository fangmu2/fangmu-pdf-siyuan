<template>
  <div class="card-batch-operations">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <SyCheckbox
          v-model="selectAll"
          @change="handleSelectAllChange"
        >
          全选
        </SyCheckbox>
        <span
          v-if="selectedCards.length > 0"
          class="selected-count"
        >
          已选择 {{ selectedCards.length }} 张卡片
        </span>
      </div>

      <div class="toolbar-right">
        <SyButton
          v-if="selectedCards.length > 0"
          icon="star"
          @click="showDifficultyDialog = true"
        >
          设置难度
        </SyButton>

        <SyButton
          v-if="selectedCards.length > 0"
          icon="sync"
          @click="showStatusMenu = true"
        >
          转换状态
        </SyButton>

        <SyButton
          v-if="selectedCards.length > 0"
          icon="tag"
          @click="showTagManager = true"
        >
          管理标签
        </SyButton>

        <SyButton
          v-if="selectedCards.length > 0"
          icon="folder"
          @click="showMoveDialog = true"
        >
          移动
        </SyButton>

        <SyButton
          v-if="selectedCards.length > 0"
          icon="trash"
          danger
          @click="handleBatchDelete"
        >
          删除
        </SyButton>
      </div>
    </div>

    <!-- 难度设置对话框 -->
    <div
      v-if="showDifficultyDialog"
      class="dialog-overlay"
      @click.self="showDifficultyDialog = false"
    >
      <div class="dialog difficulty-dialog">
        <div class="dialog-header">
          <h3>设置卡片难度</h3>
          <button
            class="close-btn"
            @click="showDifficultyDialog = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="difficulty-options">
            <div
              v-for="config in difficultyOptions"
              :key="config.level"
              class="difficulty-option"
              :class="{ selected: selectedDifficulty === config.level }"
              @click="selectedDifficulty = config.level"
            >
              <div class="difficulty-indicator">
                <span
                  class="difficulty-dot"
                  :style="{ backgroundColor: config.color }"
                ></span>
                <span class="difficulty-label">{{ config.label }}</span>
              </div>
              <span class="difficulty-desc">{{ config.description }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <SyButton @click="showDifficultyDialog = false">
            取消
          </SyButton>
          <SyButton
            type="primary"
            :disabled="!selectedDifficulty"
            @click="handleBatchSetDifficulty"
          >
            确认设置
          </SyButton>
        </div>
      </div>
    </div>

    <!-- 状态转换菜单 -->
    <div
      v-if="showStatusMenu"
      class="dialog-overlay"
      @click.self="showStatusMenu = false"
    >
      <div class="dialog status-dialog">
        <div class="dialog-header">
          <h3>转换卡片状态</h3>
          <button
            class="close-btn"
            @click="showStatusMenu = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="status-info">
            <p>当前选中的卡片将转换为以下状态：</p>
          </div>
          <div class="status-options">
            <div
              v-for="status in statusOptions"
              :key="status.value"
              class="status-option"
              :class="{ selected: selectedStatus === status.value }"
              @click="selectedStatus = status.value"
            >
              <span class="status-icon">{{ status.icon }}</span>
              <span class="status-label">{{ status.label }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <SyButton @click="showStatusMenu = false">
            取消
          </SyButton>
          <SyButton
            type="primary"
            :disabled="!selectedStatus"
            @click="handleBatchSetStatus"
          >
            确认转换
          </SyButton>
        </div>
      </div>
    </div>

    <!-- 标签管理器 -->
    <div
      v-if="showTagManager"
      class="dialog-overlay"
      @click.self="showTagManager = false"
    >
      <div class="dialog tag-dialog">
        <div class="dialog-header">
          <h3>管理标签</h3>
          <button
            class="close-btn"
            @click="showTagManager = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="tag-input-section">
            <SyInput
              v-model="newTagInput"
              placeholder="输入标签，多个标签用逗号分隔"
              @keyup.enter="addTag"
            />
            <SyButton
              type="primary"
              @click="addTag"
            >
              添加
            </SyButton>
          </div>

          <div class="current-tags">
            <h4>当前标签</h4>
            <div class="tag-list">
              <span
                v-for="tag in currentTags"
                :key="tag"
                class="tag-chip"
              >
                {{ tag }}
                <button
                  class="remove-tag"
                  @click="removeTag(tag)"
                >×</button>
              </span>
              <span
                v-if="currentTags.length === 0"
                class="empty-tip"
              >暂无标签</span>
            </div>
          </div>

          <div class="common-tags">
            <h4>常用标签</h4>
            <div class="tag-list">
              <span
                v-for="tag in commonTags"
                :key="tag.name"
                class="tag-chip common"
                @click="addTagByName(tag.name)"
              >
                {{ tag.name }}
                <span class="tag-count">{{ tag.count }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <SyButton @click="showTagManager = false">
            取消
          </SyButton>
          <SyButton
            type="primary"
            @click="handleBatchAddTags"
          >
            批量添加
          </SyButton>
        </div>
      </div>
    </div>

    <!-- 移动对话框 -->
    <div
      v-if="showMoveDialog"
      class="dialog-overlay"
      @click.self="showMoveDialog = false"
    >
      <div class="dialog move-dialog">
        <div class="dialog-header">
          <h3>移动卡片到学习集</h3>
          <button
            class="close-btn"
            @click="showMoveDialog = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <SySelect
            v-model="selectedStudySetId"
            placeholder="选择目标学习集"
            :options="studySetOptions"
          />
        </div>
        <div class="dialog-footer">
          <SyButton @click="showMoveDialog = false">
            取消
          </SyButton>
          <SyButton
            type="primary"
            :disabled="!selectedStudySetId"
            @click="handleBatchMove"
          >
            确认移动
          </SyButton>
        </div>
      </div>
    </div>

    <!-- 操作结果提示 -->
    <div
      v-if="operationResult"
      class="operation-result"
    >
      <div class="result-content">
        <span class="result-icon">{{ operationResult.success === operationResult.total ? '✓' : '⚠' }}</span>
        <div class="result-info">
          <div class="result-title">
            {{ operationResult.success === operationResult.total ? '操作成功' : '部分成功' }}
          </div>
          <div class="result-detail">
            成功 {{ operationResult.success }} / 失败 {{ operationResult.failed }}
          </div>
        </div>
        <button
          class="close-result"
          @click="operationResult = null"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BatchOperationResult } from '../services/cardEnhanceService'
import {
  computed,
  ref,
} from 'vue'
import {

  cardEnhanceService,
  DIFFICULTY_CONFIG,
} from '../services/cardEnhanceService'
import { studySetService } from '../services/studySetService'
import SyButton from './SiyuanTheme/SyButton.vue'
import SyCheckbox from './SiyuanTheme/SyCheckbox.vue'
import SyInput from './SiyuanTheme/SyInput.vue'
import SySelect from './SiyuanTheme/SySelect.vue'

interface Card {
  id: string
  content: string
  studySetId: string
  tags: string[]
  status: string
  difficulty: number
}

interface StudySet {
  id: string
  name: string
}

const props = defineProps<{
  cards: Card[]
  studySetId?: string
}>()

const emit = defineEmits<{
  (e: 'update', cards: Card[]): void
  (e: 'select', cardIds: string[]): void
}>()

// 选择状态
const selectAll = ref(false)
const selectedCards = ref<string[]>([])

// 难度对话框
const showDifficultyDialog = ref(false)
const selectedDifficulty = ref<number | null>(null)

// 状态对话框
const showStatusMenu = ref(false)
const selectedStatus = ref<string | null>(null)

// 标签对话框
const showTagManager = ref(false)
const newTagInput = ref('')
const currentTags = ref<string[]>([])

// 移动对话框
const showMoveDialog = ref(false)
const selectedStudySetId = ref<string>('')

// 操作结果
const operationResult = ref<BatchOperationResult | null>(null)

// 难度选项
const difficultyOptions = computed(() => {
  return Object.entries(DIFFICULTY_CONFIG).map(([level, config]) => ({
    level: Number.parseInt(level),
    ...config,
  }))
})

// 状态选项
const statusOptions = [
  {
    value: 'new',
    label: '新学',
    icon: '🆕',
  },
  {
    value: 'learning',
    label: '学习中',
    icon: '📚',
  },
  {
    value: 'review',
    label: '待复习',
    icon: '🔄',
  },
  {
    value: 'suspended',
    label: '已暂停',
    icon: '⏸️',
  },
]

// 学习集选项
const studySetOptions = ref<Array<{ value: string, label: string }>>([])

// 常用标签
const commonTags = ref<Array<{ name: string, count: number }>>([])

// 加载学习集列表
const loadStudySets = async () => {
  try {
    const sets = await studySetService.getAllStudySets()
    studySetOptions.value = sets
      .filter((s) => s.id !== props.studySetId)
      .map((s) => ({
        value: s.id,
        label: s.name,
      }))
  } catch (error) {
    console.error('[loadStudySets] 加载失败:', error)
  }
}

// 加载常用标签
const loadCommonTags = async () => {
  try {
    const tags = await cardEnhanceService.getAllTags()
    commonTags.value = tags.slice(0, 20)
  } catch (error) {
    console.error('[loadCommonTags] 加载失败:', error)
  }
}

// 全选处理
const handleSelectAllChange = () => {
  if (selectAll.value) {
    selectedCards.value = props.cards.map((c) => c.id)
  } else {
    selectedCards.value = []
  }
  emit('select', selectedCards.value)
}

// 批量设置难度
const handleBatchSetDifficulty = async () => {
  if (selectedDifficulty.value === null) return

  const result = await cardEnhanceService.batchSetCardDifficulty(
    selectedCards.value,
    selectedDifficulty.value,
  )

  operationResult.value = result
  showDifficultyDialog.value = false
  selectedDifficulty.value = null

  setTimeout(() => {
    operationResult.value = null
  }, 3000)

  emit('update', props.cards)
}

// 批量设置状态
const handleBatchSetStatus = async () => {
  if (!selectedStatus.value) return

  const result = await cardEnhanceService.batchTransitionCardStatus(
    selectedCards.value,
    selectedStatus.value as any,
  )

  operationResult.value = result
  showStatusMenu.value = false
  selectedStatus.value = null

  setTimeout(() => {
    operationResult.value = null
  }, 3000)

  emit('update', props.cards)
}

// 添加标签
const addTag = () => {
  const tags = newTagInput.value
    .split(/,/)
    .map((t) => t.trim())
    .filter(Boolean)

  if (tags.length > 0) {
    currentTags.value = [...new Set([...currentTags.value, ...tags])]
    newTagInput.value = ''
  }
}

// 按名称添加标签
const addTagByName = (tagName: string) => {
  if (!currentTags.value.includes(tagName)) {
    currentTags.value.push(tagName)
  }
}

// 移除标签
const removeTag = (tag: string) => {
  currentTags.value = currentTags.value.filter((t) => t !== tag)
}

// 批量添加标签
const handleBatchAddTags = async () => {
  if (currentTags.value.length === 0) return

  const result = await cardEnhanceService.batchAddCardTags(
    selectedCards.value,
    currentTags.value,
  )

  operationResult.value = result
  showTagManager.value = false
  currentTags.value = []

  setTimeout(() => {
    operationResult.value = null
  }, 3000)

  emit('update', props.cards)
}

// 批量移动
const handleBatchMove = async () => {
  if (!selectedStudySetId.value) return

  const result = await cardEnhanceService.batchMoveCards(
    selectedCards.value,
    selectedStudySetId.value,
  )

  operationResult.value = result
  showMoveDialog.value = false
  selectedStudySetId.value = ''

  setTimeout(() => {
    operationResult.value = null
  }, 3000)

  emit('update', props.cards)
}

// 批量删除
const handleBatchDelete = async () => {
  if (!confirm(`确定要删除选中的 ${selectedCards.value.length} 张卡片吗？此操作不可恢复。`)) {
    return
  }

  const result = await cardEnhanceService.batchDeleteCards(selectedCards.value)

  operationResult.value = result
  selectedCards.value = []
  selectAll.value = false

  setTimeout(() => {
    operationResult.value = null
  }, 3000)

  emit('update', props.cards)
}

// 初始化
loadStudySets()
loadCommonTags()
</script>

<style scoped lang="scss">
.card-batch-operations {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 13px;
  color: var(--b3-theme-primary);
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  gap: 8px;
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
  overflow: auto;
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
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

// 难度选项
.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.difficulty-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    border: 2px solid var(--b3-theme-primary);
  }
}

.difficulty-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.difficulty-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.difficulty-label {
  font-size: 14px;
  font-weight: 500;
}

.difficulty-desc {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

// 状态选项
.status-info {
  margin-bottom: 16px;

  p {
    margin: 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
  }
}

.status-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    border: 2px solid var(--b3-theme-primary);
  }
}

.status-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
}

// 标签管理
.tag-input-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.current-tags,
.common-tags {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--b3-theme-surface);
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.common {
    background: var(--b3-theme-primary-light, rgba(0, 123, 255, 0.1));
    color: var(--b3-theme-primary);
  }

  .remove-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface-light);
    cursor: pointer;
    border-radius: 50%;
    font-size: 14px;

    &:hover {
      background: var(--b3-theme-on-surface-light);
      color: white;
    }
  }

  .tag-count {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
    margin-left: 4px;
  }
}

.empty-tip {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

// 移动对话框
.move-dialog {
  max-width: 400px;
}

// 操作结果
.operation-result {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--b3-theme-background);
  border-radius: 8px;
  padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: slideUp 0.3s ease;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-icon {
  font-size: 20px;
  color: var(--b3-theme-success, #4CAF50);
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
}

.result-detail {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.close-result {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: var(--b3-theme-on-surface-light);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
