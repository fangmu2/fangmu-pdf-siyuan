import type {
  AnnotationColor,
  AnnotationComment,
  AnnotationLevel,
  AnnotationStats,
  AnnotationType,
  CommentPriority,
  CommentStatus,
  PDFAnnotation,
} from '../types/annotation'
import type { SiYuanBlock } from '../types/siyuan'
import { parseAnnotationFromBlock } from '../utils/annotationParser'
// src/api/annotationApi.ts
import { postApi } from './siyuanApi'

/**
 * 从完整PDF路径中提取基础文件名（去掉时间戳-hash后缀）
 * 例如: "MySQL实战45讲-20260218130611-zwm9cfj.pdf" -> "MySQL实战45讲"
 */
function extractBasePdfName(fullName: string): string {
  // 移除 .pdf 后缀
  let name = fullName.replace(/\.pdf$/i, '')
  // 移除思源添加的时间戳-hash后缀 (格式: -20260218130611-zwm9cfj)
  name = name.replace(/-\d{14}-[a-z0-9]+$/i, '')
  return name
}

/**
 * 查询指定PDF文件的所有标注块
 */
export async function getAnnotationsForPdf(pdfPath: string): Promise<PDFAnnotation[]> {
  const pdfName = pdfPath.split('/').pop() || ''
  const baseName = extractBasePdfName(pdfName)

  // 使用基础名称进行模糊匹配
  const sql = `
    SELECT * FROM blocks
    WHERE ial LIKE '%file-annotation-ref%'
    AND ial LIKE '%${baseName}%'
    ORDER BY created DESC
    LIMIT 100
  `

  const blocks = await postApi<SiYuanBlock[]>('/api/query/sql', { stmt: sql })

  const annotations: PDFAnnotation[] = []

  for (const block of blocks || []) {
    try {
      const annotation = parseAnnotationFromBlock(block, pdfPath)
      if (annotation) {
        annotations.push(annotation)
      }
    } catch (e) {
      console.warn('解析标注块失败:', block.id, e)
    }
  }

  return annotations
}

/**
 * 查询当前文档下的所有PDF标注
 */
export async function getAnnotationsInDocument(docId: string): Promise<PDFAnnotation[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE ial LIKE '%file-annotation-ref%'
    AND root_id = '${docId}'
    ORDER BY created DESC
  `

  const blocks = await postApi<SiYuanBlock[]>('/api/query/sql', { stmt: sql })

  const annotations: PDFAnnotation[] = []
  for (const block of blocks || []) {
    try {
      const annotation = parseAnnotationFromBlock(block)
      if (annotation) {
        annotations.push(annotation)
      }
    } catch (e) {
      console.warn('解析标注块失败:', block.id, e)
    }
  }

  return annotations
}

/**
 * 查询所有PDF标注（跨笔记本）
 */
export async function getAllPdfAnnotations(): Promise<PDFAnnotation[]> {
  const sql = `
    SELECT * FROM blocks
    WHERE ial LIKE '%file-annotation-ref%'
    ORDER BY created DESC
    LIMIT 1000
  `

  const blocks = await postApi<SiYuanBlock[]>('/api/query/sql', { stmt: sql })

  const annotations: PDFAnnotation[] = []
  for (const block of blocks || []) {
    try {
      const annotation = parseAnnotationFromBlock(block)
      if (annotation) {
        annotations.push(annotation)
      }
    } catch (e) {
      console.warn('解析标注块失败:', block.id, e)
    }
  }

  return annotations
}

/**
 * 创建新的PDF标注
 * 根据标注级别生成不同格式的 Markdown
 */
export async function createAnnotation(options: {
  text: string
  pdfPath: string
  pdfName: string
  page: number
  rect: [number, number, number, number]
  color?: AnnotationColor
  level?: AnnotationLevel
  note?: string
  docId?: string
  isImage?: boolean
  imagePath?: string
  annotationType?: AnnotationType // 新增标注类型参数
}): Promise<string> {
  const level = options.level || 'text'

  // 构建 file-annotation-ref 字符串
  const rectString = options.rect.join(',')
  const fileAnnotationRef = `assets/${options.pdfName}?path=${options.pdfPath}&page=${options.page}&rect=${encodeURIComponent(rectString)}`

  // 根据标注级别构建不同格式的 Markdown
  let markdown = ''

  // 如果是图片摘录，优先使用图片格式
  if (options.isImage && options.imagePath) {
    // 图片摘录 - 直接显示图片
    // 图片路径应该是 assets/xxx.png 格式，用于Markdown引用
    const imagePath = options.imagePath.startsWith('/data/')
      ? options.imagePath.slice(6)
      : options.imagePath
    const imageMarkdown = `![PDF截图](${imagePath})`

    switch (level) {
      case 'title':
        markdown = `${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'h1':
        markdown = `# PDF截图\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'h2':
        markdown = `## PDF截图\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'h3':
        markdown = `### PDF截图\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'h4':
        markdown = `#### PDF截图\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'h5':
        markdown = `##### PDF截图\n${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
      case 'text':
      default:
        markdown = `${imageMarkdown}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}" custom-image="true"`
        break
    }
  } else {
    // 文字摘录
    switch (level) {
      case 'title':
        // 文档标题 - 使用 action 标记，思源会将其转为文档标题
        markdown = `${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'h1':
        markdown = `# ${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'h2':
        markdown = `## ${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'h3':
        markdown = `### ${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'h4':
        markdown = `#### ${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'h5':
        markdown = `##### ${options.text}\n{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
      case 'text':
      default:
        // 正文标注 - 加粗高亮
        markdown = `**${options.text}**{: file-annotation-ref="${fileAnnotationRef}" custom-level="${level}"`
        break
    }
  }

  if (options.color) {
    markdown += ` custom-color="${options.color}"`
  }

  if (options.annotationType && options.annotationType !== 'highlight') {
    markdown += ` custom-annotation-type="${options.annotationType}"`
  }

  if (options.note) {
    markdown += ` custom-note="${options.note}"`
  }

  markdown += ` }`

  // 获取当前文档ID
  let docId = options.docId
  if (!docId) {
    // 方法1: 通过 SQL 查询最近编辑的文档
    try {
      const recentDocs = await postApi<{ root_id: string }[]>('/api/query/sql', {
        stmt: `SELECT root_id FROM blocks WHERE type = 'd' ORDER BY updated DESC LIMIT 1`,
      })
      if (recentDocs && recentDocs.length > 0 && recentDocs[0].root_id) {
        docId = recentDocs[0].root_id
      }
    } catch (e) {
      console.warn('通过 SQL 获取最近文档失败:', e)
    }

    // 方法2: 尝试 getCurrentDoc API（可能失败）
    if (!docId) {
      try {
        const currentDoc = await postApi<{ id: string, rootID?: string } | null>('/api/editor/getCurrentDoc', {})
        if (currentDoc && (currentDoc.id || currentDoc.rootID)) {
          docId = currentDoc.rootID || currentDoc.id
        }
      } catch (e) {
        // 这个 API 可能返回空响应，忽略错误
        console.warn('通过 getCurrentDoc 获取当前文档失败（可忽略）:', e)
      }
    }
  }

  if (!docId) {
    throw new Error('无法确定目标文档，请先在思源中打开一个文档')
  }

  // 使用 appendBlock 在文档末尾追加块
  const result = await postApi<{ doOperations?: Array<{ action: string, id: string }>, id?: string }[]>('/api/block/appendBlock', {
    dataType: 'markdown',
    data: markdown,
    parentID: docId,
  })

  let blockId: string | undefined
  if (Array.isArray(result) && result.length > 0) {
    const ops = result[0]?.doOperations
    if (ops && ops.length > 0) {
      blockId = ops[0]?.id
    }
  }

  if (!blockId) {
    throw new Error('创建标注块失败，请检查 API 返回值')
  }

  return blockId
}

/**
 * 更新标注块的笔记内容
 */
export async function updateAnnotationNote(
  blockId: string,
  note: string,
): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      'custom-note': note,
      'custom-updated': Date.now().toString(),
    },
  })
}

/**
 * 更新标注的颜色
 */
export async function updateAnnotationColor(
  blockId: string,
  color: AnnotationColor,
): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      'custom-color': color,
      'custom-updated': Date.now().toString(),
    },
  })
}

/**
 * 更新标注的类型
 */
export async function updateAnnotationType(
  blockId: string,
  annotationType: AnnotationType,
): Promise<void> {
  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      'custom-annotation-type': annotationType,
      'custom-updated': Date.now().toString(),
    },
  })
}

/**
 * 删除标注块
 */
export async function deleteAnnotation(blockId: string): Promise<void> {
  await postApi('/api/block/deleteBlock', {
    id: blockId,
  })
}

/**
 * 获取标注统计信息
 */
export function getAnnotationStats(annotations: PDFAnnotation[]): AnnotationStats {
  const stats: AnnotationStats = {
    total: annotations.length,
    byColor: {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      purple: 0,
    },
    byPage: {},
  }

  for (const ann of annotations) {
    stats.byColor[ann.color]++
    stats.byPage[ann.page] = (stats.byPage[ann.page] || 0) + 1
  }

  return stats
}

/** 批注存储属性名 */
const COMMENTS_ATTR_NAME = 'custom-comments'

/** 生成唯一 ID */
const generateCommentId = (): string => {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 获取标注的所有批注
 */
export async function getAnnotationComments(blockId: string): Promise<AnnotationComment[]> {
  try {
    const result = await postApi<{ [key: string]: string }>(
      '/api/attr/getBlockAttrs',
      { id: blockId },
    )

    const commentsJson = result?.[COMMENTS_ATTR_NAME]
    if (!commentsJson) {
      return []
    }

    return JSON.parse(commentsJson) as AnnotationComment[]
  } catch (error) {
    console.error('获取批注失败:', error)
    return []
  }
}

/**
 * 添加批注
 */
export async function addAnnotationComment(
  blockId: string,
  params: {
    text: string
    type?: 'text' | 'voice' | 'image'
    priority?: CommentPriority
    tags?: string[]
    voiceData?: AnnotationComment['voiceData']
    imageData?: AnnotationComment['imageData']
  },
): Promise<AnnotationComment> {
  const comments = await getAnnotationComments(blockId)

  const now = Date.now()
  const newComment: AnnotationComment = {
    id: generateCommentId(),
    type: params.type || 'text',
    text: params.text,
    createdAt: now,
    updatedAt: now,
    priority: params.priority || 'normal',
    status: 'active',
    tags: params.tags || [],
    voiceData: params.voiceData,
    imageData: params.imageData,
  }

  comments.push(newComment)

  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [COMMENTS_ATTR_NAME]: JSON.stringify(comments),
      'custom-updated': now.toString(),
    },
  })

  return newComment
}

/**
 * 更新批注
 */
export async function updateAnnotationComment(
  blockId: string,
  commentId: string,
  params: {
    text?: string
    priority?: CommentPriority
    status?: CommentStatus
    tags?: string[]
  },
): Promise<AnnotationComment | null> {
  const comments = await getAnnotationComments(blockId)
  const index = comments.findIndex((c) => c.id === commentId)

  if (index === -1) {
    return null
  }

  const now = Date.now()
  comments[index] = {
    ...comments[index],
    ...params,
    updatedAt: now,
  }

  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [COMMENTS_ATTR_NAME]: JSON.stringify(comments),
      'custom-updated': now.toString(),
    },
  })

  return comments[index]
}

/**
 * 删除批注
 */
export async function deleteAnnotationComment(
  blockId: string,
  commentId: string,
): Promise<boolean> {
  const comments = await getAnnotationComments(blockId)
  const index = comments.findIndex((c) => c.id === commentId)

  if (index === -1) {
    return false
  }

  comments.splice(index, 1)

  await postApi('/api/attr/setBlockAttrs', {
    id: blockId,
    attrs: {
      [COMMENTS_ATTR_NAME]: comments.length > 0 ? JSON.stringify(comments) : '',
      'custom-updated': Date.now().toString(),
    },
  })

  return true
}

/**
 * 更新批注状态
 */
export async function updateCommentStatus(
  blockId: string,
  commentId: string,
  status: CommentStatus,
): Promise<AnnotationComment | null> {
  return updateAnnotationComment(blockId, commentId, { status })
}

// ============ 思维导图节点标签 API ============

/**
 * 更新思维导图节点标签
 * @param blockId 块 ID
 * @param tags 标签列表
 */
export async function updateMindMapNodeTags(
  blockId: string,
  tags: string[],
): Promise<boolean> {
  try {
    await postApi('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs: {
        'custom-node-tags': JSON.stringify(tags),
        'custom-updated': Date.now().toString(),
      },
    })
    return true
  } catch (error) {
    console.error('[updateMindMapNodeTags] 更新标签失败:', error)
    return false
  }
}

/**
 * 从思源块属性中解析标签
 * @param block 思源块
 * @returns 标签列表
 */
export function parseNodeTagsFromBlock(block: any): string[] {
  try {
    if (block.custom_node_tags) {
      return JSON.parse(block.custom_node_tags)
    }
  } catch (e) {
    console.warn('[parseNodeTagsFromBlock] 解析标签失败:', e)
  }
  return []
}
