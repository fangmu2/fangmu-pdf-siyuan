/**
 * 数据迁移工具
 * MarginNote 4 风格学习插件 - 现有标注迁移到卡片系统
 */

import type { PDFAnnotation } from '../types/annotation';
import type { Card, FlashCard, CardSourceLocation, SRSParams } from '../types/card';
import type { StudySet } from '../types/studySet';

/**
 * 迁移函数：将现有标注转换为卡片
 * @param annotation 现有标注数据
 * @param studySetId 目标学习集 ID
 * @returns 转换后的卡片数据
 */
export function migrateAnnotationToCard(
  annotation: PDFAnnotation,
  studySetId: string
): Card {
  // 构建卡片来源位置（兼容现有标注字段）
  const sourceLocation: CardSourceLocation = {
    docId: '', // 需要后续补充
    blockId: annotation.id,
    pdfPath: annotation.pdfPath,
    page: annotation.page,
    rect: annotation.rect
  };

  // 创建基础卡片
  const card: Card = {
    id: annotation.id, // 保持 ID 一致，实现向后兼容
    type: annotation.isImage ? 'excerpt' : 'card',
    content: annotation.text || annotation.imagePath || '',
    sourceLocation,
    studySetId,
    tags: [], // 可从 level 映射
    status: 'new',
    difficulty: 3, // 默认难度
    createdAt: annotation.created,
    updatedAt: annotation.updated
  };

  // 根据标注级别映射标签
  if (annotation.level) {
    const levelTagMap: Record<string, string> = {
      'title': '标题',
      'h1': '一级标题',
      'h2': '二级标题',
      'h3': '三级标题',
      'h4': '四级标题',
      'h5': '五级标题',
      'text': '正文'
    };
    card.tags.push(levelTagMap[annotation.level] || '正文');
  }

  // 根据标注颜色映射标签
  if (annotation.color) {
    card.tags.push(`颜色:${annotation.color}`);
  }

  // 如果有笔记，添加到内容中
  if (annotation.note) {
    card.content = `${card.content}\n\n> ${annotation.note}`;
  }

  return card;
}

/**
 * 迁移函数：将现有标注转换为闪卡
 * @param annotation 现有标注数据
 * @param studySetId 目标学习集 ID
 * @param front 闪卡正面内容（可选，默认使用标注文本）
 * @param back 闪卡反面内容（可选，默认使用笔记内容）
 * @returns 转换后的闪卡数据
 */
export function migrateAnnotationToFlashCard(
  annotation: PDFAnnotation,
  studySetId: string,
  front?: string,
  back?: string
): FlashCard {
  // 使用基础迁移函数
  const baseCard = migrateAnnotationToCard(annotation, studySetId);

  // 创建闪卡
  const flashCard: FlashCard = {
    ...baseCard,
    type: 'flashcard',
    front: front || annotation.text || '请编辑此卡片正面',
    back: back || annotation.note || '请编辑此卡片反面',
    srs: createDefaultSRSParams()
  };

  return flashCard;
}

/**
 * 创建默认 SRS 参数
 * @returns 默认 SRS 参数
 */
export function createDefaultSRSParams(): SRSParams {
  return {
    easeFactor: 2.5, // 初始难度因子
    interval: 0, // 初始间隔
    repetitions: 0, // 初始重复次数
    nextReview: 0 // 待安排复习
  };
}

/**
 * 批量迁移标注到卡片
 * @param annotations 标注数组
 * @param studySetId 目标学习集 ID
 * @returns 转换后的卡片数组
 */
export function batchMigrateAnnotationsToCards(
  annotations: PDFAnnotation[],
  studySetId: string
): Card[] {
  return annotations.map(ann => migrateAnnotationToCard(ann, studySetId));
}

/**
 * 检查标注是否已迁移
 * @param annotation 标注数据
 * @param cardIds 已存在的卡片 ID 列表
 * @returns 是否已迁移
 */
export function isAnnotationMigrated(
  annotation: PDFAnnotation,
  cardIds: string[]
): boolean {
  // 由于迁移后 ID 保持一致，只需检查 ID 是否存在
  return cardIds.includes(annotation.id);
}

/**
 * 获取需要迁移的标注列表
 * @param annotations 所有标注
 * @param cardIds 已存在的卡片 ID 列表
 * @returns 需要迁移的标注列表
 */
export function getAnnotationsToMigrate(
  annotations: PDFAnnotation[],
  cardIds: string[]
): PDFAnnotation[] {
  return annotations.filter(ann => !isAnnotationMigrated(ann, cardIds));
}

/**
 * 迁移统计信息
 */
export interface MigrationStats {
  /** 总标注数 */
  totalAnnotations: number;
  /** 已迁移数 */
  migratedCount: number;
  /** 待迁移数 */
  pendingCount: number;
  /** 文字标注数 */
  textAnnotations: number;
  /** 图片标注数 */
  imageAnnotations: number;
  /** 按级别统计 */
  byLevel: Record<string, number>;
  /** 按颜色统计 */
  byColor: Record<string, number>;
}

/**
 * 计算迁移统计
 * @param annotations 所有标注
 * @param cardIds 已存在的卡片 ID 列表
 * @returns 迁移统计信息
 */
export function calculateMigrationStats(
  annotations: PDFAnnotation[],
  cardIds: string[]
): MigrationStats {
  const toMigrate = getAnnotationsToMigrate(annotations, cardIds);

  const stats: MigrationStats = {
    totalAnnotations: annotations.length,
    migratedCount: annotations.length - toMigrate.length,
    pendingCount: toMigrate.length,
    textAnnotations: toMigrate.filter(a => !a.isImage).length,
    imageAnnotations: toMigrate.filter(a => a.isImage).length,
    byLevel: {},
    byColor: {}
  };

  // 按级别统计
  for (const ann of toMigrate) {
    const level = ann.level || 'text';
    stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
  }

  // 按颜色统计
  for (const ann of toMigrate) {
    const color = ann.color || 'yellow';
    stats.byColor[color] = (stats.byColor[color] || 0) + 1;
  }

  return stats;
}

/**
 * 迁移进度
 */
export interface MigrationProgress {
  /** 当前进度 (0-100) */
  progress: number;
  /** 当前处理的标注索引 */
  currentIndex: number;
  /** 总标注数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  errorCount: number;
  /** 错误信息列表 */
  errors: Array<{ annotationId: string; error: string }>;
}

/**
 * 异步批量迁移（带进度回调）
 * @param annotations 标注数组
 * @param studySetId 目标学习集 ID
 * @param onProgress 进度回调
 * @returns 迁移结果
 */
export async function asyncBatchMigrate(
  annotations: PDFAnnotation[],
  studySetId: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ cards: Card[]; progress: MigrationProgress }> {
  const progress: MigrationProgress = {
    progress: 0,
    currentIndex: 0,
    total: annotations.length,
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  const cards: Card[] = [];

  for (let i = 0; i < annotations.length; i++) {
    progress.currentIndex = i;

    try {
      const card = migrateAnnotationToCard(annotations[i], studySetId);
      cards.push(card);
      progress.successCount++;
    } catch (error) {
      progress.errorCount++;
      progress.errors.push({
        annotationId: annotations[i].id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 更新进度
    progress.progress = Math.round(((i + 1) / annotations.length) * 100);

    // 回调进度
    if (onProgress) {
      onProgress(progress);
    }

    // 每处理 10 个标注，让出主线程，避免阻塞 UI
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return { cards, progress };
}

/**
 * 将卡片内容同步回标注（双向同步）
 * @param card 卡片数据
 * @param annotation 原有标注数据
 * @returns 更新后的标注数据
 */
export function syncCardToAnnotation(
  card: Card,
  annotation: PDFAnnotation
): PDFAnnotation {
  // 如果卡片内容发生变化，更新标注的笔记
  if (card.type === 'card' || card.type === 'excerpt') {
    // 提取笔记内容（假设笔记在内容的 "> " 之后）
    const lines = card.content.split('\n\n');
    const noteLine = lines.find(line => line.startsWith('> '));
    if (noteLine) {
      annotation.note = noteLine.substring(2);
    }
  }

  annotation.updated = card.updatedAt;

  return annotation;
}

/**
 * 默认学习集创建（用于迁移）
 * @param pdfPath PDF 路径
 * @param notebookId 笔记本 ID
 * @returns 默认学习集
 */
export function createDefaultStudySet(
  pdfPath: string,
  notebookId: string
): StudySet {
  const pdfName = pdfPath.split('/').pop()?.replace('.pdf', '') || '未命名';

  return {
    id: `default_${Date.now()}`,
    name: `${pdfName} - 学习笔记`,
    description: `自动创建的学习集，用于管理《${pdfName}》的标注和卡片`,
    notebookId,
    pdfPaths: [pdfPath],
    cardIds: [],
    reviewSettings: {
      dailyNewCards: 20,
      algorithm: 'SM2'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * 迁移配置
 */
export interface MigrationConfig {
  /** 是否创建默认学习集 */
  createDefaultStudySet: boolean;
  /** 是否自动映射标签 */
  autoMapTags: boolean;
  /** 是否保留原有标注 */
  keepOriginalAnnotations: boolean;
  /** 是否生成闪卡 */
  generateFlashCards: boolean;
  /** 闪卡生成规则 */
  flashCardRules: {
    /** 标题级别自动生成闪卡 */
    forHeadings: boolean;
    /** 有笔记的自动生成闪卡 */
    withNotes: boolean;
  };
}

/**
 * 默认迁移配置
 */
export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  createDefaultStudySet: true,
  autoMapTags: true,
  keepOriginalAnnotations: true,
  generateFlashCards: false,
  flashCardRules: {
    forHeadings: false,
    withNotes: true
  }
};
