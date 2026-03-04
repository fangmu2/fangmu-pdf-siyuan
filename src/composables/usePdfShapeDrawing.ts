// src/composables/usePdfShapeDrawing.ts
/**
 * PDF 形状绘制组合式函数
 * 处理矩形、圆形、箭头的绘制交互
 */

import { ref, reactive } from 'vue';
import type { ShapeAnnotation } from '../types/annotation';

export interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  currentShape: ShapeAnnotation | null;
}

export interface UsePdfShapeDrawingOptions {
  pdfPath: string;
  currentPage: number;
  shapeTool: 'rectangle' | 'circle' | 'arrow' | null;
  shapeColor: string;
  shapeLineWidth: number;
}

export function usePdfShapeDrawing(options: UsePdfShapeDrawingOptions) {
  const drawing = reactive<DrawingState>({
    isDrawing: false,
    startPoint: null,
    endPoint: null,
    currentShape: null,
  });

  const previewShape = ref<ShapeAnnotation | null>(null);

  /**
   * 鼠标按下 - 开始绘制
   */
  const onMouseDown = (e: MouseEvent): void => {
    if (!options.shapeTool || !e.currentTarget) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawing.isDrawing = true;
    drawing.startPoint = { x, y };
    drawing.endPoint = { x, y };

    // 创建预览形状
    previewShape.value = createInitialShape(
      options.shapeTool,
      { x, y },
      options.pdfPath,
      options.currentPage,
      options.shapeColor,
      options.shapeLineWidth
    );
  };

  /**
   * 鼠标移动 - 更新预览
   */
  const onMouseMove = (e: MouseEvent): void => {
    if (!drawing.isDrawing || !drawing.startPoint || !previewShape.value) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawing.endPoint = { x, y };
    updateShapeGeometry(previewShape.value, drawing.startPoint, { x, y });
  };

  /**
   * 鼠标释放 - 完成绘制
   */
  const onMouseUp = (): void => {
    if (!drawing.isDrawing || !previewShape.value) return;

    drawing.isDrawing = false;
    drawing.currentShape = previewShape.value;
    
    // 触发创建事件
    emitShapeCreated(previewShape.value);
    
    // 清除预览
    previewShape.value = null;
  };

  /**
   * 取消绘制
   */
  const cancelDrawing = (): void => {
    drawing.isDrawing = false;
    drawing.startPoint = null;
    drawing.endPoint = null;
    previewShape.value = null;
  };

  /**
   * 创建事件发射器
   */
  let shapeCreatedCallback: ((shape: ShapeAnnotation) => void) | null = null;
  
  const emitShapeCreated = (shape: ShapeAnnotation) => {
    if (shapeCreatedCallback) {
      shapeCreatedCallback(shape);
    }
  };

  const onShapeCreated = (callback: (shape: ShapeAnnotation) => void) => {
    shapeCreatedCallback = callback;
  };

  return {
    drawing,
    previewShape,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    cancelDrawing,
    onShapeCreated,
  };
}

/**
 * 创建初始形状
 */
function createInitialShape(
  shapeType: 'rectangle' | 'circle' | 'arrow',
  point: { x: number; y: number },
  pdfPath: string,
  page: number,
  color: string,
  lineWidth: number
): ShapeAnnotation {
  const now = Date.now();
  const baseShape: Partial<ShapeAnnotation> = {
    id: `shape_${now}_${Math.random().toString(36).substr(2, 9)}`,
    shapeType,
    color,
    lineWidth,
    opacity: 0.8,
    page,
    pdfPath,
    created: now,
    updated: now,
  };

  switch (shapeType) {
    case 'rectangle':
    case 'circle':
      return {
        ...baseShape,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      } as ShapeAnnotation;
    
    case 'arrow':
      return {
        ...baseShape,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
      } as ShapeAnnotation;
  }
}

/**
 * 更新形状几何数据
 */
function updateShapeGeometry(
  shape: ShapeAnnotation,
  start: { x: number; y: number },
  current: { x: number; y: number }
): void {
  const dx = current.x - start.x;
  const dy = current.y - start.y;

  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    // 计算矩形区域（处理负方向绘制）
    const x = dx < 0 ? current.x : start.x;
    const y = dy < 0 ? current.y : start.y;
    const width = Math.abs(dx);
    const height = Math.abs(dy);

    shape.x = x;
    shape.y = y;
    shape.width = width;
    shape.height = height;
  } else if (shape.shapeType === 'arrow') {
    // 箭头直接使用起点和终点
    shape.startX = start.x;
    shape.startY = start.y;
    shape.endX = current.x;
    shape.endY = current.y;
  }
}

/**
 * 创建形状标注对象
 * 将绘制完成的形状转换为正式标注
 */
export function finalizeShapeAnnotation(
  shape: ShapeAnnotation,
  _scale: number
): ShapeAnnotation {
  // 将 CSS 坐标转换回 PDF 坐标（如果需要）
  // 这里保持简单，假设坐标已经是 PDF 坐标
  
  // 验证形状是否有效
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    if (!shape.width || !shape.height || shape.width < 10 || shape.height < 10) {
      throw new Error('形状太小，请重新绘制');
    }
  } else if (shape.shapeType === 'arrow') {
    const dx = (shape.endX || 0) - (shape.startX || 0);
    const dy = (shape.endY || 0) - (shape.startY || 0);
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 10) {
      throw new Error('箭头太短，请重新绘制');
    }
  }

  return shape;
}

export default usePdfShapeDrawing;
