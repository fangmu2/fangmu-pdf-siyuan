import { createApp } from 'vue';

/**
 * 根据 Vue 组件创建 DOM 元素
 * @param component Vue 组件
 * @returns 挂载后的 DOM 元素
 */
export function getDomByVueComponent(component: any): HTMLElement {
  const div = document.createElement('div');
  const app = createApp(component);
  app.mount(div);
  return div;
}

/**
 * 格式化时间戳为可读字符串
 * @param timestamp 时间戳
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  // 今天
  if (isToday(timestamp)) {
    return `今天 ${formatTime(date)}`;
  }

  // 昨天
  if (isYesterday(timestamp)) {
    return `昨天 ${formatTime(date)}`;
  }

  // 本周
  if (isThisWeek(timestamp)) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekdays[date.getDay()]} ${formatTime(date)}`;
  }

  // 其他日期
  return formatDate(date);
}

/**
 * 格式化时间为 HH:mm
 */
function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 判断是否是今天
 */
function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

/**
 * 判断是否是昨天
 */
function isYesterday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return date.toDateString() === yesterday.toDateString();
}

/**
 * 判断是否是本周
 */
function isThisWeek(timestamp: number): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

/**
 * 生成唯一 ID
 * @param prefix 前缀
 * @returns 唯一 ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 深拷贝
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 睡眠函数（用于异步等待）
 * @param ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 判断是否为空值
 * @param value 要判断的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

/**
 * 截断文本到指定长度
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + suffix;
}

/**
 * 从 Markdown 文本中提取纯文本
 * @param markdown Markdown 文本
 * @returns 纯文本
 */
export function extractPlainText(markdown: string): string {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[([^\]]*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
    .replace(/^[#*>\-\d.]+/gm, '') // 移除标题、列表等标记
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // 移除代码块
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
    .replace(/~~([^~]+)~~/g, '$1') // 移除删除线标记
    .trim();
}
