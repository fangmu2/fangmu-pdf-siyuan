// src/api/siyuanApi.ts

/**
 * 获取思源内核地址
 * 思源的内核端口可能会变化，需要动态获取
 */
export function getKernelBase(): string {
  // 尝试多种方式获取正确的内核地址
  // 方式 1: 从 window.siyuan 获取
  if ((window as any).siyuan?.config?.system?.kernelAddr) {
    return (window as any).siyuan.config.system.kernelAddr;
  }
  // 方式 2: 从当前页面 origin 获取
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:6806`;
  }
  // 默认地址
  return "http://127.0.0.1:6806";
}

/**
 * 通用的 POST 请求方法
 */
export async function postApi<T = any>(
  path: string,
  data: Record<string, any>
): Promise<T> {
  const kernelBase = getKernelBase();
  const res = await fetch(`${kernelBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`API 请求失败：${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`API 错误：${json.msg}`);
  }

  return json.data as T;
}

/**
 * 文件缓存映射，用于避免重复的PUT/GET操作
 * 存储文件名到其相关信息的映射
 */
const fileCache = new Map<string, {
  path: string;
  name: string;
  base64?: string;
  blob?: Blob;
  blobUrl?: string;
  timestamp: number;
}>();

/**
 * 缓存清理间隔（30分钟）
 */
const CACHE_CLEAN_INTERVAL = 30 * 60 * 1000;

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fileCache.entries()) {
    if (now - value.timestamp > CACHE_CLEAN_INTERVAL) {
      // 清理 Blob URL 引用
      if (value.blobUrl) {
        URL.revokeObjectURL(value.blobUrl);
      }
      fileCache.delete(key);
    }
  }
}, CACHE_CLEAN_INTERVAL);

/**
 * 上传文件到思源笔记本的 petal 目录
 * 使用 /api/file/putFile API 直接保存文件到指定路径
 * 保存到 petal 目录可避免被当做未引用资源文件清理
 *
 * @param file 要上传的文件
 * @param returnBlob 是否同时返回 Blob 引用（用于避免上传后立即 getFile）
 * @returns 包含路径、文件名和可选的 Blob/URL
 */
export async function uploadFileToAssets(
  file: File,
  returnBlob = false
): Promise<{
  path: string;
  name: string;
  base64?: string;
  blob?: Blob;
  blobUrl?: string;
}> {
  // 检查是否已有缓存（基于文件名和大小的简单缓存键）
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
  const cached = fileCache.get(cacheKey);
  if (cached) {
    console.log(`[uploadFileToAssets] 使用缓存: ${file.name}`);
    return cached;
  }

  const kernelBase = getKernelBase();

  // 生成唯一的文件名，避免冲突
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'png';
  const uniqueFileName = `pdf-excerpt-${timestamp}-${randomSuffix}.${ext}`;

  // 目标路径：/data/storage/petal/fangmu-pdf-siyuan/xxx.png
  // 保存到 petal 目录，避免被当做未引用资源文件清理
  const targetPath = `/data/storage/petal/fangmu-pdf-siyuan/${uniqueFileName}`;

  // 读取文件为 base64（用于图片嵌入到 Markdown）
  const base64 = await fileToBase64(file);

  // 创建 Blob URL（用于直接加载，避免再次 getFile）
  let blob: Blob | undefined;
  let blobUrl: string | undefined;
  if (returnBlob) {
    blob = file;
    blobUrl = URL.createObjectURL(file);
  }

  // 使用 FormData 上传
  const formData = new FormData();
  formData.append("path", targetPath);
  formData.append("file", file);

  const res = await fetch(`${kernelBase}/api/file/putFile`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (json.code !== 0) {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    throw new Error(`上传失败：${json.msg}`);
  }

  // 返回 petal 路径和 base64 数据
  const actualPath = `storage/petal/fangmu-pdf-siyuan/${uniqueFileName}`;
  const actualName = file.name;

  const result = {
    path: actualPath,
    name: actualName,
    base64,
    blob,
    blobUrl
  };

  // 将结果存入缓存
  fileCache.set(cacheKey, {
    ...result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * 将 File 对象转换为 base64 字符串
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 生成文件的直接访问 URL
 * assets 目录下的文件可以直接通过 HTTP GET 方式访问
 */
export function toAssetUrl(path: string): string {
  const kernelBase = getKernelBase();

  // 如果已经是 assets/ 格式，直接拼接
  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`;
  }

  // 如果是完整路径 /data/assets/xxx，转换为 assets/xxx
  if (path.startsWith('/data/assets/')) {
    return `${kernelBase}/${path.slice(6)}`;
  }

  // 其他路径通过 getFile API 获取
  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent(path)}`;
}

/**
 * 文件内容缓存，用于避免重复的GET请求
 * 存储文件路径到其Blob内容的映射
 */
const fileContentCache = new Map<string, { blob: Blob; timestamp: number }>();

/**
 * 通过 API 获取文件内容（二进制）
 * path: 文件路径，如 "assets/xxx.pdf" 或 "/data/assets/xxx.pdf"
 * 使用 POST 方式调用 /api/file/getFile API
 */
export async function getFileAsBlob(path: string): Promise<Blob> {
  // 检查是否已有缓存
  const cached = fileContentCache.get(path);
  if (cached) {
    const now = Date.now();
    // 缓存有效期为5分钟
    if (now - cached.timestamp < 5 * 60 * 1000) {
      console.log(`[getFileAsBlob] 使用缓存: ${path}`);
      return cached.blob;
    } else {
      // 清除过期缓存
      fileContentCache.delete(path);
    }
  }

  const kernelBase = getKernelBase();

  // 规范化路径
  let filePath = path;

  // 如果路径不以 /data/ 开头，添加前缀
  if (!filePath.startsWith('/data/')) {
    // assets/xxx.pdf -> /data/assets/xxx.pdf
    filePath = `/data/${filePath}`;
  }

  // 使用 POST 方式调用 getFile API
  const res = await fetch(`${kernelBase}/api/file/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: filePath }),
  });

  if (!res.ok) {
    throw new Error(`获取文件失败：${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();

  // 验证是否是有效的 PDF 文件
  if (blob.size === 0) {
    throw new Error('获取的文件为空');
  }

  // 检查文件类型，如果不是 PDF，可能是错误响应
  if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
    console.warn(`[getFileAsBlob] 文件类型可能不正确：${blob.type}`);
  }

  // 将结果存入缓存
  fileContentCache.set(path, {
    blob,
    timestamp: Date.now()
  });

  return blob;
}

/**
 * 列出 assets 目录下的文件
 */
export async function listAssetsFiles(): Promise<string[]> {
  const data = await postApi<{ files: string[] }>("/api/file/readDir", {
    path: "/data/assets"
  });

  return data.files || [];
}

/**
 * 获取插件持久化数据（使用文件存储）
 * 数据存储在 /data/storage/petal/fangmu-pdf-siyuan/ 目录下
 */
export async function getPluginData<T = any>(key: string): Promise<T | null> {
  const kernelBase = getKernelBase();
  const filePath = `/data/storage/petal/fangmu-pdf-siyuan/${key}.json`;

  try {
    // 直接读取文件，通过返回结果判断文件是否存在
    const res = await fetch(`${kernelBase}/api/file/getFile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: filePath }),
    });

    if (!res.ok) {
      return null;
    }

    const text = await res.text();
    if (text) {
      const data = JSON.parse(text);
      return data as T;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 缓存的当前文档 ID（用户打开 PDF 前所在的文档）
let cachedCurrentDocId: string | null = null;

/**
 * 更新缓存的当前文档 ID
 * 在用户打开 PDF 插件或进行其他操作前调用
 */
export function updateCachedDocId(): string | null {
  const docId = fetchCurrentDocId();
  if (docId) {
    cachedCurrentDocId = docId;
  }
  return docId;
}

/**
 * 获取缓存的文档 ID
 */
export function getCachedDocId(): string | null {
  return cachedCurrentDocId;
}

/**
 * 实时获取当前文档 ID（内部函数）
 */
function fetchCurrentDocId(): string | null {
  try {
    const siyuan = (window as any).siyuan;

    // 方式 1: 从编辑器 protyle 获取（桌面端）
    if (siyuan?.editor?.protyle) {
      const protyle = siyuan.editor.protyle;

      // 尝试多种可能的路径获取 rootID
      const docId = protyle.block?.rootID
        || protyle.options?.rootId
        || protyle.wysiwyg?.element?.dataset?.rootid
        || protyle.element?.dataset?.rootid
        || protyle.doc?.id;

      if (docId) {
        return docId;
      }

      // 尝试从 protyle.block 获取
      if (protyle.block?.parentElement) {
        const rootId = protyle.block.parentElement.dataset?.rootid;
        if (rootId) {
          return rootId;
        }
      }
    }

    // 方式 2: 移动端编辑器
    if (siyuan?.mobile?.editor?.protyle) {
      const mobileProtyle = siyuan.mobile.editor.protyle;
      const docId = mobileProtyle.block?.rootID
        || mobileProtyle.element?.dataset?.rootid;
      if (docId) {
        return docId;
      }
    }

    // 方式 3: 从 DOM 获取当前焦点的编辑器
    const focusedProtyle = document.querySelector('.protyle:focus-within, .protyle-wysiwyg:focus-within') as HTMLElement;
    if (focusedProtyle) {
      const container = focusedProtyle.closest('.protyle') as HTMLElement;
      if (container?.dataset?.rootid) {
        return container.dataset.rootid;
      }
    }

    // 方式 4: 获取页面上第一个可见的编辑器
    const visibleProtyle = document.querySelector('.protyle[data-rootid]') as HTMLElement;
    if (visibleProtyle?.dataset?.rootid) {
      return visibleProtyle.dataset.rootid;
    }

    // 方式 5: 从 protyle-wysiwyg 元素获取
    const wysiwyg = document.querySelector('.protyle-wysiwyg[data-doc-type]') as HTMLElement;
    if (wysiwyg) {
      const container = wysiwyg.closest('.protyle') as HTMLElement;
      if (container?.dataset?.rootid) {
        return container.dataset.rootid;
      }
    }

    return null;
  } catch (e) {
    console.error('[fetchCurrentDocId] 获取失败:', e);
    return null;
  }
}

/**
 * 获取当前选中的文档 ID
 * 优先返回缓存的文档 ID，如果没有缓存则实时获取
 */
export function getCurrentDocId(): string | null {
  // 优先使用缓存的文档 ID
  if (cachedCurrentDocId) {
    return cachedCurrentDocId;
  }
  // 如果没有缓存，尝试实时获取
  return fetchCurrentDocId();
}

/**
 * 检查文档是否存在
 */
export async function checkDocExists(docId: string): Promise<boolean> {
  try {
    const result = await postApi<{ root_id: string }[]>('/api/query/sql', {
      stmt: `SELECT root_id FROM blocks WHERE root_id = '${docId}' LIMIT 1`
    });
    return result && result.length > 0;
  } catch (e) {
    console.error('[checkDocExists] 检查失败:', e);
    return false;
  }
}

/**
 * 搜索思源笔记中的文档
 * @param keyword 搜索关键词
 * @returns 文档列表
 */
export async function searchSiyuanDocs(keyword: string): Promise<{ id: string; name: string; box: string; hpath: string }[]> {
  try {
    let stmt: string;

    // 转义单引号防止 SQL 注入
    const escapedKeyword = keyword ? keyword.replace(/'/g, "''").trim() : '';

    if (escapedKeyword) {
      // 模糊搜索 - 同时搜索文档标题和内容
      stmt = `SELECT DISTINCT root_id as id
              (SELECT content FROM blocks b2 WHERE b2.root_id = b.root_id AND type = 'd' LIMIT 1) as name,
              box, hpath
              FROM blocks b
              WHERE type = 'd'
              AND (content LIKE '%${escapedKeyword}%' OR hpath LIKE '%${escapedKeyword}%')
              ORDER BY updated DESC LIMIT 30`;
    } else {
      // 获取最近更新的文档
      stmt = `SELECT root_id as id, content as name, box, hpath FROM blocks
              WHERE type = 'd'
              ORDER BY updated DESC LIMIT 30`;
    }

    const result = await postApi<{ id: string; name: string; box: string; hpath: string }[]>('/api/query/sql', {
      stmt
    });

    // 过滤掉空结果，并确保所有字段都有有效值
    const filteredResult = (result || [])
      .filter(doc => doc.id && doc.name)
      .map(doc => ({
        id: doc.id || '',
        name: doc.name || '',
        box: doc.box || '',
        hpath: doc.hpath || ''
      }));

    return filteredResult;
  } catch (e) {
    console.error('[searchSiyuanDocs] 搜索失败:', e);
    return [];
  }
}

/**
 * 获取指定文档所在的笔记本 ID
 */
export async function getDocNotebookId(docId: string): Promise<string | null> {
  try {
    const result = await postApi<{ box: string }[]>('/api/query/sql', {
      stmt: `SELECT box FROM blocks WHERE root_id = '${docId}' LIMIT 1`
    });
    if (result && result.length > 0) {
      return result[0].box;
    }
  } catch (e) {
    console.error('[getDocNotebookId] 获取失败:', e);
  }
  return null;
}

/**
 * 设置插件持久化数据（使用文件存储）
 * 数据存储在 /data/storage/petal/fangmu-pdf-siyuan/ 目录下
 *
 * 使用防抖机制，合并同一 key 的多次保存请求
 */
const pendingSaves: Map<string, { value: any; timer: ReturnType<typeof setTimeout> }> = new Map();
const savingKeys = new Set<string>(); // 正在保存中的 key 集合，防止重复保存
const SAVE_DEBOUNCE_MS = 300; // 防抖时间

export async function setPluginData<T>(key: string, value: T): Promise<boolean> {
  // 如果该 key 正在保存中，只更新待保存的值，不重复触发
  const existingPending = pendingSaves.get(key);
  if (existingPending) {
    clearTimeout(existingPending.timer);
  }

  // 设置新的待处理保存
  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      pendingSaves.delete(key);
      savingKeys.delete(key);
      const success = await doSetPluginData(key, value);
      resolve(success);
    }, SAVE_DEBOUNCE_MS);

    pendingSaves.set(key, { value, timer });
  });
}

/**
 * 检查某个 key 是否正在保存或有待处理的保存请求
 */
export function isKeySaving(key: string): boolean {
  return pendingSaves.has(key) || savingKeys.has(key);
}

/**
 * 强制立即保存所有待处理的数据
 * 在插件关闭或页面卸载时调用
 */
export async function flushPendingSaves(): Promise<void> {
  const savesToProcess = Array.from(pendingSaves.entries());
  pendingSaves.clear();

  // 过滤掉已经在保存中的 key，避免重复保存
  const uniqueSaves = savesToProcess.filter(([key]) => !savingKeys.has(key));

  await Promise.all(uniqueSaves.map(async ([key, { value, timer }]) => {
    clearTimeout(timer);
    savingKeys.add(key); // 标记为正在保存
    await doSetPluginData(key, value);
    savingKeys.delete(key); // 保存完成，移除标记
  }));
}

/**
 * 实际执行保存操作
 */
async function doSetPluginData<T>(key: string, value: T): Promise<boolean> {
  // 如果正在保存同一个 key，直接跳过，避免重复 putFile
  if (savingKeys.has(key)) {
    console.log(`[setPluginData] ${key} 正在保存中，跳过本次请求`);
    return true;
  }

  const kernelBase = getKernelBase();
  const storageDir = `/data/storage/petal/fangmu-pdf-siyuan`;

  try {
    // 使用 FormData 存储文件（putFile 会自动创建父目录）
    const content = JSON.stringify(value, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const file = new File([blob], `${key}.json`, { type: 'application/json' });

    const formData = new FormData();
    formData.append("path", `${storageDir}/${key}.json`);
    formData.append("file", file);

    console.log(`[setPluginData] 保存 ${key}.json`);
    const res = await fetch(`${kernelBase}/api/file/putFile`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (json.code === 0) {
      return true;
    } else {
      console.error('[setPluginData] 保存失败:', json.msg);
      return false;
    }
  } catch (e) {
    console.error('[setPluginData] 保存数据失败:', e);
    return false;
  }
}
