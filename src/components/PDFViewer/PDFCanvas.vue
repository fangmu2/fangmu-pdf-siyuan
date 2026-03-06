<!-- src/components/PDFViewer/PDFCanvas.vue -->
<template>
  <canvas
    ref="canvasRef"
    class="pdf-canvas"
    :style="{
      width: canvasWidth ? `${canvasWidth}px` : 'auto',
      height: canvasHeight ? `${canvasHeight}px` : 'auto',
    }"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { PDFPageProxy } from 'pdfjs-dist'

interface Props {
  page: PDFPageProxy | null
  scale: number
  containerWidth: number
  canvasWidth?: number
  canvasHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  page: null,
  canvasWidth: 0,
  canvasHeight: 0,
})

const emit = defineEmits<{
  (e: 'rendered', viewport: any): void
  (e: 'error', error: Error): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let currentRenderTask: { cancel: () => void } | null = null

/**
 * 渲染页面到 Canvas
 */
const renderPage = async () => {
  if (!props.page || !canvasRef.value) return

  // 取消之前的渲染任务
  if (currentRenderTask) {
    currentRenderTask.cancel()
    currentRenderTask = null
  }

  try {
    const canvas = canvasRef.value
    const containerWidth = props.containerWidth
    const targetWidth = containerWidth * props.scale

    // 获取 viewport
    const viewport = props.page.getViewport({ scale: props.scale })

    // 设置 canvas 尺寸
    const outputScale = window.devicePixelRatio || 1
    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(outputScale, outputScale)

    // 渲染页面
    const renderContext = {
      canvasContext: ctx,
      viewport,
    }

    const renderTask = props.page.render(renderContext)

    currentRenderTask = {
      cancel: () => {
        renderTask.cancel()
        console.log('[PDFCanvas] 渲染任务已取消')
      },
    }

    await renderTask.promise
    currentRenderTask = null

    emit('rendered', viewport)
  } catch (e: any) {
    if (e.name === 'RenderingCancelledException') {
      console.log('[PDFCanvas] 渲染已取消')
      return
    }
    console.error('[PDFCanvas] 渲染失败:', e)
    emit('error', e)
  }
}

// 监听页面变化
watch(() => props.page, () => {
  if (props.page) {
    renderPage()
  }
}, { immediate: true })

// 监听 scale 变化
watch(() => props.scale, () => {
  if (props.page) {
    renderPage()
  }
})

// 监听 containerWidth 变化
watch(() => props.containerWidth, () => {
  if (props.page) {
    renderPage()
  }
})

onBeforeUnmount(() => {
  if (currentRenderTask) {
    currentRenderTask.cancel()
    currentRenderTask = null
  }
})

defineExpose({
  canvasRef,
})
</script>

<style scoped lang="scss">
.pdf-canvas {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: white;
  display: block;
  position: relative;
  z-index: 1;
}
</style>
