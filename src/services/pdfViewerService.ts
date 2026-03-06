/**
 * PDF 阅读器服务
 * MarginNote 4 风格学习插件 - PDF 阅读增强功能
 */

import {
  calculateReadingProgress,
  DEFAULT_PDF_SETTINGS,
  getDoublePageStartPage,
  getNextZoomLevel,
  PDFAnnotationMark,
  PDFBookmark,
  PDFOutlineItem,
  PDFReadingHistory,
  PDFReadingProgress,
  PDFRotation,
  PDFSearchMatch,
  PDFSearchResult,
  PDFViewerSettings,
  PDFViewMode,
  PDFZoomMode,
  validatePageNumber,
} from '@/types/pdfViewer'

/**
 * PDF 阅读器服务类
 */
class PDFViewerService {
  private settings: PDFViewerSettings = { ...DEFAULT_PDF_SETTINGS }
  private readingProgress: PDFReadingProgress | null = null
  private bookmarks: Map<string, PDFBookmark[]> = new Map()
  private annotations: Map<string, PDFAnnotationMark[]> = new Map()
  private history: PDFReadingHistory[] = []
  private historyIndex = -1

  /**
   * 获取当前设置
   */
  getSettings(): PDFViewerSettings {
    return { ...this.settings }
  }

  /**
   * 更新设置
   */
  updateSettings(updates: Partial<PDFViewerSettings>): PDFViewerSettings {
    this.settings = {
      ...this.settings,
      ...updates,
    }
    return { ...this.settings }
  }

  /**
   * 重置设置为默认值
   */
  resetSettings(): PDFViewerSettings {
    this.settings = { ...DEFAULT_PDF_SETTINGS }
    return { ...this.settings }
  }

  /**
   * 切换阅读模式
   */
  toggleViewMode(): PDFViewMode {
    const modes: PDFViewMode[] = [
      PDFViewMode.SINGLE,
      PDFViewMode.DOUBLE,
      PDFViewMode.CONTINUOUS,
    ]
    const currentIndex = modes.indexOf(this.settings.viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    this.settings.viewMode = modes[nextIndex]
    return modes[nextIndex]
  }

  /**
   * 切换缩放模式
   */
  toggleZoomMode(): PDFZoomMode {
    const modes: PDFZoomMode[] = [
      PDFZoomMode.FIT_WIDTH,
      PDFZoomMode.FIT_PAGE,
      PDFZoomMode.FIT_HEIGHT,
      PDFZoomMode.ACTUAL_SIZE,
      PDFZoomMode.CUSTOM,
    ]
    const currentIndex = modes.indexOf(this.settings.zoomMode)
    const nextIndex = (currentIndex + 1) % modes.length
    this.settings.zoomMode = modes[nextIndex]
    return modes[nextIndex]
  }

  /**
   * 缩放
   */
  zoom(direction: 'in' | 'out'): number {
    if (this.settings.zoomMode !== PDFZoomMode.CUSTOM) {
      this.settings.zoomMode = PDFZoomMode.CUSTOM
    }
    this.settings.zoomLevel = getNextZoomLevel(this.settings.zoomLevel, direction)
    return this.settings.zoomLevel
  }

  /**
   * 设置缩放级别
   */
  setZoomLevel(level: number): number {
    this.settings.zoomMode = PDFZoomMode.CUSTOM
    this.settings.zoomLevel = Math.max(0.25, Math.min(5.0, level))
    return this.settings.zoomLevel
  }

  /**
   * 旋转页面
   */
  rotate(clockwise: boolean = true): PDFRotation {
    const rotations: PDFRotation[] = [
      PDFRotation.ROTATE_0,
      PDFRotation.ROTATE_90,
      PDFRotation.ROTATE_180,
      PDFRotation.ROTATE_270,
    ]
    const currentIndex = rotations.indexOf(this.settings.rotation)
    const nextIndex = clockwise
      ? (currentIndex + 1) % rotations.length
      : (currentIndex - 1 + rotations.length) % rotations.length
    this.settings.rotation = rotations[nextIndex]
    return rotations[nextIndex]
  }

  /**
   * 设置旋转角度
   */
  setRotation(rotation: PDFRotation): void {
    this.settings.rotation = rotation
  }

  /**
   * 切换深色模式
   */
  toggleDarkMode(): boolean {
    this.settings.darkMode = !this.settings.darkMode
    return this.settings.darkMode
  }

  /**
   * 切换反色模式
   */
  toggleInvertColors(): boolean {
    this.settings.invertColors = !this.settings.invertColors
    return this.settings.invertColors
  }

  /**
   * 初始化阅读进度
   */
  initReadingProgress(totalPages: number): PDFReadingProgress {
    this.readingProgress = {
      currentPage: 1,
      totalPages,
      scrollPosition: 0,
      lastViewedPage: 1,
      viewedPages: [1],
      progress: 0,
    }
    return this.readingProgress
  }

  /**
   * 更新当前页
   */
  updateCurrentPage(page: number, totalPages: number): PDFReadingProgress {
    if (!this.readingProgress) {
      return this.initReadingProgress(totalPages)
    }

    const validPage = validatePageNumber(page, totalPages)

    if (!this.readingProgress.viewedPages.includes(validPage)) {
      this.readingProgress.viewedPages.push(validPage)
    }

    this.readingProgress.currentPage = validPage
    this.readingProgress.lastViewedPage = validPage
    this.readingProgress.progress = calculateReadingProgress(
      validPage,
      totalPages,
      this.readingProgress.viewedPages,
    )

    // 添加历史记录
    this.addToHistory({
      timestamp: Date.now(),
      pageNumber: validPage,
      action: 'navigate',
    })

    return this.readingProgress
  }

  /**
   * 更新滚动位置
   */
  updateScrollPosition(position: number): void {
    if (this.readingProgress) {
      this.readingProgress.scrollPosition = position
    }
  }

  /**
   * 获取阅读进度
   */
  getReadingProgress(): PDFReadingProgress | null {
    return this.readingProgress
  }

  /**
   * 获取双页模式显示的页面
   */
  getDoublePages(currentPage: number, totalPages: number): { left: number, right: number | null } {
    const startPage = getDoublePageStartPage(currentPage, this.settings.spreadMode)

    return {
      left: startPage,
      right: startPage + 1 <= totalPages ? startPage + 1 : null,
    }
  }

  /**
   * 添加书签
   */
  addBookmark(pdfId: string, title: string, pageNumber: number, position?: { x: number, y: number }): PDFBookmark {
    const bookmark: PDFBookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      pageNumber,
      position,
      createdAt: Date.now(),
    }

    if (!this.bookmarks.has(pdfId)) {
      this.bookmarks.set(pdfId, [])
    }
    this.bookmarks.get(pdfId)!.push(bookmark)

    // 添加历史记录
    this.addToHistory({
      timestamp: Date.now(),
      pageNumber,
      action: 'bookmark',
      details: { bookmarkId: bookmark.id },
    })

    return bookmark
  }

  /**
   * 删除书签
   */
  removeBookmark(pdfId: string, bookmarkId: string): boolean {
    const bookmarks = this.bookmarks.get(pdfId)
    if (!bookmarks) return false

    const index = bookmarks.findIndex((b) => b.id === bookmarkId)
    if (index === -1) return false

    bookmarks.splice(index, 1)
    return true
  }

  /**
   * 获取书签列表
   */
  getBookmarks(pdfId: string): PDFBookmark[] {
    return this.bookmarks.get(pdfId) || []
  }

  /**
   * 添加注释标记
   */
  addAnnotation(pdfId: string, annotation: Omit<PDFAnnotationMark, 'id' | 'createdAt' | 'updatedAt'>): PDFAnnotationMark {
    const mark: PDFAnnotationMark = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    if (!this.annotations.has(pdfId)) {
      this.annotations.set(pdfId, [])
    }
    this.annotations.get(pdfId)!.push(mark)

    // 添加历史记录
    this.addToHistory({
      timestamp: Date.now(),
      pageNumber: annotation.pageNumber,
      action: 'annotation',
      details: {
        annotationId: mark.id,
        type: mark.type,
      },
    })

    return mark
  }

  /**
   * 更新注释标记
   */
  updateAnnotation(pdfId: string, annotationId: string, updates: Partial<PDFAnnotationMark>): PDFAnnotationMark | null {
    const annotations = this.annotations.get(pdfId)
    if (!annotations) return null

    const annotation = annotations.find((a) => a.id === annotationId)
    if (!annotation) return null

    Object.assign(annotation, updates, { updatedAt: Date.now() })
    return annotation
  }

  /**
   * 删除注释标记
   */
  removeAnnotation(pdfId: string, annotationId: string): boolean {
    const annotations = this.annotations.get(pdfId)
    if (!annotations) return false

    const index = annotations.findIndex((a) => a.id === annotationId)
    if (index === -1) return false

    annotations.splice(index, 1)
    return true
  }

  /**
   * 获取注释标记列表
   */
  getAnnotations(pdfId: string, pageNumber?: number): PDFAnnotationMark[] {
    const annotations = this.annotations.get(pdfId) || []
    if (pageNumber !== undefined) {
      return annotations.filter((a) => a.pageNumber === pageNumber)
    }
    return annotations
  }

  /**
   * 获取所有页面的注释
   */
  getAllAnnotations(pdfId: string): Map<number, PDFAnnotationMark[]> {
    const annotations = this.annotations.get(pdfId) || []
    const byPage = new Map<number, PDFAnnotationMark[]>()

    for (const annotation of annotations) {
      if (!byPage.has(annotation.pageNumber)) {
        byPage.set(annotation.pageNumber, [])
      }
      byPage.get(annotation.pageNumber)!.push(annotation)
    }

    return byPage
  }

  /**
   * 添加历史记录
   */
  private addToHistory(entry: PDFReadingHistory): void {
    // 如果当前不在历史末尾，删除后面的历史
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    this.history.push(entry)
    this.historyIndex = this.history.length - 1

    // 限制历史记录长度
    if (this.history.length > 100) {
      this.history.shift()
      this.historyIndex--
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): PDFReadingHistory[] {
    return this.history
  }

  /**
   * 前进历史
   */
  goForward(): PDFReadingHistory | null {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      return this.history[this.historyIndex]
    }
    return null
  }

  /**
   * 后退历史
   */
  goBack(): PDFReadingHistory | null {
    if (this.historyIndex > 0) {
      this.historyIndex--
      return this.history[this.historyIndex]
    }
    return null
  }

  /**
   * 清除 PDF 数据
   */
  clearPdfData(pdfId: string): void {
    this.bookmarks.delete(pdfId)
    this.annotations.delete(pdfId)
    this.readingProgress = null
    this.history = []
    this.historyIndex = -1
  }

  /**
   * 导出 PDF 数据
   */
  exportPdfData(pdfId: string): object {
    return {
      pdfId,
      settings: this.settings,
      bookmarks: this.bookmarks.get(pdfId) || [],
      annotations: this.annotations.get(pdfId) || [],
      readingProgress: this.readingProgress,
      exportedAt: Date.now(),
    }
  }

  /**
   * 导入 PDF 数据
   */
  importPdfData(data: any): void {
    if (data.pdfId) {
      if (data.bookmarks?.length) {
        this.bookmarks.set(data.pdfId, data.bookmarks)
      }
      if (data.annotations?.length) {
        this.annotations.set(data.pdfId, data.annotations)
      }
      if (data.readingProgress) {
        this.readingProgress = data.readingProgress
      }
    }
  }

  /**
   * 搜索文本（需要在 PDF 渲染后调用）
   */
  async searchText(
    pdfId: string,
    query: string,
    pdfDocument: any,
  ): Promise<PDFSearchResult> {
    if (!query.trim()) {
      return {
        query,
        totalMatches: 0,
        matches: [],
        currentPageIndex: 0,
      }
    }

    const matches: PDFSearchMatch[] = []
    const totalPages = pdfDocument.numPages
    let matchIndex = 0

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      let pageText = ''
      let lastY = -1
      const lines: { text: string, y: number, items: any[] }[] = []

      // 按行组织文本
      for (const item of textContent.items as any[]) {
        if (item.str) {
          if (item.transform[5] !== lastY && lastY !== -1) {
            lines.push({
              text: pageText,
              y: lastY,
              items: [],
            })
            pageText = ''
          }
          pageText += item.str
          lastY = item.transform[5]
        }
      }
      lines.push({
        text: pageText,
        y: lastY,
        items: [],
      })

      // 在每行中搜索
      const lowerQuery = query.toLowerCase()
      for (const line of lines) {
        const lowerText = line.text.toLowerCase()
        let startIndex = 0

        while (true) {
          const index = lowerText.indexOf(lowerQuery, startIndex)
          if (index === -1) break

          matches.push({
            pageNumber: pageNum,
            matchIndex: matchIndex++,
            text: query,
            position: {
              x: 0,
              y: line.y,
              width: 100,
              height: 10,
            },
            context: line.text.substring(
              Math.max(0, index - 50),
              Math.min(line.text.length, index + query.length + 50),
            ),
          })

          startIndex = index + 1
        }
      }
    }

    return {
      query,
      totalMatches: matches.length,
      matches,
      currentPageIndex: 0,
    }
  }

  /**
   * 解析 PDF 目录
   */
  async parseOutline(pdfDocument: any): Promise<PDFOutlineItem[]> {
    try {
      const outline = await pdfDocument.getOutline()
      if (!outline) return []

      return this.parseOutlineItems(outline)
    } catch (error) {
      console.error('Failed to parse outline:', error)
      return []
    }
  }

  /**
   * 递归解析目录项
   */
  private async parseOutlineItems(items: any[], level: number = 0): Promise<PDFOutlineItem[]> {
    const result: PDFOutlineItem[] = []

    for (const item of items) {
      const pageInfo = await item.getDestination()
      let pageNumber = 1

      if (pageInfo) {
        const ref = pageInfo[0]
        pageNumber = await pdfDocument.getPageIndex(ref) + 1
      }

      const outlineItem: PDFOutlineItem = {
        title: item.title,
        pageNumber,
        level,
        expanded: false,
      }

      if (item.items && item.items.length > 0) {
        outlineItem.children = await this.parseOutlineItems(item.items, level + 1)
      }

      result.push(outlineItem)
    }

    return result
  }
}

// 导出单例
export const pdfViewerService = new PDFViewerService()
export default pdfViewerService
