<template>
  <div class="fsrs-review-session">
    <!-- 会话头部 -->
    <div class="session-header">
      <div class="session-info">
        <h3>FSRS 复习</h3>
        <p class="session-subtitle">
          待复习：{{ session.queue.dueCards.length }} |
          新卡片：{{ session.queue.newCards.length }} |
          学习中：{{ session.queue.learningCards.length }}
        </p>
      </div>
      <div class="session-progress">
        <span>{{ session.reviewedCards.length }} / {{ totalCards }}</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
      <button
        class="close-btn"
        title="结束会话"
        @click="endSession"
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

    <!-- 空状态 -->
    <div
      v-if="currentCard === null"
      class="empty-state"
    >
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        fill="currentColor"
        class="empty-icon"
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      <h4>🎉 复习完成！</h4>
      <p>你已经完成了今天的所有复习任务</p>
      <div
        v-if="session.reviewedCards.length > 0"
        class="session-summary"
      >
        <div class="summary-item">
          <span class="summary-label">复习卡片</span>
          <span class="summary-value">{{ session.reviewedCards.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">平均评分</span>
          <span class="summary-value">{{ averageRating }}</span>
        </div>
      </div>
      <SyButton
        type="primary"
        @click="endSession"
      >
        完成
      </SyButton>
    </div>

    <!-- 复习卡片 -->
    <div
      v-else
      class="card-container"
    >
      <!-- 卡片正面 -->
      <div
        v-if="!showAnswer"
        class="card-face card-front"
      >
        <div class="card-content">
          <div
            class="card-front-content"
            v-html="renderMarkdown(currentCard.front || currentCard.content)"
          ></div>
        </div>
        <div class="card-actions">
          <SyButton
            type="primary"
            size="large"
            @click="showAnswer = true"
          >
            显示答案
          </SyButton>
        </div>
      </div>

      <!-- 卡片反面 -->
      <div
        v-else
        class="card-face card-back"
      >
        <div class="card-content">
          <div
            class="card-question"
            v-html="renderMarkdown(currentCard.front || currentCard.content)"
          ></div>
          <div
            class="card-answer"
            v-html="renderMarkdown(currentCard.back || '')"
          ></div>
        </div>
        <div class="card-rating">
          <p class="rating-label">
            请评分：
          </p>
          <div class="rating-buttons">
            <button
              class="rating-btn again"
              :style="{ borderColor: ratingColors[0] }"
              @click="rateCard(0)"
            >
              <span class="rating-shortcut">1</span>
              <span class="rating-label-text">忘记</span>
              <span class="rating-next">
                {{ getNextReviewTime(0) }}
              </span>
            </button>
            <button
              class="rating-btn hard"
              :style="{ borderColor: ratingColors[1] }"
              @click="rateCard(1)"
            >
              <span class="rating-shortcut">2</span>
              <span class="rating-label-text">困难</span>
              <span class="rating-next">
                {{ getNextReviewTime(1) }}
              </span>
            </button>
            <button
              class="rating-btn good"
              :style="{ borderColor: ratingColors[2] }"
              @click="rateCard(2)"
            >
              <span class="rating-shortcut">3</span>
              <span class="rating-label-text">良好</span>
              <span class="rating-next">
                {{ getNextReviewTime(2) }}
              </span>
            </button>
            <button
              class="rating-btn easy"
              :style="{ borderColor: ratingColors[3] }"
              @click="rateCard(3)"
            >
              <span class="rating-shortcut">4</span>
              <span class="rating-label-text">简单</span>
              <span class="rating-next">
                {{ getNextReviewTime(3) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- 卡片导航 -->
      <div class="card-nav">
        <button
          class="nav-btn"
          :disabled="session.currentIndex === 0"
          @click="previousCard"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          上一个
        </button>
        <span class="card-position">
          {{ session.currentIndex + 1 }} / {{ totalCards }}
        </span>
        <button
          class="nav-btn"
          :disabled="session.currentIndex >= totalCards - 1"
          @click="nextCard"
        >
          下一个
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 记忆曲线预览 -->
    <div
      v-if="currentCard && showAnswer"
      class="memory-curve-preview"
    >
      <div class="curve-title">
        记忆保持率预测
      </div>
      <div class="curve-chart">
        <svg
          viewBox="0 0 200 60"
          class="curve-svg"
        >
          <path
            :d="memoryCurvePath"
            class="curve-path"
            fill="none"
            stroke="var(--b3-theme-primary)"
            stroke-width="2"
          />
          <line
            x1="0"
            y1="55"
            x2="200"
            y2="55"
            class="curve-axis"
            stroke="var(--b3-border-color)"
          />
          <text
            x="10"
            y="15"
            class="curve-label"
          >100%</text>
          <text
            x="10"
            y="50"
            class="curve-label"
          >0%</text>
          <text
            x="180"
            y="55"
            class="curve-label"
          >30 天</text>
        </svg>
      </div>
      <div class="curve-stats">
        <span>当前稳定性：{{ currentCard.fsrsState.stability.toFixed(1) }}天</span>
        <span>预测保持率：{{ (currentCard.fsrsState.retrievability * 100).toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Rating } from '../review/fsrs'
import type {
  FSRSReviewCard,
  ReviewSession,
} from '../services/fsrsReviewService'
import { marked } from 'marked'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { fsrsService } from '../review/fsrs'
import {

  fsrsReviewService,

} from '../services/fsrsReviewService'
import SyButton from './SiyuanTheme/SyButton.vue'

const props = defineProps<{
  studySetId: string
}>()

const emit = defineEmits<{
  (e: 'complete', session: ReviewSession): void
  (e: 'close'): void
}>()

// 会话状态
const session = ref<ReviewSession>({
  sessionId: `session-${Date.now()}`,
  studySetId: props.studySetId,
  queue: {
    dueCards: [],
    newCards: [],
    learningCards: [],
    totalCards: 0,
  },
  currentIndex: 0,
  reviewedCards: [],
  startTime: Date.now(),
})

// 卡片状态
const currentCard = ref<FSRSReviewCard | null>(null)
const showAnswer = ref(false)

// 评分颜色
const ratingColors = ['#F44336', '#FF9800', '#4CAF50', '#2196F3']

// 加载复习会话
onMounted(async () => {
  await loadSession()
  setupKeyboardShortcuts()
})

onUnmounted(() => {
  removeKeyboardShortcuts()
})

// 加载会话
async function loadSession() {
  session.value = await fsrsReviewService.createReviewSession(props.studySetId)
  updateCurrentCard()
}

// 更新当前卡片
function updateCurrentCard() {
  const allCards = [
    ...session.value.queue.dueCards,
    ...session.value.queue.newCards,
    ...session.value.queue.learningCards,
  ]

  if (session.value.currentIndex < allCards.length) {
    currentCard.value = allCards[session.value.currentIndex]
    showAnswer.value = false
  } else {
    currentCard.value = null
  }
}

// 总卡片数
const totalCards = computed(() => {
  return session.value.queue.dueCards.length
    + session.value.queue.newCards.length
    + session.value.queue.learningCards.length
})

// 进度百分比
const progressPercent = computed(() => {
  if (totalCards.value === 0) return 0
  return Math.round((session.value.reviewedCards.length / totalCards.value) * 100)
})

// 平均评分
const averageRating = computed(() => {
  if (session.value.reviewedCards.length === 0) return '-'
  const sum = session.value.reviewedCards.reduce((acc, r) => acc + r.rating, 0)
  return (sum / session.value.reviewedCards.length).toFixed(1)
})

// 记忆曲线路径
const memoryCurvePath = computed(() => {
  if (!currentCard.value) return ''

  const stability = currentCard.value.fsrsState.stability
  const points: string[] = []

  for (let i = 0; i <= 30; i++) {
    const retrievability = fsrsService.predictRetrievability(stability, i)
    const x = (i / 30) * 200
    const y = 55 - (retrievability * 45)
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
  }

  return points.join(' ')
})

// 渲染 Markdown
function renderMarkdown(text: string): string {
  try {
    return marked(text || '')
  } catch {
    return text || ''
  }
}

// 获取下次复习时间
function getNextReviewTime(rating: Rating): string {
  if (!currentCard.value) return ''

  const result = fsrsService.processReview(currentCard.value.fsrsState, rating)
  const days = result.state.interval

  if (days === 0) return '现在'
  if (days === 1) return '明天'
  if (days < 30) return `${days}天后`
  if (days < 365) return `${Math.round(days / 30)}个月后`
  return `${Math.round(days / 365)}年后`
}

// 评分卡片
async function rateCard(rating: Rating) {
  if (!currentCard.value) return

  try {
    await fsrsReviewService.processCardReview(
      currentCard.value.id,
      rating,
      currentCard.value.fsrsState,
    )

    // 记录复习
    session.value.reviewedCards.push({
      cardId: currentCard.value.id,
      rating,
      timestamp: Date.now(),
    })

    // 移动到下一张
    session.value.currentIndex++
    updateCurrentCard()
  } catch (error) {
    console.error('[rateCard] 评分失败:', error)
  }
}

// 上一张卡片
function previousCard() {
  if (session.value.currentIndex > 0) {
    session.value.currentIndex--
    updateCurrentCard()
  }
}

// 下一张卡片
function nextCard() {
  if (session.value.currentIndex < totalCards.value - 1) {
    session.value.currentIndex++
    updateCurrentCard()
  }
}

// 结束会话
function endSession() {
  session.value.endTime = Date.now()
  emit('complete', session.value)
}

// 键盘快捷键
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeydown)
}

function removeKeyboardShortcuts() {
  document.removeEventListener('keydown', handleKeydown)
}

function handleKeydown(e: KeyboardEvent) {
  if (currentCard.value === null) return

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (!showAnswer.value) {
      showAnswer.value = true
    }
  } else if (showAnswer.value && ['1', '2', '3', '4'].includes(e.key)) {
    e.preventDefault()
    const rating = (Number.parseInt(e.key) - 1) as Rating
    rateCard(rating)
  }
}
</script>

<style scoped lang="scss">
.fsrs-review-session {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
}

// 会话头部
.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  .session-info {
    flex: 1;

    h3 {
      margin: 0;
      font-size: 18px;
    }

    .session-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--b3-theme-on-surface-light);
    }
  }

  .session-progress {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 13px;
      color: var(--b3-theme-on-surface-light);
    }

    .progress-bar {
      width: 100px;
      height: 6px;
      background: var(--b3-theme-surface);
      border-radius: 3px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: var(--b3-theme-primary);
        transition: width 0.3s;
      }
    }
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface-light);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-surface-hover);
    }
  }
}

// 空状态
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;

  .empty-icon {
    color: var(--b3-theme-primary);
    margin-bottom: 24px;
  }

  h4 {
    font-size: 24px;
    margin: 0 0 8px;
  }

  p {
    color: var(--b3-theme-on-surface-light);
    margin: 0 0 32px;
  }

  .session-summary {
    display: flex;
    gap: 32px;
    margin-bottom: 24px;

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .summary-label {
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
      }

      .summary-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--b3-theme-primary);
      }
    }
  }
}

// 卡片容器
.card-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 卡片面
.card-face {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px;
  overflow-y: auto;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 18px;
  line-height: 1.8;
}

.card-front-content {
  max-width: 600px;
}

.card-question {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--b3-border-color);
}

.card-answer {
  font-size: 16px;
  color: var(--b3-theme-on-surface);
  max-width: 600px;
}

.card-actions {
  display: flex;
  justify-content: center;
  padding: 24px;
}

// 评分区域
.card-rating {
  padding: 24px;
  background: var(--b3-theme-surface);
  border-radius: 12px;
  margin-top: 24px;
}

.rating-label {
  text-align: center;
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--b3-theme-on-surface-light);
}

.rating-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid;
  border-radius: 8px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.again { border-color: #F44336; }
  &.hard { border-color: #FF9800; }
  &.good { border-color: #4CAF50; }
  &.easy { border-color: #2196F3; }
}

.rating-shortcut {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 4px;
}

.rating-label-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.rating-next {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

// 卡片导航
.card-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--b3-border-color);

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: var(--b3-theme-surface-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .card-position {
    font-size: 14px;
    color: var(--b3-theme-on-surface-light);
  }
}

// 记忆曲线预览
.memory-curve-preview {
  padding: 16px 24px;
  background: var(--b3-theme-surface);
  border-top: 1px solid var(--b3-border-color);
}

.curve-title {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 8px;
}

.curve-chart {
  margin-bottom: 8px;
}

.curve-svg {
  width: 100%;
  height: 60px;
}

.curve-path {
  fill: none;
  stroke: var(--b3-theme-primary);
  stroke-width: 2;
}

.curve-axis {
  stroke: var(--b3-border-color);
  stroke-width: 1;
}

.curve-label {
  font-size: 10px;
  fill: var(--b3-theme-on-surface-light);
}

.curve-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}
</style>
