// src/utils/mindmapGenerator.ts
import type { PDFAnnotation } from '../types/annotation'

/**
 * 思维导图节点接口
 */
export interface MindmapNode {
  id: string
  content: string
  level: string
  annotationId?: string // 关联的标注 ID
  children?: MindmapNode[]
  page?: number // 标注所在页码
  pdfName?: string // PDF 名称
  sortOrder?: number // 排序序号
}

/**
 * 将标注数据转换为 Markmap 可用的 Markdown 格式
 * 按照 MarginNote 的方式，使用标注内容作为标题而不是页码
 */
export function generateMindmapMarkdown(annotations: PDFAnnotation[] | undefined): string {
  // 处理空值情况
  if (!annotations || annotations.length === 0) {
    return '# 📚 暂无标注\n'
  }

  // 过滤掉无效的标注
  const validAnnotations = annotations.filter((ann) => ann && ann.id)

  if (validAnnotations.length === 0) {
    return '# 📚 暂无标注\n'
  }

  // 按 PDF 分组
  const pdfGroups = new Map<string, PDFAnnotation[]>()
  validAnnotations.forEach((ann) => {
    const key = ann.pdfName || 'Unknown PDF'
    if (!pdfGroups.has(key)) {
      pdfGroups.set(key, [])
    }
    pdfGroups.get(key)!.push(ann)
  })

  // 生成 Markdown
  let markdown = '# 📚 PDF 学习笔记\n\n'

  pdfGroups.forEach((pdfAnnotations, pdfName) => {
    // 按页码排序
    pdfAnnotations.sort((a, b) => a.page - b.page)

    // 生成 PDF 节点
    markdown += `## 📄 ${pdfName}\n\n`

    // 直接生成标注树，不按页码分组
    const rootAnnotations = pdfAnnotations.filter((ann) => !ann.parentId)
    rootAnnotations.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

    rootAnnotations.forEach((rootAnn) => {
      markdown += buildAnnotationTreeWithContent(rootAnn, annotations)
    })
  })

  return markdown
}

/**
 * 递归构建标注树（带内容标题）
 * 修复：统一使用列表格式，markmap 不支持混用标题和列表
 */
function buildAnnotationTreeWithContent(annotation: PDFAnnotation, allAnnotations: PDFAnnotation[], depth = 0): string {
  let markdown = ''

  // 根据标注级别选择图标
  const levelIcons: Record<string, string> = {
    title: '🎯',
    h1: '📌',
    h2: '📍',
    h3: '📎',
    h4: '🏷️',
    h5: '🔖',
    text: '💬',
  }
  const icon = levelIcons[annotation.level] || levelIcons.text

  // 内容处理 - 优先使用 text，其次 note
  let content = annotation.text || annotation.note || 'Untitled'

  // 截断过长的文本，避免节点过大
  if (content.length > 100) {
    content = `${content.substring(0, 100)}...`
  }

  // 统一使用列表格式，通过缩进表示层级
  // markmap 使用列表语法而不是标题语法
  const indent = '  '.repeat(depth)
  markdown = `${indent}- ${icon} ${content}\n`

  // 查找并添加子节点
  const children = allAnnotations
    .filter((child) => child.parentId === annotation.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  children.forEach((child) => {
    markdown += buildAnnotationTreeWithContent(child, allAnnotations, depth + 1)
  })

  return markdown
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
    children: [],
  }

  // 按父级 ID 分组标注
  const annotationsMap = new Map<string, PDFAnnotation>()
  const childrenMap = new Map<string, PDFAnnotation[]>()

  annotations.forEach((annotation) => {
    annotationsMap.set(annotation.id, annotation)
    if (annotation.parentId) {
      if (!childrenMap.has(annotation.parentId)) {
        childrenMap.set(annotation.parentId, [])
      }
      childrenMap.get(annotation.parentId)?.push(annotation)
    }
  })

  // 查找根级标注（没有父级的标注）
  const rootAnnotations = annotations.filter((ann) => !ann.parentId)

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
      children: [],
    }

    // 添加子节点
    const children = childrenMap.get(annotation.id) || []
    // 按 sortOrder 排序
    children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    children.forEach((child) => {
      node.children?.push(buildTree(child))
    })

    return node
  }

  // 按 sortOrder 排序根节点
  rootAnnotations.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  // 构建根级节点
  rootAnnotations.forEach((annotation) => {
    rootNode.children?.push(buildTree(annotation))
  })

  return rootNode
}

/**
 * 将标注数据转换为思维导图节点结构
 */
export function generateMindmapStructure(annotations: PDFAnnotation[]): MindmapNode {
  const rootNodes = annotations.filter((ann) => !ann.parentId)

  const rootNode: MindmapNode = {
    id: 'root',
    content: 'PDF 思维导图',
    level: 'title',
    children: [],
  }

  const buildNode = (ann: PDFAnnotation): MindmapNode => {
    const children = annotations
      .filter((child) => child.parentId === ann.id)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

    const node: MindmapNode = {
      id: ann.id,
      content: ann.text || ann.note || 'Untitled',
      level: ann.level || 'text',
      annotationId: ann.id,
      page: ann.page,
      pdfName: ann.pdfName,
      sortOrder: ann.sortOrder,
      ...(children.length > 0 && { children: children.map(buildNode) }),
    }

    return node
  }

  // 按 sortOrder 排序根节点
  const sortedRootNodes = rootNodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  rootNode.children = sortedRootNodes.map(buildNode)

  return rootNode
}
