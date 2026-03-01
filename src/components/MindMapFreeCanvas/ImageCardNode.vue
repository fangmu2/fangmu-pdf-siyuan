<script setup lang="ts">
/**
 * 图片卡片节点组件
 * MarginNote 风格的图片/PDF 摘录卡片节点 - 优化版
 */

import { computed, toRefs, ref } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import type { FreeMindMapNodeData } from '@/types/mindmapFree'

interface Props extends NodeProps {
  data: FreeMindMapNodeData
}

const props = defineProps<Props>()

const { data } = toRefs(props)

// 图片加载状态
const imageLoaded = ref(false)
const imageError = ref(false)

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
  }

  return style
})

// 计算页码显示
const showPage = computed(() => {
  return data.value.page !== undefined && data.value.page !== null
})

// 计算卡片头部渐变色
const headerGradient = computed(() => {
  const color = data.value.color
  if (color) {
    return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
  }
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

// 图片加载完成
function onImageLoad(): void {
  imageLoaded.value = true
}

// 图片加载失败
function onImageError(): void {
  imageError.value = true
}
</script>

<template>
  <div
    class="marginnote-image-card"
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
      <span class="marginnote-card-icon">🖼️</span>
      <span class="marginnote-card-title">{{ data.title }}</span>
      <span
        v-if="showPage"
        class="marginnote-page-badge"
      >
        P.{{ data.page }}
      </span>
    </div>

    <!-- 图片区域 -->
    <div class="marginnote-card-image-wrapper">
      <!-- 图片加载前的占位符 -->
      <div
        v-if="!imageLoaded && !imageError"
        class="marginnote-image-placeholder"
      >
        <span class="marginnote-loading-icon">📷</span>
        <span class="marginnote-loading-text">加载中...</span>
      </div>

      <!-- 图片加载失败 -->
      <div
        v-else-if="imageError"
        class="marginnote-image-error"
      >
        <span class="marginnote-error-icon">⚠️</span>
        <span class="marginnote-error-text">图片加载失败</span>
      </div>

      <!-- 正常显示图片 -->
      <img
        v-else
        :src="data.imageUrl"
        :alt="data.title"
        class="marginnote-card-image"
        @load="onImageLoad"
        @error="onImageError"
      />
    </div>

    <!-- 卡片内容（如果有笔记） -->
    <div
      v-if="data.content"
      class="marginnote-card-note"
    >
      <span class="marginnote-note-icon">📝</span>
      <span class="marginnote-note-text">{{ data.content }}</span>
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
/* MarginNote 风格图片卡片 - 优化版 */
.marginnote-image-card {
  position: relative;
  min-width: 200px;
  max-width: 300px;
  background: var(--siyuan-block-bg, #fff);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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

.marginnote-image-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
  border-color: rgba(64, 158, 255, 0.3);
}

.marginnote-image-card.selected {
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

.marginnote-card-icon {
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

/* 图片区域 */
.marginnote-card-image-wrapper {
  position: relative;
  width: 100%;
  min-height: 120px;
  max-height: 220px;
  background: var(--siyuan-gray-bg, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.marginnote-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--siyuan-gray-text, #999);
}

.marginnote-loading-icon {
  font-size: 36px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.marginnote-loading-text {
  font-size: 12px;
}

.marginnote-image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--siyuan-error, #f56c6c);
}

.marginnote-error-icon {
  font-size: 28px;
}

.marginnote-error-text {
  font-size: 12px;
}

.marginnote-card-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.marginnote-card-image:hover {
  transform: scale(1.02);
}

/* 卡片笔记 */
.marginnote-card-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #555);
}

.marginnote-note-icon {
  flex-shrink: 0;
}

.marginnote-note-text {
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
  .marginnote-image-card {
    background: var(--siyuan-block-bg, #2d2d2d);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .marginnote-image-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .marginnote-card-image-wrapper {
    background: var(--siyuan-gray-bg, #2a2a2a);
  }

  .marginnote-card-note {
    background: rgba(255, 255, 255, 0.05);
    color: var(--siyuan-secondary-text, #aaa);
  }

  .marginnote-handle {
    border-color: #2d2d2d !important;
  }
}
</style>
