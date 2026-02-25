<template>
  <div class="learning-set-manager">
    <div class="manager-header">
      <h3>学习集管理</h3>
      <button @click="showCreateModal = true" class="btn btn-primary">创建学习集</button>
    </div>

    <div class="learning-sets-list">
      <div
        v-for="set in learningSets"
        :key="set.id"
        class="learning-set-card"
        :class="{ active: selectedSet?.id === set.id }"
        @click="selectSet(set)"
      >
        <div class="set-info">
          <h4>{{ set.name }}</h4>
          <p class="set-description">{{ set.description }}</p>
          <div class="set-stats">
            <span class="stat-item">PDF: {{ set.pdfPaths.length }}</span>
            <span class="stat-item">标注: {{ set.annotations.length }}</span>
            <span class="stat-item">更新: {{ formatDate(set.updatedAt) }}</span>
          </div>
        </div>
        <div class="set-actions">
          <button @click.stop="editSet(set)" class="btn btn-sm btn-secondary">编辑</button>
          <button @click.stop="deleteSet(set.id)" class="btn btn-sm btn-danger">删除</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑学习集模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editingSet ? '编辑学习集' : '创建学习集' }}</h4>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称 *</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-control"
              placeholder="请输入学习集名称"
              required
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="formData.description"
              class="form-control"
              placeholder="请输入学习集描述"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">取消</button>
          <button @click="saveSet" class="btn btn-primary" :disabled="!formData.name">
            {{ editingSet ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 学习集详情面板 -->
    <div v-if="selectedSet" class="set-details-panel">
      <div class="panel-header">
        <h4>{{ selectedSet.name }}</h4>
        <button @click="selectedSet = null" class="close-btn">&times;</button>
      </div>

      <div class="panel-content">
        <!-- PDF列表 -->
        <div class="section">
          <h5>关联的PDF文档</h5>
          <div class="pdf-list">
            <div
              v-for="pdfPath in selectedSet.pdfPaths"
              :key="pdfPath"
              class="pdf-item"
            >
              <span class="pdf-name">{{ getFileName(pdfPath) }}</span>
              <div class="pdf-actions">
                <button @click="openPdf(pdfPath)" class="btn btn-sm btn-outline">打开</button>
                <button @click="removePdfFromSet(pdfPath)" class="btn btn-sm btn-danger">移除</button>
              </div>
            </div>
          </div>
          <button @click="showAddPdfModal = true" class="btn btn-sm btn-outline">添加PDF</button>
        </div>

        <!-- 学习进度 -->
        <div class="section">
          <h5>学习进度</h5>
          <div class="progress-list">
            <div
              v-for="(page, pdfPath) in selectedSet.progress"
              :key="pdfPath"
              class="progress-item"
            >
              <span class="progress-pdf">{{ getFileName(pdfPath) }}</span>
              <span class="progress-page">第 {{ page }} 页</span>
              <button @click="jumpToPage(pdfPath, page)" class="btn btn-sm btn-outline">跳转</button>
            </div>
          </div>
        </div>

        <!-- 标注列表 -->
        <div class="section">
          <h5>标注笔记</h5>
          <div class="annotations-list">
            <div
              v-for="annotation in selectedSet.annotations"
              :key="annotation.id"
              class="annotation-item"
            >
              <div class="annotation-content">
                <span class="annotation-text">{{ annotation.text || annotation.note || '无内容' }}</span>
                <span class="annotation-meta">第{{ annotation.page }}页</span>
              </div>
              <button @click="focusAnnotation(annotation)" class="btn btn-sm btn-outline">定位</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加PDF到学习集模态框 -->
    <div v-if="showAddPdfModal" class="modal-overlay" @click.self="showAddPdfModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h4>添加PDF到学习集</h4>
          <button @click="showAddPdfModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>PDF路径</label>
            <input
              v-model="pdfToAdd"
              type="text"
              class="form-control"
              placeholder="请输入PDF文件路径"
            />
          </div>
          <p class="help-text">请输入完整的PDF文件路径，例如：/data/pdfs/document.pdf</p>
        </div>
        <div class="modal-footer">
          <button @click="showAddPdfModal = false" class="btn btn-secondary">取消</button>
          <button @click="addPdfToSet" class="btn btn-primary" :disabled="!pdfToAdd">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { LearningSetService } from '../services/learningSetService';
import type { LearningSet } from '../services/learningSetService';
import type { PDFAnnotation } from '../types/annotaion';

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
  'annotation-focus-request': [annotation: PDFAnnotation];
  'page-jump-request': [pdfPath: string, page: number];
}>();

// 响应式数据
const learningSets = ref<LearningSet[]>([]);
const selectedSet = ref<LearningSet | null>(null);
const showCreateModal = ref(false);
const showAddPdfModal = ref(false);
const editingSet = ref<LearningSet | null>(null);
const pdfToAdd = ref('');

const formData = ref({
  name: '',
  description: ''
});

// 初始化
onMounted(() => {
  loadLearningSets();
});

// 加载学习集
const loadLearningSets = () => {
  learningSets.value = LearningSetService.getAllLearningSets();
};

// 选择学习集
const selectSet = (set: LearningSet) => {
  selectedSet.value = set;
  emit('set-selected', set);
};

// 编辑学习集
const editSet = (set: LearningSet) => {
  editingSet.value = set;
  formData.value = {
    name: set.name,
    description: set.description
  };
  showCreateModal.value = true;
};

// 删除学习集
const deleteSet = (setId: string) => {
  if (confirm('确定要删除这个学习集吗？此操作不可撤销。')) {
    LearningSetService.deleteLearningSet(setId);
    loadLearningSets();
    if (selectedSet.value?.id === setId) {
      selectedSet.value = null;
    }
  }
};

// 保存学习集（创建或更新）
const saveSet = () => {
  if (!formData.value.name.trim()) return;

  if (editingSet.value) {
    // 更新现有学习集
    LearningSetService.updateLearningSet(editingSet.value.id, {
      name: formData.value.name,
      description: formData.value.description
    });
  } else {
    // 创建新学习集
    LearningSetService.createLearningSet(
      formData.value.name,
      formData.value.description
    );
  }

  loadLearningSets();
  closeModal();
};

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false;
  editingSet.value = null;
  formData.value = { name: '', description: '' };
};

// 添加PDF到学习集
const addPdfToSet = () => {
  if (!selectedSet.value || !pdfToAdd.value.trim()) return;

  LearningSetService.addPdfToLearningSet(selectedSet.value.id, pdfToAdd.value);
  loadLearningSets();

  // 更新选中的学习集
  const updatedSet = LearningSetService.getLearningSetById(selectedSet.value.id);
  if (updatedSet) {
    selectedSet.value = updatedSet;
  }

  pdfToAdd.value = '';
  showAddPdfModal.value = false;
};

// 从学习集中移除PDF
const removePdfFromSet = (pdfPath: string) => {
  if (!selectedSet.value) return;

  LearningSetService.removePdfFromLearningSet(selectedSet.value.id, pdfPath);
  loadLearningSets();

  // 更新选中的学习集
  const updatedSet = LearningSetService.getLearningSetById(selectedSet.value.id);
  if (updatedSet) {
    selectedSet.value = updatedSet;
  }
};

// 打开PDF
const openPdf = (pdfPath: string) => {
  emit('pdf-open-request', pdfPath);
};

// 跳转到指定页面
const jumpToPage = (pdfPath: string, page: number) => {
  emit('page-jump-request', pdfPath, page);
};

// 定位到标注
const focusAnnotation = (annotation: PDFAnnotation) => {
  emit('annotation-focus-request', annotation);
};

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 获取文件名
const getFileName = (filePath: string) => {
  return filePath.split('/').pop() || filePath;
};
</script>

<style scoped>
.learning-set-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b3-border-color);
}

.learning-sets-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

.learning-set-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.2s;
}

.learning-set-card:hover {
  border-color: var(--b3-theme-primary);
  background: var(--b3-theme-surface-light);
}

.learning-set-card.active {
  border-color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-lightest);
}

.set-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.set-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.3;
}

.set-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.stat-item {
  padding: 2px 6px;
  background: var(--b3-list-background);
  border-radius: 4px;
}

.set-actions {
  display: flex;
  gap: 6px;
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
}

.modal-content {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--b3-theme-on-surface-light);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--b3-theme-on-surface);
  background: var(--b3-list-hover);
  border-radius: 50%;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 13px;
}

.form-control:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--b3-border-color);
}

/* 详情面板 */
.set-details-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 24px;
}

.section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
  border-bottom: 1px solid var(--b3-border-color);
  padding-bottom: 4px;
}

.pdf-list, .progress-list, .annotations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.pdf-item, .progress-item, .annotation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-list-background);
}

.pdf-item {
  justify-content: space-between;
}

.pdf-name {
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  word-break: break-all;
  flex: 1;
  margin-right: 8px;
}

.pdf-actions, .annotation-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.annotation-content {
  flex: 1;
  justify-content: space-between;
}

.annotation-text {
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  word-break: break-all;
  flex: 1;
  margin-right: 8px;
}

.annotation-meta {
  font-size: 10px;
  color: var(--b3-theme-on-surface-light);
  background: var(--b3-label-background);
  padding: 2px 6px;
  border-radius: 4px;
}

.progress-pdf {
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  flex: 1;
}

.progress-page {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin: 0 8px;
}

.help-text {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin: 4px 0 0 0;
}

/* 按钮样式 */
.btn {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-primary {
  background: var(--b3-theme-primary);
  color: white;
  border-color: var(--b3-theme-primary);
}

.btn-primary:hover {
  background: var(--b3-theme-primary-light);
}

.btn-secondary {
  background: var(--b3-list-background);
  color: var(--b3-theme-on-surface);
  border-color: var(--b3-border-color);
}

.btn-secondary:hover {
  background: var(--b3-list-hover);
}

.btn-danger {
  background: #ff4757;
  color: white;
  border-color: #ff4757;
}

.btn-danger:hover {
  background: #ff3742;
}

.btn-outline {
  background: transparent;
  color: var(--b3-theme-on-surface);
  border-color: var(--b3-border-color);
}

.btn-outline:hover {
  background: var(--b3-list-hover);
}
</style>
