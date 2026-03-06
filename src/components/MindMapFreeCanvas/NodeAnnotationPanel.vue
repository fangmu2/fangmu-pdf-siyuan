<template>
  <Teleport to="body">
    <Transition name="annotation-panel-fade">
      <div
        v-if="internalVisible"
        ref="panelRef"
        class="node-annotation-panel"
        @click="handleClickOutside"
      >
        <div
          class="annotation-panel-content"
          @click.stop
        >
          <!-- 面板头部 -->
          <div class="annotation-panel-header">
            <div class="annotation-panel-title">
              <span>📝 节点批注</span>
              <span class="annotation-count">{{ annotations.length }}</span>
            </div>
            <button
              class="annotation-panel-close"
              title="关闭"
              @click="emit('update:modelValue', false)"
            >
              ×
            </button>
          </div>

          <!-- 编辑模式 -->
          <div
            v-if="isEditing"
            class="annotation-edit-mode"
          >
            <textarea
              v-model="editingContent"
              class="annotation-editor"
              placeholder="输入批注内容（支持简单 Markdown 语法）..."
              rows="6"
              autofocus
            />
            <div class="annotation-editor-actions">
              <button
                class="btn-cancel"
                @click="handleCancelEdit"
              >
                取消
              </button>
              <button
                class="btn-save"
                :disabled="!editingContent.trim()"
                @click="handleSaveAnnotation"
              >
                {{ editingAnnotationId ? '更新' : '添加' }}
              </button>
            </div>
            <div class="markdown-hint">
              支持：**粗体** *斜体* `代码` # 标题
            </div>
          </div>

          <!-- 批注列表 -->
          <div
            v-else
            class="annotation-panel-body"
          >
            <div
              v-if="hasAnnotations"
              class="annotation-list"
            >
              <TransitionGroup name="annotation-list">
                <div
                  v-for="anno in sortedAnnotations"
                  :key="anno.id"
                  class="annotation-item"
                >
                  <div class="annotation-item-header">
                    <span class="annotation-time">
                      {{ formatTime(anno.createdAt) }}
                    </span>
                    <div class="annotation-item-actions">
                      <button
                        class="annotation-action-btn"
                        title="编辑"
                        @click="handleEditAnnotation(anno)"
                      >
                        ✏️
                      </button>
                      <button
                        class="annotation-action-btn annotation-action-delete"
                        title="删除"
                        @click="handleDeleteAnnotation(anno.id)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div
                    class="annotation-item-content"
                    v-html="renderMarkdown(anno.content)"
                  />
                  <div
                    v-if="anno.updatedAt !== anno.createdAt"
                    class="annotation-updated-time"
                  >
                    更新于 {{ formatTime(anno.updatedAt) }}
                  </div>
                </div>
              </TransitionGroup>
            </div>
            <div
              v-else
              class="annotation-empty"
            >
              <div class="empty-icon">
                📭
              </div>
              <div class="empty-text">
                暂无批注
              </div>
              <div class="empty-hint">
                点击上方按钮添加第一条批注
              </div>
            </div>
          </div>

          <!-- 面板底部 -->
          <div
            v-if="!isEditing"
            class="annotation-panel-footer"
          >
            <button
              class="annotation-add-btn"
              @click="handleAddAnnotation"
            >
              <span>➕</span>
              <span>添加批注</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 节点批注面板组件
 * 用于查看和管理节点的 Markdown 批注
 */

import type { NodeAnnotation } from '@/types/mindmapFree'
import {
  computed,
  ref,
  watch,
} from 'vue'

interface Props {
  /** 是否显示面板 */
  modelValue: boolean
  /** 节点批注列表 */
  annotations: NodeAnnotation[]
  /** 节点 ID */
  nodeId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'add-annotation', content: string): void
  (e: 'update-annotation', annotation: NodeAnnotation): void
  (e: 'delete-annotation', annotationId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => [],
})

const emit = defineEmits<Emits>()

// 内部状态
const internalVisible = ref(false)
const isEditing = ref(false)
const editingContent = ref('')
const editingAnnotationId = ref('')
const panelRef = ref<HTMLElement | null>(null)

// 计算是否有批注
const hasAnnotations = computed(() => props.annotations.length > 0)

// 排序后的批注列表（最新的在前）
const sortedAnnotations = computed(() => {
  return [...props.annotations].sort((a, b) => b.createdAt - a.createdAt)
})

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (!val) {
      // 关闭时重置编辑状态
      isEditing.value = false
      editingContent.value = ''
      editingAnnotationId.value = ''
    }
  },
  { immediate: true },
)

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于 24 小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于 7 天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 默认格式
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent): void {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    emit('update:modelValue', false)
  }
}

// 开始添加批注
function handleAddAnnotation(): void {
  isEditing.value = true
  editingContent.value = ''
  editingAnnotationId.value = ''
}

// 保存批注
function handleSaveAnnotation(): void {
  const content = editingContent.value.trim()
  if (!content) return

  if (editingAnnotationId.value) {
    // 更新现有批注
    const annotation = props.annotations.find((a) => a.id === editingAnnotationId.value)
    if (annotation) {
      emit('update-annotation', {
        ...annotation,
        content,
        updatedAt: Date.now(),
      })
    }
  } else {
    // 添加新批注
    emit('add-annotation', content)
  }

  isEditing.value = false
  editingContent.value = ''
  editingAnnotationId.value = ''
}

// 取消编辑
function handleCancelEdit(): void {
  isEditing.value = false
  editingContent.value = ''
  editingAnnotationId.value = ''
}

// 编辑批注
function handleEditAnnotation(annotation: NodeAnnotation): void {
  isEditing.value = true
  editingContent.value = annotation.content
  editingAnnotationId.value = annotation.id
}

// 删除批注
function handleDeleteAnnotation(annotationId: string): void {
  if (confirm('确定要删除这条批注吗？')) {
    emit('delete-annotation', annotationId)
  }
}

// 渲染简单的 Markdown（基础支持）
function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.annotation-panel-fade-enter-active,
.annotation-panel-fade-leave-active {
  transition: all 0.2s ease;
}

.annotation-panel-fade-enter-from,
.annotation-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.node-annotation-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 90vw;
  background: rgba(0, 0, 0, 0.3);
  z-index: 10000;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.annotation-panel-content {
  width: 100%;
  height: 100%;
  background: var(--siyuan-bg, #fff);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.annotation-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.annotation-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
  display: flex;
  align-items: center;
  gap: 8px;
}

.annotation-count {
  padding: 2px 8px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.annotation-panel-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 24px;
  color: var(--siyuan-secondary-text, #666);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.annotation-panel-close:hover {
  background: var(--siyuan-hover-bg, #f0f0f0);
  color: var(--siyuan-text, #333);
}

.annotation-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.annotation-edit-mode {
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.annotation-editor {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  font-size: 14px;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg, #fff);
  resize: vertical;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
  line-height: 1.6;
}

.annotation-editor:focus {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.annotation-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
}

.btn-cancel:hover {
  background: var(--siyuan-hover-bg, #e5e5e5);
}

.btn-save {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  background: var(--siyuan-primary-dark, #337ecc);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.markdown-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--siyuan-tertiary-text, #999);
}

.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.annotation-item {
  padding: 14px 16px;
  background: var(--siyuan-bg-secondary, #f9f9f9);
  border-radius: 8px;
  border: 1px solid var(--siyuan-border, #e8e8e8);
  transition: all 0.2s;
}

.annotation-item:hover {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.annotation-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.annotation-time {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
}

.annotation-item-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.annotation-item:hover .annotation-item-actions {
  opacity: 1;
}

.annotation-action-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.annotation-action-btn:hover {
  background: var(--siyuan-hover-bg, #e5e5e5);
}

.annotation-action-delete:hover {
  background: var(--siyuan-error-bg, #fef0f0);
}

.annotation-item-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--siyuan-text, #333);
  word-break: break-word;
}

.annotation-item-content :deep(h1),
.annotation-item-content :deep(h2),
.annotation-item-content :deep(h3) {
  margin: 8px 0 4px;
  font-size: 1em;
  font-weight: 600;
}

.annotation-item-content :deep(strong) {
  font-weight: 600;
}

.annotation-item-content :deep(code) {
  padding: 2px 6px;
  background: var(--siyuan-bg, #f0f0f0);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.annotation-updated-time {
  margin-top: 8px;
  font-size: 11px;
  color: var(--siyuan-tertiary-text, #999);
}

.annotation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--siyuan-secondary-text, #666);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--siyuan-tertiary-text, #999);
}

.annotation-panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.annotation-add-btn {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.annotation-add-btn:hover {
  background: var(--siyuan-primary-dark, #337ecc);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 列表动画 */
.annotation-list-enter-active,
.annotation-list-leave-active {
  transition: all 0.3s ease;
}

.annotation-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.annotation-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 滚动条样式 */
.annotation-panel-body::-webkit-scrollbar {
  width: 6px;
}

.annotation-panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.annotation-panel-body::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 3px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .annotation-panel-content {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .annotation-panel-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .annotation-panel-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .annotation-panel-close {
    color: var(--siyuan-secondary-text, #888);
  }

  .annotation-panel-close:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .annotation-editor {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .annotation-editor:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .btn-cancel {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .btn-cancel:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .annotation-item {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .annotation-item-content {
    color: var(--siyuan-text, #e0e0e0);
  }

  .annotation-item-content :deep(code) {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .annotation-panel-footer {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }
}
</style>
