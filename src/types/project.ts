// src/types/project.ts

/**
 * 项目中的PDF文件
 */
export interface ProjectPdf {
  id: string;                    // PDF文件ID
  path: string;                  // PDF文件路径
  name: string;                  // PDF原始文件名
  totalPages: number;            // PDF总页数
  currentPage: number;           // 当前阅读页码
  addedAt: number;               // 添加时间
}

/**
 * PDF项目
 * 每个项目可以包含多个PDF文件，共享同一个标注文档
 */
export interface PDFProject {
  id: string;                    // 项目ID
  name: string;                  // 项目名称
  pdfs: ProjectPdf[];            // 项目中的PDF文件列表
  currentPdfId: string | null;   // 当前正在阅读的PDF ID
  annotationDocId?: string;      // 标注文档ID（思源文档）
  annotationCount: number;       // 标注总数
  
  // 元数据
  created: number;               // 创建时间
  updated: number;               // 最后更新时间
}

/**
 * 项目列表项（简化版，用于列表展示）
 */
export interface ProjectListItem {
  id: string;
  name: string;
  pdfCount: number;              // PDF数量
  pdfNames: string[];            // PDF文件名列表
  annotationCount: number;
  updated: number;
}

/**
 * 项目存储在 localStorage 中的结构
 */
export interface ProjectStorage {
  projects: PDFProject[];
  currentProjectId: string | null;
}
