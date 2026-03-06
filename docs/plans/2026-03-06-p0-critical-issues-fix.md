# P0 Critical Issues Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 P0 critical issues in the MindMap and PDF viewer components to improve stability, error handling, and code maintainability.

**Architecture:** 
- P0-1 to P0-4: Add error boundaries, validation, retry logic, and timeout handling to critical services
- P0-5 to P0-6: Decompose mega-components (>3000 lines) into smaller, focused sub-components following single responsibility principle

**Tech Stack:** Vue 3 + TypeScript + Vite + Pinia + PDF.js + Vue Flow

---

## Risk Assessment

| Issue | Risk Level | Mitigation |
|-------|------------|------------|
| P0-1: Error boundary | Low | Isolated change, backward compatible |
| P0-2: ID validation | Medium | Add fallback handling, test with edge cases |
| P0-3: Store save validation | High | Add retries, test with network failures |
| P0-4: PDF timeout | Medium | Graceful degradation on timeout |
| P0-5: PDFViewer split | High | Incremental extraction, test each component |
| P0-6: FreeCanvasViewer split | High | Incremental extraction, test each component |

## Parallel Execution Opportunities

**Phase 1 (P0-1 to P0-4)** can be executed in parallel by different agents:
- Agent A: P0-1 + P0-2 (error handling + validation)
- Agent B: P0-3 + P0-4 (store validation + timeout)

**Phase 2 (P0-5 to P0-6)** should be sequential due to shared dependencies:
- First: P0-5 (PDFViewer.vue split)
- Second: P0-6 (FreeCanvasViewer.vue split)

---

## Phase 1: Critical Bug Fixes

### Task 1: P0-1 - MindMap Error Boundary in FreeCanvasViewer.vue

**Files:**
- Modify: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue:16-23`

**Step 1: Read current error handling code**

Read lines 16-23 to understand current error state implementation.

**Step 2: Add independent error state with retry capability**

```typescript
// Add after line 618 (isLoading state)
const errorDetails = ref<{
  message: string
  code?: string
  stack?: string
  timestamp: number
} | null>(null)

const retryCount = ref(0)
const MAX_RETRY_COUNT = 3

function showError(error: Error, code?: string): void {
  errorDetails.value = {
    message: error.message,
    code,
    stack: error.stack,
    timestamp: Date.now(),
  }
  retryCount.value = 0
}

async function handleRetry(): Promise<void> {
  if (retryCount.value >= MAX_RETRY_COUNT) {
    showError(new Error('已达到最大重试次数'), 'MAX_RETRY_EXCEEDED')
    return
  }
  
  retryCount.value++
  isLoading.value = true
  errorMessage.value = ''
  errorDetails.value = null
  
  try {
    await store.loadMindMap(props.blockId)
    isInitialized.value = true
  } catch (error) {
    const err = error instanceof Error ? error : new Error('加载失败')
    showError(err, 'RETRY_FAILED')
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}
```

**Step 3: Update template error display with retry button**

Replace lines 17-23:

```vue
<!-- 错误状态 -->
<div
  v-else-if="errorMessage"
  class="freemind-error"
>
  <span class="freemind-error-icon">⚠️</span>
  <div class="freemind-error-content">
    <span class="freemind-error-text">{{ errorMessage }}</span>
    <div v-if="errorDetails" class="freemind-error-details">
      <p><strong>错误代码:</strong> {{ errorDetails.code || 'UNKNOWN' }}</p>
      <p><strong>重试次数:</strong> {{ retryCount }}/{{ MAX_RETRY_COUNT }}</p>
      <p><strong>时间:</strong> {{ new Date(errorDetails.timestamp).toLocaleString() }}</p>
    </div>
    <button
      class="freemind-retry-btn"
      :disabled="retryCount >= MAX_RETRY_COUNT"
      @click="handleRetry"
    >
      <span v-if="retryCount < MAX_RETRY_COUNT">🔄 重试 ({{ retryCount }}/{{ MAX_RETRY_COUNT }})</span>
      <span v-else>❌ 已达最大重试次数</span>
    </button>
  </div>
</div>
```

**Step 4: Add CSS styles for error details and retry button**

Add after line 2687 (after .freemind-error-text):

```css
.freemind-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.freemind-error-details {
  background: var(--siyuan-block-bg, #f5f5f5);
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
  text-align: left;
  max-width: 400px;
}

.freemind-error-details p {
  margin: 4px 0;
}

.freemind-retry-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.freemind-retry-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.freemind-retry-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

**Step 5: Update error handling in onMounted**

Modify lines 864-874 to use new error handling:

```typescript
try {
  await store.loadMindMap(props.blockId)
  isInitialized.value = true
  console.log('[FreeCanvasViewer] 加载完成 - isLoaded:', isLoaded.value, 'nodes:', nodes.value?.length)
} catch (error) {
  console.error('[FreeCanvasViewer] 加载失败:', error)
  const err = error instanceof Error ? error : new Error('加载失败')
  showError(err, 'LOAD_FAILED')
  errorMessage.value = err.message
} finally {
  isLoading.value = false
}
```

**Step 6: Run build to verify no errors**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors

**Step 7: Commit**

```bash
git add src/components/MindMapFreeCanvas/FreeCanvasViewer.vue
git commit -m "fix(P0-1): add error boundary with retry to FreeCanvasViewer

- Add independent error state with detailed error info
- Add retry button with max retry count (3 attempts)
- Display error code, retry count, and timestamp
- Add CSS styles for error details and retry button
- Update error handling in onMounted lifecycle"
```

---

### Task 2: P0-2 - Temporary ID Handling in freeMindMapDataIntegrationService.ts

**Files:**
- Modify: `src/services/freeMindMapDataIntegrationService.ts:54-89`

**Step 1: Read current loadMindMapFromBlock function**

Read lines 54-89 to understand current temporary ID handling.

**Step 2: Add regex validation and default data fallback**

Modify the `loadMindMapFromBlock` function starting at line 54:

```typescript
/**
 * 从思源块属性加载思维导图数据
 * @param blockId 思维导图块 ID
 *
 * 注意：如果块 ID 是临时 ID（temp- 开头），直接返回 null，因为临时 ID 不对应真实的思源块
 */
export async function loadMindMapFromBlock(blockId: string): Promise<{
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} | null> {
  console.log('[FreeMindMapDataIntegration] loadMindMapFromBlock 开始，blockId:', blockId)

  // 验证 blockId 参数
  if (!blockId || typeof blockId !== 'string') {
    console.error('[FreeMindMapDataIntegration] 无效的 blockId:', blockId)
    return getDefaultMindMapData()
  }

  // 检查是否是临时 ID（temp- 开头），临时 ID 不对应真实的思源块
  if (blockId.startsWith('temp-')) {
    // 验证临时 ID 格式
    const tempIdRegex = /^temp-[a-zA-Z0-9]{8,}$/
    if (!tempIdRegex.test(blockId)) {
      console.error('[FreeMindMapDataIntegration] 临时 ID 格式无效:', blockId)
      return getDefaultMindMapData()
    }
    
    console.log('[FreeMindMapDataIntegration] 临时 ID，从 localStorage 加载数据')
    // 从 localStorage 加载数据
    const storageKey = `freemindmap-data-${blockId}`
    const dataStr = localStorage.getItem(storageKey)
    console.log('[FreeMindMapDataIntegration] localStorage key:', storageKey, '数据存在:', !!dataStr)
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr)
        console.log('[FreeMindMapDataIntegration] 从 localStorage 加载成功，nodes:', data.nodes?.length)
        return {
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewport: data.viewport || {
            zoom: 1,
            x: 0,
            y: 0,
          },
          layout: data.layout || 'free',
        }
      } catch (e) {
        console.error('[FreeMindMapDataIntegration] 解析 localStorage 数据失败:', e)
        // 数据损坏时返回默认数据
        return getDefaultMindMapData()
      }
    }
    console.log('[FreeMindMapDataIntegration] localStorage 无数据，返回默认数据')
    return getDefaultMindMapData()
  }

  // 验证块 ID 格式（思源标准格式：20240101120000-abc1234）
  const siyuanIdRegex = /^\d{14}-[a-z0-9]{7}$/
  if (!siyuanIdRegex.test(blockId)) {
    console.warn('[FreeMindMapDataIntegration] 无效的块 ID 格式:', blockId)
    // 尝试从 localStorage 加载作为备选
    const storageKey = `freemindmap-data-${blockId}`
    const dataStr = localStorage.getItem(storageKey)
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr)
        return {
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewport: data.viewport || {
            zoom: 1,
            x: 0,
            y: 0,
          },
          layout: data.layout || 'free',
        }
      } catch (e) {
        console.error('[FreeMindMapDataIntegration] 解析备选数据失败:', e)
      }
    }
    return getDefaultMindMapData()
  }

  try {
    const attrs = await postApi<{ [key: string]: string }>('/api/attr/getBlockAttrs', {
      id: blockId,
    })

    const dataJson = attrs?.[MINDMAP_ATTRS.DATA]
    if (!dataJson) {
      return getDefaultMindMapData()
    }

    const data = JSON.parse(dataJson)
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
      viewport: data.viewport || {
        zoom: 1,
        x: 0,
        y: 0,
      },
      layout: data.layout || 'free',
    }
  } catch (error) {
    console.error('[FreeMindMapDataIntegration] 加载思维导图数据失败:', error)
    return getDefaultMindMapData()
  }
}

/**
 * 获取默认思维导图数据
 */
function getDefaultMindMapData(): {
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  viewport: { zoom: number, x: number, y: number }
  layout: 'free' | 'tree' | 'vertical' | 'horizontal'
} {
  return {
    nodes: [],
    edges: [],
    viewport: {
      zoom: 1,
      x: 0,
      y: 0,
    },
    layout: 'free',
  }
}
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/services/freeMindMapDataIntegrationService.ts
git commit -m "fix(P0-2): add ID validation and default data fallback

- Add regex validation for temp- ID format
- Add regex validation for Siyuan standard ID format
- Add getDefaultMindMapData() fallback function
- Handle data parsing errors gracefully
- Return default data instead of null on failures"
```

---

### Task 3: P0-3 - Store Save Validation in freeMindMapStore.ts

**Files:**
- Modify: `src/stores/freeMindMapStore.ts:1320-1360` (saveMindMap function around line 350)

**Step 1: Read current saveMindMap function**

Read lines 350-380 to understand current save implementation.

**Step 2: Add ID validation, 3 retries, and user notification**

Modify the `saveMindMap` function:

```typescript
/**
 * 保存思维导图
 */
async function saveMindMap(retryCount = 0): Promise<void> {
  // ID 验证
  if (!currentMindMapId.value) {
    errorMessage.value = '思维导图 ID 不存在'
    console.error('[FreeMindMapStore] 保存失败：思维导图 ID 不存在')
    // 抛出错误让调用者知道
    throw new Error('思维导图 ID 不存在')
  }

  // 验证 ID 格式
  const isValidId = /^\d{14}-[a-z0-9]{7}$/.test(currentMindMapId.value) || 
                    /^temp-[a-zA-Z0-9]{8,}$/.test(currentMindMapId.value)
  if (!isValidId) {
    errorMessage.value = '无效的思维导图 ID 格式'
    console.error('[FreeMindMapStore] 保存失败：无效的 ID 格式:', currentMindMapId.value)
    throw new Error('无效的思维导图 ID 格式')
  }

  try {
    const options: FreeMindMapOptions = {
      id: currentMindMapId.value,
      studySetId: studySetId.value,
      layout: layout.value,
      nodes: nodes.value,
      edges: edges.value,
      viewport: viewport.value,
      showGrid: showGrid.value,
      showMiniMap: showMiniMap.value,
      showControls: showControls.value,
      readOnly: readOnly.value,
    }

    await saveFreeMindMap(options)
    
    // 保存成功，清除错误信息
    errorMessage.value = ''
    console.log('[FreeMindMapStore] 保存成功')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '保存失败'
    errorMessage.value = errorMsg
    console.error('[FreeMindMapStore] 保存思维导图失败:', error)
    
    // 重试逻辑（最多 3 次）
    if (retryCount < 3) {
      console.log(`[FreeMindMapStore] 重试保存 (${retryCount + 1}/3)...`)
      // 指数退避：1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return saveMindMap(retryCount + 1)
    }
    
    // 3 次重试后仍然失败，显示用户通知
    if (typeof window !== 'undefined' && window.siyuan?.languages?.showMessage) {
      window.siyuan.languages.showMessage(`思维导图保存失败：${errorMsg}`, 'error')
    }
    console.error('[FreeMindMapStore] 保存失败，已达到最大重试次数')
    
    // 抛出错误让调用者知道
    throw error
  }
}
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/stores/freeMindMapStore.ts
git commit -m "fix(P0-3): add save validation, 3 retries, and user notification

- Add ID validation (format check for both standard and temp IDs)
- Implement 3-retry logic with exponential backoff (1s, 2s, 4s)
- Add user notification via Siyuan showMessage API
- Throw errors to propagate failure to callers
- Clear error message on successful save"
```

---

### Task 4: P0-4 - PDF Jump Timeout in pdfJumpService.ts

**Files:**
- Modify: `src/services/pdfJumpService.ts:30-55`

**Step 1: Read current jumpToPDF function**

Read lines 28-58 to understand current implementation.

**Step 2: Add 10s open timeout and 5s jump timeout**

Modify the `jumpToPDF` and `openPDFDocument` functions:

```typescript
/**
 * 跳转到 PDF 指定位置
 *
 * @param location PDF 位置信息
 * @returns 是否成功
 */
export async function jumpToPDF(location: PDFLocation): Promise<boolean> {
  try {
    console.log('[PDF 跳转] 开始跳转到 PDF:', location)

    // 1. 打开 PDF 文档（10 秒超时）
    const openTimeout = 10000 // 10 秒
    const opened = await withTimeout(
      openPDFDocument(location.pdfPath),
      openTimeout,
      `打开 PDF 文档超时（${openTimeout}ms）`
    )
    if (!opened) {
      console.error('[PDF 跳转] 打开 PDF 失败')
      return false
    }

    // 等待 PDF 加载完成
    await new Promise(resolve => setTimeout(resolve, 500))

    // 2. 跳转到指定页码（5 秒超时）
    const jumpTimeout = 5000 // 5 秒
    await withTimeout(
      navigateToPage(location.page),
      jumpTimeout,
      `跳转到页码超时（${jumpTimeout}ms）`
    )

    // 3. 如果有选区，高亮显示
    if (location.rect) {
      await highlightRect(location.rect)
    }

    // 4. 如果有块 ID，定位到块
    if (location.blockId) {
      await focusBlock(location.blockId)
    }

    console.log('[PDF 跳转] 跳转成功')
    return true
  } catch (error) {
    console.error('[PDF 跳转] 跳转失败:', error)
    return false
  }
}

/**
 * 带超时的 Promise 包装器
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}

/**
 * 打开 PDF 文档
 */
async function openPDFDocument(pdfPath: string): Promise<boolean> {
  try {
    // 使用思源 API 打开 PDF
    // 通过跳转到 PDF 文档的第一个块来实现
    const result = await postApi<any>('/api/file/getFile', {
      path: pdfPath,
    })

    if (result) {
      // 触发思源打开 PDF 文档
      // 通过自定义协议或事件
      window.postMessage({
        type: 'OPEN_PDF',
        path: pdfPath,
      }, '*')
      
      // 等待事件确认 PDF 已打开（可选）
      return new Promise<boolean>((resolve) => {
        const handler = (event: MessageEvent) => {
          if (event.data?.type === 'PDF_OPENED' && event.data?.path === pdfPath) {
            window.removeEventListener('message', handler)
            resolve(true)
          }
        }
        window.addEventListener('message', handler)
        
        // 2 秒后如果没有确认也认为成功（向后兼容）
        setTimeout(() => {
          window.removeEventListener('message', handler)
          resolve(true)
        }, 2000)
      })
    }
    return false
  } catch (error) {
    console.error('[PDF 跳转] 打开文档失败:', error)
    return false
  }
}
```

**Step 3: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/services/pdfJumpService.ts
git commit -m "fix(P0-4): add timeout handling to PDF jump service

- Add 10s timeout for opening PDF documents
- Add 5s timeout for page navigation
- Add withTimeout() utility function for Promise timeout
- Add PDF_OPENED message event confirmation
- Improve error messages with timeout details"
```

---

## Phase 2: Mega-Component Refactoring

### Task 5: P0-5 - PDFViewer.vue Component Split

**Files:**
- Current: `src/components/PDFViewer.vue` (3,490 lines)
- Create: `src/components/PDFViewer/components/PDFRenderer.vue`
- Create: `src/components/PDFViewer/components/AnnotationOverlay.vue`
- Create: `src/components/PDFViewer/components/ShapeOverlay.vue`
- Create: `src/components/PDFViewer/components/PDFToolbar.vue`
- Create: `src/components/PDFViewer/components/OutlinePanel.vue`
- Create: `src/components/PDFViewer/components/BookmarkPanel.vue`
- Create: `src/components/PDFViewer/components/SearchPanel.vue`
- Target: Main component <600 lines

**Architecture:**
```
PDFViewer.vue (orchestrator, ~500 lines)
├── PDFRenderer.vue (canvas rendering, ~300 lines)
├── AnnotationOverlay.vue (highlights, ~400 lines)
├── ShapeOverlay.vue (shapes, ~350 lines)
├── PDFToolbar.vue (toolbar controls, ~500 lines)
├── OutlinePanel.vue (TOC, ~200 lines)
├── BookmarkPanel.vue (bookmarks, ~200 lines)
└── SearchPanel.vue (search, ~250 lines)
```

**Step 1: Create directory structure**

```bash
mkdir -p src/components/PDFViewer/components
```

**Step 2: Extract PDFRenderer component**

Create `src/components/PDFViewer/components/PDFRenderer.vue`:

```vue
<template>
  <div
    ref="pageContainerRef"
    class="pdf-page-container"
    :style="{
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
    }"
  >
    <canvas
      ref="canvasRef"
      class="pdf-canvas"
    ></canvas>
    <div
      ref="textLayerRef"
      class="pdf-text-layer"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { renderPage, renderTextLayer } from '@/utils/pdf'

const props = defineProps<{
  pdfPage: any
  scale: number
  containerWidth: number
  containerHeight: number
  viewMode: 'single' | 'double' | 'continuous'
}>()

const emit = defineEmits<{
  (e: 'rendered', viewport: any): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const pageContainerRef = ref<HTMLElement>()
const textLayerRef = ref<HTMLElement>()

let currentRenderTask: { cancel: () => void } | null = null

async function render() {
  if (!props.pdfPage || !canvasRef.value) return

  if (currentRenderTask) {
    currentRenderTask.cancel()
  }

  try {
    const renderPromise = renderPage(
      props.pdfPage,
      canvasRef.value,
      props.containerWidth * props.scale
    )

    currentRenderTask = {
      cancel: () => {
        console.log('[PDFRenderer] 渲染任务已取消')
      },
    }

    const viewport = await renderPromise
    currentRenderTask = null

    // 渲染文本层
    await renderTextLayer(props.pdfPage, textLayerRef.value, viewport)

    // 设置容器尺寸
    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = `${viewport.width}px`
      pageContainerRef.value.style.height = `${viewport.height}px`
    }

    emit('rendered', viewport)
  } catch (e: any) {
    if (e.name === 'RenderingCancelledException') {
      console.log('[PDFRenderer] 渲染已取消')
      return
    }
    console.error('[PDFRenderer] 渲染失败:', e)
  }
}

watch(() => [props.pdfPage, props.scale, props.viewMode], () => {
  render()
}, { immediate: true })

defineExpose({
  canvasRef,
  textLayerRef,
})
</script>

<style scoped>
.pdf-page-container {
  position: relative;
  overflow: hidden;
}

.pdf-canvas {
  display: block;
}

.pdf-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
```

**Step 3: Extract AnnotationOverlay component**

Create `src/components/PDFViewer/components/AnnotationOverlay.vue`:

```vue
<template>
  <div
    ref="highlightLayerRef"
    class="highlight-layer"
    :style="{
      width: `${viewportWidth}px`,
      height: `${viewportHeight}px`,
    }"
  >
    <div
      v-for="ann in annotations"
      :key="ann.id"
      class="highlight-element"
      :class="{ selected: selectedAnnotationId === ann.id }"
      :style="getHighlightStyle(ann)"
      @click="handleAnnotationClick(ann)"
    >
      <!-- 角标 -->
      <span
        v-if="getBadgeLabel(ann)"
        class="highlight-badge"
        :style="getBadgeStyle(ann)"
      >
        {{ getBadgeLabel(ann) }}
      </span>
      <!-- 删除按钮 -->
      <button
        class="highlight-delete-btn"
        :style="getDeleteBtnStyle(ann)"
        @click.stop="handleAnnotationDelete(ann)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'

const props = defineProps<{
  annotations: PDFAnnotation[]
  selectedAnnotationId: string | null
  viewport: {
    width: number
    height: number
    scale: number
  }
}>()

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void
  (e: 'annotation-delete', annotation: PDFAnnotation): void
}>()

const LEVEL_COLORS: Record<string, { bg: string, border: string }> = {
  title: { bg: 'rgba(255, 87, 87, 0.35)', border: '#ff5757' },
  h1: { bg: 'rgba(255, 159, 67, 0.35)', border: '#ff9f43' },
  h2: { bg: 'rgba(254, 202, 87, 0.35)', border: '#feca57' },
  h3: { bg: 'rgba(29, 209, 161, 0.35)', border: '#1dd1a1' },
  h4: { bg: 'rgba(72, 219, 251, 0.35)', border: '#48dbfb' },
  h5: { bg: 'rgba(84, 160, 255, 0.35)', border: '#54a0ff' },
  text: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
}

const ANNOTATION_COLORS: Record<string, { bg: string, border: string }> = {
  yellow: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
  green: { bg: 'rgba(107, 203, 119, 0.35)', border: '#6bcb77' },
  blue: { bg: 'rgba(77, 150, 255, 0.35)', border: '#4d96ff' },
  red: { bg: 'rgba(255, 107, 107, 0.35)', border: '#ff6b6b' },
  purple: { bg: 'rgba(155, 89, 182, 0.35)', border: '#9b59b6' },
}

const viewportWidth = computed(() => props.viewport.width)
const viewportHeight = computed(() => props.viewport.height)

function getHighlightStyle(ann: PDFAnnotation) {
  const [pdfX1, pdfY1, pdfX2, pdfY2] = ann.rect
  const scale = props.viewport.scale || 1
  const cssPageHeight = props.viewport.height

  const cssX = pdfX1 * scale
  const cssY = cssPageHeight - pdfY2 * scale
  const cssWidth = (pdfX2 - pdfX1) * scale
  const cssHeight = Math.max((pdfY2 - pdfY1) * scale, 14)

  const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow
  const isSelected = props.selectedAnnotationId === ann.id

  return {
    position: 'absolute' as const,
    left: `${cssX}px`,
    top: `${cssY}px`,
    width: `${cssWidth}px`,
    height: `${cssHeight}px`,
    backgroundColor: isSelected ? colors.bg.replace('0.35', '0.55') : colors.bg,
    border: `2px solid ${isSelected ? '#fff' : colors.border}`,
    borderRadius: '3px',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    zIndex: isSelected ? 2 : 1,
  }
}

function getBadgeLabel(ann: PDFAnnotation): string | null {
  if (ann.isImage) return '📷'
  if (!ann.level || ann.level === 'text') return null
  
  const levelLabels: Record<string, string> = {
    title: 'T',
    h1: 'H1',
    h2: 'H2',
    h3: 'H3',
    h4: 'H4',
    h5: 'H5',
  }
  return levelLabels[ann.level] || null
}

function getBadgeStyle(ann: PDFAnnotation) {
  const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color]
  return {
    position: 'absolute' as const,
    top: '-8px',
    left: '0',
    background: colors.border,
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '1px 4px',
    borderRadius: '2px',
    lineHeight: '1',
  }
}

function getDeleteBtnStyle(ann: PDFAnnotation) {
  const isSelected = props.selectedAnnotationId === ann.id
  return {
    opacity: isSelected ? 1 : 0,
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  }
}

function handleAnnotationClick(ann: PDFAnnotation) {
  emit('annotation-click', ann)
}

function handleAnnotationDelete(ann: PDFAnnotation) {
  emit('annotation-delete', ann)
}
</script>

<style scoped>
.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.highlight-element {
  pointer-events: auto;
}

.highlight-element:hover {
  transform: scale(1.01);
}

.highlight-badge {
  position: absolute;
  top: -8px;
  left: 0;
}

.highlight-delete-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 100;
}

.highlight-delete-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}
</style>
```

**Step 4: Extract remaining components (ShapeOverlay, PDFToolbar, etc.)**

Following the same pattern as above, create the remaining components:
- ShapeOverlay.vue (shape annotations overlay)
- PDFToolbar.vue (top and bottom toolbars)
- OutlinePanel.vue (table of contents sidebar)
- BookmarkPanel.vue (bookmarks sidebar)
- SearchPanel.vue (search functionality)

**Step 5: Update main PDFViewer.vue**

Refactor the main component to use the extracted sub-components, removing extracted code and keeping only orchestration logic.

**Step 6: Run build and fix any errors**

Run: `pnpm build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/components/PDFViewer/
git commit -m "refactor(P0-5): split PDFViewer.vue into sub-components

- Extract PDFRenderer.vue for canvas rendering
- Extract AnnotationOverlay.vue for highlights
- Extract ShapeOverlay.vue for shape annotations
- Extract PDFToolbar.vue for toolbar controls
- Extract OutlinePanel.vue for table of contents
- Extract BookmarkPanel.vue for bookmarks
- Extract SearchPanel.vue for search
- Reduce main component from 3,490 lines to <600 lines"
```

---

### Task 6: P0-6 - FreeCanvasViewer.vue Component Split

**Files:**
- Current: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` (2,979 lines)
- Create: `src/components/MindMapFreeCanvas/components/CanvasCore.vue`
- Create: `src/components/MindMapFreeCanvas/components/NodeRegistry.vue`
- Create: `src/components/MindMapFreeCanvas/components/MindMapToolbar.vue`
- Create: `src/components/MindMapFreeCanvas/components/MindMapDialogs.vue`
- Target: Main component <800 lines

**Architecture:**
```
FreeCanvasViewer.vue (orchestrator, ~700 lines)
├── CanvasCore.vue (Vue Flow core, ~500 lines)
├── NodeRegistry.vue (node types registry, ~300 lines)
├── MindMapToolbar.vue (toolbar controls, ~400 lines)
└── MindMapDialogs.vue (dialogs and menus, ~600 lines)
```

**Step 1: Create directory structure**

```bash
mkdir -p src/components/MindMapFreeCanvas/components
```

**Step 2: Extract CanvasCore component**

Create `src/components/MindMapFreeCanvas/components/CanvasCore.vue`:

```vue
<template>
  <VueFlow
    ref="vueFlowRef"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :default-zoom="1"
    :min-zoom="0.1"
    :max-zoom="4"
    :fit-view-on-init="true"
    :pan-on-scroll="true"
    :zoom-on-scroll="true"
    :zoom-on-pinch="true"
    :select-nodes-on-drag="false"
    :select-edges-on-drag="false"
    :connection-line-options="{
      style: {
        stroke: '#409eff',
        strokeWidth: 2,
      },
    }"
    :delete-key-code="['Backspace', 'Delete']"
    :multi-selection-key-code="['Shift', 'Meta', 'Control']"
    :selection-key-code="['Shift']"
    :snap-to-grid="false"
    :snap-grid="[15, 15]"
    :nodes-draggable="!readOnly"
    :nodes-connectable="!readOnly"
    :elements-selectable="true"
    :prevent-scrolling="false"
    :auto-connect="true"
    :elevate-nodes-on-select="true"
    :only-render-visible-elements="true"
    :connection-radius="30"
    :select-nodes-on-connect="false"
    @connect="onConnect"
    @node-click="onNodeClick"
    @node-double-click="onNodeDoubleClick"
    @edge-click="onEdgeClick"
    @edge-contextmenu="onEdgeContextMenu"
    @node-mouse-enter="onNodeMouseEnter"
    @node-mouse-leave="onNodeMouseLeave"
    @edge-mouse-enter="onEdgeMouseEnter"
    @edge-mouse-leave="onEdgeMouseLeave"
    @node-drag-start="onNodeDragStart"
    @node-drag="onNodeDrag"
    @node-drag-stop="onNodeDragStop"
    @pane-click="onPaneClick"
    @pane-mousedown="onPaneMouseDown"
  >
    <Controls
      v-if="showControls"
      class="freemind-controls"
      :show-interactive="false"
    />
    <div
      v-if="selectionBox.visible"
      class="selection-box"
      :style="{
        left: `${selectionBox.startX}px`,
        top: `${selectionBox.startY}px`,
        width: `${selectionBox.width}px`,
        height: `${selectionBox.height}px`,
      }"
    />
  </VueFlow>
</template>

<script setup lang="ts">
import { Controls } from '@vue-flow/controls'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { FreeMindMapEdge, FreeMindMapNode } from '@/types/mindmapFree'
import type { Connection, EdgeMouseEvent, NodeClickEvent, NodeDragEvent, PaneClickEvent } from '@vue-flow/core'

const props = defineProps<{
  nodes: FreeMindMapNode[]
  edges: FreeMindMapEdge[]
  nodeTypes: Record<string, any>
  readOnly: boolean
  showControls: boolean
  selectionBox: {
    startX: number
    startY: number
    width: number
    height: number
    visible: boolean
    isSelecting: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'connect', connection: Connection): void
  (e: 'node-click', event: NodeClickEvent): void
  (e: 'node-double-click', event: NodeClickEvent): void
  (e: 'edge-click', event: EdgeMouseEvent): void
  (e: 'edge-contextmenu', event: EdgeMouseEvent): void
  (e: 'node-mouse-enter', event: NodeMouseEvent): void
  (e: 'node-mouse-leave', event: NodeMouseEvent): void
  (e: 'edge-mouse-enter', event: EdgeMouseEvent): void
  (e: 'edge-mouse-leave', event: EdgeMouseEvent): void
  (e: 'node-drag-start', event: NodeDragEvent): void
  (e: 'node-drag', event: NodeDragEvent): void
  (e: 'node-drag-stop', event: NodeDragEvent): void
  (e: 'pane-click', event: PaneClickEvent): void
  (e: 'pane-mouse-down', event: MouseEvent): void
}>()

const vueFlowRef = ref()
const { fitView, zoomIn, zoomOut, setTransform, getViewport } = useVueFlow()

function onConnect(connection: Connection) {
  emit('connect', connection)
}

function onNodeClick(event: NodeClickEvent) {
  emit('node-click', event)
}

function onNodeDoubleClick(event: NodeClickEvent) {
  emit('node-double-click', event)
}

function onEdgeClick(event: EdgeMouseEvent) {
  emit('edge-click', event)
}

function onEdgeContextMenu(event: EdgeMouseEvent) {
  emit('edge-contextmenu', event)
}

function onNodeMouseEnter(event: NodeMouseEvent) {
  emit('node-mouse-enter', event)
}

function onNodeMouseLeave(event: NodeMouseEvent) {
  emit('node-mouse-leave', event)
}

function onEdgeMouseEnter(event: EdgeMouseEvent) {
  emit('edge-mouse-enter', event)
}

function onEdgeMouseLeave(event: EdgeMouseEvent) {
  emit('edge-mouse-leave', event)
}

function onNodeDragStart(event: NodeDragEvent) {
  emit('node-drag-start', event)
}

function onNodeDrag(event: NodeDragEvent) {
  emit('node-drag', event)
}

function onNodeDragStop(event: NodeDragEvent) {
  emit('node-drag-stop', event)
}

function onPaneClick(event: PaneClickEvent) {
  emit('pane-click', event)
}

function onPaneMouseDown(event: MouseEvent) {
  emit('pane-mouse-down', event)
}

defineExpose({
  vueFlowRef,
  fitView,
  zoomIn,
  zoomOut,
  setTransform,
  getViewport,
})
</script>

<style scoped>
.freemind-controls {
  background: var(--siyuan-block-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
```

**Step 3: Extract remaining components**

Following the same pattern:
- NodeRegistry.vue (node types registration)
- MindMapToolbar.vue (toolbar with all controls)
- MindMapDialogs.vue (all dialogs, context menus, editors)

**Step 4: Update main FreeCanvasViewer.vue**

Refactor to use extracted components, keeping only orchestration logic.

**Step 5: Run build and fix errors**

Run: `pnpm build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/components/MindMapFreeCanvas/
git commit -m "refactor(P0-6): split FreeCanvasViewer.vue into sub-components

- Extract CanvasCore.vue for Vue Flow core
- Extract NodeRegistry.vue for node types
- Extract MindMapToolbar.vue for toolbar controls
- Extract MindMapDialogs.vue for dialogs and menus
- Reduce main component from 2,979 lines to <800 lines"
```

---

## Verification Criteria

### For P0-1 to P0-4 (Bug Fixes):
1. **Build passes**: `pnpm build` completes without errors
2. **TypeScript check passes**: `pnpm tsc --noEmit` shows no errors
3. **Tests pass**: `pnpm test` runs successfully
4. **ESLint passes**: `pnpm eslint src/` shows no critical errors

### For P0-5 to P0-6 (Refactoring):
1. **Build passes**: `pnpm build` completes without errors
2. **Component line counts**:
   - PDFViewer.vue < 600 lines
   - FreeCanvasViewer.vue < 800 lines
3. **Functionality preserved**: All existing features work as before
4. **No circular dependencies**: Components can be imported independently

---

## Execution Plan Summary

**Total Tasks:** 6
**Estimated Time:** 4-6 hours

**Phase 1 (Bug Fixes - 1.5 hours):**
- Task 1: P0-1 - 20 minutes
- Task 2: P0-2 - 25 minutes
- Task 3: P0-3 - 25 minutes
- Task 4: P0-4 - 20 minutes

**Phase 2 (Refactoring - 3-4 hours):**
- Task 5: P0-5 - 2 hours
- Task 6: P0-6 - 2 hours

**Recommended Execution Order:**
1. Start with Phase 1 (P0-1 to P0-4) - can be parallelized
2. Then Phase 2 (P0-5, P0-6) - sequential due to complexity

**Two execution options:**

**1. Subagent-Driven (this session)** - Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
