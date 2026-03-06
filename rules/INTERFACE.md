# 前端数据接口契约

## 1. 思源 API 响应标准

## 2. 组件 Props 定义
### NoteCard.vue

---

## 3. 双向跳转类型定义

### JumpTarget 跳转目标
```typescript
/** 跳转目标类型 */
export type JumpTargetType = 'pdf' | 'mindmap' | 'card' | 'annotation';

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

/** PDF 矩形坐标 */
export interface PdfRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
```

### JumpResult 跳转结果
```typescript
/** 跳转结果 */
export interface JumpResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 跳转目标 */
  target?: JumpTarget;
}
```

### BiDirectionalLink 双向链接
```typescript
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
  /** 创建时间 */
  createdAt: number;
}
```

---

## 4. PDF+ 思维导图联动视图类型定义

### PdfMindMapLinkViewer Props
```typescript
/** PDF+ 思维导图联动视图 Props */
export interface PdfMindMapLinkViewerProps {
  /** PDF 文档 ID（块 ID） */
  pdfDocId: string;
  /** 学习集 ID */
  studySetId: string;
  /** 思维导图块 ID */
  mindMapBlockId?: string;
  /** 初始分隔比例（0.3-0.7） */
  initialSplitRatio?: number;
  /** 是否启用自动同步 */
  autoSync?: boolean;
}

/** 分隔条位置枚举 */
export type SplitPosition = 'left' | 'right';
```

### AnnotationListItem 标注列表项
```typescript
/** 标注列表项 */
export interface AnnotationListItem {
  /** 标注 ID */
  id: string;
  /** 标注内容 */
  content: string;
  /** 页码 */
  page: number;
  /** 标注颜色 */
  color: AnnotationColor;
  /** 标注级别 */
  level?: string;
  /** 是否为图片摘录 */
  isImage?: boolean;
  /** 坐标区域 */
  rect: PdfRect;
  /** 创建时间 */
  createdAt: number;
  /** 是否已关联到思维导图 */
  linkedToMindMap: boolean;
}
```

### MindMapNodeData 思维导图节点数据（联动视图用）
```typescript
/** 思维导图节点数据 */
export interface MindMapNodeData {
  /** 节点 ID */
  id: string;
  /** 节点类型 */
  type: 'text' | 'image' | 'group';
  /** 关联的标注 ID */
  annotationId?: string;
  /** 节点标题 */
  title: string;
  /** 节点内容 */
  content?: string;
  /** 图片 URL（图片卡片） */
  imageUrl?: string;
  /** 页码 */
  page?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 位置 */
  position: {
    x: number;
    y: number;
  };
}
```

### PdfMindMapLinkViewer Emits
```typescript
/** PDF+ 思维导图联动视图 Events */
export interface PdfMindMapLinkViewerEvents {
  /** 标注创建事件 */
  (e: 'annotation-created', annotation: PDFAnnotation): void;
  /** 标注删除事件 */
  (e: 'annotation-deleted', annotationId: string): void;
  /** 思维导图节点点击事件 */
  (e: 'mindmap-node-click', nodeId: string): void;
  /** 分隔比例变化事件 */
  (e: 'split-ratio-change', ratio: number): void;
  /** 全屏模式变化事件 */
  (e: 'fullscreen-change', isFullscreen: boolean): void;
}
```
