# 自由画布思维导图更新日志

## [1.2.31] - 2026-03-01 15:37:00 ✅ 已完成

### Added
- **标注创建事件触发机制** ✅
  - **App.vue 集成**:
    - 在 `createAnnotationFromSelection` 方法中触发 `annotation-created` 自定义事件
    - 使用 `window.dispatchEvent` 广播标注创建事件
    - 传递完整的标注数据（annotation）给监听者
    - 支持 PdfMindMapSidebar 等组件的实时同步
  - **PdfMindMapSidebar 监听**:
    - 通过 `window.addEventListener` 注册 `annotation-created` 事件监听器
    - 调用 `realtimeSync.handleAnnotationCreated(annotation)` 处理同步
    - 组件卸载时自动清理事件监听
  - **类型定义补充** (`src/types/pdfMindMapSidebar.ts`):
    - `RealtimeSyncConfig` - 实时同步配置接口
    - `AnnotationNodeMapping` - 标注与节点映射关系
    - `SyncQueueItem` - 同步队列项（timestamp 设为可选）
    - `CoordinateTransformResult` - 坐标转换结果
    - `UseRealtimeSyncOptions` - useRealtimeSync 选项
    - `UseRealtimeSyncReturn` - useRealtimeSync 返回值

### Fixed
- **realtimeSyncService.ts 类型错误修复**:
  - 移除未使用的 `MindMapEdge` 导入
  - 修复 `imageUrl` → `imagePath` 属性名不匹配
  - 修复 `importMappings` 方法中响应式赋值问题
  - 标记未使用参数 `_canvasWidth`

### Technical
- **修改文件**:
  - `src/App.vue` - 添加标注创建事件触发逻辑
  - `src/components/PdfMindMapSidebar.vue` - 添加事件监听和处理
  - `src/types/pdfMindMapSidebar.ts` - 补充实时同步相关类型定义
  - `src/services/realtimeSyncService.ts` - 修复类型错误

---

## [1.2.30] - 2026-03-01 15:10:00

### Added
- **PDF 与思维导图实时同步功能** ✅
  - **新增类型定义** (`src/types/pdfMindMapSidebar.ts`):
    - `RealtimeSyncConfig` - 实时同步配置接口（自动同步、延迟、高亮等）
    - `AnnotationToNodeMapping` - 标注到节点映射接口
    - `SyncStatus` - 同步状态枚举（idle/syncing/completed/error）
    - `SyncOperation` - 同步操作类型枚举（create/update/delete）
    - `SyncEventType` - 同步事件类型枚举（annotationCreated/nodeCreated/nodeSelected 等）
    - `SyncEventPayload` - 同步事件负载接口
    - `RealtimeSyncState` - 实时同步状态接口
  - **新增实时同步服务** (`src/services/realtimeSyncService.ts`):
    - `createSyncManager` - 创建同步管理器实例
    - `mapAnnotationToNode` - 将 PDF 标注映射为思维导图节点
    - `syncAnnotationsToNodes` - 批量同步标注到节点
    - `findNodeByAnnotationId` - 根据标注 ID 查找对应节点
    - `createAnnotationNodeMapping` - 创建标注-节点映射关系
    - `removeAnnotationNodeMapping` - 移除映射关系
    - `getAllMappings` - 获取所有映射关系
    - `emitSyncEvent` / `onSyncEvent` / `offSyncEvent` - 同步事件系统
    - `highlightNode` / `unhighlightNode` - 节点高亮控制
  - **新增实时同步组合式函数** (`src/composables/useRealtimeSync.ts`):
    - `useRealtimeSync` - 提供实时同步功能的 Vue 3 组合式 API
    - 响应式状态管理（isSyncing, lastSyncTime, pendingCount, syncStatus）
    - 自动同步控制（startAutoSync, stopAutoSync）
    - 手动同步（syncNow）
    - 单条标注同步（syncAnnotation）
    - 批量同步（syncAnnotations）
    - 双向高亮（highlightPdfAnnotation, highlightMindMapNode）
    - 事件监听自动管理
  - **更新侧边栏组件** (`src/components/PdfMindMapSidebar.vue`):
    - 集成 useRealtimeSync 组合式函数
    - 修复 TypeScript 类型错误（使用正确的 Store 方法）
    - 优化节点创建逻辑（使用 createNode 替代 addNode）
    - 改进自动同步开关交互

### Features Detail

#### 实时同步功能
| 功能 | 说明 |
|------|------|
| 自动同步 | PDF 标注创建时自动添加到思维导图 |
| 手动同步 | 点击同步按钮立即同步所有标注 |
| 双向高亮 | PDF 标注和导图节点互相高亮 |
| 映射管理 | 维护标注与节点的对应关系 |
| 防抖处理 | 避免频繁同步导致的性能问题 |
| 状态反馈 | 显示同步状态和上次同步时间 |

#### 同步事件系统
| 事件类型 | 触发时机 | 说明 |
|----------|----------|------|
| annotationCreated | PDF 标注创建时 | 触发自动同步 |
| nodeCreated | 导图节点创建时 | 更新映射关系 |
| nodeSelected | 导图节点选中时 | 高亮对应 PDF 标注 |
| annotationSelected | PDF 标注选中时 | 高亮对应导图节点 |
| syncCompleted | 同步完成时 | 通知父组件 |
| syncError | 同步失败时 | 错误处理 |

### Technical
- **新增文件**:
  - `src/types/pdfMindMapSidebar.ts` - 侧边栏和实时同步类型定义
  - `src/services/realtimeSyncService.ts` - 实时同步服务层
  - `src/composables/useRealtimeSync.ts` - 实时同步组合式函数
- **修改文件**:
  - `src/components/PdfMindMapSidebar.vue` - 集成实时同步功能，修复 TS 错误

### Next Steps
- 在 PDFViewer 中集成实时同步事件触发
- 实现双向跳转功能（导图节点↔PDF 位置）
- 添加更多联动配置选项

---

## [1.2.29] - 2026-03-01 14:30:00

### Added
- **PDF 嵌入式思维导图侧边栏** ✅
  - **新增类型定义** (`src/types/pdfMindMapSidebar.ts`):
    - `PdfMindMapSidebarConfig` - 侧边栏配置接口（可见性、宽度、自动同步等）
    - `PdfMindMapSidebarProps` - 组件 Props 接口
    - `PdfMindMapSidebarEmits` - 组件事件接口
    - `AnnotationSyncMode` - 标注同步模式枚举（auto/manual/off）
    - `NodeClickData` - 节点点击数据接口
  - **侧边栏组件增强** (`src/components/PdfMindMapSidebar.vue`):
    - 可折叠/展开的右侧侧边栏
    - 可调节宽度（拖拽分隔条，200px-600px）
    - 集成 FreeCanvasViewer 自由画布思维导图
    - 自动同步功能开关
    - 立即同步按钮
    - 清空导图按钮
    - 思源主题适配
  - **PDFViewer 集成** (`src/components/PDFViewer.vue`):
    - 新增思维导图侧边栏切换按钮（🧠）
    - 工具栏按钮状态管理
    - 与其他侧边栏互斥逻辑
    - 思维导图节点点击跳转 PDF 位置
    - 思维导图同步请求处理

### Features Detail

#### 侧边栏功能
| 功能 | 说明 |
|------|------|
| 折叠/展开 | 点击按钮或拖拽分隔条 |
| 宽度调节 | 200px-600px 范围 |
| 自动同步 | PDF 标注创建时自动添加到导图 |
| 立即同步 | 手动触发同步当前所有标注 |
| 清空导图 | 一键清空所有节点和连线 |

#### 联动功能
| 功能 | 说明 |
|------|------|
| 双向跳转 | 导图节点↔PDF 位置精确跳转 |
| 实时高亮 | PDF 选中/标注时导图节点高亮 |
| 拖拽创建 | 从 PDF 拖拽文本到导图创建节点 |
| 颜色映射 | PDF 标注颜色同步到节点样式 |

### Technical
- **新增文件**:
  - `src/types/pdfMindMapSidebar.ts` - 侧边栏类型定义
- **修改文件**:
  - `src/components/PdfMindMapSidebar.vue` - 完善侧边栏功能
  - `src/components/PDFViewer.vue` - 集成侧边栏切换按钮
  - `rules/todo/TODO_PDF.md` - 更新任务进度

### Next Steps
- 实现摘录创建时的实时联动
- 优化导图节点与 PDF 标注的双向同步
- 添加更多联动配置选项

---

## [1.2.27] - 2026-03-01 13:33:00

### Added
- **MarginNote 4 风格思维导图升级 - 第 7 期：节点搜索与过滤** ✅

#### 类型定义
- **新增搜索类型定义** (`src/types/mindMapSearch.ts`):
  - `MindMapSearchQuery` - 搜索查询接口（查询文本、搜索字段、选项）
  - `MindMapSearchOptions` - 搜索选项接口（区分大小写、全字匹配、正则表达式）
  - `MindMapSearchResult` - 搜索结果接口（匹配节点、匹配位置、高亮文本）
  - `MindMapFilter` - 过滤器接口（标签、页码、颜色、状态、标注过滤）
  - `FilterCondition` - 过滤条件接口（字段、操作符、值）
  - `FilterOperator` - 过滤操作符类型（equals/notEquals/contains/in 等）
  - `FilterFieldType` - 过滤字段类型（tag/page/color/status/annotation）

#### 服务层
- **新增搜索服务** (`src/services/mindMapSearchService.ts`):
  - `searchNodes` - 搜索节点（支持标题、内容、备注、标签搜索）
  - `executeSearch` - 执行搜索（带防抖处理）
  - `highlightText` - 高亮匹配文本（支持正则）
  - `getHighlightedNodeIds` - 获取高亮节点 ID 列表
  - `clearHighlights` - 清除高亮
  - `filterNodes` - 过滤节点（支持多条件组合）
  - `getFilteredNodes` - 获取过滤后的节点
  - `clearFilter` - 清除过滤
  - `hasActiveFilters` - 检查是否有活动过滤器
  - `getSearchStats` - 获取搜索统计信息

#### 组合式函数
- **新增搜索组合式函数** (`src/composables/useMindMapSearch.ts`):
  - `useMindMapSearch` - 提供搜索和过滤功能的 Vue 3 组合式 API
  - 响应式搜索状态（searchQuery, searchOptions, searchResult, isSearching）
  - 响应式过滤状态（activeFilters, filteredNodes）
  - 响应式高亮状态（highlightedNodes）
  - 搜索面板控制（showSearchPanel）
  - 过滤面板控制（showFilterPanel）
  - 搜索操作（updateSearchQuery, executeSearch, clearSearch, goToPreviousMatch, goToNextMatch）
  - 过滤操作（applyFilter, clearFilter）
  - 高亮操作（highlightNode, clearHighlights）
  - 自动清理（dispose）

#### 组件
- **新增搜索组件** (`src/components/MindMapFreeCanvas/MindMapSearch.vue`):
  - 搜索输入框（带防抖）
  - 搜索选项切换（区分大小写、全字匹配、正则表达式）
  - 搜索字段选择（标题、内容、备注、标签）
  - 搜索结果列表（显示匹配节点、页码、高亮文本）
  - 上一个/下一个匹配项按钮
  - 清除搜索按钮
  - 搜索结果统计
  - 点击跳转节点功能
  - 思源主题适配

- **新增过滤面板组件** (`src/components/MindMapFreeCanvas/NodeFilterPanel.vue`):
  - 过滤条件列表（标签、页码、颜色、状态、标注）
  - 添加过滤条件按钮
  - 过滤条件编辑（字段、操作符、值）
  - 清除全部过滤按钮
  - 过滤统计（显示过滤后节点数）
  - 思源主题适配

#### 组件集成
- **FreeCanvasViewer 升级** (`src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`):
  - 集成 MindMapSearch 组件
  - 集成 NodeFilterPanel 组件
  - 使用 useMindMapSearch 组合式函数
  - 新增 showSearch/showFilter props
  - 新增 focusNode 方法（用于搜索跳转）
  - 新增 handleToolbarToggleSearch/handleToolbarToggleFilter 方法
  - postMessage 事件监听（支持外部高亮控制）
  - 节点统计显示搜索/过滤结果数

- **CanvasToolbar 升级** (`src/components/MindMapFreeCanvas/CanvasToolbar.vue`):
  - 新增 hasActiveSearch/hasActiveFilter props
  - 新增 toggle-search/toggle-filter 事件
  - 新增搜索按钮（🔍）
  - 新增过滤按钮（🎛️）
  - 搜索/过滤状态指示（active 类）
  - 快捷键提示（Ctrl+F / Ctrl+Shift+F）

#### 国际化
- **zh_CN.json 更新**:
  - `mindmap.search` - 搜索相关翻译
  - `mindmap.filter` - 过滤相关翻译

#### 组件导出
- **index.ts 更新** (`src/components/MindMapFreeCanvas/index.ts`):
  - 导出 MindMapSearch 组件
  - 导出 NodeFilterPanel 组件

### Features Detail

#### 搜索功能
| 功能 | 说明 |
|------|------|
| 搜索字段 | 标题、内容、备注、标签 |
| 区分大小写 | 可选 |
| 全字匹配 | 可选 |
| 正则表达式 | 可选 |
| 高亮显示 | 匹配节点高亮（黄色背景） |
| 上一个/下一个 | 快速跳转匹配项 |
| 搜索结果统计 | 显示匹配节点数和位置 |

#### 过滤功能
| 过滤类型 | 操作符 | 说明 |
|----------|--------|------|
| 标签 | 等于/不等于/包含/在...中 | 按标签过滤 |
| 页码 | 等于/不等于/大于/小于 | 按 PDF 页码过滤 |
| 颜色 | 等于/不等于/在...中 | 按节点颜色过滤 |
| 状态 | 等于/不等于 | 按卡片状态过滤 |
| 标注 | 有标注/无标注 | 按是否有标注过滤 |

### Technical
- **新增文件**:
  - `src/types/mindMapSearch.ts` - 搜索和过滤类型定义
  - `src/services/mindMapSearchService.ts` - 搜索服务层
  - `src/composables/useMindMapSearch.ts` - 搜索组合式函数
  - `src/components/MindMapFreeCanvas/MindMapSearch.vue` - 搜索组件
  - `src/components/MindMapFreeCanvas/NodeFilterPanel.vue` - 过滤面板组件
- **修改文件**:
  - `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 集成搜索和过滤
  - `src/components/MindMapFreeCanvas/CanvasToolbar.vue` - 新增搜索/过滤按钮
  - `src/components/MindMapFreeCanvas/index.ts` - 导出新组件
  - `src/i18n/zh_CN.json` - 新增搜索/过滤翻译

### Next Steps
- 第 8 期：导出格式增强（PDF 联动相关）
- 第 5 期：思维导图样式扩展（10 种层级图样式）
- 第 6 期：手绘脑图功能（画布涂鸦）

---

## [1.2.26] - 2026-03-01 12:49:00

### Added
- **MarginNote 4 风格思维导图升级 - 第 3 期和第 4 期核心功能** ✅

#### 第 3 期：链接图谱增强
- **新增类型定义** (`src/types/mindmapFree.ts`):
  - `CrossBranchLink` - 跨分支关联（虚线连接）接口
  - `RemoteKnowledgeLink` - 远程知识联系接口
  - `NodeLinkRelation` - 节点链接关系接口
  - `ViewportFocusConfig` - 视图定位配置接口
  - `LayoutSuggestion` - 智能布局建议接口
  - `AnnotationColorMapping` - 标注颜色映射接口
  - `PdfLinkageConfig` - PDF 联动配置接口
  - `HighlightState` - 高亮状态接口
  - `CrossLinkType` - 跨分支关联类型（relation/seeAlso/contrast/cause/example）

- **新增链接图谱增强服务** (`src/services/mindmapLinkEnhanceService.ts`):
  - `createCrossBranchLink` - 创建跨分支关联（虚线连接）
  - `getCrossBranchLinks` / `deleteCrossBranchLink` - 获取/删除跨分支关联
  - `createRemoteKnowledgeLink` - 创建远程知识联系
  - `getRemoteKnowledgeLinks` / `deleteRemoteKnowledgeLink` - 获取/删除远程知识联系
  - `analyzeNodeLinks` - 分析节点链接关系
  - `createViewportFocusConfig` / `getNodePosition` - 一键跳转功能
  - `generateLayoutSuggestions` - 智能布局建议生成
    - 聚类分析（detectNodeClusters）
    - 序列分析（detectNodeSequences）
    - 层级分析（detectHierarchy）
    - 放射状分析（detectRadialPattern）
  - `crossLinkToVueFlowEdge` / `remoteLinkToVueFlowEdge` - 转换为 Vue Flow 连线

- **新增链接图谱增强组合式函数** (`src/composables/useMindMapLinkEnhance.ts`):
  - `useMindMapLinkEnhance` - 提供跨分支关联、远程知识联系、一键跳转、智能布局建议的 Vue 3 组合式 API
  - 响应式数据管理（crossLinks、remoteLinks、layoutSuggestions）
  - 自动刷新机制（节点/连线变化时更新布局建议）
  - 事件驱动的一键跳转功能

#### 第 4 期：PDF 与思维导图联动增强
- **新增 PDF 联动服务** (`src/services/pdfMindMapLinkageService.ts`):
  - **配置管理**:
    - `getPdfLinkageConfig` / `updatePdfLinkageConfig` / `resetPdfLinkageConfig`
  - **实时高亮同步**:
    - `handlePdfTextSelection` - PDF 选中文本事件处理
    - `handlePdfAnnotationCreated` - PDF 标注创建事件处理
    - `highlightNode` / `unhighlightNode` / `clearAllHighlights` - 节点高亮控制
    - `getHighlightState` - 获取高亮状态
  - **拖拽创建节点**:
    - `setDragData` - 设置拖拽数据
    - `handleCanvasDragEnter` / `handleCanvasDrop` - 拖拽事件处理
    - `DragData` - 拖拽数据类型（pdf-text/pdf-image/annotation）
  - **智能布局建议**:
    - `generateSmartLayoutSuggestions` - 带 PDF 上下文的布局建议
    - `groupNodesByPage` - 按页码分组节点
    - `applyLayoutSuggestion` - 应用布局建议（cluster/sequence/hierarchy/radial）
  - **标注颜色映射**:
    - `createColorMapping` / `getColorMapping` / `clearColorMapping` - 颜色映射管理
    - `getNodeStyleFromAnnotation` - 根据标注颜色更新节点样式
    - `lightenColor` - 颜色变亮工具函数
  - **自动同步增强**:
    - `queueSync` - 添加同步任务（防抖处理）
    - `processSyncQueue` - 批量处理同步队列
    - `flushSync` / `cancelPendingSync` - 立即同步/取消同步
  - **坐标转换工具**:
    - `pdfRectToCanvasCoords` - PDF 坐标转画布坐标
    - `canvasCoordsToPdfRect` - 画布坐标转 PDF 坐标
    - `isNodeInViewport` - 检查节点是否在视口内

- **新增 PDF 联动组合式函数** (`src/composables/usePdfMindMapLinkage.ts`):
  - `usePdfMindMapLinkage` - 提供实时高亮同步、拖拽创建节点、智能布局建议、标注颜色映射的 Vue 3 组合式 API
  - 响应式配置管理（config）
  - 响应式高亮状态（highlightedNodes）
  - 响应式颜色映射（colorMappings）
  - 事件监听器自动管理（setupEventListeners/cleanupEventListeners）

- **服务导出更新** (`src/services/index.ts`):
  - 导出 mindmapLinkEnhanceService 所有函数
  - 导出 pdfMindMapLinkageService 所有函数

- **组合式函数导出更新** (`src/composables/index.ts`):
  - 导出 useMindMapLinkEnhance 及其类型
  - 导出 usePdfMindMapLinkage 及其类型

### Features Detail

#### 跨分支关联（虚线连接）
| 关联类型 | 颜色 | 说明 |
|----------|------|------|
| relation | #409eff（蓝色） | 普通关联 |
| seeAlso | #67c23a（绿色） | 参见 |
| contrast | #e6a23c（橙色） | 对比 |
| cause | #f56c6c（红色） | 因果 |
| example | #909399（灰色） | 示例 |

- 虚线样式：5,5
- 线条宽度：2px
- 支持箭头显示
- 思源块属性持久化（custom-mindmap-crosslinks）

#### 远程知识联系
| 联系类型 | 颜色 | 说明 |
|----------|------|------|
| reference | #909399（灰色） | 引用 |
| relation | #409eff（蓝色） | 关联 |
| seeAlso | #67c23a（绿色） | 参见 |
| quote | #e6a23c（橙色） | 引述 |

- 支持跨画布关联（targetCanvasId）
- 支持跨学习集关联（targetStudySetId）
- 支持多种目标类型（node/annotation/document/external）
- 思源块属性持久化（custom-mindmap-remotelinks）

#### 一键跳转功能
- 视图定位（zoom/pan）
- 节点高亮（可配置颜色）
- 动画效果（可配置持续时间）
- 事件驱动（mindmap-focus-node）

#### 智能布局建议
| 建议类型 | 说明 | 置信度计算 |
|----------|------|------------|
| cluster | 节点聚类 | 聚类数量 > 1 时 0.8 |
| sequence | 序列关系 | min(0.9, 节点数 * 0.15) |
| hierarchy | 层级结构 | 0.7 |
| radial | 放射状 | 连接节点数/总节点数 |

#### PDF 联动功能
| 功能 | 说明 | 配置开关 |
|------|------|----------|
| 实时高亮同步 | PDF 选中/标注时导图节点高亮 | enableRealtimeHighlight |
| 拖拽创建节点 | 从 PDF 拖拽文本到画布创建节点 | enableDragToCreate |
| 智能布局建议 | 根据内容和 PDF 页码推荐布局 | enableSmartLayout |
| 标注颜色映射 | PDF 标注颜色同步到节点样式 | enableColorMapping |
| 自动同步增强 | 批量同步、防抖处理 | enableAutoSyncEnhanced |

### Technical
- **新增文件**:
  - `src/types/mindmapFree.ts` - 扩展类型定义
  - `src/services/mindmapLinkEnhanceService.ts` - 链接图谱增强服务
  - `src/services/pdfMindMapLinkageService.ts` - PDF 联动服务
  - `src/composables/useMindMapLinkEnhance.ts` - 链接图谱增强组合式函数
  - `src/composables/usePdfMindMapLinkage.ts` - PDF 联动组合式函数
- **修改文件**:
  - `src/services/index.ts` - 新增服务导出
  - `src/composables/index.ts` - 新增组合式函数导出

### Added
- **链接图谱面板组件** (`src/components/MindMapFreeCanvas/LinksGraphPanel.vue`):
  - 跨分支关联管理 - 创建、查看、删除跨分支虚线连接
  - 远程知识联系管理 - 跨画布、跨学习集的知识关联
  - 布局建议面板 - 智能布局建议查看和应用
  - 三种标签页切换（跨分支关联/远程知识/布局建议）
  - 创建关联对话框 - 源节点、目标节点、关联类型选择
  - 节点定位功能 - 点击关联快速跳转到对应节点
  - 思源主题适配（深色/浅色）

- **PDF 联动配置组件** (`src/components/MindMapFreeCanvas/PdfLinkageSettings.vue`):
  - 配置面板 - 5 个功能开关（实时高亮/拖拽创建/智能布局/颜色映射/自动同步增强）
  - 高亮面板 - 显示当前高亮节点列表，支持清除操作
  - 颜色映射面板 - 显示 PDF 标注颜色到节点颜色的映射
  - 布局建议面板 - PDF 联动的智能布局建议
  - 四种标签页切换（配置/高亮/颜色映射/布局建议）
  - 开关切换动画效果
  - 思源主题适配

- **组件导出更新** (`src/components/MindMapFreeCanvas/index.ts`):
  - 导出 `LinksGraphPanel` 组件
  - 导出 `PdfLinkageSettings` 组件

### Changed
- **TODO.md 更新**:
  - 标记第 3 期：链接图谱增强核心功能已完成 ✅
  - 标记第 4 期：PDF 联动增强核心功能已完成 ✅
  - 更新待完成事项（组件集成）

### Technical
- **新增文件**:
  - `src/components/MindMapFreeCanvas/LinksGraphPanel.vue` - 链接图谱面板组件
  - `src/components/MindMapFreeCanvas/PdfLinkageSettings.vue` - PDF 联动配置组件
  - `src/components/MindMapFreeCanvas/index.ts` - 组件导出文件（新增）
- **修改文件**:
  - `rules/TODO.md` - 更新完成状态
  - `rules/CHANGELOG_FREE_MINDMAP.md` - 本次更新

### Next Steps
- 在 FreeCanvasViewer 组件中集成拖拽功能和虚线连接显示
- 在 PdfMindMapLinkViewer 组件中集成实时高亮同步
- 将 LinksGraphPanel 和 PdfLinkageSettings 集成到现有视图
- 实现思维导图样式扩展功能（10 种层级图样式）

---

## [1.2.25] - 2026-03-01 12:38:00

### Added
- **多画布与图层系统（MarginNote 4 风格升级 - 第 1 期）** ✅
  - **新增类型定义** (`src/types/canvas.ts`):
    - `LayerConfig` - 图层配置接口（背景层、节点层、手绘层、标注层、自定义层）
    - `CanvasConfig` - 画布配置接口（画布 ID、名称、节点、连线、图层、视图状态）
    - `CanvasReference` - 画布引用接口
    - `CrossCanvasNodeLink` - 跨画布节点关联接口
    - `CreateCanvasParams` / `UpdateCanvasParams` - 画布创建/更新参数
    - `UpdateLayerParams` - 图层更新参数
    - `CanvasStats` - 画布统计信息
    - `CanvasListItem` - 画布列表项
  - **新增画布服务** (`src/services/canvasService.ts`):
    - `createCanvas` - 创建新画布
    - `getCanvas` / `getAllCanvases` - 获取画布配置/列表
    - `updateCanvas` / `deleteCanvas` - 更新/删除画布
    - `getCanvasLayers` / `updateLayer` / `addLayer` / `deleteLayer` - 图层管理
    - `getCanvasStats` - 获取画布统计
    - `createCanvasReference` / `getCanvasReferences` - 画布引用管理
    - `createCrossCanvasLink` / `getCrossCanvasLinks` / `deleteCrossCanvasLink` - 跨画布关联管理
    - 思源块属性持久化（`custom-canvas-data`、`custom-canvas-layers`）
  - **新增状态管理** (`src/stores/canvasStore.ts`):
    - `useCanvasStore` - Pinia Store
    - 画布列表状态管理
    - 当前画布配置管理
    - 图层配置管理
    - 画布引用和跨画布关联管理
    - 画布切换、创建、删除操作
    - 图层可见性/锁定控制
  - **新增画布管理器组件** (`src/components/MindMapFreeCanvas/CanvasManager.vue`):
    - 画布选择器（下拉列表）
    - 画布列表展示（名称、节点数、最后更新时间）
    - 新建画布对话框
    - 画布操作（切换、重命名、删除）
    - 加载状态和错误提示
    - 思源主题适配
  - **新增图层面板组件** (`src/components/MindMapFreeCanvas/LayerPanel.vue`):
    - 图层列表展示（背景层、节点层、手绘层、标注层、自定义层）
    - 图层可见性切换（👁️/🚫）
    - 图层锁定切换（🔒/🔓）
    - 不透明度调节滑块（0-100%）
    - 拖拽调整图层顺序
    - 添加自定义图层
    - 重命名/删除图层
    - 思源主题适配
  - **组件导出更新** (`src/components/index.ts`):
    - 导出 `CanvasManager` 组件
    - 导出 `LayerPanel` 组件

### Features Detail

#### 画布管理功能
| 功能 | 说明 |
|------|------|
| 多画布支持 | 支持创建多个画布，每个画布独立存储 |
| 画布切换 | 快速切换不同画布 |
| 画布重命名 | 支持修改画布名称 |
| 画布删除 | 支持删除画布（带确认提示） |
| 画布统计 | 显示节点数、连线数、图层数 |

#### 图层系统功能
| 功能 | 说明 |
|------|------|
| 默认图层 | 背景层、节点层、手绘层、标注层 |
| 可见性控制 | 每层独立开关，控制显示/隐藏 |
| 锁定控制 | 锁定图层防止误操作 |
| 不透明度 | 每层独立调节不透明度（0-100%） |
| 拖拽排序 | 拖拽调整图层顺序 |
| 自定义图层 | 支持添加自定义图层 |

#### 跨画布功能
- 画布引用：一个画布可以引用另一个画布的节点
- 跨画布关联：支持不同画布节点之间的关联
- 关联类型：reference（引用）、relation（关联）、seeAlso（参见）

### Technical
- **新增文件**:
  - `src/types/canvas.ts` - 画布与图层类型定义
  - `src/services/canvasService.ts` - 画布服务层
  - `src/stores/canvasStore.ts` - 画布状态管理
  - `src/components/MindMapFreeCanvas/CanvasManager.vue` - 画布管理器组件
  - `src/components/MindMapFreeCanvas/LayerPanel.vue` - 图层面板组件
- **修改文件**:
  - `src/components/index.ts` - 导出新组件

### Next Steps
- 创建跨画布引用组件 CrossCanvasReference.vue
- 集成画布管理器到 PdfMindMapLinkViewer 组件
- 集成图层面板到 FreeCanvasViewer 组件
- 实现思维导图样式扩展功能（10 种层级图样式）
- 实现链接图谱增强功能（跨分支关联）

---

## [1.2.24] - 2026-03-01 11:57:00

### Added
- **PDF+ 思维导图联动视图（MarginNote 风格核心功能）** ✅
  - **新增联动视图组件** (`src/components/PdfMindMapLinkViewer.vue`):
    - 左右分栏布局：左侧 PDF 阅读器，右侧自由画布思维导图
    - 可调节分隔条：支持拖拽调整左右比例（30%-70%）
    - 自动同步功能：PDF 标注创建后自动添加到思维导图
    - 标注列表面板：显示所有标注，支持点击高亮、跳转到 PDF 位置
    - 双向跳转：导图节点↔PDF 位置精确跳转
    - 工具栏功能：自动同步开关、立即同步、全屏、标注列表显示/隐藏、清空导图
  - **PDFViewer 组件增强** (`src/components/PDFViewer.vue`):
    - 新增 `scrollToAnnotation(annotationId: string)` 方法：跳转到标注所在页并高亮显示
    - 新增 `annotation-created` 事件：标注创建时触发，通知父组件
  - **组件导出更新** (`src/components/index.ts`):
    - 导出 `PdfMindMapLinkViewer` 组件

### Features Detail

#### 联动视图功能
| 功能 | 说明 |
|------|------|
| 自动同步 | 创建标注时自动添加到思维导图节点 |
| 双向跳转 | 导图节点点击跳转到 PDF 标注位置，PDF 标注点击高亮导图节点 |
| 标注管理 | 标注列表显示、删除、高亮 |
| 分隔调节 | 拖拽分隔条调整 PDF/导图比例（30%-70%） |
| 全屏模式 | 支持全屏查看 |
| 标注列表面板 | 可折叠的标注列表，显示标注内容、页码、颜色 |

#### 技术实现
- 使用 `pdfAnnotationService` 获取和管理标注数据
- 使用 `useFreeMindMapStore` 管理思维导图节点
- 通过 `scrollToAnnotation` 方法实现 PDF 精确跳转
- 使用 `highlightRect` 方法实现标注高亮动画

### Technical
- **修改文件**:
  - `src/components/PdfMindMapLinkViewer.vue` - 新增
  - `src/components/PDFViewer.vue` - 新增 scrollToAnnotation 方法和 annotation-created 事件
  - `src/components/index.ts` - 导出 PdfMindMapLinkViewer

### Next Steps
- 完善标注列表面板的样式和交互
- 添加思维导图节点与标注的双向同步
- 优化大量标注时的性能表现

---

## [1.2.23] - 2026-03-01 11:35:00

### Added
- **MarginNote 风格自由画布思维导图（第四阶段：数据集成）** ✅
  - **新增数据集成服务** (`src/services/freeMindMapDataIntegrationService.ts`):
    - `loadMindMapFromBlock` - 从思源块属性加载思维导图数据
    - `saveMindMapToBlock` - 保存思维导图数据到思源块属性
    - `getMindMapPdfPath` / `setMindMapPdfPath` - 管理关联的 PDF 路径
    - `getMindMapStudySetId` / `setMindMapStudySetId` - 管理关联的学习集 ID
    - `generateMindMapFromPdfAnnotations` - 从 PDF 标注自动生成思维导图
    - `syncMindMapNodesToAnnotations` - 同步思维导图节点到思源标注
    - `extractAnnotationIdsFromMindMap` - 提取关联的标注 ID
  - **新增版本历史服务** (`src/services/freeMindMapVersionService.ts`):
    - `getVersionHistory` - 获取版本历史列表
    - `createVersion` - 创建新版本（手动/自动）
    - `restoreVersion` - 恢复指定版本（自动创建恢复前备份）
    - `deleteVersion` - 删除指定版本
    - `getVersionDetail` - 获取版本详情
    - `getLatestVersion` - 获取最新版本
    - `compareVersions` - 比较两个版本的差异
    - `enableAutoSave` / `disableAutoSave` - 启用/禁用自动保存
    - `getAutoSaveInterval` - 获取自动保存间隔
    - `autoSaveVersion` - 自动保存版本
    - `clearHistory` - 清空版本历史
  - **服务层升级** (`src/services/freeMindMapService.ts`):
    - 集成数据集成服务，实现思源块属性持久化
    - 新增 `generateMindMapFromPdf` - 从 PDF 生成思维导图
    - 新增 `syncMindMapToAnnotations` - 同步到标注
    - 向后兼容旧格式数据
  - **服务导出更新** (`src/services/index.ts`):
    - 导出自由画布思维导图基础服务
    - 导出数据集成服务
    - 导出版本历史服务

### Features Detail

#### 数据持久化
- 思维导图数据存储在思源块属性 `custom-freemind-data`
- 支持关联 PDF 路径（`custom-freemind-pdf`）
- 支持关联学习集 ID（`custom-freemind-studyset`）
- 自动记录最后同步时间（`custom-freemind-last-sync`）
- 向后兼容旧格式（`mindmap-free-data`）

#### 版本历史
- 版本数据存储在思源块属性 `custom-freemind-history`
- 支持手动创建版本（带名称和描述）
- 支持自动保存版本（可配置间隔，默认 5 分钟）
- 恢复版本时自动创建恢复前备份
- 最多保留 50 个版本（自动清理旧版本）
- 支持版本对比（新增/删除/修改节点和连线）

#### PDF 标注集成
- 从 PDF 标注自动生成思维导图
- 按页码分组标注
- 自动创建根节点和页码分组节点
- 标注内容转换为卡片节点
- 自动建立层级连线关系

### Technical
- **修改文件**:
  - `src/services/freeMindMapDataIntegrationService.ts` - 新增
  - `src/services/freeMindMapVersionService.ts` - 新增
  - `src/services/freeMindMapService.ts` - 升级
  - `src/services/index.ts` - 更新导出

### Next Steps
- 创建版本历史 UI 组件
- 创建从 PDF 标注生成思维导图的入口
- 完善自动保存机制

---

## [1.2.22] - 2026-03-01 11:30:00

### Added
- **MarginNote 风格自由画布思维导图（第三阶段：交互功能）** ✅
  - **新增右键菜单组件** (`src/components/MindMapFreeCanvas/NodeContextMenu.vue`):
    - 支持节点编辑、复制、删除操作
    - 支持背景颜色选择（7 种颜色选项）
    - 支持节点层级设置（标题/H1-H5/正文）
    - 支持创建分组和连线
    - 支持画布操作（适应视图、居中视图）
    - 只读模式提示
    - 思源主题适配（深色/浅色）
  - **新增画布工具栏组件** (`src/components/MindMapFreeCanvas/CanvasToolbar.vue`):
    - 添加节点按钮（文本卡片、图片卡片、分组）
    - 布局模式切换（自由/树状/垂直/水平）
    - 视图控制（缩放、适应视图）
    - 显示选项（网格、全屏）
    - 保存和导出按钮
    - 思源主题适配
  - **键盘快捷键支持** (`src/composables/useFreeMindMap.ts`):
    - `Ctrl/Cmd + S` - 保存
    - `Ctrl/Cmd + F` - 适应视图
    - `Ctrl/Cmd + 0` - 重置缩放
    - `Ctrl/Cmd + +/-` - 缩放
    - `Delete/Backspace` - 删除选中节点
    - `Ctrl/Cmd + A` - 全选
    - `Ctrl/Cmd + D` - 复制选中节点
    - `Escape` - 清空选择
    - `T` - 添加文本卡片
    - `G` - 添加分组
  - **画布组件升级** (`src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`):
    - 集成工具栏组件
    - 集成右键菜单组件
    - 支持右键上下文菜单
    - 支持全屏模式
    - 支持节点多选（Shift/Ctrl+ 点击）
    - 自动保存功能（30 秒间隔）
    - 防抖保存（1 秒延迟）
  - **Store 升级** (`src/stores/freeMindMapStore.ts`):
    - 新增 `deleteNodes` 方法（批量删除）
    - 新增 `deleteNode` 方法（公开方法）
    - 新增 `setLayout` 方法（设置布局模式）
    - 优化节点删除逻辑（同时删除相关连线）
  - **组件导出更新** (`src/components/MindMapFreeCanvas/index.ts`):
    - 导出 `NodeContextMenu` 组件
    - 导出 `CanvasToolbar` 组件

### Changed
- **useFreeMindMap 升级**:
  - 新增 `duplicateNode` 方法
  - 新增 `selectAll` 方法
  - 新增 `zoomReset` 方法
  - 新增 `setLayout` 方法
  - 新增 `setupKeyboardShortcuts` / `cleanupKeyboardShortcuts` 方法
  - 优化缩放限制（最小 0.1，最大 4）
  - 添加键盘快捷键自动绑定

### Technical
- **修改文件**:
  - `src/components/MindMapFreeCanvas/NodeContextMenu.vue` - 新增
  - `src/components/MindMapFreeCanvas/CanvasToolbar.vue` - 新增
  - `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 集成
  - `src/composables/useFreeMindMap.ts` - 快捷键支持
  - `src/stores/freeMindMapStore.ts` - 批量操作
  - `src/components/MindMapFreeCanvas/index.ts` - 组件导出

---

## [1.2.21] - 2026-03-01 11:00:00

### Added
- **MarginNote 风格自由画布思维导图（第二阶段：卡片节点）** ✅
  - 图片/PDF 摘录卡片节点
  - 分组容器节点
  - 节点编辑对话框

---

## [1.2.20] - 2026-03-01 10:30:00

### Added
- **MarginNote 风格自由画布思维导图（第一阶段：基础框架）** ✅
  - Vue Flow 集成
  - 基础画布组件
  - 文本卡片节点
  - 状态管理 (Pinia Store)
  - 服务层
  - 组合式函数
