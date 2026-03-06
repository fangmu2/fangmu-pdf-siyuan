/**
 * 脑图模板服务（第十九阶段 - 脑图高级功能）
 * 支持脑图模板库、自定义模板、模板导入导出
 */

import type { MindMapNode } from '../types/mindmap'
import { api } from '../api'

/**
 * 脑图模板类型
 */
export type MindMapTemplateType =
  | 'outline' // 大纲型
  | 'timeline' // 时间线型
  | 'fishbone' // 鱼骨图型
  | 'radar' // 雷达图型
  | 'cycle' // 循环图型
  | 'hierarchy' // 层级图型
  | 'concept' // 概念图型
  | 'custom' // 自定义型

/**
 * 脑图模板接口
 */
export interface MindMapTemplate {
  id: string
  name: string
  description: string
  type: MindMapTemplateType
  icon: string
  color: string
  rootNodes: MindMapNode[]
  isSystem: boolean // 是否为系统模板
  createdAt: number
  updatedAt: number
  tags: string[]
  usageCount: number
}

/**
 * 系统预设模板
 */
const SYSTEM_TEMPLATES: MindMapTemplate[] = [
  {
    id: 'template_outline_basic',
    name: '基础大纲',
    description: '适合读书笔记、文章大纲',
    type: 'outline',
    icon: 'format_list_bulleted',
    color: '#4CAF50',
    rootNodes: [
      {
        id: 'root',
        content: '中心主题',
        children: [
          {
            id: 'c1',
            content: '第一章',
            children: [
              {
                id: 'c1-1',
                content: '第一节',
              },
              {
                id: 'c1-2',
                content: '第二节',
              },
            ],

          },
          {
            id: 'c2',
            content: '第二章',
            children: [
              {
                id: 'c2-1',
                content: '第一节',
              },
              {
                id: 'c2-2',
                content: '第二节',
              },
            ],

          },
          {
            id: 'c3',
            content: '第三章',
          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['大纲', '读书'],
    usageCount: 0,
  },
  {
    id: 'template_timeline_event',
    name: '时间线事件',
    description: '适合历史事件、项目进度',
    type: 'timeline',
    icon: 'timeline',
    color: '#2196F3',
    rootNodes: [
      {
        id: 'root',
        content: '事件时间线',
        children: [
          {
            id: 't1',
            content: '阶段一',
            children: [
              {
                id: 't1-1',
                content: '事件 1',
                note: '时间：YYYY-MM-DD',
              },
              {
                id: 't1-2',
                content: '事件 2',
                note: '时间：YYYY-MM-DD',
              },
            ],

          },
          {
            id: 't2',
            content: '阶段二',
            children: [
              {
                id: 't2-1',
                content: '事件 3',
                note: '时间：YYYY-MM-DD',
              },
              {
                id: 't2-2',
                content: '事件 4',
                note: '时间：YYYY-MM-DD',
              },
            ],

          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['时间线', '事件'],
    usageCount: 0,
  },
  {
    id: 'template_fishbone_cause',
    name: '鱼骨图分析',
    description: '适合问题分析、原因追溯',
    type: 'fishbone',
    icon: 'analytics',
    color: '#FF9800',
    rootNodes: [
      {
        id: 'root',
        content: '问题/结果',
        children: [
          {
            id: 'f1',
            content: '人员因素',
            children: [
              {
                id: 'f1-1',
                content: '原因 1',
              },
              {
                id: 'f1-2',
                content: '原因 2',
              },
            ],

          },
          {
            id: 'f2',
            content: '设备因素',
            children: [
              {
                id: 'f2-1',
                content: '原因 1',
              },
              {
                id: 'f2-2',
                content: '原因 2',
              },
            ],

          },
          {
            id: 'f3',
            content: '材料因素',
            children: [
              {
                id: 'f3-1',
                content: '原因 1',
              },
              {
                id: 'f3-2',
                content: '原因 2',
              },
            ],

          },
          {
            id: 'f4',
            content: '方法因素',
            children: [
              {
                id: 'f4-1',
                content: '原因 1',
              },
              {
                id: 'f4-2',
                content: '原因 2',
              },
            ],

          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['鱼骨图', '分析'],
    usageCount: 0,
  },
  {
    id: 'template_concept_map',
    name: '概念关系图',
    description: '适合知识点关联、概念理解',
    type: 'concept',
    icon: 'account_tree',
    color: '#9C27B0',
    rootNodes: [
      {
        id: 'root',
        content: '核心概念',
        children: [
          {
            id: 'c1',
            content: '相关概念 A',
            children: [
              {
                id: 'c1-1',
                content: '子概念 A1',
              },
              {
                id: 'c1-2',
                content: '子概念 A2',
              },
            ],

          },
          {
            id: 'c2',
            content: '相关概念 B',
            children: [
              {
                id: 'c2-1',
                content: '子概念 B1',
              },
              {
                id: 'c2-2',
                content: '子概念 B2',
              },
            ],

          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['概念图', '关联'],
    usageCount: 0,
  },
  {
    id: 'template_hierarchy_org',
    name: '组织架构',
    description: '适合组织结构、层级关系',
    type: 'hierarchy',
    icon: 'account_tree',
    color: '#607D8B',
    rootNodes: [
      {
        id: 'root',
        content: '组织名称',
        children: [
          {
            id: 'd1',
            content: '部门 A',
            children: [
              {
                id: 'd1-1',
                content: '小组 A1',
              },
              {
                id: 'd1-2',
                content: '小组 A2',
              },
            ],

          },
          {
            id: 'd2',
            content: '部门 B',
            children: [
              {
                id: 'd2-1',
                content: '小组 B1',
              },
              {
                id: 'd2-2',
                content: '小组 B2',
              },
            ],

          },
          {
            id: 'd3',
            content: '部门 C',
          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['组织', '层级'],
    usageCount: 0,
  },
  {
    id: 'template_cycle_process',
    name: '循环流程图',
    description: '适合循环过程、周期性内容',
    type: 'cycle',
    icon: 'refresh',
    color: '#E91E63',
    rootNodes: [
      {
        id: 'root',
        content: '循环主题',
        children: [
          {
            id: 's1',
            content: '步骤 1',
            children: [
              {
                id: 's1-1',
                content: '说明',
              },
            ],

          },
          {
            id: 's2',
            content: '步骤 2',
            children: [
              {
                id: 's2-1',
                content: '说明',
              },
            ],

          },
          {
            id: 's3',
            content: '步骤 3',
            children: [
              {
                id: 's3-1',
                content: '说明',
              },
            ],

          },
          {
            id: 's4',
            content: '步骤 4',
            children: [
              {
                id: 's4-1',
                content: '说明',
              },
            ],

          },
        ],
      },
    ],
    isSystem: true,
    createdAt: 0,
    updatedAt: 0,
    tags: ['循环', '流程'],
    usageCount: 0,
  },
]

/**
 * 脑图模板服务类
 */
class MindMapTemplateServiceClass {
  private storagePath = '/data/mindmapTemplates/'

  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<MindMapTemplate[]> {
    const systemTemplates = [...SYSTEM_TEMPLATES]
    const customTemplates = await this.getCustomTemplates()
    return [...systemTemplates, ...customTemplates]
  }

  /**
   * 获取系统模板
   */
  getSystemTemplates(): MindMapTemplate[] {
    return [...SYSTEM_TEMPLATES]
  }

  /**
   * 获取自定义模板
   */
  async getCustomTemplates(): Promise<MindMapTemplate[]> {
    try {
      const data = await api.storage.get(`${this.storagePath}custom`)
      if (!data) return []
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  /**
   * 根据 ID 获取模板
   */
  async getTemplateById(templateId: string): Promise<MindMapTemplate | null> {
    // 先查找系统模板
    const systemTemplate = SYSTEM_TEMPLATES.find((t) => t.id === templateId)
    if (systemTemplate) {
      return { ...systemTemplate }
    }

    // 查找自定义模板
    const customTemplates = await this.getCustomTemplates()
    const customTemplate = customTemplates.find((t) => t.id === templateId)
    if (customTemplate) {
      return { ...customTemplate }
    }

    return null
  }

  /**
   * 保存自定义模板
   */
  async saveCustomTemplate(template: Omit<MindMapTemplate, 'id' | 'isSystem' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<MindMapTemplate> {
    const customTemplates = await this.getCustomTemplates()

    const newTemplate: MindMapTemplate = {
      ...template,
      id: this.generateId(),
      isSystem: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    }

    customTemplates.push(newTemplate)
    await api.storage.put(`${this.storagePath}custom`, JSON.stringify(customTemplates))

    return newTemplate
  }

  /**
   * 更新自定义模板
   */
  async updateCustomTemplate(templateId: string, updates: Partial<MindMapTemplate>): Promise<MindMapTemplate | null> {
    const customTemplates = await this.getCustomTemplates()
    const index = customTemplates.findIndex((t) => t.id === templateId)

    if (index === -1) return null

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      updatedAt: Date.now(),
    }

    await api.storage.put(`${this.storagePath}custom`, JSON.stringify(customTemplates))
    return customTemplates[index]
  }

  /**
   * 删除自定义模板
   */
  async deleteCustomTemplate(templateId: string): Promise<boolean> {
    const customTemplates = await this.getCustomTemplates()
    const filtered = customTemplates.filter((t) => t.id !== templateId)

    if (filtered.length === customTemplates.length) {
      return false // 模板不存在
    }

    await api.storage.put(`${this.storagePath}custom`, JSON.stringify(filtered))
    return true
  }

  /**
   * 从当前脑图创建模板
   */
  async createTemplateFromMindMap(
    name: string,
    description: string,
    rootNodes: MindMapNode[],
    type: MindMapTemplateType = 'custom',
  ): Promise<MindMapTemplate> {
    return this.saveCustomTemplate({
      name,
      description,
      type,
      icon: 'star',
      color: '#4CAF50',
      rootNodes,
      tags: [],
    })
  }

  /**
   * 应用模板到脑图
   */
  async applyTemplate(templateId: string, mindMapId: string): Promise<MindMapNode[]> {
    const template = await this.getTemplateById(templateId)
    if (!template) {
      throw new Error('模板不存在')
    }

    // 增加使用次数
    if (!template.isSystem) {
      await this.updateCustomTemplate(templateId, {
        usageCount: (template.usageCount || 0) + 1,
      })
    }

    // 深拷贝节点
    return JSON.parse(JSON.stringify(template.rootNodes))
  }

  /**
   * 导出模板
   */
  async exportTemplate(templateId: string): Promise<string> {
    const template = await this.getTemplateById(templateId)
    if (!template) {
      throw new Error('模板不存在')
    }
    return JSON.stringify(template, null, 2)
  }

  /**
   * 导入模板
   */
  async importTemplate(jsonString: string): Promise<MindMapTemplate> {
    try {
      const template: MindMapTemplate = JSON.parse(jsonString)

      // 验证必要字段
      if (!template.name || !template.rootNodes) {
        throw new Error('无效的模板格式')
      }

      // 创建为新模板
      return this.saveCustomTemplate({
        name: template.name,
        description: template.description || '',
        type: template.type || 'custom',
        icon: template.icon || 'star',
        color: template.color || '#4CAF50',
        rootNodes: template.rootNodes,
        tags: template.tags || [],
      })
    } catch (error) {
      throw new Error(`导入模板失败：${(error as Error).message}`)
    }
  }

  /**
   * 按类型筛选模板
   */
  async getTemplatesByType(type: MindMapTemplateType): Promise<MindMapTemplate[]> {
    const allTemplates = await this.getAllTemplates()
    return allTemplates.filter((t) => t.type === type)
  }

  /**
   * 搜索模板
   */
  async searchTemplates(query: string): Promise<MindMapTemplate[]> {
    const allTemplates = await this.getAllTemplates()
    const lowerQuery = query.toLowerCase()
    return allTemplates.filter((t) =>
      t.name.toLowerCase().includes(lowerQuery)
      || t.description.toLowerCase().includes(lowerQuery)
      || t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    )
  }

  /**
   * 获取常用模板
   */
  async getFrequentTemplates(limit: number = 5): Promise<MindMapTemplate[]> {
    const allTemplates = await this.getAllTemplates()
    return allTemplates
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }

  private generateId(): string {
    return `template_${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`
  }
}

export const mindmapTemplateService = new MindMapTemplateServiceClass()
