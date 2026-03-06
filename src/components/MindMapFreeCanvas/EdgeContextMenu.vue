<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="internalVisible && edge"
        ref="menuRef"
        class="edge-context-menu"
        :style="{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
        }"
      >
        <!-- 关联信息 -->
        <div class="edge-menu-section">
          <div class="edge-menu-header">
            <span class="edge-menu-icon">🔗</span>
            <span class="edge-menu-title">关联线属性</span>
          </div>
          <div class="edge-info-preview">
            <span class="edge-node-name">{{ sourceNodeTitle || '源节点' }}</span>
            <span class="edge-arrow">→</span>
            <span class="edge-node-name">{{ targetNodeTitle || '目标节点' }}</span>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="edge-menu-section">
          <button
            class="edge-menu-item"
            :disabled="readOnly"
            @click="handleEdit"
          >
            <span class="edge-menu-icon">✏️</span>
            <span>编辑属性</span>
          </button>
          <button
            v-if="edgeInfo?.label === '无标签'"
            class="edge-menu-item"
            :disabled="readOnly"
            @click="handleLabel"
          >
            <span class="edge-menu-icon">🏷️</span>
            <span>添加标签</span>
          </button>
          <button
            v-else
            class="edge-menu-item"
            :disabled="readOnly"
            @click="handleLabel"
          >
            <span class="edge-menu-icon">🏷️</span>
            <span>修改标签：{{ edgeInfo.label }}</span>
          </button>
          <button
            class="edge-menu-item"
            :disabled="readOnly"
            @click="handleToggleArrow"
          >
            <span class="edge-menu-icon">{{ edgeInfo?.hasArrow ? '🚫' : '➤' }}</span>
            <span>{{ edgeInfo?.hasArrow ? '隐藏箭头' : '显示箭头' }}</span>
          </button>
        </div>

        <!-- 颜色选择 -->
        <div class="edge-menu-section">
          <div class="edge-menu-label">
            颜色
          </div>
          <div class="edge-color-options">
            <button
              v-for="option in colorOptions"
              :key="option.value"
              class="edge-color-btn"
              :class="[option.class, { active: edgeInfo?.color === option.value }]"
              :style="{ backgroundColor: option.value }"
              :disabled="readOnly"
              :title="option.label"
              @click="handleColor(option.value)"
            >
              <span v-if="edgeInfo?.color === option.value">✓</span>
            </button>
          </div>
        </div>

        <!-- 线型选择 -->
        <div class="edge-menu-section">
          <div class="edge-menu-label">
            线型
          </div>
          <div class="edge-line-style-options">
            <button
              v-for="option in lineStyleOptions"
              :key="option.value"
              class="edge-line-style-btn"
              :class="{ active: edgeInfo?.lineStyle === option.label }"
              :disabled="readOnly"
              @click="handleStyle(option.value)"
            >
              <span class="line-icon">{{
                option.value === '0' ? '—'
                : option.value === '5,5' ? '┄┄'
                  : option.value === '2,4' ? '┅┅' : '─┄─'
              }}</span>
              <span class="line-text">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 线宽选择 -->
        <div class="edge-menu-section">
          <div class="edge-menu-label">
            粗细
          </div>
          <div class="edge-stroke-width-options">
            <button
              v-for="option in strokeWidthOptions"
              :key="option.value"
              class="edge-stroke-width-btn"
              :class="{ active: edgeInfo?.strokeWidth === option.label }"
              :disabled="readOnly"
              @click="handleWidth(option.value)"
            >
              <span
                class="width-bar"
                :style="{ height: `${option.value}px` }"
              ></span>
              <span class="width-text">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 删除操作 -->
        <div class="edge-menu-section edge-menu-section-danger">
          <button
            class="edge-menu-item edge-menu-item-danger"
            :disabled="readOnly"
            @click="handleDelete"
          >
            <span class="edge-menu-icon">🗑️</span>
            <span>删除关联</span>
          </button>
        </div>

        <!-- 只读提示 -->
        <div
          v-if="readOnly"
          class="edge-menu-section edge-readonly-hint"
        >
          <span class="edge-menu-icon">🔒</span>
          <span>只读模式</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 关联线右键菜单组件
 * 提供关联线的快捷操作菜单
 */

import type { CrossBranchLink } from '@/types/mindmapFree'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

interface Props {
  /** 是否显示菜单 */
  modelValue: boolean
  /** 菜单位置 X */
  x: number
  /** 菜单位置 Y */
  y: number
  /** 选中的关联线 */
  edge: CrossBranchLink | null
  /** 源节点标题 */
  sourceNodeTitle?: string
  /** 目标节点标题 */
  targetNodeTitle?: string
  /** 是否只读模式 */
  readOnly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'color', color: string): void
  (e: 'style', style: string): void
  (e: 'width', width: number): void
  (e: 'label', label: string): void
  (e: 'toggleArrow'): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  sourceNodeTitle: '',
  targetNodeTitle: '',
})

const emit = defineEmits<Emits>()

// 内部状态
const internalVisible = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const menuPosition = ref({
  x: 0,
  y: 0,
})

// 颜色选项
const colorOptions = [
  {
    value: '#FF6B6B',
    label: '红色',
    class: 'color-red',
  },
  {
    value: '#4ECDC4',
    label: '青色',
    class: 'color-cyan',
  },
  {
    value: '#45B7D1',
    label: '蓝色',
    class: 'color-blue',
  },
  {
    value: '#96CEB4',
    label: '绿色',
    class: 'color-green',
  },
  {
    value: '#FFEAA7',
    label: '黄色',
    class: 'color-yellow',
  },
  {
    value: '#DDA0DD',
    label: '紫色',
    class: 'color-purple',
  },
]

// 线型选项
const lineStyleOptions = [
  {
    value: '0',
    label: '实线',
  },
  {
    value: '5,5',
    label: '虚线',
  },
  {
    value: '2,4',
    label: '点线',
  },
  {
    value: '5,5,1,5',
    label: '点划线',
  },
]

// 线宽选项
const strokeWidthOptions = [
  {
    value: 1,
    label: '1px',
  },
  {
    value: 2,
    label: '2px',
  },
  {
    value: 3,
    label: '3px',
  },
  {
    value: 4,
    label: '4px',
  },
  {
    value: 5,
    label: '5px',
  },
]

// 计算当前关联线信息
const edgeInfo = computed(() => {
  if (!props.edge) return null

  const lineStyle = lineStyleOptions.find(
    (opt) => opt.value === props.edge?.style?.strokeDasharray,
  )
  const strokeWidth = strokeWidthOptions.find(
    (opt) => opt.value === props.edge?.style?.strokeWidth,
  )

  return {
    color: props.edge.style?.stroke || '#FF6B6B',
    lineStyle: lineStyle?.label || '虚线',
    strokeWidth: strokeWidth?.label || '2px',
    label: props.edge.label || '无标签',
    hasArrow: props.edge.style?.hasArrow ?? true,
  }
})

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (val) {
      // 计算菜单位置，确保不超出屏幕
      const menuWidth = 280
      const menuHeight = 400
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      menuPosition.value = {
        x: Math.min(props.x, screenWidth - menuWidth - 10),
        y: Math.min(props.y, screenHeight - menuHeight - 10),
      }
    }
  },
  { immediate: true },
)

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 菜单项点击处理
function handleEdit(): void {
  emit('edit')
  emit('update:modelValue', false)
}

function handleDelete(): void {
  emit('delete')
  emit('update:modelValue', false)
}

function handleColor(color: string): void {
  emit('color', color)
  emit('update:modelValue', false)
}

function handleStyle(style: string): void {
  emit('style', style)
  emit('update:modelValue', false)
}

function handleWidth(width: number): void {
  emit('width', width)
  emit('update:modelValue', false)
}

function handleLabel(): void {
  const label = window.prompt('输入关联标签：', props.edge?.label || '')
  if (label !== null) {
    emit('label', label)
  }
  emit('update:modelValue', false)
}

function handleToggleArrow(): void {
  emit('toggleArrow')
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* 动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 菜单容器 */
.edge-context-menu {
  position: fixed;
  min-width: 260px;
  max-width: 320px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100001;
  overflow: hidden;
  padding: 8px 0;
}

/* 菜单区域 */
.edge-menu-section {
  padding: 6px 0;
}

.edge-menu-section:not(:last-child) {
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.edge-menu-section-danger {
  padding: 4px 0;
}

/* 菜单头部 */
.edge-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  margin: -6px 0 8px 0;
}

.edge-menu-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.edge-menu-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

/* 关联信息预览 */
.edge-info-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  background: var(--siyuan-bg-tertiary, #fafafa);
}

.edge-node-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: var(--siyuan-text, #333);
}

.edge-arrow {
  color: var(--siyuan-primary, #409eff);
  font-weight: bold;
}

/* 菜单项 */
.edge-menu-item {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  transition: all 0.15s;
  text-align: left;
}

.edge-menu-item:hover:not(:disabled) {
  background: var(--siyuan-hover-bg, #f0f0f0);
}

.edge-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edge-menu-item-danger {
  color: var(--siyuan-error, #f56c6c);
}

.edge-menu-item-danger:hover:not(:disabled) {
  background: var(--siyuan-error-bg, #fef0f0);
}

/* 菜单标签 */
.edge-menu-label {
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--siyuan-secondary-text, #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 颜色选项 */
.edge-color-options {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 6px 12px;
}

.edge-color-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edge-color-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.edge-color-btn.active:not(:disabled) {
  border-color: var(--siyuan-text, #333);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.edge-color-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 特殊颜色文字 */
.edge-color-btn.color-yellow {
  color: #666;
}

/* 线型选项 */
.edge-line-style-options {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
}

.edge-line-style-btn {
  flex: 1;
  padding: 8px 6px;
  border: 2px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.edge-line-style-btn:hover:not(:disabled) {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.edge-line-style-btn.active:not(:disabled) {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-primary-bg, #e6f7ff);
  color: var(--siyuan-primary, #409eff);
}

.edge-line-style-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.line-icon {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
}

.line-text {
  font-size: 10px;
  color: var(--siyuan-secondary-text, #666);
}

/* 线宽选项 */
.edge-stroke-width-options {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
}

.edge-stroke-width-btn {
  flex: 1;
  padding: 8px 6px;
  border: 2px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.edge-stroke-width-btn:hover:not(:disabled) {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.edge-stroke-width-btn.active:not(:disabled) {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-primary-bg, #e6f7ff);
}

.edge-stroke-width-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.width-bar {
  width: 100%;
  background: var(--siyuan-text, #333);
  border-radius: 1px;
}

.width-text {
  font-size: 10px;
  color: var(--siyuan-secondary-text, #666);
}

/* 只读提示 */
.edge-readonly-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .edge-context-menu {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .edge-menu-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .edge-menu-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .edge-info-preview {
    background: var(--siyuan-bg-tertiary, #222);
  }

  .edge-node-name {
    color: var(--siyuan-text, #e0e0e0);
  }

  .edge-menu-item {
    color: var(--siyuan-text, #e0e0e0);
  }

  .edge-menu-item:hover:not(:disabled) {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .edge-menu-label {
    color: var(--siyuan-tertiary-text, #666);
  }

  .edge-line-style-btn,
  .edge-stroke-width-btn {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .edge-line-style-btn:hover:not(:disabled),
  .edge-stroke-width-btn:hover:not(:disabled) {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .edge-line-style-btn.active:not(:disabled),
  .edge-stroke-width-btn.active:not(:disabled) {
    background: var(--siyuan-primary-bg, #1d3a5a);
  }

  .line-text,
  .width-text {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .edge-readonly-hint {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-tertiary-text, #666);
  }
}
</style>
