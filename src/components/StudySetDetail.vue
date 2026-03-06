<!-- src/components/StudySetDetail.vue -->
<template>
  <div class="study-set-detail">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <div class="header-left">
        <button
          class="back-btn"
          title="返回"
          @click="goBack"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div class="study-set-info">
          <h2 class="study-set-title">
            {{ studySet?.name || '加载中...' }}
          </h2>
          <p
            v-if="studySet?.description"
            class="study-set-description"
          >
            {{ studySet.description }}
          </p>
        </div>
      </div>
      <div class="header-right">
        <div class="view-switcher">
          <button
            class="view-btn"
            :class="[{ active: currentView === 'cards' }]"
            title="卡片视图"
            @click="currentView = 'cards'"
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
            :class="[{ active: currentView === 'mindmap' }]"
            title="思维导图"
            @click="currentView = 'mindmap'"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M22 11h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0H8V9h2v2zm-4 0H4V9h2v2zm14 4h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zm-4 0H4v-2h2v2zm14 4h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H8v-2h2v2zm-4 0H4v-2h2v2z" />
            </svg>
          </button>
          <button
            class="view-btn"
            :class="[{ active: currentView === 'board' }]"
            title="卡片盒看板"
            @click="currentView = 'board'"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              <path d="M7 7h4v4H7zm6 0h4v4h-4zm-6 6h4v4H7zm6 0h4v4h-4z" />
            </svg>
          </button>
          <button
            class="view-btn"
            :class="[{ active: currentView === 'review' }]"
            title="复习模式"
            @click="currentView = 'review'"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3.17l2.7 1.58-1 1.71L11 13V8z" />
            </svg>
          </button>
        </div>
        <button
          class="add-card-btn"
          @click="showAddCardDialog = true"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          添加卡片
        </button>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalCards }}</span>
        <span class="stat-label">总卡片</span>
      </div>
      <div class="stat-item">
        <span class="stat-value new">{{ stats.newCards }}</span>
        <span class="stat-label">新学</span>
      </div>
      <div class="stat-item">
        <span class="stat-value learning">{{ stats.learningCards }}</span>
        <span class="stat-label">学习</span>
      </div>
      <div class="stat-item">
        <span class="stat-value review">{{ stats.reviewCards }}</span>
        <span class="stat-label">复习</span>
      </div>
      <div class="stat-item">
        <span class="stat-value due">{{ stats.dueCards }}</span>
        <span class="stat-label">待复习</span>
      </div>
      <div class="stat-item">
        <div class="progress-ring">
          <svg
            width="36"
            height="36"
          >
            <circle
              class="progress-ring-bg"
              cx="18"
              cy="18"
              r="14"
            />
            <circle
              class="progress-ring-circle"
              cx="18"
              cy="18"
              r="14"
              :style="progressRingStyle"
            />
          </svg>
          <span class="progress-text">{{ progressPercentage }}%</span>
        </div>
        <span class="stat-label">进度</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="detail-content">
      <!-- 卡片列表视图 -->
      <div
        v-show="currentView === 'cards'"
        class="view-container"
      >
        <CardList
          :cards="cards"
          :study-set-id="studySetId"
          @card-click="handleCardClick"
          @card-edit="handleCardEdit"
          @card-delete="handleCardDelete"
        />
      </div>

      <!-- 思维导图视图 -->
      <div
        v-show="currentView === 'mindmap'"
        class="view-container mindmap-view"
      >
        <MindMapEditor
          :annotations="annotations"
          :study-set-id="studySetId"
          @node-click="handleNodeClick"
          @node-add="handleNodeAdd"
          @node-edit="handleNodeEdit"
          @node-delete="handleNodeDelete"
        />
      </div>

      <!-- 卡片盒看板视图 -->
      <div
        v-show="currentView === 'board'"
        class="view-container"
      >
        <CardBoxBoard
          :cards="cards"
          :study-set-id="studySetId"
          @card-click="handleCardClick"
          @card-move="handleCardMove"
        />
      </div>

      <!-- 复习视图 -->
      <div
        v-show="currentView === 'review'"
        class="view-container review-view"
      >
        <ReviewSession
          :study-set-id="studySetId"
          :cards="dueCards"
          @complete="handleReviewComplete"
          @exit="currentView = 'cards'"
        />
      </div>
    </div>

    <!-- 添加卡片对话框 -->
    <div
      v-if="showAddCardDialog"
      class="dialog-overlay"
      @click="showAddCardDialog = false"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3>添加卡片</h3>
          <button
            class="close-btn"
            @click="showAddCardDialog = false"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>卡片类型</label>
            <select
              v-model="newCardType"
              class="form-select"
            >
              <option value="card">
                普通卡片
              </option>
              <option value="flashcard">
                闪卡
              </option>
              <option value="excerpt">
                摘录卡片
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>卡片内容</label>
            <textarea
              v-model="newCardContent"
              placeholder="输入卡片内容..."
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <template v-if="newCardType === 'flashcard'">
            <div class="form-group">
              <label>正面</label>
              <textarea
                v-model="newCardFront"
                placeholder="问题/正面内容..."
                rows="2"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label>反面</label>
              <textarea
                v-model="newCardBack"
                placeholder="答案/反面内容..."
                rows="2"
                class="form-textarea"
              ></textarea>
            </div>
          </template>
        </div>
        <div class="dialog-footer">
          <button
            class="btn-cancel"
            @click="showAddCardDialog = false"
          >
            取消
          </button>
          <button
            class="btn-confirm"
            @click="createNewCard"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PDFAnnotation } from '../types/annotation'
import type {
  Card,
  FlashCard,
} from '../types/card'
import type { StudySet } from '../types/studySet'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { cardService } from '../services/cardService'
import { studySetService } from '../services/studySetService'
import CardBoxBoard from './CardBoxBoard.vue'
import CardList from './CardList.vue'
import MindMapEditor from './MindMapEditor.vue'
import ReviewSession from './ReviewSession.vue'

const props = defineProps<{
  studySetId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

// 状态
const studySet = ref<StudySet | null>(null)
const cards = ref<Card[]>([])
const annotations = ref<PDFAnnotation[]>([])
const currentView = ref<'cards' | 'mindmap' | 'board' | 'review'>('cards')
const showAddCardDialog = ref(false)

// 新卡片数据
const newCardType = ref('card')
const newCardContent = ref('')
const newCardFront = ref('')
const newCardBack = ref('')

// 统计数据
const stats = ref({
  totalCards: 0,
  newCards: 0,
  learningCards: 0,
  reviewCards: 0,
  dueCards: 0,
})

// 加载学习集数据
const loadStudySet = async () => {
  try {
    const data = await studySetService.getStudySet(props.studySetId)
    if (data) {
      studySet.value = data
      cards.value = await studySetService.getStudySetCards(props.studySetId)
      updateStats()

      // 转换为标注数据供思维导图使用
      annotations.value = cards.value.map((card) => ({
        id: card.id,
        blockId: card.sourceLocation.blockId,
        pdfPath: card.sourceLocation.pdfPath || '',
        page: card.sourceLocation.page || 1,
        text: card.content,
        excerpt: card.content,
        color: '#FFEAA7',
        type: card.type === 'flashcard' ? 'text' : 'highlight',
        created: card.createdAt,
        updated: card.updatedAt,
        isImage: false,
        rect: card.sourceLocation.rect || {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        },
      }))
    }
  } catch (error) {
    console.error('加载学习集失败:', error)
  }
}

// 更新统计
const updateStats = () => {
  const now = Date.now()
  stats.value = {
    totalCards: cards.value.length,
    newCards: cards.value.filter((c) => c.status === 'new').length,
    learningCards: cards.value.filter((c) => c.status === 'learning').length,
    reviewCards: cards.value.filter((c) => c.status === 'review').length,
    dueCards: cards.value.filter((c) => {
      if (c.type !== 'flashcard') return false
      return (c as FlashCard).srs?.nextReview <= now
    }).length,
  }
}

// 进度环样式
const progressPercentage = computed(() => {
  if (stats.value.totalCards === 0) return 0
  const learned = stats.value.learningCards + stats.value.reviewCards
  return Math.round((learned / stats.value.totalCards) * 100)
})

const progressRingStyle = computed(() => {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progressPercentage.value / 100) * circumference
  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset,
  }
})

// 到期卡片
const dueCards = computed(() => {
  const now = Date.now()
  return cards.value.filter((card) => {
    if (card.type !== 'flashcard') return false
    return (card as FlashCard).srs?.nextReview <= now
  }) as FlashCard[]
})

// 事件处理
const goBack = () => {
  emit('back')
}

const handleCardClick = (card: Card) => {
  console.log('Card clicked:', card)
}

const handleCardEdit = (card: Card) => {
  console.log('Card edit:', card)
}

const handleCardDelete = async (card: Card) => {
  try {
    await cardService.deleteCard(card.id)
    await loadStudySet()
  } catch (error) {
    console.error('删除卡片失败:', error)
  }
}

const handleNodeClick = (annotation: PDFAnnotation) => {
  console.log('Node clicked:', annotation)
}

const handleNodeAdd = (parentNode: PDFAnnotation | null) => {
  console.log('Add node:', parentNode)
}

const handleNodeEdit = async (annotation: PDFAnnotation, newContent: string) => {
  try {
    const card = cards.value.find((c) => c.id === annotation.id)
    if (card) {
      await cardService.updateContent(card, newContent)
      await loadStudySet()
    }
  } catch (error) {
    console.error('更新节点失败:', error)
  }
}

const handleNodeDelete = async (annotation: PDFAnnotation) => {
  try {
    await cardService.deleteCard(annotation.id)
    await loadStudySet()
  } catch (error) {
    console.error('删除节点失败:', error)
  }
}

const handleCardMove = (cardId: string, toBox: string) => {
  console.log('Move card:', cardId, 'to:', toBox)
}

const handleReviewComplete = () => {
  loadStudySet()
}

// 创建新卡片
const createNewCard = async () => {
  try {
    if (newCardType.value === 'flashcard') {
      await cardService.createFlashCard(
        newCardFront.value,
        newCardBack.value,
        props.studySetId,
        newCardContent.value,
        {
          docId: '',
          blockId: '',
        },
      )
    } else {
      await cardService.createCard(
        newCardContent.value,
        props.studySetId,
        {
          docId: '',
          blockId: '',
        },
        newCardType.value as any,
      )
    }

    showAddCardDialog.value = false
    newCardContent.value = ''
    newCardFront.value = ''
    newCardBack.value = ''
    await loadStudySet()
  } catch (error) {
    console.error('创建卡片失败:', error)
  }
}

// 监听学习集 ID 变化
watch(() => props.studySetId, loadStudySet)

onMounted(() => {
  loadStudySet()
})
</script>

<style scoped>
.study-set-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
}

/* 头部样式 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: var(--b3-theme-surface-hover);
}

.study-set-info {
  display: flex;
  flex-direction: column;
}

.study-set-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.study-set-description {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-switcher {
  display: flex;
  background: var(--b3-theme-surface-hover);
  border-radius: 8px;
  padding: 4px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.view-btn:hover {
  background: var(--b3-theme-surface);
}

.view-btn.active {
  background: var(--b3-theme-primary);
  color: white;
}

.add-card-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-card-btn:hover {
  opacity: 0.9;
}

/* 统计栏样式 */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
  background: var(--b3-theme-background);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.stat-value.new {
  color: #4CAF50;
}

.stat-value.learning {
  color: #2196F3;
}

.stat-value.review {
  color: #FF9800;
}

.stat-value.due {
  color: #f44336;
}

.stat-label {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.progress-ring {
  position: relative;
  width: 36px;
  height: 36px;
}

.progress-ring-bg {
  fill: none;
  stroke: var(--b3-theme-surface-hover);
  stroke-width: 3;
}

.progress-ring-circle {
  fill: none;
  stroke: var(--b3-theme-primary);
  stroke-width: 3;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.35s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

/* 内容区样式 */
.detail-content {
  flex: 1;
  overflow: hidden;
}

.view-container {
  height: 100%;
  overflow: auto;
}

.mindmap-view {
  background: var(--b3-theme-background);
}

.review-view {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--b3-theme-surface);
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
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
  font-weight: 500;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--b3-theme-surface);
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  font-family: inherit;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
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
}

.btn-cancel:hover {
  background: var(--b3-theme-surface);
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
