/**
 * 标注增强服务
 * 提供标注链接、评论、版本历史等功能
 */

import type {
  Annotation,
  AnnotationComment,
  AnnotationLink,
  AnnotationVersion,
} from '../types/annotation'
import {
  createAnnotationComment,
  createAnnotationLink,
  saveAnnotationVersion,
} from '../types/annotation'

/**
 * 标注链接服务
 */
export class AnnotationLinkService {
  private static storageKey = 'annotation-links'

  /**
   * 创建标注链接
   */
  static addLink(
    fromAnnotationId: string,
    toAnnotationId: string,
    label?: string,
  ): AnnotationLink {
    const link = createAnnotationLink(fromAnnotationId, toAnnotationId, label)

    // 存储到思源块属性
    this.saveLink(link)

    return link
  }

  /**
   * 删除标注链接
   */
  static removeLink(linkId: string): void {
    const links = this.getAllLinks()
    const index = links.findIndex((l) => l.id === linkId)
    if (index !== -1) {
      links.splice(index, 1)
      this.saveAllLinks(links)
    }
  }

  /**
   * 获取标注的所有链接
   */
  static getAnnotationLinks(annotationId: string): AnnotationLink[] {
    return this.getAllLinks().filter(
      (l) => l.fromAnnotationId === annotationId || l.toAnnotationId === annotationId,
    )
  }

  /**
   * 获取标注的出链（从该标注出发）
   */
  static getOutgoingLinks(annotationId: string): AnnotationLink[] {
    return this.getAllLinks().filter((l) => l.fromAnnotationId === annotationId)
  }

  /**
   * 获取标注的入链（指向该标注）
   */
  static getIncomingLinks(annotationId: string): AnnotationLink[] {
    return this.getAllLinks().filter((l) => l.toAnnotationId === annotationId)
  }

  /**
   * 获取所有链接
   */
  static getAllLinks(): AnnotationLink[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to load annotation links:', e)
      return []
    }
  }

  /**
   * 保存单个链接
   */
  private static saveLink(link: AnnotationLink): void {
    const links = this.getAllLinks()
    links.push(link)
    this.saveAllLinks(links)
  }

  /**
   * 保存所有链接
   */
  private static saveAllLinks(links: AnnotationLink[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(links))
  }

  /**
   * 清除标注的所有链接
   */
  static clearAnnotationLinks(annotationId: string): void {
    const links = this.getAllLinks().filter(
      (l) => l.fromAnnotationId !== annotationId && l.toAnnotationId !== annotationId,
    )
    this.saveAllLinks(links)
  }
}

/**
 * 标注评论服务
 */
export class AnnotationCommentService {
  private static storageKeyPrefix = 'annotation-comments-'

  /**
   * 添加评论
   */
  static addComment(
    annotationId: string,
    content: string,
    author?: string,
  ): AnnotationComment {
    const comment = createAnnotationComment(annotationId, content, author)
    this.saveComment(annotationId, comment)
    return comment
  }

  /**
   * 删除评论
   */
  static removeComment(annotationId: string, commentId: string): void {
    const comments = this.getComments(annotationId)
    const index = comments.findIndex((c) => c.id === commentId)
    if (index !== -1) {
      comments.splice(index, 1)
      this.saveAllComments(annotationId, comments)
    }
  }

  /**
   * 更新评论
   */
  static updateComment(annotationId: string, commentId: string, content: string): void {
    const comments = this.getComments(annotationId)
    const comment = comments.find((c) => c.id === commentId)
    if (comment) {
      comment.content = content
      comment.updatedAt = Date.now()
      this.saveAllComments(annotationId, comments)
    }
  }

  /**
   * 获取标注的所有评论
   */
  static getComments(annotationId: string): AnnotationComment[] {
    try {
      const data = window.siyuan.storage.get(`${this.storageKeyPrefix}${annotationId}`)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to load annotation comments:', e)
      return []
    }
  }

  /**
   * 保存评论
   */
  private static saveComment(annotationId: string, comment: AnnotationComment): void {
    const comments = this.getComments(annotationId)
    comments.push(comment)
    this.saveAllComments(annotationId, comments)
  }

  /**
   * 保存所有评论
   */
  private static saveAllComments(annotationId: string, comments: AnnotationComment[]): void {
    window.siyuan.storage.set(`${this.storageKeyPrefix}${annotationId}`, JSON.stringify(comments))
  }

  /**
   * 清除标注的所有评论
   */
  static clearComments(annotationId: string): void {
    window.siyuan.storage.remove(`${this.storageKeyPrefix}${annotationId}`)
  }
}

/**
 * 标注版本历史服务
 */
export class AnnotationVersionService {
  private static storageKeyPrefix = 'annotation-versions-'

  /**
   * 保存版本
   */
  static saveVersion(annotation: Annotation): AnnotationVersion {
    const version = saveAnnotationVersion(annotation)
    this.saveVersionToStorage(annotation.id, version)
    return version
  }

  /**
   * 获取标注的所有版本
   */
  static getVersions(annotationId: string): AnnotationVersion[] {
    try {
      const data = window.siyuan.storage.get(`${this.storageKeyPrefix}${annotationId}`)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to load annotation versions:', e)
      return []
    }
  }

  /**
   * 恢复指定版本
   */
  static restoreVersion(annotationId: string, versionId: string, annotation: Annotation): Annotation {
    const versions = this.getVersions(annotationId)
    const version = versions.find((v) => v.id === versionId)

    if (!version) {
      throw new Error('Version not found')
    }

    // 恢复内容
    annotation.content = version.content
    annotation.note = version.note
    annotation.style = { ...version.style }
    annotation.tags = version.tags ? [...version.tags] : []
    annotation.updatedAt = Date.now()

    return annotation
  }

  /**
   * 删除版本
   */
  static removeVersion(annotationId: string, versionId: string): void {
    const versions = this.getVersions(annotationId)
    const index = versions.findIndex((v) => v.id === versionId)
    if (index !== -1) {
      versions.splice(index, 1)
      this.saveAllVersions(annotationId, versions)
    }
  }

  /**
   * 保存版本到存储
   */
  private static saveVersionToStorage(annotationId: string, version: AnnotationVersion): void {
    const versions = this.getVersions(annotationId)
    versions.push(version)
    this.saveAllVersions(annotationId, versions)
  }

  /**
   * 保存所有版本
   */
  private static saveAllVersions(annotationId: string, versions: AnnotationVersion[]): void {
    window.siyuan.storage.set(`${this.storageKeyPrefix}${annotationId}`, JSON.stringify(versions))
  }

  /**
   * 清除标注的所有版本
   */
  static clearVersions(annotationId: string): void {
    window.siyuan.storage.remove(`${this.storageKeyPrefix}${annotationId}`)
  }

  /**
   * 获取版本数量
   */
  static getVersionCount(annotationId: string): number {
    return this.getVersions(annotationId).length
  }

  /**
   * 获取最新版本
   */
  static getLatestVersion(annotationId: string): AnnotationVersion | null {
    const versions = this.getVersions(annotationId)
    return versions.length > 0 ? versions[versions.length - 1] : null
  }
}

/**
 * 标注导出服务
 */
export class AnnotationExportService {
  /**
   * 导出标注为 Markdown
   */
  static exportToMarkdown(
    annotation: Annotation,
    allAnnotations: Annotation[] = [],
  ): string {
    // 动态导入以避免循环依赖
    return import('../types/annotation').then(({ exportAnnotationToMarkdown }) => {
      return exportAnnotationToMarkdown(annotation, allAnnotations)
    }).catch(() => {
      // 如果导入失败，使用基础版本
      return import('../types/annotation').then(({ annotationToMarkdown }) => {
        return annotationToMarkdown(annotation)
      })
    })
  }

  /**
   * 导出多个标注为 Markdown
   */
  static exportMultipleToMarkdown(
    annotations: Annotation[],
    title?: string,
  ): string {
    let md = title ? `# ${title}\n\n` : '# 标注导出\n\n'
    md += `导出时间：${new Date().toLocaleString()}\n\n---\n\n`

    annotations.forEach((annotation, index) => {
      md += `## ${index + 1}. ${annotation.content.substring(0, 50)}${annotation.content.length > 50 ? '...' : ''}\n\n`
      md += this.exportToMarkdownSync(annotation, annotations)
      md += '\n\n---\n\n'
    })

    return md
  }

  /**
   * 同步版本导出（避免异步导入问题）
   */
  static exportToMarkdownSync(
    annotation: Annotation,
    allAnnotations: Annotation[] = [],
  ): string {
    // 直接在这里实现导出逻辑
    const { annotationToMarkdown } = require('../types/annotation')

    let md = annotationToMarkdown(annotation)

    // 添加链接
    if (annotation.links && annotation.links.length > 0) {
      md += '\n---\n**关联链接：**\n'
      annotation.links.forEach((link) => {
        const fromAnn = allAnnotations.find((a) => a.id === link.fromAnnotationId)
        const toAnn = allAnnotations.find((a) => a.id === link.toAnnotationId)
        if (fromAnn && toAnn) {
          md += `- 🔗 [${fromAnn.content}] --${link.label || '关联'}--> [${toAnn.content}]\n`
        }
      })
    }

    // 添加评论
    if (annotation.comments && annotation.comments.length > 0) {
      md += '\n---\n**评论：**\n'
      annotation.comments.forEach((comment) => {
        md += `> 💬 **${comment.author || '用户'}** 评论：${comment.content}\n`
      })
    }

    // 添加版本历史
    if (annotation.versions && annotation.versions.length > 0) {
      md += '\n---\n**版本历史：**\n'
      annotation.versions.forEach((version, index) => {
        const date = new Date(version.savedAt).toLocaleString()
        md += `- 版本 ${index + 1} (${date})\n`
      })
    }

    return md
  }

  /**
   * 导出为 HTML
   */
  static exportToHTML(annotations: Annotation[]): string {
    const { annotationToHTML } = require('../types/annotation')

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>标注导出</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .annotation { margin: 20px 0; padding: 15px; border-left: 4px solid #4f46e5; background: #f9fafb; }
    .annotation-meta { font-size: 12px; color: #6b7280; margin-top: 8px; }
    .annotation-links { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
    .annotation-comments { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>标注导出</h1>
  <p>导出时间：${new Date().toLocaleString()}</p>
`

    annotations.forEach((annotation, index) => {
      html += `  <div class="annotation">
    <div class="annotation-content">${annotationToHTML(annotation)}</div>
    <div class="annotation-meta">
      <span>📄 页码：P${annotation.page + 1}</span> |
      <span>🕐 ${new Date(annotation.createdAt).toLocaleString()}</span>
    </div>
`

      if (annotation.links && annotation.links.length > 0) {
        html += `    <div class="annotation-links">
      <strong>🔗 关联链接：</strong>
      <ul>
`
        annotation.links.forEach((link) => {
          html += `        <li>${link.label || '关联'}</li>\n`
        })
        html += `      </ul>
    </div>
`
      }

      if (annotation.comments && annotation.comments.length > 0) {
        html += `    <div class="annotation-comments">
      <strong>💬 评论：</strong>
      <ul>
`
        annotation.comments.forEach((comment) => {
          html += `        <li>${comment.content}</li>\n`
        })
        html += `      </ul>
    </div>
`
      }

      html += `  </div>
`
    })

    html += `</body>
</html>`

    return html
  }

  /**
   * 下载为文件
   */
  static downloadAsFile(content: string, filename: string, mimeType: string = 'text/markdown'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export default {
  AnnotationLinkService,
  AnnotationCommentService,
  AnnotationVersionService,
  AnnotationExportService,
}
