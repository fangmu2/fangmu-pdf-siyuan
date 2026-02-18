// src/types/siyuan.ts

/**
 * 思源块的基本结构
 */
export interface SiYuanBlock {
  id: string;
  type: string;
  subtype?: string;
  content: string;
  markdown: string;
  ial: Record<string, string>; // Inline Attribute List
  children?: SiYuanBlock[];
}

/**
 * 文本标记块
 * 当用户在PDF上高亮文字时，思源会创建这种类型的块
 */
export interface TextMarkBlock extends SiYuanBlock {
  type: 'NodeTextMark';
  textMarkType: string; // 例如 'file-annotation-ref'
  textMarkTextContent: string; // 标注的文本内容
}

/**
 * 文件标注引用的属性
 * 存储在块的 IAL 中，格式类似：
 * file-annotation-ref="assets/xxx.pdf?path=/data/assets/xxx.pdf&page=1&rect=100,200,300,250"
 */
export interface FileAnnotationRef {
  pdfPath: string;      // PDF文件的路径
  pdfName: string;      // PDF文件名
  page: number;         // 页码（从1开始）
  rect: [number, number, number, number]; // 坐标矩形 [x1, y1, x2, y2]
  color?: string;       // 高亮颜色
  content?: string;     // 用户添加的笔记内容
}
