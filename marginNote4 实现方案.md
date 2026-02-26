# MarginNote 4 风格学习插件实现方案（基于现有插件升级）

## 📋 项目概述

### 1. 项目背景
MarginNote 4 在 Mac/iOS 上通过「文档 → 摘录卡片 → 学习集脑图 → 闪卡复习」形成完整学习闭环。本项目在**现有 PDF 摘录插件基础上**进行升级，充分利用现有功能（PDF 阅读、文字/图片摘录、标注管理），新增 MarginNote 4 的核心特性。

### 2. 产品定位
**在现有 PDF 摘录插件基础上，实现 MarginNote 风格的"阅读 → 摘录 → 脑图构建 → 间隔复习"学习闭环。**

### 3. 核心差异点
- ✅ **基于现有插件升级** - 保留所有现有功能
- ✅ **渐进式增强** - 现有用户可无缝升级
- ✅ **数据兼容** - 现有标注数据自动映射为新卡片系统
- ✅ **思源原生集成** - 学习集、卡片、脑图都映射为思源块/文档

---

## 🏗️ 整体架构

### 1. 数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        现有功能（保留）                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  PDF 阅读    │     │ 文字摘录    │     │ 图片摘录    │       │
│  │  (PDF.js)   │     │ (文本选择)  │     │ (框选截图)  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             ▼                                   │
│                   ┌─────────────────┐                           │
│                   │   现有标注系统   │                           │
│                   │  (Annotation)   │                           │
│                   └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼ 升级映射
┌─────────────────────────────────────────────────────────────────┐
│                        新增功能（MarginNote）                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  学习集管理  │ ──→ │  卡片系统   │ ──→ │  脑图/大纲   │       │
│  │ (StudySet)  │     │   (Card)    │     │  (MindMap)  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                                       │               │
│         │                                       ▼               │
│         │                             ┌─────────────┐           │
│         │                             │  闪卡复习   │           │
│         │                             │ (SRS/Flash)│           │
│         │                             └─────────────┘           │
│         ▼                                       │               │
│  ┌─────────────┐                                │               │
│  │  卡片盒看板  │ ←──────────────────────────────┘               │
│  │  (CardBox)  │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 思源核心能力支撑

| 思源能力 | 支撑功能 |
|----------|----------|
| 块与文档 API | 卡片创建、学习集文档管理 |
| 双链与反向链接 | 卡片与脑图节点关联、引用追踪 |
| 属性系统 | 卡片元数据、SRS 参数存储 |
| SQL 查询 | 卡片筛选、复习队列生成 |
| 本地存储 | 离线使用、数据持久化 |

---

## 📦 模块设计

### 模块 1：学习集（Study Set）管理

#### 1.1 数据结构

```typescript
// 学习集 - 对应一个思源文档
interface StudySet {
  id: string;              // 思源文档 ID
  name: string;            // 学习集名称
  description: string;     // 描述
  coverImage?: string;     // 封面图路径
  notebookId: string;      // 所属笔记本 ID
  pdfPaths: string[];      // 关联的 PDF 路径列表
  cardIds: string[];       // 关联的卡片块 ID 列表
  mindmapId?: string;      // 关联的脑图块 ID
  reviewSettings: {
    dailyNewCards: number; // 每日新卡数量
    algorithm: 'SM2' | 'FSRS'; // 复习算法
  };
  createdAt: number;
  updatedAt: number;
}
```

#### 1.2 块属性设计

学习集文档根块属性：
```json
{
  "type": "study_set",
  "study_set_name": "MySQL 学习笔记",
  "study_set_description": "数据库系统学习",
  "study_set_pdf_count": "3",
  "study_set_card_count": "45",
  "study_set_created": "1709000000000"
}
```

#### 1.3 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 创建学习集 | 向导式创建，选择笔记本 | P0 |
| 编辑学习集 | 修改名称、描述、关联资料 | P0 |
| 删除学习集 | 软删除，保留底层数据 | P0 |
| 学习集列表 | 侧边栏展示、搜索、排序 | P0 |
| 概览视图 | 卡片统计、复习进度 | P1 |

---

### 模块 2：卡片系统（升级现有标注）

#### 2.1 现有标注数据结构（保留）

```typescript
// 现有 Annotation 接口
interface PDFAnnotation {
  id: string;
  blockId: string;         // 思源块 ID
  pdfPath: string;         // PDF 文件路径
  pdfName: string;         // PDF 文件名
  page: number;            // 页码
  rect: [number, number, number, number]; // 区域坐标
  text: string;            // 标注文本
  note: string;            // 补充说明
  color: string;           // 高亮颜色
  level: 'title' | 'heading' | 'paragraph' | 'sentence' | 'text';
  isImage?: boolean;       // 是否为图片标注
  imagePath?: string;      // 图片路径
  parentId?: string;       // 父标注 ID（层级关系）
  sortOrder?: number;      // 排序序号
  created: number;         // 创建时间戳
  updated: number;         // 更新时间戳
}
```

#### 2.2 新卡片数据结构（扩展）

```typescript
// 卡片 - 对应一个思源块
interface Card {
  id: string;              // 块 ID
  type: 'card' | 'excerpt' | 'flashcard';
  content: string;         // 卡片内容（Markdown）
  
  // 来源信息（兼容现有标注）
  sourceId: string;        // 来源块 ID（兼容 annotation.id）
  sourceLocation: {        // 来源位置
    docId: string;         // 文档 ID
    blockId: string;       // 块 ID
    pdfPath?: string;      // PDF 路径（兼容 annotation.pdfPath）
    page?: number;         // 页码（兼容 annotation.page）
    rect?: [number, number, number, number]; // 区域（兼容 annotation.rect）
  };
  
  studySetId: string;      // 所属学习集 ID
  tags: string[];          // 标签列表
  status: 'new' | 'learning' | 'review' | 'suspended';
  difficulty: number;      // 难度评分 1-5
  createdAt: number;
  updatedAt: number;
}

// 闪卡扩展
interface FlashCard extends Card {
  front: string;           // 正面内容
  back: string;            // 反面内容
  srs: {
    easeFactor: number;    // 难度因子 (初始 2.5)
    interval: number;      // 当前间隔天数
    repetitions: number;   // 连续正确次数
    nextReview: number;    // 下次复习日期戳
  };
}
```

#### 2.3 数据迁移方案

**现有标注 → 新卡片系统 映射关系**：

```typescript
// 迁移函数示例
function migrateAnnotationToCard(annotation: PDFAnnotation): Card {
  return {
    id: annotation.id,  // 保持 ID 一致
    type: annotation.isImage ? 'excerpt' : 'card',
    content: annotation.text || annotation.imagePath || '',
    sourceId: annotation.id,
    sourceLocation: {
      docId: '',  // 需要补充
      blockId: annotation.blockId,
      pdfPath: annotation.pdfPath,
      page: annotation.page,
      rect: annotation.rect
    },
    studySetId: '',  // 需要用户指定或创建默认学习集
    tags: [],  // 可从 level 映射
    status: 'new',
    difficulty: 3,
    createdAt: annotation.created,
    updatedAt: annotation.updated
  };
}
```

**迁移策略**：
1. **向后兼容** - 现有标注 ID 保持不变
2. **渐进迁移** - 用户可选择迁移或保留原格式
3. **自动映射** - 提供一键迁移工具

#### 2.4 块属性设计

卡片块属性：
```json
{
  "type": "card",
  "card_source_id": "20240226000001",
  "card_study_set_id": "20240226000002",
  "card_tags": "数据库，索引，B+ 树",
  "card_status": "learning",
  "card_difficulty": "3",
  "card_created": "1709000000000"
}
```

闪卡额外属性：
```json
{
  "card_type": "flashcard",
  "card_front": "什么是 B+ 树？",
  "card_back": "B+ 树是一种...",
  "card_srs_ease": "2.5",
  "card_srs_interval": "3",
  "card_srs_repetitions": "2",
  "card_srs_next_review": "1709259200000"
}
```

#### 2.5 摘录交互流程（升级现有功能）

```
1. 用户在 PDF 中选择文本/图片（现有功能）
        ↓
2. 点击「创建标注」按钮（现有 UI）
        ↓
3. 弹出卡片编辑浮层（新增）
   - 编辑标题、内容
   - 选择目标学习集
   - 添加标签
   - 可选：生成闪卡
        ↓
4. 创建思源块，设置块属性（新增）
   或
   创建现有标注格式（兼容模式）
        ↓
5. PDF 上保留高亮标记（现有功能）
        ↓
6. 点击标记可跳转到卡片块（新增）
```

#### 2.6 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **现有功能保留** | | |
| PDF 阅读与渲染 | PDF.js 渲染、页面导航 | ✅ 已有 |
| 文字摘录 | 选择文本创建标注 | ✅ 已有 |
| 图片摘录 | 框选区域截图 | ✅ 已有 |
| 多级标注 | 标题/段落/句子等级 | ✅ 已有 |
| 标注列表 | 展示、编辑、删除 | ✅ 已有 |
| **新增功能** | | |
| 卡片编辑浮层 | 标题、内容、学习集、标签 | P0 |
| 学习集选择 | 创建/选择目标学习集 | P0 |
| 标签系统 | 添加、管理标签 | P0 |
| 闪卡生成 | 一键生成闪卡正反面 | P1 |
| 原文跳转 | 点击高亮跳转到卡片 | P1 |

---

### 模块 3：脑图 / 大纲视图（集成 mymind）

#### 3.1 集成方案

**目标**：将 mymind 插件的思维导图功能代码复制集成到项目中

**步骤**：
1. 从 https://github.com/ebAobS/mymind 下载源码
2. 提取核心渲染组件
3. 适配数据层，使用卡片数据结构
4. 调整 UI 样式，与插件风格一致

#### 3.2 脑图数据结构

```typescript
// 脑图节点
interface MindMapNode {
  id: string;              // 节点 ID
  cardId: string;          // 关联的卡片块 ID
  title: string;           // 节点标题
  position: {
    x: number;
    y: number;
  };
  collapsed: boolean;      // 是否折叠
  parentId?: string;       // 父节点 ID
  children: MindMapNode[]; // 子节点列表
  style?: {
    color?: string;
    icon?: string;
  };
}

// 脑图容器
interface MindMap {
  id: string;              // 脑图块 ID
  studySetId: string;      // 所属学习集 ID
  root: MindMapNode;       // 根节点
  layout: 'mindmap' | 'tree' | 'fishbone' | 'timeline';
  viewport: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}
```

#### 3.3 块属性设计

脑图容器块属性：
```json
{
  "type": "mindmap",
  "mindmap_study_set_id": "20240226000002",
  "mindmap_layout": "mindmap",
  "mindmap_data": "{...}"  // JSON 字符串存储节点数据
}
```

#### 3.4 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 脑图渲染 | Canvas/SVG 渲染节点和连线 | P0 |
| 节点编辑 | 添加/删除/重命名节点 | P0 |
| 拖拽排序 | 改变层级和顺序 | P0 |
| 折叠/展开 | 折叠分支 | P0 |
| 缩放平移 | 画布缩放、平移 | P0 |
| 多布局 | 思维导图/树状图/鱼骨图/时间轴 | P1 |
| 双击编辑 | 打开对应卡片块编辑 | P1 |
| 反向链接 | 查看卡片出现在哪些脑图中 | P2 |

---

### 模块 4：卡片盒看板（Card Box）

#### 4.1 数据结构

```typescript
// 看板视图配置
interface BoardView {
  id: string;
  studySetId: string;
  groupBy: 'tag' | 'status' | 'difficulty' | 'source';
  sortBy: 'created' | 'updated' | 'nextReview' | 'difficulty';
  sortOrder: 'asc' | 'desc';
  filters: {
    tags?: string[];
    status?: string[];
    difficulty?: number[];
  };
}
```

#### 4.2 视图类型

| 视图 | 描述 | 优先级 |
|------|------|--------|
| 看板视图 | 按标签/状态分列展示 | P0 |
| 列表视图 | 表格形式展示所有字段 | P0 |
| 时间线视图 | 按创建/复习时间轴展示 | P1 |

#### 4.3 筛选与排序

```typescript
// 筛选条件
interface CardFilter {
  tags?: string[];         // 按标签筛选
  sourceDocId?: string;    // 按来源文档
  status?: string[];       // 按状态
  difficulty?: number[];   // 按难度范围
  nextReviewFrom?: number; // 下次复习时间范围
  nextReviewTo?: number;
}

// 智能学习集（保存的筛选条件）
interface SmartStudySet {
  id: string;
  name: string;
  filters: CardFilter;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
```

---

### 模块 5：闪卡与间隔复习（SRS）

#### 5.1 复习算法

**初期使用简化 SM-2 算法**：

```typescript
// SM-2 算法参数
interface SM2Params {
  quality: number;  // 用户评分 0-5
  easeFactor: number;  // 当前难度因子
  interval: number;    // 当前间隔
  repetitions: number; // 连续正确次数
}

// SM-2 算法实现
function sm2Algorithm({ quality, easeFactor, interval, repetitions }: SM2Params) {
  // 更新难度因子
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  
  // 更新重复次数和间隔
  let newRepetitions = repetitions;
  let newInterval: number;
  
  if (quality < 3) {
    // 回答错误，重置
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // 回答正确
    newRepetitions++;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }
  
  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000
  };
}
```

#### 5.2 复习流程

```
1. 进入复习模式
   - 选择学习集/标签
   - 生成复习队列（nextReview <= 今天）
        ↓
2. 显示卡片正面
        ↓
3. 用户回忆 → 点击显示反面
        ↓
4. 用户自评
   - Again (0-1): 完全忘记
   - Hard (2): 困难
   - Good (3-4): 良好
   - Easy (5): 简单
        ↓
5. 根据评分更新 SRS 参数
        ↓
6. 下一张卡片
```

#### 5.3 复习统计

```typescript
interface ReviewStats {
  studySetId: string;
  totalCards: number;
  learnedCards: number;      // 已学习
  reviewToday: number;       // 今日复习
  dueToday: number;          // 今日到期
  newToday: number;          // 今日新卡
  accuracyRate: number;      // 正确率
  streakDays: number;        // 连续学习天数
  reviewHistory: {
    date: string;
    reviewed: number;
    correct: number;
  }[];
}
```

#### 5.4 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 闪卡数据模型 | 正面/反面、SRS 参数 | P0 |
| 复习队列生成 | SQL 查询到期卡片 | P0 |
| 复习流程 UI | 显示卡片、自评按钮 | P0 |
| SM-2 算法 | 间隔重复计算 | P0 |
| 复习日历 | 显示每日复习计划 | P1 |
| 统计面板 | 正确率、进度图表 | P1 |
| FSRS 算法 | 更优的复习算法（可选升级） | P2 |

---

### 模块 6：AI 能力集成（可选）

#### 6.1 AI 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| AI 卡片整理 | 自动生成摘要、标题 | P2 |
| AI 自动标签 | 根据内容打标签 | P2 |
| AI 辅助出题 | 生成闪卡正反面 | P2 |
| AI 对话 | 对卡片/脑图提问 | P3 |

#### 6.2 接入方式

```typescript
// AI 服务接口
interface AIService {
  generateSummary(content: string): Promise<string>;
  generateTitle(content: string): Promise<string>;
  generateTags(content: string): Promise<string[]>;
  generateFlashcard(content: string): Promise<{ front: string; back: string }>;
  chat(context: string[], question: string): Promise<string>;
}

// 配置
interface AIConfig {
  provider: 'openai' | 'claude' | 'local';
  apiKey: string;
  model: string;
  endpoint?: string;
}
```

---

### 模块 7：外部资料挂载（PDF）

#### 7.1 功能列表

| 功能 | 描述 | 优先级 |
|------|------|--------|
| PDF 挂载 | 指定目录，挂载到学习集 | P1 |
| 阅读位置记录 | 记录当前页码 | P1 |
| PDF 内摘录 | 选中文本创建卡片 | P1 |
| 关联卡片列表 | 显示该 PDF 关联的所有卡片 | P1 |

---

## 🗓️ 分期实现计划

### 第 0 期：现有代码分析与兼容（1 周）

**目标**：分析现有代码，确保新功能与现有功能兼容

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| 现有代码分析 | 理解数据结构、API | 2 天 |
| 兼容性设计 | 设计数据迁移方案 | 1 天 |
| 项目结构规划 | 按模块划分代码 | 1 天 |
| 类型定义更新 | 新增 Card、StudySet 等类型 | 1 天 |

**交付物**：
- ✅ 现有代码分析报告
- ✅ 数据迁移方案文档
- ✅ 新增类型定义文件

---

### 第 1 期：卡片系统升级（2 周）

**目标**：在现有标注系统基础上，升级为卡片系统

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| 卡片数据结构 | 定义 Card 接口，兼容 Annotation | 2 天 |
| 卡片管理服务 | CRUD 操作、学习集关联 | 3 天 |
| 卡片编辑浮层 | 标题、内容、标签、学习集选择 | 3 天 |
| 摘录功能升级 | 创建标注时同时创建卡片 | 2 天 |
| 数据迁移工具 | 现有标注→卡片迁移脚本 | 2 天 |
| 卡片列表视图 | 升级现有列表，支持多视图 | 2 天 |

**交付物**：
- ✅ 卡片管理功能
- ✅ 卡片编辑浮层
- ✅ 数据迁移工具
- ✅ 卡片列表视图

---

### 第 2 期：学习集重构（1-2 周）

**目标**：将现有项目管理升级为学习集管理

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| 学习集 CRUD | 创建/编辑/删除/列表 | 3 天 |
| 学习集详情 | 概览视图、统计信息 | 2 天 |
| PDF 关联 | 将现有 PDF 项目关联到学习集 | 2 天 |
| 卡片关联 | 将卡片关联到学习集 | 2 天 |

**交付物**：
- ✅ 学习集管理面板
- ✅ 学习集详情视图
- ✅ PDF/卡片关联功能

---

### 第 3 期：脑图集成（2-3 周）

**目标**：集成 mymind 脑图组件

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| mymind 代码分析 | 提取核心渲染组件 | 3 天 |
| 脑图组件集成 | 适配到项目结构 | 5 天 |
| 脑图数据层 | 节点与卡片关联 | 3 天 |
| 脑图交互 | 拖拽、折叠、缩放 | 3 天 |
| UI 样式调整 | 与插件风格一致 | 2 天 |

**交付物**：
- ✅ 思维导图编辑器
- ✅ 脑图与卡片关联

---

### 第 4 期：卡片盒看板（1-2 周）

**目标**：实现多视图卡片管理

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| 看板视图 | 按标签/状态分列展示 | 3 天 |
| 列表视图 | 表格形式展示 | 2 天 |
| 时间线视图 | 按时间轴展示 | 2 天 |
| 筛选与排序 | 高级筛选、保存条件 | 3 天 |

**交付物**：
- ✅ 卡片盒看板
- ✅ 多视图切换
- ✅ 高级筛选功能

---

### 第 5 期：闪卡与复习（2-3 周）

**目标**：实现 SRS 间隔复习系统

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| 闪卡数据模型 | 正面/反面、SRS 参数 | 2 天 |
| SM-2 算法 | 间隔重复计算 | 2 天 |
| 复习队列生成 | SQL 查询到期卡片 | 2 天 |
| 复习 UI | 卡片显示、自评按钮 | 5 天 |
| 统计面板 | 图表、日历 | 4 天 |
| 复习设置 | 每日新卡、算法选择 | 2 天 |

**交付物**：
- ✅ 闪卡复习功能
- ✅ SM-2 算法
- ✅ 复习统计面板

---

### 第 6 期：AI 集成 + 优化（2-3 周，可选）

**目标**：智能化功能与体验优化

| 任务 | 描述 | 预计工时 |
|------|------|----------|
| AI 服务接入 | OpenAI/Claude 接口 | 3 天 |
| AI 卡片整理 | 自动摘要、标签 | 2 天 |
| AI 辅助出题 | 生成闪卡 | 2 天 |
| PDF 阅读优化 | 更好的阅读体验 | 3 天 |
| 整体优化 | 性能、UI/UX | 3 天 |

**交付物**：
- ✅ AI 辅助功能
- ✅ PDF 阅读优化
- ✅ 整体体验提升

---

## 📁 项目结构设计

```
src/
├── index.ts                 # 插件入口
├── types/
│   ├── index.ts             # 通用类型
│   ├── studySet.ts          # 学习集类型
│   ├── card.ts              # 卡片类型
│   ├── mindmap.ts           # 脑图类型
│   ├── review.ts            # 复习类型
│   └── annotaion.ts         # 现有标注类型（保留）
├── studyset/
│   ├── StudySetManager.vue  # 学习集管理
│   ├── StudySetList.vue     # 学习集列表
│   └── StudySetDetail.vue   # 学习集详情
├── card/
│   ├── CardEditor.vue       # 卡片编辑器
│   ├── CardList.vue         # 卡片列表
│   ├── CardBox.vue          # 卡片盒看板
│   └── ExcerptService.ts    # 摘录服务
├── mindmap/
│   ├── MindMapViewer.vue    # 脑图查看器（来自 mymind）
│   ├── MindMapEditor.vue    # 脑图编辑器
│   ├── MindMapService.ts    # 脑图服务
│   └── components/          # mymind 组件
│       ├── Canvas.ts
│       ├── Node.ts
│       └── ...
├── review/
│   ├── ReviewSession.vue    # 复习会话
│   ├── ReviewStats.vue      # 复习统计
│   ├── FlashCardEditor.vue  # 闪卡编辑
│   └── sm2.ts               # SM-2 算法
├── ai/
│   ├── AIService.ts         # AI 服务
│   └── AIConfig.vue         # AI 配置
├── pdf/
│   ├── PDFManager.vue       # PDF 管理（现有）
│   ├── PDFViewer.vue        # PDF 阅读（现有）
│   └── PDFReader.vue        # PDF 阅读（新增）
├── components/              # 通用组件（现有）
│   ├── AnnotationEditor.vue # 标注编辑（现有）
│   ├── AnnotationList.vue   # 标注列表（现有）
│   └── ...
├── utils/                   # 工具函数（现有）
│   ├── annotationParser.ts  # 标注解析（现有）
│   ├── markdownGenerator.ts # Markdown 生成（现有）
│   └── ...
└── styles/                  # 样式
    └── ...
```

---

## ⚠️ 注意事项

### 1. 数据兼容性
- **现有标注数据必须保留** - 不能破坏现有功能
- **渐进式迁移** - 用户可选择何时迁移
- **双模式支持** - 同时支持旧标注和新卡片格式

### 2. 许可证合规
- mymind 插件使用 MIT 许可证
- 集成时需保留原作者版权声明
- 如有修改，建议注明

### 3. API 兼容性
- 思源 API 仍在演进
- 某些功能需等待 API 完善
- 做好版本兼容

### 4. 性能要求
- 脑图节点数：支持至少 500 节点流畅拖拽
- 卡片数量：单学习集支持 2000+ 卡片
- 复习队列：初始加载时间 < 1s

---

## 🔄 现有功能与新增功能对照表

| 现有功能 | 新增/升级功能 | 说明 |
|----------|---------------|------|
| PDF 阅读 | 保留 + 阅读位置记录 | 现有 PDF.js 渲染不变 |
| 文字摘录 | 升级为卡片创建 | 保留原有标注，同时创建卡片 |
| 图片摘录 | 升级为卡片创建 | 保留原有标注，同时创建卡片 |
| 标注列表 | 升级为卡片列表 | 支持多视图（列表/看板/时间线） |
| 项目管理 | 升级为学习集 | 增加概览视图、统计信息 |
| 简单脑图 | mymind 脑图 | 更强大的编辑功能 |
| - | 闪卡复习 | 新增 SRS 间隔复习 |
| - | AI 辅助 | 可选功能 |

---

## 📝 下一步行动

1. **切换到 Act 模式**，开始第 0 期实现
2. 首先分析现有代码结构和数据类型
3. 设计数据迁移方案，确保兼容性
4. 按分期计划逐步实现各模块功能

---

## 📚 参考资料

- [思源笔记插件开发文档](https://github.com/siyuan-note/siyuan)
- [my mind 插件源码](https://github.com/ebAobS/mymind)
- [SM-2 算法说明](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [FSRS 算法](https://github.com/open-spaced-repetition/fsrs4anki)
- [现有插件源码](./src/)
