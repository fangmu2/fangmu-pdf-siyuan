// src/composables/useAnnotationList.ts
/**
 * 标注列表逻辑组合式函数
 * 负责文档树构建、标题折叠、目录生成等核心逻辑
 */

import type { AnnotationLevel, PDFAnnotation } from '@/types/annotation'
import { reactive, ref } from 'vue'

// 文档树节点类型
export interface DocumentNode {
  key: string
  annotation: PDFAnnotation
  indent: number
  isPageBreak?: boolean
  page?: number
  height: number
  // 折叠相关
  isCollapsed?: boolean
  canFold?: boolean
  hasChildren?: boolean
  childrenCount?: number
  children?: PDFAnnotation[]
}

// 目录项类型
export interface TocItem {
  id: string
  text: string
  level: string
}

// 标题级别权重
const LEVEL_WEIGHT: Record<string, number> = {
  title: 0,
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  text: 6,
}

// 获取标题前缀
export function getHeadingPrefix(level: AnnotationLevel): string {
  const prefixes: Record<AnnotationLevel, string> = {
    title: '¶',
    h1: '#',
    h2: '##',
    h3: '###',
    h4: '####',
    h5: '#####',
    text: '',
  }
  return prefixes[level] || ''
}

// 判断节点类型
export function isHeadingNode(annotation: PDFAnnotation): boolean {
  return !!annotation.level && annotation.level !== 'text' && !annotation.isImage
}

export function isTextNode(annotation: PDFAnnotation): boolean {
  return !annotation.isImage && (!annotation.level || annotation.level === 'text')
}

export function isImageNode(annotation: PDFAnnotation): boolean {
  return !!annotation.isImage
}

/**
 * 标注列表逻辑
 */
export function useAnnotationList(_annotations: PDFAnnotation[]) {
  // 标题折叠状态
  const collapsedHeadings = ref<Set<string>>(new Set())

  // 图片加载状态
  const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>({})

  /**
   * 切换标题折叠状态
   */
  const toggleHeadingFold = (annotationId: string) => {
    const newSet = new Set(collapsedHeadings.value)
    if (newSet.has(annotationId)) {
      newSet.delete(annotationId)
    } else {
      newSet.add(annotationId)
    }
    collapsedHeadings.value = newSet
  }

  /**
   * 判断标题是否可以折叠
   */
  const canFold = (annotation: PDFAnnotation, allAnnotations: PDFAnnotation[]): boolean => {
    // 如果有合并的子块，可以折叠
    if (hasChildren(annotation, allAnnotations)) {
      return true
    }

    // 标题下面有其他内容也能折叠
    const annotationsWithoutChildren = allAnnotations.filter(a => !a.parentId)
    const nodeIndex = annotationsWithoutChildren.findIndex(a => a.id === annotation.id)
    if (nodeIndex === -1) return false

    const currentLevel = LEVEL_WEIGHT[annotation.level!] ?? 6

    // 检查后面是否有比当前标题级别低的内容
    for (let i = nodeIndex + 1; i < annotationsWithoutChildren.length; i++) {
      const nextNode = annotationsWithoutChildren[i]
      if (nextNode.level) {
        const nextLevel = LEVEL_WEIGHT[nextNode.level] ?? 6
        // 如果遇到同级或更高级标题，停止检查
        if (nextLevel <= currentLevel) break
      }
      // 如果有内容，可以折叠
      return true
    }
    return false
  }

  /**
   * 判断标题是否已折叠
   */
  const isCollapsed = (annotationId: string): boolean => {
    return collapsedHeadings.value.has(annotationId)
  }

  /**
   * 获取子标注（支持嵌套合并）
   */
  const getChildren = (parentId: string, allAnnotations: PDFAnnotation[]): PDFAnnotation[] => {
    const seenIds = new Set<string>()
    const result: PDFAnnotation[] = []

    // 递归获取所有子块
    const collectChildren = (pId: string) => {
      for (const a of allAnnotations) {
        if (a.parentId === pId && !seenIds.has(a.id)) {
          seenIds.add(a.id)
          result.push(a)
          // 递归获取这个子块的子块
          collectChildren(a.id)
        }
      }
    }

    collectChildren(parentId)

    // 按 sortOrder 排序
    return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }

  /**
   * 判断是否有子标注
   */
  const hasChildren = (annotation: PDFAnnotation, allAnnotations: PDFAnnotation[]): boolean => {
    return allAnnotations.some(a => a.parentId === annotation.id)
  }

  /**
   * 构建文档树结构
   */
  const buildDocumentTree = (
    annotationList: PDFAnnotation[],
    collapsedHeadingsSet: Set<string>
  ): DocumentNode[] => {
    // 【第一步：去重】
    const seenIds = new Set<string>()
    const uniqueAnnotations: PDFAnnotation[] = []

    for (const a of annotationList) {
      if (!seenIds.has(a.id)) {
        seenIds.add(a.id)
        uniqueAnnotations.push(a)
      }
    }

    // 【第二步：排序】
    const sorted = [...uniqueAnnotations].sort((a, b) => {
      if (a.parentId && !b.parentId) return 1
      if (!a.parentId && b.parentId) return -1

      if (a.parentId && b.parentId) {
        if (a.parentId !== b.parentId) {
          const parentA = uniqueAnnotations.find(p => p.id === a.parentId)
          const parentB = uniqueAnnotations.find(p => p.id === b.parentId)
          if (parentA && parentB) {
            if (parentA.page !== parentB.page) return parentA.page - parentB.page
            return parentA.created - parentB.created
          }
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      }

      if (a.page !== b.page) return a.page - b.page
      return a.created - b.created
    })

    const result: DocumentNode[] = []
    let currentPage = -1
    let headingStack: { level: string, indent: number, id: string }[] = []
    let collapsedLevel: number | null = null

    for (const ann of sorted) {
      // 如果是子标注，跳过
      if (ann.parentId) {
        continue
      }

      // 检查折叠状态
      if (collapsedLevel !== null) {
        if (ann.level && ann.level !== 'text' && !ann.isImage) {
          const currentLevel = LEVEL_WEIGHT[ann.level] || 6
          if (currentLevel <= collapsedLevel) {
            collapsedLevel = null
          }
        }
        if (collapsedLevel !== null) {
          continue
        }
      }

      // 页码分隔
      if (ann.page !== currentPage) {
        if (currentPage !== -1) {
          result.push({
            key: `page-${ann.page}-${result.length}`,
            annotation: ann,
            indent: 0,
            isPageBreak: true,
            page: ann.page,
            height: 40, // 页码分隔高度
          })
        }
        currentPage = ann.page
        headingStack = []
        collapsedLevel = null
      }

      // 计算缩进
      let indent = 0

      if (ann.level && ann.level !== 'text' && !ann.isImage) {
        const currentLevel = LEVEL_WEIGHT[ann.level] || 6

        while (headingStack.length > 0 && LEVEL_WEIGHT[headingStack[headingStack.length - 1].level] >= currentLevel) {
          headingStack.pop()
        }

        indent = headingStack.length
        headingStack.push({
          level: ann.level,
          indent,
          id: ann.id,
        })

        // 检查折叠状态
        if (collapsedHeadingsSet.has(ann.id)) {
          collapsedLevel = currentLevel
        }
      } else if (ann.isImage || !ann.level || ann.level === 'text') {
        indent = headingStack.length
      }

      // 计算节点高度（估算）
      const height = ann.isImage ? 200 : ann.text?.length ?? 0 > 100 ? 80 : 60

      result.push({
        key: ann.id,
        annotation: ann,
        indent,
        height,
        isCollapsed: collapsedHeadingsSet.has(ann.id),
        canFold: canFold(ann, annotationList),
        hasChildren: hasChildren(ann, annotationList),
        childrenCount: getChildren(ann.id, annotationList).length,
        children: getChildren(ann.id, annotationList),
      })
    }

    return result
  }

  /**
   * 生成目录项
   */
  const generateTocItems = (documentTree: DocumentNode[]): TocItem[] => {
    return documentTree
      .filter(node => !node.isPageBreak && isHeadingNode(node.annotation))
      .map(node => ({
        id: node.annotation.id,
        text: node.annotation.text,
        level: node.annotation.level!,
      }))
  }

  /**
   * 检查图片路径是否有效
   */
  const isValidImagePath = (path: string | undefined): boolean => {
    if (!path) return false
    if (path.startsWith('blob:')) return false
    if (path.startsWith('file://')) return false
    if (path.startsWith('@')) return false
    if (path.includes('localhost') || path.includes('127.0.0.1')) return false
    return true
  }

  return {
    // 状态
    collapsedHeadings,
    imageStatus,

    // 方法
    toggleHeadingFold,
    canFold,
    isCollapsed,
    getChildren,
    hasChildren,
    buildDocumentTree,
    generateTocItems,
    isValidImagePath,

    // 工具函数
    getHeadingPrefix,
    isHeadingNode,
    isTextNode,
    isImageNode,
  }
}

export default useAnnotationList
