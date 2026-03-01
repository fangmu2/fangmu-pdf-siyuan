# 变更日志 (CHANGELOG)

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.2.35] - 2026-03-01 17:40:00

### Added - 新增功能

#### 思维导图模式布局完善

**新增思维导图块 ID 自动初始化功能**：
- 问题：切换到思维导图模式时，需要手动创建思维导图块
- 解决：在 App.vue onMounted 生命周期中自动初始化思维导图块 ID
- 实现：`initMindMapBlockId` 函数自动检查并创建思维导图块

**功能特性**：
- 自动检测学习集关联的思维导图块
- 若不存在则自动创建新的思维导图块
- 使用 localStorage 持久化块 ID 映射关系
- 支持多学习集独立思维导图

**修改文件**：
- `src/App.vue` (修改)
  - 新增 `initMindMapBlockId` 函数
  - 在 `onMounted` 中调用初始化
  - 修复 `handleMindMapAnnotationClick` 未使用警告

**技术实现**：
```typescript
const initMindMapBlockId = async () => {
  if (!currentLearningSet.value?.id) return;
  
  const key = `mindmap_block_${currentLearningSet.value.id}`;
  let blockId = localStorage.getItem(key);
  
  if (!blockId) {
    // 创建新的思维导图块
    const response = await fetch('/api/createBlock', { ... });
    const result = await response.json();
    if (result.code === 0) {
      blockId = result.data.doOperations[0].id;
      localStorage.setItem(key, blockId);
    }
  }
  
  if (blockId) {
    mindMapBlockId.value = blockId;
  }
};
```

**布局架构**：
| 模式 | 布局 | 说明 |
|------|------|------|
| `split` | 左 PDF + 右标注列表 | 传统标注管理 |
| `list` | 仅标注列表 | 专注标注管理 |
| `mindmap` | 左 PDF + 右思维导图 | **MarginNote 学习模式** ✅ |

---

## [1.2.34] - 2026-03-01 17:15:00

### Fixed - 修复问题

#### 思维导图空值错误修复

- **修复 saveMindMapToBlock 的 invalid ID argument 错误**
  - 问题：`setBlockAttrs` 接收无效块 ID 导致 API 报错
  - 解决：添加 `isValidBlockId` 验证函数，确保块 ID 符合思源规范

- **修复 detectNodeClusters 的 nodes is not iterable 错误**
  - 问题：当 `nodes` 为 `null` 或 `undefined` 时，`for...of` 循环报错
  - 解决：添加空值防护检查

- **修复 loadCrossLinks 的 undefined value 错误**
  - 问题：`getBlockAttrs` 返回 `undefined` 导致后续处理失败
  - 解决：添加返回值检查

**修改文件**：
- `src/services/mindmapLinkEnhanceService.ts`
- `rules/todo/TODO_MINDMAP.md`

---

## [1.2.33] - 2026-03-01 17:00:00

### Added - 新增功能

#### MarginNote4 风格 UI 优化

**卡片样式优化** ✅：
- 圆角设计（12px）
- 柔和阴影效果
- 悬停/选中状态增强
- 卡片头部渐变色设计
- 页码标签样式优化

**动画效果增强** ✅：
- 卡片创建/删除动画（cardAppear / cardDisappear）
- 连线动画（linkFlow / linkAppear）
- 连接点动画（handleBreathe）
- 工具栏动画（toolbarSlideIn）

**快捷工具栏** ✅：
- FloatingToolbar 组件
- 节点添加（文字卡片 N / 图片卡片 I / 分组 G）
- 视图控制（自动布局 / 适应视图）
- 布局选择（自由 / 树状 / 垂直 / 水平）
- 设置（显示网格 / 自动同步）

**卡片合并/拆分 UI** ✅：
- 右键菜单添加合并/拆分选项
- 快捷键支持（Ctrl+M 合并，Ctrl+S 拆分，Ctrl+Shift+M 多选合并）
- 提取子节点功能（Ctrl+E）

**快捷键系统** ✅：
- useKeyboardShortcuts 组合式函数
- 25+ 默认快捷键配置
- 防冲突机制（输入框中不触发）

**修改文件**：
- `src/components/MindMapFreeCanvas/TextCardNode.vue`
- `src/components/MindMapFreeCanvas/ImageCardNode.vue`
- `src/components/MindMapFreeCanvas/GroupNode.vue`
- `src/components/MindMapFreeCanvas/FloatingToolbar.vue`
- `src/components/MindMapFreeCanvas/NodeContextMenu.vue`
- `src/composables/useKeyboardShortcuts.ts`
- `src/components/MindMapFreeCanvas/MarginNoteAnimations.scss`

---

## [1.2.32] - 2026-03-01 16:09:00

### Fixed - 修复问题

#### 思维导图空值错误和块 ID 问题修复

- 修复：PdfMindMapSidebar.vue 中节点数量计算的空值错误
- 修复：思维导图保存时块 ID 无效的问题
- 新增：getOrCreateMindMapBlockId 函数自动创建/获取有效块 ID
- 新增：isValidBlockId 验证函数

**修改文件**：
- `src/components/PdfMindMapSidebar.vue`
- `src/services/freeMindMapService.ts`

---

## [1.2.31] - 2026-03-01 16:03:00

### Added - 新增功能

#### 默认左 PDF 右思维导图布局

**App.vue 布局修改** ✅：
- 添加 `mindmapWidth` 状态变量 (默认 400px)
- 修改主体区域模板，将 `mindmap` 模式改为左 PDF 右思维导图布局
- 集成 `PdfMindMapSidebar` 组件
- 添加相关事件处理方法

**视图模式说明**：
| 模式 | 布局 | 说明 |
|------|------|------|
| `split` | 左 PDF + 右标注列表 | 传统标注管理模式 |
| `list` | 仅标注列表 | 专注标注管理 |
| `mindmap` | 左 PDF + 右思维导图 | MarginNote 风格学习模式 ✅ |

**修改文件**：
- `src/App.vue`

---

## [1.2.30] - 2026-03-01 15:10:00

### Fixed - 修复问题

#### 思维导图视图模式修复

**修复"导图"和"联动"按钮功能混淆问题**：
- 问题：点击"导图"按钮和"联动"按钮都打开同一个弹窗界面
- 解决：修改"导图"按钮行为，切换到主界面的思维导图模式（左 PDF 右思维导图布局）
- "联动"按钮保持打开独立弹窗视图

**修改内容**：
- `toggleMindMapView` 函数：从打开弹窗改为切换 `viewMode` 为 `'mindmap'`
- 主界面 `mindmap` 模式：直接显示 `PdfMindMapSidebar` 组件
- 修复 `isResizing` 变量未定义的类型错误

**修改文件**：
- `src/App.vue` (修改)

---

## [1.2.29] - 2026-03-01 17:20:00

### Fixed - 修复问题

#### 思维导图链接图谱增强服务错误修复

- **修复 saveMindMapToBlock 的 invalid ID argument 错误**
  - 问题：`setBlockAttrs` 接收无效块 ID 导致 API 报错
  - 解决：添加 `isValidBlockId` 验证函数，确保块 ID 符合思源规范（22 位，格式 `\d{14}-[a-z0-9]{7}`）

- **修复 detectNodeClusters 的 nodes is not iterable 错误**
  - 问题：当 `nodes` 为 `null` 或 `undefined` 时，`for...of` 循环报错
  - 解决：添加空值防护检查，确保 `nodes` 是有效数组后才进行迭代

- **修复 loadCrossLinks 的 undefined value 错误**
  - 问题：`getBlockAttrs` 返回 `undefined` 导致后续处理失败
  - 解决：添加返回值检查，使用 `Array.isArray` 验证解析结果

- **修复 TS 类型错误**
  - 问题：使用 `updateBlock` 函数签名不匹配
  - 解决：改用正确的 `getBlockAttrs` 和 `setBlockAttrs` API

**修改文件**：
- `src/services/mindmapLinkEnhanceService.ts` (重写)
- `rules/todo/TODO_MINDMAP.md` (更新版本记录)

---

## [1.2.28] - 2026-03-01 14:05:00

### Added - 新增功能

#### PDF 嵌入式思维导图侧边栏（MarginNote 风格）- 阶段一：基础架构

**目标**：在原有 PDF 阅读器基础上，做摘录时右侧实时显示卡片式思维导图，实现真正的 MarginNote 无缝体验。

**新增组件**：

1. **PdfMindMapSidebar.vue** (`src/components/PdfMindMapSidebar.vue`)
   - 可折叠的右侧思维导图侧边栏容器
   - 支持宽度拖拽调节（300px ~ 600px）
   - 展开/折叠动画效果
   - 集成 FreeCanvasViewer 画布组件
   - Props:
     - `pdfDocId`: string - PDF 文档 ID
     - `visible`: boolean - 是否可见（支持 v-model）
     - `width`: number - 侧边栏宽度（支持 v-model）
   - Emits:
     - `update:visible`: 可见性变化
     - `update:width`: 宽度变化
     - `node-click`: 节点点击事件
     - `sync-request`: 同步请求事件

2. **usePdfMindMapSidebar.ts** (`src/composables/usePdfMindMapSidebar.ts`)
   - 管理侧边栏状态的组合式函数
   - 提供响应式状态和方法
   - 与 freeMindMapStore 集成

**修改组件**：

3. **PDFViewer.vue** (`src/components/PDFViewer.vue`)
   - 导入 PdfMindMapSidebar 组件
   - 添加思维导图侧边栏状态和引用
   - 预留侧边栏切换按钮位置（工具栏）
   - 添加 `handleMindMapNodeClick` 方法处理节点点击
   - 添加 `handleMindMapSyncRequest` 方法处理同步请求

**技术要点**：

- **复用现有基础设施**：
  - `freeMindMapStore` - 状态管理
  - `FreeCanvasViewer` - 画布组件
  - Vue Flow - 画布引擎

- **响应式适配**：
  - 侧边栏宽度范围：300px ~ 600px
  - 默认宽度：350px
  - 思源主题样式适配

**开发计划进度**：

- [x] 阶段一：基础架构 (v1.2.28) ✅ 已完成
  - [x] 创建 PdfMindMapSidebar.vue
  - [x] 创建 usePdfMindMapSidebar.ts
  - [x] 修改 PDFViewer.vue 集成侧边栏
- [ ] 阶段二：摘录联动 (v1.2.29)
- [ ] 阶段三：卡片交互 (v1.2.30)
- [ ] 阶段四：优化完善 (v1.2.31)

**相关文件**：
- `src/components/PdfMindMapSidebar.vue` (新增)
- `src/composables/usePdfMindMapSidebar.ts` (新增)
- `src/components/PDFViewer.vue` (修改)

---

## [1.2.27] - 2026-03-01 13:33:00

### Added - 新增功能

#### MarginNote 4 风格思维导图升级 - 第 7 期：节点搜索与过滤

1. **MindMapSearch.vue** - 思维导图节点搜索组件
   - 搜索输入框（带防抖）
   - 搜索选项（区分大小写、全字匹配、正则表达式）
   - 搜索字段选择（标题、内容、备注、标签）
   - 搜索结果列表（显示匹配节点、页码、高亮文本）
   - 上一个/下一个匹配项导航

2. **NodeFilterPanel.vue** - 节点过滤面板组件
   - 5 种过滤类型（标签、页码、颜色、状态、标注）
   - 多条件组合过滤
   - 过滤统计显示

3. **类型定义** (`types/mindMapSearch.ts`)
   - MindMapSearchQuery, MindMapSearchOptions, MindMapSearchResult
   - MindMapFilter, FilterCondition, FilterOperator, FilterFieldType

4. **搜索服务** (`services/mindMapSearchService.ts`)
   - searchNodes, executeSearch, highlightText
   - filterNodes, getFilteredNodes, clearFilter

5. **组合式函数** (`composables/useMindMapSearch.ts`)
   - useMindMapSearch - 搜索和过滤组合式 API

**组件集成**：
- FreeCanvasViewer.vue - 集成 MindMapSearch 和 NodeFilterPanel
- CanvasToolbar.vue - 新增搜索/过滤按钮
- 更新组件导出 (src/components/MindMapFreeCanvas/index.ts)
- 更新 i18n 翻译 (src/i18n/zh_CN.json)

**修改文件**：
- src/types/mindMapSearch.ts (新增)
- src/services/mindMapSearchService.ts (新增)
- src/composables/useMindMapSearch.ts (新增)
- src/components/MindMapFreeCanvas/MindMapSearch.vue (新增)
- src/components/MindMapFreeCanvas/NodeFilterPanel.vue (新增)
- src/components/MindMapFreeCanvas/FreeCanvasViewer.vue
- src/components/MindMapFreeCanvas/CanvasToolbar.vue
- src/components/MindMapFreeCanvas/index.ts
- src/i18n/zh_CN.json

---

## [1.2.26] - 2026-03-01 13:15:00

### Added - 新增功能

#### MarginNote 4 风格思维导图升级 - 第 3 期 & 第 4 期完成

**第 3 期：链接图谱增强**
- 新增 LinksGraphPanel.vue - 跨分支关联/远程知识/布局建议三合一面板
- 支持 5 种关联类型（relation/seeAlso/contrast/cause/example）
- 支持跨画布、跨学习集的远程知识联系
- 一键跳转功能（视图定位 + 节点高亮）

**第 4 期：PDF 联动增强**
- 新增 PdfLinkageSettings.vue - 配置/高亮/颜色映射/布局建议四合一面板
- 实时高亮同步 - PDF 标注与导图节点实时同步
- 拖拽创建节点 - 从 PDF 拖拽文本到画布创建节点
- 智能布局建议 - 根据内容自动推荐布局（4 种类型）
- 标注颜色映射 - PDF 标注颜色自动映射到导图节点

**组件集成**
- FreeCanvasViewer.vue - 修复 TS 错误，集成虚线连线显示
- PdfMindMapLinkViewer.vue - 集成 LinksGraphPanel 和 PdfLinkageSettings 面板
- 更新组件导出 (src/components/MindMapFreeCanvas/index.ts)

**修改文件**：
- src/components/MindMapFreeCanvas/FreeCanvasViewer.vue
- src/components/MindMapFreeCanvas/LinksGraphPanel.vue (新增)
- src/components/MindMapFreeCanvas/PdfLinkageSettings.vue (新增)
- src/components/MindMapFreeCanvas/index.ts
- src/components/PdfMindMapLinkViewer.vue
- src/composables/usePdfMindMapLinkage.ts
- src/services/pdfMindMapLinkageService.ts
- src/types/mindmapFree.ts (新增 CrossBranchLink, RemoteKnowledgeLink 等类型)

---

## [1.2.25] - 2026-03-01 13:00:00

### Added - 新增功能

- 完成 usePdfMindMapLinkage.ts - PDF 联动组合式函数
- 完成 pdfMindMapLinkageService.ts - PDF 联动服务层
- 完成 useMindMapLinkEnhance.ts - 链接图谱增强组合式函数
- 完成 mindmapLinkEnhanceService.ts - 链接图谱增强服务层
- 更新 types/mindmapFree.ts - 新增跨分支关联和远程知识联系类型

---

## [1.2.24] - 2026-03-01 11:57:00

### Added - 新增功能

#### PDF+ 思维导图联动视图（MarginNote 风格核心功能）

- 新增 PdfMindMapLinkViewer.vue - 左右分栏布局（PDF+ 自由画布思维导图）
- 可调节分隔条 - 支持拖拽调整左右比例（30%-70%）
- 自动同步功能 - PDF 标注创建后自动添加到思维导图
- 标注列表面板 - 显示所有标注，支持点击高亮、跳转到 PDF 位置
- 双向跳转 - 导图节点↔PDF 位置精确跳转
- 工具栏功能 - 自动同步开关、立即同步、全屏、标注列表显示/隐藏、清空导图
- PDFViewer 增强 - 新增 scrollToAnnotation 方法和 annotation-created 事件

---

## [1.2.23] - 2026-03-01 11:43:00

### Added - 新增功能

#### 自由画布思维导图数据集成完成

- 完成 freeMindMapDataIntegrationService.ts - 与标注数据集成
- 完成 freeMindMapVersionService.ts - 版本历史支持
- 完成思源块属性持久化 (saveMindMapToBlock / loadMindMapFromBlock)
- 自由画布思维导图功能 100% 完成

---

## [1.2.22] - 2026-03-01

### Added - 新增功能

#### 自由画布思维导图交互功能完成

- 完成 NodeContextMenu.vue - 右键菜单
- 完成 CanvasToolbar.vue - 画布工具栏
- 完成键盘快捷键支持
- 完成多选框选功能

---

## [1.2.21] - 2026-03-01

### Added - 新增功能

#### 自由画布思维导图卡片节点完成

- 完成 ImageCardNode.vue - 图片/PDF 摘录卡片节点
- 完成 GroupNode.vue - 分组容器节点
- 完成 NodeEditDialog.vue - 节点编辑对话框

---

## [1.2.20] - 2026-03-01

### Added - 新增功能

#### 自由画布思维导图基础框架完成

- 安装 Vue Flow 依赖
- 完成 FreeCanvasViewer.vue - 基础画布组件
- 完成 TextCardNode.vue - 文本卡片节点
- 完成 freeMindMapStore.ts - 状态管理
- 完成 freeMindMapService.ts - 服务层
- 完成 useFreeMindMap.ts - 组合式函数
- 完成 types/mindmapFree.ts - 类型定义

---

## [1.2.19] - 2026-03-01 10:52:00

### Fixed - 修复问题

- **修复 PDF 摘录后思维导图不显示问题**
  - 问题：思维导图查看器显示空白，无法渲染标注内容
  - 原因：`buildAnnotationTreeWithContent` 函数混用 Markdown 标题和列表语法
  - 解决：统一使用列表语法（`- `），通过缩进表示层级关系
  - 修改文件：`src/utils/mindmapGenerator.ts`

---

## [1.2.18] - 2026-03-01

### Fixed - 修复问题

- 修复 markmap v0.18 API 变更导致的初始化错误
- 优化思维导图内容生成逻辑（MarginNote4 风格）
- 添加调试日志系统

---

## [1.2.17] - 2026-03-01

### Added - 新增功能

#### 脑图高级功能完成

- 新增脑图版本历史服务 (mindmapVersionService)
- 新增脑图导出服务 (mindmapExportService) - SVG/PNG/PDF/Markdown/OPML/JSON
- 新增脑图性能优化服务 (mindmapPerformanceService) - 虚拟渲染、分批渲染
- 新增版本历史组件 (MindMapVersionHistory.vue)
- 新增变更对比组件 (MindMapDiffPanel.vue)

### Fixed - 修复问题

- 修复导图按钮点击没反应的问题 - 使用 showMessage 替代 alert

---

## [1.2.16] - 2026-03-01

### Changed - 变更

- 更新 TODO.md 完成度统计，修正功能状态标记
- 模块 8（搜索与导航）完成度从 85% 提升到 95%
- PDF 阅读器完成度从 90% 提升到 95%
- 整体完成度从 85% 提升到 90%
- 确认以下功能已完成：标签云、搜索历史、面包屑导航、PDF 标签页管理、PDF 摘录服务

---

## [1.2.15] - 2026-02-28

### Fixed - 修复问题

- 修复 sql2 is not a function 错误 - 添加 sqlQuery 函数并支持参数化查询
- 修复 useSiyuan.ts 导入路径错误
- 修复无限递归问题 - updateBlock 函数调用自身
- 新增 siyuanApi.ts 兼容函数（sql, getBlock, createBlock, updateBlock, deleteBlock）

---

## [1.2.14] - 2026-02-28

### Added - 新增功能

- 新增搜索类型定义 (types/search.ts)
- 新增搜索历史服务 (services/searchHistoryService.ts)
- 新增标签云服务 (services/tagCloudService.ts)
- 新增全局搜索服务 (services/globalSearchService.ts)
- 新增标签云组件 (components/TagCloud.vue)
- 新增搜索历史组件 (components/SearchHistory.vue)
- 新增面包屑导航组件 (components/Breadcrumb.vue)
- 更新 SearchPanel 组件，集成搜索历史和全局搜索功能
- 更新 utils/index.ts，添加 generateUUID 工具函数
- 更新组件导出 (components/index.ts)

---

## [1.2.13] - 2026-02-28

### Added - 新增功能

- 新增 PDF 摘录坐标存储服务 (pdfExcerptService)
- 新增 PDF 坐标类型定义 (pdfExcerpt.ts)
- CardList 组件添加"定位"按钮，支持跳转到 PDF 源位置
- AnnotationList 组件集成 PDF 跳转功能（双击跳转）
- PDFViewer 支持跳转高亮事件监听

---

## [1.2.12] - 2026-02-28

### Added - 新增功能

- 完成单元测试框架（94+ 测试用例）
- 完成国际化支持
- 完成错误处理系统
- 完成性能优化工具

---

## [1.2.11] 及之前

### Added - 新增功能

- 学习集管理系统
- 卡片系统
- 脑图功能（5 种布局）
- 复习系统（SM-2/FSRS）
- AI 助手
- 卡片盒看板（3 种视图）
- PDF 阅读器（PDF.js 集成）
- 搜索功能（全文搜索）
