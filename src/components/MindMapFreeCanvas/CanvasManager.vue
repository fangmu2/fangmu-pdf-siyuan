<template>
  <div class="canvas-manager">
    <!-- 画布选择器 -->
    <div
      class="canvas-selector"
      @click="showCanvasList = !showCanvasList"
    >
      <div class="canvas-selector-current">
        <span class="canvas-icon">🎨</span>
        <span class="canvas-name">
          {{ activeCanvas?.name || '选择画布' }}
        </span>
        <span class="canvas-arrow">{{ showCanvasList ? '▲' : '▼' }}</span>
      </div>

      <!-- 画布列表下拉 -->
      <transition name="slide">
        <div
          v-if="showCanvasList"
          class="canvas-list-dropdown"
        >
          <div class="canvas-list-header">
            <span>画布列表</span>
            <button
              class="btn-create"
              @click.stop="showCreateDialog = true"
            >
              <span class="icon">+</span> 新建
            </button>
          </div>

          <div
            v-if="isLoading"
            class="canvas-list-loading"
          >
            <span class="loading-spinner">⏳</span>
            <span>加载中...</span>
          </div>

          <div
            v-else-if="canvasList.length === 0"
            class="canvas-list-empty"
          >
            <span class="empty-icon">📭</span>
            <span>暂无画布</span>
            <button
              class="btn-create-empty"
              @click.stop="showCreateDialog = true"
            >
              创建第一个画布
            </button>
          </div>

          <div
            v-else
            class="canvas-list-items"
          >
            <div
              v-for="item in canvasList"
              :key="item.id"
              class="canvas-list-item"
              :class="{ active: item.isActive }"
              @click="handleSwitchCanvas(item.id)"
            >
              <div class="canvas-item-info">
                <span class="canvas-item-icon">🎨</span>
                <div class="canvas-item-text">
                  <span class="canvas-item-name">{{ item.name }}</span>
                  <span class="canvas-item-meta">
                    {{ item.nodeCount }} 个节点 · {{ formatTime(item.lastUpdatedAt) }}
                  </span>
                </div>
              </div>
              <div class="canvas-item-actions">
                <button
                  class="btn-icon btn-rename"
                  title="重命名"
                  @click.stop="handleRenameCanvas(item, $event)"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon btn-delete"
                  title="删除"
                  @click.stop="handleDeleteCanvas(item.id, $event)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="error-message"
    >
      <span class="error-icon">⚠️</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 新建画布对话框 -->
    <transition name="fade">
      <div
        v-if="showCreateDialog"
        class="dialog-overlay"
        @click="showCreateDialog = false"
      >
        <div
          class="dialog-content"
          @click.stop
        >
          <div class="dialog-header">
            <h3>新建画布</h3>
            <button
              class="btn-close"
              @click="showCreateDialog = false"
            >
              ×
            </button>
          </div>
          <div class="dialog-body">
            <label class="form-label">画布名称</label>
            <input
              v-model="newCanvasName"
              type="text"
              class="form-input"
              placeholder="请输入画布名称"
              autofocus
              @keyup.enter="handleCreateCanvas"
            />
          </div>
          <div class="dialog-footer">
            <button
              class="btn btn-cancel"
              @click="showCreateDialog = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary"
              :disabled="!newCanvasName.trim()"
              @click="handleCreateCanvas"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 画布管理器组件
 * 提供画布列表、创建、删除、切换等功能
 */

import type { CanvasListItem } from '@/types/canvas'
import { storeToRefs } from 'pinia'
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'

interface Props {
  /** 学习集 ID */
  studySetId: string
  /** 当前画布 ID */
  currentCanvasId?: string
}

interface Emits {
  (e: 'canvas-switch', canvasId: string): void
  (e: 'canvas-create', canvas: CanvasListItem): void
  (e: 'canvas-delete', canvasId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  currentCanvasId: '',
})

const emit = defineEmits<Emits>()

const canvasStore = useCanvasStore()
const {
  canvasList,
  activeCanvasId,
  isLoading,
  errorMessage,
} = storeToRefs(canvasStore)

/** 是否显示新建画布对话框 */
const showCreateDialog = ref(false)

/** 新画布名称 */
const newCanvasName = ref('')

/** 是否显示画布列表 */
const showCanvasList = ref(false)

// 计算当前激活的画布
const activeCanvas = computed(() => {
  return canvasList.value.find((c) => c.id === activeCanvasId.value)
})

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 今天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }

  // 其他
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 初始化
onMounted(async () => {
  if (props.studySetId) {
    await canvasStore.initializeCanvas(props.studySetId)
  }
})

// 创建画布
async function handleCreateCanvas() {
  if (!newCanvasName.value.trim()) return

  const canvas = await canvasStore.createCanvas({
    name: newCanvasName.value.trim(),
    studySetId: props.studySetId,
  })

  if (canvas) {
    emit('canvas-create', {
      id: canvas.id,
      name: canvas.name,
      studySetId: canvas.studySetId,
      nodeCount: 0,
      lastUpdatedAt: canvas.updatedAt,
      isActive: true,
    })
    showCreateDialog.value = false
    newCanvasName.value = ''
  }
}

// 切换画布
async function handleSwitchCanvas(canvasId: string) {
  if (canvasId === activeCanvasId.value) return

  await canvasStore.switchCanvas(canvasId)
  emit('canvas-switch', canvasId)
  showCanvasList.value = false
}

// 删除画布
async function handleDeleteCanvas(canvasId: string, event: Event) {
  event.stopPropagation()

  if (!confirm('确定要删除这个画布吗？此操作不可恢复。')) return

  const success = await canvasStore.removeCanvas(canvasId)
  if (success) {
    emit('canvas-delete', canvasId)
  }
}

// 重命名画布
async function handleRenameCanvas(canvas: CanvasListItem, event: Event) {
  event.stopPropagation()

  const newName = prompt('请输入新名称:', canvas.name)
  if (newName && newName.trim() && newName !== canvas.name) {
    await canvasStore.updateCanvas({
      id: canvas.id,
      name: newName.trim(),
    })
  }
}
</script>

<style scoped>
.canvas-manager {
  position: relative;
  display: inline-block;
}

.canvas-selector {
  position: relative;
  cursor: pointer;
}

.canvas-selector-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  transition: all 0.2s;
}

.canvas-selector-current:hover {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.canvas-icon {
  font-size: 18px;
}

.canvas-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-arrow {
  font-size: 10px;
  color: var(--siyuan-secondary-text, #999);
}

.canvas-list-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 280px;
  max-height: 320px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.canvas-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  font-weight: 500;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--siyuan-primary, #409eff);
  background: transparent;
  border: 1px solid var(--siyuan-primary, #409eff);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.btn-create .icon {
  font-size: 14px;
  font-weight: bold;
}

.canvas-list-loading,
.canvas-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--siyuan-secondary-text, #999);
}

.loading-spinner {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.btn-create-empty {
  margin-top: 16px;
  padding: 8px 16px;
  color: var(--siyuan-primary, #409eff);
  background: transparent;
  border: 1px solid var(--siyuan-primary, #409eff);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-empty:hover {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.canvas-list-items {
  overflow-y: auto;
  max-height: 260px;
}

.canvas-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.canvas-list-item:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.canvas-list-item.active {
  background: var(--siyuan-primary-bg, #e6f4ff);
  border-left: 3px solid var(--siyuan-primary, #409eff);
}

.canvas-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.canvas-item-icon {
  font-size: 16px;
}

.canvas-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.canvas-item-name {
  font-size: 14px;
  color: var(--siyuan-text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-item-meta {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
}

.canvas-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.canvas-list-item:hover .canvas-item-actions {
  opacity: 1;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
}

.btn-delete:hover {
  background: #ffe6e6;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff3f3;
  border: 1px solid #ffcccc;
  border-radius: 4px;
  color: #cc0000;
  font-size: 13px;
}

.error-icon {
  font-size: 16px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-content {
  width: 400px;
  max-width: 90vw;
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.btn-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  color: var(--siyuan-secondary-text, #999);
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
  color: var(--siyuan-text, #333);
}

.dialog-body {
  padding: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  color: var(--siyuan-text, #333);
}

.btn-cancel:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.btn-primary {
  background: var(--siyuan-primary, #409eff);
  border: 1px solid var(--siyuan-primary, #409eff);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .canvas-selector-current {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .canvas-selector-current:hover {
    border-color: var(--siyuan-primary, #409eff);
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .canvas-list-dropdown {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .canvas-list-header {
    border-color: var(--siyuan-border, #444);
  }

  .canvas-list-item:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .canvas-list-item.active {
    background: var(--siyuan-primary-bg, #1a3a52);
  }

  .canvas-item-name {
    color: var(--siyuan-text, #e0e0e0);
  }

  .canvas-item-meta {
    color: var(--siyuan-secondary-text, #666);
  }

  .btn-icon:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .error-message {
    background: #2a1a1a;
    border-color: #663333;
    color: #ff6666;
  }

  .dialog-content {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .dialog-header {
    border-color: var(--siyuan-border, #444);
  }

  .dialog-header h3 {
    color: var(--siyuan-text, #e0e0e0);
  }

  .btn-close:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .form-input {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .form-input:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .dialog-footer {
    border-color: var(--siyuan-border, #444);
  }

  .btn-cancel {
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .btn-cancel:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }
}
</style>
