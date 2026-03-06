<!-- src/components/AnnotationList/TOCSidebar.vue -->
<template>
  <div
    class="toc-sidebar"
    :style="{ width: `${width}px` }"
  >
    <div class="toc-header">
      <span>📑 目录</span>
      <button
        class="toc-toggle"
        title="隐藏目录"
        @click="$emit('update:show', false)"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
    <div class="toc-body">
      <div
        v-for="item in items"
        :key="item.id"
        class="toc-item"
        :class="`toc-level-${item.level}`"
        :title="item.text"
        @click="handleItemClick(item.id)"
      >
        <span class="toc-marker"></span>
        <span class="toc-text">{{ item.text }}</span>
      </div>
    </div>
    <!-- 拖动调整大小的手柄 -->
    <div
      class="toc-resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface TocItem {
  id: string
  text: string
  level: string
}

const props = defineProps<{
  items: TocItem[]
  show: boolean
  width?: number
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'navigate', annotationId: string): void
  (e: 'resize', width: number): void
}>()

const width = ref(props.width ?? 200)
let isResizing = false

const handleItemClick = (annotationId: string) => {
  emit('navigate', annotationId)
}

const startResize = (e: MouseEvent) => {
  isResizing = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  e.preventDefault()
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing) return
  const newWidth = window.innerWidth - e.clientX - 20
  if (newWidth >= 150 && newWidth <= 400) {
    width.value = newWidth
    emit('resize', newWidth)
  }
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}
</script>

<style scoped lang="scss">
.toc-sidebar {
  min-width: 150px;
  max-width: 400px;
  flex-shrink: 0;
  border-right: 1px solid var(--b3-border-color);
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-surface);
  position: relative;
}

.toc-resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}

.toc-resize-handle:hover {
  background: var(--b3-theme-primary);
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: 600;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  background: var(--b3-theme-background);
}

.toc-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--b3-theme-on-surface-light);
  border-radius: 4px;
  transition: all 0.15s;
}

.toc-toggle:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-on-surface);
}

.toc-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  margin: 1px 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  border-radius: 4px;
  transition: all 0.15s;
  position: relative;
}

.toc-item:hover {
  background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.1));
  color: var(--b3-theme-primary);
}

.toc-marker {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
  background: var(--b3-theme-primary-light);
}

.toc-item:hover .toc-marker {
  background: var(--b3-theme-primary);
}

.toc-level-h1 .toc-marker { background: #ef4444; }
.toc-level-h2 .toc-marker { background: #f97316; }
.toc-level-h3 .toc-marker { background: #eab308; }
.toc-level-h4 .toc-marker { background: #22c55e; }
.toc-level-h5 .toc-marker { background: #3b82f6; }
.toc-level-title .toc-marker { background: #8b5cf6; }

.toc-level-h1 { font-weight: 600; }
.toc-level-h2 { padding-left: 12px; font-weight: 500; }
.toc-level-h3 { padding-left: 24px; }
.toc-level-h4 { padding-left: 36px; font-size: 11px; opacity: 0.9; }
.toc-level-h5 { padding-left: 48px; font-size: 11px; opacity: 0.8; }
.toc-level-title { font-weight: 700; }

.toc-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
