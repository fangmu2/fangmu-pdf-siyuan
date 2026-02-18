// src/types/annotation.ts

/**
 * 摘录模式类型
 */
export type ExtractMode = 'text' | 'image';

/**
 * 标注颜色类型
 * 思源PDF标注支持的颜色
 */
export type AnnotationColor =
  | 'red'      // 红色 - 关键内容
  | 'yellow'   // 黄色 - 普通高亮
  | 'green'    // 绿色 - 重要概念
  | 'blue'     // 蓝色 - 方法/数据
  | 'purple';  // 紫色 - 评论/思考

/**
 * 标注级别类型
 * 用于生成不同层级的 Markdown 格式
 */
export type AnnotationLevel =
  | 'title'    // 文档标题
  | 'h1'       // 一级标题
  | 'h2'       // 二级标题
  | 'h3'       // 三级标题
  | 'h4'       // 四级标题
  | 'h5'       // 五级标题
  | 'text';    // 正文/普通标注

/**
 * 标注级别配置
 */
export const ANNOTATION_LEVELS: { value: AnnotationLevel; label: string; prefix: string }[] = [
  { value: 'title', label: '文档标题', prefix: '' },
  { value: 'h1', label: '一级标题', prefix: '# ' },
  { value: 'h2', label: '二级标题', prefix: '## ' },
  { value: 'h3', label: '三级标题', prefix: '### ' },
  { value: 'h4', label: '四级标题', prefix: '#### ' },
  { value: 'h5', label: '五级标题', prefix: '##### ' },
  { value: 'text', label: '正文标注', prefix: '' },
];

/**
 * 解析后的标注数据
 * 这是我们插件内部使用的统一格式
 */
export interface PDFAnnotation {
  id: string;                    // 标注块的ID
  blockId: string;               // 关联的思源块ID

  // PDF定位信息
  pdfPath: string;               // PDF文件路径（完整路径）
  pdfName: string;               // PDF文件名
  page: number;                  // 页码
  rect: [number, number, number, number]; // 坐标矩形

  // 标注内容
  text: string;                  // 高亮的文本内容
  note: string;                  // 用户添加的笔记（可选）
  color: AnnotationColor;        // 颜色
  level: AnnotationLevel;        // 标注级别
  
  // 图片摘录相关
  isImage?: boolean;             // 是否为图片摘录
  imagePath?: string;            // 图片路径（思源assets路径）

  // 元数据
  created: number;               // 创建时间戳
  updated: number;               // 更新时间戳

  // 思源相关
  boxId?: string;                // 所在笔记本ID
  rootId?: string;               // 所在文档ID
  parentHPath?: string;          // 父级路径
}

/**
 * 标注分组
 * 用于按颜色或页码组织标注
 */
export interface AnnotationGroup {
  title: string;
  color?: AnnotationColor;
  page?: number;
  annotations: PDFAnnotation[];
}

/**
 * 标注统计数据
 */
export interface AnnotationStats {
  total: number;
  byColor: Record<AnnotationColor, number>;
  byPage: Record<number, number>;
}
