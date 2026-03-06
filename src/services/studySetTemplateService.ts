/**
 * 学习集模板服务
 * 提供预设的学习集模板（考试复习、文献研读等）
 */

import { cardService } from './cardService'
import { studySetService } from './studySetService'

/**
 * 模板类型
 */
export type TemplateType =
  | 'exam-review' // 考试复习
  | 'literature-study' // 文献研读
  | 'language-learning' // 语言学习
  | 'skill-mastery' // 技能掌握
  | 'project-research' // 项目研究
  | 'custom' // 自定义

/**
 * 模板卡片类型
 */
export interface TemplateCard {
  /** 卡片标题 */
  title: string
  /** 卡片内容 */
  content: string
  /** 卡片类型：普通/闪卡 */
  cardType: 'normal' | 'flashcard'
  /** 闪卡正面（如果是闪卡） */
  front?: string
  /** 闪卡反面（如果是闪卡） */
  back?: string
  /** 标签 */
  tags?: string[]
  /** 难度等级 (1-5) */
  difficulty?: number
  /** 状态 */
  status?: 'new' | 'learning' | 'review' | 'suspended'
  /** 备注 */
  note?: string
}

/**
 * 模板脑图节点
 */
export interface TemplateMindMapNode {
  /** 节点 ID */
  id: string
  /** 节点文本 */
  text: string
  /** 父节点 ID */
  parentId?: string
  /** 节点样式 */
  style?: {
    backgroundColor?: string
    color?: string
    icon?: string
  }
  /** 关联的卡片 ID 列表 */
  cardIds?: string[]
}

/**
 * 学习集模板
 */
export interface StudySetTemplate {
  /** 模板 ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板类型 */
  type: TemplateType
  /** 模板图标 */
  icon: string
  /** 模板颜色 */
  color: string
  /** 预设卡片 */
  cards: TemplateCard[]
  /** 预设脑图节点 */
  mindMapNodes: TemplateMindMapNode[]
  /** 复习设置 */
  reviewSettings: {
    /** 每日新卡数量 */
    newCardsPerDay: number
    /** 每日复习上限 */
    reviewLimit: number
    /** 使用 FSRS 算法 */
    useFSRS: boolean
    /** FSRS 参数 */
    fsrsParams?: {
      requestRetention: number
      maximumInterval: number
    }
  }
  /** 预设标签 */
  defaultTags: string[]
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 是否为内置模板 */
  isBuiltIn: boolean
}

/**
 * 内置模板定义
 */
const BUILTIN_TEMPLATES: StudySetTemplate[] = [
  {
    id: 'template-exam-review',
    name: '考试复习',
    description: '适合考试复习，包含知识点卡片和错题本结构',
    type: 'exam-review',
    icon: '📚',
    color: '#4285f4',
    cards: [
      {
        title: '欢迎使用考试复习模板',
        content: '这个模板帮助你高效备考。建议：\n1. 按章节创建知识卡片\n2. 记录错题并定期复习\n3. 使用思维导图构建知识框架',
        cardType: 'normal',
        tags: ['说明'],
        difficulty: 1,
      },
      {
        title: '复习计划示例',
        content: '制定合理的复习计划：\n- 第一轮：全面覆盖所有知识点\n- 第二轮：重点突破薄弱环节\n- 第三轮：模拟考试和错题回顾',
        cardType: 'normal',
        tags: ['计划'],
        difficulty: 1,
      },
    ],
    mindMapNodes: [
      {
        id: 'root',
        text: '考试科目',
        style: {
          backgroundColor: '#4285f4',
          color: '#fff',
        },
      },
      {
        id: 'chapter-1',
        text: '第一章',
        parentId: 'root',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'chapter-2',
        text: '第二章',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'chapter-3',
        text: '第三章',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
      {
        id: 'mistakes',
        text: '错题本',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
          icon: '⚠️',
        },
      },
    ],
    reviewSettings: {
      newCardsPerDay: 20,
      reviewLimit: 200,
      useFSRS: true,
      fsrsParams: {
        requestRetention: 0.9,
        maximumInterval: 365,
      },
    },
    defaultTags: ['知识点', '重点', '难点', '错题', '公式', '概念'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'template-literature-study',
    name: '文献研读',
    description: '适合论文和文献阅读，包含摘要、方法、结论等结构化卡片',
    type: 'literature-study',
    icon: '📄',
    color: '#34a853',
    cards: [
      {
        title: '欢迎使用文献研读模板',
        content: '这个模板帮助你系统化阅读文献。建议：\n1. 为每篇文献创建独立卡片组\n2. 记录关键发现和引用\n3. 建立文献间的关联',
        cardType: 'normal',
        tags: ['说明'],
        difficulty: 1,
      },
    ],
    mindMapNodes: [
      {
        id: 'root',
        text: '研究主题',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'background',
        text: '研究背景',
        parentId: 'root',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'method',
        text: '研究方法',
        parentId: 'root',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'results',
        text: '研究结果',
        parentId: 'root',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'conclusion',
        text: '结论',
        parentId: 'root',
        style: {
          backgroundColor: '#34a853',
          color: '#fff',
        },
      },
      {
        id: 'questions',
        text: '待解决问题',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
          icon: '❓',
        },
      },
    ],
    reviewSettings: {
      newCardsPerDay: 10,
      reviewLimit: 100,
      useFSRS: true,
      fsrsParams: {
        requestRetention: 0.85,
        maximumInterval: 180,
      },
    },
    defaultTags: ['摘要', '方法', '结果', '结论', '引用', '待读'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'template-language-learning',
    name: '语言学习',
    description: '适合外语学习，包含单词、语法、例句等卡片类型',
    type: 'language-learning',
    icon: '🌐',
    color: '#fbbc05',
    cards: [
      {
        title: '欢迎使用语言学习模板',
        content: '这个模板帮助你高效学习外语。建议：\n1. 每天学习新单词\n2. 定期复习语法点\n3. 积累常用例句',
        cardType: 'normal',
        tags: ['说明'],
        difficulty: 1,
      },
      {
        title: 'Example Word',
        content: '这是一个示例单词卡片',
        cardType: 'flashcard',
        front: 'Example (n.)',
        back: '例子，示例\n\n例句：This is a good example.',
        tags: ['单词', '示例'],
        difficulty: 2,
      },
    ],
    mindMapNodes: [
      {
        id: 'root',
        text: '语言学习',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'vocabulary',
        text: '词汇',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'grammar',
        text: '语法',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'sentences',
        text: '例句',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'listening',
        text: '听力',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
      {
        id: 'speaking',
        text: '口语',
        parentId: 'root',
        style: {
          backgroundColor: '#fbbc05',
          color: '#fff',
        },
      },
    ],
    reviewSettings: {
      newCardsPerDay: 30,
      reviewLimit: 300,
      useFSRS: true,
      fsrsParams: {
        requestRetention: 0.9,
        maximumInterval: 90,
      },
    },
    defaultTags: ['单词', '语法', '例句', '听力', '口语', '阅读', '写作'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'template-skill-mastery',
    name: '技能掌握',
    description: '适合学习新技能，包含概念、步骤、练习等卡片',
    type: 'skill-mastery',
    icon: '🎯',
    color: '#ea4335',
    cards: [
      {
        title: '欢迎使用技能掌握模板',
        content: '这个模板帮助你系统化学习新技能。建议：\n1. 分解技能为小步骤\n2. 记录关键概念和要点\n3. 定期练习并记录进度',
        cardType: 'normal',
        tags: ['说明'],
        difficulty: 1,
      },
    ],
    mindMapNodes: [
      {
        id: 'root',
        text: '技能名称',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
      {
        id: 'basics',
        text: '基础知识',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
      {
        id: 'steps',
        text: '操作步骤',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
      {
        id: 'tips',
        text: '技巧要点',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
      {
        id: 'practice',
        text: '练习任务',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
          icon: '✅',
        },
      },
      {
        id: 'resources',
        text: '学习资源',
        parentId: 'root',
        style: {
          backgroundColor: '#ea4335',
          color: '#fff',
        },
      },
    ],
    reviewSettings: {
      newCardsPerDay: 15,
      reviewLimit: 150,
      useFSRS: true,
      fsrsParams: {
        requestRetention: 0.85,
        maximumInterval: 60,
      },
    },
    defaultTags: ['概念', '步骤', '技巧', '练习', '资源', '笔记'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'template-project-research',
    name: '项目研究',
    description: '适合项目研究和知识管理，包含问题、方案、进度等卡片',
    type: 'project-research',
    icon: '🔬',
    color: '#9c27b0',
    cards: [
      {
        title: '欢迎使用项目研究模板',
        content: '这个模板帮助你管理项目研究。建议：\n1. 明确研究问题和目标\n2. 记录研究过程和发现\n3. 定期整理和总结',
        cardType: 'normal',
        tags: ['说明'],
        difficulty: 1,
      },
    ],
    mindMapNodes: [
      {
        id: 'root',
        text: '研究项目',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
      {
        id: 'question',
        text: '研究问题',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
          icon: '❓',
        },
      },
      {
        id: 'hypothesis',
        text: '研究假设',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
      {
        id: 'experiment',
        text: '实验设计',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
      {
        id: 'data',
        text: '数据收集',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
      {
        id: 'analysis',
        text: '数据分析',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
      {
        id: 'conclusion',
        text: '研究结论',
        parentId: 'root',
        style: {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      },
    ],
    reviewSettings: {
      newCardsPerDay: 10,
      reviewLimit: 100,
      useFSRS: false,
    },
    defaultTags: ['问题', '假设', '实验', '数据', '分析', '结论', '进度'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
]

/**
 * 模板存储服务键
 */
const STORAGE_KEY = 'marginnote-studyset-templates'

/**
 * 学习集模板管理器
 */
class StudySetTemplateManager {
  private templates: StudySetTemplate[] = []

  constructor() {
    this.loadTemplates()
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): StudySetTemplate[] {
    return [...this.templates]
  }

  /**
   * 获取内置模板
   */
  getBuiltInTemplates(): StudySetTemplate[] {
    return this.templates.filter((t) => t.isBuiltIn)
  }

  /**
   * 获取自定义模板
   */
  getCustomTemplates(): StudySetTemplate[] {
    return this.templates.filter((t) => !t.isBuiltIn)
  }

  /**
   * 按类型获取模板
   */
  getTemplateByType(type: TemplateType): StudySetTemplate | undefined {
    return this.templates.find((t) => t.type === type)
  }

  /**
   * 根据 ID 获取模板
   */
  getTemplateById(id: string): StudySetTemplate | undefined {
    return this.templates.find((t) => t.id === id)
  }

  /**
   * 保存自定义模板
   */
  saveTemplate(template: Omit<StudySetTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>): StudySetTemplate {
    const newTemplate: StudySetTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: false,
    }

    this.templates.push(newTemplate)
    this.saveToStorage()
    return newTemplate
  }

  /**
   * 更新自定义模板
   */
  updateTemplate(id: string, updates: Partial<StudySetTemplate>): boolean {
    const index = this.templates.findIndex((t) => t.id === id && !t.isBuiltIn)
    if (index === -1) return false

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: Date.now(),
    }

    this.saveToStorage()
    return true
  }

  /**
   * 删除自定义模板
   */
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex((t) => t.id === id && !t.isBuiltIn)
    if (index === -1) return false

    this.templates.splice(index, 1)
    this.saveToStorage()
    return true
  }

  /**
   * 从模板创建学习集
   */
  async createStudySetFromTemplate(
    templateId: string,
    studySetName: string,
    notebookId: string,
  ): Promise<{ studySetId: string, cardIds: string[], mindMapId?: string }> {
    const template = this.getTemplateById(templateId)
    if (!template) {
      throw new Error('模板不存在')
    }

    // 创建学习集
    const studySetResult = await studySetService.createStudySet(studySetName, notebookId, {
      description: template.description,
      coverImage: null,
      reviewSettings: template.reviewSettings,
    })

    const studySetId = studySetResult.id
    const cardIds: string[] = []

    // 创建预设卡片
    for (const cardTemplate of template.cards) {
      try {
        const cardResult = await cardService.createCard({
          title: cardTemplate.title,
          content: cardTemplate.content,
          studySetId,
          type: cardTemplate.cardType === 'flashcard' ? 'flashcard' : 'normal',
          front: cardTemplate.front,
          back: cardTemplate.back,
          tags: cardTemplate.tags || [],
          difficulty: cardTemplate.difficulty || 3,
          status: cardTemplate.status || 'new',
        })
        cardIds.push(cardResult.id)
      } catch (error) {
        console.error('创建模板卡片失败:', error)
      }
    }

    // 返回结果，脑图可以在前端创建
    return {
      studySetId,
      cardIds,
    }
  }

  /**
   * 重置为内置模板
   */
  resetToBuiltIn(): void {
    this.templates = [...BUILTIN_TEMPLATES]
    this.saveToStorage()
  }

  /**
   * 加载模板
   */
  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const customTemplates = JSON.parse(stored) as StudySetTemplate[]
        this.templates = [...BUILTIN_TEMPLATES, ...customTemplates.filter((t) => !t.isBuiltIn)]
      } else {
        this.templates = [...BUILTIN_TEMPLATES]
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      this.templates = [...BUILTIN_TEMPLATES]
    }
  }

  /**
   * 保存模板到存储
   */
  private saveToStorage(): void {
    try {
      const customTemplates = this.templates.filter((t) => !t.isBuiltIn)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates))
    } catch (error) {
      console.error('保存模板失败:', error)
    }
  }
}

// 导出单例
export const studySetTemplateManager = new StudySetTemplateManager()

/**
 * 模板服务
 */
export const studySetTemplateService = {
  getAllTemplates: () => studySetTemplateManager.getAllTemplates(),
  getBuiltInTemplates: () => studySetTemplateManager.getBuiltInTemplates(),
  getCustomTemplates: () => studySetTemplateManager.getCustomTemplates(),
  getTemplateByType: (type: TemplateType) => studySetTemplateManager.getTemplateByType(type),
  getTemplateById: (id: string) => studySetTemplateManager.getTemplateById(id),
  saveTemplate: (template: Omit<StudySetTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>) =>
    studySetTemplateManager.saveTemplate(template),
  updateTemplate: (id: string, updates: Partial<StudySetTemplate>) =>
    studySetTemplateManager.updateTemplate(id, updates),
  deleteTemplate: (id: string) => studySetTemplateManager.deleteTemplate(id),
  createStudySetFromTemplate: (templateId: string, studySetName: string, notebookId: string) =>
    studySetTemplateManager.createStudySetFromTemplate(templateId, studySetName, notebookId),
  resetToBuiltIn: () => studySetTemplateManager.resetToBuiltIn(),
}
