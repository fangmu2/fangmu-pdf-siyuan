// src/services/batchExportService.ts
/**
 * 批量导出服务
 * 支持将多个 PDF 标注导出为 Markdown、PDF、HTML、Word、Anki 格式
 */

import type { PDFAnnotation } from '../types/annotation'
import type { CropRegion } from './smartCropService'
import {

  smartCropImage,
} from './smartCropService'

/**
 * 处理带智能裁剪的图片标注
 */
async function processImageAnnotation(
  annotation: PDFAnnotation,
  smartCrop: boolean,
): Promise<{ imagePath: string, region?: CropRegion }> {
  if (!annotation.imagePath) {
    return { imagePath: '' }
  }

  if (!smartCrop) {
    return { imagePath: annotation.imagePath }
  }

  try {
    const result = await smartCropImage(annotation.imagePath, {
      threshold: 240,
      padding: 5,
    })
    return {
      imagePath: result.croppedImage,
      region: result.region,
    }
  } catch (error) {
    console.error('智能裁剪失败:', error)
    return { imagePath: annotation.imagePath }
  }
}

/**
 * 导出格式
 */
export type ExportFormat = 'markdown' | 'pdf' | 'html' | 'word' | 'anki'

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat
  /** 是否包含图片 */
  includeImages: boolean
  /** 是否包含页码 */
  includePageNumbers: boolean
  /** 是否按页分组 */
  groupByPage: boolean
  /** 是否按标签分组 */
  groupByTag: boolean
  /** 智能裁剪图片 */
  smartCrop: boolean
  /** 导出模板 */
  template?: string
  /** 文件名 */
  filename?: string
}

/**
 * 导出进度项
 */
export interface ExportProgressItem {
  id: string
  name: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean
  /** 导出内容 */
  content?: string
  /** 错误信息 */
  error?: string
  /** 导出数量 */
  count: number
}

/**
 * 按页分组标注
 */
function groupByPage(annotations: PDFAnnotation[]): Map<number, PDFAnnotation[]> {
  const grouped = new Map<number, PDFAnnotation[]>()

  for (const annotation of annotations) {
    const page = annotation.page
    if (!grouped.has(page)) {
      grouped.set(page, [])
    }
    grouped.get(page)!.push(annotation)
  }

  // 按页码排序
  const sorted = new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]))
  return sorted
}

/**
 * 按标签分组标注
 */
function groupByTag(annotations: PDFAnnotation[]): Map<string, PDFAnnotation[]> {
  const grouped = new Map<string, PDFAnnotation[]>()

  for (const annotation of annotations) {
    // 从 note 中提取标签（假设以 # 开头的为标签）
    const tags = extractTags(annotation.note)
    if (tags.length === 0) {
      // 没有标签的归为"未分类"
      const key = '未分类'
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(annotation)
    } else {
      for (const tag of tags) {
        if (!grouped.has(tag)) {
          grouped.set(tag, [])
        }
        grouped.get(tag)!.push(annotation)
      }
    }
  }

  return grouped
}

/**
 * 从文本中提取标签
 */
function extractTags(text: string): string[] {
  if (!text) return []
  const matches = text.match(/#[^\s#]+/g)
  return matches ? matches.map((tag) => tag.slice(1)) : []
}

/**
 * 格式化单个标注
 */
function formatAnnotation(annotation: PDFAnnotation, options: ExportOptions): string {
  let content = ''

  if (annotation.isImage && options.includeImages && annotation.imagePath) {
    content += `![图片摘录](${annotation.imagePath})\n`
  } else {
    // 根据级别添加 Markdown 前缀
    const prefix = annotation.level && annotation.level !== 'text'
      ? `${'#'.repeat(Number.parseInt(annotation.level.slice(1)) || 1)} `
      : '- '
    content += `${prefix}${annotation.text}\n`
  }

  // 添加笔记
  if (annotation.note) {
    content += `  > ${annotation.note}\n`
  }

  // 添加页码
  if (options.includePageNumbers) {
    content += `  > P.${annotation.page}\n`
  }

  return content
}

/**
 * 导出为 Markdown
 */
async function exportToMarkdown(
  annotations: PDFAnnotation[],
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    let content = '# PDF 摘录\n\n'
    content += `> 共 ${annotations.length} 条标注\n\n`

    if (options.groupByPage) {
      // 按页分组导出
      const grouped = groupByPage(annotations)

      for (const [page, pageAnnotations] of grouped) {
        content += `## 第 ${page} 页\n\n`

        for (const annotation of pageAnnotations) {
          // 处理智能裁剪
          if (annotation.isImage && options.includeImages && options.smartCrop) {
            const result = await processImageAnnotation(annotation, true)
            if (result.imagePath) {
              content += `![图片摘录](${result.imagePath})\n`
            }
          } else {
            content += formatAnnotation(annotation, options)
          }
          content += '\n'
        }

        content += '\n---\n\n'
      }
    } else if (options.groupByTag) {
      // 按标签分组导出
      const grouped = groupByTag(annotations)

      for (const [tag, tagAnnotations] of grouped) {
        content += `## ${tag}\n\n`

        for (const annotation of tagAnnotations) {
          // 处理智能裁剪
          if (annotation.isImage && options.includeImages && options.smartCrop) {
            const result = await processImageAnnotation(annotation, true)
            if (result.imagePath) {
              content += `![图片摘录](${result.imagePath})\n`
            }
          } else {
            content += formatAnnotation(annotation, options)
          }
          content += '\n'
        }

        content += '\n---\n\n'
      }
    } else {
      // 平铺导出
      for (const annotation of annotations) {
        // 处理智能裁剪
        if (annotation.isImage && options.includeImages && options.smartCrop) {
          const result = await processImageAnnotation(annotation, true)
          if (result.imagePath) {
            content += `![图片摘录](${result.imagePath})\n`
          }
        } else {
          content += formatAnnotation(annotation, options)
        }
        content += '\n'
      }
    }

    return {
      success: true,
      content,
      count: annotations.length,
    }
  } catch (error) {
    console.error('导出 Markdown 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      count: 0,
    }
  }
}

/**
 * 导出为 HTML
 */
async function exportToHtml(
  annotations: PDFAnnotation[],
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF 摘录</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .annotation {
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }
    .annotation.highlight { border-left-color: #f1c40f; }
    .annotation.important { border-left-color: #e74c3c; }
    .note {
      color: #7f8c8d;
      font-style: italic;
      margin-top: 8px;
      padding-left: 10px;
      border-left: 2px solid #bdc3c7;
    }
    .page-number {
      font-size: 12px;
      color: #95a5a6;
    }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    .separator { border-top: 1px dashed #bdc3c7; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>PDF 摘录</h1>
  <p>共 ${annotations.length} 条标注</p>
`

    const grouped = options.groupByPage ? groupByPage(annotations) : new Map([[0, annotations]])

    for (const [page, pageAnnotations] of grouped) {
      if (options.groupByPage) {
        html += `  <h2>第 ${page} 页</h2>\n`
      }

      for (const annotation of pageAnnotations) {
        const className = annotation.level === 'h1' || annotation.level === 'title' ? 'important' : 'highlight'
        html += `  <div class="annotation ${className}">\n`

        if (annotation.isImage && options.includeImages && annotation.imagePath) {
          html += `    <img src="${annotation.imagePath}" alt="图片摘录">\n`
        } else {
          html += `    <p>${escapeHtml(annotation.text)}</p>\n`
        }

        if (annotation.note) {
          html += `    <div class="note">${escapeHtml(annotation.note)}</div>\n`
        }

        if (options.includePageNumbers) {
          html += `    <div class="page-number">P.${annotation.page}</div>\n`
        }

        html += `  </div>\n`
      }

      if (options.groupByPage) {
        html += `  <div class="separator"></div>\n`
      }
    }

    html += `</body>\n</html>`

    return {
      success: true,
      content: html,
      count: annotations.length,
    }
  } catch (error) {
    console.error('导出 HTML 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      count: 0,
    }
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 导出为 Word (使用简单的 HTML 格式，可以保存为.doc)
 */
async function exportToWord(
  annotations: PDFAnnotation[],
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    let html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset="UTF-8">
  <title>PDF 摘录</title>
  <style>
    body { font-family: '宋体', Arial, sans-serif; line-height: 1.6; }
    h1 { color: #2c3e50; font-size: 24px; }
    h2 { color: #34495e; font-size: 18px; margin-top: 20px; }
    .annotation { background: #f5f5f5; padding: 10px; margin: 10px 0; }
    .note { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>PDF 摘录</h1>
  <p>共 ${annotations.length} 条标注</p>
`

    const grouped = options.groupByPage ? groupByPage(annotations) : new Map([[0, annotations]])

    for (const [page, pageAnnotations] of grouped) {
      if (options.groupByPage) {
        html += `  <h2>第 ${page} 页</h2>\n`
      }

      for (const annotation of pageAnnotations) {
        html += `  <div class="annotation">\n`

        if (annotation.isImage && options.includeImages && annotation.imagePath) {
          html += `    <p><img src="${annotation.imagePath}"></p>\n`
        } else {
          const prefix = annotation.level && annotation.level !== 'text'
            ? `<h${Number.parseInt(annotation.level.slice(1)) || 3}>`
            : '<p>'
          const suffix = annotation.level && annotation.level !== 'text'
            ? `</h${Number.parseInt(annotation.level.slice(1)) || 3}>`
            : '</p>'
          html += `    ${prefix}${escapeHtml(annotation.text)}${suffix}\n`
        }

        if (annotation.note) {
          html += `    <div class="note">${escapeHtml(annotation.note)}</div>\n`
        }

        if (options.includePageNumbers) {
          html += `    <p>页码：${annotation.page}</p>\n`
        }

        html += `  </div>\n`
      }
    }

    html += `</body>\n</html>`

    return {
      success: true,
      content: html,
      count: annotations.length,
    }
  } catch (error) {
    console.error('导出 Word 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      count: 0,
    }
  }
}

/**
 * 导出为 Anki 卡片
 */
async function exportToAnki(
  annotations: PDFAnnotation[],
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    let content = '#separator:tab\n#html: true\n#deck:PDF 摘录\n\n'

    for (const annotation of annotations) {
      let front = ''
      let back = ''

      // 正面：问题
      if (annotation.isImage && options.includeImages && annotation.imagePath) {
        front = `<img src="${annotation.imagePath}">`
      } else {
        // 挖空形式
        const clozedText = createCloze(annotation.text)
        front = clozedText
      }

      // 背面：答案和笔记
      if (annotation.isImage && options.includeImages && annotation.imagePath) {
        back = `<img src="${annotation.imagePath}">`
      } else {
        back = annotation.text
      }

      if (annotation.note) {
        back += `<br><br><i>${annotation.note}</i>`
      }

      if (options.includePageNumbers) {
        back += `<br><br>页码：${annotation.page}`
      }

      content += `${front}\t${back}\n`
    }

    return {
      success: true,
      content,
      count: annotations.length,
    }
  } catch (error) {
    console.error('导出 Anki 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      count: 0,
    }
  }
}

/**
 * 创建挖空文本（Anki Cloze）
 */
function createCloze(text: string): string {
  // 简单实现：挖空关键部分
  const words = text.split(' ')
  if (words.length > 3) {
    // 挖空中间的一个词
    const index = Math.floor(words.length / 2)
    words[index] = `[...`
  }
  return words.join(' ')
}

/**
 * 保存文本文件
 */
async function saveTextFile(content: string, filename: string): Promise<void> {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 批量导出标注
 */
export async function batchExportAnnotations(
  annotations: PDFAnnotation[],
  options: ExportOptions,
): Promise<ExportResult> {
  if (annotations.length === 0) {
    return {
      success: false,
      error: '没有要导出的标注',
      count: 0,
    }
  }

  let result: ExportResult

  // 根据格式选择导出方法
  switch (options.format) {
    case 'markdown':
      result = await exportToMarkdown(annotations, options)
      break
    case 'pdf':
      // TODO: 实现 PDF 导出
      return {
        success: false,
        error: 'PDF 导出暂未实现，请使用 Markdown 格式',
        count: 0,
      }
    case 'html':
      result = await exportToHtml(annotations, options)
      break
    case 'word':
      result = await exportToWord(annotations, options)
      break
    case 'anki':
      result = await exportToAnki(annotations, options)
      break
    default:
      return {
        success: false,
        error: `不支持的导出格式：${options.format}`,
        count: 0,
      }
  }

  // 如果导出成功，保存文件
  if (result.success && result.content) {
    const extMap: Record<ExportFormat, string> = {
      markdown: 'md',
      pdf: 'pdf',
      html: 'html',
      word: 'doc',
      anki: 'txt',
    }
    const ext = extMap[options.format]
    const filename = options.filename || `annotations-export-${Date.now()}.${ext}`
    await saveTextFile(result.content, filename)
  }

  return result
}

/**
 * 快速导出为 Markdown（一键导出）
 */
export async function quickExportToMarkdown(
  annotations: PDFAnnotation[],
  groupByPage = true,
): Promise<boolean> {
  const result = await batchExportAnnotations(annotations, {
    format: 'markdown',
    includeImages: true,
    includePageNumbers: true,
    groupByPage,
    groupByTag: false,
    smartCrop: false,
    filename: `annotations-${new Date().toISOString().slice(0, 10)}.md`,
  })

  if (result.success) {
    console.log(`成功导出 ${result.count} 个标注`)
    return true
  } else {
    console.error('导出失败:', result.error)
    return false
  }
}

/**
 * 复制 Markdown 到剪贴板
 */
export async function copyMarkdownToClipboard(
  annotations: PDFAnnotation[],
  groupByPage = true,
): Promise<boolean> {
  const result = await exportToMarkdown(annotations, {
    format: 'markdown',
    includeImages: true,
    includePageNumbers: true,
    groupByPage,
    groupByTag: false,
    smartCrop: false,
  })

  if (result.success && result.content) {
    try {
      await navigator.clipboard.writeText(result.content)
      console.log(`已复制 ${result.count} 个标注到剪贴板`)
      return true
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
      return false
    }
  }

  return false
}

/**
 * 导出模板管理
 */
export interface ExportTemplate {
  id: string
  name: string
  options: ExportOptions
}

const templates: ExportTemplate[] = []

/**
 * 保存为模板
 */
export function saveAsTemplate(name: string, options: ExportOptions): string {
  const id = `template-${Date.now()}`
  templates.push({
    id,
    name,
    options,
  })
  return id
}

/**
 * 获取所有模板
 */
export function getTemplates(): ExportTemplate[] {
  return [...templates]
}

/**
 * 删除模板
 */
export function deleteTemplate(id: string): boolean {
  const index = templates.findIndex((t) => t.id === id)
  if (index !== -1) {
    templates.splice(index, 1)
    return true
  }
  return false
}

export default {
  batchExportAnnotations,
  quickExportToMarkdown,
  copyMarkdownToClipboard,
  exportToMarkdown,
  exportToHtml,
  exportToWord,
  exportToAnki,
  saveAsTemplate,
  getTemplates,
  deleteTemplate,
}
