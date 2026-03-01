# 模块 3：脑图/大纲视图

> 完成度：**97%** | 状态：🔄 v1.2.39 Bug 修复中

---

## ✅ 已完成功能

### 核心功能
- [x] 脑图编辑器 (MindMapEditor) - markmap 集成
- [x] 脑图查看器 (MindMapViewer)
- [x] 5 种布局支持（思维导图、树状图、鱼骨图、时间轴、垂直图）
- [x] 节点操作（拖拽、折叠、展开）
- [x] 脑图链接编辑 (MindMapLinksEditor)
- [x] 脑图反向链接 (MindMapBacklinks)
- [x] 概念图组件 (ConceptMap)
- [x] 大纲视图 (OutlineView)
- [x] 脑图模板选择器 (MindMapTemplateSelector)
- [x] 导出 PNG 功能
- [x] 全屏支持

### 自由画布思维导图（MarginNote 风格）✅ v1.2.23
- [x] 类型定义 (types/mindmapFree.ts)
- [x] 服务层 (services/freeMindMapService.ts)
- [x] 状态管理 (stores/freeMindMapStore.ts)
- [x] 画布组件 (FreeCanvasViewer.vue)
- [x] 文本卡片节点 (TextCardNode.vue)
- [x] 图片卡片节点 (ImageCardNode.vue)
- [x] 分组容器节点 (GroupNode.vue)
- [x] 节点编辑对话框 (NodeEditDialog.vue)
- [x] 右键菜单 (NodeContextMenu.vue)
- [x] 画布工具栏 (CanvasToolbar.vue)
- [x] 组合式函数 (useFreeMindMap.ts)
- [x] 数据集成 (freeMindMapDataIntegrationService.ts)
- [x] 版本历史 (freeMindMapVersionService.ts)
- [x] 思源块属性持久化

### PDF+ 思维导图联动 ✅ v1.2.24
- [x] 联动视图组件 (PdfMindMapLinkViewer.vue)
- [x] 左右分栏布局（PDF+ 自由画布）
- [x] 可调节分隔条
- [x] 自动同步功能
- [x] 标注列表面板
- [x] 双向跳转（导图↔PDF）

### 链接图谱增强 ✅ v1.2.26
- [x] 跨分支关联（虚线连接）
- [x] 远程知识联系
- [x] 一键跳转功能
- [x] 链接图谱面板 (LinksGraphPanel.vue)
- [x] PDF 联动配置 (PdfLinkageSettings.vue)

### 节点搜索与过滤 ✅ v1.2.27
- [x] 节点搜索功能 (MindMapSearch.vue)
- [x] 节点过滤功能 (NodeFilterPanel.vue)
- [x] 5 种过滤类型
- [x] 多条件组合过滤

### 组件清单
| 组件 | 路径 | 状态 |
|------|------|------|
| MindMapEditor | `src/components/MindMapEditor.vue` | ✅ |
| MindMapViewer | `src/components/MindMapViewer.vue` | ✅ |
| MindMapLinksEditor | `src/components/MindMapLinksEditor.vue` | ✅ |
| MindMapBacklinks | `src/components/MindMapBacklinks.vue` | ✅ |
| MindMapTemplateSelector | `src/components/MindMapTemplateSelector.vue` | ✅ |
| MindMapVersionHistory | `src/components/MindMapVersionHistory.vue` | ✅ |
| MindMapDiffPanel | `src/components/MindMapDiffPanel.vue` | ✅ |
| ConceptMap | `src/components/ConceptMap.vue` | ✅ |
| OutlineView | `src/components/OutlineView.vue` | ✅ |
| **自由画布系列** | | |
| FreeCanvasViewer | `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` | ✅ |
| TextCardNode | `src/components/MindMapFreeCanvas/TextCardNode.vue` | ✅ |
| ImageCardNode | `src/components/MindMapFreeCanvas/ImageCardNode.vue` | ✅ |
| GroupNode | `src/components/MindMapFreeCanvas/GroupNode.vue` | ✅ |
| NodeEditDialog | `src/components/MindMapFreeCanvas/NodeEditDialog.vue` | ✅ |
| NodeContextMenu | `src/components/MindMapFreeCanvas/NodeContextMenu.vue` | ✅ |
| CanvasToolbar | `src/components/MindMapFreeCanvas/CanvasToolbar.vue` | ✅ |
| LinksGraphPanel | `src/components/MindMapFreeCanvas/LinksGraphPanel.vue` | ✅ |
| PdfLinkageSettings | `src/components/MindMapFreeCanvas/PdfLinkageSettings.vue` | ✅ |
| MindMapSearch | `src/components/MindMapFreeCanvas/MindMapSearch.vue` | ✅ |
| NodeFilterPanel | `src/components/MindMapFreeCanvas/NodeFilterPanel.vue` | ✅ |

### 服务层
| 服务 | 路径 | 状态 |
|------|------|------|
| mindmapService | `src/services/mindmapService.ts` | ✅ |
| mindmapLinkService | `src/services/mindmapLinkService.ts` | ✅ |
| mindmapLinkEnhanceService | `src/services/mindmapLinkEnhanceService.ts` | ✅ |
| mindmapTemplateService | `src/services/mindmapTemplateService.ts` | ✅ |
| mindmapVersionService | `src/services/mindmapVersionService.ts` | ✅ |
| mindmapExportService | `src/services/mindmapExportService.ts` | ✅ |
| mindmapPerformanceService | `src/services/mindmapPerformanceService.ts` | ✅ |
| mindmapEnhanceService | `src/services/mindmapEnhanceService.ts` | ✅ |
| freeMindMapService | `src/services/freeMindMapService.ts` | ✅ |
| freeMindMapDataIntegrationService | `src/services/freeMindMapDataIntegrationService.ts` | ✅ |
| freeMindMapVersionService | `src/services/freeMindMapVersionService.ts` | ✅ |
| mindMapSearchService | `src/services/mindMapSearchService.ts` | ✅ |
| pdfMindMapLinkageService | `src/services/pdfMindMapLinkageService.ts` | ✅ |

### 状态管理
| Store | 路径 | 状态 |
|------|------|------|
| freeMindMapStore | `src/stores/freeMindMapStore.ts` | ✅ |

### 组合式函数
| Composable | 路径 | 状态 |
|------|------|------|
| useMindMap | `src/composables/useMindMap.ts` | ✅ |
| useMindMapLinkEnhance | `src/composables/useMindMapLinkEnhance.ts` | ✅ |
| useMindMapPerformance | `src/composables/useMindMapPerformance.ts` | ✅ |
| useMindMapSearch | `src/composables/useMindMapSearch.ts` | ✅ |
| usePdfMindMapLinkage | `src/composables/usePdfMindMapLinkage.ts` | ✅ |
| useFreeMindMap | `src/composables/useFreeMindMap.ts` | ✅ |

---

## 📋 待办事项

### v1.2.39 - 思维导图显示 Bug 修复与 MarginNote4 界面仿照 ✅ 已完成

**完成时间**: 2026-03-02

**问题描述**：
1. 思维导图渲染错误：`Cannot read properties of undefined (reading 'length')`
2. `loadCrossLinks` 函数中 `Cannot read properties of undefined (reading 'value')`
3. 组件重复挂载/卸载（多次调用 onMounted）
4. blockId 有时为 undefined
5. 界面与 MarginNote4 差异较大

**已完成修复**：

- [x] **1. 核心 Bug 修复**
  - [x] 修复 `FreeCanvasViewer.vue` 中 `nodes.length` 访问错误（使用 `nodes?.length`）
  - [x] 修复 `loadCrossLinks` 中的 undefined 访问（使用 `mindMapBlockId?.value`）
  - [x] 添加空值保护（`filteredNodes?.length`、`searchResult?.matchedNodeIds?.length`）
  - [x] 修复组件重复渲染问题（优化条件判断）

- [x] **2. 数据加载修复**
  - [x] 确保 blockId 始终有效
  - [x] `confirmMindMapClear` 后重新初始化思维导图块 ID
  - [x] FreeCanvasViewer 添加 try-catch 错误处理

- [x] **3. MarginNote4 界面仿照（第一阶段）**
  - [x] TextCardNode 胶囊样式改造（圆角 20px、紫色渐变）
  - [x] 左侧白色圆点装饰
  - [x] 白色文字 + 阴影效果
  - [x] 悬停动画优化

---

### v1.2.40 - MarginNote4 思维导图核心功能仿照 🔄 进行中

**完成时间**: 2026-03-XX (规划中)
**第一阶段完成时间**: 2026-03-02 ✅

**需求分析**：
根据用户反馈和 MarginNote4 功能对比，当前思维导图缺少以下核心功能：

**当前问题**：
1. ✅ 节点无法展开/折叠（只有折叠状态）- 第一阶段已解决
2. ❌ 节点无法缩放/放大
3. ❌ 无法拖拽叠加（卡片不能重叠放置）
4. ✅ 无法建立父子节点关系 - 第一阶段已解决
5. ❌ 无法合并节点
6. ✅ 缺少节点层级结构显示 - 第一阶段已解决
7. ✅ 无法通过拖拽创建关联 - 第一阶段已解决

**MarginNote4 核心功能列表**：

| 功能类别 | 功能点 | 描述 | 状态 |
|----------|--------|------|------|
| 节点操作 | 展开/折叠 | 点击节点可展开/折叠子节点 | ✅ 第一阶段 |
| 节点操作 | 缩放 | 支持节点大小缩放 | ✅ 第二阶段 |
| 节点操作 | 拖拽叠加 | 卡片可以拖拽并叠加在一起 | ✅ 第二阶段 |
| 节点操作 | 合并节点 | 多个节点可合并为一个 | ✅ 第二阶段 |
| 节点操作 | 拆分节点 | 一个节点可拆分为多个 | ✅ 第二阶段 |
| 关系建立 | 父子关系 | 拖拽创建父子关系 | ✅ 第一阶段 |
| 关系建立 | 跨分支关联 | 创建跨分支的虚线关联 | 🔄 第三阶段 |
| 关系建立 | 关联线编辑 | 编辑关联线颜色/样式 | 🔄 第三阶段 |
| 视图操作 | 缩放画布 | 鼠标滚轮/双指缩放 | ✅ 已有 |
| 视图操作 | 平移画布 | 拖拽空白区域平移 | ✅ 已有 |
| 视图操作 | 适应视图 | 一键显示所有节点 | ✅ 已有 |
| 视图操作 | 节点聚焦 | 搜索后聚焦高亮节点 | ✅ 已有 |
| 布局 | 自动布局 | 树状/垂直/水平布局 | ✅ 已有 |
| 布局 | 手动布局 | 自由拖拽节点位置 | ✅ 已有 |
| 布局 | 分组容器 | 将节点放入分组容器 | ✅ 已有 |

**修复计划**：

- [x] **1. 节点展开/折叠功能** ✅ 第一阶段
  - [x] 添加展开/折叠按钮
  - [x] 实现子节点显示/隐藏逻辑
  - [x] 存储展开/折叠状态
  - [ ] 动画过渡效果

- [ ] **2. 节点缩放功能** ✅ 第二阶段
  - [ ] 添加缩放控制点
  - [ ] 实现拖拽缩放逻辑
  - [ ] 限制最小/最大尺寸
  - [ ] 内容自适应布局

- [ ] **3. 拖拽叠加功能** ✅ 第二阶段
  - [ ] 修改节点碰撞检测
  - [ ] 允许节点重叠放置
  - [ ] 叠加视觉反馈
  - [ ] 叠加层级管理

- [x] **4. 父子关系建立** ✅ 第一阶段
  - [x] 拖拽创建连线
  - [x] 父子关系数据结构
  - [x] 关系线渲染（实线）
  - [x] 关系删除功能

- [ ] **5. 节点合并/拆分** ✅ 第二阶段
  - [ ] 多选节点合并
  - [ ] 合并后内容处理
  - [ ] 拆分节点功能
  - [ ] 合并/拆分动画

- [ ] **6. 跨分支关联** 🔄 第三阶段
  - [ ] 跨分支关联数据结构
  - [ ] 虚线关联渲染
  - [ ] 关联标签/注释
  - [ ] 关联跳转功能

- [ ] **7. 布局优化** 🔄 第三阶段
  - [ ] 树状布局算法
  - [ ] 垂直/水平布局
  - [ ] 自由布局模式
  - [ ] 布局切换动画

**技术难点**：
1. 节点层级关系管理（需要修改数据结构）- ✅ 第一阶段已解决
2. 拖拽叠加与连线的冲突处理
3. 展开/折叠状态持久化
4. 合并/拆分操作的数据一致性

**预计工作量**：约 40-60 小时

---

### v1.2.40 第二阶段 - 节点缩放与合并/拆分 ✅ 已完成

**完成时间**: 2026-03-02

**已完成功能**：

- [x] **节点缩放功能**
  - [x] 缩放手柄 UI（右下角拖拽调整大小）
  - [x] 缩放事件处理（mousedown/mousemove/mouseup）
  - [x] 尺寸限制（最小 180x60px，最大 500x400px）
  - [x] 节点尺寸数据持久化

- [x] **拖拽叠加功能**
  - [x] 禁用网格吸附（snap-to-grid="false"）
  - [x] 点击节点置于顶层（bringToFront）
  - [x] Z 轴层级管理

- [x] **节点合并/拆分功能**
  - [x] 合并到父节点（右键菜单）
  - [x] 从父节点拆分（右键菜单）
  - [x] 合并选中节点（右键菜单）
  - [x] 提取子节点（右键菜单）
  - [x] 快捷键支持（Ctrl+M/S/Shift+M/E）

- [x] **右键菜单增强**
  - [x] hasParent 计算属性
  - [x] hasChildren 计算属性
  - [x] canMergeSelected 计算属性
  - [x] 菜单项禁用状态处理

**修改文件**：
- `src/components/MindMapFreeCanvas/TextCardNode.vue` - 缩放手柄 UI（+120 行）
- `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 合并/拆分处理（+150 行）
- `src/components/MindMapFreeCanvas/NodeContextMenu.vue` - 计算属性更新（+10 行）

**验证结果**：
```
✓ 135 modules transformed.
✓ built in 2.98s
```

---

### v1.2.40 第一阶段 - 展开/折叠与父子关系 ✅ 已完成

**完成时间**: 2026-03-02

**已完成功能**：

- [x] **数据结构扩展**
  - [x] FreeMindMapNodeData 添加 isExpanded、childrenIds、zIndex 等字段
  - [x] FreeMindMapNode 添加 parentId、childrenIds、zIndex 等字段
  - [x] NodeRelation 接口定义（跨分支关联）

- [x] **Store 扩展**
  - [x] getChildren/getParent - 获取子节点/父节点
  - [x] setParent/removeParent - 设置/移除父子关系
  - [x] toggleNodeExpand/expandNode/collapseNode - 展开/折叠控制
  - [x] getVisibleChildren - 获取可见子节点
  - [x] updateNodeSize - 更新节点尺寸
  - [x] bringToFront - Z 轴层级管理
  - [x] addNodeRelation/removeNodeRelation - 跨分支关联

- [x] **TextCardNode 组件更新**
  - [x] 展开/折叠按钮（有子节点时显示）
  - [x] 子节点数量徽章
  - [x] inject 获取事件处理函数
  - [x] 新增样式：expand-toggle-btn、marginnote-children-badge

- [x] **FreeCanvasViewer 组件更新**
  - [x] visibleNodes 计算属性（过滤折叠节点的子节点）
  - [x] handleToggleExpand 事件处理
  - [x] onConnect 增强（建立父子关系）
  - [x] provide 传递事件处理给子组件

**修改文件**：
- `src/types/mindmapFree.ts` - 数据结构扩展
- `src/stores/freeMindMapStore.ts` - Store 扩展
- `src/services/freeMindMapService.ts` - 节点创建/更新扩展
- `src/components/MindMapFreeCanvas/TextCardNode.vue` - 展开/折叠 UI
- `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` - 事件处理/可见节点过滤

**验证结果**：
```
✓ 135 modules transformed.
✓ built in 2.68s
```

---

### v1.2.37 - 思维导图空状态与布局修复 ✅ 已完成

**完成时间**: 2026-03-01 22:00:00

**问题描述**：
1. 右侧思维导图区域空白，不显示空状态引导
2. 思维导图区域高度计算不正确导致内容无法显示
3. 创建摘录时目标文档选择问题

**修复内容**：

- [x] **空状态 UI 修复**
  - [x] `FreeCanvasViewer.vue` 空状态条件判断修复
  - [x] 简化显示逻辑 `v-if="!isLoading && nodes.length === 0"`
  - [x] 使用 `v-if` 替代 `v-show` 控制画布显示
  - [x] 添加引导插图和"添加示例卡片"按钮

- [x] **布局高度修复**
  - [x] `.annotation-area` 添加 `height: 100%`
  - [x] `.mindmap-sidebar-body` 添加 `min-height: 200px`
  - [x] 子元素继承高度
  - [x] `FreeCanvasViewer` 容器高度调整

- [x] **blockId 变化监听**
  - [x] `App.vue` 添加 `:key="mindMapBlockId"`
  - [x] `FreeCanvasViewer` 添加 `watch(() => props.blockId)`

**相关文档**：[TODO_PDF.md](./TODO_PDF.md) - v1.2.37

---

### v1.2.38 - 组件导入修复与摘录实时同步 ✅ 已完成

**完成时间**: 2026-03-01 23:00:00

**问题描述**：
1. 组件导入名称不匹配导致思维导图无法渲染
2. PDF 摘录创建后无法实时同步到思维导图

**修复内容**：

- [x] **组件导入修复**
  - [x] 修复 `App.vue` 中 `MindMapFreeCanvas` → `FreeCanvasViewer` 导入
  - [x] 更新模板中的组件引用
  - [x] 修复组件 props 传递

- [x] **PDF 摘录实时同步**
  - [x] `FreeCanvasViewer` 添加 `annotation-created` 事件监听
  - [x] 实现 `handleAnnotationCreated` 处理函数
  - [x] 从摘录数据创建思维导图节点
  - [x] 自动计算节点位置避免重叠

**相关文档**：[TODO_PDF.md](./TODO_PDF.md) - v1.2.38

---

### v1.2.36 - 思维导图摘录同步修复 ✅ 已完成

**问题描述**：思维导图区域空白，无法显示已有摘录/卡片，与 MarginNote4 存在明显差距。

**相关文档**：[TODO_PDF.md](./TODO_PDF.md) - v1.2.36

#### 修复内容

- [x] **思维导图块 ID 初始化增强**
  - [x] `initMindMapBlockId()` 使用正确 API
  - [x] 临时 ID 降级方案
  - [x] 切换学习集自动重新初始化

- [x] **空状态 UI** (移至 v1.2.37)
  - [x] 空状态引导显示修复
  - [x] 快捷操作提示

- [x] **已有摘录导入**
  - [x] 修复 PdfMindMapSidebar 导入逻辑
  - [x] 批量转换已有 annotations 为节点
  - [x] 按页码自动布局

- [x] **实时同步修复**
  - [x] 事件监听链路检查
  - [x] `annotation-created` 事件处理修复
  - [x] 节点生成与渲染修复
  - [ ] annotation-created 事件处理修复
  - [ ] 节点生成与渲染修复

---

### v1.2.33 - MarginNote4 风格思维导图增强 ⏳ 规划中

**需求描述**：基于现有自由画布思维导图，增强与 PDF 阅读器的联动，实现类似 MarginNote4 的左 PDF 右思维导图学习体验。

#### 阶段一：PDF 摘录实时联动（优先级：高）
- [ ] **1.1 事件监听层**
  - [ ] 监听 PDF 文本选择事件
  - [ ] 监听 PDF 图片框选事件
  - [ ] 监听标注创建事件 (annotation-created)
  - [ ] 监听标注更新事件 (annotation-updated)
  - [ ] 监听标注删除事件 (annotation-deleted)

- [ ] **1.2 数据转换层**
  - [ ] PDF 坐标转导图坐标算法
  - [ ] 标注内容提取与格式化
  - [ ] 颜色映射处理（PDF 颜色 → 节点样式）
  - [ ] 页码信息关联

- [ ] **1.3 节点生成层**
  - [ ] 自动生成文本卡片节点
  - [ ] 自动生成图片卡片节点
  - [ ] 智能位置计算（避免重叠）
  - [ ] 层级关系建立（父子节点）
  - [ ] 连线自动创建

- [ ] **1.4 双向同步层**
  - [ ] 导图节点点击 → PDF 高亮定位
  - [ ] PDF 标注点击 → 导图节点高亮
  - [ ] 位置同步（滚动时）
  - [ ] 状态同步（删除/修改）

- [ ] **1.5 性能优化层**
  - [ ] 防抖处理（500ms 延迟）
  - [ ] 批量节点创建（节流）
  - [ ] 虚拟滚动支持（大量节点）
  - [ ] 增量更新机制

#### 阶段二：卡片操作增强（优先级：中）
- [ ] **2.1 卡片合并/拆分**
  - [ ] 右键菜单添加合并选项
  - [ ] 右键菜单添加拆分选项
  - [ ] 快捷键支持（Ctrl+M 合并，Ctrl+S 拆分）
  - [ ] 多选合并功能
  - [ ] 提取子节点功能

- [ ] **2.2 卡片缩放拖拽**
  - [ ] 拖拽调整卡片大小
  - [ ] 双指缩放/鼠标滚轮缩放
  - [ ] 卡片自适应内容大小
  - [ ] 最小/最大尺寸限制

- [ ] **2.3 卡片样式优化**
  - [ ] MarginNote 风格圆角设计（12px）
  - [ ] 柔和阴影效果
  - [ ] 悬停/选中状态增强
  - [ ] 卡片头部渐变色
  - [ ] 页码标签样式

#### 阶段三：布局配置（优先级：低）
- [ ] **3.1 布局配置组件**
  - [ ] defaultViewMode 默认视图模式
  - [ ] mindmapDefaultWidth 导图默认宽度
  - [ ] mindmapMinWidth 导图最小宽度
  - [ ] mindmapMaxWidth 导图最大宽度

- [ ] **3.2 同步配置组件**
  - [ ] enableAutoSync 启用自动同步
  - [ ] syncDelay 同步延迟
  - [ ] autoCreateNode 自动创建节点
  - [ ] highlightOnSelect 选中时高亮
  - [ ] syncColorMapping 同步颜色映射

### 设计文档

#### 1. 实时同步流程

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

#### 2. 配置选项

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

#### 3. 卡片合并/拆分逻辑

```typescript
// 合并到父节点
function mergeToParent(nodeId: string) {
  const node = getNode(nodeId);
  const parent = node.parent;
  if (!parent) return;
  
  // 将当前节点内容合并到父节点
  parent.content += '\n' + node.content;
  
  // 删除当前节点
  removeNode(nodeId);
}

// 从父节点拆分
function splitFromParent(nodeId: string) {
  const node = getNode(nodeId);
  const parent = node.parent;
  if (!parent) return;
  
  // 创建新的独立节点
  const newNode = createNode({
    content: node.content,
    x: node.x + 200,
    y: node.y
  });
  
  // 移除与原节点的关联
  node.content = '';
}
```

---

### 中优先级
- [ ] 思维导图样式扩展（10 种预设样式）
- [ ] 样式快速切换组件 (MindMapStyleSelector.vue)
- [ ] 自定义样式模板

### MarginNote4 风格 UI 优化（v1.2.33）✅

**需求描述**：基于现有自由画布思维导图，优化 UI/UX 细节，使其更接近 MarginNote4 的学习体验。

#### 阶段一：卡片样式优化（优先级：高）✅
- [x] **TextCardNode.vue 样式优化**
  - [x] 圆角设计（12px）
  - [x] 柔和阴影效果
  - [x] 悬停/选中状态增强
  - [x] 卡片头部渐变色设计
  - [x] 页码标签样式优化
- [x] **ImageCardNode.vue 样式优化**
  - [x] 图片边框圆角
  - [x] 缩略图预览优化
  - [x] PDF 来源标识
- [x] **GroupNode.vue 样式优化**
  - [x] 分组容器视觉优化
  - [x] 子节点数量统计样式

#### 阶段二：动画效果增强（优先级：中）✅
- [x] **卡片创建动画**
  - [x] cardAppear 动画（淡入 + 缩放）
  - [x] 弹簧物理效果
- [x] **卡片删除动画**
  - [x] cardDisappear 动画（淡出 + 缩小）
- [x] **连线动画**
  - [x] linkFlow 流动效果
  - [x] 连接建立动画
- [x] **视图切换动画**
  - [x] 缩放过渡动画
  - [x] 平移平滑效果

#### 阶段三：快捷操作工具栏（优先级：中）✅
- [x] **FloatingToolbar.vue 组件**
  - [x] 添加文字卡片按钮 (N)
  - [x] 添加图片卡片按钮 (I)
  - [x] 添加分组按钮 (G)
  - [x] 自动布局按钮
  - [x] 适应视图按钮
  - [x] 显示网格切换
  - [x] 自动同步切换
  - [x] 悬浮定位（右上角）
  - [x] 毛玻璃背景效果
- [x] **LayoutPresetSelector.vue 组件** - 布局选择器已集成到 FloatingToolbar 中
  - [x] MarginNote 模式（自由布局）
  - [x] 树状布局
  - [x] 垂直布局
  - [x] 水平布局

#### 阶段四：卡片合并/拆分 UI（优先级：中）✅
- [x] **NodeContextMenu.vue 增强**
  - [x] 合并到父节点（Ctrl+M）
  - [x] 拆分为独立节点（Ctrl+S）
  - [x] 合并选中节点（Ctrl+Shift+M）
  - [x] 提取子节点（Ctrl+E）
  - [x] 菜单项图标优化
  - [x] 快捷键提示显示
  - [x] 禁用状态处理
- [x] **合并/拆分逻辑实现**
  - [x] hasParent 计算属性
  - [x] hasChildren 计算属性
  - [x] canMergeSelected 计算属性
  - [x] handleMergeToParent 事件处理
  - [x] handleSplitFromParent 事件处理
  - [x] handleMergeSelected 事件处理
  - [x] handleExtractChildren 事件处理

#### 阶段五：快捷键系统（优先级：中）✅
- [x] **useKeyboardShortcuts.ts 组合式函数**
  - [x] 节点操作快捷键（N/I/G/Delete）
  - [x] 编辑快捷键（Enter/Escape）
  - [x] 视图快捷键（Ctrl+0/+/-）
  - [x] 合并拆分快捷键（Ctrl+M/S）
  - [x] 布局切换快捷键（1/2/3/4）
- [ ] **快捷键配置面板** - 待实现
  - [ ] 快捷键列表展示
  - [ ] 自定义快捷键绑定
  - [ ] 恢复默认设置

### 低优先级
- [ ] 多画布与图层系统
- [ ] 画布管理组件 (CanvasList.vue, CanvasSwitcher.vue)
- [ ] 图层管理器 (LayerManager.vue)
- [ ] 跨画布引用节点

---

## 📝 历史变更

### v1.2.38 - 2026-03-01 23:00:00
- **修复**: 组件导入名称不匹配（`MindMapFreeCanvas` → `FreeCanvasViewer`）
- **新增**: PDF 摘录到思维导图实时同步功能
- **新增**: `annotation-created` 事件监听和处理
- **优化**: 节点自动位置计算避免重叠

### v1.2.37 - 2026-03-01 22:00:00
- **修复**: 思维导图空状态引导显示问题
- **修复**: 右侧思维导图区域高度布局问题
- **修复**: 创建摘录时目标文档自动选择
- **优化**: blockId 变化监听和数据重新加载
- **优化**: 思维导图块 ID 初始化逻辑

### v1.2.36 - 2026-03-01 20:00:00
- **修复**: 思维导图区域空白问题
- **新增**: 已有摘录自动导入功能
- **新增**: 空状态引导 UI
- **修复**: 实时摘录联动链路

### v1.2.34 - 2026-03-01 17:15:00
- **修复**: saveMindMapToBlock 的 invalid ID argument 错误
- **修复**: detectNodeClusters 的 nodes is not iterable 错误
- **修复**: loadCrossLinks 的 undefined value 错误
- **新增**: 块 ID 有效性验证增强
- **新增**: 空值防护和错误边界处理

### v1.2.32 - 2026-03-01 16:09:00
- 修复：PdfMindMapSidebar.vue 中节点数量计算的空值错误
- 修复：思维导图保存时块 ID 无效的问题
- 新增：getOrCreateMindMapBlockId 函数自动创建/获取有效块 ID
- 新增：isValidBlockId 验证函数

### v1.2.31 - 2026-03-01 15:30:00
- 新增：思维导图布局功能（水平/垂直布局）
- 新增：applyAutoLayout 方法支持自动布局

### v1.2.27 - 2026-03-01 13:33:00
- 新增节点搜索与过滤功能
- 新增 MindMapSearch.vue 和 NodeFilterPanel.vue

### v1.2.26 - 2026-03-01 13:15:00
- 链接图谱增强完成
- PDF 联动增强完成

### v1.2.24 - 2026-03-01 11:57:00
- PDF+ 思维导图联动视图完成

### v1.2.23 - 2026-03-01 11:43:00
- 自由画布思维导图数据集成完成

### v1.2.22 - 2026-03-01
- 自由画布思维导图交互功能完成

### v1.2.21 - 2026-03-01
- 自由画布思维导图卡片节点完成

### v1.2.20 - 2026-03-01
- 自由画布思维导图基础框架完成

### v1.2.17 - 2026-03-01
- 脑图版本历史服务完成
- 脑图导出服务完成
- 脑图性能优化服务完成

---

## 📊 功能统计

| 功能类别 | 完成数 | 总数 | 完成度 |
|----------|--------|------|--------|
| 核心功能 | 11/11 | 11 | 100% |
| 自由画布功能 | 14/14 | 14 | 100% |
| PDF 联动 | 7/7 | 7 | 100% |
| 链接图谱 | 5/5 | 5 | 100% |
| 搜索过滤 | 5/5 | 5 | 100% |
| 组件 | 22/22 | 22 | 100% |
| 服务 | 14/14 | 14 | 100% |
| 状态管理 | 1/1 | 1 | 100% |
| 组合式函数 | 6/6 | 6 | 100% |
