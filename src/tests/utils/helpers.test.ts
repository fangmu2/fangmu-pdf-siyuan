/**
 * 基础工具函数测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatTimestamp,
  generateId,
  debounce,
  throttle,
  deepClone,
  sleep,
  isEmpty,
  truncateText,
  extractPlainText,
} from '../../utils/index';

describe('helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateId', () => {
    it('should generate unique id with prefix', () => {
      const id = generateId('test_');
      expect(id).toMatch(/^test_\d+_[a-z0-9]{9}$/);
    });

    it('should generate unique id without prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+_[a-z0-9]{9}$/);
    });

    it('should generate different ids', () => {
      const id1 = generateId('prefix_');
      const id2 = generateId('prefix_');
      expect(id1).not.toBe(id2);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('truncateText', () => {
    it('should not truncate if text is shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate text to maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('should use custom suffix', () => {
      expect(truncateText('Hello World', 5, ' [more]')).toBe('Hello [more]');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 5)).toBe('');
    });
  });

  describe('extractPlainText', () => {
    it('should remove markdown images', () => {
      const markdown = 'Text ![alt](image.png) more text';
      expect(extractPlainText(markdown)).toBe('Text  more text');
    });

    it('should remove markdown links but keep text', () => {
      const markdown = 'Check [this link](https://example.com) out';
      expect(extractPlainText(markdown)).toBe('Check this link out');
    });

    it('should remove headers', () => {
      const markdown = '# Header\n## Subheader\nContent';
      expect(extractPlainText(markdown)).toBe('Header\nSubheader\nContent');
    });

    it('should remove bold and italic markers', () => {
      const markdown = '**bold** and *italic* text';
      expect(extractPlainText(markdown)).toBe('bold and italic text');
    });

    it('should remove code blocks', () => {
      const markdown = 'Text `inline code` more';
      expect(extractPlainText(markdown)).toBe('Text  more');
    });

    it('should handle complex markdown', () => {
      const markdown = `
# Title
Some **bold** and *italic*
- List item
\`\`\`code block\`\`\`
[Link](url)
      `.trim();
      const result = extractPlainText(markdown);
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('```');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use default delay of 300ms', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn);

      debouncedFn();
      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should call function immediately', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within limit', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after limit', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone arrays', () => {
      const original = [1, 2, [3, 4]];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays with objects', () => {
      const original = [{ a: 1 }, { b: 2 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned[0]).not.toBe(original[0]);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const promise = sleep(100);

      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('formatTimestamp', () => {
    it('should format today\'s timestamp', () => {
      const now = new Date();
      now.setHours(14, 30, 0, 0);

      const result = formatTimestamp(now.getTime());
      expect(result).toContain('今天');
      expect(result).toContain('14:30');
    });

    it('should format yesterday\'s timestamp', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(10, 0, 0, 0);

      const result = formatTimestamp(yesterday.getTime());
      expect(result).toContain('昨天');
    });

    it('should format older dates', () => {
      const oldDate = new Date('2023-01-15T10:00:00');
      const result = formatTimestamp(oldDate.getTime());
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
