/**
 * 学习集导入导出服务
 * 提供学习集数据的序列化、打包、解析和恢复功能
 */

import { studySetService } from './studySetService';
import { cardService } from './cardService';
import { reviewService } from './reviewService';
import type { StudySet } from '../types/studySet';
import type { Card, FlashCard } from '../types/card';
import type { ReviewRecord } from '../types/review';

/**
 * 学习集导出数据结构
 */
export interface StudySetExportData {
  version: string;           // 导出格式版本
  exportDate: number;        // 导出时间戳
  studySet: StudySet;        // 学习集基本信息
  cards: Card[];             // 所有卡片
  reviewRecords: ReviewRecord[]; // 复习记录
  metadata: ExportMetadata;  // 元数据
}

/**
 * 导出元数据
 */
export interface ExportMetadata {
  pluginVersion: string;     // 插件版本
 思源版本：string;            // 思源笔记版本
  cardCount: number;         // 卡片数量
  flashCardCount: number;    // 闪卡数量
  totalReviews: number;      // 总复习次数
  dateRange: {
    earliest: number;        // 最早卡片日期
    latest: number;          // 最晚卡片日期
  };
}

/**
 * 导出学习集
 * @param studySetId 学习集 ID
 * @returns 导出的数据包
 */
export async function exportStudySet(studySetId: string): Promise<StudySetExportData> {
  try {
    // 获取学习集信息
    const studySet = await studySetService.getStudySet(studySetId);
    if (!studySet) {
      throw new Error('学习集不存在');
    }

    // 获取所有卡片
    const cards = await studySetService.getStudySetCards(studySetId);

    // 获取复习记录
    const reviewRecords: ReviewRecord[] = [];
    for (const card of cards) {
      if (card.type === 'flashcard') {
        const records = await reviewService.getReviewRecordsByCard(card.id);
        reviewRecords.push(...records);
      }
    }

    // 计算元数据
    const metadata: ExportMetadata = {
      pluginVersion: '1.0.0',
      思源版本：'unknown',
      cardCount: cards.length,
      flashCardCount: cards.filter(c => c.type === 'flashcard').length,
      totalReviews: reviewRecords.length,
      dateRange: {
        earliest: Math.min(...cards.map(c => c.createdAt)),
        latest: Math.max(...cards.map(c => c.updatedAt)),
      }
    };

    // 构建导出数据
    const exportData: StudySetExportData = {
      version: '1.0',
      exportDate: Date.now(),
      studySet,
      cards,
      reviewRecords,
      metadata
    };

    return exportData;
  } catch (error) {
    console.error('[exportStudySet] 导出失败:', error);
    throw error;
  }
}

/**
 * 将导出数据转换为 JSON 字符串
 * @param exportData 导出数据
 * @returns JSON 字符串
 */
export function exportDataToJson(exportData: StudySetExportData): string {
  return JSON.stringify(exportData, null, 2);
}

/**
 * 下载导出文件
 * @param exportData 导出数据
 * @param filename 文件名（可选）
 */
export function downloadExportFile(exportData: StudySetExportData, filename?: string): void {
  const json = exportDataToJson(exportData);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${exportData.studySet.name}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 字符串解析导出数据
 * @param jsonString JSON 字符串
 * @returns 导出数据
 */
export function parseExportData(jsonString: string): StudySetExportData {
  try {
    const data = JSON.parse(jsonString);

    // 验证数据格式
    if (!data.version || !data.studySet || !data.cards) {
      throw new Error('无效的导出文件格式');
    }

    // 验证版本兼容性
    const [major] = data.version.split('.');
    if (major !== '1') {
      console.warn(`警告：导出版本 ${data.version} 可能与当前版本不兼容`);
    }

    return data;
  } catch (error) {
    console.error('[parseExportData] 解析失败:', error);
    throw new Error(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从文件读取导出数据
 * @param file 文件对象
 * @returns Promise<StudySetExportData>
 */
export function readExportFile(file: File): Promise<StudySetExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseExportData(content);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
}

/**
 * 导入学习集
 * @param exportData 导出数据
 * @param options 导入选项
 * @returns 新创建的学习集 ID
 */
export async function importStudySet(
  exportData: StudySetExportData,
  options: ImportOptions = {}
): Promise<string> {
  const {
    notebookId,
    renameIfConflict = true,
    importReviews = true,
    overwriteExisting = false
  } = options;

  try {
    // 检查是否已存在同名学习集
    const existingSet = await studySetService.getStudySetByName(exportData.studySet.name);
    if (existingSet && !overwriteExisting) {
      if (renameIfConflict) {
        // 重命名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        exportData.studySet.name = `${exportData.studySet.name} (导入 ${timestamp})`;
      } else {
        throw new Error('已存在同名学习集');
      }
    }

    // 创建学习集
    const newStudySet = await studySetService.createStudySet({
      name: exportData.studySet.name,
      description: exportData.studySet.description,
      notebookId: notebookId || exportData.studySet.notebookId,
      coverImage: exportData.studySet.coverImage,
      documents: exportData.studySet.documents || []
    });

    // 导入卡片
    const cardIdMap = new Map<string, string>(); // 旧 ID -> 新 ID 映射

    for (const card of exportData.cards) {
      try {
        let newCardId: string;

        if (card.type === 'flashcard') {
          const flashCard = card as FlashCard;
          newCardId = await cardService.createFlashCard(
            flashCard.front,
            flashCard.back,
            newStudySet.id,
            card.content,
            card.sourceLocation,
            card.tags
          );
        } else {
          newCardId = await cardService.createCard(
            card.content,
            newStudySet.id,
            card.sourceLocation,
            card.type as any,
            card.tags
          );
        }

        cardIdMap.set(card.id, newCardId);
      } catch (error) {
        console.error(`[importStudySet] 导入卡片失败：${card.id}`, error);
      }
    }

    // 导入复习记录
    if (importReviews) {
      for (const record of exportData.reviewRecords) {
        try {
          const newCardId = cardIdMap.get(record.cardId);
          if (newCardId) {
            await reviewService.saveReviewRecord({
              ...record,
              id: '', // 生成新 ID
              cardId: newCardId
            });
          }
        } catch (error) {
          console.error(`[importStudySet] 导入复习记录失败：${record.id}`, error);
        }
      }
    }

    return newStudySet.id;
  } catch (error) {
    console.error('[importStudySet] 导入失败:', error);
    throw error;
  }
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 目标笔记本 ID */
  notebookId?: string;
  /** 如果名称冲突则重命名 */
  renameIfConflict?: boolean;
  /** 是否导入复习记录 */
  importReviews?: boolean;
  /** 覆盖已存在的学习集 */
  overwriteExisting?: boolean;
}

/**
 * 预览导入数据（不实际导入）
 * @param exportData 导出数据
 * @returns 预览信息
 */
export function previewImport(exportData: StudySetExportData): ImportPreview {
  return {
    studySetName: exportData.studySet.name,
    description: exportData.studySet.description,
    cardCount: exportData.cards.length,
    flashCardCount: exportData.cards.filter(c => c.type === 'flashcard').length,
    reviewCount: exportData.reviewRecords.length,
    exportDate: new Date(exportData.exportDate).toLocaleString(),
    dateRange: {
      earliest: new Date(exportData.metadata.dateRange.earliest).toLocaleDateString(),
      latest: new Date(exportData.metadata.dateRange.latest).toLocaleDateString()
    }
  };
}

/**
 * 导入预览信息
 */
export interface ImportPreview {
  studySetName: string;
  description?: string;
  cardCount: number;
  flashCardCount: number;
  reviewCount: number;
  exportDate: string;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * 批量导出多个学习集
 * @param studySetIds 学习集 ID 列表
 * @returns 打包的导出数据
 */
export async function exportMultipleStudySets(studySetIds: string[]): Promise<Blob> {
  const exports: StudySetExportData[] = [];

  for (const id of studySetIds) {
    try {
      const data = await exportStudySet(id);
      exports.push(data);
    } catch (error) {
      console.error(`[exportMultipleStudySets] 导出学习集 ${id} 失败:`, error);
    }
  }

  const json = JSON.stringify({
    version: '1.0',
    exportDate: Date.now(),
    count: exports.length,
    studySets: exports
  }, null, 2);

  return new Blob([json], { type: 'application/json' });
}

/**
 * 批量导入学习集
 * @param file 包含多个学习集的 JSON 文件
 * @param options 导入选项
 * @returns 导入结果
 */
export async function importMultipleStudySets(
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const content = await file.text();
  const data = JSON.parse(content);

  if (!data.studySets || !Array.isArray(data.studySets)) {
    throw new Error('无效的批量导入文件格式');
  }

  const results: Array<{ name: string; success: boolean; error?: string; id?: string }> = [];

  for (const studySetData of data.studySets) {
    try {
      const id = await importStudySet(studySetData, options);
      results.push({
        name: studySetData.studySet.name,
        success: true,
        id
      });
    } catch (error) {
      results.push({
        name: studySetData.studySet.name,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  return {
    total: data.studySets.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * 导入结果
 */
export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{
    name: string;
    success: boolean;
    error?: string;
    id?: string;
  }>;
}

/**
 * 验证导出文件
 * @param file 导出文件
 * @returns 验证结果
 */
export async function validateExportFile(file: File): Promise<ValidationResult> {
  try {
    const content = await file.text();
    const data = JSON.parse(content);

    // 检查必需字段
    const requiredFields = ['version', 'exportDate'];
    const missingFields = requiredFields.filter(f => !data[f]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `缺少必需字段：${missingFields.join(', ')}`
      };
    }

    // 检查是否是批量导出
    if (data.studySets) {
      return {
        valid: true,
        isBatch: true,
        count: data.studySets.length,
        version: data.version
      };
    }

    // 检查单个导出
    if (!data.studySet || !data.cards) {
      return {
        valid: false,
        error: '缺少学习集或卡片数据'
      };
    }

    return {
      valid: true,
      isBatch: false,
      studySetName: data.studySet.name,
      cardCount: data.cards.length,
      version: data.version
    };
  } catch (error) {
    return {
      valid: false,
      error: `文件解析失败：${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  isBatch?: boolean;
  count?: number;
  studySetName?: string;
  cardCount?: number;
  version?: string;
  error?: string;
}

// 导出服务对象
export const studySetExportService = {
  exportStudySet,
  exportDataToJson,
  downloadExportFile,
  parseExportData,
  readExportFile,
  importStudySet,
  previewImport,
  exportMultipleStudySets,
  importMultipleStudySets,
  validateExportFile
};
