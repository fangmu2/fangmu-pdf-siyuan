// src/utils/pdf.ts
import * as pdfjsLib from "pdfjs-dist";

// 使用本地 worker（推荐）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * 从 URL 或 Blob 加载 PDF 文档
 */
export async function loadPdfDocument(source: string | Blob) {
  const loadingTask = pdfjsLib.getDocument(source as any);
  return loadingTask.promise;
}

/**
 * 渲染某一页到 canvas
 */
export async function renderPage(
  page: any,
  canvas: HTMLCanvasElement,
  viewportWidth: number
) {
  const context = canvas.getContext("2d");
  if (!context) return;

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
}
