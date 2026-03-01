<!-- src/components/ReviewExportDialog.vue - 复习导出对话框组件 -->
<template>
  <div v-if="visible" class="review-export-dialog-overlay" @click="close">
    <div class="review-export-dialog" @click.stop>
      <!-- 头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">📤 导出复习数据</h3>
        <button class="close-btn" @click="close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="dialog-content">
        <!-- 导出范围 -->
        <div class="export-section">
          <label class="section-label">导出范围</label>
          <div class="range-options">
            <label class="range-option">
              <input
                v-model="exportRange"
                type="radio"
                name="exportRange"
                value="all"
                class="range-radio"
              />
              <span class="range-text">
                <span class="range-title">全部复习记录</span>
                <span class="range-desc">导出所有历史复习数据</span>
              </span>
            </label>
            <label class="range-option">
              <input
                v-model="exportRange"
                type="radio"
                name="exportRange"
                value="recent"
                class="range-radio"
              />
              <span class="range-text">
                <span class="range-title">最近复习</span>
                <span class="range-desc">导出最近一段时间的复习数据</span>
              </span>
            </label>
            <label class="range-option">
              <input
                v-model="exportRange"
                type="radio"
                name="exportRange"
                value="custom"
                class="range-radio"
              />
              <span class="range-text">
                <span class="range-title">自定义范围</span>
                <span class="range-desc">选择特定日期范围</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 时间范围选择 -->
        <div v-if="exportRange === 'recent'" class="export-section">
          <label class="section-label">最近时间</label>
          <div class="recent-options">
            <button
              v-for="option in recentOptions"
              :key="option.value"
              :class="['recent-btn', { active: recentDays === option.value }]"
              @click="recentDays = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- 自定义日期范围 -->
        <div v-if="exportRange === 'custom'" class="export-section">
          <label class="section-label">日期范围</label>
          <div class="date-range-inputs">
            <div class="date-input-group">
              <span class="date-label">从</span>
              <input
                v-model="startDate"
                type="date"
                class="date-input"
              />
            </div>
            <span class="date-separator">至</span>
            <div class="date-input-group">
              <span class="date-label">到</span>
              <input
                v-model="endDate"
                type="date"
                class="date-input"
              />
            </div>
          </div>
        </div>

        <!-- 导出内容 -->
        <div class="export-section">
          <label class="section-label">导出内容</label>
          <div class="content-options">
            <label class="content-option">
              <input
                v-model="exportContent.reviewStats"
                type="checkbox"
                class="content-checkbox"
              />
              <span class="content-text">
                <span class="content-title">复习统计</span>
                <span class="content-desc">复习次数、正确率、时长等</span>
              </span>
            </label>
            <label class="content-option">
              <input
                v-model="exportContent.cardDetails"
                type="checkbox"
                class="content-checkbox"
              />
              <span class="content-text">
                <span class="content-title">卡片详情</span>
                <span class="content-desc">每张卡片的复习历史</span>
              </span>
            </label>
            <label class="content-option">
              <input
                v-model="exportContent.learningSetInfo"
                type="checkbox"
                class="content-checkbox"
              />
              <span class="content-text">
                <span class="content-title">学习集信息</span>
                <span class="content-desc">学习集名称、描述、设置等</span>
              </span>
            </label>
            <label class="content-option">
              <input
                v-model="exportContent.achievements"
                type="checkbox"
                class="content-checkbox"
              />
              <span class="content-text">
                <span class="content-title">成就徽章</span>
                <span class="content-desc">已解锁的成就列表</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 导出格式 -->
        <div class="export-section">
          <label class="section-label">导出格式</label>
          <div class="format-options">
            <button
              :class="['format-btn', { active: exportFormat === 'json' }]"
              @click="exportFormat = 'json'"
            >
              <span class="format-icon">📋</span>
              <span class="format-label">JSON</span>
            </button>
            <button
              :class="['format-btn', { active: exportFormat === 'csv' }]"
              @click="exportFormat = 'csv'"
            >
              <span class="format-icon">📊</span>
              <span class="format-label">CSV</span>
            </button>
            <button
              :class="['format-btn', { active: exportFormat === 'markdown' }]"
              @click="exportFormat = 'markdown'"
            >
              <span class="format-icon">📝</span>
              <span class="format-label">Markdown</span>
            </button>
            <button
              :class="['format-btn', { active: exportFormat === 'pdf' }]"
              @click="exportFormat = 'pdf'"
              :disabled="!pdfSupported"
            >
              <span class="format-icon">📄</span>
              <span class="format-label">PDF</span>
            </button>
          </div>
        </div>

        <!-- 预览 -->
        <div class="export-section">
          <div class="preview-header">
            <label class="section-label">数据预览</label>
            <span class="preview-count">约 {{ estimatedRecords }} 条记录</span>
          </div>
          <div class="preview-content">
            <pre class="preview-code">{{ previewData }}</pre>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="dialog-footer">
        <div class="footer-info">
          <span class="file-size">预计文件大小：{{ estimatedSize }}</span>
        </div>
        <div class="footer-actions">
          <button class="cancel-btn" @click="close">取消</button>
          <button class="export-btn" @click="exportData" :disabled="isExporting">
            <span v-if="isExporting" class="loading-spinner"></span>
            <span>{{ isExporting ? '导出中...' : '导出' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  visible?: boolean;
  studySetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  studySetId: '',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'export', data: {
    range: string;
    startDate?: string;
    endDate?: string;
    recentDays?: number;
    content: Record<string, boolean>;
    format: string;
  }): void;
}>();

// 状态
const exportRange = ref<'all' | 'recent' | 'custom'>('all');
const recentDays = ref(7);
const startDate = ref('');
const endDate = ref('');
const exportFormat = ref<'json' | 'csv' | 'markdown' | 'pdf'>('json');
const exportContent = ref({
  reviewStats: true,
  cardDetails: true,
  learningSetInfo: true,
  achievements: false,
});
const isExporting = ref(false);

const pdfSupported = ref(false); // PDF 导出需要额外库

const recentOptions = [
  { value: 1, label: '今天' },
  { value: 3, label: '最近 3 天' },
  { value: 7, label: '最近 7 天' },
  { value: 14, label: '最近 2 周' },
  { value: 30, label: '最近 1 月' },
  { value: 90, label: '最近 3 月' },
];

// 计算属性
const estimatedRecords = computed(() => {
  // 模拟估算记录数
  const baseRecords = 50;
  switch (exportRange.value) {
    case 'all':
      return baseRecords * 30;
    case 'recent':
      return baseRecords * recentDays.value;
    case 'custom':
      return baseRecords * 14;
    default:
      return baseRecords;
  }
});

const estimatedSize = computed(() => {
  const records = estimatedRecords.value;
  let size = records * 0.5; // KB per record

  if (exportContent.value.cardDetails) size *= 2;
  if (exportContent.value.learningSetInfo) size += 10;
  if (exportContent.value.achievements) size += 5;

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(size)} KB`;
});

const previewData = computed(() => {
  const preview = {
    exportDate: new Date().toISOString().split('T')[0],
    studySetId: props.studySetId || 'all',
    range: exportRange.value,
    format: exportFormat.value,
    recordCount: estimatedRecords.value,
  };

  if (exportFormat.value === 'json') {
    return JSON.stringify(preview, null, 2);
  } else if (exportFormat.value === 'csv') {
    return 'date,studySet,range,format,records\n' +
      `${preview.exportDate},${preview.studySetId},${preview.range},${preview.format},${preview.recordCount}`;
  } else {
    return `# 复习数据导出\n\n` +
      `导出日期：${preview.exportDate}\n` +
      `学习集：${preview.studySetId}\n` +
      `范围：${preview.range}\n` +
      `格式：${preview.format}\n` +
      `记录数：${preview.recordCount}`;
  }
});

// 方法
function close() {
  emit('close');
}

function exportData() {
  isExporting.value = true;

  const exportData = {
    range: exportRange.value,
    startDate: exportRange.value === 'custom' ? startDate.value : undefined,
    endDate: exportRange.value === 'custom' ? endDate.value : undefined,
    recentDays: exportRange.value === 'recent' ? recentDays.value : undefined,
    content: exportContent.value,
    format: exportFormat.value,
  };

  // 模拟导出延迟
  setTimeout(() => {
    emit('export', exportData);
    isExporting.value = false;
    close();
  }, 1000);
}

// 监听 visible 变化，初始化日期
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.value = weekAgo.toISOString().split('T')[0];
      endDate.value = today.toISOString().split('T')[0];
    }
  }
);
</script>

<style scoped lang="scss">
.review-export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.review-export-dialog {
  width: 600px;
  max-height: 80vh;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--b3-theme-divider);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--b3-theme-color);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-color-light);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface);
    color: var(--b3-theme-color);
  }
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.range-options,
.content-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.range-option,
.content-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &:has(input:checked) {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }
}

.range-radio,
.content-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex-shrink: 0;
}

.range-text,
.content-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.range-title,
.content-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-color);
}

.range-desc,
.content-desc {
  font-size: 12px;
  color: var(--b3-theme-color-light);
}

.recent-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.recent-btn {
  padding: 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 16px;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.date-label {
  font-size: 13px;
  color: var(--b3-theme-color-light);
}

.date-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.date-separator {
  font-size: 14px;
  color: var(--b3-theme-color-light);
}

.format-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.format-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.format-icon {
  font-size: 24px;
}

.format-label {
  font-size: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-count {
  font-size: 12px;
  color: var(--b3-theme-color-light);
}

.preview-content {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-theme-divider);
  overflow: hidden;
}

.preview-code {
  padding: 16px;
  margin: 0;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--b3-theme-color);
  background: transparent;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--b3-theme-divider);
}

.footer-info {
  .file-size {
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.export-btn {
  padding: 10px 24px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);

  &:hover {
    background: var(--b3-theme-background);
  }
}

.export-btn {
  background: var(--b3-theme-primary);
  border-color: var(--b3-theme-primary);
  color: white;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
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
