# 思源插件项目上下文 (MarginNote 学习插件)

## 1. 项目概述

**插件名称**: MarginNote 学习插件 (fangmu-pdf-siyuan)
**版本**: v1.2.19
**技术栈**: Vue 3 + TypeScript + Vite + Pinia + VueUse
**核心功能**: PDF 阅读标注、思维导图、卡片复习系统 (SM-2/FSRS)

---

## 2. 目录结构

```
src/
├── api/                      # 思源 API 封装 (按功能模块)
│   ├── annotationApi.ts      # 标注相关 API
│   ├── cardApi.ts            # 卡片相关 API
│   ├── learningSetApi.ts     # 学习集相关 API
│   ├── projectApi.ts         # 项目相关 API
│   ├── reviewApi.ts          # 复习相关 API
│   ├── siyuanApi.ts          # 思源基础 API (兼容层)
│   └── studySetApi.ts        # 学习集 API
├── components/               # Vue 组件 (60+ 组件)
│   ├── SiyuanTheme/          # 思源主题适配组件
│   ├── PDFViewer.vue         # PDF 阅读器
│   ├── MindMapViewer.vue     # 思维导图查看器
│   ├── AnnotationList.vue    # 标注列表
│   ├── CardList.vue          # 卡片列表
│   ├── StudySetManager.vue   # 学习集管理
│   ├── ReviewManager.vue     # 复习管理
│   └── ... (60+ 组件)
├── composables/              # 组合式函数
│   ├── useCard.ts            # 卡片操作封装
│   ├── useLearningSet.ts     # 学习集操作封装
│   ├── useMindMap.ts         # 思维导图操作封装
│   ├── useReview.ts          # 复习会话封装
│   └── useSiyuan.ts          # 思源 API 调用封装
├── services/                 # 业务服务层 (35+ 服务)
│   ├── learningSetService.ts # 学习集 CRUD
│   ├── cardService.ts        # 卡片 CRUD
│   ├── reviewService.ts      # 复习队列管理
│   ├── mindmapService.ts     # 思维导图 CRUD
│   ├── mindmapVersionService.ts    # 脑图版本历史
│   ├── mindmapExportService.ts     # 脑图导出
│   ├── mindmapPerformanceService.ts# 脑图性能优化
│   ├── biDirectionalLinkService.ts # 双向跳转
│   ├── pdfExcerptService.ts  # PDF 摘录坐标存储
│   ├── pdfAnnotationService.ts# PDF 标注服务
│   ├── globalSearchService.ts# 全局搜索
│   ├── searchHistoryService.ts# 搜索历史
│   ├── tagCloudService.ts    # 标签云
│   └── ... (35+ 服务)
├── stores/                   # Pinia 状态管理
│   ├── learningSetStore.ts   # 学习集状态
│   ├── cardStore.ts          # 卡片状态
│   ├── reviewStore.ts        # 复习状态
│   └── pdfTabStore.ts        # PDF 标签页状态
├── types/                    # TypeScript 类型定义
│   ├── annotation.ts         # 标注类型
│   ├── card.ts               # 卡片类型
│   ├── mindmap.ts            # 脑图类型
│   ├── mindmapEnhanced.ts    # 脑图增强类型
│   ├── pdfAnnotation.ts      # PDF 标注类型
│   ├── pdfExcerpt.ts         # PDF 摘录坐标
│   ├── pdfViewer.ts          # PDF 阅读器类型
│   ├── review.ts             # 复习类型
│   ├── studySet.ts           # 学习集类型
│   ├── jump.ts               # 跳转类型
│   ├── search.ts             # 搜索类型
│   ├── project.ts            # 项目类型
│   └── siyuan.ts             # 思源类型
├── utils/                    # 工具函数
│   ├── mindmapGenerator.ts   # 思维导图 Markdown 生成
│   ├── migration.ts          # 数据迁移工具
│   ├── vueUseHelpers.ts      # VueUse 工具封装
│   ├── performance.ts        # 性能监控
│   └── errorHandler.ts       # 错误处理
├── review/                   # 复习算法
│   ├── sm2.ts                # SM-2 间隔重复算法
│   └── fsrs.ts               # FSRS 算法
├── i18n/                     # 国际化
│   ├── zh_CN.json            # 简体中文
│   └── en_US.json            # 英文
├── tests/                    # 单元测试 (94+ 用例)
│   ├── utils/                # 工具函数测试
│   ├── services/             # 服务层测试
│   └── components/           # 组件测试
├── api.ts                    # API 统一入口
├── App.vue                   # 主应用组件
├── index.ts                  # 插件入口
├── main.ts                   # Vue 应用初始化
└── index.scss                # 全局样式
```

---

## 3. 核心数据模型

### 3.1 标注系统 (PDFAnnotation)
```typescript
interface PDFAnnotation {
  id: string;              // 标注 ID
  blockId: string;         // 思源块 ID
  pdfPath: string;         // PDF 文件路径
  pdfName: string;         // PDF 文件名
  page: number;            // 页码
  rect: [number, number, number, number]; // PDF 坐标
  text: string;            // 摘录文本
  note: string;            // 笔记内容
  color: string;           // 高亮颜色
  level: AnnotationLevel;  // 标注级别 (title/h1-h5/text)
  isImage: boolean;        // 是否图片摘录
  imagePath?: string;      // 图片路径
  parentId?: string;       // 父标注 ID (层级关系)
  sortOrder?: number;      // 排序序号
  created: number;         // 创建时间戳
  updated: number;         // 更新时间戳
}
```

### 3.2 卡片系统 (LearningCard)
```typescript
interface LearningCard {
  id: string;              // 卡片 ID
  content: string;         // 卡片内容
  type: CardType;          // 卡片类型 (card/flashcard/excerpt)
  status: CardStatus;      // 状态 (new/learning/reviewing/suspended)
  studySetId: string;      // 所属学习集
  pdfPath?: string;        // 来源 PDF 路径
  page?: number;           // 来源页码
  note?: string;           // 笔记内容
  tags: string[];          // 标签列表
  difficulty: number;      // 难度评分 (1-5)
  srs?: SRSParams;         // 间隔重复参数
  sourceLocation?: {     // 源位置信息
    pdfPath: string;
    page: number;
    rect?: [number, number, number, number];
    docId?: string;
    blockId?: string;
  };
  createdAt: number;
  updatedAt: number;
}
```

### 3.3 学习集 (LearningSet)
```typescript
interface LearningSet {
  id: string;              // 学习集 ID
  name: string;            // 学习集名称
  description: string;     // 描述
  notebookId: string;      // 关联的思源笔记本 ID
  pdfs: LearningSetPdf[];  // PDF 列表
  annotations: PDFAnnotation[]; // 标注列表
  reviewSettings: {
    algorithm: 'sm2' | 'fsrs';
    dailyNewCards: number;
    dailyReviewLimit: number;
  };
  createdAt: number;
  updatedAt: number;
}
```

### 3.4 思维导图 (MindMap)
```typescript
interface MindMapNode {
  id: string;              // 节点 ID
  content: string;         // 节点内容
  level: string;           // 层级 (title/h1-h5/text)
  annotationId?: string;   // 关联的标注 ID
  children?: MindMapNode[];// 子节点
  page?: number;           // 标注所在页码
  pdfName?: string;        // PDF 名称
  sortOrder?: number;      // 排序序号
}
```

### 3.5 复习系统 (ReviewSession)
```typescript
interface ReviewSession {
  id: string;              // 会话 ID
  studySetId: string;      // 学习集 ID
  mode: ReviewMode;        // 模式 (normal/new/wrong/random)
  status: 'active' | 'completed' | 'cancelled';
  queue: LearningCard[];   // 复习队列
  currentIndex: number;    // 当前索引
  startTime: number;       // 开始时间
  endTime?: number;        // 结束时间
  stats: ReviewStats;      // 统计数据
}
```

### 3.6 PDF 坐标 (PdfExcerptCoordinates)
```typescript
interface PdfExcerptCoordinates {
  pdfPath: string;         // PDF 路径
  page: number;            // 页码
  rects: PdfRect[];        // 坐标列表
  timestamp: number;       // 时间戳
}

interface PdfRect {
  x: number;               // X 坐标 (0-1)
  y: number;               // Y 坐标 (0-1)
  width: number;           // 宽度
  height: number;          // 高度
}
```

---

## 4. 已封装的服务和工具

### 4.1 核心服务
| 服务 | 功能 |
|------|------|
| `learningSetService.ts` | 学习集 CRUD、PDF 管理、标注管理 |
| `cardService.ts` | 卡片 CRUD、标签管理、状态流转、批量操作 |
| `reviewService.ts` | 复习队列管理、SM-2/FSRS 算法、会话控制 |
| `mindmapService.ts` | 思维导图 CRUD、节点操作、布局切换 |
| `studySetService.ts` | 学习集完整 CRUD、统计功能 |

### 4.2 增强服务
| 服务 | 功能 |
|------|------|
| `mindmapVersionService.ts` | 脑图版本历史、版本恢复、自动保存 |
| `mindmapExportService.ts` | 脑图导出 (SVG/PNG/PDF/Markdown/OPML/JSON) |
| `mindmapPerformanceService.ts` | 虚拟渲染、分批渲染、性能统计 |
| `biDirectionalLinkService.ts` | 卡片/脑图/PDF 双向跳转、历史记录 |
| `pdfExcerptService.ts` | PDF 坐标存储、精确跳转回源位置 |
| `globalSearchService.ts` | 跨学习集全文搜索 |
| `searchHistoryService.ts` | 搜索历史保存和管理 |
| `tagCloudService.ts` | 标签频率统计、标签云生成 |

### 4.3 API 封装 (api.ts)
```typescript
// 基础 API
sql<T>(stmt: string, params?: any[]): Promise<T>
getBlock(id: string): Promise<IBlock>
createBlock(data: CreateBlockData): Promise<{ id: string }>
updateBlock(data: UpdateBlockData): Promise<void>
deleteBlock(id: string): Promise<void>

// 思源专用 API
getDoc(notebook: string, path: string): Promise<IDoc>
uploadFile(file: File): Promise<{ path: string }>
getConfig(): Promise<SiyuanConfig>
```

### 4.4 Composables
| 函数 | 功能 |
|------|------|
| `useCard()` | 卡片 CRUD、状态流转、难度管理、标签管理 |
| `useLearningSet()` | 学习集 CRUD、选择切换、卡片管理、统计 |
| `useMindMap()` | 思维导图 CRUD、节点操作、布局切换、导出 |
| `useReview()` | 复习队列、SM-2/FSRS 算法、键盘快捷键 |
| `useSiyuan()` | 思源 API 调用封装、主题获取 |

### 4.5 Pinia Stores
| Store | 功能 |
|-------|------|
| `useLearningSetStore` | 学习集列表、当前选择、卡片管理、统计 |
| `useCardStore` | 卡片 CRUD、筛选排序、状态流转、批量操作 |
| `useReviewStore` | 复习队列、会话控制、统计追踪 |
| `usePdfTabStore` | PDF 标签页管理、多 PDF 切换 |

---

## 5. 功能模块完成度

| 模块 | 完成度 | 核心组件 |
|------|--------|----------|
| 学习集管理 | 100% | StudySetManager, StudySetDetail |
| 摘录与卡片 | 95% | CardList, CardEditor, QuickCaptureMenu |
| 脑图/大纲 | 95% | MindMapViewer, MindMapEditor, OutlineView |
| 卡片盒看板 | 95% | CardBoxBoard, CardTimelineView |
| 闪卡复习 | 95% | ReviewManager, ReviewSession, FSRSReviewSession |
| AI 能力 | 80% | AIAssistantPanel |
| PDF 阅读器 | 95% | PDFViewer, PdfTabBar, PDFOutline |
| 搜索导航 | 95% | SearchPanel, QuickNavigation, Breadcrumb |

**整体完成度：约 90%**

---

## 6. 开发规范

### 6.1 代码规范
- 使用 `<script setup>` 语法糖
- 严禁使用 `any` 类型
- CSS 样式必须嵌套在唯一根类名下
- 禁止在组件中直接调用 `fetch`，必须通过 services 层

### 6.2 数据持久化
- 配置数据：使用 localStorage
- 业务数据：调用思源文件接口读写
- 禁止使用 localStorage 存储跨端同步数据

### 6.3 性能优化
- 大列表使用虚拟滚动 (VirtualCardList)
- 频繁事件使用防抖/节流 (useDebounceFn/useThrottleFn)
- 500+ 节点脑图使用虚拟渲染

---

## 7. 关键文件说明

| 文件 | 说明 |
|------|------|
| `plugin.json` | 插件配置文件 |
| `src/index.ts` | 插件入口，注册面板命令 |
| `src/App.vue` | 主应用组件，整合所有功能模块 |
| `rules/.clinerules.md` | 开发规范文档 |
| `rules/TODO.md` | 待办事项和完成度统计 |
| `rules/INTERFACE.md` | 数据类型定义文档 |
| `CHANGELOG.md` | 版本变更记录 |
