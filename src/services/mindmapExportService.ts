/**
 * 脑图导出服务
 * MarginNote 4 风格学习插件 - 支持 SVG/PDF/Markdown/OPML 导出
 */

import type {
  MindMap,
  MindMapNode,
} from '../types/mindmap'

/** 导出格式 */
export type ExportFormat = 'svg' | 'png' | 'pdf' | 'markdown' | 'opml' | 'json'

/** 导出选项 */
export interface ExportOptions {
  /** 格式 */
  format: ExportFormat
  /** 文件名（不含扩展名） */
  filename?: string
  /** 包含样式 */
  includeStyles?: boolean
  /** 图片质量（PNG 格式，0-1） */
  quality?: number
  /** PDF 页面尺寸 */
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Auto'
  /** PDF 方向 */
  orientation?: 'portrait' | 'landscape'
  /** 包含时间戳 */
  includeTimestamp?: boolean
  /** 缩放比例 */
  scale?: number
}

/** 导出结果 */
export interface ExportResult {
  /** 成功 */
  success: boolean
  /** Blob 数据 */
  blob?: Blob
  /** 文本内容 */
  text?: string
  /** 文件名 */
  filename: string
  /** MIME 类型 */
  mimeType: string
  /** 错误信息 */
  error?: string
}

/**
 * 脑图导出服务
 */
export class MindMapExportService {
  private static instance: MindMapExportService | null = null

  private constructor() {}

  static getInstance(): MindMapExportService {
    if (!MindMapExportService.instance) {
      MindMapExportService.instance = new MindMapExportService()
    }
    return MindMapExportService.instance
  }

  /**
   * 导出脑图
   */
  async export(mindMap: MindMap, svgElement: SVGSVGElement, options: ExportOptions): Promise<ExportResult> {
    const filename = this.generateFilename(options)

    try {
      switch (options.format) {
        case 'svg':
          return this.exportSvg(svgElement, filename, options)
        case 'png':
          return await this.exportPng(svgElement, filename, options)
        case 'pdf':
          return await this.exportPdf(svgElement, filename, options)
        case 'markdown':
          return this.exportMarkdown(mindMap, filename)
        case 'opml':
          return this.exportOpml(mindMap, filename)
        case 'json':
          return this.exportJson(mindMap, filename)
        default:
          return {
            success: false,
            filename,
            mimeType: '',
            error: '不支持的导出格式',
          }
      }
    } catch (error) {
      return {
        success: false,
        filename,
        mimeType: '',
        error: error instanceof Error ? error.message : '导出失败',
      }
    }
  }

  /**
   * 导出为 SVG
   */
  private exportSvg(svgElement: SVGSVGElement, filename: string, options: ExportOptions): ExportResult {
    // 克隆 SVG 元素
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

    // 添加内联样式
    if (options.includeStyles !== false) {
      this.inlineStyles(clonedSvg)
    }

    // 添加 XML 声明和命名空间
    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`

    const blob = new Blob([svgWithDeclaration], { type: 'image/svg+xml;charset=utf-8' })

    return {
      success: true,
      blob,
      filename: `${filename}.svg`,
      mimeType: 'image/svg+xml',
    }
  }

  /**
   * 导出为 PNG
   */
  private async exportPng(svgElement: SVGSVGElement, filename: string, options: ExportOptions): Promise<ExportResult> {
    const scale = options.scale || 2
    const quality = options.quality || 1

    // 获取 SVG 尺寸
    const bbox = svgElement.getBBox()
    const width = bbox.width + bbox.x
    const height = bbox.height + bbox.y

    // 克隆 SVG 并内联样式
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
    this.inlineStyles(clonedSvg)

    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({
            success: false,
            filename,
            mimeType: '',
            error: '无法创建 Canvas',
          })
          return
        }

        // 设置白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 绘制图像
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)

        URL.revokeObjectURL(svgUrl)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                success: true,
                blob,
                filename: `${filename}.png`,
                mimeType: 'image/png',
              })
            } else {
              resolve({
                success: false,
                filename,
                mimeType: '',
                error: 'PNG 生成失败',
              })
            }
          },
          'image/png',
          quality,
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        resolve({
          success: false,
          filename,
          mimeType: '',
          error: '图像加载失败',
        })
      }

      img.src = svgUrl
    })
  }

  /**
   * 导出为 PDF
   */
  private async exportPdf(svgElement: SVGSVGElement, filename: string, options: ExportOptions): Promise<ExportResult> {
    // 先生成 PNG
    const pngResult = await this.exportPng(svgElement, filename, {
      ...options,
      format: 'png',
    })
    if (!pngResult.success || !pngResult.blob) {
      return pngResult
    }

    // 使用 jspdf 生成 PDF（如果可用）
    try {
      // 动态导入 jspdf
      const { jsPDF } = await import('jspdf')

      const imgData = await this.blobToBase64(pngResult.blob)
      const img = await this.loadImage(imgData)

      const pageSize = options.pageSize || 'A4'
      const orientation = options.orientation || 'landscape'

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize === 'Auto' ? [img.width / 10, img.height / 10] : pageSize,
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // 计算缩放比例
      const scale = Math.min(pageWidth / (img.width / 10), pageHeight / (img.height / 10))
      const scaledWidth = (img.width / 10) * scale
      const scaledHeight = (img.height / 10) * scale

      // 居中放置
      const x = (pageWidth - scaledWidth) / 2
      const y = (pageHeight - scaledHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)

      const blob = pdf.output('blob')

      return {
        success: true,
        blob,
        filename: `${filename}.pdf`,
        mimeType: 'application/pdf',
      }
    } catch {
      // 如果 jspdf 不可用，返回错误
      return {
        success: false,
        filename,
        mimeType: '',
        error: 'PDF 导出需要安装 jspdf 库: npm install jspdf',
      }
    }
  }

  /**
   * 导出为 Markdown
   */
  private exportMarkdown(mindMap: MindMap, filename: string): ExportResult {
    const markdown = this.nodeToMarkdown(mindMap.root, 0)
    const content = `# ${mindMap.title || '思维导图'}\n\n导出时间: ${new Date().toLocaleString()}\n\n---\n\n${markdown}`

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })

    return {
      success: true,
      blob,
      text: content,
      filename: `${filename}.md`,
      mimeType: 'text/markdown',
    }
  }

  /**
   * 节点转 Markdown
   */
  private nodeToMarkdown(node: MindMapNode, level: number): string {
    const indent = '  '.repeat(level)
    const text = node.title || node.text || ''
    let result = `${indent}- ${text}\n`

    if (node.note) {
      result += `${indent}  - 💬 ${node.note}\n`
    }

    for (const child of node.children) {
      result += this.nodeToMarkdown(child, level + 1)
    }

    return result
  }

  /**
   * 导出为 OPML
   */
  private exportOpml(mindMap: MindMap, filename: string): ExportResult {
    const content = this.nodeToOpml(mindMap)
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8' })

    return {
      success: true,
      blob,
      text: content,
      filename: `${filename}.opml`,
      mimeType: 'application/xml',
    }
  }

  /**
   * 节点转 OPML
   */
  private nodeToOpml(mindMap: MindMap): string {
    const nodeToOutline = (node: MindMapNode, indent: number): string => {
      const prefix = '  '.repeat(indent)
      const text = (node.title || node.text || '').replace(/"/g, '"')
      let result = `${prefix}<outline text="${text}"`

      if (node.note) {
        result += ` note="${node.note.replace(/"/g, '"')}"`
      }

      if (node.children.length > 0) {
        result += '>\n'
        for (const child of node.children) {
          result += nodeToOutline(child, indent + 1)
        }
        result += `${prefix}</outline>\n`
      } else {
        result += '/>\n'
      }

      return result
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${mindMap.title || 'Mind Map'}</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
  </head>
  <body>
${nodeToOutline(mindMap.root, 2)}  </body>
</opml>`
  }

  /**
   * 导出为 JSON
   */
  private exportJson(mindMap: MindMap, filename: string): ExportResult {
    const content = JSON.stringify(mindMap, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })

    return {
      success: true,
      blob,
      text: content,
      filename: `${filename}.json`,
      mimeType: 'application/json',
    }
  }

  /**
   * 内联样式到 SVG
   */
  private inlineStyles(svgElement: SVGSVGElement): void {
    // 获取所有样式表
    const styleSheets = document.styleSheets
    let cssText = ''

    for (const sheet of styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          cssText += `${rule.cssText}\n`
        }
      } catch {
        // 忽略跨域样式表
      }
    }

    // 添加内联样式元素
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    styleElement.textContent = cssText
    svgElement.insertBefore(styleElement, svgElement.firstChild)
  }

  /**
   * 生成文件名
   */
  private generateFilename(options: ExportOptions): string {
    let filename = options.filename || 'mindmap'

    if (options.includeTimestamp !== false) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      filename = `${filename}-${timestamp}`
    }

    return filename
  }

  /**
   * Blob 转 Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 加载图片
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * 下载导出结果
   */
  download(result: ExportResult): void {
    if (!result.success || !result.blob) {
      console.error('导出失败:', result.error)
      return
    }

    const url = URL.createObjectURL(result.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 批量导出
   */
  async exportMultiple(
    mindMap: MindMap,
    svgElement: SVGSVGElement,
    formats: ExportFormat[],
  ): Promise<Map<ExportFormat, ExportResult>> {
    const results = new Map<ExportFormat, ExportResult>()

    for (const format of formats) {
      const result = await this.export(mindMap, svgElement, { format })
      results.set(format, result)
    }

    return results
  }
}

export const mindmapExportService = MindMapExportService.getInstance()
