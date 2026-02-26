<template>
  <div class="review-stats">
    <!-- 日期选择器 -->
    <div class="review-stats__header">
      <div class="review-stats__date">
        <button class="review-stats__nav-btn" @click="prevDay">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <span class="review-stats__date-text">{{ currentDateText }}</span>
        <button class="review-stats__nav-btn" @click="nextDay">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        <button class="review-stats__today-btn" @click="goToToday">今天</button>
      </div>
    </div>

    <!-- 总览统计 -->
    <div class="review-stats__overview">
      <div class="overview-card">
        <div class="overview-card__icon" style="color: var(--b3-theme-primary)">📊</div>
        <div class="overview-card__content">
          <span class="overview-card__value">{{ stats.totalReviewed }}</span>
          <span class="overview-card__label">已复习</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon" style="color: var(--b3-theme-success)">✅</div>
        <div class="overview-card__content">
          <span class="overview-card__value">{{ stats.correctCount }}</span>
          <span class="overview-card__label">正确</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon" style="color: var(--b3-theme-error)">❌</div>
        <div class="overview-card__content">
          <span class="overview-card__value">{{ stats.incorrectCount }}</span>
          <span class="overview-card__label">错误</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-card__icon" style="color: var(--b3-theme-warning)">⏱️</div>
        <div class="overview-card__content">
          <span class="overview-card__value">{{ formatDuration(stats.totalTimeSpent) }}</span>
          <span class="overview-card__label">用时</span>
        </div>
      </div>
    </div>

    <!-- 正确率环形图 -->
    <div class="review-stats__accuracy">
      <h3 class="section-title">正确率</h3>
      <div class="accuracy-chart">
        <svg viewBox="0 0 100 100" class="accuracy-chart__svg">
          <!-- 背景圆 -->
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--b3-theme-background-light)"
            stroke-width="12"
          />
          <!-- 进度圆 -->
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--b3-theme-primary)"
            stroke-width="12"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 50 50)"
          />
          <!-- 百分比文字 -->
          <text
            x="50"
            y="50"
            text-anchor="middle"
            dominant-baseline="middle"
            class="accuracy-chart__text"
          >
            {{ accuracyRate }}%
          </text>
        </svg>
      </div>
    </div>

    <!-- 复习日历 -->
    <div class="review-stats__calendar">
      <h3 class="section-title">复习日历</h3>
      <div class="calendar">
        <div class="calendar__header">
          <span class="calendar__weekday">日</span>
          <span class="calendar__weekday">一</span>
          <span class="calendar__weekday">二</span>
          <span class="calendar__weekday">三</span>
          <span class="calendar__weekday">四</span>
          <span class="calendar__weekday">五</span>
          <span class="calendar__weekday">六</span>
        </div>
        <div class="calendar__days">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="['calendar__day', {
              'calendar__day--today': day.isToday,
              'calendar__day--selected': day.date === selectedDate,
            }]"
            :style="{ backgroundColor: getDayColor(day.count) }"
            @click="selectDate(day.date)"
          >
            <span class="calendar__day-num">{{ day.day }}</span>
            <span v-if="day.count > 0" class="calendar__day-count">{{ day.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习集统计 -->
    <div class="review-stats__study-sets">
      <h3 class="section-title">学习集分布</h3>
      <div class="study-set-list">
        <div
          v-for="item in studySetStats"
          :key="item.id"
          class="study-set-item"
          @click="handleStudySetClick(item.id)"
        >
          <div class="study-set-item__info">
            <span class="study-set-item__name">{{ item.name }}</span>
            <span class="study-set-item__count">{{ item.reviewed }}张</span>
          </div>
          <div class="study-set-item__bar">
            <div
              class="study-set-item__fill"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 复习质量分布 -->
    <div class="review-stats__quality">
      <h3 class="section-title">复习质量分布</h3>
      <div class="quality-chart">
        <div
          v-for="item in qualityDistribution"
          :key="item.label"
          class="quality-item"
        >
          <div class="quality-item__label">
            <span
              class="quality-item__color"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span>{{ item.label }}</span>
          </div>
          <div class="quality-item__bar">
            <div
              class="quality-item__fill"
              :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"
            ></div>
          </div>
          <span class="quality-item__count">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getReviewCalendarData, getReviewStats as getReviewStatsApi, getReviewRecordsByDateRange } from '../api/reviewApi';

interface Props {
  studySetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
});

const emit = defineEmits<{
  (e: 'date-change', date: string): void;
  (e: 'study-set-click', studySetId: string): void;
}>();

// 当前选中的日期
const selectedDate = ref<string>(new Date().toISOString().split('T')[0]);
const currentDate = ref(new Date());

// 圆周率
const circumference = 2 * Math.PI * 40;

// 统计信息
const stats = ref({
  totalReviewed: 0,
  correctCount: 0,
  incorrectCount: 0,
  totalTimeSpent: 0,
});

// 学习集统计
const studySetStats = ref<Array<{ id: string; name: string; reviewed: number; percentage: number }>>([]);

// 质量分布
const qualityDistribution = ref<Array<{ label: string; count: number; percentage: number; color: string }>>([]);

// 日历数据
const calendarData = ref<Record<number, number>>({});

// 当前日期文本
const currentDateText = computed(() => {
  const date = new Date(selectedDate.value);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// 正确率
const accuracyRate = computed(() => {
  const total = stats.value.totalReviewed;
  if (total === 0) return 0;
  return Math.round((stats.value.correctCount / total) * 100);
});

// 环形图偏移量
const dashOffset = computed(() => {
  return circumference - (accuracyRate.value / 100) * circumference;
});

// 日历天数
const calendarDays = computed(() => {
  const days: Array<{
    date: string;
    day: number;
    count: number;
    isToday: boolean;
  }> = [];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 获取当月第一天
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDay = firstDay.getDay();

  // 获取当月天数
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 填充前面的空白
  for (let i = 0; i < startDay; i++) {
    days.push({ date: '', day: 0, count: 0, isToday: false });
  }

  // 填充日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    days.push({
      date: dateStr,
      day,
      count: calendarData.value[day] || 0,
      isToday,
    });
  }

  return days;
});

// 选择日期
const selectDate = (date: string) => {
  selectedDate.value = date;
  emit('date-change', date);
  loadStats();
};

// 前一天
const prevDay = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() - 1);
  selectDate(date.toISOString().split('T')[0]);
};

// 后一天
const nextDay = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + 1);
  selectDate(date.toISOString().split('T')[0]);
};

// 回到今天
const goToToday = () => {
  selectDate(new Date().toISOString().split('T')[0]);
};

// 加载统计
const loadStats = async () => {
  try {
    const date = new Date(selectedDate.value);
    const startDate = date.setHours(0, 0, 0, 0);
    const endDate = startDate + 86400000;

    // 获取当天的复习记录
    const records = await getReviewRecordsByDateRange(startDate, endDate);

    stats.value = {
      totalReviewed: records.length,
      correctCount: records.filter(r => r.correct).length,
      incorrectCount: records.filter(r => !r.correct).length,
      totalTimeSpent: records.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
    };

    // 计算质量分布
    const qualityMap: Record<number, number> = {};
    records.forEach(r => {
      qualityMap[r.quality] = (qualityMap[r.quality] || 0) + 1;
    });

    const total = records.length;
    qualityDistribution.value = [
      {
        label: '简单',
        count: qualityMap[5] || 0,
        percentage: total > 0 ? Math.round(((qualityMap[5] || 0) / total) * 100) : 0,
        color: 'var(--b3-theme-success)'
      },
      {
        label: '良好',
        count: qualityMap[4] || 0,
        percentage: total > 0 ? Math.round(((qualityMap[4] || 0) / total) * 100) : 0,
        color: 'var(--b3-theme-primary)'
      },
      {
        label: '困难',
        count: qualityMap[3] || 0,
        percentage: total > 0 ? Math.round(((qualityMap[3] || 0) / total) * 100) : 0,
        color: 'var(--b3-theme-warning)'
      },
      {
        label: '忘记',
        count: (qualityMap[0] || 0) + (qualityMap[1] || 0) + (qualityMap[2] || 0),
        percentage: total > 0 ? Math.round((((qualityMap[0] || 0) + (qualityMap[1] || 0) + (qualityMap[2] || 0)) / total) * 100) : 0,
        color: 'var(--b3-theme-error)'
      },
    ];

    // TODO: 加载学习集统计
    studySetStats.value = [];
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载日历数据
const loadCalendarData = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    calendarData.value = await getReviewCalendarData(year, month, props.studySetId || undefined);
  } catch (error) {
    console.error('加载日历数据失败:', error);
  }
};

watch(() => selectedDate.value, loadStats, { immediate: true });
onMounted(() => {
  loadCalendarData();
});

// 格式化时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    return `${hours}小时${mins % 60}分`;
  }
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
};

// 学习集点击
const handleStudySetClick = (studySetId: string) => {
  emit('study-set-click', studySetId);
};
</script>

<style scoped lang="scss">
.review-stats {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.review-stats__header {
  margin-bottom: 20px;
}

.review-stats__date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.review-stats__nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-border);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
}

.review-stats__date-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
  min-width: 150px;
  text-align: center;
}

.review-stats__today-btn {
  padding: 6px 12px;
  border: 1px solid var(--b3-theme-border);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
}

.review-stats__overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-theme-border);
  border-radius: 8px;

  &__icon {
    font-size: 24px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: 18px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__label {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0 0 12px 0;
}

.review-stats__accuracy {
  margin-bottom: 24px;
  text-align: center;
}

.accuracy-chart {
  display: flex;
  justify-content: center;

  &__svg {
    width: 150px;
    height: 150px;
  }

  &__text {
    font-size: 20px;
    font-weight: 600;
    fill: var(--b3-theme-color);
  }
}

.review-stats__calendar {
  margin-bottom: 24px;
}

.calendar {
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-theme-border);
  border-radius: 8px;
  padding: 12px;

  &__header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  &__weekday {
    text-align: center;
    font-size: 11px;
    color: var(--b3-theme-color-light);
    font-weight: 500;
  }

  &__days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__day {
    aspect-ratio: 1;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }

    &--today {
      border: 2px solid var(--b3-theme-primary);
    }

    &--selected {
      border: 2px solid var(--b3-theme-primary);
      background: var(--b3-theme-primary-light) !important;
    }

    &--empty {
      cursor: default;
    }
  }

  &__day-num {
    font-size: 12px;
    color: var(--b3-theme-color);
  }

  &__day-count {
    position: absolute;
    bottom: 2px;
    font-size: 9px;
    color: var(--b3-theme-color);
    font-weight: 600;
  }
}

.review-stats__study-sets {
  margin-bottom: 24px;
}

.study-set-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.study-set-item {
  cursor: pointer;

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__name {
    font-size: 13px;
    color: var(--b3-theme-color);
    font-weight: 500;
  }

  &__count {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }

  &__bar {
    height: 6px;
    background: var(--b3-theme-background-light);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: var(--b3-theme-primary);
    transition: width 0.3s ease;
  }
}

.review-stats__quality {
  .quality-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .quality-item {
    display: flex;
    align-items: center;
    gap: 12px;

    &__label {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 60px;
      font-size: 13px;
      color: var(--b3-theme-color);
    }

    &__color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    &__bar {
      flex: 1;
      height: 8px;
      background: var(--b3-theme-background-light);
      border-radius: 4px;
      overflow: hidden;
    }

    &__fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    &__count {
      min-width: 30px;
      text-align: right;
      font-size: 12px;
      color: var(--b3-theme-color-light);
    }
  }
}
</style>
