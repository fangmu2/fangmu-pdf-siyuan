// src/api/projectApi.ts
import { postApi, getPluginData, setPluginData } from './siyuanApi';
import type { PDFProject, ProjectListItem, ProjectStorage, ProjectPdf } from '../types/project';
import type { PDFAnnotation } from '../types/annotaion';

const PROJECTS_STORAGE_KEY = 'pdf-projects-v3';  // 版本号，使用思源持久化存储
const ANNOTATIONS_DOC_PREFIX = 'pdf-annotations-';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 获取项目存储（使用思源持久化存储）
 */
async function getProjectStorageAsync(): Promise<ProjectStorage> {
  try {
    const saved = await getPluginData<ProjectStorage>(PROJECTS_STORAGE_KEY);
    if (saved && Array.isArray(saved.projects)) {
      console.log('[getProjectStorageAsync] 从思源加载项目数据:', saved.projects.length, '个项目');
      return saved;
    }
  } catch (e) {
    console.error('读取项目存储失败:', e);
  }
  return { projects: [], currentProjectId: null };
}

/**
 * 保存项目存储（使用思源持久化存储）
 */
async function saveProjectStorageAsync(storage: ProjectStorage): Promise<void> {
  try {
    const success = await setPluginData(PROJECTS_STORAGE_KEY, storage);
    if (success) {
      console.log('[saveProjectStorageAsync] 已保存到思源:', storage.projects.length, '个项目');
    }
  } catch (e) {
    console.error('保存项目存储失败:', e);
  }
}

// 本地缓存（内存中），用于快速访问
let cachedStorage: ProjectStorage | null = null;

/**
 * 获取项目存储（带缓存）
 */
function getProjectStorage(): ProjectStorage {
  if (cachedStorage) {
    return cachedStorage;
  }
  // 同步方法只能返回默认值，需要异步加载
  return { projects: [], currentProjectId: null };
}

/**
 * 初始化存储（应用启动时调用）
 */
export async function initProjectStorage(): Promise<ProjectStorage> {
  cachedStorage = await getProjectStorageAsync();
  return cachedStorage;
}

/**
 * 保存项目存储
 */
function saveProjectStorage(storage: ProjectStorage): void {
  cachedStorage = storage;
  // 异步保存到思源
  saveProjectStorageAsync(storage).catch(e => {
    console.error('异步保存失败:', e);
  });
}

/**
 * 创建新项目
 */
export async function createProject(options: {
  name: string;
  pdfPath: string;
  pdfName: string;
}): Promise<PDFProject> {
  // 确保数据已加载
  if (!cachedStorage) {
    cachedStorage = await getProjectStorageAsync();
  }
  
  const storage = cachedStorage;

  // 创建PDF条目
  const pdfId = generateId();
  const newPdf: ProjectPdf = {
    id: pdfId,
    path: options.pdfPath,
    name: options.pdfName,
    totalPages: 0,
    currentPage: 1,
    addedAt: Date.now()
  };

  // 创建新项目
  const project: PDFProject = {
    id: generateId(),
    name: options.name,
    pdfs: [newPdf],
    currentPdfId: pdfId,
    annotationCount: 0,
    created: Date.now(),
    updated: Date.now()
  };

  // 先保存项目
  storage.projects.unshift(project);
  storage.currentProjectId = project.id;
  
  // 更新缓存并保存到思源
  cachedStorage = storage;
  await saveProjectStorageAsync(storage);
  console.log('[createProject] 项目已保存:', project.name);

  // 异步创建标注文档（不阻塞）
  createAnnotationDocument(project).then(docId => {
    if (docId) {
      project.annotationDocId = docId;
      // 更新存储
      if (cachedStorage) {
        const projIndex = cachedStorage.projects.findIndex(p => p.id === project.id);
        if (projIndex !== -1) {
          cachedStorage.projects[projIndex].annotationDocId = docId;
          saveProjectStorageAsync(cachedStorage);
        }
      }
      console.log('[createProject] 标注文档创建成功:', docId);
    }
  }).catch(e => {
    console.warn('[createProject] 标注文档创建失败，项目已保存:', e.message);
  });

  return project;
}

/**
 * 向现有项目添加PDF
 */
export async function addPdfToProject(
  projectId: string, 
  options: { pdfPath: string; pdfName: string }
): Promise<ProjectPdf | null> {
  // 确保数据已加载
  if (!cachedStorage || cachedStorage.projects.length === 0) {
    cachedStorage = await getProjectStorageAsync();
  }
  
  const storage = cachedStorage;
  const project = storage.projects.find(p => p.id === projectId);
  
  if (!project) {
    console.error('[addPdfToProject] 找不到项目:', projectId);
    return null;
  }
  
  // 检查是否已存在相同路径的PDF
  const existing = project.pdfs.find(p => p.path === options.pdfPath);
  if (existing) {
    project.currentPdfId = existing.id;
    project.updated = Date.now();
    cachedStorage = storage;
    await saveProjectStorageAsync(storage);
    return existing;
  }

  // 添加新PDF
  const pdfId = generateId();
  const newPdf: ProjectPdf = {
    id: pdfId,
    path: options.pdfPath,
    name: options.pdfName,
    totalPages: 0,
    currentPage: 1,
    addedAt: Date.now()
  };

  project.pdfs.push(newPdf);
  project.currentPdfId = pdfId;
  project.updated = Date.now();
  
  // 更新缓存并保存
  cachedStorage = storage;
  await saveProjectStorageAsync(storage);
  
  console.log('[addPdfToProject] 添加成功:', options.pdfName, '到项目', projectId);

  return newPdf;
}

/**
 * 获取可用的笔记本ID
 */
async function getAvailableNotebookId(): Promise<string | null> {
  try {
    // 使用 /api/notebook/lsNotebooks 获取笔记本列表
    const result = await postApi<any>('/api/notebook/lsNotebooks', {});
    
    // 处理不同的返回格式
    let notebooks: any[] = [];
    if (Array.isArray(result)) {
      notebooks = result;
    } else if (result && Array.isArray(result.notebooks)) {
      notebooks = result.notebooks;
    } else if (result && Array.isArray(result.data)) {
      notebooks = result.data;
    }
    
    // 找到第一个可用的笔记本
    for (const nb of notebooks) {
      // 检查笔记本是否有效（可能是对象或字符串）
      if (typeof nb === 'string') {
        return nb;
      } else if (nb && (nb.id || nb.box || nb.uuid)) {
        return nb.id || nb.box || nb.uuid;
      }
    }
    
    // 如果没有找到，尝试使用默认笔记本
    console.warn('[getAvailableNotebookId] 未找到可用笔记本，尝试使用默认');
    return null;
  } catch (e) {
    console.error('[getAvailableNotebookId] 获取笔记本失败:', e);
    return null;
  }
}

/**
 * 创建标注文档
 */
async function createAnnotationDocument(project: PDFProject): Promise<string | null> {
  try {
    const notebookId = await getAvailableNotebookId();
    
    if (!notebookId) {
      console.warn('[createAnnotationDocument] 无法获取笔记本ID，跳过文档创建');
      return null;
    }
    
    const docName = `${project.name}-标注`;
    
    // 创建文档
    const result = await postApi<any>('/api/filetree/createDocWithMd', {
      notebook: notebookId,
      path: `/` + docName,
      markdown: `# ${project.name} 标注列表\n\n> 创建时间: ${new Date().toLocaleString()}\n\n---\n\n`
    });

    // 从返回结果中获取文档ID
    let docId: string | null = null;
    
    if (result) {
      // 尝试多种格式
      if (result.rootId || result.root_id) {
        docId = result.rootId || result.root_id;
      } else if (Array.isArray(result) && result[0]) {
        docId = result[0].rootId || result[0].root_id;
      } else if (result.data && (result.data.rootId || result.data.root_id)) {
        docId = result.data.rootId || result.data.root_id;
      }
    }

    if (!docId) {
      // 尝试通过路径查询文档ID
      try {
        const docs = await postApi<{ root_id: string }[]>('/api/query/sql', {
          stmt: `SELECT root_id FROM blocks WHERE box = '${notebookId}' AND content LIKE '%${project.name}%' AND type = 'd' ORDER BY created DESC LIMIT 1`
        });
        if (docs && docs.length > 0) {
          docId = docs[0].root_id;
        }
      } catch (e) {
        console.warn('[createAnnotationDocument] 查询文档ID失败:', e);
      }
    }

    console.log('[createAnnotationDocument] 创建结果:', { docId, notebookId });
    return docId;
  } catch (e: any) {
    console.error('[createAnnotationDocument] 创建失败:', e);
    return null;
  }
}

/**
 * 获取所有项目列表
 */
export function getAllProjects(): ProjectListItem[] {
  const storage = getProjectStorage();
  return storage.projects.map(p => ({
    id: p.id,
    name: p.name,
    pdfCount: p.pdfs.length,
    pdfNames: p.pdfs.map(pdf => pdf.name),
    annotationCount: p.annotationCount,
    updated: p.updated
  }));
}

/**
 * 获取当前项目
 */
export function getCurrentProject(): PDFProject | null {
  const storage = getProjectStorage();
  if (!storage.currentProjectId) return null;
  return storage.projects.find(p => p.id === storage.currentProjectId) || null;
}

/**
 * 获取项目中的当前PDF
 */
export function getCurrentPdf(project: PDFProject): ProjectPdf | null {
  if (!project.currentPdfId) return project.pdfs[0] || null;
  return project.pdfs.find(p => p.id === project.currentPdfId) || project.pdfs[0] || null;
}

/**
 * 切换项目
 */
export function switchProject(projectId: string): PDFProject | null {
  const storage = getProjectStorage();
  const project = storage.projects.find(p => p.id === projectId);
  if (project) {
    storage.currentProjectId = projectId;
    saveProjectStorage(storage);
    return project;
  }
  return null;
}

/**
 * 切换项目中的PDF
 */
export function switchProjectPdf(projectId: string, pdfId: string): PDFProject | null {
  const storage = getProjectStorage();
  const project = storage.projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  const pdf = project.pdfs.find(p => p.id === pdfId);
  if (pdf) {
    project.currentPdfId = pdfId;
    project.updated = Date.now();
    saveProjectStorage(storage);
    return project;
  }
  return null;
}

/**
 * 更新项目中的PDF信息
 */
export function updateProjectPdf(
  projectId: string, 
  pdfId: string, 
  updates: Partial<ProjectPdf>
): PDFProject | null {
  const storage = getProjectStorage();
  const project = storage.projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  const pdfIndex = project.pdfs.findIndex(p => p.id === pdfId);
  if (pdfIndex === -1) return null;
  
  project.pdfs[pdfIndex] = {
    ...project.pdfs[pdfIndex],
    ...updates
  };
  project.updated = Date.now();
  
  saveProjectStorage(storage);
  return project;
}

/**
 * 更新项目
 */
export function updateProject(projectId: string, updates: Partial<PDFProject>): PDFProject | null {
  const storage = getProjectStorage();
  const index = storage.projects.findIndex(p => p.id === projectId);
  
  if (index === -1) return null;
  
  storage.projects[index] = {
    ...storage.projects[index],
    ...updates,
    updated: Date.now()
  };
  
  saveProjectStorage(storage);
  return storage.projects[index];
}

/**
 * 从项目中移除PDF
 */
export function removePdfFromProject(projectId: string, pdfId: string): PDFProject | null {
  const storage = getProjectStorage();
  const project = storage.projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  const pdfIndex = project.pdfs.findIndex(p => p.id === pdfId);
  if (pdfIndex === -1) return null;
  
  if (project.pdfs.length <= 1) {
    console.warn('[removePdfFromProject] 项目至少需要一个PDF');
    return null;
  }
  
  project.pdfs.splice(pdfIndex, 1);
  
  if (project.currentPdfId === pdfId) {
    project.currentPdfId = project.pdfs[0]?.id || null;
  }
  
  project.updated = Date.now();
  saveProjectStorage(storage);
  
  return project;
}

/**
 * 删除项目
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const storage = getProjectStorage();
  const index = storage.projects.findIndex(p => p.id === projectId);
  
  if (index === -1) return false;
  
  const project = storage.projects[index];
  
  // 删除对应的标注文档
  if (project.annotationDocId) {
    try {
      const notebookId = await getNotebookId(project.annotationDocId);
      if (notebookId) {
        await postApi('/api/filetree/removeDoc', {
          notebook: notebookId,
          path: `/${project.name}-标注`
        });
        console.log('[deleteProject] 删除标注文档成功');
      }
    } catch (e) {
      console.error('[deleteProject] 删除标注文档失败:', e);
    }
  }
  
  // 删除本地存储的标注数据
  const annotationKey = `${ANNOTATIONS_DOC_PREFIX}${projectId}`;
  localStorage.removeItem(annotationKey);
  
  // 从项目列表中移除
  storage.projects.splice(index, 1);
  
  if (storage.currentProjectId === projectId) {
    storage.currentProjectId = storage.projects.length > 0 ? storage.projects[0].id : null;
  }
  
  saveProjectStorage(storage);
  return true;
}

/**
 * 获取文档所在的笔记本ID
 */
async function getNotebookId(docId: string): Promise<string | null> {
  try {
    const blocks = await postApi<{ box: string }[]>('/api/query/sql', {
      stmt: `SELECT box FROM blocks WHERE root_id = '${docId}' LIMIT 1`
    });
    if (blocks && blocks.length > 0) {
      return blocks[0].box;
    }
  } catch (e) {
    console.error('[getNotebookId] 查询失败:', e);
  }
  return null;
}

/**
 * 保存标注到项目文档
 */
export async function saveAnnotationToProject(
  project: PDFProject,
  annotation: PDFAnnotation
): Promise<string | null> {
  // 如果没有文档ID，尝试创建
  if (!project.annotationDocId) {
    const docId = await createAnnotationDocument(project);
    if (docId) {
      project.annotationDocId = docId;
      updateProject(project.id, { annotationDocId: docId });
    } else {
      console.warn('[saveAnnotationToProject] 无法创建标注文档，仅保存到本地');
      return null;
    }
  }

  try {
    // 构建标注的 Markdown
    const markdown = buildAnnotationMarkdown(annotation);
    
    // 追加到文档
    const result = await postApi<any>('/api/block/appendBlock', {
      dataType: 'markdown',
      data: markdown,
      parentID: project.annotationDocId
    });

    let blockId: string | null = null;
    
    if (result) {
      if (result.doOperations && result.doOperations[0]?.id) {
        blockId = result.doOperations[0].id;
      } else if (Array.isArray(result) && result[0]?.doOperations?.[0]?.id) {
        blockId = result[0].doOperations[0].id;
      } else if (result.id) {
        blockId = result.id;
      }
    }

    if (blockId) {
      // 更新项目的标注数量
      updateProject(project.id, { 
        annotationCount: (project.annotationCount || 0) + 1 
      });
    }

    return blockId;
  } catch (e: any) {
    console.error('[saveAnnotationToProject] 保存失败:', e);
    return null;
  }
}

/**
 * 构建标注的 Markdown 内容
 */
function buildAnnotationMarkdown(annotation: PDFAnnotation): string {
  const rectString = annotation.rect.join(',');
  const fileAnnotationRef = `assets/${annotation.pdfName}?path=${annotation.pdfPath}&page=${annotation.page}&rect=${encodeURIComponent(rectString)}`;
  
  let markdown = '';
  const sourceMarker = `<small>📖 《${annotation.pdfName}》第${annotation.page}页</small>`;
  
  if (annotation.isImage && annotation.imagePath) {
    const imagePath = annotation.imagePath.startsWith('/data/') 
      ? annotation.imagePath.slice(6) 
      : annotation.imagePath;
    const imageMarkdown = `![PDF截图](${imagePath})`;
    
    switch (annotation.level) {
      case 'title':
        markdown = `\n${imageMarkdown}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"}`;
        break;
      case 'h1':
        markdown = `\n# 图片摘录\n${imageMarkdown}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"}`;
        break;
      case 'h2':
        markdown = `\n## 图片摘录\n${imageMarkdown}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"}`;
        break;
      case 'h3':
        markdown = `\n### 图片摘录\n${imageMarkdown}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"}`;
        break;
      default:
        markdown = `\n${imageMarkdown}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level || 'text'}" custom-image="true" custom-page="${annotation.page}"}`;
    }
  } else {
    switch (annotation.level) {
      case 'title':
        markdown = `\n${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      case 'h1':
        markdown = `\n# ${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      case 'h2':
        markdown = `\n## ${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      case 'h3':
        markdown = `\n### ${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      case 'h4':
        markdown = `\n#### ${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      case 'h5':
        markdown = `\n##### ${annotation.text}\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"}`;
        break;
      default:
        markdown = `\n**${annotation.text}**\n${sourceMarker}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level || 'text'}" custom-page="${annotation.page}"}`;
    }
  }

  if (annotation.color) {
    markdown += ` custom-color="${annotation.color}"`;
  }

  if (annotation.note) {
    markdown += ` custom-note="${annotation.note}"`;
  }

  markdown += `}`;

  return markdown;
}

// 标注数据缓存（内存中）
const annotationsCache: Map<string, PDFAnnotation[]> = new Map();

/**
 * 获取项目的所有标注（使用思源持久化存储）
 */
export async function getProjectAnnotationsAsync(projectId: string): Promise<PDFAnnotation[]> {
  // 先检查内存缓存
  if (annotationsCache.has(projectId)) {
    return annotationsCache.get(projectId)!;
  }
  
  const key = `${ANNOTATIONS_DOC_PREFIX}${projectId}`;
  try {
    const saved = await getPluginData<PDFAnnotation[]>(key);
    if (saved && Array.isArray(saved)) {
      annotationsCache.set(projectId, saved);
      console.log('[getProjectAnnotationsAsync] 加载标注:', projectId, saved.length, '条');
      return saved;
    }
  } catch (e) {
    console.error('加载标注缓存失败:', e);
  }
  return [];
}

/**
 * 保存项目的所有标注（使用思源持久化存储）
 */
export async function saveProjectAnnotationsAsync(projectId: string, annotations: PDFAnnotation[]): Promise<void> {
  const key = `${ANNOTATIONS_DOC_PREFIX}${projectId}`;
  try {
    annotationsCache.set(projectId, annotations);
    await setPluginData(key, annotations);
    console.log('[saveProjectAnnotationsAsync] 保存标注:', projectId, annotations.length, '条');
  } catch (e) {
    console.error('保存标注缓存失败:', e);
  }
}

/**
 * 同步版本（使用内存缓存，用于快速访问）
 */
export function getProjectAnnotations(projectId: string): PDFAnnotation[] {
  return annotationsCache.get(projectId) || [];
}

/**
 * 保存项目的所有标注到本地缓存（同步版本，后台异步持久化）
 */
export function saveProjectAnnotations(projectId: string, annotations: PDFAnnotation[]): void {
  annotationsCache.set(projectId, annotations);
  // 异步保存到思源
  saveProjectAnnotationsAsync(projectId, annotations).catch(e => {
    console.error('异步保存标注失败:', e);
  });
}

/**
 * 添加标注到本地缓存
 */
export function addAnnotationToCache(projectId: string, annotation: PDFAnnotation): void {
  const annotations = getProjectAnnotations(projectId);
  annotations.push(annotation);
  saveProjectAnnotations(projectId, annotations);
}

/**
 * 更新本地缓存中的标注
 */
export function updateAnnotationInCache(projectId: string, annotation: PDFAnnotation): void {
  const annotations = getProjectAnnotations(projectId);
  const index = annotations.findIndex(a => a.id === annotation.id);
  if (index !== -1) {
    annotations[index] = annotation;
    saveProjectAnnotations(projectId, annotations);
  }
}

/**
 * 从本地缓存删除标注
 */
export function deleteAnnotationFromCache(projectId: string, annotationId: string): void {
  const annotations = getProjectAnnotations(projectId);
  const filtered = annotations.filter(a => a.id !== annotationId);
  saveProjectAnnotations(projectId, filtered);
}
