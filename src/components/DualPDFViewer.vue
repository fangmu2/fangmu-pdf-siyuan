<template>
  <div
    class="dual-pdf-viewer"
    :class="{ 'link-mode': config.linkMode }"
  >
    <!-- 工具栏 -->
    <div class="dual-viewer-toolbar">
      <div class="toolbar-section">
        <SyButton
          :active="config.syncScroll"
          @click="toggleSyncScroll"
        >
          <SyIcon icon="sync" />
          同步滚动
        </SyButton>
        <SyButton
          :active="config.linkMode"
          @click="toggleLinkMode"
        >
          <SyIcon icon="link" />
          链接模式
        </SyButton>
        <SyButton
          variant="danger"
          @click="closeDualView"
        >
          <SyIcon icon="close" />
          关闭双文档
        </SyButton>
      </div>
    </div>

    <!-- 双文档容器 -->
    <div class="dual-viewer-container">
      <!-- 左侧文档 -->
      <div class="document-panel left-panel">
        <div class="panel-header">
          <span class="doc-title">{{ leftDocTitle }}</span>
          <div class="panel-actions">
            <SyButton
              size="small"
              @click="selectLeftDoc"
            >
              <SyIcon icon="file" />
              选择文档
            </SyButton>
          </div>
        </div>
        <div
          ref="leftContainer"
          class="pdf-container"
        >
          <PDFViewer
            v-if="config.leftDocId"
            :key="`left-${config.leftDocId}`"
            :doc-id="config.leftDocId"
            @scroll="handleLeftScroll"
            @annotation-click="handleAnnotationClick"
          />
          <div
            v-else
            class="empty-state"
          >
            <SyIcon
              icon="file"
              size="48"
            />
            <p>点击"选择文档"加载 PDF</p>
          </div>
        </div>
      </div>

      <!-- 分隔条 -->
      <div
        class="splitter"
        @mousedown="startResize"
      >
        <div class="splitter-handle">
          <SyIcon icon="dragHandle" />
        </div>
      </div>

      <!-- 右侧文档 -->
      <div class="document-panel right-panel">
        <div class="panel-header">
          <span class="doc-title">{{ rightDocTitle }}</span>
          <div class="panel-actions">
            <SyButton
              size="small"
              @click="selectRightDoc"
            >
              <SyIcon icon="file" />
              选择文档
            </SyButton>
          </div>
        </div>
        <div
          ref="rightContainer"
          class="pdf-container"
        >
          <PDFViewer
            v-if="config.rightDocId"
            :key="`right-${config.rightDocId}`"
            :doc-id="config.rightDocId"
            @scroll="handleRightScroll"
            @annotation-click="handleAnnotationClick"
          />
          <div
            v-else
            class="empty-state"
          >
            <SyIcon
              icon="file"
              size="48"
            />
            <p>点击"选择文档"加载 PDF</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档选择对话框 -->
    <Dialog
      v-model:visible="showDocSelector"
      title="选择文档"
      :width="600"
    >
      <div class="doc-selector">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文档..."
          class="search-input"
        />
        <div class="doc-list">
          <div
            v-for="doc in filteredDocs"
            :key="doc.id"
            class="doc-item"
            :class="{ selected: selectedDocId === doc.id }"
            @click="selectedDocId = doc.id"
            @dblclick="confirmDocSelection"
          >
            <SyIcon icon="pdf" />
            <span class="doc-name">{{ doc.name }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <SyButton @click="showDocSelector = false">
          取消
        </SyButton>
        <SyButton
          type="primary"
          @click="confirmDocSelection"
        >
          确定
        </SyButton>
      </template>
    </Dialog>

    <!-- 文档关联面板 -->
    <div
      v-if="showRelationPanel"
      class="relation-panel"
    >
      <div class="relation-header">
        <h4>文档关联</h4>
        <SyButton
          size="small"
          @click="showRelationPanel = false"
        >
          <SyIcon icon="close" />
        </SyButton>
      </div>
      <div class="relation-list">
        <div
          v-for="relation in documentRelations"
          :key="relation.id"
          class="relation-item"
        >
          <div class="relation-info">
            <span class="relation-type">{{ getRelationTypeLabel(relation.relationType) }}</span>
            <span class="relation-target">{{ getDocName(relation.targetDocId) }}</span>
          </div>
          <div class="relation-actions">
            <SyButton
              size="small"
              @click="navigateToRelation(relation)"
            >
              <SyIcon icon="navigate" />
            </SyButton>
            <SyButton
              size="small"
              variant="danger"
              @click="deleteRelation(relation.id)"
            >
              <SyIcon icon="delete" />
            </SyButton>
          </div>
        </div>
        <div
          v-if="documentRelations.length === 0"
          class="empty-message"
        >
          暂无文档关联
        </div>
      </div>
      <div class="relation-actions">
        <SyButton
          type="primary"
          @click="createNewRelation"
        >
          <SyIcon icon="add" />
          添加关联
        </SyButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocumentRelation } from '@/services/documentCompareService'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { api } from '@/api'
import { documentCompareService } from '@/services/documentCompareService'
import PDFViewer from './PDFViewer.vue'
import SyButton from './SiyuanTheme/SyButton.vue'
import Dialog from './SiyuanTheme/SyDialog.vue'
import SyIcon from './SiyuanTheme/SyIcon.vue'

// Emit
const emit = defineEmits<{
  close: []
}>()

// 状态
const config = ref({
  enabled: false,
  leftDocId: null as string | null,
  rightDocId: null as string | null,
  syncScroll: false,
  linkMode: false,
})

const leftDocTitle = ref('左侧文档')
const rightDocTitle = ref('右侧文档')
const showDocSelector = ref(false)
const selectingSide = ref<'left' | 'right'>('left')
const searchQuery = ref('')
const selectedDocId = ref('')
const availableDocs = ref<Array<{ id: string, name: string }>>([])
const showRelationPanel = ref(false)
const documentRelations = ref<DocumentRelation[]>([])

// 计算属性
const filteredDocs = computed(() => {
  if (!searchQuery.value) return availableDocs.value
  const query = searchQuery.value.toLowerCase()
  return availableDocs.value.filter((doc) =>
    doc.name.toLowerCase().includes(query),
  )
})

// 生命周期
onMounted(async () => {
  config.value = await documentCompareService.getDualViewConfig()
  await loadAvailableDocs()
  setupSyncScrollListener()
})

onUnmounted(() => {
  removeSyncScrollListener()
})

// 方法
async function loadAvailableDocs() {
  try {
    // 获取所有 PDF 文档
    const result = await api.query.getBlocksByCondition({
      table: 'blocks',
      where: "type = 'd' AND hpath LIKE '%.pdf%'",
      limit: 100,
    })
    availableDocs.value = result.map((block: any) => ({
      id: block.id,
      name: block.hpath || block.name || '未命名文档',
    }))
  } catch (error) {
    console.error('加载文档列表失败:', error)
  }
}

function selectLeftDoc() {
  selectingSide.value = 'left'
  selectedDocId.value = config.value.leftDocId || ''
  showDocSelector.value = true
}

function selectRightDoc() {
  selectingSide.value = 'right'
  selectedDocId.value = config.value.rightDocId || ''
  showDocSelector.value = true
}

async function confirmDocSelection() {
  if (!selectedDocId.value) return

  if (selectingSide.value === 'left') {
    await documentCompareService.setLeftDocument(selectedDocId.value)
    config.value = await documentCompareService.getDualViewConfig()
    leftDocTitle.value = getDocName(selectedDocId.value)
  } else {
    await documentCompareService.setRightDocument(selectedDocId.value)
    config.value = await documentCompareService.getDualViewConfig()
    rightDocTitle.value = getDocName(selectedDocId.value)
  }

  showDocSelector.value = false
}

function getDocName(docId: string): string {
  const doc = availableDocs.value.find((d) => d.id === docId)
  return doc ? doc.name : '未命名文档'
}

async function toggleSyncScroll() {
  await documentCompareService.toggleSyncScroll()
  config.value.syncScroll = !config.value.syncScroll
}

async function toggleLinkMode() {
  await documentCompareService.toggleLinkMode()
  config.value.linkMode = !config.value.linkMode
}

async function closeDualView() {
  await documentCompareService.closeDualView()
  config.value = {
    enabled: false,
    leftDocId: null,
    rightDocId: null,
    syncScroll: false,
    linkMode: false,
  }
  emit('close')
}

// 滚动处理
let isSyncing = false

function handleLeftScroll(event: { position: number, page: number }) {
  if (!config.value.syncScroll || isSyncing) return
  isSyncing = true
  // 触发同步滚动事件
  window.dispatchEvent(new CustomEvent('sync-scroll', {
    detail: {
      targetSide: 'right',
      position: event.position,
      page: event.page,
    },
  }))
  setTimeout(() => { isSyncing = false }, 100)
}

function handleRightScroll(event: { position: number, page: number }) {
  if (!config.value.syncScroll || isSyncing) return
  isSyncing = true
  window.dispatchEvent(new CustomEvent('sync-scroll', {
    detail: {
      targetSide: 'left',
      position: event.position,
      page: event.page,
    },
  }))
  setTimeout(() => { isSyncing = false }, 100)
}

// 标注点击处理
async function handleAnnotationClick(event: { annotationId: string, docId: string }) {
  if (!config.value.linkMode) return

  // 在链接模式下，点击标注时跳转到另一文档的相关位置
  const currentDocId = event.docId
  const targetDocId = currentDocId === config.value.leftDocId
    ? config.value.rightDocId
    : config.value.leftDocId

  if (targetDocId) {
    // 查找跨文档标注
    const crossDocAnnotations = await documentCompareService.getCrossDocAnnotations(currentDocId)
    const related = crossDocAnnotations.find((a) => a.sourceAnnotationId === event.annotationId)
    if (related && related.targetBlockId) {
      // 跳转到目标文档的相关块
      window.postMessage({
        type: 'navigate-to-block',
        blockId: related.targetBlockId,
      }, '*')
    }
  }
}

// 同步滚动监听
function setupSyncScrollListener() {
  window.addEventListener('sync-scroll', handleSyncScroll as EventListener)
}

function removeSyncScrollListener() {
  window.removeEventListener('sync-scroll', handleSyncScroll as EventListener)
}

function handleSyncScroll(event: CustomEvent) {
  const {
    targetSide,
    position,
    page,
  } = event.detail
  // 通知对应的 PDFViewer 滚动
  window.postMessage({
    type: 'pdf-scroll',
    targetSide,
    position,
    page,
  }, '*')
}

// 分隔条拖拽
const isResizing = ref(false)

function startResize() {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!isResizing.value) return
  const container = document.querySelector('.dual-viewer-container') as HTMLElement
  if (!container) return
  const rect = container.getBoundingClientRect()
  const percentage = ((e.clientX - rect.left) / rect.width) * 100
  if (percentage >= 20 && percentage <= 80) {
    container.style.setProperty('--split-position', `${percentage}%`)
  }
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 文档关联
async function loadDocumentRelations() {
  const docId = config.value.leftDocId || config.value.rightDocId
  if (!docId) return
  documentRelations.value = await documentCompareService.getDocumentRelations(docId)
}

function getRelationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    reference: '引用',
    related: '相关',
    duplicate: '重复',
    supplement: '补充',
  }
  return labels[type] || type
}

async function createNewRelation() {
  showDocSelector.value = true
  selectingSide.value = 'left'
  // 选择后创建关联
}

async function deleteRelation(relationId: string) {
  await documentCompareService.deleteRelation(relationId)
  await loadDocumentRelations()
}

function navigateToRelation(relation: DocumentRelation) {
  window.postMessage({
    type: 'navigate-to-doc',
    docId: relation.targetDocId,
  }, '*')
}

</script>

<style scoped lang="scss">
.dual-pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);

  &.link-mode {
    .document-panel {
      cursor: pointer;
    }
  }
}

.dual-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);

  .toolbar-section {
    display: flex;
    gap: 8px;
  }
}

.dual-viewer-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  --split-position: 50%;

  .document-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.left-panel {
      width: var(--split-position, 50%);
    }

    &.right-panel {
      flex: 1;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--b3-border-color);
      background: var(--b3-theme-surface-light);

      .doc-title {
        font-weight: 500;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .panel-actions {
        display: flex;
        gap: 8px;
      }
    }

    .pdf-container {
      flex: 1;
      overflow: auto;
      position: relative;

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--b3-theme-placeholder);
        gap: 12px;
      }
    }
  }

  .splitter {
    width: 8px;
    background: var(--b3-border-color);
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--b3-theme-primary);
    }

    .splitter-handle {
      opacity: 0.5;
      color: var(--b3-theme-on-surface);
    }
  }
}

.doc-selector {
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .doc-list {
    max-height: 400px;
    overflow-y: auto;

    .doc-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background: var(--b3-theme-surface-hover);
      }

      &.selected {
        background: var(--b3-theme-primary-light);
      }

      .doc-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.relation-panel {
  position: absolute;
  top: 50px;
  right: 12px;
  width: 300px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  box-shadow: var(--b3-shadow-elevation-2);
  z-index: 100;

  .relation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--b3-border-color);

    h4 {
      margin: 0;
      font-size: 14px;
    }
  }

  .relation-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;

    .relation-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid var(--b3-border-color);

      &:last-child {
        border-bottom: none;
      }

      .relation-info {
        display: flex;
        gap: 8px;
        align-items: center;

        .relation-type {
          padding: 2px 6px;
          background: var(--b3-theme-primary-light);
          border-radius: 4px;
          font-size: 12px;
        }

        .relation-target {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .relation-actions {
        display: flex;
        gap: 4px;
      }
    }

    .empty-message {
      text-align: center;
      color: var(--b3-theme-placeholder);
      padding: 20px;
    }
  }

  .relation-actions {
    padding: 12px;
    border-top: 1px solid var(--b3-border-color);
  }
}
</style>
