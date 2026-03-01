// src/services/pdfAnnotationService.ts
/**
 * PDF 标注批注服务
 * 支持为 PDF 标注添加文字批注、回复等功能
 */

import {
  type AnnotationComment,
  type TextAnnotationComment,
  type VoiceAnnotationComment,
  type ImageAnnotationComment,
  type CreateCommentParams,
  type UpdateCommentParams,
  type CommentFilter,
  type CommentStats,
  type CommentThread,
  type ReplyToCommentParams,
  type CommentExportOptions,
  type TextCommentContent,
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
} from '../types/pdfAnnotation';

import { getSiyuanApi, postSiyuanApi } from '../api/siyuanApi';

/** 批注存储属性名 */
const COMMENT_ATTR_NAME = 'custom-pdf-comments';

/** 生成唯一 ID */
const generateId = (): string => {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * PDF 标注批注服务
 */
export const pdfAnnotationService = {
  /**
   * 获取标注的所有批注
   * @param annotationId 标注 ID
   */
  async getComments(annotationId: string): Promise<AnnotationComment[]> {
    try {
      const result = await getSiyuanApi<{ [key: string]: unknown }>(
        `/api/attr/getBlockAttrs`,
        { id: annotationId }
      );

      const commentsJson = result.data?.[COMMENT_ATTR_NAME] as string | undefined;
      if (!commentsJson) {
        return [];
      }

      const comments = JSON.parse(commentsJson) as AnnotationComment[];
      return comments.filter(c => c.annotationId === annotationId);
    } catch (error) {
      console.error('获取批注失败:', error);
      return [];
    }
  },

  /**
   * 获取单个批注
   * @param commentId 批注 ID
   */
  async getComment(commentId: string): Promise<AnnotationComment | null> {
    try {
      // 先搜索批注所在的标注
      const sqlResult = await postSiyuanApi<{ blocks: Array<{ id: string }> }>(
        `/api/query/sql`,
        { stmt: `SELECT id FROM blocks WHERE type = 'annotation' LIMIT 1000` }
      );

      const blocks = sqlResult.blocks || [];

      for (const block of blocks) {
        const comments = await this.getComments(block.id);
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          return comment;
        }
      }

      return null;
    } catch (error) {
      console.error('获取批注失败:', error);
      return null;
    }
  },

  /**
   * 创建批注
   * @param params 创建参数
   */
  async createComment(params: CreateCommentParams): Promise<AnnotationComment> {
    const now = Date.now();

    const baseComment = {
      id: generateId(),
      annotationId: params.annotationId,
      type: params.type,
      createdAt: now,
      updatedAt: now,
      author: params.author,
      priority: params.priority ?? DEFAULT_PRIORITY,
      status: DEFAULT_STATUS,
      tags: params.tags ?? [],
    };

    let comment: AnnotationComment;

    switch (params.type) {
      case 'text':
        comment = {
          ...baseComment,
          type: 'text',
          content: params.content as TextCommentContent,
        } as TextAnnotationComment;
        break;
      case 'voice':
        comment = {
          ...baseComment,
          type: 'voice',
          content: params.content,
        } as VoiceAnnotationComment;
        break;
      case 'image':
        comment = {
          ...baseComment,
          type: 'image',
          content: params.content,
        } as ImageAnnotationComment;
        break;
      default:
        throw new Error(`不支持的批注类型: ${params.type}`);
    }

    // 获取现有批注并添加新批注
    const existingComments = await this.getComments(params.annotationId);
    existingComments.push(comment);

    // 保存到块属性
    await this.saveComments(params.annotationId, existingComments);

    return comment;
  },

  /**
   * 更新批注
   * @param commentId 批注 ID
   * @param params 更新参数
   */
  async updateComment(
    commentId: string,
    params: UpdateCommentParams
  ): Promise<AnnotationComment | null> {
    try {
      // 查找批注所在的标注
      const sqlResult = await postSiyuanApi<{ blocks: Array<{ id: string }> }>(
        `/api/query/sql`,
        { stmt: `SELECT id FROM blocks WHERE type = 'annotation' LIMIT 1000` }
      );

      const blocks = sqlResult.blocks || [];

      for (const block of blocks) {
        const comments = await this.getComments(block.id);
        const index = comments.findIndex(c => c.id === commentId);

        if (index !== -1) {
          const existing = comments[index];

          // 更新批注
          const updated: AnnotationComment = {
            ...existing,
            updatedAt: Date.now(),
            ...(params.content && { content: params.content }),
            ...(params.priority && { priority: params.priority }),
            ...(params.status && { status: params.status }),
            ...(params.tags && { tags: params.tags }),
          };

          comments[index] = updated;
          await this.saveComments(block.id, comments);

          return updated;
        }
      }

      return null;
    } catch (error) {
      console.error('更新批注失败:', error);
      return null;
    }
  },

  /**
   * 删除批注
   * @param commentId 批注 ID
   */
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      // 查找批注所在的标注
      const sqlResult = await postSiyuanApi<{ blocks: Array<{ id: string }> }>(
        `/api/query/sql`,
        { stmt: `SELECT id FROM blocks WHERE type = 'annotation' LIMIT 1000` }
      );

      const blocks = sqlResult.blocks || [];

      for (const block of blocks) {
        const comments = await this.getComments(block.id);
        const index = comments.findIndex(c => c.id === commentId);

        if (index !== -1) {
          comments.splice(index, 1);
          await this.saveComments(block.id, comments);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('删除批注失败:', error);
      return false;
    }
  },

  /**
   * 批量删除批注
   * @param commentIds 批注 ID 列表
   */
  async deleteComments(commentIds: string[]): Promise<number> {
    let deletedCount = 0;

    for (const commentId of commentIds) {
      const success = await this.deleteComment(commentId);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  },

  /**
   * 保存批注到块属性
   * @param annotationId 标注 ID
   * @param comments 批注列表
   */
  async saveComments(
    annotationId: string,
    comments: AnnotationComment[]
  ): Promise<void> {
    await postSiyuanApi(`/api/attr/setBlockAttrs`, {
      id: annotationId,
      attrs: {
        [COMMENT_ATTR_NAME]: JSON.stringify(comments),
      },
    });
  },

  /**
   * 筛选批注
   * @param filter 筛选条件
   */
  async filterComments(filter: CommentFilter): Promise<AnnotationComment[]> {
    try {
      let allComments: AnnotationComment[] = [];

      if (filter.annotationId) {
        // 如果指定了标注 ID，直接获取该标注的批注
        allComments = await this.getComments(filter.annotationId);
      } else {
        // 否则获取所有标注的批注
        const sqlResult = await postSiyuanApi<{ blocks: Array<{ id: string }> }>(
          `/api/query/sql`,
          { stmt: `SELECT id FROM blocks WHERE type = 'annotation' LIMIT 1000` }
        );

        const blocks = sqlResult.blocks || [];

        for (const block of blocks) {
          const comments = await this.getComments(block.id);
          allComments.push(...comments);
        }
      }

      // 应用筛选条件
      return allComments.filter(comment => {
        if (filter.type && comment.type !== filter.type) return false;
        if (filter.status && comment.status !== filter.status) return false;
        if (filter.priority && comment.priority !== filter.priority) return false;
        if (filter.tags && filter.tags.length > 0) {
          const commentTags = comment.tags || [];
          if (!filter.tags.some(t => commentTags.includes(t))) return false;
        }
        if (filter.keyword) {
          const keyword = filter.keyword.toLowerCase();
          if (comment.type === 'text') {
            const textComment = comment as TextAnnotationComment;
            if (!textComment.content.text.toLowerCase().includes(keyword)) {
              return false;
            }
          }
        }
        return true;
      });
    } catch (error) {
      console.error('筛选批注失败:', error);
      return [];
    }
  },

  /**
   * 获取批注统计
   * @param annotationId 标注 ID（可选，不传则统计所有）
   */
  async getCommentStats(annotationId?: string): Promise<CommentStats> {
    const comments = annotationId
      ? await this.getComments(annotationId)
      : await this.filterComments({});

    const stats: CommentStats = {
      total: comments.length,
      byType: { text: 0, voice: 0, image: 0 },
      byStatus: { active: 0, resolved: 0, archived: 0 },
      byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
    };

    for (const comment of comments) {
      stats.byType[comment.type]++;
      stats.byStatus[comment.status]++;
      stats.byPriority[comment.priority]++;
    }

    return stats;
  },

  /**
   * 回复批注
   * @param params 回复参数
   */
  async replyToComment(params: ReplyToCommentParams): Promise<AnnotationComment | null> {
    // 查找父批注
    const parentComment = await this.getComment(params.parentCommentId);
    if (!parentComment) {
      console.error('找不到父批注');
      return null;
    }

    // 创建回复批注
    const reply = await this.createComment({
      annotationId: parentComment.annotationId,
      type: 'text',
      content: params.content,
      author: params.author,
    });

    return reply;
  },

  /**
   * 获取批注线程（包含回复）
   * @param commentId 主批注 ID
   */
  async getCommentThread(commentId: string): Promise<CommentThread | null> {
    const mainComment = await this.getComment(commentId);
    if (!mainComment) {
      return null;
    }

    // 获取同一标注下的所有批注
    const allComments = await this.getComments(mainComment.annotationId);

    // 这里简化处理：将同一标注下时间晚于主批注的作为潜在回复
    // 实际应用中可能需要额外的父子关系字段
    const replies = allComments.filter(
      c => c.createdAt > mainComment.createdAt && c.id !== commentId
    );

    return {
      mainComment,
      replies,
      replyCount: replies.length,
    };
  },

  /**
   * 更新批注状态
   * @param commentId 批注 ID
   * @param status 新状态
   */
  async updateStatus(
    commentId: string,
    status: CommentStatus
  ): Promise<AnnotationComment | null> {
    return this.updateComment(commentId, { status });
  },

  /**
   * 解决批注
   * @param commentId 批注 ID
   */
  async resolveComment(commentId: string): Promise<AnnotationComment | null> {
    return this.updateStatus(commentId, 'resolved');
  },

  /**
   * 重新打开批注
   * @param commentId 批注 ID
   */
  async reopenComment(commentId: string): Promise<AnnotationComment | null> {
    return this.updateStatus(commentId, 'active');
  },

  /**
   * 导出批注
   * @param options 导出选项
   */
  async exportComments(options: CommentExportOptions): Promise<string> {
    const comments = await this.filterComments(options.filter || {});

    switch (options.format) {
      case 'json':
        return JSON.stringify(comments, null, 2);

      case 'markdown':
        return this.exportAsMarkdown(comments, options);

      case 'csv':
        return this.exportAsCsv(comments, options);

      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  },

  /**
   * 导出为 Markdown
   */
  exportAsMarkdown(
    comments: AnnotationComment[],
    options: CommentExportOptions
  ): string {
    const lines: string[] = ['# PDF 标注批注导出\n'];

    for (const comment of comments) {
      const date = new Date(comment.createdAt).toLocaleString();
      lines.push(`## 批注 - ${date}\n`);

      if (options.includeMetadata) {
        lines.push(`- **类型**: ${comment.type}`);
        lines.push(`- **状态**: ${comment.status}`);
        lines.push(`- **优先级**: ${comment.priority}`);
        if (comment.author) {
          lines.push(`- **作者**: ${comment.author}`);
        }
        if (comment.tags && comment.tags.length > 0) {
          lines.push(`- **标签**: ${comment.tags.join(', ')}`);
        }
        lines.push('');
      }

      if (comment.type === 'text') {
        const textComment = comment as TextAnnotationComment;
        const format = textComment.content.format || 'plain';
        if (format === 'markdown') {
          lines.push(textComment.content.text);
        } else {
          lines.push(textComment.content.text);
        }
      } else if (comment.type === 'voice') {
        const voiceComment = comment as VoiceAnnotationComment;
        lines.push(`🎤 语音批注 (${voiceComment.content.duration}秒)`);
        if (voiceComment.content.transcript) {
          lines.push(`\n转录文本: ${voiceComment.content.transcript}`);
        }
      } else if (comment.type === 'image') {
        const imageComment = comment as ImageAnnotationComment;
        lines.push(`![批注图片](${imageComment.content.imageUrl})`);
        if (imageComment.content.caption) {
          lines.push(`\n*${imageComment.content.caption}*`);
        }
      }

      lines.push('\n---\n');
    }

    return lines.join('\n');
  },

  /**
   * 导出为 CSV
   */
  exportAsCsv(
    comments: AnnotationComment[],
    options: CommentExportOptions
  ): string {
    const headers = ['ID', '标注ID', '类型', '状态', '优先级', '创建时间', '内容'];
    if (options.includeMetadata) {
      headers.push('作者', '标签');
    }

    const rows = comments.map(comment => {
      const row = [
        comment.id,
        comment.annotationId,
        comment.type,
        comment.status,
        comment.priority,
        new Date(comment.createdAt).toISOString(),
      ];

      // 内容
      if (comment.type === 'text') {
        const textComment = comment as TextAnnotationComment;
        row.push(`"${textComment.content.text.replace(/"/g, '""')}"`);
      } else {
        row.push('');
      }

      if (options.includeMetadata) {
        row.push(comment.author || '');
        row.push((comment.tags || []).join(';'));
      }

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};

export default pdfAnnotationService;
