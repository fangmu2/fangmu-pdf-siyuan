<!-- src/components/ReviewModeSelector.vue - 复习模式选择器组件 -->
<template>
  <div class="review-mode-selector">
    <div class="mode-header">
      <h3 class="mode-title">
        📚 复习模式
      </h3>
      <p class="mode-desc">
        选择适合你的复习方式
      </p>
    </div>

    <div class="mode-grid">
      <!-- 普通复习 -->
      <div
        class="mode-card"
        :class="[{ active: modelValue === 'normal' }]"
        @click="$emit('update:modelValue', 'normal')"
      >
        <div class="mode-card__icon">
          📖
        </div>
        <div class="mode-card__content">
          <h4 class="mode-card__title">
            普通复习
          </h4>
          <p class="mode-card__desc">
            复习所有到期的卡片
          </p>
          <div class="mode-card__meta">
            <span class="meta-item">
              <span class="meta-label">到期</span>
              <span class="meta-value">{{ dueCount }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">预计</span>
              <span class="meta-value">{{ estimatedMinutes }}分钟</span>
            </span>
          </div>
        </div>
        <div class="mode-card__indicator"></div>
      </div>

      <!-- 学习新卡 -->
      <div
        class="mode-card"
        :class="[{ active: modelValue === 'new' }]"
        @click="$emit('update:modelValue', 'new')"
      >
        <div class="mode-card__icon">
          🆕
        </div>
        <div class="mode-card__content">
          <h4 class="mode-card__title">
            学习新卡
          </h4>
          <p class="mode-card__desc">
            学习还未学过的卡片
          </p>
          <div class="mode-card__meta">
            <span class="meta-item">
              <span class="meta-label">新卡</span>
              <span class="meta-value">{{ newCount }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">上限</span>
              <span class="meta-value">{{ dailyNewLimit }}</span>
            </span>
          </div>
        </div>
        <div class="mode-card__indicator"></div>
      </div>

      <!-- 错题复习 -->
      <div
        class="mode-card"
        :class="[{ active: modelValue === 'wrong' }]"
        @click="$emit('update:modelValue', 'wrong')"
      >
        <div class="mode-card__icon">
          ❌
        </div>
        <div class="mode-card__content">
          <h4 class="mode-card__title">
            错题复习
          </h4>
          <p class="mode-card__desc">
            重点复习经常出错的卡片
          </p>
          <div class="mode-card__meta">
            <span class="meta-item">
              <span class="meta-label">错题</span>
              <span class="meta-value">{{ wrongCount }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">掌握率</span>
              <span class="meta-value">{{ masteryRate }}%</span>
            </span>
          </div>
        </div>
        <div class="mode-card__indicator"></div>
      </div>

      <!-- 随机测试 -->
      <div
        class="mode-card"
        :class="[{ active: modelValue === 'random' }]"
        @click="$emit('update:modelValue', 'random')"
      >
        <div class="mode-card__icon">
          🎲
        </div>
        <div class="mode-card__content">
          <h4 class="mode-card__title">
            随机测试
          </h4>
          <p class="mode-card__desc">
            随机抽取卡片进行自测
          </p>
          <div class="mode-card__meta">
            <span class="meta-item">
              <span class="meta-label">总数</span>
              <span class="meta-value">{{ totalCount }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">抽取</span>
              <span class="meta-value">{{ randomCount }}</span>
            </span>
          </div>
        </div>
        <div class="mode-card__indicator"></div>
      </div>
    </div>

    <!-- 高级模式 -->
    <div class="advanced-section">
      <div class="advanced-header">
        <h4 class="advanced-title">
          ⚙️ 高级设置
        </h4>
        <button
          class="toggle-btn"
          @click="showAdvanced = !showAdvanced"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            :class="{ 'rotate-180': showAdvanced }"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      </div>

      <div
        v-show="showAdvanced"
        class="advanced-content"
      >
        <!-- 复习数量设置 -->
        <div class="setting-row">
          <label class="setting-label">复习数量</label>
          <div class="setting-inputs">
            <div class="input-group">
              <span class="input-label">最少</span>
              <input
                v-model.number="minCards"
                type="number"
                min="1"
                class="setting-input"
              />
            </div>
            <div class="input-group">
              <span class="input-label">最多</span>
              <input
                v-model.number="maxCards"
                type="number"
                min="1"
                class="setting-input"
              />
            </div>
          </div>
        </div>

        <!-- 时间限制 -->
        <div class="setting-row">
          <label class="setting-label">时间限制</label>
          <div class="time-limit-options">
            <button
              class="time-option"
              :class="[{ active: timeLimit === 0 }]"
              @click="timeLimit = 0"
            >
              无限制
            </button>
            <button
              class="time-option"
              :class="[{ active: timeLimit === 15 }]"
              @click="timeLimit = 15"
            >
              15 分钟
            </button>
            <button
              class="time-option"
              :class="[{ active: timeLimit === 30 }]"
              @click="timeLimit = 30"
            >
              30 分钟
            </button>
            <button
              class="time-option"
              :class="[{ active: timeLimit === 60 }]"
              @click="timeLimit = 60"
            >
              60 分钟
            </button>
          </div>
        </div>

        <!-- 卡片顺序 -->
        <div class="setting-row">
          <label class="setting-label">卡片顺序</label>
          <div class="order-options">
            <button
              class="order-option"
              :class="[{ active: cardOrder === 'due' }]"
              @click="cardOrder = 'due'"
            >
              到期时间
            </button>
            <button
              class="order-option"
              :class="[{ active: cardOrder === 'difficulty' }]"
              @click="cardOrder = 'difficulty'"
            >
              难度优先
            </button>
            <button
              class="order-option"
              :class="[{ active: cardOrder === 'random' }]"
              @click="cardOrder = 'random'"
            >
              随机排序
            </button>
            <button
              class="order-option"
              :class="[{ active: cardOrder === 'alphabetical' }]"
              @click="cardOrder = 'alphabetical'"
            >
              字母顺序
            </button>
          </div>
        </div>

        <!-- 显示选项 -->
        <div class="setting-row">
          <label class="setting-label">显示选项</label>
          <div class="display-options">
            <label class="display-option">
              <input
                v-model="showHints"
                type="checkbox"
                class="display-checkbox"
              />
              <span class="display-text">显示提示</span>
            </label>
            <label class="display-option">
              <input
                v-model="showExplanation"
                type="checkbox"
                class="display-checkbox"
              />
              <span class="display-text">显示解析</span>
            </label>
            <label class="display-option">
              <input
                v-model="autoPlay"
                type="checkbox"
                class="display-checkbox"
              />
              <span class="display-text">自动播放</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 开始按钮 -->
    <div class="start-section">
      <button
        class="start-btn"
        @click="startReview"
      >
        <span class="start-btn__icon">🚀</span>
        <span class="start-btn__text">开始复习</span>
        <span class="start-btn__count">{{ selectedCount }} 张卡片</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watch,
} from 'vue'

interface Props {
  modelValue?: string
  dueCount?: number
  newCount?: number
  wrongCount?: number
  totalCount?: number
  dailyNewLimit?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'normal',
  dueCount: 0,
  newCount: 0,
  wrongCount: 0,
  totalCount: 0,
  dailyNewLimit: 20,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'start', options: ReviewOptions): void
}>()

interface ReviewOptions {
  mode: string
  minCards: number
  maxCards: number
  timeLimit: number
  cardOrder: string
  showHints: boolean
  showExplanation: boolean
  autoPlay: boolean
}

// 状态
const showAdvanced = ref(false)
const minCards = ref(10)
const maxCards = ref(50)
const timeLimit = ref(0)
const cardOrder = ref('due')
const showHints = ref(true)
const showExplanation = ref(true)
const autoPlay = ref(false)
const randomCount = ref(10)

// 计算属性
const estimatedMinutes = computed(() => {
  return Math.round(props.dueCount * 0.5)
})

const masteryRate = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round(((props.totalCount - props.wrongCount) / props.totalCount) * 100)
})

const selectedCount = computed(() => {
  switch (props.modelValue) {
    case 'normal':
      return props.dueCount
    case 'new':
      return Math.min(props.newCount, props.dailyNewLimit)
    case 'wrong':
      return props.wrongCount
    case 'random':
      return randomCount.value
    default:
      return 0
  }
})

// 方法
function startReview() {
  emit('start', {
    mode: props.modelValue,
    minCards: minCards.value,
    maxCards: maxCards.value,
    timeLimit: timeLimit.value,
    cardOrder: cardOrder.value,
    showHints: showHints.value,
    showExplanation: showExplanation.value,
    autoPlay: autoPlay.value,
  })
}

// 监听模式变化
watch(() => props.modelValue, (newMode) => {
  // 根据模式调整默认值
  if (newMode === 'random') {
    randomCount.value = Math.min(10, props.totalCount)
  }
})
</script>

<style scoped lang="scss">
.review-mode-selector {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--b3-theme-background);
}

.mode-header {
  text-align: center;
}

.mode-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0 0 8px;
}

.mode-desc {
  font-size: 13px;
  color: var(--b3-theme-color-light);
  margin: 0;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 2px solid var(--b3-theme-divider);
  border-radius: 12px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);

    .mode-card__indicator {
      opacity: 1;
    }
  }

  &__icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0 0 6px;
  }

  &__desc {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    margin: 0 0 12px;
  }

  &__indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 20px;
    height: 20px;
    border: 2px solid var(--b3-theme-divider);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: var(--b3-theme-primary);
      border-radius: 50%;
    }
  }
}

.mode-card__meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 10px;
  color: var(--b3-theme-color-light);
  text-transform: uppercase;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-primary);
}

.advanced-section {
  border: 1px solid var(--b3-theme-divider);
  border-radius: 12px;
  overflow: hidden;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--b3-theme-surface);
  cursor: pointer;
}

.advanced-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: transform 0.2s;

  svg {
    transition: transform 0.2s;

    &.rotate-180 {
      transform: rotate(180deg);
    }
  }
}

.advanced-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.setting-inputs {
  display: flex;
  gap: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-label {
  font-size: 12px;
  color: var(--b3-theme-color-light);
  white-space: nowrap;
}

.setting-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 14px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.time-limit-options,
.order-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.time-option,
.order-option {
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.display-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.display-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.display-checkbox {
  width: 18px;
  height: 18px;
}

.display-text {
  font-size: 13px;
  color: var(--b3-theme-color);
}

.start-section {
  padding-top: 16px;
  border-top: 1px solid var(--b3-theme-divider);
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--b3-theme-primary), var(--b3-theme-primary-dark));
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &__icon {
    font-size: 24px;
  }

  &__text {
    flex: 1;
  }

  &__count {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 13px;
  }
}
</style>
