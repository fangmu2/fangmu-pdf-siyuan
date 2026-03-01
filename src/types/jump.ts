/**
 * 双向跳转类型定义
 * MarginNote 4 风格学习插件 - 卡片、脑图、PDF 之间的跳转
 */

/** 跳转目标类型 */
export type JumpTargetType = 'pdf' | 'mindmap' | 'card' | 'annotation';

/** PDF 矩形坐标 */
export interface PdfRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 跳转目标 */
export interface JumpTarget {
  /** 目标类型 */
  type: JumpTargetType;
  /** 目标 ID（块 ID、节点 ID 等） */
  targetId: string;
  /** PDF 路径（PDF 跳转时） */
  pdfPath?: string;
  /** 页码 */
  page?: number;
  /** 坐标区域 */
  rect?: PdfRect;
  /** 缩放比例 */
  scale?: number;
  /** 脑图 ID */
  mindmapId?: string;
  /** 节点路径 */
  nodePath?: string[];
  /** 高亮选项 */
  highlight?: {
    enabled: boolean;
    color?: string;
    duration?: number;
  };
}

/** 跳转结果 */
export interface JumpResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 跳转目标 */
  target?: JumpTarget;
}

/** 双向链接 */
export interface BiDirectionalLink {
  /** 链接 ID */
  id: string;
  /** 源类型 */
  sourceType: 'card' | 'mindmap' | 'annotation';
  /** 源 ID */
  sourceId: string;
  /** 目标类型 */
  targetType: 'pdf' | 'mindmap' | 'card';
  /** 目标 ID */
  targetId: string;
  /** 目标详细信息 */
  targetInfo?: {
    pdfPath?: string;
    page?: number;
    rect?: PdfRect;
    nodeId?: string;
    nodePath?: string[];
  };
  /** 创建时间 */
  createdAt: number;
}

/** 跳转历史记录 */
export interface JumpHistoryItem {
  /** 记录 ID */
  id: string;
  /** 跳转目标 */
  target: JumpTarget;
  /** 跳转时间 */
  timestamp: number;
  /** 来源描述 */
  sourceDesc?: string;
}

/** 跳转事件详情 */
export interface JumpEventDetail {
  /** 目标类型 */
  type: JumpTargetType;
  /** 目标 ID */
  targetId: string;
  /** PDF 路径 */
  pdfPath?: string;
  /** 页码 */
  page?: number;
  /** 坐标 */
  rect?: PdfRect;
  /** 缩放 */
  scale?: number;
  /** 脑图 ID */
  mindmapId?: string;
  /** 节点 ID */
  nodeId?: string;
  /** 高亮颜色 */
  highlightColor?: string;
  /** 高亮持续时间 */
  highlightDuration?: number;
}

/** 脑图节点高亮事件详情 */
export interface MindMapHighlightEventDetail {
  /** 脑图 ID */
  mindmapId: string;
  /** 节点 ID */
  nodeId: string;
  /** 高亮持续时间 */
  duration?: number;
  /** 高亮颜色 */
  color?: string;
  /** 是否滚动到节点 */
  scrollIntoView?: boolean;
}

/** 卡片高亮事件详情 */
export interface CardHighlightEventDetail {
  /** 卡片 ID */
  cardId: string;
  /** 高亮持续时间 */
  duration?: number;
  /** 高亮颜色 */
  color?: string;
  /** 是否滚动到卡片 */
  scrollIntoView?: boolean;
}
