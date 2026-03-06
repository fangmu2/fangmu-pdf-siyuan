<!-- src/components/OutlineView.vue -->
<template>
  <div class="outline-view">
    <!-- 工具栏 -->
    <div class="outline-toolbar">
      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          title="展开全部"
          @click="expandAll"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
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
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          title="添加节点 (Enter)"
          @click="addNode"
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
          title="添加同级节点"
          @click="addSiblingNode"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path
              d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              transform="rotate(90 12 12)"
            />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          title="缩进 (Tab)"
          @click="indentNode"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 17h10v-2H11v2zM11 3v2h10V3H11zM3 3v2h14V3H3z" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          title="取消缩进 (Shift+Tab)"
          @click="outdentNode"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zM11 3v2h10V3H11zM3 3v2h14V3H3z" />
          </svg>
        </button>
        <button
          class="toolbar-btn toolbar-btn-danger"
          title="删除节点 (Delete)"
          @click="deleteNode"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <button
          class="toolbar-btn"
          title="切换到思维导图"
          @click="switchToMindMap"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-8 10H4V5h10v14zm6-12h-2v2h2v-2zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 大纲内容 -->
    <div
      ref="contentRef"
      class="outline-content"
    >
      <!-- 使用 Vue Draggable 实现拖拽 -->
      <draggable
        v-model="flatNodesForDrag"
        item-key="id"
        :disabled="!dragEnabled"
        ghost-class="outline-node--ghost"
        chosen-class="outline-node--chosen"
        drag-class="outline-node--drag"
        handle=".outline-node__drag-handle"
        :animation="150"
        :fallback-on-body="true"
        :touch-start-threshold="5"
        @start="handleDragStart"
        @end="handleDragEnd"
        @move="handleDragMove"
      >
        <template
          #item="{
            element: node, index,
          }"
        >
          <div
            class="outline-node"
            :class="[
              {
                'outline-node--selected': selectedNodeId === node.id,
                'outline-node--editing': editingNodeId === node.id,
                'outline-node--drop-target': dropTargetIndex === index,
              },
            ]"
            :style="{ paddingLeft: `${node.level * 24 + 12}px` }"
            :data-node-id="node.id"
            :data-drop-target="dropTargetIndex === index ? dropTargetType : null"
            @click="selectNode(node)"
            @dblclick="startEditing(node)"
            @dragover.prevent
            @drop.prevent="handleDrop($event, node, index)"
          >
            <!-- 拖拽手柄 -->
            <div
              class="outline-node__drag-handle"
              title="拖拽调整顺序/层级"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <circle
                  cx="9"
                  cy="5"
                  r="2"
                />
                <circle
                  cx="15"
                  cy="5"
                  r="2"
                />
                <circle
                  cx="9"
                  cy="12"
                  r="2"
                />
                <circle
                  cx="15"
                  cy="12"
                  r="2"
                />
                <circle
                  cx="9"
                  cy="19"
                  r="2"
                />
                <circle
                  cx="15"
                  cy="19"
                  r="2"
                />
              </svg>
            </div>

            <!-- 展开/折叠按钮 -->
            <button
              v-if="node.hasChildren"
              class="outline-node__toggle"
              :class="[{ 'outline-node__toggle--expanded': node.expanded }]"
              @click.stop="toggleExpand(node)"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
            <span
              v-else
              class="outline-node__toggle-placeholder"
            ></span>

            <!-- 节点内容 -->
            <div class="outline-node__content">
              <template v-if="editingNodeId === node.id">
                <textarea
                  ref="editingTextareaRef"
                  v-model="editingText"
                  class="outline-node__textarea"
                  rows="1"
                  @blur="stopEditing"
                  @keydown.enter.stop.prevent="handleEditEnter"
                  @keydown.esc.stop="cancelEditing"
                ></textarea>
              </template>
              <template v-else>
                <span class="outline-node__text">{{ node.text }}</span>
                <span
                  v-if="node.annotation"
                  class="outline-node__meta"
                >
                  <span
                    class="outline-node__badge"
                    :class="`badge--${node.annotation.level}`"
                  >
                    {{ getLevelLabel(node.annotation.level) }}
                  </span>
                  <span
                    v-if="node.annotation.page"
                    class="outline-node__page"
                  >
                    P{{ node.annotation.page }}
                  </span>
                </span>
              </template>
            </div>
          </div>
        </template>
      </draggable>

      <!-- 空状态 -->
      <div
        v-if="nodes.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
        <p>暂无内容</p>
        <p class="empty-state-hint">
          双击节点或按 Enter 键添加内容
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PDFAnnotation } from '../types/annotaion'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import draggable from 'vuedraggable'
import {
  calculateDropTargetType,
  insertNodeIntoTree,
  isValidDropTarget,
  OutlineDropTargetType,
  removeNodeFromTree,
  updateNodeLevels,
} from '../utils/outlineDragUtils'

interface OutlineNode {
  id: string
  text: string
  level: number
  expanded: boolean
  hasChildren: boolean
  parentId: string | null
  annotation?: PDFAnnotation
  children: OutlineNode[]
}

interface Props {
  annotations: PDFAnnotation[]
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => [],
})

const emit = defineEmits<{
  (e: 'node-click', annotation: PDFAnnotation): void
  (e: 'node-add', parentNode: PDFAnnotation | null): void
  (e: 'node-edit', annotation: PDFAnnotation, newContent: string): void
  (e: 'node-delete', annotation: PDFAnnotation): void
  (e: 'node-move', annotations: PDFAnnotation[]): void
  (e: 'sync-to-mindmap'): void
  (e: 'switch-to-mindmap'): void
}>()

const contentRef = ref<HTMLDivElement>()
const editingTextareaRef = ref<HTMLTextAreaElement>()

// 状态
const nodes = ref<OutlineNode[]>([])
const selectedNodeId = ref<string | null>(null)
const editingNodeId = ref<string | null>(null)
const editingText = ref('')
const expandedNodeIds = ref<Set<string>>(new Set())

// 拖拽相关状态
const dragEnabled = ref(true)
const isDragging = ref(false)
const draggedNodeId = ref<string | null>(null)
const dropTargetIndex = ref<number | null>(null)
const dropTargetType = ref<OutlineDropTargetType | null>(null)
const flatNodesForDrag = ref<OutlineNode[]>([])

// 更新扁平化节点列表（用于拖拽）
const updateFlatNodesForDrag = () => {
  const flatten = (nodeList: OutlineNode[], result: OutlineNode[]) => {
    for (const node of nodeList) {
      result.push(node)
      if (node.hasChildren && node.expanded) {
        flatten(node.children, result)
      }
    }
  }

  const result: OutlineNode[] = []
  flatten(nodes.value, result)
  flatNodesForDrag.value = result
}

// 获取可见节点（扁平化）
const visibleNodes = computed(() => {
  const result: OutlineNode[] = []
  const visited = new Set<string>()

  const traverse = (nodeList: OutlineNode[], visible: boolean) => {
    for (const node of nodeList) {
      if (visited.has(node.id)) continue
      visited.add(node.id)

      if (visible) {
        result.push(node)
      }

      if (node.hasChildren && node.expanded && visible) {
        traverse(node.children, true)
      } else if (node.hasChildren) {
        traverse(node.children, false)
      }
    }
  }

  traverse(nodes.value, true)
  return result
})

// 监听数据变化
watch(() => props.annotations, () => {
  nodes.value = convertAnnotationsToOutline()
  updateFlatNodesForDrag()
}, {
  immediate: true,
  deep: true,
})

// 监听节点变化，更新扁平化列表
watch(nodes, () => {
  updateFlatNodesForDrag()
}, { deep: true })

// 将标注转换为大纲节点
const convertAnnotationsToOutline = (): OutlineNode[] => {
  if (!props.annotations || props.annotations.length === 0) {
    return []
  }

  // 按级别和位置排序
  const sortedAnnotations = [...props.annotations].sort((a, b) => {
    const levelOrder = ['title1', 'title2', 'title3', 'title4', 'title5', 'text']
    const aLevelIndex = levelOrder.indexOf(a.level || 'text')
    const bLevelIndex = levelOrder.indexOf(b.level || 'text')

    if (aLevelIndex !== bLevelIndex) {
      return aLevelIndex - bLevelIndex
    }

    if (a.page !== b.page) {
      return a.page - b.page
    }

    return (a.startPos || 0) - (b.startPos || 0)
  })

  // 构建树形结构
  const rootNodes: OutlineNode[] = []
  const nodeStack: OutlineNode[] = []

  for (const ann of sortedAnnotations) {
    const node: OutlineNode = {
      id: ann.id,
      text: ann.text || ann.excerpt || '',
      level: getLevelNumber(ann.level || 'text'),
      expanded: true,
      hasChildren: false,
      parentId: null,
      annotation: ann,
      children: [],
    }

    while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= node.level) {
      nodeStack.pop()
    }

    if (nodeStack.length > 0) {
      const parent = nodeStack[nodeStack.length - 1]
      node.parentId = parent.id
      parent.hasChildren = true
      parent.children.push(node)
    } else {
      rootNodes.push(node)
    }

    nodeStack.push(node)
  }

  return rootNodes
}

// 获取级别数字
const getLevelNumber = (level: string): number => {
  const match = level.match(/title(\d+)/)
  if (match) {
    return Number.parseInt(match[1])
  }
  return 6
}

// 获取级别标签
const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    title1: 'H1',
    title2: 'H2',
    title3: 'H3',
    title4: 'H4',
    title5: 'H5',
    text: '正文',
  }
  return labels[level] || level
}

// 选择节点
const selectNode = (node: OutlineNode) => {
  selectedNodeId.value = node.id
  if (node.annotation) {
    emit('node-click', node.annotation)
  }
}

// 切换展开/折叠
const toggleExpand = (node: OutlineNode) => {
  node.expanded = !node.expanded
  if (expandedNodeIds.value.has(node.id)) {
    expandedNodeIds.value.delete(node.id)
  } else {
    expandedNodeIds.value.add(node.id)
  }
  updateFlatNodesForDrag()
}

// 展开全部
const expandAll = () => {
  const updateExpanded = (nodeList: OutlineNode[]) => {
    for (const node of nodeList) {
      node.expanded = true
      if (node.hasChildren) {
        updateExpanded(node.children)
      }
    }
  }
  updateExpanded(nodes.value)
}

// 收起全部
const collapseAll = () => {
  const updateExpanded = (nodeList: OutlineNode[]) => {
    for (const node of nodeList) {
      node.expanded = false
      if (node.hasChildren) {
        updateExpanded(node.children)
      }
    }
  }
  updateExpanded(nodes.value)
}

// 添加节点
const addNode = () => {
  const selectedNode = nodes.value.find((n) => n.id === selectedNodeId.value)
  emit('node-add', selectedNode?.annotation || null)
}

// 添加同级节点
const addSiblingNode = () => {
  emit('node-add', null)
}

// 缩进节点
const indentNode = () => {
  if (!selectedNodeId.value) return

  const currentIndex = visibleNodes.value.findIndex((n) => n.id === selectedNodeId.value)
  if (currentIndex <= 0) return

  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  const prevNode = visibleNodes.value[currentIndex - 1]

  if (node && prevNode) {
    const oldParentId = node.parentId
    node.parentId = prevNode.id
    node.level = prevNode.level + 1

    if (oldParentId) {
      const oldParent = nodes.value.find((n) => n.id === oldParentId)
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter((c) => c.id !== node.id)
        oldParent.hasChildren = oldParent.children.length > 0
      }
    }

    prevNode.hasChildren = true
    prevNode.children.push(node)

    if (node.annotation) {
      emit('node-edit', node.annotation, node.text)
    }

    emitSyncToMindMap()
  }
}

// 取消缩进节点
const outdentNode = () => {
  if (!selectedNodeId.value) return

  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (!node || node.parentId === null) return

  const parent = nodes.value.find((n) => n.id === node.parentId)
  if (!parent) return

  const grandParentId = parent.parentId
  const grandParent = grandParentId ? nodes.value.find((n) => n.id === grandParentId) : null

  node.parentId = grandParentId
  node.level = grandParent ? grandParent.level + 1 : 1

  if (parent.children) {
    parent.children = parent.children.filter((c) => c.id !== node.id)
    parent.hasChildren = parent.children.length > 0
  }

  if (grandParent && grandParent.children) {
    const parentIndex = grandParent.children.findIndex((c) => c.id === parent.id)
    if (parentIndex >= 0) {
      grandParent.children.splice(parentIndex + 1, 0, node)
    } else {
      grandParent.children.push(node)
    }
    grandParent.hasChildren = true
  }

  if (node.annotation) {
    emit('node-edit', node.annotation, node.text)
  }

  emitSyncToMindMap()
}

// 删除节点
const deleteNode = () => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n) => n.id === selectedNodeId.value)
  if (node?.annotation) {
    emit('node-delete', node.annotation)
  }
  selectedNodeId.value = null
}

// 开始编辑
const startEditing = (node: OutlineNode) => {
  editingNodeId.value = node.id
  editingText.value = node.text
  nextTick(() => {
    editingTextareaRef.value?.focus()
  })
}

// 停止编辑
const stopEditing = () => {
  if (!editingNodeId.value) return
  const node = nodes.value.find((n) => n.id === editingNodeId.value)
  if (node?.annotation && editingText.value.trim()) {
    emit('node-edit', node.annotation, editingText.value.trim())
  }
  editingNodeId.value = null
  editingText.value = ''
}

// 取消编辑
const cancelEditing = () => {
  editingNodeId.value = null
  editingText.value = ''
}

// 编辑时按 Enter
const handleEditEnter = () => {
  stopEditing()
  addSiblingNode()
}

// 切换到思维导图
const switchToMindMap = () => {
  emit('switch-to-mindmap')
}

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (editingNodeId.value) return

  if (!selectedNodeId.value) return

  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      addSiblingNode()
      break
    case 'Tab':
      e.preventDefault()
      if (e.shiftKey) {
        outdentNode()
      } else {
        indentNode()
      }
      break
    case 'Delete':
    case 'Backspace':
      e.preventDefault()
      deleteNode()
      break
    case 'ArrowUp':
      e.preventDefault()
      navigateNode(-1)
      break
    case 'ArrowDown':
      e.preventDefault()
      navigateNode(1)
      break
  }
}

// 导航节点
const navigateNode = (direction: number) => {
  const currentIndex = visibleNodes.value.findIndex((n) => n.id === selectedNodeId.value)
  if (currentIndex === -1) return

  const newIndex = currentIndex + direction
  if (newIndex >= 0 && newIndex < visibleNodes.value.length) {
    selectNode(visibleNodes.value[newIndex])
  }
}

// ============ 拖拽相关函数 ============

// 拖拽开始
const handleDragStart = (event: any) => {
  isDragging.value = true
  draggedNodeId.value = event.item.dataset.nodeId
  console.log('[OutlineView] Drag start:', draggedNodeId.value)
}

// 拖拽结束
const handleDragEnd = (event: any) => {
  isDragging.value = false
  dropTargetIndex.value = null
  dropTargetType.value = null

  const fromIndex = event.oldIndex
  const toIndex = event.newIndex

  console.log('[OutlineView] Drag end:', {
    fromIndex,
    toIndex,
  })

  if (fromIndex !== toIndex && draggedNodeId.value) {
    // 处理拖拽排序
    handleReorderNodes(fromIndex, toIndex)
  }

  draggedNodeId.value = null
}

// 拖拽移动
const handleDragMove = (event: any) => {
  if (!draggedNodeId.value) return null

  const targetElement = event.to.children[event.newIndex]
  if (!targetElement) return null

  const targetNodeId = targetElement.dataset.nodeId
  if (!targetNodeId) return null

  // 计算拖拽目标类型
  const rect = targetElement.getBoundingClientRect()
  const type = calculateDropTargetType(
    {
      x: event.clientX,
      y: event.clientY,
    },
    rect,
  )

  // 验证拖拽目标
  const isValid = isValidDropTarget(draggedNodeId.value, targetNodeId, nodes.value as any)

  if (isValid) {
    dropTargetIndex.value = event.newIndex
    dropTargetType.value = type
  } else {
    dropTargetIndex.value = null
    dropTargetType.value = null
  }

  return isValid
}

// 处理节点重新排序
const handleReorderNodes = (fromIndex: number, toIndex: number) => {
  const visible = visibleNodes.value
  if (fromIndex < 0 || fromIndex >= visible.length || toIndex < 0 || toIndex >= visible.length) {
    return
  }

  const draggedNode = visible[fromIndex]
  const targetNode = visible[toIndex]

  if (!draggedNode || !targetNode) return

  // 找到当前 dropTargetType
  const type = dropTargetType.value || OutlineDropTargetType.AFTER

  // 从树中移除被拖拽的节点
  const removed = removeNodeFromTree(nodes.value as any, draggedNode.id)
  if (!removed) return

  // 插入到目标位置
  insertNodeIntoTree(nodes.value as any, removed as any, targetNode.id, type)

  // 更新所有节点的 level
  updateNodeLevels(nodes.value as any)

  // 发送同步事件
  emitSyncToMindMap()

  console.log('[OutlineView] Nodes reordered:', {
    fromIndex,
    toIndex,
    type,
  })
}

// 处理放置（原生 HTML5 Drop）
const handleDrop = (event: DragEvent, node: OutlineNode, index: number) => {
  event.preventDefault()
  console.log('[OutlineView] Drop on node:', node.id, 'at index:', index)
}

// 发送同步到思维导图事件
const emitSyncToMindMap = () => {
  // 收集所有标注
  const allAnnotations = flatNodesForDrag.value
    .filter((n) => n.annotation)
    .map((n) => n.annotation!)

  emit('node-move', allAnnotations)
  emit('sync-to-mindmap')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  updateFlatNodesForDrag()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="scss">
.outline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏样式 */
.outline-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.toolbar-btn-danger:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

/* 内容区域 */
.outline-content {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.outline-node {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;

  &:hover {
    background: var(--b3-theme-surface);
  }

  &--selected {
    background: var(--b3-theme-primary-light);
  }

  &--editing {
    background: var(--b3-theme-surface);
  }

  &--ghost {
    opacity: 0.5;
    background: var(--b3-theme-surface);
  }

  &--chosen {
    background: var(--b3-theme-primary-light);
  }

  &--drag {
    opacity: 0.8;
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &--drop-target {
    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--b3-theme-primary);
      transition: top 0.15s ease;
    }

    &[data-drop-target="before"]::before {
      top: 0;
    }

    &[data-drop-target="child"]::before {
      top: 0;
      left: 20px;
    }

    &[data-drop-target="after"]::before {
      bottom: 0;
    }
  }

  &__drag-handle {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.15s ease;
    color: var(--b3-theme-on-surface-light);

    &:hover {
      color: var(--b3-theme-primary);
    }

    .outline-node:hover & {
      opacity: 1;
    }

    &:active {
      cursor: grabbing;
    }
  }

  &__toggle {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--b3-theme-on-surface);
    flex-shrink: 0;
    transition: transform 0.15s ease;

    &--expanded {
      transform: rotate(90deg);
    }

    &:hover {
      color: var(--b3-theme-primary);
    }

    &-placeholder {
      width: 20px;
      flex-shrink: 0;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
  }

  &__text {
    color: var(--b3-theme-on-surface);
    word-break: break-word;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);

    &--title1 { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    &--title2 { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
    &--title3 { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
    &--title4 { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    &--title5 { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
  }

  &__page {
    font-size: 10px;
    color: var(--b3-theme-on-surface-light);
  }

  &__textarea {
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-primary);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    font-size: 13px;
    resize: none;
    font-family: inherit;
    line-height: 1.5;

    &:focus {
      outline: none;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
  padding: 40px;

  svg {
    margin-bottom: 16px;
  }

  p {
    margin: 8px 0;
  }

  &-hint {
    font-size: 12px;
    opacity: 0.7;
  }
}
</style>
