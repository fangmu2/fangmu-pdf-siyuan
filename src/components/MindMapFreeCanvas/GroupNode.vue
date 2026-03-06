<template>
  <div
    class="marginnote-group-node"
    :style="containerStyle"
  >
    <!-- 目标连接点（输入） -->
    <Handle
      type="target"
      :position="Position.Left"
      class="marginnote-handle"
    />

    <!-- 标题栏 -->
    <div
      v-if="showTitle"
      class="marginnote-group-header"
      :style="{ background: headerGradient }"
    >
      <span class="marginnote-group-icon">📦</span>
      <span class="marginnote-group-title">{{ data.title }}</span>
      <span
        v-if="childCount > 0"
        class="marginnote-group-count"
      >
        {{ childCount }} 个子节点
      </span>
    </div>

    <!-- 空状态提示 -->
    <div
      v-else
      class="marginnote-group-empty"
    >
      <span class="marginnote-empty-icon">📦</span>
      <span class="marginnote-empty-text">分组容器</span>
      <span class="marginnote-empty-hint">双击编辑标题</span>
    </div>

    <!-- 源连接点（输出） -->
    <Handle
      type="source"
      :position="Position.Right"
      class="marginnote-handle"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 分组容器节点组件
 * MarginNote 风格的分组框 - 优化版
 */

import type { NodeProps } from '@vue-flow/core'
import type { FreeMindMapGroupData } from '@/types/mindmapFree'
import {
  Handle,
  Position,
} from '@vue-flow/core'
import {
  computed,
  toRefs,
} from 'vue'

interface Props extends NodeProps {
  data: FreeMindMapGroupData
}

const props = defineProps<Props>()

const { data } = toRefs(props)

// 计算容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {}

  // 背景色
  if (data.value.backgroundColor) {
    style.backgroundColor = data.value.backgroundColor
  } else {
    style.backgroundColor = 'rgba(102, 126, 234, 0.08)'
  }

  // 边框颜色
  if (data.value.borderColor) {
    style.borderColor = data.value.borderColor
  } else {
    style.borderColor = 'rgba(102, 126, 234, 0.35)'
  }

  // 最小尺寸
  style.minWidth = data.value.minWidth ? `${data.value.minWidth}px` : '220px'
  style.minHeight = data.value.minHeight ? `${data.value.minHeight}px` : '160px'

  return style
})

// 计算标题栏渐变色
const headerGradient = computed(() => {
  const color = data.value.headerColor
  if (color) {
    return `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
  }
  return 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
})

// 是否显示标题
const showTitle = computed(() => {
  return !!(data.value.title && data.value.title.trim())
})

// 节点数量
const childCount = computed(() => {
  return data.value.childCount || 0
})
</script>

<style scoped>
/* MarginNote 风格分组容器 - 优化版 */
.marginnote-group-node {
  position: relative;
  min-width: 220px;
  min-height: 160px;
  padding: 0;
  background: rgba(102, 126, 234, 0.08);
  border: 2px solid rgba(102, 126, 234, 0.35);
  border-radius: 16px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  animation: groupAppear 0.4s ease-out;
}

/* 分组容器创建动画 */
@keyframes groupAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.marginnote-group-node:hover {
  border-color: rgba(102, 126, 234, 0.55);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.marginnote-group-node.selected {
  border-color: rgba(64, 158, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

/* 标题栏 */
.marginnote-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  min-height: 40px;
  backdrop-filter: blur(8px);
}

.marginnote-group-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.marginnote-group-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--siyuan-text, #333);
  flex: 1;
}

.marginnote-group-count {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.3);
  color: var(--siyuan-primary, #409eff);
  border-radius: 8px;
  font-weight: 600;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}

/* 空状态 */
.marginnote-group-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--siyuan-secondary-text, #999);
}

.marginnote-empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.marginnote-empty-text {
  font-size: 14px;
  font-weight: 500;
}

.marginnote-empty-hint {
  font-size: 11px;
  opacity: 0.7;
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
  z-index: 10;
}

.marginnote-handle:hover {
  width: 14px !important;
  height: 14px !important;
  opacity: 1 !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5) !important;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .marginnote-group-node {
    background: rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.45);
  }

  .marginnote-group-header {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  }

  .marginnote-group-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .marginnote-group-count {
    background: rgba(255, 255, 255, 0.15);
  }

  .marginnote-group-empty {
    color: var(--siyuan-secondary-text, #888);
  }

  .marginnote-empty-hint {
    color: var(--siyuan-tertiary-text, #666);
  }
}
</style>
