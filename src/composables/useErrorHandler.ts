/**
 * 统一错误处理组合式函数
 * 提供标准化的错误处理、日志记录和用户提示
 */

import { showMessage } from 'siyuan'
import {
  AppError,
  ErrorCode,
} from '@/utils/errorTypes'

/**
 * 错误处理返回值
 */
interface UseErrorHandlerReturn {
  /**
   * 处理错误
   * @param error - 捕获到的错误
   * @param context - 错误发生的上下文
   * @returns 标准化后的 AppError
   */
  handleError: (error: unknown, context: string) => AppError

  /**
   * 创建自定义应用错误
   * @param message - 错误详细信息
   * @param code - 错误代码
   * @param userMessage - 用户友好提示
   * @param originalError - 原始错误对象
   * @returns AppError 实例
   */
  createError: (
    message: string,
    code: ErrorCode,
    userMessage?: string,
    originalError?: unknown,
  ) => AppError

  /**
   * 将未知错误转换为 AppError
   * @param error - 未知错误
   * @param code - 默认错误代码
   * @returns AppError 实例
   */
  toAppError: (error: unknown, code?: ErrorCode) => AppError
}

/**
 * 统一错误处理组合式函数
 * @returns 错误处理方法
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  /**
   * 处理错误
   * 统一日志记录、用户提示和错误转换
   */
  const handleError = (error: unknown, context: string): AppError => {
    // 转换为 AppError
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error instanceof Error ? error.message : String(error),
          ErrorCode.UNKNOWN,
          undefined,
          error,
        )

    // 统一日志格式：[上下文] 错误信息
    console.error(`[${context}] ${appError.message}`, appError)

    // 用户提示（如果有用户友好消息）
    if (appError.userMessage) {
      showMessage(appError.userMessage)
    }

    return appError
  }

  /**
   * 创建自定义应用错误
   */
  const createError = (
    message: string,
    code: ErrorCode,
    userMessage?: string,
    originalError?: unknown,
  ): AppError => {
    return new AppError(message, code, userMessage, originalError)
  }

  /**
   * 将未知错误转换为 AppError
   */
  const toAppError = (error: unknown, code: ErrorCode = ErrorCode.UNKNOWN): AppError => {
    if (error instanceof AppError) {
      return error
    }

    return new AppError(
      error instanceof Error ? error.message : String(error),
      code,
      undefined,
      error,
    )
  }

  return {
    handleError,
    createError,
    toAppError,
  }
}

export default useErrorHandler
