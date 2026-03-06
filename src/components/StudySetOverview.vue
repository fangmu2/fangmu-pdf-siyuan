<template>
  <div class="study-set-overview">
    <!-- 头部：学习集标题和封面 -->
    <div class="overview-header">
      <div
        class="cover-image"
        :style="{ backgroundImage: coverImage ? `url(${coverImage})` : '' }"
      >
        <div
          v-if="!coverImage"
          class="cover-placeholder"
        >
          <span class="cover-icon">📚</span>
        </div>
        <button
          class="change-cover-btn"
          title="更换封面"
          @click="showCoverSelector = true"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </div>
      <div class="header-info">
        <h2 class="study-set-title">
          {{ studySet?.name || '学习集' }}
        </h2>
        <p
          v-if="studySet?.description"
          class="study-set-description"
        >
          {{ studySet.description }}
        </p>
        <div class="header-meta">
          <span class="meta-item">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {{ stats.totalCards }} 张卡片
          </span>
          <span class="meta-item">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            {{ formatLastStudyTime(stats.lastStudyTime) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 统计卡片网格 -->
    <div class="stats-grid">
      <!-- 总卡片数 -->
      <div class="stat-card stat-total">
        <div class="stat-icon">
          📊
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.totalCards }}</span>
          <span class="stat-label">总卡片数</span>
        </div>
      </div>

      <!-- 新学卡片 -->
      <div class="stat-card stat-new">
        <div class="stat-icon">
          🆕
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.newCards }}</span>
          <span class="stat-label">新学</span>
        </div>
      </div>

      <!-- 学习中 -->
      <div class="stat-card stat-learning">
        <div class="stat-icon">
          📖
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.learningCards }}</span>
          <span class="stat-label">学习中</span>
        </div>
      </div>

      <!-- 待复习 -->
      <div
        class="stat-card stat-review"
        :class="{ 'has-due': stats.todayDueCards > 0 }"
      >
        <div class="stat-icon">
          🔄
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.todayDueCards }}</span>
          <span class="stat-label">
            今日待复习
            <span
              v-if="stats.overdueCards > 0"
              class="overdue-hint"
            >({{ stats.overdueCards }} 过期)</span>
          </span>
        </div>
      </div>

      <!-- 已完成 -->
      <div class="stat-card stat-completed">
        <div class="stat-icon">
          ✅
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.completedCards }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>

      <!-- 今日学习 -->
      <div class="stat-card stat-today">
        <div class="stat-icon">
          📅
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.todayStudyTime }}</span>
          <span class="stat-label">今日学习 (分钟)</span>
        </div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">学习进度</span>
        <span class="progress-value">{{ stats.progress }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${stats.progress}%` }"
        ></div>
      </div>
      <div class="progress-legend">
        <span class="legend-item">
          <span class="legend-color new"></span>
          <span>新学 ({{ stats.newCards }})</span>
        </span>
        <span class="legend-item">
          <span class="legend-color learning"></span>
          <span>学习中 ({{ stats.learningCards }})</span>
        </span>
        <span class="legend-item">
          <span class="legend-color completed"></span>
          <span>已完成 ({{ stats.completedCards }})</span>
        </span>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 状态分布饼图 -->
      <div class="chart-card">
        <h3 class="chart-title">
          卡片状态分布
        </h3>
        <div
          ref="pieChartRef"
          class="pie-chart"
        >
          <svg
            viewBox="0 0 100 100"
            class="pie-svg"
          >
            <template
              v-for="(slice, index) in pieSlices"
              :key="index"
            >
              <path
                :d="slice.path"
                :fill="slice.color"
                class="pie-slice"
              />
            </template>
            <text
              x="50"
              y="50"
              text-anchor="middle"
              dominant-baseline="middle"
              class="pie-center"
            >
              {{ stats.totalCards }}
            </text>
          </svg>
        </div>
        <div class="pie-legend">
          <div
            v-for="item in pieLegend"
            :key="item.label"
            class="pie-legend-item"
          >
            <span
              class="pie-dot"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span class="pie-label">{{ item.label }}: {{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 学习时间趋势 -->
      <div class="chart-card">
        <h3 class="chart-title">
          近 7 天学习趋势
        </h3>
        <div
          ref="barChartRef"
          class="bar-chart"
        >
          <div class="bar-container">
            <div
              v-for="(day, index) in studyTimeData"
              :key="index"
              class="bar-item"
            >
              <div class="bar-wrapper">
                <div
                  class="bar-fill"
                  :style="{ height: `${getBarHeight(day.duration)}%` }"
                  :title="`${day.date}: ${day.duration}分钟`"
                ></div>
              </div>
              <span class="bar-label">{{ getDayLabel(day.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日复习概览 -->
    <div class="review-overview-section">
      <h3 class="section-title">
        📋 今日复习概览
      </h3>
      <div class="review-cards-row">
        <div class="review-stat-card due">
          <div class="review-stat-value">
            {{ reviewOverview.due }}
          </div>
          <div class="review-stat-label">
            待复习
          </div>
        </div>
        <div class="review-stat-card completed">
          <div class="review-stat-value">
            {{ reviewOverview.completed }}
          </div>
          <div class="review-stat-label">
            已完成
          </div>
        </div>
        <div class="review-stat-card overdue">
          <div class="review-stat-value">
            {{ reviewOverview.overdue }}
          </div>
          <div class="review-stat-label">
            已过期
          </div>
        </div>
        <div class="review-stat-card next">
          <div class="review-stat-value">
            {{ reviewOverview.nextDue || '-' }}
          </div>
          <div class="review-stat-label">
            下次到期
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <button
        class="action-btn primary"
        @click="startReview"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
        开始复习
      </button>
      <button
        class="action-btn"
        @click="viewMindMap"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
        思维导图
      </button>
      <button
        class="action-btn"
        @click="viewCards"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" />
        </svg>
        卡片列表
      </button>
      <button
        class="action-btn"
        @click="viewAnnotations"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
        标注列表
      </button>
    </div>

    <!-- 封面选择器弹窗 -->
    <div
      v-if="showCoverSelector"
      class="cover-selector-overlay"
      @click.self="showCoverSelector = false"
    >
      <div class="cover-selector-panel">
        <div class="panel-header">
          <span>选择封面图片</span>
          <button
            class="close-btn"
            @click="showCoverSelector = false"
          >
            ✕
          </button>
        </div>
        <div class="panel-body">
          <div class="cover-options">
            <div
              class="cover-option"
              @click="selectCover('')"
            >
              <div class="option-placeholder">
                <span>📚</span>
                <span>默认封面</span>
              </div>
            </div>
            <div
              class="cover-option"
              @click="triggerFileSelect"
            >
              <div class="option-upload">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                </svg>
                <span>上传图片</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleCoverFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  StudySetStats,
  StudyTimeData,
} from '../services/studySetStatsService'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { uploadFileToAssets } from '../api/siyuanApi'
import {
  getStudySetStats,
  getStudyTimeData,
  getTodayReviewOverview,

} from '../services/studySetStatsService'

interface StudySet {
  id: string
  name: string
  description?: string
  coverImage?: string
}

interface Props {
  studySet?: StudySet | null
}

const props = withDefaults(defineProps<Props>(), {
  studySet: null,
})

const emit = defineEmits<{
  (e: 'start-review'): void
  (e: 'view-mindmap'): void
  (e: 'view-cards'): void
  (e: 'view-annotations'): void
}>()

// 状态
const stats = ref<StudySetStats>({
  totalCards: 0,
  newCards: 0,
  learningCards: 0,
  reviewCards: 0,
  completedCards: 0,
  todayDueCards: 0,
  todayCompleted: 0,
  overdueCards: 0,
  totalStudyTime: 0,
  todayStudyTime: 0,
  lastStudyTime: 0,
  totalDocuments: 0,
  totalAnnotations: 0,
  progress: 0,
  masteryLevel: 0,
})

const studyTimeData = ref<StudyTimeData[]>([])
const reviewOverview = ref({
  due: 0,
  completed: 0,
  overdue: 0,
  nextDue: null as string | null,
})

const coverImage = ref('')
const showCoverSelector = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()

// 封面图
watch(() => props.studySet, (newVal) => {
  if (newVal) {
    coverImage.value = newVal.coverImage || ''
    loadStats()
  }
}, { immediate: true })

// 加载统计数据
const loadStats = async () => {
  if (!props.studySet?.id) return

  try {
    const [statsData, timeData, reviewData] = await Promise.all([
      getStudySetStats(props.studySet.id),
      getStudyTimeData(props.studySet.id, 7),
      getTodayReviewOverview(props.studySet.id),
    ])

    stats.value = statsData
    studyTimeData.value = timeData
    reviewOverview.value = reviewData
  } catch (error) {
    console.error('[StudySetOverview] 加载统计数据失败:', error)
  }
}

// 饼图数据
const pieSlices = computed(() => {
  const total = stats.value.totalCards
  if (total === 0) return []

  const colors = {
    new: '#e0e7ff',
    learning: '#93c5fd',
    review: '#fcd34d',
    completed: '#86efac',
    suspended: '#d1d5db',
  }

  const slices: Array<{ path: string, color: string }> = []
  let startAngle = 0

  const data = [
    {
      value: stats.value.newCards,
      color: colors.new,
    },
    {
      value: stats.value.learningCards,
      color: colors.learning,
    },
    {
      value: stats.value.reviewCards,
      color: colors.review,
    },
    {
      value: stats.value.completedCards,
      color: colors.completed,
    },
  ].filter((item) => item.value > 0)

  data.forEach((item) => {
    const angle = (item.value / total) * 360
    const endAngle = startAngle + angle

    const path = describeArc(50, 50, 40, startAngle, endAngle)
    slices.push({
      path,
      color: item.color,
    })

    startAngle = endAngle
  })

  return slices
})

// 饼图图例
const pieLegend = computed(() => {
  const colors = {
    new: '#e0e7ff',
    learning: '#93c5fd',
    review: '#fcd34d',
    completed: '#86efac',
    suspended: '#d1d5db',
  }

  return [
    {
      label: '新学',
      value: stats.value.newCards,
      color: colors.new,
    },
    {
      label: '学习中',
      value: stats.value.learningCards,
      color: colors.learning,
    },
    {
      label: '待复习',
      value: stats.value.reviewCards,
      color: colors.review,
    },
    {
      label: '已完成',
      value: stats.value.completedCards,
      color: colors.completed,
    },
  ].filter((item) => item.value > 0)
})

// 计算圆弧路径
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M',
    x,
    y,
    'L',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

// 柱状图高度计算
const maxDuration = computed(() => {
  return Math.max(...studyTimeData.value.map((d) => d.duration), 1)
})

const getBarHeight = (duration: number) => {
  return (duration / maxDuration.value) * 100
}

const getDayLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))

  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化最后学习时间
const formatLastStudyTime = (timestamp: number) => {
  if (!timestamp) return '尚未学习'

  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return new Date(timestamp).toLocaleDateString()
}

// 事件处理
const startReview = () => {
  emit('start-review')
}

const viewMindMap = () => {
  emit('view-mindmap')
}

const viewCards = () => {
  emit('view-cards')
}

const viewAnnotations = () => {
  emit('view-annotations')
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleCoverFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const result = await uploadFileToAssets(file)
    coverImage.value = result.path
    showCoverSelector.value = false
    // TODO: 保存封面图到学习集
  } catch (error) {
    console.error('[handleCoverFileChange] 上传封面失败:', error)
  }
}

// 初始化
onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="scss">
.study-set-overview {
  padding: 20px;
  background: var(--b3-theme-surface);
  border-radius: 12px;
}

// 头部
.overview-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.cover-image {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--b3-theme-surface-light);
  background-size: cover;
  background-position: center;
  position: relative;
  flex-shrink: 0;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.cover-icon {
  font-size: 40px;
}

.change-cover-btn {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.cover-image:hover .change-cover-btn {
  opacity: 1;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.study-set-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.study-set-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

.header-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

// 统计网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  border: 1px solid var(--b3-border-color);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.stat-label {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

// 状态颜色
.stat-total { border-top: 3px solid #6366f1; }
.stat-new { border-top: 3px solid #e0e7ff; }
.stat-learning { border-top: 3px solid #93c5fd; }
.stat-review { border-top: 3px solid #fcd34d; }
.stat-review.has-due {
  background: linear-gradient(135deg, rgba(252, 211, 77, 0.1), transparent);
  border-color: #fcd34d;
}
.stat-completed { border-top: 3px solid #86efac; }
.stat-today { border-top: 3px solid #10b981; }

.overdue-hint {
  color: #ef4444;
  font-size: 10px;
}

// 进度条
.progress-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-primary);
}

.progress-bar {
  height: 8px;
  background: var(--b3-theme-surface-light);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;

  &.new { background: #e0e7ff; }
  &.learning { background: #93c5fd; }
  &.completed { background: #86efac; }
}

// 图表区域
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 12px;
}

.chart-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

// 饼图
.pie-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.pie-svg {
  width: 160px;
  height: 160px;
}

.pie-slice {
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

.pie-center {
  font-size: 18px;
  font-weight: 600;
  fill: var(--b3-theme-on-surface);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.pie-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

// 柱状图
.bar-chart {
  height: 150px;
}

.bar-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100%;
  padding: 0 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-wrapper {
  width: 100%;
  max-width: 32px;
  height: 100px;
  background: var(--b3-theme-surface-light);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
}

.bar-label {
  font-size: 10px;
  color: var(--b3-theme-on-surface-light);
}

// 复习概览
.review-overview-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.review-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.review-stat-card {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  text-align: center;
  border-top: 3px solid transparent;

  &.due { border-top-color: #fcd34d; }
  &.completed { border-top-color: #10b981; }
  &.overdue { border-top-color: #ef4444; }
  &.next { border-top-color: #6366f1; }
}

.review-stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
  margin-bottom: 4px;
}

.review-stat-label {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

// 快速操作
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }

  &.primary {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);

    &:hover {
      background: var(--b3-theme-primary-dark);
    }
  }
}

// 封面选择器
.cover-selector-overlay {
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

.cover-selector-panel {
  background: var(--b3-theme-surface);
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  span {
    font-weight: 600;
    font-size: 15px;
  }

  .close-btn {
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-surface-light);
    }
  }
}

.panel-body {
  padding: 20px;
}

.cover-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cover-option {
  cursor: pointer;
  border: 2px solid var(--b3-border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }
}

.option-placeholder,
.option-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 8px;
  color: var(--b3-theme-on-surface-light);
}

.option-upload svg {
  color: var(--b3-theme-primary);
}

// 响应式
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .review-cards-row,
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
