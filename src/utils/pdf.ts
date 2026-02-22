// src/utils/pdf.ts
import * as pdfjsLib from "pdfjs-dist";

// 配置PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * PDF文档缓存
 * 避免重复加载同一个PDF
 */
const pdfCache = new Map<string, any>();

/**
 * 加载PDF文档
 */
export async function loadPdfDocument(source: string | Blob) {
  const loadingTask = pdfjsLib.getDocument(source as any);
  return loadingTask.promise;
}

/**
 * 获取或加载PDF文档（带缓存）
 */
export async function getOrLoadPdf(url: string): Promise<any> {
  if (pdfCache.has(url)) {
    return pdfCache.get(url);
  }

  const pdf = await loadPdfDocument(url);
  pdfCache.set(url, pdf);
  return pdf;
}

/**
 * 渲染PDF页面到Canvas
 * 返回 viewport 供文本层使用
 */
export async function renderPage(
  page: any,
  canvas: HTMLCanvasElement,
  viewportWidth: number
): Promise<any> {
  const context = canvas.getContext("2d");
  if (!context) return null;

  const viewport = page.getViewport({ scale: 1 });
  const scale = viewportWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(scaledViewport.width * outputScale);
  canvas.height = Math.floor(scaledViewport.height * outputScale);
  canvas.style.width = Math.floor(scaledViewport.width) + "px";
  canvas.style.height = Math.floor(scaledViewport.height) + "px";

  const transform =
    outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

  const renderContext = {
    canvasContext: context,
    viewport: scaledViewport,
    transform,
  };

  await page.render(renderContext).promise;
  return scaledViewport;
}

/**
 * 使用 PDF.js 官方 API 渲染文本层
 * 这是Koodo Reader等流畅阅读器使用的方式
 */
export async function renderTextLayer(
  page: any,
  container: HTMLElement,
  viewport: any
): Promise<void> {
  // 清空容器
  container.innerHTML = '';
  container.style.width = viewport.width + 'px';
  container.style.height = viewport.height + 'px';

  // 创建文本层容器
  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'textLayer';
  textLayerDiv.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: ${viewport.width}px;
    height: ${viewport.height}px;
  `;
  container.appendChild(textLayerDiv);

  // 尝试使用 PDF.js 官方 API
  try {
    // pdfjs-dist v5 中，TextLayer 可能需要动态导入
    const pdfjsWeb = await import('pdfjs-dist/web/pdf_viewer.mjs').catch(() => null);
    
    if (pdfjsWeb && pdfjsWeb.TextLayer) {
      const textContentSource = await page.streamTextContent();
      const textLayer = new pdfjsWeb.TextLayer({
        container: textLayerDiv,
        textContentSource: textContentSource,
        viewport: viewport,
      });
      await textLayer.render();
    } else {
      // 如果官方API不可用，使用改进的备用方案
      await renderTextLayerFallback(page, container, viewport);
    }
  } catch (e: any) {
    // 如果官方API失败，使用改进的备用方案
    console.warn('[renderTextLayer] Using fallback:', e.message);
    await renderTextLayerFallback(page, container, viewport);
  }
  
  // 缓存viewport信息供后续坐标计算使用
  (container as any)._viewport = viewport;
}

/**
 * 改进的手动文本层渲染（备用方案）
 * 使用更精确的字符级定位
 */
async function renderTextLayerFallback(
  page: any,
  container: HTMLElement,
  viewport: any
): Promise<void> {
  const textContent = await page.getTextContent();
  const defaultViewport = page.getViewport({ scale: 1 });
  const scale = viewport.scale || (viewport.width / defaultViewport.width);

  // 创建文本层容器
  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'textLayer';
  textLayerDiv.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: ${viewport.width}px;
    height: ${viewport.height}px;
  `;
  container.appendChild(textLayerDiv);

  // 逐项渲染文本 - 使用更精确的定位方式
  for (const item of textContent.items) {
    if (!('str' in item) || !item.str) continue;

    const tx = item.transform;
    
    // 创建文本容器
    const textDiv = document.createElement('span');
    textDiv.textContent = item.str;
    
    // 精确计算字体大小和位置
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
    const fontFamily = item.fontName || 'sans-serif';
    
    // PDF坐标系转换
    const x = tx[4] * scale;
    const y = viewport.height - tx[5] * scale;
    
    // 计算旋转角度
    const angle = Math.atan2(tx[1], tx[0]);
    
    textDiv.style.cssText = `
      position: absolute;
      white-space: pre;
      color: transparent;
      font-size: ${fontSize * scale}px;
      font-family: ${fontFamily};
      left: ${x}px;
      top: ${y - fontSize * scale}px;
      transform-origin: 0% 0%;
      line-height: 1;
      ${Math.abs(angle) > 0.001 ? `transform: rotate(${angle}rad);` : ''}
    `;
    
    textLayerDiv.appendChild(textDiv);
  }
}

/**
 * 从文本层 DOM 获取选中区域的 PDF 坐标
 * 使用精确的坐标转换方式
 */
export function getSelectionRect(
  textLayerContainer: HTMLElement
): [number, number, number, number] | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;

  // 查找文本层容器
  const textLayer = textLayerContainer.querySelector('.textLayer') as HTMLElement;
  if (!textLayer) {
    console.warn('[getSelectionRect] 未找到 .textLayer');
    return null;
  }

  const containerRect = textLayer.getBoundingClientRect();
  const rangeRects = range.getClientRects();

  if (rangeRects.length === 0) return null;

  // 获取缓存的 viewport 信息
  const viewport = (textLayerContainer as any)._viewport;
  if (!viewport) {
    console.warn('[getSelectionRect] 未找到 viewport 缓存');
    return null;
  }

  // viewport.scale 是 PDF单位到CSS像素的转换比例
  const scale = viewport.scale;
  if (!scale || scale <= 0) {
    console.warn('[getSelectionRect] viewport.scale 无效:', scale);
    return null;
  }
  
  // 使用 viewport.height 作为CSS坐标系参考
  // PDF坐标 = CSS坐标 / scale
  // PDF高度 = viewport.height / scale
  const cssPageHeight = viewport.height;
  const pdfPageHeight = cssPageHeight / scale;

  // 找到选中区域的边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < rangeRects.length; i++) {
    const rect = rangeRects[i];
    // 转换为相对于文本层的坐标
    const relX = rect.left - containerRect.left;
    const relY = rect.top - containerRect.top;

    minX = Math.min(minX, relX);
    minY = Math.min(minY, relY);
    maxX = Math.max(maxX, relX + rect.width);
    maxY = Math.max(maxY, relY + rect.height);
  }

  // 确保最小高度
  const height = maxY - minY;
  const minLineHeight = 14;
  if (height < minLineHeight) {
    const diff = minLineHeight - height;
    minY = Math.max(0, minY - diff / 2);
    maxY = minY + minLineHeight;
  }

  // CSS像素坐标转换为PDF坐标
  // PDF坐标 = CSS坐标 / scale
  // Y轴翻转：PDF Y = pdfPageHeight - CSS Y / scale
  const pdfX1 = minX / scale;
  const pdfX2 = maxX / scale;
  
  // 使用统一的公式：pdfY = pdfPageHeight - cssY / scale
  // pdfPageHeight = cssPageHeight / scale
  const pdfY1 = pdfPageHeight - maxY / scale;
  const pdfY2 = pdfPageHeight - minY / scale;

  return [pdfX1, pdfY1, pdfX2, pdfY2];
}

/**
 * 创建高亮覆盖元素（DOM方式，比Canvas更流畅）
 */
export function createHighlightElement(
  container: HTMLElement,
  rect: [number, number, number, number],
  viewport: any,
  options: {
    color?: string;
    opacity?: number;
    id?: string;
    onClick?: () => void;
  } = {}
): HTMLElement {
  const [pdfX1, pdfY1, pdfX2, pdfY2] = rect;
  const scale = viewport.scale || 1;
  
  // 使用 viewport.height 作为CSS坐标系参考
  const cssPageHeight = viewport.height;
  
  // PDF坐标转换为CSS坐标
  // CSS X = PDF X * scale
  // CSS Y = cssPageHeight - PDF Y * scale
  const cssX = pdfX1 * scale;
  const cssY = cssPageHeight - pdfY2 * scale;
  const cssWidth = (pdfX2 - pdfX1) * scale;
  const cssHeight = (pdfY2 - pdfY1) * scale;

  const highlight = document.createElement('div');
  highlight.className = 'highlight-element';
  highlight.style.cssText = `
    position: absolute;
    left: ${cssX}px;
    top: ${cssY}px;
    width: ${cssWidth}px;
    height: ${Math.max(cssHeight, 14)}px;
    background-color: ${options.color || 'rgba(255, 217, 61, 0.4)'};
    opacity: ${options.opacity || 1};
    border-radius: 2px;
    pointer-events: auto;
    cursor: pointer;
  `;
  
  if (options.id) {
    highlight.dataset.annotationId = options.id;
  }
  
  if (options.onClick) {
    highlight.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onClick!();
    });
  }
  
  return highlight;
}

/**
 * 根据坐标矩形高亮指定区域
 * 用于在PDF上显示标注位置
 */
export async function highlightRect(
  page: any,
  canvas: HTMLCanvasElement,
  rect: [number, number, number, number],
  color: string = 'yellow',
  opacity: number = 0.3
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const viewport = page.getViewport({ scale: 1 });
  const containerWidth = canvas.clientWidth;
  const scale = containerWidth / viewport.width;

  // 转换坐标系（PDF的y轴是从下往上，Canvas是从上往下）
  const [x1, y1, x2, y2] = rect;

  // 将PDF坐标转换为Canvas坐标
  const canvasX = x1 * scale;
  const canvasY = viewport.height - y2 * scale; // 注意y轴转换
  const canvasWidth = (x2 - x1) * scale;
  const canvasHeight = (y2 - y1) * scale;

  // 绘制高亮矩形
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = color;
  context.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);
  context.restore();
}

/**
 * 滚动到指定位置并高亮
 * 用于点击标注时定位PDF
 */
export async function scrollToAndHighlight(
  pdfDoc: any,
  pageNumber: number,
  rect: [number, number, number, number],
  canvas: HTMLCanvasElement,
  container: HTMLElement
) {
  // 1. 获取页面
  const page = await pdfDoc.getPage(pageNumber);

  // 2. 计算滚动位置
  const viewport = page.getViewport({ scale: 1 });
  const scale = canvas.clientWidth / viewport.width;

  const [x1, y1] = rect;
  const scrollY = (viewport.height - y1) * scale - container.clientHeight / 2;

  // 3. 滚动到位置
  container.scrollTo({
    top: Math.max(0, scrollY),
    behavior: 'smooth'
  });

  // 4. 高亮该区域（延迟执行，等待滚动完成）
  setTimeout(async () => {
    await highlightRect(page, canvas, rect, 'yellow', 0.5);
  }, 300);
}
