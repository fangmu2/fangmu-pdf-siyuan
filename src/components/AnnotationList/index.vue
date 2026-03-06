<!-- src/components/AnnotationList/index.vue -->
<template>
  <div class="annotation-list-container">
    <!-- 目录侧边栏 -->
    <TOCSidebar
      v-if="showToc && tocItems.length > 0"
      :items="tocItems"
      :show="showToc"
      :width="tocWidth"
      @update:show="showToc = $event"
      @navigate="scrollToAnnotation"
      @resize="tocWidth = $event"
    />

    <!-- 主内容区域 -->
    <div
      class="main-content"
      :class="{ 'with-toc': showToc && tocItems.length > 0 }"
    >
      <!-- 头部 -->
      <div class="list-header">
        <div class="header-title">
          <span class="title-text">标注列表</span>
          <span class="count-badge">{{ annotations.length }}</span>
        </div>

        <!-- 批量操作工具栏 -->
        <BulkToolbar
          v-if="selection && selection.selectionCount.value > 0"
          :selection-count="selection.selectionCount.value"
          :total-count="annotations.length"
          :annotations="annotations"
          @export="$emit('batch-export')"
          @move="$emit('batch-move', getSelectedIds())"
          @delete="handleBatchDelete"
          @clear="handleClearSelection"
          @toggle-all="toggleSelectAll"
        />

        <!-- 操作按钮 -->
        <div
          v-else
          class="header-actions"
        >
          <button
            v-if="tocItems.length > 0"
            class="action-btn"
            :class="{ active: showToc }"
            title="显示/隐藏目录"
            @click="showToc = !showToc"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>
          <button
            v-if="annotations.length > 0"
            class="action-btn"
            title="导出为 Markdown"
            @click="exportMarkdown"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </button>
          <button
            class="action-btn"
            title="刷新"
            @click="$emit('refresh')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 文档视图 -->
      <DocumentView
        ref="documentViewRef"
        :nodes="documentNodes"
        :all-annotations="annotations"
        :loading="loading"
        :cursor-after-id="cursorAfterId"
        :selection="selection"
        @annotation-click="handleAnnotationClick"
        @annotation-contextmenu="handleAnnotationContextmenu"
        @cursor-change="$emit('cursor-change', $event)"
        @edit="$emit('annotation-edit', $event)"
        @crop="$emit('crop', $event)"
        @unmerge="$emit('unmerge', $event)"
        @delete="$emit('annotation-delete', $event)"
        @merge="$emit('merge', $1, $2)"
        @image-load="handleImageLoad"
        @image-error="handleImageError"
      />
    </div>

    <!-- 导出设置面板 -->
    <ExportSettingsPanel
      v-if="showExportSettings"
      :selected-count="selection?.selectedAnnotations.value.length || 0"
      @close="showExportSettings = false"
      @export="handleExportWithOptions"
    />

    <!-- 导出进度面板 -->
    <ExportProgressPanel
      v-if="showExportProgress"
      :items="exportProgressItems"
      :export-fn="executeExportItem"
      @close="showExportProgress = false"
      @complete="handleExportComplete"
    />

    <!-- 智能裁剪编辑器 -->
    <SmartCropEditor
      v-if="showCropEditor"
      :image-src="currentCropImage"
      @crop-apply="handleCropApply"
      @crop-cancel="handleCropCancel"
    />

    <!-- 批量裁剪面板 -->
    <BatchCropPanel
      v-if="showBatchCrop"
      :items="batchCropItems"
      @close="showBatchCrop = false"
      @crop-result="handleBatchCropResult"
      @crop-revert="handleBatchCropRevert"
    />
  </div>
</template>

<script setup lang="ts">
import type { ExportOptions } from '../../services/batchExportService'
import type { CropRegion } from '../../services/smartCropService'
import type { PDFAnnotation } from '../types/annotation'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { batchExportAnnotations } from '../../services/batchExportService'
import { generateMarkdown } from '../utils/markdownGenerator'
import { usePdfAnnotationSelection } from '../composables/usePdfAnnotationSelection'
import { useAnnotationList, type DocumentNode } from '../composables/useAnnotationList'
import TOCSidebar from './TOCSidebar.vue'
import BulkToolbar from './BulkToolbar.vue'
import DocumentView from './DocumentView.vue'
import ExportProgressPanel from './ExportProgressPanel.vue'
import ExportSettingsPanel from './ExportSettingsPanel.vue'
import SmartCropEditor from './PdfAnnotationList/SmartCropEditor.vue'
import BatchCropPanel from './PdfAnnotationList/BatchCropPanel.vue'

const props = defineProps<{
  annotations: PDFAnnotation[]
  loading?: boolean
  cursorAfterId?: string | null
}>()

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void
  (e: 'annotation-edit', annotation: PDFAnnotation): void
  (e: 'annotation-delete', annotation: PDFAnnotation): void
  (e: 'refresh'): void
  (e: 'merge', sourceId: string, targetId: string): void
  (e: 'unmerge', annotationId: string): void
  (e: 'cursor-change', afterId: string | null): void
  (e: 'batch-delete', annotationIds: string[]): void
  (e: 'batch-export'): void
  (e: 'batch-move', annotationIds: string[]): void
  (e: 'crop', annotation: PDFAnnotation): void
}>()

// 使用组合式函数
const {
  collapsedHeadings,
  imageStatus,
  buildDocumentTree,
  generateTocItems,
} = useAnnotationList(props.annotations)

// 文档视图引用
const documentViewRef = ref<InstanceType<typeof DocumentView>>()

// 批量选择
const listBodyRef = ref<HTMLElement>()
const selection = ref<ReturnType<typeof usePdfAnnotationSelection> | null>(null)

// 目录状态
const showToc = ref(true)
const tocWidth = ref(200)

// 导出状态
const showExportSettings = ref(false)
const showExportProgress = ref(false)
const exportProgressItems = ref<Array<{ id: string, name: string, data: any }>>([])
const currentExportOptions = ref<ExportOptions | null>(null)

// 裁剪状态
const showCropEditor = ref(false)
const showBatchCrop = ref(false)
const currentCropImage = ref<string>('')
const currentCropAnnotation = ref<PDFAnnotation | null>(null)
const batchCropItems = ref<Array<{ id: string, name: string, imageSrc: string }>>([])

// 计算属性：文档树
const documentNodes = computed<DocumentNode[]>(() => {
  return buildDocumentTree(props.annotations, collapsedHeadings.value)
})

// 计算属性：目录项
const tocItems = computed(() => {
  return generateTocItems(documentNodes.value)
})

// 初始化批量选择
onMounted(() => {
  if (listBodyRef.value) {
    selection.value = usePdfAnnotationSelection({
      annotations: props.annotations,
      containerRef: listBodyRef.value,
    })
  }
})

onBeforeUnmount(() => {
  selection.value = null
})

// 获取选中的 ID
const getSelectedIds = (): string[] => {
  return selection.value?.selectedAnnotations.value.map(a => a.id) ?? []
}

// 滚动到标注
const scrollToAnnotation = (annotationId: string) => {
  documentViewRef.value?.scrollToAnnotation(annotationId)
}

// 切换全选
const toggleSelectAll = () => {
  if (!selection.value) return
  if (selection.value.selectionCount.value === props.annotations.length) {
    selection.value.clearSelection()
  } else {
    selection.value.selectAll()
  }
}

// 清除选择
const handleClearSelection = () => {
  selection.value?.clearSelection()
}

// 批量删除
const handleBatchDelete = () => {
  if (!selection.value || selection.value.selectedAnnotations.value.length === 0) return
  const ids = selection.value.selectedAnnotations.value.map(a => a.id)
  if (confirm(`确定要删除选中的 ${ids.length} 个标注吗？`)) {
    emit('batch-delete', ids)
    selection.value.clearSelection()
  }
}

// 标注点击
const handleAnnotationClick = (annotation: PDFAnnotation, event: MouseEvent) => {
  selection.value?.toggleSelection(annotation, event)
  emit('annotation-click', annotation)
}

// 标注右键
const handleAnnotationContextmenu = (annotation: PDFAnnotation, _event: MouseEvent) => {
  emit('annotation-edit', annotation)
}

// 图片加载
const handleImageLoad = (annotationId: string) => {
  imageStatus[annotationId] = 'loaded'
}

const handleImageError = (annotation: PDFAnnotation) => {
  imageStatus[annotation.id] = 'error'
}

// 导出 Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown(props.annotations, {
    groupBy: 'page',
    includeNotes: true,
    includeLocation: true,
  })

  navigator.clipboard.writeText(markdown).then(() => {
    showMessage('Markdown 已复制到剪贴板！', 'success')
  }).catch(() => {
    showMessage('复制失败', 'error')
  })
}

// 导出相关
const executeExportItem = async (data: any) => {
  if (!currentExportOptions.value) throw new Error('导出选项未设置')
  await batchExportAnnotations(data.annotations, currentExportOptions.value)
}

const handleExportWithOptions = (options: ExportOptions, items: Array<{ id: string, name: string, data: any }>) => {
  currentExportOptions.value = options
  exportProgressItems.value = items
  showExportSettings.value = false
  showExportProgress.value = true
}

const handleExportComplete = (successCount: number, errorCount: number) => {
  if (errorCount === 0) {
    showMessage(`成功导出 ${successCount} 个标注`, 'success')
  } else {
    showMessage(`导出完成：成功 ${successCount}，失败 ${errorCount}`, 'warning')
  }
}

// 裁剪相关
const handleCropApply = (_croppedImage: string, region: CropRegion) => {
  console.log('应用裁剪:', region)
  showMessage('裁剪已应用', 'success')
  showCropEditor.value = false
  currentCropImage.value = ''
  currentCropAnnotation.value = null
}

const handleCropCancel = () => {
  showCropEditor.value = false
  currentCropImage.value = ''
  currentCropAnnotation.value = null
}

const handleBatchCropResult = (id: string, _croppedImage: string, region: CropRegion) => {
  console.log('批量裁剪结果:', id, region)
}

const handleBatchCropRevert = (id: string) => {
  console.log('还原裁剪:', id)
}

// 消息提示
const showMessage = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if ((window as any).siyuan?.notification) {
    (window as any).siyuan.notification.push(msg, type)
  } else {
    alert(msg)
  }
}

// 暴露方法
defineExpose({
  scrollToAnnotation,
})
</script>

<style scoped lang="scss">
.annotation-list-container {
  display: flex;
  height: 100%;
  background: var(--b3-theme-background);
  font-size: 14px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content.with-toc {
  border-left: none;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 600;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.count-badge {
  padding: 2px 8px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--b3-theme-surface-light);
}

.action-btn.active {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}
</style>
