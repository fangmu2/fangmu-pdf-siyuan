/**
 * 性能优化工具
 * 提供虚拟滚动、懒加载、防抖节流等性能优化功能
 */

import { ref, computed, watch, onMounted, onUnmounted, ShallowRef } from 'vue';

// ==================== 虚拟滚动 ====================

export interface VirtualScrollOptions {
  itemHeight: number; // 每项高度 (px)
  bufferSize?: number; // 缓冲区大小
  overscan?: number; // 预渲染数量
}

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  visibleItems: number;
}

/**
 * 创建虚拟滚动
 * @param items 数据列表
 * @param options 配置选项
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const {
    itemHeight,
    bufferSize = 5,
    overscan = 3,
  } = options;

  // 容器引用
  const containerRef = ref<HTMLElement | null>(null);

  // 滚动状态
  const scrollTop = ref(0);
  const containerHeight = ref(0);

  // 计算可见项数
  const visibleCount = computed(() => {
    return Math.ceil(containerHeight.value / itemHeight) + bufferSize * 2;
  });

  // 计算起始和结束索引
  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / itemHeight) - overscan;
    return Math.max(0, index);
  });

  const endIndex = computed(() => {
    const index = startIndex.value + visibleCount.value + overscan * 2;
    return Math.min(items.length, index);
  });

  // 可见项
  const visibleItems = computed(() => {
    return items.slice(startIndex.value, endIndex.value);
  });

  // 总高度
  const totalHeight = computed(() => {
    return items.length * itemHeight;
  });

  // 偏移量
  const offsetY = computed(() => {
    return startIndex.value * itemHeight;
  });

  // 处理滚动
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    scrollTop.value = target.scrollTop;
    containerHeight.value = target.clientHeight;
  }

  // 滚动到指定索引
  function scrollToIndex(index: number) {
    if (containerRef.value) {
      const targetScrollTop = index * itemHeight;
      containerRef.value.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }

  // 滚动到顶部
  function scrollToTop() {
    scrollToIndex(0);
  }

  // 滚动到底部
  function scrollToBottom() {
    scrollToIndex(items.length - 1);
  }

  // 初始化
  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight;
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  // 清理
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll);
    }
  });

  return {
    containerRef,
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

// ==================== 懒加载 ====================

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * 创建懒加载
 * @param callback 加载回调
 * @param options 配置选项
 */
export function useLazyLoad(
  callback: () => void | Promise<void>,
  options: LazyLoadOptions = {}
) {
  const {
    rootMargin = '0px',
    threshold = 0.1,
  } = options;

  const targetRef = ref<HTMLElement | null>(null);
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const observer = ref<IntersectionObserver | null>(null);

  const load = async () => {
    if (isLoading.value || isLoaded.value) return;

    isLoading.value = true;
    try {
      await callback();
      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    if (!targetRef.value) return;

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            load();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.value.observe(targetRef.value);
  });

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect();
    }
  });

  return {
    targetRef,
    isLoaded,
    isLoading,
    load,
  };
}

// ==================== 图片懒加载 ====================

export interface LazyImageProps {
  src: string;
  placeholder?: string;
  alt?: string;
}

/**
 * 创建懒加载图片
 */
export function useLazyImage(defaultSrc: string, placeholder?: string) {
  const src = ref(defaultSrc);
  const loaded = ref(false);
  const error = ref(false);
  const imageRef = ref<HTMLImageElement | null>(null);

  const loadImage = () => {
    if (!src.value || loaded.value) return;

    const img = new Image();
    img.src = src.value;

    img.onload = () => {
      loaded.value = true;
      error.value = false;
    };

    img.onerror = () => {
      error.value = true;
      loaded.value = false;
    };
  };

  const setSrc = (newSrc: string) => {
    loaded.value = false;
    error.value = false;
    src.value = newSrc;
    loadImage();
  };

  const reset = () => {
    loaded.value = false;
    error.value = false;
  };

  return {
    src,
    loaded,
    error,
    imageRef,
    setSrc,
    reset,
    placeholder,
  };
}

// ==================== 分页加载 ====================

export interface PaginationState<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
}

export interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

/**
 * 创建分页加载
 * @param fetchFn 获取数据的函数
 * @param options 配置选项
 */
export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options: PaginationOptions = {}
) {
  const {
    pageSize = 20,
    initialPage = 1,
  } = options;

  const items = ref<T[]>([]) as ShallowRef<T[]>;
  const page = ref(initialPage);
  const total = ref(0);
  const isLoading = ref(false);
  const isRefreshing = ref(false);
  const hasError = ref(false);

  const hasMore = computed(() => {
    return items.value.length < total.value;
  });

  const totalPages = computed(() => {
    return Math.ceil(total.value / pageSize);
  });

  const loadPage = async (pageNum: number, refresh = false) => {
    if (isLoading.value) return;

    try {
      isLoading.value = true;
      hasError.value = false;

      if (refresh) {
        isRefreshing.value = true;
      }

      const result = await fetchFn(pageNum, pageSize);

      if (refresh) {
        items.value = result.items;
      } else {
        items.value = [...items.value, ...result.items];
      }

      total.value = result.total;
      page.value = pageNum;
    } catch (error) {
      hasError.value = true;
      console.error('Pagination load error:', error);
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  };

  const loadMore = async () => {
    if (hasMore.value && !isLoading.value) {
      await loadPage(page.value + 1);
    }
  };

  const refresh = async () => {
    await loadPage(1, true);
  };

  const reset = () => {
    items.value = [];
    page.value = initialPage;
    total.value = 0;
    hasError.value = false;
  };

  // 初始加载
  onMounted(() => {
    loadPage(initialPage);
  });

  return {
    items,
    page,
    pageSize,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    hasError,
    totalPages,
    loadPage,
    loadMore,
    refresh,
    reset,
  };
}

// ==================== 内存优化 ====================

/**
 * 创建弱引用缓存
 * 使用 WeakMap 存储对象引用，允许 GC 自动回收
 */
export function createWeakCache<K extends object, V>() {
  const cache = new WeakMap<K, V>();

  const get = (key: K): V | undefined => {
    return cache.get(key);
  };

  const set = (key: K, value: V): void => {
    cache.set(key, value);
  };

  const has = (key: K): boolean => {
    return cache.has(key);
  };

  const remove = (key: K): void => {
    cache.delete(key);
  };

  return {
    get,
    set,
    has,
    remove,
  };
}

/**
 * 创建 LRU 缓存
 * @param maxSize 最大缓存数量
 */
export function createLruCache<K, V>(maxSize: number = 100) {
  const cache = new Map<K, V>();

  const get = (key: K): V | undefined => {
    if (!cache.has(key)) {
      return undefined;
    }

    // 将访问的项移到末尾 (最近使用)
    const value = cache.get(key)!;
    cache.delete(key);
    cache.set(key, value);
    return value;
  };

  const set = (key: K, value: V): void => {
    if (cache.has(key)) {
      cache.delete(key);
    } else if (cache.size >= maxSize) {
      // 删除最久未使用的项 (第一个)
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, value);
  };

  const has = (key: K): boolean => {
    return cache.has(key);
  };

  const remove = (key: K): void => {
    cache.delete(key);
  };

  const clear = (): void => {
    cache.clear();
  };

  const size = (): number => {
    return cache.size;
  };

  return {
    get,
    set,
    has,
    remove,
    clear,
    size,
  };
}

// ==================== 批量更新 ====================

export interface BatchUpdateOptions {
  maxBatchSize?: number;
  flushInterval?: number;
}

/**
 * 创建批量更新
 * 将多次更新合并为一次，减少 DOM 操作
 */
export function createBatchProcessor<T>(
  processor: (items: T[]) => void | Promise<void>,
  options: BatchUpdateOptions = {}
) {
  const {
    maxBatchSize = 100,
    flushInterval = 100,
  } = options;

  const queue: T[] = [];
  let scheduled = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    if (queue.length === 0) {
      scheduled = false;
      return;
    }

    const batch = queue.splice(0, maxBatchSize);

    try {
      await processor(batch);
    } catch (error) {
      console.error('Batch processor error:', error);
      // 失败时将项重新加入队列
      queue.unshift(...batch);
    }

    if (queue.length > 0) {
      scheduleFlush();
    } else {
      scheduled = false;
    }
  };

  const scheduleFlush = () => {
    if (scheduled) return;

    scheduled = true;
    timerId = setTimeout(flush, flushInterval);
  };

  const add = (item: T) => {
    queue.push(item);

    if (queue.length >= maxBatchSize) {
      if (timerId) {
        clearTimeout(timerId);
      }
      flush();
    } else {
      scheduleFlush();
    }
  };

  const addMany = (items: T[]) => {
    items.forEach(add);
  };

  const clear = () => {
    queue.length = 0;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    scheduled = false;
  };

  const flushNow = async () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    await flush();
  };

  return {
    add,
    addMany,
    clear,
    flushNow,
    get queueLength() {
      return queue.length;
    },
  };
}

// ==================== 导出 ====================

export default {
  useVirtualScroll,
  useLazyLoad,
  useLazyImage,
  usePagination,
  createWeakCache,
  createLruCache,
  createBatchProcessor,
};
