// src/services/pdfShapeRenderer.ts
/**
 * PDF 形状标注渲染服务
 * 负责在 SVG 层上渲染矩形、圆形、箭头等形状标注
 */

import type { ShapeAnnotation, ResizeHandle } from '../types/annotation';

/**
 * 形状配置
 */
export interface ShapeConfig {
  color: string;
  lineWidth: number;
  opacity: number;
  isSelected: boolean;
}

/**
 * 默认形状配置
 */
const DEFAULT_SHAPE_CONFIG: ShapeConfig = {
  color: '#ef4444',
  lineWidth: 2,
  opacity: 0.8,
  isSelected: false,
};

/**
 * 渲染形状标注到 SVG 容器
 * @param shape 形状标注数据
 * @param svgElement SVG 容器元素
 * @param scale PDF 缩放比例
 * @param cssPageHeight CSS 页面高度
 */
export function renderShapeToSvg(
  shape: ShapeAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number
): void {
  const config: ShapeConfig = {
    color: shape.color || DEFAULT_SHAPE_CONFIG.color,
    lineWidth: shape.lineWidth || DEFAULT_SHAPE_CONFIG.lineWidth,
    opacity: shape.opacity ?? DEFAULT_SHAPE_CONFIG.opacity,
    isSelected: shape.isSelected ?? false,
  };

  // 清除旧的渲染内容
  svgElement.innerHTML = '';
  svgElement.style.position = 'absolute';
  svgElement.style.left = '0';
  svgElement.style.top = '0';
  svgElement.style.width = '100%';
  svgElement.style.height = '100%';
  svgElement.style.pointerEvents = 'none';
  svgElement.style.overflow = 'visible';

  // 根据形状类型选择渲染方式
  switch (shape.shapeType) {
    case 'rectangle':
      renderRectangle(shape, svgElement, scale, cssPageHeight, config);
      break;
    case 'circle':
      renderCircle(shape, svgElement, scale, cssPageHeight, config);
      break;
    case 'arrow':
      renderArrow(shape, svgElement, scale, cssPageHeight, config);
      break;
  }

  // 如果选中，添加控制点
  if (config.isSelected) {
    renderResizeHandles(shape, svgElement, scale, cssPageHeight);
  }
}

/**
 * 渲染矩形
 */
function renderRectangle(
  shape: ShapeAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number,
  config: ShapeConfig
): void {
  if (!shape.x || !shape.y || !shape.width || !shape.height) return;

  // PDF 坐标转 CSS 坐标
  const cssX = shape.x * scale;
  const cssY = cssPageHeight - shape.y * scale - shape.height * scale;
  const cssWidth = shape.width * scale;
  const cssHeight = shape.height * scale;

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', cssX.toString());
  rect.setAttribute('y', cssY.toString());
  rect.setAttribute('width', cssWidth.toString());
  rect.setAttribute('height', cssHeight.toString());
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', config.color);
  rect.setAttribute('stroke-width', config.lineWidth.toString());
  rect.setAttribute('stroke-opacity', config.opacity.toString());
  rect.style.pointerEvents = 'auto';

  svgElement.appendChild(rect);
}

/**
 * 渲染圆形
 */
function renderCircle(
  shape: ShapeAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number,
  config: ShapeConfig
): void {
  if (!shape.x || !shape.y || !shape.width || !shape.height) return;

  // PDF 坐标转 CSS 坐标
  const cssX = shape.x * scale;
  const cssY = cssPageHeight - shape.y * scale - shape.height * scale;
  const cssWidth = shape.width * scale;
  const cssHeight = shape.height * scale;

  // 计算圆心和半径
  const cx = cssX + cssWidth / 2;
  const cy = cssY + cssHeight / 2;
  const rx = Math.abs(cssWidth) / 2;
  const ry = Math.abs(cssHeight) / 2;

  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('cx', cx.toString());
  ellipse.setAttribute('cy', cy.toString());
  ellipse.setAttribute('rx', rx.toString());
  ellipse.setAttribute('ry', ry.toString());
  ellipse.setAttribute('fill', 'none');
  ellipse.setAttribute('stroke', config.color);
  ellipse.setAttribute('stroke-width', config.lineWidth.toString());
  ellipse.setAttribute('stroke-opacity', config.opacity.toString());
  ellipse.style.pointerEvents = 'auto';

  svgElement.appendChild(ellipse);
}

/**
 * 渲染箭头
 */
function renderArrow(
  shape: ShapeAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number,
  config: ShapeConfig
): void {
  if (!shape.startX || !shape.startY || !shape.endX || !shape.endY) return;

  // PDF 坐标转 CSS 坐标（Y 轴翻转）
  const startX = shape.startX * scale;
  const startY = cssPageHeight - shape.startY * scale;
  const endX = shape.endX * scale;
  const endY = cssPageHeight - shape.endY * scale;

  // 计算箭头路径
  const headLength = 12; // 箭头长度
  const headAngle = Math.PI / 6; // 箭头角度 30 度

  // 计算箭头方向
  const angle = Math.atan2(endY - startY, endX - startX);

  // 箭头主体线段
  const linePath = `M ${startX} ${startY} L ${endX} ${endY}`;

  // 箭头三角形
  const arrowHeadPath = `
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle - headAngle)} ${endY - headLength * Math.sin(angle - headAngle)}
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle + headAngle)} ${endY - headLength * Math.sin(angle + headAngle)}
  `;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `${linePath} ${arrowHeadPath}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', config.color);
  path.setAttribute('stroke-width', config.lineWidth.toString());
  path.setAttribute('stroke-opacity', config.opacity.toString());
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.pointerEvents = 'auto';

  svgElement.appendChild(path);
}

/**
 * 渲染调整大小的控制点
 */
function renderResizeHandles(
  shape: ShapeAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number
): void {
  const handleSize = 8; // 控制点大小
  const handleColor = '#3b82f6';
  const handleBorderColor = '#ffffff';

  // 获取控制点位置
  const handles = getResizeHandles(shape, scale, cssPageHeight);

  handles.forEach((handle) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.dataset.handleType = handle.type;
    group.style.pointerEvents = 'auto';
    group.style.cursor = getCursorForHandle(handle.type);

    // 控制点外框（白色）
    const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outerRect.setAttribute('x', (handle.x - handleSize / 2 - 1).toString());
    outerRect.setAttribute('y', (handle.y - handleSize / 2 - 1).toString());
    outerRect.setAttribute('width', (handleSize + 2).toString());
    outerRect.setAttribute('height', (handleSize + 2).toString());
    outerRect.setAttribute('fill', handleBorderColor);
    outerRect.setAttribute('stroke', 'rgba(0,0,0,0.2)');
    outerRect.setAttribute('stroke-width', '1');
    outerRect.setAttribute('rx', '2');

    // 控制点内部（蓝色）
    const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    innerRect.setAttribute('x', (handle.x - handleSize / 2).toString());
    innerRect.setAttribute('y', (handle.y - handleSize / 2).toString());
    innerRect.setAttribute('width', handleSize.toString());
    innerRect.setAttribute('height', handleSize.toString());
    innerRect.setAttribute('fill', handleColor);
    innerRect.setAttribute('rx', '1.5');

    group.appendChild(outerRect);
    group.appendChild(innerRect);
    svgElement.appendChild(group);
  });
}

/**
 * 获取所有控制点位置
 */
function getResizeHandles(
  shape: ShapeAnnotation,
  scale: number,
  cssPageHeight: number
): Array<{ type: ResizeHandle; x: number; y: number }> {
  const handles: Array<{ type: ResizeHandle; x: number; y: number }> = [];

  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    if (!shape.x || !shape.y || !shape.width || !shape.height) return handles;

    // PDF 坐标转 CSS 坐标
    const cssX = shape.x * scale;
    const cssY = cssPageHeight - shape.y * scale - shape.height * scale;
    const cssWidth = shape.width * scale;
    const cssHeight = shape.height * scale;

    // 8 个控制点位置
    handles.push(
      { type: 'nw', x: cssX, y: cssY }, // 左上
      { type: 'n', x: cssX + cssWidth / 2, y: cssY }, // 上中
      { type: 'ne', x: cssX + cssWidth, y: cssY }, // 右上
      { type: 'e', x: cssX + cssWidth, y: cssY + cssHeight / 2 }, // 右中
      { type: 'se', x: cssX + cssWidth, y: cssY + cssHeight }, // 右下
      { type: 's', x: cssX + cssWidth / 2, y: cssY + cssHeight }, // 下中
      { type: 'sw', x: cssX, y: cssY + cssHeight }, // 左下
      { type: 'w', x: cssX, y: cssY + cssHeight / 2 } // 左中
    );
  } else if (shape.shapeType === 'arrow') {
    if (!shape.startX || !shape.startY || !shape.endX || !shape.endY) return handles;

    // 箭头的控制点：起点和终点
    const startX = shape.startX * scale;
    const startY = cssPageHeight - shape.startY * scale;
    const endX = shape.endX * scale;
    const endY = cssPageHeight - shape.endY * scale;

    handles.push(
      { type: 'nw', x: startX, y: startY }, // 起点
      { type: 'se', x: endX, y: endY } // 终点
    );
  }

  return handles;
}

/**
 * 根据控制点类型获取光标样式
 */
function getCursorForHandle(handleType: ResizeHandle): string {
  const cursorMap: Record<ResizeHandle, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
  };
  return cursorMap[handleType] || 'move';
}

/**
 * 处理控制点拖拽调整
 */
export function handleResize(
  shape: ShapeAnnotation,
  handleType: ResizeHandle,
  dx: number,
  dy: number,
  _scale: number
): void {
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    handleRectResize(shape, handleType, dx, dy);
  } else if (shape.shapeType === 'arrow') {
    handleArrowResize(shape, handleType, dx, dy);
  }
}

/**
 * 处理矩形/圆形调整
 */
function handleRectResize(
  shape: ShapeAnnotation,
  handleType: ResizeHandle,
  dx: number,
  dy: number
): void {
  if (!shape.x || !shape.y || !shape.width || !shape.height) return;

  const minSize = 10; // 最小尺寸

  switch (handleType) {
    case 'nw': // 左上
      shape.x = shape.x + dx;
      shape.y = shape.y + dy;
      shape.width = Math.max(shape.width - dx, minSize);
      shape.height = Math.max(shape.height - dy, minSize);
      break;

    case 'n': // 上中
      shape.y = shape.y + dy;
      shape.height = Math.max(shape.height - dy, minSize);
      break;

    case 'ne': // 右上
      shape.y = shape.y + dy;
      shape.width = Math.max(shape.width + dx, minSize);
      shape.height = Math.max(shape.height - dy, minSize);
      break;

    case 'e': // 右中
      shape.width = Math.max(shape.width + dx, minSize);
      break;

    case 'se': // 右下
      shape.width = Math.max(shape.width + dx, minSize);
      shape.height = Math.max(shape.height + dy, minSize);
      break;

    case 's': // 下中
      shape.height = Math.max(shape.height + dy, minSize);
      break;

    case 'sw': // 左下
      shape.x = shape.x + dx;
      shape.width = Math.max(shape.width - dx, minSize);
      shape.height = Math.max(shape.height + dy, minSize);
      break;

    case 'w': // 左中
      shape.x = shape.x + dx;
      shape.width = Math.max(shape.width - dx, minSize);
      break;
  }

  shape.updated = Date.now();
}

/**
 * 处理箭头调整
 */
function handleArrowResize(
  shape: ShapeAnnotation,
  handleType: ResizeHandle,
  dx: number,
  dy: number
): void {
  // 箭头只有起点和终点两个控制点
  if (handleType === 'nw') {
    // 调整起点
    if (shape.startX !== undefined) shape.startX += dx;
    if (shape.startY !== undefined) shape.startY += dy;
  } else if (handleType === 'se') {
    // 调整终点
    if (shape.endX !== undefined) shape.endX += dx;
    if (shape.endY !== undefined) shape.endY += dy;
  }

  shape.updated = Date.now();
}

/**
 * 批量渲染形状标注
 */
export function renderShapesToSvg(
  shapes: ShapeAnnotation[],
  container: SVGSVGElement,
  scale: number,
  cssPageHeight: number
): void {
  container.innerHTML = '';

  shapes.forEach(shape => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.dataset.shapeId = shape.id;
    group.dataset.shapeType = shape.shapeType;

    // 创建临时 SVG 渲染单个形状
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    renderShapeToSvg(shape, tempSvg, scale, cssPageHeight);

    // 移动内容到 group
    while (tempSvg.firstChild) {
      group.appendChild(tempSvg.firstChild);
    }

    container.appendChild(group);
  });
}

export default {
  renderShapeToSvg,
  renderShapesToSvg,
  handleResize,
  DEFAULT_SHAPE_CONFIG,
};
