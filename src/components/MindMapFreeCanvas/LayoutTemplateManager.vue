<template>
  <div class="template-manager">
    <!-- 成功消息 -->
    <transition name="fade">
      <div
        v-if="successMessage"
        class="toast toast-success"
      >
        {{ successMessage }}
      </div>
    </transition>

    <!-- 错误消息 -->
    <transition name="fade">
      <div
        v-if="errorMessage"
        class="toast toast-error"
      >
        {{ errorMessage }}
      </div>
    </transition>

    <!-- 预设模板 -->
    <div class="template-section">
      <h3 class="template-section-title">
        <span class="template-section-icon">📦</span>
        预设模板
      </h3>
      <div class="template-grid">
        <div
          v-for="template in presetTemplates"
          :key="template.id"
          class="template-card"
          :class="{ active: currentTemplate?.id === template.id }"
          @click="applyTemplate(template)"
        >
          <div class="template-card-header">
            <span class="template-icon">{{ getLayoutTypeIcon(template.layoutType) }}</span>
            <span class="template-badge">预设</span>
          </div>
          <div class="template-name">
            {{ template.name }}
          </div>
          <div class="template-desc">
            {{ template.description }}
          </div>
          <div class="template-actions">
            <button
              class="template-action-btn"
              title="应用模板"
              @click.stop="applyTemplate(template)"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义模板 -->
    <div class="template-section">
      <div class="template-section-header">
        <h3 class="template-section-title">
          <span class="template-section-icon">📁</span>
          自定义模板
        </h3>
        <div class="template-section-actions">
          <button
            class="template-import-btn"
            title="导入模板"
            @click="showImportDialog = true"
          >
            📥 导入
          </button>
        </div>
      </div>

      <div
        v-if="customTemplates.length === 0"
        class="empty-state"
      >
        <p>暂无自定义模板</p>
        <p class="empty-hint">
          保存当前布局或导入模板文件来创建自定义模板
        </p>
      </div>

      <div
        v-else
        class="template-grid"
      >
        <div
          v-for="template in customTemplates"
          :key="template.id"
          class="template-card"
          @click="applyTemplate(template)"
        >
          <div class="template-card-header">
            <span class="template-icon">{{ getLayoutTypeIcon(template.layoutType) }}</span>
          </div>
          <div class="template-name">
            {{ template.name }}
          </div>
          <div class="template-desc">
            {{ template.description }}
          </div>
          <div class="template-actions">
            <button
              class="template-action-btn"
              title="应用模板"
              @click.stop="applyTemplate(template)"
            >
              应用
            </button>
            <button
              class="template-action-btn template-action-btn-danger"
              title="删除模板"
              @click.stop="deleteTemplate(template)"
            >
              删除
            </button>
            <button
              class="template-action-btn"
              title="导出模板"
              @click.stop="handleExportTemplate(template)"
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存对话框 -->
    <transition name="dialog-fade">
      <div
        v-if="showSaveDialog"
        class="dialog-overlay"
        @click.self="showSaveDialog = false"
      >
        <div class="dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">
              保存布局模板
            </h3>
            <button
              class="dialog-close"
              @click="showSaveDialog = false"
            >
              ×
            </button>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label class="form-label">模板名称 <span class="required">*</span></label>
              <input
                v-model="newTemplateName"
                class="form-input"
                type="text"
                placeholder="例如：我的树状布局"
                maxlength="50"
              />
            </div>
            <div class="form-group">
              <label class="form-label">模板描述</label>
              <textarea
                v-model="newTemplateDesc"
                class="form-textarea"
                placeholder="描述这个模板的用途和特点"
                maxlength="200"
                rows="3"
              />
            </div>
          </div>
          <div class="dialog-footer">
            <button
              class="dialog-btn dialog-btn-secondary"
              @click="showSaveDialog = false"
            >
              取消
            </button>
            <button
              class="dialog-btn dialog-btn-primary"
              @click="saveTemplate"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 导入对话框 -->
    <transition name="dialog-fade">
      <div
        v-if="showImportDialog"
        class="dialog-overlay"
        @click.self="showImportDialog = false"
      >
        <div class="dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">
              导入布局模板
            </h3>
            <button
              class="dialog-close"
              @click="showImportDialog = false"
            >
              ×
            </button>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label class="form-label">选择模板文件</label>
              <input
                type="file"
                class="form-file"
                accept=".json"
                @change="handleImportFile"
              />
              <p class="form-hint">
                选择之前导出的 .json 格式模板文件
              </p>
            </div>
          </div>
          <div class="dialog-footer">
            <button
              class="dialog-btn dialog-btn-secondary"
              @click="showImportDialog = false"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 布局模板管理器组件
 * 提供预设模板展示、自定义模板管理、模板应用功能
 */

import type { LayoutTemplate } from '@/types/layoutTemplate'
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import {
  deleteCustomTemplate,
  exportTemplate,
  importTemplate,
  loadCustomTemplates,
  saveCustomTemplate,
} from '@/services/templateStorage'
import { PRESET_TEMPLATES } from '@/types/layoutTemplate'

interface Emits {
  (e: 'apply-template', template: LayoutTemplate): void
}

const emit = defineEmits<Emits>()

// ==================== State ====================

/** 预设模板 */
const presetTemplates = ref<LayoutTemplate[]>([])

/** 自定义模板 */
const customTemplates = ref<LayoutTemplate[]>([])

/** 是否显示保存对话框 */
const showSaveDialog = ref(false)

/** 新模板名称 */
const newTemplateName = ref('')

/** 新模板描述 */
const newTemplateDesc = ref('')

/** 当前待保存的模板配置 */
const pendingTemplateConfig = ref<any>(null)

/** 是否显示导入对话框 */
const showImportDialog = ref(false)

/** 错误消息 */
const errorMessage = ref('')

/** 成功消息 */
const successMessage = ref('')

// ==================== Computed ====================

/** 当前激活的模板（如果有） */
const currentTemplate = computed<LayoutTemplate | null>(() => {
  // 这个值由父组件传入或通过事件管理
  return null
})

// ==================== Methods ====================

/**
 * 加载所有模板
 */
function loadTemplates() {
  presetTemplates.value = PRESET_TEMPLATES
  customTemplates.value = loadCustomTemplates()
}

/**
 * 应用模板
 */
function applyTemplate(template: LayoutTemplate) {
  emit('apply-template', template)
  showSuccessMessage(`已应用模板：${template.name}`)
}

/**
 * 显示保存对话框
 */
function showSaveDialogHandler(templateConfig: any) {
  pendingTemplateConfig.value = templateConfig
  newTemplateName.value = ''
  newTemplateDesc.value = ''
  errorMessage.value = ''
  showSaveDialog.value = true
}

/**
 * 保存模板
 */
function saveTemplate() {
  if (!newTemplateName.value.trim()) {
    errorMessage.value = '请输入模板名称'
    return
  }

  if (!pendingTemplateConfig.value) {
    errorMessage.value = '模板配置为空'
    return
  }

  try {
    const template: LayoutTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.value.trim(),
      description: newTemplateDesc.value.trim() || '自定义布局模板',
      layoutType: pendingTemplateConfig.value.layoutType,
      icon: pendingTemplateConfig.value.icon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPreset: false,
      config: pendingTemplateConfig.value.config,
    }

    saveCustomTemplate(template)
    customTemplates.value.push(template)
    showSaveDialog.value = false
    pendingTemplateConfig.value = null
    showSuccessMessage('模板保存成功')
  } catch (error) {
    errorMessage.value = '保存失败，请重试'
    console.error('保存模板失败:', error)
  }
}

/**
 * 删除模板
 */
function deleteTemplate(template: LayoutTemplate) {
  if (!confirm(`确定要删除模板"${template.name}"吗？`)) {
    return
  }

  try {
    deleteCustomTemplate(template.id)
    customTemplates.value = customTemplates.value.filter((t) => t.id !== template.id)
    showSuccessMessage('模板已删除')
  } catch (error) {
    errorMessage.value = '删除失败，请重试'
    console.error('删除模板失败:', error)
  }
}

/**
 * 导出模板
 */
function handleExportTemplate(template: LayoutTemplate) {
  try {
    exportTemplate(template)
    showSuccessMessage('模板已导出')
  } catch (error) {
    errorMessage.value = '导出失败，请重试'
    console.error('导出模板失败:', error)
  }
}

/**
 * 导入模板
 */
function handleImportFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  importTemplate(file)
    .then((template) => {
      saveCustomTemplate(template)
      customTemplates.value.push(template)
      showSuccessMessage('模板导入成功')
      showImportDialog.value = false
      // 清空文件输入
      target.value = ''
    })
    .catch((error) => {
      errorMessage.value = error.message || '导入失败，请重试'
      console.error('导入模板失败:', error)
    })
}

/**
 * 显示成功消息
 */
function showSuccessMessage(message: string) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

/**
 * 获取模板类型图标
 */
function getLayoutTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    free: '🎨',
    tree: '🌳',
    fishbone: '🐟',
    timeline: '📅',
    concept: '🕸️',
  }
  return iconMap[type] || '📄'
}

// ==================== Lifecycle ====================

onMounted(() => {
  loadTemplates()
})

// ==================== Expose ====================

defineExpose({
  showSaveDialog: showSaveDialogHandler,
})
</script>

<style scoped>
.template-manager {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Toast 消息 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  z-index: 9999;
  animation: slide-in-right 0.3s ease;
}

.toast-success {
  background-color: #10b981;
}

.toast-error {
  background-color: #ef4444;
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 区块 */
.template-section {
  margin-bottom: 24px;
}

.template-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.template-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.template-section-icon {
  font-size: 18px;
}

.template-section-actions {
  display: flex;
  gap: 8px;
}

.template-import-btn {
  padding: 6px 12px;
  font-size: 13px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-import-btn:hover {
  background-color: #e5e7eb;
}

/* 模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

/* 模板卡片 */
.template-card {
  position: relative;
  padding: 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.template-card.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.template-icon {
  font-size: 28px;
}

.template-badge {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background-color: #f3f4f6;
  border-radius: 12px;
  text-transform: uppercase;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.4;
}

.template-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.template-card:hover .template-actions {
  opacity: 1;
}

.template-action-btn {
  flex: 1;
  padding: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
  background-color: #eff6ff;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-action-btn:hover {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.template-action-btn-danger {
  color: #ef4444;
  background-color: #fef2f2;
}

.template-action-btn-danger:hover {
  background-color: #fee2e2;
  border-color: #ef4444;
}

/* 空状态 */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.dialog-close {
  width: 32px;
  height: 32px;
  font-size: 24px;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-close:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.dialog-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-btn-secondary {
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
}

.dialog-btn-secondary:hover {
  background-color: #f3f4f6;
}

.dialog-btn-primary {
  color: white;
  background-color: #3b82f6;
  border: 1px solid transparent;
}

.dialog-btn-primary:hover {
  background-color: #2563eb;
}

/* 表单 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  color: #1f2937;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-file {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.form-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

/* 对话框动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog,
.dialog-fade-leave-active .dialog {
  transition: transform 0.3s ease;
}

.dialog-fade-enter-from .dialog,
.dialog-fade-leave-to .dialog {
  transform: scale(0.95) translateY(-10px);
}
</style>
