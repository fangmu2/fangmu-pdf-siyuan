<template>
  <div class="learning-set-manager">
    <div class="manager-header">
      <h3>学习集管理</h3>
      <button @click="showCreateModal = true" class="btn btn-primary">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        新建学习集
      </button>
    </div>

    <div class="learning-sets-list">
      <div
        v-for="set in learningSets"
        :key="set.id"
        class="learning-set-card"
        :class="{ active: selectedSetId === set.id }"
        @click="selectSet(set)"
      >
        <div class="set-main">
          <div class="set-icon">📚</div>
          <div class="set-info">
            <h4>{{ set.name }}</h4>
            <div class="set-stats">
              <span class="stat-item" title="PDF 数量">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                {{ set.pdfCount }}
              </span>
              <span class="stat-item" title="标注数量">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                {{ set.annotationCount }}
              </span>
              <span class="stat-item updated" title="更新时间">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                {{ formatRelativeTime(set.updated) }}
              </span>
            </div>
          </div>
        </div>
        <div class="set-actions">
          <button @click.stop="editSet(set)" class="btn-icon btn-sm" title="编辑">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button @click.stop="confirmDelete(set.id)" class="btn-icon btn-sm btn-danger" title="删除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="learningSets.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>暂无学习集</p>
        <p class="empty-hint">创建一个学习集开始学习</p>
        <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
          创建第一个学习集
        </button>
      </div>
    </div>

    <!-- 创建/编辑学习集模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editingSet ? '编辑学习集' : '创建新学习集' }}</h4>
          <button @click="closeModal" class="close-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>
              <span class="label-text">学习集名称</span>
              <span class="label-required">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="form-control"
              placeholder="例如：MySQL 学习笔记、论文研读"
              maxlength="50"
              autofocus
            />
          </div>
          <div class="form-group">
            <label>
              <span class="label-text">描述</span>
              <span class="label-optional">（可选）</span>
            </label>
            <textarea
              v-model="formData.description"
              class="form-control textarea"
              placeholder="描述这个学习集的目的和内容..."
              rows="3"
              maxlength="200"
            ></textarea>
          </div>
          <div v-if="!editingSet" class="form-group">
            <label>
              <span class="label-text">添加第一个 PDF</span>
              <span class="label-optional">（可选）</span>
            </label>
            <div class="pdf-add-row">
              <button @click="selectPdfFile" class="btn btn-outline btn-sm">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                {{ formData.pdfName || '选择 PDF 文件' }}
              </button>
              <span class="pdf-hint">或从下方工作空间选择</span>
            </div>
            <select v-model="formData.workspacePdfPath" class="form-control pdf-select-workspace">
              <option value="">-- 从思源工作空间选择 PDF --</option>
              <option v-for="pdf in workspacePdfs" :key="pdf.path" :value="pdf.path">
                {{ pdf.name }}
              </option>
            </select>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="application/pdf"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">取消</button>
          <button
            @click="saveSet"
            class="btn btn-primary"
            :disabled="!formData.name.trim() || saving"
          >
            {{ saving ? '保存中...' : (editingSet ? '更新' : '创建') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { LearningSetService, type LearningSet, type LearningSetListItem } from '../services/learningSetService';
import { uploadFileToAssets, readDir, type FileInfo } from '../api/siyuanApi';

// Props
interface Props {
  currentPdfPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentPdfPath: ''
});

// Emits
const emit = defineEmits<{
  'set-selected': [set: LearningSet];
  'pdf-open-request': [pdfPath: string];
  'annotation-focus-request': [annotation: any];
  'page-jump-request': [pdfPath: string, page: number];
}>();

// 响应式数据
const learningSets = ref<LearningSetListItem[]>([]);
const selectedSetId = ref<string | null>(null);
const showCreateModal = ref(false);
const editingSet = ref<LearningSetListItem | null>(null);
const saving = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const workspacePdfs = ref<{ path: string; name: string }[]>([]);

const formData = ref({
  name: '',
  description: '',
  pdfPath: '',
  pdfName: '',
  workspacePdfPath: ''
});

// 计算属性
const hasPdfSelection = computed(() => {
  return formData.value.pdfPath || formData.value.workspacePdfPath;
});

// 初始化
onMounted(async () => {
  await loadLearningSets();
  await loadWorkspacePdfs();
});

// 加载学习集列表
const loadLearningSets = async () => {
  await LearningSetService.initStorage();
  learningSets.value = LearningSetService.getAllLearningSets();
};

// 加载工作空间 PDF 列表
const loadWorkspacePdfs = async () => {
  try {
    const list = await readDir('/data/assets');
    const pdfFiles = list
      .filter((f: FileInfo) => !f.isDir && f.name.toLowerCase().endsWith('.pdf'))
      .map((f: FileInfo) => ({
        path: `/data/assets/${f.name}`,
        name: f.name
      }));
    workspacePdfs.value = pdfFiles;
  } catch (e) {
    console.error('读取 assets 目录失败', e);
    workspacePdfs.value = [];
  }
};

// 选择文件
const selectPdfFile = () => {
  fileInputRef.value?.click();
};

// 文件选择处理
const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadFileToAssets(file);
    formData.value.pdfPath = result.path;
    formData.value.pdfName = result.name;
  } catch (error) {
    console.error('上传 PDF 失败:', error);
    alert('上传失败，请重试');
  } finally {
    if (target) target.value = '';
  }
};

// 选择学习集
const selectSet = (set: LearningSetListItem) => {
  selectedSetId.value = set.id;
  const fullSet = LearningSetService.getLearningSetById(set.id);
  if (fullSet) {
    emit('set-selected', fullSet);
  }
};

// 编辑学习集
const editSet = (set: LearningSetListItem) => {
  editingSet.value = set;
  const fullSet = LearningSetService.getLearningSetById(set.id);
  if (fullSet) {
    formData.value = {
      name: fullSet.name,
      description: fullSet.description,
      pdfPath: '',
      pdfName: '',
      workspacePdfPath: ''
    };
  }
  showCreateModal.value = true;
};

// 确认删除
const confirmDelete = (setId: string) => {
  if (confirm('确定要删除这个学习集吗？此操作不可撤销。')) {
    LearningSetService.deleteLearningSet(setId);
    loadLearningSets();
    if (selectedSetId.value === setId) {
      selectedSetId.value = null;
    }
  }
};

// 保存学习集
const saveSet = async () => {
  if (!formData.value.name.trim()) return;

  saving.value = true;

  try {
    // 如果选择了工作空间 PDF，使用它；否则使用上传的 PDF
    const pdfPath = formData.value.workspacePdfPath || formData.value.pdfPath;
    const pdfName = formData.value.workspacePdfPath
      ? workspacePdfs.value.find(p => p.path === formData.value.workspacePdfPath)?.name
      : formData.value.pdfName;

    if (editingSet.value) {
      // 更新现有学习集
      LearningSetService.updateLearningSet(editingSet.value.id, {
        name: formData.value.name,
        description: formData.value.description
      });
    } else {
      // 创建新学习集
      await LearningSetService.createLearningSet(
        formData.value.name,
        formData.value.description,
        pdfPath,
        pdfName
      );
    }

    await loadLearningSets();
    closeModal();
  } catch (error) {
    console.error('保存学习集失败:', error);
    alert('保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false;
  editingSet.value = null;
  formData.value = {
    name: '',
    description: '',
    pdfPath: '',
    pdfName: '',
    workspacePdfPath: ''
  };
};

// 格式化相对时间
const formatRelativeTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString('zh-CN');
};
</script>

<style scoped lang="scss">
.learning-set-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
  }

  &.btn-primary {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

    &:hover {
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  &.btn-secondary {
    background: var(--b3-list-background);
    color: var(--b3-theme-on-surface);
    border-color: var(--b3-border-color);

    &:hover {
      background: var(--b3-list-hover);
      border-color: var(--b3-theme-primary);
    }
  }

  &.btn-outline {
    background: transparent;
    color: var(--b3-theme-on-surface);
    border-color: var(--b3-border-color);

    &:hover {
      background: var(--b3-list-hover);
      border-color: var(--b3-theme-primary);
    }
  }
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-list-hover);
    color: var(--b3-theme-on-surface);
    border-color: var(--b3-theme-primary);
  }

  &.btn-danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.learning-sets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
}

.learning-set-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-surface-light);
    transform: translateX(2px);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05));
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }
}

.set-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.set-icon {
  font-size: 28px;
  line-height: 1;
  opacity: 0.8;
}

.set-info {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0 0 6px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.set-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--b3-list-background);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);

  &.updated {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }
}

.set-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s;

  .learning-set-card:hover & {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);

  .empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  p {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--b3-theme-on-surface);
  }

  .empty-hint {
    font-size: 12px;
    margin-bottom: 16px;
  }
}

/* 模态框样式 */
.modal-overlay {
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--b3-theme-surface);
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: modal-slide-in 0.25s ease;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--b3-border-color);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent);

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-list-hover);
    color: var(--b3-theme-on-surface);
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);

    .label-required {
      color: #ef4444;
    }

    .label-optional {
      color: var(--b3-theme-on-surface-light);
      font-weight: 400;
      font-size: 12px;
    }
  }
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 14px;
  transition: all 0.15s;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &.textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.pdf-add-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .pdf-hint {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
  }
}

.pdf-select-workspace {
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
}

/* 滚动条美化 */
.learning-sets-list,
.modal-body {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.4);
    border-radius: 3px;

    &:hover {
      background: rgba(156, 163, 175, 0.6);
    }
  }
}
</style>
