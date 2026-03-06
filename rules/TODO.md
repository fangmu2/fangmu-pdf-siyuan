# 待办事项索引

> 最后更新：2026-03-02 17:00 | 整体完成度：**99%**

---

## 📊 整体完成度

| 模块 | 完成度 | 状态 | 详情 |
|------|--------|------|------|
| 学习集管理 | 100% | ✅ | [TODO_STUDY_SET.md](./todo/TODO_STUDY_SET.md) |
| 摘录与卡片 | 96% | ✅ | [TODO_CARD.md](./todo/TODO_CARD.md) |
| 脑图/大纲 | 99.5% | ✅ | [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) |
| 卡片盒看板 | 95% | 🔄 | [TODO_CARDBOX.md](./todo/TODO_CARDBOX.md) |
| 闪卡复习 | 98% | 🔄 | [TODO_REVIEW.md](./todo/TODO_REVIEW.md) |
| AI 能力 | 80% | 🟡 | [TODO_AI.md](./todo/TODO_AI.md) |
| PDF 阅读器 | 97% | ✅ | [TODO_PDF.md](./todo/TODO_PDF.md) |
| 搜索导航 | 98% | 🔄 | [TODO_SEARCH.md](./todo/TODO_SEARCH.md) |
| 基础功能 | 100% | ✅ | [TODO_BASE.md](./todo/TODO_BASE.md) |

---

## 🔥 当前任务

### v1.2.42 - MarginNote4 树状布局实现 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-02 17:00)
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) - v1.2.42
- **已完成功能**:
  - ✅ 树状自动布局算法（从左到右层级展开）
  - ✅ 节点自动排列（根据父子关系）
  - ✅ 层级缩进显示
  - ✅ 垂直间距优化
  - ✅ 工具栏树状布局按钮
- **实现成果**:
  - 新增文件：1 个（treeLayout.ts，242 行）
  - 修改文件：2 个（FreeCanvasViewer.vue, CanvasToolbar.vue）
  - 构建验证：✅ 通过
- **下一步**: 添加层级连接线和节点折叠/展开功能

---

### v1.2.41 - 阶段一：核心体验完善 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-02 15:00)
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) - v1.2.41
- **已完成功能**:
  - ✅ 多选框选功能（框选区域渲染 + 碰撞检测 + 批量选择）
  - ✅ 节点旋转功能（旋转手柄 UI + 拖拽旋转逻辑 + 角度吸附）
  - ✅ 布局切换动画（节点进入/离开动画 + 连线动画 + 性能优化）
- **实现成果**:
  - 修改文件：2 个（FreeCanvasViewer.vue, TextCardNode.vue）
  - 新增代码：~350 行
  - 构建验证：✅ 通过（多选框选 + 布局动画部分）
- **备注**: 节点旋转功能的数据持久化需要进一步调试

---

### v1.2.40 - MarginNote4 思维导图核心功能仿照 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-02)
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) - v1.2.40
- **已完成功能**:
  - ✅ 节点展开/折叠功能
  - ✅ 节点缩放功能
  - ✅ 拖拽叠加功能
  - ✅ 父子关系建立
  - ✅ 节点合并/拆分
  - ✅ 跨分支关联（虚线）
  - ✅ 关联线编辑（颜色/样式/标签）
- **实现成果**:
  - 新增文件：2 个（EdgeEditDialog.vue, EdgeContextMenu.vue）
  - 修改文件：3 个（FreeCanvasViewer.vue, freeMindMapStore.ts, freeMindMapService.ts）
  - 新增代码：~600 行
  - 构建验证：✅ 通过
- **下一步**: 布局优化算法（v1.2.41，规划中）

---

### v1.2.39 - 思维导图显示 Bug 修复与 MarginNote4 界面仿照 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-02 01:00)
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) - v1.2.39
- **已完成修复**:
  - ✅ 核心 Bug 修复（空值保护、undefined 访问）
  - ✅ 数据加载修复（blockId 持久化、confirmMindMapClear）
  - ✅ TextCardNode 胶囊样式改造（MarginNote4 风格）

---

### v1.2.38 - 组件导入修复与摘录同步 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 23:00)
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) - v1.2.38
- **已完成内容**:
  - ✅ 修复组件导入名称不匹配（`MindMapFreeCanvas` → `FreeCanvasViewer`）
  - ✅ 添加 PDF 摘录到思维导图实时同步功能
  - ✅ 实现 `annotation-created` 事件监听和处理
  - ✅ 清理调试日志，优化代码结构

### v1.2.37 - 思维导图空状态与目标文档修复 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **优先级**: ⭐⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 22:00)
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) - v1.2.37
- **已完成内容**:
  - ✅ 思维导图空状态引导 UI 修复
  - ✅ 目标文档自动选择（使用学习集思源文档ID）
  - ✅ 右侧思维导图区域高度布局修复
  - ✅ 临时 ID 数据加载优化

### v1.2.36 - 思维导图摘录同步修复 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **优先级**: ⭐⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 23:00)
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) - v1.2.36
- **已完成内容**:
  - ✅ 思维导图块 ID 初始化增强
  - ✅ 空状态引导 UI
  - ✅ 已有摘录自动导入思维导图
  - ✅ 实时摘录联动修复

### v1.2.35 - 思维导图模式布局完善 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **优先级**: ⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 17:40)
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.35
- **已完成内容**:
  - ✅ 思维导图块 ID 自动初始化
  - ✅ 左 PDF 右思维导图布局优化
  - ✅ 可调节分隔条（280px-600px）
  - ✅ 多学习集独立思维导图支持

### v1.2.34 - 思维导图空值错误修复 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 17:15)
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.34

### v1.2.33 - MarginNote 风格 UI 优化 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **优先级**: ⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 17:00)
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.33
- **已完成内容**:
  - ✅ 卡片样式优化（圆角、阴影、悬停效果）
  - ✅ 动画效果增强（创建/删除/连线动画）
  - ✅ 快捷操作工具栏（FloatingToolbar）
  - ✅ 卡片合并/拆分 UI（右键菜单 + 快捷键）
  - ✅ 快捷键系统（useKeyboardShortcuts，25+ 快捷键）
  - ✅ 左 PDF 右思维导图布局（mindmap 模式）
  - ✅ 实时摘录联动（annotation-created 事件同步）

### v1.2.32 - 修复思维导图空值错误 ✅ 已完成
- **模块**: 脑图
- **优先级**: ⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 16:09)
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.32

### v1.2.31 - 默认左 PDF 右思维导图布局 ✅ 已完成
- **模块**: PDF 阅读器 + 脑图
- **优先级**: ⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 16:03)
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) - v1.2.31

### v1.2.30 - PDF 与思维导图实时联动（摘录自动同步）✅ 已完成
- **模块**: PDF 阅读器 + 脑图
- **优先级**: ⭐⭐⭐
- **状态**: ✅ 已完成 (2026-03-01 15:10)
- **详情**: [CHANGELOG_FREE_MINDMAP.md](./CHANGELOG_FREE_MINDMAP.md) - v1.2.30

---

## 📋 模块 TODO 文件索引

| 文件 | 模块 | 描述 |
|------|------|------|
| [TODO_STUDY_SET.md](./todo/TODO_STUDY_SET.md) | 模块 1 | 学习集（Study Set）管理 |
| [TODO_CARD.md](./todo/TODO_CARD.md) | 模块 2 | 摘录与卡片系统 |
| [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) | 模块 3 | 脑图/大纲视图 |
| [TODO_CARDBOX.md](./todo/TODO_CARDBOX.md) | 模块 4 | 卡片盒看板 |
| [TODO_REVIEW.md](./todo/TODO_REVIEW.md) | 模块 5 | 闪卡与间隔复习（SRS） |
| [TODO_AI.md](./todo/TODO_AI.md) | 模块 6 | AI 能力集成 |
| [TODO_PDF.md](./todo/TODO_PDF.md) | 模块 7 | PDF 阅读器 |
| [TODO_SEARCH.md](./todo/TODO_SEARCH.md) | 模块 8 | 搜索与导航 |
| [TODO_BASE.md](./todo/TODO_BASE.md) | 基础 | 国际化/错误处理/性能等 |
| [TODO_TECH_DEBT.md](./todo/TODO_TECH_DEBT.md) | 技术 | 技术债务与优化 |

---

## 📝 近期变更

### v1.2.36 - 2026-03-01 20:00:00 ✅ 已完成
- **模块**: 脑图 + PDF 阅读器
- **内容**: 思维导图摘录同步修复 + 临时 ID 数据持久化
  - 已有摘录自动导入思维导图
  - 实时摘录联动修复
  - 思维导图块 ID 初始化增强（临时 ID 生成）
  - 空状态引导 UI 设计
  - **核心修复**: 临时 ID 数据持久化支持（localStorage）
  - TypeScript 类型错误修复
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) - v1.2.36
- **涉及文件**:
  - `src/components/MindMapEmptyState.vue` (新增)
  - `src/components/PdfMindMapSidebar.vue` (修复)
  - `src/services/freeMindMapDataIntegrationService.ts` (核心修复)
  - `src/services/freeMindMapService.ts` (验证修复)

### v1.2.35 - 2026-03-01 17:40:00
- **模块**: 脑图 + PDF 阅读器
- **内容**: 思维导图模式布局完善
  - 思维导图块 ID 自动初始化
  - 左 PDF 右思维导图布局优化
  - 可调节分隔条（280px-600px）
  - 多学习集独立思维导图支持
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.35

### v1.2.34 - 2026-03-01 17:15:00
- **模块**: 脑图
- **内容**: 思维导图空值错误修复
  - saveMindMapToBlock 的 invalid ID argument 错误
  - detectNodeClusters 的 nodes is not iterable 错误
  - loadCrossLinks 的 undefined value 错误
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.34

### v1.2.33 - 2026-03-01 17:00:00
- **模块**: PDF + 脑图
- **内容**: MarginNote4 风格 UI 优化完成
  - 卡片样式优化（渐变色头部、圆角设计、悬停效果）
  - 动画系统（MarginNoteAnimations.scss）
  - 快捷工具栏（FloatingToolbar）
  - 右键菜单增强（合并/拆分功能）
  - 快捷键系统（25+ 快捷键）
  - 左 PDF 右思维导图布局
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.33

### v1.2.32 - 2026-03-01 16:09:00
- **模块**: 脑图
- **内容**: 修复思维导图空值错误和块 ID 问题
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.32

### v1.2.31 - 2026-03-01 16:03:00
- **模块**: PDF + 脑图
- **内容**: 默认左 PDF 右思维导图布局（MarginNote 风格）
- **详情**: [CHANGELOG.md](../CHANGELOG.md) - v1.2.31

### v1.2.30 - 2026-03-01 15:10:00
- **模块**: PDF + 脑图
- **内容**: PDF 与思维导图实时联动（摘录自动同步）
- **详情**: [CHANGELOG_FREE_MINDMAP.md](./CHANGELOG_FREE_MINDMAP.md) - v1.2.30

### v1.2.29 - 2026-03-01 14:30:00
- **模块**: PDF + 脑图
- **内容**: PDF 嵌入式思维导图侧边栏（摘录联动）
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md) / [CHANGELOG_FREE_MINDMAP.md](./CHANGELOG_FREE_MINDMAP.md)

### v1.2.27 - 2026-03-01 13:33:00
- **模块**: 脑图
- **内容**: 节点搜索与过滤功能
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md)

### v1.2.26 - 2026-03-01 13:15:00
- **模块**: 脑图 + PDF
- **内容**: 链接图谱增强 + PDF 联动增强
- **详情**: [TODO_MINDMAP.md](./todo/TODO_MINDMAP.md) / [TODO_PDF.md](./todo/TODO_PDF.md)

### v1.2.24 - 2026-03-01 11:57:00
- **模块**: PDF + 脑图
- **内容**: PDF+ 思维导图联动视图
- **详情**: [TODO_PDF.md](./todo/TODO_PDF.md)

---

## 📖 文档管理规范

1. **主索引** (`rules/TODO.md`) - 整体概览和模块链接
2. **模块 TODO** (`rules/todo/TODO_*.md`) - 各模块详细待办事项
3. **变更记录** - 每个模块文件内记录历史变更
4. **更新流程** - 任务完成后更新对应模块文件和主索引

---

## 🔗 相关文档

- [PLUGIN_CONTEXT.md](./PLUGIN_CONTEXT.md) - 插件架构说明
- [INTERFACE.md](./INTERFACE.md) - 数据类型定义
- [ISSUES.md](./ISSUES.md) - 问题与难点记录
- [CHANGELOG.md](../CHANGELOG.md) - 项目变更日志
- [CHANGELOG_FREE_MINDMAP.md](./CHANGELOG_FREE_MINDMAP.md) - 自由画布思维导图变更日志
