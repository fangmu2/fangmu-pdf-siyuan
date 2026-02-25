// src/utils/mindmapGenerator.ts
import type { PDFAnnotation } from '../types/annotaion';

/**
 * 思维导图节点接口
 */
export interface MindmapNode {
  id: string;
  content: string;
  level: string;
  annotationId?: string; // 关联的标注ID
  children?: MindmapNode[];
  page?: number; // 标注所在页码
  pdfName?: string; // PDF名称
  sortOrder?: number; // 排序序号
}

/**
 * 将标注数据转换为Markmap可用的Markdown格式
 */
export function generateMindmapMarkdown(annotations: PDFAnnotation[]): string {
  // 使用层次化结构生成思维导图
  const rootNode = generateHierarchicalMindmapStructure(annotations);
  return convertToMarkdown(rootNode);
}

/**
 * 生成层次化的思维导图结构，保留父子关系
 */
export const generateHierarchicalMindmapStructure = (annotations: PDFAnnotation[]): MindmapNode => {
  // 创建根节点
  const rootNode: MindmapNode = {
    id: 'root',
    content: 'PDF Annotations Mindmap',
    level: 'title',
    children: []
  };

  // 按父级ID分组标注
  const annotationsMap = new Map<string, PDFAnnotation>();
  const childrenMap = new Map<string, PDFAnnotation[]>();

  annotations.forEach(annotation => {
    annotationsMap.set(annotation.id, annotation);
    if (annotation.parentId) {
      if (!childrenMap.has(annotation.parentId)) {
        childrenMap.set(annotation.parentId, []);
      }
      childrenMap.get(annotation.parentId)?.push(annotation);
    }
  });

  // 查找根级标注（没有父级的标注）
  const rootAnnotations = annotations.filter(ann => !ann.parentId);

  // 构建树形结构
  const buildTree = (annotation: PDFAnnotation): MindmapNode => {
    const node: MindmapNode = {
      id: annotation.id,
      content: annotation.text || annotation.note || 'Untitled',
      level: annotation.level || 'text',
      annotationId: annotation.id,
      page: annotation.page,
      pdfName: annotation.pdfName,
      sortOrder: annotation.sortOrder,
      children: []
    };

    // 添加子节点
    const children = childrenMap.get(annotation.id) || [];
    // 按sortOrder排序
    children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    children.forEach(child => {
      node.children?.push(buildTree(child));
    });

    return node;
  };

  // 按sortOrder排序根节点
  rootAnnotations.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // 构建根级节点
  rootAnnotations.forEach(annotation => {
    rootNode.children?.push(buildTree(annotation));
  });

  return rootNode;
};

/**
 * 将思维导图节点转换为Markdown格式
 */
const convertToMarkdown = (node: MindmapNode, depth = 0): string => {
  const indent = '  '.repeat(depth);
  // 在内容后添加页码和PDF信息
  let contentWithInfo = node.content;
  if (node.page !== undefined && node.pdfName) {
    contentWithInfo += ` (${node.pdfName} P${node.page})`;
  }
  let markdown = `${indent}- ${contentWithInfo}\n`;

  if (node.children) {
    node.children.forEach(child => {
      markdown += convertToMarkdown(child, depth + 1);
    });
  }

  return markdown;
};

/**
 * 获取标题前缀
 */
function getHeadingPrefix(level: string | undefined): string {
  if (!level) return '';
  const prefixes: Record<string, string> = {
    'title': '',
    'h1': '# ',
    'h2': '## ',
    'h3': '### ',
    'h4': '#### ',
    'h5': '##### '
  };
  return prefixes[level] || '';
}

/**
 * 将标注数据转换为思维导图节点结构
 */
export function generateMindmapStructure(annotations: PDFAnnotation[]): MindmapNode {
  const rootNodes = annotations.filter(ann => !ann.parentId);

  const rootNode: MindmapNode = {
    id: 'root',
    content: 'PDF 思维导图',
    level: 'title',
    children: []
  };

  const buildNode = (ann: PDFAnnotation): MindmapNode => {
    const children = annotations
      .filter(child => child.parentId === ann.id)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)); // 按sortOrder排序

    const node: MindmapNode = {
      id: ann.id,
      content: ann.text || ann.note || 'Untitled',
      level: ann.level || 'text',
      annotationId: ann.id,
      page: ann.page,
      pdfName: ann.pdfName,
      sortOrder: ann.sortOrder,
      ...(children.length > 0 && { children: children.map(buildNode) })
    };

    return node;
  };

  // 按sortOrder排序根节点
  const sortedRootNodes = rootNodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  rootNode.children = sortedRootNodes.map(buildNode);

  return rootNode;
}
