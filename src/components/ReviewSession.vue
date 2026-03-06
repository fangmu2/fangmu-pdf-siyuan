<template>
  <div class="review-session">
    <!-- 复习进度条 -->
    <div class="review-session__progress">
      <div class="review-session__progress-info">
        <span>进度：{{ progress.current }} / {{ progress.total }}</span>
        <span>{{ progress.percentage }}%</span>
      </div>
      <div class="review-session__progress-bar">
        <div
          class="review-session__progress-fill"
          :style="{ width: `${progress.percentage}%` }"
        ></div>
      </div>
    </div>

    <!-- 复习内容 -->
    <div
      v-if="currentCard"
      class="review-session__card"
    >
      <!-- 卡片正面 -->
      <div
        v-if="!showAnswer"
        class="review-session__front card-face"
        @click="showAnswer = true"
      >
        <div class="card-face__content">
          <div class="card-face__label">
            问题
          </div>
          <div class="card-face__text">
            {{ currentCard.front }}
          </div>
          <div class="card-face__hint">
            点击显示答案
          </div>
        </div>
      </div>

      <!-- 卡片反面 -->
      <div
        v-else
        class="review-session__answer card-face"
      >
        <div class="card-face__content">
          <div class="card-face__label">
            答案
          </div>
          <div class="card-face__text">
            {{ currentCard.back }}
          </div>

          <!-- 来源信息 -->
          <div
            v-if="currentCard.sourceLocation"
            class="card-face__source"
          >
            <span class="card-face__source-label">来源：</span>
            <span class="card-face__source-text">
              {{ getSourceText(currentCard.sourceLocation) }}
            </span>
          </div>
        </div>

        <!-- 评分按钮 -->
        <div class="card-face__actions">
          <button
            class="rating-btn rating-btn--again"
            @click="handleRate('again')"
          >
            <span class="rating-btn__label">忘记</span>
            <span class="rating-btn__shortcut">1</span>
          </button>
          <button
            class="rating-btn rating-btn--hard"
            @click="handleRate('hard')"
          >
            <span class="rating-btn__label">困难</span>
            <span class="rating-btn__shortcut">2</span>
          </button>
          <button
            class="rating-btn rating-btn--good"
            @click="handleRate('good')"
          >
            <span class="rating-btn__label">良好</span>
            <span class="rating-btn__shortcut">3</span>
          </button>
          <button
            class="rating-btn rating-btn--easy"
            @click="handleRate('easy')"
          >
            <span class="rating-btn__label">简单</span>
            <span class="rating-btn__shortcut">4</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 复习完成 -->
    <div
      v-else
      class="review-session__complete"
    >
      <div class="complete-icon">
        ✓
      </div>
      <h2 class="complete-title">
        复习完成！
      </h2>
      <div class="complete-stats">
        <div class="complete-stat">
          <span class="complete-stat__value">{{ sessionStats.totalCards }}</span>
          <span class="complete-stat__label">总卡片数</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat__value">{{ sessionStats.correctCount }}</span>
          <span class="complete-stat__label">正确</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat__value">{{ sessionStats.incorrectCount }}</span>
          <span class="complete-stat__label">错误</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat__value">{{ sessionStats.accuracyRate }}%</span>
          <span class="complete-stat__label">正确率</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat__value">{{ formatDuration(sessionStats.durationSeconds) }}</span>
          <span class="complete-stat__label">用时</span>
        </div>
      </div>
      <button
        class="complete-btn"
        @click="handleComplete"
      >
        完成
      </button>
    </div>

    <!-- 剩余卡片提示 -->
    <div
      v-if="!currentCard && remainingCount > 0"
      class="review-session__remaining"
    >
      <p>本组复习已完成</p>
      <p class="review-session__remaining-hint">
        还有 {{ remainingCount }} 张卡片待复习
      </p>
      <button
        class="review-session__continue-btn"
        @click="handleContinue"
      >
        继续复习
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Card,
} from '../types/card'
import type { ReviewQualityLabel } from '../types/review'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { qualityLabelToScore } from '../review/sm2'

interface Props {
  queue?: Card[]
  session?: any
  studySetId?: string
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  queue: undefined,
  session: undefined,
  studySetId: '',
  onClose: undefined,
})

const emit = defineEmits<{
  (e: 'rate', cardId: string, quality: number): void
  (e: 'complete', session: any): void
  (e: 'continue'): void
  (e: 'close'): void
}>()

// 内部状态
interface InternalQueueItem {
  cardId: string
  front: string
  back: string
  sourceLocation?: {
    pdfPath?: string
    page?: number
  }
}

// 状态
const showAnswer = ref(false)
const currentCardIndex = ref(0)
const queueInternal = ref<InternalQueueItem[]>([])
const reviewedCount = ref(0)
const correctCount = ref(0)
const startTime = ref(Date.now())

// 初始化队列
function initQueue() {
  if (props.queue && props.queue.length > 0) {
    queueInternal.value = props.queue
      .filter((card) => card.type === 'flashcard' || card.type === 'card' || card.type === 'excerpt')
      .map((card) => ({
        cardId: card.id,
        front: card.content || '',
        back: card.note || card.content || '',
        sourceLocation: card.sourceLocation,
      }))
  } else {
    queueInternal.value = []
  }
}

// 当前卡片
const currentCard = computed(() => {
  if (currentCardIndex.value >= queueInternal.value.length) {
    return null
  }
  return queueInternal.value[currentCardIndex.value]
})

// 进度
const progress = computed(() => {
  const total = queueInternal.value.length
  const current = Math.min(currentCardIndex.value + 1, total)
  return {
    total,
    current,
    percentage: total > 0 ? Math.round((current / total) * 100) : 0,
  }
})

// 剩余卡片
const remainingCount = computed(() => {
  return queueInternal.value.length - currentCardIndex.value - 1
})

// 会话统计
const sessionStats = computed(() => {
  const total = queueInternal.value.length
  const incorrect = reviewedCount.value - correctCount.value
  const duration = Math.round((Date.now() - startTime.value) / 1000)
  return {
    totalCards: total,
    correctCount: correctCount.value,
    incorrectCount: incorrect,
    accuracyRate: reviewedCount.value > 0 ? Math.round((correctCount.value / reviewedCount.value) * 100) : 0,
    durationSeconds: duration,
  }
})

// 初始化
initQueue()

// 键盘快捷键
function handleKeyDown(e: KeyboardEvent) {
  if (!currentCard.value) return

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (!showAnswer.value) {
      showAnswer.value = true
    }
  } else if (showAnswer.value) {
    const keyMap: Record<string, number> = {
      1: 0, // again
      2: 2, // hard
      3: 4, // good
      4: 5, // easy
    }

    if (keyMap[e.key] !== undefined) {
      handleRateByScore(keyMap[e.key])
    }
  }
}

// 评分处理
function handleRate(label: ReviewQualityLabel) {
  const quality = qualityLabelToScore(label)
  handleRateByScore(quality)
}

function handleRateByScore(quality: number) {
  if (!currentCard.value) return

  try {
    // 记录评分
    reviewedCount.value++
    if (quality >= 3) {
      correctCount.value++
    }

    emit('rate', currentCard.value.cardId, quality)

    // 移动到下一张
    currentCardIndex.value++
    showAnswer.value = false
  } catch (error) {
    console.error('处理复习失败:', error)
  }
}

// 获取来源文本
function getSourceText(location: InternalQueueItem['sourceLocation']): string {
  if (!location) return ''
  if (location.pdfPath) {
    const fileName = location.pdfPath.split('/').pop() || ''
    return `${fileName} - P${location.page}`
  }
  return '文档'
}

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}分${secs}秒`
  }
  return `${secs}秒`
}

// 完成处理
function handleComplete() {
  emit('complete', {
    totalCards: queueInternal.value.length,
    correctCount: correctCount.value,
    duration: Date.now() - startTime.value,
  })
  if (props.onClose) {
    props.onClose()
  }
}

// 继续复习
function handleContinue() {
  emit('continue')
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
.review-session {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);

  &__progress {
    padding: 16px;
    border-bottom: 1px solid var(--b3-theme-border);
  }

  &__progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--b3-theme-color-light);
  }

  &__progress-bar {
    height: 8px;
    background: var(--b3-theme-background-light);
    border-radius: 4px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--b3-theme-primary), var(--b3-theme-primary-light));
    transition: width 0.3s ease;
  }

  &__card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  &__complete {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  &__remaining {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    text-align: center;

    &-hint {
      color: var(--b3-theme-color-light);
      font-size: 14px;
    }
  }

  &__continue-btn {
    padding: 12px 32px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary-dark);
    }
  }
}

.card-face {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: auto;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__text {
    font-size: 18px;
    line-height: 1.8;
    color: var(--b3-theme-color);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__source {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--b3-theme-border-light);
    font-size: 12px;
    color: var(--b3-theme-color-light);

    &-label {
      font-weight: 500;
    }

    &-text {
      margin-left: 4px;
    }
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--b3-theme-border);
  }

  &__hint {
    font-size: 13px;
    color: var(--b3-theme-color-light);
    text-align: center;
    padding: 16px;
    background: var(--b3-theme-background-light);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary-light);
      color: var(--b3-theme-primary);
    }
  }
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--b3-theme-background-light);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
  }

  &__shortcut {
    font-size: 11px;
    color: var(--b3-theme-color-light);
    background: var(--b3-theme-background);
    padding: 2px 8px;
    border-radius: 4px;
  }

  &--again {
    &:hover, &:focus {
      border-color: var(--b3-theme-error);
      background: var(--b3-theme-error-light);
    }
  }

  &--hard {
    &:hover, &:focus {
      border-color: var(--b3-theme-warning);
      background: var(--b3-theme-warning-light);
    }
  }

  &--good {
    &:hover, &:focus {
      border-color: var(--b3-theme-primary);
      background: var(--b3-theme-primary-light);
    }
  }

  &--easy {
    &:hover, &:focus {
      border-color: var(--b3-theme-success);
      background: var(--b3-theme-success-light);
    }
  }
}

.complete-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--b3-theme-success-light);
  color: var(--b3-theme-success);
  border-radius: 50%;
  font-size: 40px;
  font-weight: bold;
  animation: scaleIn 0.3s ease;
}

.complete-title {
  font-size: 24px;
  color: var(--b3-theme-color);
  margin: 0;
}

.complete-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.complete-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: var(--b3-theme-background-light);
  border-radius: 8px;

  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--b3-theme-primary);
  }

  &__label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }
}

.complete-btn {
  padding: 12px 48px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
