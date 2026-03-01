<!-- src/components/ReviewGoalPanel.vue - 复习目标面板组件 -->
<template>
  <div class="review-goal-panel">
    <div class="review-goal-panel__header">
      <h3 class="review-goal-panel__title">🎯 复习目标</h3>
      <button class="settings-btn" @click="showSettings = !showSettings" title="设置">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>
    </div>

    <!-- 设置面板 -->
    <transition name="slide-down">
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-panel__item">
          <label class="settings-panel__label">每日复习目标</label>
          <input
            v-model.number="dailyGoal"
            type="number"
            min="1"
            max="500"
            class="settings-input"
          />
          <span class="settings-hint">张卡片</span>
        </div>
        <div class="settings-panel__item">
          <label class="settings-panel__label">每日新卡上限</label>
          <input
            v-model.number="dailyNewLimit"
            type="number"
            min="0"
            max="100"
            class="settings-input"
          />
          <span class="settings-hint">张新卡片</span>
        </div>
        <div class="settings-panel__item">
          <label class="settings-panel__label">连续学习提醒</label>
          <select v-model="reminderEnabled" class="settings-select">
            <option :value="true">开启</option>
            <option :value="false">关闭</option>
          </select>
        </div>
        <button class="save-settings-btn" @click="saveSettings">
          保存设置
        </button>
      </div>
    </transition>

    <!-- 今日进度 -->
    <div class="today-progress">
      <div class="progress-card">
        <div class="progress-card__header">
          <span class="progress-card__title">今日进度</span>
          <span class="progress-card__date">{{ todayDate }}</span>
        </div>
        <div class="progress-stats">
          <div class="stat-item">
            <div class="stat-item__value" :class="{ 'stat-item__value--highlight': todayCount >= dailyGoal }">
              {{ todayCount }}
            </div>
            <div class="stat-item__label">已复习</div>
          </div>
          <div class="stat-divider">/</div>
          <div class="stat-item">
            <div class="stat-item__value">{{ dailyGoal }}</div>
            <div class="stat-item__label">目标</div>
          </div>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :class="{
              'progress-bar__fill--low': progressPercent < 30,
              'progress-bar__fill--medium': progressPercent >= 30 && progressPercent < 70,
              'progress-bar__fill--high': progressPercent >= 70
            }"
            :style="{ width: `${Math.min(progressPercent, 100)}%` }"
          ></div>
        </div>
        <div class="progress-message">
          <span v-if="progressPercent < 30">💪 加油！继续努力～</span>
          <span v-else-if="progressPercent < 70">👍 进度不错，继续保持！</span>
          <span v-else-if="progressPercent < 100">🔥 快要完成目标了！</span>
          <span v-else>🎉 恭喜！已完成今日目标！</span>
        </div>
      </div>
    </div>

    <!-- 连续学习 -->
    <div class="streak-section">
      <div class="streak-card">
        <div class="streak-card__icon">🔥</div>
        <div class="streak-card__content">
          <div class="streak-card__value">{{ streakDays }}</div>
          <div class="streak-card__label">连续学习天数</div>
        </div>
        <div class="streak-card__history">
          <div
            v-for="day in last7Days"
            :key="day.date"
            :class="['streak-day', { 'streak-day--completed': day.completed }]"
            :title="day.date"
          >
            <span class="streak-day__label">{{ day.dayLabel }}</span>
            <span class="streak-day__dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 本周统计 -->
    <div class="weekly-stats">
      <h4 class="weekly-stats__title">本周统计</h4>
      <div class="weekly-stats__grid">
        <div class="weekly-stat-card">
          <div class="weekly-stat-card__value">{{ weeklyStats.totalReviewed }}</div>
          <div class="weekly-stat-card__label">复习总数</div>
        </div>
        <div class="weekly-stat-card">
          <div class="weekly-stat-card__value">{{ weeklyStats.newLearned }}</div>
          <div class="weekly-stat-card__label">新学卡片</div>
        </div>
        <div class="weekly-stat-card">
          <div class="weekly-stat-card__value">{{ weeklyStats.accuracyRate }}%</div>
          <div class="weekly-stat-card__label">正确率</div>
        </div>
        <div class="weekly-stat-card">
          <div class="weekly-stat-card__value">{{ weeklyStats.totalTime }}</div>
          <div class="weekly-stat-card__label">学习时长 (分钟)</div>
        </div>
      </div>
    </div>

    <!-- 成就徽章 -->
    <div class="achievements-section">
      <h4 class="achievements-section__title">🏆 成就徽章</h4>
      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          :class="['achievement-card', { 'achievement-card--locked': !achievement.unlocked }]"
          :title="achievement.description"
        >
          <div class="achievement-card__icon">{{ achievement.icon }}</div>
          <div class="achievement-card__name">{{ achievement.name }}</div>
          <div class="achievement-card__progress" v-if="!achievement.unlocked">
            {{ achievement.progress }}/{{ achievement.target }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 状态
const showSettings = ref(false);
const dailyGoal = ref(50);
const dailyNewLimit = ref(20);
const reminderEnabled = ref(true);
const todayCount = ref(0);
const streakDays = ref(0);
const last7Days = ref<Array<{ date: string; dayLabel: string; completed: boolean }>>([]);
const weeklyStats = ref({
  totalReviewed: 0,
  newLearned: 0,
  accuracyRate: 0,
  totalTime: 0,
});
const achievements = ref<Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}>>([
  { id: 'first', name: '初次尝试', description: '完成第一次复习', icon: '🌱', unlocked: false, progress: 0, target: 1 },
  { id: 'week', name: '持之以恒', description: '连续学习 7 天', icon: '📅', unlocked: false, progress: 0, target: 7 },
  { id: 'month', name: '月度达人', description: '连续学习 30 天', icon: '🏅', unlocked: false, progress: 0, target: 30 },
  { id: 'hundred', name: '百卡大师', description: '累计复习 100 张卡片', icon: '💯', unlocked: false, progress: 0, target: 100 },
  { id: 'perfect', name: '完美表现', description: '单次复习全对', icon: '⭐', unlocked: false, progress: 0, target: 1 },
  { id: 'speed', name: '神速进步', description: '1 分钟内完成 10 张卡片', icon: '⚡', unlocked: false, progress: 0, target: 10 },
]);

// 计算属性
const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
});

const progressPercent = computed(() => {
  if (dailyGoal.value === 0) return 0;
  return Math.round((todayCount.value / dailyGoal.value) * 100);
});

// 方法
function saveSettings() {
  const settings = {
    dailyGoal: dailyGoal.value,
    dailyNewLimit: dailyNewLimit.value,
    reminderEnabled: reminderEnabled.value,
  };
  localStorage.setItem('review-goal-settings', JSON.stringify(settings));
  showSettings.value = false;
}

function loadSettings() {
  const stored = localStorage.getItem('review-goal-settings');
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      dailyGoal.value = settings.dailyGoal || 50;
      dailyNewLimit.value = settings.dailyNewLimit || 20;
      reminderEnabled.value = settings.reminderEnabled !== false;
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }
}

function loadStats() {
  // 加载今日统计
  const todayStats = localStorage.getItem('review-today-stats');
  if (todayStats) {
    try {
      const stats = JSON.parse(todayStats);
      todayCount.value = stats.count || 0;
    } catch (e) {
      console.error('加载今日统计失败:', e);
    }
  }

  // 加载连续天数
  const streakStats = localStorage.getItem('review-streak');
  if (streakStats) {
    try {
      const stats = JSON.parse(streakStats);
      streakDays.value = stats.days || 0;
      last7Days.value = stats.last7Days || [];
    } catch (e) {
      console.error('加载连续天数失败:', e);
    }
  }

  // 加载周统计
  const weeklyStatsData = localStorage.getItem('review-weekly-stats');
  if (weeklyStatsData) {
    try {
      weeklyStats.value = JSON.parse(weeklyStatsData);
    } catch (e) {
      console.error('加载周统计失败:', e);
    }
  }

  // 加载成就
  const achievementsData = localStorage.getItem('review-achievements');
  if (achievementsData) {
    try {
      const unlockedAchievements = JSON.parse(achievementsData);
      achievements.value.forEach(achievement => {
        const unlocked = unlockedAchievements.find((a: { id: string }) => a.id === achievement.id);
        if (unlocked) {
          achievement.unlocked = true;
          achievement.progress = unlocked.progress || achievement.target;
        }
      });
    } catch (e) {
      console.error('加载成就失败:', e);
    }
  }
}

function updateAchievement(id: string, progress: number) {
  const achievement = achievements.value.find(a => a.id === id);
  if (achievement) {
    achievement.progress = progress;
    if (progress >= achievement.target) {
      achievement.unlocked = true;
    }
    saveAchievements();
  }
}

function saveAchievements() {
  const data = achievements.value.map(a => ({
    id: a.id,
    progress: a.progress,
    unlocked: a.unlocked,
  }));
  localStorage.setItem('review-achievements', JSON.stringify(data));
}

// 生命周期
onMounted(() => {
  loadSettings();
  loadStats();
});

// 暴露方法给父组件
defineExpose({
  updateAchievement,
});
</script>

<style scoped lang="scss">
.review-goal-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--b3-theme-background);
  height: 100%;
  overflow-y: auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  margin-bottom: 16px;

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-color);
    min-width: 100px;
  }
}

.settings-input,
.settings-select {
  flex: 1;
  max-width: 150px;
  padding: 8px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.settings-hint {
  font-size: 12px;
  color: var(--b3-theme-color-light);
}

.save-settings-btn {
  align-self: flex-end;
  padding: 8px 20px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}

.today-progress {
  .progress-card {
    padding: 20px;
    background: var(--b3-theme-surface);
    border-radius: 12px;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--b3-theme-color);
    }

    &__date {
      font-size: 12px;
      color: var(--b3-theme-color-light);
    }
  }
}

.progress-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;

  &__value {
    font-size: 36px;
    font-weight: 700;
    color: var(--b3-theme-color);

    &--highlight {
      color: var(--b3-theme-primary);
    }
  }

  &__label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    margin-top: 4px;
  }
}

.stat-divider {
  font-size: 24px;
  color: var(--b3-theme-divider);
}

.progress-bar {
  height: 8px;
  background: var(--b3-theme-divider);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;

  &__fill {
    height: 100%;
    background: var(--b3-theme-primary);
    transition: width 0.3s ease;

    &--low { background: #ff9800; }
    &--medium { background: #ffc107; }
    &--high { background: #4caf50; }
  }
}

.progress-message {
  text-align: center;
  font-size: 13px;
  color: var(--b3-theme-color-light);
}

.streak-section {
  .streak-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #ff6b6b, #ffa502);
    border-radius: 12px;
    color: white;

    &__icon {
      font-size: 40px;
    }

    &__content {
      flex: 1;
    }

    &__value {
      font-size: 32px;
      font-weight: 700;
    }

    &__label {
      font-size: 12px;
      opacity: 0.9;
    }

    &__history {
      display: flex;
      gap: 8px;
    }
  }
}

.streak-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &__label {
    font-size: 10px;
    opacity: 0.8;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);

    &--completed {
      background: white;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }
  }
}

.weekly-stats {
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0 0 12px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

.weekly-stat-card {
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  text-align: center;

  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--b3-theme-primary);
    margin-bottom: 4px;
  }

  &__label {
    font-size: 11px;
    color: var(--b3-theme-color-light);
  }
}

.achievements-section {
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0 0 12px;
  }
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.achievement-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--locked {
    opacity: 0.5;
    filter: grayscale(1);
  }

  &__icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  &__name {
    font-size: 12px;
    color: var(--b3-theme-color);
    margin-bottom: 4px;
  }

  &__progress {
    font-size: 10px;
    color: var(--b3-theme-color-light);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
