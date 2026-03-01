<script setup lang="ts">
/**
 * 文本卡片节点组件
 * MarginNote 风格的文本卡片节点 - 优化版
 */

import { computed, toRefs } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import type { FreeMindMapNodeData } from '@/types/mindmapFree'

interface Props extends NodeProps {
  data: FreeMindMapNodeData
}

const props = defineProps<Props>()

const { data } = toRefs(props)

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
      return '💬'
  }
})

// 计算卡片头部渐变色
const headerGradient = computed(() => {
  const color = data.value.color
  if (color) {
    return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
  }
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})
</script>

<template>
  <div
    class="marginnote-text-card"
    :style="nodeStyle"
  >
    <!-- 目标连接点（输入） -->
    <Handle
      type="target"
      :position="Position.Left"
      class="marginnote-handle"
    />

    <!-- 卡片头部 -->
    <div class="marginnote-card-header" :style="{ background: headerGradient }">
      <span class="marginnote-level-icon">{{ levelIcon }}</span>
      <span class="marginnote-card-title">{{ data.title }}</span>
      <span
        v-if="showPage"
        class="marginnote-page-badge"
      >
        P.{{ data.page }}
      </span>
    </div>

    <!-- 卡片内容 -->
    <div
      v-if="data.content || contentPreview"
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
</template>

<style scoped>
/* MarginNote 风格文本卡片 - 优化版 */
.marginnote-text-card {
  position: relative;
  min-width: 160px;
  max-width: 320px;
  background: var(--siyuan-block-bg, #fff);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  line-height: 1.6;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: cardAppear 0.3s ease-out;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
  border-color: rgba(64, 158, 255, 0.3);
}

.marginnote-text-card.selected {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

/* 卡片头部 - 渐变色设计 */
.marginnote-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px 12px 0 0;
  min-height: 32px;
}

.marginnote-level-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.marginnote-card-title {
  font-weight: 600;
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
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
}

/* 卡片内容 */
.marginnote-card-content {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #555);
  max-height: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  background: rgba(0, 0, 0, 0.02);
  margin: 0 8px 8px 8px;
  border-radius: 6px;
}

/* 连接点样式 */
.marginnote-handle {
  width: 10px !important;
  height: 10px !important;
  background: var(--siyuan-primary, #409eff) !important;
  border: 2px solid #fff !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  opacity: 0.8;
}

.marginnote-handle:hover {
  width: 14px !important;
  height: 14px !important;
  opacity: 1 !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5) !important;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .marginnote-text-card {
    background: var(--siyuan-block-bg, #2d2d2d);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .marginnote-text-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .marginnote-card-content {
    background: rgba(255, 255, 255, 0.05);
    color: var(--siyuan-secondary-text, #aaa);
  }

  .marginnote-handle {
    border-color: #2d2d2d !important;
  }
}
</style>
