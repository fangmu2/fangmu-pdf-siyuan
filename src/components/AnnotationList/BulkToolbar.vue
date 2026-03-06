<!-- src/components/AnnotationList/BulkToolbar.vue -->
<template>
  <div class="bulk-toolbar">
    <label
      class="select-all-label"
      title="全选/取消全选"
    >
      <input
        type="checkbox"
        :checked="isCheckedAll"
        class="select-all-checkbox"
        @change="handleToggleSelectAll"
      />
    </label>
    <span class="selection-count">已选择 {{ selectionCount }} 个标注</span>
    <button
      class="bulk-btn"
      title="批量导出"
      @click="$emit('export')"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
      >
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
      导出
    </button>
    <button
      class="bulk-btn"
      title="批量移动"
      @click="$emit('move')"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
      >
        <path d="M9.01 14H9v4h6v-4h-.01c-.55 0-1 .45-1 1v1h-4v-1c0-.55-.45-1-1-1zM9 3v4h6V3H9zm10 15.41l-1.41-1.42L19 15.5V9h-2v6.5l-1.41 1.41L17 18.41V21h2v-2.59zm-2-13.41l1.41 1.41L17 7.91V5h2V2.41l1.41 1.42L19 5.25V11h2V9h-2V5.25z" />
      </svg>
      移动
    </button>
    <button
      class="bulk-btn delete"
      title="批量删除"
      @click="$emit('delete')"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
      >
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      </svg>
      删除
    </button>
    <button
      class="bulk-btn"
      title="取消选择"
      @click="$emit('clear')"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
      >
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
      取消
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'

const props = defineProps<{
  selectionCount: number
  totalCount: number
  annotations: PDFAnnotation[]
}>()

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'move'): void
  (e: 'delete'): void
  (e: 'clear'): void
  (e: 'toggle-all'): void
}>()

const isCheckedAll = computed(() => {
  return props.selectionCount === props.totalCount && props.totalCount > 0
})

const handleToggleSelectAll = () => {
  emit('toggle-all')
}
</script>

<style scoped lang="scss">
.bulk-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.1));
  border-radius: 6px;
  border: 1px solid var(--b3-theme-primary-light);
  animation: slide-down 0.2s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selection-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-primary);
  padding: 0 8px;
}

.select-all-label {
  display: flex;
  align-items: center;
  padding: 0 4px;
  cursor: pointer;
}

.select-all-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--b3-theme-primary);
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.bulk-btn:hover {
  background: var(--b3-theme-primary);
  color: white;
  border-color: var(--b3-theme-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.bulk-btn.delete:hover {
  background: var(--b3-theme-danger, #ef4444);
  border-color: var(--b3-theme-danger, #ef4444);
}
</style>
