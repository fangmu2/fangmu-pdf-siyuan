<template>
  <div
    v-if="visible"
    class="study-set-template-selector"
  >
    <!-- 遮罩层 -->
    <div
      class="overlay"
      @click="close"
    ></div>

    <!-- 模板选择面板 -->
    <div class="template-panel">
      <!-- 头部 -->
      <div class="panel-header">
        <h2>选择学习集模板</h2>
        <p class="subtitle">
          选择一个模板快速创建结构化的学习集
        </p>
        <button
          class="close-btn"
          title="关闭"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <!-- 标签切换 -->
      <div class="tab-bar">
        <button
          class="tab"
          :class="[{ active: activeTab === 'builtIn' }]"
          @click="activeTab = 'builtIn'"
        >
          内置模板
        </button>
        <button
          class="tab"
          :class="[{ active: activeTab === 'custom' }]"
          @click="activeTab = 'custom'"
        >
          自定义模板
        </button>
      </div>

      <!-- 模板列表 -->
      <div class="template-list">
        <!-- 内置模板 -->
        <div
          v-if="activeTab === 'builtIn'"
          class="template-grid"
        >
          <div
            v-for="template in builtInTemplates"
            :key="template.id"
            class="template-card"
            :class="[{ selected: selectedTemplate?.id === template.id }]"
            @click="selectTemplate(template)"
          >
            <div
              class="card-icon"
              :style="{ backgroundColor: template.color }"
            >
              {{ template.icon }}
            </div>
            <div class="card-content">
              <h3>{{ template.name }}</h3>
              <p class="description">
                {{ template.description }}
              </p>
              <div class="card-meta">
                <span class="tag-count">{{ template.defaultTags.length }} 个标签</span>
                <span class="card-count">{{ template.cards.length }} 张预设卡片</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义模板 -->
        <div
          v-else
          class="template-grid"
        >
          <div
            v-for="template in customTemplates"
            :key="template.id"
            class="template-card"
            :class="[{ selected: selectedTemplate?.id === template.id }]"
            @click="selectTemplate(template)"
          >
            <div
              class="card-icon"
              :style="{ backgroundColor: template.color }"
            >
              {{ template.icon }}
            </div>
            <div class="card-content">
              <h3>{{ template.name }}</h3>
              <p class="description">
                {{ template.description }}
              </p>
              <div class="card-actions">
                <button
                  class="edit-btn"
                  title="编辑"
                  @click.stop="editTemplate(template)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  class="delete-btn"
                  title="删除"
                  @click.stop="deleteTemplate(template.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 创建新模板按钮 -->
          <div
            class="template-card create-new"
            @click="openEditor"
          >
            <div class="card-icon">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <div class="card-content">
              <h3>创建自定义模板</h3>
              <p class="description">
                创建属于你自己的学习集模板
              </p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="activeTab === 'custom' && customTemplates.length === 0"
          class="empty-state"
        >
          <p>暂无自定义模板</p>
          <button
            class="create-btn"
            @click="openEditor"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            创建模板
          </button>
        </div>
      </div>

      <!-- 预览区域 -->
      <div
        v-if="selectedTemplate"
        class="template-preview"
      >
        <div class="preview-header">
          <h3>模板预览</h3>
          <div class="preview-actions">
            <button
              class="toggle-btn"
              @click="showPreviewDetail = !showPreviewDetail"
            >
              {{ showPreviewDetail ? '收起' : '展开' }}详情
            </button>
          </div>
        </div>

        <div
          v-if="showPreviewDetail"
          class="preview-content"
        >
          <div class="preview-section">
            <h4>预设卡片</h4>
            <ul class="preview-list">
              <li
                v-for="(card, index) in selectedTemplate.cards"
                :key="index"
              >
                <span
                  class="card-type"
                  :class="card.cardType"
                >
                  {{ card.cardType === 'flashcard' ? '📇' : '📝' }}
                </span>
                <span class="card-title">{{ card.title }}</span>
              </li>
            </ul>
          </div>

          <div class="preview-section">
            <h4>脑图结构</h4>
            <div class="mindmap-preview">
              <div
                v-for="node in selectedTemplate.mindMapNodes.filter(n => !n.parentId)"
                :key="node.id"
                class="node-item root"
              >
                <span v-if="node.style?.icon">{{ node.style.icon }}</span>
                <span>{{ node.text }}</span>
                <div class="child-nodes">
                  <div
                    v-for="child in selectedTemplate.mindMapNodes.filter(n => n.parentId === node.id)"
                    :key="child.id"
                    class="node-item child"
                  >
                    <span v-if="child.style?.icon">{{ child.style.icon }}</span>
                    <span>{{ child.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-section">
            <h4>复习设置</h4>
            <div class="settings-grid">
              <div class="setting-item">
                <span class="label">每日新卡</span>
                <span class="value">{{ selectedTemplate.reviewSettings.newCardsPerDay }} 张</span>
              </div>
              <div class="setting-item">
                <span class="label">复习上限</span>
                <span class="value">{{ selectedTemplate.reviewSettings.reviewLimit }} 张</span>
              </div>
              <div class="setting-item">
                <span class="label">算法</span>
                <span class="value">{{ selectedTemplate.reviewSettings.useFSRS ? 'FSRS' : 'SM-2' }}</span>
              </div>
              <div
                v-if="selectedTemplate.reviewSettings.useFSRS"
                class="setting-item"
              >
                <span class="label">记忆保留率</span>
                <span class="value">{{ (selectedTemplate.reviewSettings.fsrsParams?.requestRetention || 0.9) * 100 }}%</span>
              </div>
            </div>
          </div>

          <div class="preview-section">
            <h4>默认标签</h4>
            <div class="tags-container">
              <span
                v-for="tag in selectedTemplate.defaultTags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="panel-footer">
        <div class="study-set-name-input">
          <label>学习集名称</label>
          <input
            v-model="studySetName"
            type="text"
            placeholder="输入学习集名称"
            class="name-input"
          />
        </div>
        <button
          :disabled="!selectedTemplate || !studySetName.trim()"
          class="use-template-btn"
          :class="[{ disabled: !selectedTemplate || !studySetName.trim() }]"
          @click="useTemplate"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          使用模板创建
        </button>
      </div>
    </div>

    <!-- 模板编辑器弹窗 -->
    <StudySetTemplateEditor
      :template-id="editingTemplateId"
      :visible="editorVisible"
      @saved="handleTemplateSaved"
      @close="handleEditorClose"
    />
  </div>
</template>

<script setup lang="ts">
import type { StudySetTemplate } from '../services/studySetTemplateService'
import {
  computed,
  ref,
  watch,
} from 'vue'
import {

  studySetTemplateService,
} from '../services/studySetTemplateService'
import StudySetTemplateEditor from './StudySetTemplateEditor.vue'

const props = defineProps<{
  notebookId?: string
}>()

const emit = defineEmits<{
  (e: 'created', studySetId: string): void
  (e: 'close'): void
}>()

// 可见性
const visible = ref(false)

// 激活的标签
const activeTab = ref<'builtIn' | 'custom'>('builtIn')

// 选中的模板
const selectedTemplate = ref<StudySetTemplate | null>(null)

// 学习集名称
const studySetName = ref('')

// 显示预览详情
const showPreviewDetail = ref(true)

// 编辑器相关
const editorVisible = ref(false)
const editingTemplateId = ref<string | undefined>(undefined)

// 模板列表
const builtInTemplates = computed(() => studySetTemplateService.getBuiltInTemplates())
const customTemplates = computed(() => studySetTemplateService.getCustomTemplates())

// 监听选中模板变化
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate && !studySetName.value) {
    studySetName.value = `${newTemplate.name}学习集`
  }
})

// 打开
function open() {
  visible.value = true
  activeTab.value = 'builtIn'
  selectedTemplate.value = null
  studySetName.value = ''
  showPreviewDetail.value = true
}

// 关闭
function close() {
  visible.value = false
  emit('close')
}

// 选择模板
function selectTemplate(template: StudySetTemplate) {
  selectedTemplate.value = template
}

// 编辑模板
function editTemplate(template: StudySetTemplate) {
  editingTemplateId.value = template.id
  editorVisible.value = true
}

// 删除模板
function deleteTemplate(id: string) {
  if (confirm('确定要删除这个自定义模板吗？')) {
    studySetTemplateService.deleteTemplate(id)
  }
}

// 打开编辑器（新建）
function openEditor() {
  editingTemplateId.value = undefined
  editorVisible.value = true
}

// 处理模板保存
function handleTemplateSaved() {
  editorVisible.value = false
  editingTemplateId.value = undefined
}

// 处理编辑器关闭
function handleEditorClose() {
  editorVisible.value = false
  editingTemplateId.value = undefined
}

// 使用模板创建学习集
async function useTemplate() {
  if (!selectedTemplate.value || !studySetName.value.trim()) return

  try {
    const notebookId = props.notebookId
    if (!notebookId) {
      alert('请先选择笔记本')
      return
    }

    const result = await studySetTemplateService.createStudySetFromTemplate(
      selectedTemplate.value.id,
      studySetName.value.trim(),
      notebookId,
    )

    emit('created', result.studySetId)
    close()
  } catch (error) {
    console.error('使用模板创建学习集失败:', error)
    alert('创建失败，请重试')
  }
}

// 暴露方法
defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">
.study-set-template-selector {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.template-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  max-width: 95vw;
  max-height: 85vh;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

// 头部
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--b3-border-color);
  position: relative;

  h2 {
    margin: 0 0 4px;
    font-size: 18px;
    color: var(--b3-theme-on-background);
  }

  .subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

// 标签栏
.tab-bar {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--b3-border-color);
  gap: 8px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: var(--b3-theme-primary);
  }

  &.active {
    color: var(--b3-theme-primary);
    border-bottom-color: var(--b3-theme-primary);
  }
}

// 模板列表
.template-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.template-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--b3-border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &.create-new {
    border-style: dashed;
    align-items: center;
    justify-content: center;
    min-height: 120px;

    .card-icon {
      background: var(--b3-theme-surface) !important;
    }

    .card-content {
      text-align: center;

      h3 {
        font-size: 14px;
        color: var(--b3-theme-on-surface-light);
      }

      .description {
        font-size: 12px;
      }
    }
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  color: #fff;
}

.card-content {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 6px;
    font-size: 15px;
    color: var(--b3-theme-on-background);
  }

  .description {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
  }

  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;

    .template-card:hover & {
      opacity: 1;
    }
  }

  .edit-btn, .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-primary);
      color: #fff;
    }

    &.delete-btn:hover {
      background: #ea4335;
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--b3-theme-on-surface-light);

  .create-btn {
    margin-top: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: 1px solid var(--b3-border-color);
    background: var(--b3-theme-background);
    color: var(--b3-theme-primary);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: var(--b3-theme-surface-hover);
    }
  }
}

// 预览区域
.template-preview {
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  max-height: 300px;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;

  h3 {
    margin: 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
  }
}

.toggle-btn {
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

.preview-content {
  padding: 0 24px 20px;
}

.preview-section {
  margin-top: 16px;

  &:first-child {
    margin-top: 0;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
  }
}

.card-type {
  font-size: 14px;

  &.flashcard { color: #fbbc05; }
  &.normal { color: #4285f4; }
}

.mindmap-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);

  &.root {
    background: var(--b3-theme-background);
    font-weight: 500;
    color: var(--b3-theme-on-background);
  }

  &.child {
    margin-left: 20px;
    font-size: 12px;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;

  .label {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light);
  }

  .value {
    font-size: 14px;
    color: var(--b3-theme-on-background);
    font-weight: 500;
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);
}

// 底部操作栏
.panel-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.study-set-name-input {
  flex: 1;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
  }

  .name-input {
    width: 100%;
    height: 40px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    padding: 0 12px;
    font-size: 14px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }
}

.use-template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  background: var(--b3-theme-primary);
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }

  &.disabled {
    background: var(--b3-theme-surface-hover);
    color: var(--b3-theme-on-surface-light);
    cursor: not-allowed;
  }
}
</style>
