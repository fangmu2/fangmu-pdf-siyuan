/**
 * VueUse 工具函数封装
 * 遵循 .clinerules.md 规范
 * 提供防抖、节流等常用工具函数
 */

import type { Ref } from 'vue'
import {
  useDebounceFn,
  useIntervalFn,
  useThrottleFn,
  useTimeoutFn,
} from '@vueuse/core'
import {
  ref,

  watch,
} from 'vue'

/**
 * 防抖函数配置
 */
export interface DebounceOptions {
  /** 延迟时间（毫秒） */
  delay?: number
  /** 是否在首次调用时立即执行 */
  immediate?: boolean
  /** 是否取消之前的调用 */
  cancelOnUnmount?: boolean
}

/**
 * 节流函数配置
 */
export interface ThrottleOptions {
  /** 延迟时间（毫秒） */
  delay?: number
  /** 是否在首次调用时立即执行 */
  immediate?: boolean
}

/**
 * 创建防抖函数
 * @param fn 要防抖的函数
 * @param options 防抖配置
 * @returns 防抖后的函数
 */
export function createDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions = {},
): T {
  const {
    delay = 300,
    immediate = false,
    cancelOnUnmount = true,
  } = options

  const debouncedFn = useDebounceFn(fn, delay, immediate)

  // 如果需要取消功能，返回一个包装函数
  if (cancelOnUnmount) {
    return debouncedFn
  }

  return debouncedFn
}

/**
 * 创建节流函数
 * @param fn 要节流的函数
 * @param options 节流配置
 * @returns 节流后的函数
 */
export function createThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions = {},
): T {
  const {
    delay = 300,
    immediate = true,
  } = options

  return useThrottleFn(fn, delay, immediate)
}

/**
 * 创建一次性定时器
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 控制对象（start, stop, isPending）
 */
export function createTimeout(
  callback: () => void,
  delay: number,
): {
  start: () => void
  stop: () => void
  isPending: Ref<boolean>
} {
  const {
    start,
    stop,
    isPending,
  } = useTimeoutFn(callback, delay, { immediate: false })

  return {
    start,
    stop,
    isPending,
  }
}

/**
 * 创建定时器
 * @param callback 回调函数
 * @param interval 间隔时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 控制对象（start, stop, pause, resume）
 */
export function createInterval(
  callback: () => void,
  interval: number,
  immediate: boolean = false,
): {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  isActive: Ref<boolean>
} {
  const {
    start,
    stop,
    pause,
    resume,
    isActive,
  } = useIntervalFn(callback, interval, {
    immediate,
  })

  return {
    start,
    stop,
    pause,
    resume,
    isActive,
  }
}

/**
 * 创建延迟加载的 Ref
 * @param initialValue 初始值
 * @param delay 延迟时间（毫秒）
 * @returns 延迟加载的 Ref
 */
export function createLazyRef<T>(initialValue: T, delay: number = 1000): Ref<T> {
  const value = ref<T>(initialValue)
  const loaded = ref<boolean>(false)

  const { start } = useTimeoutFn(() => {
    loaded.value = true
  }, delay)

  watch(
    loaded,
    (newVal) => {
      if (newVal) {
        // 延迟加载完成
      }
    },
    { immediate: true },
  )

  start()

  return value
}

/**
 * 批量处理函数
 * 将多个快速连续的调用合并为一次批量处理
 * @param processor 批量处理函数
 * @param delay 延迟时间（毫秒）
 * @returns 批量处理函数
 */
export function createBatchProcessor<T>(
  processor: (items: T[]) => Promise<void>,
  delay: number = 100,
): (item: T) => void {
  const queue: T[] = []
  const debouncedProcess = useDebounceFn(async () => {
    if (queue.length > 0) {
      const items = [...queue]
      queue.length = 0
      await processor(items)
    }
  }, delay)

  return (item: T) => {
    queue.push(item)
    debouncedProcess()
  }
}

/**
 * 请求动画帧节流
 * @param fn 要节流的函数
 * @returns 节流后的函数
 */
export function createRafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null
  let lastArgs: any[] = []

  const wrappedFn = (...args: any[]) => {
    lastArgs = args
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs)
        rafId = null
      })
    }
  }

  return wrappedFn as T
}

/**
 * 创建可取消的异步函数
 * @param fn 异步函数
 * @returns 可取消的异步函数
 */
export function createCancellableAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  let abortController: AbortController | null = null

  const wrappedFn = async (...args: any[]) => {
    // 取消之前的请求
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const signal = abortController.signal

    try {
      const result = await fn(...args, { signal })
      return result
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 请求被取消，不抛出错误
        return undefined
      }
      throw error
    } finally {
      abortController = null
    }
  }

  return wrappedFn as T
}

/**
 * 创建轮询函数
 * @param fn 轮询函数
 * @param interval 轮询间隔（毫秒）
 * @param immediate 是否立即执行
 * @returns 控制对象
 */
export function createPoll<T>(
  fn: () => Promise<T>,
  interval: number = 1000,
  immediate: boolean = true,
): {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  isActive: Ref<boolean>
  data: Ref<T | null>
  error: Ref<Error | null>
} {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)

  const {
    start,
    stop,
    pause,
    resume,
    isActive,
  } = useIntervalFn(async () => {
    try {
      const result = await fn()
      data.value = result
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('轮询失败')
    }
  }, interval, { immediate })

  return {
    start,
    stop,
    pause,
    resume,
    isActive,
    data,
    error,
  }
}

/**
 * 创建重试函数
 * @param fn 要重试的函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 重试函数
 */
export function createRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000,
): T {
  const wrappedFn = async (...args: any[]) => {
    let lastError: Error | null = null

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn(...args)
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('操作失败')
        if (i < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  return wrappedFn as T
}

/**
 * 创建序列执行函数
 * 确保异步函数按顺序执行，避免并发问题
 * @param fn 异步函数
 * @returns 序列执行函数
 */
export function createSequential<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  let queue: Promise<any> = Promise.resolve()

  const wrappedFn = async (...args: any[]) => {
    queue = queue.then(() => fn(...args))
    return queue
  }

  return wrappedFn as T
}

// 导出 VueUse 原生函数以便直接使用
export {
  useDebounceFn,
  useIntervalFn,
  useThrottleFn,
  useTimeoutFn,
}
