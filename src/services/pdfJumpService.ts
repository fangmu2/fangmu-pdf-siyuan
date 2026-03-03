/**
 * PDF 跳转服务
 * 实现思维导图节点到 PDF 位置的跳转功能
 */

import { postApi } from '@/api/siyuanApi'

/**
 * PDF 位置信息
 */
export interface PDFLocation {
  /** PDF 文件路径 */
  pdfPath: string
  /** 页码（从 1 开始） */
  page: number
  /** 选区坐标 [left, top, width, height] */
  rect?: [number, number, number, number]
  /** 块 ID（如果有） */
  blockId?: string
}

/**
 * 跳转到 PDF 指定位置
 * 
 * @param location PDF 位置信息
 * @returns 是否成功
 */
export async function jumpToPDF(location: PDFLocation): Promise<boolean> {
  try {
    console.log('[PDF 跳转] 开始跳转到 PDF:', location)

    // 1. 打开 PDF 文档
    const opened = await openPDFDocument(location.pdfPath)
    if (!opened) {
      console.error('[PDF 跳转] 打开 PDF 失败')
      return false
    }

    // 2. 跳转到指定页码
    await navigateToPage(location.page)

    // 3. 如果有选区，高亮显示
    if (location.rect) {
      await highlightRect(location.rect)
    }

    // 4. 如果有块 ID，定位到块
    if (location.blockId) {
      await focusBlock(location.blockId)
    }

    console.log('[PDF 跳转] 跳转成功')
    return true
  } catch (error) {
    console.error('[PDF 跳转] 跳转失败:', error)
    return false
  }
}

/**
 * 打开 PDF 文档
 */
async function openPDFDocument(pdfPath: string): Promise<boolean> {
  try {
    // 使用思源 API 打开 PDF
    // 通过跳转到 PDF 文档的第一个块来实现
    const result = await postApi<any>('/api/file/getFile', {
      path: pdfPath
    })
    
    if (result) {
      // 触发思源打开 PDF 文档
      // 通过自定义协议或事件
      window.postMessage({
        type: 'OPEN_PDF',
        path: pdfPath
      }, '*')
      return true
    }
    return false
  } catch (error) {
    console.error('[PDF 跳转] 打开文档失败:', error)
    return false
  }
}

/**
 * 跳转到指定页码
 */
async function navigateToPage(page: number): Promise<void> {
  // 发送页码跳转事件
  window.postMessage({
    type: 'PDF_GOTO_PAGE',
    page
  }, '*')
}

/**
 * 高亮指定区域
 */
async function highlightRect(rect: [number, number, number, number]): Promise<void> {
  // 发送高亮事件
  window.postMessage({
    type: 'PDF_HIGHLIGHT_RECT',
    rect
  }, '*')
}

/**
 * 聚焦到指定块
 */
async function focusBlock(blockId: string): Promise<void> {
  try {
    await postApi('/api/block/getBlock', {
      id: blockId
    })
    
    // 滚动到块位置
    window.postMessage({
      type: 'FOCUS_BLOCK',
      blockId
    }, '*')
  } catch (error) {
    console.error('[PDF 跳转] 聚焦块失败:', error)
  }
}

/**
 * 从 annotationId 查询 PDF 位置信息
 * 
 * @param annotationId 标注块 ID
 * @returns PDF 位置信息
 */
export async function queryPDFFromAnnotation(annotationId: string): Promise<PDFLocation | null> {
  try {
    console.log('[PDF 跳转查询] 开始查询 annotation:', annotationId)
    
    // 1. 调用思源 API 查询块信息
    const block = await postApi<any>('/api/block/getBlock', { id: annotationId })
    
    if (!block) {
      console.error('[PDF 跳转查询] 未找到 annotation 块:', annotationId)
      return null
    }
    
    console.log('[PDF 跳转查询] 获取到 annotation 块:', block)
    
    // 2. 检查是否有 file-annotation-ref 属性（标准 PDF 标注格式）
    const fileAnnotationRef = block.ial?.['file-annotation-ref']
    if (fileAnnotationRef) {
      const parsed = parseFileAnnotationRef(fileAnnotationRef)
      if (parsed) {
        const location: PDFLocation = {
          pdfPath: parsed.pdfPath,
          page: parsed.page,
          rect: parsed.rect,
          blockId: annotationId
        }
        console.log('[PDF 跳转查询] 从 file-annotation-ref 解析成功:', location)
        return location
      }
    }
    
    // 3. 检查自定义属性格式（兼容旧格式）
    const customPdfPath = block.ial?.['custom-annotation-pdf-path'] || block.ial?.['custom-pdf-path']
    const customPage = block.ial?.['custom-annotation-page'] || block.ial?.['custom-page']
    const customRect = block.ial?.['custom-annotation-rect'] || block.ial?.['custom-rect']
    
    if (customPdfPath && customPage) {
      const location: PDFLocation = {
        pdfPath: customPdfPath,
        page: parseInt(customPage),
        rect: customRect ? JSON.parse(customRect) : undefined,
        blockId: annotationId
      }
      console.log('[PDF 跳转查询] 从自定义属性解析成功:', location)
      return location
    }
    
    // 4. 检查 textMark 类型（NodeTextMark）
    if (block.type === 'NodeTextMark' && block.textMarkType === 'file-annotation-ref') {
      // textMark 类型的块，PDF 信息可能在 parent 或 ref 属性中
      console.log('[PDF 跳转查询] 检测到 textMark 类型，尝试从 ref 解析')
      if (block.textMarkData?.ref) {
        const parsed = parseFileAnnotationRef(block.textMarkData.ref)
        if (parsed) {
          const location: PDFLocation = {
            pdfPath: parsed.pdfPath,
            page: parsed.page,
            rect: parsed.rect,
            blockId: annotationId
          }
          console.log('[PDF 跳转查询] 从 textMarkData 解析成功:', location)
          return location
        }
      }
    }
    
    console.warn('[PDF 跳转查询] 未能从 annotation 提取 PDF 位置:', annotationId)
    return null
    
  } catch (error) {
    console.error('[PDF 跳转查询] 查询 annotation 失败:', annotationId, error)
    return null
  }
}

/**
 * 从 cardId 查询 PDF 位置信息
 * 
 * @param cardId 卡片块 ID
 * @returns PDF 位置信息
 */
export async function queryPDFFromCard(cardId: string): Promise<PDFLocation | null> {
  try {
    console.log('[PDF 跳转查询] 开始查询 card:', cardId)
    
    // 1. 调用思源 API 查询块信息
    const block = await postApi<any>('/api/block/getBlock', { id: cardId })
    
    if (!block) {
      console.error('[PDF 跳转查询] 未找到 card 块:', cardId)
      return null
    }
    
    console.log('[PDF 跳转查询] 获取到 card 块:', block)
    
    // 2. 卡片可能通过自定义属性存储 PDF 位置
    const customPdfPath = block.ial?.['custom-annotation-pdf-path'] || block.ial?.['custom-pdf-path']
    const customPage = block.ial?.['custom-annotation-page'] || block.ial?.['custom-page']
    const customRect = block.ial?.['custom-annotation-rect'] || block.ial?.['custom-rect']
    
    if (customPdfPath && customPage) {
      const location: PDFLocation = {
        pdfPath: customPdfPath,
        page: parseInt(customPage),
        rect: customRect ? JSON.parse(customRect) : undefined,
        blockId: cardId
      }
      console.log('[PDF 跳转查询] 从卡片自定义属性解析成功:', location)
      return location
    }
    
    // 3. 检查是否有 source-node-id（克隆卡片），递归查询源节点
    const sourceNodeId = block.ial?.['custom-source-node-id']
    if (sourceNodeId && sourceNodeId !== cardId) {
      console.log('[PDF 跳转查询] 检测到克隆卡片，查询源节点:', sourceNodeId)
      return await queryPDFFromAnnotation(sourceNodeId)
    }
    
    // 4. 检查是否有 file-annotation-ref（卡片直接引用 PDF）
    const fileAnnotationRef = block.ial?.['file-annotation-ref']
    if (fileAnnotationRef) {
      const parsed = parseFileAnnotationRef(fileAnnotationRef)
      if (parsed) {
        const location: PDFLocation = {
          pdfPath: parsed.pdfPath,
          page: parsed.page,
          rect: parsed.rect,
          blockId: cardId
        }
        console.log('[PDF 跳转查询] 从卡片 file-annotation-ref 解析成功:', location)
        return location
      }
    }
    
    console.warn('[PDF 跳转查询] 未能从卡片提取 PDF 位置:', cardId)
    return null
    
  } catch (error) {
    console.error('[PDF 跳转查询] 查询 card 失败:', cardId, error)
    return null
  }
}

/**
 * 解析 file-annotation-ref 字符串
 * 兼容 annotationParser.ts 的解析逻辑
 */
function parseFileAnnotationRef(ref: string): {
  pdfPath: string
  pdfName: string
  page: number
  rect: [number, number, number, number]
} | null {
  try {
    // 分离文件名和查询参数
    const [filePathPart, queryString] = ref.split('?')
    
    if (!filePathPart || !queryString) {
      return null
    }
    
    // 提取 PDF 文件名
    const pdfName = filePathPart.split('/').pop() || ''
    
    // 解析查询参数
    const params = new URLSearchParams(queryString)
    const pathParam = params.get('path')
    const pageParam = params.get('page')
    const rectParam = params.get('rect')
    
    if (!pathParam || !pageParam || !rectParam) {
      return null
    }
    
    // 解析页码
    const page = parseInt(pageParam)
    if (isNaN(page)) {
      return null
    }
    
    // 解析坐标矩形
    const rectString = decodeURIComponent(rectParam)
    const rectParts = rectString.split(',').map(s => parseFloat(s))
    
    if (rectParts.length !== 4 || rectParts.some(isNaN)) {
      return null
    }
    
    const rect: [number, number, number, number] = [
      rectParts[0], // x1
      rectParts[1], // y1
      rectParts[2], // x2
      rectParts[3]  // y2
    ]
    
    return {
      pdfName,
      pdfPath: pathParam,
      page,
      rect
    }
    
  } catch (e) {
    console.error('[parseFileAnnotationRef] 解析失败:', ref, e)
    return null
  }
}

/**
 * 从节点数据提取 PDF 位置信息
 * 
 * @param nodeData 节点数据
 * @returns PDF 位置信息
 */
export async function extractPDFLocationFromNode(nodeData: any): Promise<PDFLocation | null> {
  // 检查是否有文档引用信息
  if (nodeData.docRef) {
    return {
      pdfPath: nodeData.docRef.pdfPath || nodeData.docRef.docId,
      page: nodeData.docRef.page,
      rect: nodeData.docRef.rect,
      blockId: nodeData.cardId || nodeData.annotationId
    }
  }

  // 检查是否有 annotationId，从思源查询
  if (nodeData.annotationId) {
    const location = await queryPDFFromAnnotation(nodeData.annotationId)
    if (location) {
      return location
    }
  }

  // 检查是否有 cardId，从思源查询
  if (nodeData.cardId) {
    const location = await queryPDFFromCard(nodeData.cardId)
    if (location) {
      return location
    }
  }

  console.warn('[extractPDFLocationFromNode] 无法提取 PDF 位置:', nodeData)
  return null
}
