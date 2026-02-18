// src/api/siyuanApi.ts
const KERNEL_BASE = "http://127.0.0.1:6806";

export async function postApi<T = any>(
  path: string,
  data: Record<string, any>
): Promise<T> {
  const res = await fetch(`${KERNEL_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`API error: ${json.msg}`);
  }
  return json.data as T;
}

/**
 * 列出某个目录下的文件
 * path: 工作空间下的相对路径，例如 "/data/assets"
 */
export interface FileInfo {
  isDir: boolean;
  isSymlink: boolean;
  name: string;
  updated: number;
}

export async function readDir(path: string): Promise<FileInfo[]> {
  return postApi<FileInfo[]>("/api/file/readDir", { path });
}

/**
 * 获取文件内容（二进制）
 * path: 工作空间下的路径，会自动处理前缀
 * 返回 Blob，可直接用于 URL.createObjectURL
 */
export async function getFileAsBlob(path: string): Promise<Blob> {
  // 修正路径：/api/file/getFile 的 path 参数是相对于 data 目录的
  // 例如：assets/xxx.pdf 而不是 /data/assets/xxx.pdf
  let apiPath = path;
  if (apiPath.startsWith("/data/")) {
    apiPath = apiPath.slice(6); // 移除 "/data/" 前缀
  } else if (apiPath.startsWith("data/")) {
    apiPath = apiPath.slice(5); // 移除 "data/" 前缀
  } else if (apiPath.startsWith("/")) {
    apiPath = apiPath.slice(1); // 移除开头的 "/"
  }

  console.log(`[getFileAsBlob] 原始路径: ${path}, 处理后路径: ${apiPath}`);

  const res = await fetch(`${KERNEL_BASE}/api/file/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: apiPath }),
  });
  if (!res.ok) {
    throw new Error(`getFile failed: ${res.status} ${res.statusText}`);
  }
  return await res.blob();
}


/**
 * 上传文件到思源的 assets 目录
 * @param file 要上传的文件对象
 * @returns 返回上传后的文件路径（例如：/data/assets/xxx.pdf）
 */
export async function uploadFileToAssets(file: File): Promise<string> {
  const formData = new FormData();
  // 设定保存路径为 data/assets/文件名
  // 注意：putFile 的 path 是相对于 data 目录的
  const destPath = `assets/${file.name}`;
  formData.append("path", destPath);
  formData.append("file", file);
  // 如果是覆盖写入，可以加 isDir: false，这里不需要

  const res = await fetch(`${KERNEL_BASE}/api/file/putFile`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`上传失败: ${json.msg}`);
  }

  // 返回可供后续 API 使用的完整路径
  return `/data/${destPath}`;
}
