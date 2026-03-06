<!-- src/components/AnnotationList/ExportProgressPanel.vue -->
<template>
  <div class="export-progress-panel">
    <div
      class="panel-overlay"
      @click="isExporting ? null : close"
    ></div>
    <div class="panel-content">
      <div class="panel-header">
        <h3>导出进度</h3>
        <div class="progress-summary">
          <span class="count">{{ completedCount }}/{{ totalCount }}</span>
          <span
            class="status-badge"
            :class="currentStatus"
          >
            <span
              v-if="currentStatus === 'pending'"
              class="status-icon"
            >⏸️</span>
            <span
              v-else-if="currentStatus === 'processing'"
              class="status-icon"
            >⏳</span>
            <span
              v-else-if="currentStatus === 'success'"
              class="status-icon"
            >✅</span>
            <span
              v-else-if="currentStatus === 'error'"
              class="status-icon"
            >❌</span>
          </span>
        </div>
      </div>

      <div class="panel-body">
        <!-- 进度条 -->
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            >
              <span
                v-if="progressPercentage > 10"
                class="progress-text"
              >
                {{ Math.round(progressPercentage) }}%
              </span>
            </div>
          </div>
          <div class="progress-stats">
            <span>成功：{{ successCount }}</span>
            <span
              v-if="errorCount > 0"
              class="error-stat"
            >失败：{{ errorCount }}</span>
          </div>
        </div>

        <!-- 详细列表 -->
        <div class="progress-details">
          <transition-group name="list">
            <div
              v-for="item in exportItems"
              :key="item.id"
              class="export-item"
              :class="item.status"
            >
              <div class="item-info">
                <span class="item-icon">
                  <span
                    v-if="item.status === 'pending'"
                    class="pending-icon"
                  >⏸️</span>
                  <span
                    v-else-if="item.status === 'processing'"
                    class="processing-icon"
                  >
                    <svg
                      class="spinner"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-dasharray="60"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>
                  <span
                    v-else-if="item.status === 'success'"
                    class="success-icon"
                  >✓</span>
                  <span
                    v-else-if="item.status === 'error'"
                    class="error-icon"
                  >✗</span>
                </span>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <div class="item-status">
                <span
                  v-if="item.status === 'pending'"
                  class="status-pending"
                >待处理</span>
                <span
                  v-else-if="item.status === 'processing'"
                  class="status-processing"
                >处理中</span>
                <span
                  v-else-if="item.status === 'success'"
                  class="status-success"
                >完成</span>
                <span
                  v-else-if="item.status === 'error'"
                  class="status-error"
                >{{ item.error || '失败' }}</span>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <div class="panel-footer">
        <button
          v-if="!isComplete"
          class="cancel-btn"
          :disabled="!isExporting"
          @click="cancelExport"
        >
          取消导出
        </button>
        <button
          v-if="isComplete"
          class="open-folder-btn"
          @click="openOutputFolder"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
          打开导出文件夹
        </button>
        <button
          v-if="isComplete && errorCount === 0"
          class="done-btn"
          @click="close"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExportProgressItem } from '../../services/batchExportService'
import {
  computed,
  onMounted,
  reactive,
  ref,
} from 'vue'

const props = defineProps<{
  items: Array<{
    id: string
    name: string
    data: any
  }>
  exportFn: (item: any) => Promise<void>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'complete', successCount: number, errorCount: number): void
}>()

const exportItems = reactive<ExportProgressItem[]>(
  props.items.map((item) => ({
    id: item.id,
    name: item.name,
    status: 'pending',
  })),
)

const isExporting = ref(false)
const isComplete = ref(false)
const cancelled = ref(false)

// 计算属性
const totalCount = computed(() => exportItems.length)
const completedCount = computed(() =>
  exportItems.filter((item) => item.status === 'success' || item.status === 'error').length,
)
const successCount = computed(() =>
  exportItems.filter((item) => item.status === 'success').length,
)
const errorCount = computed(() =>
  exportItems.filter((item) => item.status === 'error').length,
)
const progressPercentage = computed(() =>
  totalCount.value > 0 ? (completedCount.value / totalCount.value) * 100 : 0,
)

const currentStatus = computed(() => {
  if (isExporting.value) return 'processing'
  if (errorCount.value > 0) return 'error'
  if (completedCount.value === totalCount.value) return 'success'
  return 'pending'
})

// 开始导出
onMounted(() => {
  startExport()
})

async function startExport() {
  isExporting.value = true
  cancelled.value = false

  for (let i = 0; i < props.items.length; i++) {
    if (cancelled.value) {
      // 取消导出，标记剩余项为错误
      for (let j = i; j < exportItems.length; j++) {
        exportItems[j].status = 'error'
        exportItems[j].error = '已取消'
      }
      break
    }

    const item = props.items[i]
    const progressItem = exportItems[i]

    // 标记为处理中
    progressItem.status = 'processing'

    try {
      // 执行导出
      await props.exportFn(item.data)
      progressItem.status = 'success'
    } catch (error) {
      progressItem.status = 'error'
      progressItem.error = error instanceof Error ? error.message : '导出失败'
    }

    // 等待一小段时间，让用户看到进度
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  isExporting.value = false
  isComplete.value = true

  // 发出完成事件
  emit('complete', successCount.value, errorCount.value)
}

// 取消导出
function cancelExport() {
  if (!isExporting.value) return
  cancelled.value = true
}

// 打开导出文件夹
function openOutputFolder() {
  // TODO: 实现打开导出文件夹功能
  alert('导出文件夹功能待实现')
}

// 关闭面板
function close() {
  emit('close')
}
</script>

<style scoped lang="scss">
.export-progress-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.panel-content {
  position: relative;
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: panel-slide-up 0.3s ease-out;
}

@keyframes panel-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-background);
  }

  .progress-summary {
    display: flex;
    align-items: center;
    gap: 12px;

    .count {
      font-size: 14px;
      font-weight: 600;
      color: var(--b3-theme-primary);
    }

    .status-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--b3-theme-surface);

      .status-icon {
        font-size: 14px;
      }
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.progress-bar-container {
  margin-bottom: 20px;
}

.progress-bar {
  height: 24px;
  background: var(--b3-theme-surface);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--b3-theme-primary),
    var(--b3-theme-primary-light)
  );
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  position: relative;
  z-index: 1;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);

  .error-stat {
    color: var(--b3-theme-danger);
  }
}

.progress-details {
  max-height: 300px;
  overflow-y: auto;
}

.export-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin: 6px 0;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  transition: all 0.2s;

  &.pending {
    opacity: 0.6;
  }

  &.processing {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-lightest);
  }

  &.success {
    border-color: var(--b3-theme-success);
    background: rgba(76, 175, 80, 0.1);
  }

  &.error {
    border-color: var(--b3-theme-danger);
    background: rgba(244, 67, 54, 0.1);
  }
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;

  .pending-icon,
  .success-icon,
  .error-icon {
    font-size: 14px;
    font-weight: bold;
  }

  .success-icon {
    color: var(--b3-theme-success);
  }

  .error-icon {
    color: var(--b3-theme-danger);
  }

  .processing-icon {
    color: var(--b3-theme-primary);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.item-name {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-status {
  flex-shrink: 0;
  margin-left: 12px;
}

.status-pending,
.status-processing,
.status-success,
.status-error {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status-pending {
  color: var(--b3-theme-on-surface-light);
  background: var(--b3-theme-surface-light);
}

.status-processing {
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-lightest);
}

.status-success {
  color: var(--b3-theme-success);
  background: rgba(76, 175, 80, 0.1);
}

.status-error {
  color: var(--b3-theme-danger);
  background: rgba(244, 67, 54, 0.1);
}

// 列表动画
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.cancel-btn,
.open-folder-btn,
.done-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cancel-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--b3-theme-surface-light);
  }
}

.open-folder-btn,
.done-btn {
  background: var(--b3-theme-primary);
  color: white;
  border: none;

  &:hover {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
