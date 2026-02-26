<!-- src/components/PdfMountManager.vue -->
<template>
  <div class="pdf-mount-manager">
    <!-- 工具栏 -->
    <div class="manager-toolbar">
      <div class="toolbar-left">
        <h3 class="manager-title">PDF 挂载管理</h3>
        <span class="manager-count">{{ pdfs.length }} 个文档</span>
      </div>
      <div class="toolbar-right">
        <button @click="handleAddPdf" class="add-pdf-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          添加 PDF
        </button>
      </div>
    </div>

    <!-- PDF 列表 -->
    <div class="pdf-list">
      <div v-if="pdfs.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p class="empty-text">暂无 PDF 文档</p>
        <p class="empty-hint">点击"添加 PDF"按钮添加文档</p>
      </div>

      <div
        v-for="pdf in pdfs"
        :key="pdf.id"
        :class="['pdf-item', { active: currentPdfId === pdf.id }]"
        @click="handlePdfSelect(pdf)"
      >
        <div class="pdf-item-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
          </svg>
        </div>
        <div class="pdf-item-content">
          <div class="pdf-item-name">{{ pdf.name }}</div>
          <div class="pdf-item-info">
            <span class="pdf-item-path">{{ pdf.path }}</span>
            <span class="pdf-item-progress" v-if="pdf.progress">
              第 {{ pdf.progress }} 页
            </span>
          </div>
        </div>
        <div class="pdf-item-actions">
          <button @click.stop="handleEditPdf(pdf)" class="action-btn" title="编辑">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button @click.stop="handleRemovePdf(pdf)" class="action-btn delete" title="移除">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑 PDF 对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditMode ? '编辑 PDF' : '添加 PDF' }}</h3>
          <button @click="closeDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>选择 PDF 文档</label>
            <div class="pdf-selector">
              <input
                v-model="formData.path"
                type="text"
                placeholder="输入或选择 PDF 路径..."
                class="form-input"
                readonly
              />
              <button @click="showPdfPicker = true" class="select-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
                选择
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>文档名称</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="输入文档名称..."
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              v-model="formData.description"
              placeholder="添加备注信息..."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="handleSubmit" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>

    <!-- PDF 选择器 -->
    <div v-if="showPdfPicker" class="dialog-overlay" @click="showPdfPicker = false">
      <div class="dialog pdf-picker-dialog" @click.stop>
        <div class="dialog-header">
          <h3>选择 PDF 文档</h3>
          <button @click="showPdfPicker = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="pdf-picker-list">
            <div
              v-for="file in availablePdfs"
              :key="file.path"
              :class="['pdf-picker-item', { selected: formData.path === file.path }]"
              @click="selectPdf(file)"
            >
              <div class="pdf-picker-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div class="pdf-picker-name">{{ file.name }}</div>
              <div class="pdf-picker-path">{{ file.path }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { studySetService } from '../services/studySetService';

interface PdfInfo {
  id: string;
  name: string;
  path: string;
  description?: string;
  progress?: number;
  lastOpened?: number;
}

interface PdfFile {
  path: string;
  name: string;
}

const props = defineProps<{
  studySetId: string;
  currentPdfId?: string;
}>();

const emit = defineEmits<{
  (e: 'pdf-select', pdf: PdfInfo): void;
  (e: 'pdf-add', pdf: PdfInfo): void;
  (e: 'pdf-remove', pdf: PdfInfo): void;
  (e: 'pdf-update', pdf: PdfInfo): void;
}>();

// 状态
const pdfs = ref<PdfInfo[]>([]);
const showDialog = ref(false);
const isEditMode = ref(false);
const showPdfPicker = ref(false);
const availablePdfs = ref<PdfFile[]>([]);

// 表单数据
const formData = ref({
  id: '',
  path: '',
  name: '',
  description: '',
});

// 加载 PDF 列表
const loadPdfs = async () => {
  try {
    const studySet = await studySetService.getStudySet(props.studySetId);
    if (studySet && studySet.pdfs) {
      pdfs.value = studySet.pdfs.map(pdf => ({
        id: pdf.id,
        name: pdf.name,
        path: pdf.id, // 使用 ID 作为路径
        progress: 1, // TODO: 从进度服务获取
      }));
    }
  } catch (error) {
    console.error('加载 PDF 列表失败:', error);
  }
};

// 加载可用 PDF 文件列表
const loadAvailablePdfs = async () => {
  // TODO: 实现获取思源中所有 PDF 文件的 API
  // 这里暂时返回一个示例列表
  availablePdfs.value = [
    { path: 'assets/sample1.pdf', name: '示例文档 1.pdf' },
    { path: 'assets/sample2.pdf', name: '示例文档 2.pdf' },
  ];
};

// 处理添加 PDF
const handleAddPdf = () => {
  isEditMode.value = false;
  formData.value = {
    id: '',
    path: '',
    name: '',
    description: '',
  };
  showDialog.value = true;
  loadAvailablePdfs();
};

// 处理编辑 PDF
const handleEditPdf = (pdf: PdfInfo) => {
  isEditMode.value = true;
  formData.value = {
    id: pdf.id,
    path: pdf.path,
    name: pdf.name,
    description: pdf.description || '',
  };
  showDialog.value = true;
  loadAvailablePdfs();
};

// 处理移除 PDF
const handleRemovePdf = (pdf: PdfInfo) => {
  if (confirm(`确定要移除 "${pdf.name}" 吗？`)) {
    emit('pdf-remove', pdf);
    loadPdfs();
  }
};

// 处理 PDF 选择
const handlePdfSelect = (pdf: PdfInfo) => {
  emit('pdf-select', pdf);
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
  showPdfPicker.value = false;
};

// 选择 PDF
const selectPdf = (file: PdfFile) => {
  formData.value.path = file.path;
  if (!formData.value.name) {
    formData.value.name = file.name;
  }
  showPdfPicker.value = false;
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.path || !formData.value.name) {
    alert('请填写完整信息');
    return;
  }

  if (isEditMode.value) {
    // 更新
    const updatedPdf: PdfInfo = {
      id: formData.value.id,
      name: formData.value.name,
      path: formData.value.path,
      description: formData.value.description,
    };
    emit('pdf-update', updatedPdf);
  } else {
    // 新增
    const newPdf: PdfInfo = {
      id: `pdf_${Date.now()}`,
      name: formData.value.name,
      path: formData.value.path,
      description: formData.value.description,
    };
    emit('pdf-add', newPdf);
  }

  closeDialog();
  loadPdfs();
};

onMounted(() => {
  loadPdfs();
});
</script>

<style scoped>
.pdf-mount-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
}

/* 工具栏 */
.manager-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.manager-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.manager-count {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.add-pdf-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-pdf-btn:hover {
  opacity: 0.9;
}

/* PDF 列表 */
.pdf-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

.pdf-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 8px;
}

.pdf-item:hover {
  background: var(--b3-theme-surface);
}

.pdf-item.active {
  background: var(--b3-theme-primary-light);
  border: 1px solid var(--b3-theme-primary);
}

.pdf-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  color: var(--b3-theme-primary);
}

.pdf-item-content {
  flex: 1;
  min-width: 0;
}

.pdf-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.pdf-item-path {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-item-progress {
  font-size: 11px;
  color: var(--b3-theme-primary);
}

.pdf-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pdf-item:hover .pdf-item-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--b3-theme-surface);
}

.action-btn.delete:hover {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

/* 对话框样式 */
.dialog-overlay {
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

.dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.pdf-picker-dialog {
  max-width: 600px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.dialog-header h3 {
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
}

.close-btn:hover {
  background: var(--b3-theme-surface);
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.pdf-selector {
  display: flex;
  gap: 8px;
}

.form-input,
.form-textarea {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

.form-textarea {
  width: 100%;
  resize: vertical;
}

.select-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.select-btn:hover {
  background: var(--b3-theme-surface-light);
  border-color: var(--b3-theme-primary);
  color: var(--b3-theme-primary);
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
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

.btn-cancel:hover {
  background: var(--b3-theme-surface);
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;
}

.btn-confirm:hover {
  opacity: 0.9;
}

/* PDF 选择器列表 */
.pdf-picker-list {
  max-height: 400px;
  overflow-y: auto;
}

.pdf-picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 8px;
}

.pdf-picker-item:hover {
  background: var(--b3-theme-surface);
}

.pdf-picker-item.selected {
  background: var(--b3-theme-primary-light);
  border: 1px solid var(--b3-theme-primary);
}

.pdf-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  color: var(--b3-theme-primary);
}

.pdf-picker-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.pdf-picker-path {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}
</style>
