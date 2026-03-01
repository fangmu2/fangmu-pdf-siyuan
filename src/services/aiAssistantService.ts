/**
 * AI 辅助功能服务（第十六阶段 - AI 辅助功能）
 * 提供 AI 自动摘要、标签、问题生成等功能
 */

import { api } from '../api';

/**
 * AI 摘要配置
 */
export interface AISummaryConfig {
  maxLength: number;        // 最大长度
  language: 'zh' | 'en';    // 语言
  style: 'concise' | 'detailed' | 'bullet'; // 摘要风格
}

/**
 * AI 标签配置
 */
export interface AITagConfig {
  maxTags: number;          // 最大标签数
  minConfidence: number;    // 最小置信度
  categories?: string[];    // 标签分类
}

/**
 * AI 问题生成配置
 */
export interface AIQuestionConfig {
  questionCount: number;    // 问题数量
  questionTypes: ('choice' | 'fill' | 'short' | 'long')[]; // 问题类型
  difficulty: 'easy' | 'medium' | 'hard'; // 难度
}

/**
 * AI 学习建议
 */
export interface AIStudySuggestion {
  id: string;
  type: 'review' | 'focus' | 'method' | 'schedule';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedCards?: string[];
}

/**
 * AI 知识图谱节点
 */
export interface AIKnowledgeNode {
  id: string;
  name: string;
  type: 'concept' | 'topic' | 'category';
  connections: string[];
  weight: number;
}

/**
 * AI 服务类
 */
class AIAssistantServiceClass {
  private defaultSummaryConfig: AISummaryConfig = {
    maxLength: 200,
    language: 'zh',
    style: 'concise'
  };

  private defaultTagConfig: AITagConfig = {
    maxTags: 10,
    minConfidence: 0.6
  };

  private defaultQuestionConfig: AIQuestionConfig = {
    questionCount: 5,
    questionTypes: ['choice', 'short'],
    difficulty: 'medium'
  };

  /**
   * 生成文本摘要
   * @param text 原始文本
   * @param config 配置选项
   */
  async generateSummary(text: string, config: Partial<AISummaryConfig> = {}): Promise<string> {
    const finalConfig = { ...this.defaultSummaryConfig, ...config };

    // 本地摘要生成（基于文本提取）
    try {
      const summary = await this.extractiveSummary(text, finalConfig.maxLength);
      return summary;
    } catch (error) {
      console.error('生成摘要失败:', error);
      return text.substring(0, finalConfig.maxLength) + '...';
    }
  }

  /**
   * 自动提取标签
   * @param text 文本内容
   * @param config 配置选项
   */
  async extractTags(text: string, config: Partial<AITagConfig> = {}): Promise<string[]> {
    const finalConfig = { ...this.defaultTagConfig, ...config };

    try {
      // 关键词提取
      const keywords = this.extractKeywords(text, finalConfig.maxTags);
      return keywords;
    } catch (error) {
      console.error('提取标签失败:', error);
      return [];
    }
  }

  /**
   * 生成复习问题
   * @param content 卡片内容
   * @param config 配置选项
   */
  async generateQuestions(
    content: string,
    config: Partial<AIQuestionConfig> = {}
  ): Promise<{ question: string; answer: string; type: string }[]> {
    const finalConfig = { ...this.defaultQuestionConfig, ...config };

    try {
      // 基于内容生成问题
      const questions = await this.createQuestions(content, finalConfig);
      return questions;
    } catch (error) {
      console.error('生成问题失败:', error);
      return [];
    }
  }

  /**
   * 生成学习建议
   * @param studySetId 学习集 ID
   * @param reviewHistory 复习历史
   */
  async generateStudySuggestions(
    studySetId: string,
    reviewHistory: { cardId: string; correct: boolean; timestamp: number }[]
  ): Promise<AIStudySuggestion[]> {
    const suggestions: AIStudySuggestion[] = [];

    try {
      // 分析复习数据
      const analysis = this.analyzeReviewHistory(reviewHistory);

      // 生成建议
      if (analysis.lowAccuracyCards.length > 0) {
        suggestions.push({
          id: this.generateId(),
          type: 'focus',
          title: '需要重点复习',
          description: `有 ${analysis.lowAccuracyCards.length} 张卡片正确率较低，建议重点复习`,
          priority: 'high',
          relatedCards: analysis.lowAccuracyCards.slice(0, 5)
        });
      }

      if (analysis.totalCards > 0 && analysis.avgAccuracy < 0.7) {
        suggestions.push({
          id: this.generateId(),
          type: 'method',
          title: '调整学习方法',
          description: '整体正确率较低，建议放慢学习速度，增加理解时间',
          priority: 'medium'
        });
      }

      if (analysis.daysSinceLastReview > 7) {
        suggestions.push({
          id: this.generateId(),
          type: 'review',
          title: '该复习了',
          description: '已经超过一周没有复习，建议今天进行复习',
          priority: 'high'
        });
      }

      // 学习节奏建议
      if (analysis.dailyCount < 10) {
        suggestions.push({
          id: this.generateId(),
          type: 'schedule',
          title: '增加学习量',
          description: '当前每日学习量较少，建议适当增加',
          priority: 'low'
        });
      }

    } catch (error) {
      console.error('生成建议失败:', error);
    }

    return suggestions;
  }

  /**
   * 生成知识图谱
   * @param cards 卡片列表
   */
  async generateKnowledgeGraph(
    cards: { id: string; content: string; tags?: string[] }[]
  ): Promise<AIKnowledgeNode[]> {
    const nodes: AIKnowledgeNode[] = [];

    try {
      // 提取概念
      const concepts = this.extractConcepts(cards);

      // 创建节点
      concepts.forEach((concept, index) => {
        nodes.push({
          id: this.generateId(),
          name: concept,
          type: 'concept',
          connections: this.findRelatedConcepts(concept, concepts, 3),
          weight: this.calculateConceptWeight(concept, cards)
        });
      });

    } catch (error) {
      console.error('生成知识图谱失败:', error);
    }

    return nodes;
  }

  /**
   * 翻译文本
   * @param text 原文
   * @param targetLang 目标语言
   */
  async translate(text: string, targetLang: 'en' | 'zh' | 'ja' | 'ko'): Promise<string> {
    try {
      // 简单的翻译模拟（实际可接入翻译 API）
      return `[翻译到${targetLang}]: ${text}`;
    } catch (error) {
      console.error('翻译失败:', error);
      return text;
    }
  }

  /**
   * 文本转语音
   * @param text 文本内容
   * @param lang 语言
   */
  async textToSpeech(text: string, lang: string = 'zh-CN'): Promise<string | null> {
    try {
      // 使用浏览器 Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        speechSynthesis.speak(utterance);
        return null; // 直接播放，不返回音频
      }
      return null;
    } catch (error) {
      console.error('TTS 失败:', error);
      return null;
    }
  }

  // ==================== 内部方法 ====================

  /**
   * 提取式摘要生成
   */
  private async extractiveSummary(text: string, maxLength: number): Promise<string> {
    // 分句
    const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);

    if (sentences.length === 0) return text.substring(0, maxLength);

    // 计算句子重要性（基于位置和关键词）
    const scored = sentences.map((sentence, index) => {
      const positionScore = 1 / (index + 1); // 位置越前越重要
      const lengthScore = Math.min(1, sentence.length / 50); // 适中长度
      const keywordScore = this.countKeywords(sentence) / 10;

      return {
        sentence,
        score: positionScore * 0.5 + lengthScore * 0.3 + keywordScore * 0.2
      };
    });

    // 排序并选取前几句
    scored.sort((a, b) => b.score - a.score);

    let summary = '';
    for (const item of scored) {
      if ((summary + item.sentence).length < maxLength) {
        summary += item.sentence + '。';
      } else {
        break;
      }
    }

    return summary || sentences[0];
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string, maxCount: number): string[] {
    // 中文分词简化版（按字符和常用词）
    const words = text.split(/[\s,，.。、]/).filter(w => w.length >= 2);

    // 词频统计
    const freq: Record<string, number> = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });

    // 排序并返回
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([word]) => word);
  }

  /**
   * 创建问题
   */
  private async createQuestions(
    content: string,
    config: AIQuestionConfig
  ): Promise<{ question: string; answer: string; type: string }[]> {
    const questions: { question: string; answer: string; type: string }[] = [];

    // 基于内容生成不同类型的问题
    const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 20);

    for (let i = 0; i < Math.min(config.questionCount, sentences.length); i++) {
      const sentence = sentences[i];
      const type = config.questionTypes[i % config.questionTypes.length];

      if (type === 'choice') {
        questions.push({
          question: `以下关于"${sentence.substring(0, 30)}..."的描述正确的是？`,
          answer: sentence,
          type: 'choice'
        });
      } else if (type === 'fill') {
        // 挖空关键词
        const keywords = this.extractKeywords(sentence, 1);
        const blanked = keywords.length > 0
          ? sentence.replace(keywords[0], '______')
          : sentence;
        questions.push({
          question: `填空：${blanked}`,
          answer: keywords[0] || sentence,
          type: 'fill'
        });
      } else {
        questions.push({
          question: `请解释：${sentence.substring(0, 50)}...`,
          answer: sentence,
          type: 'short'
        });
      }
    }

    return questions;
  }

  /**
   * 分析复习历史
   */
  private analyzeReviewHistory(history: { cardId: string; correct: boolean; timestamp: number }[]) {
    const cardStats: Record<string, { correct: number; total: number }> = {};
    let totalCorrect = 0;
    let total = 0;
    let lastTimestamp = 0;

    history.forEach(record => {
      if (!cardStats[record.cardId]) {
        cardStats[record.cardId] = { correct: 0, total: 0 };
      }
      cardStats[record.cardId].total++;
      total++;

      if (record.correct) {
        cardStats[record.cardId].correct++;
        totalCorrect++;
      }

      lastTimestamp = Math.max(lastTimestamp, record.timestamp);
    });

    const lowAccuracyCards = Object.entries(cardStats)
      .filter(([_, stats]) => stats.correct / stats.total < 0.6)
      .map(([id]) => id);

    return {
      totalCards: Object.keys(cardStats).length,
      avgAccuracy: total > 0 ? totalCorrect / total : 0,
      lowAccuracyCards,
      daysSinceLastReview: lastTimestamp
        ? Math.floor((Date.now() - lastTimestamp) / 86400000)
        : 999,
      dailyCount: history.length / Math.max(1, Math.ceil(history.length / 20))
    };
  }

  /**
   * 提取概念
   */
  private extractConcepts(cards: { id: string; content: string; tags?: string[] }[]): string[] {
    const conceptSet = new Set<string>();

    // 从标签提取
    cards.forEach(card => {
      card.tags?.forEach(tag => conceptSet.add(tag));
    });

    // 从内容提取关键词
    cards.forEach(card => {
      const keywords = this.extractKeywords(card.content, 5);
      keywords.forEach(kw => conceptSet.add(kw));
    });

    return Array.from(conceptSet);
  }

  /**
   * 查找相关概念
   */
  private findRelatedConcepts(concept: string, allConcepts: string[], maxCount: number): string[] {
    // 简单的相似度计算（基于字符重叠）
    const scored = allConcepts
      .filter(c => c !== concept)
      .map(c => ({
        concept: c,
        score: this.calculateSimilarity(concept, c)
      }))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, maxCount).map(s => s.concept);
  }

  /**
   * 计算概念权重
   */
  private calculateConceptWeight(concept: string, cards: { id: string; content: string; tags?: string[] }[]): number {
    let count = 0;
    cards.forEach(card => {
      if (card.content.includes(concept) || card.tags?.includes(concept)) {
        count++;
      }
    });
    return count / cards.length;
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  /**
   * 统计关键词
   */
  private countKeywords(text: string): number {
    const commonWords = ['的', '了', '是', '在', '和', '与', '及', '等', '这', '那'];
    return text.split('').filter(c => !commonWords.includes(c)).length;
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const aiAssistantService = new AIAssistantServiceClass();
