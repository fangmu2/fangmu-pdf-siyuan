<!-- src/components/BatchMoveDialog.vue -->
<template>
  <div
    v-if="visible"
    class="batch-move-dialog-overlay"
    @click.self="handleClose"
  >
    <div
      class="batch-move-dialog"
      :style="{
        left: `${x}px`, top: `${y}px`,
      }"
    >
      <div class="batch-move-dialog__header">
        <h3>批量移动标注</h3>
        <button
          class="close-btn"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <div class="batch-move-dialog__content">
        <p class="dialog-description">
          已选择 {{ annotationIds.length }} 个标注，请选择目标学习集：
        </p>

        <div class="study-set-selector">
          <select
            v-model="selectedSetId"
            class="study-set-select"
          >
            <option
              value=""
              disabled
            >
              选择学习集...
            </option>
            <option
              v-for="set in studySets"
              :key="set.id"
              :value="set.id"
            >
              {{ set.name }}
            </option>
          </select>
        </div>

        <div
          v-if="error"
          class="error-message"
        >
          {{ error }}
        </div>

        <div
          v-if="loading"
          class="loading-message"
        >
          正在移动...
        </div>
      </div>

      <div class="batch-move-dialog__footer">
        <button
          class="btn btn-secondary"
          @click="handleClose"
        >
          取消
        </button>
        <button
          :disabled="!selectedSetId || loading"
          class="btn btn-primary"
          @click="handleConfirm"
        >
          确认移动
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
} from 'vue'
import { useLearningSetStore } from '@/stores/learningSetStore'

interface Props {
  visible: boolean
  x: number
  y: number
  annotationIds: string[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  x: 0,
  y: 0,
  annotationIds: () => [],
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
  (e: 'cancel'): void
}>()

const learningSetStore = useLearningSetStore()
const studySets = learningSetStore.studySets
const selectedSetId = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)

// 重置状态当对话框打开时
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    selectedSetId.value = ''
    error.value = null
    loading.value = false
  }
})

const handleClose = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = async () => {
  if (!selectedSetId.value || props.annotationIds.length === 0) return

  loading.value = true
  error.value = null

  try {
    const success = await learningSetStore.moveAnnotationsToSet(
      props.annotationIds,
      selectedSetId.value,
    )

    if (success) {
      emit('success')
      handleClose()
    } else {
      error.value = '移动失败，请重试'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '移动失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.batch-move-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.batch-move-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 400px;
  max-width: 500px;
}

.batch-move-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-move-dialog__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.batch-move-dialog__content {
  padding: 20px;
}

.dialog-description {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.study-set-selector {
  margin-bottom: 16px;
}

.study-set-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.study-set-select:focus {
  outline: none;
  border-color: #4a90e2;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 12px;
  padding: 8px;
  background: #ffebee;
  border-radius: 4px;
}

.loading-message {
  color: #2196f3;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}

.batch-move-dialog__footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}
</style>
