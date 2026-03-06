# 领域模型文档 (DOMAIN.md)

**最后更新**: 2026-03-04  
**项目版本**: v1.2.42

---

## 一、领域概述

### 1.1 业务领域

思源笔记 PDF 摘录插件 - 知识管理学习工具领域

**核心价值**:
- 帮助用户从 PDF 文档中高效提取知识
- 以思维导图形式组织知识结构
- 通过间隔重复（SRS）强化记忆
- 实现类似 MarginNote4 的学习体验

### 1.2 领域边界

```
┌─────────────────────────────────────────────────────────────┐
│                    知识管理学习工具领域                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  学习集管理   │  │  PDF 阅读标注  │  │ 思维导图组织  │      │
│  │  子域        │  │  子域        │  │  子域        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  卡片盒看板   │  │  闪卡复习     │  │  AI 辅助学习   │      │
│  │  子域        │  │  子域        │  │  子域        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、核心实体（Entities）

### 2.1 LearningSet（学习集）

**聚合根** ✅

```typescript
interface LearningSet {
  id: string                    // 唯一标识
  name: string                  // 学习集名称
  description: string           // 描述
  pdfs: LearningSetPdf[]        // PDF 列表
  annotationDocId: string       // 标注文档 ID（思源）
  siyuanDocId: string           // 学习集文档 ID（思源）
  cardIds: string[]             // 卡片 ID 列表
  createdAt: number             // 创建时间
  updatedAt: number             // 更新时间
}
```

**不变条件**:
- ID 不可变
- 必须有关联的思源文档
- PDF 路径唯一（不重复）

**业务规则**:
- 创建学习集时自动创建标注文档
- 删除学习集时级联删除所有关联数据
- 学习集名称在学习集列表中唯一

**生命周期**:
```
创建 → 添加 PDF → 创建标注 → 组织卡片 → 复习 → (可选) 删除
```

---

### 2.2 PDF（PDF 文档）

**实体** ✅

```typescript
interface LearningSetPdf {
  id: string                    // 唯一标识
  path: string                  // PDF 文件路径
  name: string                  // PDF 名称
  pageCount: number             // 总页数
  currentProgress: number       // 当前页码
  addedAt: number               // 添加时间
  updatedAt: number             // 最后阅读时间
}
```

**不变条件**:
- 路径在学习集内唯一
- 页码范围有效（0 ~ pageCount-1）

**业务规则**:
- 同一 PDF 可添加到多个学习集
- 删除 PDF 时级联删除该 PDF 的所有标注

---

### 2.3 Annotation（标注）

**实体** ✅

```typescript
interface Annotation {
  id: string                    // 标注 ID（思源块 ID）
  type: 'text' | 'image'        // 标注类型
  content: string               // 标注内容（文本/图片路径）
  pdfPath: string               // 来源 PDF 路径
  pdfPage: number               // PDF 页码
  pdfRect?: {                   // PDF 中的位置（文本）
    x: number
    y: number
    width: number
    height: number
  }
  color?: string                // 高亮颜色
  level: 1 | 2 | 3 | 4 | 5     // 标注级别（标题/段落/句子等）
  learningSetId: string         // 所属学习集
  docId: string                 // 思源文档 ID
  parentBlockId: string         // 父块 ID
  createdAt: number             // 创建时间
  updatedAt: number             // 更新时间
}
```

**不变条件**:
- ID 为有效的思源块 ID
- PDF 页码有效
- 标注级别在 1-5 范围内

**业务规则**:
- 标注必须关联到具体 PDF 和页码
- 删除标注时同步删除思源块
- 修改标注时同步更新思源块属性

---

### 2.4 Card（卡片）

**聚合根** ✅

```typescript
interface Card {
  id: string                    // 卡片 ID
  type: 'excerpt' | 'flashcard' | 'annotation'
  content: string               // 卡片内容
  sourceType?: 'pdf' | 'mindmap' | 'manual'
  sourcePdf?: string            // 来源 PDF 路径
  sourcePage?: number           // 来源页码
  annotationId?: string         // 关联标注 ID
  learningSetId: string         // 所属学习集
  docId: string                 // 思源文档 ID
  tags: string[]                // 标签
  createdAt: number
  updatedAt: number
}
```

**不变条件**:
- ID 唯一
- 内容非空

**业务规则**:
- 摘录卡片必须有来源（PDF 或思维导图）
- 闪卡必须有正面和背面内容
- 卡片可转换为闪卡

---

### 2.5 FlashCard（闪卡）

**实体** ✅

```typescript
interface FlashCard extends Card {
  type: 'flashcard'
  front: string                 // 正面内容
  back: string                  // 背面内容
  srsData: {
    interval: number            // 间隔天数
    ease: number                // 难度系数
    dueDate: number             // 到期时间
    lastReview?: number         // 最后复习时间
    reviewCount: number         // 复习次数
  }
}
```

**不变条件**:
- 正面和背面内容非空
- 间隔天数 >= 0
- 难度系数在 1.3 - 3.0 范围内

**业务规则**:
- 使用 SM2 算法计算下次复习时间
- 复习后更新 srsData
- 到期卡片优先显示

---

### 2.6 MindMapNode（思维导图节点）

**实体** ✅

```typescript
interface FreeMindMapNode {
  id: string                    // 节点 ID
  type: 'textCard' | 'imageCard' | 'group'
  data: FreeMindMapNodeData
  position: {                   // 画布坐标
    x: number
    y: number
  }
  style?: {
    transform?: string          // 旋转角度
    width?: number
    height?: number
  }
  parentId?: string             // 父节点 ID
  childrenIds: string[]         // 子节点 ID 列表
  zIndex: number                // Z 轴层级
  createdAt: number
  updatedAt: number
}

interface FreeMindMapNodeData {
  content: string               // 节点内容
  page?: number                 // 来源页码
  color?: string                // 颜色
  rotation?: number             // 旋转角度
  isExpanded?: boolean          // 是否展开（有子节点时）
  annotationId?: string         // 关联标注 ID
  imageSrc?: string             // 图片源（图片卡片）
}
```

**不变条件**:
- 节点 ID 唯一
- 父子关系不形成环

**业务规则**:
- 节点可关联到标注（实现双向跳转）
- 删除父节点时询问是否删除子节点
- 支持节点合并/拆分

---

### 2.7 ReviewRecord（复习记录）

**实体** ✅

```typescript
interface ReviewRecord {
  id: string                    // 记录 ID
  cardId: string                // 卡片 ID
  studySetId: string            // 学习集 ID
  quality: number               // 评分（0-5）
  reviewTime: number            // 复习时间
  interval: number              // 间隔天数
  nextReview: number            // 下次复习时间
  duration?: number             // 复习耗时（毫秒）
}
```

**不变条件**:
- 评分在 0-5 范围内
- 复习时间为有效时间戳

**业务规则**:
- 每次复习生成一条记录
- 记录用于统计分析
- 支持按日期范围查询

---

## 三、值对象（Value Objects）

### 3.1 PdfPosition（PDF 位置）

```typescript
interface PdfPosition {
  page: number                  // 页码
  x: number                     // X 坐标
  y: number                     // Y 坐标
  width?: number                // 宽度
  height?: number               // 高度
}
```

**特征**: 不可变，通过属性值判断相等性

---

### 3.2 ReviewSchedule（复习计划）

```typescript
interface ReviewSchedule {
  cardId: string                // 卡片 ID
  interval: number              // 间隔天数
  ease: number                  // 难度系数
  dueDate: number               // 到期时间
}
```

**特征**: 不可变，每次修改生成新对象

---

### 3.3 MindMapLayoutConfig（思维导图布局配置）

```typescript
interface MindMapLayoutConfig {
  mode: 'free' | 'tree' | 'vertical' | 'horizontal'
  defaultWidth: number
  minWidth: number
  maxWidth: number
  enableAutoSync: boolean
  syncDelay: number
}
```

**特征**: 不可变配置对象

---

## 四、领域服务（Domain Services）

### 4.1 LearningSetService（学习集服务）

**职责**: 学习集的 CRUD、PDF 管理、数据统计

**核心方法**:
```typescript
interface LearningSetService {
  createLearningSet(name: string, description?: string): Promise<LearningSet>
  updateLearningSet(id: string, updates: Partial<LearningSet>): Promise<void>
  deleteLearningSet(id: string): Promise<void>
  addPdf(id: string, pdf: LearningSetPdf): Promise<void>
  removePdf(id: string, pdfPath: string): Promise<void>
  getLearningSetStats(id: string): LearningSetStats
}
```

---

### 4.2 AnnotationService（标注服务）

**职责**: 标注创建、更新、删除、同步

**核心方法**:
```typescript
interface AnnotationService {
  createAnnotation(data: CreateAnnotationData): Promise<Annotation>
  updateAnnotation(id: string, updates: Partial<Annotation>): Promise<void>
  deleteAnnotation(id: string): Promise<void>
  syncAnnotationToSiyuan(annotation: Annotation): Promise<void>
  getAnnotationsByPdf(pdfPath: string): Promise<Annotation[]>
}
```

---

### 4.3 CardService（卡片服务）

**职责**: 卡片管理、转换、统计

**核心方法**:
```typescript
interface CardService {
  createCard(data: CreateCardData): Promise<Card>
  convertToFlashCard(cardId: string, front: string, back: string): Promise<FlashCard>
  deleteCard(cardId: string): Promise<void>
  getCardsByLearningSet(id: string): Promise<Card[]>
  getCardStats(learningSetId: string): CardStats
}
```

---

### 4.4 ReviewSchedulerService（复习调度服务）

**职责**: SM2 算法实现、复习计划生成

**核心方法**:
```typescript
interface ReviewSchedulerService {
  scheduleCard(card: FlashCard, quality: number): ReviewSchedule
  getDueCards(studySetId: string, maxCount?: number): Promise<FlashCard[]>
  getReviewStats(studySetId: string): ReviewStats
}
```

---

### 4.5 MindMapService（思维导图服务）

**职责**: 思维导图 CRUD、布局算法、同步

**核心方法**:
```typescript
interface MindMapService {
  createNode(data: CreateNodeData): Promise<FreeMindMapNode>
  updateNode(id: string, updates: Partial<FreeMindMapNode>): Promise<void>
  deleteNode(id: string): Promise<void>
  setParent(childId: string, parentId?: string): Promise<void>
  applyLayout(nodes: FreeMindMapNode[], mode: LayoutMode): Promise<FreeMindMapNode[]>
  saveToBlock(blockId: string, nodes: FreeMindMapNode[]): Promise<void>
}
```

---

### 4.6 PdfMindMapSyncService（PDF-思维导图同步服务）

**职责**: PDF 与思维导图实时同步

**核心方法**:
```typescript
interface PdfMindMapSyncService {
  handleAnnotationCreated(annotation: Annotation): Promise<FreeMindMapNode>
  handleAnnotationUpdated(annotation: Annotation): Promise<void>
  handleAnnotationDeleted(annotationId: string): Promise<void>
  syncNodeToAnnotation(node: FreeMindMapNode): Promise<void>
}
```

---

## 五、仓储（Repositories）

### 5.1 LearningSetRepository

```typescript
interface LearningSetRepository {
  findById(id: string): Promise<LearningSet | null>
  findAll(): Promise<LearningSet[]>
  save(learningSet: LearningSet): Promise<void>
  delete(id: string): Promise<void>
}
```

**实现**: 
- 主要存储：思源块属性
- 缓存：localStorage
- 索引：内存 Map

---

### 5.2 AnnotationRepository

```typescript
interface AnnotationRepository {
  findById(id: string): Promise<Annotation | null>
  findByPdf(pdfPath: string): Promise<Annotation[]>
  findByLearningSet(learningSetId: string): Promise<Annotation[]>
  save(annotation: Annotation): Promise<void>
  delete(id: string): Promise<void>
}
```

**实现**:
- 存储：思源块 API
- 查询：SQL API

---

### 5.3 CardRepository

```typescript
interface CardRepository {
  findById(id: string): Promise<Card | null>
  findByLearningSet(learningSetId: string): Promise<Card[]>
  save(card: Card): Promise<void>
  delete(id: string): Promise<void>
}
```

**实现**:
- 存储：思源块属性
- 索引：学习集 ID

---

### 5.4 MindMapRepository

```typescript
interface MindMapRepository {
  findByBlockId(blockId: string): Promise<FreeMindMapNode[]>
  saveToBlock(blockId: string, nodes: FreeMindMapNode[]): Promise<void>
  deleteBlock(blockId: string): Promise<void>
}
```

**实现**:
- 存储：思源块属性（正式 ID）
- 缓存：localStorage（临时 ID）

---

## 六、领域事件（Domain Events）

### 6.1 学习集事件

```typescript
// 学习集创建
interface LearningSetCreatedEvent {
  type: 'learning-set.created'
  payload: { learningSetId: string }
  timestamp: number
}

// 学习集删除
interface LearningSetDeletedEvent {
  type: 'learning-set.deleted'
  payload: { learningSetId: string }
  timestamp: number
}
```

### 6.2 标注事件

```typescript
// 标注创建
interface AnnotationCreatedEvent {
  type: 'annotation.created'
  payload: { annotation: Annotation }
  timestamp: number
}

// 标注更新
interface AnnotationUpdatedEvent {
  type: 'annotation.updated'
  payload: { annotation: Annotation }
  timestamp: number
}

// 标注删除
interface AnnotationDeletedEvent {
  type: 'annotation.deleted'
  payload: { annotationId: string }
  timestamp: number
}
```

### 6.3 思维导图事件

```typescript
// 节点创建
interface MindMapNodeCreatedEvent {
  type: 'mindmap.node.created'
  payload: { node: FreeMindMapNode }
  timestamp: number
}

// 节点删除
interface MindMapNodeDeletedEvent {
  type: 'mindmap.node.deleted'
  payload: { nodeId: string }
  timestamp: number
}
```

---

## 七、业务规则（Business Rules）

### 7.1 学习集规则

**BR-001**: 学习集名称唯一性
```
规则：同一用户的學習集名稱不能重複
验证：创建/更新时检查
```

**BR-002**: 学习集删除级联
```
规则：删除学习集时，级联删除所有关联的 PDF、标注、卡片、思维导图
顺序：标注/卡片 → PDF → 学习集本身
```

### 7.2 标注规则

**BR-010**: 标注必须关联到 PDF
```
规则：每个标注必须有明确的 PDF 路径和页码
例外：手动创建的卡片
```

**BR-011**: 标注同步
```
规则：标注创建/更新/删除时，必须同步到思源笔记
降级：思源不可用时，本地缓存，恢复后同步
```

### 7.3 闪卡规则

**BR-020**: SM2 算法规则
```
规则：使用 SM2 算法计算下次复习时间
公式：nextInterval = previousInterval * easeFactor
参数：easeFactor 范围 1.3 - 3.0
```

**BR-021**: 复习评分
```
规则：用户评分 0-5，对应回忆难度
0: 完全忘记
3: 困难回忆
5: 轻松回忆
```

### 7.4 思维导图规则

**BR-030**: 节点父子关系
```
规则：父子关系不形成环
验证：设置父节点前检查是否会形成环
```

**BR-031**: 节点删除
```
规则：删除父节点时，提供选项：
- 同时删除子节点
- 子节点提升为独立节点
```

---

## 八、领域模型图

### 8.1 实体关系图

```
┌─────────────────┐
│  LearningSet    │ (聚合根)
│  - id           │
│  - name         │
│  - pdfs         │
│  - annotationDocId
│  - siyuanDocId  │
└────────┬────────┘
         │ 1
         │
         │ *
    ┌────▼────────────┐
    │  LearningSetPdf │
    │  - id           │
    │  - path         │
    │  - pageCount    │
    └────┬────────────┘
         │ 1
         │
         │ *
    ┌────▼────────────┐       ┌─────────────────┐
    │   Annotation    │──────▶│  MindMapNode    │
    │  - id           │关联    │  - id           │
    │  - type         │       │  - type         │
    │  - content      │       │  - position     │
    │  - pdfPath      │       │  - parentId     │
    │  - pdfPage      │       │  - childrenIds  │
    └────┬────────────┘       └─────────────────┘
         │
         │ 1
         │
         │ *
    ┌────▼────────────┐
    │      Card       │ (聚合根)
    │  - id           │
    │  - type         │
    │  - content      │
    │  - annotationId │
    └────┬────────────┘
         │
         │ 1
         │
         │ *
    ┌────▼────────────┐
    │    FlashCard    │
    │  - front        │
    │  - back         │
    │  - srsData      │
    └────┬────────────┘
         │
         │ *
         │
    ┌────▼────────────┐
    │  ReviewRecord   │
    │  - cardId       │
    │  - quality      │
    │  - reviewTime   │
    └─────────────────┘
```

---

## 九、领域术语表

| 术语 | 定义 | 说明 |
|------|------|------|
| 学习集 | Learning Set | 一组相关的 PDF、标注和卡片 |
| 标注 | Annotation | 从 PDF 中提取的文本或图片 |
| 卡片 | Card | 知识的基本单位，可转换为闪卡 |
| 闪卡 | FlashCard | 用于间隔重复复习的卡片 |
| SRS | Spaced Repetition System | 间隔重复系统 |
| SM2 | SuperMemo 2 | 经典 SRS 算法 |
| 思维导图 | Mind Map | 以节点和连线组织知识的图形 |
| 聚合根 | Aggregate Root | 实体的根节点，控制事务边界 |
| 值对象 | Value Object | 通过属性值定义的对象，不可变 |
| 领域事件 | Domain Event | 领域内发生的重要事情 |

---

**维护说明**: 领域模型变更时及时更新此文档
