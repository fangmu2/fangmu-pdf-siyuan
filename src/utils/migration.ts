/**
 * 数据迁移工具
 * MarginNote 4 风格学习插件 - 现有标注数据迁移到新卡片系统
 */

import type { PDFAnnotation } from '../types/annotaion';
import type { StudySet, ReviewSettings } from '../types/studySet';
import { cardService } from '../services/cardService';
import * as api from '../api';

/**
 * 迁移结果
 */
export interface MigrationResult {
  /** 成功迁移的卡片数量 */
  successCount: number;
  /** 失败的卡片数量 */
  failCount: number;
  /** 错误信息列表 */
  errors: { id: string; message: string }[];
  /** 创建的默认学习集 ID */
  defaultStudySetId?: string;
}

/**
 * 数据迁移管理类
 */
class MigrationManager {
  /**
   * 迁移现有标注到卡片系统
   *
   * @param annotations - 现有标注列表
   * @param studySetId - 目标学习集 ID（可选，不提供则创建默认学习集）
   * @returns 迁移结果
   */
  async migrateAnnotationsToCards(
    annotations: PDFAnnotation[],
    studySetId?: string
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      successCount: 0,
      failCount: 0,
      errors: [],
    };

    // 如果没有指定学习集，创建默认学习集
    let targetStudySetId = studySetId;
    if (!targetStudySetId) {
      try {
        const defaultStudySet = await this.createDefaultStudySet();
        targetStudySetId = defaultStudySet.id;
        result.defaultStudySetId = defaultStudySet.id;
      } catch (error) {
        result.errors.push({
          id: 'studyset',
          message: `创建默认学习集失败：${error}`,
        });
        return result;
      }
    }

    // 逐个迁移标注
    for (const annotation of annotations) {
      try {
        // 创建卡片
        const card = await cardService.createFromAnnotation(annotation, targetStudySetId);

        // 将标签从 level 映射
        card.tags = this.mapLevelToTags(annotation.level);

        // 更新卡片
        await cardService.saveCard(card);

        result.successCount++;
      } catch (error: any) {
        result.failCount++;
        result.errors.push({
          id: annotation.id,
          message: `迁移失败：${error?.message || String(error)}`,
        });
      }
    }

    return result;
  }

  /**
   * 创建默认学习集
   *
   * @returns 创建的学习集
   */
  private async createDefaultStudySet(): Promise<StudySet> {
    const now = Date.now();

    // 创建学习集对象
    const defaultReviewSettings: ReviewSettings = {
      dailyNewCards: 20,
      algorithm: 'SM2',
      dailyReviewLimit: 200,
      newCardsBeforeReview: false,
    };

    const studySet: StudySet = {
      id: `studyset_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: '默认学习集',
      description: '自动创建的默认学习集，用于存放迁移的标注数据',
      notebookId: await this.getDefaultNotebookId(),
      cardIds: [],
      pdfPaths: [],
      reviewSettings: defaultReviewSettings,
      createdAt: now,
      updatedAt: now,
    };

    // 调用思源 API 创建文档
    try {
      const docResult = await api.createDocWithMd(
        studySet.notebookId,
        `marginnote_learning/${studySet.name}`,
        `# ${studySet.name}\n\n${studySet.description}`
      );

      // 设置块属性
      await api.setBlockAttrs(docResult, {
        'custom-id': studySet.id,
        'custom-type': 'study_set',
        'custom-name': studySet.name,
        'custom-description': studySet.description,
        'custom-created': studySet.createdAt.toString(),
        'custom-updated': studySet.updatedAt.toString(),
      });

      return studySet;
    } catch (error: any) {
      throw new Error(`创建学习集文档失败：${error?.message || String(error)}`);
    }
  }

  /**
   * 将标注级别映射为标签
   *
   * @param level - 标注级别
   * @returns 标签列表
   */
  private mapLevelToTags(level: string): string[] {
    const levelTagMap: Record<string, string> = {
      'title': '标题',
      'heading': '小标题',
      'paragraph': '段落',
      'sentence': '句子',
      'text': '文本',
    };

    const tag = levelTagMap[level];
    return tag ? [tag] : [];
  }

  /**
   * 批量迁移卡片到指定学习集
   *
   * @param cardIds - 卡片 ID 列表
   * @param targetStudySetId - 目标学习集 ID
   * @returns 迁移结果
   */
  async migrateCardsToStudySet(
    cardIds: string[],
    targetStudySetId: string
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      successCount: 0,
      failCount: 0,
      errors: [],
    };

    for (const cardId of cardIds) {
      try {
        const card = await cardService.getCard(cardId);
        if (card) {
          card.studySetId = targetStudySetId;
          card.updatedAt = Date.now();
          await cardService.saveCard(card);
          result.successCount++;
        } else {
          result.failCount++;
          result.errors.push({
            id: cardId,
            message: '卡片不存在',
          });
        }
      } catch (error: any) {
        result.failCount++;
        result.errors.push({
          id: cardId,
          message: `迁移失败：${error?.message || String(error)}`,
        });
      }
    }

    return result;
  }

  /**
   * 升级现有标注数据结构
   *
   * @param annotations - 标注列表
   * @returns 升级后的标注列表
   */
  upgradeAnnotationStructure(annotations: PDFAnnotation[]): PDFAnnotation[] {
    return annotations.map(annotation => ({
      ...annotation,
      // 确保所有必填字段存在
      note: annotation.note || '',
      color: annotation.color,
      level: annotation.level || 'text',
      sortOrder: annotation.sortOrder || 0,
    }));
  }

  /**
   * 检查是否需要迁移
   *
   * @param annotations - 标注列表
   * @returns 是否需要迁移
   */
  needsMigration(annotations: PDFAnnotation[]): boolean {
    // 检查是否有标注没有关联学习集
    return annotations.some(a => !this.hasStudySetAssociation(a));
  }

  /**
   * 检查标注是否有关联学习集
   *
   * @param annotation - 标注
   * @returns 是否有关联
   */
  private hasStudySetAssociation(annotation: PDFAnnotation): boolean {
    // TODO: 检查标注是否有关联的学习集
    return false;
  }

  /**
   * 获取迁移统计信息
   *
   * @param annotations - 标注列表
   * @returns 统计信息
   */
  getMigrationStats(annotations: PDFAnnotation[]): {
    total: number;
    migrated: number;
    pending: number;
    byLevel: Record<string, number>;
  } {
    const stats = {
      total: annotations.length,
      migrated: 0,
      pending: 0,
      byLevel: {} as Record<string, number>,
    };

    for (const annotation of annotations) {
      // 统计级别分布
      stats.byLevel[annotation.level] = (stats.byLevel[annotation.level] || 0) + 1;

      // 统计迁移状态
      if (this.hasStudySetAssociation(annotation)) {
        stats.migrated++;
      } else {
        stats.pending++;
      }
    }

    return stats;
  }

  /**
   * 回滚迁移
   *
   * @param cardIds - 要回滚的卡片 ID 列表
   * @returns 回滚结果
   */
  async rollbackMigration(cardIds: string[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const cardId of cardIds) {
      try {
        // 删除迁移的卡片
        await cardService.deleteCard(cardId);
      } catch (error: any) {
        errors.push(`回滚卡片 ${cardId} 失败：${error?.message || String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取默认笔记本 ID
   *
   * @returns 默认笔记本 ID
   */
  private async getDefaultNotebookId(): Promise<string> {
    try {
      // 尝试获取第一个笔记本
      const notebooks = await api.lsNotebooks();
      return notebooks.items?.[0]?.id || '';
    } catch (error) {
      console.error('获取笔记本列表失败:', error);
      return '';
    }
  }
}

/**
 * 导出迁移管理器单例
 */
export const migrationManager = new MigrationManager();
export default migrationManager;
