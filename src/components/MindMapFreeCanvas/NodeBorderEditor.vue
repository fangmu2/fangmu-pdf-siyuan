<template>
  <Teleport to="body">
    <Transition name="border-editor-fade">
      <div
        v-if="isVisible"
        class="border-editor-panel"
        :style="{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
        }"
      >
        <!-- 标题栏 -->
        <div class="border-editor-header">
          <span class="border-editor-title">
            <svg
              class="border-editor-icon"
              viewBox="0 0 24 24"
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
            {{ isMultiSelection ? `批量设置边框 (${selectedCount}个节点)` : '边框样式' }}
          </span>
          <button
            class="border-editor-close"
            title="关闭"
            @click="close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 边框样式选择 -->
        <div class="border-editor-section">
          <div class="border-editor-label">
            边框样式
          </div>
          <div class="border-style-options">
            <button
              v-for="option in borderStyleOptions"
              :key="option.value"
              class="border-style-btn"
              :class="{ active: borderStyle === option.value }"
              :title="option.label"
              @click="borderStyle = option.value"
            >
              <div
                class="style-preview"
                :style="{
                  borderTop: option.value === 'none'
                    ? 'none'
                    : `${option.value === 'double' ? '3px double' : `2px ${option.preview}`}`,
                  borderColor: '#666',
                }"
              ></div>
              <span class="style-label">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 边框粗细 -->
        <div class="border-editor-section">
          <div class="border-editor-label">
            <span>边框粗细</span>
            <span class="border-width-value">{{ borderWidth }}px</span>
          </div>
          <input
            v-model="borderWidth"
            type="range"
            class="border-width-slider"
            min="1"
            max="5"
            step="1"
          />
          <div class="border-width-preview">
            <div
              v-for="w in 5"
              :key="w"
              class="width-marker"
              :style="{
                height: `${w}px`,
                background: w === borderWidth ? 'var(--siyuan-primary, #409eff)' : '#ccc',
              }"
            ></div>
          </div>
        </div>

        <!-- 边框颜色 -->
        <div class="border-editor-section">
          <div class="border-editor-label">
            边框颜色
          </div>
          <div class="color-presets">
            <button
              v-for="color in borderColorPresets"
              :key="color"
              class="color-preset-btn"
              :style="{
                backgroundColor: color,
                border: borderColor === color ? '2px solid var(--siyuan-primary)' : '1px solid #ddd',
              }"
              :title="color"
              @click="selectPresetColor(color)"
            >
              <span v-if="borderColor === color">✓</span>
            </button>
          </div>
          <div class="custom-color-picker">
            <label>自定义颜色：</label>
            <input
              v-model="customBorderColor"
              type="color"
              class="color-input"
              @input="handleCustomColorChange"
            />
            <span class="color-hex">{{ customBorderColor }}</span>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="border-editor-section">
          <div class="border-editor-label">
            预览
          </div>
          <div class="preview-box">
            <div
              class="preview-node"
              :style="{
                borderStyle: borderStyle === 'none' ? 'none' : borderStyle,
                borderWidth: borderStyle === 'none' ? '0' : `${borderWidth}px`,
                borderColor: borderStyle === 'none' ? 'transparent' : borderColor,
                backgroundColor: '#fff',
              }"
            >
              <span>节点预览</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="border-editor-actions">
          <button
            class="btn-reset"
            @click="resetToDefault"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            重置
          </button>
          <button
            class="btn-apply"
            @click="applyBorder"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ isMultiSelection ? '应用到选中节点' : '应用' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 节点边框样式编辑器
 * 支持边框样式/颜色/粗细配置
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'
import {
  computed,
  ref,
  watch,
} from 'vue'

interface Props {
  /** 是否显示编辑器 */
  modelValue: boolean
  /** 选中的节点列表 */
  selectedNodes: FreeMindMapNode[]
  /** 编辑器位置 X */
  x: number
  /** 编辑器位置 Y */
  y: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply-border', border: {
    style?: string
    width?: number
    color?: string
  }): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedNodes: () => [],
})

const emit = defineEmits<Emits>()

// 边框样式选项
const borderStyleOptions = [
  {
    value: 'none',
    label: '无',
    preview: 'transparent',
  },
  {
    value: 'solid',
    label: '实线',
    preview: 'solid',
  },
  {
    value: 'dashed',
    label: '虚线',
    preview: 'dashed',
  },
  {
    value: 'dotted',
    label: '点线',
    preview: 'dotted',
  },
  {
    value: 'double',
    label: '双线',
    preview: 'double',
  },
]

// 边框颜色预设
const borderColorPresets = [
  '#333333',
  '#666666',
  '#999999',
  '#cccccc',
  '#f44336',
  '#ff9800',
  '#ffc107',
  '#ffeb3b',
  '#4caf50',
  '#8bc34a',
  '#00bcd4',
  '#2196f3',
  '#3f51b5',
  '#673ab7',
  '#9c27b0',
  '#e91e63',
]

// 内部状态
const isVisible = ref(false)
const borderStyle = ref<string>('solid')
const borderWidth = ref<number>(2)
const borderColor = ref<string>('#333333')
const customBorderColor = ref<string>('#333333')

// 计算选中节点数量
const selectedCount = computed(() => props.selectedNodes.length)

// 是否是多选模式
const isMultiSelection = computed(() => selectedCount.value > 1)

// 获取当前节点的边框样式（用于初始化）
function getCurrentBorderStyle(): string {
  if (props.selectedNodes.length === 0) return 'solid'
  return props.selectedNodes[0].data.borderStyle || 'solid'
}

// 获取当前节点的边框粗细
function getCurrentBorderWidth(): number {
  if (props.selectedNodes.length === 0) return 2
  return props.selectedNodes[0].data.borderWidth || 2
}

// 获取当前节点的边框颜色
function getCurrentBorderColor(): string {
  if (props.selectedNodes.length === 0) return '#333333'
  return props.selectedNodes[0].data.borderColor || '#333333'
}

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    isVisible.value = val
    if (val) {
      // 初始化值为当前节点的样式
      borderStyle.value = getCurrentBorderStyle()
      borderWidth.value = getCurrentBorderWidth()
      borderColor.value = getCurrentBorderColor()
      customBorderColor.value = getCurrentBorderColor()
    }
  },
  { immediate: true },
)

// 应用边框样式
function applyBorder(): void {
  const border = {
    style: borderStyle.value === 'none' ? undefined : borderStyle.value,
    width: borderStyle.value === 'none' ? undefined : borderWidth.value,
    color: borderStyle.value === 'none' ? undefined : borderColor.value,
  }

  emit('apply-border', border)
  emit('update:modelValue', false)
}

// 关闭编辑器
function close(): void {
  emit('update:modelValue', false)
}

// 选择预设颜色
function selectPresetColor(color: string): void {
  borderColor.value = color
  customBorderColor.value = color
}

// 自定义颜色选择
function handleCustomColorChange(event: Event): void {
  const target = event.target as HTMLInputElement
  customBorderColor.value = target.value
  borderColor.value = target.value
}

// 重置为默认值
function resetToDefault(): void {
  borderStyle.value = 'solid'
  borderWidth.value = 2
  borderColor.value = '#333333'
  customBorderColor.value = '#333333'
}

// 计算菜单位置
const menuPosition = computed(() => {
  const menuWidth = 280
  const menuHeight = 400
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  return {
    x: Math.min(props.x, screenWidth - menuWidth - 10),
    y: Math.min(props.y, screenHeight - menuHeight - 10),
  }
})
</script>

<style scoped>
/* 动画 */
.border-editor-fade-enter-active,
.border-editor-fade-leave-active {
  transition: all 0.2s ease;
}

.border-editor-fade-enter-from,
.border-editor-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* 编辑器面板 */
.border-editor-panel {
  position: fixed;
  width: 280px;
  max-height: 450px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 标题栏 */
.border-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.border-editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.border-editor-icon {
  width: 18px;
  height: 18px;
  color: var(--siyuan-primary, #409eff);
}

.border-editor-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--siyuan-secondary-text, #666);
  transition: all 0.2s;
}

.border-editor-close:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
  color: var(--siyuan-text, #333);
}

.border-editor-close svg {
  width: 16px;
  height: 16px;
}

/* 分区 */
.border-editor-section {
  padding: 12px 16px;
  border-bottom: 1px solid var(--siyuan-border, #f0f0f0);
}

.border-editor-section:last-child {
  border-bottom: none;
}

.border-editor-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-secondary-text, #666);
}

.border-width-value {
  font-size: 12px;
  color: var(--siyuan-primary, #409eff);
  font-weight: 600;
}

/* 边框样式选项 */
.border-style-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.border-style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  transition: all 0.2s;
}

.border-style-btn:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
  border-color: var(--siyuan-primary, #409eff);
}

.border-style-btn.active {
  background: var(--siyuan-primary-bg, #e6f2ff);
  border-color: var(--siyuan-primary, #409eff);
}

.style-preview {
  width: 100%;
  height: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.style-label {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
}

/* 边框粗细滑块 */
.border-width-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.border-width-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--siyuan-primary, #409eff);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.border-width-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--siyuan-primary, #409eff);
  cursor: pointer;
  border: none;
}

.border-width-preview {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 20px;
  margin-top: 8px;
  padding: 0 2px;
}

.width-marker {
  width: 4px;
  border-radius: 2px;
  transition: all 0.2s;
}

/* 颜色预设 */
.color-presets {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.color-preset-btn {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.color-preset-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 自定义颜色 */
.custom-color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-color-picker label {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 4px;
  cursor: pointer;
  padding: 2px;
}

.color-hex {
  font-size: 12px;
  font-family: monospace;
  color: var(--siyuan-secondary-text, #666);
  min-width: 70px;
}

/* 预览区域 */
.preview-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.preview-node {
  width: 120px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 操作按钮 */
.border-editor-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.btn-reset,
.btn-apply {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset {
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  color: var(--siyuan-secondary-text, #666);
}

.btn-reset:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
  border-color: var(--siyuan-primary, #409eff);
  color: var(--siyuan-primary, #409eff);
}

.btn-apply {
  background: var(--siyuan-primary, #409eff);
  border: 1px solid var(--siyuan-primary, #409eff);
  color: #fff;
}

.btn-apply:hover {
  background: var(--siyuan-primary-hover, #66b1ff);
  border-color: var(--siyuan-primary-hover, #66b1ff);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.btn-reset svg,
.btn-apply svg {
  width: 16px;
  height: 16px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .border-editor-panel {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .border-editor-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .border-editor-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .border-editor-close {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .border-editor-close:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .border-editor-section {
    border-color: var(--siyuan-border, #333);
  }

  .border-editor-label {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .border-style-btn {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .border-style-btn:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .border-style-btn.active {
    background: var(--siyuan-primary-bg, #1d3a5c);
    border-color: var(--siyuan-primary, #409eff);
  }

  .style-label {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .color-preset-btn {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .custom-color-picker label {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .color-hex {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .preview-box {
    background: #2a2a2a;
  }

  .preview-node {
    background: #3a3a3a;
    color: #aaa;
  }

  .border-editor-actions {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .btn-reset {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-secondary-text, #aaa);
  }

  .btn-reset:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }
}
</style>
