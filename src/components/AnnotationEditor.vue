<!-- src/components/AnnotationEditor.vue -->
<template>
  <div v-if="visible" class="annotation-editor-overlay" @click="handleClose">
    <div class="editor-dialog" @click.stop>
      <div class="dialog-header">
        <span class="dialog-title">编辑标注</span>
        <button @click="handleClose" class="close-btn">
          <svg><use xlink:href="#iconClose"></use></svg>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 标注文本（只读） -->
        <div class="form-item">
          <label>标注文本：</label>
          <div class="text-preview">{{ annotation?.text }}</div>
        </div>

        <!-- 颜色选择 -->
        <div class="form-item">
          <label>颜色：</label>
          <div class="color-selector">
            <button
              v-for="color in colors"
              :key="color.value"
              @click="selectedColor = color.value"
              class="color-btn"
              :class="{ active: selectedColor === color.value }"
              :style="{ background: color.hex }"
              :title="color.label"
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
      </div>

      <div class="dialog-footer">
        <button @click="handleClose" class="b3-button">取消</button>
        <button @click="handleSave" class="b3-button b3-button--primary">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PDFAnnotation, AnnotationColor } from '../types/annotaion';
import { updateAnnotationNote, updateAnnotationColor } from '../api/annotationApi';

const props = defineProps<{
  annotation: PDFAnnotation | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'saved'): void;
}>();

const note = ref('');
const selectedColor = ref<AnnotationColor>('yellow');

const colors = [
  { value: 'red' as AnnotationColor, hex: '#ff6b6b', label: '关键内容' },
  { value: 'yellow' as AnnotationColor, hex: '#ffd93d', label: '普通高亮' },
  { value: 'green' as AnnotationColor, hex: '#6bcb77', label: '重要概念' },
  { value: 'blue' as AnnotationColor, hex: '#4d96ff', label: '方法/数据' },
  { value: 'purple' as AnnotationColor, hex: '#9b59b6', label: '评论/思考' }
];

// 监听标注变化，初始化表单
watch(() => props.annotation, (ann) => {
  if (ann) {
    note.value = ann.note;
    selectedColor.value = ann.color;
  }
}, { immediate: true });

const handleClose = () => {
  emit('update:visible', false);
};

const handleSave = async () => {
  if (!props.annotation) return;

  try {
    // 更新笔记
    if (note.value !== props.annotation.note) {
      await updateAnnotationNote(props.annotation.blockId, note.value);
    }

    // 更新颜色
    if (selectedColor.value !== props.annotation.color) {
      await updateAnnotationColor(props.annotation.blockId, selectedColor.value);
    }

    emit('saved');
    handleClose();
  } catch (e) {
    console.error('保存失败:', e);
    alert('保存失败');
  }
};
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
</style>
