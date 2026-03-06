import type {
  AnnotationColor,
  AnnotationLevel,
  AnnotationType,
  PDFAnnotation,
} from '../types/annotation'
// src/utils/annotationParser.ts
import type { SiYuanBlock } from '../types/siyuan'

/**
 * 解析思源的 IAL 字符串为对象
 * IAL 格式: {: id="xxx" file-annotation-ref="..." custom-color="yellow"}
 */
function parseIAL(ialString: string | Record<string, string> | undefined): Record<string, string> {
  // 如果已经是对象，直接返回
  if (typeof ialString === 'object' && ialString !== null) {
    return ialString
  }

  // 如果是字符串，解析它
  if (typeof ialString === 'string') {
    const result: Record<string, string> = {}
    // 移除开头的 {: 和结尾的 }
    let content = ialString.trim()
    if (content.startsWith('{:')) {
      content = content.slice(2)
    }
    if (content.endsWith('}')) {
      content = content.slice(0, -1)
    }

    // 使用正则匹配 key="value" 格式
    const regex = /(\S+?)="([^"]*)"/g
    let match
    while ((match = regex.exec(content)) !== null) {
      result[match[1]] = match[2]
    }

    return result
  }

  return {}
}

/**
 * 从思源块中解析PDF标注信息
 *
 * 思源的file-annotation-ref格式示例：
 * assets/MySQL实战45讲-20260218130611-zwm9cfj.pdf?path=/data/assets/MySQL实战45讲-20260218130611-zwm9cfj.pdf&page=1&rect=102.28%2C649.52%2C307.51%2C659.52
 */
export function parseAnnotationFromBlock(
  block: SiYuanBlock,
  expectedPdfPath?: string,
): PDFAnnotation | null {
  try {
    // 1. 解析 IAL（可能是字符串或对象）
    const ial = parseIAL(block.ial)

    // 2. 从IAL中提取file-annotation-ref属性
    const fileAnnotationRef = ial['file-annotation-ref']
    if (!fileAnnotationRef) {
      return null
    }

    // 3. 解析引用字符串
    const parsed = parseFileAnnotationRef(fileAnnotationRef)
    if (!parsed) {
      return null
    }

    // 4. 如果指定了期望的PDF路径，进行过滤
    const expectedPdfName = expectedPdfPath.split('/').pop() || ''
    if (expectedPdfPath && !parsed.pdfName.includes(expectedPdfName) && !expectedPdfName.includes(parsed.pdfName)) {
      return null
    }

    // 5. 提取高亮的文本内容
    const text = block.content || ''

    // 6. 提取用户笔记、颜色、级别和标注类型
    const note = ial['custom-note'] || ''
    const color = (ial['custom-color'] as AnnotationColor) || 'yellow'
    const level = (ial['custom-level'] as AnnotationLevel) || 'text'
    const annotationType = (ial['custom-annotation-type'] as AnnotationType) || 'highlight'

    // 7. 构建标注对象
    const annotation: PDFAnnotation = {
      id: `ann-${block.id}`,
      blockId: block.id,
      pdfPath: parsed.pdfPath,
      pdfName: parsed.pdfName,
      page: parsed.page,
      rect: parsed.rect,
      text,
      note,
      color,
      level,
      type: annotationType, // 新增标注类型
      created: ial.created ? Number.parseInt(ial.created) : Date.now(),
      updated: ial['custom-updated']
        ? Number.parseInt(ial['custom-updated'])
        : Date.now(),
      boxId: ial.box,
      rootId: ial['root-id'],
      parentHPath: ial.hpath,
    }

    return annotation

  } catch (e) {
    console.error('解析标注块失败:', block.id, e)
    return null
  }
}

/**
 * 解析file-annotation-ref字符串
 *
 * 示例输入：
 * assets/MySQL实战45讲-20260218130611-zwm9cfj.pdf?path=/data/assets/MySQL实战45讲-20260218130611-zwm9cfj.pdf&page=1&rect=102.28%2C649.52%2C307.51%2C659.52
 *
 * 输出：
 * {
 *   pdfName: "MySQL实战45讲-20260218130611-zwm9cfj.pdf",
 *   pdfPath: "/data/assets/MySQL实战45讲-20260218130611-zwm9cfj.pdf",
 *   page: 1,
 *   rect: [102.28, 649.52, 307.51, 659.52]
 * }
 */
function parseFileAnnotationRef(ref: string): {
  pdfName: string
  pdfPath: string
  page: number
  rect: [number, number, number, number]
} | null {
  try {
    // 1. 分离文件名和查询参数
    const [filePathPart, queryString] = ref.split('?')

    if (!filePathPart || !queryString) {
      return null
    }

    // 2. 提取PDF文件名
    const pdfName = filePathPart.split('/').pop() || ''

    // 3. 解析查询参数
    const params = new URLSearchParams(queryString)

    const pathParam = params.get('path')
    const pageParam = params.get('page')
    const rectParam = params.get('rect')

    if (!pathParam || !pageParam || !rectParam) {
      return null
    }

    // 4. 解析页码
    const page = Number.parseInt(pageParam)
    if (isNaN(page)) {
      return null
    }

    // 5. 解析坐标矩形
    // rect格式: "102.28,649.52,307.51,659.52" 或 URL编码后的
    const rectString = decodeURIComponent(rectParam)
    const rectParts = rectString.split(',').map((s) => Number.parseFloat(s))

    if (rectParts.length !== 4 || rectParts.some(isNaN)) {
      return null
    }

    const rect: [number, number, number, number] = [
      rectParts[0], // x1
      rectParts[1], // y1
      rectParts[2], // x2
      rectParts[3], // y2
    ]

    return {
      pdfName,
      pdfPath: pathParam,
      page,
      rect,
    }

  } catch (e) {
    console.error('解析file-annotation-ref失败:', ref, e)
    return null
  }
}

/**
 * 将标注数据转换回思源的file-annotation-ref格式
 */
export function toFileAnnotationRef(annotation: PDFAnnotation): string {
  const rectString = annotation.rect.join(',')
  return `assets/${annotation.pdfName}?path=${annotation.pdfPath}&page=${annotation.page}&rect=${encodeURIComponent(rectString)}`
}
