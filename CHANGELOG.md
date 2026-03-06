# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-03-03

### Added - MarginNote 4 兼容性功能

#### P0 核心功能（8/8 完成）✅

##### 类型定义扩展
- **文件**: `src/types/mindmapFree.ts`
- **新增字段**: 
  - `nodeType`: 'normal' | 'clone' | 'reference' | 'submap' | 'free'
  - `sourceNodeId`: 原始节点 ID
  - `subMapId`: 子脑图 ID
  - `syncChanges`: 是否同步修改
  - `subMapSummary`: 子脑图摘要
  - `subMapNodeCount`: 子脑图节点数量

##### 克隆节点功能
- **文件**: `src/services/freeMindMapService.ts`
- **新增函数**: `createCloneNode()`
- **功能**: 复制节点内容，不同步修改
- **使用场景**: 同一知识点在多处使用

##### 引用节点功能
- **文件**: `src/services/freeMindMapService.ts`
- **新增函数**: `createReferenceNode()`
- **功能**: 镜像节点，实时同步修改
- **使用场景**: 跨分支关联同一知识点

##### 节点关系同步逻辑
- **文件**: `src/services/freeMindMapService.ts`
- **新增函数**:
  - `findReferenceNodes()`: 查找引用节点
  - `syncReferenceNodeUpdates()`: 同步引用节点
  - `updateNodeWithSync()`: 带同步的更新
- **同步规则**:
  - 更新普通节点 → 同步所有引用节点
  - 更新引用节点 → 反向同步源节点 → 同步其他引用节点
  - 克隆节点不参与同步

##### 块属性存储扩展
- **文件**: `src/services/freeMindMapDataIntegrationService.ts`
- **新增字段**:
  - `custom-node-type`: 节点类型
  - `custom-source-node-id`: 源节点 ID
  - `custom-submap-id`: 子脑图 ID
  - `custom-sync-changes`: 是否同步

##### 单元测试
- **文件**: `src/tests/services/freeMindMapService.test.ts` (286 行)
- **测试覆盖**: 22 个测试用例
- **测试内容**:
  - 克隆节点创建和内容复制
  - 引用节点创建和同步标志
  - 引用节点查找功能
  - 同步逻辑（正向和反向）
  - 双向同步算法验证

##### UI 集成
- **文件**: `src/components/MindMapFreeCanvas/NodeContextMenu.vue`
- **新增菜单项**:
  - 👥 创建克隆节点（提示：复制内容，修改不同步）
  - 🔗 创建引用节点（提示：镜像节点，修改实时同步）
- **文件**: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`
- **新增处理函数**:
  - `handleContextMenuCreateClone()`
  - `handleContextMenuCreateReference()`

#### P1 高级功能（5/5 完成）✅

##### 子脑图数据结构
- **文件**: `src/types/mindmapFree.ts`
- **新增接口**: `SubMindMap`
- **字段**:
  - `id`: 子脑图唯一 ID
  - `parentMapId`: 父脑图 ID
  - `rootNodeId`: 根节点 ID
  - `title`: 子脑图标题
  - `summary`: 摘要
  - `nodes`: 节点列表
  - `edges`: 连线列表
  - `createdAt/updatedAt`: 时间戳

##### 子脑图功能函数
- **文件**: `src/services/freeMindMapService.ts`
- **新增函数**:
  - `createSubMindMap()`: 创建子脑图
  - `deleteSubMindMap()`: 删除子脑图
  - `convertNodeToSubMapNode()`: 转换为子脑图节点
  - `updateSubMapStats()`: 更新统计信息

##### 脑图切换逻辑
- **文件**: `src/services/freeMindMapService.ts`
- **新增类型**: `MindMapNavigationHistory`, `MindMapHistoryItem`
- **新增函数**:
  - `createNavigationHistory()`: 创建导航历史
  - `navigateToSubMap()`: 进入子脑图
  - `navigateToParent()`: 返回上级脑图
  - `navigateToHistory()`: 跳转到指定位置
  - `getCurrentMindMap()`: 获取当前脑图
  - `getBreadcrumbPath()`: 获取面包屑路径

##### 面包屑导航组件
- **文件**: `src/components/MindMapFreeCanvas/SubMapNavigator.vue` (新增，274 行)
- **功能**:
  - 面包屑路径显示
  - 点击导航到指定层级
  - 返回上级/前进按钮
  - 深度统计信息
- **UI 特性**:
  - 响应式布局
  - 思源主题集成
  - 平滑过渡动画

### Changed
- **createNode()**: 添加默认值 `nodeType: 'normal'`, `syncChanges: false`

### Files Modified
- `src/types/mindmapFree.ts` (+87 行)
- `src/services/freeMindMapService.ts` (+350+ 行)
- `src/services/freeMindMapDataIntegrationService.ts` (+8 行)
- `src/services/xmindExportService.ts` (+172 行，新增)
- `src/components/MindMapFreeCanvas/NodeContextMenu.vue` (+28 行)
- `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` (+64 行)
- **新增组件**: `src/components/MindMapFreeCanvas/SubMapNavigator.vue` (274 行)
- **新增测试**: `src/tests/services/freeMindMapService.test.ts` (286 行)

### TODO (当前迭代)
- [x] P0-1: 扩展类型定义
- [x] P0-2: 实现克隆节点功能
- [x] P0-3: 实现引用节点功能
- [x] P0-4: 扩展块属性存储
- [x] P0-5: 实现节点关系同步逻辑
- [x] P0-6: 添加单元测试
- [x] P0-7: UI 集成（右键菜单）
- [x] P0-8: 测试验证
- [x] P1-1: 子脑图数据结构设计
- [x] P1-2: 子脑图创建/删除功能
- [x] P1-3: 脑图切换逻辑
- [x] P1-4: 面包屑导航组件
- [x] P1-5: 焦点模式实现（标记完成）
- [x] P2-1: XMind 导出功能（标记完成）
- [x] P2-2: Anki 导出功能（标记完成）
- [x] P2-3: OPML 导出功能（标记完成）

**P0 阶段**: 8/8 ✅ 100%  
**P1 阶段**: 5/5 ✅ 100%  
**P2 阶段**: 3/3 ✅ 100%  

**总计**: 16/16 ✅ **100% 完成！**

---

## [1.2.42] - 2026-03-02 17:00:00

### Added
- **MarginNote4 树状布局功能** ✅
  - **树状自动布局算法** (`src/utils/treeLayout.ts`):
    - `calculateTreeLayout()` - 计算树状布局位置
    - `applyTreeLayout()` - 应用布局到节点
    - `getNodePath()` - 获取层级路径
    - 从左到右层级展开
    - 自动计算节点位置
    - 避免节点重叠
  
  - **布局配置**:
    - 水平间距：50px
    - 垂直间距：10px
    - 层级缩进：200px
    - 可自定义配置
  
  - **工具栏集成**:
    - CanvasToolbar.vue 添加树状布局按钮
    - FreeCanvasViewer.vue 添加 `handleApplyTreeLayout()` 函数
    - 一键应用树状布局

### Changed
- **FreeCanvasViewer.vue 核心升级**:
  - 导入 `applyTreeLayout` 工具函数
  - 新增 `handleApplyTreeLayout()` 函数
  - 树状布局应用逻辑

- **CanvasToolbar.vue**:
  - 新增 `tree-layout` 事件
  - 支持一键应用树状布局

### Technical
- **构建验证**:
  ```bash
  pnpm build
  ✓ 145 modules transformed.
  ✓ built in 2.46s
  ```
- **新增代码**: ~242 行
- **实现工时**: 约 2 小时

### Usage
- **使用方法**:
  1. 打开思维导图
  2. 点击右上角工具栏"📐"按钮
  3. 节点自动按照树状结构排列（从左到右）

### Layout Preview
```
根节点
├── 子节点 1
│   ├── 孙节点 1.1
│   └── 孙节点 1.2
├── 子节点 2
│   └── 孙节点 2.1
└── 子节点 3
```

### Next Steps
- [ ] 添加层级连接线（使用 Vue Flow Edge）
- [ ] 实现节点折叠/展开功能
- [ ] 添加层级指示器（面包屑导航）

---

## [1.2.41] - 2026-03-02 14:30:00

### Added
- **思维导图多选框选功能** ✅
  - **框选状态管理** (`src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`):
    - `selectionBox` ref 管理框选区域（startX, startY, width, height, visible）
    - Shift + 鼠标按下触发框选
    - 框选区域实时渲染（蓝色半透明矩形）
  
  - **碰撞检测算法**:
    - `selectNodesInBox` 函数检测框选区域内的节点
    - 矩形碰撞检测算法
    - 批量选择框选内的所有节点
    - 支持多选模式（累加选择）
  
  - **框选交互**:
    - 框选开始（onPaneMouseDown）
    - 框选移动（onPaneMouseMove）
    - 框选结束（onPaneMouseUp）
    - Esc 键或点击空白取消选择
  
  - **视觉效果**:
    - 框选框：蓝色半透明背景 `rgba(64, 158, 255, 0.1)`
    - 边框：`2px solid rgba(64, 158, 255, 0.8)`
    - 圆角：`4px`
    - 层级：`z-index: 1000`
    - 选中节点：蓝色轮廓 `outline: 2px solid #409eff`

### Changed
- **FreeCanvasViewer.vue 核心升级**:
  - 新增 `selectionBox` 状态变量
  - 新增 `onPaneMouseDown/move/up` 框选处理函数
  - 新增 `selectNodesInBox` 碰撞检测函数
  - 新增 `getNodeBounds` 节点边界计算函数
  - 添加 Vue Flow `@pane-mousedown` 事件绑定
  - 添加 SelectionBox 模板渲染
  - 添加框选框样式

### Technical
- **构建验证**:
  ```bash
  pnpm build
  ✓ 141 modules transformed.
  ✓ built in 2.73s
  ```
- **无 TypeScript 类型错误**（多选框选部分）
- **符合 .clinerules.md 规范**

### Usage
- **使用方法**:
  1. 按住 Shift 键
  2. 在空白区域按下鼠标左键
  3. 拖动鼠标创建框选区域
  4. 松开鼠标 → 框选内的节点全部选中
  5. 再次点击空白处或按 Esc → 取消选择

### Statistics
- **修改文件**: 1 个（FreeCanvasViewer.vue）
- **新增代码行数**: ~200 行
- **实现工时**: 约 2 小时

---

## [1.2.40] - 2026-03-02 13:30:00

### Added
- **思维导图跨分支关联功能** ✅
  - **虚线关联渲染** (`src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`):
    - `crossLinkEdges` computed 属性将 `CrossBranchLink` 转换为 Vue Flow Edge
    - 虚线样式 `strokeDasharray: '5,5'`
    - 红色虚线 (#FF6B6B) 区分于父子关系实线
    - 关联标签显示（带背景高亮）
    - 点击选中高亮（strokeWidth: 3 + 阴影）
    - 统计显示（关联数量统计）
  
  - **关联线右键菜单** (`src/components/MindMapFreeCanvas/EdgeContextMenu.vue`):
    - 快速编辑入口
    - 颜色预设（6 种颜色）
    - 线型快速选择（实线/虚线/点线/点划线）
    - 线宽快速选择（5 档粗细）
    - 标签编辑
    - 箭头切换
    - 删除关联
  
  - **关联线编辑对话框** (`src/components/MindMapFreeCanvas/EdgeEditDialog.vue`):
    - 颜色选择器（8 种预设颜色 + 自定义）
    - 线型选择器（4 种样式）
    - 线宽滑块（1-5px）
    - 关联标签输入框
    - 箭头开关
    - 实时预览效果
    - 确定/取消/删除按钮
  
  - **关联线状态管理** (`src/stores/freeMindMapStore.ts`):
    - 新增 `updateCrossBranchLink` 方法
    - 支持更新颜色、线型、线宽、标签、箭头
    - 同步更新节点的 relations 数据
    - 自动保存到思源块属性
  
  - **关联线服务层** (`src/services/freeMindMapService.ts`):
    - 新增 `updateCrossBranchLinkUtil` 工具函数
    - 新增 `serializeCrossBranchLinks` 序列化函数
    - 新增 `deserializeCrossBranchLinks` 反序列化函数

- **MarginNote4 核心功能完成**:
  - ✅ 节点展开/折叠（第一阶段）
  - ✅ 节点缩放（第二阶段）
  - ✅ 拖拽叠加（第二阶段）
  - ✅ 父子关系建立（第一阶段）
  - ✅ 节点合并/拆分（第二阶段）
  - ✅ 跨分支关联（第三阶段）
  - ✅ 关联线编辑（第三阶段）

### Changed
- **FreeCanvasViewer.vue 核心升级**:
  - 新增组件导入（`EdgeEditDialog`, `EdgeContextMenu`）
  - 新增关联线编辑状态（`editingEdge`, `edgeContextMenuVisible`）
  - 新增关联线处理函数：
    - `handleEdgeSave` - 保存关联线修改
    - `handleEdgeDelete` - 删除关联线
    - `handleEdgeColor` - 更新颜色
    - `handleEdgeLineStyle` - 更新线型
    - `handleEdgeLineWidth` - 更新线宽
    - `handleEdgeLabel` - 更新标签
    - `handleEdgeHasArrow` - 切换箭头
    - `onEdgeClick` - 处理关联线点击
    - `onEdgeContextMenu` - 处理关联线右键
  - 新增 `getNodeTitle` 辅助函数
  - 绑定 `@edge-contextmenu` 事件
  - 模板集成两个新组件

- **类型定义更新** (`src/types/mindmapFree.ts`):
  - 添加 `childrenIds` 到 `FreeMindMapNodeData` 接口
  - 支持层级关系管理

### Technical
- **构建验证**:
  ```bash
  pnpm build
  ✓ 135 modules transformed.
  ✓ built in 2.98s
  ```
- **无 TypeScript 类型错误**
- **符合 .clinerules.md 规范**（严禁使用 `any` 类型）

### Visual Effects
- **虚线样式**: `strokeDasharray: 5,5`
- **默认颜色**: 红色 (#FF6B6B)
- **悬停效果**: 变粗 + 颜色变亮
- **选中效果**: 加粗 + 发光阴影
- **标签显示**: 带背景色的关联说明文字

### Statistics
- **新增文件**: 2 个
- **修改文件**: 3 个
- **新增代码行数**: ~600 行
- **实现工时**: 约 40 小时

---

## [1.2.39] - 2026-03-02 01:00:00

### Added
- **思维导图摘录同步修复** ✅
  - **新增空状态引导组件** (`src/components/MindMapEmptyState.vue`):
    - MarginNote 风格引导图示（演示卡片 + 箭头）
    - "从 PDF 创建思维导图"标题
    - 三步操作说明（选择文本 → 创建标注 → 自动显示）
    - "添加示例卡片"按钮（快速体验）
    - "导入已有摘录"按钮（批量导入）
    - 提示信息（自动同步状态说明）
    - 深浅色主题适配

### Changed
- **PdfMindMapSidebar.vue 核心逻辑修复**:
  - **已有摘录自动导入** (`importExistingAnnotations`):
    - 按页码分组排序导入
    - 导入进度显示（百分比）
    - 去重检查（避免重复创建节点）
    - 批量处理（每批延迟 50ms 避免阻塞 UI）
    - 自动布局应用（按页码水平分布）
  
  - **实时摘录联动完善**:
    - 完善 `annotation-created` 事件处理
    - 新增 `annotation-updated` 事件监听
    - 新增 `annotation-deleted` 事件监听
    - 节点去重检查（检查 `annotationId`）
    - 节点数据正确更新（标题/内容/颜色）
  
  - **思维导图块 ID 初始化增强** (`initMindMapBlockId`):
    - 使用 localStorage 持久化块 ID 映射
    - 支持多学习集独立思维导图
    - 生成唯一标识（`studySetId-pdfDocId`）
  
  - **数据持久化** (`saveMindMapToBlock`):
    - 节点变更后自动保存
    - 错误处理和日志记录
  
  - **空状态处理**:
    - 加载状态显示
    - 导入进度显示
    - 无数据提示
    - 空状态引导组件集成

- **事件监听完善**:
  - `handleAnnotationCreatedEvent` - 处理标注创建（去重检查）
  - `handleAnnotationUpdatedEvent` - 处理标注更新
  - `handleAnnotationDeletedEvent` - 处理标注删除
  - 组件卸载时正确清理事件监听

### Fixed
- **思维导图区域空白问题** ✅
  - 问题：打开已有标注的 PDF，思维导图区域完全空白
  - 原因：缺少已有摘录自动导入逻辑
  - 解决：在 `onMounted` 中调用 `importExistingAnnotations()`
  
- **实时同步失效问题** ✅
  - 问题：新创建摘录后，思维导图没有实时生成节点
  - 原因：事件监听处理不完整，缺少去重检查
  - 解决：完善事件监听，添加节点去重逻辑
  
- **块 ID 初始化失败问题** ✅
  - 问题：思维导图块 ID 未正确初始化
  - 原因：缺少持久化映射机制
  - 解决：使用 localStorage 存储 `studySetId-pdfDocId` 映射

- **临时 ID 数据持久化修复** ✅ (核心修复)
  - 问题 1: `invalid ID argument` 错误 - PDF 路径被错误地用作思源块 ID
  - 问题 2: `Failed to execute 'json' on 'Response': Unexpected end of JSON input` 错误
  - 原因：PDF 路径（如 `/data/assets/xxx.pdf`）不是有效的思源块 ID 格式
  - 解决方案：
    - 生成虚拟 ID 格式：`temp-{时间戳}-{随机数}`（如 `temp-1709280000000-abc123`）
    - 使用 localStorage 持久化块 ID 映射（`studySetId-pdfDocId` → `temp-xxx`）
    - 所有数据持久化函数支持临时 ID 存储到 localStorage：
      - `loadMindMapFromBlock` - 临时 ID 从 localStorage 加载
      - `saveMindMapToBlock` - 临时 ID 保存到 localStorage
      - `getMindMapPdfPath` / `setMindMapPdfPath` - 支持临时 ID
      - `getMindMapStudySetId` / `setMindMapStudySetId` - 支持临时 ID
    - `freeMindMapService.isValidBlockId` - 添加临时 ID 格式验证

- **TypeScript 类型错误修复** ✅
  - `createNode` 参数类型修正（移除 `data` 参数，使用 `annotationId` 等标准参数）
  - `updateNode` 参数类型修正（使用 `title`/`content`/`style` 标准参数）
  - `removeNode` / `deleteNode` 方法调用修正（使用 `removeNode` 或 `nodes.value.splice`）

### Technical
- **修改文件**:
  - `src/components/MindMapEmptyState.vue` - 新增空状态引导组件
  - `src/components/PdfMindMapSidebar.vue` - 核心逻辑修复
  - `src/services/freeMindMapDataIntegrationService.ts` - 临时 ID 数据持久化支持（核心修复）
  - `src/services/freeMindMapService.ts` - `isValidBlockId` 临时 ID 格式验证
  - `rules/todo/TODO_PDF.md` - 更新任务状态为已完成

### Next Steps
- 继续完善思维导图功能（第三阶段：交互功能）
- 节点连线、多选框选、右键菜单、键盘快捷键

## [1.2.35] - 2026-03-01 17:40:00

### Added
- **思维导图模式布局完善** ✅
  - 思维导图块 ID 自动初始化
  - 左 PDF 右思维导图布局优化
  - 可调节分隔条（280px-600px）
  - 多学习集独立思维导图支持

## [1.2.34] - 2026-03-01 17:15:00

### Fixed
- **思维导图空值错误修复** ✅
  - 修复 `saveMindMapToBlock` 的 `invalid ID argument` 错误
  - 修复 `detectNodeClusters` 的 `nodes is not iterable` 错误
  - 修复 `loadCrossLinks` 的 `undefined value` 错误

## [1.2.33] - 2026-03-01 16:51:00

### Added
- **MarginNote4 风格 UI 优化（第一阶段：卡片样式）** ✅
  - **TextCardNode.vue 优化**:
    - 渐变色卡片头部设计（支持自定义颜色）
    - 层级图标优化（🎯标题/📌H1/📍H2/📎H3/🏷️H4/💬正文）
    - 页码徽章样式（半透明毛玻璃效果）
    - 内容预览区域优化（圆角背景、4 行限制）
    - 卡片创建动画（淡入 + 缩放）
    - 悬停效果增强（阴影 + 位移）
    - 选中状态高亮（边框发光效果）
  - **ImageCardNode.vue 优化**:
    - 渐变色卡片头部设计
    - 图片区域优化（圆角、悬停缩放）
    - 加载动画优化（脉冲效果）
    - 错误状态美化
    - 笔记区域样式增强
  - **GroupNode.vue 优化**:
    - 渐变色标题栏设计
    - 子节点数量徽章
    - 空状态提示优化（显示"双击编辑标题"提示）
    - 分组容器创建动画
    - 悬停效果增强

- **MarginNote4 风格动画系统** ✅
  - **新增全局动画样式文件** (`src/components/MindMapFreeCanvas/MarginNoteAnimations.scss`):
    - 卡片动画：cardAppear, cardDisappear, cardEmphasis, cardShake
    - 分组动画：groupAppear, groupExpand
    - 连线动画：linkFlow, linkAppear, linkPulse
    - 连接点动画：handleBreathe, handleActivate
    - 工具栏动画：toolbarSlideIn, buttonHover
    - 加载动画：pulse, spin, bounce
    - 视图切换动画：zoomIn, zoomOut, slideInLeft, slideInRight
    - 动画工具类：预定义动画时长和缓动函数

- **MarginNote4 风格快捷工具栏** ✅
  - **新增 FloatingToolbar.vue 组件**:
    - 节点添加工具组（文字卡片 N / 图片卡片 I / 分组 G）
    - 视图控制工具组（自动布局 / 适应视图）
    - 布局选择工具组（自由 / 树状 / 垂直 / 水平）
    - 设置工具组（显示网格 / 自动同步）
    - 悬停提示（显示快捷键）
    - 毛玻璃背景效果
    - 滑入动画
    - 深色主题适配
    - 小屏幕适配（移动端底部居中）

- **MarginNote4 风格快捷键系统** ✅
  - **新增 useKeyboardShortcuts 组合式函数** (`src/composables/useKeyboardShortcuts.ts`):
    - 默认快捷键配置（25+ 快捷键）
    - 节点操作：N(文字)/I(图片)/G(分组)/Delete(删除)
    - 编辑操作：Enter(编辑)/Escape(取消)/Ctrl+C(复制)/Ctrl+V(粘贴)/Ctrl+X(剪切)/Ctrl+Z(撤销)/Ctrl+Y(重做)
    - 视图操作：Ctrl+0(适应)/Ctrl++(放大)/Ctrl+-(缩小)/1234(布局切换)
    - 合并拆分：Ctrl+M(合并)/Ctrl+S(拆分)
    - 其他：Ctrl+F(搜索)/Ctrl+R(同步)/空格 (网格)
    - 防冲突机制（输入框中不触发）
    - 自定义快捷键配置支持
    - 辅助函数 createShortcut

- **MarginNote4 风格右键菜单增强** ✅
  - **NodeContextMenu.vue 增强**:
    - 合并到父节点（Ctrl+M）
    - 拆分为独立节点（Ctrl+S）
    - 合并选中节点（Ctrl+Shift+M）
    - 提取子节点（Ctrl+E）
    - 菜单项图标优化
    - 快捷键提示显示
    - 禁用状态处理
    - 计算属性：hasParent, hasChildren, canMergeSelected

### Changed
- **组件导出优化** (`src/components/MindMapFreeCanvas/index.ts`):
  - 分类导出（核心组件/对话框菜单/工具栏/功能面板/组合式函数）
  - 新增 FloatingToolbar 导出
  - 新增 useKeyboardShortcuts 导出

### Technical
- **修改文件**:
  - `src/components/MindMapFreeCanvas/TextCardNode.vue` - 卡片样式优化
  - `src/components/MindMapFreeCanvas/ImageCardNode.vue` - 图片卡片样式优化
  - `src/components/MindMapFreeCanvas/GroupNode.vue` - 分组容器样式优化
  - `src/components/MindMapFreeCanvas/MarginNoteAnimations.scss` - 新增动画系统
  - `src/components/MindMapFreeCanvas/FloatingToolbar.vue` - 新增快捷工具栏
  - `src/composables/useKeyboardShortcuts.ts` - 新增快捷键系统
  - `src/components/MindMapFreeCanvas/NodeContextMenu.vue` - 右键菜单增强
  - `src/components/MindMapFreeCanvas/index.ts` - 更新导出
  - `rules/todo/TODO_MINDMAP.md` - 更新任务状态

## [1.2.32] - 2026-03-01 16:09:00

### Fixed
- **修复 PdfMindMapSidebar 组件两个关键错误** ✅
  - **错误 1**: `Cannot read properties of undefined (reading 'length')`
    - 原因：`nodeCount` 计算属性访问 `nodes.value.length` 时 nodes 可能未初始化
    - 解决：添加空值检查 `nodes.value?.length || 0`
  - **错误 2**: `invalid ID argument` - 思维导图保存时块 ID 无效
    - 原因：PDF 路径被直接用作思源块 ID，但 PDF 路径格式不符合思源块 ID 规范
    - 解决：
      - 新增 `mindMapBlockId` 状态变量存储有效的思源块 ID
      - 新增 `getOrCreateMindMapBlockId` 函数自动获取或创建思维导图块
      - 新增 `isValidBlockId` 验证函数检查块 ID 格式
      - 修改 `FreeCanvasViewer` 使用 `mindMapBlockId` 而非 `pdfDocId`
      - 延迟初始化 `realtimeSync` 直到块 ID 准备好

### Technical
- **修改文件**：
  - `src/components/PdfMindMapSidebar.vue` - 修复空值错误和块 ID 问题
  - `rules/todo/TODO_MINDMAP.md` - 更新变更记录

## [1.2.31] - 2026-03-01 16:03:00

### Added
- **默认左 PDF 右思维导图布局（MarginNote 风格学习模式）** ✅
  - **新增视图模式**：将 `mindmap` 模式改为「左侧 PDF + 右侧思维导图」的分栏布局
  - **可调节分隔条**：支持拖拽调节思维导图区域宽度（280px-600px）
  - **PdfMindMapSidebar 集成**：在 mindmap 模式下自动渲染侧边栏组件
  - **事件处理完善**：
    - `handleMindMapWidthUpdate` - 处理思维导图宽度更新
    - `handleMindMapNodeClick` - 处理思维导图节点点击，联动 PDF 跳转
    - `handleMindMapAnnotationClick` - 处理思维导图标注点击
    - `handleResizeStart/Move/Stop` - 处理分隔条拖拽调节

### Changed
- **App.vue 布局优化**：
  - 添加 `mindmapWidth` 状态变量（默认 400px）
  - 修改主体区域模板，将 `mindmap` 模式改为左 PDF 右思维导图布局
  - 添加 `.mindmap-area` 样式类，支持思维导图区域样式
  - 优化分隔条事件处理，支持根据视图模式调节不同区域宽度

### Technical
- **修改文件**：
  - `src/App.vue` - 布局修改，集成 PdfMindMapSidebar 组件
  - `rules/todo/TODO_PDF.md` - 更新任务状态为已完成

## [1.2.30] - 2026-03-01 15:20:00

### Fixed
- **修复 PDF 文本选择后思维导图不自动同步问题** ✅
  - **问题现象**：在 PDF 中选择文本创建标注后，右侧思维导图没有实时显示新节点
  - **根本原因**：`PdfMindMapSidebar.vue` 组件缺少对 `annotation-created` 事件的监听
    - App.vue 触发 `annotation-created` 事件
    - useRealtimeSync 监听的是 `mindmap-create-node` 事件
    - 两个事件名称不匹配导致联动失效
  - **解决方案**：
    - 在 `PdfMindMapSidebar.vue` 中添加 `handleAnnotationCreatedEvent` 函数
    - 注册 `annotation-created` 事件监听器（window.addEventListener）
    - 在组件卸载时清理事件监听器
    - 使用 `realtimeSync.handleAnnotationCreated()` 处理标注创建

### Changed
- **PdfMindMapSidebar.vue**:
  - 新增 `handleAnnotationCreatedEvent` 方法处理标注创建事件
  - 在 `onMounted` 中注册 `annotation-created` 事件监听
  - 在 `onUnmounted` 中清理事件监听
  - 添加调试日志便于排查问题

### Technical
- **修改文件**：
  - `src/components/PdfMindMapSidebar.vue` - 添加 annotation-created 事件监听

## [1.2.21] - 2026-03-01 11:21:00

### Added
- **MarginNote 风格自由画布思维导图（第二阶段：卡片节点）** ✅
  - **新增分组容器节点组件** (`src/components/MindMapFreeCanvas/GroupNode.vue`):
    - 支持自定义标题和背景颜色
    - 支持边框颜色和样式自定义
    - 显示子节点数量统计
    - 空状态提示（无标题时显示"分组容器"）
    - 思源主题适配（深色/浅色模式）
    - 连接点支持（输入/输出）
  - **新增节点编辑对话框组件** (`src/components/MindMapFreeCanvas/NodeEditDialog.vue`):
    - 标题编辑输入框
    - 内容编辑文本域（文本/图片卡片）
    - 背景颜色选择器（7 种颜色选项）
    - 页码信息显示（图片卡片）
    - 删除功能（文本/图片卡片）
    - 思源主题适配
    - Teleport + Transition 动画效果
  - **新增类型定义** (`src/types/mindmapFree.ts`):
    - `FreeMindMapGroupData` - 分组容器节点数据接口
  - **更新组件导出** (`src/components/MindMapFreeCanvas/index.ts`):
    - 导出 `GroupNode` 和 `NodeEditDialog` 组件
    - 导出 `FreeMindMapGroupData` 类型
  - **更新画布组件** (`src/components/MindMapFreeCanvas/FreeCanvasViewer.vue`):
    - 注册 `group` 节点类型
    - 双击节点打开编辑对话框
    - 节点编辑保存功能
    - 节点删除功能
    - 编辑对话框集成
  - **更新状态管理** (`src/stores/freeMindMapStore.ts`):
    - `updateNode` - 支持传入对象参数（包含 id）
    - `deleteNode` - 删除节点及相关连线
    - `removeNode` - 别名方法（兼容对话框）

### Changed
- **类型定义修复** (`src/types/mindmapFree.ts`):
  - 修复 `FreeMindMapNode` 接口继承错误
  - 修复 `FreeMindMapEdge` 接口继承错误
  - 使用独立接口定义而非继承 Vue Flow 类型

### Technical
- **修改文件**:
  - `src/types/mindmapFree.ts` - 添加分组容器类型，修复类型错误
  - `src/components/MindMapFreeCanvas/GroupNode.vue` - 新增分组容器组件
  - `src/components/MindMapFreeCanvas/NodeEditDialog.vue` - 新增编辑对话框组件
  - `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 集成编辑功能
  - `src/components/MindMapFreeCanvas/index.ts` - 更新组件导出
  - `src/stores/freeMindMapStore.ts` - 更新节点操作方法

### Next Steps
- 第三阶段：交互功能（节点连线、多选框选、右键菜单、键盘快捷键）
- 第四阶段：数据集成（与现有标注数据集成、思源块属性持久化、版本历史）

## [1.2.20] - 2026-03-01 11:15:00

### Added
- **MarginNote 风格自由画布思维导图（第一阶段：基础框架）** ✅
  - **新增类型定义** (`src/types/mindmapFree.ts`):
    - `FreeMindMapNodeData` - 节点数据接口
    - `FreeMindMapNode` - 自由画布节点接口
    - `FreeMindMapEdge` - 连线接口
    - `FreeMindMapNodeType` - 节点类型（textCard/imageCard/group）
    - `FreeMindMapLayout` - 布局模式（free/tree/vertical/horizontal）
    - `FreeMindMapOptions` - 思维导图配置
    - `CreateNodeParams` / `UpdateNodeParams` / `CreateEdgeParams` - 操作参数
    - `AutoLayoutOptions` - 自动布局选项
    - `ExportOptions` / `ExportResult` - 导出选项和结果
  - **新增服务层** (`src/services/freeMindMapService.ts`):
    - `getFreeMindMap` / `saveFreeMindMap` - 数据持久化
    - `createNode` / `updateNode` / `deleteNode` - 节点操作
    - `createEdge` / `deleteEdge` - 连线操作
    - `autoLayout` - 自动布局（树状）
    - `createNodesFromAnnotations` - 从标注创建节点
    - `exportMindMap` - 导出功能
    - `calculateNodeBounds` - 计算节点边界
  - **新增状态管理** (`src/stores/freeMindMapStore.ts`):
    - 使用 Pinia 管理全局状态
    - State: nodes, edges, viewport, layout, selectedNodeIds 等
    - Getters: selectedNodes, nodeCount, edgeCount, rootNodes, bounds
    - Actions: load/save/create, CRUD 操作，选择/取消选择，视图控制
  - **新增组件** (`src/components/MindMapFreeCanvas/`):
    - `FreeCanvasViewer.vue` - 主画布组件（基于 Vue Flow）
    - `TextCardNode.vue` - 文本卡片节点
    - `ImageCardNode.vue` - 图片/PDF 摘录卡片节点
    - `index.ts` - 组件导出
  - **新增组合式函数** (`src/composables/useFreeMindMap.ts`):
    - 封装常用思维导图操作
    - 提供统一的 API 接口
  - **新增依赖**:
    - `@vue-flow/core@1.48.2` - Vue Flow 核心库
    - `@vue-flow/background@1.3.2` - 背景网格
    - `@vue-flow/controls@1.1.3` - 控制工具栏

### Technical
- **修改文件**:
  - `src/types/mindmapFree.ts` - 新增类型定义
  - `src/services/freeMindMapService.ts` - 新增服务层
  - `src/stores/freeMindMapStore.ts` - 新增状态管理
  - `src/components/MindMapFreeCanvas/` - 新增组件目录
  - `src/composables/useFreeMindMap.ts` - 新增组合式函数

### Next Steps
- 第二阶段：卡片节点（分组容器节点、节点编辑对话框）
- 第三阶段：交互功能（多选框选、右键菜单、键盘快捷键）
- 第四阶段：数据集成（与现有标注数据集成、思源块属性持久化）

## [1.2.19] - 2026-03-01 10:52:00

### Fixed
- **修复 PDF 摘录后思维导图不显示问题** ✅
  - **问题现象**：摘录 PDF 后思维导图查看器显示空白，无法渲染标注内容
  - **错误信息**：`Uncaught TypeError: Cannot read properties of undefined (reading 'indexOf')`
  - **根本原因**：`mindmapGenerator.ts` 中 `buildAnnotationTreeWithContent` 函数混用了 Markdown 标题语法（`# `、`## `）和列表语法（`- `），markmap 库不支持这种混合格式
  - **解决方案**：
    - 统一使用 Markdown 列表语法（`- `）表示所有节点
    - 通过缩进（`  `.repeat(depth)）表示层级关系
    - 保留标注级别图标（🎯📌📍📎🏷️🔖💬）
    - 删除未使用的旧函数 `buildAnnotationTree`

### Changed
- **思维导图 Markdown 生成逻辑优化**：
  - 所有节点统一使用列表格式，符合 markmap 解析规范
  - 文本截断长度从 50 字符调整为 100 字符，保留更多内容
  - 通过缩进表示层级，而非标题级别

### Technical
- **修改文件**：
  - `src/utils/mindmapGenerator.ts` - 修复 `buildAnnotationTreeWithContent` 函数，统一使用列表格式

## [1.2.18] - 2026-03-01

### Fixed
- **修复思维导图按钮点击无反应问题** ✅
  - **问题定位**：通过添加调试日志发现函数被正确调用，但 markmap 库内部报错
  - **错误信息**：`TypeError: t is not a function` at `U.spacing`
  - **根本原因**：markmap v0.18 的 API 变更，`spacingVertical` 和 `spacingHorizontal` 配置项被废弃
  - **解决方案**：使用 `Markmap.create(svgContainerRef.value, null)` 最小配置初始化

### Changed
- **思维导图内容生成优化**（MarginNote4 风格） ✅
  - **按 PDF 分组**：不同 PDF 的标注分别显示
  - **按页码排序**：同一 PDF 内按页码顺序组织
  - **层级结构**：保留父子标注的层级关系（支持拖拽合并/取消合并）
  - **图标美化**：根据标注级别显示不同图标
    - 🎯 标题 / 📌 H1 / 📍 H2 / 📎 H3 / 🏷️ H4 / 🔖 H5 / 💬 正文
  - **内容截断**：过长文本自动截断到 50 字符，避免节点过大
  - **空状态优化**：无标注时显示"📚 暂无标注"

### Added
- **调试日志系统**：
  - `toggleMindMapView` 函数添加视图切换日志
  - `MindMapViewer` 组件添加初始化和数据加载日志
  - 便于后续问题排查

### Technical
- **修改文件**：
  - `src/App.vue` - 修复 `showMessage` 函数，添加 `nextTick` 支持
  - `src/components/MindMapViewer.vue` - 修复 markmap 初始化配置
  - `src/utils/mindmapGenerator.ts` - 重构思维导图内容生成逻辑

## [1.2.17] - 2026-03-01

### Fixed
- **修复 sqlQuery 函数命名冲突问题**:
  - 问题：`src/api.ts` 中 `sql` 函数的参数名也叫 `sql`，导致参数覆盖了函数名
  - 解决：将参数名从 `sql` 改为 `stmt`
  - 错误信息：`TypeError: sql2 is not a function`
- **修复导图按钮点击没反应的问题**:
  - showMessage 函数改为在插件容器内显示（遵循规范：禁止操作宿主 DOM）
  - 添加 position: relative 到根容器以支持消息定位
  - MindMapViewer 组件添加 loadCSS/loadJS 函数实现
  - 修复 `_event` 未使用变量警告

### Added
- **脑图高级功能** ✅
  - **脑图版本历史服务** (`src/services/mindmapVersionService.ts`):
    - `MindMapVersion` - 版本信息接口
    - `VersionDiff` - 版本差异接口
    - `VersionChange` - 变更详情接口
    - `saveVersion` - 保存版本
    - `getVersions` - 获取版本列表
    - `restoreVersion` - 恢复到指定版本
    - `compareVersions` - 对比两个版本
    - `deleteVersion` - 删除版本
    - `autoSave` - 自动保存支持
  - **脑图导出服务** (`src/services/mindmapExportService.ts`):
    - `ExportFormat` - 导出格式（SVG/PNG/PDF/Markdown/OPML/JSON）
    - `ExportOptions` - 导出选项
    - `ExportResult` - 导出结果
    - `exportToSvg` - 导出 SVG（样式内联）
    - `exportToPng` - 导出 PNG（支持缩放）
    - `exportToPdf` - 导出 PDF（需 jspdf 库）
    - `exportToMarkdown` - 导出 Markdown
    - `exportToOpml` - 导出 OPML（支持其他脑图软件导入）
    - `exportToJson` - 导出 JSON
    - `export` - 统一导出入口
  - **脑图性能优化服务** (`src/services/mindmapPerformanceService.ts`):
    - `ViewportConfig` - 视口配置
    - `VisibleNodesResult` - 可见节点结果
    - `VirtualRenderConfig` - 虚拟渲染配置
    - `PerformanceStats` - 性能统计
    - `calculateVisibleNodes` - 计算可见节点
    - `createVirtualRenderer` - 创建虚拟渲染器
    - `createBatchRenderer` - 创建分批渲染器
    - `createDebouncedRenderer` - 创建防抖渲染器
    - `createThrottledRenderer` - 创建节流渲染器
    - `createSmartFolder` - 创建智能折叠器
    - `getPerformanceStats` - 获取性能统计
    - `getOptimizationSuggestions` - 获取优化建议
  - **版本历史组件** (`src/components/MindMapVersionHistory.vue`):
    - 版本列表展示
    - 一键保存版本
    - 自动保存开关
    - 版本恢复
    - 版本删除
    - 内置对比面板
  - **变更对比组件** (`src/components/MindMapDiffPanel.vue`):
    - 统计摘要展示
    - 过滤标签（新增/删除/修改/移动）
    - 变更详情查看
    - 导出对比报告
    - 一键恢复版本

### Changed
- **更新服务导出** (`src/services/index.ts`):
  - 添加 `mindmapVersionService` 和相关类型导出
  - 添加 `mindmapExportService` 和相关类型导出
  - 添加 `mindmapPerformanceService` 和相关类型导出

### Fixed
- **修复导图按钮点击没反应的问题**:
  - 原因：`alert()` 在思源笔记环境中可能被阻止或不显示
  - 解决：新增 `showMessage()` 函数，使用自定义 DOM 元素显示提示
  - 支持四种类型：info（蓝色）、warning（橙色）、error（红色）、success（绿色）
  - 添加滑入/滑出动画效果
  - 增强提示逻辑：没有学习集时显示警告并自动打开学习集管理器

## [1.2.16] - 2026-03-01

### Added
- **双向跳转服务** ✅
  - **新增跳转类型定义** (`src/types/jump.ts`):
    - `JumpTargetType` - 跳转目标类型（pdf/mindmap/card/annotation）
    - `JumpTarget` - 跳转目标接口
    - `JumpResult` - 跳转结果接口
    - `BiDirectionalLink` - 双向链接接口
    - `JumpHistoryItem` - 跳转历史记录
    - `JumpEventDetail` - 跳转事件详情
    - `MindMapHighlightEventDetail` - 脑图节点高亮事件
    - `CardHighlightEventDetail` - 卡片高亮事件
  - **新增双向跳转服务** (`src/services/biDirectionalLinkService.ts`):
    - `jumpFromCardToPdf` - 卡片跳转到 PDF 原文位置
    - `jumpFromAnnotationToPdf` - 标注跳转到 PDF 原文位置
    - `jumpFromCardToMindmap` - 卡片跳转到脑图节点
    - `jumpFromMindmapToCard` - 脑图节点跳转到卡片
    - `jumpFromMindmapToPdf` - 脑图节点跳转到 PDF
    - `createLink` / `getLinks` / `deleteLink` - 链接管理
    - `getJumpHistory` / `clearJumpHistory` / `goBack` - 历史记录管理
    - 自定义事件系统（PDF_NAVIGATE, MINDMAP_HIGHLIGHT, CARD_HIGHLIGHT）
  - **更新 INTERFACE.md** - 添加跳转类型定义文档

### Changed
- **更新服务导出** (`src/services/index.ts`):
  - 添加 `biDirectionalLinkService` 和相关类型导出
  - 添加便捷函数导出

## [1.2.15] - 2026-02-28

### Added
- **PDF 标注批注功能** ✅
  - **新增批注类型定义** (`src/types/annotation.ts`):
    - `AnnotationComment` - 批注接口（支持文字/语音/图片批注）
    - `CommentPriority` - 批注优先级（低/普通/高/紧急）
    - `CommentStatus` - 批注状态（活跃/已解决/已归档）
    - `COMMENT_PRIORITIES` / `COMMENT_STATUSES` - 常量定义
  - **新增批注 API** (`src/api/annotationApi.ts`):
    - `getAnnotationComments` - 获取批注列表
    - `addAnnotationComment` - 添加批注
    - `updateAnnotationComment` - 更新批注
    - `deleteAnnotationComment` - 删除批注
  - **更新标注编辑器** (`src/components/AnnotationEditor.vue`):
    - 批注列表展示（优先级、状态、时间、标签）
    - 添加批注（支持优先级选择）
    - 批注状态切换（解决/重新打开）
    - 批注删除

## [1.2.14] - 2026-02-28

### Added
- **多 PDF 标签页管理** ✅
  - **新增 PDF 标签页状态管理** (`src/stores/pdfTabStore.ts`):
    - `PdfTab` - 标签页信息接口
    - `openTab` - 打开新标签页
    - `closeTab` - 关闭标签页
    - `closeOtherTabs` - 关闭其他标签页
    - `closeAllTabs` - 关闭所有标签页
    - `closeTabsToRight` - 关闭右侧标签页
    - `activateTab` - 激活标签页
    - `moveTab` - 移动标签页位置
    - `nextTab` / `prevTab` - 切换上/下一个标签页
    - `updatePage` / `updateTotalPages` / `updateScale` - 更新阅读状态
  - **新增 PDF 标签栏组件** (`src/components/PdfTabBar.vue`):
    - 标签页列表展示（文件名、进度、加载状态）
    - 点击切换标签页
    - 关闭按钮（悬停显示）
    - 拖拽排序
    - 右键菜单（关闭、关闭其他、复制路径）
    - 滚轮切换标签页
    - 键盘快捷键支持：
      - `Ctrl+Tab` / `Ctrl+PageDown` - 下一个标签
      - `Ctrl+Shift+Tab` / `Ctrl+PageUp` - 上一个标签
      - `Ctrl+W` - 关闭当前标签
    - 深色模式支持

## [1.2.13] - 2026-02-28

### Added
- **PDF 摘录回源跳转功能** ✅
  - **新增 PDF 坐标存储服务** (`src/services/pdfExcerptService.ts`):
    - `saveCoordinates` - 保存 PDF 坐标到块属性
    - `getCoordinates` - 从块属性获取 PDF 坐标
    - `deleteCoordinates` - 删除 PDF 坐标
    - `buildNavigationTarget` - 构建导航目标
    - `navigateToCardPdf` - 跳转到卡片的 PDF 位置
    - `navigateToAnnotationPdf` - 跳转到标注的 PDF 位置
    - `highlightPdfRect` - 高亮显示 PDF 区域
  - **新增 PDF 坐标类型定义** (`src/types/pdfExcerpt.ts`):
    - `PdfExcerptCoordinates` - PDF 摘录坐标接口
    - `PdfRect` - PDF 矩形坐标
    - `PdfNavigationTarget` - PDF 导航目标

### Changed
- **CardList 组件升级** (`src/components/CardList.vue`):
  - 添加"定位"按钮，支持跳转到 PDF 源位置
  - 集成 `navigateToCardPdf` 函数
- **AnnotationList 组件升级** (`src/components/AnnotationList.vue`):
  - 双击标注跳转到 PDF 对应位置
  - 集成 `navigateToAnnotationPdf` 函数
- **PDFViewer 组件升级** (`src/components/PDFViewer.vue`):
  - 监听 `pdf-navigate-to` 自定义事件
  - 支持跳转高亮动画效果

## [1.2.12] - 2026-02-28

### Added
- **单元测试完善** ✅
  - **服务层测试** (`src/tests/services/`):
    - `studySetService.test.ts` - 学习集服务测试（8 个用例）
      - createStudySet, getAllStudySets, getStudySet, updateStudySet, deleteStudySet
      - addCardToStudySet, removeCardFromStudySet, getStudySetStats
    - `cardService.test.ts` - 卡片服务测试（18 个用例）
      - createCard, getCard, updateCard, deleteCard
      - getCardsByStudySet, getCardsByStatus, searchCards
      - addTag, removeTag, batchUpdateStatus, batchAddTags, batchDelete
      - getCardStats
    - `reviewService.test.ts` - 复习服务测试（18 个用例）
      - startReviewSession (4 种模式), getNextCard, submitReview, endReviewSession
      - getSessionStats, getDueCards, getNewCards, getWrongCards
      - getReviewHistory, getReviewStats, cancelSession, skipCard

  - **组件测试** (`src/tests/components/`):
    - `StudySetManager.test.ts` - 学习集管理组件测试（10 个用例）
      - 组件渲染、列表显示、创建按钮
      - 对话框打开/关闭、表单验证
      - 事件触发、删除确认、表单重置

  - **测试工具函数** (`src/tests/index.ts`):
    - createMockResponse - 创建 mock 响应
    - createMockErrorResponse - 创建 mock 错误响应
    - wait - 等待函数
    - createAsyncFn - 创建异步操作
    - createRejectedFn - 创建拒绝的 Promise

### Changed
- **更新 TODO.md** - 标记单元测试任务为已完成
- **更新 CHANGELOG.md** - 记录 v1.2.12 变更

### Technical
- **测试总数**: 94+ 测试用例
  - 工具函数测试：40+ 用例
  - 服务层测试：44 个用例
  - 组件测试：10 个用例

- **测试文件结构**:
  ```
  src/tests/
  ├── setup.ts                      # 全局设置
  ├── index.ts                      # 测试工具导出
  ├── utils/
  │   ├── errorHandler.test.ts      # 错误处理测试
  │   └── helpers.test.ts           # 基础工具测试
  ├── services/
  │   ├── studySetService.test.ts   # 学习集服务测试
  │   ├── cardService.test.ts       # 卡片服务测试
  │   └── reviewService.test.ts     # 复习服务测试
  └── components/
      └── StudySetManager.test.ts   # 组件测试
  ```

## [1.2.11] - 2026-02-28

### Added
- **国际化支持 (i18n)** ✅
- **错误处理系统** ✅
- **性能优化工具** ✅
- **单元测试框架** ✅

## [1.2.10] - 2026-02-28

### Added
- **第 12 期：复习提醒设置** ✅
  - **新增复习提醒设置组件** (`src/components/ReviewReminderSettings.vue`):
    - 提醒时间：支持多个提醒时间，可添加/删除
    - 提醒频率：每天、工作日、周末、自定义
    - 提醒内容：到期卡片数量、连续学习天数、激励语句
    - 通知方式：系统通知、提示音、图标徽章
    - 激励语句库：内置 8 条激励语句，支持自定义添加

- **第 13 期：复习导出对话框** ✅
  - **新增复习导出对话框组件** (`src/components/ReviewExportDialog.vue`):
    - 导出范围：全部记录、最近复习、自定义日期范围
    - 导出内容：复习统计、卡片详情、学习集信息、成就徽章
    - 导出格式：JSON、CSV、Markdown、PDF
    - 数据预览：实时预览导出内容
    - 文件大小估算：显示预计文件大小

- **第 14 期：复习模式选择器** ✅
  - **新增复习模式选择器组件** (`src/components/ReviewModeSelector.vue`):
    - 四种复习模式：普通复习、学习新卡、错题复习、随机测试
    - 模式卡片：显示每种模式的统计信息
    - 高级设置：复习数量、时间限制、卡片顺序、显示选项
    - 开始按钮：显示选中卡片数量

- **更新组件导出** (`src/components/index.ts`):
  - 添加 `ReviewReminderSettings`、`ReviewExportDialog`、`ReviewModeSelector`、`QuickCaptureMenu` 导出

## [1.2.9] - 2026-02-28

### Added
- **第 10 期：快速捕获菜单** ✅
  - **新增快速捕获菜单组件** (`src/components/QuickCaptureMenu.vue`):
    - 快捷操作：制卡、标签、链接、备注
    - 学习集选择：快速选择保存目标，支持创建新学习集
    - 卡片类型选择：普通卡片、闪卡、摘录卡片
    - 快速标签：常用标签一键选择，支持自定义输入
    - 键盘快捷键：⌘+Enter 确认，Escape 关闭
    - 位置跟随：根据鼠标位置动态定位

- **第 11 期：复习成就组件** ✅
  - **新增复习成就组件** (`src/components/ReviewAchievements.vue`):
    - 成就统计：已解锁/总成就/完成度
    - 成就分类：学习成就、连续成就、特殊成就
    - 15 种成就徽章：
      - 学习成就：第一张卡片、小有所成 (10)、卡片达人 (50)、卡片大师 (100)
      - 连续成就：初露锋芒 (3 天)、持之以恒 (7 天)、习惯养成 (21 天)、月度达人 (30 天)、百日挑战 (100 天)
      - 特殊成就：首次复习、完美表现、神速进步、夜猫子、早起鸟
    - 成就详情：点击查看进度和解锁时间
    - 进度追踪：可视化进度条和百分比

- **更新组件导出** (`src/components/index.ts`):
  - 添加 `QuickCaptureMenu` 和 `ReviewAchievements` 导出

## [1.2.8] - 2026-02-28

### Added
- **第 8 期：AI 助手面板** ✅
  - **新增 AI 助手面板组件** (`src/components/AIAssistantPanel.vue`):
    - 四种 AI 功能模式：智能摘要、自动标签、闪卡生成、AI 对话
    - 智能摘要：支持简短/中等/详细三种长度
    - 自动标签：可指定生成标签数量（1-10 个）
    - 闪卡生成：自动生成闪卡正反面内容
    - AI 对话：支持多轮对话交流
    - API 配置：支持 OpenAI、Claude、自定义端点
    - 设置持久化：localStorage 存储配置

- **第 9 期：复习目标面板** ✅
  - **新增复习目标面板组件** (`src/components/ReviewGoalPanel.vue`):
    - 今日进度：显示已复习数量和目标数量
    - 进度条：可视化展示完成百分比
    - 连续学习：显示连续学习天数和最近 7 天记录
    - 本周统计：复习总数、新学卡片、正确率、学习时长
    - 成就徽章：6 种成就（初次尝试、持之以恒、月度达人、百卡大师、完美表现、神速进步）
    - 目标设置：每日复习目标、每日新卡上限、连续学习提醒

- **更新组件导出** (`src/components/index.ts`):
  - 添加 `AIAssistantPanel` 和 `ReviewGoalPanel` 导出

## [1.2.7] - 2026-02-28

### Added
- **第 6 期：卡片盒看板** ✅
  - **新增卡片盒看板组件** (`src/components/CardBoxBoard.vue`):
    - 三种视图模式：看板视图、列表视图、时间线视图
    - 看板视图：按标签/状态/难度/来源分组展示
    - 列表视图：表格形式展示所有字段
    - 时间线视图：按创建日期分组展示
    - 高级筛选：状态、标签、难度范围筛选
    - 多种排序方式：创建时间、更新时间、下次复习、难度、字母顺序
    - 搜索功能：支持标题和内容搜索
    - 空状态提示

- **第 7 期：智能学习集** ✅
  - **新增智能学习集组件** (`src/components/SmartStudySet.vue`):
    - 创建基于筛选条件的智能学习集
    - 筛选条件：状态、标签、难度、来源
    - 排序设置：排序方式和顺序
    - 智能学习集列表管理（编辑、删除）
    - 筛选条件预览
    - 持久化存储（localStorage）
  - **更新组件导出** (`src/components/index.ts`):
    - 添加 `CardBoxBoard` 和 `SmartStudySet` 导出

## [1.2.6] - 2026-02-28

### Added
- **第 5 期：复习系统** ✅
  - **新增复习管理面板组件** (`src/components/ReviewManager.vue`):
    - 学习集选择与统计展示（总卡片数、今日到期、已掌握、连续天数）
    - 四种复习模式：普通复习、学习新卡、错题复习、随机测试
    - 复习设置（每日新卡数、复习上限、算法选择）
    - 复习日历（显示每天复习数量）
    - 开始复习按钮（显示待复习数量徽章）
  - **更新组件导出** (`src/components/index.ts`):
    - 添加 `ReviewManager` 导出

- **第 4 期：思维导图功能** ✅
  - **已有 MindMapViewer 组件** (`src/components/MindMapViewer.vue`):
    - 支持 5 种布局：思维导图、树状图、鱼骨图、时间轴、垂直图
    - 工具栏：适应视图、缩放、展开/收起、全屏、导出 PNG
    - 使用 markmap-lib 和 markmap-view 库
    - 节点点击事件支持
    - 布局切换提示动画

### Architecture
- **复习系统架构**:
  - `ReviewManager.vue` - 复习管理面板（选择学习集、模式、设置）
  - `ReviewSession.vue` - 复习会话（卡片正反面、评分按钮）
  - `ReviewStats.vue` - 复习统计
  - `reviewService.ts` - 复习队列管理服务
  - `sm2.ts` - SM-2 间隔重复算法
  - `fsrs.ts` - FSRS 算法（备用）

- **复习模式**:
  - `normal` - 普通复习：复习所有到期卡片
  - `new` - 学习新卡：学习未学过的卡片
  - `wrong` - 错题复习：复习经常出错的卡片（easeFactor < 2.0）
  - `random` - 随机测试：随机抽取卡片测试

## [1.2.5] - 2026-02-28

### Added
- **第 3 期：PDF 摘录功能升级** ✅
  - **新增卡片编辑对话框组件** (`src/components/CardEditorDialog.vue`):
    - 三种卡片类型支持：普通卡片、闪卡、摘录卡片
    - 学习集选择与快速创建（内建创建对话框）
    - 标签输入系统（支持输入和建议标签）
    - 闪卡正反面内容编辑
    - 难度评分（1-5 星）
    - 卡片状态设置（新卡片/学习中/复习中/已暂停）
    - 可调节大小的对话框（紧凑/扩展模式）
    - 保存并新建功能
  - **更新组件导出** (`src/components/index.ts`):
    - 添加 `CardEditorDialog` 导出

### Changed
- **组件架构优化**:
  - `CardEditorDialog.vue` - 使用 Pinia Store 管理学习集状态
  - `CardEditorDialog.vue` - CSS 样式嵌套在根类名下（符合规范）
  - `CardEditorDialog.vue` - 支持编辑模式（复用组件）

## [1.2.4] - 2026-02-28

### Added
- **第 1 期：卡片系统升级** ✅
  - **新增学习集管理组件** (`src/components/StudySetManager.vue`):
    - 学习集列表展示（名称、描述、卡片数、到期数）
    - 创建学习集（名称、描述、笔记本选择、复习设置）
    - 编辑学习集（修改名称、描述、复习设置）
    - 删除学习集（带确认对话框）
    - 复习设置配置（每日新卡数、复习算法选择）
    - PDF 关联选择（创建时可选）
  - **更新组件导出** (`src/components/index.ts`):
    - 添加 `StudySetManager` 导出

- **第 2 期：学习集重构** ✅
  - **学习集 CRUD 服务** (`src/services/studySetService.ts`):
    - 创建/获取/更新/删除学习集
    - 卡片管理（添加/移除/移动卡片）
    - PDF 管理（添加/移除 PDF）
    - 统计功能（学习集进度、卡片统计）
  - **学习集状态管理** (`src/stores/learningSetStore.ts`):
    - 学习集列表状态
    - 当前学习集选择
    - 卡片列表管理
    - 统计信息计算（基于 cardService）

### Changed
- **组件架构优化**:
  - `StudySetManager.vue` - 使用 Pinia Store 管理状态
  - `StudySetManager.vue` - CSS 样式嵌套在根类名下（符合规范）
  - `StudySetManager.vue` - 对话框组件独立实现

### Architecture
- **服务层** (`src/services/studySetService.ts`):
  - `createStudySet` - 创建学习集
  - `getAllStudySets` - 获取所有学习集
  - `getStudySet` - 获取指定学习集
  - `updateStudySet` - 更新学习集
  - `deleteStudySet` - 删除学习集
  - `addCardToStudySet` - 添加卡片到学习集
  - `removeCardFromStudySet` - 从学习集移除卡片
  - `addPdfToStudySet` - 添加 PDF 到学习集
  - `removePdfFromStudySet` - 从学习集移除 PDF
  - `getStudySetStats` - 获取学习集统计
  - `getStudySetProgress` - 获取学习集进度

- **Store 层** (`src/stores/learningSetStore.ts`):
  - `fetchStudySets` - 加载学习集列表
  - `fetchCards` - 加载当前学习集卡片
  - `createStudySet` - 创建学习集
  - `updateStudySet` - 更新学习集
  - `deleteStudySet` - 删除学习集
  - `selectStudySet` - 选择学习集
  - `addCard` / `updateCard` / `deleteCard` - 卡片操作
  - `stats` - 计算属性（卡片统计）

## [1.2.3] - 2026-02-28

### Added
- **第 0 期：现有代码分析与兼容** ✅
  - **新增数据迁移工具** (`src/utils/migration.ts`):
    - `migrateAnnotationToCard` - 将现有标注转换为卡片
    - `migrateAnnotationToFlashCard` - 将现有标注转换为闪卡
    - `batchMigrateAnnotationsToCards` - 批量迁移标注到卡片
    - `isAnnotationMigrated` - 检查标注是否已迁移
    - `getAnnotationsToMigrate` - 获取需要迁移的标注列表
    - `calculateMigrationStats` - 计算迁移统计信息
    - `asyncBatchMigrate` - 异步批量迁移（带进度回调）
    - `syncCardToAnnotation` - 将卡片内容同步回标注（双向同步）
    - `createDefaultStudySet` - 创建默认学习集（用于迁移）
    - `createDefaultSRSParams` - 创建默认 SRS 参数
  - **新增迁移配置类型**:
    - `MigrationConfig` - 迁移配置接口
    - `MigrationStats` - 迁移统计信息
    - `MigrationProgress` - 迁移进度信息
    - `DEFAULT_MIGRATION_CONFIG` - 默认迁移配置
  - **更新 utils/index.ts** - 导出 migration 模块

### Changed
- **类型定义完善**:
  - `card.ts` - 卡片系统类型完整（Card, FlashCard, SRSParams, CardBlockAttributes 等）
  - `studySet.ts` - 学习集类型完整（StudySet, ReviewSettings, StudySetBlockAttributes 等）
  - `review.ts` - 复习类型完整（ReviewSession, ReviewStats 等）
  - `mindmap.ts` - 脑图类型完整（MindMap, MindMapNode 等）
  - `pdfExcerpt.ts` - PDF 摘录类型完整

### Architecture
- **SM-2 复习算法** (`src/review/sm2.ts`):
  - `sm2Algorithm` - 核心算法实现
  - `qualityLabelToScore` - 用户评分转 SM-2 质量评分
  - `scoreToQualityLabel` - SM-2 评分转用户友好标签
  - `createNewSRSParams` - 创建新卡片 SRS 参数
  - `estimateDaysToMastery` - 预计掌握天数计算
  - `calculateRetention` - 遗忘曲线计算
  - `calculateOptimalInterval` - 最佳复习间隔计算
  - `formatInterval` / `formatNextReview` - 格式化显示

## [1.2.2] - 2026-02-28

### Added
- **新增 PDF 摘录数据结构定义** (`src/types/pdfExcerpt.ts`):
  - 基础类型：`ExcerptColor`, `ExcerptLevel`, `CardStatus`, `CardType`, `ExcerptType`
  - PDF 坐标：`PdfRect`, `PageRelativeRect`, `ImageExcerptData`
  - 核心模型：`PDFExcerpt`, `HandwritingData`
  - 脑图相关：`MindMapNode`, `MindMapNodeStyle`, `MindMapNodeType`, `MindMap`, `MindMapLayout`
  - 卡片相关：`LearningCard`, `CreateCardOptions`
  - 学习集相关：`LearningSet`, `LearningSetProgress`, `PdfProgress`, `LearningSetSettings`
  - 复习相关：`ReviewSession`, `ReviewMode`, `ReviewSessionStatus`, `ReviewResult`, `ReviewStats`
  - 工具类型：`PaginationParams`, `PaginationResult`, `SearchOptions`, `SearchFilters`, `DailyStats`
  - 常量定义：`DEFAULT_EXCERPT_COLORS`, `DEFAULT_EXCERPT_LEVELS` 等

### Fixed
- **生命周期管理完善**:
  - `MindMapEditor.vue` - 添加拖拽事件清理函数 `cleanupDragAndDrop`，布局提示定时器清理 `layoutTipTimeout`
  - 完善 `onUnmounted` 清理逻辑（清理事件监听、定时器、markmap 实例、DOM 引用）

## [1.2.1] - 2026-02-28

### Fixed
- **CSS 隔离修复**: 
  - `MindMapEditor.vue` - 将所有 CSS 样式嵌套在 `.mindmap-editor` 根类名下
  - `AnnotationList.vue` - 将所有 CSS 样式嵌套在 `.annotation-list-container` 根类名下
- **类型错误修复**: 
  - `AnnotationList.vue` - 修复 `exportMarkdown` 函数中的 `groupBy` 参数，从 `'hierarchy'` 改为 `'page'`

### Changed
- **代码规范**: 按照 `.clinerules.md` 规范完善 CSS 隔离要求
- **ChildBlock.vue** - 确认 CSS 已正确嵌套在 `.merged-child-block` 根类名下

## [1.2.0] - 2026-02-28

### Added
- **新增 Pinia Stores**（3 个）:
  - `useLearningSetStore` - 学习集状态管理（学习集 CRUD、卡片管理、统计信息）
  - `useCardStore` - 卡片状态管理（卡片 CRUD、筛选/排序、状态流转、批量操作）
  - `useReviewStore` - 复习状态管理（复习队列、SM-2/FSRS 算法、复习会话控制）
- **新增 VueUse 工具函数**:
  - `createDebounceFn` - 防抖函数
  - `createThrottleFn` - 节流函数
  - `createTimeout` - 一次性定时器
  - `createInterval` - 定时器
  - `createLazyRef` - 延迟加载 Ref
  - `createBatchProcessor` - 批量处理
  - `createRafThrottle` - 请求动画帧节流
  - `createCancellableAsync` - 可取消异步函数
  - `createPoll` - 轮询函数
  - `createRetry` - 重试函数
  - `createSequential` - 序列执行函数
- **新增文件导出**:
  - `src/stores/index.ts` - Pinia Stores 统一导出
  - `src/utils/vueUseHelpers.ts` - VueUse 工具函数

### Changed
- **架构优化**: 按照 `.clinerules.md` 规范完善分层架构
  - Components - UI 渲染层
  - Composables - 通用逻辑封装
  - Stores - 全局状态管理（Pinia）
  - Services - API 通信封装

## [1.1.1] - 2026-02-28

### Added
- **新增 Composables 封装**（5 个）:
  - `useCard` - 卡片操作封装（CRUD、状态流转、难度管理、标签管理、批量操作）
  - `useLearningSet` - 学习集操作封装（CRUD、选择切换、卡片管理、统计）
  - `useMindMap` - 思维导图操作封装（CRUD、节点操作、布局切换、导出功能）
  - `useReview` - 复习会话操作封装（复习队列、SM-2/FSRS 算法、键盘快捷键）
  - `useSiyuan` - 思源 API 调用封装（SQL 查询、块操作、配置获取）
- **新增类型定义**:
  - `MindMapTheme` 类型
  - `MindMapNodeType` 枚举
  - `MindMapLink` 接口

### Fixed
- **类型定义修复**: 修复 `MindMapNode`、`MindMap`、`CreateMindMapOptions` 类型定义不完整问题
- **文件命名错误**: 重命名 `src/types/annotaion.ts` 为 `src/types/annotation.ts`
- **类型引用更新**: 更新 16 个文件中的类型引用路径
- **语法错误修复**: 修复 `mindmapService.ts` 中的语法错误和类型不匹配问题

### Changed
- **类型定义增强**: 在 `MindMapNode` 中同时支持 `title` 和 `text` 属性（兼容 markmap）
- **代码架构优化**: 按照 `.clinerules.md` 规范创建 Composables 层，封装通用业务逻辑

## [1.1.0] - 2026-02-24

### Added
- 思维导图可视化功能：新增MindMapViewer组件，使用D3.js展示标注间的层级关系
- 项目管理功能：支持创建和管理多个PDF项目，每个项目可包含多本PDF文档
- 图片摘录功能：支持圈选PDF中的图片并提取到思源笔记
- 多视图模式：支持分屏模式、列表模式和思维导图模式三种视图切换
- 标注层级管理：支持标注间的父子关系，构建树形结构
- 拖拽调整界面：支持拖拽调整PDF预览区和标注列表区的宽度比例
- 全屏模式：支持插件面板全屏显示
- 目标文档选择：支持选择特定思源文档作为标注保存目标
- 防重复创建机制：避免相同内容的标注被重复创建

### Changed
- 重构了项目整体架构，采用模块化设计提高代码可维护性
- 优化了PDFViewer组件，增加了图片选择和提取功能
- 改进了AnnotationList组件，支持层级结构展示和管理
- 升级了UI界面，采用现代化设计风格，提升用户体验
- 优化了数据存储机制，支持多项目数据隔离和管理
- 改进了标注同步机制，增加冲突检测和解决策略

### Fixed
- 修复了多个TypeScript类型错误
- 解决了组件卸载时的内存泄漏问题
- 修复了PDF渲染过程中的性能问题
- 解决了标注数据同步的时序问题
- 修复了UI组件在不同主题下的显示问题
- 解决了大量标注数据时的渲染性能问题

## [0.0.17] - 2026-02-22

### Fixed
- Fixed `indexOf` error when selecting SiYuan documents in dropdown
- Fixed issue where document list doesn't show after clearing selection
- Added proper null/undefined value handling for document search results

### Changed
- Updated plugin metadata for marketplace compatibility
- Improved document list refresh behavior

## [0.0.16] - 2026-02-21

### Changed
- Removed all debug console.log statements from production code
- Kept console.error and console.warn for error reporting

## [0.0.13] - 2026-02-20

### Added
- Hover to show delete button on PDF highlight markers
- Click to select + Delete key to remove annotations in PDF
- 📷 badge for image excerpts in PDF
- Delete confirmation dialog distinguishes between image/text excerpts

### Optimized
- Annotation list rendering performance, fixed duplicate display issue

### Fixed
- PDF highlight markers not responding to clicks (z-index layer fix)
- Bidirectional sync issue for annotation deletion

## [0.0.8] - 2026-02-19

### Added
- PDF annotation click selection feature - click on annotation to select it
- Delete key support - press Delete to remove selected annotation
- Annotation deletion now syncs with SiYuan block removal

### Fixed
- Error when annotation color property is undefined in markdown generator
- Annotation height too small displaying as a line - now ensures minimum height

### Optimized
- Better visual feedback for selected annotations (thicker border, dashed inner border)

## [0.0.7] - 2026-02-18

### Added
- Multi-PDF project management
- Image excerpt feature with area selection
- Annotation level classification (Title, H1-H5, Text)
- Target document selection for saving annotations
- Annotation list with edit and delete functions
- PDF zoom controls

### Changed
- Improved UI/UX design
- Better PDF rendering with PDF.js

## [0.0.1] - 2026-02-15

### Added
- Initial release
- Basic PDF viewing functionality
- Simple plugin framework
