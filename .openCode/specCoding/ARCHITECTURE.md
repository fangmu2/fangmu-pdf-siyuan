# 架构文档 (ARCHITECTURE.md)

**最后更新**: 2026-03-04  
**项目版本**: v1.2.42

---

## 一、架构概述

### 1.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        思源笔记宿主环境                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   插件层 (Plugin Layer)                   │   │
│  │  ┌───────────────────────────────────────────────────┐   │   │
│  │  │              App.vue (主应用容器)                   │   │   │
│  │  │  - 视图模式管理 (split/list/mindmap)               │   │   │
│  │  │  - 学习集切换                                       │   │   │
│  │  │  - 全局事件处理                                     │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────┬──────────────┬──────────────┬─────────────┐   │
│  │  UI 层      │  服务层       │  状态层       │  API 层       │   │
│  │  (Views)   │  (Services)  │  (Stores)   │  (APIs)    │   │
│  ├────────────┼──────────────┼──────────────┼─────────────┤   │
│  │ - PDF      │ - 学习集管理  │ - Pinia     │ - 思源 API   │   │
│  │ - 标注列表  │ - 卡片管理    │   Stores    │ - 块操作     │   │
│  │ - 思维导图  │ - 标注管理    │ - 响应式    │ - 数据持久化 │   │
│  │ - 卡片盒    │ - 复习管理    │   状态      │ - 资源管理   │   │
│  │ - 复习界面  │ - PDF 管理     │              │             │   │
│  └────────────┴──────────────┴──────────────┴─────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  数据持久层 (Data Layer)                  │   │
│  │  - 思源块存储（主要）                                     │   │
│  │  - localStorage（临时/缓存）                              │   │
│  │  - IndexedDB（未来扩展）                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Vue | 3.4 | UI 框架 |
| **语言** | TypeScript | 5.x | 开发语言 |
| **构建** | Vite | 5.x | 构建工具 |
| **状态** | Pinia | 2.x | 状态管理 |
| **PDF** | PDF.js | 4.x | PDF 渲染 |
| **思维导图** | Vue Flow | 1.x | 流程图/导图 |
| **包管理** | pnpm | 8.x | 依赖管理 |

---

## 二、核心模块设计

### 2.1 学习集管理模块

```typescript
// 核心数据结构
interface LearningSet {
  id: string
  name: string
  description: string
  pdfs: LearningSetPdf[]
  annotationDocId: string  // 标注文档 ID
  siyuanDocId: string      // 思源文档 ID
  createdAt: number
  updatedAt: number
}

// 管理流程
学习集创建
  ↓
创建思源文档（annotationDocId, siyuanDocId）
  ↓
初始化 localStorage 映射
  ↓
加载到 Pinia Store
  ↓
UI 渲染
```

**关键文件**:
- `src/components/LearningSetManager.vue` - 学习集管理 UI
- `src/services/learningSetService.ts` - 学习集 CRUD 服务
- `src/stores/learningSetStore.ts` - 学习集状态管理
- `src/api/learningSetApi.ts` - 学习集 API 封装

### 2.2 PDF 阅读器模块

```typescript
// PDF 视图模式
type ViewMode = 'split' | 'list' | 'mindmap'

// PDF 标注流程
PDF 加载
  ↓
渲染页面（Canvas + TextLayer）
  ↓
用户选择文本/图片
  ↓
创建标注（annotation）
  ↓
保存到学习集文档
  ↓
触发 annotation-created 事件
  ↓
思维导图实时同步
```

**关键文件**:
- `src/components/PDFViewer.vue` (3145 行) - PDF 渲染和交互 🔴 巨型组件
- `src/services/pdfViewerService.ts` - PDF 渲染服务
- `src/services/pdfAnnotationService.ts` - 标注管理
- `src/composables/usePdfViewer.ts` - PDF 查看器组合式 API

### 2.3 思维导图模块（MarginNote 风格）

```typescript
// 自由画布数据结构
interface FreeMindMapNode {
  id: string
  type: 'textCard' | 'imageCard' | 'group'
  data: FreeMindMapNodeData
  position: { x: number; y: number }
  style?: {
    transform?: string  // 旋转角度
    width?: number
    height?: number
  }
  parentId?: string
  childrenIds: string[]
  zIndex: number
}

// 布局模式
type LayoutMode = 'free' | 'tree' | 'vertical' | 'horizontal'

// 核心功能流程
节点创建
  ↓
添加到 Vue Flow 图
  ↓
建立父子关系（可选）
  ↓
应用布局算法（树状/垂直/水平）
  ↓
保存到思源块属性
  ↓
localStorage 备份
```

**关键文件**:
- `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` (2713 行) - 画布查看器 🔴 巨型组件
- `src/components/MindMapFreeCanvas/TextCardNode.vue` - 文本卡片节点
- `src/stores/freeMindMapStore.ts` (2005 行) - 思维导图状态管理 🔴 臃肿
- `src/services/freeMindMapService.ts` - 思维导图服务
- `src/utils/treeLayout.ts` (242 行) - 树状布局算法

### 2.4 卡片与摘录模块

```typescript
// 卡片类型
type CardType = 'annotation' | 'flashcard' | 'excerpt'

// 卡片数据结构
interface Card {
  id: string
  type: CardType
  content: string
  sourcePdf?: string
  sourcePage?: number
  annotationId?: string
  learningSetId: string
  createdAt: number
  updatedAt: number
}

// 摘录回源流程
点击回源按钮
  ↓
获取 card.annotationId
  ↓
查询思源块属性
  ↓
获取 PDF 路径和页码
  ↓
PDFViewer 跳转并高亮
```

**关键文件**:
- `src/components/CardList.vue` - 卡片列表
- `src/services/cardService.ts` - 卡片管理
- `src/services/pdfExcerptService.ts` - 摘录回源服务

### 2.5 闪卡复习模块

```typescript
// SRS 算法接口
interface ReviewScheduler {
  scheduleCard(card: FlashCard, quality: number): ReviewSchedule
  getDueCards(studySetId: string): FlashCard[]
}

// 复习流程
加载到期卡片
  ↓
显示卡片正面
  ↓
用户回忆答案
  ↓
翻转显示背面
  ↓
用户评分（1-5）
  ↓
SM2 算法计算下次复习时间
  ↓
保存复习记录
```

**关键文件**:
- `src/components/ReviewManager.vue` - 复习管理
- `src/services/reviewService.ts` - 复习服务
- `src/services/sm2.ts` - SM2 间隔重复算法

---

## 三、数据流设计

### 3.1 状态管理架构

```
┌─────────────────────────────────────────────────────────┐
│                    状态管理层                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                 │
│  │ Pinia Store  │     │ 组件本地状态  │                 │
│  │ (全局状态)    │     │ (局部状态)    │                 │
│  ├──────────────┤     ├──────────────┤                 │
│  │ - 学习集列表  │     │ - UI 状态      │                 │
│  │ - 当前 PDF    │     │ - 表单状态    │                 │
│  │ - 用户设置    │     │ - 临时数据    │                 │
│  └──────────────┘     └──────────────┘                 │
│         │                       │                       │
│         └───────────┬───────────┘                       │
│                     │                                   │
│              ┌──────▼──────┐                           │
│              │ 服务层       │                           │
│              │ (业务逻辑)   │                           │
│              └──────┬──────┘                           │
│                     │                                   │
│              ┌──────▼──────┐                           │
│              │ API 层       │                           │
│              │ (思源调用)   │                           │
│              └──────┬──────┘                           │
│                     │                                   │
│              ┌──────▼──────┐                           │
│              │ 数据持久层   │                           │
│              │ - 思源块     │                           │
│              │ - localStorage                           │
│              └─────────────┘                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 事件总线设计

```typescript
// 全局事件类型
interface AppEvents {
  'annotation-created': { annotation: Annotation }
  'annotation-updated': { annotation: Annotation }
  'annotation-deleted': { annotationId: string }
  'focus-annotation': { annotationId: string }
  'learning-set-changed': { setId: string }
  'pdf-loaded': { pdfPath: string }
}

// 事件使用示例
// 发送事件
window.dispatchEvent(new CustomEvent('annotation-created', {
  detail: { annotation: newAnnotation }
}))

// 监听事件
window.addEventListener('annotation-created', (e) => {
  handleAnnotationCreated(e.detail.annotation)
})
```

### 3.3 PDF ↔ 思维导图同步流程

```
PDF 端                              思维导图端
  │                                    │
  │ 用户选择文本                        │
  │                                    │
  ├─→ 创建标注                          │
  │     (annotation)                   │
  │                                    │
  ├─→ 保存到学习集文档                 │
  │                                    │
  ├─→ 触发 annotation-created 事件 ────→│
  │                                    │
  │                                    ├─→ 监听事件
  │                                    │
  │                                    ├─→ 创建节点
  │                                    │     (textCard)
  │                                    │
  │                                    ├─→ 添加到 Vue Flow
  │                                    │
  │                                    ├─→ 建立双向关联
  │                                    │     (nodeId ↔ annotationId)
  │                                    │
  │                                    └─→ 渲染卡片
  │                                    │
  │ 用户点击导图节点                   │
  │                                    │
  ├←─ 触发 focus-annotation 事件 ←─────┤
  │                                    │
  ├─→ scrollToAnnotation(id)           │
  │                                    │
  └─→ PDF 跳转并高亮                    │
```

---

## 四、关键设计决策

### 4.1 数据持久化策略

**决策**: 使用思源块属性作为主要存储，localStorage 作为临时/缓存存储

**原因**:
1. 思源块可随文档同步
2. 支持跨设备
3. localStorage 用于临时 ID 映射和缓存

**实现**:
```typescript
// 思维导图持久化
async function saveMindMapToBlock(blockId: string, data: FreeMindMapData) {
  if (isTempId(blockId)) {
    // 临时 ID → localStorage
    localStorage.setItem(blockId, JSON.stringify(data))
  } else {
    // 正式 ID → 思源块属性
    await updateBlockAttrs({ blockId, attrs: dataToAttrs(data) })
  }
}
```

### 4.2 组件拆分策略

**当前问题**: 大组件过多（App.vue 1387 行，PDFViewer.vue 2731 行）

**拆分方案**:
```
App.vue (1387 行)
├── App.vue (主容器，<100 行)
├── PanelHeader.vue (顶部工具栏)
├── LearningSetTabs.vue (学习集切换)
├── MainContentArea.vue (主体区域)
└── SidePanelsManager.vue (侧边栏管理)

PDFViewer.vue (2731 行)
├── PDFViewer.vue (主容器)
├── PDFToolbar.vue (工具栏)
├── PDFPageCanvas.vue (Canvas 渲染)
├── PDFTextLayer.vue (文本选择层)
├── PDFHighlightLayer.vue (高亮层)
├── PDFImageSelector.vue (图片框选)
└── HandwritingLayer.vue (手写层)
```

### 4.3 状态管理统一

**当前问题**: Pinia + 本地状态 + localStorage 混用

**目标架构**:
```typescript
// 统一使用 Pinia Store
const store = useLearningSetStore()
await store.loadSets()
await store.updateSet(id, updates)

// 服务层通过 Store 更新状态，不直接修改
export class LearningSetService {
  static async updateLearningSet(id: string, updates: Partial<LearningSet>) {
    // 1. API 调用更新数据
    await postApi('/api/block/updateBlock', { ... })
    
    // 2. 通过 Store 更新状态
    const store = useLearningSetStore()
    store.updateSet(id, updates)
  }
}
```

---

## 五、性能优化策略

### 5.1 大列表优化

**问题**: AnnotationList 和 CardBoxBoard 在大量数据时卡顿

**方案**: 虚拟滚动
```vue
<template>
  <RecycleScroller
    :items="annotations"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <AnnotationItem :annotation="item" />
    </template>
  </RecycleScroller>
</template>
```

### 5.2 防抖节流

**应用场景**:
- PDF 搜索输入
- 节点搜索
- 窗口 resize

```typescript
import { useDebounceFn } from '@vueuse/core'

const onDocSearchInput = useDebounceFn(async (query: string) => {
  // 搜索逻辑
}, 300)
```

### 5.3 计算缓存

```typescript
const visibleNodes = computed(() => {
  // 复杂过滤逻辑
  return nodes.value.filter(node => {
    // 过滤条件
  })
})
```

---

## 六、错误处理架构

### 6.1 统一错误处理

```typescript
// utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public operation: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function handleApiError<T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('未知错误')
    console.error(`[API Error] ${operation}:`, apiError.message)
    throw new ApiError(apiError.message, 500, operation)
  }
}
```

### 6.2 错误边界

```vue
<!-- components/ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-boundary">
    <h2>出错了</h2>
    <p>{{ error.message }}</p>
    <button @click="retry">重试</button>
  </div>
  <slot v-else />
</template>
```

---

## 七、测试策略

### 7.1 测试金字塔

```
         /\
        /  \
       / E2E \      端到端测试（Playwright）
      /______\
     /        \
    / Integration\  集成测试
   /______________\
  /                \
 /    Unit Tests    \  单元测试（Vitest）
/____________________\
```

### 7.2 测试优先级

1. **核心服务测试**（必须）
   - learningSetService
   - cardService
   - annotationApi

2. **工具函数测试**（必须）
   - annotationParser
   - markdownGenerator

3. **组件测试**（重要）
   - PDFViewer 关键功能
   - LearningSetManager 表单验证

4. **集成测试**（建议）
   - PDF 导入 → 标注 → 保存流程

5. **E2E 测试**（可选）
   - 使用 Playwright

---

## 八、开发规范

### 8.1 代码风格

- **缩进**: 2 个空格
- **引号**: 单引号
- **分号**: 添加
- **TypeScript**: 严格模式

### 8.2 文件组织

```
src/
├── api/              # API 层
├── components/       # Vue 组件
├── composables/      # 组合式函数
├── services/         # 业务逻辑
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型
├── utils/            # 工具函数
└── App.vue          # 主应用
```

### 8.3 命名约定

- **组件**: PascalCase (LearningSetManager)
- **文件**: 
  - Vue: PascalCase
  - TS: camelCase
- **变量/函数**: camelCase
- **类型/接口**: PascalCase
- **常量**: UPPER_SNAKE_CASE

---

**维护说明**: 架构变更时及时更新此文档
