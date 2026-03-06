# AI 代理配置文档 (AGENTS.md)

**最后更新**: 2026-03-04  
**项目版本**: v1.2.42

---

## 一、代理配置概述

### 1.1 用途

本文档定义 AI 代理在本项目中工作的配置、规范和最佳实践。

### 1.2 适用代理

- **Sisyphus**: 主要开发代理（本配置适用）
- **Sisyphus-Junior**: 快速任务代理
- **其他 AI 助手**: 可参考此配置

---

## 二、项目上下文

### 2.1 项目简介

思源笔记 PDF 摘录插件 - 提供 PDF 标注、摘录、思维导图和学习集管理功能，仿照 MarginNote4 学习体验。

### 2.2 技术栈

```yaml
框架：Vue 3.4 + TypeScript
构建：Vite 5.x
状态管理：Pinia 2.x
PDF 渲染：PDF.js 4.x
思维导图：Vue Flow 1.x
包管理：pnpm 8.x
```

### 2.3 项目结构

```
src/
├── api/              # API 层（思源内核调用）
├── components/       # Vue 组件
│   ├── SiyuanTheme/  # 思源主题组件
│   └── ...
├── composables/      # 组合式函数
├── i18n/             # 国际化文件
├── services/         # 业务逻辑层
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
├── App.vue           # 主应用组件
├── index.ts          # 插件入口
└── main.ts           # 插件生命周期
```

---

## 三、代理工作流程

### 3.1 标准工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                     AI 代理工作流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 接收任务                                                 │
│         │                                                   │
│         ▼                                                   │
│  2. 理解需求（探索代码库）                                    │
│         │                                                   │
│         ▼                                                   │
│  3. 制定计划（如需）                                         │
│         │                                                   │
│         ▼                                                   │
│  4. 执行任务（编码/测试/文档）                                │
│         │                                                   │
│         ▼                                                   │
│  5. 验证结果（运行测试/检查诊断）                             │
│         │                                                   │
│         ▼                                                   │
│  6. 提交结果（报告完成）                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 任务分类处理

#### 简单任务（单文件修改）
**处理方式**: 直接执行

**示例**:
- 修复拼写错误
- 添加注释
- 修改样式

**流程**:
1. 定位文件
2. 执行修改
3. 运行诊断检查
4. 报告完成

---

#### 中等任务（多文件修改）
**处理方式**: 计划 → 执行

**示例**:
- 添加新功能组件
- 重构服务层
- 修复跨模块 Bug

**流程**:
1. 探索相关代码
2. 制定计划（TODO 列表）
3. 逐个执行
4. 运行测试
5. 验证诊断
6. 报告完成

---

#### 复杂任务（架构变更）
**处理方式**: 探索 → 计划 → 执行 → 验证

**示例**:
- 组件拆分重构
- 状态管理迁移
- 性能优化

**流程**:
1. 深度探索代码库
2. 咨询专家代理（Oracle）
3. 制定详细计划
4. 分阶段执行
5. 每阶段验证
6. 集成测试
7. 报告完成

---

## 四、编码规范

### 4.1 TypeScript 规范

**必须遵守**:
```typescript
// ✅ 好的做法
interface Annotation {
  id: string
  content: string
  level: 1 | 2 | 3 | 4 | 5
}

async function getAnnotation(id: string): Promise<Annotation | null> {
  const result = await postApi<Annotation>('/api/block/getBlock', { id })
  return result ?? null
}

// ❌ 禁止的做法
const data: any = await fetchData()  // 禁用 any
```

**类型安全规则**:
1. 禁止使用 `any` 类型
2. 函数参数和返回值必须标注类型
3. 使用 `unknown` 替代 `any`（如必须）
4. 使用可选链 `?.` 和空值合并 `??`

---

### 4.2 Vue 组件规范

**Composition API 语法**:
```vue
<script setup lang="ts">
// Props 定义
const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

// Events 定义
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 响应式状态
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

**组件拆分规则**:
- 单组件行数：<500 行
- 职责单一原则
- 可复用组件独立

---

### 4.3 代码风格

**格式化规则**:
```typescript
// 缩进：2 个空格
function example() {
  const value = ref(0)  // 单引号
  return value          // 添加分号
}

// 对象属性：每行一个（>=2 个属性时）
const config = {
  name: 'test',
  version: '1.0.0',
  enabled: true,
}

// 多行数组/对象：尾随逗号
const items = [
  'item1',
  'item2',
  'item3',
]
```

---

## 五、测试规范

### 5.1 测试要求

**新增功能必须**:
1. 添加单元测试
2. 测试覆盖率 >80%
3. 通过所有现有测试

---

### 5.2 测试框架

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

describe('LearningSetManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render component', () => {
    const wrapper = mount(LearningSetManager)
    expect(wrapper.exists()).toBe(true)
  })

  it('should validate form before submit', async () => {
    const wrapper = mount(LearningSetManager)
    await flushPromises()
    
    const vm = wrapper.vm as any
    vm.formData.name = ''
    expect(vm.validateForm()).toBe(false)
  })
})
```

---

### 5.3 测试优先级

**必须测试**:
1. 核心服务层（learningSetService, cardService）
2. 工具函数（annotationParser, markdownGenerator）
3. 表单验证逻辑
4. API 调用封装

**建议测试**:
1. 组件渲染
2. 用户交互
3. 边界条件

---

## 六、错误处理

### 6.1 统一错误处理

```typescript
// utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public operation: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function handleApiError<T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('未知错误')
    console.error(`[API Error] ${operation}:`, apiError.message)
    throw new ApiError(apiError.message, 500, operation)
  }
}
```

---

### 6.2 错误处理规则

**必须处理**:
1. 所有异步操作使用 try-catch
2. API 调用检查响应码
3. 用户可见错误使用思源通知系统

**禁止**:
1. 空 catch 块
2. 吞掉错误不处理
3. 未处理的 Promise rejection

---

## 七、文档规范

### 7.1 代码注释

**原则**: 代码自解释为主，注释为辅

**需要注释的情况**:
1. 公共 API
2. 复杂算法
3. 业务规则
4. 技术决策原因

**注释格式**:
```typescript
/**
 * 创建标注块
 * @param annotation 标注数据
 * @param parentID 父块 ID
 * @param previousID 前置块 ID（可选）
 * @returns 创建的标注 ID
 */
async function createAnnotationBlock(
  annotation: Annotation,
  parentID: string,
  previousID?: string
): Promise<string> {
  // 实现...
}
```

---

### 7.2 文档更新

**需要更新文档的情况**:
1. 新增功能
2. API 变更
3. 架构调整
4. Bug 修复（重要）

**文档位置**:
- 代码注释：JSDoc
- API 文档：`docs/api/`
- 使用指南：`README.md`
- 变更记录：`CHANGELOG.md`

---

## 八、安全规范

### 8.1 数据安全

**禁止提交**:
- `.env` 文件
- API 密钥
- 数据库密码
- 用户隐私数据

**安全实践**:
1. 使用环境变量存储敏感信息
2. 不在代码中硬编码密钥
3. 不在日志中打印敏感数据

---

### 8.2 代码安全

**检查清单**:
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（转义用户输入）
- [ ] CSRF 防护（验证来源）
- [ ] 文件上传安全（类型检查）

---

## 九、性能优化

### 9.1 性能规则

**必须优化**:
1. 大列表使用虚拟滚动
2. 搜索输入使用防抖
3. 计算结果使用缓存

**性能指标**:
- 首屏加载：<2 秒
- 列表渲染（1000 项）：<100ms
- 思维导图节点（100+）：<200ms

---

### 9.2 优化技术

```vue
<!-- 虚拟滚动 -->
<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
</script>

<template>
  <RecycleScroller
    :items="annotations"
    :item-size="50"
    key-field="id"
  />
</template>
```

```typescript
// 防抖处理
import { useDebounceFn } from '@vueuse/core'

const onSearchInput = useDebounceFn(async (query: string) => {
  // 搜索逻辑
}, 300)
```

---

## 十、代理职责

### 10.1 Sisyphus（主要代理）

**职责**:
- 新功能开发
- 架构重构
- 复杂 Bug 修复
- 代码审查

**能力**:
- 深度代码探索
- 架构设计
- 任务分解
- 质量保证

---

### 10.2 Sisyphus-Junior（快速代理）

**职责**:
- 简单任务处理
- 文档更新
- 快速修复
- 信息收集

**能力**:
- 快速响应
- 文件读写
- 基础探索
- 文档生成

---

### 10.3 Oracle（专家代理）

**职责**:
- 架构咨询
- 复杂问题诊断
- 技术决策评估
- 代码审查

**使用场景**:
- 架构设计决策
- 2+ 次修复失败的 Bug
- 性能瓶颈分析
- 安全漏洞评估

---

## 十一、最佳实践

### 11.1 探索优先

**原则**: 先探索，后行动

**做法**:
1. 使用 explore 代理了解代码库
2. 查找现有模式和约定
3. 确认文件位置再修改
4. 理解依赖关系再重构

---

### 11.2 小步提交

**原则**: 频繁提交，小步前进

**做法**:
1. 每个功能点单独提交
2. 提交前运行测试
3. 提交信息清晰描述变更
4. 保持代码始终可编译

---

### 11.3 验证保证

**原则**: 无验证，不完成

**做法**:
1. 修改后运行诊断检查
2. 新增功能添加测试
3. 重构后运行回归测试
4. 提供完成证据

---

## 十二、常用命令

### 12.1 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# 代码检查
pnpm eslint src/

# 类型检查
pnpm type-check
```

---

### 12.2 发布命令

```bash
# 自动版本（conventional commits）
pnpm release

# 手动版本
pnpm release:patch   # 补丁版本
pnpm release:minor   # 次版本
pnpm release:major   # 主版本
```

---

## 十三、故障排查

### 13.1 常见问题

**问题**: TypeScript 编译错误

**排查步骤**:
1. 运行 `npx tsc --noEmit` 查看错误
2. 定位错误文件
3. 检查类型定义
4. 修复后重新检查

---

**问题**: 组件导入失败

**排查步骤**:
1. 检查文件路径
2. 检查导出语句
3. 检查导入名称
4. 运行 `pnpm dev` 查看实时错误

---

**问题**: 测试失败

**排查步骤**:
1. 阅读失败信息
2. 定位失败测试
3. 检查测试逻辑
4. 修复代码或测试
5. 重新运行测试

---

**维护说明**: AI 代理配置变更时及时更新此文档
