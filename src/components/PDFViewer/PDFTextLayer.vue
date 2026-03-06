<!-- src/components/PDFViewer/PDFTextLayer.vue -->
<template>
  <div
    ref="textLayerRef"
    class="pdf-text-layer"
    @mouseup="handleMouseUp"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { PDFPageProxy } from 'pdfjs-dist'
import { renderTextLayer as renderTextLayerUtil } from '@/utils/pdf'

interface Props {
  page: PDFPageProxy | null
  viewport: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'text-selected', data: {
    text: string
    page: number
    rect: [number, number, number, number] | null
  }): void
}>()

const textLayerRef = ref<HTMLElement | null>(null)

/**
 * 渲染文本层
 */
const renderTextLayer = async () => {
  if (!props.page || !textLayerRef.value || !props.viewport) return

  try {
    await renderTextLayerUtil(props.page, textLayerRef.value, props.viewport)
  } catch (e: any) {
    console.error('[PDFTextLayer] 渲染文本层失败:', e)
  }
}

/**
 * 处理鼠标抬起事件（文本选择）
 */
const handleMouseUp = () => {
  const selection = window.getSelection()
  if (!selection || !selection.toString().trim()) return

  const text = selection.toString().trim()
  const range = selection.getRangeAt(0)

  // 计算选择区域
  const rect = range.getBoundingClientRect()
  const containerRect = textLayerRef.value?.getBoundingClientRect()

  if (containerRect) {
    const pdfRect: [number, number, number, number] = [
      rect.left - containerRect.left,
      rect.top - containerRect.top,
      rect.right - containerRect.left,
      rect.bottom - containerRect.top,
    ]

    emit('text-selected', {
      text,
      page: props.page?.pageIndex + 1 || 1,
      rect: pdfRect,
    })
  }
}

// 监听页面变化
watch(() => props.page, () => {
  if (props.page) {
    renderTextLayer()
  }
}, { immediate: true })

// 监听 viewport 变化
watch(() => props.viewport, () => {
  if (props.page) {
    renderTextLayer()
  }
})

defineExpose({
  textLayerRef,
})
</script>

<style scoped lang="scss">
.pdf-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  line-height: 1;
  z-index: 5;
  pointer-events: auto;
}

.pdf-text-layer :deep(.textLayer) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
}

.pdf-text-layer :deep(.textLayer > span) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.pdf-text-layer :deep(::selection) {
  background: rgba(0, 120, 255, 0.4);
}
</style>
