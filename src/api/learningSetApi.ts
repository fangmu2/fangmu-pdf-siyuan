// src/api/learningSetApi.ts
import type {
  LearningSet,
  LearningSetPdf,
} from '../services/learningSetService'

/**
 * 学习集相关的API接口
 */
export class LearningSetApi {
  /**
   * 获取所有学习集
   */
  static async getAllLearningSets(): Promise<LearningSet[]> {
    try {
      // 从本地存储获取学习集
      const stored = localStorage.getItem('fm_learning_sets')
      if (!stored) return []

      const sets: any[] = JSON.parse(stored)
      return sets.map((set) => ({
        ...set,
        createdAt: new Date(set.createdAt),
        updatedAt: new Date(set.updatedAt),
      }))
    } catch (error) {
      console.error('Failed to get learning sets from storage:', error)
      return []
    }
  }

  /**
   * 保存学习集列表
   */
  static async saveLearningSets(sets: LearningSet[]): Promise<boolean> {
    try {
      localStorage.setItem('fm_learning_sets', JSON.stringify(sets))
      return true
    } catch (error) {
      console.error('Failed to save learning sets to storage:', error)
      return false
    }
  }

  /**
   * 创建新的学习集
   */
  static async createLearningSet(name: string, description: string = '', pdfPath?: string, pdfName?: string): Promise<LearningSet | null> {
    try {
      const newSet: LearningSet = {
        id: `ls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      if (pdfPath && pdfName) {
        const pdf: LearningSetPdf = {
          id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path: pdfPath,
          name: pdfName,
          totalPages: 0,
          currentPage: 1,
          addedAt: Date.now(),
        }
        newSet.pdfs.push(pdf)
        newSet.currentPdfId = pdf.id
      }

      const sets = await this.getAllLearningSets()
      sets.push(newSet)
      const success = await this.saveLearningSets(sets)

      return success ? newSet : null
    } catch (error) {
      console.error('Failed to create learning set:', error)
      return null
    }
  }

  /**
   * 更新学习集
   */
  static async updateLearningSet(setId: string, updates: Partial<Omit<LearningSet, 'id' | 'createdAt'>>): Promise<LearningSet | null> {
    try {
      const sets = await this.getAllLearningSets()
      const index = sets.findIndex((set) => set.id === setId)

      if (index === -1) return null

      sets[index] = {
        ...sets[index],
        ...updates,
        updatedAt: new Date(),
      }

      const success = await this.saveLearningSets(sets)
      return success ? sets[index] : null
    } catch (error) {
      console.error('Failed to update learning set:', error)
      return null
    }
  }

  /**
   * 删除学习集
   */
  static async deleteLearningSet(setId: string): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const filteredSets = sets.filter((set) => set.id !== setId)

      if (filteredSets.length === sets.length) return false // 未找到该学习集

      return await this.saveLearningSets(filteredSets)
    } catch (error) {
      console.error('Failed to delete learning set:', error)
      return false
    }
  }

  /**
   * 向学习集中添加 PDF
   */
  static async addPdfToLearningSet(setId: string, pdfPath: string, pdfName?: string): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const setIndex = sets.findIndex((set) => set.id === setId)

      if (setIndex === -1) return false

      // 检查是否已存在相同路径的 PDF
      const existing = sets[setIndex].pdfs.find((p) => p.path === pdfPath)
      if (!existing) {
        const pdf: LearningSetPdf = {
          id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path: pdfPath,
          name: pdfName || pdfPath.split('/').pop() || '未知 PDF',
          totalPages: 0,
          currentPage: 1,
          addedAt: Date.now(),
        }
        sets[setIndex].pdfs.push(pdf)
        sets[setIndex].currentPdfId = pdf.id
        sets[setIndex].updatedAt = new Date()
        return await this.saveLearningSets(sets)
      }

      return true // 已存在，视为成功
    } catch (error) {
      console.error('Failed to add PDF to learning set:', error)
      return false
    }
  }

  /**
   * 从学习集中移除 PDF
   */
  static async removePdfFromLearningSet(setId: string, pdfPath: string): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const setIndex = sets.findIndex((set) => set.id === setId)

      if (setIndex === -1) return false

      const pdfIndex = sets[setIndex].pdfs.findIndex((p) => p.path === pdfPath)
      if (pdfIndex !== -1) {
        sets[setIndex].pdfs.splice(pdfIndex, 1)

        // 如果移除的是当前 PDF，重新设置当前 PDF
        if (sets[setIndex].currentPdfId === sets[setIndex].pdfs[pdfIndex]?.id) {
          sets[setIndex].currentPdfId = sets[setIndex].pdfs[0]?.id || null
        }

        sets[setIndex].updatedAt = new Date()
        return await this.saveLearningSets(sets)
      }

      return true // 未找到，视为成功
    } catch (error) {
      console.error('Failed to remove PDF from learning set:', error)
      return false
    }
  }

  /**
   * 保存学习进度
   */
  static async saveProgress(setId: string, pdfPath: string, page: number): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const setIndex = sets.findIndex((set) => set.id === setId)

      if (setIndex === -1) return false

      sets[setIndex].progress = {
        ...sets[setIndex].progress,
        [pdfPath]: page,
      }
      sets[setIndex].updatedAt = new Date()
      return await this.saveLearningSets(sets)
    } catch (error) {
      console.error('Failed to save progress to learning set:', error)
      return false
    }
  }

  /**
   * 获取学习进度
   */
  static async getProgress(setId: string, pdfPath: string): Promise<number> {
    try {
      const sets = await this.getAllLearningSets()
      const set = sets.find((set) => set.id === setId)

      if (!set) return 1 // 默认第一页

      return set.progress[pdfPath] || 1
    } catch (error) {
      console.error('Failed to get progress from learning set:', error)
      return 1
    }
  }

  /**
   * 添加标注到学习集
   */
  static async addAnnotationToLearningSet(setId: string, annotation: any): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const setIndex = sets.findIndex((set) => set.id === setId)

      if (setIndex === -1) return false

      // 检查是否已存在相同的标注
      const exists = sets[setIndex].annotations.some((a) => a.id === annotation.id)
      if (!exists) {
        sets[setIndex].annotations.push(annotation)
        sets[setIndex].updatedAt = new Date()
        return await this.saveLearningSets(sets)
      }

      return true // 已存在，视为成功
    } catch (error) {
      console.error('Failed to add annotation to learning set:', error)
      return false
    }
  }

  /**
   * 从学习集中移除标注
   */
  static async removeAnnotationFromLearningSet(setId: string, annotationId: string): Promise<boolean> {
    try {
      const sets = await this.getAllLearningSets()
      const setIndex = sets.findIndex((set) => set.id === setId)

      if (setIndex === -1) return false

      sets[setIndex].annotations = sets[setIndex].annotations.filter((a) => a.id !== annotationId)
      sets[setIndex].updatedAt = new Date()
      return await this.saveLearningSets(sets)
    } catch (error) {
      console.error('Failed to remove annotation from learning set:', error)
      return false
    }
  }

  /**
   * 获取学习集中的标注
   */
  static async getAnnotationsForPdf(setId: string, pdfPath: string): Promise<any[]> {
    try {
      const sets = await this.getAllLearningSets()
      const set = sets.find((set) => set.id === setId)

      if (!set) return []

      return set.annotations.filter((annotation) => annotation.pdfName === pdfPath)
    } catch (error) {
      console.error('Failed to get annotations for PDF from learning set:', error)
      return []
    }
  }

  /**
   * 获取特定学习集
   */
  static async getLearningSetById(setId: string): Promise<LearningSet | null> {
    try {
      const sets = await this.getAllLearningSets()
      return sets.find((set) => set.id === setId) || null
    } catch (error) {
      console.error('Failed to get learning set by ID:', error)
      return null
    }
  }
}
