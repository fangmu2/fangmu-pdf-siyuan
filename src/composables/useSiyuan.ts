/**
 * useSiyuan Composable
 * 思源笔记 API 调用封装
 * 遵循 .clinerules.md 规范
 */

import { ref, onMounted } from 'vue';
import type { Ref } from 'vue';
import { sql, getBlock, createBlock, updateBlock as updateBlockApi, deleteBlock, updateBlockAttrsCompat as updateBlockAttrs } from '../api/siyuanApi';

/**
 * 思源配置信息
 */
export interface SiyuanConfig {
  /** 思源 API Token */
  token: string;
  /** 思源服务器地址 */
  server: string;
  /** 当前用户信息 */
  user?: {
    name: string;
    id: string;
  };
  /** 外观配置 */
  appearance: {
    mode: 'light' | 'dark';
    theme: string;
  };
}

/**
 * useSiyuan 返回值接口
 */
export interface UseSiyuanReturn {
  // 状态
  config: Ref<SiyuanConfig | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  isReady: Ref<boolean>;

  // 思源 API 方法
  querySql: <T = any>(stmt: string) => Promise<T[]>;
  getBlockById: (id: string) => Promise<any>;
  getBlocksByHPath: (hPath: string, notebookId?: string) => Promise<any[]>;
  createNewBlock: (params: {
    dataType: 'markdown' | 'dom';
    data: string;
    parentID?: string;
    previousID?: string;
  }) => Promise<string[]>;
  updateBlock: (params: {
    dataType: 'markdown' | 'dom';
    data: string;
    id: string;
  }) => Promise<string[]>;
  deleteBlockById: (id: string) => Promise<void>;
  updateBlockAttributes: (params: {
    id: string;
    attrs: Record<string, string>;
  }) => Promise<void>;

  // 工具方法
  getCurrentNotebookId: () => Promise<string | null>;
  getCurrentDocumentId: () => Promise<string | null>;
  getThemeMode: () => 'light' | 'dark';
}

/**
 * 思源笔记 Composable
 * @returns 思源 API 调用相关的方法和状态
 */
export function useSiyuan(): UseSiyuanReturn {
  // 状态
  const config = ref<SiyuanConfig | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const isReady = ref<boolean>(false);

  /**
   * 初始化思源配置
   */
  async function initConfig(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // 从全局对象获取思源配置
      const siyuanGlobal = (window as any).siyuan;

      if (!siyuanGlobal) {
        throw new Error('思源笔记环境未检测到，请在思源笔记中运行此插件');
      }

      config.value = {
        token: siyuanGlobal.token || '',
        server: siyuanGlobal.server || '',
        user: siyuanGlobal.user,
        appearance: {
          mode: siyuanGlobal.config?.appearance?.mode || 'light',
          theme: siyuanGlobal.config?.appearance?.theme || 'default'
        }
      };

      isReady.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '初始化思源配置失败';
      console.error('[useSiyuan] 初始化思源配置失败:', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 执行 SQL 查询
   */
  async function querySql<T = any>(stmt: string): Promise<T[]> {
    try {
      const result = await sql({ stmt });
      return (result as T[]) || [];
    } catch (e) {
      console.error('[useSiyuan] SQL 查询失败:', stmt, e);
      throw e;
    }
  }

  /**
   * 根据 ID 获取块
   */
  async function getBlockById(id: string): Promise<any> {
    try {
      return await getBlock({ id });
    } catch (e) {
      console.error('[useSiyuan] 获取块失败:', id, e);
      throw e;
    }
  }

  /**
   * 根据路径获取块列表
   */
  async function getBlocksByHPath(hPath: string, notebookId?: string): Promise<any[]> {
    let stmt = `SELECT * FROM blocks WHERE hpath = '${hPath}'`;
    if (notebookId) {
      stmt += ` AND box = '${notebookId}'`;
    }

    try {
      const result = await sql({ stmt });
      return (result as any[]) || [];
    } catch (e) {
      console.error('[useSiyuan] 获取块列表失败:', hPath, e);
      throw e;
    }
  }

  /**
   * 创建新块
   */
  async function createNewBlock(params: {
    dataType: 'markdown' | 'dom';
    data: string;
    parentID?: string;
    previousID?: string;
  }): Promise<string[]> {
    try {
      const result = await createBlock(params);
      return result || [];
    } catch (e) {
      console.error('[useSiyuan] 创建块失败:', e);
      throw e;
    }
  }

  /**
   * 更新块
   */
  async function updateBlock(params: {
    dataType: 'markdown' | 'dom';
    data: string;
    id: string;
  }): Promise<string[]> {
    try {
      const result = await updateBlockApi(params);
      return result || [];
    } catch (e) {
      console.error('[useSiyuan] 更新块失败:', e);
      throw e;
    }
  }

  /**
   * 删除块
   */
  async function deleteBlockById(id: string): Promise<void> {
    try {
      await deleteBlock({ id });
    } catch (e) {
      console.error('[useSiyuan] 删除块失败:', id, e);
      throw e;
    }
  }

  /**
   * 更新块属性
   */
  async function updateBlockAttributes(params: {
    id: string;
    attrs: Record<string, string>;
  }): Promise<void> {
    try {
      await updateBlockAttrs(params);
    } catch (e) {
      console.error('[useSiyuan] 更新块属性失败:', e);
      throw e;
    }
  }

  /**
   * 获取当前笔记本 ID
   */
  async function getCurrentNotebookId(): Promise<string | null> {
    try {
      // 从思源全局对象获取当前打开的笔记本
      const siyuanGlobal = (window as any).siyuan;
      return siyuanGlobal?.notebook?.id || null;
    } catch (e) {
      console.error('[useSiyuan] 获取笔记本 ID 失败:', e);
      return null;
    }
  }

  /**
   * 获取当前文档 ID
   */
  async function getCurrentDocumentId(): Promise<string | null> {
    try {
      // 从思源全局对象获取当前打开的文档
      const siyuanGlobal = (window as any).siyuan;
      return siyuanGlobal?.block?.id || null;
    } catch (e) {
      console.error('[useSiyuan] 获取文档 ID 失败:', e);
      return null;
    }
  }

  /**
   * 获取当前主题模式
   */
  function getThemeMode(): 'light' | 'dark' {
    return config.value?.appearance.mode || 'light';
  }

  // 初始化
  onMounted(() => {
    initConfig();
  });

  return {
    // 状态
    config,
    loading,
    error,
    isReady,

    // 思源 API 方法
    querySql,
    getBlockById,
    getBlocksByHPath,
    createNewBlock,
    updateBlock,
    deleteBlockById,
    updateBlockAttributes,

    // 工具方法
    getCurrentNotebookId,
    getCurrentDocumentId,
    getThemeMode
  };
}

export default useSiyuan;
