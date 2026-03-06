<template>
  <div
    class="export-dialog-overlay"
    @click.self="close"
  >
    <div class="export-dialog">
      <div class="dialog-header">
        <h3>{{ mode === 'export' ? '导出学习集' : '导入学习集' }}</h3>
        <button
          class="close-btn"
          @click="close"
        >
          ×
        </button>
      </div>

      <div class="dialog-body">
        <!-- 导出模式 -->
        <template v-if="mode === 'export'">
          <div class="export-section">
            <div class="section-title">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
              </svg>
              <span>导出选项</span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="exportOptions.includeReviews"
                  type="checkbox"
                />
                <span>包含复习记录</span>
              </label>
            </div>

            <div
              v-if="exportPreview"
              class="export-preview"
            >
              <h4>导出预览</h4>
              <div class="preview-item">
                <span class="label">学习集名称:</span>
                <span class="value">{{ exportPreview.studySetName }}</span>
              </div>
              <div class="preview-item">
                <span class="label">卡片数量:</span>
                <span class="value">{{ exportPreview.cardCount }}</span>
              </div>
              <div class="preview-item">
                <span class="label">闪卡数量:</span>
                <span class="value">{{ exportPreview.flashCardCount }}</span>
              </div>
              <div
                v-if="exportOptions.includeReviews"
                class="preview-item"
              >
                <span class="label">复习记录:</span>
                <span class="value">{{ exportPreview.reviewCount }}</span>
              </div>
              <div class="preview-item">
                <span class="label">导出日期:</span>
                <span class="value">{{ new Date().toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 导入模式 -->
        <template v-else>
          <div class="import-section">
            <div class="section-title">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
              <span>选择文件</span>
            </div>

            <div
              class="file-dropzone"
              :class="{
                'drag-over': isDragOver, 'has-file': selectedFile,
              }"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="handleDrop"
              @click="triggerFileSelect"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".json"
                style="display: none"
                @change="handleFileSelect"
              />

              <template v-if="!selectedFile">
                <div class="dropzone-content">
                  <svg
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    fill="currentColor"
                    class="dropzone-icon"
                  >
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <p class="dropzone-text">
                    拖拽文件到此处，或点击选择文件
                  </p>
                  <p class="dropzone-hint">
                    支持 .json 格式的导出文件
                  </p>
                </div>
              </template>

              <template v-else>
                <div class="file-selected-content">
                  <svg
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    fill="currentColor"
                    class="file-icon"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <p class="file-name">
                    {{ selectedFile.name }}
                  </p>
                  <p class="file-size">
                    {{ formatFileSize(selectedFile.size) }}
                  </p>
                  <button
                    class="clear-file-btn"
                    @click.stop="clearFile"
                  >
                    清除
                  </button>
                </div>
              </template>
            </div>

            <!-- 导入预览 -->
            <div
              v-if="importPreview"
              class="import-preview"
            >
              <h4>导入预览</h4>
              <div class="preview-grid">
                <div class="preview-card">
                  <span class="preview-value">{{ importPreview.studySetName }}</span>
                  <span class="preview-label">学习集名称</span>
                </div>
                <div class="preview-card">
                  <span class="preview-value">{{ importPreview.cardCount }}</span>
                  <span class="preview-label">卡片数量</span>
                </div>
                <div class="preview-card">
                  <span class="preview-value">{{ importPreview.flashCardCount }}</span>
                  <span class="preview-label">闪卡数量</span>
                </div>
                <div class="preview-card">
                  <span class="preview-value">{{ importPreview.reviewCount }}</span>
                  <span class="preview-label">复习记录</span>
                </div>
              </div>

              <div class="import-options">
                <label class="checkbox-label">
                  <input
                    v-model="importOptions.importReviews"
                    type="checkbox"
                  />
                  <span>导入复习记录</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="importOptions.renameIfConflict"
                    type="checkbox"
                  />
                  <span>名称冲突时自动重命名</span>
                </label>
              </div>
            </div>

            <!-- 验证错误 -->
            <div
              v-if="importError"
              class="error-message"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{{ importError }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="dialog-footer">
        <button
          class="btn-cancel"
          @click="close"
        >
          取消
        </button>
        <button
          class="btn-confirm"
          :disabled="isProcessing || (mode === 'import' && !selectedFile)"
          @click="handleConfirm"
        >
          <span
            v-if="isProcessing"
            class="loading-spinner"
          ></span>
          <span>{{ mode === 'export' ? '导出' : '导入' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  ImportOptions,
  ImportPreview,

} from '../services/studySetExportService'
import {
  ref,
  watch,
} from 'vue'
import {



  studySetExportService,
} from '../services/studySetExportService'

interface Props {
  studySetId?: string
  mode?: 'export' | 'import'
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
  mode: 'export',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>()

// 状态
const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const isProcessing = ref(false)
const exportPreview = ref<any>(null)
const importPreview = ref<ImportPreview | null>(null)
const importError = ref('')
const fileInputRef = ref<HTMLInputElement>()

// 导出选项
const exportOptions = ref({
  includeReviews: true,
})

// 导入选项
const importOptions = ref<ImportOptions>({
  importReviews: true,
  renameIfConflict: true,
})

// 加载导出预览
watch(() => props.studySetId, async (id) => {
  if (id && props.mode === 'export') {
    try {
      const data = await studySetExportService.exportStudySet(id)
      exportPreview.value = studySetExportService.previewImport(data)
    } catch (error) {
      console.error('[ExportDialog] 加载预览失败:', error)
    }
  }
}, { immediate: true })

// 处理方法
const close = () => {
  emit('close')
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    loadFile(file)
  }
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) {
    loadFile(file)
  }
}

const loadFile = async (file: File) => {
  importError.value = ''
  selectedFile.value = file

  try {
    // 验证文件
    const validation = await studySetExportService.validateExportFile(file)
    if (!validation.valid) {
      importError.value = validation.error || '文件格式不正确'
      selectedFile.value = null
      return
    }

    // 读取并预览
    const data = await studySetExportService.readExportFile(file)
    importPreview.value = studySetExportService.previewImport(data)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : '文件读取失败'
    selectedFile.value = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  importPreview.value = null
  importError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const handleConfirm = async () => {
  if (isProcessing.value) return

  isProcessing.value = true

  try {
    if (props.mode === 'export') {
      // 导出
      if (!props.studySetId) {
        throw new Error('未指定学习集 ID')
      }

      const data = await studySetExportService.exportStudySet(props.studySetId)
      studySetExportService.downloadExportFile(data)
      emit('success', '导出成功！')
    } else {
      // 导入
      if (!selectedFile.value) {
        throw new Error('请选择文件')
      }

      const data = await studySetExportService.readExportFile(selectedFile.value)
      await studySetExportService.importStudySet(data, importOptions.value)
      emit('success', '导入成功！')
    }

    close()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    emit('error', message)
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped lang="scss">
.export-dialog-overlay {
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

.export-dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-surface);
    }
  }
}

.dialog-body {
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
}

.form-group {
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--b3-theme-on-surface);
  font-size: 14px;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.export-preview,
.import-preview {
  margin-top: 20px;
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--b3-border-color);

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: var(--b3-theme-on-surface-light);
    font-size: 13px;
  }

  .value {
    color: var(--b3-theme-on-surface);
    font-size: 13px;
    font-weight: 500;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.preview-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  text-align: center;

  .preview-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--b3-theme-primary);
    margin-bottom: 4px;
  }

  .preview-label {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
  }
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-dropzone {
  border: 2px dashed var(--b3-border-color);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &.drag-over {
    border-color: var(--b3-theme-primary);
    background: rgba(var(--b3-theme-primary-rgb), 0.1);
  }

  &.has-file {
    border-color: var(--b3-theme-success);
    background: rgba(var(--b3-theme-success-rgb), 0.1);
  }
}

.dropzone-content,
.file-selected-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone-icon {
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 8px;
}

.dropzone-text {
  margin: 0;
  color: var(--b3-theme-on-surface);
  font-size: 14px;
}

.dropzone-hint {
  margin: 0;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
}

.file-icon {
  color: var(--b3-theme-primary);
  margin-bottom: 8px;
}

.file-name {
  margin: 0;
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  font-weight: 500;
}

.file-size {
  margin: 0;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
}

.clear-file-btn {
  margin-top: 8px;
  padding: 4px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--b3-theme-danger);
    color: var(--b3-theme-danger);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-top: 16px;
  background: rgba(var(--b3-theme-danger-rgb), 0.1);
  border-radius: 8px;
  color: var(--b3-theme-danger);
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
