/**
 * 脑图版本历史服务
 * MarginNote 4 风格学习插件 - 脑图版本管理与对比
 */

import type { MindMap, MindMapNode } from '../types/mindmap';

/** 版本变更类型 */
export type ChangeType = 'add' | 'remove' | 'update' | 'move';

/** 版本变更记录 */
export interface VersionChange {
  /** 变更类型 */
  type: ChangeType;
  /** 节点 ID */
  nodeId: string;
  /** 节点路径 */
  nodePath: string[];
  /** 变更前数据 */
  oldValue?: Partial<MindMapNode>;
  /** 变更后数据 */
  newValue?: Partial<MindMapNode>;
  /** 父节点 ID（移动时） */
  oldParentId?: string;
  newParentId?: string;
  /** 旧索引（移动时） */
  oldIndex?: number;
  newIndex?: number;
}

/** 脑图版本 */
export interface MindMapVersion {
  /** 版本 ID */
  id: string;
  /** 脑图 ID */
  mindMapId: string;
  /** 版本号 */
  version: number;
  /** 版本名称 */
  name: string;
  /** 版本描述 */
  description?: string;
  /** 快照数据 */
  snapshot: MindMap;
  /** 变更记录（相对于上一版本） */
  changes: VersionChange[];
  /** 创建时间 */
  createdAt: number;
  /** 创建者 */
  createdBy?: string;
  /** 标签 */
  tags?: string[];
}

/** 版本差异结果 */
export interface VersionDiff {
  /** 版本 1 */
  version1: MindMapVersion;
  /** 版本 2 */
  version2: MindMapVersion;
  /** 新增节点 */
  added: Array<{ nodeId: string; node: MindMapNode; path: string[] }>;
  /** 删除节点 */
  removed: Array<{ nodeId: string; node: MindMapNode; path: string[] }>;
  /** 修改节点 */
  modified: Array<{
    nodeId: string;
    oldNode: MindMapNode;
    newNode: MindMapNode;
    changes: string[];
    path: string[];
  }>;
  /** 移动节点 */
  moved: Array<{
    nodeId: string;
    node: MindMapNode;
    oldPath: string[];
    newPath: string[];
  }>;
  /** 统计 */
  stats: {
    totalChanges: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    movedCount: number;
  };
}

/** 版本历史存储 */
interface VersionStorage {
  [mindMapId: string]: MindMapVersion[];
}

/** 最大版本数量 */
const MAX_VERSIONS = 50;

/** 自动保存间隔（毫秒） */
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 分钟

/**
 * 脑图版本历史服务
 */
export class MindMapVersionService {
  private static instance: MindMapVersionService | null = null;

  /** 版本存储 */
  private versions: VersionStorage = {};

  /** 当前版本号映射 */
  private currentVersions: Map<string, number> = new Map();

  /** 自动保存定时器 */
  private autoSaveTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  /** 变更监听器 */
  private changeListeners: Map<string, (change: VersionChange) => void> = new Map();

  private constructor() {}

  static getInstance(): MindMapVersionService {
    if (!MindMapVersionService.instance) {
      MindMapVersionService.instance = new MindMapVersionService();
    }
    return MindMapVersionService.instance;
  }

  /**
   * 创建新版本
   */
  createVersion(
    mindMap: MindMap,
    name?: string,
    description?: string,
    changes: VersionChange[] = []
  ): MindMapVersion {
    const mindMapId = mindMap.id;
    const currentVersion = this.currentVersions.get(mindMapId) || 0;
    const newVersionNumber = currentVersion + 1;

    const version: MindMapVersion = {
      id: `version-${mindMapId}-${Date.now()}`,
      mindMapId,
      version: newVersionNumber,
      name: name || `版本 ${newVersionNumber}`,
      description,
      snapshot: this.deepClone(mindMap),
      changes,
      createdAt: Date.now(),
    };

    if (!this.versions[mindMapId]) {
      this.versions[mindMapId] = [];
    }

    this.versions[mindMapId].push(version);
    this.currentVersions.set(mindMapId, newVersionNumber);
    this.pruneVersions(mindMapId);

    return version;
  }

  /**
   * 获取版本列表
   */
  getVersions(mindMapId: string): MindMapVersion[] {
    return this.versions[mindMapId] || [];
  }

  /**
   * 获取指定版本
   */
  getVersion(mindMapId: string, versionId: string): MindMapVersion | null {
    const versions = this.versions[mindMapId];
    if (!versions) return null;
    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * 获取最新版本
   */
  getLatestVersion(mindMapId: string): MindMapVersion | null {
    const versions = this.versions[mindMapId];
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  /**
   * 恢复到指定版本
   */
  restoreVersion(mindMapId: string, versionId: string): MindMap | null {
    const version = this.getVersion(mindMapId, versionId);
    if (!version) return null;

    this.createVersion(
      version.snapshot,
      `恢复到 ${version.name}`,
      `从版本 ${version.version} 恢复`
    );

    return this.deepClone(version.snapshot);
  }

  /**
   * 对比两个版本
   */
  compareVersions(version1: MindMapVersion, version2: MindMapVersion): VersionDiff {
    const nodes1 = this.flattenNodes(version1.snapshot.root);
    const nodes2 = this.flattenNodes(version2.snapshot.root);

    const diff: VersionDiff = {
      version1,
      version2,
      added: [],
      removed: [],
      modified: [],
      moved: [],
      stats: {
        totalChanges: 0,
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        movedCount: 0,
      },
    };

    for (const [id, data] of nodes2) {
      const oldNode = nodes1.get(id);
      if (!oldNode) {
        diff.added.push({
          nodeId: id,
          node: data.node,
          path: data.path,
        });
      } else {
        const changes = this.getNodeChanges(oldNode.node, data.node);
        if (changes.length > 0) {
          diff.modified.push({
            nodeId: id,
            oldNode: oldNode.node,
            newNode: data.node,
            changes,
            path: data.path,
          });
        }

        if (this.getPathString(oldNode.path) !== this.getPathString(data.path)) {
          diff.moved.push({
            nodeId: id,
            node: data.node,
            oldPath: oldNode.path,
            newPath: data.path,
          });
        }
      }
    }

    for (const [id, data] of nodes1) {
      if (!nodes2.has(id)) {
        diff.removed.push({
          nodeId: id,
          node: data.node,
          path: data.path,
        });
      }
    }

    diff.stats.addedCount = diff.added.length;
    diff.stats.removedCount = diff.removed.length;
    diff.stats.modifiedCount = diff.modified.length;
    diff.stats.movedCount = diff.moved.length;
    diff.stats.totalChanges =
      diff.stats.addedCount +
      diff.stats.removedCount +
      diff.stats.modifiedCount +
      diff.stats.movedCount;

    return diff;
  }

  private getNodeChanges(oldNode: MindMapNode, newNode: MindMapNode): string[] {
    const changes: string[] = [];
    const oldText = oldNode.title || oldNode.text || '';
    const newText = newNode.title || newNode.text || '';
    if (oldText !== newText) {
      changes.push('文本内容');
    }
    if (JSON.stringify(oldNode.style) !== JSON.stringify(newNode.style)) {
      changes.push('样式');
    }
    if (oldNode.collapsed !== newNode.collapsed && oldNode.expanded !== newNode.expanded) {
      changes.push('折叠状态');
    }
    if (oldNode.note !== newNode.note) {
      changes.push('备注');
    }
    return changes;
  }

  private flattenNodes(
    node: MindMapNode,
    path: string[] = [],
    result: Map<string, { node: MindMapNode; path: string[] }> = new Map()
  ): Map<string, { node: MindMapNode; path: string[] }> {
    const nodeText = node.title || node.text || '未命名';
    result.set(node.id, {
      node: this.deepClone(node),
      path: [...path, nodeText],
    });
    for (const child of node.children) {
      this.flattenNodes(child, [...path, nodeText], result);
    }
    return result;
  }

  private getPathString(path: string[]): string {
    return path.join(' > ');
  }

  recordChange(mindMapId: string, change: VersionChange): void {
    const listener = this.changeListeners.get(mindMapId);
    if (listener) {
      listener(change);
    }
  }

  onChange(mindMapId: string, listener: (change: VersionChange) => void): void {
    this.changeListeners.set(mindMapId, listener);
  }

  startAutoSave(mindMapId: string, getMindMap: () => MindMap | null): void {
    this.stopAutoSave(mindMapId);

    const timer = setInterval(() => {
      const mindMap = getMindMap();
      if (mindMap) {
        const lastVersion = this.getLatestVersion(mindMapId);
        if (lastVersion) {
          const diff = this.compareVersions(lastVersion, {
            ...lastVersion,
            snapshot: mindMap,
          });
          if (diff.stats.totalChanges > 0) {
            this.createVersion(mindMap, '自动保存', undefined, this.diffToChanges(diff));
          }
        } else {
          this.createVersion(mindMap, '初始版本');
        }
      }
    }, AUTO_SAVE_INTERVAL);

    this.autoSaveTimers.set(mindMapId, timer);
  }

  stopAutoSave(mindMapId: string): void {
    const timer = this.autoSaveTimers.get(mindMapId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(mindMapId);
    }
  }

  private diffToChanges(diff: VersionDiff): VersionChange[] {
    const changes: VersionChange[] = [];
    for (const item of diff.added) {
      changes.push({
        type: 'add',
        nodeId: item.nodeId,
        nodePath: item.path,
        newValue: item.node,
      });
    }
    for (const item of diff.removed) {
      changes.push({
        type: 'remove',
        nodeId: item.nodeId,
        nodePath: item.path,
        oldValue: item.node,
      });
    }
    for (const item of diff.modified) {
      changes.push({
        type: 'update',
        nodeId: item.nodeId,
        nodePath: item.path,
        oldValue: item.oldNode,
        newValue: item.newNode,
      });
    }
    for (const item of diff.moved) {
      changes.push({
        type: 'move',
        nodeId: item.nodeId,
        nodePath: item.newPath,
        oldParentId: item.oldPath[item.oldPath.length - 2],
        newParentId: item.newPath[item.newPath.length - 2],
      });
    }
    return changes;
  }

  deleteVersion(mindMapId: string, versionId: string): boolean {
    const versions = this.versions[mindMapId];
    if (!versions) return false;
    const index = versions.findIndex(v => v.id === versionId);
    if (index === -1) return false;
    versions.splice(index, 1);
    return true;
  }

  clearVersions(mindMapId: string): void {
    delete this.versions[mindMapId];
    this.currentVersions.delete(mindMapId);
    this.stopAutoSave(mindMapId);
  }

  private pruneVersions(mindMapId: string): void {
    const versions = this.versions[mindMapId];
    if (!versions) return;
    if (versions.length > MAX_VERSIONS) {
      const firstVersion = versions[0];
      const recentVersions = versions.slice(-(MAX_VERSIONS - 1));
      this.versions[mindMapId] = [firstVersion, ...recentVersions];
    }
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  exportVersions(mindMapId: string): string {
    const versions = this.versions[mindMapId] || [];
    return JSON.stringify(versions, null, 2);
  }

  importVersions(mindMapId: string, json: string): boolean {
    try {
      const versions = JSON.parse(json) as MindMapVersion[];
      if (!Array.isArray(versions)) return false;
      this.versions[mindMapId] = versions;
      const maxVersion = Math.max(...versions.map(v => v.version));
      this.currentVersions.set(mindMapId, maxVersion);
      return true;
    } catch {
      return false;
    }
  }

  getVersionStats(mindMapId: string): {
    totalVersions: number;
    oldestVersion: MindMapVersion | null;
    newestVersion: MindMapVersion | null;
    totalChanges: number;
  } {
    const versions = this.versions[mindMapId] || [];
    return {
      totalVersions: versions.length,
      oldestVersion: versions.length > 0 ? versions[0] : null,
      newestVersion: versions.length > 0 ? versions[versions.length - 1] : null,
      totalChanges: versions.reduce((sum, v) => sum + v.changes.length, 0),
    };
  }
}

export const mindmapVersionService = MindMapVersionService.getInstance();
