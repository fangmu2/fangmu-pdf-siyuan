<!-- src/components/AnnotationList/ExportSettingsPanel.vue -->
<template>
  <div class="export-settings-panel">
    <div
      class="panel-overlay"
      @click="close"
    ></div>
    <div class="panel-content">
      <div class="panel-header">
        <h3>批量导出设置</h3>
        <button
          class="close-btn"
          title="关闭"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div class="panel-body">
        <!-- 导出格式 -->
        <div class="settings-section">
          <h4 class="section-title">
            导出格式
          </h4>
          <div class="format-options">
            <label
              v-for="format in formatOptions"
              :key="format.value"
              class="format-option"
              :class="{ active: settings.format === format.value }"
            >
              <input
                v-model="settings.format"
                type="radio"
                :value="format.value"
                class="format-input"
              />
              <span class="format-icon">{{ format.icon }}</span>
              <span class="format-label">{{ format.label }}</span>
            </label>
          </div>
        </div>

        <!-- 分组选项 -->
        <div class="settings-section">
          <h4 class="section-title">
            分组选项
          </h4>
          <label class="checkbox-option">
            <input
              v-model="settings.groupByPage"
              type="checkbox"
            />
            <span class="checkbox-label">按页码分组</span>
          </label>
          <label class="checkbox-option">
            <input
              v-model="settings.groupByTag"
              type="checkbox"
            />
            <span class="checkbox-label">按标签分组</span>
          </label>
        </div>

        <!-- 内容选项 -->
        <div class="settings-section">
          <h4 class="section-title">
            内容选项
          </h4>
          <label class="checkbox-option">
            <input
              v-model="settings.includeImages"
              type="checkbox"
            />
            <span class="checkbox-label">包含图片</span>
          </label>
          <label class="checkbox-option">
            <input
              v-model="settings.includePageNumbers"
              type="checkbox"
            />
            <span class="checkbox-label">包含页码</span>
          </label>
          <label class="checkbox-option">
            <input
              v-model="settings.smartCrop"
              type="checkbox"
            />
            <span class="checkbox-label">智能裁剪图片</span>
          </label>
        </div>

        <!-- 模板管理 -->
        <div class="settings-section">
          <h4 class="section-title">
            模板管理
          </h4>
          <div class="template-actions">
            <input
              v-model="templateName"
              type="text"
              placeholder="输入模板名称"
              class="template-input"
            />
            <button
              class="action-btn"
              :disabled="!templateName.trim()"
              @click="saveTemplate"
            >
              保存模板
            </button>
          </div>
          <div
            v-if="templates.length > 0"
            class="template-list"
          >
            <div
              v-for="template in templates"
              :key="template.id"
              class="template-item"
              @click="loadTemplate(template)"
            >
              <span class="template-name">{{ template.name }}</span>
              <button
                class="template-delete"
                title="删除模板"
                @click.stop="deleteTemplate(template.id)"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button
          class="cancel-btn"
          @click="close"
        >
          取消
        </button>
        <button
          class="confirm-btn"
          @click="confirmExport"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          开始导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  ExportFormat,
  ExportOptions,
  ExportTemplate,
} from '../../services/batchExportService'
import {
  onMounted,
  reactive,
  ref,
} from 'vue'
import {
  deleteTemplate,
  getTemplates,
  saveAsTemplate,
} from '../../services/batchExportService'

const props = defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'export', options: ExportOptions): void
}>()

// 格式选项配置
const formatOptions: Array<{ value: ExportFormat, label: string, icon: string }> = [
  {
    value: 'markdown',
    label: 'Markdown',
    icon: '📝',
  },
  {
    value: 'html',
    label: 'HTML',
    icon: '🌐',
  },
  {
    value: 'word',
    label: 'Word',
    icon: '📄',
  },
  {
    value: 'anki',
    label: 'Anki 卡片',
    icon: '🎴',
  },
]

// 导出设置
const settings = reactive<ExportOptions>({
  format: 'markdown',
  includeImages: true,
  includePageNumbers: true,
  groupByPage: true,
  groupByTag: false,
  smartCrop: false,
  filename: '',
})

// 模板管理
const templateName = ref('')
const templates = ref<ExportTemplate[]>([])

// 加载模板列表
onMounted(() => {
  templates.value = getTemplates()
})

// 保存模板
const saveTemplate = () => {
  if (!templateName.value.trim()) return

  const id = saveAsTemplate(templateName.value.trim(), { ...settings })
  templates.value = getTemplates()
  templateName.value = ''
}

// 加载模板
const loadTemplate = (template: ExportTemplate) => {
  Object.assign(settings, template.options)
}

// 删除模板
const deleteTemplateById = (id: string) => {
  deleteTemplate(id)
  templates.value = getTemplates()
}

// 关闭面板
const close = () => {
  emit('close')
}

// 确认导出
const confirmExport = () => {
  const timestamp = new Date().toISOString().slice(0, 10)
  const extMap: Record<ExportFormat, string> = {
    markdown: 'md',
    html: 'html',
    word: 'doc',
    anki: 'txt',
    pdf: 'pdf',
  }

  settings.filename = `annotations-${timestamp}.${extMap[settings.format]}`

  emit('export', settings)
  close()
}
</script>

<style scoped lang="scss">
.export-settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.panel-content {
  position: relative;
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: panel-slide-up 0.3s ease-out;
}

@keyframes panel-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-background);
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--b3-theme-on-surface-light);
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-surface-light);
      color: var(--b3-theme-on-surface);
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.format-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.format-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--b3-theme-surface);
  border: 2px solid var(--b3-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-lightest);
  }

  &:hover {
    border-color: var(--b3-theme-primary);
    transform: translateY(-2px);
  }
}

.format-input {
  display: none;
}

.format-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.format-label {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
}

.checkbox-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin: 4px 0;
  background: var(--b3-theme-surface);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-lightest);
  }

  input[type="checkbox"] {
    margin: 0 10px 0 0;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .checkbox-label {
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }
}

.template-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.template-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);

  &::placeholder {
    color: var(--b3-theme-on-surface-light);
  }
}

.action-btn {
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
  }
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-lightest);

    .template-delete {
      opacity: 1;
    }
  }
}

.template-name {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
}

.template-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--b3-theme-on-surface-light);
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-danger);
    color: white;
  }
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cancel-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);

  &:hover {
    background: var(--b3-theme-surface-light);
  }
}

.confirm-btn {
  background: var(--b3-theme-primary);
  color: white;
  border: none;

  &:hover {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
