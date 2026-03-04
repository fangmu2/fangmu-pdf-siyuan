<!-- src/components/PdfShapeOverlay.vue -->
<template>
  <svg
    ref="svgRef"
    class="pdf-shape-overlay"
    :style="{
      width: containerWidth + 'px',
      height: containerHeight + 'px',
      pointerEvents: shapeTool ? 'auto' : 'none',
      cursor: getDrawingCursor(),
    }"
    @mousedown="handleSvgMouseDown"
    @mousemove="handleSvgMouseMove"
    @mouseup="handleSvgMouseUp"
    @mouseleave="handleSvgMouseUp"
  >
    <!-- 形状组 -->
    <g v-for="shape in shapes" :key="shape.id" :data-shape-id="shape.id">
      <!-- 矩形 -->
      <rect
        v-if="shape.shapeType === 'rectangle' && shape.x && shape.y && shape.width && shape.height"
        :x="shape.x * scale"
        :y="cssPageHeight - shape.y * scale - shape.height * scale"
        :width="shape.width * scale"
        :height="shape.height * scale"
        :fill="'none'"
        :stroke="shape.color"
        :stroke-width="shape.lineWidth"
        :stroke-opacity="shape.opacity"
        :style="{ pointerEvents: 'auto', cursor: shape.isSelected ? 'move' : 'default' }"
        @click.stop="handleShapeClick(shape)"
      />
      
      <!-- 圆形 -->
      <ellipse
        v-if="shape.shapeType === 'circle' && shape.x && shape.y && shape.width && shape.height"
        :cx="shape.x * scale + (shape.width * scale) / 2"
        :cy="cssPageHeight - shape.y * scale - (shape.height * scale) / 2"
        :rx="Math.abs(shape.width * scale) / 2"
        :ry="Math.abs(shape.height * scale) / 2"
        :fill="'none'"
        :stroke="shape.color"
        :stroke-width="shape.lineWidth"
        :stroke-opacity="shape.opacity"
        :style="{ pointerEvents: 'auto', cursor: shape.isSelected ? 'move' : 'default' }"
        @click.stop="handleShapeClick(shape)"
      />
      
      <!-- 箭头 -->
      <path
        v-if="shape.shapeType === 'arrow' && shape.startX && shape.startY && shape.endX && shape.endY"
        :d="getArrowPath(shape)"
        :fill="'none'"
        :stroke="shape.color"
        :stroke-width="shape.lineWidth"
        :stroke-opacity="shape.opacity"
        stroke-linecap="round"
        stroke-linejoin="round"
        :style="{ pointerEvents: 'auto', cursor: shape.isSelected ? 'move' : 'default' }"
        @click.stop="handleShapeClick(shape)"
      />
      
      <!-- 选中状态的控制点 -->
      <g v-if="shape.isSelected">
        <rect
          v-for="handle in getResizeHandles(shape)"
          :key="handle.type"
          :x="handle.x - handleSize / 2 - 1"
          :y="handle.y - handleSize / 2 - 1"
          :width="handleSize + 2"
          :height="handleSize + 2"
          :fill="handleColor"
          :stroke="handleBorderColor"
          :stroke-width="1"
          :rx="2"
          :data-handle-type="handle.type"
          :style="{ 
            pointerEvents: 'auto', 
            cursor: getCursorForHandle(handle.type),
            opacity: shape.isSelected ? 1 : 0
          }"
          @mousedown.stop="handleResizeStart($event, shape, handle.type)"
        />
      </g>
    </g>
    
    <!-- 预览形状（绘制中） -->
    <g v-if="previewShape">
      <rect
        v-if="previewShape.shapeType === 'rectangle' && previewShape.x && previewShape.y && previewShape.width && previewShape.height"
        :x="previewShape.x"
        :y="previewShape.y"
        :width="previewShape.width"
        :height="previewShape.height"
        fill="none"
        :stroke="previewShape.color"
        :stroke-width="previewShape.lineWidth"
        stroke-dasharray="4,2"
        stroke-opacity="0.8"
      />
      
      <ellipse
        v-if="previewShape.shapeType === 'circle' && previewShape.x && previewShape.y && previewShape.width && previewShape.height"
        :cx="previewShape.x + previewShape.width / 2"
        :cy="previewShape.y + previewShape.height / 2"
        :rx="Math.abs(previewShape.width) / 2"
        :ry="Math.abs(previewShape.height) / 2"
        fill="none"
        :stroke="previewShape.color"
        :stroke-width="previewShape.lineWidth"
        stroke-dasharray="4,2"
        stroke-opacity="0.8"
      />
      
      <path
        v-if="previewShape.shapeType === 'arrow' && previewShape.startX && previewShape.startY && previewShape.endX && previewShape.endY"
        :d="getPreviewArrowPath(previewShape)"
        fill="none"
        :stroke="previewShape.color"
        :stroke-width="previewShape.lineWidth"
        stroke-dasharray="4,2"
        stroke-opacity="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ShapeAnnotation, ResizeHandle } from '../types/annotation';

interface Props {
  shapes: ShapeAnnotation[];
  previewShape: ShapeAnnotation | null;
  containerWidth: number;
  containerHeight: number;
  scale: number;
  cssPageHeight: number;
  shapeTool?: 'rectangle' | 'circle' | 'arrow' | null;
  shapeColor?: string;
  shapeLineWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  shapeTool: null,
  shapeColor: '#ef4444',
  shapeLineWidth: 2,
});

const emit = defineEmits<{
  (e: 'shape-click', shape: ShapeAnnotation): void;
  (e: 'shape-select', shape: ShapeAnnotation | null): void;
  (e: 'shape-move', shape: ShapeAnnotation, dx: number, dy: number): void;
  (e: 'shape-resize', shape: ShapeAnnotation, handleType: ResizeHandle, dx: number, dy: number): void;
  (e: 'drawing-start', point: { x: number; y: number }): void;
  (e: 'drawing-update', point: { x: number; y: number }): void;
  (e: 'drawing-end'): void;
}>();

const svgRef = ref<SVGSVGElement | null>(null);

// 控制点配置
const handleSize = 8;
const handleColor = '#3b82f6';
const handleBorderColor = '#ffffff';

// 拖拽状态
const isDrawing = ref(false);
let isDragging = false;
let isResizing = false;
let dragStartPoint: { x: number; y: number } | null = null;
let currentShape: ShapeAnnotation | null = null;
let currentHandleType: ResizeHandle | null = null;

/**
 * 获取绘制时光标样式
 */
const getDrawingCursor = (): string => {
  if (!props.shapeTool) return 'default';
  
  const cursorMap: Record<string, string> = {
    rectangle: 'crosshair',
    circle: 'crosshair',
    arrow: 'crosshair',
  };
  
  return cursorMap[props.shapeTool] || 'crosshair';
};

/**
 * 获取箭头路径
 */
const getArrowPath = (shape: ShapeAnnotation): string => {
  if (!shape.startX || !shape.startY || !shape.endX || !shape.endY) return '';

  const startX = shape.startX * props.scale;
  const startY = props.cssPageHeight - shape.startY * props.scale;
  const endX = shape.endX * props.scale;
  const endY = props.cssPageHeight - shape.endY * props.scale;

  const headLength = 12;
  const headAngle = Math.PI / 6;
  const angle = Math.atan2(endY - startY, endX - startX);

  const linePath = `M ${startX} ${startY} L ${endX} ${endY}`;
  const arrowHeadPath = `
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle - headAngle)} ${endY - headLength * Math.sin(angle - headAngle)}
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle + headAngle)} ${endY - headLength * Math.sin(angle + headAngle)}
  `;

  return `${linePath} ${arrowHeadPath}`;
};

/**
 * 获取预览箭头路径
 */
const getPreviewArrowPath = (shape: ShapeAnnotation): string => {
  if (!shape.startX || !shape.startY || !shape.endX || !shape.endY) return '';

  const startX = shape.startX;
  const startY = shape.startY;
  const endX = shape.endX;
  const endY = shape.endY;

  const headLength = 12;
  const headAngle = Math.PI / 6;
  const angle = Math.atan2(endY - startY, endX - startX);

  const linePath = `M ${startX} ${startY} L ${endX} ${endY}`;
  const arrowHeadPath = `
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle - headAngle)} ${endY - headLength * Math.sin(angle - headAngle)}
    M ${endX} ${endY}
    L ${endX - headLength * Math.cos(angle + headAngle)} ${endY - headLength * Math.sin(angle + headAngle)}
  `;

  return `${linePath} ${arrowHeadPath}`;
};

/**
 * 获取控制点位置
 */
const getResizeHandles = (shape: ShapeAnnotation): Array<{ type: ResizeHandle; x: number; y: number }> => {
  const handles: Array<{ type: ResizeHandle; x: number; y: number }> = [];

  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    if (!shape.x || !shape.y || !shape.width || !shape.height) return handles;

    const cssX = shape.x * props.scale;
    const cssY = props.cssPageHeight - shape.y * props.scale - shape.height * props.scale;
    const cssWidth = shape.width * props.scale;
    const cssHeight = shape.height * props.scale;

    handles.push(
      { type: 'nw', x: cssX, y: cssY },
      { type: 'n', x: cssX + cssWidth / 2, y: cssY },
      { type: 'ne', x: cssX + cssWidth, y: cssY },
      { type: 'e', x: cssX + cssWidth, y: cssY + cssHeight / 2 },
      { type: 'se', x: cssX + cssWidth, y: cssY + cssHeight },
      { type: 's', x: cssX + cssWidth / 2, y: cssY + cssHeight },
      { type: 'sw', x: cssX, y: cssY + cssHeight },
      { type: 'w', x: cssX, y: cssY + cssHeight / 2 }
    );
  } else if (shape.shapeType === 'arrow') {
    if (!shape.startX || !shape.startY || !shape.endX || !shape.endY) return handles;

    const startX = shape.startX * props.scale;
    const startY = props.cssPageHeight - shape.startY * props.scale;
    const endX = shape.endX * props.scale;
    const endY = props.cssPageHeight - shape.endY * props.scale;

    handles.push(
      { type: 'nw', x: startX, y: startY },
      { type: 'se', x: endX, y: endY }
    );
  }

  return handles;
};

/**
 * 获取控制点光标样式
 */
const getCursorForHandle = (handleType: ResizeHandle): string => {
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
};

/**
 * 形状点击
 */
const handleShapeClick = (shape: ShapeAnnotation): void => {
  emit('shape-click', shape);
};

/**
 * SVG 鼠标按下 - 开始绘制
 */
const handleSvgMouseDown = (e: MouseEvent): void => {
  // 如果正在拖拽或调整大小，不处理绘制
  if (isDragging || isResizing) return;

  // 如果当前有形状工具，开始绘制
  if (props.shapeTool) {
    const point = { x: e.offsetX, y: e.offsetY };
    emit('drawing-start', point);

    // 创建预览形状
    const now = Date.now();
    const baseShape: Partial<ShapeAnnotation> = {
      id: `shape_${now}_${Math.random().toString(36).substr(2, 9)}`,
      shapeType: props.shapeTool,
      color: props.shapeColor,
      lineWidth: props.shapeLineWidth,
      opacity: 0.8,
      page: 1, // 由父组件设置
      pdfPath: '', // 由父组件设置
      created: now,
      updated: now,
    };

    if (props.shapeTool === 'rectangle' || props.shapeTool === 'circle') {
      previewShape.value = {
        ...baseShape,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      } as ShapeAnnotation;
    } else if (props.shapeTool === 'arrow') {
      previewShape.value = {
        ...baseShape,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
      } as ShapeAnnotation;
    }

    isDrawing.value = true;
    dragStartPoint = { x: e.offsetX, y: e.offsetY };
  } else {
    // 没有形状工具，处理普通点击
    const target = e.target as SVGElement;
    
    // 检查是否点击在控制点上
    const handleType = target.dataset.handleType as ResizeHandle | undefined;
    if (handleType) {
      isResizing = true;
      currentHandleType = handleType;
      
      // 找到选中的形状
      const shapeId = target.parentElement?.parentElement?.dataset.shapeId;
      if (shapeId) {
        currentShape = props.shapes.find(s => s.id === shapeId) || null;
      }
      
      dragStartPoint = { x: e.offsetX, y: e.offsetY };
      e.preventDefault();
      return;
    }

    // 检查是否点击在形状上（移动模式）
    if (target.tagName === 'rect' || target.tagName === 'ellipse' || target.tagName === 'path') {
      const shapeGroup = target.closest('g[data-shape-id]');
      if (shapeGroup) {
        const shapeId = shapeGroup.dataset.shapeId;
        currentShape = props.shapes.find(s => s.id === shapeId) || null;
        
        if (currentShape?.isSelected) {
          isDragging = true;
          dragStartPoint = { x: e.offsetX, y: e.offsetY };
          e.preventDefault();
          return;
        }
      }
    }

    // 空白区域点击 - 取消选中
    emit('shape-select', null);
  }
};

/**
 * SVG 鼠标移动
 */
const handleSvgMouseMove = (e: MouseEvent): void => {
  if (!dragStartPoint) return;

  const dx = e.offsetX - dragStartPoint.x;
  const dy = e.offsetY - dragStartPoint.y;

  // 如果正在绘制
  if (isDrawing.value && previewShape.value && props.shapeTool) {
    const currentPoint = { x: e.offsetX, y: e.offsetY };
    emit('drawing-update', currentPoint);

    // 更新预览形状
    if (props.shapeTool === 'rectangle' || props.shapeTool === 'circle') {
      const startPoint = previewShape.value;
      const x = Math.min(startPoint.x!, currentPoint.x);
      const y = Math.min(startPoint.y!, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x!);
      const height = Math.abs(currentPoint.y - startPoint.y!);

      previewShape.value.x = x;
      previewShape.value.y = y;
      previewShape.value.width = width;
      previewShape.value.height = height;
    } else if (props.shapeTool === 'arrow') {
      previewShape.value.endX = currentPoint.x;
      previewShape.value.endY = currentPoint.y;
    }

    dragStartPoint = { x: e.offsetX, y: e.offsetY };
    return;
  }

  if (isResizing && currentShape && currentHandleType) {
    // 调整大小
    emit('shape-resize', currentShape, currentHandleType, dx, dy);
    dragStartPoint = { x: e.offsetX, y: e.offsetY };
  } else if (isDragging && currentShape) {
    // 移动形状
    emit('shape-move', currentShape, dx, dy);
    dragStartPoint = { x: e.offsetX, y: e.offsetY };
  }
};

/**
 * SVG 鼠标释放
 */
const handleSvgMouseUp = (): void => {
  if (isDrawing.value) {
    // 结束绘制
    isDrawing.value = false;
    emit('drawing-end');
  }
  
  isDragging = false;
  isResizing = false;
  currentShape = null;
  currentHandleType = null;
  dragStartPoint = null;
};

/**
 * 开始调整大小
 */
const handleResizeStart = (e: MouseEvent, shape: ShapeAnnotation, handleType: ResizeHandle): void => {
  isResizing = true;
  currentShape = shape;
  currentHandleType = handleType;
  dragStartPoint = { x: e.offsetX, y: e.offsetY };
  e.preventDefault();
  e.stopPropagation();
};
</script>

<style scoped lang="scss">
.pdf-shape-overlay {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 10;
  
  g {
    pointer-events: auto;
    
    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
