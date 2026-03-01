/**
 * 数据同步与备份服务（第十六阶段 - 数据同步与备份）
 * 提供本地数据导出、导入、备份功能
 */

import { api } from '../api';

/**
 * 备份数据类型
 */
export type BackupDataType =
  | 'studySets'      // 学习集
  | 'cards'          // 卡片
  | 'mindmaps'       // 思维导图
  | 'reviews'        // 复习记录
  | 'annotations'    // 标注
  | 'settings'       // 设置
  | 'all';           // 全部数据

/**
 * 备份配置
 */
export interface BackupConfig {
  includeTypes: BackupDataType[];
  compress: boolean;
  encrypt: boolean;
  password?: string;
}

/**
 * 备份元数据
 */
export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: number;
  size: number;
  dataTypes: BackupDataType[];
  version: string;
  checksum: string;
}

/**
 * 同步状态
 */
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncProgress: number;
  syncError: string | null;
}

/**
 * 云同步配置
 */
export interface CloudSyncConfig {
  enabled: boolean;
  provider: 'webdav' | 'local' | 'custom';
  webdavUrl?: string;
  webdavUsername?: string;
  webdavPassword?: string;
  syncInterval: number; // 分钟
  autoSync: boolean;
}

/**
 * 增量备份记录
 */
export interface IncrementalBackup {
  baseBackupId: string;
  changes: {
    type: 'create' | 'update' | 'delete';
    dataType: string;
    itemId: string;
    timestamp: number;
  }[];
  timestamp: number;
}

/**
 * 数据版本记录
 */
export interface DataVersion {
  id: string;
  dataType: string;
  itemId: string;
  version: number;
  data: Record<string, any>;
  createdAt: number;
  note?: string;
}

/**
 * 数据同步服务类
 */
class DataSyncServiceClass {
  private backupPath = '/data/backup/';
  private versionPath = '/data/versions/';
  private configPath = '/data/syncConfig.json';

  private defaultConfig: BackupConfig = {
    includeTypes: ['all'],
    compress: true,
    encrypt: false
  };

  private defaultCloudConfig: CloudSyncConfig = {
    enabled: false,
    provider: 'local',
    syncInterval: 60,
    autoSync: false
  };

  /**
   * 创建完整备份
   */
  async createFullBackup(config: Partial<BackupConfig> = {}): Promise<BackupMetadata> {
    const finalConfig: BackupConfig = { ...this.defaultConfig, ...config };

    try {
      const backupData: Record<string, any> = {};

      // 收集数据
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('studySets')) {
        backupData.studySets = await this.exportStudySets();
      }
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('cards')) {
        backupData.cards = await this.exportCards();
      }
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('mindmaps')) {
        backupData.mindmaps = await this.exportMindMaps();
      }
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('reviews')) {
        backupData.reviews = await this.exportReviews();
      }
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('annotations')) {
        backupData.annotations = await this.exportAnnotations();
      }
      if (finalConfig.includeTypes.includes('all') || finalConfig.includeTypes.includes('settings')) {
        backupData.settings = await this.exportSettings();
      }

      // 生成元数据
      const metadata: BackupMetadata = {
        id: this.generateId(),
        name: `backup_${new Date().toISOString().split('T')[0]}`,
        createdAt: Date.now(),
        size: JSON.stringify(backupData).length,
        dataTypes: finalConfig.includeTypes,
        version: '1.0.0',
        checksum: this.calculateChecksum(JSON.stringify(backupData))
      };

      // 序列化数据
      let serialized = JSON.stringify({
        metadata,
        data: backupData,
        exportedAt: Date.now()
      }, null, 2);

      // 压缩（简化版：移除空白）
      if (finalConfig.compress) {
        serialized = JSON.stringify({
          metadata,
          data: backupData,
          exportedAt: Date.now()
        });
      }

      // 加密（简化版：Base64 编码）
      if (finalConfig.encrypt && finalConfig.password) {
        serialized = this.simpleEncrypt(serialized, finalConfig.password);
      }

      // 保存备份
      const filename = `${metadata.name}.json`;
      await this.saveBackupFile(filename, serialized);

      return metadata;

    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  /**
   * 从备份恢复数据
   */
  async restoreFromBackup(
    backupData: string,
    options: { merge?: boolean; password?: string } = {}
  ): Promise<{ success: boolean; restored: number; errors: string[] }> {
    const errors: string[] = [];
    let restored = 0;

    try {
      let dataStr = backupData;

      // 解密
      if (dataStr.startsWith('encrypted:')) {
        if (!options.password) {
          throw new Error('备份已加密，需要密码');
        }
        dataStr = this.simpleDecrypt(dataStr, options.password);
      }

      // 解析数据
      const backup = JSON.parse(dataStr);
      const data = backup.data || backup;

      // 恢复数据
      if (data.studySets) {
        await this.importStudySets(data.studySets, options.merge !== false);
        restored += data.studySets.length;
      }
      if (data.cards) {
        await this.importCards(data.cards, options.merge !== false);
        restored += data.cards.length;
      }
      if (data.mindmaps) {
        await this.importMindMaps(data.mindmaps, options.merge !== false);
        restored += data.mindmaps.length;
      }
      if (data.reviews) {
        await this.importReviews(data.reviews, options.merge !== false);
        restored += data.reviews.length;
      }
      if (data.annotations) {
        await this.importAnnotations(data.annotations, options.merge !== false);
        restored += data.annotations.length;
      }
      if (data.settings) {
        await this.importSettings(data.settings);
        restored += 1;
      }

      return { success: true, restored, errors };

    } catch (error: any) {
      errors.push(error.message);
      return { success: false, restored, errors };
    }
  }

  /**
   * 创建增量备份
   */
  async createIncrementalBackup(
    baseBackupId: string,
    since: number
  ): Promise<IncrementalBackup> {
    const changes: IncrementalBackup['changes'] = [];

    try {
      // 获取自指定时间以来的变更
      const studySetChanges = await this.getStudySetChanges(since);
      const cardChanges = await this.getCardChanges(since);
      const mindmapChanges = await this.getMindMapChanges(since);

      studySetChanges.forEach(c => changes.push({ ...c, dataType: 'studySet' }));
      cardChanges.forEach(c => changes.push({ ...c, dataType: 'card' }));
      mindmapChanges.forEach(c => changes.push({ ...c, dataType: 'mindmap' }));

      const incremental: IncrementalBackup = {
        baseBackupId,
        changes,
        timestamp: Date.now()
      };

      // 保存增量备份
      const filename = `incremental_${baseBackupId}_${Date.now()}.json`;
      await this.saveBackupFile(filename, JSON.stringify(incremental));

      return incremental;

    } catch (error) {
      console.error('创建增量备份失败:', error);
      throw error;
    }
  }

  /**
   * 应用增量备份
   */
  async applyIncrementalBackup(incremental: IncrementalBackup): Promise<number> {
    let applied = 0;

    for (const change of incremental.changes) {
      try {
        switch (change.dataType) {
          case 'studySet':
            await this.applyStudySetChange(change);
            break;
          case 'card':
            await this.applyCardChange(change);
            break;
          case 'mindmap':
            await this.applyMindMapChange(change);
            break;
        }
        applied++;
      } catch (error) {
        console.error(`应用变更失败 ${change.dataType}:${change.itemId}`, error);
      }
    }

    return applied;
  }

  /**
   * 保存数据版本
   */
  async saveVersion(
    dataType: string,
    itemId: string,
    data: Record<string, any>,
    note?: string
  ): Promise<DataVersion> {
    const version: DataVersion = {
      id: this.generateId(),
      dataType,
      itemId,
      version: await this.getVersionCount(dataType, itemId) + 1,
      data,
      createdAt: Date.now(),
      note
    };

    await this.saveVersionFile(version);

    return version;
  }

  /**
   * 获取历史版本
   */
  async getVersions(dataType: string, itemId: string): Promise<DataVersion[]> {
    const versions: DataVersion[] = [];

    try {
      const files = await this.getFilesInDirectory(this.versionPath);

      for (const file of files) {
        const content = await this.readFile(file);
        const version = JSON.parse(content);
        if (version.dataType === dataType && version.itemId === itemId) {
          versions.push(version);
        }
      }

      return versions.sort((a, b) => b.createdAt - a.createdAt);

    } catch (error) {
      console.error('获取版本失败:', error);
      return [];
    }
  }

  /**
   * 恢复到指定版本
   */
  async restoreToVersion(versionId: string): Promise<boolean> {
    try {
      // 查找版本文件
      const files = await this.getFilesInDirectory(this.versionPath);

      for (const file of files) {
        const content = await this.readFile(file);
        const version = JSON.parse(content);

        if (version.id === versionId) {
          // 恢复数据
          switch (version.dataType) {
            case 'studySet':
              await this.updateStudySet(version.itemId, version.data);
              break;
            case 'card':
              await this.updateCard(version.itemId, version.data);
              break;
            case 'mindmap':
              await this.updateMindMap(version.itemId, version.data);
              break;
          }
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('恢复版本失败:', error);
      return false;
    }
  }

  /**
   * 导出为文件
   */
  async exportToFile(
    data: any,
    filename: string,
    format: 'json' | 'csv' | 'markdown' = 'json'
  ): Promise<void> {
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = this.toCSV(data);
        mimeType = 'text/csv';
        break;
      case 'markdown':
        content = this.toMarkdown(data);
        mimeType = 'text/markdown';
        break;
      case 'json':
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    }

    this.downloadFile(content, filename, mimeType);
  }

  /**
   * 从文件导入
   */
  async importFromFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          if (file.name.endsWith('.json')) {
            resolve(JSON.parse(content));
          } else if (file.name.endsWith('.csv')) {
            resolve(this.fromCSV(content));
          } else {
            reject(new Error('不支持的文件格式'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const config = await this.getSyncConfig();
      const lastBackup = await this.getLastBackup();

      return {
        isSyncing: false,
        lastSyncTime: lastBackup?.createdAt || null,
        syncProgress: 0,
        syncError: null
      };
    } catch (error) {
      return {
        isSyncing: false,
        lastSyncTime: null,
        syncProgress: 0,
        syncError: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取云同步配置
   */
  async getCloudSyncConfig(): Promise<CloudSyncConfig> {
    try {
      const content = await api.storage.get(this.configPath);
      return content ? JSON.parse(content) : this.defaultCloudConfig;
    } catch {
      return this.defaultCloudConfig;
    }
  }

  /**
   * 保存云同步配置
   */
  async saveCloudSyncConfig(config: CloudSyncConfig): Promise<void> {
    await api.storage.put(this.configPath, JSON.stringify(config));
  }

  // ==================== 内部方法 ====================

  private async exportStudySets() {
    // 从思源 API 导出学习集
    return [];
  }

  private async exportCards() {
    return [];
  }

  private async exportMindMaps() {
    return [];
  }

  private async exportReviews() {
    return [];
  }

  private async exportAnnotations() {
    return [];
  }

  private async exportSettings() {
    return {};
  }

  private async importStudySets(data: any[], merge: boolean) {}
  private async importCards(data: any[], merge: boolean) {}
  private async importMindMaps(data: any[], merge: boolean) {}
  private async importReviews(data: any[], merge: boolean) {}
  private async importAnnotations(data: any[], merge: boolean) {}
  private async importSettings(data: any) {}

  private async getStudySetChanges(since: number) {
    return [];
  }

  private async getCardChanges(since: number) {
    return [];
  }

  private async getMindMapChanges(since: number) {
    return [];
  }

  private async applyStudySetChange(change: any) {}
  private async applyCardChange(change: any) {}
  private async applyMindMapChange(change: any) {}

  private async getVersionCount(dataType: string, itemId: string): Promise<number> {
    const versions = await this.getVersions(dataType, itemId);
    return versions.length;
  }

  private async saveVersionFile(version: DataVersion): Promise<void> {
    const filename = `version_${version.dataType}_${version.itemId}_${version.version}.json`;
    await api.storage.put(this.versionPath + filename, JSON.stringify(version));
  }

  private async saveBackupFile(filename: string, content: string): Promise<void> {
    await api.storage.put(this.backupPath + filename, content);
  }

  private async getFilesInDirectory(path: string): Promise<string[]> {
    try {
      const result = await api.storage.get(path);
      return result ? JSON.parse(result) : [];
    } catch {
      return [];
    }
  }

  private async readFile(path: string): Promise<string> {
    return await api.storage.get(path) || '';
  }

  private async updateStudySet(id: string, data: any) {}
  private async updateCard(id: string, data: any) {}
  private async updateMindMap(id: string, data: any) {}

  private async getLastBackup(): Promise<BackupMetadata | null> {
    return null;
  }

  private async getSyncConfig(): Promise<any> {
    return {};
  }

  private calculateChecksum(data: string): string {
    // 简化版校验和计算
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private simpleEncrypt(data: string, password: string): string {
    // 简化版加密（实际应使用更安全的算法）
    const key = this.hashPassword(password);
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return 'encrypted:' + btoa(encrypted);
  }

  private simpleDecrypt(encrypted: string, password: string): string {
    const key = this.hashPassword(password);
    const data = atob(encrypted.replace('encrypted:', ''));
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString().padStart(8, '0');
  }

  private toCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(h => JSON.stringify(item[h] ?? '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private fromCSV(csv: string): any[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      result.push(obj);
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  private toMarkdown(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      let md = '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

      data.forEach(item => {
        md += '| ' + headers.map(h => String(item[h] ?? '')).join(' | ') + ' |\n';
      });

      return md;
    }

    return JSON.stringify(data, null, 2);
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const dataSyncService = new DataSyncServiceClass();
