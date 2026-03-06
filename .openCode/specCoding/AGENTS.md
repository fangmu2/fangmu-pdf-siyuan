# AI 代理配置文档 (AGENTS.md)

**最后更新**: 2026-03-06  
**项目版本**: v1.2.42  
**规范版本**: Unified v2.1 (OhMyOpenCode + Superpowers 合并版 + Git 操作规范)

---

## 一、代理配置概述

### 1.1 用途

本文档定义 AI 代理在本项目中工作的配置、规范和最佳实践。本规范整合了 OhMyOpenCode (omo) 的并行代理能力与 Superpowers 的工程规范体系。

### 1.2 适用代理

- **Sisyphus**: 主要开发代理（本配置适用）
- **Sisyphus-Junior**: 快速任务代理
- **Oracle**: 架构咨询与复杂问题诊断
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
测试：Vitest + @vue/test-utils
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

## 三、核心工作流程

### 3.1 标准工作流程（四阶段）

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 代理统一工作流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  阶段一：任务接收与环境准备                                   │
│         │                                                   │
│         ▼                                                   │
│  阶段二：工程化设计与规划（按复杂度分级）                       │
│         │                                                   │
│         ▼                                                   │
│  阶段三：自动化执行与验证（TDD + 并行代理）                     │
│         │                                                   │
│         ▼                                                   │
│  阶段四：收尾、集成与交付（Git 分支+PR）                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 任务复杂度分级

| 复杂度 | 定义 | todo 数量 | 预计工时 | 文档要求 |
|--------|------|-----------|----------|----------|
| **简单** | 单文件修改，直接变更 | ≤5 | ≤2 小时 | 仅 Todo 列表 |
| **中等** | 多文件修改，需设计 | 6-15 | ≤1 天 | Plan 文档 |
| **复杂** | 架构变更，新技术引入 | >15 | >1 天 | Design + Plan 文档 |

---

## 四、阶段一：任务接收与环境准备

### 4.1 读取项目规范

**必须执行**：接收任何任务的第一步，阅读本文件理解项目架构、技术栈、编码约定。

### 4.2 Git 环境隔离（协作模式）

**中等/复杂任务必须执行**：

```bash
# 1. 新建功能分支
git checkout -b feature/<功能名>

# 或修复分支
git checkout -b fix/<问题名>

# 或重构分支
git checkout -b refactor/<重构名>
```

**分支命名规范**：
- `feature/` - 新功能开发
- `fix/` - Bug 修复
- `refactor/` - 代码重构
- `docs/` - 文档更新
- `chore/` - 构建/工具变更

**简单任务可选**：可在当前分支直接开发，但仍建议创建分支。

---

## 四、Git 操作规范

### 4.A 我能做的 Git 操作

| 操作类型 | 命令示例 | 说明 |
|----------|----------|------|
| **查看状态** | `git status`, `git diff`, `git log` | 查看仓库状态、变更、历史 |
| **添加文件** | `git add <file>` | 将文件添加到暂存区 |
| **创建提交** | `git commit -m "message"` | 创建原子提交，遵循 Conventional Commits |
| **查看历史** | `git log`, `git blame`, `git bisect` | 查看提交历史、代码归属、二分查找 |
| **分支操作** | `git checkout -b`, `git branch` | 创建/切换分支 |
| **撤销变更** | `git restore`, `git checkout` | 撤销工作区变更 |
| **重置暂存** | `git reset` | 重置暂存区（不影响工作区） |

### 4.B 安全协议（ NEVER 违反）

| 禁止操作 | 原因 | 例外 |
|----------|------|------|
| `git push --force` | 会覆盖远程历史，破坏协作 | 用户明确要求 |
| `git commit --amend` | 会修改已推送的提交 | 仅当提交未推送且由当前会话创建 |
| `--no-verify` / `--no-gpg-sign` | 跳过钩子检查 | 用户明确要求 |
| `git update-config` | 可能破坏用户配置 | 从不执行 |
| 自动提交 | 提交前需用户确认 | 用户明确要求提交 |

### 4.C Git 提交纪律

**提交前检查**：
1. 运行 `git status` 确认变更范围
2. 运行 `git diff --staged` 预览提交内容
3. 确保提交信息符合 Conventional Commits 格式

**提交信息格式**：
```
<type>(<scope>): <subject>

<body> (可选，详细说明)

<footer> (可选，关联 Issue)
```

**Type 类型**：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `test` - 测试相关
- `chore` - 构建/工具变更

**示例**：
```
feat(auth): add email validation for login form

- Add email format validation
- Show error message for invalid email
- Update i18n translations

Closes #123
```

### 4.D 提交后验证

**每次提交后必须执行**：
```bash
# 1. 确认提交成功
git log -1

# 2. 确认工作区状态
git status
```

**证据要求**：必须提供 `git log -1` 的输出作为提交成功的证据。

### 4.E 分支管理

**创建分支后必须声明**：
> "已创建新分支 `<branch-name>`，工作环境已隔离，开始执行任务。"

**任务完成后**：
```bash
# 推送到远程
git push -u origin <branch-name>
```

### 4.F 使用 git-master 技能

对于复杂 Git 操作（如 rebase、squash、bisect、blame），**必须调用** `skill(name="git-master")` 获取专业指导。

**触发场景**：
- "谁写了这行代码？" → `git blame`
- "这个功能什么时候添加的？" → `git log -S`
- "找出引入 bug 的提交" → `git bisect`
- "合并多个提交" → `git rebase -i` / `git squash`

---

### 4.4 声明工作环境

**必须声明**："已创建新分支 `<branch-name>`，工作环境已隔离，开始执行任务。"

---

## 六、阶段二：工程化设计与规划

### 6.1 澄清与设计（按复杂度分级）

| 复杂度 | 要求 | 技能调用 |
|--------|------|----------|
| **简单** | 口头确认设计方案 | 无需技能 |
| **中等** | 简要 Design 文档 | `superpowers/brainstorming` |
| **复杂** | 完整 Design 文档 + 方案对比 | `superpowers/brainstorming` |

**Design 文档模板** (`docs/designs/YYYY-MM-DD-<topic>.md`)：
```markdown
# 设计文档：<主题>

## 问题描述
## 设计方案
## 技术选型
## 影响范围
## 风险评估
```

### 5.2 制定实施计划（按复杂度分级）

| 复杂度 | 要求 | 技能调用 |
|--------|------|----------|
| **简单** | Todo 列表（≥2 步骤必须创建） | 无需技能 |
| **中等** | Plan 文档 + 任务分解 | `superpowers/writing-plans` |
| **复杂** | 详细 Plan 文档 + 并行任务图 | `superpowers/writing-plans` |

**Plan 文档模板** (`docs/plans/YYYY-MM-DD-<feature-name>-plan.md`)：
```markdown
# 实施计划：<功能名>

## 任务分解
- [ ] 任务 1
- [ ] 任务 2

## 依赖关系
## 预计工时
## 验证标准
```

### 6.2 Todo 列表纪律

**必须遵守**：
- ≥2 步骤任务 **必须** 创建 Todo 列表
- 每个 todo 标记 `in_progress` 前开始工作
- 每个 todo 完成后 **立即** 标记 `completed`（禁止批量完成）
- Todo 变更时更新列表

---

## 七、阶段三：自动化执行与验证

### 7.1 启动开发流程

**并行代理策略**：
- 独立子任务 → 使用 `superpowers/dispatching-parallel-agents` 并行执行
- 依赖子任务 → 顺序执行
- 咨询需求 → 使用 Oracle 代理

### 6.2 强制 TDD 循环

**每个子任务必须遵循**：

```
RED    → 编写失败测试 → 运行并证明失败（提供输出证据）
GREEN  → 编写最小代码 → 运行并证明通过（提供输出证据）
REFACTOR → 优化代码 → 确保测试仍然通过
```

**证据要求**：必须提供测试运行的完整输出，禁止仅声明"测试通过"。

### 6.3 原子提交

**一个子任务 = 一次提交**：

```bash
# 1. 添加变更
git add <files>

# 2. 提交（Conventional Commits 格式）
git commit -m "<type>(<scope>): <subject>"

# 3. 展示提交记录（证据）
git log -1
```

**提交信息格式**：
```
<type>(<scope>): <subject>

<body> (可选，详细说明)

<footer> (可选，关联 Issue)
```

**Type 类型**：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `test` - 测试相关
- `chore` - 构建/工具变更

**示例**：
```
feat(auth): add email validation for login form

- Add email format validation
- Show error message for invalid email
- Update i18n translations

Closes #123
```

### 7.4 编码规范

#### TypeScript 规范

**必须遵守**：
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

**类型安全规则**：
1. 禁止使用 `any` 类型
2. 函数参数和返回值必须标注类型
3. 使用 `unknown` 替代 `any`（如必须）
4. 使用可选链 `?.` 和空值合并 `??`

#### Vue 组件规范

**Composition API 语法**：
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

**组件拆分规则**：
- 单组件行数：<500 行
- 职责单一原则
- 可复用组件独立

#### 代码风格

**格式化规则**：
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

## 八、阶段四：收尾、集成与交付

### 8.1 全量验证

**所有子任务完成后必须执行**：

```bash
# 1. 类型检查
pnpm type-check

# 2. 代码检查
pnpm eslint src/

# 3. 测试套件
pnpm test

# 4. 构建验证
pnpm build
```

**证据要求**：必须提供完整测试运行输出，证明无回归错误。

### 8.2 Git 分支收尾

**自检代码**：
- [ ] 无调试代码
- [ ] 无敏感信息泄露
- [ ] 所有提交信息符合规范

**推送分支**：
```bash
git push -u origin <branch-name>
```

### 8.3 生成 PR 描述

**必须包含**：

```markdown
## 变更概述
<简要描述本次修改内容>

## 变更详情
- <具体变更 1>
- <具体变更 2>

## 测试情况
- [ ] 所有测试通过
- [ ] 类型检查通过
- [ ] 代码检查通过
- [ ] 构建成功

## 关联文档
- Design: `docs/designs/YYYY-MM-DD-<topic>.md`
- Plan: `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`

## 审查建议
请重点关注以下文件的变更：
- `src/<file1>`
- `src/<file2>`
```

### 7.4 最终声明

**必须声明**："任务已完成。分支 `<branch-name>` 已推送。请审查以下变更并决定是否合并…"

---

## 九、测试规范

### 9.1 测试要求

**新增功能必须**：
1. 添加单元测试
2. 测试覆盖率 >80%
3. 通过所有现有测试

### 9.2 测试框架

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

### 9.3 测试优先级

**必须测试**：
1. 核心服务层（learningSetService, cardService）
2. 工具函数（annotationParser, markdownGenerator）
3. 表单验证逻辑
4. API 调用封装

**建议测试**：
1. 组件渲染
2. 用户交互
3. 边界条件

---

## 十、错误处理

### 10.1 统一错误处理

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

### 10.2 错误处理规则

**必须处理**：
1. 所有异步操作使用 try-catch
2. API 调用检查响应码
3. 用户可见错误使用思源通知系统

**禁止**：
1. 空 catch 块
2. 吞掉错误不处理
3. 未处理的 Promise rejection

---

## 十一、代理协作模式

### 11.1 并行代理（OhMyOpenCode 特色）

**独立任务并行执行**：
```typescript
// 正确：并行执行
task(subagent_type="explore", run_in_background=true, ...)
task(subagent_type="librarian", run_in_background=true, ...)

// 错误：顺序执行
result1 = task(..., run_in_background=false)
result2 = task(..., run_in_background=false)
```

### 11.2 Session 连续性

**必须使用 session_id 延续子任务**：

```typescript
// 错误：每次新建会话
task(subagent_type="plan", ...)  // 第一次
task(subagent_type="plan", ...)  // 第二次 - 丢失上下文

// 正确：使用 session_id 延续
const result = task(subagent_type="plan", ...)
// 获取 session_id 后
task(session_id="ses_xxx", prompt="Follow-up: ...")
```

**优势**：
- 保留完整对话上下文
- 避免重复探索
- 节省 70%+ token

### 11.3 Oracle 咨询

**使用场景**：
- 架构设计决策
- 2+ 次修复失败的 Bug
- 性能瓶颈分析
- 安全漏洞评估

---

## 十二、安全规范

### 12.1 数据安全

**禁止提交**：
- `.env` 文件
- API 密钥
- 数据库密码
- 用户隐私数据

**安全实践**：
1. 使用环境变量存储敏感信息
2. 不在代码中硬编码密钥
3. 不在日志中打印敏感数据

### 12.2 代码安全

**检查清单**：
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（转义用户输入）
- [ ] CSRF 防护（验证来源）
- [ ] 文件上传安全（类型检查）

---

## 十三、性能优化

### 13.1 性能规则

**必须优化**：
1. 大列表使用虚拟滚动
2. 搜索输入使用防抖
3. 计算结果使用缓存

**性能指标**：
- 首屏加载：<2 秒
- 列表渲染（1000 项）：<100ms
- 思维导图节点（100+）：<200ms

### 13.2 优化技术

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

## 十四、文档规范

### 14.1 代码注释

**原则**：代码自解释为主，注释为辅

**需要注释的情况**：
1. 公共 API
2. 复杂算法
3. 业务规则
4. 技术决策原因

**注释格式**：
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

### 14.2 文档更新

**需要更新文档的情况**：
1. 新增功能
2. API 变更
3. 架构调整
4. Bug 修复（重要）

**文档位置**：
- 代码注释：JSDoc
- API 文档：`docs/api/`
- 使用指南：`README.md`
- 变更记录：`CHANGELOG.md`

---

## 十五、AI 自检清单

执行任何任务时，必须对照以下问题自检：

- [ ] **规范对齐**：我是否首先阅读了本规范？
- [ ] **Git 隔离**：我是否在动手修改代码前创建了新分支？
- [ ] **复杂度判断**：我是否正确判断了任务复杂度？
- [ ] **设计先行**：对于中等/复杂任务，我是否生成了 Design 文档？
- [ ] **计划制定**：我是否使用 writing-plans 技能生成了 Plan 文档？
- [ ] **Todo 纪律**：我是否创建并维护了 Todo 列表？
- [ ] **TDD 循环**：在每个子任务的实现中，我是否经历了 RED 和 GREEN 阶段并提供了证据？
- [ ] **原子提交**：我是否在每个子任务验证通过后立即进行了 Git 提交？
- [ ] **全量验证**：我是否在推送前运行了全量测试套件并提供了证据？
- [ ] **分支收尾**：我是否推送了分支并生成了标准的 PR 描述？

---

## 十六、常用命令

### 16.1 开发命令

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

### 16.2 发布命令

```bash
# 自动版本（conventional commits）
pnpm release

# 手动版本
pnpm release:patch   # 补丁版本
pnpm release:minor   # 次版本
pnpm release:major   # 主版本
```

---

## 十七、故障排查

### 17.1 常见问题

**问题**: TypeScript 编译错误

**排查步骤**：
1. 运行 `npx tsc --noEmit` 查看错误
2. 定位错误文件
3. 检查类型定义
4. 修复后重新检查

---

**问题**: 组件导入失败

**排查步骤**：
1. 检查文件路径
2. 检查导出语句
3. 检查导入名称
4. 运行 `pnpm dev` 查看实时错误

---

**问题**: 测试失败

**排查步骤**：
1. 阅读失败信息
2. 定位失败测试
3. 检查测试逻辑
4. 修复代码或测试
5. 重新运行测试

---

## 十八、维护说明

**本规范由 AI 代理维护**：
- 规范变更时及时更新此文档
- 重大变更需经用户确认
- 保持与项目实际工作方式同步

---

## 十九、附录：决策树

```
任务开始
  │
  ├─→ 步骤 1: 读取本规范
  │
  ├─→ 步骤 2: 创建 Git 分支（协作模式）
  │
  ├─→ 步骤 3: 判断复杂度
  │    ├─ 简单 → Todo 列表 → 执行 → 验证
  │    ├─ 中等 → brainstorming → writing-plans → 执行 → 验证
  │    └─ 复杂 → brainstorming → writing-plans → Oracle 咨询 → 执行 → 验证
  │
  ├─→ 步骤 4: 执行任务（TDD + 并行代理 + 原子提交）
  │
  ├─→ 步骤 5: 全量验证（类型检查 + 测试 + 构建）
  │
  ├─→ 步骤 6: 推送分支 + 生成 PR 描述
  │
  └─→ 完成任务
```
