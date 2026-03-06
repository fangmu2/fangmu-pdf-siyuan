/**
 * 模板存储服务
 * @fileoverview 提供布局模板的持久化存储、导出导入功能
 */

import type { LayoutTemplate } from '@/types/layoutTemplate'
import { PRESET_TEMPLATES } from '@/types/layoutTemplate'

const STORAGE_KEY = 'mindmap_layout_templates'

/**
 * 加载自定义模板
 */
export function loadCustomTemplates(): LayoutTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const templates = JSON.parse(stored) as LayoutTemplate[]
    return templates.filter((t) => !t.isPreset) // 只返回自定义模板
  } catch (error) {
    console.error('加载模板失败:', error)
    return []
  }
}

/**
 * 加载所有模板（预设 + 自定义）
 */
export function loadAllTemplates(): LayoutTemplate[] {
  const customTemplates = loadCustomTemplates()
  return [...PRESET_TEMPLATES, ...customTemplates]
}

/**
 * 保存自定义模板
 */
export function saveCustomTemplate(template: LayoutTemplate): void {
  try {
    const templates = loadCustomTemplates()
    // 如果已存在同名模板，更新它
    const existingIndex = templates.findIndex((t) => t.id === template.id)
    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...template,
        updatedAt: Date.now(),
      }
    } else {
      templates.push(template)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('保存模板失败:', error)
    throw new Error('保存模板失败')
  }
}

/**
 * 删除自定义模板
 */
export function deleteCustomTemplate(templateId: string): void {
  try {
    const templates = loadCustomTemplates()
    const filtered = templates.filter((t) => t.id !== templateId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('删除模板失败:', error)
    throw new Error('删除模板失败')
  }
}

/**
 * 导出模板到文件
 */
export function exportTemplate(template: LayoutTemplate): void {
  try {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出模板失败:', error)
    throw new Error('导出模板失败')
  }
}

/**
 * 从文件导入模板
 */
export function importTemplate(file: File): Promise<LayoutTemplate> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target!.result as string) as LayoutTemplate
        // 验证模板结构
        if (!template.id || !template.name || !template.layoutType || !template.config) {
          reject(new Error('无效的模板文件格式'))
          return
        }
        // 为新模板生成 ID，避免冲突
        template.id = `imported-${Date.now()}-${template.id}`
        template.isPreset = false
        template.createdAt = Date.now()
        template.updatedAt = Date.now()
        resolve(template)
      } catch (_err) {
        reject(new Error('解析模板文件失败'))
      }
    }
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    reader.readAsText(file)
  })
}

/**
 * 获取模板数量统计
 */
export function getTemplateStats(): { preset: number, custom: number, total: number } {
  const customTemplates = loadCustomTemplates()
  return {
    preset: PRESET_TEMPLATES.length,
    custom: customTemplates.length,
    total: PRESET_TEMPLATES.length + customTemplates.length,
  }
}
