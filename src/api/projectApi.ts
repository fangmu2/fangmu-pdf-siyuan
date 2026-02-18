// src/api/projectApi.ts
import { postApi, getKernelBase } from './siyuanApi';
import type { PDFProject, ProjectListItem, ProjectStorage, ProjectPdf } from '../types/project';
import type { PDFAnnotation } from '../types/annotaion';

const PROJECTS_STORAGE_KEY = 'pdf-projects';
const ANNOTATIONS_DOC_PREFIX = 'pdf-annotations-';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 获取项目存储
 */
function getProjectStorage(): ProjectStorage {
  try {
    const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('读取项目存储失败:', e);
  }
  return { projects: [], currentProjectId: null };
}

/**
 * 保存项目存储
 */
function saveProjectStorage(storage: ProjectStorage): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(storage));
}

/**
 * 创建新项目
 */
export async function createProject(options: {
  name: string;
  pdfPath: string;
  pdfName: string;
}): Promise<PDFProject> {
  const storage = getProjectStorage();

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

  // 创建对应的标注文档
  try {
    const docId = await createAnnotationDocument(project);
    project.annotationDocId = docId;
    console.log('[createProject] 创建标注文档成功:', docId);
  } catch (e) {
    console.error('[createProject] 创建标注文档失败:', e);
  }

  storage.projects.unshift(project);
  storage.currentProjectId = project.id;
  saveProjectStorage(storage);

  return project;
}

/**
 * 向现有项目添加PDF
 */
export async function addPdfToProject(
  projectId: string, 
  options: { pdfPath: string; pdfName: string }
): Promise<ProjectPdf | null> {
  const storage = getProjectStorage();
  const project = storage.projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  // 检查是否已存在相同路径的PDF
  const existing = project.pdfs.find(p => p.path === options.pdfPath);
  if (existing) {
    // 切换到已存在的PDF
    project.currentPdfId = existing.id;
    project.updated = Date.now();
    saveProjectStorage(storage);
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
  saveProjectStorage(storage);

  return newPdf;
}

/**
 * 创建标注文档
 */
async function createAnnotationDocument(project: PDFProject): Promise<string> {
  const kernelBase = getKernelBase();
  
  // 获取笔记本列表，使用第一个笔记本
  const notebooks = await postApi<{ id: string; name: string }[]>('/api/notebook/lsNotebooks', {});
  if (!notebooks || notebooks.length === 0) {
    throw new Error('没有可用的笔记本');
  }
  
  const notebookId = notebooks[0].id;
  const docName = `${project.name}-标注`;
  
  // 创建文档
  const result = await postApi<{ rootId?: string }[]>('/api/filetree/createDocWithMd', {
    notebook: notebookId,
    path: `/` + docName,
    markdown: `# ${project.name} 标注列表\n\n> 创建时间: ${new Date().toLocaleString()}\n\n---\n\n`
  });

  // 从返回结果中获取文档ID
  let docId: string | undefined;
  if (Array.isArray(result) && result.length > 0) {
    docId = result[0]?.rootId;
  }

  if (!docId) {
    // 尝试通过路径查询文档ID
    const docs = await postApi<{ root_id: string }[]>('/api/query/sql', {
      stmt: `SELECT root_id FROM blocks WHERE box = '${notebookId}' AND content LIKE '%${project.name}%标注%' AND type = 'd' ORDER BY created DESC LIMIT 1`
    });
    if (docs && docs.length > 0) {
      docId = docs[0].root_id;
    }
  }

  if (!docId) {
    throw new Error('无法获取创建的文档ID');
  }

  return docId;
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
  
  // 至少保留一个PDF
  if (project.pdfs.length <= 1) {
    console.warn('[removePdfFromProject] 项目至少需要一个PDF');
    return null;
  }
  
  project.pdfs.splice(pdfIndex, 1);
  
  // 如果移除的是当前PDF，切换到第一个
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
  
  // 如果删除的是当前项目，切换到第一个项目
  if (storage.currentProjectId === projectId) {
    storage.currentProjectId = storage.projects.length > 0 ? storage.projects[0].id : null;
  }
  
  saveProjectStorage(storage);
  return true;
}

/**
 * 获取文档所在的笔记本ID
 */
async function getNotebookId(docId: string): Promise<string> {
  const blocks = await postApi<{ box: string }[]>('/api/query/sql', {
    stmt: `SELECT box FROM blocks WHERE root_id = '${docId}' LIMIT 1`
  });
  if (blocks && blocks.length > 0) {
    return blocks[0].box;
  }
  return '';
}

/**
 * 保存标注到项目文档
 */
export async function saveAnnotationToProject(
  project: PDFProject,
  annotation: PDFAnnotation
): Promise<string> {
  // 确保 annotationDocId 存在
  if (!project.annotationDocId) {
    try {
      const docId = await createAnnotationDocument(project);
      project.annotationDocId = docId;
      updateProject(project.id, { annotationDocId: docId });
    } catch (e) {
      console.error('[saveAnnotationToProject] 创建文档失败:', e);
      throw new Error('无法创建标注文档');
    }
  }

  // 构建标注的 Markdown
  const markdown = buildAnnotationMarkdown(annotation);
  
  // 追加到文档
  const result = await postApi<{ doOperations?: Array<{ action: string; id: string }>; id?: string }[]>('/api/block/appendBlock', {
    dataType: 'markdown',
    data: markdown,
    parentID: project.annotationDocId
  });

  let blockId: string | undefined;
  if (Array.isArray(result) && result.length > 0) {
    const ops = result[0]?.doOperations;
    if (ops && ops.length > 0) {
      blockId = ops[0]?.id;
    }
  }

  if (!blockId) {
    throw new Error('创建标注块失败');
  }

  // 更新项目的标注数量
  updateProject(project.id, { 
    annotationCount: (project.annotationCount || 0) + 1 
  });

  return blockId;
}

/**
 * 构建标注的 Markdown 内容
 */
function buildAnnotationMarkdown(annotation: PDFAnnotation): string {
  const rectString = annotation.rect.join(',');
  const fileAnnotationRef = `assets/${annotation.pdfName}?path=${annotation.pdfPath}&page=${annotation.page}&rect=${encodeURIComponent(rectString)}`;
  
  let markdown = '';
  
  // 来源PDF标记
  const sourceMarker = `<small>📖 《${annotation.pdfName}》第${annotation.page}页</small>`;
  
  if (annotation.isImage && annotation.imagePath) {
    // 图片摘录
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
    // 文字摘录
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

/**
 * 获取项目的所有标注（从本地缓存）
 */
export function getProjectAnnotations(projectId: string): PDFAnnotation[] {
  const key = `${ANNOTATIONS_DOC_PREFIX}${projectId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载标注缓存失败:', e);
  }
  return [];
}

/**
 * 保存项目的所有标注到本地缓存
 */
export function saveProjectAnnotations(projectId: string, annotations: PDFAnnotation[]): void {
  const key = `${ANNOTATIONS_DOC_PREFIX}${projectId}`;
  localStorage.setItem(key, JSON.stringify(annotations));
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
