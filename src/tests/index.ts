/**
 * 测试文件导出
 * 用于组织和管理所有测试文件
 */

// 工具函数测试
export * from './utils/errorHandler.test';
export * from './utils/helpers.test';

// 服务层测试
export * from './services/studySetService.test';
export * from './services/cardService.test';
export * from './services/reviewService.test';

// 组件测试
// export * from './components/StudySetManager.test';
// export * from './components/CardEditor.test';
// export * from './components/ReviewSession.test';

// 测试工具导出
export { defineComponent, h } from 'vue';

/**
 * 创建 mock 响应
 */
export function createMockResponse<T>(data: T, code = 0, msg = ''): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ code, msg, data }),
  } as Response);
}

/**
 * 创建 mock 错误响应
 */
export function createMockErrorResponse(code: number, msg: string): Promise<Response> {
  return Promise.resolve({
    ok: code === 0,
    status: code === 0 ? 200 : 500,
    json: async () => ({ code, msg, data: null }),
  } as Response);
}

/**
 * 等待指定毫秒数
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建异步操作
 */
export function createAsyncFn<T>(result: T, delay = 0): () => Promise<T> {
  return () => {
    if (delay > 0) {
      return wait(delay).then(() => result);
    }
    return Promise.resolve(result);
  };
}

/**
 * 创建拒绝的 Promise
 */
export function createRejectedFn(error: Error, delay = 0): () => Promise<never> {
  return () => {
    if (delay > 0) {
      return wait(delay).then(() => {
        throw error;
      });
    }
    return Promise.reject(error);
  };
}
