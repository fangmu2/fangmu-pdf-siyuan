/**
 * Vitest 测试配置
 * Vitest 是一个 Vite 驱动的测试框架，与 Vue 3 完美集成
 */

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],

  test: {
    // 测试环境
    environment: 'jsdom',

    // 全局超时
    testTimeout: 10000,

    // 包含测试文件的模式
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // 排除的文件
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.vue',
        '**/index.ts',
      ],
    },

    // 全局测试设置
    setupFiles: ['./src/tests/setup.ts'],

    // 全局测试钩子
    // globalSetup: ['./src/tests/global-setup.ts'],

    // 模拟配置
    mockReset: true,
    clearMocks: true,

    // 测试报告
    reporters: ['default'],

    // 是否监听文件变化
    watch: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
