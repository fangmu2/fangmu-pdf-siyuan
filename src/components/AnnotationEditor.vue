<!-- src/components/AnnotationEditor.vue -->
<template>
  <div
    v-if="visible"
    class="annotation-editor-overlay"
    @click="handleClose"
  >
    <div
      class="editor-dialog"
      @click.stop
    >
      <div class="dialog-header">
        <span class="dialog-title">编辑标注</span>
        <button
          class="close-btn"
          @click="handleClose"
        >
          <svg><use xlink:href="#iconClose"></use></svg>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 标注文本（只读） -->
        <div class="form-item">
          <label>标注文本：</label>
          <div class="text-preview">
            {{ annotation?.text }}
          </div>
        </div>

        <!-- 颜色选择 -->
        <div class="form-item">
          <label>颜色：</label>
          <div class="color-selector">
            <button
              v-for="color in colors"
              :key="color.value"
              class="color-btn"
              :class="{ active: selectedColor === color.value }"
              :style="{ background: color.hex }"
              :title="color.label"
              @click="selectedColor = color.value"
            ></button>
          </div>
        </div>

        <!-- 笔记 -->
        <div class="form-item">
          <label>笔记：</label>
          <textarea
            v-model="note"
            class="b3-text-field fn__block"
            rows="4"
            placeholder="添加笔记..."
          ></textarea>
        </div>

        <!-- 批注区域 -->
        <div class="form-item comments-section">
          <label class="comments-label">
            <span>批注</span>
            <span
              v-if="comments.length > 0"
              class="comments-count"
            >({{ comments.length }})</span>
          </label>

          <!-- 批注列表 -->
          <div
            v-if="comments.length > 0"
            class="comments-list"
          >
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
              :class="[`comment-priority-${comment.priority}`, `comment-status-${comment.status}`]"
            >
              <div class="comment-header">
                <span
                  class="comment-priority"
                  :style="{ color: getPriorityColor(comment.priority) }"
                >
                  {{ getPriorityLabel(comment.priority) }}
                </span>
                <span
                  class="comment-status"
                  :style="{ color: getStatusColor(comment.status) }"
                >
                  {{ getStatusLabel(comment.status) }}
                </span>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <div class="comment-text">
                {{ comment.text }}
              </div>
              <div
                v-if="comment.tags && comment.tags.length > 0"
                class="comment-tags"
              >
                <span
                  v-for="tag in comment.tags"
                  :key="tag"
                  class="comment-tag"
                >#{{ tag }}</span>
              </div>
              <div class="comment-actions">
                <button
                  v-if="comment.status === 'active'"
                  class="comment-action-btn"
                  title="标记已解决"
                  @click="resolveComment(comment.id)"
                >
                  ✅
                </button>
                <button
                  v-else
                  class="comment-action-btn"
                  title="重新打开"
                  @click="reopenComment(comment.id)"
                >
                  🔄
                </button>
                <button
                  class="comment-action-btn delete"
                  title="删除"
                  @click="removeComment(comment.id)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- 添加批注 -->
          <div class="add-comment">
            <textarea
              v-model="newCommentText"
              class="b3-text-field fn__block new-comment-input"
              rows="2"
              placeholder="添加批注..."
            ></textarea>
            <div class="comment-options">
              <select
                v-model="newCommentPriority"
                class="b3-select"
              >
                <option
                  v-for="p in priorityOptions"
                  :key="p.value"
                  :value="p.value"
                >
                  {{ p.label }}
                </option>
              </select>
              <button
                class="b3-button b3-button--primary add-comment-btn"
                :disabled="!newCommentText.trim()"
                @click="addComment"
              >
                添加批注
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button
          class="b3-button"
          @click="handleClose"
        >
          取消
        </button>
        <button
          class="b3-button b3-button--primary"
          @click="handleSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  AnnotationColor,
  AnnotationComment,
  CommentPriority,
  CommentStatus,
  PDFAnnotation,
} from '../types/annotation'
import {
  ref,
  watch,
} from 'vue'
import {
  addAnnotationComment,
  deleteAnnotationComment,
  getAnnotationComments,
  updateAnnotationColor,
  updateAnnotationComment,
  updateAnnotationNote,
} from '../api/annotationApi'
import {
  COMMENT_PRIORITIES,
  COMMENT_STATUSES,
} from '../types/annotation'

const props = defineProps<{
  annotation: PDFAnnotation | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'saved'): void
}>()

const note = ref('')
const selectedColor = ref<AnnotationColor>('yellow')
const comments = ref<AnnotationComment[]>([])
const newCommentText = ref('')
const newCommentPriority = ref<CommentPriority>('normal')
const loadingComments = ref(false)

const colors = [
  {
    value: 'red' as AnnotationColor,
    hex: '#ff6b6b',
    label: '关键内容',
  },
  {
    value: 'yellow' as AnnotationColor,
    hex: '#ffd93d',
    label: '普通高亮',
  },
  {
    value: 'green' as AnnotationColor,
    hex: '#6bcb77',
    label: '重要概念',
  },
  {
    value: 'blue' as AnnotationColor,
    hex: '#4d96ff',
    label: '方法/数据',
  },
  {
    value: 'purple' as AnnotationColor,
    hex: '#9b59b6',
    label: '评论/思考',
  },
]

const priorityOptions = COMMENT_PRIORITIES

// 获取优先级颜色
const getPriorityColor = (priority: CommentPriority): string => {
  return COMMENT_PRIORITIES.find((p) => p.value === priority)?.color || '#909399'
}

// 获取优先级标签
const getPriorityLabel = (priority: CommentPriority): string => {
  return COMMENT_PRIORITIES.find((p) => p.value === priority)?.label || '普通'
}

// 获取状态颜色
const getStatusColor = (status: CommentStatus): string => {
  return COMMENT_STATUSES.find((s) => s.value === status)?.color || '#909399'
}

// 获取状态标签
const getStatusLabel = (status: CommentStatus): string => {
  return COMMENT_STATUSES.find((s) => s.value === status)?.label || '活跃'
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 加载批注
const loadComments = async () => {
  if (!props.annotation?.blockId) return

  loadingComments.value = true
  try {
    comments.value = await getAnnotationComments(props.annotation.blockId)
  } catch (e) {
    console.error('加载批注失败:', e)
    comments.value = []
  } finally {
    loadingComments.value = false
  }
}

// 添加批注
const addComment = async () => {
  if (!props.annotation?.blockId || !newCommentText.value.trim()) return

  try {
    const newComment = await addAnnotationComment(props.annotation.blockId, {
      text: newCommentText.value.trim(),
      priority: newCommentPriority.value,
    })
    comments.value.push(newComment)
    newCommentText.value = ''
    newCommentPriority.value = 'normal'
  } catch (e) {
    console.error('添加批注失败:', e)
    alert('添加批注失败')
  }
}

// 解决批注
const resolveComment = async (commentId: string) => {
  if (!props.annotation?.blockId) return

  try {
    const updated = await updateAnnotationComment(props.annotation.blockId, commentId, { status: 'resolved' })
    if (updated) {
      const index = comments.value.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updated
      }
    }
  } catch (e) {
    console.error('更新批注失败:', e)
  }
}

// 重新打开批注
const reopenComment = async (commentId: string) => {
  if (!props.annotation?.blockId) return

  try {
    const updated = await updateAnnotationComment(props.annotation.blockId, commentId, { status: 'active' })
    if (updated) {
      const index = comments.value.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updated
      }
    }
  } catch (e) {
    console.error('更新批注失败:', e)
  }
}

// 删除批注
const removeComment = async (commentId: string) => {
  if (!props.annotation?.blockId) return

  if (!confirm('确定要删除这条批注吗？')) return

  try {
    const success = await deleteAnnotationComment(props.annotation.blockId, commentId)
    if (success) {
      comments.value = comments.value.filter((c) => c.id !== commentId)
    }
  } catch (e) {
    console.error('删除批注失败:', e)
  }
}

// 监听标注变化，初始化表单
watch(() => props.annotation, (ann) => {
  if (ann) {
    note.value = ann.note || ''
    selectedColor.value = ann.color
    loadComments()
  } else {
    comments.value = []
  }
}, { immediate: true })

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = async () => {
  if (!props.annotation) return

  try {
    // 更新笔记
    if (note.value !== props.annotation.note) {
      await updateAnnotationNote(props.annotation.blockId, note.value)
    }

    // 更新颜色
    if (selectedColor.value !== props.annotation.color) {
      await updateAnnotationColor(props.annotation.blockId, selectedColor.value)
    }

    emit('saved')
    handleClose()
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败')
  }
}
</script>

<style scoped>
.annotation-editor-overlay {
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

.editor-dialog {
  width: 480px;
  max-width: 90vw;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.dialog-title {
  font-weight: bold;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--b3-theme-on-surface);
}

.dialog-body {
  padding: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
}

.text-preview {
  padding: 12px;
  background: var(--b3-theme-background-light);
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 100px;
  overflow: auto;
}

.color-selector {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn.active {
  border-color: var(--b3-theme-primary);
  transform: scale(1.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

/* 批注区域样式 */
.comments-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--b3-border-color);
}

.comments-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comments-count {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  font-weight: normal;
}

.comments-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.comment-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--b3-theme-surface-light);
  border-radius: 6px;
  border-left: 3px solid var(--b3-theme-primary);
}

.comment-item.comment-status-resolved {
  opacity: 0.7;
  background: var(--b3-theme-background);
}

.comment-item.comment-priority-urgent {
  border-left-color: #F56C6C;
}

.comment-item.comment-priority-high {
  border-left-color: #E6A23C;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
}

.comment-priority {
  font-weight: 500;
}

.comment-status {
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--b3-theme-surface);
}

.comment-time {
  margin-left: auto;
  color: var(--b3-theme-on-surface-light);
}

.comment-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--b3-theme-on-background);
}

.comment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.comment-tag {
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  padding: 1px 6px;
  border-radius: 3px;
}

.comment-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.comment-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.15s;
}

.comment-action-btn:hover {
  background: var(--b3-theme-surface-light);
}

.comment-action-btn.delete:hover {
  background: #fef2f2;
}

.add-comment {
  margin-top: 12px;
}

.new-comment-input {
  margin-bottom: 8px;
}

.comment-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-comment-btn {
  margin-left: auto;
}
</style>
