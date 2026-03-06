# 前端开发问题记录

## #001: Electron 环境下路由模式问题

**状态**: 已解决
**描述**: 使用 `createWebHistory` 导致刷新 404。
**方案**: 纯前端插件必须使用 `createWebHashHistory` 模式。

## #002: 样式污染问题

**状态**: 已解决
**描述**: 插件的全局 CSS 影响了思源原本的列表样式。
**方案**: 所有 CSS 必须限定在 `.plugin-root` 类名下，并开启 `scoped`。

## #003: TypeScript 类型定义不完整

**状态**: 已解决
**描述**: 
- `MindMapNode` 类型缺少 `text`、`expanded`、`title` 等属性
- `MindMap` 类型缺少 `title`、`theme`、`updatedAt` 等属性
- `CreateMindMapOptions` 类型缺少 `title`、`theme`、`rootText` 等属性

**方案**: 
- 更新 `src/types/mindmap.ts`，添加所有必要的可选属性
- 添加 `MindMapTheme` 类型定义
- 添加 `MindMapNodeType` 枚举
- 添加 `MindMapLink` 接口用于节点连线

## #004: 类型文件命名错误

**状态**: 已解决
**描述**: `src/types/annotaion.ts` 拼写错误，应为 `annotation.ts`

**方案**: 
- 重命名文件 `annotaion.ts` → `annotation.ts`
- 更新所有引用该文件的 16 个文件：
  - types/index.ts
  - App.vue
  - api/annotationApi.ts
  - services/learningSetService.ts
  - components/StudySetDetail.vue
  - components/ChildBlock.vue
  - components/MindMapEditor.vue
  - components/MindMapViewer.vue
  - components/AnnotationList.vue
  - utils/mindmapGenerator.ts
  - utils/migration.ts
  - utils/markdownGenerator.ts
  - utils/annotationParser.ts
  - services/cardService.ts
  - api/projectApi.ts
  - services/mindmapService.ts

## #005: mindmapService.ts 类型不匹配

**状态**: 已解决
**描述**: 
- `mindmapService.ts` 中使用了 `text` 属性，但类型定义中只有 `title`
- `exportToOpml` 方法中存在语法错误（非法字符）

**方案**: 
- 在 `MindMapNode` 类型中同时支持 `title` 和 `text` 属性（兼容 markmap）
- 修复 `exportToOpml` 方法中的语法错误
- 统一使用 `title` 或 `text` 属性

---

## 待解决问题

### [高] Pinia 状态管理未引入

**描述**: 项目未使用 Pinia 进行状态管理，当前使用组件内状态和服务层单例模式

**建议方案**: 
1. 安装 Pinia：`npm install pinia`
2. 创建 stores：
   - `learningSetStore` - 学习集状态管理
   - `cardStore` - 卡片状态管理
   - `reviewStore` - 复习队列状态管理
   - `mindmapStore` - 脑图状态管理
3. 逐步迁移组件内状态到 Pinia stores

### [中] VueUse 工具函数未使用

**描述**: 项目中未使用 VueUse 工具库，防抖/节流等功能需要手动实现

**建议方案**: 
1. 安装 VueUse：`npm install @vueuse/core`
2. 替换手动实现：
   - 使用 `useDebounceFn` 替换防抖函数
   - 使用 `useThrottleFn` 替换节流函数
   - 使用 `useLocalStorage` / `useStorage` 替换本地存储
   - 使用 `useDraggable` 实现拖拽功能

### [中] Composables 封装不足

**描述**: 缺少通用的 Composables 函数封装

**建议创建**: 
- `useSiyuanApi` - 思源 API 调用封装
- `useLearningSet` - 学习集操作封装
- `useCard` - 卡片操作封装
- `useReview` - 复习功能封装
- `useMindMap` - 脑图操作封装
- `useTheme` - 主题切换封装

### [低] CSS 隔离不完全

**描述**: 部分组件可能未完全遵循 CSS 隔离规范

**检查项**: 
- 所有样式是否嵌套在唯一类名下
- 是否使用 `scoped` 或 CSS Modules
- 是否直接操作了 `document.body`
