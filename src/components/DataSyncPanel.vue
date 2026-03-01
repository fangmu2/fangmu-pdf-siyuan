<template>
  <div class="data-sync-panel">
    <div class="sync-header">
      <h3 class="sync-title">💾 数据同步与备份</h3>
    </div>

    <!-- 备份选项卡 -->
    <div class="sync-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['sync-tab', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- 备份管理 -->
    <div v-if="activeTab === 'backup'" class="sync-content">
      <div class="backup-section">
        <h4>创建备份</h4>
        <div class="backup-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.includeStudySets" />
            <span>学习集</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.includeCards" />
            <span>卡片</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.includeMindMaps" />
            <span>思维导图</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.includeReviews" />
            <span>复习记录</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.compress" />
            <span>压缩</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="backupOptions.encrypt" />
            <span>加密</span>
          </label>
        </div>
        <div v-if="backupOptions.encrypt" class="password-input">
          <input
            v-model="backupOptions.password"
            type="password"
            placeholder="设置密码"
            class="sy-input"
          />
        </div>
        <button class="btn-primary" @click="createBackup" :disabled="backingUp">
          {{ backingUp ? '备份中...' : '📦 创建备份' }}
        </button>
      </div>

      <div class="backup-section">
        <h4>备份历史</h4>
        <div v-if="backups.length > 0" class="backup-list">
          <div v-for="backup in backups" :key="backup.id" class="backup-item">
            <div class="backup-info">
              <div class="backup-name">{{ backup.name }}</div>
              <div class="backup-meta">
                <span>{{ formatDate(backup.createdAt) }}</span>
                <span>{{ formatSize(backup.size) }}</span>
              </div>
            </div>
            <div class="backup-actions">
              <button class="btn-small" @click="downloadBackup(backup)">下载</button>
              <button class="btn-small btn-danger" @click="deleteBackup(backup.id)">删除</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          暂无备份记录
        </div>
      </div>
    </div>

    <!-- 恢复数据 -->
    <div v-if="activeTab === 'restore'" class="sync-content">
      <div class="restore-section">
        <h4>从备份恢复</h4>
        <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleFileSelect"
            class="file-input"
          />
          <div class="upload-hint">
            <span class="upload-icon">📁</span>
            <p>拖拽备份文件到此处，或点击选择文件</p>
            <p class="upload-sub">支持 .json 格式</p>
          </div>
        </div>
        <div v-if="selectedFile" class="selected-file">
          <span class="file-name">{{ selectedFile.name }}</span>
          <button class="btn-small" @click="restoreFromFile">开始恢复</button>
        </div>
      </div>

      <div class="restore-section">
        <h4>从版本恢复</h4>
        <div class="version-options">
          <select v-model="versionOptions.dataType" class="sy-select">
            <option value="studySet">学习集</option>
            <option value="card">卡片</option>
            <option value="mindmap">思维导图</option>
          </select>
          <input
            v-model="versionOptions.itemId"
            type="text"
            placeholder="输入 ID"
            class="sy-input"
          />
          <button class="btn-primary" @click="loadVersions">加载版本</button>
        </div>
        <div v-if="versions.length > 0" class="version-list">
          <div v-for="version in versions" :key="version.id" class="version-item">
            <div class="version-info">
              <span>版本 {{ version.version }}</span>
              <span>{{ formatDate(version.createdAt) }}</span>
              <span v-if="version.note">{{ version.note }}</span>
            </div>
            <button class="btn-small" @click="restoreToVersion(version.id)">恢复</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 云同步 -->
    <div v-if="activeTab === 'cloud'" class="sync-content">
      <div class="cloud-section">
        <h4>云同步设置</h4>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="cloudConfig.enabled" />
            <span>启用云同步</span>
          </label>
        </div>
        <div class="form-group">
          <label>同步方式</label>
          <select v-model="cloudConfig.provider" class="sy-select">
            <option value="local">本地同步</option>
            <option value="webdav">WebDAV</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div v-if="cloudConfig.provider === 'webdav'" class="webdav-settings">
          <div class="form-group">
            <label>WebDAV 地址</label>
            <input v-model="cloudConfig.webdavUrl" type="url" placeholder="https://..." class="sy-input" />
          </div>
          <div class="form-group">
            <label>用户名</label>
            <input v-model="cloudConfig.webdavUsername" type="text" class="sy-input" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="cloudConfig.webdavPassword" type="password" class="sy-input" />
          </div>
        </div>
        <div class="form-group">
          <label>同步间隔（分钟）</label>
          <input v-model.number="cloudConfig.syncInterval" type="number" class="sy-input" />
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="cloudConfig.autoSync" />
            <span>自动同步</span>
          </label>
        </div>
        <button class="btn-primary" @click="saveCloudConfig">保存设置</button>
      </div>

      <div class="cloud-section">
        <h4>同步状态</h4>
        <div class="sync-status">
          <div class="status-item">
            <span class="status-label">上次同步</span>
            <span class="status-value">{{ syncStatus.lastSyncTime ? formatDate(syncStatus.lastSyncTime) : '从未' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">同步进度</span>
            <span class="status-value">{{ syncStatus.syncProgress }}%</span>
          </div>
          <div v-if="syncStatus.syncError" class="status-item error">
            <span class="status-label">错误</span>
            <span class="status-value">{{ syncStatus.syncError }}</span>
          </div>
        </div>
        <button class="btn-primary" @click="syncNow" :disabled="syncStatus.isSyncing">
          {{ syncStatus.isSyncing ? '同步中...' : '🔄 立即同步' }}
        </button>
      </div>
    </div>

    <!-- 导入导出 -->
    <div v-if="activeTab === 'import'" class="sync-content">
      <div class="import-section">
        <h4>导出数据</h4>
        <div class="export-options">
          <div class="form-group">
            <label>导出格式</label>
            <select v-model="exportOptions.format" class="sy-select">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
          <div class="form-group">
            <label>数据类型</label>
            <select v-model="exportOptions.dataType" class="sy-select">
              <option value="cards">卡片</option>
              <option value="studySets">学习集</option>
              <option value="mindmaps">思维导图</option>
            </select>
          </div>
          <button class="btn-primary" @click="exportData">📤 导出</button>
        </div>
      </div>

      <div class="import-section">
        <h4>导入数据</h4>
        <div class="upload-area" @dragover.prevent @drop.prevent="handleImportDrop">
          <input
            ref="importFileInput"
            type="file"
            accept=".json,.csv"
            @change="handleImportFileSelect"
            class="file-input"
          />
          <div class="upload-hint">
            <span class="upload-icon">📥</span>
            <p>拖拽文件到此处，或点击选择文件</p>
            <p class="upload-sub">支持 .json, .csv 格式</p>
          </div>
        </div>
        <div v-if="importFile" class="selected-file">
          <span class="file-name">{{ importFile.name }}</span>
          <button class="btn-small" @click="importData">开始导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dataSyncService, type BackupMetadata, type CloudSyncConfig, type DataVersion } from '../services/dataSyncService';

const activeTab = ref('backup');

const tabs = [
  { value: 'backup', name: '备份', icon: '📦' },
  { value: 'restore', name: '恢复', icon: '↩️' },
  { value: 'cloud', name: '云同步', icon: '☁️' },
  { value: 'import', name: '导入导出', icon: '📤' }
];

// 备份选项
const backupOptions = ref({
  includeStudySets: true,
  includeCards: true,
  includeMindMaps: true,
  includeReviews: true,
  compress: true,
  encrypt: false,
  password: ''
});

const backups = ref<BackupMetadata[]>([]);
const backingUp = ref(false);

// 恢复选项
const selectedFile = ref<File | null>(null);
const versions = ref<DataVersion[]>([]);
const versionOptions = ref({
  dataType: 'studySet',
  itemId: ''
});

// 云同步配置
const cloudConfig = ref<CloudSyncConfig>({
  enabled: false,
  provider: 'local',
  syncInterval: 60,
  autoSync: false
});

const syncStatus = ref({
  isSyncing: false,
  lastSyncTime: null as number | null,
  syncProgress: 0,
  syncError: null as string | null
});

// 导入导出选项
const exportOptions = ref({
  format: 'json' as 'json' | 'csv' | 'markdown',
  dataType: 'cards'
});

const importFile = ref<File | null>(null);

// 加载备份列表
onMounted(async () => {
  await loadBackups();
  await loadCloudConfig();
  await loadSyncStatus();
});

// 创建备份
const createBackup = async () => {
  backingUp.value = true;
  try {
    const config = {
      includeTypes: getIncludeTypes(),
      compress: backupOptions.value.compress,
      encrypt: backupOptions.value.encrypt,
      password: backupOptions.value.password
    };

    const metadata = await dataSyncService.createFullBackup(config);
    backups.value.unshift(metadata);
    alert('备份创建成功！');
  } catch (error) {
    console.error('创建备份失败:', error);
    alert('创建备份失败：' + error);
  } finally {
    backingUp.value = false;
  }
};

// 加载备份列表
const loadBackups = async () => {
  // 从本地存储加载备份元数据
  const stored = localStorage.getItem('backupList');
  if (stored) {
    backups.value = JSON.parse(stored);
  }
};

// 下载备份
const downloadBackup = async (backup: BackupMetadata) => {
  // 实现下载逻辑
  console.log('下载备份:', backup);
};

// 删除备份
const deleteBackup = async (id: string) => {
  if (confirm('确定要删除此备份吗？')) {
    backups.value = backups.value.filter(b => b.id !== id);
    localStorage.setItem('backupList', JSON.stringify(backups.value));
  }
};

// 处理文件拖放
const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
  }
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
  }
};

// 从文件恢复
const restoreFromFile = async () => {
  if (!selectedFile.value) return;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await dataSyncService.restoreFromBackup(content);

      if (result.success) {
        alert(`恢复成功！恢复了 ${result.restored} 项数据`);
      } else {
        alert('恢复失败：' + result.errors.join(', '));
      }
    };
    reader.readAsText(selectedFile.value);
  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败：' + error);
  }
};

// 加载版本
const loadVersions = async () => {
  versions.value = await dataSyncService.getVersions(
    versionOptions.value.dataType,
    versionOptions.value.itemId
  );
};

// 恢复到版本
const restoreToVersion = async (versionId: string) => {
  const success = await dataSyncService.restoreToVersion(versionId);
  if (success) {
    alert('恢复成功！');
  } else {
    alert('恢复失败');
  }
};

// 加载云配置
const loadCloudConfig = async () => {
  cloudConfig.value = await dataSyncService.getCloudSyncConfig();
};

// 保存云配置
const saveCloudConfig = async () => {
  await dataSyncService.saveCloudSyncConfig(cloudConfig.value);
  alert('设置已保存！');
};

// 加载同步状态
const loadSyncStatus = async () => {
  syncStatus.value = await dataSyncService.getSyncStatus();
};

// 立即同步
const syncNow = async () => {
  syncStatus.value.isSyncing = true;
  syncStatus.value.syncError = null;

  try {
    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    syncStatus.value.lastSyncTime = Date.now();
    syncStatus.value.syncProgress = 100;
  } catch (error) {
    syncStatus.value.syncError = error instanceof Error ? error.message : '同步失败';
  } finally {
    syncStatus.value.isSyncing = false;
  }
};

// 导出数据
const exportData = async () => {
  // 实现导出逻辑
  alert('导出功能开发中...');
};

// 处理导入文件
const handleImportDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    importFile.value = files[0];
  }
};

const handleImportFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    importFile.value = input.files[0];
  }
};

// 导入数据
const importData = async () => {
  if (!importFile.value) return;

  try {
    const data = await dataSyncService.importFromFile(importFile.value);
    console.log('导入数据:', data);
    alert('导入成功！');
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败：' + error);
  }
};

// 工具函数
const getIncludeTypes = () => {
  const types: string[] = [];
  if (backupOptions.value.includeStudySets) types.push('studySets');
  if (backupOptions.value.includeCards) types.push('cards');
  if (backupOptions.value.includeMindMaps) types.push('mindmaps');
  if (backupOptions.value.includeReviews) types.push('reviews');
  if (types.length === 0 || types.length === 4) return ['all'];
  return types as any;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
</script>

<style scoped lang="scss">
.data-sync-panel {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
}

.sync-header {
  margin-bottom: 16px;
}

.sync-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  margin: 0;
}

.sync-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sync-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--b3-theme-on-surface);
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }
}

.sync-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.backup-section,
.restore-section,
.cloud-section,
.import-section {
  padding: 16px;
  background: var(--b3-theme-surface);
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    margin: 0 0 12px;
  }
}

.backup-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
}

.password-input {
  margin-bottom: 12px;

  .sy-input {
    width: 100%;
    max-width: 200px;
  }
}

.btn-primary {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--b3-theme-on-primary);
  background: var(--b3-theme-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
}

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.btn-danger {
    color: var(--b3-theme-error);
    border-color: var(--b3-theme-error);

    &:hover {
      background: var(--b3-theme-error);
      color: var(--b3-theme-on-primary);
    }
  }
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
  font-size: 14px;
}

.upload-area {
  border: 2px dashed var(--b3-border-color);
  border-radius: 6px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .file-input {
    display: none;
  }
}

.upload-hint {
  color: var(--b3-theme-on-surface-light);

  .upload-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 8px;
  }

  p {
    margin: 4px 0;
  }

  .upload-sub {
    font-size: 12px;
  }
}

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-top: 12px;
}

.file-name {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
}

.version-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  border: 1px solid var(--b3-border-color);
}

.version-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.form-group {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
    margin-bottom: 6px;
  }

  .sy-select,
  .sy-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    color: var(--b3-theme-on-background);
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }
}

.webdav-settings {
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-bottom: 12px;
}

.sync-status {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--b3-border-color);

  &:last-child {
    border-bottom: none;
  }

  &.error {
    color: var(--b3-theme-error);
  }
}

.status-label {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

.status-value {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
