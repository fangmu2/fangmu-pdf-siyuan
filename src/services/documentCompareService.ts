/**
 * 文档对比服务（第十八阶段 - 文档对比与多文档）
 * 支持双文档并排阅读、跨文档标注复制、文档关联
 */

import { api } from '../api'

/**
 * 文档关联关系
 */
export interface DocumentRelation {
  id: string
  sourceDocId: string
  targetDocId: string
  relationType: 'reference' | 'related' | 'duplicate' | 'supplement'
  note?: string
  createdAt: number
  createdBy: string
}

/**
 * 跨文档标注
 */
export interface CrossDocAnnotation {
  id: string
  sourceDocId: string
  sourceAnnotationId: string
  targetDocId: string
  targetBlockId?: string
  copiedAt: number
  synced: boolean
}

/**
 * 双文档视图配置
 */
export interface DualViewConfig {
  enabled: boolean
  leftDocId: string | null
  rightDocId: string | null
  syncScroll: boolean
  linkMode: boolean // 链接模式：点击标注跳转到另一文档
}

/**
 * 文档窗口状态
 */
export interface DocumentWindowState {
  docId: string
  scrollPosition: number
  zoom: number
  currentPage: number
  selectedText?: string
  annotations: string[] // 选中的标注 ID
}

/**
 * 文档对比服务类
 */
class DocumentCompareServiceClass {
  private storageKey = 'documentCompare_'
  private relationsPath = '/data/documentRelations/'
  private crossDocAnnotationsPath = '/data/crossDocAnnotations/'

  /**
   * 获取双文档视图配置
   */
  async getDualViewConfig(): Promise<DualViewConfig> {
    try {
      const config = await api.storage.get(`${this.storageKey}dualView`)
      return config
        ? JSON.parse(config)
        : {
            enabled: false,
            leftDocId: null,
            rightDocId: null,
            syncScroll: false,
            linkMode: false,
          }
    } catch {
      return {
        enabled: false,
        leftDocId: null,
        rightDocId: null,
        syncScroll: false,
        linkMode: false,
      }
    }
  }

  /**
   * 保存双文档视图配置
   */
  async saveDualViewConfig(config: DualViewConfig): Promise<void> {
    await api.storage.put(`${this.storageKey}dualView`, JSON.stringify(config))
  }

  /**
   * 设置左侧文档
   */
  async setLeftDocument(docId: string): Promise<void> {
    const config = await this.getDualViewConfig()
    config.leftDocId = docId
    config.enabled = !!(config.leftDocId || config.rightDocId)
    await this.saveDualViewConfig(config)
  }

  /**
   * 设置右侧文档
   */
  async setRightDocument(docId: string): Promise<void> {
    const config = await this.getDualViewConfig()
    config.rightDocId = docId
    config.enabled = !!(config.leftDocId || config.rightDocId)
    await this.saveDualViewConfig(config)
  }

  /**
   * 关闭双文档模式
   */
  async closeDualView(): Promise<void> {
    await this.saveDualViewConfig({
      enabled: false,
      leftDocId: null,
      rightDocId: null,
      syncScroll: false,
      linkMode: false,
    })
  }

  /**
   * 切换同步滚动
   */
  async toggleSyncScroll(): Promise<boolean> {
    const config = await this.getDualViewConfig()
    config.syncScroll = !config.syncScroll
    await this.saveDualViewConfig(config)
    return config.syncScroll
  }

  /**
   * 切换链接模式
   */
  async toggleLinkMode(): Promise<boolean> {
    const config = await this.getDualViewConfig()
    config.linkMode = !config.linkMode
    await this.saveDualViewConfig(config)
    return config.linkMode
  }

  /**
   * 创建文档关联
   */
  async createRelation(
    sourceDocId: string,
    targetDocId: string,
    relationType: DocumentRelation['relationType'],
    note?: string,
  ): Promise<DocumentRelation> {
    const relation: DocumentRelation = {
      id: this.generateId(),
      sourceDocId,
      targetDocId,
      relationType,
      note,
      createdAt: Date.now(),
      createdBy: 'user',
    }

    // 保存关联
    const key = `${this.relationsPath}${relation.id}`
    await api.storage.put(key, JSON.stringify(relation))

    return relation
  }

  /**
   * 获取文档的所有关联
   */
  async getDocumentRelations(docId: string): Promise<DocumentRelation[]> {
    const relations: DocumentRelation[] = []

    try {
      // 获取作为源文档的关联
      const asSource = await this.getRelationsByField('sourceDocId', docId)
      relations.push(...asSource)

      // 获取作为目标文档的关联
      const asTarget = await this.getRelationsByField('targetDocId', docId)
      relations.push(...asTarget)

      return relations
    } catch (error) {
      console.error('获取文档关联失败:', error)
      return []
    }
  }

  /**
   * 删除文档关联
   */
  async deleteRelation(relationId: string): Promise<void> {
    await api.storage.remove(`${this.relationsPath}${relationId}`)
  }

  /**
   * 复制标注到另一文档
   */
  async copyAnnotationToDocument(
    sourceDocId: string,
    sourceAnnotationId: string,
    targetDocId: string,
    targetBlockId?: string,
  ): Promise<CrossDocAnnotation> {
    const crossDoc: CrossDocAnnotation = {
      id: this.generateId(),
      sourceDocId,
      sourceAnnotationId,
      targetDocId,
      targetBlockId,
      copiedAt: Date.now(),
      synced: true,
    }

    // 保存跨文档标注引用
    const key = `${this.crossDocAnnotationsPath}${crossDoc.id}`
    await api.storage.put(key, JSON.stringify(crossDoc))

    // TODO: 在目标文档创建实际标注
    // 这里需要调用标注服务在目标文档创建新标注

    return crossDoc
  }

  /**
   * 获取文档的跨文档标注
   */
  async getCrossDocAnnotations(docId: string): Promise<CrossDocAnnotation[]> {
    const annotations: CrossDocAnnotation[] = []

    try {
      // 获取作为源文档的跨文档标注
      const asSource = await this.getCrossDocByField('sourceDocId', docId)
      annotations.push(...asSource)

      // 获取作为目标文档的跨文档标注
      const asTarget = await this.getCrossDocByField('targetDocId', docId)
      annotations.push(...asTarget)

      return annotations
    } catch (error) {
      console.error('获取跨文档标注失败:', error)
      return []
    }
  }

  /**
   * 同步跨文档标注
   */
  async syncCrossDocAnnotation(crossDocId: string): Promise<boolean> {
    try {
      const key = `${this.crossDocAnnotationsPath}${crossDocId}`
      const data = await api.storage.get(key)
      if (!data) return false

      const crossDoc: CrossDocAnnotation = JSON.parse(data)
      crossDoc.synced = true

      await api.storage.put(key, JSON.stringify(crossDoc))
      return true
    } catch (error) {
      console.error('同步跨文档标注失败:', error)
      return false
    }
  }

  /**
   * 保存文档窗口状态
   */
  async saveWindowState(docId: string, state: DocumentWindowState): Promise<void> {
    await api.storage.put(`${this.storageKey}window_${docId}`, JSON.stringify(state))
  }

  /**
   * 获取文档窗口状态
   */
  async getWindowState(docId: string): Promise<DocumentWindowState | null> {
    try {
      const data = await api.storage.get(`${this.storageKey}window_${docId}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * 同步双文档滚动位置
   */
  syncScrollPositions(leftState: DocumentWindowState, rightState: DocumentWindowState): void {
    if (!leftState || !rightState) return

    // 计算滚动比例
    const leftRatio = leftState.scrollPosition / (leftState.currentPage * 100 || 1)
    const rightTarget = rightState.currentPage * 100 * leftRatio

    // 触发滚动事件（需要组件监听）
    window.dispatchEvent(new CustomEvent('sync-scroll', {
      detail: {
        targetDocId: rightState.docId,
        position: rightTarget,
      },
    }))
  }

  // ==================== 内部方法 ====================

  private async getRelationsByField(field: string, value: string): Promise<DocumentRelation[]> {
    const relations: DocumentRelation[] = []
    // 思源 API 限制：无法直接按字段查询，需要遍历
    // 实际实现时可能需要维护索引
    return relations
  }

  private async getCrossDocByField(field: string, value: string): Promise<CrossDocAnnotation[]> {
    const annotations: CrossDocAnnotation[] = []
    return annotations
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const documentCompareService = new DocumentCompareServiceClass()
