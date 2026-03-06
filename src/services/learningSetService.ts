import type { FileInfo } from '../api/siyuanApi'
import type { PDFAnnotation } from '../types/annotation'
// src/services/learningSetService.ts
import {
  checkDocExists,

  getCurrentDocId,
  getPluginData,
  postApi,
  readDir,
  setPluginData,
} from '../api/siyuanApi'

/**
 * 学习集接口定义
 */
export interface LearningSet {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  pdfs: LearningSetPdf[] // 关联的 PDF 列表（支持多 PDF）
  currentPdfId: string | null // 当前选中的 PDF ID
  annotations: PDFAnnotation[] // 学习集中的标注
  progress: Record<string, number> // 学习进度，key 为 PDF 路径，value 为页码
  annotationDocId?: string // 标注文档 ID（思源笔记中的文档）
  annotationCount: number // 标注数量
}

/**
 * 学习集中的 PDF 条目
 */
export interface LearningSetPdf {
  id: string
  path: string
  name: string
  totalPages: number
  currentPage: number
  addedAt: number
}

/**
 * 学习集列表项（用于显示）
 */
export interface LearningSetListItem {
  id: string
  name: string
  pdfCount: number
  pdfNames: string[]
  annotationCount: number
  updated: number
}

/**
 * 学习集服务类
 * 提供学习集的创建、管理、进度保存等功能
 */
export class LearningSetService {
  private static readonly STORAGE_KEY = 'learning-sets-v2'

  // 本地缓存（内存中）
  private static cachedStorage: { sets: LearningSet[], currentSetId: string | null } | null = null

  /**
   * 获取学习集存储（异步从思源读取）
   */
  private static async getStorageAsync(): Promise<{ sets: LearningSet[], currentSetId: string | null }> {
    try {
      const saved = await getPluginData<{ sets: LearningSet[], currentSetId: string | null }>(this.STORAGE_KEY)
      if (saved && Array.isArray(saved.sets)) {
        // 反序列化日期字段
        saved.sets = saved.sets.map((set) => ({
          ...set,
          createdAt: set.createdAt ? (set.createdAt instanceof Date ? set.createdAt : new Date(set.createdAt)) : new Date(),
          updatedAt: set.updatedAt ? (set.updatedAt instanceof Date ? set.updatedAt : new Date(set.updatedAt)) : new Date(),
        }))
        return saved
      }
    } catch (e) {
      console.error('读取学习集存储失败:', e)
    }
    return {
      sets: [],
      currentSetId: null,
    }
  }

  /**
   * 保存学习集存储（异步保存到思源）
   */
  private static async saveStorageAsync(storage: { sets: LearningSet[], currentSetId: string | null }): Promise<void> {
    try {
      await setPluginData(this.STORAGE_KEY, storage)
    } catch (e) {
      console.error('保存学习集存储失败:', e)
    }
  }

  /**
   * 获取学习集存储（带缓存）
   */
  private static getStorage(): { sets: LearningSet[], currentSetId: string | null } {
    if (this.cachedStorage) {
      return this.cachedStorage
    }
    return {
      sets: [],
      currentSetId: null,
    }
  }

  /**
   * 保存学习集存储
   */
  private static saveStorage(storage: { sets: LearningSet[], currentSetId: string | null }): void {
    this.cachedStorage = storage
    // 异步保存到思源
    this.saveStorageAsync(storage).catch((e) => {
      console.error('异步保存失败:', e)
    })
  }

  /**
   * 初始化存储（应用启动时调用）
   */
  static async initStorage(): Promise<{ sets: LearningSet[], currentSetId: string | null }> {
    this.cachedStorage = await this.getStorageAsync()
    return this.cachedStorage
  }

  /**
   * 生成唯一 ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * 获取所有学习集
   */
  static getAllLearningSets(): LearningSetListItem[] {
    const storage = this.getStorage()
    return storage.sets.map((set) => ({
      id: set.id,
      name: set.name,
      pdfCount: set.pdfs.length,
      pdfNames: set.pdfs.map((pdf) => pdf.name),
      annotationCount: set.annotationCount,
      updated: set.updatedAt.getTime(),
    }))
  }

  /**
   * 获取所有学习集（完整数据）
   */
  static getAllLearningSetsFull(): LearningSet[] {
    const storage = this.getStorage()
    return storage.sets
  }

  /**
   * 获取当前学习集
   */
  static getCurrentLearningSet(): LearningSet | null {
    const storage = this.getStorage()
    if (!storage.currentSetId) return null
    return storage.sets.find((set) => set.id === storage.currentSetId) || null
  }

  /**
   * 创建新的学习集
   */
  static async createLearningSet(
    name: string,
    description: string = '',
    initialPdfPath?: string,
    initialPdfName?: string,
  ): Promise<LearningSet> {
    // 确保数据已加载
    if (!this.cachedStorage) {
      this.cachedStorage = await this.getStorageAsync()
    }

    const storage = this.cachedStorage

    const newSet: LearningSet = {
      id: this.generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      pdfs: [],
      currentPdfId: null,
      annotations: [],
      progress: {},
      annotationCount: 0,
    }

    // 如果有初始 PDF，添加它
    if (initialPdfPath && initialPdfName) {
      const pdf: LearningSetPdf = {
        id: this.generateId(),
        path: initialPdfPath,
        name: initialPdfName,
        totalPages: 0,
        currentPage: 1,
        addedAt: Date.now(),
      }
      newSet.pdfs.push(pdf)
      newSet.currentPdfId = pdf.id
    }

    // 先保存学习集
    storage.sets.unshift(newSet)
    storage.currentSetId = newSet.id
    this.cachedStorage = storage
    await this.saveStorageAsync(storage)

    // 创建标注文档
    try {
      const docId = await this.createAnnotationDocument(newSet)
      if (docId) {
        newSet.annotationDocId = docId
        const setIndex = this.cachedStorage.sets.findIndex((s) => s.id === newSet.id)
        if (setIndex !== -1) {
          this.cachedStorage.sets[setIndex].annotationDocId = docId
          await this.saveStorageAsync(this.cachedStorage)
        }
      }
    } catch (e: any) {
      console.warn('[createLearningSet] 标注文档创建失败，学习集已保存:', e.message)
    }

    return newSet
  }

  /**
   * 创建标注文档
   */
  private static async createAnnotationDocument(set: LearningSet): Promise<string | null> {
    try {
      // 获取笔记本列表
      const result = await postApi<any>('/api/notebook/lsNotebooks', {})
      let notebooks: any[] = []
      if (Array.isArray(result)) {
        notebooks = result
      } else if (result && Array.isArray(result.notebooks)) {
        notebooks = result.notebooks
      } else if (result && Array.isArray(result.data)) {
        notebooks = result.data
      }

      if (notebooks.length === 0) {
        console.warn('[createAnnotationDocument] 未找到可用笔记本')
        return null
      }

      const notebookId = notebooks[0].id || notebooks[0].box || notebooks[0].uuid
      const docName = `${set.name}-标注`

      // 创建文档
      const createResult = await postApi<any>('/api/filetree/createDocWithMd', {
        notebook: notebookId,
        path: `/${docName}`,
        markdown: `# ${set.name} 标注列表\n\n> 创建时间：${new Date().toLocaleString()}\n\n---\n\n`,
      })

      let docId: string | null = null
      if (createResult) {
        docId = createResult.rootId || createResult.root_id
      }

      return docId
    } catch (e: any) {
      console.error('[createAnnotationDocument] 创建失败:', e)
      return null
    }
  }

  /**
   * 更新学习集
   */
  static updateLearningSet(setId: string, updates: Partial<Omit<LearningSet, 'id' | 'createdAt'>>): LearningSet | null {
    const storage = this.getStorage()
    const index = storage.sets.findIndex((set) => set.id === setId)

    if (index === -1) return null

    storage.sets[index] = {
      ...storage.sets[index],
      ...updates,
      updatedAt: new Date(),
    }

    this.saveStorage(storage)
    return storage.sets[index]
  }

  /**
   * 删除学习集
   */
  static async deleteLearningSet(setId: string): Promise<boolean> {
    const storage = this.getStorage()
    const index = storage.sets.findIndex((set) => set.id === setId)

    if (index === -1) return false

    const set = storage.sets[index]

    // 删除标注文档
    if (set.annotationDocId) {
      try {
        const notebookId = await this.getNotebookId(set.annotationDocId)
        if (notebookId) {
          await postApi('/api/filetree/removeDoc', {
            notebook: notebookId,
            path: `/${set.name}-标注`,
          })
        }
      } catch (e) {
        console.error('[deleteLearningSet] 删除标注文档失败:', e)
      }
    }

    // 从列表中移除
    storage.sets.splice(index, 1)

    if (storage.currentSetId === setId) {
      storage.currentSetId = storage.sets.length > 0 ? storage.sets[0].id : null
    }

    this.saveStorage(storage)
    return true
  }

  /**
   * 获取笔记本 ID
   */
  private static async getNotebookId(docId: string): Promise<string | null> {
    try {
      const blocks = await postApi<{ box: string }[]>('/api/query/sql', {
        stmt: `SELECT box FROM blocks WHERE root_id = '${docId}' LIMIT 1`,
      })
      if (blocks && blocks.length > 0) {
        return blocks[0].box
      }
    } catch (e) {
      console.error('[getNotebookId] 查询失败:', e)
    }
    return null
  }

  /**
   * 向学习集中添加 PDF
   */
  static async addPdfToLearningSet(setId: string, pdfPath: string, pdfName?: string): Promise<LearningSetPdf | null> {
    // 确保数据已加载
    if (!this.cachedStorage || this.cachedStorage.sets.length === 0) {
      this.cachedStorage = await this.getStorageAsync()
    }

    const storage = this.cachedStorage
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) {
      console.error('[addPdfToLearningSet] 找不到学习集:', setId)
      return null
    }

    // 检查是否已存在相同路径的 PDF
    const existing = set.pdfs.find((p) => p.path === pdfPath)
    if (existing) {
      set.currentPdfId = existing.id
      set.updatedAt = new Date()
      this.saveStorage(storage)
      return existing
    }

    // 添加新 PDF
    const pdfId = this.generateId()
    const name = pdfName || pdfPath.split('/').pop() || '未知 PDF'
    const newPdf: LearningSetPdf = {
      id: pdfId,
      path: pdfPath,
      name,
      totalPages: 0,
      currentPage: 1,
      addedAt: Date.now(),
    }

    set.pdfs.push(newPdf)
    set.currentPdfId = pdfId
    set.updatedAt = new Date()

    this.saveStorage(storage)
    return newPdf
  }

  /**
   * 从学习集中移除 PDF
   */
  static removePdfFromLearningSet(setId: string, pdfPath: string): boolean {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return false

    const pdfIndex = set.pdfs.findIndex((p) => p.path === pdfPath)
    if (pdfIndex === -1) return false

    if (set.pdfs.length <= 1) {
      console.warn('[removePdfFromLearningSet] 学习集至少需要一个 PDF')
      return false
    }

    const pdf = set.pdfs[pdfIndex]
    set.pdfs.splice(pdfIndex, 1)

    if (set.currentPdfId === pdf.id) {
      set.currentPdfId = set.pdfs[0]?.id || null
    }

    set.updatedAt = new Date()
    this.saveStorage(storage)
    return true
  }

  /**
   * 切换学习集中的 PDF
   */
  static switchLearningSetPdf(setId: string, pdfId: string): LearningSet | null {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return null

    const pdf = set.pdfs.find((p) => p.id === pdfId)
    if (pdf) {
      set.currentPdfId = pdfId
      set.updatedAt = new Date()
      this.saveStorage(storage)
      return set
    }

    return null
  }

  /**
   * 更新学习集中的 PDF 信息
   */
  static updateLearningSetPdf(
    setId: string,
    pdfId: string,
    updates: Partial<LearningSetPdf>,
  ): LearningSet | null {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return null

    const pdfIndex = set.pdfs.findIndex((p) => p.id === pdfId)
    if (pdfIndex === -1) return null

    set.pdfs[pdfIndex] = {
      ...set.pdfs[pdfIndex],
      ...updates,
    }
    set.updatedAt = new Date()

    this.saveStorage(storage)
    return set
  }

  /**
   * 获取学习集中的当前 PDF
   */
  static getCurrentPdf(set: LearningSet): LearningSetPdf | null {
    if (!set.currentPdfId) return set.pdfs[0] || null
    return set.pdfs.find((p) => p.id === set.currentPdfId) || set.pdfs[0] || null
  }

  /**
   * 保存学习进度
   */
  static saveProgress(setId: string, pdfPath: string, page: number): boolean {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return false

    set.progress = {
      ...set.progress,
      [pdfPath]: page,
    }
    set.updatedAt = new Date()
    this.saveStorage(storage)

    return true
  }

  /**
   * 获取学习进度
   */
  static getProgress(setId: string, pdfPath: string): number {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return 1

    return set.progress[pdfPath] || 1
  }

  /**
   * 添加标注到学习集
   */
  static addAnnotationToLearningSet(setId: string, annotation: PDFAnnotation): boolean {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return false

    // 检查是否已存在相同的标注
    const exists = set.annotations.some((a) => a.id === annotation.id)
    if (!exists) {
      set.annotations.push(annotation)
      set.annotationCount = set.annotations.length
      set.updatedAt = new Date()
      this.saveStorage(storage)
    }

    return true
  }

  /**
   * 从学习集中移除标注
   */
  static removeAnnotationFromLearningSet(setId: string, annotationId: string): boolean {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return false

    set.annotations = set.annotations.filter((a) => a.id !== annotationId)
    set.annotationCount = set.annotations.length
    set.updatedAt = new Date()
    this.saveStorage(storage)

    return true
  }

  /**
   * 获取学习集中的标注
   */
  static getAnnotationsForPdf(setId: string, pdfPath: string): PDFAnnotation[] {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)

    if (!set) return []

    return set.annotations.filter((annotation) => annotation.pdfPath === pdfPath)
  }

  /**
   * 获取特定学习集
   */
  static getLearningSetById(setId: string): LearningSet | null {
    const storage = this.getStorage()
    return storage.sets.find((s) => s.id === setId) || null
  }

  /**
   * 切换当前学习集
   */
  static switchLearningSet(setId: string): LearningSet | null {
    const storage = this.getStorage()
    const set = storage.sets.find((s) => s.id === setId)
    if (set) {
      storage.currentSetId = setId
      this.saveStorage(storage)
      return set
    }
    return null
  }

  /**
   * 保存标注到思源笔记文档
   */
  static async saveAnnotationToLearningSet(
    set: LearningSet,
    annotation: PDFAnnotation,
    targetDocId?: string,
  ): Promise<{ blockId: string | null, error?: string }> {
    // 使用传入的目标文档 ID，或者尝试获取当前文档
    const docId = targetDocId || getCurrentDocId()

    if (!docId) {
      console.warn('[saveAnnotationToLearningSet] 未找到目标文档')
      return {
        blockId: null,
        error: '请先选择一个目标文档，在工具栏中选择要保存到的思源笔记文档',
      }
    }

    // 检查文档是否存在
    const exists = await checkDocExists(docId)
    if (!exists) {
      console.warn('[saveAnnotationToLearningSet] 文档不存在:', docId)
      return {
        blockId: null,
        error: '目标文档不存在或已被删除，请重新选择',
      }
    }

    try {
      // 构建标注的 Markdown
      const markdown = this.buildAnnotationMarkdown(annotation)

      // 追加到文档
      const result = await postApi<any>('/api/block/appendBlock', {
        dataType: 'markdown',
        data: markdown,
        parentID: docId,
      })

      let blockId: string | null = null

      if (result) {
        if (result.doOperations && result.doOperations[0]?.id) {
          blockId = result.doOperations[0].id
        } else if (Array.isArray(result) && result[0]?.doOperations?.[0]?.id) {
          blockId = result[0].doOperations[0].id
        } else if (result.id) {
          blockId = result.id
        }
      }

      if (blockId) {
        // 更新学习集的标注数量
        this.updateLearningSet(set.id, {
          annotationCount: (set.annotationCount || 0) + 1,
        })
      } else {
        console.warn('[saveAnnotationToLearningSet] 未获取到 blockId')
      }

      return { blockId }
    } catch (e: any) {
      console.error('[saveAnnotationToLearningSet] 保存失败:', e)
      return {
        blockId: null,
        error: `保存失败：${e.message || '未知错误'}`,
      }
    }
  }

  /**
   * 构建标注的 Markdown 内容
   */
  private static buildAnnotationMarkdown(annotation: PDFAnnotation): string {
    const rectString = annotation.rect.join(',')
    const fileAnnotationRef = `assets/${annotation.pdfName}?path=${annotation.pdfPath}&page=${annotation.page}&rect=${encodeURIComponent(rectString)}`

    let markdown = ''

    if (annotation.isImage && annotation.imagePath) {
      const imagePath = annotation.imagePath.startsWith('/data/')
        ? annotation.imagePath.slice(6)
        : annotation.imagePath
      const imageMarkdown = `![PDF 截图](${imagePath})`

      switch (annotation.level) {
        case 'title':
          markdown = `\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"`
          break
        case 'h1':
          markdown = `\n# 图片摘录\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"`
          break
        case 'h2':
          markdown = `\n## 图片摘录\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"`
          break
        case 'h3':
          markdown = `\n### 图片 摘录\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-image="true" custom-page="${annotation.page}"`
          break
        default:
          markdown = `\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level || 'text'}" custom-image="true" custom-page="${annotation.page}"`
      }
    } else {
      switch (annotation.level) {
        case 'title':
          markdown = `\n${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        case 'h1':
          markdown = `\n# ${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        case 'h2':
          markdown = `\n## ${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        case 'h3':
          markdown = `\n### ${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        case 'h4':
          markdown = `\n#### ${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        case 'h5':
          markdown = `\n##### ${annotation.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level}" custom-page="${annotation.page}"`
          break
        default:
          markdown = `\n**${annotation.text}**\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${annotation.level || 'text'}" custom-page="${annotation.page}"`
      }
    }

    if (annotation.color) {
      markdown += ` custom-color="${annotation.color}"`
    }

    if (annotation.note) {
      markdown += ` custom-note="${annotation.note}"`
    }

    markdown += `}`

    return markdown
  }

  /**
   * 获取思源工作空间中可用的 PDF 列表
   */
  static async getAvailablePdfs(): Promise<{ path: string, name: string }[]> {
    try {
      // 列出 data/assets 目录
      const list = await readDir('/data/assets')
      // 只保留 .pdf 文件
      const pdfFiles = list
        .filter((f: FileInfo) => !f.isDir && f.name.toLowerCase().endsWith('.pdf'))
        .map((f: FileInfo) => ({
          path: `/data/assets/${f.name}`,
          name: f.name,
        }))
      return pdfFiles
    } catch (e) {
      console.error('[getAvailablePdfs] 读取失败:', e)
      return []
    }
  }
}
