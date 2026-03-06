<!-- src/components/PDFViewer/PDFBottomBar.vue -->
<template>
  <div
    v-if="totalPages > 0"
    class="bottom-toolbar"
  >
    <!-- 左侧：标注类型选择器 -->
    <div class="toolbar-section toolbar-left">
      <div class="annotation-type-selector">
        <button
          v-for="type in annotationTypes"
          :key="type.value"
          class="type-btn"
          :class="[{ active: modelValue.annotationType === type.value }]"
          :title="type.label"
          @click="$emit('update:modelValue', { ...modelValue, annotationType: type.value })"
        >
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-label">{{ type.label }}</span>
        </button>
      </div>

      <div class="toolbar-divider-vertical"></div>

      <!-- 形状工具 -->
      <div class="shape-tools">
        <button
          class="shape-btn"
          :class="[{ active: modelValue.shapeTool === 'rectangle' }]"
          title="矩形标注"
          @click="toggleShapeTool('rectangle')"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
            />
          </svg>
        </button>
        <button
          class="shape-btn"
          :class="[{ active: modelValue.shapeTool === 'circle' }]"
          title="圆形标注"
          @click="toggleShapeTool('circle')"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
          </svg>
        </button>
        <button
          class="shape-btn"
          :class="[{ active: modelValue.shapeTool === 'arrow' }]"
          title="箭头标注"
          @click="toggleShapeTool('arrow')"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
            />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 中间：形状颜色选择器 -->
    <div
      v-if="modelValue.shapeTool"
      class="toolbar-section toolbar-center"
    >
      <div class="shape-color-picker">
        <button
          v-for="color in shapeColors"
          :key="color.value"
          class="color-btn"
          :class="[{ active: modelValue.shapeColor === color.value }]"
          :style="{ backgroundColor: color.hex }"
          :title="color.name"
          @click="$emit('update:modelValue', { ...modelValue, shapeColor: color.value })"
        ></button>
      </div>
    </div>

    <!-- 中间：高亮颜色选择器 -->
    <div class="toolbar-section toolbar-center">
      <div class="highlight-color-picker">
        <button
          v-for="color in highlightColors"
          :key="color.value"
          class="color-btn"
          :class="[{ active: modelValue.highlightColor === color.value }]"
          :style="{ backgroundColor: color.hex }"
          :title="color.name"
          @click="$emit('update:modelValue', { ...modelValue, highlightColor: color.value })"
        ></button>
      </div>
    </div>

    <!-- 中间：翻页控制 -->
    <div class="toolbar-section toolbar-center">
      <button
        class="toolbar-btn"
        title="首页"
        :disabled="currentPage === 1"
        @click="$emit('page-change', 1)"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="上一页 (←)"
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <div class="page-input-wrapper">
        <input
          type="number"
          :value="currentPage"
          min="1"
          :max="totalPages"
          class="page-input"
          @change="handlePageInput"
          @keyup.enter="handlePageInput"
        />
        <span class="page-total-text">/ {{ totalPages }}</span>
      </div>
      <button
        class="toolbar-btn"
        title="下一页 (→)"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="末页"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', totalPages)"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
        </svg>
      </button>
    </div>

    <!-- 右侧：手写开关 -->
    <div class="toolbar-section toolbar-right">
      <button
        class="toolbar-btn"
        :class="{ active: handwritingVisible }"
        title="手写笔记"
        @click="$emit('toggle-handwriting')"
      >
        <span>✏️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ToolbarValue {
  annotationType: 'highlight' | 'underline' | 'strikethrough' | 'wavy'
  highlightColor: string
  shapeTool: 'rectangle' | 'circle' | 'arrow' | null
  shapeColor: string
}

interface Props {
  modelValue: ToolbarValue
  currentPage: number
  totalPages: number
  handwritingVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ToolbarValue): void
  (e: 'page-change', page: number): void
  (e: 'toggle-handwriting'): void
}>()

// 标注类型选项
const annotationTypes = [
  { value: 'highlight' as const, label: '高亮', icon: '🖍️' },
  { value: 'underline' as const, label: '下划线', icon: 'U̲' },
  { value: 'strikethrough' as const, label: '删除线', icon: 'S̶' },
  { value: 'wavy' as const, label: '波浪线', icon: '〰️' },
]

// 高亮颜色选项
const highlightColors = [
  { value: 'yellow', name: '黄色', hex: '#fef08a' },
  { value: 'green', name: '绿色', hex: '#bbf7d0' },
  { value: 'blue', name: '蓝色', hex: '#bfdbfe' },
  { value: 'red', name: '红色', hex: '#fecaca' },
  { value: 'purple', name: '紫色', hex: '#e9d5ff' },
  { value: 'orange', name: '橙色', hex: '#fed7aa' },
]

// 形状颜色选项
const shapeColors = [
  { value: '#ef4444', name: '红色', hex: '#ef4444' },
  { value: '#3b82f6', name: '蓝色', hex: '#3b82f6' },
  { value: '#22c55e', name: '绿色', hex: '#22c55e' },
  { value: '#f59e0b', name: '橙色', hex: '#f59e0b' },
  { value: '#8b5cf6', name: '紫色', hex: '#8b5cf6' },
  { value: '#000000', name: '黑色', hex: '#000000' },
]

/**
 * 切换形状工具
 */
const toggleShapeTool = (tool: 'rectangle' | 'circle' | 'arrow') => {
  const newTool = props.modelValue.shapeTool === tool ? null : tool
  emit('update:modelValue', { ...props.modelValue, shapeTool: newTool })
}

/**
 * 页码输入处理
 */
const handlePageInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const page = Number.parseInt(input.value, 10)
  if (page >= 1 && page <= totalPages) {
    emit('page-change', page)
  } else {
    input.value = String(currentPage)
  }
}
</script>

<style scoped lang="scss">
.bottom-toolbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--b3-theme-surface);
  border-top: 1px solid var(--b3-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-left {
  flex: 1;
  justify-content: flex-start;
  position: relative;
}

.toolbar-center {
  flex: 1;
  justify-content: center;
  gap: 8px;
}

.toolbar-right {
  flex: 1;
  justify-content: flex-end;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--b3-theme-surface-light);
    color: var(--b3-theme-primary);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
    background: var(--b3-theme-primary-light);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.active {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }
}

/* 标注类型选择器 */
.annotation-type-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  }

  .type-icon {
    font-size: 14px;
    font-weight: bold;
  }

  .type-label {
    white-space: nowrap;
  }
}

/* 高亮颜色选择器 */
.highlight-color-picker,
.shape-color-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    transform: scale(1.15);
    border-color: rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-color: var(--b3-theme-on-surface);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    transform: scale(1.1);
  }
}

/* 形状工具 */
.toolbar-divider-vertical {
  width: 1px;
  height: 24px;
  background: var(--b3-theme-divider);
  margin: 0 8px;
}

.shape-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shape-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

/* 页码输入 */
.page-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-input {
  width: 48px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: var(--b3-theme-primary);
  }
}

.page-total-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}
</style>
