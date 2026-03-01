/**
 * 统一错误处理工具
 * 提供全局错误捕获、日志记录和用户友好的错误提示
 */

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

// 错误信息接口
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: unknown;
  timestamp: number;
}

// 错误处理回调
export type ErrorCallback = (error: AppError) => void;

// 错误处理配置
export interface ErrorHandlerConfig {
  silent?: boolean; // 是否静默处理
  logToConsole?: boolean; // 是否输出到控制台
  logToServer?: boolean; // 是否上报到服务器
  onError?: ErrorCallback; // 错误回调
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟 (ms)
}

// 默认配置
const defaultConfig: ErrorHandlerConfig = {
  silent: false,
  logToConsole: true,
  logToServer: false,
  maxRetries: 3,
  retryDelay: 1000,
};

// 当前配置
let currentConfig: ErrorHandlerConfig = { ...defaultConfig };

// 错误消息映射 (支持国际化)
const errorMessages: Record<ErrorType, Record<string, string>> = {
  [ErrorType.NETWORK]: {
    zh: '网络连接失败，请检查网络设置',
    en: 'Network connection failed, please check your network settings',
  },
  [ErrorType.API]: {
    zh: '服务器响应错误，请稍后重试',
    en: 'Server response error, please try again later',
  },
  [ErrorType.VALIDATION]: {
    zh: '数据验证失败，请检查输入内容',
    en: 'Data validation failed, please check your input',
  },
  [ErrorType.PERMISSION]: {
    zh: '权限不足，无法执行此操作',
    en: 'Insufficient permissions to perform this action',
  },
  [ErrorType.NOT_FOUND]: {
    zh: '请求的资源不存在',
    en: 'The requested resource does not exist',
  },
  [ErrorType.TIMEOUT]: {
    zh: '请求超时，请检查网络连接',
    en: 'Request timeout, please check your network connection',
  },
  [ErrorType.UNKNOWN]: {
    zh: '发生未知错误，请稍后重试',
    en: 'An unknown error occurred, please try again later',
  },
};

// 获取当前语言
function getCurrentLang(): 'zh' | 'en' {
  const lang = localStorage.getItem('locale') || navigator.language;
  return lang.startsWith('zh') ? 'zh' : 'en';
}

/**
 * 获取友好的错误提示消息
 */
export function getFriendlyMessage(error: AppError): string {
  const lang = getCurrentLang();

  // 如果有自定义消息，返回自定义消息
  if (error.message) {
    return error.message;
  }

  // 返回默认消息
  return errorMessages[error.type]?.[lang] || errorMessages[ErrorType.UNKNOWN][lang];
}

/**
 * 将错误转换为 AppError
 */
export function toAppError(error: unknown, type?: ErrorType): AppError {
  if (error instanceof Error) {
    return {
      type: type || ErrorType.UNKNOWN,
      message: error.message,
      timestamp: Date.now(),
    };
  }

  if (typeof error === 'string') {
    return {
      type: type || ErrorType.UNKNOWN,
      message: error,
      timestamp: Date.now(),
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      type: type || ErrorType.UNKNOWN,
      message: String((error as Record<string, unknown>).message),
      timestamp: Date.now(),
    };
  }

  return {
    type: type || ErrorType.UNKNOWN,
    message: 'Unknown error',
    timestamp: Date.now(),
  };
}

/**
 * 根据 HTTP 状态码判断错误类型
 */
export function getErrorTypeByStatus(status: number): ErrorType {
  if (status === 0) {
    return ErrorType.NETWORK;
  }
  if (status === 400) {
    return ErrorType.VALIDATION;
  }
  if (status === 401 || status === 403) {
    return ErrorType.PERMISSION;
  }
  if (status === 404) {
    return ErrorType.NOT_FOUND;
  }
  if (status === 408 || status === 504) {
    return ErrorType.TIMEOUT;
  }
  if (status >= 500) {
    return ErrorType.API;
  }
  return ErrorType.UNKNOWN;
}

/**
 * 处理错误
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = toAppError(error);

  // 添加上下文信息
  if (context) {
    appError.details = { context };
  }

  // 记录错误
  if (currentConfig.logToConsole && !currentConfig.silent) {
    console.error(`[${appError.type}]`, appError);
  }

  // 触发回调
  if (currentConfig.onError && !currentConfig.silent) {
    currentConfig.onError(appError);
  }

  // 上报到服务器 (可选)
  if (currentConfig.logToServer) {
    logErrorToServer(appError);
  }

  return appError;
}

/**
 * 异步错误处理 (带重试)
 */
export async function handleErrorWithRetry<T>(
  fn: () => Promise<T>,
  context?: string,
  config?: Partial<ErrorHandlerConfig>
): Promise<T> {
  const retries = config?.maxRetries || currentConfig.maxRetries || 3;
  const delay = config?.retryDelay || currentConfig.retryDelay || 1000;

  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次重试，抛出错误
      if (i === retries - 1) {
        break;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  // 处理最终错误
  const appError = handleError(lastError, context);
  throw appError;
}

/**
 * 上报错误到服务器
 */
async function logErrorToServer(error: AppError): Promise<void> {
  try {
    // 这里可以集成到实际的错误上报服务
    // 例如：Sentry, Bugsnag 等
    console.log('[Error Report]', {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  } catch (e) {
    // 上报失败，静默处理
    console.warn('Failed to log error to server:', e);
  }
}

/**
 * 显示错误提示 (Toast/Notification)
 */
export function showErrorToast(error: unknown, duration: number = 3000): void {
  const appError = toAppError(error);
  const message = getFriendlyMessage(appError);

  // 创建 Toast 元素
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: #ff4444;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: slideDown 0.3s ease;
  `;

  document.body.appendChild(toast);

  // 自动移除
  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * 配置错误处理器
 */
export function configureErrorHandler(config: ErrorHandlerConfig): void {
  currentConfig = { ...defaultConfig, ...config };
}

/**
 * 注册全局错误处理器
 */
export function registerGlobalHandlers(): void {
  // 未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, 'Unhandled Promise Rejection');
  });

  // 未捕获的全局错误
  window.addEventListener('error', (event) => {
    event.preventDefault();
    handleError(event.error || event.message, 'Global Error');
  });
}

/**
 * 创建带错误处理的异步函数
 */
export function createAsyncHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      showErrorToast(error);
      return undefined;
    }
  };
}

export default {
  ErrorType,
  handleError,
  handleErrorWithRetry,
  getFriendlyMessage,
  toAppError,
  getErrorTypeByStatus,
  showErrorToast,
  configureErrorHandler,
  registerGlobalHandlers,
  createAsyncHandler,
};
