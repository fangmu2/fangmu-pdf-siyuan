<!-- src/components/ReviewAchievements.vue - 复习成就组件 -->
<template>
  <div class="review-achievements">
    <div class="review-achievements__header">
      <h3 class="review-achievements__title">🏆 成就徽章</h3>
      <button class="refresh-btn" @click="refreshAchievements" title="刷新">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>
    </div>

    <!-- 成就统计 -->
    <div class="achievements-stats">
      <div class="stat-card">
        <div class="stat-card__value">{{ unlockedCount }}</div>
        <div class="stat-card__label">已解锁</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">{{ totalAchievements }}</div>
        <div class="stat-card__label">总成就</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">{{ progressPercent }}%</div>
        <div class="stat-card__label">完成度</div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ unlockedCount }} / {{ totalAchievements }}</span>
    </div>

    <!-- 成就分类 -->
    <div class="achievements-categories">
      <!-- 学习成就 -->
      <div class="category-section">
        <h4 class="category-title">
          <span class="category-icon">📚</span>
          学习成就
        </h4>
        <div class="achievements-grid">
          <div
            v-for="achievement in learningAchievements"
            :key="achievement.id"
            :class="['achievement-card', { 'achievement-card--unlocked': achievement.unlocked }]"
            @click="showAchievementDetail(achievement)"
          >
            <div class="achievement-card__icon">
              {{ achievement.unlocked ? achievement.icon : '🔒' }}
            </div>
            <div class="achievement-card__info">
              <div class="achievement-card__name">{{ achievement.name }}</div>
              <div class="achievement-card__desc">{{ achievement.description }}</div>
            </div>
            <div class="achievement-card__progress" v-if="!achievement.unlocked">
              <div class="progress-mini">
                <div
                  class="progress-mini__fill"
                  :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                ></div>
              </div>
              <span class="progress-text-mini">{{ achievement.progress }}/{{ achievement.target }}</span>
            </div>
            <div class="achievement-card__badge" v-else>
              ✓
            </div>
          </div>
        </div>
      </div>

      <!-- 连续成就 -->
      <div class="category-section">
        <h4 class="category-title">
          <span class="category-icon">🔥</span>
          连续成就
        </h4>
        <div class="achievements-grid">
          <div
            v-for="achievement in streakAchievements"
            :key="achievement.id"
            :class="['achievement-card', { 'achievement-card--unlocked': achievement.unlocked }]"
            @click="showAchievementDetail(achievement)"
          >
            <div class="achievement-card__icon">
              {{ achievement.unlocked ? achievement.icon : '🔒' }}
            </div>
            <div class="achievement-card__info">
              <div class="achievement-card__name">{{ achievement.name }}</div>
              <div class="achievement-card__desc">{{ achievement.description }}</div>
            </div>
            <div class="achievement-card__progress" v-if="!achievement.unlocked">
              <div class="progress-mini">
                <div
                  class="progress-mini__fill"
                  :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                ></div>
              </div>
              <span class="progress-text-mini">{{ achievement.progress }}/{{ achievement.target }}</span>
            </div>
            <div class="achievement-card__badge" v-else>
              ✓
            </div>
          </div>
        </div>
      </div>

      <!-- 特殊成就 -->
      <div class="category-section">
        <h4 class="category-title">
          <span class="category-icon">⭐</span>
          特殊成就
        </h4>
        <div class="achievements-grid">
          <div
            v-for="achievement in specialAchievements"
            :key="achievement.id"
            :class="['achievement-card', { 'achievement-card--unlocked': achievement.unlocked }]"
            @click="showAchievementDetail(achievement)"
          >
            <div class="achievement-card__icon">
              {{ achievement.unlocked ? achievement.icon : '🔒' }}
            </div>
            <div class="achievement-card__info">
              <div class="achievement-card__name">{{ achievement.name }}</div>
              <div class="achievement-card__desc">{{ achievement.description }}</div>
            </div>
            <div class="achievement-card__progress" v-if="!achievement.unlocked">
              <div class="progress-mini">
                <div
                  class="progress-mini__fill"
                  :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                ></div>
              </div>
              <span class="progress-text-mini">{{ achievement.progress }}/{{ achievement.target }}</span>
            </div>
            <div class="achievement-card__badge" v-else>
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就详情对话框 -->
    <div v-if="selectedAchievement" class="detail-overlay" @click="selectedAchievement = null">
      <div class="detail-dialog" @click.stop>
        <div class="detail-dialog__header">
          <div class="detail-dialog__icon">
            {{ selectedAchievement.unlocked ? selectedAchievement.icon : '🔒' }}
          </div>
          <div class="detail-dialog__title">
            {{ selectedAchievement.name }}
          </div>
        </div>
        <div class="detail-dialog__content">
          <p class="detail-dialog__desc">{{ selectedAchievement.description }}</p>
          <div class="detail-dialog__progress">
            <div class="progress-label">进度</div>
            <div class="progress-bar">
              <div
                class="progress-bar__fill"
                :style="{ width: `${(selectedAchievement.progress / selectedAchievement.target) * 100}%` }"
              ></div>
            </div>
            <div class="progress-label">
              {{ selectedAchievement.progress }} / {{ selectedAchievement.target }}
            </div>
          </div>
          <div v-if="selectedAchievement.unlocked" class="detail-dialog__unlocked">
            <span class="unlock-badge">🎉 已解锁</span>
            <span class="unlock-date">{{ formatDate(selectedAchievement.unlockedAt) }}</span>
          </div>
        </div>
        <div class="detail-dialog__footer">
          <button class="close-btn" @click="selectedAchievement = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'special';
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: string;
}

// 状态
const selectedAchievement = ref<Achievement | null>(null);
const achievements = ref<Achievement[]>([]);

// 成就列表
const defaultAchievements: Achievement[] = [
  // 学习成就
  { id: 'first_card', name: '第一张卡片', description: '创建你的第一张卡片', icon: '🌱', category: 'learning', unlocked: false, progress: 0, target: 1 },
  { id: '10_cards', name: '小有所成', description: '累计创建 10 张卡片', icon: '📝', category: 'learning', unlocked: false, progress: 0, target: 10 },
  { id: '50_cards', name: '卡片达人', description: '累计创建 50 张卡片', icon: '📚', category: 'learning', unlocked: false, progress: 0, target: 50 },
  { id: '100_cards', name: '卡片大师', description: '累计创建 100 张卡片', icon: '🎓', category: 'learning', unlocked: false, progress: 0, target: 100 },

  // 连续成就
  { id: 'streak_3', name: '初露锋芒', description: '连续学习 3 天', icon: '🔥', category: 'streak', unlocked: false, progress: 0, target: 3 },
  { id: 'streak_7', name: '持之以恒', description: '连续学习 7 天', icon: '📅', category: 'streak', unlocked: false, progress: 0, target: 7 },
  { id: 'streak_21', name: '习惯养成', description: '连续学习 21 天', icon: '🌟', category: 'streak', unlocked: false, progress: 0, target: 21 },
  { id: 'streak_30', name: '月度达人', description: '连续学习 30 天', icon: '🏅', category: 'streak', unlocked: false, progress: 0, target: 30 },
  { id: 'streak_100', name: '百日挑战', description: '连续学习 100 天', icon: '💎', category: 'streak', unlocked: false, progress: 0, target: 100 },

  // 特殊成就
  { id: 'first_review', name: '首次复习', description: '完成第一次复习', icon: '🔄', category: 'special', unlocked: false, progress: 0, target: 1 },
  { id: 'perfect_score', name: '完美表现', description: '单次复习全部答对', icon: '⭐', category: 'special', unlocked: false, progress: 0, target: 1 },
  { id: 'speed_review', name: '神速进步', description: '1 分钟内完成 10 张卡片复习', icon: '⚡', category: 'special', unlocked: false, progress: 0, target: 10 },
  { id: 'night_owl', name: '夜猫子', description: '在凌晨 0 点后学习', icon: '🦉', category: 'special', unlocked: false, progress: 0, target: 1 },
  { id: 'early_bird', name: '早起鸟', description: '在早上 6 点前学习', icon: '🐦', category: 'special', unlocked: false, progress: 0, target: 1 },
];

// 计算属性
const totalAchievements = computed(() => achievements.value.length);
const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length);
const progressPercent = computed(() => {
  if (totalAchievements.value === 0) return 0;
  return Math.round((unlockedCount.value / totalAchievements.value) * 100);
});

const learningAchievements = computed(() =>
  achievements.value.filter(a => a.category === 'learning')
);

const streakAchievements = computed(() =>
  achievements.value.filter(a => a.category === 'streak')
);

const specialAchievements = computed(() =>
  achievements.value.filter(a => a.category === 'special')
);

// 方法
function refreshAchievements() {
  loadAchievements();
}

function loadAchievements() {
  // 从 localStorage 加载成就
  const stored = localStorage.getItem('review-achievements');
  if (stored) {
    try {
      const savedAchievements = JSON.parse(stored);
      achievements.value = defaultAchievements.map(default => {
        const saved = savedAchievements.find((a: Achievement) => a.id === default.id);
        if (saved) {
          return { ...default, ...saved };
        }
        return default;
      });
    } catch (e) {
      console.error('加载成就失败:', e);
      achievements.value = [...defaultAchievements];
    }
  } else {
    achievements.value = [...defaultAchievements];
  }
}

function saveAchievements() {
  localStorage.setItem('review-achievements', JSON.stringify(achievements.value));
}

function updateAchievement(id: string, progress: number) {
  const achievement = achievements.value.find(a => a.id === id);
  if (achievement && !achievement.unlocked) {
    achievement.progress = progress;
    if (progress >= achievement.target) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date().toISOString();
      showUnlockNotification(achievement);
    }
    saveAchievements();
  }
}

function showUnlockNotification(achievement: Achievement) {
  // 显示成就解锁通知（可以使用 toast 或其他通知方式）
  console.log(`🎉 成就解锁：${achievement.name}`);
}

function showAchievementDetail(achievement: Achievement) {
  selectedAchievement.value = achievement;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 暴露方法给父组件
defineExpose({
  updateAchievement,
  refreshAchievements,
});

// 生命周期
onMounted(() => {
  loadAchievements();
});
</script>

<style scoped lang="scss">
.review-achievements {
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

.refresh-btn {
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
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }
}

.achievements-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--b3-theme-primary);
  }

  &__label {
    font-size: 11px;
    color: var(--b3-theme-color-light);
    margin-top: 4px;
  }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--b3-theme-divider);
  border-radius: 4px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--b3-theme-primary), var(--b3-theme-primary-dark));
    transition: width 0.3s ease;
  }
}

.progress-text {
  font-size: 12px;
  color: var(--b3-theme-color-light);
  min-width: 50px;
  text-align: right;
}

.achievements-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0;

  .category-icon {
    font-size: 18px;
  }
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-theme-divider);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--unlocked {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &__icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 12px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 10px;
    color: var(--b3-theme-color-light);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--b3-theme-success);
    color: white;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 700;
  }
}

.progress-mini {
  width: 50px;
  height: 4px;
  background: var(--b3-theme-divider);
  border-radius: 2px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: var(--b3-theme-primary);
    transition: width 0.3s ease;
  }
}

.progress-text-mini {
  font-size: 9px;
  color: var(--b3-theme-color-light);
}

.detail-overlay {
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

.detail-dialog {
  width: 360px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-theme-divider);
  }

  &__icon {
    font-size: 40px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--b3-theme-color);
  }

  &__content {
    padding: 20px;
  }

  &__desc {
    font-size: 14px;
    color: var(--b3-theme-color);
    margin: 0 0 20px;
    line-height: 1.6;
  }

  &__progress {
    margin-bottom: 20px;
  }

  &__unlocked {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--b3-theme-success-light);
    border-radius: 8px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-theme-divider);
  }
}

.progress-label {
  font-size: 12px;
  color: var(--b3-theme-color-light);
  margin-bottom: 8px;
}

.unlock-badge {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-success);
}

.unlock-date {
  font-size: 12px;
  color: var(--b3-theme-color-light);
}

.close-btn {
  padding: 8px 24px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-background);
  }
}
</style>
