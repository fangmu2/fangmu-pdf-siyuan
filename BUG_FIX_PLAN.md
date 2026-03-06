# MarginNote4 思维导图核心功能仿照设计文档

> 版本：v1.2.40 设计稿
> 创建时间：2026-03-02
> 状态：🔄 规划中

---

## 📋 需求分析

### 用户反馈问题

根据用户测试反馈，当前思维导图存在以下问题：

1. **节点无法展开/折叠** - 节点只有折叠状态，无法展开显示子节点
2. **节点无法缩放/放大** - 节点大小固定，无法调整
3. **无法拖拽叠加** - 卡片不能重叠放置，无法实现堆叠效果
4. **无法建立父子关系** - 不能通过拖拽创建节点层级
5. **无法合并节点** - 多个节点无法合并为一个
6. **缺少层级结构显示** - 没有清晰的父子关系视觉反馈

### MarginNote4 核心功能对比

| 功能 | MarginNote4 | 当前实现 | 差距 |
|------|------------|---------|------|
| 节点展开/折叠 | ✅ 支持 | ❌ 不支持 | 🔴 高优先级 |
| 节点缩放 | ✅ 支持 | ❌ 不支持 | 🟡 中优先级 |
| 拖拽叠加 | ✅ 支持 | ❌ 不支持 | 🔴 高优先级 |
| 父子关系建立 | ✅ 拖拽创建 | ❌ 不支持 | 🔴 高优先级 |
| 节点合并 | ✅ 支持 | ❌ 不支持 | 🟡 中优先级 |
| 跨分支关联 | ✅ 虚线关联 | ⚠️ 部分支持 | 🟢 低优先级 |
| 自动布局 | ✅ 多种布局 | ✅ 支持 | ✅ 已完成 |
| 节点样式 | ✅ 胶囊形状 | ✅ 已仿照 | ✅ 已完成 |

---

## 🏗️ 技术架构设计

### 1. 数据结构扩展

**当前节点结构** (`types/mindmapFree.ts`):

```typescript
interface FreeMindMapNode {
  id: string
  type: 'textCard' | 'imageCard' | 'group'
  position: { x: number; y: number }
  data: FreeMindMapNodeData
  // ... 其他属性
}
```

**扩展后的节点结构**:

```typescript
interface FreeMindMapNode {
  id: string
  type: 'textCard' | 'imageCard' | 'group'
  position: { x: number; y: number }
  data: FreeMindMapNodeData

  // 新增：层级关系
  parentId?: string           // 父节点 ID
  childrenIds?: string[]      // 子节点 ID 列表
  isExpanded?: boolean        // 是否展开

  // 新增：尺寸控制
  size?: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }

  // 新增：叠加层级
  zIndex?: number             // Z 轴层级
  groupId?: string            // 所属分组 ID

  // 新增：关联关系
  relations?: NodeRelation[]  // 跨分支关联
}

interface NodeRelation {
  id: string
  targetNodeId: string
  type: 'dashed' | 'solid'    // 虚线/实线
  label?: string              // 关联标签
  color?: string              // 关联颜色
}
```

### 2. 组件架构

```
┌─────────────────────────────────────────────────────────┐
│                    FreeCanvasViewer                     │
│  (画布容器 - 缩放/平移/全局事件处理)                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │TextCardNode │  │TextCardNode │  │ImageCardNode│     │
│  │ (可展开)    │  │ (可叠加)    │  │ (可缩放)    │     │
│  │   ┌─────┐   │  │   ┌─────┐   │  └─────────────┘     │
│  │   │子节点│   │  │   │子节点│   │                     │
│  │   └─────┘   │  │   └─────┘   │                     │
│  └─────────────┘  └─────────────┘                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ConnectionLayer                     │   │
│  │  (关系线渲染层 - 父子关系/跨分支关联)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3. 核心服务设计

```typescript
// services/mindmapNodeRelationService.ts
interface MindMapNodeRelationService {
  // 父子关系管理
  setParent(childId: string, parentId: string): void
  removeParent(childId: string): void
  getChildren(parentId: string): FreeMindMapNode[]
  getParent(childId: string): FreeMindMapNode | null

  // 节点合并/拆分
  mergeNodes(nodeIds: string[]): FreeMindMapNode
  splitNode(nodeId: string): FreeMindMapNode[]

  // 展开/折叠
  toggleExpand(nodeId: string): void
  expandNode(nodeId: string): void
  collapseNode(nodeId: string): void

  // 叠加管理
  bringToFront(nodeId: string): void
  getZIndex(nodeId: string): number
}
```

---

## 📦 功能模块详细设计

### 模块 1：节点展开/折叠功能

**UI 设计**：
```
┌─────────────────────────────────┐
│ [▼] 节点标题内容...              │  ← 展开状态
│   ├─ 子节点 1                    │
│   ├─ 子节点 2                    │
│   └─ 子节点 3                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [▶] 节点标题内容...              │  ← 折叠状态
└─────────────────────────────────┘
```

**实现逻辑**：
```typescript
// 1. 在 TextCardNode 中添加展开/折叠按钮
const toggleExpand = () => {
  store.toggleNodeExpand(props.data.id)
}

// 2. Store 中管理展开状态
function toggleNodeExpand(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data.isExpanded = !node.data.isExpanded
  }
}

// 3. 子节点计算属性
const visibleChildren = computed(() => {
  if (!node.data.isExpanded) return []
  return getChildrenNodes(node.id)
})
```

---

### 模块 2：节点缩放功能

**UI 设计**：
```
┌──────────────────────┐
│ 节点内容              │
│                      │
│           [◲]        │  ← 右下角缩放手柄
└──────────────────────┘
```

**实现逻辑**：
```typescript
// 使用 Vue Flow 的 resizable 节点特性
const nodeStyle = computed(() => ({
  width: data.value.size?.width || 'auto',
  height: data.value.size?.height || 'auto',
  minWidth: '180px',
  maxWidth: '400px',
  minHeight: '60px',
  maxHeight: '300px'
}))

// 拖拽缩放处理
const handleResize = (event: ResizeEvent) => {
  store.updateNodeSize(props.data.id, {
    width: event.width,
    height: event.height
  })
}
```

---

### 模块 3：拖拽叠加功能

**实现逻辑**：
```typescript
// 1. 修改碰撞检测
const snapToGrid = false  // 禁用网格吸附
const nodeOverlapAllowed = true  // 允许重叠

// 2. Z 轴层级管理
const bringToFront = (nodeId: string) => {
  const maxZ = Math.max(...nodes.value.map(n => n.zIndex || 0))
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.zIndex = maxZ + 1
  }
}

// 3. 叠加视觉反馈
const stackIndicatorStyle = computed(() => ({
  opacity: overlappingNodes.value.length > 0 ? 0.5 : 0,
  transform: `translate(${offsetX}px, ${offsetY}px)`
}))
```

---

### 模块 4：父子关系建立

**拖拽创建连线流程**：
```
1. 用户从节点 A 的连接点拖拽
   ↓
2. 显示拖拽中的连线（虚线预览）
   ↓
3. 移动到节点 B 的连接点上方
   ↓
4. 释放鼠标，创建父子关系
   ↓
5. Store 更新：
   - nodeA.childrenIds.push(nodeB.id)
   - nodeB.parentId = nodeA.id
   - 创建新的 Edge 对象
```

**数据结构**：
```typescript
interface FreeMindMapEdge {
  id: string
  source: string        // 父节点 ID
  target: string        // 子节点 ID
  type: 'parent-child' | 'cross-branch'
  animated?: boolean    // 是否动画（跨分支用虚线）
  style?: object        // 样式配置
}
```

---

### 模块 5：节点合并/拆分

**合并功能**：
```typescript
function mergeNodes(nodeIds: string[]): FreeMindMapNode {
  // 1. 收集所有节点内容
  const contents = nodeIds.map(id => getNode(id).data.content)

  // 2. 创建新节点
  const mergedNode = createNode({
    type: 'textCard',
    title: '合并的节点',
    content: contents.join('\n---\n'),
    position: getAveragePosition(nodeIds)
  })

  // 3. 删除原节点
  nodeIds.forEach(id => removeNode(id))

  return mergedNode
}
```

**拆分功能**：
```typescript
function splitNode(nodeId: string): FreeMindMapNode[] {
  const node = getNode(nodeId)
  const paragraphs = node.data.content.split('\n\n')

  // 1. 创建多个新节点
  const newNodes = paragraphs.map((text, index) =>
    createNode({
      type: 'textCard',
      title: `片段 ${index + 1}`,
      content: text,
      position: {
        x: node.position.x,
        y: node.position.y + (index * 80)
      }
    })
  )

  // 2. 删除原节点
  removeNode(nodeId)

  return newNodes
}
```

---

## 🎨 UI/UX 设计规范

### 颜色规范
```css
:root {
  /* MarginNote4 主题色 */
  --mn-primary: #6B5CE7;
  --mn-primary-light: #A869C9;
  --mn-secondary: #FF6B6B;
  --mn-accent: #4ECDC4;

  /* 节点颜色 */
  --node-text: #FFFFFF;
  --node-shadow: rgba(107, 92, 231, 0.3);
  --node-border: rgba(255, 255, 255, 0.2);

  /* 连线颜色 */
  --edge-parent-child: #4ECDC4;
  --edge-cross-branch: #FF6B6B;
  --edge-dashed: rgba(255, 107, 107, 0.5);
}
```

### 动画规范
```css
/* 展开/折叠动画 */
.node-expand {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 合并动画 */
.node-merge {
  animation: mergeIn 0.4s ease-out;
}

@keyframes mergeIn {
  from {
    transform: scale(1.2);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## 📅 开发计划

### 第一阶段：基础功能（15-20 小时）
- [ ] 数据结构扩展（types/mindmapFree.ts）
- [ ] Store 扩展（freeMindMapStore.ts）
- [ ] 展开/折叠功能实现
- [ ] 父子关系拖拽创建

### 第二阶段：高级功能（15-20 小时）
- [ ] 节点缩放功能
- [ ] 拖拽叠加功能
- [ ] 节点合并/拆分
- [ ] Z 轴层级管理

### 第三阶段：优化完善（10-15 小时）
- [ ] 跨分支关联优化
- [ ] 布局算法优化
- [ ] 性能优化（大量节点）
- [ ] 动画效果完善

### 第四阶段：测试验收（5 小时）
- [ ] 功能测试
- [ ] 边界测试
- [ ] 性能测试
- [ ] 用户体验测试

---

## ⚠️ 风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 数据结构变更影响 | 高 | 中 | 向后兼容、数据迁移 |
| 性能问题 | 中 | 中 | 虚拟滚动、懒加载 |
| 与现有功能冲突 | 中 | 低 | 充分测试、回滚方案 |
| 学习曲线 | 低 | 低 | 文档完善、示例引导 |

---

## 📝 待办事项检查清单

### 开发前
- [ ] 确认数据结构设计
- [ ] 确认组件架构
- [ ] 确认技术可行性
- [ ] 准备测试数据

### 开发中
- [ ] 按阶段推进开发
- [ ] 及时提交代码
- [ ] 编写单元测试
- [ ] 更新文档

### 开发后
- [ ] 功能测试
- [ ] 性能测试
- [ ] 用户验收
- [ ] 发布说明

---

**下一步**：与用户确认功能优先级，开始第一阶段开发。
