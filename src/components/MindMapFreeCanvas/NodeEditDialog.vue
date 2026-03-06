<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="modelValue"
        class="freemind-dialog-overlay"
        @click.self="handleCancel"
      >
        <div class="freemind-dialog">
          <!-- 标题栏 -->
          <div class="freemind-dialog-header">
            <span class="freemind-dialog-icon">
              {{ nodeType === 'textCard' ? '📝' : nodeType === 'imageCard' ? '🖼️' : '📁' }}
            </span>
            <span class="freemind-dialog-title">
              {{ nodeType === 'textCard' ? '编辑文本卡片' : nodeType === 'imageCard' ? '编辑图片卡片' : '编辑分组' }}
            </span>
            <button
              class="freemind-dialog-close"
              @click="handleCancel"
            >
              ✕
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="freemind-dialog-body">
            <!-- 标题输入 -->
            <div class="freemind-form-item">
              <label class="freemind-form-label">标题</label>
              <input
                v-model="formData.title"
                type="text"
                class="freemind-form-input"
                placeholder="输入标题..."
                :disabled="readOnly"
              />
            </div>

            <!-- 内容输入 -->
            <div
              v-if="nodeType !== 'group'"
              class="freemind-form-item"
            >
              <label class="freemind-form-label">内容</label>
              <textarea
                v-model="formData.content"
                class="freemind-form-textarea"
                placeholder="输入内容..."
                :rows="4"
                :disabled="readOnly"
              />
            </div>

            <!-- 颜色选择 -->
            <div class="freemind-form-item">
              <label class="freemind-form-label">背景颜色</label>
              <div class="freemind-color-picker">
                <button
                  v-for="option in currentColorOptions"
                  :key="option.value"
                  class="freemind-color-option"
                  :class="{ active: formData.color === option.value }"
                  :style="{
                    backgroundColor: option.color,
                    border: formData.color === option.value ? '2px solid var(--siyuan-primary)' : '1px solid var(--siyuan-border)',
                  }"
                  :title="option.label"
                  @click="selectColor(option.value)"
                >
                  <span v-if="formData.color === option.value">✓</span>
                </button>
              </div>
            </div>

            <!-- 页码信息（只读） -->
            <div
              v-if="nodeData?.page && nodeType === 'imageCard'"
              class="freemind-form-item"
            >
              <label class="freemind-form-label">来源页码</label>
              <span class="freemind-form-static">第 {{ nodeData.page }} 页</span>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="freemind-dialog-footer">
            <button
              v-if="!readOnly && nodeType !== 'group'"
              class="freemind-btn freemind-btn-danger"
              @click="handleDelete"
            >
              🗑️ 删除
            </button>
            <div class="freemind-dialog-spacer" />
            <button
              class="freemind-btn freemind-btn-default"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              v-if="!readOnly"
              class="freemind-btn freemind-btn-primary"
              @click="handleSave"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 节点编辑对话框组件
 * 用于编辑思维导图节点的标题、内容、样式等
 */

import type {
  FreeMindMapNodeData,
  FreeMindMapNodeType,
} from '@/types/mindmapFree'
import {
  computed,
  ref,
  toRefs,
  watch,
} from 'vue'

interface Props {
  /** 是否显示对话框 */
  modelValue: boolean
  /** 节点类型 */
  nodeType: FreeMindMapNodeType
  /** 节点数据 */
  nodeData: FreeMindMapNodeData | null
  /** 是否只读模式 */
  readOnly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: Partial<FreeMindMapNodeData>): void
  (e: 'delete', nodeId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  nodeData: null,
})

const emit = defineEmits<Emits>()

const {
  modelValue,
  nodeData,
  nodeType,
} = toRefs(props)

// 表单数据
const formData = ref<Partial<FreeMindMapNodeData>>({
  title: '',
  content: '',
  color: '',
  customStyle: {},
})

// 颜色选项
const colorOptions = [
  {
    value: '',
    label: '默认',
    color: 'transparent',
  },
  {
    value: '#fef0f0',
    label: '红色',
    color: '#fef0f0',
  },
  {
    value: '#fdf6ec',
    label: '橙色',
    color: '#fdf6ec',
  },
  {
    value: '#fdf5e6',
    label: '黄色',
    color: '#fdf5e6',
  },
  {
    value: '#f0f9ff',
    label: '蓝色',
    color: '#f0f9ff',
  },
  {
    value: '#f0fff4',
    label: '绿色',
    color: '#f0fff4',
  },
  {
    value: '#fcf5f5',
    label: '紫色',
    color: '#fcf5f5',
  },
]

// 深色主题颜色选项
const darkColorOptions = [
  {
    value: '',
    label: '默认',
    color: 'transparent',
  },
  {
    value: '#4a1c1c',
    label: '红色',
    color: '#4a1c1c',
  },
  {
    value: '#4a361c',
    label: '橙色',
    color: '#4a361c',
  },
  {
    value: '#4a441c',
    label: '黄色',
    color: '#4a441c',
  },
  {
    value: '#1c3a4a',
    label: '蓝色',
    color: '#1c3a4a',
  },
  {
    value: '#1c4a2a',
    label: '绿色',
    color: '#1c4a2a',
  },
  {
    value: '#3a1c4a',
    label: '紫色',
    color: '#3a1c4a',
  },
]

// 是否深色主题
const isDarkTheme = ref(false)

// 检测主题
watch(
  () => modelValue.value,
  (val) => {
    if (val) {
      isDarkTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  },
)

// 监听节点数据变化
watch(
  nodeData,
  (newData) => {
    if (newData) {
      formData.value = {
        title: newData.title || '',
        content: newData.content || '',
        color: newData.color || '',
        customStyle: { ...newData.customStyle },
      }
    }
  },
  { immediate: true },
)

// 计算当前颜色选项
const currentColorOptions = computed(() => {
  return isDarkTheme.value ? darkColorOptions : colorOptions
})

// 保存
const handleSave = () => {
  emit('save', { ...formData.value })
  emit('update:modelValue', false)
}

// 取消
const handleCancel = () => {
  emit('update:modelValue', false)
}

// 删除
const handleDelete = () => {
  if (nodeData.value?.annotationId) {
    emit('delete', nodeData.value.annotationId)
  }
  emit('update:modelValue', false)
}

// 选择颜色
const selectColor = (color: string) => {
  formData.value.color = color
}
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.freemind-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.freemind-dialog {
  width: 100%;
  max-width: 500px;
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.freemind-dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.freemind-dialog-icon {
  font-size: 20px;
}

.freemind-dialog-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--siyuan-text, #333);
  flex: 1;
}

.freemind-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: var(--siyuan-secondary-text, #999);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.freemind-dialog-close:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
  color: var(--siyuan-text, #333);
}

.freemind-dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.freemind-form-item {
  margin-bottom: 16px;
}

.freemind-form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-secondary-text, #666);
  margin-bottom: 8px;
}

.freemind-form-input,
.freemind-form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--siyuan-border, #d0d0d0);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: var(--siyuan-input-bg, #fff);
  color: var(--siyuan-text, #333);
  transition: all 0.2s;
  box-sizing: border-box;
}

.freemind-form-input:focus,
.freemind-form-textarea:focus {
  outline: none;
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.freemind-form-input:disabled,
.freemind-form-textarea:disabled {
  background: var(--siyuan-disabled-bg, #f5f5f5);
  cursor: not-allowed;
}

.freemind-form-textarea {
  resize: vertical;
  min-height: 80px;
}

.freemind-form-static {
  display: inline-block;
  padding: 6px 12px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 6px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
}

.freemind-color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.freemind-color-option {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--siyuan-primary, #409eff);
  transition: all 0.2s;
}

.freemind-color-option:hover {
  transform: scale(1.1);
}

.freemind-color-option.active {
  transform: scale(1.1);
}

.freemind-dialog-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.freemind-dialog-spacer {
  flex: 1;
}

.freemind-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.freemind-btn-default {
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #d0d0d0);
  color: var(--siyuan-text, #333);
}

.freemind-btn-default:hover {
  background: var(--siyuan-hover-bg, #f0f0f0);
}

.freemind-btn-primary {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.freemind-btn-primary:hover {
  background: var(--siyuan-primary-hover, #66b1ff);
}

.freemind-btn-danger {
  background: var(--siyuan-danger, #f56c6c);
  color: #fff;
}

.freemind-btn-danger:hover {
  background: var(--siyuan-danger-hover, #f78989);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .freemind-dialog {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .freemind-dialog-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .freemind-dialog-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-dialog-close {
    color: var(--siyuan-secondary-text, #888);
  }

  .freemind-dialog-close:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-dialog-body {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .freemind-form-label {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .freemind-form-input,
  .freemind-form-textarea {
    background: var(--siyuan-input-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-form-input:focus,
  .freemind-form-textarea:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .freemind-form-static {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-dialog-footer {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .freemind-btn-default {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-btn-default:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }
}
</style>
