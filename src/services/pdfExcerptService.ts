/**
 * PDF 摘录坐标服务
 * 负责存储和检索 PDF 摘录的精确坐标信息
 * 使用思源块属性存储坐标数据
 */

import { PdfExcerptCoordinates, PdfNavigationTarget } from '../types/pdfExcerpt';
import { Card } from '../types/card';
import { PDFAnnotation } from '../types/annotation';

/** 思源 API 响应类型 */
interface SiyuanApiResponse {
  code: number;
  msg?: string;
  data?: any;
}

/** 块属性数据 */
interface BlockAttributes {
  id: string;
  [key: string]: string;
}

/** PDF 坐标存储键名 */
const PDF_COORDS_ATTR = 'pdf_coords';
const PDF_PATH_ATTR = 'pdf_path';

/**
 * PDF 摘录坐标服务类
 */
export class PdfExcerptService {
  private static instance: PdfExcerptService;

  private constructor() {}

  static getInstance(): PdfExcerptService {
    if (!PdfExcerptService.instance) {
      PdfExcerptService.instance = new PdfExcerptService();
    }
    return PdfExcerptService.instance;
  }

  /**
   * 获取思源 Token
   */
  private getToken(): string {
    const token = localStorage.getItem('siyuan-token');
    if (!token) {
      console.warn('[PdfExcerptService] 未找到思源 Token，使用空 Token');
      return '';
    }
    return token;
  }

  /**
   * 获取 API 基础 URL
   */
  private getBaseUrl(): string {
    return window.location.origin;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Token ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 通用 API 请求方法
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result: SiyuanApiResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.msg || 'API 请求失败');
    }

    return result.data as T;
  }

  /**
   * 获取块属性
   */
  private async getBlockAttributes(blockId: string): Promise<BlockAttributes | null> {
    try {
      const data = await this.request<any>('/api/attr/getBlockAttrs', 'POST', {
        id: blockId,
      });
      return data || null;
    } catch (error) {
      console.error('[PdfExcerptService] 获取块属性失败:', error);
      return null;
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
      });
    } catch (error) {
      console.error('[PdfExcerptService] 设置块属性失败:', error);
      throw error;
    }
  }

  /**
   * 删除块属性
   */
  private async deleteBlockAttr(blockId: string, key: string): Promise<void> {
    try {
      await this.request('/api/attr/deleteBlockAttr', 'POST', {
        id: blockId,
        key,
      });
    } catch (error) {
      console.error('[PdfExcerptService] 删除块属性失败:', error);
      throw error;
    }
  }

  /**
   * 保存 PDF 坐标到块属性
   * @param cardId 卡片 ID（块 ID）
   * @param coordinates 坐标信息
   */
  async saveCoordinates(cardId: string, coordinates: PdfExcerptCoordinates): Promise<void> {
    try {
      // 将坐标序列化为 JSON 字符串
      const coordsJson = JSON.stringify(coordinates);

      // 保存坐标数据
      await this.setBlockAttr(cardId, PDF_COORDS_ATTR, coordsJson);

      // 同时保存 PDF 路径（便于快速查询）
      if (coordinates.rect) {
        // 从坐标中提取 PDF 路径信息（如果有）
        console.log('[PdfExcerptService] 保存坐标:', cardId, coordinates);
      }
    } catch (error) {
      console.error('[PdfExcerptService] 保存坐标失败:', error);
      throw error;
    }
  }

  /**
   * 从块属性获取 PDF 坐标
   * @param cardId 卡片 ID（块 ID）
   * @returns 坐标信息，如果不存在则返回 null
   */
  async getCoordinates(cardId: string): Promise<PdfExcerptCoordinates | null> {
    try {
      const attrs = await this.getBlockAttributes(cardId);
      if (!attrs || !attrs[PDF_COORDS_ATTR]) {
        return null;
      }

      // 解析 JSON 坐标数据
      const coordinates: PdfExcerptCoordinates = JSON.parse(attrs[PDF_COORDS_ATTR]);
      return coordinates;
    } catch (error) {
      console.error('[PdfExcerptService] 获取坐标失败:', error);
      return null;
    }
  }

  /**
   * 删除 PDF 坐标
   * @param cardId 卡片 ID
   */
  async deleteCoordinates(cardId: string): Promise<void> {
    try {
      await this.deleteBlockAttr(cardId, PDF_COORDS_ATTR);
    } catch (error) {
      console.error('[PdfExcerptService] 删除坐标失败:', error);
      throw error;
    }
  }

  /**
   * 从卡片获取 PDF 路径
   * @param card 卡片对象
   * @returns PDF 路径
   */
  getPdfPathFromCard(card: Card): string | null {
    // 优先从 sourceLocation 获取
    if (card.sourceLocation?.pdfPath) {
      return card.sourceLocation.pdfPath;
    }

    // 兼容旧格式：从 content 中解析
    const pdfPathMatch = card.content?.match(/pdf_path="([^"]+)"/);
    if (pdfPathMatch) {
      return pdfPathMatch[1];
    }

    return null;
  }

  /**
   * 从卡片获取页码
   * @param card 卡片对象
   * @returns 页码
   */
  getPageFromCard(card: Card): number | null {
    // 优先从 sourceLocation 获取
    if (card.sourceLocation?.page) {
      return card.sourceLocation.page;
    }

    // 兼容旧格式
    const pageMatch = card.content?.match(/page="(\d+)"/);
    if (pageMatch) {
      return parseInt(pageMatch[1], 10);
    }

    return null;
  }

  /**
   * 构建 PDF 导航目标
   * @param card 卡片对象
   * @returns 导航目标，如果无法构建则返回 null
   */
  async buildNavigationTarget(card: Card): Promise<PdfNavigationTarget | null> {
    const pdfPath = this.getPdfPathFromCard(card);
    const page = this.getPageFromCard(card);

    if (!pdfPath || !page) {
      return null;
    }

    // 尝试获取精确坐标
    const coordinates = await this.getCoordinates(card.id);

    const target: PdfNavigationTarget = {
      pdfPath,
      page,
    };

    if (coordinates?.rect) {
      target.rect = {
        x1: coordinates.rect.x1,
        y1: coordinates.rect.y1,
        x2: coordinates.rect.x2,
        y2: coordinates.rect.y2,
      };
      target.scale = coordinates.scale;
    } else if (card.sourceLocation?.rect) {
      // 兼容旧格式
      const [x1, y1, x2, y2] = card.sourceLocation.rect;
      target.rect = { x1, y1, x2, y2 };
    }

    return target;
  }

  /**
   * 跳转到卡片的 PDF 位置
   * @param card 卡片对象或卡片 ID
   * @param options 跳转选项
   */
  async navigateToCardPdf(
    card: Card | string,
    options: {
      highlight?: boolean;
      highlightColor?: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';
      scale?: number;
    } = {}
  ): Promise<boolean> {
    try {
      // 如果是字符串，先获取卡片
      let cardObj: Card | null = null;
      if (typeof card === 'string') {
        // TODO: 从服务获取卡片
        console.warn('[PdfExcerptService] 需要通过 ID 获取卡片，请传入 Card 对象');
        return false;
      } else {
        cardObj = card;
      }

      if (!cardObj) {
        console.error('[PdfExcerptService] 卡片不存在');
        return false;
      }

      const target = await this.buildNavigationTarget(cardObj);
      if (!target) {
        console.warn('[PdfExcerptService] 无法构建导航目标，卡片可能不是 PDF 摘录');
        return false;
      }

      // 触发自定义事件，通知 PDF 查看器跳转
      const event = new CustomEvent('pdf-navigate-to', {
        detail: {
          ...target,
          highlight: options.highlight ?? true,
          highlightColor: options.highlightColor ?? 'yellow',
          scale: options.scale ?? target.scale,
        },
      });
      window.dispatchEvent(event);

      console.log('[PdfExcerptService] 已触发 PDF 跳转事件:', target);
      return true;
    } catch (error) {
      console.error('[PdfExcerptService] 跳转到 PDF 失败:', error);
      return false;
    }
  }

  /**
   * 高亮显示 PDF 区域
   * @param cardId 卡片 ID
   * @param duration 高亮持续时间（毫秒）
   */
  async highlightPdfRect(cardId: string, duration: number = 3000): Promise<void> {
    try {
      const coordinates = await this.getCoordinates(cardId);
      if (!coordinates) {
        console.warn('[PdfExcerptService] 未找到坐标信息，无法高亮');
        return;
      }

      // 触发自定义事件，通知 PDF 查看器高亮
      const event = new CustomEvent('pdf-highlight-rect', {
        detail: {
          coordinates,
          duration,
        },
      });
      window.dispatchEvent(event);

      console.log('[PdfExcerptService] 已触发 PDF 高亮事件');
    } catch (error) {
      console.error('[PdfExcerptService] 高亮 PDF 区域失败:', error);
    }
  }

  /**
   * 批量保存坐标（用于批量导入）
   * @param coordsMap 卡片 ID 到坐标的映射
   */
  async saveCoordinatesBatch(coordsMap: Map<string, PdfExcerptCoordinates>): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [cardId, coordinates] of coordsMap.entries()) {
      promises.push(this.saveCoordinates(cardId, coordinates));
    }

    // 并发执行，限制同时执行数量
    const BATCH_SIZE = 5;
    for (let i = 0; i < promises.length; i += BATCH_SIZE) {
      const batch = promises.slice(i, i + BATCH_SIZE);
      await Promise.all(batch);
    }
  }

  /**
   * 导出所有 PDF 坐标数据
   * @returns 坐标数据 JSON
   */
  async exportAllCoordinates(): Promise<string> {
    // TODO: 需要思源 SQL 查询支持
    // 查询所有包含 pdf_coords 属性的块
    const sql = `
      SELECT * FROM blocks
      WHERE name = '${PDF_COORDS_ATTR}'
    `;

    try {
      const result = await this.request<any>('/api/query/sql', 'POST', {
        stmt: sql,
      });

      // 构建导出数据
      const exportData: Record<string, PdfExcerptCoordinates> = {};
      // TODO: 解析结果并构建导出数据

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[PdfExcerptService] 导出坐标数据失败:', error);
      return '{}';
    }
  }
}

// 导出单例
export const pdfExcerptService = PdfExcerptService.getInstance();

/**
 * 便捷函数：保存 PDF 坐标
 */
export async function savePdfCoordinates(
  cardId: string,
  coordinates: PdfExcerptCoordinates
): Promise<void> {
  return pdfExcerptService.saveCoordinates(cardId, coordinates);
}

/**
 * 便捷函数：获取 PDF 坐标
 */
export async function getPdfCoordinates(
  cardId: string
): Promise<PdfExcerptCoordinates | null> {
  return pdfExcerptService.getCoordinates(cardId);
}

/**
 * 便捷函数：跳转到卡片的 PDF 位置
 */
export async function navigateToCardPdf(
  card: Card,
  options?: {
    highlight?: boolean;
    highlightColor?: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';
  }
): Promise<boolean> {
  return pdfExcerptService.navigateToCardPdf(card, options);
}

/**
 * 便捷函数：跳转到标注的 PDF 位置
 */
export async function navigateToAnnotationPdf(
  annotation: PDFAnnotation,
  options?: {
    highlight?: boolean;
    highlightColor?: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange';
  }
): Promise<boolean> {
  try {
    if (!annotation.pdfPath || annotation.page === undefined) {
      console.warn('[PdfExcerptService] 标注缺少 PDF 路径或页码信息');
      return false;
    }

    const target: PdfNavigationTarget = {
      pdfPath: annotation.pdfPath,
      page: annotation.page,
    };

    // 如果有坐标信息
    if (annotation.rect && annotation.rect.length === 4) {
      target.rect = {
        x1: annotation.rect[0],
        y1: annotation.rect[1],
        x2: annotation.rect[2],
        y2: annotation.rect[3],
      };
    }

    // 触发自定义事件，通知 PDF 查看器跳转
    const event = new CustomEvent('pdf-navigate-to', {
      detail: {
        ...target,
        highlight: options?.highlight ?? true,
        highlightColor: options?.highlightColor ?? 'yellow',
      },
    });
    window.dispatchEvent(event);

    console.log('[PdfExcerptService] 已触发标注 PDF 跳转事件:', target);
    return true;
  } catch (error) {
    console.error('[PdfExcerptService] 跳转到标注 PDF 失败:', error);
    return false;
  }
}
