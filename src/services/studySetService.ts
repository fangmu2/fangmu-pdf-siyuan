/**
 * 学习集管理服务
 * MarginNote 4 风格学习插件 - 学习集 CRUD 操作
 */

import type { StudySet } from '../types/studySet';
import type { Card } from '../types/card';
import {
  createStudySetBlock,
  updateStudySetBlock,
  getAllStudySetBlocks,
  getCardsByStudySetId,
} from './dataPersistenceService';
import { cardService } from './cardService';

// 内存缓存
let studySetsCache: StudySet[] = [];
let cacheLoaded = false;

/**
 * 加载学习集缓存
 */
async function loadStudySetsCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    studySetsCache = await getAllStudySetBlocks();

    // 加载每个学习集的卡片
    for (const studySet of studySetsCache) {
      studySet.cards = await getCardsByStudySetId(studySet.id);
    }

    cacheLoaded = true;
  } catch (error) {
    console.error('加载学习集缓存失败:', error);
    studySetsCache = [];
  }
}

/**
 * 学习集管理服务类
 */
class StudySetService {
  /**
   * 创建新学习集
   */
  async createStudySet(
    name: string,
    description: string = '',
    pdfs: Array<{ id: string; name: string }> = []
  ): Promise<StudySet> {
    const now = Date.now();

    const studySet: StudySet = {
      id: `studyset_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      created: now,
      updated: now,
      cards: [],
      pdfs,
    };

    try {
      await createStudySetBlock(studySet);
      studySetsCache.push(studySet);
    } catch (error) {
      console.error('创建学习集失败:', error);
      throw error;
    }

    return studySet;
  }

  /**
   * 获取所有学习集
   */
  async getAllStudySets(): Promise<StudySet[]> {
    await loadStudySetsCache();
    return studySetsCache;
  }

  /**
   * 获取指定学习集
   */
  async getStudySet(id: string): Promise<StudySet | null> {
    await loadStudySetsCache();
    return studySetsCache.find(ss => ss.id === id) || null;
  }

  /**
   * 更新学习集
   */
  async updateStudySet(studySet: StudySet): Promise<void> {
    studySet.updated = Date.now();

    try {
      await updateStudySetBlock(studySet);

      const index = studySetsCache.findIndex(ss => ss.id === studySet.id);
      if (index >= 0) {
        studySetsCache[index] = studySet;
      }
    } catch (error) {
      console.error('更新学习集失败:', error);
      throw error;
    }
  }

  /**
   * 删除学习集
   */
  async deleteStudySet(id: string): Promise<void> {
    // TODO: 实现删除功能
    studySetsCache = studySetsCache.filter(ss => ss.id !== id);
  }

  /**
   * 添加卡片到学习集
   */
  async addCardToStudySet(cardId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId);
    if (!studySet) {
      throw new Error('学习集不存在');
    }

    // 更新卡片的学习集 ID
    const card = await cardService.getCard(cardId);
    if (card) {
      card.studySetId = studySetId;
      await cardService.saveCard(card);

      // 更新缓存
      if (!studySet.cards) {
        studySet.cards = [];
      }
      if (!studySet.cards.find(c => c.id === cardId)) {
        studySet.cards.push(card);
      }
    }
  }

  /**
   * 从学习集移除卡片
   */
  async removeCardFromStudySet(cardId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId);
    if (!studySet) {
      throw new Error('学习集不存在');
    }

    // 更新卡片的学习集 ID 为空
    const card = await cardService.getCard(cardId);
    if (card) {
      card.studySetId = '';
      await cardService.saveCard(card);

      // 更新缓存
      if (studySet.cards) {
        studySet.cards = studySet.cards.filter(c => c.id !== cardId);
      }
    }
  }

  /**
   * 获取学习集的卡片
   */
  async getStudySetCards(studySetId: string): Promise<Card[]> {
    return getCardsByStudySetId(studySetId);
  }

  /**
   * 获取学习集统计
   */
  async getStudySetStats(studySetId: string): Promise<{
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
    dueCards: number;
  }> {
    const cards = await this.getStudySetCards(studySetId);
    const now = Date.now();

    return {
      totalCards: cards.length,
      newCards: cards.filter(c => c.status === 'new').length,
      learningCards: cards.filter(c => c.status === 'learning').length,
      reviewCards: cards.filter(c => c.status === 'review').length,
      masteredCards: cards.filter(c => c.status === 'mastered').length,
      dueCards: cards.filter(c => {
        if (c.type !== 'flashcard') return false;
        return (c as any).srs?.nextReview <= now;
      }).length,
    };
  }

  /**
   * 获取学习集进度
   */
  async getStudySetProgress(studySetId: string): Promise<{
    progressPercentage: number;
    totalCards: number;
    learnedCards: number;
  }> {
    const cards = await this.getStudySetCards(studySetId);
    const learnedCards = cards.filter(c => c.status === 'learning' || c.status === 'review' || c.status === 'mastered').length;
    const totalCards = cards.length;

    return {
      progressPercentage: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
      totalCards,
      learnedCards,
    };
  }

  /**
   * 批量添加卡片到学习集
   */
  async batchAddCardsToStudySet(cardIds: string[], studySetId: string): Promise<void> {
    for (const cardId of cardIds) {
      await this.addCardToStudySet(cardId, studySetId);
    }
  }

  /**
   * 移动卡片到另一个学习集
   */
  async moveCardToStudySet(cardId: string, fromStudySetId: string, toStudySetId: string): Promise<void> {
    await this.removeCardFromStudySet(cardId, fromStudySetId);
    await this.addCardToStudySet(cardId, toStudySetId);
  }

  /**
   * 获取包含指定 PDF 的学习集
   */
  async getStudySetsByPdf(pdfId: string): Promise<StudySet[]> {
    await loadStudySetsCache();
    return studySetsCache.filter(ss => ss.pdfs?.some(p => p.id === pdfId));
  }

  /**
   * 添加 PDF 到学习集
   */
  async addPdfToStudySet(pdfId: string, pdfName: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId);
    if (!studySet) {
      throw new Error('学习集不存在');
    }

    if (!studySet.pdfs) {
      studySet.pdfs = [];
    }

    if (!studySet.pdfs.some(p => p.id === pdfId)) {
      studySet.pdfs.push({ id: pdfId, name: pdfName });
      await this.updateStudySet(studySet);
    }
  }

  /**
   * 从学习集移除 PDF
   */
  async removePdfFromStudySet(pdfId: string, studySetId: string): Promise<void> {
    const studySet = await this.getStudySet(studySetId);
    if (!studySet) {
      throw new Error('学习集不存在');
    }

    if (studySet.pdfs) {
      studySet.pdfs = studySet.pdfs.filter(p => p.id !== pdfId);
      await this.updateStudySet(studySet);
    }
  }
}

// 导出单例
export const studySetService = new StudySetService();
export default studySetService;
