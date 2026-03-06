<template>
  <div
    class="marginnote-text-card-wrapper"
    :style="nodeContainerStyle"
  >
    <!-- 背景图片层（如果有背景） -->
    <div
      v-if="data.backgroundImage?.url"
      class="background-overlay"
      :style="{
        opacity: data.backgroundImage.opacity ?? 1,
      }"
    ></div>

    <div
      class="marginnote-text-card"
      :style="[capsuleStyle, referenceNodeStyle]"
      @click="handleNodeClick"
    >
      <!-- 左侧白色圆点装饰（MarginNote4 特色） -->
      <div class="mn-dot"></div>

      <!-- 展开/折叠按钮（有子节点时显示） -->
      <button
        v-if="childrenCount > 0"
        class="expand-toggle-btn"
        :title="isExpanded ? '折叠子节点' : '展开子节点'"
        @click.stop="toggleExpand"
      >
        {{ expandIcon }}
      </button>

      <!-- 目标连接点（输入） -->
      <Handle
        type="target"
        :position="Position.Left"
        class="marginnote-handle"
      />

      <!-- 卡片内容区 -->
      <div class="marginnote-card-body">
        <!-- 层级图标（如果有） -->
        <span
          v-if="levelIcon"
          class="marginnote-level-icon"
          :title="getLevelText(data.value.level)"
        >
          {{ levelIcon }}
        </span>

        <!-- 标题 -->
        <span class="marginnote-card-title">{{ data.title }}</span>

        <!-- 页码徽章 -->
        <span
          v-if="showPage"
          class="marginnote-page-badge"
        >
          P.{{ data.page }}
        </span>

        <!-- 子节点数量徽章 -->
        <span
          v-if="childrenCount > 0"
          class="marginnote-children-badge"
          :title="`${childrenCount} 个子节点`"
        >
          {{ childrenCount }}
        </span>
      </div>

      <!-- 内容预览（可选显示） -->
      <div
        v-if="data.content && contentPreview && data.showContent"
        class="marginnote-card-content"
      >
        {{ contentPreview }}
      </div>

      <!-- 源连接点（输出） -->
      <Handle
        type="source"
        :position="Position.Right"
        class="marginnote-handle"
      />
    </div>

    <!-- 旋转手柄 -->
    <div
      class="rotate-handle"
      title="拖拽旋转（双击重置）"
      @mousedown="handleRotateStart"
    >
      <svg
        viewBox="0 0 24 24"
        class="rotate-icon"
      >
        <path
          d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <!-- 缩放手柄 -->
    <div
      class="resize-handle"
      :title="拖拽调整大小"
      @mousedown="handleResizeStart"
    >
      <svg
        viewBox="0 0 16 16"
        class="resize-icon"
      >
        <path
          d="M14 14V4m0 10H4m10 0L8 8"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文本卡片节点组件
 * MarginNote 风格的文本卡片节点 - 支持展开/折叠、缩放
 */

import type { NodeProps } from '@vue-flow/core'
import type { FreeMindMapNodeData } from '@/types/mindmapFree'
import {
  Handle,
  Position,
} from '@vue-flow/core'
import {
  computed,
  inject,
  ref,
  toRefs,
} from 'vue'

interface Props extends NodeProps {
  data: FreeMindMapNodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-expand', nodeId: string): void
  (e: 'resize-start', nodeId: string): void
  (e: 'resize', nodeId: string, size: { width: number, height: number }): void
  (e: 'resize-end', nodeId: string): void
  (e: 'node-click', payload: {
    nodeId: string
    pdfPath?: string
    page?: number
    rect?: [number, number, number, number]
    annotationId?: string
  }): void
}>()

const { data } = toRefs(props)

// 注入父组件提供的事件处理函数
const onToggleExpand = inject<(nodeId: string) => void>('onToggleExpand')
const onResizeStart = inject<(nodeId: string) => void>('onResizeStart')
const onResize = inject<(nodeId: string, size: { width: number, height: number }) => void>('onResize')
const onResizeEnd = inject<(nodeId: string) => void>('onResizeEnd')

// 展开/折叠状态
const isExpanded = computed(() => {
  return data.value.isExpanded !== false && !data.value.collapsed
})

// 节点旋转角度
const rotation = computed(() => {
  return data.value.rotation || 0
})

// 计算背景样式
const backgroundStyle = computed(() => {
  const bg = data.value.backgroundImage
  if (!bg?.url) {
    return {}
  }

  const style: Record<string, string> = {
    backgroundImage: `url(${bg.url})`,
    backgroundSize: bg.mode === 'tile' ? 'auto' : bg.mode,
    backgroundRepeat: bg.mode === 'tile' ? 'repeat' : 'no-repeat',
    backgroundPosition: bg.position ? `${bg.position.x}px ${bg.position.y}px` : 'center',
    opacity: String(bg.opacity ?? 1),
  }

  return style
})

// 是否为引用节点（视觉区分）
const isReferenceNode = computed(() => {
  return data.value.nodeType === 'reference'
})

// 是否为克隆节点（视觉标识）
const isCloneNode = computed(() => {
  return data.value.nodeType === 'clone'
})

// 节点卡片样式
const cardBodyStyle = computed(() => {
  const baseStyle: Record<string, string> = {}

  // 优先使用自定义边框样式
  if (data.value.borderStyle && data.value.borderStyle !== 'none') {
    const borderWidth = data.value.borderWidth ?? 2
    const borderColor = data.value.borderColor || '#333333'
    baseStyle.borderStyle = data.value.borderStyle
    baseStyle.borderWidth = `${borderWidth}px`
    baseStyle.borderColor = borderColor
  } else {
    // 引用节点：蓝色边框
    if (isReferenceNode.value) {
      baseStyle.border = '2px solid #409eff'
      baseStyle['box-shadow'] = '0 0 8px rgba(64, 158, 255, 0.3)'
    }

    // 克隆节点：虚线边框
    if (isCloneNode.value) {
      baseStyle.border = '2px dashed #909399'
      baseStyle.opacity = '0.85'
    }
  }

  return baseStyle
})

// 节点尺寸（默认值）
const nodeWidth = computed(() => {
  return data.value.size?.width || 200
})

const nodeHeight = computed(() => {
  return data.value.size?.height || 'auto'
})

// 缩放手柄样式
const resizeHandleStyle = computed(() => {
  return {
    position: 'absolute' as const,
    right: '4px',
    bottom: '4px',
    width: '16px',
    height: '16px',
    cursor: 'nwse-resize',
    zIndex: 100,
  }
})

// 是否正在拖拽缩放
const isResizing = ref(false)

// 是否正在旋转
const isRotating = ref(false)

// 旋转手柄样式
const rotateHandleStyle = computed(() => {
  return {
    position: 'absolute' as const,
    right: '4px',
    top: '-20px',
    width: '24px',
    height: '24px',
    cursor: 'grab',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(64, 158, 255, 0.8)',
    borderRadius: '50%',
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  }
})

// 点击节点处理 - 跳转到 PDF
function handleNodeClick(event: MouseEvent): void {
  // 检查是否有文档引用信息
  // 字段映射：data.value.pdfPath -> pdfPath, data.value.page -> page
  const pdfPath = data.value.pdfPath
  const page = data.value.page

  if (pdfPath && page) {
    // 发送跳转事件到父组件
    emit('node-click', {
      nodeId: props.id,
      pdfPath,
      page,
      rect: data.value.rect || undefined,
      annotationId: data.value.annotationId || undefined,
    })
  }
}

// 旋转移处理
function handleRotateMove(event: MouseEvent): void {
  if (!isRotating.value) return

  // 获取节点中心点
  const target = event.target as HTMLElement
  const nodeElement = target.closest('.marginnote-text-card-wrapper')

  if (nodeElement) {
    const rect = nodeElement.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // 计算旋转角度
    const rad = Math.atan2(event.clientY - centerY, event.clientX - centerX)
    let deg = rad * (180 / Math.PI) + 90

    // 吸附到 15°倍数
    deg = Math.round(deg / 15) * 15

    // 直接更新 data.value.rotation（响应式）
    data.value.rotation = deg
  }
}

// 旋转结束处理
function handleRotateEnd(): void {
  if (!isRotating.value) return
  isRotating.value = false

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleRotateMove)
  document.removeEventListener('mouseup', handleRotateEnd)
}

// 双击重置旋转角度
function handleRotateReset(): void {
  data.value.rotation = 0
}

// 计算页码显示
const showPage = computed(() => {
  return data.value.page !== undefined && data.value.page !== null
})

// 计算内容预览
const contentPreview = computed(() => {
  if (!data.value.content) return ''
  const content = data.value.content
  if (content.length > 100) {
    return `${content.substring(0, 100)}...`
  }
  return content
})

// 计算层级图标
const levelIcon = computed(() => {
  const level = data.value.level || ''
  switch (level) {
    case 'title':
      return '🎯'
    case 'h1':
      return '📌'
    case 'h2':
      return '📍'
    case 'h3':
      return '📎'
    case 'h4':
    case 'h5':
      return '🏷️'
    default:
      return ''
  }
})

// 获取层级文本描述
function getLevelText(level: string | undefined): string {
  const levelMap: Record<string, string> = {
    title: '标题',
    h1: '一级标题',
    h2: '二级标题',
    h3: '三级标题',
    h4: '四级标题',
    h5: '五级标题',
  }
  return levelMap[level || ''] || '正文'
}

// 切换展开/折叠状态
function toggleExpand(): void {
  // 使用注入的事件处理函数
  if (onToggleExpand) {
    onToggleExpand(props.id)
  }
}

// 计算卡片头部渐变色（MarginNote4 风格 - 紫色渐变）
const headerGradient = computed(() => {
  const color = data.value.color
  if (color) {
    return `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
  }
  // MarginNote4 经典紫色渐变
  return 'linear-gradient(135deg, #6B5CE7 0%, #A869C9 100%)'
})

// MarginNote4 风格胶囊形状
const capsuleStyle = computed(() => {
  return {
    background: headerGradient.value,
    borderRadius: '20px',
    padding: '10px 16px 10px 24px', // 左侧留更多空间给圆点
    minWidth: '180px',
    maxWidth: '300px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(107, 92, 231, 0.3)',
    color: '#fff',
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
})

// 引用/克隆节点样式
const referenceNodeStyle = computed(() => {
  const style: Record<string, string> = {}

  // 引用节点：蓝色边框和发光效果
  if (isReferenceNode.value) {
    style.border = '2px solid #409eff'
    style.boxShadow = '0 0 12px rgba(64, 158, 255, 0.5)'
  }

  // 克隆节点：虚线边框和半透明
  if (isCloneNode.value) {
    style.border = '2px dashed #909399'
    style.opacity = '0.85'
  }

  return style
})

// 展开/折叠图标
const expandIcon = computed(() => {
  return isExpanded.value ? '▼' : '▶'
})

// 子节点数量（从 parentId 关系计算）
const childrenCount = computed(() => {
  return data.value.childrenIds?.length || 0
})

// 节点容器样式（支持缩放）
const nodeContainerStyle = computed(() => {
  const style: Record<string, string | number> = {
    position: 'relative',
    display: 'inline-block',
    minWidth: '180px',
    minHeight: '60px',
  }

  if (data.value.size?.width) {
    style.width = `${data.value.size.width}px`
  }

  if (data.value.size?.height) {
    style.height = `${data.value.size.height}px`
  }

  // 合并背景样式
  if (backgroundStyle.value) {
    Object.assign(style, backgroundStyle.value)
  }

  return style
})

// 开始缩放
function handleResizeStart(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  isResizing.value = true

  if (onResizeStart) {
    onResizeStart(props.id)
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

// 缩放移动处理
function handleResizeMove(event: MouseEvent): void {
  if (!isResizing.value) return

  const target = event.target as HTMLElement
  const nodeElement = target.closest('.marginnote-text-card-wrapper')

  if (nodeElement) {
    const rect = nodeElement.getBoundingClientRect()
    const newWidth = event.clientX - rect.left
    const newHeight = event.clientY - rect.top

    // 限制最小/最大尺寸
    const minWidth = 180
    const minHeight = 60
    const maxWidth = 500
    const maxHeight = 400

    const width = Math.max(minWidth, Math.min(newWidth, maxWidth))
    const height = Math.max(minHeight, Math.min(newHeight, maxHeight))

    if (onResize) {
      onResize(props.id, {
        width,
        height,
      })
    }
  }
}

// 结束缩放
function handleResizeEnd(): void {
  isResizing.value = false

  if (onResizeEnd) {
    onResizeEnd(props.id)
  }

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}
</script>

<style scoped>
/* MarginNote 风格文本卡片 - MarginNote4 胶囊形状 */
.marginnote-text-card {
  position: relative;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardAppear 0.3s ease-out;
  cursor: pointer;
  z-index: 1; /* 确保在背景之上 */
}

/* 卡片创建动画 */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.marginnote-text-card:hover {
  box-shadow: 0 6px 16px rgba(107, 92, 231, 0.4);
  transform: translateY(-2px) scale(1.02);
}

.marginnote-text-card.selected {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(107, 92, 231, 0.4);
}

/* MarginNote4 特色：左侧白色圆点 */
.mn-dot {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

/* 卡片主体 - 为展开按钮留空间 */
.marginnote-card-body {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding-left: 20px; /* 为展开按钮留空间 */
}

.marginnote-level-icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.9;
}

.marginnote-card-title {
  font-weight: 600;
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.marginnote-page-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border-radius: 6px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
  white-space: nowrap;
}

/* 子节点数量徽章 */
.marginnote-children-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 8px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  opacity: 0.9;
}

/* 展开/折叠按钮 */
.expand-toggle-btn {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;
  z-index: 10;
}

.expand-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.expand-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* 卡片内容预览 */
.marginnote-card-content {
  width: 100%;
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 连接点样式 */
.marginnote-handle {
  width: 10px !important;
  height: 10px !important;
  background: #fff !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  opacity: 0.8;
}

.marginnote-handle:hover {
  width: 14px !important;
  height: 14px !important;
  opacity: 1 !important;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
}

/* 节点包装器 */
.marginnote-text-card-wrapper {
  position: relative;
  display: inline-block;
}

/* 背景图片覆盖层 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  z-index: 0;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 旋转手柄样式 */
.rotate-handle {
  position: absolute;
  right: 4px;
  top: -20px;
  width: 24px;
  height: 24px;
  background: rgba(64, 158, 255, 0.8);
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.marginnote-text-card-wrapper:hover .rotate-handle {
  opacity: 1;
}

.rotate-handle:hover {
  background: rgba(64, 158, 255, 0.95);
  cursor: grabbing;
  transform: scale(1.1);
}

.rotate-handle:active {
  cursor: grabbing;
}

.rotate-icon {
  width: 14px;
  height: 14px;
  color: #fff;
}

/* 旋转中的样式 */
.marginnote-text-card-wrapper.rotating .rotate-handle {
  opacity: 1;
  background: rgba(64, 158, 255, 0.95);
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marginnote-text-card:hover .resize-handle {
  opacity: 1;
}

.resize-handle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.resize-icon {
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.8);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .marginnote-text-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .marginnote-text-card:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  .mn-dot {
    background: rgba(255, 255, 255, 0.95);
  }
}
</style>
