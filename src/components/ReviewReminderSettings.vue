<!-- src/components/ReviewReminderSettings.vue - 复习提醒设置组件 -->
<template>
  <div class="review-reminder-settings">
    <div class="settings-header">
      <h3 class="settings-title">
        🔔 复习提醒
      </h3>
      <div class="settings-toggle">
        <label class="toggle-label">
          <input
            v-model="enabled"
            type="checkbox"
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div
      v-if="enabled"
      class="settings-content"
    >
      <!-- 提醒时间 -->
      <div class="setting-section">
        <label class="section-label">提醒时间</label>
        <div class="time-inputs">
          <div class="time-input-group">
            <input
              v-model.number="reminderHour"
              type="number"
              min="0"
              max="23"
              class="time-input"
            />
            <span class="time-separator">:</span>
            <input
              v-model.number="reminderMinute"
              type="number"
              min="0"
              max="59"
              class="time-input"
            />
          </div>
          <button
            class="add-time-btn"
            @click="addReminderTime"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
        <div class="reminder-times-list">
          <div
            v-for="(time, index) in reminderTimes"
            :key="index"
            class="reminder-time-item"
          >
            <span class="time-display">
              {{ String(time.hour).padStart(2, '0') }}:{{ String(time.minute).padStart(2, '0') }}
            </span>
            <button
              class="remove-time-btn"
              @click="removeReminderTime(index)"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 提醒频率 -->
      <div class="setting-section">
        <label class="section-label">提醒频率</label>
        <div class="frequency-options">
          <button
            class="frequency-option"
            :class="[{ active: frequency === 'daily' }]"
            @click="frequency = 'daily'"
          >
            每天
          </button>
          <button
            class="frequency-option"
            :class="[{ active: frequency === 'weekdays' }]"
            @click="frequency = 'weekdays'"
          >
            工作日
          </button>
          <button
            class="frequency-option"
            :class="[{ active: frequency === 'weekends' }]"
            @click="frequency = 'weekends'"
          >
            周末
          </button>
          <button
            class="frequency-option"
            :class="[{ active: frequency === 'custom' }]"
            @click="frequency = 'custom'"
          >
            自定义
          </button>
        </div>
      </div>

      <!-- 自定义星期 -->
      <div
        v-if="frequency === 'custom'"
        class="setting-section"
      >
        <label class="section-label">选择日期</label>
        <div class="weekday-selector">
          <button
            v-for="(day, index) in weekDays"
            :key="day.id"
            class="weekday-btn"
            :class="[{ active: day.selected }]"
            @click="toggleWeekday(index)"
          >
            {{ day.short }}
          </button>
        </div>
      </div>

      <!-- 提醒内容 -->
      <div class="setting-section">
        <label class="section-label">提醒内容</label>
        <div class="content-options">
          <label class="content-option">
            <input
              v-model="showDueCount"
              type="checkbox"
              class="content-checkbox"
            />
            <span class="content-text">显示到期卡片数量</span>
          </label>
          <label class="content-option">
            <input
              v-model="showStreak"
              type="checkbox"
              class="content-checkbox"
            />
            <span class="content-text">显示连续学习天数</span>
          </label>
          <label class="content-option">
            <input
              v-model="showMotivation"
              type="checkbox"
              class="content-checkbox"
            />
            <span class="content-text">显示激励语句</span>
          </label>
        </div>
      </div>

      <!-- 通知方式 -->
      <div class="setting-section">
        <label class="section-label">通知方式</label>
        <div class="notification-options">
          <label class="notification-option">
            <input
              v-model="useSystemNotification"
              type="checkbox"
              class="notification-checkbox"
            />
            <span class="notification-text">系统通知</span>
          </label>
          <label class="notification-option">
            <input
              v-model="useSound"
              type="checkbox"
              class="notification-checkbox"
            />
            <span class="notification-text">提示音</span>
          </label>
          <label class="notification-option">
            <input
              v-model="useBadge"
              type="checkbox"
              class="notification-checkbox"
            />
            <span class="notification-text">图标徽章</span>
          </label>
        </div>
      </div>

      <!-- 激励语句库 -->
      <div class="setting-section">
        <label class="section-label">激励语句</label>
        <div class="motivation-preview">
          <p class="motivation-text">
            "{{ currentMotivation }}"
          </p>
        </div>
        <div class="motivation-actions">
          <button
            class="preview-btn"
            @click="nextMotivation"
          >
            换一句
          </button>
          <button
            class="add-btn"
            @click="showAddMotivation = true"
          >
            添加自定义
          </button>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="settings-actions">
        <button
          class="reset-btn"
          @click="resetSettings"
        >
          重置
        </button>
        <button
          class="save-btn"
          @click="saveSettings"
        >
          保存设置
        </button>
      </div>
    </div>

    <!-- 添加自定义激励语句对话框 -->
    <div
      v-if="showAddMotivation"
      class="modal-overlay"
      @click="showAddMotivation = false"
    >
      <div
        class="modal-dialog"
        @click.stop
      >
        <h4 class="modal-title">
          添加激励语句
        </h4>
        <textarea
          v-model="newMotivation"
          class="modal-textarea"
          placeholder="输入激励语句..."
          rows="3"
        ></textarea>
        <div class="modal-actions">
          <button
            class="modal-cancel"
            @click="showAddMotivation = false"
          >
            取消
          </button>
          <button
            class="modal-confirm"
            @click="addMotivation"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'

// 状态
const enabled = ref(false)
const reminderTimes = ref<Array<{ hour: number, minute: number }>>([
  {
    hour: 9,
    minute: 0,
  },
  {
    hour: 21,
    minute: 0,
  },
])
const reminderHour = ref(9)
const reminderMinute = ref(0)
const frequency = ref<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily')
const weekDays = ref([
  {
    id: 0,
    short: '日',
    full: '星期日',
    selected: true,
  },
  {
    id: 1,
    short: '一',
    full: '星期一',
    selected: true,
  },
  {
    id: 2,
    short: '二',
    full: '星期二',
    selected: true,
  },
  {
    id: 3,
    short: '三',
    full: '星期三',
    selected: true,
  },
  {
    id: 4,
    short: '四',
    full: '星期四',
    selected: true,
  },
  {
    id: 5,
    short: '五',
    full: '星期五',
    selected: true,
  },
  {
    id: 6,
    short: '六',
    full: '星期六',
    selected: true,
  },
])
const showDueCount = ref(true)
const showStreak = ref(true)
const showMotivation = ref(true)
const useSystemNotification = ref(true)
const useSound = ref(false)
const useBadge = ref(true)
const showAddMotivation = ref(false)
const newMotivation = ref('')

// 激励语句库
const motivations = ref([
  '学习是一种习惯，坚持是一种力量！',
  '每天进步一点点，成就更好的自己！',
  '复习是记忆的保鲜剂！',
  '今天的努力，是明天的收获！',
  '知识改变命运，学习成就未来！',
  '不积跬步，无以至千里！',
  '温故而知新，可以为师矣！',
  '学而不思则罔，思而不学则殆！',
])

const currentMotivationIndex = ref(0)
const currentMotivation = computed(() => motivations.value[currentMotivationIndex.value])

// 方法
function addReminderTime() {
  const newTime = {
    hour: reminderHour.value,
    minute: reminderMinute.value,
  }
  // 检查是否已存在
  const exists = reminderTimes.value.some(
    (t) => t.hour === newTime.hour && t.minute === newTime.minute,
  )
  if (!exists) {
    reminderTimes.value.push(newTime)
    // 排序
    reminderTimes.value.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
  }
}

function removeReminderTime(index: number) {
  reminderTimes.value.splice(index, 1)
}

function toggleWeekday(index: number) {
  weekDays.value[index].selected = !weekDays.value[index].selected
}

function nextMotivation() {
  currentMotivationIndex.value = (currentMotivationIndex.value + 1) % motivations.value.length
}

function addMotivation() {
  if (newMotivation.value.trim()) {
    motivations.value.push(newMotivation.value.trim())
    newMotivation.value = ''
    showAddMotivation.value = false
  }
}

function saveSettings() {
  const settings = {
    enabled: enabled.value,
    reminderTimes: reminderTimes.value,
    frequency: frequency.value,
    weekDays: weekDays.value.map((d) => d.selected),
    showDueCount: showDueCount.value,
    showStreak: showStreak.value,
    showMotivation: showMotivation.value,
    useSystemNotification: useSystemNotification.value,
    useSound: useSound.value,
    useBadge: useBadge.value,
    motivations: motivations.value,
  }
  localStorage.setItem('review-reminder-settings', JSON.stringify(settings))

  // 注册提醒
  if (enabled.value) {
    registerReminders()
  } else {
    unregisterReminders()
  }
}

function loadSettings() {
  const stored = localStorage.getItem('review-reminder-settings')
  if (stored) {
    try {
      const settings = JSON.parse(stored)
      enabled.value = settings.enabled ?? false
      reminderTimes.value = settings.reminderTimes ?? [{
        hour: 9,
        minute: 0,
      }, {
        hour: 21,
        minute: 0,
      }]
      frequency.value = settings.frequency ?? 'daily'
      weekDays.value.forEach((day, i) => {
        day.selected = settings.weekDays?.[i] ?? true
      })
      showDueCount.value = settings.showDueCount ?? true
      showStreak.value = settings.showStreak ?? true
      showMotivation.value = settings.showMotivation ?? true
      useSystemNotification.value = settings.useSystemNotification ?? true
      useSound.value = settings.useSound ?? false
      useBadge.value = settings.useBadge ?? true
      if (settings.motivations) {
        motivations.value = settings.motivations
      }
    } catch (e) {
      console.error('加载提醒设置失败:', e)
    }
  }
}

function resetSettings() {
  enabled.value = false
  reminderTimes.value = [{
    hour: 9,
    minute: 0,
  }, {
    hour: 21,
    minute: 0,
  }]
  frequency.value = 'daily'
  weekDays.value.forEach((day) => day.selected = true)
  showDueCount.value = true
  showStreak.value = true
  showMotivation.value = true
  useSystemNotification.value = true
  useSound.value = false
  useBadge.value = true
}

function registerReminders() {
  // 请求通知权限
  if (useSystemNotification.value && 'Notification' in window) {
    Notification.requestPermission()
  }

  // 设置提醒定时器
  reminderTimes.value.forEach((time) => {
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(time.hour, time.minute, 0, 0)

    // 如果提醒时间已过，设置为明天
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const delay = reminderTime.getTime() - now.getTime()
    setTimeout(() => {
      showReminder()
      // 每天重复
      setInterval(() => {
        showReminder()
      }, 24 * 60 * 60 * 1000)
    }, delay)
  })
}

function unregisterReminders() {
  // 清除所有提醒定时器
  // 实际实现中需要保存定时器 ID 以便清除
}

function showReminder() {
  // 系统通知
  if (useSystemNotification.value && 'Notification' in window && Notification.permission === 'granted') {
    let body = '该复习啦！'
    if (showDueCount.value) {
      body += ' 今天有到期卡片等待复习。'
    }
    if (showStreak.value) {
      body += ' 保持你的连续学习记录！'
    }
    if (showMotivation.value) {
      body += ` "${currentMotivation.value}"`
    }

    new Notification('复习提醒', {
      body,
      icon: '/icon.png',
    })
  }

  // 提示音
  if (useSound.value) {
    // 播放提示音
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {})
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.review-reminder-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--b3-theme-background);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0;
}

.settings-toggle {
  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .toggle-checkbox {
    display: none;

    &:checked + .toggle-slider {
      background: var(--b3-theme-primary);

      &::before {
        transform: translateX(20px);
      }
    }
  }

  .toggle-slider {
    position: relative;
    display: block;
    width: 44px;
    height: 24px;
    background: var(--b3-theme-divider);
    border-radius: 12px;
    transition: background 0.2s;

    &::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 50px;
  padding: 8px;
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

.time-separator {
  font-size: 16px;
  color: var(--b3-theme-color);
}

.add-time-btn {
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
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.reminder-times-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reminder-time-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--b3-theme-surface);
  border-radius: 20px;
  font-size: 13px;
}

.time-display {
  color: var(--b3-theme-color);
}

.remove-time-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color-light);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ff4444;
    color: white;
  }
}

.frequency-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.frequency-option {
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
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

.weekday-selector {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.weekday-btn {
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
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

.content-options,
.notification-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.content-option,
.notification-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.content-checkbox,
.notification-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.content-text,
.notification-text {
  font-size: 13px;
  color: var(--b3-theme-color);
}

.motivation-preview {
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border-left: 4px solid var(--b3-theme-primary);
}

.motivation-text {
  font-size: 14px;
  color: var(--b3-theme-color);
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}

.motivation-actions {
  display: flex;
  gap: 8px;
}

.preview-btn,
.add-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);

  &:hover {
    background: var(--b3-theme-background);
  }
}

.add-btn {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
  border-color: var(--b3-theme-primary);

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.settings-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--b3-theme-divider);
}

.reset-btn,
.save-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);

  &:hover {
    background: var(--b3-theme-background);
  }
}

.save-btn {
  background: var(--b3-theme-primary);
  border-color: var(--b3-theme-primary);
  color: white;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}

.modal-overlay {
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

.modal-dialog {
  width: 400px;
  padding: 24px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0 0 16px;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 16px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-cancel,
.modal-confirm {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-cancel {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);

  &:hover {
    background: var(--b3-theme-background);
  }
}

.modal-confirm {
  background: var(--b3-theme-primary);
  border-color: var(--b3-theme-primary);
  color: white;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}
</style>
