<!-- src/components/PDFViewer/PDFHighlightLayer.vue -->
<template>
  <div
    ref="highlightLayerRef"
    class="highlight-layer"
  ></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'

interface Props {
  annotations: PDFAnnotation[]
  selectedAnnotation: PDFAnnotation | null
  viewport: any
  scale: number
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => [],
  selectedAnnotation: null,
  viewport: null,
  scale: 1,
})

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void
  (e: 'annotation-delete', annotation: PDFAnnotation): void
}>()

const highlightLayerRef = ref<HTMLElement | null>(null)

// 标注颜色映射
const LEVEL_COLORS: Record<string, { bg: string, border: string }> = {
  title: { bg: 'rgba(255, 87, 87, 0.35)', border: '#ff5757' },
  h1: { bg: 'rgba(255, 159, 67, 0.35)', border: '#ff9f43' },
  h2: { bg: 'rgba(254, 202, 87, 0.35)', border: '#feca57' },
  h3: { bg: 'rgba(29, 209, 161, 0.35)', border: '#1dd1a1' },
  h4: { bg: 'rgba(72, 219, 251, 0.35)', border: '#48dbfb' },
  h5: { bg: 'rgba(84, 160, 255, 0.35)', border: '#54a0ff' },
  text: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
}

const ANNOTATION_COLORS: Record<string, { bg: string, border: string }> = {
  red: { bg: 'rgba(255, 107, 107, 0.35)', border: '#ff6b6b' },
  yellow: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
  green: { bg: 'rgba(107, 203, 119, 0.35)', border: '#6bcb77' },
  blue: { bg: 'rgba(77, 150, 255, 0.35)', border: '#4d96ff' },
  purple: { bg: 'rgba(155, 89, 182, 0.35)', border: '#9b59b6' },
}

/**
 * 渲染高亮层
 */
const renderHighlights = () => {
  const layer = highlightLayerRef.value
  if (!layer || !props.viewport) return

  // 清空高亮层
  layer.innerHTML = ''
  layer.style.width = `${props.viewport.width}px`
  layer.style.height = `${props.viewport.height}px`

  const scale = props.viewport.scale || props.scale
  const cssPageHeight = props.viewport.height

  for (const ann of props.annotations) {
    const [pdfX1, pdfY1, pdfX2, pdfY2] = ann.rect

    // PDF 坐标转换为 CSS 坐标
    const cssX = pdfX1 * scale
    const cssY = cssPageHeight - pdfY2 * scale
    const cssWidth = (pdfX2 - pdfX1) * scale
    const cssHeight = Math.max((pdfY2 - pdfY1) * scale, 14)

    // 获取颜色
    const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow
    const isSelected = props.selectedAnnotation?.id === ann.id

    // 创建高亮元素
    const highlight = document.createElement('div')
    highlight.className = 'highlight-element'
    highlight.dataset.annotationId = ann.id
    highlight.style.cssText = `
      position: absolute;
      left: ${cssX}px;
      top: ${cssY}px;
      width: ${cssWidth}px;
      height: ${cssHeight}px;
      background-color: ${isSelected ? colors.bg.replace('0.35', '0.55') : colors.bg};
      border: 2px solid ${isSelected ? '#fff' : colors.border};
      border-radius: 3px;
      cursor: pointer;
      pointer-events: auto;
      transition: background-color 0.15s ease, transform 0.1s ease;
      box-shadow: ${isSelected ? '0 0 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'};
      z-index: ${isSelected ? 2 : 1};
    `

    // 添加角标
    if (ann.isImage) {
      const badge = document.createElement('span')
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        left: 0;
        background: #8b5cf6;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 2px;
        line-height: 1;
      `
      badge.textContent = '📷'
      highlight.appendChild(badge)
    } else if (ann.level && ann.level !== 'text') {
      const levelLabels: Record<string, string> = {
        title: 'T',
        h1: 'H1',
        h2: 'H2',
        h3: 'H3',
        h4: 'H4',
        h5: 'H5',
      }
      const label = levelLabels[ann.level]
      if (label) {
        const badge = document.createElement('span')
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          left: 0;
          background: ${colors.border};
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 2px;
          line-height: 1;
        `
        badge.textContent = label
        highlight.appendChild(badge)
      }
    }

    // 点击事件
    highlight.addEventListener('click', (e) => {
      e.stopPropagation()
      if (props.selectedAnnotation?.id === ann.id) {
        // 取消选中
      } else {
        emit('annotation-click', ann)
      }
    })

    // 删除按钮
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'highlight-delete-btn'
    deleteBtn.innerHTML = '×'
    deleteBtn.title = '删除标注'
    deleteBtn.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      border: 2px solid white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 100;
      line-height: 1;
      opacity: ${isSelected ? '1' : '0'};
      transition: opacity 0.15s ease, transform 0.15s ease;
    `

    highlight.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1'
    })
    highlight.addEventListener('mouseleave', () => {
      if (props.selectedAnnotation?.id !== ann.id) {
        deleteBtn.style.opacity = '0'
      }
    })

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      emit('annotation-delete', ann)
    })

    highlight.appendChild(deleteBtn)
    layer.appendChild(highlight)
  }
}

// 监听标注变化
watch(() => props.annotations, () => {
  renderHighlights()
}, { deep: true, immediate: true })

// 监听选中标注变化
watch(() => props.selectedAnnotation, () => {
  renderHighlights()
}, { immediate: true })

// 监听 viewport 变化
watch(() => props.viewport, () => {
  renderHighlights()
}, { immediate: true })

defineExpose({
  highlightLayerRef,
})
</script>

<style scoped lang="scss">
.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 6;
}

.highlight-element {
  pointer-events: auto !important;
  cursor: pointer;
}
</style>
