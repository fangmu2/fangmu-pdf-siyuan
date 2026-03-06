<template>
  <Teleport to="body">
    <Transition name="bg-editor-fade">
      <div
        v-if="internalVisible"
        ref="editorRef"
        class="node-background-editor"
        :style="{
          left: `${x}px`,
          top: `${y}px`,
        }"
        tabindex="-1"
        @click.stop
        @keydown="handleKeydown"
      >
        <div class="bg-editor-header">
          <span class="bg-editor-title">🖼️ 背景图片</span>
        </div>

        <div class="bg-editor-content">
          <!-- 图片上传区域 -->
          <div class="image-upload-section">
            <div class="upload-buttons">
              <label class="upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  class="file-input"
                  :disabled="isUploading"
                  @change="handleLocalUpload"
                />
                <span v-if="!isUploading">📁 上传本地图片</span>
                <span v-else>上传中...</span>
              </label>
              <button
                class="siyuan-select-btn"
                :disabled="isUploading"
                @click="selectFromSiyuan"
              >
                📚 从思源选择
              </button>
            </div>

            <!-- 上传进度 -->
            <div
              v-if="isUploading"
              class="upload-progress"
            >
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ uploadProgress }}%</span>
            </div>

            <!-- 错误提示 -->
            <div
              v-if="uploadError"
              class="upload-error"
            >
              ⚠️ {{ uploadError }}
            </div>
          </div>

          <!-- 当前图片预览 -->
          <div
            v-if="hasBackground"
            class="image-preview-section"
          >
            <div class="preview-title">
              当前背景
            </div>
            <div class="preview-container">
              <img
                :src="currentImageUrl"
                class="preview-image"
                alt="Background preview"
              />
              <button
                class="remove-btn"
                title="移除背景"
                @click="removeBackground"
              >
                🗑️ 移除
              </button>
            </div>
          </div>

          <!-- 背景设置 -->
          <div
            v-if="hasBackground"
            class="background-settings"
          >
            <!-- 显示模式 -->
            <div class="setting-item">
              <label class="setting-label">显示模式</label>
              <div class="mode-buttons">
                <button
                  v-for="mode in ['cover', 'contain', 'tile']"
                  :key="mode"
                  class="mode-btn"
                  :class="[{ active: currentMode === mode }]"
                  @click="() => { currentMode = mode as 'cover' | 'contain' | 'tile'; handleModeChange() }"
                >
                  {{ modeLabels[mode as 'cover' | 'contain' | 'tile'] }}
                </button>
              </div>
            </div>

            <!-- 透明度 -->
            <div class="setting-item">
              <label class="setting-label">
                透明度
                <span class="opacity-value">{{ Math.round(currentOpacity * 100) }}%</span>
              </label>
              <input
                v-model="currentOpacity"
                type="range"
                class="opacity-slider"
                min="0"
                max="1"
                step="0.1"
                @input="handleOpacityChange"
              />
              <div class="opacity-preview">
                <div
                  class="opacity-bar"
                  :style="{ opacity: currentOpacity }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 节点背景图片编辑器组件
 * 用于设置、调整节点背景图片
 */

import {
  computed,
  ref,
  watch,
} from 'vue'
import {
  compressImage,
  fileToBase64,
  uploadImage,
  validateImageFile,
} from '@/services/imageUploadService'

interface BackgroundConfig {
  url: string
  mode: 'cover' | 'contain' | 'tile'
  opacity: number
  position?: {
    x: number
    y: number
  }
}

interface Props {
  /** 是否显示编辑器 */
  modelValue: boolean
  /** 当前背景配置 */
  background?: BackgroundConfig
  /** 菜单位置 X */
  x: number
  /** 菜单位置 Y */
  y: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:background', background: BackgroundConfig | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  background: undefined,
})

const emit = defineEmits<Emits>()

// 内部状态
const internalVisible = ref(false)
const editorRef = ref<HTMLElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)

// 当前配置
const currentMode = ref<'cover' | 'contain' | 'tile'>('cover')
const currentOpacity = ref(1)
const currentImageUrl = ref<string>('')

// 计算是否有背景图片
const hasBackground = computed(() => !!currentImageUrl.value)

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (val && props.background) {
      // 初始化当前配置
      currentMode.value = props.background.mode || 'cover'
      currentOpacity.value = props.background.opacity || 1
      currentImageUrl.value = props.background.url || ''
    } else if (!val) {
      // 关闭时重置状态
      uploadError.value = null
      uploadProgress.value = 0
    }
  },
  { immediate: true },
)

// 监听配置变化
watch(
  () => props.background,
  (bg) => {
    if (bg) {
      currentMode.value = bg.mode || 'cover'
      currentOpacity.value = bg.opacity || 1
      currentImageUrl.value = bg.url || ''
    }
  },
  { immediate: true },
)

// 点击外部关闭
function handleClickOutside(event: MouseEvent): void {
  if (editorRef.value && !editorRef.value.contains(event.target as Node)) {
    emit('update:modelValue', false)
  }
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

// 上传本地图片
async function handleLocalUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件
  const validation = validateImageFile(file)
  if (!validation.valid) {
    uploadError.value = validation.error || '图片验证失败'
    return
  }

  isUploading.value = true
  uploadError.value = null
  uploadProgress.value = 0

  try {
    // 压缩图片（如果需要）
    let processedFile = file
    if (file.size > 2 * 1024 * 1024) { // 大于 2MB 则压缩
      processedFile = await compressImage(file, 1920, 0.8)
      uploadProgress.value = 30
    }

    // 转换为 Base64（小图片）或上传到思源
    if (processedFile.size < 500 * 1024) { // 小于 500KB 使用 Base64
      const base64 = await fileToBase64(processedFile)
      currentImageUrl.value = base64
      uploadProgress.value = 100
    } else {
      // 上传到思源资源库
      const url = await uploadImage(processedFile)
      currentImageUrl.value = url
      uploadProgress.value = 100
    }

    // 立即应用
    applyBackground()
  } catch (error) {
    console.error('图片上传失败:', error)
    uploadError.value = error instanceof Error ? error.message : '上传失败'
  } finally {
    isUploading.value = false
    input.value = '' // 清空 input
  }
}

// 从思源选择图片
async function selectFromSiyuan(): Promise<void> {
  uploadError.value = null

  try {
    // TODO: 实现思源资源库选择器
    // 目前使用示例逻辑
    alert('思源资源库选择器功能开发中，请先使用本地上传功能')
  } catch (error) {
    console.error('从思源选择图片失败:', error)
    uploadError.value = '从思源选择图片失败'
  }
}

// 移除背景
function removeBackground(): void {
  currentImageUrl.value = ''
  currentMode.value = 'cover'
  currentOpacity.value = 1
  emit('update:background', undefined)
  emit('update:modelValue', false)
}

// 应用背景设置
function applyBackground(): void {
  if (!currentImageUrl.value) {
    emit('update:background', undefined)
    return
  }

  const config: BackgroundConfig = {
    url: currentImageUrl.value,
    mode: currentMode.value,
    opacity: currentOpacity.value,
  }

  emit('update:background', config)
}

// 模式切换
function handleModeChange(): void {
  applyBackground()
}

// 透明度变化
function handleOpacityChange(): void {
  applyBackground()
}

// 背景模式标签
const modeLabels: Record<'cover' | 'contain' | 'tile', string> = {
  cover: '覆盖',
  contain: '包含',
  tile: '平铺',
}
</script>

<style scoped>
.bg-editor-fade-enter-active,
.bg-editor-fade-leave-active {
  transition: all 0.15s ease;
}

.bg-editor-fade-enter-from,
.bg-editor-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.node-background-editor {
  position: fixed;
  width: 280px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  overflow: hidden;
}

.bg-editor-header {
  padding: 10px 12px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.bg-editor-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.bg-editor-content {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

/* 上传区域 */
.image-upload-section {
  margin-bottom: 12px;
}

.upload-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.upload-btn:hover:not(:has(:disabled)) {
  background: var(--siyuan-primary-dark, #337ecc);
}

.file-input {
  display: none;
}

.siyuan-select-btn {
  padding: 8px 12px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.siyuan-select-btn:hover:not(:disabled) {
  background: var(--siyuan-border, #e0e0e0);
}

.siyuan-select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn:has(:disabled),
.siyuan-select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 上传进度 */
.upload-progress {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--siyuan-border, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--siyuan-primary, #409eff);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
  min-width: 35px;
  text-align: right;
}

/* 错误提示 */
.upload-error {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--siyuan-error-bg, #fef0f0);
  color: var(--siyuan-error, #f56c6c);
  border-radius: 4px;
  font-size: 12px;
}

/* 预览区域 */
.image-preview-section {
  margin: 12px 0;
  padding-top: 12px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--siyuan-secondary-text, #999);
  margin-bottom: 8px;
}

.preview-container {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--siyuan-border, #e0e0e0);
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: cover;
  display: block;
}

.remove-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(245, 108, 108, 0.9);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: var(--siyuan-error, #f56c6c);
}

/* 背景设置 */
.background-settings {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.setting-item {
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-secondary-text, #666);
  margin-bottom: 6px;
}

.opacity-value {
  font-size: 11px;
  color: var(--siyuan-primary, #409eff);
  font-weight: 600;
}

.mode-buttons {
  display: flex;
  gap: 6px;
}

.mode-btn {
  flex: 1;
  padding: 6px 8px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: var(--siyuan-border, #e0e0e0);
}

.mode-btn.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-color: var(--siyuan-primary, #409eff);
}

/* 透明度滑块 */
.opacity-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, transparent, var(--siyuan-primary, #409eff));
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid var(--siyuan-primary, #409eff);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.opacity-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid var(--siyuan-primary, #409eff);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.opacity-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.opacity-preview {
  margin-top: 6px;
  height: 12px;
  background: repeating-linear-gradient(
    45deg,
    #ccc 0px,
    #ccc 10px,
    #fff 10px,
    #fff 20px
  );
  border-radius: 4px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
}

.opacity-bar {
  width: 100%;
  height: 100%;
  background: var(--siyuan-primary, #409eff);
  border-radius: 4px;
}

/* 滚动条样式 */
.bg-editor-content::-webkit-scrollbar {
  width: 4px;
}

.bg-editor-content::-webkit-scrollbar-track {
  background: transparent;
}

.bg-editor-content::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 2px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .node-background-editor {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .bg-editor-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .bg-editor-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .siyuan-select-btn {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
    border-color: var(--siyuan-border, #444);
  }

  .siyuan-select-btn:hover:not(:disabled) {
    background: var(--siyuan-border, #444);
  }

  .mode-btn {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
    border-color: var(--siyuan-border, #444);
  }

  .mode-btn:hover {
    background: var(--siyuan-border, #444);
  }

  .opacity-slider {
    background: linear-gradient(to right, transparent, var(--siyuan-primary, #409eff));
  }
}
</style>
