# CLAUDE.md

本文档为 AI 助手在本项目中工作时提供指导。

## 项目简介

这是一个思源笔记（SiYuan Note）插件，提供 PDF 标注和摘录功能。主要功能包括：

- 创建项目管理多个 PDF 文件
- 从 PDF 中选取文字和图片创建标注
- 将标注保存到思源笔记文档，支持多级标题（H1-H5）
- 管理标注列表，支持拖拽整理和删除
- 支持 PDF 手写笔记功能
- 学习集管理（进行中）
- 思维导图和知识图谱构建（规划中）

## 常用命令

```bash
# 安装依赖
pnpm install

# 构建插件（输出到 ./dist 目录）
pnpm build

# 开发模式 - 监听文件变化并自动构建到思源工作空间
# 需要在 .env 或环境变量中设置 VITE_SIYUAN_WORKSPACE_PATH
pnpm dev

# 发布/打包插件
pnpm release           # 根据 conventional commits 自动递增版本号
pnpm release:patch     # 强制递增补丁版本
pnpm release:minor     # 强制递增次版本
pnpm release:major     # 强制递增主版本
pnpm release:manual    # 手动版本（不自动递增）
```

## 开发环境配置

1. 复制 `.env` 文件并配置：
   ```
   VITE_SIYUAN_WORKSPACE_PATH=/path/to/siyuan/workspace
   ```
2. 运行 `pnpm dev` - 插件会自动构建到思源工作空间的插件目录
3. 在思源中启用插件（设置 → 插件 → 启用"PDF 摘录助手"）

## 代码架构

### 插件入口
- `src/main.ts` - 思源插件类，继承自 `Plugin`。负责面板生命周期管理（打开/关闭）、注册顶栏按钮。
- `src/index.ts` - Vue 应用初始化和销毁函数。

### 核心组件 (`src/components/`)
- `App.vue` - 主应用组件，包含插件的所有 UI 和逻辑
- `PDFViewer.vue` - 使用 PDF.js 渲染 PDF，处理文字/图片选取
- `AnnotationList.vue` - 显示所有标注，支持排序、编辑、删除
- `AnnotationEditor.vue` - 标注内容编辑对话框
- `PDFAssetSelector.vue` - PDF 文件选择器

### 思源主题组件 (`src/components/SiyuanTheme/`)
- 样式化的基础组件（SyButton、SyInput、SySelect、SyCheckbox、SyTextarea、SyIcon），匹配思源原生 UI

### API 层 (`src/api/`)
- `siyuanApi.ts` - 思源内核 API 调用：文件上传下载、文档搜索、插件数据存储
- `annotationApi.ts` - 标注的增删改查操作
- `projectApi.ts` - 项目管理（创建、列表、删除）

### 数据存储
- 项目和标注数据存储在 `/data/storage/petal/fangmu-pdf-siyuan/`
- 标注保存为思源文档块，使用 `insertBlock` API

### 国际化 (`src/i18n/`)
- `en_US.json` - 英文翻译
- `zh_CN.json` - 中文翻译

## 关键技术细节

- **PDF 渲染**：使用 pdfjs-dist v5 进行 PDF 渲染和文字提取
- **前端框架**：Vue 3 + TypeScript，使用组合式 API
- **构建工具**：Vite 构建为 CommonJS 格式（思源插件系统要求）
- **外部依赖**：rollup 配置中将 "siyuan" 和 "process" 设为 external
- **开发模式**：使用 livereload 实现文件变化时自动重载