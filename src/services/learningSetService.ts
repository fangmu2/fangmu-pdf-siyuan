// src/services/learningSetService.ts
import type { PDFAnnotation } from '../types/annotaion';

/**
 * 学习集接口定义
 */
export interface LearningSet {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  pdfPaths: string[]; // 关联的PDF路径列表
  annotations: PDFAnnotation[]; // 学习集中的标注
  progress: Record<string, number>; // 学习进度，key为PDF路径，value为页码
}

/**
 * 学习集服务类
 * 提供学习集的创建、管理、进度保存等功能
 */
export class LearningSetService {
  private static readonly STORAGE_KEY = 'fm_learning_sets';

  /**
   * 获取所有学习集
   */
  static getAllLearningSets(): LearningSet[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const sets: any[] = JSON.parse(stored);
      return sets.map(set => ({
        ...set,
        createdAt: new Date(set.createdAt),
        updatedAt: new Date(set.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to parse learning sets from storage:', error);
      return [];
    }
  }

  /**
   * 保存学习集列表
   */
  static saveLearningSets(sets: LearningSet[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sets));
    } catch (error) {
      console.error('Failed to save learning sets to storage:', error);
    }
  }

  /**
   * 创建新的学习集
   */
  static createLearningSet(name: string, description: string = ''): LearningSet {
    const newSet: LearningSet = {
      id: `ls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      pdfPaths: [],
      annotations: [],
      progress: {}
    };

    const sets = this.getAllLearningSets();
    sets.push(newSet);
    this.saveLearningSets(sets);

    return newSet;
  }

  /**
   * 更新学习集
   */
  static updateLearningSet(setId: string, updates: Partial<Omit<LearningSet, 'id' | 'createdAt'>>): LearningSet | null {
    const sets = this.getAllLearningSets();
    const index = sets.findIndex(set => set.id === setId);

    if (index === -1) return null;

    sets[index] = {
      ...sets[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveLearningSets(sets);
    return sets[index];
  }

  /**
   * 删除学习集
   */
  static deleteLearningSet(setId: string): boolean {
    const sets = this.getAllLearningSets();
    const filteredSets = sets.filter(set => set.id !== setId);

    if (filteredSets.length === sets.length) return false; // 未找到该学习集

    this.saveLearningSets(filteredSets);
    return true;
  }

  /**
   * 向学习集中添加PDF
   */
  static addPdfToLearningSet(setId: string, pdfPath: string): boolean {
    const sets = this.getAllLearningSets();
    const setIndex = sets.findIndex(set => set.id === setId);

    if (setIndex === -1) return false;

    if (!sets[setIndex].pdfPaths.includes(pdfPath)) {
      sets[setIndex].pdfPaths.push(pdfPath);
      sets[setIndex].updatedAt = new Date();
      this.saveLearningSets(sets);
    }

    return true;
  }

  /**
   * 从学习集中移除PDF
   */
  static removePdfFromLearningSet(setId: string, pdfPath: string): boolean {
    const sets = this.getAllLearningSets();
    const setIndex = sets.findIndex(set => set.id === setId);

    if (setIndex === -1) return false;

    sets[setIndex].pdfPaths = sets[setIndex].pdfPaths.filter(path => path !== pdfPath);
    sets[setIndex].updatedAt = new Date();
    this.saveLearningSets(sets);

    return true;
  }

  /**
   * 保存学习进度
   */
  static saveProgress(setId: string, pdfPath: string, page: number): boolean {
    const sets = this.getAllLearningSets();
    const setIndex = sets.findIndex(set => set.id === setId);

    if (setIndex === -1) return false;

    sets[setIndex].progress = {
      ...sets[setIndex].progress,
      [pdfPath]: page
    };
    sets[setIndex].updatedAt = new Date();
    this.saveLearningSets(sets);

    return true;
  }

  /**
   * 获取学习进度
   */
  static getProgress(setId: string, pdfPath: string): number {
    const sets = this.getAllLearningSets();
    const set = sets.find(set => set.id === setId);

    if (!set) return 1; // 默认第一页

    return set.progress[pdfPath] || 1;
  }

  /**
   * 添加标注到学习集
   */
  static addAnnotationToLearningSet(setId: string, annotation: PDFAnnotation): boolean {
    const sets = this.getAllLearningSets();
    const setIndex = sets.findIndex(set => set.id === setId);

    if (setIndex === -1) return false;

    // 检查是否已存在相同的标注
    const exists = sets[setIndex].annotations.some(a => a.id === annotation.id);
    if (!exists) {
      sets[setIndex].annotations.push(annotation);
      sets[setIndex].updatedAt = new Date();
      this.saveLearningSets(sets);
    }

    return true;
  }

  /**
   * 从学习集中移除标注
   */
  static removeAnnotationFromLearningSet(setId: string, annotationId: string): boolean {
    const sets = this.getAllLearningSets();
    const setIndex = sets.findIndex(set => set.id === setId);

    if (setIndex === -1) return false;

    sets[setIndex].annotations = sets[setIndex].annotations.filter(a => a.id !== annotationId);
    sets[setIndex].updatedAt = new Date();
    this.saveLearningSets(sets);

    return true;
  }

  /**
   * 获取学习集中的标注
   */
  static getAnnotationsForPdf(setId: string, pdfPath: string): PDFAnnotation[] {
    const sets = this.getAllLearningSets();
    const set = sets.find(set => set.id === setId);

    if (!set) return [];

    return set.annotations.filter(annotation => annotation.pdfName === pdfPath);
  }

  /**
   * 获取特定学习集
   */
  static getLearningSetById(setId: string): LearningSet | null {
    const sets = this.getAllLearningSets();
    return sets.find(set => set.id === setId) || null;
  }
}
