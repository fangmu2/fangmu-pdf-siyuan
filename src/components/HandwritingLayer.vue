<template>
  <div
    class="handwriting-layer-container"
    :class="{ 'layer-hidden': !isVisible }"
  >
    <div class="handwriting-controls">
      <div class="control-group">
        <label>笔刷大小:</label>
        <input
          v-model="brushSize"
          type="range"
          min="1"
          max="20"
          class="brush-size-slider"
        />
        <span class="brush-size-value">{{ brushSize }}px</span>
      </div>
      <div class="control-group">
        <label>笔刷颜色:</label>
        <div class="color-picker">
          <div
            v-for="color in colors"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            :class="{ active: selectedColor === color }"
            @click="selectedColor = color"
          ></div>
        </div>
      </div>
      <div class="control-group">
        <button
          class="clear-btn"
          @click="clearCanvas"
        >
          清空画布
        </button>
        <button
          class="visibility-btn"
          @click="toggleVisibility"
        >
          {{ isVisible ? '隐藏图层' : '显示图层' }}
        </button>
        <button
          class="reset-btn"
          @click="resetLearning"
        >
          重置学习
        </button>
      </div>
    </div>
    <canvas
      ref="canvasRef"
      class="handwriting-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

const props = defineProps<{
  pdfPath: string
  page: number
  isVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'drawing-start'): void
  (e: 'drawing-end'): void
  (e: 'reset-learning'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const brushSize = ref(5)
const selectedColor = ref('#ff0000') // 默认红色
const lastX = ref(0)
const lastY = ref(0)

// 颜色选项
const colors = [
  '#ff0000', // 红色
  '#00ff00', // 绿色
  '#0000ff', // 蓝色
  '#ffff00', // 黄色
  '#ff00ff', // 紫色
  '#00ffff', // 青色
  '#000000', // 黑色
]

// 初始化画布
const initCanvas = async () => {
  await nextTick()
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布尺寸
  const container = canvas.parentElement
  if (container) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  // 设置初始绘图样式
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = brushSize.value
  ctx.strokeStyle = selectedColor.value
}

// 开始绘制
const startDrawing = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  isDrawing.value = true
  const rect = canvas.getBoundingClientRect()
  lastX.value = e.clientX - rect.left
  lastY.value = e.clientY - rect.top

  emit('drawing-start')
}

// 绘制
const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()

  lastX.value = currentX
  lastY.value = currentY
}

// 停止绘制
const stopDrawing = () => {
  isDrawing.value = false
  emit('drawing-end')
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    })
    canvasRef.value?.dispatchEvent(mouseEvent)
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    })
    canvasRef.value?.dispatchEvent(mouseEvent)
  }
  e.preventDefault()
}

const handleTouchEnd = () => {
  const mouseEvent = new MouseEvent('mouseup')
  canvasRef.value?.dispatchEvent(mouseEvent)
}

// 清空画布
const clearCanvas = () => {
  if (!canvasRef.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

// 切换可见性
const toggleVisibility = () => {
  // 通过props传递给父组件处理
}

// 重置学习
const resetLearning = () => {
  clearCanvas()
  emit('reset-learning')
}

// 监听窗口大小变化
const handleResize = () => {
  initCanvas()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.handwriting-layer-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 10;
}

.handwriting-layer-container.layer-hidden {
  display: none;
}

.handwriting-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-size: 12px;
  white-space: nowrap;
}

.brush-size-slider {
  width: 80px;
}

.brush-size-value {
  font-size: 12px;
  min-width: 30px;
  text-align: center;
}

.color-picker {
  display: flex;
  gap: 4px;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.color-option:hover {
  transform: scale(1.2);
}

.color-option.active {
  border-color: #333;
  transform: scale(1.2);
}

.clear-btn, .visibility-btn, .reset-btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.clear-btn:hover, .visibility-btn:hover, .reset-btn:hover {
  background: #f0f0f0;
}

.reset-btn {
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.reset-btn:hover {
  background: #ffcdd2;
}

.handwriting-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  z-index: 15;
}
</style>
