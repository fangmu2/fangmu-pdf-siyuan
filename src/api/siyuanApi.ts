// src/api/siyuanApi.ts

/**
 * 获取思源内核地址
 * 思源的内核端口可能会变化，需要动态获取
 */
export function getKernelBase(): string {
  // 尝试多种方式获取正确的内核地址
  // 方式1: 从 window.siyuan 获取
  if ((window as any).siyuan?.config?.system?.kernelAddr) {
    return (window as any).siyuan.config.system.kernelAddr;
  }
  // 方式2: 从当前页面origin获取
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:6806`;
  }
  // 默认地址
  return "http://127.0.0.1:6806";
}

/**
 * 通用的POST请求方法
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
    throw new Error(`API请求失败: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`API错误: ${json.msg}`);
  }

  return json.data as T;
}

/**
 * 上传文件到思源笔记本的petal目录
 * 使用 /api/file/putFile API 直接保存文件到指定路径
 * 保存到 petal 目录可避免被当做未引用资源文件清理
 */
export async function uploadFileToAssets(file: File): Promise<{ path: string; name: string }> {
  const kernelBase = getKernelBase();

  // 生成唯一的文件名，避免冲突
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'png';
  const uniqueFileName = `pdf-excerpt-${timestamp}-${randomSuffix}.${ext}`;

  // 目标路径: /data/storage/petal/fangmu-pdf-siyuan/xxx.png
  // 保存到 petal 目录，避免被当做未引用资源文件清理
  const targetPath = `/data/storage/petal/fangmu-pdf-siyuan/${uniqueFileName}`;

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
    throw new Error(`上传失败: ${json.msg}`);
  }

  // /api/file/putFile 返回 { code: 0, msg: "", data: null }
  // 成功后文件路径就是我们指定的路径
  const actualPath = `storage/petal/fangmu-pdf-siyuan/${uniqueFileName}`;
  const actualName = file.name;

  return {
    path: actualPath,
    name: actualName
  };
}

/**
 * 生成文件的直接访问URL
 * petal 目录下的文件需要通过 /api/file/getFile API 访问
 * 注意： getFile API 需要 POST 方式调用，此函数返回的 URL 仅用于特定场景
 */
export function toAssetUrl(path: string): string {
  const kernelBase = getKernelBase();
  // 提取文件名
  let fileName = path;
  if (path.includes('/')) {
    fileName = path.split('/').pop() || path;
  }

  // petal 目录下的文件路径
  const filePath = `/data/storage/petal/fangmu-pdf-siyuan/${fileName}`;
  // getFile API 支持 GET 方式，通过 query 参数传递路径
  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent(filePath)}`;
}

/**
 * 通过API获取文件内容（二进制）
 * path: 文件路径，如 "/data/storage/petal/fangmu-pdf-siyuan/xxx.pdf"
 * 使用 POST 方式调用 /api/file/getFile API
 */
export async function getFileAsBlob(path: string): Promise<Blob> {
  const kernelBase = getKernelBase();

  // 提取文件名
  let fileName = path;
  if (path.includes('/')) {
    fileName = path.split('/').pop() || path;
  }

  // petal 目录下的文件路径
  const filePath = `/data/storage/petal/fangmu-pdf-siyuan/${fileName}`;

  // 使用 POST 方式调用 getFile API
  const res = await fetch(`${kernelBase}/api/file/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: filePath }),
  });

  if (!res.ok) {
    throw new Error(`获取文件失败: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();

  // 验证是否是有效的 PDF 文件
  if (blob.size === 0) {
    throw new Error('获取的文件为空');
  }

  // 检查文件类型，如果不是 PDF，可能是错误响应
  if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
    console.warn(`[getFileAsBlob] 文件类型可能不正确: ${blob.type}`);
  }

  return blob;
}

/**
 * 列出assets目录下的文件
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

// 缓存的当前文档ID（用户打开PDF前所在的文档）
let cachedCurrentDocId: string | null = null;

/**
 * 更新缓存的当前文档ID
 * 在用户打开PDF插件或进行其他操作前调用
 */
export function updateCachedDocId(): string | null {
  const docId = fetchCurrentDocId();
  if (docId) {
    cachedCurrentDocId = docId;
  }
  return docId;
}

/**
 * 获取缓存的文档ID
 */
export function getCachedDocId(): string | null {
  return cachedCurrentDocId;
}

/**
 * 实时获取当前文档ID（内部函数）
 */
function fetchCurrentDocId(): string | null {
  try {
    const siyuan = (window as any).siyuan;

    // 方式1: 从编辑器 protyle 获取（桌面端）
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

    // 方式2: 移动端编辑器
    if (siyuan?.mobile?.editor?.protyle) {
      const mobileProtyle = siyuan.mobile.editor.protyle;
      const docId = mobileProtyle.block?.rootID
        || mobileProtyle.element?.dataset?.rootid;
      if (docId) {
        return docId;
      }
    }

    // 方式3: 从DOM获取当前焦点的编辑器
    const focusedProtyle = document.querySelector('.protyle:focus-within, .protyle-wysiwyg:focus-within') as HTMLElement;
    if (focusedProtyle) {
      const container = focusedProtyle.closest('.protyle') as HTMLElement;
      if (container?.dataset?.rootid) {
        return container.dataset.rootid;
      }
    }

    // 方式4: 获取页面上第一个可见的编辑器
    const visibleProtyle = document.querySelector('.protyle[data-rootid]') as HTMLElement;
    if (visibleProtyle?.dataset?.rootid) {
      return visibleProtyle.dataset.rootid;
    }

    // 方式5: 从 protyle-wysiwyg 元素获取
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
 * 获取当前选中的文档ID
 * 优先返回缓存的文档ID，如果没有缓存则实时获取
 */
export function getCurrentDocId(): string | null {
  // 优先使用缓存的文档ID
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
    const kernelBase = getKernelBase();
    let stmt: string;

    // 转义单引号防止 SQL 注入
    const escapedKeyword = keyword ? keyword.replace(/'/g, "''").trim() : '';

    if (escapedKeyword) {
      // 模糊搜索 - 同时搜索文档标题和内容
      stmt = `SELECT DISTINCT root_id as id,
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
 * 获取指定文档所在的笔记本ID
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
 */
export async function setPluginData<T>(key: string, value: T): Promise<boolean> {
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
