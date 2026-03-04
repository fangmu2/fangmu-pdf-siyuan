<script setup lang="ts">
/**
 * 画布导航器组件
 * 提供缩略图、视口指示器和画布边界信息
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFreeMindMapStore } from '@/stores/freeMindMapStore'
import type { FreeMindMapNode } from '@/types/mindmapFree'

// Props
interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 缩略图宽度 */
  thumbnailWidth?: number
  /** 缩略图高度 */
  thumbnailHeight?: number
  /** 视口状态 */
  viewport?: {
    x: number
    y: number
    zoom: number
  }
  /** 容器尺寸 */
  containerSize?: {
    width: number
    height: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  thumbnailWidth: 200,
  thumbnailHeight: 150
})

// Emit
const emit = defineEmits<{
  /** 视口变化 */
  (e: 'viewport-change', viewport: { x: number; y: number; zoom: number }): void
  /** 点击缩略图定位 */
  (e: 'navigate', position: { x: number; y: number }): void
}>()

// 使用 Store
const store = useFreeMindMapStore()
const { nodes, canvasBounds } = storeToRefs(store)

// Canvas 引用
const thumbnailCanvas = ref<HTMLCanvasElement | null>(null)

// 计算属性
const isDarkMode = computed(() => {
  return window.siyuan?.config?.appearance?.mode === 1
})

const backgroundColor = computed(() => {
  return isDarkMode.value ? '#2d2d2d' : '#f5f5f5'
})

const textColor = computed(() => {
  return isDarkMode.value ? '#e0e0e0' : '#333333'
})

const borderColor = computed(() => {
  return isDarkMode.value ? '#404040' : '#d0d0d0'
})

const totalNodes = computed(() => nodes.value.length)

const canvasWidth = computed(() => {
  return canvasBounds.value.maxX - canvasBounds.value.minX
})

const canvasHeight = computed(() => {
  return canvasBounds.value.maxY - canvasBounds.value.minY
})

// 计算视口在缩略图中的位置
const viewportIndicator = computed(() => {
  if (!props.containerSize) {
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  const { minX, minY, maxX, maxY } = canvasBounds.value
  const containerWidth = props.containerSize.width
  const containerHeight = props.containerSize.height

  // 计算缩放比例
  const scaleX = props.thumbnailWidth / canvasWidth.value
  const scaleY = props.thumbnailHeight / canvasHeight.value
  const scale = Math.min(scaleX, scaleY)

  // 计算视口在缩略图中的位置
  const viewportWidth = containerWidth * props.viewport!.zoom * scale
  const viewportHeight = containerHeight * props.viewport!.zoom * scale
  
  const viewportX = ((-props.viewport!.x / props.viewport!.zoom - minX) * scale)
  const viewportY = ((-props.viewport!.y / props.viewport!.zoom - minY) * scale)

  return {
    left: Math.max(0, viewportX),
    top: Math.max(0, viewportY),
    width: Math.min(viewportWidth, props.thumbnailWidth - viewportX),
    height: Math.min(viewportHeight, props.thumbnailHeight - viewportY)
  }
})

// 绘制缩略图
function renderThumbnail(): void {
  const canvas = thumbnailCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.fillStyle = backgroundColor.value
  ctx.fillRect(0, 0, props.thumbnailWidth, props.thumbnailHeight)

  const { minX, minY, maxX, maxY } = canvasBounds.value
  const canvasW = maxX - minX
  const canvasH = maxY - minY

  if (canvasW === 0 || canvasH === 0) {
    return
  }

  // 计算缩放比例
  const scaleX = props.thumbnailWidth / canvasW
  const scaleY = props.thumbnailHeight / canvasH
  const scale = Math.min(scaleX, scaleY) * 0.9 // 留 10% 边距

  // 计算偏移使内容居中
  const offsetX = (props.thumbnailWidth - canvasW * scale) / 2
  const offsetY = (props.thumbnailHeight - canvasH * scale) / 2

  // 绘制所有节点（简化为矩形）
  const visibleNodes = getVisibleNodesForThumbnail()
  
  visibleNodes.forEach(node => {
    const nodeWidth = node.style?.width ? parseFloat(node.style.width as string) : 200
    const nodeHeight = node.style?.height ? parseFloat(node.style.height as string) : 60

    const x = (node.position.x - minX) * scale + offsetX
    const y = (node.position.y - minY) * scale + offsetY
    const w = nodeWidth * scale
    const h = nodeHeight * scale

    // 根据节点类型设置颜色
    ctx.fillStyle = getNodeColor(node)
    ctx.fillRect(x, y, Math.max(w, 2), Math.max(h, 2))
  })

  // 绘制边框
  ctx.strokeStyle = borderColor.value
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, props.thumbnailWidth, props.thumbnailHeight)
}

/**
 * 获取缩略图要显示的节点（性能优化）
 */
function getVisibleNodesForThumbnail(): FreeMindMapNode[] {
  // 如果节点太多，只采样显示
  if (nodes.value.length > 500) {
    const step = Math.ceil(nodes.value.length / 500)
    return nodes.value.filter((_, index) => index % step === 0)
  }
  return nodes.value
}

/**
 * 获取节点颜色
 */
function getNodeColor(node: FreeMindMapNode): string {
  if (node.type === 'group') {
    return '#9c27b0'
  }
  if (node.type === 'imageCard') {
    return '#ff9800'
  }
  // textCard
  return node.data.color || '#2196f3'
}

/**
 * 处理缩略图点击
 */
function handleThumbnailClick(event: MouseEvent): void {
  const canvas = thumbnailCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  const { minX, minY } = canvasBounds.value
  const canvasW = canvasWidth.value
  const canvasH = canvasHeight.value

  // 计算缩放比例
  const scaleX = props.thumbnailWidth / canvasW
  const scaleY = props.thumbnailHeight / canvasH
  const scale = Math.min(scaleX, scaleY) * 0.9

  // 计算偏移
  const offsetX = (props.thumbnailWidth - canvasW * scale) / 2
  const offsetY = (props.thumbnailHeight - canvasH * scale) / 2

  // 计算实际坐标
  const actualX = (clickX - offsetX) / scale + minX
  const actualY = (clickY - offsetY) / scale + minY

  emit('navigate', { x: actualX, y: actualY })
}

// 监听节点变化，重新绘制
watch([nodes, canvasBounds], () => {
  renderThumbnail()
}, { deep: true })

// 监听暗色模式变化
watch(isDarkMode, () => {
  renderThumbnail()
})

// 挂载时绘制
onMounted(() => {
  renderThumbnail()
})

// 暴露绘制方法给父组件
defineExpose({
  refresh: renderThumbnail
})
</script>

<template>
  <div
    v-if="visible"
    class="canvas-navigator"
    :style="{
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      color: textColor
    }"
  >
    <!-- 缩略图 -->
    <div class="thumbnail-container">
      <canvas
        ref="thumbnailCanvas"
        :width="thumbnailWidth"
        :height="thumbnailHeight"
        class="thumbnail"
        @click="handleThumbnailClick"
      />
      
      <!-- 视口指示器 -->
      <div
        class="viewport-indicator"
        :style="{
          left: viewportIndicator.left + 'px',
          top: viewportIndicator.top + 'px',
          width: viewportIndicator.width + 'px',
          height: viewportIndicator.height + 'px'
        }"
      />
    </div>

    <!-- 画布信息 -->
    <div class="bounds-indicator">
      <div class="info-row">
        <span class="info-label">画布:</span>
        <span class="info-value">{{ Math.round(canvasWidth) }} × {{ Math.round(canvasHeight) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">节点:</span>
        <span class="info-value">{{ totalNodes }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">边界:</span>
        <span class="info-value small">
          [{{ Math.round(canvasBounds.minX) }}, {{ Math.round(canvasBounds.minY) }}] →
          [{{ Math.round(canvasBounds.maxX) }}, {{ Math.round(canvasBounds.maxY) }}]
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-navigator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid v-bind(borderColor);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
}

.thumbnail-container {
  position: relative;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail {
  display: block;
  border-radius: 4px;
}

.viewport-indicator {
  position: absolute;
  border: 2px solid #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  pointer-events: none;
  transition: all 0.1s ease;
}

.bounds-indicator {
  font-size: 11px;
  line-height: 1.6;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.info-label {
  opacity: 0.7;
  margin-right: 8px;
}

.info-value {
  font-weight: 600;
}

.info-value.small {
  font-size: 10px;
  opacity: 0.8;
}

/* 暗色模式 */
.canvas-navigator:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
