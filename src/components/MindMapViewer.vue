<!-- src/components/MindMapViewer.vue -->
<template>
  <div
    ref="mindmapRef"
    class="mindmap-container"
  >
    <div class="mindmap-toolbar">
      <!-- 布局选择器 -->
      <div class="layout-selector">
        <select
          v-model="currentLayout"
          class="layout-select"
          @change="changeLayout"
        >
          <option value="mindmap">
            🧠 思维导图
          </option>
          <option value="tree">
            🌳 树状图
          </option>
          <option value="fishbone">
            🐟 鱼骨图
          </option>
          <option value="timeline">
            📅 时间轴
          </option>
          <option value="vertical">
            ⬇️ 垂直图
          </option>
        </select>
      </div>

      <div class="toolbar-divider"></div>

      <button
        class="toolbar-btn"
        title="适应视图"
        @click="fitView"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="放大"
        @click="zoomIn"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="缩小"
        @click="zoomOut"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 13H5v-2h14v2z" />
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <button
        class="toolbar-btn"
        title="展开全部"
        @click="expandAll"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="收起全部"
        @click="collapseAll"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <button
        class="toolbar-btn"
        title="全屏"
        @click="toggleFullscreen"
      >
        <svg
          v-if="!isFullscreen"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
        </svg>
      </button>
      <button
        class="toolbar-btn"
        title="导出为 PNG"
        @click="exportPNG"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
      </button>
    </div>
    <div
      ref="svgContainerRef"
      class="mindmap-content"
    ></div>

    <!-- 布局提示 -->
    <transition name="fade">
      <div
        v-if="showLayoutTip"
        class="layout-tip"
      >
        <span>已切换到{{ layoutNames[currentLayout] }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { PDFAnnotation } from '../types/annotation'
// 直接导入 markmap 库
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { generateMindmapMarkdown } from '../utils/mindmapGenerator'

const props = defineProps<{
  annotations: PDFAnnotation[]
}>()

const emit = defineEmits<{
  (e: 'node-click', annotation: PDFAnnotation): void
  (e: 'node-add', parentNode: PDFAnnotation | null): void
  (e: 'node-edit', annotation: PDFAnnotation): void
  (e: 'node-delete', annotation: PDFAnnotation): void
  (e: 'layout-change', layout: string): void
}>()

// 加载 CSS 资源
const loadCSS = (urls: string[]) => {
  urls.forEach((url) => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }
  })
}

// 加载 JS 资源
const loadJS = (urls: string[]) => {
  urls.forEach((url) => {
    if (!document.querySelector(`script[src="${url}"]`)) {
      const script = document.createElement('script')
      script.src = url
      document.head.appendChild(script)
    }
  })
}


const mindmapRef = ref<HTMLDivElement>()
const svgContainerRef = ref<HTMLDivElement>()
let mm: any = null
let transformer: any = null

// 当前布局
const currentLayout = ref<string>('mindmap')

// 是否全屏
const isFullscreen = ref(false)

// 显示布局提示
const showLayoutTip = ref(false)

// 布局名称映射
const layoutNames: Record<string, string> = {
  mindmap: '思维导图',
  tree: '树状图',
  fishbone: '鱼骨图',
  timeline: '时间轴',
  vertical: '垂直图',
}

// 不同布局的配置
const layoutConfigs: Record<string, any> = {
  mindmap: {
    direction: 'right',
    spacingHorizontal: 100,
    spacingVertical: 10,
    nodeMinHeight: 20,
    paddingX: 20,
    paddingY: 10,
    lineWidth: 2,
    lineCurve: 0.5,
  },
  tree: {
    direction: 'down',
    spacingHorizontal: 50,
    spacingVertical: 60,
    nodeMinHeight: 24,
    paddingX: 24,
    paddingY: 8,
    lineWidth: 1.5,
    lineCurve: 0.3,
  },
  fishbone: {
    direction: 'right',
    spacingHorizontal: 80,
    spacingVertical: 40,
    nodeMinHeight: 28,
    paddingX: 20,
    paddingY: 12,
    lineWidth: 2,
    lineCurve: 0.2,
    fishbone: true,
  },
  timeline: {
    direction: 'right',
    spacingHorizontal: 120,
    spacingVertical: 60,
    nodeMinHeight: 32,
    paddingX: 16,
    paddingY: 10,
    lineWidth: 3,
    lineCurve: 0,
    timeline: true,
  },
  vertical: {
    direction: 'down',
    spacingHorizontal: 40,
    spacingVertical: 50,
    nodeMinHeight: 22,
    paddingX: 20,
    paddingY: 8,
    lineWidth: 1.5,
    lineCurve: 0.4,
  },
}

// 获取当前布局配置
const getCurrentLayoutConfig = () => {
  return layoutConfigs[currentLayout.value] || layoutConfigs.mindmap
}

// 初始化 Markmap
const initMarkmap = async () => {
  console.log('[MindMapViewer] initMarkmap 被调用')
  console.log('[MindMapViewer] svgContainerRef:', svgContainerRef.value)
  if (!svgContainerRef.value) {
    console.error('[MindMapViewer] svgContainerRef 为空，无法初始化')
    return
  }

  try {
    // 创建 Transformer 实例
    transformer = new Transformer()

    // 获取当前布局配置
    const config = getCurrentLayoutConfig()

    // 创建 Markmap 实例 - 使用最小配置
    mm = Markmap.create(svgContainerRef.value, null)

    // 设置自定义颜色
    if (mm.setOptions) {
      mm.setOptions({
        color: (d: any) => {
          const levelColors: Record<string, string> = {
            title: '#FF6B6B',
            h1: '#4ECDC4',
            h2: '#45B7D1',
            h3: '#96CEB4',
            h4: '#FFEAA7',
            h5: '#DDA0DD',
            text: '#98D8C8',
          }
          return levelColors[d.data?.level || 'text'] || '#98D8C8'
        },
      })
    }

    // 添加节点点击事件监听
    if (mm.svg) {
      mm.svg.on('click', (_event: any, d: any) => {
        if (d && d.data && d.data.annotationId) {
          const annotation = props.annotations.find((a) => a.id === d.data.annotationId)
          if (annotation) {
            emit('node-click', annotation)
          }
        }
      })
    }

    updateMindmap()

    // 添加 SVG 事件监听器
    if (mm.svg) {
      mm.svg.on('dblclick', () => {
        // 双击空白处添加根节点
        emit('node-add', null)
      })
    }
  } catch (error) {
    console.error('Failed to initialize markmap:', error)
    // 创建一个简单的错误提示
    const errorDiv = document.createElement('div')
    errorDiv.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--b3-theme-on-surface-light);
        text-align: center;
        padding: 20px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;"> Mind Map </div>
        <div>思维导图组件加载失败</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
          请确保已安装 markmap-lib 和 markmap-view 依赖
        </div>
      </div>
    `
    svgContainerRef.value.appendChild(errorDiv)
  }
}

// 更新思维导图
const updateMindmap = () => {
  console.log('[MindMapViewer] updateMindmap 被调用', {
    mm: !!mm,
    transformer: !!transformer,
    annotationsCount: props.annotations?.length || 0,
  })

  if (!mm || !transformer) {
    console.error('[MindMapViewer] updateMindmap: mm 或 transformer 未初始化')
    return
  }

  const markdown = generateMindmapMarkdown(props.annotations)
  console.log('[MindMapViewer] updateMindmap: markdown 生成', markdown.substring(0, 200))
  const {
    root,
    features,
  } = transformer.transform(markdown)

  // 为每个节点添加数据关联
  const addAnnotationData = (node: any) => {
    if (node.data && node.data.annotationId) {
      const annotation = props.annotations.find((a) => a.id === node.data.annotationId)
      if (annotation) {
        node.data.annotation = annotation
      }
    }
    if (node.children) {
      node.children.forEach(addAnnotationData)
    }
  }

  addAnnotationData(root)

  // 加载额外资源
  const {
    styles,
    scripts,
  } = transformer.getUsedAssets(features)
  if (styles) {
    loadCSS(styles)
  }
  if (scripts) {
    loadJS(scripts)
  }

  mm.setData(root)
  mm.fit()
}

// 切换布局
const changeLayout = () => {
  // 显示布局提示
  showLayoutTip.value = true
  setTimeout(() => {
    showLayoutTip.value = false
  }, 1500)

  // 发送布局变化事件
  emit('layout-change', currentLayout.value)

  // 重新初始化 markmap 以应用新布局
  if (mm) {
    mm.destroy?.()
    mm = null
  }

  nextTick(() => {
    initMarkmap()
  })
}

// 工具栏功能
const fitView = () => {
  if (mm) mm.fit()
}

const zoomIn = () => {
  if (mm) mm.zoomBy(0.5)
}

const zoomOut = () => {
  if (mm) mm.zoomBy(-0.5)
}

const expandAll = () => {
  // 展开所有节点
  if (mm && mm.state?.root) {
    mm.setData(mm.state.root)
    mm.fit()
  }
}

const collapseAll = () => {
  // 收起到根节点
  if (mm && mm.state?.root) {
    mm.setData({
      ...mm.state.root,
      children: mm.state.root.children?.map((child: any) => ({
        ...child,
        children: [], // 移除子节点
      })),
    })
    mm.fit()
  }
}

// 切换全屏
const toggleFullscreen = () => {
  if (!mindmapRef.value) return

  if (!isFullscreen.value) {
    // 进入全屏
    if (mindmapRef.value.requestFullscreen) {
      mindmapRef.value.requestFullscreen()
    } else if ((mindmapRef.value as any).webkitRequestFullscreen) {
      (mindmapRef.value as any).webkitRequestFullscreen()
    } else if ((mindmapRef.value as any).mozRequestFullScreen) {
      (mindmapRef.value as any).mozRequestFullScreen()
    } else if ((mindmapRef.value as any).msRequestFullscreen) {
      (mindmapRef.value as any).msRequestFullscreen()
    }
    isFullscreen.value = true
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
    isFullscreen.value = false
  }
}

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement
    || (document as any).webkitFullscreenElement
    || (document as any).mozFullScreenElement
    || (document as any).msFullscreenElement)
}

// 导出为 PNG
const exportPNG = () => {
  if (mm) {
    // 获取 SVG 内容并导出为 PNG
    const svgElement = mm.svg?.node()
    if (svgElement) {
      // 创建临时的下载链接
      const serializer = new XMLSerializer()
      const source = serializer.serializeToString(svgElement)

      // 创建 Blob 对象
      const blob = new Blob([source], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      // 创建下载链接
      const link = document.createElement('a')
      link.href = url
      link.download = `mindmap-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}

// 监听标注数据变化
watch(() => props.annotations, (newVal, oldVal) => {
  console.log('[MindMapViewer] annotations 变化:', {
    oldCount: oldVal?.length || 0,
    newCount: newVal?.length || 0,
  })

  nextTick(() => {
    updateMindmap()
  })
}, { deep: true })

// 也监听 annotations 的长度变化
watch(() => props.annotations?.length, (newLength, oldLength) => {
  console.log('[MindMapViewer] annotations 长度变化:', {
    oldLength,
    newLength,
  })
  if (oldLength !== newLength) {
    nextTick(() => {
      updateMindmap()
    })
  }
})

onMounted(() => {
  console.log('[MindMapViewer] onMounted 被调用')
  initMarkmap()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onUnmounted(() => {
  // 清理资源
  if (mm) {
    mm.destroy?.()
  }
  mm = null
  transformer = null
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})

// 暴露方法
defineExpose({
  fitView,
  zoomIn,
  zoomOut,
  expandAll,
  collapseAll,
  changeLayout,
  getCurrentLayout: () => currentLayout.value,
  setLayout: (layout: string) => {
    currentLayout.value = layout
    changeLayout()
  },
})
</script>

<style scoped lang="scss">
.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  position: relative;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--b3-border-color);
  margin: 0 4px;
}

.layout-selector {
  margin-right: 8px;

  .layout-select {
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    font-size: 13px;
    cursor: pointer;
    outline: none;

    &:focus {
      border-color: var(--b3-theme-primary);
    }

    &:hover {
      border-color: var(--b3-theme-primary);
    }
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }
}

.mindmap-content {
  flex: 1;
  overflow: hidden;
}

/* SVG 样式 */
:deep(svg) {
  width: 100%;
  height: 100%;
  cursor: grab;
}

:deep(svg:active) {
  cursor: grabbing;
}

:deep(.mm-node) {
  cursor: pointer;
  stroke-width: 1px;
  transition: all 0.2s ease;

  &:hover {
    stroke: var(--b3-theme-primary);
    stroke-width: 2px;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.2));
  }

  &.selected {
    stroke: #4CAF50;
    stroke-width: 3px;
    filter: drop-shadow(0 0 6px rgba(76, 175, 80, 0.4));
  }
}

:deep(.mm-link) {
  fill: none;
  stroke-opacity: 0.5;
  transition: stroke 0.2s ease;

  &:hover {
    stroke-opacity: 0.8;
  }
}

/* 文本样式 */
:deep(.mm-node-text) {
  pointer-events: none;
  user-select: none;
}

/* 布局提示 */
.layout-tip {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全屏样式 */
:deep(:fullscreen) {
  background: var(--b3-theme-background);
}

:deep(:-webkit-full-screen) {
  background: var(--b3-theme-background);
}

:deep(:-moz-full-screen) {
  background: var(--b3-theme-background);
}

:deep(:-ms-fullscreen) {
  background: var(--b3-theme-background);
}
</style>
