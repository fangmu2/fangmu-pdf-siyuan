/**
 * i18n 国际化配置
 * 使用 Vue I18n 9.x (Vue 3 版本)
 */

import { createI18n } from 'vue-i18n'
import enUS from './en_US.json'
import zhCN from './zh_CN.json'

// 定义语言类型
export type Locale = 'zh-CN' | 'en-US'

// 语言包消息
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

// 获取浏览器默认语言
function getBrowserLocale(): Locale {
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

// 获取本地存储的语言
function getStoredLocale(): Locale | null {
  const stored = localStorage.getItem('locale')
  if (stored === 'zh-CN' || stored === 'en-US') {
    return stored
  }
  return null
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getStoredLocale() || getBrowserLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  globalInjection: true,
})

// 设置语言
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

// 获取当前语言
export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}

// 可用的语言列表
export const availableLocales = [
  {
    code: 'zh-CN',
    name: '中文',
    flag: '🇨🇳',
  },
  {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
  },
]

export default i18n
