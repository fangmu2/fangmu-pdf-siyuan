<!-- src/components/SettingsPanel.vue -->
<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h3 class="settings-title">设置</h3>
    </div>

    <div class="settings-content">
      <!-- 学习设置 -->
      <div class="settings-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          学习设置
        </h4>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">每日新卡片数</span>
            <span class="setting-desc">每天最多学习的新卡片数量</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.dailyNewCards"
              min="1"
              max="100"
              class="setting-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">每日复习卡片数</span>
            <span class="setting-desc">每天最多复习的卡片数量</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.dailyReviewCards"
              min="1"
              max="500"
              class="setting-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">自动播放音频</span>
            <span class="setting-desc">复习时自动播放卡片音频</span>
          </div>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.autoPlayAudio" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- SRS 设置 -->
      <div class="settings-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          SRS 算法设置
        </h4>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">初始间隔</span>
            <span class="setting-desc">首次正确回答后的间隔天数</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.srs.initialInterval"
              min="1"
              max="30"
              class="setting-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">简单间隔倍数</span>
            <span class="setting-desc">标记为"简单"时的间隔增长倍数</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.srs.easyMultiplier"
              min="1.0"
              max="5.0"
              step="0.1"
              class="setting-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">困难间隔倍数</span>
            <span class="setting-desc">标记为"困难"时的间隔增长倍数</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.srs.hardMultiplier"
              min="1.0"
              max="3.0"
              step="0.1"
              class="setting-input"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">最小难度系数</span>
            <span class="setting-desc">难度系数的最小值</span>
          </div>
          <div class="setting-control">
            <input
              type="number"
              v-model="settings.srs.minEase"
              min="1.0"
              max="3.0"
              step="0.1"
              class="setting-input"
            />
          </div>
        </div>
      </div>

      <!-- 显示设置 -->
      <div class="settings-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 2h2v6h-2z"/>
          </svg>
          显示设置
        </h4>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">卡片列表密度</span>
            <span class="setting-desc">控制卡片列表的显示密度</span>
          </div>
          <div class="setting-control">
            <select v-model="settings.cardDensity" class="setting-select">
              <option value="compact">紧凑</option>
              <option value="normal">正常</option>
              <option value="comfortable">宽松</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">显示卡片数量</span>
            <span class="setting-desc">每页显示的卡片数量</span>
          </div>
          <div class="setting-control">
            <select v-model="settings.cardsPerPage" class="setting-select">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">启用动画</span>
            <span class="setting-desc">显示过渡动画效果</span>
          </div>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.enableAnimations" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 数据设置 -->
      <div class="settings-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          数据管理
        </h4>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">导出数据</span>
            <span class="setting-desc">导出所有学习集和卡片数据</span>
          </div>
          <div class="setting-control">
            <button @click="exportData" class="setting-btn">
              导出
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">导入数据</span>
            <span class="setting-desc">从备份文件恢复数据</span>
          </div>
          <div class="setting-control">
            <button @click="importData" class="setting-btn">
              导入
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">清除缓存</span>
            <span class="setting-desc">清除本地缓存数据</span>
          </div>
          <div class="setting-control">
            <button @click="clearCache" class="setting-btn danger">
              清除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="settings-footer">
      <button @click="resetToDefaults" class="btn-reset">恢复默认</button>
      <button @click="saveSettings" class="btn-save">保存设置</button>
    </div>

    <!-- 导入对话框 -->
    <div v-if="showImportDialog" class="dialog-overlay" @click="showImportDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>导入数据</h3>
          <button @click="showImportDialog = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <p class="import-hint">选择要导入的 JSON 文件</p>
          <input
            type="file"
            ref="fileInputRef"
            accept=".json"
            @change="handleFileSelect"
            class="file-input"
          />
        </div>
        <div class="dialog-footer">
          <button @click="showImportDialog = false" class="btn-cancel">取消</button>
          <button @click="confirmImport" class="btn-confirm">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

interface SrsSettings {
  initialInterval: number;
  easyMultiplier: number;
  hardMultiplier: number;
  minEase: number;
}

interface Settings {
  dailyNewCards: number;
  dailyReviewCards: number;
  autoPlayAudio: boolean;
  srs: SrsSettings;
  cardDensity: 'compact' | 'normal' | 'comfortable';
  cardsPerPage: number;
  enableAnimations: boolean;
}

const emit = defineEmits<{
  (e: 'save', settings: Settings): void;
  (e: 'export'): void;
  (e: 'import', data: any): void;
  (e: 'clear-cache'): void;
}>();

// 默认设置
const defaultSettings: Settings = {
  dailyNewCards: 20,
  dailyReviewCards: 200,
  autoPlayAudio: false,
  srs: {
    initialInterval: 1,
    easyMultiplier: 2.5,
    hardMultiplier: 1.2,
    minEase: 1.3,
  },
  cardDensity: 'normal',
  cardsPerPage: 50,
  enableAnimations: true,
};

// 状态
const settings = reactive<Settings>({ ...defaultSettings });
const showImportDialog = ref(false);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement>();

// 加载设置
onMounted(() => {
  const saved = localStorage.getItem('marginnote-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }
});

// 保存设置
const saveSettings = () => {
  localStorage.setItem('marginnote-settings', JSON.stringify(settings));
  emit('save', { ...settings });
  alert('设置已保存');
};

// 恢复默认
const resetToDefaults = () => {
  if (confirm('确定要恢复默认设置吗？')) {
    Object.assign(settings, defaultSettings);
  }
};

// 导出数据
const exportData = () => {
  emit('export');
};

// 导入数据
const importData = () => {
  showImportDialog.value = true;
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

// 确认导入
const confirmImport = () => {
  if (!selectedFile.value) {
    alert('请选择文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      emit('import', data);
      showImportDialog.value = false;
      alert('导入成功');
    } catch (error) {
      alert('导入失败：文件格式不正确');
    }
  };
  reader.readAsText(selectedFile.value);
};

// 清除缓存
const clearCache = () => {
  if (confirm('确定要清除缓存吗？这将删除所有本地数据。')) {
    emit('clear-cache');
  }
};
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
}

.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.settings-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--b3-border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
}

.setting-desc {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.setting-control {
  display: flex;
  align-items: center;
}

.setting-input,
.setting-select {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.setting-input:focus,
.setting-select:focus {
  border-color: var(--b3-theme-primary);
}

.setting-btn {
  padding: 8px 16px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.setting-btn:hover {
  background: var(--b3-theme-surface-hover);
}

.setting-btn.danger:hover {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  border-color: #f44336;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--b3-theme-surface-hover);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--b3-theme-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 底部按钮 */
.settings-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.btn-reset {
  padding: 10px 20px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset:hover {
  background: var(--b3-theme-surface);
}

.btn-save {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: var(--b3-theme-primary);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-save:hover {
  opacity: 0.9;
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
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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

.import-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  cursor: pointer;
}

.file-input:hover {
  border-color: var(--b3-theme-primary);
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
</style>
