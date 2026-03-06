// src/types/siyuan.ts

/**
 * 思源块的基本结构
 */
export interface SiYuanBlock {
  id: string
  type: string
  subtype?: string
  content: string
  markdown: string
  ial: Record<string, string> // Inline Attribute List
  children?: SiYuanBlock[]
}

/**
 * 文本标记块
 * 当用户在PDF上高亮文字时，思源会创建这种类型的块
 */
export interface TextMarkBlock extends SiYuanBlock {
  type: 'NodeTextMark'
  textMarkType: string // 例如 'file-annotation-ref'
  textMarkTextContent: string // 标注的文本内容
}

/**
 * 文件标注引用的属性
 * 存储在块的 IAL 中，格式类似：
 * file-annotation-ref="assets/xxx.pdf?path=/data/assets/xxx.pdf&page=1&rect=100,200,300,250"
 */
export interface FileAnnotationRef {
  pdfPath: string // PDF 文件的路径
  pdfName: string // PDF 文件名
  page: number // 页码（从 1 开始）
  rect: [number, number, number, number] // 坐标矩形 [x1, y1, x2, y2]
  color?: string // 高亮颜色
  content?: string // 用户添加的笔记内容
}

/**
 * 思源 API 接口定义
 */
export interface SiYuanAPI {
  /** 获取块信息 */
  getBlock: (id: string) => Promise<any>
  /** 插入块 */
  insertBlock: (data: any) => Promise<any>
  /** 更新块 */
  updateBlock: (data: any) => Promise<any>
  /** 删除块 */
  deleteBlock: (id: string) => Promise<any>
  /** SQL 查询 */
  sql: (query: string) => Promise<any>
  /** 设置块属性 */
  setBlockAttrs: (id: string, attrs: Record<string, string>) => Promise<any>
  /** 获取块属性 */
  getBlockAttrs: (id: string) => Promise<Record<string, string>>
  /** 获取笔记本列表 */
  listNotebooks: () => Promise<any>
  /** 创建文档 */
  createDoc: (notebookId: string, path: string, markdown: string) => Promise<any>
  /** 删除文档 */
  removeDoc: (notebookId: string, path: string) => Promise<any>
  /** 上传文件 */
  uploadFile: (path: string, file: File) => Promise<any>
  /** 读取目录 */
  readDir: (path: string) => Promise<any>
  /** 获取文件 */
  getFile: (path: string) => Promise<Blob>
}

/**
 * 思源块属性类型
 */
export type BlockAttr = Record<string, string>
