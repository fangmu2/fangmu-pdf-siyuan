<template>
  <div class="time-editor">
    <!-- 菜单项 -->
    <div
      class="menu-item"
      @click="showTimeEditor"
    >
      <span class="menu-icon">🕒</span>
      <span class="menu-text">设置时间</span>
      <span class="time-preview">{{ displayTimeText }}</span>
    </div>

    <!-- 编辑面板 -->
    <div
      v-if="isEditing"
      class="editor-panel"
    >
      <div class="editor-header">
        <span class="editor-title">设置节点时间</span>
        <button
          class="close-btn"
          @click="cancelEdit"
        >
          ×
        </button>
      </div>

      <div class="editor-content">
        <label class="editor-label">选择日期和时间：</label>
        <input
          v-model="selectedTime"
          type="datetime-local"
          class="time-input"
          autofocus
        />

        <div class="button-group">
          <button
            class="btn btn-primary"
            @click="saveTime"
          >
            保存
          </button>
          <button
            class="btn btn-danger"
            @click="clearTime"
          >
            清除
          </button>
          <button
            class="btn btn-secondary"
            @click="cancelEdit"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 节点时间编辑器组件
 * 用于设置和编辑节点的时间戳（时间轴布局用）
 */

import {
  computed,
  ref,
} from 'vue'

interface Props {
  /** 节点 ID */
  nodeId: string
  /** 当前时间戳 */
  timestamp?: number
  /** 节点标题 */
  nodeTitle: string
}

interface Emits {
  (e: 'update', nodeId: string, timestamp: number | undefined): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 编辑状态
const isEditing = ref(false)

// 时间选择器值
const selectedTime = ref<string>('')

// 格式化时间为输入框格式
function formatForInput(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 初始化时间选择器
function initTimePicker(): void {
  if (props.timestamp) {
    selectedTime.value = formatForInput(props.timestamp)
  } else {
    // 默认当前时间
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    selectedTime.value = now.toISOString().slice(0, 16)
  }
}

// 显示时间编辑器
function showTimeEditor(): void {
  initTimePicker()
  isEditing.value = true
}

// 保存时间
function saveTime(): void {
  if (!selectedTime.value) {
    emit('update', props.nodeId, undefined)
    isEditing.value = false
    emit('close')
    return
  }

  const timestamp = new Date(selectedTime.value).getTime()
  emit('update', props.nodeId, timestamp)
  isEditing.value = false
  emit('close')
}

// 清除时间
function clearTime(): void {
  emit('update', props.nodeId, undefined)
  isEditing.value = false
  emit('close')
}

// 取消编辑
function cancelEdit(): void {
  isEditing.value = false
  emit('close')
}

// 显示的时间文本
const displayTimeText = computed(() => {
  if (!props.timestamp) {
    return '未设置时间'
  }

  const date = new Date(props.timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<style scoped>
.time-editor {
  position: relative;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}

.menu-item:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.menu-icon {
  font-size: 16px;
}

.menu-text {
  font-size: 14px;
  color: var(--siyuan-text, #333);
}

.time-preview {
  margin-left: auto;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
}

.editor-panel {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 300px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.editor-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: var(--siyuan-secondary-text, #999);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
  color: var(--siyuan-text, #333);
}

.editor-content {
  padding: 16px;
}

.editor-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
}

.time-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--siyuan-border, #d0d0d0);
  border-radius: 4px;
  background: var(--siyuan-bg, #fff);
  color: var(--siyuan-text, #333);
  outline: none;
  transition: border-color 0.2s;
}

.time-input:focus {
  border-color: var(--siyuan-primary, #409eff);
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-danger {
  background: var(--siyuan-danger, #f56c6c);
  color: #fff;
}

.btn-danger:hover {
  background: #f78989;
}

.btn-secondary {
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #d0d0d0);
}

.btn-secondary:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .editor-panel {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .editor-header {
    background: var(--siyuan-bg-secondary, #333);
    border-color: var(--siyuan-border, #444);
  }

  .editor-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .menu-text {
    color: var(--siyuan-text, #e0e0e0);
  }

  .menu-item:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .time-input {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .time-input:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .btn-secondary {
    background: var(--siyuan-bg-secondary, #333);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .btn-secondary:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }
}
</style>
