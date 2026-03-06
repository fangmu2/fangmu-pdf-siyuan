# PDF 摘录助手 - 思源笔记插件

一个为思源笔记（SiYuan Note）设计的 PDF 标注和摘录插件。

## 功能特性

### 已实现功能 ✅

- **项目管理**：创建和管理多个 PDF 文件项目
- **PDF 标注**：从 PDF 中选取文字和图片创建标注
- **多级标题支持**：支持 H1-H5 标题层级
- **标注管理**：支持拖拽排序、编辑和删除标注
- **手写笔记**：在 PDF 上进行手写标注
- **学习重置**：清空当前页面的学习记录

### 开发中功能 🔄

- **学习集管理**：创建、编辑、删除学习集
- **多资料关联**：支持 PDF、MP4、EPUB、MP3 等格式

### 规划中功能 ⏳

- **思维导图**：树形关系自然生长
- **概念链接图**：创建跨结构总结和链接
- **无限脑图手写画布**：支持多重嵌套子脑图
- **大纲工具**：节点文本化编辑和控制
- **卡片盒**：分类看板，动态分类和管理卡片
- **AI 辅助**：内容识别提取、自动摘录
- **FSRS 遗忘曲线**：智能重复播放

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- 思源笔记 >= 2.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

1. 复制 `.env.example` 文件为 `.env`
2. 配置思源工作空间路径：
   ```
   VITE_SIYUAN_WORKSPACE_PATH=/path/to/siyuan/workspace
   ```
3. 启动开发服务器：
   ```bash
   pnpm dev
   ```
4. 在思源笔记中启用插件：
   - 设置 → 插件 → 启用"PDF 摘录助手"

### 构建生产版本

```bash
pnpm build
```

构建产物输出到 `./dist` 目录

### 发布插件

```bash
# 根据 conventional commits 自动递增版本号
pnpm release

# 或手动指定版本类型
pnpm release:patch    # 补丁版本 (0.0.1 -> 0.0.2)
pnpm release:minor    # 次版本 (0.1.0 -> 0.2.0)
pnpm release:major    # 主版本 (1.0.0 -> 2.0.0)
pnpm release:manual   # 手动版本
```

## 项目结构

```
plugin-sample-vite-vue-main/
├── src/
│   ├── main.ts              # 插件入口
│   ├── index.ts             # Vue 应用初始化
│   ├── App.vue              # 主应用组件
│   ├── components/          # Vue 组件
│   │   ├── PDFViewer.vue    # PDF 阅读器
│   │   ├── AnnotationList.vue    # 标注列表
│   │   ├── AnnotationEditor.vue  # 标注编辑器
│   │   ├── PDFAssetSelector.vue  # PDF 选择器
│   │   ├── MindMapViewer.vue     # 思维导图查看器
│   │   ├── HandwritingLayer.vue  # 手写图层
│   │   └── SiyuanTheme/     # 思源主题组件
│   │       ├── SyButton.vue
│   │       ├── SyInput.vue
│   │       ├── SySelect.vue
│   │       ├── SyCheckbox.vue
│   │       ├── SyTextarea.vue
│   │       └── SyIcon.vue
│   ├── api/                 # API 层
│   │   ├── siyuanApi.ts     # 思源内核 API
│   │   ├── annotationApi.ts # 标注 API
│   │   └── projectApi.ts    # 项目 API
│   ├── utils/               # 工具函数
│   │   ├── mindmapGenerator.ts  # 思维导图生成
│   │   └── ...
│   ├── i18n/                # 国际化
│   │   ├── zh_CN.json       # 中文
│   │   └── en_US.json       # 英文
│   └── types/               # TypeScript 类型定义
├── dist/                    # 构建输出目录
├── public/                  # 静态资源
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置
```

## 核心组件说明

### PDFViewer.vue

PDF 阅读器组件，负责：
- 使用 PDF.js 渲染 PDF 页面
- 处理文字和图片选取
- 集成手写图层
- 页面导航和缩放

### AnnotationList.vue

标注列表组件，负责：
- 显示所有标注
- 支持拖拽排序
- 编辑和删除标注
- 标注筛选和搜索

### AnnotationEditor.vue

标注编辑对话框，负责：
- 编辑标注内容
- 选择标题层级（H1-H5）
- 设置标注标签

### MindMapViewer.vue

思维导图查看器，负责：
- 渲染标注数据的思维导图
- 支持节点展开/折叠
- 节点拖拽和交互

### HandwritingLayer.vue

手写图层组件，负责：
- 在 PDF 上绘制手写笔记
- 笔触类型选择（铅笔、荧光笔等）
- 手写内容保存和加载

## API 说明

### siyuanApi.ts

思源内核 API 封装：

```typescript
// 上传文件
uploadFile(path: string, file: File): Promise<UploadResponse>

// 下载文件
downloadFile(path: string): Promise<Blob>

// 搜索文档
searchDocs(query: string): Promise<SearchResult[]>

// 插入块
insertBlock(dataType: string, data: string, path: string): Promise<InsertResponse>

// 插件数据存储
getPluginData(key: string): Promise<any>
setPluginData(key: string, value: any): Promise<void>
```

### annotationApi.ts

标注数据操作：

```typescript
// 获取所有标注
getAnnotations(projectId: string): Promise<Annotation[]>

// 创建标注
createAnnotation(annotation: Annotation): Promise<Annotation>

// 更新标注
updateAnnotation(id: string, annotation: Partial<Annotation>): Promise<void>

// 删除标注
deleteAnnotation(id: string): Promise<void>

// 批量导入标注
importAnnotations(annotations: Annotation[]): Promise<void>

// 导出标注到思源文档
exportToSiYuan(annotations: Annotation[], docPath: string): Promise<void>
```

### projectApi.ts

项目管理：

```typescript
// 创建项目
createProject(name: string): Promise<Project>

// 获取项目列表
getProjects(): Promise<Project[]>

// 删除项目
deleteProject(id: string): Promise<void>

// 添加 PDF 到项目
addPdfToProject(projectId: string, pdfPath: string): Promise<void>
```

## 数据存储

### 存储位置

```
/data/storage/petal/fangmu-pdf-siyuan/
├── projects.json          # 项目列表
├── annotations/           # 标注数据
│   └── {projectId}.json
└── assets/                # PDF 等资产文件
```

### 数据结构

**Project（项目）**：
```typescript
interface Project {
  id: string;              // 项目 ID
  name: string;            // 项目名称
  createdAt: number;       // 创建时间
  updatedAt: number;       // 更新时间
  pdfs: string[];          // PDF 文件路径列表
}
```

**Annotation（标注）**：
```typescript
interface Annotation {
  id: string;              // 标注 ID
  projectId: string;       // 所属项目 ID
  content: string;         // 标注内容
  type: 'text' | 'image';  // 标注类型
  page: number;            // PDF 页码
  position?: Position;     // 位置信息
  headingLevel: number;    // 标题层级 (1-5)
  tags: string[];          // 标签列表
  createdAt: number;       // 创建时间
  updatedAt: number;       // 更新时间
  order: number;           // 排序顺序
}
```

## 技术栈

- **前端框架**: Vue 3 + TypeScript (组合式 API)
- **构建工具**: Vite 5
- **PDF 渲染**: pdfjs-dist v5
- **状态管理**: Vue Reactivity
- **样式**: SCSS
- **图标**: Material Icons

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用组合式 API (`<script setup>`)
- 使用 ESLint + Prettier 统一代码风格

### Git 提交规范

遵循 Conventional Commits:

```
<type>(<scope>): <subject>

# type 类型
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式调整
refactor: 重构
test:     测试相关
chore:    构建/工具链相关
```

示例：
```
feat(annotate): 添加图片标注功能
fix(pdf): 修复 PDF 文字选取偏移问题
docs(readme): 更新中文文档
```

### 版本发布

1. 确保所有提交符合 Conventional Commits 规范
2. 运行 `pnpm release`
3. 插件会自动根据提交类型递增版本号
4. 推送到 Git 仓库

## 国际化

支持中文和英文：

```typescript
// 在组件中使用
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const title = t('common.title')
```

翻译文件位置：
- `src/i18n/zh_CN.json` - 中文
- `src/i18n/en_US.json` - 英文

## 常见问题

### 开发模式下插件不加载

1. 检查 `.env` 中的 `VITE_SIYUAN_WORKSPACE_PATH` 是否正确
2. 确保思源笔记已关闭后重新启动
3. 在思源中检查插件是否启用

### 构建失败

1. 清除 `node_modules` 和 `dist`
2. 重新安装依赖：`pnpm install`
3. 重新构建：`pnpm build`

### PDF 无法加载

1. 检查 PDF 文件路径是否正确
2. 确保 PDF 文件没有被其他程序占用
3. 尝试重新上传 PDF 到项目

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: [项目地址]
- 思源笔记社区：[社区链接]
