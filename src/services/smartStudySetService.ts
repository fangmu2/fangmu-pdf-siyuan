/**
 * 智能学习集服务
 * 根据筛选条件自动聚合卡片的动态学习集
 */

import type { Card } from '../types/card'
import { sql } from '../api'

/**
 * 智能学习集规则
 */
export interface SmartRule {
  id: string
  name: string
  description?: string
  conditions: RuleCondition[]
  createdAt: number
  updatedAt: number
  cardCount?: number // 匹配的卡片数量（缓存）
  lastUpdated?: number // 最后更新时间
}

/**
 * 规则条件
 */
export interface RuleCondition {
  field: FilterField
  operator: FilterOperator
  value: any
}

/**
 * 可筛选的字段
 */
export type FilterField =
  | 'status' // 卡片状态
  | 'type' // 卡片类型
  | 'tags' // 标签
  | 'source' // 来源文档
  | 'createdAt' // 创建时间
  | 'updatedAt' // 更新时间
  | 'lastReview' // 最后复习时间
  | 'nextReview' // 下次复习时间
  | 'difficulty' // 难度
  | 'content' // 内容关键词

/**
 * 筛选操作符
 */
export type FilterOperator =
  | 'equals' // 等于
  | 'notEquals' // 不等于
  | 'contains' // 包含
  | 'notContains' // 不包含
  | 'startsWith' // 开始于
  | 'endsWith' // 结束于
  | 'greaterThan' // 大于
  | 'lessThan' // 小于
  | 'greaterThanOrEq' // 大于等于
  | 'lessThanOrEq' // 小于等于
  | 'in' // 在...中
  | 'notIn' // 不在...中
  | 'isEmpty' // 为空
  | 'isNotEmpty' // 不为空

/**
 * 字段配置
 */
export const FIELD_CONFIG: Record<FilterField, {
  label: string
  type: 'string' | 'number' | 'date' | 'array' | 'enum'
  operators: FilterOperator[]
  enumValues?: string[]
}> = {
  status: {
    label: '状态',
    type: 'enum',
    operators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: ['new', 'learning', 'review', 'completed', 'suspended'],
  },
  type: {
    label: '类型',
    type: 'enum',
    operators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: ['card', 'flashcard', 'excerpt'],
  },
  tags: {
    label: '标签',
    type: 'array',
    operators: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
  },
  source: {
    label: '来源',
    type: 'string',
    operators: ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith'],
  },
  createdAt: {
    label: '创建时间',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'greaterThanOrEq', 'lessThanOrEq'],
  },
  updatedAt: {
    label: '更新时间',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'greaterThanOrEq', 'lessThanOrEq'],
  },
  lastReview: {
    label: '最后复习',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'greaterThanOrEq', 'lessThanOrEq', 'isEmpty'],
  },
  nextReview: {
    label: '下次复习',
    type: 'date',
    operators: ['equals', 'greaterThan', 'lessThan', 'greaterThanOrEq', 'lessThanOrEq'],
  },
  difficulty: {
    label: '难度',
    type: 'number',
    operators: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEq', 'lessThanOrEq'],
  },
  content: {
    label: '内容',
    type: 'string',
    operators: ['contains', 'notContains', 'startsWith', 'endsWith'],
  },
}

/**
 * 预设规则模板
 */
export const PRESET_RULES: Array<{
  id: string
  name: string
  description: string
  icon: string
  conditions: RuleCondition[]
}> = [
  {
    id: 'due-today',
    name: '今日待复习',
    description: '今天需要复习的卡片',
    icon: '📅',
    conditions: [
      {
        field: 'nextReview',
        operator: 'lessThanOrEq',
        value: Date.now(),
      },
      {
        field: 'status',
        operator: 'notEquals',
        value: 'completed',
      },
    ],
  },
  {
    id: 'overdue',
    name: '已过期',
    description: '超过复习日期未复习的卡片',
    icon: '⚠️',
    conditions: [
      {
        field: 'nextReview',
        operator: 'lessThan',
        value: Date.now() - 86400000,
      },
      {
        field: 'status',
        operator: 'notEquals',
        value: 'completed',
      },
    ],
  },
  {
    id: 'new-cards',
    name: '新卡片',
    description: '最近 7 天创建的卡片',
    icon: '🆕',
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'new',
      },
      {
        field: 'createdAt',
        operator: 'greaterThan',
        value: Date.now() - 7 * 86400000,
      },
    ],
  },
  {
    id: 'difficult',
    name: '困难卡片',
    description: '难度较高的卡片',
    icon: '🔥',
    conditions: [
      {
        field: 'difficulty',
        operator: 'greaterThanOrEq',
        value: 4,
      },
    ],
  },
  {
    id: 'flashcards',
    name: '闪卡',
    description: '所有闪卡',
    icon: '🎴',
    conditions: [
      {
        field: 'type',
        operator: 'equals',
        value: 'flashcard',
      },
    ],
  },
  {
    id: 'no-tags',
    name: '未分类',
    description: '没有标签的卡片',
    icon: '📋',
    conditions: [
      {
        field: 'tags',
        operator: 'isEmpty',
        value: true,
      },
    ],
  },
  {
    id: 'learning',
    name: '学习中',
    description: '正在学习的卡片',
    icon: '📖',
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'learning',
      },
    ],
  },
  {
    id: 'completed-today',
    name: '今日完成',
    description: '今天完成学习的卡片',
    icon: '✅',
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'completed',
      },
      {
        field: 'updatedAt',
        operator: 'greaterThan',
        value: new Date().setHours(0, 0, 0, 0),
      },
    ],
  },
]

/**
 * 存储键
 */
const STORAGE_KEY = 'smart-study-set-rules'

/**
 * 获取所有智能规则
 */
export function getSmartRules(): SmartRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('[getSmartRules] 读取规则失败:', error)
  }

  // 返回预设规则
  return PRESET_RULES.map((preset) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    conditions: preset.conditions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPreset: true,
  })) as SmartRule[]
}

/**
 * 保存智能规则
 */
function saveSmartRules(rules: SmartRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (error) {
    console.error('[saveSmartRules] 保存规则失败:', error)
  }
}

/**
 * 创建智能规则
 */
export function createSmartRule(
  name: string,
  conditions: RuleCondition[],
  description?: string,
): SmartRule {
  const rule: SmartRule = {
    id: generateId(),
    name,
    description,
    conditions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const rules = getSmartRules()
  rules.push(rule)
  saveSmartRules(rules)

  return rule
}

/**
 * 更新智能规则
 */
export function updateSmartRule(
  ruleId: string,
  updates: Partial<SmartRule>,
): SmartRule | null {
  const rules = getSmartRules()
  const index = rules.findIndex((r) => r.id === ruleId)

  if (index === -1) return null

  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: Date.now(),
  }

  saveSmartRules(rules)
  return rules[index]
}

/**
 * 删除智能规则
 */
export function deleteSmartRule(ruleId: string): boolean {
  const rules = getSmartRules()
  const filtered = rules.filter((r) => r.id !== ruleId)

  if (filtered.length === rules.length) return false

  saveSmartRules(filtered)
  return true
}

/**
 * 根据规则获取匹配的卡片
 */
export async function getCardsByRule(rule: SmartRule, notebookId?: string): Promise<Card[]> {
  try {
    // 构建 SQL 查询
    const whereClauses: string[] = []
    const params: any[] = []

    for (const condition of rule.conditions) {
      const clause = buildWhereClause(condition, params)
      if (clause) {
        whereClauses.push(clause)
      }
    }

    if (whereClauses.length === 0) {
      return []
    }

    const whereSql = whereClauses.join(' AND ')
    let stmt = `SELECT * FROM blocks WHERE type IN ('d', 's', 'p') AND (${whereSql})`

    if (notebookId) {
      stmt = `SELECT * FROM blocks WHERE box = '${notebookId}' AND type IN ('d', 's', 'p') AND (${whereSql})`
    }

    const result = await sql({ stmt })
    return (result || []).map(blockToCard)
  } catch (error) {
    console.error('[getCardsByRule] 查询卡片失败:', error)
    return []
  }
}

/**
 * 构建 SQL WHERE 子句
 */
function buildWhereClause(condition: RuleCondition, params: any[]): string | null {
  const {
    field,
    operator,
    value,
  } = condition

  // 根据字段类型处理
  switch (field) {
    case 'status':
    case 'type':
      return buildEnumClause(field, operator, value)

    case 'tags':
      return buildTagsClause(operator, value)

    case 'source':
      return buildSourceClause(operator, value)

    case 'createdAt':
    case 'updatedAt':
    case 'lastReview':
    case 'nextReview':
      return buildDateClause(field, operator, value)

    case 'difficulty':
      return buildNumberClause(field, operator, value)

    case 'content':
      return buildContentClause(operator, value)

    default:
      return null
  }
}

/**
 * 构建枚举字段条件
 */
function buildEnumClause(field: string, operator: FilterOperator, value: any): string {
  const column = field === 'status' ? 'meta->"$.status"' : 'meta->"$.type"'

  switch (operator) {
    case 'equals':
      return `${column} = '${value}'`
    case 'notEquals':
      return `${column} != '${value}'`
    case 'in':
      return `${column} IN (${value.map((v: string) => `'${v}'`).join(', ')})`
    case 'notIn':
      return `${column} NOT IN (${value.map((v: string) => `'${v}'`).join(', ')})`
    default:
      return ''
  }
}

/**
 * 构建标签字段条件
 */
function buildTagsClause(operator: FilterOperator, value: any): string {
  switch (operator) {
    case 'contains':
      return `meta->"$.tags" LIKE '%${value}%'`
    case 'notContains':
      return `meta->"$.tags" NOT LIKE '%${value}%'`
    case 'isEmpty':
      return `JSON_LENGTH(meta->"$.tags") = 0 OR meta->"$.tags" IS NULL`
    case 'isNotEmpty':
      return `JSON_LENGTH(meta->"$.tags") > 0`
    default:
      return ''
  }
}

/**
 * 构建来源字段条件
 */
function buildSourceClause(operator: FilterOperator, value: any): string {
  switch (operator) {
    case 'equals':
      return `meta->"$.sourceLocation.pdfPath" = '${value}'`
    case 'notEquals':
      return `meta->"$.sourceLocation.pdfPath" != '${value}'`
    case 'contains':
      return `meta->"$.sourceLocation.pdfPath" LIKE '%${value}%'`
    case 'startsWith':
      return `meta->"$.sourceLocation.pdfPath" LIKE '${value}%'`
    case 'endsWith':
      return `meta->"$.sourceLocation.pdfPath" LIKE '%${value}'`
    default:
      return ''
  }
}

/**
 * 构建日期字段条件
 */
function buildDateClause(field: string, operator: FilterOperator, value: number): string {
  const columnMap: Record<string, string> = {
    createdAt: 'created',
    updatedAt: 'updated',
    lastReview: 'meta->"$.lastReview"',
    nextReview: 'meta->"$.nextReview"',
  }

  const column = columnMap[field] || field
  const timestamp = value

  switch (operator) {
    case 'equals':
      return `${column} = ${timestamp}`
    case 'greaterThan':
      return `${column} > ${timestamp}`
    case 'lessThan':
      return `${column} < ${timestamp}`
    case 'greaterThanOrEq':
      return `${column} >= ${timestamp}`
    case 'lessThanOrEq':
      return `${column} <= ${timestamp}`
    case 'isEmpty':
      return `${column} IS NULL OR ${column} = 0`
    default:
      return ''
  }
}

/**
 * 构建数字字段条件
 */
function buildNumberClause(field: string, operator: FilterOperator, value: number): string {
  const column = `meta->"$.${field}"`

  switch (operator) {
    case 'equals':
      return `${column} = ${value}`
    case 'notEquals':
      return `${column} != ${value}`
    case 'greaterThan':
      return `${column} > ${value}`
    case 'lessThan':
      return `${column} < ${value}`
    case 'greaterThanOrEq':
      return `${column} >= ${value}`
    case 'lessThanOrEq':
      return `${column} <= ${value}`
    default:
      return ''
  }
}

/**
 * 构建内容字段条件
 */
function buildContentClause(operator: FilterOperator, value: string): string {
  switch (operator) {
    case 'contains':
      return `content LIKE '%${value}%'`
    case 'notContains':
      return `content NOT LIKE '%${value}%'`
    case 'startsWith':
      return `content LIKE '${value}%'`
    case 'endsWith':
      return `content LIKE '%${value}'`
    default:
      return ''
  }
}

/**
 * 将块转换为卡片对象
 */
function blockToCard(block: any): Card {
  return {
    id: block.id,
    type: block.meta?.type || 'card',
    content: block.content || '',
    front: block.meta?.front || '',
    back: block.meta?.back || '',
    status: block.meta?.status || 'new',
    tags: block.meta?.tags || [],
    sourceLocation: block.meta?.sourceLocation || {},
    difficulty: block.meta?.difficulty || 1,
    createdAt: block.created || Date.now(),
    updatedAt: block.updated || Date.now(),
    srs: block.meta?.srs || null,
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取规则匹配的卡片数量
 */
export async function getRuleCardCount(rule: SmartRule, notebookId?: string): Promise<number> {
  const cards = await getCardsByRule(rule, notebookId)
  return cards.length
}

/**
 * 更新所有规则的卡片计数缓存
 */
export async function updateRuleCardCounts(notebookId?: string): Promise<void> {
  const rules = getSmartRules()

  for (const rule of rules) {
    const count = await getRuleCardCount(rule, notebookId)
    rule.cardCount = count
    rule.lastUpdated = Date.now()
  }

  saveSmartRules(rules)
}

/**
 * 获取预设规则
 */
export function getPresetRule(id: string): typeof PRESET_RULES[0] | undefined {
  return PRESET_RULES.find((r) => r.id === id)
}

/**
 * 导出服务对象
 */
export const smartStudySetService = {
  getSmartRules,
  createSmartRule,
  updateSmartRule,
  deleteSmartRule,
  getCardsByRule,
  getRuleCardCount,
  updateRuleCardCounts,
  getPresetRule,
  FIELD_CONFIG,
  PRESET_RULES,
}
