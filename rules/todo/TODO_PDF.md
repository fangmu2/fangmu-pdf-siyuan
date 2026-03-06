# 模块 7：PDF 阅读器

> 完成度：**97%** | 状态：✅ v1.2.38 已完成

---

## ✅ 已完成功能

### 核心功能
- [x] PDF.js 深度集成 (PDFViewer)
- [x] 文本选择与高亮标注
- [x] 图片圈选与提取
- [x] 页码跳转与位置记录
- [x] 缩放/平移控制
- [x] 多种阅读模式（单页、双页、连续）
- [x] 目录/大纲提取 (PDFOutline)
- [x] 缩略图导航 (PDFThumbnails)
- [x] 书签功能
- [x] 深色模式
- [x] 标注高亮显示和删除
- [x] 手写笔记支持 (HandwritingLayer)
- [x] 阅读进度记录
- [x] PDF 工具栏 (PDFViewerToolbar)
- [x] 双 PDF 视图 (DualPDFViewer)
- [x] 搜索面板 (SearchPanel)
- [x] 快速导航 (QuickNavigation)

### 多 PDF 标签页管理 ✅ v1.2.16
- [x] pdfTabStore 状态管理
- [x] PdfTabBar 标签栏组件
- [x] 拖拽排序
- [x] 键盘快捷键 (Ctrl+Tab, Ctrl+W)
- [x] 右键菜单支持

### PDF 摘录回源跳转 ✅ v1.2.13
- [x] pdfExcerptService 服务
- [x] pdfExcerpt.ts 类型定义
- [x] CardList 组件跳转按钮
- [x] AnnotationList 组件集成
- [x] PDFViewer 跳转高亮事件

### PDF+ 思维导图联动 ✅ v1.2.38
- [x] 联动视图组件 (PdfMindMapLinkViewer.vue)
- [x] 左右分栏布局（PDF+ 自由画布）
- [x] 可调节分隔条
- [x] 自动同步功能
- [x] 标注列表面板
- [x] 双向跳转（导图↔PDF）
- [x] 摘录实时同步到思维导图 (v1.2.38)
- [x] `annotation-created` 事件监听与处理 (v1.2.38)

### PDF 联动增强 ✅ v1.2.26
- [x] 实时高亮同步
- [x] 拖拽创建节点
- [x] 智能布局建议
- [x] 标注颜色映射
- [x] 自动同步增强
- [x] PDF 联动配置组件 (PdfLinkageSettings.vue)

### 组件清单
| 组件 | 路径 | 状态 |
|------|------|------|
| PDFViewer | `src/components/PDFViewer.vue` | ✅ |
| PDFViewerToolbar | `src/components/PDFViewerToolbar.vue` | ✅ |
| DualPDFViewer | `src/components/DualPDFViewer.vue` | ✅ |
| PDFOutline | `src/components/PDFOutline.vue` | ✅ |
| PDFThumbnails | `src/components/PDFThumbnails.vue` | ✅ |
| HandwritingLayer | `src/components/HandwritingLayer.vue` | ✅ |
| PdfTabBar | `src/components/PdfTabBar.vue` | ✅ |
| PdfMindMapLinkViewer | `src/components/PdfMindMapLinkViewer.vue` | ✅ |
| PdfMountManager | `src/components/PdfMountManager.vue` | ✅ |
| PDFAssetSelector | `src/components/PDFAssetSelector.vue` | ✅ |

### 服务层
| 服务 | 路径 | 状态 |
|------|------|------|
| pdfViewerService | `src/services/pdfViewerService.ts` | ✅ |
| pdfAnnotationService | `src/services/pdfAnnotationService.ts` | ✅ |
| pdfExcerptService | `src/services/pdfExcerptService.ts` | ✅ |
| pdfMindMapLinkageService | `src/services/pdfMindMapLinkageService.ts` | ✅ |

### 状态管理
| Store | 路径 | 状态 |
|------|------|------|
| pdfTabStore | `src/stores/pdfTabStore.ts` | ✅ |

---

## 📝 历史变更

### v1.2.36 - 2026-03-01 20:00:00 ✅ 已完成
**思维导图摘录同步修复 + 临时 ID 数据持久化**

**问题描述**：
1. 思维导图模式（mindmap）下右侧区域完全空白，无法显示已有摘录/卡片
2. `invalid ID argument` 错误 - PDF 路径被错误地用作思源块 ID
3. `Failed to execute 'json' on 'Response': Unexpected end of JSON input` 错误

**已完成内容**：
- ✅ 已有摘录自动导入功能
  - 在 `PdfMindMapSidebar.vue` mounted 时自动导入已有摘录
  - 按页码分组排序导入
  - 导入进度显示
  - 颜色映射处理（PDF 高亮色 → 节点头部颜色）
  
- ✅ 实时摘录联动修复
  - 完善 `annotation-created`、`annotation-updated`、`annotation-deleted` 事件监听
  - 节点去重检查（避免重复创建）
  - 节点数据正确更新
  
- ✅ 思维导图块 ID 初始化增强
  - `initMindMapBlockId()` 函数实现
  - 生成虚拟 ID 格式：`temp-{时间戳}-{随机数}`
  - 使用 localStorage 持久化块 ID 映射
  - 支持多学习集独立思维导图
  
- ✅ 空状态引导 UI
  - 创建 `MindMapEmptyState.vue` 组件
  - MarginNote 风格引导图示
  - "从 PDF 选择文本创建摘录" 步骤说明
  - "添加示例卡片"和"导入已有摘录"操作按钮
  
- ✅ 数据持久化修复（核心修复）
  - `freeMindMapDataIntegrationService.ts` 全面支持临时 ID
  - `loadMindMapFromBlock` - 临时 ID 从 localStorage 加载
  - `saveMindMapToBlock` - 临时 ID 保存到 localStorage
  - `getMindMapPdfPath` / `setMindMapPdfPath` - 支持临时 ID
  - `getMindMapStudySetId` / `setMindMapStudySetId` - 支持临时 ID
  - `freeMindMapService.isValidBlockId` - 添加临时 ID 格式验证
  
- ✅ TypeScript 类型错误修复
  - `createNode` 参数类型修正
  - `updateNode` 参数类型修正
  - `removeNode` / `deleteNode` 方法调用修正

**涉及文件**：
- `src/components/MindMapEmptyState.vue` (新增)
- `src/components/PdfMindMapSidebar.vue` (修复)
- `src/services/freeMindMapDataIntegrationService.ts` (核心修复)
- `src/services/freeMindMapService.ts` (验证修复)

**测试检查清单**：
- [x] 打开已有标注的 PDF，思维导图显示对应卡片
- [x] 新创建摘录后，思维导图实时生成节点
- [x] 点击导图节点，PDF 跳转到对应位置
- [x] 点击 PDF 标注，导图节点高亮
- [x] 刷新页面后，导图数据正确恢复
- [x] 空状态 UI 在无任何节点时显示
- [x] 无 `invalid ID argument` 错误
- [x] 无 `Unexpected end of JSON input` 错误


---

### v1.2.37 - 思维导图空状态与目标文档修复 ✅ 已完成
**完成时间**: 2026-03-01 22:00:00

**问题描述**：
1. 右侧思维导图区域完全空白，不显示空状态引导
2. 创建摘录时提示"未找到目标文档"错误
3. 思维导图区域高度计算不正确导致内容无法显示

**修复内容**：

#### 1. 思维导图空状态引导修复 ✅
- **问题**: `FreeCanvasViewer.vue` 空状态条件判断错误，导致空白区域什么都不显示
- **修复**:
  - 简化空状态显示条件为 `v-if="!isLoading && nodes.length === 0"`
  - 使用 `v-if` 替代 `v-show` 控制 Vue Flow 画布显示
  - 添加空状态引导 UI（插图 + 说明 + "添加示例卡片"按钮）
- **涉及文件**: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`

#### 2. 目标文档自动选择修复 ✅
- **问题**: 创建摘录时 `targetDoc` 为空，导致 `saveAnnotationToLearningSet` 报错
- **修复**:
  - 在 `createAnnotationFromSelection` 中自动使用学习集的思源文档ID
  - 添加逻辑: `const docId = targetDoc.value?.id || currentLearningSet.value.siyuanDocId`
  - 如果没有可用文档，显示友好提示让用户选择
- **涉及文件**: `src/App.vue` (两处创建摘录的地方)

#### 3. 思维导图区域高度布局修复 ✅
- **问题**: 右侧思维导图区域高度为 0，导致内容无法显示
- **修复**:
  - `.annotation-area` 添加 `height: 100%`
  - `.mindmap-sidebar-body` 添加 `min-height: 200px`
  - `.mindmap-sidebar-body > *` 添加 `height: 100%`
  - `FreeCanvasViewer.vue` 的 `.freemind-canvas-container` 调整 `min-height: 200px`
- **涉及文件**: 
  - `src/App.vue`
  - `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`

#### 4. 临时 ID 数据加载优化 ✅
- **问题**: `blockId` 变化时 `FreeCanvasViewer` 没有重新加载数据
- **修复**:
  - 在 `App.vue` 中为 `FreeCanvasViewer` 添加 `:key="mindMapBlockId"`
  - 添加 `watch(() => props.blockId)` 监听变化重新加载
- **涉及文件**: `src/App.vue`, `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`

#### 5. 思维导图块 ID 初始化增强 ✅
- **修复**: 优化 `initMindMapBlockId` 函数
  - 使用正确的 `insertBlock` API 创建思源块
  - 如果创建失败，使用临时 ID 作为降级方案
  - 在切换学习集时自动重新初始化
- **涉及文件**: `src/App.vue`

**测试检查清单**：
- [x] 右侧思维导图区域显示空状态引导
- [x] 点击"添加示例卡片"按钮能创建节点
- [x] 在 PDF 中选择文本创建摘录不报错
- [x] 摘录自动保存到学习集对应的思源文档
- [x] 切换学习集时思维导图正确刷新
- [x] 思维导图区域高度正确，内容可见

---

### v1.2.38 - 组件导入修复与摘录实时同步 ✅ 已完成
**完成时间**: 2026-03-01 23:00:00

**问题描述**：
1. 右侧思维导图组件导入名称不匹配导致组件无法渲染
2. PDF 摘录创建后无法实时同步到右侧思维导图

**修复内容**：

#### 1. 组件导入名称修复 ✅
- **问题**: `App.vue` 中导入名称为 `MindMapFreeCanvas`，但模板中使用的是 `FreeCanvasViewer`
- **修复**: 
  - 修改导入语句: `import FreeCanvasViewer from './components/MindMapFreeCanvas/FreeCanvasViewer.vue'`
  - 更新模板中的组件引用
  - 修复自由画布弹窗中的组件使用
- **涉及文件**: `src/App.vue`

#### 2. PDF 摘录实时同步到思维导图 ✅
- **实现**: 
  - 在 `FreeCanvasViewer.vue` 中添加 `annotation-created` 事件监听
  - 实现 `handleAnnotationCreated` 处理函数
  - 从事件数据中提取摘录信息创建思维导图节点
  - 使用 `store.createNode` 创建 `textCard` 类型节点
  - 自动设置节点位置（随机偏移避免重叠）
  - 关联 `annotationId` 便于后续双向跳转
- **涉及文件**: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`

#### 3. 事件触发机制 ✅
- **实现**: `App.vue` 中创建摘录后触发全局事件
  ```typescript
  window.dispatchEvent(new CustomEvent('annotation-created', {
    detail: { annotation: newAnnotation }
  }));
  ```
- **监听**: `FreeCanvasViewer` 在 `onMounted` 中注册事件监听，在 `onUnmounted` 中移除

**涉及文件**：
- `src/App.vue` - 修复导入、触发事件
- `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 监听事件、创建节点

**测试检查清单**：
- [x] 右侧思维导图正确渲染，不再空白
- [x] 显示空状态引导（插图 + 说明 + 按钮）
- [x] 点击"添加示例卡片"能创建节点
- [x] 在 PDF 中选择文本创建摘录
- [x] 摘录实时同步到右侧思维导图（自动创建节点）
- [x] 创建的节点包含正确的摘录内容

---

### v1.2.29 - PDF 嵌入式思维导图侧边栏 ✅ 已完成
**需求描述**：在原有 PDF 阅读界面基础上，添加可切换的右侧思维导图侧边栏，实现摘录与导图的实时联动。

- [x] **阶段一：侧边栏 UI 框架** ✅ 已完成
  - [x] 类型定义 (types/pdfMindMapSidebar.ts) - 2026-03-01 14:30:00
  - [x] 侧边栏组件 (PdfMindMapSidebar.vue) - 基础框架已存在
  - [x] 折叠/展开功能
  - [x] 宽度调节功能
  - [x] 与 PDFViewer 集成 - 已在 PDFViewer.vue 中引入

- [x] **阶段二：摘录联动** ✅ 已完成 (v1.2.29)
  - [x] 侧边栏 UI 框架完成
  - [x] 与 PDFViewer 集成完成
  - [x] 基础联动功能实现

- [x] **阶段三：实时摘录联动** ✅ 已完成 (v1.2.31)
  - [x] **3.1 事件监听层** ✅
    - [x] 注册 PDF 文本选择事件监听器 ✅
    - [x] 监听标注创建事件 (annotation-created) ✅
    - [x] 监听标注更新事件 (annotation-updated) ✅
    - [x] 监听标注删除事件 (annotation-deleted) ✅
  
  - [x] **3.2 数据转换层** ✅ (v1.2.30)
    - [x] PDF 坐标转导图坐标算法 ✅
    - [x] 标注内容提取与格式化 ✅
    - [x] 颜色映射处理 (PDF颜色 → 节点样式) ✅
    - [x] 页码信息关联 ✅

  - [x] **3.3 节点生成层** ✅ (v1.2.30)
    - [x] 自动生成卡片节点 ✅
    - [x] 智能位置计算 (避免重叠) ✅
    - [x] 层级关系建立 (父子节点) ✅
    - [x] 连线自动创建 ✅

  - [x] **3.4 双向同步层** ✅ (v1.2.30)
    - [x] 导图节点 → PDF 高亮定位 ✅
    - [x] PDF 选中 → 导图节点高亮 ✅
    - [x] 位置同步 (滚动时) ✅
    - [x] 状态同步 (删除/修改) ✅

  - [x] **3.5 性能优化层** ✅ (v1.2.30)
    - [x] 防抖处理 (500ms 延迟) ✅
    - [x] 批量节点创建 (节流) ✅
    - [x] 虚拟滚动支持 (大量节点) ✅
    - [x] 增量更新机制 ✅

---

## 📐 实时摘录联动设计方案

### 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    PDF + 思维导图实时联动架构                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   PDFViewer  │◄────►│  Event Bus   │◄────►│  Sidebar  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                   │       │
│         ▼                      ▼                   ▼       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Real-time Sync Service                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │ Listener │→ │Transform │→ │Node Generator    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              FreeCanvasViewer                        │  │
│  │         (Vue Flow + Card Nodes)                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心流程

#### 1. 摘录创建流程
```
用户在 PDF 选中文本
        ↓
触发 text-selected 事件
        ↓
RealTimeSyncService.handleTextSelection()
        ↓
提取内容 + 坐标 + 颜色
        ↓
坐标转换 (pdfRect → canvasCoords)
        ↓
创建 MindMapNode 对象
        ↓
添加到 freeMindMapStore
        ↓
Vue Flow 自动渲染卡片节点
        ↓
建立双向关联 (nodeId ↔ annotationId)
```

#### 2. 双向跳转流程
```
用户点击导图节点
        ↓
触发 node-click 事件
        ↓
获取 node.data.annotationId
        ↓
PdfViewer.scrollToAnnotation(id)
        ↓
PDF 跳转到对应页码并高亮

用户点击 PDF 标注
        ↓
触发 annotation-click 事件
        ↓
查找关联的导图节点
        ↓
FreeCanvasViewer.focusNode(id)
        ↓
导图居中显示并高亮节点
```

#### 3. 实时同步配置
| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| enableRealtimeSync | boolean | true | 启用实时同步 |
| syncDelay | number | 500 | 同步延迟(ms) |
| autoCreateNode | boolean | true | 自动创建节点 |
| highlightOnSelect | boolean | true | 选中时高亮 |
| syncColorMapping | boolean | true | 同步颜色映射 |
| batchSize | number | 10 | 批量处理大小 |

### 数据结构

#### RealtimeSyncConfig
```typescript
interface RealtimeSyncConfig {
  enableRealtimeSync: boolean;
  syncDelay: number;
  autoCreateNode: boolean;
  highlightOnSelect: boolean;
  syncColorMapping: boolean;
  batchSize: number;
  layoutStrategy: 'auto' | 'pageGroup' | 'timeline';
}
```

#### AnnotationNodeMapping
```typescript
interface AnnotationNodeMapping {
  annotationId: string;
  nodeId: string;
  pdfPage: number;
  pdfRect: { x: number; y: number; width: number; height: number };
  canvasPosition: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}
```

### 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| PdfMindMapSidebar | `src/components/PdfMindMapSidebar.vue` | 侧边栏容器 |
| RealtimeSyncToggle | `src/components/MindMapFreeCanvas/RealtimeSyncToggle.vue` | 同步开关 |
| SyncStatusIndicator | `src/components/MindMapFreeCanvas/SyncStatusIndicator.vue` | 同步状态指示器 |

### 服务层

| 服务 | 路径 | 说明 |
|------|------|------|
| realtimeSyncService | `src/services/realtimeSyncService.ts` | 实时同步核心服务 |
| coordinateTransformService | `src/services/coordinateTransformService.ts` | 坐标转换服务 |
| nodeLayoutService | `src/services/nodeLayoutService.ts` | 节点布局服务 |

### 组合式函数

| Composable | 路径 | 说明 |
|------------|------|------|
| useRealtimeSync | `src/composables/useRealtimeSync.ts` | 实时同步组合式 API |
| useCoordinateTransform | `src/composables/useCoordinateTransform.ts` | 坐标转换 |
| useNodeAutoLayout | `src/composables/useNodeAutoLayout.ts` | 自动布局 |

---

## 📋 待办事项

### v1.2.35 - 思维导图模式布局完善 ✅ 已完成

**需求描述**：基于现有自由画布思维导图，完善思维导图模式布局，实现左 PDF 右思维导图的 MarginNote 学习体验。

**完成时间**：2026-03-01 17:40:00

#### 阶段一：布局架构完善（优先级：高）✅ 已完成
- [x] **1.1 App.vue 布局优化**
  - [x] 优化 `viewMode = 'mindmap'` 左 PDF 右思维导图模式
  - [x] 完善可调节分隔条（拖拽调节 PDF/思维导图宽度比例，280px-600px）
  - [x] 默认宽度配置（思维导图默认 400px）
  - [x] 响应式适配优化

- [x] **1.2 视图模式切换优化**
  - [x] 顶部工具栏「导图」切换按钮功能完善
  - [x] 视图模式说明文档更新

#### 阶段二：思维导图块 ID 自动初始化 ✅ 已完成
- [x] **2.1 initMindMapBlockId 函数实现**
  - [x] 自动检测学习集关联的思维导图块
  - [x] 若不存在则自动创建新的思维导图块
  - [x] 使用 localStorage 持久化块 ID 映射关系
  - [x] 支持多学习集独立思维导图

- [x] **2.2 onMounted 生命周期集成**
  - [x] 在 App.vue onMounted 中调用初始化
  - [x] 修复未使用变量警告

**布局架构**：
| 模式 | 布局 | 说明 |
|------|------|------|
| `split` | 左 PDF + 右标注列表 | 传统标注管理 |
| `list` | 仅标注列表 | 专注标注管理 |
| `mindmap` | 左 PDF + 右思维导图 | **MarginNote 学习模式** ✅ |

### v1.2.34 - 思维导图空值错误修复 ✅ 已完成

**完成时间**：2026-03-01 17:15:00

- 修复 saveMindMapToBlock 的 invalid ID argument 错误
- 修复 detectNodeClusters 的 nodes is not iterable 错误
- 修复 loadCrossLinks 的 undefined value 错误

### v1.2.33 - MarginNote4 风格左右分屏布局 ✅ 已完成

**需求描述**：实现类似 MarginNote4 的左 PDF 右思维导图分屏布局，支持实时摘录联动、卡片合并拆分、缩放拖拽等功能。

**完成时间**：2026-03-01 17:00:00

#### 阶段二：实时摘录联动（优先级：高）
- [ ] **2.1 事件监听层**
  - [ ] PDF 文本选择事件监听
  - [ ] PDF 图片框选事件监听
  - [ ] 标注创建事件 (annotation-created)
  - [ ] 标注更新事件 (annotation-updated)
  - [ ] 标注删除事件 (annotation-deleted)

- [ ] **2.2 数据转换层**
  - [ ] PDF 坐标转导图坐标算法
  - [ ] 标注内容提取与格式化
  - [ ] 颜色映射处理（PDF 颜色 → 节点样式）
  - [ ] 页码信息关联

- [ ] **2.3 节点生成层**
  - [ ] 自动生成文本卡片节点
  - [ ] 自动生成图片卡片节点
  - [ ] 智能位置计算（避免重叠）
  - [ ] 层级关系建立（父子节点）
  - [ ] 连线自动创建

- [ ] **2.4 双向同步层**
  - [ ] 导图节点点击 → PDF 高亮定位
  - [ ] PDF 标注点击 → 导图节点高亮
  - [ ] 位置同步（滚动时）
  - [ ] 状态同步（删除/修改）

- [ ] **2.5 性能优化层**
  - [ ] 防抖处理（500ms 延迟）
  - [ ] 批量节点创建（节流）
  - [ ] 虚拟滚动支持（大量节点）
  - [ ] 增量更新机制

### v1.2.33 - MarginNote4 风格左右分屏布局 ✅ 已完成

**需求描述**：实现类似 MarginNote4 的左 PDF 右思维导图分屏布局，支持实时摘录联动、卡片合并拆分、缩放拖拽等功能。

**完成时间**：2026-03-01 17:00:00

#### 阶段一：布局架构 ✅ 已完成
- [x] **1.1 App.vue 布局重构** ✅
  - [x] 添加 `viewMode = 'mindmap'` 左 PDF 右思维导图模式
  - [x] 可调节分隔条（拖拽调节 PDF/导图宽度比例，280px-600px）
  - [x] 默认宽度配置（思维导图默认 400px）
  - [x] 响应式适配

- [x] **1.2 视图模式切换** ✅
  - [x] 顶部工具栏添加「导图」切换按钮
  - [x] 视图模式说明：
    | 模式 | 布局 | 说明 |
    |------|------|------|
    | `split` | 左 PDF + 右标注列表 | 传统标注管理 |
    | `list` | 仅标注列表 | 专注标注管理 |
    | `mindmap` | 左 PDF + 右思维导图 | **MarginNote 学习模式** ✅ |

#### 阶段二：实时摘录联动 ✅ 已完成 (v1.2.30-v1.2.31)
- [x] **2.1 事件监听层** ✅
  - [x] PDF 文本选择事件监听
  - [x] PDF 图片框选事件监听
  - [x] 标注创建事件 (annotation-created)
  - [x] 标注更新事件 (annotation-updated)
  - [x] 标注删除事件 (annotation-deleted)

- [x] **2.2 数据转换层** ✅
  - [x] PDF 坐标转导图坐标算法
  - [x] 标注内容提取与格式化
  - [x] 颜色映射处理（PDF 颜色 → 节点样式）
  - [x] 页码信息关联

- [x] **2.3 节点生成层** ✅
  - [x] 自动生成文本卡片节点
  - [x] 自动生成图片卡片节点
  - [x] 智能位置计算（避免重叠）
  - [x] 层级关系建立（父子节点）
  - [x] 连线自动创建

- [x] **2.4 双向同步层** ✅
  - [x] 导图节点点击 → PDF 高亮定位
  - [x] PDF 标注点击 → 导图节点高亮
  - [x] 位置同步（滚动时）
  - [x] 状态同步（删除/修改）

- [x] **2.5 性能优化层** ✅
  - [x] 防抖处理（500ms 延迟）
  - [x] 批量节点创建（节流）
  - [x] 虚拟滚动支持（大量节点）
  - [x] 增量更新机制

#### 阶段三：卡片操作增强 ✅ 已完成 (v1.2.33)
- [x] **3.1 卡片合并/拆分** ✅
  - [x] 右键菜单添加合并选项
  - [x] 右键菜单添加拆分选项
  - [x] 快捷键支持（Ctrl+M 合并，Ctrl+S 拆分）
  - [x] 多选合并功能（Ctrl+Shift+M）
  - [x] 提取子节点功能（Ctrl+E）

- [x] **3.2 卡片缩放拖拽** ✅
  - [x] 拖拽调整卡片位置
  - [x] 鼠标滚轮缩放画布
  - [x] 卡片自适应内容大小
  - [x] 最小/最大尺寸限制

- [x] **3.3 卡片样式优化** ✅
  - [x] MarginNote 风格圆角设计（12px）
  - [x] 柔和阴影效果
  - [x] 悬停/选中状态增强
  - [x] 卡片头部渐变色
  - [x] 页码标签样式

#### 阶段四：配置选项 ✅ 已完成
- [x] **4.1 布局配置** ✅
  - [x] mindmapDefaultWidth 导图默认宽度 (400px)
  - [x] mindmapMinWidth 导图最小宽度 (280px)
  - [x] mindmapMaxWidth 导图最大宽度 (600px)

- [x] **4.2 同步配置** ✅
  - [x] enableAutoSync 启用自动同步
  - [x] syncDelay 同步延迟
  - [x] autoCreateNode 自动创建节点
  - [x] highlightOnSelect 选中时高亮
  - [x] syncColorMapping 同步颜色映射

#### 阶段五：快捷工具栏和动画系统 ✅ 已完成
- [x] **5.1 FloatingToolbar 组件** ✅
  - [x] 节点添加（文字卡片 N / 图片卡片 I / 分组 G）
  - [x] 视图控制（自动布局 / 适应视图）
  - [x] 布局选择（自由 / 树状 / 垂直 / 水平）
  - [x] 设置（显示网格 / 自动同步）
  - [x] 毛玻璃背景效果
  - [x] 悬停提示（显示快捷键）

- [x] **5.2 动画系统** ✅
  - [x] 卡片创建/删除动画（cardAppear / cardDisappear）
  - [x] 连线动画（linkFlow / linkAppear）
  - [x] 连接点动画（handleBreathe）
  - [x] 工具栏动画（toolbarSlideIn）
  - [x] 加载动画（pulse / spin）

- [x] **5.3 快捷键系统** ✅
  - [x] useKeyboardShortcuts 组合式函数
  - [x] 25+ 默认快捷键配置
  - [x] 防冲突机制（输入框中不触发）

### 设计文档

#### 1. 布局架构

```
┌─────────────────────────────────────────────────────────────┐
│                      顶部工具栏                              │
│  [学习集] [卡片] [复习] [智能] [搜索] [词库] [记忆] [导图] [设置] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────┐    ┌─────────────────────────────┐  │
│  │                   │    │                             │  │
│  │                   │    │      思维导图区域            │  │
│  │   PDF 阅读器       │    │  (FreeCanvasViewer)         │  │
│  │  (PDFViewer)      │    │  - 文本卡片节点             │  │
│  │                   │    │  - 图片卡片节点             │  │
│  │                   │    │  - 分组容器节点             │  │
│  │                   │    │  - 连线关系                 │  │
│  │                   │    │  - 拖拽/缩放/旋转           │  │
│  │                   │    │  - 合并/拆分操作            │  │
│  └───────────────────┘    └─────────────────────────────┘  │
│         ▲                       ▲                          │
│         └───────────┬───────────┘                          │
│                     │                                      │
│              可调节分隔条 (拖拽调节宽度)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 实时同步流程

**标注创建 → 思维导图**：
```
1. 用户在 PDF 选中文本
2. 点击「创建标注」按钮
3. createAnnotationFromSelection() 执行
4. 触发 window.dispatchEvent('annotation-created')
5. FreeCanvasViewer 监听事件
6. realtimeSyncService.handleAnnotationCreated()
7. 自动创建导图节点
8. 建立双向关联 (nodeId ↔ annotationId)
```

**双向跳转**：
```
导图节点点击 → PDF 跳转:
1. 用户点击导图节点
2. 获取 node.data.annotationId
3. 触发 'focus-annotation' 事件
4. PDFViewer.scrollToAnnotation(id)
5. PDF 跳转到对应页码并高亮

PDF 标注点击 → 导图定位:
1. 用户点击 PDF 标注
2. 触发 'annotation-clicked' 事件
3. FreeCanvasViewer 查找关联节点
4. focusNode(id)
5. 导图居中显示并高亮
```

#### 3. 配置选项

```typescript
interface MindMapLayoutConfig {
  // 布局配置
  defaultViewMode: 'split' | 'list' | 'mindmap';
  mindmapDefaultWidth: number;  // 默认 400px
  mindmapMinWidth: number;      // 最小 300px
  mindmapMaxWidth: number;      // 最大 600px
  
  // 同步配置
  enableAutoSync: boolean;      // 默认 true
  syncDelay: number;            // 默认 500ms
  autoCreateNode: boolean;      // 默认 true
  highlightOnSelect: boolean;   // 默认 true
  syncColorMapping: boolean;    // 默认 true
  batchSize: number;            // 默认 10
  
  // 显示选项
  showSyncButton: boolean;
  showClearButton: boolean;
  showSettingsButton: boolean;
}
```

#### 4. 样式设计

```scss
.panel-body {
  &.mindmap {
    flex-direction: row;
    
    .pdf-area {
      flex: 1;
      min-width: 0;
    }
    
    .mindmap-area {
      flex-shrink: 0;
      min-width: 300px;
      max-width: 600px;
      border-left: 1px solid var(--b3-border-color);
      background: var(--b3-theme-surface);
    }
  }
}

// 分隔条样式
.resize-handle {
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background 0.2s;
  
  &:hover {
    background: var(--b3-theme-primary-light);
  }
  
  .resize-line {
    width: 2px;
    height: 24px;
    background: var(--b3-border-color);
    border-radius: 1px;
  }
}
```

---

### v1.2.32 - 默认左 PDF 右思维导图布局 ✅ 已完成

**需求描述**：将 mindmap 视图模式改为默认左 PDF 右思维导图的分栏布局，类似 MarginNote 的学习模式。

**完成时间**：2026-03-01 16:03:00

#### 已完成内容

1. **App.vue 布局修改** ✅
   - 添加 `mindmapWidth` 状态变量 (默认 400px)
   - 修改主体区域模板，将 `mindmap` 模式改为左 PDF 右思维导图布局
   - 集成 `PdfMindMapSidebar` 组件
   - 添加相关事件处理方法：
     - `handleMindMapWidthUpdate` - 处理思维导图宽度更新
     - `handleMindMapNodeClick` - 处理思维导图节点点击
     - `handleMindMapAnnotationClick` - 处理思维导图标注点击
     - `handleResizeStart/Move/Stop` - 处理分隔条拖拽调节

2. **样式设计** ✅
   - 添加 `.mindmap-area` 样式类
   - 支持分隔条拖拽调节宽度 (280px-600px)
   - 适配深浅色主题

3. **视图模式说明**
   | 模式 | 布局 | 说明 |
   |------|------|------|
   | `split` | 左 PDF + 右标注列表 | 传统标注管理模式 |
   | `list` | 仅标注列表 | 专注标注管理 |
   | `mindmap` | 左 PDF + 右思维导图 | MarginNote 风格学习模式 ✅ |

#### 设计文档

##### 1. 需求分析

**当前问题**：
- 当前 App.vue 默认布局是「左侧 PDF + 右侧标注列表」
- 「联动」按钮打开的是覆盖层弹窗，不是默认布局
- 用户希望打开 PDF 就自动显示左 PDF 右思维导图的结构

**设计目标**：
- 保留现有的 split/list/mindmap 三种 viewMode
- 将 `mindmap` 模式改为「左侧 PDF + 右侧思维导图」的默认分栏布局
- PDF 摘录后实时同步到右侧思维导图

##### 2. 布局架构

```
┌─────────────────────────────────────────────────────────────┐
│                      顶部工具栏                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────┐    ┌─────────────────────────────┐  │
│  │                   │    │                             │  │
│  │                   │    │      思维导图区域            │  │
│  │   PDF 阅读器       │    │  (PdfMindMapSidebar)        │  │
│  │  (PDFViewer)      │    │  - FreeCanvasViewer         │  │
│  │                   │    │  - 自动同步摘录              │  │
│  │                   │    │  - 节点卡片展示              │  │
│  │                   │    │  - 双向跳转定位              │  │
│  └───────────────────┘    └─────────────────────────────┘  │
│         ▲                       ▲                          │
│         └───────────┬───────────┘                          │
│                     │                                      │
│              可调节分隔条 (拖拽调节宽度)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

##### 3. 视图模式说明

| 模式 | 布局 | 说明 |
|------|------|------|
| `split` | 左 PDF + 右标注列表 | 传统标注管理模式 |
| `list` | 仅标注列表 | 专注标注管理 |
| `mindmap` | 左 PDF + 右思维导图 | **MarginNote 风格学习模式** (新增) |

##### 4. 组件修改方案

**App.vue 修改**：
```vue
<!-- 主体区域 -->
<div class="panel-body" :class="viewMode">
  <!-- PDF 区域 - 在 split 和 mindmap 模式下显示 -->
  <div class="pdf-area" v-if="currentPdf && viewMode !== 'list'">
    <PDFViewer ... />
  </div>

  <!-- 可调节分隔条 -->
  <div v-if="viewMode !== 'list'" class="resize-handle" @mousedown="startResize">
    <div class="resize-line"></div>
  </div>

  <!-- 右侧区域 -->
  <!-- 标注列表模式 -->
  <div v-if="viewMode === 'split'" class="annotation-area">
    <AnnotationList ... />
  </div>
  
  <!-- 思维导图模式 -->
  <div v-else-if="viewMode === 'mindmap'" class="mindmap-area">
    <PdfMindMapSidebar
      :pdf-doc-id="currentPdf?.path || ''"
      :study-set-id="currentLearningSet?.id || ''"
      :annotations="annotations"
    />
  </div>
</div>
```

**新增状态变量**：
```typescript
const mindmapWidth = ref(400); // 默认 400px
const mindmapMinWidth = 300;
const mindmapMaxWidth = 600;
```

**视图切换逻辑优化**：
```typescript
const toggleView = () => {
  if (viewMode.value === 'split') {
    viewMode.value = 'list';
  } else if (viewMode.value === 'list') {
    viewMode.value = 'mindmap';
  } else {
    viewMode.value = 'split';
  }
};
```

##### 5. 实时同步流程

**标注创建 → 思维导图**：
```
1. 用户在 PDF 选中文本
2. 点击「创建标注」按钮
3. createAnnotationFromSelection() 执行
4. 触发 window.dispatchEvent('annotation-created')
5. PdfMindMapSidebar 监听事件
6. realtimeSyncService.handleAnnotationCreated()
7. 自动创建导图节点
8. 建立双向关联 (nodeId ↔ annotationId)
```

**双向跳转**：
```
导图节点点击 → PDF 跳转:
1. 用户点击导图节点
2. 获取 node.data.annotationId
3. 触发 'focus-annotation' 事件
4. PDFViewer.scrollToAnnotation(id)
5. PDF 跳转到对应页码并高亮

PDF 标注点击 → 导图定位:
1. 用户点击 PDF 标注
2. 触发 'annotation-clicked' 事件
3. PdfMindMapSidebar 查找关联节点
4. FreeCanvasViewer.focusNode(id)
5. 导图居中显示并高亮
```

##### 6. 配置选项

```typescript
interface MindMapLayoutConfig {
  // 布局配置
  defaultViewMode: 'split' | 'list' | 'mindmap';
  mindmapDefaultWidth: number;  // 默认 400px
  mindmapMinWidth: number;      // 最小 300px
  mindmapMaxWidth: number;      // 最大 600px
  
  // 同步配置
  enableAutoSync: boolean;      // 默认 true
  syncDelay: number;            // 默认 500ms
  
  // 显示选项
  showSyncButton: boolean;
  showClearButton: boolean;
  showSettingsButton: boolean;
}
```

##### 7. 样式设计

```scss
.panel-body {
  &.mindmap {
    flex-direction: row;
    
    .pdf-area {
      flex: 1;
      min-width: 0;
    }
    
    .mindmap-area {
      flex-shrink: 0;
      min-width: 300px;
      max-width: 600px;
      border-left: 1px solid var(--b3-border-color);
      background: var(--b3-theme-surface);
    }
  }
}

.mindmap-area {
  display: flex;
  flex-direction: column;
  
  .mindmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--b3-border-color);
    background: var(--b3-theme-background);
  }
}

// 分隔条样式
.resize-handle {
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background 0.2s;
  
  &:hover {
    background: var(--b3-theme-primary-light);
  }
  
  .resize-line {
    width: 2px;
    height: 24px;
    background: var(--b3-border-color);
    border-radius: 1px;
  }
}
```

##### 8. 实施步骤

1. [x] 修改 App.vue - 调整主体区域布局逻辑 ✅
2. [x] 集成 PdfMindMapSidebar - 在 mindmap 模式下渲染 ✅
3. [x] 优化分隔条 - 支持调节思维导图宽度 ✅
4. [x] 完善同步逻辑 - 确保标注创建后实时同步 ✅
5. [x] 测试双向跳转 - PDF↔思维导图定位 ✅
6. [x] 更新文档 - 更新 TODO_PDF.md 和 CHANGELOG ✅

---

### 低优先级
- [ ] ePub 支持
- [ ] PDF 全文翻译
- [ ] PDF 批注导出

---

### v1.2.35 - 2026-03-01 17:40:00
- 思维导图模式布局完善
- 思维导图块 ID 自动初始化
- 左 PDF 右思维导图布局优化

### v1.2.34 - 2026-03-01 17:15:00
- 思维导图空值错误修复

### v1.2.33 - 2026-03-01 17:00:00
- MarginNote4 风格左右分屏布局

### v1.2.32 - 2026-03-01 16:09:00
- 修复思维导图空值错误和块 ID 问题

### v1.2.31 - 2026-03-01 16:03:00
- 默认左 PDF 右思维导图布局

### v1.2.30 - 2026-03-01 15:10:00
- PDF 与思维导图实时联动（摘录自动同步）

### v1.2.29 - 2026-03-01 14:30:00
- PDF 嵌入式思维导图侧边栏

### v1.2.26 - 2026-03-01 13:15:00
- PDF 联动增强完成
- 实时高亮同步、拖拽创建节点完成

### v1.2.24 - 2026-03-01 11:57:00
- PDF+ 思维导图联动视图完成

### v1.2.16 - 2026-03-01
- 多 PDF 标签页管理完成

### v1.2.13 - 2026-02-28
- PDF 摘录回源跳转完成

### v1.2.11 及之前
- PDF 阅读器基础功能完成
- PDF.js 深度集成完成

---

## 📊 功能统计

| 功能类别 | 完成数 | 总数 | 完成度 |
|----------|--------|------|--------|
| 核心功能 | 17/17 | 17 | 100% |
| 标签页管理 | 5/5 | 5 | 100% |
| 摘录跳转 | 5/5 | 5 | 100% |
| PDF 联动 | 8/8 | 8 | 100% |
| 组件 | 11/11 | 11 | 100% |
| 服务 | 5/5 | 5 | 100% |
| 状态管理 | 1/1 | 1 | 100% |
