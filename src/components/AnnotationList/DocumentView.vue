<!-- src/components/AnnotationList/DocumentView.vue -->
<template>
  <div
    ref="containerRef"
    class="document-view-container"
  >
    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-tip"
    >
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="nodes.length === 0"
      class="empty-tip"
    >
      <div class="empty-icon">📝</div>
      <div class="empty-title">暂无标注</div>
      <div class="empty-hint">
        在 PDF 中选择文本或图片<br>标注会自动显示在这里
      </div>
    </div>

    <!-- 文档视图（支持虚拟滚动） -->
    <div
      v-else
      ref="scrollContainerRef"
      class="document-view"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="document-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <!-- 插入光标指示器（顶部） -->
        <div
          v-if="!cursorAfterId"
          class="insert-cursor active"
          title="点击此处，新摘录将插入到最前面"
          @click="handleCursorClick(null, $event)"
        >
          <div class="cursor-line"></div>
          <span class="cursor-label">↑ 新摘录将插入此处</span>
        </div>

        <!-- 渲染节点 -->
        <template
          v-for="(node, index) in visibleNodes"
          :key="node.key"
        >
          <!-- 页码分隔 -->
          <div
            v-if="node.isPageBreak"
            class="page-separator"
          >
            <span class="page-num">第 {{ node.page }} 页</span>
          </div>

          <!-- 标注项 -->
          <AnnotationItem
            v-else
            :annotation="node.annotation"
            :indent="node.indent * 20"
            :isSelected="selection?.isSelected(node.annotation)"
            :isCollapsed="node.isCollapsed"
            :canFold="node.canFold"
            :hasChildren="node.hasChildren"
            :childrenCount="node.childrenCount"
            :show-checkbox="!!selection"
            :isDragOver="dragOverId === node.annotation.id"
            :isDragging="draggingId === node.annotation.id"
            :image-status="imageStatus[node.annotation.id]"
            @click="handleAnnotationClick"
            @contextmenu="handleAnnotationContextmenu"
            @checkbox-change="handleCheckboxChange"
            @fold-toggle="handleFoldToggle"
            @edit="$emit('edit', $event)"
            @crop="$emit('crop', $event)"
            @unmerge="$emit('unmerge', $event)"
            @delete="$emit('delete', $event)"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
            @drag-over="handleDragOver"
            @drag-leave="handleDragLeave"
            @drop="handleDrop"
            @image-load="handleImageLoad"
            @image-error="handleImageError"
          />

          <!-- 合并的子块 -->
          <div
            v-if="node.hasChildren && !node.isCollapsed"
            class="merged-children"
            :style="{ paddingLeft: `${node.indent * 20 + 16}px` }"
          >
            <ChildBlock
              v-for="child in node.children"
              :key="child.id"
              :annotation="child"
              :all-annotations="allAnnotations"
              :dragging-id="draggingId"
              :drag-over-id="dragOverId"
              :image-status="imageStatus"
              @click="$emit('edit', $event)"
              @dragstart="handleDragStart"
              @dragend="handleDragEnd"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
              @edit="$emit('edit', $event)"
              @unmerge="$emit('unmerge', $event)"
              @delete="$emit('delete', $event)"
              @image-load="handleImageLoad"
              @image-error="handleImageError"
            />
          </div>

          <!-- 插入光标指示器（在每个块之后） -->
          <div
            v-if="!node.isPageBreak && !node.annotation.parentId"
            class="insert-cursor"
            :class="{ active: cursorAfterId === node.annotation.id }"
            :title="cursorAfterId === node.annotation.id ? '当前插入位置' : '点击此处，新摘录将插入到此块之后'"
            @click="handleCursorClick(node.annotation.id, $event)"
          >
            <div class="cursor-line"></div>
            <span
              v-if="cursorAfterId === node.annotation.id"
              class="cursor-label"
            >↑ 新摘录将插入此处</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 拖拽提示 -->
    <div
      v-if="dragTip"
      class="drag-tip"
    >
      {{ dragTip }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'
import AnnotationItem from './AnnotationItem.vue'
import ChildBlock from '../ChildBlock.vue'

// 文档树节点类型
interface DocumentNode {
  key: string
  annotation?: PDFAnnotation
  indent: number
  isPageBreak?: boolean
  page?: number
  height: number
  top: number
  // 折叠相关
  isCollapsed?: boolean
  canFold?: boolean
  hasChildren?: boolean
  childrenCount?: number
  children?: PDFAnnotation[]
}

interface SelectionApi {
  isSelected: (annotation: PDFAnnotation) => boolean
  toggleSelection: (annotation: PDFAnnotation, event?: MouseEvent) => void
  clearSelection: () => void
  selectAll: () => void
  selectedIds: Ref<Set<string>>
  selectionCount: Ref<number>
}

const props = defineProps<{
  nodes: DocumentNode[]
  allAnnotations: PDFAnnotation[]
  loading?: boolean
  cursorAfterId?: string | null
  selection?: SelectionApi | null
  imageStatus?: Record<string, 'loading' | 'loaded' | 'error'>
}>()

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation, event: MouseEvent): void
  (e: 'annotation-contextmenu', annotation: PDFAnnotation, event: MouseEvent): void
  (e: 'cursor-change', afterId: string | null): void
  (e: 'edit', annotation: PDFAnnotation): void
  (e: 'crop', annotation: PDFAnnotation): void
  (e: 'unmerge', annotation: PDFAnnotation): void
  (e: 'delete', annotation: PDFAnnotation): void
  (e: 'merge', sourceId: string, targetId: string): void
  (e: 'image-load', annotationId: string): void
  (e: 'image-error', annotation: PDFAnnotation): void
}>()

const containerRef = ref<HTMLElement>()
const scrollContainerRef = ref<HTMLElement>()

// 虚拟滚动状态
const ITEM_HEIGHT = 60 // 估算的项高度
const OVERSCAN = 10 // 预渲染的项数
const scrollTop = ref(0)
const visibleStart = ref(0)
const visibleEnd = ref(0)

// 拖拽状态
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dragTip = ref<string>('')

// 图片加载状态
const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>(props.imageStatus ?? {})

// 计算总高度
const totalHeight = computed(() => {
  return props.nodes.reduce((sum, node) => sum + node.height, 0)
})

// 计算可见范围
const offsetY = computed(() => {
  let height = 0
  for (let i = 0; i < visibleStart.value; i++) {
    height += props.nodes[i]?.height ?? 0
  }
  return height
})

// 计算可见节点
const visibleNodes = computed(() => {
  return props.nodes.slice(visibleStart.value, visibleEnd.value)
})

// 更新可见范围
const updateVisibleRange = () => {
  const container = scrollContainerRef.value
  if (!container) return

  scrollTop.value = container.scrollTop
  const viewportHeight = container.clientHeight

  // 计算可见范围
  let accumulatedHeight = 0
  let start = 0
  let end = props.nodes.length

  // 找到可见范围的起始位置
  for (let i = 0; i < props.nodes.length; i++) {
    if (accumulatedHeight >= scrollTop.value - OVERSCAN * ITEM_HEIGHT) {
      start = Math.max(0, i - OVERSCAN)
      break
    }
    accumulatedHeight += props.nodes[i]?.height ?? ITEM_HEIGHT
  }

  // 找到可见范围的结束位置
  accumulatedHeight = 0
  for (let i = 0; i < props.nodes.length; i++) {
    accumulatedHeight += props.nodes[i]?.height ?? ITEM_HEIGHT
    if (accumulatedHeight >= scrollTop.value + viewportHeight + OVERSCAN * ITEM_HEIGHT) {
      end = Math.min(props.nodes.length, i + OVERSCAN + 1)
      break
    }
  }

  visibleStart.value = start
  visibleEnd.value = end
}

// 监听滚动
const handleScroll = () => {
  updateVisibleRange()
}

// 设置光标位置
const handleCursorClick = (afterId: string | null, e: Event) => {
  e.stopPropagation()
  emit('cursor-change', afterId)
}

// 标注点击
const handleAnnotationClick = (annotation: PDFAnnotation, e: MouseEvent) => {
  emit('annotation-click', annotation, e)
}

// 标注右键
const handleAnnotationContextmenu = (annotation: PDFAnnotation, e: MouseEvent) => {
  emit('annotation-contextmenu', annotation, e)
}

// 复选框变化
const handleCheckboxChange = (annotation: PDFAnnotation, checked: boolean) => {
  if (props.selection) {
    if (checked) {
      props.selection.selectedIds.value.add(annotation.id)
    } else {
      props.selection.selectedIds.value.delete(annotation.id)
    }
  }
}

// 折叠切换
const handleFoldToggle = (annotationId: string) => {
  emit('edit', props.allAnnotations.find(a => a.id === annotationId)!)
}

// 拖拽开始
const handleDragStart = (e: DragEvent, annotation: PDFAnnotation) => {
  draggingId.value = annotation.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', annotation.id)
  }
  dragTip.value = `拖动到目标标注上方释放以合并`
}

// 拖拽结束
const handleDragEnd = () => {
  draggingId.value = null
  dragOverId.value = null
  dragTip.value = ''
}

// 拖拽悬停
const handleDragOver = (e: DragEvent, annotation: PDFAnnotation) => {
  e.preventDefault()
  if (draggingId.value && draggingId.value !== annotation.id) {
    e.dataTransfer!.dropEffect = 'move'
    dragOverId.value = annotation.id
  }
}

// 拖拽离开
const handleDragLeave = () => {
  dragOverId.value = null
}

// 放置
const handleDrop = (e: DragEvent, targetAnnotation: PDFAnnotation) => {
  e.preventDefault()

  const sourceId = e.dataTransfer?.getData('text/plain')
  if (!sourceId || sourceId === targetAnnotation.id) {
    dragOverId.value = null
    draggingId.value = null
    dragTip.value = ''
    return
  }

  // 检查循环引用
  let current = targetAnnotation
  while (current.parentId) {
    if (current.parentId === sourceId) {
      dragTip.value = '不能将标注合并到它自己的子标注中'
      setTimeout(() => { dragTip.value = '' }, 2000)
      dragOverId.value = null
      draggingId.value = null
      return
    }
    const parent = props.allAnnotations.find(a => a.id === current.parentId)
    if (!parent) break
    current = parent
  }

  emit('merge', sourceId, targetAnnotation.id)

  dragTip.value = '合并成功！'
  setTimeout(() => { dragTip.value = '' }, 1500)

  dragOverId.value = null
  draggingId.value = null
}

// 图片加载成功
const handleImageLoad = (annotationId: string) => {
  imageStatus[annotationId] = 'loaded'
}

// 图片加载失败
const handleImageError = (annotation: PDFAnnotation) => {
  imageStatus[annotation.id] = 'error'
  emit('image-error', annotation)
}

// 生命周期
onMounted(() => {
  const container = scrollContainerRef.value
  if (container) {
    container.addEventListener('scroll', handleScroll)
    updateVisibleRange()
  }
})

onBeforeUnmount(() => {
  const container = scrollContainerRef.value
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})

// 监听节点变化，重新计算可见范围
watch(() => props.nodes, () => {
  updateVisibleRange()
}, { flush: 'post' })

// 暴露滚动方法
const scrollToAnnotation = (annotationId: string) => {
  const container = scrollContainerRef.value
  if (!container) return

  const element = container.querySelector(`[data-annotation-id="${annotationId}"]`)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}

defineExpose({
  scrollToAnnotation,
})
</script>

<style scoped lang="scss">
.document-view-container {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
}

.loading-tip,
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 40px 20px;
  gap: 12px;
  color: var(--b3-theme-on-surface-light);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--b3-theme-surface-light);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.empty-hint {
  font-size: 12px;
  text-align: center;
  opacity: 0.6;
  line-height: 1.6;
}

.document-view {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--b3-theme-on-background);
  overflow: auto;
  contain: strict;
}

.document-content {
  will-change: transform;
}

// 页码分隔
.page-separator {
  display: flex;
  align-items: center;
  margin: 24px 0 16px 0;
  padding-top: 16px;
  border-top: 1px dashed var(--b3-border-color);
}

.page-separator:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.page-num {
  font-size: 11px;
  font-weight: 500;
  color: var(--b3-theme-on-surface-light);
  background: var(--b3-theme-surface);
  padding: 2px 8px;
  border-radius: 4px;
}

// 合并子块容器
.merged-children {
  margin-left: 16px;
  border-left: 2px solid var(--b3-theme-surface-light);
  padding-left: 4px;
  pointer-events: auto;
}

// 插入光标样式
.insert-cursor {
  position: relative;
  height: 6px;
  margin: 4px 0;
  cursor: pointer;
  transition: all 0.15s;
}

.insert-cursor .cursor-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: transparent;
  border-radius: 1px;
  transition: all 0.15s;
}

.insert-cursor .cursor-label {
  position: absolute;
  left: 50%;
  top: -20px;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-surface);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.insert-cursor:hover .cursor-line,
.insert-cursor.active .cursor-line {
  background: var(--b3-theme-primary-light);
  height: 2px;
}

.insert-cursor.active .cursor-line {
  background: var(--b3-theme-primary);
  height: 3px;
}

.insert-cursor.active .cursor-label {
  opacity: 1;
}

.insert-cursor:hover .cursor-label {
  opacity: 0.7;
}

// 拖拽提示
.drag-tip {
  padding: 8px 16px;
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid var(--b3-border-color);
}
</style>
