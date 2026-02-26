<!-- src/components/CardEditorDialog.vue -->
<template>
  <div v-if="visible" class="card-editor-dialog-overlay" @click.self="handleClose">
    <div class="card-editor-dialog" :class="{ 'card-editor-dialog--new': isNew }">
      <!-- 对话框头部 -->
      <div class="card-editor-dialog__header">
        <h3 class="card-editor-dialog__title">
          {{ isNew ? '创建新卡片' : '编辑卡片' }}
        </h3>
        <button @click="handleClose" class="card-editor-dialog__close" title="关闭 (Esc)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- 对话框主体 -->
      <div class="card-editor-dialog__body">
        <!-- 卡片类型切换 -->
        <div class="card-editor-dialog__type-tabs">
          <button
            :class="['card-editor-dialog__tab', { active: modelValue.type === 'card' }]"
            @click="switchType('card')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
            </svg>
            普通卡片
          </button>
          <button
            :class="['card-editor-dialog__tab', { active: modelValue.type === 'flashcard' }]"
            @click="switchType('flashcard')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2v-4h2v4zm0-6h-2V7h2v2z"/>
            </svg>
            闪卡
          </button>
        </div>

        <!-- 学习集选择 -->
        <div class="card-editor-dialog__field">
          <label class="card-editor-dialog__label">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
            </svg>
            学习集
          </label>
          <select v-model="studySetId" class="card-editor-dialog__select">
            <option value="">选择学习集...</option>
            <option v-for="set in studySets" :key="set.id" :value="set.id">
              {{ set.name }}
            </option>
          </select>
        </div>

        <!-- 普通卡片编辑 -->
        <template v-if="modelValue.type === 'card'">
          <div class="card-editor-dialog__field">
            <label class="card-editor-dialog__label">卡片内容</label>
            <textarea
              v-model="contentDraft"
              class="card-editor-dialog__textarea"
              placeholder="输入卡片内容，支持 Markdown 语法..."
              rows="6"
              ref="contentTextareaRef"
            ></textarea>
          </div>
        </template>

        <!-- 闪卡编辑 -->
        <template v-if="modelValue.type === 'flashcard'">
          <div class="card-editor-dialog__field">
            <label class="card-editor-dialog__label">正面（问题）</label>
            <textarea
              v-model="frontDraft"
              class="card-editor-dialog__textarea"
              placeholder="输入问题..."
              rows="3"
              ref="frontTextareaRef"
            ></textarea>
          </div>

          <div class="card-editor-dialog__field">
            <label class="card-editor-dialog__label">反面（答案）</label>
            <textarea
              v-model="backDraft"
              class="card-editor-dialog__textarea"
              placeholder="输入答案..."
              rows="3"
            ></textarea>
          </div>
        </template>

        <!-- 标签编辑 -->
        <div class="card-editor-dialog__field">
          <label class="card-editor-dialog__label">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
            </svg>
            标签
          </label>
          <div class="card-editor-dialog__tags">
            <div class="tag-input">
              <span
                v-for="(tag, index) in tagsDraft"
                :key="index"
                class="tag-input__tag"
              >
                #{{ tag }}
                <button class="tag-input__remove" @click="removeTag(index)">×</button>
              </span>
              <input
                v-model="tagInput"
                class="tag-input__input"
                placeholder="输入标签后按回车"
                @keydown.enter="addTag"
              />
            </div>
          </div>
        </div>

        <!-- 来源信息（仅编辑模式显示） -->
        <div v-if="!isNew && modelValue.sourceLocation" class="card-editor-dialog__source">
          <label class="card-editor-dialog__label">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            来源
          </label>
          <div class="card-editor-dialog__source-info">
            <template v-if="modelValue.sourceLocation.pdfPath">
              📄 {{ getFileName(modelValue.sourceLocation.pdfPath) }} - 第{{ modelValue.sourceLocation.page }}页
            </template>
            <template v-else-if="modelValue.sourceLocation.blockId">
              📝 文档块 {{ modelValue.sourceLocation.blockId.slice(0, 8) }}...
            </template>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="card-editor-dialog__footer">
        <button
          v-if="!isNew"
          @click="handleDelete"
          class="card-editor-dialog__btn card-editor-dialog__btn--danger"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          删除
        </button>
        <div class="card-editor-dialog__spacer"></div>
        <button
          @click="handleClose"
          class="card-editor-dialog__btn card-editor-dialog__btn--outline"
        >
          取消
        </button>
        <button
          @click="handleSave"
          class="card-editor-dialog__btn card-editor-dialog__btn--primary"
          :disabled="!canSave"
        >
          <svg v-if="saving" viewBox="0 0 24 24" width="16" height="16" class="spinner">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v2c3.31 0 6 2.69 6 6s-2.69 6-6 6v-2z" fill="currentColor"/>
          </svg>
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { Card, FlashCard } from '../types/card';
import type { StudySet } from '../types/studySet';
import { studySetService } from '../services/studySetService';
import { cardService } from '../services/cardService';
import { createNewSRSParams } from '../review/sm2';

interface Props {
  modelValue: Card | FlashCard | null;
  visible: boolean;
  studySets?: StudySet[];
}

const props = withDefaults(defineProps<Props>(), {
  studySets: () => [],
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved', card: Card | FlashCard): void;
  (e: 'deleted', card: Card | FlashCard): void;
  (e: 'closed'): void;
}>();

// 状态
const studySetId = ref('');
const contentDraft = ref('');
const frontDraft = ref('');
const backDraft = ref('');
const tagsDraft = ref<string[]>([]);
const tagInput = ref('');
const saving = ref(false);

const contentTextareaRef = ref<HTMLTextAreaElement>();
const frontTextareaRef = ref<HTMLTextAreaElement>();

// 计算属性
const isNew = computed(() => !props.modelValue?.id);
const canSave = computed(() => {
  if (!studySetId.value) return false;
  if (props.modelValue?.type === 'flashcard') {
    return !!(frontDraft.value.trim() || backDraft.value.trim());
  }
  return !!contentDraft.value.trim();
});

// 监听 visible 变化，聚焦输入框
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (props.modelValue?.type === 'flashcard') {
        frontTextareaRef.value?.focus();
      } else {
        contentTextareaRef.value?.focus();
      }
    });
  }
});

// 监听 modelValue 变化，初始化表单
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    contentDraft.value = newVal.content || '';
    frontDraft.value = (newVal as FlashCard).front || '';
    backDraft.value = (newVal as FlashCard).back || '';
    tagsDraft.value = [...(newVal.tags || [])];
    studySetId.value = newVal.studySetId || '';
  } else {
    // 新建模式，重置表单
    contentDraft.value = '';
    frontDraft.value = '';
    backDraft.value = '';
    tagsDraft.value = [];
    studySetId.value = '';
  }
}, { immediate: true, deep: true });

// 键盘事件处理
function handleKeyDown(e: KeyboardEvent) {
  if (!props.visible) return;

  // Esc 关闭
  if (e.key === 'Escape') {
    e.preventDefault();
    handleClose();
  }

  // Ctrl/Cmd + S 保存
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (canSave.value) {
      handleSave();
    }
  }
}

// 切换卡片类型
function switchType(type: 'card' | 'flashcard') {
  if (!props.modelValue) return;

  if (type === 'flashcard' && props.modelValue.type === 'card') {
    emit('update:modelValue', {
      ...props.modelValue,
      type: 'flashcard',
      front: frontDraft.value || props.modelValue.content,
      back: backDraft.value,
      srs: createNewSRSParams(),
    } as FlashCard);
  } else if (type === 'card' && props.modelValue.type === 'flashcard') {
    const { srs, front, back, ...rest } = props.modelValue as FlashCard;
    emit('update:modelValue', {
      ...rest,
      type: 'card',
    } as Card);
  }
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !tagsDraft.value.includes(tag)) {
    tagsDraft.value.push(tag);
    tagInput.value = '';
    updateTags();
  }
}

// 移除标签
function removeTag(index: number) {
  tagsDraft.value.splice(index, 1);
  updateTags();
}

// 更新标签
function updateTags() {
  if (props.modelValue) {
    emit('update:modelValue', {
      ...props.modelValue,
      tags: tagsDraft.value,
    });
  }
}

// 获取文件名
function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

// 关闭处理
function handleClose() {
  emit('update:visible', false);
  emit('closed');
}

// 保存处理
async function handleSave() {
  if (!canSave.value || !studySetId.value) return;

  saving.value = true;

  try {
    if (!props.modelValue) {
      // 新建模式
      let newCard: Card | FlashCard;

      if (props.modelValue?.type === 'flashcard') {
        newCard = await cardService.createFlashCard(
          frontDraft.value.trim(),
          backDraft.value.trim(),
          studySetId.value,
          contentDraft.value.trim(),
          props.modelValue.sourceLocation || { docId: '', blockId: '' }
        );
      } else {
        newCard = await cardService.createCard(
          contentDraft.value.trim(),
          studySetId.value,
          props.modelValue?.sourceLocation || { docId: '', blockId: '' }
        );
      }

      newCard.tags = tagsDraft.value;
      await cardService.saveCard(newCard);
      emit('saved', newCard);
    } else {
      // 编辑模式
      const updated = {
        ...props.modelValue,
        content: contentDraft.value.trim(),
        front: frontDraft.value.trim(),
        back: backDraft.value.trim(),
        tags: tagsDraft.value,
        studySetId: studySetId.value,
        updatedAt: Date.now(),
      } as Card | FlashCard;

      await cardService.saveCard(updated);
      emit('saved', updated);
    }

    handleClose();
  } catch (error) {
    console.error('保存卡片失败:', error);
    alert('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

// 删除处理
async function handleDelete() {
  if (!props.modelValue?.id) return;

  if (!confirm('确定要删除这张卡片吗？')) return;

  try {
    await cardService.deleteCard(props.modelValue.id);
    emit('deleted', props.modelValue);
    handleClose();
  } catch (error) {
    console.error('删除卡片失败:', error);
    alert('删除失败，请重试');
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped lang="scss">
.card-editor-dialog-overlay {
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
  backdrop-filter: blur(2px);
  animation: fadeIn 0.15s ease;
}

.card-editor-dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.2s ease;

  &--new {
    border-top: 3px solid var(--b3-theme-primary);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-surface);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__type-tabs {
    display: flex;
    gap: 8px;
    background: var(--b3-theme-surface);
    padding: 4px;
    border-radius: 8px;
    width: fit-content;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-surface-hover);
    }

    &.active {
      background: var(--b3-theme-primary);
      color: white;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }

  &__select {
    padding: 10px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.6;
    transition: border-color 0.15s;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__tags {
    .tag-input {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 12px;
      border: 1px solid var(--b3-border-color);
      border-radius: 8px;
      background: var(--b3-theme-surface);
      min-height: 44px;
      align-items: center;

      &__tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: var(--b3-theme-primary-light);
        color: var(--b3-theme-primary);
        border-radius: 6px;
        font-size: 13px;

        &:hover {
          background: var(--b3-theme-primary);
          color: white;
        }
      }

      &__remove {
        width: 18px;
        height: 18px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        padding: 0;

        &:hover {
          background: rgba(0, 0, 0, 0.15);
        }
      }

      &__input {
        flex: 1;
        min-width: 100px;
        border: none;
        outline: none;
        background: transparent;
        color: var(--b3-theme-on-surface);
        font-size: 14px;
      }
    }
  }

  &__source {
    padding: 12px 14px;
    background: var(--b3-theme-surface);
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);

    &-info {
      margin-top: 6px;
      font-size: 13px;
      color: var(--b3-theme-on-surface-light);
      line-height: 1.5;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-border-color);
  }

  &__spacer {
    flex: 1;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: none;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--outline {
      background: transparent;
      border: 1px solid var(--b3-border-color);
      color: var(--b3-theme-on-surface);

      &:hover:not(:disabled) {
        background: var(--b3-theme-surface);
      }
    }

    &--primary {
      background: var(--b3-theme-primary);
      color: white;

      &:hover:not(:disabled) {
        background: var(--b3-theme-primary-dark);
      }
    }

    &--danger {
      background: var(--b3-theme-error-light);
      color: var(--b3-theme-error);

      &:hover:not(:disabled) {
        background: var(--b3-theme-error);
        color: white;
      }
    }
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
