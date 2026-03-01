<script setup lang="ts">
/**
 * 文本卡片节点组件
 * MarginNote 风格的文本卡片节点 - 支持展开/折叠、缩放
 */

import { computed, toRefs, inject, ref } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import type { FreeMindMapNodeData } from '@/types/mindmapFree'

interface Props extends NodeProps {
  data: FreeMindMapNodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-expand', nodeId: string): void
  (e: 'resize-start', nodeId: string): void
  (e: 'resize', nodeId: string, size: { width: number; height: number }): void
  (e: 'resize-end', nodeId: string): void
}>()

const { data } = toRefs(props)

// 注入父组件提供的事件处理函数
const onToggleExpand = inject<(nodeId: string) => void>('onToggleExpand')
const onResizeStart = inject<(nodeId: string) => void>('onResizeStart')
const onResize = inject<(nodeId: string, size: { width: number; height: number }) => void>('onResize')
const onResizeEnd = inject<(nodeId: string) => void>('onResizeEnd')

// 展开/折叠状态
const isExpanded = computed(() => {
  return data.value.isExpanded !== false && !data.value.collapsed
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
    zIndex: 100
  }
})

// 是否正在拖拽缩放
const isResizing = ref(false)

// 计算节点颜色样式
const nodeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (data.value.color) {
    style.borderLeftColor = data.value.color
    style.borderLeftWidth = '4px'
  }

  if (data.value.customStyle) {
    if (data.value.customStyle.backgroundColor) {
      style.backgroundColor = data.value.customStyle.backgroundColor
    }
    if (data.value.customStyle.borderColor) {
      style.borderColor = data.value.customStyle.borderColor
    }
    if (data.value.customStyle.fontSize) {
      style.fontSize = data.value.customStyle.fontSize
    }
    if (data.value.customStyle.fontWeight) {
      style.fontWeight = data.value.customStyle.fontWeight
    }
  }

  return style
})

// 计算页码显示
const showPage = computed(() => {
  return data.value.page !== undefined && data.value.page !== null
})

// 计算内容预览
const contentPreview = computed(() => {
  if (!data.value.content) return ''
  const content = data.value.content
  if (content.length > 100) {
    return content.substring(0, 100) + '...'
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
    h5: '五级标题'
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
    gap: '8px'
  }
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
    minHeight: '60px'
  }

  if (data.value.size?.width) {
    style.width = `${data.value.size.width}px`
  }

  if (data.value.size?.height) {
    style.height = `${data.value.size.height}px`
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
      onResize(props.id, { width, height })
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

<template>
  <div
    class="marginnote-text-card-wrapper"
    :style="nodeContainerStyle"
  >
    <div
      class="marginnote-text-card"
      :style="capsuleStyle"
    >
      <!-- 左侧白色圆点装饰（MarginNote4 特色） -->
      <div class="mn-dot"></div>

      <!-- 展开/折叠按钮（有子节点时显示） -->
      <button
        v-if="childrenCount > 0"
        class="expand-toggle-btn"
        @click.stop="toggleExpand"
        :title="isExpanded ? '折叠子节点' : '展开子节点'"
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

    <!-- 缩放手柄 -->
    <div
      class="resize-handle"
      @mousedown="handleResizeStart"
      :title="拖拽调整大小"
    >
      <svg viewBox="0 0 16 16" class="resize-icon">
        <path d="M14 14V4m0 10H4m10 0L8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* MarginNote 风格文本卡片 - MarginNote4 胶囊形状 */
.marginnote-text-card {
  position: relative;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardAppear 0.3s ease-out;
  cursor: pointer;
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
