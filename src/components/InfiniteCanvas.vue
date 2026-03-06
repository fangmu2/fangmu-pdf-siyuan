<!-- src/components/InfiniteCanvas.vue -->
<template>
  <div
    ref="canvasRef"
    class="infinite-canvas"
  >
    <!-- 工具栏 -->
    <div class="canvas-toolbar">
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          :class="[{ active: tool === 'select' }]"
          title="选择工具 (V)"
          @click="tool = 'select'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4V2z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: tool === 'pan' }]"
          title="平移工具 (H)"
          @click="tool = 'pan'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: tool === 'node' }]"
          title="添加节点 (N)"
          @click="tool = 'node'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :class="[{ active: tool === 'link' }]"
          title="创建链接 (L)"
          @click="tool = 'link'"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          title="放大"
          @click="zoomIn"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
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
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          title="适应视图"
          @click="fitView"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          title="重置视图"
          @click="resetView"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group toolbar-info">
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
    </div>

    <!-- 画布内容 -->
    <div
      ref="contentRef"
      class="canvas-content"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @wheel="handleWheel"
    >
      <div
        class="canvas-viewport"
        :style="viewportStyle"
      >
        <!-- 网格背景 -->
        <div
          class="canvas-grid"
          :style="gridStyle"
        ></div>

        <!-- 子脑图 -->
        <div
          v-for="submap in submaps"
          :key="submap.id"
          class="canvas-submap"
          :class="[{ 'canvas-submap--selected': selectedSubmapId === submap.id }]"
          :style="getSubmapStyle(submap)"
          @click.stop="selectSubmap(submap)"
        >
          <div class="submap-header">
            <span class="submap-title">{{ submap.title }}</span>
            <button
              class="submap-delete"
              @click.stop="deleteSubmap(submap)"
            >
              ×
            </button>
          </div>
          <div class="submap-content">
            <!-- 子脑图节点预览 -->
            <div
              v-for="node in submap.nodes"
              :key="node.id"
              class="submap-node"
              :style="getNodeStyle(node, submap)"
            >
              {{ node.text }}
            </div>
          </div>
        </div>

        <!-- 连接线 -->
        <svg
          class="canvas-links"
          :style="svgStyle"
        >
          <defs>
            <marker
              id="canvas-arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="var(--b3-theme-primary)"
              />
            </marker>
          </defs>
          <path
            v-for="link in links"
            :key="link.id"
            :d="getCanvasLinkPath(link)"
            class="canvas-link-path"
            :stroke="link.color || 'var(--b3-theme-primary)'"
            marker-end="url(#canvas-arrowhead)"
          />
        </svg>

        <!-- 正在创建的链接 -->
        <svg
          v-if="isCreatingLink && linkStart && linkEnd"
          class="canvas-links-temp"
        >
          <path
            :d="getCanvasLinkPath({
              source: linkStart, target: linkEnd,
            })"
            class="canvas-link-path canvas-link-path--temp"
            stroke="var(--b3-theme-primary)"
            stroke-dasharray="5,5"
            marker-end="url(#canvas-arrowhead)"
          />
        </svg>

        <!-- 选中的节点 -->
        <div
          v-if="selectedNode"
          class="canvas-node-editor"
          :style="{
            left: `${selectedNode.x}px`, top: `${selectedNode.y}px`,
          }"
        >
          <textarea
            ref="nodeEditorRef"
            v-model="selectedNode.text"
            class="node-editor-textarea"
            @blur="updateNodeText"
            @keydown.esc.stop="cancelNodeEdit"
            @keydown.enter.stop="updateNodeText"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 添加子脑图对话框 -->
    <div
      v-if="showAddSubmapDialog"
      class="dialog-overlay"
      @click.self="closeAddSubmapDialog"
    >
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加子脑图</h3>
          <button
            class="dialog-close"
            @click="closeAddSubmapDialog"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <input
            v-model="newSubmapTitle"
            type="text"
            placeholder="输入子脑图标题..."
            class="dialog-input"
            @keydown.enter="confirmAddSubmap"
          />
        </div>
        <div class="dialog-footer">
          <button
            class="btn-cancel"
            @click="closeAddSubmapDialog"
          >
            取消
          </button>
          <button
            class="btn-confirm"
            @click="confirmAddSubmap"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  MindMap,
  MindMapNode,
} from '../types/mindmap'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

interface CanvasNode {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
}

interface CanvasSubmap {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  nodes: CanvasNode[]
  mindMap?: MindMap
}

interface CanvasLink {
  id: string
  source: { x: number, y: number }
  target: { x: number, y: number }
  color?: string
}

interface Props {
  initialMindMap?: MindMap
}

const props = withDefaults(defineProps<Props>(), {
  initialMindMap: undefined,
})

const emit = defineEmits<{
  (e: 'submap-click', submap: CanvasSubmap): void
  (e: 'link-create', link: CanvasLink): void
}>()

const canvasRef = ref<HTMLDivElement>()
const contentRef = ref<HTMLDivElement>()
const nodeEditorRef = ref<HTMLTextAreaElement>()

// 工具状态
const tool = ref<'select' | 'pan' | 'node' | 'link'>('select')

// 视图状态
const panX = ref(0)
const panY = ref(0)
const zoomLevel = ref(1)
const isPanning = ref(false)
const panStart = ref({
  x: 0,
  y: 0,
})

// 数据状态
const submaps = ref<CanvasSubmap[]>([])
const links = ref<CanvasLink[]>([])
const selectedSubmapId = ref<string | null>(null)
const selectedNode = ref<CanvasNode | null>(null)

// 创建链接状态
const isCreatingLink = ref(false)
const linkStart = ref<{ x: number, y: number } | null>(null)
const linkEnd = ref<{ x: number, y: number } | null>(null)
const linkSourceSubmap = ref<CanvasSubmap | null>(null)

// 添加子脑图对话框
const showAddSubmapDialog = ref(false)
const newSubmapTitle = ref('')
const newSubmapPosition = ref({
  x: 100,
  y: 100,
})

// 画布尺寸
const canvasWidth = ref(5000)
const canvasHeight = ref(5000)

// 视图样式
const viewportStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoomLevel.value})`,
  transformOrigin: '0 0',
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
}))

const gridStyle = computed(() => ({
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  backgroundSize: `${20 * zoomLevel.value}px ${20 * zoomLevel.value}px`,
}))

const svgStyle = computed(() => ({
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
}))

// 获取子脑图样式
const getSubmapStyle = (submap: CanvasSubmap) => ({
  left: `${submap.x}px`,
  top: `${submap.y}px`,
  width: `${submap.width}px`,
  height: `${submap.height}px`,
})

// 获取节点样式
const getNodeStyle = (node: CanvasNode, submap: CanvasSubmap) => ({
  left: `${node.x - submap.x}px`,
  top: `${node.y - submap.y}px`,
  width: `${node.width}px`,
  height: `${node.height}px`,
})

// 获取链接路径
const getCanvasLinkPath = (link: { source: { x: number, y: number }, target: { x: number, y: number } }): string => {
  const startX = link.source.x
  const startY = link.source.y
  const endX = link.target.x
  const endY = link.target.y

  // 使用贝塞尔曲线
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const offset = 50

  return `M ${startX} ${startY} Q ${midX + offset} ${midY - offset} ${endX} ${endY}`
}

// 选择子脑图
const selectSubmap = (submap: CanvasSubmap) => {
  selectedSubmapId.value = submap.id
  emit('submap-click', submap)
}

// 删除子脑图
const deleteSubmap = (submap: CanvasSubmap) => {
  const index = submaps.value.findIndex((s) => s.id === submap.id)
  if (index > -1) {
    submaps.value.splice(index, 1)
  }
  if (selectedSubmapId.value === submap.id) {
    selectedSubmapId.value = null
  }
}

// 选择节点
const selectNode = (node: CanvasNode, submap: CanvasSubmap) => {
  selectedNode.value = node
  nextTick(() => {
    nodeEditorRef.value?.focus()
  })
}

// 更新节点文本
const updateNodeText = () => {
  if (!selectedNode.value) return
  // TODO: 保存到数据
  selectedNode.value = null
}

// 取消节点编辑
const cancelNodeEdit = () => {
  selectedNode.value = null
}

// 添加子脑图
const addSubmap = (title: string, x: number, y: number) => {
  const submap: CanvasSubmap = {
    id: `submap-${Date.now()}`,
    title,
    x,
    y,
    width: 300,
    height: 200,
    nodes: [],
  }

  submaps.value.push(submap)
  return submap
}

// 显示添加子脑图对话框
const showAddSubmapDialogAt = (x: number, y: number) => {
  newSubmapPosition.value = {
    x: x - panX.value / zoomLevel.value,
    y: y - panY.value / zoomLevel.value,
  }
  showAddSubmapDialog.value = true
  newSubmapTitle.value = ''
}

// 关闭添加子脑图对话框
const closeAddSubmapDialog = () => {
  showAddSubmapDialog.value = false
  newSubmapTitle.value = ''
}

// 确认添加子脑图
const confirmAddSubmap = () => {
  if (!newSubmapTitle.value.trim()) return
  addSubmap(newSubmapTitle.value, newSubmapPosition.value.x, newSubmapPosition.value.y)
  closeAddSubmapDialog()
}

// 创建链接
const startCreatingLink = (submap: CanvasSubmap, event: MouseEvent) => {
  isCreatingLink.value = true
  linkSourceSubmap.value = submap
  linkStart.value = {
    x: submap.x + submap.width / 2,
    y: submap.y + submap.height / 2,
  }
  linkEnd.value = {
    x: event.clientX,
    y: event.clientY,
  }
}

// 完成创建链接
const finishCreatingLink = (targetSubmap: CanvasSubmap) => {
  if (!linkSourceSubmap.value || !linkStart.value) return

  const link: CanvasLink = {
    id: `link-${Date.now()}`,
    source: {
      x: linkSourceSubmap.value.x + linkSourceSubmap.value.width / 2,
      y: linkSourceSubmap.value.y + linkSourceSubmap.value.height / 2,
    },
    target: {
      x: targetSubmap.x + targetSubmap.width / 2,
      y: targetSubmap.y + targetSubmap.height / 2,
    },
  }

  links.value.push(link)
  emit('link-create', link)

  isCreatingLink.value = false
  linkStart.value = null
  linkEnd.value = null
  linkSourceSubmap.value = null
}

// 鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return // 只处理左键

  if (tool.value === 'pan' || e.button === 1) {
    isPanning.value = true
    panStart.value = {
      x: e.clientX - panX.value,
      y: e.clientY - panY.value,
    }
  } else if (tool.value === 'node') {
    const rect = contentRef.value?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX - rect.left - panX.value) / zoomLevel.value
      const y = (e.clientY - rect.top - panY.value) / zoomLevel.value
      showAddSubmapDialogAt(x, y)
    }
  }
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    panX.value = e.clientX - panStart.value.x
    panY.value = e.clientY - panStart.value.y
  }

  if (isCreatingLink.value && linkEnd.value) {
    const rect = contentRef.value?.getBoundingClientRect()
    if (rect) {
      linkEnd.value = {
        x: (e.clientX - rect.left - panX.value) / zoomLevel.value,
        y: (e.clientY - rect.top - panY.value) / zoomLevel.value,
      }
    }
  }
}

// 鼠标释放
const handleMouseUp = (e: MouseEvent) => {
  isPanning.value = false

  if (isCreatingLink.value) {
    // 检查是否释放在另一个子脑图上
    const target = e.target as HTMLElement
    const submapEl = target.closest('.canvas-submap')
    if (submapEl) {
      const submapId = submapEl.getAttribute('data-id')
      const targetSubmap = submaps.value.find((s) => s.id === submapId)
      if (targetSubmap && targetSubmap !== linkSourceSubmap.value) {
        finishCreatingLink(targetSubmap)
      }
    }
  }
}

// 鼠标离开
const handleMouseLeave = () => {
  isPanning.value = false
  if (isCreatingLink.value) {
    isCreatingLink.value = false
    linkStart.value = null
    linkEnd.value = null
    linkSourceSubmap.value = null
  }
}

// 滚轮缩放
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoomLevel.value = Math.max(0.2, Math.min(5, zoomLevel.value + delta))
}

// 放大
const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.2)
}

// 缩小
const zoomOut = () => {
  zoomLevel.value = Math.max(0.2, zoomLevel.value - 0.2)
}

// 适应视图
const fitView = () => {
  panX.value = 0
  panY.value = 0
  zoomLevel.value = 1
}

// 重置视图
const resetView = () => {
  fitView()
  canvasWidth.value = 5000
  canvasHeight.value = 5000
}

// 键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'v':
    case 'V':
      tool.value = 'select'
      break
    case 'h':
    case 'H':
      tool.value = 'pan'
      break
    case 'n':
    case 'N':
      tool.value = 'node'
      break
    case 'l':
    case 'L':
      tool.value = 'link'
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      fitView()
      break
    case 'Delete':
    case 'Backspace':
      if (selectedSubmapId.value) {
        const submap = submaps.value.find((s) => s.id === selectedSubmapId.value)
        if (submap) {
          deleteSubmap(submap)
        }
      }
      break
  }
}

// 初始化 - 从初始 MindMap 创建子脑图
watch(() => props.initialMindMap, (mindMap) => {
  if (mindMap && submaps.value.length === 0) {
    const submap: CanvasSubmap = {
      id: `submap-${Date.now()}`,
      title: mindMap.title || '思维导图',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      nodes: [],
      mindMap,
    }

    // 从 MindMap 提取节点
    const extractNodes = (node: MindMapNode, parentX: number, parentY: number): CanvasNode[] => {
      const nodes: CanvasNode[] = []
      const canvasNode: CanvasNode = {
        id: node.id,
        text: node.text,
        x: parentX,
        y: parentY,
        width: 120,
        height: 40,
      }
      nodes.push(canvasNode)

      // 递归处理子节点
      node.children?.forEach((child, index) => {
        const childNodes = extractNodes(
          child,
          parentX + 150,
          parentY + index * 60,
        )
        nodes.push(...childNodes)
      })

      return nodes
    }

    submap.nodes = extractNodes(mindMap.root, 50, 50)

    // 更新子脑图尺寸
    const maxX = Math.max(...submap.nodes.map((n) => n.x + n.width))
    const maxY = Math.max(...submap.nodes.map((n) => n.y + n.height))
    submap.width = maxX - submap.x + 50
    submap.height = maxY - submap.y + 50

    submaps.value.push(submap)
  }
}, { immediate: true })

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
.infinite-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
  z-index: 10;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  margin-right: 8px;
  border-right: 1px solid var(--b3-border-color);

  &:last-child {
    border-right: none;
  }
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-info {
  display: flex;
  align-items: center;
  color: var(--b3-theme-on-surface);
  font-size: 13px;
}

.zoom-level {
  min-width: 45px;
  text-align: center;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
  }
}

/* 画布内容 */
.canvas-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: crosshair;

  &[data-tool="pan"] {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.canvas-viewport {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

/* 网格背景 */
.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  background-image:
    linear-gradient(var(--b3-border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--b3-border-color) 1px, transparent 1px);
  background-position: -1px -1px;
  opacity: 0.3;
  pointer-events: none;
}

/* 子脑图 */
.canvas-submap {
  position: absolute;
  background: var(--b3-theme-surface);
  border: 2px solid var(--b3-border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &--selected {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 3px var(--b3-theme-primary-light), 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.submap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--b3-theme-background);
  border-bottom: 1px solid var(--b3-border-color);
}

.submap-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.submap-delete {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.submap-content {
  position: relative;
  height: calc(100% - 40px);
  overflow: hidden;
}

.submap-node {
  position: absolute;
  padding: 6px 10px;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  font-size: 11px;
  color: var(--b3-theme-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }
}

/* 连接线 */
.canvas-links,
.canvas-links-temp {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.canvas-link-path {
  fill: none;
  stroke-width: 2;
  opacity: 0.6;

  &--temp {
    opacity: 0.8;
  }
}

/* 节点编辑器 */
.canvas-node-editor {
  position: absolute;
  z-index: 20;
}

.node-editor-textarea {
  width: 200px;
  min-height: 60px;
  padding: 8px;
  border: 2px solid var(--b3-theme-primary);
  border-radius: 8px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  resize: both;
  font-family: inherit;

  &:focus {
    outline: none;
  }
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.dialog-body {
  padding: 20px;
}

.dialog-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;

  &:hover {
    opacity: 0.9;
  }
}
</style>
