<template>
  <div class="mindmap-template-selector">
    <!-- 模板列表 -->
    <div class="template-grid">
      <!-- 系统模板 -->
      <div class="template-section">
        <h3 class="section-title">
          <SyIcon icon="stars" />
          系统模板
        </h3>
        <div class="template-cards">
          <div
            v-for="template in systemTemplates"
            :key="template.id"
            class="template-card"
            :class="{ selected: selectedTemplateId === template.id }"
            @click="selectTemplate(template.id)"
            @dblclick="confirmSelection"
          >
            <div class="card-icon" :style="{ backgroundColor: template.color }">
              <SyIcon :icon="template.icon" />
            </div>
            <div class="card-content">
              <h4 class="card-title">{{ template.name }}</h4>
              <p class="card-description">{{ template.description }}</p>
              <div class="card-meta">
                <span class="card-type">{{ getTemplateTypeLabel(template.type) }}</span>
                <span class="card-usage" v-if="template.usageCount > 0">
                  使用 {{ template.usageCount }} 次
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义模板 -->
      <div class="template-section" v-if="customTemplates.length > 0">
        <div class="section-header">
          <h3 class="section-title">
            <SyIcon icon="folder" />
            自定义模板
          </h3>
          <SyButton size="small" @click="showImportDialog = true">
            <SyIcon icon="upload" />
            导入
          </SyButton>
        </div>
        <div class="template-cards">
          <div
            v-for="template in customTemplates"
            :key="template.id"
            class="template-card"
            :class="{ selected: selectedTemplateId === template.id }"
            @click="selectTemplate(template.id)"
            @dblclick="confirmSelection"
          >
            <div class="card-actions">
              <SyButton size="small" @click.stop="editTemplate(template)">
                <SyIcon icon="edit" />
              </SyButton>
              <SyButton size="small" variant="danger" @click.stop="deleteTemplate(template.id)">
                <SyIcon icon="delete" />
              </SyButton>
            </div>
            <div class="card-icon" :style="{ backgroundColor: template.color }">
              <SyIcon :icon="template.icon" />
            </div>
            <div class="card-content">
              <h4 class="card-title">{{ template.name }}</h4>
              <p class="card-description">{{ template.description }}</p>
              <div class="card-meta">
                <span class="card-type">{{ getTemplateTypeLabel(template.type) }}</span>
                <span class="card-usage" v-if="template.usageCount > 0">
                  使用 {{ template.usageCount }} 次
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="allTemplates.length === 0" class="empty-state">
        <SyIcon icon="description" size="64" />
        <p>暂无模板</p>
      </div>
    </div>

    <!-- 预览面板 -->
    <div class="preview-panel" v-if="selectedTemplate">
      <h4>模板预览</h4>
      <div class="preview-content">
        <div class="preview-nodes">
          <MindMapNodePreview :nodes="selectedTemplate.rootNodes" />
        </div>
      </div>
      <div class="preview-tags">
        <span
          v-for="tag in selectedTemplate.tags"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <SyButton @click="showCreateDialog = true">
        <SyIcon icon="add" />
        从当前脑图创建模板
      </SyButton>
      <div class="action-spacer"></div>
      <SyButton @click="handleCancel">取消</SyButton>
      <SyButton type="primary" @click="confirmSelection" :disabled="!selectedTemplateId">
        <SyIcon icon="check" />
        使用模板
      </SyButton>
    </div>

    <!-- 创建模板对话框 -->
    <Dialog
      v-model:visible="showCreateDialog"
      title="从当前脑图创建模板"
      :width="500"
    >
      <div class="create-form">
        <div class="form-item">
          <label>模板名称</label>
          <SyInput v-model="newTemplate.name" placeholder="输入模板名称" />
        </div>
        <div class="form-item">
          <label>描述</label>
          <SyTextarea v-model="newTemplate.description" placeholder="模板描述" :rows="3" />
        </div>
        <div class="form-item">
          <label>类型</label>
          <SySelect v-model="newTemplate.type" :options="templateTypeOptions" />
        </div>
        <div class="form-item">
          <label>颜色</label>
          <input type="color" v-model="newTemplate.color" class="color-picker" />
        </div>
        <div class="form-item">
          <label>图标</label>
          <SyInput v-model="newTemplate.icon" placeholder="Material Icons 名称" />
        </div>
      </div>
      <template #footer>
        <SyButton @click="showCreateDialog = false">取消</SyButton>
        <SyButton type="primary" @click="createTemplate">创建</SyButton>
      </template>
    </Dialog>

    <!-- 导入模板对话框 -->
    <Dialog
      v-model:visible="showImportDialog"
      title="导入模板"
      :width="500"
    >
      <div class="import-form">
        <div class="form-item">
          <label>模板 JSON</label>
          <SyTextarea
            v-model="importJson"
            placeholder="粘贴模板 JSON 数据"
            :rows="10"
          />
        </div>
      </div>
      <template #footer>
        <SyButton @click="showImportDialog = false">取消</SyButton>
        <SyButton type="primary" @click="importTemplate">导入</SyButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { mindmapTemplateService, type MindMapTemplate, type MindMapTemplateType } from '@/services/mindmapTemplateService';
import { mindmapVersionService } from '@/services/mindmapVersionService';
import type { MindMapNode } from '@/types/mindmap';
import SyButton from './SiyuanTheme/SyButton.vue';
import SyIcon from './SiyuanTheme/SyIcon.vue';
import SyInput from './SiyuanTheme/SyInput.vue';
import SyTextarea from './SiyuanTheme/SyTextarea.vue';
import SySelect from './SiyuanTheme/SySelect.vue';
import Dialog from './SiyuanTheme/SyDialog.vue';
import MindMapNodePreview from './MindMapNodePreview.vue';

// 状态
const systemTemplates = ref<MindMapTemplate[]>([]);
const customTemplates = ref<MindMapTemplate[]>([]);
const selectedTemplateId = ref<string>('');
const showCreateDialog = ref(false);
const showImportDialog = ref(false);
const importJson = ref('');

const newTemplate = ref({
  name: '',
  description: '',
  type: 'custom' as MindMapTemplateType,
  color: '#4CAF50',
  icon: 'star'
});

// 计算属性
const allTemplates = computed(() => [...systemTemplates.value, ...customTemplates.value]);

const selectedTemplate = computed(() =>
  allTemplates.value.find(t => t.id === selectedTemplateId.value)
);

const templateTypeOptions = computed(() => [
  { label: '大纲型', value: 'outline' },
  { label: '时间线型', value: 'timeline' },
  { label: '鱼骨图型', value: 'fishbone' },
  { label: '概念图型', value: 'concept' },
  { label: '层级图型', value: 'hierarchy' },
  { label: '循环图型', value: 'cycle' },
  { label: '自定义型', value: 'custom' }
]);

// 生命周期
onMounted(async () => {
  await loadTemplates();
});

// 方法
async function loadTemplates() {
  systemTemplates.value = mindmapTemplateService.getSystemTemplates();
  customTemplates.value = await mindmapTemplateService.getCustomTemplates();
}

function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId;
}

function getTemplateTypeLabel(type: MindMapTemplateType): string {
  const labels: Record<MindMapTemplateType, string> = {
    outline: '大纲',
    timeline: '时间线',
    fishbone: '鱼骨图',
    concept: '概念图',
    hierarchy: '层级图',
    cycle: '循环图',
    custom: '自定义'
  };
  return labels[type] || type;
}

async function confirmSelection() {
  if (!selectedTemplateId.value) return;

  try {
    const nodes = await mindmapTemplateService.applyTemplate(selectedTemplateId.value, '');
    emit('apply', nodes);
  } catch (error) {
    console.error('应用模板失败:', error);
  }
}

function handleCancel() {
  emit('cancel');
}

async function createTemplate() {
  if (!newTemplate.value.name) {
    alert('请输入模板名称');
    return;
  }

  try {
    // 从父组件获取当前脑图节点
    const currentNodes = props.currentNodes || [];
    await mindmapTemplateService.createTemplateFromMindMap(
      newTemplate.value.name,
      newTemplate.value.description,
      currentNodes,
      newTemplate.value.type
    );
    await loadTemplates();
    showCreateDialog.value = false;
    newTemplate.value = {
      name: '',
      description: '',
      type: 'custom',
      color: '#4CAF50',
      icon: 'star'
    };
  } catch (error) {
    console.error('创建模板失败:', error);
  }
}

async function editTemplate(template: MindMapTemplate) {
  newTemplate.value = {
    name: template.name,
    description: template.description,
    type: template.type,
    color: template.color,
    icon: template.icon
  };
  selectedTemplateId.value = template.id;
  showCreateDialog.value = true;
}

async function deleteTemplate(templateId: string) {
  if (!confirm('确定要删除此模板吗？')) return;

  await mindmapTemplateService.deleteCustomTemplate(templateId);
  await loadTemplates();
}

async function importTemplate() {
  if (!importJson.value.trim()) {
    alert('请输入模板 JSON');
    return;
  }

  try {
    await mindmapTemplateService.importTemplate(importJson.value);
    await loadTemplates();
    showImportDialog.value = false;
    importJson.value = '';
  } catch (error) {
    alert('导入失败：' + (error as Error).message);
  }
}

// Props & Emit
const props = defineProps<{
  currentNodes?: MindMapNode[];
}>();

const emit = defineEmits<{
  apply: [nodes: MindMapNode[]];
  cancel: [];
}>();
</script>

<style scoped lang="scss">
.mindmap-template-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
}

.template-grid {
  flex: 1;
  overflow-y: auto;
}

.template-section {
  margin-bottom: 24px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
    margin: 0 0 12px 0;
  }
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  flex-direction: column;
  border: 2px solid var(--b3-border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;

    .template-card:hover & {
      opacity: 1;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 12px;
  }

  .card-content {
    flex: 1;

    .card-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-description {
      font-size: 12px;
      color: var(--b3-theme-placeholder);
      margin: 0 0 8px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;

      .card-type {
        padding: 2px 6px;
        background: var(--b3-theme-surface-hover);
        border-radius: 4px;
      }

      .card-usage {
        color: var(--b3-theme-placeholder);
      }
    }
  }
}

.preview-panel {
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
  }

  .preview-tags {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;

    .tag {
      padding: 4px 8px;
      background: var(--b3-theme-surface-hover);
      border-radius: 4px;
      font-size: 12px;
    }
  }
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--b3-border-color);

  .action-spacer {
    flex: 1;
  }
}

.create-form,
.import-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .color-picker {
      width: 100%;
      height: 40px;
      border: 1px solid var(--b3-border-color);
      border-radius: 4px;
      cursor: pointer;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--b3-theme-placeholder);
  gap: 12px;
}
</style>
