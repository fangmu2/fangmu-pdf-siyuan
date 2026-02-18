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
 * 渲染文本层（支持文本选择）
 * 使用 PDF.js 的 textContent 准确渲染
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

  // 获取文本内容
  const textContent = await page.getTextContent();

  // 获取原始 viewport（未缩放）用于计算缩放比例
  const defaultViewport = page.getViewport({ scale: 1 });
  const scale = viewport.scale || (viewport.width / defaultViewport.width);

  // 存储文本项信息，用于后续获取坐标
  const textItems: any[] = [];

  // 逐项渲染文本
  for (const item of textContent.items) {
    if (!('str' in item) || !item.str) continue;

    const tx = item.transform;
    
    // 计算字体大小（考虑缩放）
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * scale;
    const fontFamily = item.fontName || 'sans-serif';
    
    // 计算位置（PDF 坐标系转换为 CSS 坐标系，并应用缩放）
    const x = tx[4] * scale;
    const y = viewport.height - tx[5] * scale;
    
    // 存储文本项信息
    textItems.push({
      str: item.str,
      transform: tx,
      x: tx[4],
      y: tx[5],
      width: item.width,
      height: fontSize / scale
    });

    // 创建文本 span
    const span = document.createElement('span');
    span.textContent = item.str;
    span.style.cssText = `
      position: absolute;
      white-space: pre;
      color: transparent;
      font-size: ${fontSize}px;
      font-family: ${fontFamily};
      left: ${x}px;
      top: ${y - fontSize}px;
      transform-origin: 0 0;
      line-height: 1;
    `;

    // 处理旋转
    const angle = Math.atan2(tx[1], tx[0]);
    if (Math.abs(angle) > 0.001) {
      span.style.transform = `rotate(${angle}rad)`;
    }

    container.appendChild(span);
  }

  // 存储文本项信息到容器上，方便后续获取
  (container as any)._textItems = textItems;
  (container as any)._scale = scale;
  (container as any)._viewportHeight = viewport.height;
}

/**
 * 从文本层 DOM 获取选中区域的 PDF 坐标
 */
export function getSelectionRect(
  textLayerContainer: HTMLElement
): [number, number, number, number] | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;

  // 获取选中区域相对于文本层容器的边界
  const containerRect = textLayerContainer.getBoundingClientRect();
  const rangeRects = range.getClientRects();

  if (rangeRects.length === 0) return null;

  // 获取文本项信息和缩放比例
  const textItems = (textLayerContainer as any)._textItems || [];
  const scale = (textLayerContainer as any)._scale || 1;
  const viewportHeight = (textLayerContainer as any)._viewportHeight || textLayerContainer.clientHeight;

  // 找到选中区域的边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < rangeRects.length; i++) {
    const rect = rangeRects[i];
    // 转换为相对于容器的坐标
    const relX = rect.left - containerRect.left;
    const relY = rect.top - containerRect.top;
    
    minX = Math.min(minX, relX);
    minY = Math.min(minY, relY);
    maxX = Math.max(maxX, relX + rect.width);
    maxY = Math.max(maxY, relY + rect.height);
  }

  // 转换回 PDF 坐标系
  const pdfX1 = minX / scale;
  const pdfY1 = viewportHeight / scale - maxY / scale;
  const pdfX2 = maxX / scale;
  const pdfY2 = viewportHeight / scale - minY / scale;

  return [pdfX1, pdfY1, pdfX2, pdfY2];
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
