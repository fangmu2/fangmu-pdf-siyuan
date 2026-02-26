<!-- src/components/QuickCaptureMenu.vue -->
<template>
  <div v-if="visible" class="quick-capture-menu" :style="positionStyle" ref="menuRef">
    <!-- 菜单主体 -->
    <div class="quick-capture-menu__body">
      <!-- 选中内容预览 -->
      <div v-if="selectedText" class="quick-capture-menu__preview">
        <div class="quick-capture-menu__preview-text">
          {{ truncatedText }}
        </div>
        <button @click="clearSelection" class="quick-capture-menu__clear" title="清除选择">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- 学习集选择 -->
      <div class="quick-capture-menu__field">
        <select v-model="selectedStudySetId" class="quick-capture-menu__select">
          <option value="">选择学习集...</option>
          <option v-for="set in studySets" :key="set.id" :value="set.id">
            {{ set.name }}
          </option>
        </select>
      </div>

      <!-- 快捷操作按钮 -->
      <div class="quick-capture-menu__actions">
        <button
          @click="handleCapture('card')"
          class="quick-capture-menu__action-btn"
          :disabled="!canCapture"
          title="创建普通卡片 (Alt+1)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
          </svg>
          <span>卡片</span>
        </button>
        <button
          @click="handleCapture('flashcard')"
          class="quick-capture-menu__action-btn"
          :disabled="!canCapture"
          title="创建闪卡 (Alt+2)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2v-4h2v4zm0-6h-2V7h2v2z"/>
          </svg>
          <span>闪卡</span>
        </button>
        <button
          @click="handleCapture('excerpt')"
          class="quick-capture-menu__action-btn"
          :disabled="!canCapture"
          title="创建摘录卡片 (Alt+3)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>摘录</span>
        </button>
      </div>

      <!-- 更多选项 -->
      <div class="quick-capture-menu__more">
        <button @click="showFullEditor" class="quick-capture-menu__more-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>完整编辑器...</span>
          <span class="quick-capture-menu__shortcut">Alt+E</span>
        </button>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="quick-capture-menu__footer">
      <span class="quick-capture-menu__hint">按 Esc 关闭</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { StudySet } from '../types/studySet';
import type { Card, FlashCard } from '../types/card';
import { cardService } from '../services/cardService';
import { createNewSRSParams } from '../review/sm2';

interface Props {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string | null;
  studySets: StudySet[];
  sourceLocation?: {
    docId?: string;
    blockId?: string;
    pdfPath?: string;
    page?: number;
    rect?: [number, number, number, number];
  };
}

const props = withDefaults(defineProps<Props>(), {
  sourceLocation: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'captured', card: Card | FlashCard): void;
  (e: 'open-editor', data: { text: string; sourceLocation: any }): void;
  (e: 'closed'): void;
}>();

const menuRef = ref<HTMLElement>();
const selectedStudySetId = ref('');

// 菜单位置
const positionStyle = computed(() => {
  if (!props.visible) return {};

  // 考虑菜单尺寸和屏幕边界
  const menuWidth = 320;
  const menuHeight = 280;
  const padding = 8;

  let x = props.x;
  let y = props.y + padding;

  // 检查是否超出右边界
  if (x + menuWidth > window.innerWidth - padding) {
    x = window.innerWidth - menuWidth - padding;
  }

  // 检查是否超出下边界
  if (y + menuHeight > window.innerHeight - padding) {
    y = props.y - menuHeight - padding;
  }

  // 确保不超出左边界
  if (x < padding) {
    x = padding;
  }

  // 确保不超出上边界
  if (y < padding) {
    y = padding;
  }

  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

// 截断的文本
const truncatedText = computed(() => {
  if (!props.selectedText) return '';
  if (props.selectedText.length <= 100) return props.selectedText;
  return props.selectedText.slice(0, 100) + '...';
});

// 是否可以捕获
const canCapture = computed(() => {
  return !!props.selectedText && !!selectedStudySetId.value;
});

// 键盘事件处理
function handleKeyDown(e: KeyboardEvent) {
  if (!props.visible) return;

  // Esc 关闭
  if (e.key === 'Escape') {
    e.preventDefault();
    handleClose();
    return;
  }

  // Alt + 数字快捷键
  if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    switch (e.key) {
      case '1':
        e.preventDefault();
        handleCapture('card');
        break;
      case '2':
        e.preventDefault();
        handleCapture('flashcard');
        break;
      case '3':
        e.preventDefault();
        handleCapture('excerpt');
        break;
      case 'e':
      case 'E':
        e.preventDefault();
        showFullEditor();
        break;
    }
  }
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  if (!props.visible) return;
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    handleClose();
  }
}

// 清除选择
function clearSelection() {
  emit('update:visible', false);
  emit('closed');
}

// 关闭
function handleClose() {
  emit('update:visible', false);
  emit('closed');
}

// 捕获处理
async function handleCapture(type: 'card' | 'flashcard' | 'excerpt') {
  if (!canCapture.value || !props.selectedText) return;

  try {
    let card: Card | FlashCard;

    if (type === 'flashcard') {
      // 闪卡模式：使用选中文本作为正面
      card = await cardService.createFlashCard(
        props.selectedText.trim(),
        '', // 反面留空，用户后续补充
        selectedStudySetId.value,
        props.selectedText,
        props.sourceLocation || { docId: '', blockId: '' }
      );
    } else if (type === 'excerpt') {
      // 摘录卡片模式
      card = await cardService.createCard(
        props.selectedText.trim(),
        selectedStudySetId.value,
        props.sourceLocation || { docId: '', blockId: '' },
        'excerpt'
      );
    } else {
      // 普通卡片模式
      card = await cardService.createCard(
        props.selectedText.trim(),
        selectedStudySetId.value,
        props.sourceLocation || { docId: '', blockId: '' }
      );
    }

    emit('captured', card);
    handleClose();
  } catch (error) {
    console.error('创建卡片失败:', error);
    alert('创建失败，请重试');
  }
}

// 显示完整编辑器
function showFullEditor() {
  emit('open-editor', {
    text: props.selectedText || '',
    sourceLocation: props.sourceLocation,
  });
  handleClose();
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 如果有已选的学习集，默认选中
    if (!selectedStudySetId.value && props.studySets.length > 0) {
      selectedStudySetId.value = props.studySets[0].id;
    }
  }
});

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.quick-capture-menu {
  position: fixed;
  z-index: 10001;
  background: var(--b3-theme-surface);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--b3-border-color);
  overflow: hidden;
  animation: quickCaptureMenuAppear 0.15s ease;
  min-width: 280px;
  max-width: 320px;

  &__body {
    padding: 12px;
  }

  &__preview {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: var(--b3-theme-background);
    border-radius: 8px;
    margin-bottom: 12px;
    max-height: 100px;
    overflow-y: auto;
  }

  &__preview-text {
    flex: 1;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
    line-height: 1.5;
    word-break: break-word;
  }

  &__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--b3-theme-on-surface-light);
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-error-light);
      color: var(--b3-theme-error);
    }
  }

  &__field {
    margin-bottom: 12px;
  }

  &__select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  &__action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;

    &:hover:not(:disabled) {
      background: var(--b3-theme-primary-light);
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      opacity: 0.8;
    }
  }

  &__more {
    border-top: 1px solid var(--b3-border-color);
    padding-top: 8px;
  }

  &__more-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;

    &:hover {
      background: var(--b3-theme-primary-light);
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }
  }

  &__shortcut {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
    padding: 2px 6px;
    background: var(--b3-theme-surface);
    border-radius: 4px;
  }

  &__footer {
    padding: 8px 12px;
    background: var(--b3-theme-background);
    border-top: 1px solid var(--b3-border-color);
  }

  &__hint {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
  }
}

@keyframes quickCaptureMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
