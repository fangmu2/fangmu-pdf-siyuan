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
 * 上传文件到思源笔记本的assets目录
 * 使用 /api/file/putFile API 直接保存文件到指定路径
 */
export async function uploadFileToAssets(file: File): Promise<{ path: string; name: string }> {
  const kernelBase = getKernelBase();
  
  // 生成唯一的文件名，避免冲突
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'png';
  const uniqueFileName = `pdf-excerpt-${timestamp}-${randomSuffix}.${ext}`;
  
  // 目标路径: /data/assets/xxx.png
  const targetPath = `/data/assets/${uniqueFileName}`;

  console.log('[uploadFileToAssets] 内核地址:', kernelBase, '目标路径:', targetPath);

  // 使用 FormData 上传
  const formData = new FormData();
  formData.append("path", targetPath);
  formData.append("file", file);

  const res = await fetch(`${kernelBase}/api/file/putFile`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  console.log('[uploadFileToAssets] API响应:', json);
  
  if (json.code !== 0) {
    throw new Error(`上传失败: ${json.msg}`);
  }

  // /api/file/putFile 返回 { code: 0, msg: "", data: null }
  // 成功后文件路径就是我们指定的路径
  const actualPath = `assets/${uniqueFileName}`;  // 返回相对路径格式
  const actualName = file.name;

  console.log(`[uploadFileToAssets] 上传成功, 路径: ${actualPath}`);
  
  return {
    path: actualPath,
    name: actualName
  };
}

/**
 * 生成PDF的直接访问URL
 * 思源的assets文件访问路径是 /assets/xxx.pdf
 */
export function toAssetUrl(path: string): string {
  const kernelBase = getKernelBase();
  // 提取文件名
  let fileName = path;
  if (path.includes('/')) {
    fileName = path.split('/').pop() || path;
  }
  
  // 思源内核静态资源访问路径
  return `${kernelBase}/assets/${fileName}`;
}

/**
 * 通过API获取文件内容（二进制）
 * path: 文件路径，如 "/data/assets/xxx.pdf" 或 "assets/xxx.pdf"
 */
export async function getFileAsBlob(path: string): Promise<Blob> {
  const kernelBase = getKernelBase();
  
  // 提取文件名
  let fileName = path;
  if (path.includes('/')) {
    fileName = path.split('/').pop() || path;
  }

  // 直接通过静态资源路径访问文件
  // 思源的 assets 文件可以通过 /assets/xxx.pdf 直接访问
  const assetUrl = `${kernelBase}/assets/${fileName}`;
  
  console.log(`[getFileAsBlob] 原始路径: ${path}, 静态资源URL: ${assetUrl}`);

  const res = await fetch(assetUrl);
  
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
  
  console.log(`[getFileAsBlob] 获取成功, 大小: ${blob.size} bytes, 类型: ${blob.type}`);
  
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
