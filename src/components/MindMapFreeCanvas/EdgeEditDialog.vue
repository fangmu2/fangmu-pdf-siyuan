<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="internalVisible"
        class="edge-edit-overlay"
        @click.self="handleClose"
      >
        <div
          ref="dialogRef"
          class="edge-edit-dialog"
          :class="{ 'read-only': readOnly }"
        >
          <!-- 头部 -->
          <div class="dialog-header">
            <span class="dialog-title">✏️ 编辑关联线</span>
            <button
              class="close-btn"
              :disabled="readOnly"
              @click="handleClose"
            >
              ✕
            </button>
          </div>

          <!-- 内容 -->
          <div class="dialog-content">
            <!-- 关联信息 -->
            <div class="edge-info">
              <div class="edge-info-item">
                <span class="edge-info-label">源节点</span>
                <span class="edge-info-value">{{ sourceNodeTitle || '未知' }}</span>
              </div>
              <div class="edge-arrow">
                →
              </div>
              <div class="edge-info-item">
                <span class="edge-info-label">目标节点</span>
                <span class="edge-info-value">{{ targetNodeTitle || '未知' }}</span>
              </div>
            </div>

            <!-- 颜色选择器 -->
            <div class="form-section">
              <div class="form-label">
                关联颜色
              </div>
              <div class="color-options">
                <button
                  v-for="option in colorOptions"
                  :key="option.value"
                  class="color-btn"
                  :class="[option.class, { active: formData.color === option.value }]"
                  :style="{ backgroundColor: option.value }"
                  :disabled="readOnly"
                  :title="option.label"
                  @click="selectColor(option.value)"
                >
                  <span v-if="formData.color === option.value">✓</span>
                </button>
              </div>
            </div>

            <!-- 线型选择器 -->
            <div class="form-section">
              <div class="form-label">
                线条样式
              </div>
              <div class="line-style-options">
                <button
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  class="line-style-btn"
                  :class="{ active: formData.strokeDasharray === option.value }"
                  :disabled="readOnly"
                  @click="selectLineStyle(option.value)"
                >
                  <span class="line-preview">{{ option.icon }}</span>
                  <span class="line-label">{{ option.label }}</span>
                </button>
              </div>
            </div>

            <!-- 线宽滑块 -->
            <div class="form-section">
              <div class="form-label">
                线条粗细
                <span class="form-value">{{ formData.strokeWidth }}px</span>
              </div>
              <div class="stroke-width-options">
                <button
                  v-for="option in strokeWidthOptions"
                  :key="option.value"
                  class="stroke-width-btn"
                  :class="{ active: formData.strokeWidth === option.value }"
                  :disabled="readOnly"
                  @click="selectStrokeWidth(option.value)"
                >
                  <span
                    class="width-preview"
                    :style="{ height: `${option.value}px` }"
                  ></span>
                  <span class="width-label">{{ option.label }}</span>
                </button>
              </div>
            </div>

            <!-- 箭头开关 -->
            <div class="form-section">
              <div class="form-label">
                显示箭头
              </div>
              <label class="switch-label">
                <input
                  v-model="formData.hasArrow"
                  type="checkbox"
                  :disabled="readOnly"
                />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- 关联标签 -->
            <div class="form-section">
              <div class="form-label">
                关联标签
              </div>
              <input
                v-model="formData.label"
                type="text"
                class="label-input"
                placeholder="输入关联说明（可选）"
                :disabled="readOnly"
              />
            </div>

            <!-- 预览 -->
            <div class="form-section">
              <div class="form-label">
                预览效果
              </div>
              <div class="preview-box">
                <svg
                  width="200"
                  height="60"
                  class="preview-svg"
                >
                  <line
                    x1="20"
                    y1="30"
                    x2="180"
                    y2="30"
                    :stroke="formData.color"
                    :stroke-width="formData.strokeWidth"
                    :stroke-dasharray="formData.strokeDasharray"
                    :marker-end="formData.hasArrow ? 'url(#arrowhead)' : ''"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        :fill="formData.arrowColor"
                        points="0 0, 10 3.5, 0 7"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="dialog-footer">
            <button
              v-if="!readOnly"
              class="delete-btn"
              @click="handleDelete"
            >
              🗑️ 删除关联
            </button>
            <div class="footer-actions">
              <button
                class="cancel-btn"
                @click="handleClose"
              >
                取消
              </button>
              <button
                class="save-btn"
                :disabled="isSaveDisabled || readOnly"
                @click="handleSave"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 关联线编辑对话框组件
 * 提供关联线颜色、样式、宽度和标签的编辑功能
 */

import type { CrossBranchLink } from '@/types/mindmapFree'
import {
  computed,
  ref,
  watch,
} from 'vue'

interface Props {
  /** 是否显示对话框 */
  modelValue: boolean
  /** 要编辑的关联线 */
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
  (e: 'save', data: Partial<CrossBranchLink>): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  sourceNodeTitle: '',
  targetNodeTitle: '',
})

const emit = defineEmits<Emits>()

// 内部状态
const internalVisible = ref(false)
const dialogRef = ref<HTMLElement | null>(null)

// 表单数据
const formData = ref({
  color: '#FF6B6B',
  strokeDasharray: '5,5',
  strokeWidth: 2,
  label: '',
  hasArrow: true,
  arrowColor: '#FF6B6B',
})

// 预设颜色选项
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
  {
    value: '#FF8C42',
    label: '橙色',
    class: 'color-orange',
  },
  {
    value: '#A0AEC0',
    label: '灰色',
    class: 'color-gray',
  },
]

// 线型选项
const lineStyleOptions = [
  {
    value: '0',
    label: '实线',
    icon: '—',
  },
  {
    value: '5,5',
    label: '虚线',
    icon: '┄┄',
  },
  {
    value: '2,4',
    label: '点线',
    icon: '┅┅',
  },
  {
    value: '5,5,1,5',
    label: '点划线',
    icon: '─┄─',
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

// 计算是否禁用保存
const isSaveDisabled = computed(() => {
  return !formData.value.color || !formData.value.strokeDasharray
})

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (val && props.edge) {
      // 初始化表单数据
      formData.value = {
        color: props.edge.style?.stroke || '#FF6B6B',
        strokeDasharray: props.edge.style?.strokeDasharray || '5,5',
        strokeWidth: props.edge.style?.strokeWidth || 2,
        label: props.edge.label || '',
        hasArrow: props.edge.style?.hasArrow ?? true,
        arrowColor: props.edge.style?.arrowColor || props.edge.style?.stroke || '#FF6B6B',
      }
    }
  },
  { immediate: true },
)

// 监听 edge 变化
watch(
  () => props.edge,
  (newEdge) => {
    if (newEdge && internalVisible.value) {
      formData.value = {
        color: newEdge.style?.stroke || '#FF6B6B',
        strokeDasharray: newEdge.style?.strokeDasharray || '5,5',
        strokeWidth: newEdge.style?.strokeWidth || 2,
        label: newEdge.label || '',
        hasArrow: newEdge.style?.hasArrow ?? true,
        arrowColor: newEdge.style?.arrowColor || newEdge.style?.stroke || '#FF6B6B',
      }
    }
  },
  { immediate: true },
)

// 点击外部关闭对话框
function handleClickOutside(event: MouseEvent): void {
  if (dialogRef.value && !dialogRef.value.contains(event.target as Node)) {
    handleClose()
  }
}

// 关闭对话框
function handleClose(): void {
  emit('update:modelValue', false)
}

// 保存
function handleSave(): void {
  if (!props.edge) return

  const updateData: Partial<CrossBranchLink> = {
    id: props.edge.id,
    label: formData.value.label,
    style: {
      stroke: formData.value.color,
      strokeDasharray: formData.value.strokeDasharray,
      strokeWidth: formData.value.strokeWidth,
      hasArrow: formData.value.hasArrow,
      arrowColor: formData.value.arrowColor,
    },
  }

  emit('save', updateData)
  handleClose()
}

// 删除
function handleDelete(): void {
  emit('delete')
  handleClose()
}

// 选择颜色
function selectColor(color: string): void {
  formData.value.color = color
  formData.value.arrowColor = color
}

// 选择线型
function selectLineStyle(value: string): void {
  formData.value.strokeDasharray = value
}

// 选择线宽
function selectStrokeWidth(value: number): void {
  formData.value.strokeWidth = value
}
</script>

<style scoped>
/* 动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .edge-edit-dialog,
.dialog-fade-leave-to .edge-edit-dialog {
  transform: scale(0.95) translateY(-10px);
}

/* 遮罩层 */
.edge-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  backdrop-filter: blur(2px);
}

/* 对话框 */
.edge-edit-dialog {
  width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edge-edit-dialog.read-only {
  border: 1px solid var(--siyuan-border, #e0e0e0);
}

/* 头部 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f8f9fa);
}

.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: var(--siyuan-secondary-text, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--siyuan-hover-bg, #e9ecef);
  color: var(--siyuan-text, #333);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 内容 */
.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 关联信息 */
.edge-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 8px;
  margin-bottom: 20px;
}

.edge-info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edge-info-label {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
  font-weight: 500;
}

.edge-info-value {
  font-size: 13px;
  color: var(--siyuan-text, #333);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edge-arrows {
  font-size: 18px;
  color: var(--siyuan-primary, #409eff);
  font-weight: bold;
}

/* 表单区域 */
.form-section {
  margin-bottom: 20px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-value {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
  font-weight: 400;
}

/* 颜色选择器 */
.color-options {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.color-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--siyuan-text, #333);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.color-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 特殊颜色文字 */
.color-yellow {
  color: #666;
}

/* 线型选择器 */
.line-style-options {
  display: flex;
  gap: 8px;
}

.line-style-btn {
  flex: 1;
  padding: 10px 8px;
  border: 2px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.line-style-btn:hover {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.line-style-btn.active {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-primary-bg, #e6f7ff);
  color: var(--siyuan-primary, #409eff);
}

.line-style-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.line-preview {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
}

.line-label {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
}

/* 线宽选择器 */
.stroke-width-options {
  display: flex;
  gap: 8px;
}

.stroke-width-btn {
  flex: 1;
  padding: 10px 8px;
  border: 2px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.stroke-width-btn:hover {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.stroke-width-btn.active {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-primary-bg, #e6f7ff);
}

.stroke-width-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.width-preview {
  width: 100%;
  background: var(--siyuan-text, #333);
  border-radius: 1px;
}

.width-label {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
}

/* 开关 */
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding-left: 50px;
}

.switch-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.switch-slider {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 22px;
  background: var(--siyuan-border, #ccc);
  border-radius: 22px;
  transition: all 0.3s;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-label input:checked + .switch-slider {
  background: var(--siyuan-primary, #409eff);
}

.switch-label input:checked + .switch-slider:before {
  transform: translateX(18px);
}

.switch-label input:disabled + .switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 标签输入框 */
.label-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg, #fff);
  transition: all 0.2s;
}

.label-input:focus {
  outline: none;
  border-color: var(--siyuan-primary, #409eff);
}

.label-input:disabled {
  background: var(--siyuan-bg-secondary, #f5f5f5);
  cursor: not-allowed;
}

/* 预览 */
.preview-box {
  padding: 16px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

.preview-svg {
  background: var(--siyuan-bg, #fff);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 底部 */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f8f9fa);
}

.delete-btn {
  padding: 8px 16px;
  border: 1px solid var(--siyuan-error, #f56c6c);
  border-radius: 6px;
  background: transparent;
  color: var(--siyuan-error, #f56c6c);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: var(--siyuan-error-bg, #fef0f0);
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn,
.save-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  border: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg, #fff);
  color: var(--siyuan-text, #333);
}

.cancel-btn:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.save-btn {
  border: none;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.save-btn:hover:not(:disabled) {
  background: var(--siyuan-primary-hover, #66b1ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .edge-edit-dialog {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .dialog-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .dialog-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .close-btn {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .close-btn:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .edge-info {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .edge-info-label {
    color: var(--siyuan-tertiary-text, #666);
  }

  .edge-info-value {
    color: var(--siyuan-text, #e0e0e0);
  }

  .form-label {
    color: var(--siyuan-text, #e0e0e0);
  }

  .form-value {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .line-style-btn,
  .stroke-width-btn {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .line-style-btn:hover,
  .stroke-width-btn:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .line-style-btn.active,
  .stroke-width-btn.active {
    background: var(--siyuan-primary-bg, #1d3a5a);
  }

  .label-input {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .label-input:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .label-input:disabled {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .preview-box {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .preview-svg {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .cancel-btn {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .cancel-btn:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .dialog-footer {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }
}
</style>
