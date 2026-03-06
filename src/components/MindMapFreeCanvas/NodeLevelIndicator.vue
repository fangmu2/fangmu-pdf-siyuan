<template>
  <div
    v-if="currentNode"
    class="node-level-indicator"
    :class="levelClass"
  >
    <!-- 层级徽章 -->
    <div
      v-if="showLevel"
      class="level-section"
    >
      <span
        class="level-badge"
        :style="{ backgroundColor: levelColor }"
      >
        L{{ level }}
      </span>
      <span class="level-text">层级</span>
    </div>

    <!-- 导航按钮 -->
    <div
      v-if="showNavigation"
      class="navigation-section"
    >
      <!-- 父节点导航 -->
      <button
        v-if="hasParent"
        class="nav-btn nav-btn-parent"
        title="导航到父节点"
        @click="handleNavigateToParent"
      >
        <span class="nav-icon">⬆️</span>
        <span class="nav-label">父节点</span>
        <span
          v-if="parentNode"
          class="node-title"
        >{{ parentNode.data.title }}</span>
      </button>
      <button
        v-else
        class="nav-btn nav-btn-parent disabled"
        disabled
        title="已经是根节点"
      >
        <span class="nav-icon">⬆️</span>
        <span class="nav-label">根节点</span>
      </button>

      <!-- 子节点导航 -->
      <div
        v-if="hasChildren"
        class="children-dropdown"
      >
        <button
          class="nav-btn nav-btn-children"
          title="导航到子节点"
        >
          <span class="nav-icon">⬇️</span>
          <span class="nav-label">子节点</span>
          <span class="count-badge">{{ childrenCount }}</span>
        </button>
        <div class="children-menu">
          <div
            v-for="child in childNodes"
            :key="child.id"
            class="menu-item"
            @click="handleNavigateToChild(child)"
          >
            <span class="menu-icon">📄</span>
            <span class="menu-title">{{ child.data.title }}</span>
          </div>
        </div>
      </div>
      <button
        v-else
        class="nav-btn nav-btn-children disabled"
        disabled
        title="没有子节点"
      >
        <span class="nav-icon">⬇️</span>
        <span class="nav-label">无子节点</span>
      </button>

      <!-- 兄弟节点导航 -->
      <button
        v-if="hasSiblings"
        class="nav-btn nav-btn-siblings"
        title="高亮兄弟节点"
        @click="handleHighlightSiblings"
      >
        <span class="nav-icon">👥</span>
        <span class="nav-label">兄弟节点</span>
        <span class="count-badge">{{ siblingNodes.length }}</span>
      </button>
    </div>

    <!-- 层级路径面包屑 -->
    <div
      v-if="levelPath.length > 1"
      class="breadcrumb-section"
    >
      <div class="breadcrumb-title">
        路径：
      </div>
      <div class="breadcrumb-path">
        <span
          v-for="(item, index) in levelPath"
          :key="item.id"
          class="breadcrumb-item"
          :class="{ active: item.id === currentNode.id }"
        >
          <span class="breadcrumb-level">L{{ item.level }}</span>
          <span class="breadcrumb-title-text">{{ item.title }}</span>
          <span
            v-if="index < levelPath.length - 1"
            class="breadcrumb-separator"
          >/</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 节点层级指示器组件
 * 显示节点在树中的层级，提供快速导航到父节点/子节点的功能
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'
import { computed } from 'vue'

interface Props {
  /** 当前选中的节点 */
  currentNode: FreeMindMapNode | null
  /** 所有节点列表 */
  nodes: FreeMindMapNode[]
  /** 是否显示层级指示器 */
  showLevel?: boolean
  /** 是否显示导航按钮 */
  showNavigation?: boolean
}

interface Emits {
  (e: 'navigate-parent'): void
  (e: 'navigate-child', childId: string): void
  (e: 'highlight-siblings'): void
}

const props = withDefaults(defineProps<Props>(), {
  showLevel: true,
  showNavigation: true,
})

const emit = defineEmits<Emits>()

/**
 * 计算节点层级
 * 从根节点开始计数，根节点为 0 级
 */
const level = computed<number>(() => {
  if (!props.currentNode) return 0

  let l = 0
  let current: FreeMindMapNode | null = props.currentNode

  while (current?.parentId) {
    const parent = props.nodes.find((n) => n.id === current!.parentId)
    if (!parent) break
    current = parent
    l++
  }

  return l
})

/**
 * 获取父节点
 */
const parentNode = computed<FreeMindMapNode | null>(() => {
  if (!props.currentNode?.parentId) return null
  return props.nodes.find((n) => n.id === props.currentNode.parentId) || null
})

/**
 * 是否有父节点
 */
const hasParent = computed<boolean>(() => {
  return parentNode.value !== null
})

/**
 * 获取子节点列表
 */
const childNodes = computed<FreeMindMapNode[]>(() => {
  if (!props.currentNode) return []
  return props.nodes.filter((n) => n.parentId === props.currentNode?.id)
})

/**
 * 是否有子节点
 */
const hasChildren = computed<boolean>(() => {
  return childNodes.value.length > 0
})

/**
 * 子节点数量
 */
const childrenCount = computed<number>(() => {
  return childNodes.value.length
})

/**
 * 获取兄弟节点列表
 */
const siblingNodes = computed<FreeMindMapNode[]>(() => {
  if (!props.currentNode?.parentId) return []
  return props.nodes.filter(
    (n) => n.parentId === props.currentNode?.parentId && n.id !== props.currentNode?.id,
  )
})

/**
 * 是否有兄弟节点
 */
const hasSiblings = computed<boolean>(() => {
  return siblingNodes.value.length > 0
})

/**
 * 获取层级路径（从根节点到当前节点）
 */
const levelPath = computed<Array<{ id: string, title: string, level: number }>>(() => {
  const path: Array<{ id: string, title: string, level: number }> = []

  if (!props.currentNode) return path

  // 从当前节点向上追溯
  let current: FreeMindMapNode | null = props.currentNode
  let depth = 0

  while (current) {
    path.unshift({
      id: current.id,
      title: current.data.title,
      level: depth,
    })

    if (!current.parentId) break
    current = props.nodes.find((n) => n.id === current!.parentId) || null
    depth++
  }

  return path
})

/**
 * 导航到父节点
 */
function handleNavigateToParent(): void {
  if (parentNode.value) {
    emit('navigate-parent')
  }
}

/**
 * 导航到子节点
 */
function handleNavigateToChild(child: FreeMindMapNode): void {
  emit('navigate-child', child.id)
}

/**
 * 高亮兄弟节点
 */
function handleHighlightSiblings(): void {
  emit('highlight-siblings')
}

/**
 * 获取层级样式类
 */
const levelClass = computed<string>(() => {
  return `level-${level.value}`
})

/**
 * 获取层级颜色
 */
const levelColor = computed<string>(() => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  return colors[level.value % colors.length]
})
</script>

<style scoped>
.node-level-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 层级徽章部分 */
.level-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 6px;
  background: var(--siyuan-primary, #409EFF);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s;
}

.level-text {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
}

/* 导航按钮部分 */
.navigation-section {
  display: flex;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--siyuan-text, #333);
  transition: all 0.2s;
  position: relative;
}

.nav-btn:hover:not(.disabled) {
  background: var(--siyuan-hover-bg, #e6e6e6);
  border-color: var(--siyuan-primary, #409EFF);
}

.nav-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 14px;
}

.nav-label {
  font-size: 11px;
  white-space: nowrap;
}

.node-title {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  background: var(--siyuan-primary, #409EFF);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
}

/* 子节点下拉菜单 */
.children-dropdown {
  position: relative;
}

.children-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s;
}

.children-dropdown:hover .children-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.menu-icon {
  font-size: 14px;
}

.menu-title {
  font-size: 12px;
  color: var(--siyuan-text, #333);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 面包屑路径 */
.breadcrumb-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  border-left: 1px solid var(--siyuan-border, #e0e0e0);
}

.breadcrumb-title {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
}

.breadcrumb-item.active {
  color: var(--siyuan-primary, #409EFF);
  font-weight: 500;
}

.breadcrumb-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 14px;
  padding: 0 3px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  font-size: 9px;
  font-weight: 600;
  border-radius: 7px;
}

.breadcrumb-item.active .breadcrumb-level {
  background: var(--siyuan-primary, #409EFF);
  color: #fff;
}

.breadcrumb-title-text {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-separator {
  color: var(--siyuan-border, #ccc);
  margin: 0 2px;
}

/* 层级样式变体 */
.level-0 .level-badge {
  background: #67C23A; /* 根节点绿色 */
}

.level-1 .level-badge {
  background: #409EFF; /* 一级蓝色 */
}

.level-2 .level-badge {
  background: #E6A23C; /* 二级橙色 */
}

.level-3 .level-badge {
  background: #F56C6C; /* 三级红色 */
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .node-level-indicator {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .nav-btn {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .nav-btn:hover:not(.disabled) {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .breadcrumb-item {
    color: var(--siyuan-secondary-text, #999);
  }

  .breadcrumb-level {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-text, #e0e0e0);
  }
}

/* 滚动条样式 */
.children-menu::-webkit-scrollbar {
  width: 6px;
}

.children-menu::-webkit-scrollbar-track {
  background: transparent;
}

.children-menu::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 3px;
}

.children-menu::-webkit-scrollbar-thumb:hover {
  background: var(--siyuan-secondary-text, #999);
}
</style>
