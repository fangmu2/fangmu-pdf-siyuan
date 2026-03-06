<template>
  <div
    v-if="modelValue"
    class="card-editor-dialog-overlay"
    @click="handleClose"
  >
    <div
      class="card-editor-dialog"
      :style="{
        width: dialogWidth, height: dialogHeight,
      }"
      @click.stop
    >
      <!-- 标题栏 -->
      <div class="card-editor-dialog__header">
        <div class="card-editor-dialog__title">
          <span class="card-editor-dialog__icon">📝</span>
          <span>{{ isEditMode ? '编辑卡片' : '创建卡片' }}</span>
        </div>
        <div class="card-editor-dialog__actions">
          <button
            class="card-editor-dialog__btn-icon"
            title="切换大小"
            @click="toggleSize"
          >
            <span v-if="isExpanded">🗗</span>
            <span v-else>🗖</span>
          </button>
          <button
            class="card-editor-dialog__btn-icon"
            title="关闭"
            @click="handleClose"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="card-editor-dialog__body">
        <!-- 来源信息 -->
        <div class="card-editor-dialog__source">
          <div class="source-label">
            📍 来源
          </div>
          <div class="source-info">
            <span>{{ getFileName(pdfPath) }}</span>
            <span class="source-divider">•</span>
            <span>第 {{ page }} 页</span>
          </div>
        </div>

        <!-- 摘录内容预览 -->
        <div
          v-if="excerptText"
          class="card-editor-dialog__excerpt"
        >
          <div class="excerpt-label">
            📄 摘录内容
          </div>
          <div class="excerpt-content">
            {{ excerptText }}
          </div>
        </div>

        <!-- 卡片类型选择 -->
        <div class="card-editor-dialog__section">
          <div class="section-title">
            卡片类型
          </div>
          <div class="card-type-selector">
            <button
              class="card-type-btn"
              :class="[{ active: cardType === 'card' }]"
              @click="cardType = 'card'"
            >
              📝 普通卡片
            </button>
            <button
              class="card-type-btn"
              :class="[{ active: cardType === 'flashcard' }]"
              @click="cardType = 'flashcard'"
            >
              🎴 闪卡
            </button>
            <button
              class="card-type-btn"
              :class="[{ active: cardType === 'excerpt' }]"
              @click="cardType = 'excerpt'"
            >
              📌 摘录卡片
            </button>
          </div>
        </div>

        <!-- 学习集选择 -->
        <div class="card-editor-dialog__section">
          <div class="section-title">
            <span>学习集</span>
            <button
              class="create-set-btn"
              title="创建新学习集"
              @click="showCreateSetDialog = true"
            >
              + 新建
            </button>
          </div>
          <select
            v-model="selectedStudySetId"
            class="study-set-select"
          >
            <option value="">
              选择学习集...
            </option>
            <option
              v-for="set in learningSets"
              :key="set.id"
              :value="set.id"
            >
              {{ set.name }}
            </option>
          </select>
        </div>

        <!-- 标签输入 -->
        <div class="card-editor-dialog__section">
          <div class="section-title">
            标签
          </div>
          <div class="tag-input-container">
            <div class="tag-list">
              <span
                v-for="(tag, index) in tags"
                :key="index"
                class="tag-item"
              >
                {{ tag }}
                <button
                  class="tag-remove"
                  @click="removeTag(index)"
                >×</button>
              </span>
            </div>
            <input
              v-model="tagInput"
              class="tag-input"
              placeholder="输入标签后按回车"
              @keydown.enter="addTag"
            />
          </div>
          <!-- 常用标签建议 -->
          <div
            v-if="suggestedTags.length > 0"
            class="suggested-tags"
          >
            <span class="suggested-label">建议：</span>
            <button
              v-for="(tag, index) in suggestedTags"
              :key="index"
              class="suggested-tag"
              :class="[{ selected: tags.includes(tag) }]"
              @click="toggleSuggestedTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 闪卡编辑 -->
        <div
          v-if="cardType === 'flashcard'"
          class="card-editor-dialog__section"
        >
          <div class="section-title">
            闪卡内容
          </div>
          <div class="flashcard-editor">
            <div class="flashcard-field">
              <label class="field-label">正面（问题）</label>
              <textarea
                v-model="flashcardFront"
                class="field-textarea"
                placeholder="输入问题..."
                rows="3"
              ></textarea>
            </div>
            <div class="flashcard-field">
              <label class="field-label">反面（答案）</label>
              <textarea
                v-model="flashcardBack"
                class="field-textarea"
                placeholder="输入答案..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 笔记/备注 -->
        <div class="card-editor-dialog__section">
          <div class="section-title">
            笔记/备注
          </div>
          <textarea
            v-model="note"
            class="note-textarea"
            placeholder="输入补充说明（可选）..."
            rows="3"
          ></textarea>
        </div>

        <!-- 难度和状态 -->
        <div class="card-editor-dialog__row">
          <div class="card-editor-dialog__field">
            <label class="field-label">难度</label>
            <div class="difficulty-selector">
              <button
                v-for="i in 5"
                :key="i"
                class="difficulty-btn"
                :class="[{ active: difficulty === i }]"
                @click="difficulty = i"
              >
                {{ i }}
              </button>
            </div>
          </div>
          <div class="card-editor-dialog__field">
            <label class="field-label">状态</label>
            <select
              v-model="status"
              class="status-select"
            >
              <option value="new">
                新卡片
              </option>
              <option value="learning">
                学习中
              </option>
              <option value="review">
                复习中
              </option>
              <option value="suspended">
                已暂停
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="card-editor-dialog__footer">
        <div class="footer-left">
          <button
            class="footer-btn footer-btn--secondary"
            @click="handleCancel"
          >
            取消
          </button>
        </div>
        <div class="footer-right">
          <button
            class="footer-btn footer-btn--secondary"
            @click="handleSaveAndNew"
          >
            保存并新建
          </button>
          <button
            class="footer-btn footer-btn--primary"
            @click="handleSave"
          >
            {{ isEditMode ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 创建学习集对话框 -->
    <div
      v-if="showCreateSetDialog"
      class="create-set-dialog-overlay"
      @click="showCreateSetDialog = false"
    >
      <div
        class="create-set-dialog"
        @click.stop
      >
        <div class="create-set-dialog__header">
          <span>创建学习集</span>
          <button
            class="create-set-dialog__close"
            @click="showCreateSetDialog = false"
          >
            ✕
          </button>
        </div>
        <div class="create-set-dialog__body">
          <div class="form-field">
            <label class="form-label">名称</label>
            <input
              v-model="newSetName"
              class="form-input"
              placeholder="输入学习集名称"
            />
          </div>
          <div class="form-field">
            <label class="form-label">描述</label>
            <textarea
              v-model="newSetDescription"
              class="form-textarea"
              placeholder="输入描述（可选）"
              rows="2"
            ></textarea>
          </div>
        </div>
        <div class="create-set-dialog__footer">
          <button
            class="footer-btn footer-btn--secondary"
            @click="showCreateSetDialog = false"
          >
            取消
          </button>
          <button
            class="footer-btn footer-btn--primary"
            @click="handleCreateSet"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Card,
  CardStatus,
  CardType,
  FlashCard,
} from '../types/card'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useLearningSetStore } from '../stores/learningSetStore'

interface Props {
  modelValue: boolean
  excerptText?: string
  pdfPath?: string
  page?: number
  rect?: [number, number, number, number]
  blockId?: string
  isImage?: boolean
  imagePath?: string
  editCard?: Card | FlashCard | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  excerptText: '',
  pdfPath: '',
  page: 1,
  rect: () => [0, 0, 0, 0],
  blockId: '',
  isImage: false,
  imagePath: '',
  editCard: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: CardCreateData): void
  (e: 'update', data: CardUpdateData): void
}>()

interface CardCreateData {
  type: CardType
  content: string
  studySetId: string
  tags: string[]
  note?: string
  difficulty: number
  status: CardStatus
  sourceLocation: {
    pdfPath?: string
    page?: number
    rect?: [number, number, number, number]
    blockId?: string
  }
  flashcard?: {
    front: string
    back: string
  }
}

interface CardUpdateData {
  id: string
  type: CardType
  content: string
  studySetId: string
  tags: string[]
  note?: string
  difficulty: number
  status: CardStatus
  flashcard?: {
    front: string
    back: string
  }
}

const learningSetStore = useLearningSetStore()

// 对话框状态
const isExpanded = ref(false)
const showCreateSetDialog = ref(false)
const newSetName = ref('')
const newSetDescription = ref('')

// 表单数据
const cardType = ref<CardType>('card')
const selectedStudySetId = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')
const note = ref('')
const difficulty = ref(3)
const status = ref<CardStatus>('new')

// 闪卡数据
const flashcardFront = ref('')
const flashcardBack = ref('')

// 计算属性
const dialogWidth = computed(() => isExpanded.value ? '80%' : '520px')
const dialogHeight = computed(() => isExpanded.value ? '85%' : 'auto')

const learningSets = computed(() => learningSetStore.learningSets)

const suggestedTags = computed(() => {
  // 从所有学习集的标签中推荐
  const allTags = new Set<string>()
  learningSets.value.forEach((set) => {
    set.cardIds?.forEach((cardId) => {
      // 这里可以扩展获取卡片标签
    })
  })
  // 常用标签
  const commonTags = ['重点', '难点', '考点', '概念', '公式', '定义']
  return [...commonTags, ...Array.from(allTags)].slice(0, 10)
})

// 监听编辑模式
const isEditMode = computed(() => !!props.editCard)

// 监听属性变化，初始化表单
watch(() => props.editCard, (card) => {
  if (card) {
    // 编辑模式：填充表单
    cardType.value = card.type as CardType
    selectedStudySetId.value = card.studySetId
    tags.value = [...card.tags]
    note.value = ''
    difficulty.value = card.difficulty
    status.value = card.status

    if (card.type === 'flashcard') {
      const flashCard = card as FlashCard
      flashcardFront.value = flashCard.front
      flashcardBack.value = flashCard.back
    }
  } else {
    // 新建模式：重置表单
    resetForm()
  }
}, { immediate: true })

// 重置表单
function resetForm() {
  cardType.value = 'card'
  selectedStudySetId.value = ''
  tags.value = []
  tagInput.value = ''
  note.value = ''
  difficulty.value = 3
  status.value = 'new'
  flashcardFront.value = ''
  flashcardBack.value = ''
}

// 获取文件名
function getFileName(path: string): string {
  return path.split('/').pop() || path
}

// 切换对话框大小
function toggleSize() {
  isExpanded.value = !isExpanded.value
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}

// 移除标签
function removeTag(index: number) {
  tags.value.splice(index, 1)
}

// 切换建议标签
function toggleSuggestedTag(tag: string) {
  const index = tags.value.indexOf(tag)
  if (index >= 0) {
    tags.value.splice(index, 1)
  } else {
    tags.value.push(tag)
  }
}

// 关闭处理
function handleClose() {
  emit('update:modelValue', false)
}

// 取消处理
function handleCancel() {
  emit('update:modelValue', false)
}

// 保存处理
function handleSave() {
  if (!validateForm()) return

  const data = buildCardData()
  if (props.editCard) {
    emit('update', {
      id: props.editCard.id,
      ...data,
    } as CardUpdateData)
  } else {
    emit('save', data)
  }
  emit('update:modelValue', false)
}

// 保存并新建
function handleSaveAndNew() {
  if (!validateForm()) return

  const data = buildCardData()
  if (props.editCard) {
    emit('update', {
      id: props.editCard.id,
      ...data,
    } as CardUpdateData)
  } else {
    emit('save', data)
  }
  resetForm()
}

// 验证表单
function validateForm(): boolean {
  if (!selectedStudySetId.value) {
    alert('请选择学习集')
    return false
  }
  if (cardType.value === 'flashcard' && (!flashcardFront.value.trim() || !flashcardBack.value.trim())) {
    alert('请填写闪卡的正面和反面内容')
    return false
  }
  return true
}

// 构建卡片数据
function buildCardData(): Omit<CardCreateData, 'sourceLocation'> & { sourceLocation: CardCreateData['sourceLocation'] } {
  const content = props.excerptText || ''

  const data: CardCreateData = {
    type: cardType.value,
    content,
    studySetId: selectedStudySetId.value,
    tags: [...tags.value],
    note: note.value,
    difficulty: difficulty.value,
    status: status.value,
    sourceLocation: {
      pdfPath: props.pdfPath,
      page: props.page,
      rect: props.rect,
      blockId: props.blockId,
    },
  }

  if (cardType.value === 'flashcard') {
    data.flashcard = {
      front: flashcardFront.value,
      back: flashcardBack.value,
    }
  }

  return data
}

// 创建学习集
async function handleCreateSet() {
  if (!newSetName.value.trim()) {
    alert('请输入学习集名称')
    return
  }

  try {
    await learningSetStore.createStudySet(newSetName.value, newSetDescription.value)
    selectedStudySetId.value = learningSetStore.learningSets[0]?.id || ''
    showCreateSetDialog.value = false
    newSetName.value = ''
    newSetDescription.value = ''
  } catch (error) {
    console.error('创建学习集失败:', error)
    alert('创建学习集失败，请重试')
  }
}

// 加载学习集列表
onMounted(async () => {
  if (learningSets.value.length === 0) {
    await learningSetStore.fetchStudySets()
  }
})
</script>

<style scoped lang="scss">
.card-editor-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.card-editor-dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--b3-theme-divider);
    background: var(--b3-theme-surface);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__icon {
    font-size: 16px;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__btn-icon {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-divider);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__source {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--b3-theme-surface);
    border-radius: 8px;
    font-size: 13px;
  }

  &__excerpt {
    padding: 12px;
    background: var(--b3-theme-surface);
    border-radius: 8px;
    border-left: 3px solid var(--b3-theme-primary);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__row {
    display: flex;
    gap: 16px;
  }

  &__field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid var(--b3-theme-divider);
    background: var(--b3-theme-surface);
  }
}

.source-label {
  font-weight: 500;
  color: var(--b3-theme-color-light);
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--b3-theme-color);
}

.source-divider {
  color: var(--b3-theme-divider);
}

.excerpt-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-color-light);
  margin-bottom: 4px;
}

.excerpt-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--b3-theme-color);
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-set-btn {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--b3-theme-primary);
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.card-type-selector {
  display: flex;
  gap: 8px;
}

.card-type-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
  }
}

.study-set-select {
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  min-height: 44px;
  align-items: center;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--b3-theme-primary);
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
    border-radius: 16px;
    font-size: 12px;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary);
      color: white;
    }
  }

  .tag-remove {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    padding: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  .tag-input {
    flex: 1;
    min-width: 100px;
    border: none;
    outline: none;
    background: transparent;
    color: var(--b3-theme-color);
    font-size: 13px;
  }
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.suggested-label {
  color: var(--b3-theme-color-light);
}

.suggested-tag {
  padding: 2px 8px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 12px;
  background: transparent;
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }

  &.selected {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
  }
}

.flashcard-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flashcard-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-color-light);
}

.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.note-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.difficulty-selector {
  display: flex;
  gap: 6px;
}

.difficulty-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

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

.status-select {
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.footer-btn {
  padding: 10px 20px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-divider);
  }

  &--secondary {
    border-color: var(--b3-theme-divider);
  }

  &--primary {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);

    &:hover {
      background: var(--b3-theme-primary-light);
    }
  }
}

/* 创建学习集对话框 */
.create-set-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.create-set-dialog {
  width: 100%;
  max-width: 400px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-theme-divider);
    font-size: 15px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__close {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-divider);
    }
  }

  &__body {
    padding: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-theme-divider);
  }
}

.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--b3-theme-color-light);
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.form-textarea {
  resize: vertical;
}
</style>
