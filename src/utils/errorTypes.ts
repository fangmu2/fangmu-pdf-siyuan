/**
 * 统一错误类型定义
 * 提供标准化的错误处理基础设施
 */

/**
 * 错误代码枚举
 * 用于分类和追踪不同类型的错误
 */
export enum ErrorCode {
  /** API 调用错误 */
  API_ERROR = 'API_ERROR',
  /** 数据验证错误 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 网络连接错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 资源未找到 */
  NOT_FOUND = 'NOT_FOUND',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 应用统一错误类
 * 封装错误信息，提供用户友好提示和错误追踪能力
 */
export class AppError extends Error {
  /**
   * 创建应用错误实例
   * @param message - 错误详细信息（用于日志）
   * @param code - 错误代码（用于错误分类）
   * @param userMessage - 用户友好提示（可选，用于 UI 展示）
   * @param originalError - 原始错误对象（可选，用于错误链）
   */
  constructor(
    message: string,
    public code: ErrorCode,
    public userMessage?: string,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
