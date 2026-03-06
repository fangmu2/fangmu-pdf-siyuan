/**
 * 双向跳转服务
 * MarginNote 4 风格学习插件 - 卡片、脑图、PDF 之间的双向跳转
 *
 * 功能：
 * 1. 卡片 → PDF 原文精确跳转
 * 2. 卡片 → 脑图节点定位
 * 3. 脑图节点 → 卡片跳转
 * 4. 脑图节点 → PDF 跳转
 */

import type { PDFAnnotation } from '../types/annotation'
import type { Card } from '../types/card'
import type {
  BiDirectionalLink,
  CardHighlightEventDetail,
  JumpEventDetail,
  JumpHistoryItem,
  JumpResult,
  JumpTarget,
  MindMapHighlightEventDetail,
  PdfRect,
} from '../types/jump'
import type {
  MindMap,
  MindMapNode,
} from '../types/mindmap'
import { pdfExcerptService } from './pdfExcerptService'

/** 自定义事件名称 */
export const JUMP_EVENTS = {
  /** PDF 跳转事件 */
  PDF_NAVIGATE: 'pdf-navigate-to',
  /** PDF 高亮事件 */
  PDF_HIGHLIGHT: 'pdf-highlight-rect',
  /** 脑图节点高亮事件 */
  MINDMAP_HIGHLIGHT: 'mindmap-highlight-node',
  /** 脑图节点定位事件 */
  MINDMAP_LOCATE: 'mindmap-locate-node',
  /** 卡片高亮事件 */
  CARD_HIGHLIGHT: 'card-highlight',
  /** 卡片定位事件 */
  CARD_LOCATE: 'card-locate',
} as const

/** 思源 API 响应类型 */
interface SiyuanApiResponse {
  code: number
  msg?: string
  data?: unknown
}

/** 块属性数据 */
interface BlockAttributes {
  id: string
  [key: string]: string
}

/** 链接存储键名 */
const LINK_ATTR = 'bidirectional_links'
const MAX_HISTORY_SIZE = 50

/**
 * 双向跳转服务类
 */
export class BiDirectionalLinkService {
  private static instance: BiDirectionalLinkService

  /** 跳转历史记录 */
  private jumpHistory: JumpHistoryItem[] = []

  /** 事件监听器清理函数 */
  private cleanupFns: (() => void)[] = []

  private constructor() {
    this.initEventListeners()
  }

  static getInstance(): BiDirectionalLinkService {
    if (!BiDirectionalLinkService.instance) {
      BiDirectionalLinkService.instance = new BiDirectionalLinkService()
    }
    return BiDirectionalLinkService.instance
  }

  /**
   * 初始化事件监听器
   */
  private initEventListeners(): void {
    // 监听来自 PDF 查看器的跳转请求
    const handlePdfJumpRequest = (event: CustomEvent<JumpEventDetail>): void => {
      this.addToHistory({
        id: `jump-${Date.now()}`,
        target: {
          type: event.detail.type,
          targetId: event.detail.targetId,
          pdfPath: event.detail.pdfPath,
          page: event.detail.page,
          rect: event.detail.rect,
        },
        timestamp: Date.now(),
        sourceDesc: 'PDF 查看器',
      })
    }

    window.addEventListener(JUMP_EVENTS.PDF_NAVIGATE, handlePdfJumpRequest as EventListener)

    this.cleanupFns.push(() => {
      window.removeEventListener(JUMP_EVENTS.PDF_NAVIGATE, handlePdfJumpRequest as EventListener)
    })
  }

  /**
   * 清理事件监听器
   */
  destroy(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup()
    }
    this.cleanupFns = []
  }

  /**
   * 获取思源 Token
   */
  private getToken(): string {
    const token = localStorage.getItem('siyuan-token')
    if (!token) {
      console.warn('[BiDirectionalLinkService] 未找到思源 Token')
      return ''
    }
    return token
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Token ${this.getToken()}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * 通用 API 请求方法
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: unknown,
  ): Promise<T> {
    const url = `${window.location.origin}${endpoint}`
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    const result: SiyuanApiResponse = await response.json()

    if (result.code !== 0) {
      throw new Error(result.msg || 'API 请求失败')
    }

    return result.data as T
  }

  /**
   * 获取块属性
   */
  private async getBlockAttributes(blockId: string): Promise<BlockAttributes | null> {
    try {
      const data = await this.request<BlockAttributes>('/api/attr/getBlockAttrs', 'POST', {
        id: blockId,
      })
      return data || null
    } catch (error) {
      console.error('[BiDirectionalLinkService] 获取块属性失败:', error)
      return null
    }
  }

  /**
   * 设置块属性
   */
  private async setBlockAttr(blockId: string, key: string, value: string): Promise<void> {
    try {
      await this.request('/api/attr/setBlockAttr', 'POST', {
        id: blockId,
        key,
        val: value,
      })
    } catch (error) {
      console.error('[BiDirectionalLinkService] 设置块属性失败:', error)
      throw error
    }
  }

  // ==================== 卡片 → PDF 跳转 ====================

  /**
   * 从卡片跳转到 PDF 原文位置
   */
  async jumpFromCardToPdf(
    card: Card,
    options: {
      highlight?: boolean
      highlightColor?: string
      highlightDuration?: number
    } = {},
  ): Promise<JumpResult> {
    try {
      // 使用 pdfExcerptService 获取导航目标
      const success = await pdfExcerptService.navigateToCardPdf(card, {
        highlight: options.highlight ?? true,
        highlightColor: options.highlightColor as 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange',
      })

      if (!success) {
        return {
          success: false,
          error: '无法构建 PDF 导航目标，卡片可能不是 PDF 摘录',
        }
      }

      // 记录跳转历史
      const target: JumpTarget = {
        type: 'pdf',
        targetId: card.id,
        pdfPath: card.sourceLocation?.pdfPath,
        page: card.sourceLocation?.page,
        rect: card.sourceLocation?.rect
          ? {
              x1: card.sourceLocation.rect[0],
              y1: card.sourceLocation.rect[1],
              x2: card.sourceLocation.rect[2],
              y2: card.sourceLocation.rect[3],
            }
          : undefined,
        highlight: {
          enabled: options.highlight ?? true,
          color: options.highlightColor,
          duration: options.highlightDuration,
        },
      }

      this.addToHistory({
        id: `jump-${Date.now()}`,
        target,
        timestamp: Date.now(),
        sourceDesc: `卡片: ${card.content?.slice(0, 30)}...`,
      })

      return {
        success: true,
        target,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '跳转失败'
      console.error('[BiDirectionalLinkService] 卡片跳转 PDF 失败:', error)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  /**
   * 从标注跳转到 PDF 原文位置
   */
  async jumpFromAnnotationToPdf(
    annotation: PDFAnnotation,
    options: {
      highlight?: boolean
      highlightColor?: string
      highlightDuration?: number
    } = {},
  ): Promise<JumpResult> {
    try {
      if (!annotation.pdfPath || annotation.page === undefined) {
        return {
          success: false,
          error: '标注缺少 PDF 路径或页码信息',
        }
      }

      const target: JumpTarget = {
        type: 'pdf',
        targetId: annotation.id,
        pdfPath: annotation.pdfPath,
        page: annotation.page,
        rect: annotation.rect
          ? {
              x1: annotation.rect[0],
              y1: annotation.rect[1],
              x2: annotation.rect[2],
              y2: annotation.rect[3],
            }
          : undefined,
        highlight: {
          enabled: options.highlight ?? true,
          color: options.highlightColor,
          duration: options.highlightDuration,
        },
      }

      // 触发 PDF 跳转事件
      const eventDetail: JumpEventDetail = {
        type: 'pdf',
        targetId: annotation.id,
        pdfPath: annotation.pdfPath,
        page: annotation.page,
        rect: target.rect,
        highlightColor: options.highlightColor,
        highlightDuration: options.highlightDuration,
      }

      window.dispatchEvent(new CustomEvent(JUMP_EVENTS.PDF_NAVIGATE, {
        detail: eventDetail,
      }))

      this.addToHistory({
        id: `jump-${Date.now()}`,
        target,
        timestamp: Date.now(),
        sourceDesc: `标注: ${annotation.text?.slice(0, 30)}...`,
      })

      return {
        success: true,
        target,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '跳转失败'
      console.error('[BiDirectionalLinkService] 标注跳转 PDF 失败:', error)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  // ==================== 卡片 → 脑图节点跳转 ====================

  /**
   * 从卡片跳转到脑图节点
   */
  async jumpFromCardToMindmap(
    card: Card,
    mindmapId: string,
    options: {
      highlightDuration?: number
      highlightColor?: string
      scrollIntoView?: boolean
    } = {},
  ): Promise<JumpResult> {
    try {
      // 查找卡片关联的脑图节点
      const nodeId = await this.findMindmapNodeByCardId(mindmapId, card.id)

      if (!nodeId) {
        return {
          success: false,
          error: '未找到卡片关联的脑图节点',
        }
      }

      const target: JumpTarget = {
        type: 'mindmap',
        targetId: nodeId,
        mindmapId,
        highlight: {
          enabled: true,
          color: options.highlightColor,
          duration: options.highlightDuration,
        },
      }

      // 触发脑图节点高亮事件
      const eventDetail: MindMapHighlightEventDetail = {
        mindmapId,
        nodeId,
        duration: options.highlightDuration,
        color: options.highlightColor,
        scrollIntoView: options.scrollIntoView ?? true,
      }

      window.dispatchEvent(new CustomEvent(JUMP_EVENTS.MINDMAP_HIGHLIGHT, {
        detail: eventDetail,
      }))

      this.addToHistory({
        id: `jump-${Date.now()}`,
        target,
        timestamp: Date.now(),
        sourceDesc: `卡片: ${card.content?.slice(0, 30)}...`,
      })

      return {
        success: true,
        target,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '跳转失败'
      console.error('[BiDirectionalLinkService] 卡片跳转脑图失败:', error)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  /**
   * 在脑图中查找卡片关联的节点
   */
  private async findMindmapNodeByCardId(mindmapId: string, cardId: string): Promise<string | null> {
    try {
      // 获取脑图块属性
      const attrs = await this.getBlockAttributes(mindmapId)
      if (!attrs || !attrs.mindmap_data) {
        return null
      }

      // 解析脑图数据
      const mindmap: MindMap = JSON.parse(attrs.mindmap_data)

      // 递归查找节点
      const findNode = (node: MindMapNode, targetCardId: string): MindMapNode | null => {
        if (node.cardId === targetCardId) {
          return node
        }
        for (const child of node.children) {
          const found = findNode(child, targetCardId)
          if (found) return found
        }
        return null
      }

      const node = findNode(mindmap.root, cardId)
      return node?.id || null
    } catch (error) {
      console.error('[BiDirectionalLinkService] 查找脑图节点失败:', error)
      return null
    }
  }

  // ==================== 脑图节点 → 卡片跳转 ====================

  /**
   * 从脑图节点跳转到卡片
   */
  async jumpFromMindmapToCard(
    mindmapId: string,
    nodeId: string,
    options: {
      highlightDuration?: number
      highlightColor?: string
      scrollIntoView?: boolean
    } = {},
  ): Promise<JumpResult> {
    try {
      // 获取脑图数据
      const attrs = await this.getBlockAttributes(mindmapId)
      if (!attrs || !attrs.mindmap_data) {
        return {
          success: false,
          error: '未找到脑图数据',
        }
      }

      const mindmap: MindMap = JSON.parse(attrs.mindmap_data)

      // 查找节点
      const findNode = (node: MindMapNode, targetId: string): MindMapNode | null => {
        if (node.id === targetId) return node
        for (const child of node.children) {
          const found = findNode(child, targetId)
          if (found) return found
        }
        return null
      }

      const node = findNode(mindmap.root, nodeId)

      if (!node || !node.cardId) {
        return {
          success: false,
          error: '节点未关联卡片',
        }
      }

      const target: JumpTarget = {
        type: 'card',
        targetId: node.cardId,
        highlight: {
          enabled: true,
          color: options.highlightColor,
          duration: options.highlightDuration,
        },
      }

      // 触发卡片高亮事件
      const eventDetail: CardHighlightEventDetail = {
        cardId: node.cardId,
        duration: options.highlightDuration,
        color: options.highlightColor,
        scrollIntoView: options.scrollIntoView ?? true,
      }

      window.dispatchEvent(new CustomEvent(JUMP_EVENTS.CARD_HIGHLIGHT, {
        detail: eventDetail,
      }))

      this.addToHistory({
        id: `jump-${Date.now()}`,
        target,
        timestamp: Date.now(),
        sourceDesc: `脑图节点: ${node.text || node.title}...`,
      })

      return {
        success: true,
        target,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '跳转失败'
      console.error('[BiDirectionalLinkService] 脑图跳转卡片失败:', error)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  // ==================== 脑图节点 → PDF 跳转 ====================

  /**
   * 从脑图节点跳转到 PDF
   */
  async jumpFromMindmapToPdf(
    mindmapId: string,
    nodeId: string,
    options: {
      highlight?: boolean
      highlightColor?: string
      highlightDuration?: number
    } = {},
  ): Promise<JumpResult> {
    try {
      // 先获取节点关联的卡片信息
      const attrs = await this.getBlockAttributes(mindmapId)
      if (!attrs || !attrs.mindmap_data) {
        return {
          success: false,
          error: '未找到脑图数据',
        }
      }

      const mindmap: MindMap = JSON.parse(attrs.mindmap_data)

      // 查找节点
      const findNode = (node: MindMapNode, targetId: string): MindMapNode | null => {
        if (node.id === targetId) return node
        for (const child of node.children) {
          const found = findNode(child, targetId)
          if (found) return found
        }
        return null
      }

      const node = findNode(mindmap.root, nodeId)

      if (!node || !node.cardId) {
        return {
          success: false,
          error: '节点未关联卡片',
        }
      }

      // 获取卡片块属性中的 PDF 信息
      const cardAttrs = await this.getBlockAttributes(node.cardId)

      if (!cardAttrs) {
        return {
          success: false,
          error: '无法获取卡片信息',
        }
      }

      const pdfPath = cardAttrs.pdf_path
      const pageStr = cardAttrs.pdf_page
      const coordsStr = cardAttrs.pdf_coords

      if (!pdfPath || !pageStr) {
        return {
          success: false,
          error: '卡片未关联 PDF',
        }
      }

      const page = Number.parseInt(pageStr, 10)
      let rect: PdfRect | undefined

      if (coordsStr) {
        try {
          const coords = JSON.parse(coordsStr)
          if (coords.rect) {
            rect = {
              x1: coords.rect.x1,
              y1: coords.rect.y1,
              x2: coords.rect.x2,
              y2: coords.rect.y2,
            }
          }
        } catch {
          // 忽略解析错误
        }
      }

      const target: JumpTarget = {
        type: 'pdf',
        targetId: node.cardId,
        pdfPath,
        page,
        rect,
        highlight: {
          enabled: options.highlight ?? true,
          color: options.highlightColor,
          duration: options.highlightDuration,
        },
      }

      // 触发 PDF 跳转事件
      const eventDetail: JumpEventDetail = {
        type: 'pdf',
        targetId: node.cardId,
        pdfPath,
        page,
        rect,
        highlightColor: options.highlightColor,
        highlightDuration: options.highlightDuration,
      }

      window.dispatchEvent(new CustomEvent(JUMP_EVENTS.PDF_NAVIGATE, {
        detail: eventDetail,
      }))

      this.addToHistory({
        id: `jump-${Date.now()}`,
        target,
        timestamp: Date.now(),
        sourceDesc: `脑图节点 PDF 跳转`,
      })

      return {
        success: true,
        target,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '跳转失败'
      console.error('[BiDirectionalLinkService] 脑图跳转 PDF 失败:', error)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  // ==================== 链接管理 ====================

  /**
   * 创建双向链接
   */
  async createLink(link: Omit<BiDirectionalLink, 'id' | 'createdAt'>): Promise<BiDirectionalLink> {
    const newLink: BiDirectionalLink = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
    }

    // 获取现有链接
    const existingLinks = await this.getLinks(link.sourceId)
    existingLinks.push(newLink)

    // 保存到块属性
    await this.setBlockAttr(link.sourceId, LINK_ATTR, JSON.stringify(existingLinks))

    return newLink
  }

  /**
   * 获取源的所有链接
   */
  async getLinks(sourceId: string): Promise<BiDirectionalLink[]> {
    try {
      const attrs = await this.getBlockAttributes(sourceId)
      if (!attrs || !attrs[LINK_ATTR]) {
        return []
      }

      return JSON.parse(attrs[LINK_ATTR]) as BiDirectionalLink[]
    } catch (error) {
      console.error('[BiDirectionalLinkService] 获取链接失败:', error)
      return []
    }
  }

  /**
   * 删除链接
   */
  async deleteLink(sourceId: string, linkId: string): Promise<void> {
    const links = await this.getLinks(sourceId)
    const filtered = links.filter((l) => l.id !== linkId)
    await this.setBlockAttr(sourceId, LINK_ATTR, JSON.stringify(filtered))
  }

  // ==================== 历史记录 ====================

  /**
   * 添加到跳转历史
   */
  private addToHistory(item: JumpHistoryItem): void {
    this.jumpHistory.unshift(item)

    // 限制历史记录数量
    if (this.jumpHistory.length > MAX_HISTORY_SIZE) {
      this.jumpHistory = this.jumpHistory.slice(0, MAX_HISTORY_SIZE)
    }
  }

  /**
   * 获取跳转历史
   */
  getJumpHistory(): JumpHistoryItem[] {
    return [...this.jumpHistory]
  }

  /**
   * 清空跳转历史
   */
  clearJumpHistory(): void {
    this.jumpHistory = []
  }

  /**
   * 返回上一次跳转
   */
  goBack(): JumpHistoryItem | null {
    if (this.jumpHistory.length < 2) {
      return null
    }

    // 移除当前跳转，返回上一个
    this.jumpHistory.shift()
    const previousItem = this.jumpHistory[0]

    if (previousItem) {
      // 触发跳转事件
      this.triggerJumpEvent(previousItem.target)
    }

    return previousItem
  }

  /**
   * 触发跳转事件
   */
  private triggerJumpEvent(target: JumpTarget): void {
    const eventDetail: JumpEventDetail = {
      type: target.type,
      targetId: target.targetId,
      pdfPath: target.pdfPath,
      page: target.page,
      rect: target.rect,
      mindmapId: target.mindmapId,
      highlightColor: target.highlight?.color,
      highlightDuration: target.highlight?.duration,
    }

    switch (target.type) {
      case 'pdf':
        window.dispatchEvent(new CustomEvent(JUMP_EVENTS.PDF_NAVIGATE, {
          detail: eventDetail,
        }))
        break
      case 'mindmap':
        if (target.mindmapId) {
          window.dispatchEvent(new CustomEvent(JUMP_EVENTS.MINDMAP_HIGHLIGHT, {
            detail: {
              mindmapId: target.mindmapId,
              nodeId: target.targetId,
              scrollIntoView: true,
            } as MindMapHighlightEventDetail,
          }))
        }
        break
      case 'card':
        window.dispatchEvent(new CustomEvent(JUMP_EVENTS.CARD_HIGHLIGHT, {
          detail: {
            cardId: target.targetId,
            scrollIntoView: true,
          } as CardHighlightEventDetail,
        }))
        break
    }
  }
}

// 导出单例
export const biDirectionalLinkService = BiDirectionalLinkService.getInstance()

// 导出便捷函数
export const jumpFromCardToPdf = (card: Card, options?: Parameters<BiDirectionalLinkService['jumpFromCardToPdf']>[1]) =>
  biDirectionalLinkService.jumpFromCardToPdf(card, options)

export const jumpFromCardToMindmap = (card: Card, mindmapId: string, options?: Parameters<BiDirectionalLinkService['jumpFromCardToMindmap']>[2]) =>
  biDirectionalLinkService.jumpFromCardToMindmap(card, mindmapId, options)

export const jumpFromMindmapToCard = (mindmapId: string, nodeId: string, options?: Parameters<BiDirectionalLinkService['jumpFromMindmapToCard']>[2]) =>
  biDirectionalLinkService.jumpFromMindmapToCard(mindmapId, nodeId, options)

export const jumpFromMindmapToPdf = (mindmapId: string, nodeId: string, options?: Parameters<BiDirectionalLinkService['jumpFromMindmapToPdf']>[2]) =>
  biDirectionalLinkService.jumpFromMindmapToPdf(mindmapId, nodeId, options)
