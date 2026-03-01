/**
 * 错误处理工具测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorType,
  handleError,
  handleErrorWithRetry,
  getFriendlyMessage,
  toAppError,
  getErrorTypeByStatus,
  showErrorToast,
  configureErrorHandler,
  createAsyncHandler,
} from '../../utils/errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置配置
    configureErrorHandler({ silent: true });
  });

  describe('ErrorType', () => {
    it('should have correct error types', () => {
      expect(ErrorType.NETWORK).toBe('NETWORK_ERROR');
      expect(ErrorType.API).toBe('API_ERROR');
      expect(ErrorType.VALIDATION).toBe('VALIDATION_ERROR');
      expect(ErrorType.PERMISSION).toBe('PERMISSION_ERROR');
      expect(ErrorType.NOT_FOUND).toBe('NOT_FOUND_ERROR');
      expect(ErrorType.TIMEOUT).toBe('TIMEOUT_ERROR');
      expect(ErrorType.UNKNOWN).toBe('UNKNOWN_ERROR');
    });
  });

  describe('toAppError', () => {
    it('should convert Error object to AppError', () => {
      const error = new Error('Test error');
      const appError = toAppError(error, ErrorType.API);

      expect(appError.type).toBe(ErrorType.API);
      expect(appError.message).toBe('Test error');
      expect(appError.timestamp).toBeDefined();
    });

    it('should convert string to AppError', () => {
      const appError = toAppError('Error message', ErrorType.NETWORK);

      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.message).toBe('Error message');
    });

    it('should convert object with message to AppError', () => {
      const errorObj = { message: 'Object error', code: 500 };
      const appError = toAppError(errorObj);

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Object error');
    });

    it('should handle unknown error types', () => {
      const appError = toAppError(null);

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Unknown error');
    });
  });

  describe('getErrorTypeByStatus', () => {
    it('should return NETWORK for status 0', () => {
      expect(getErrorTypeByStatus(0)).toBe(ErrorType.NETWORK);
    });

    it('should return VALIDATION for status 400', () => {
      expect(getErrorTypeByStatus(400)).toBe(ErrorType.VALIDATION);
    });

    it('should return PERMISSION for status 401', () => {
      expect(getErrorTypeByStatus(401)).toBe(ErrorType.PERMISSION);
    });

    it('should return PERMISSION for status 403', () => {
      expect(getErrorTypeByStatus(403)).toBe(ErrorType.PERMISSION);
    });

    it('should return NOT_FOUND for status 404', () => {
      expect(getErrorTypeByStatus(404)).toBe(ErrorType.NOT_FOUND);
    });

    it('should return TIMEOUT for status 408', () => {
      expect(getErrorTypeByStatus(408)).toBe(ErrorType.TIMEOUT);
    });

    it('should return TIMEOUT for status 504', () => {
      expect(getErrorTypeByStatus(504)).toBe(ErrorType.TIMEOUT);
    });

    it('should return API for status 500', () => {
      expect(getErrorTypeByStatus(500)).toBe(ErrorType.API);
    });

    it('should return UNKNOWN for other status codes', () => {
      expect(getErrorTypeByStatus(200)).toBe(ErrorType.UNKNOWN);
      expect(getErrorTypeByStatus(301)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('getFriendlyMessage', () => {
    it('should return custom message if provided', () => {
      const error = {
        type: ErrorType.API,
        message: 'Custom error message',
        timestamp: Date.now(),
      };

      expect(getFriendlyMessage(error)).toBe('Custom error message');
    });

    it('should return default message for NETWORK error', () => {
      const error = {
        type: ErrorType.NETWORK,
        message: '',
        timestamp: Date.now(),
      };

      const message = getFriendlyMessage(error);
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return message for UNKNOWN error type', () => {
      const error = {
        type: ErrorType.UNKNOWN,
        message: '',
        timestamp: Date.now(),
      };

      const message = getFriendlyMessage(error);
      expect(message).toBeTruthy();
    });
  });

  describe('handleError', () => {
    it('should handle Error object', () => {
      const error = new Error('Test error');
      const appError = handleError(error, 'Test Context');

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Test error');
      expect(appError.details).toEqual({ context: 'Test Context' });
    });

    it('should handle string error', () => {
      const appError = handleError('String error');

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('String error');
    });

    it('should include context in details', () => {
      const error = new Error('Error with context');
      const appError = handleError(error, 'API Call');

      expect(appError.details).toEqual({ context: 'API Call' });
    });
  });

  describe('handleErrorWithRetry', () => {
    it('should return result on first try', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await handleErrorWithRetry(mockFn, 'Test');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const result = await handleErrorWithRetry(mockFn, 'Test', {
        maxRetries: 3,
        retryDelay: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        handleErrorWithRetry(mockFn, 'Test', {
          maxRetries: 2,
          retryDelay: 10,
        })
      ).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('showErrorToast', () => {
    it('should create and remove toast element', () => {
      vi.useFakeTimers();

      showErrorToast(new Error('Toast error'), 1000);

      // Check toast was created
      const toast = document.querySelector('.error-toast');
      expect(toast).toBeTruthy();

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      // Check toast was removed
      expect(document.querySelector('.error-toast')).toBeFalsy();

      vi.useRealTimers();
    });
  });

  describe('createAsyncHandler', () => {
    it('should return result on success', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const handler = createAsyncHandler(mockFn, 'Test');

      const result = await handler();

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return undefined on error', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Fail'));
      const handler = createAsyncHandler(mockFn, 'Test');

      const result = await handler();

      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to wrapped function', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const handler = createAsyncHandler(mockFn, 'Test');

      await handler('arg1', 'arg2', 123);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('configureErrorHandler', () => {
    it('should update error handler config', () => {
      const onError = vi.fn();

      configureErrorHandler({
        silent: true,
        logToConsole: false,
        onError,
      });

      handleError(new Error('Test'));

      expect(onError).not.toHaveBeenCalled(); // silent mode
    });

    it('should call onError callback', () => {
      const onError = vi.fn();

      configureErrorHandler({
        silent: false,
        logToConsole: false,
        onError,
      });

      handleError(new Error('Test error'));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error',
      }));
    });
  });
});
