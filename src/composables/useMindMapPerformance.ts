/**
 * 脑图性能优化 Hook
 * 提供大数据量脑图的性能优化功能
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { MindMapNode } from '../types/mindmap';

/**
 * 脑图性能配置
 */
export interface MindMapPerformanceConfig {
  /** 节点数量阈值，超过此数量启用优化 */
  nodeThreshold: number;
  /** 初始加载节点数 */
  initialLoadCount: number;
  /** 每次滚动加载的节点数 */
  loadIncrement: number;
  /** 是否启用懒加载 */
  enableLazyLoad: boolean;
  /** 是否启用节点池化 */
  enableNodePooling: boolean;
  /** 最大渲染节点数 */
  maxRenderNodes: number;
}

const defaultConfig: MindMapPerformanceConfig = {
  nodeThreshold: 200,
  initialLoadCount: 100,
  loadIncrement: 50,
  enableLazyLoad: true,
  enableNodePooling: true,
  maxRenderNodes: 500
};

/**
 * 脑图性能优化 Hook
 */
export function useMindMapPerformance(
  nodes: MindMapNode[],
  config: Partial<MindMapPerformanceConfig> = {}
) {
  const options = { ...defaultConfig, ...config };

  // 状态
  const loadedCount = ref(options.initialLoadCount);
  const expandedNodeIds = ref<Set<string>>(new Set());
  const visibleNodeIds = ref<Set<string>>(new Set());
  const isOptimizedMode = ref(false);
  const renderStartTime = ref<number>(0);

  // 初始化时展开的节点
  const initializeExpandedNodes = (nodeList: MindMapNode[]) => {
    const expanded = new Set<string>();

    // 展开前几层节点
    const expandToDepth = (nodes: MindMapNode[], depth: number) => {
      if (depth <= 0) return;
      for (const node of nodes) {
        expanded.add(node.id);
        if (node.children && depth > 1) {
          expandToDepth(node.children, depth - 1);
        }
      }
    };

    expandToDepth(nodeList, 2); // 默认展开前 2 层
    expandedNodeIds.value = expanded;
  };

  // 检查是否需要启用优化模式
  const checkOptimizationMode = () => {
    const totalNodes = countTotalNodes(nodes);
    isOptimizedMode.value = totalNodes > options.nodeThreshold;

    if (isOptimizedMode.value) {
      console.log(`[MindMap] 启用优化模式，节点数：${totalNodes}`);
    }

    return isOptimizedMode.value;
  };

  // 统计总节点数
  const countTotalNodes = (nodeList: MindMapNode[]): number => {
    let count = 0;
    const countNodes = (nodes: MindMapNode[]) => {
      for (const node of nodes) {
        count++;
        if (node.children) {
          countNodes(node.children);
        }
      }
    };
    countNodes(nodeList);
    return count;
  };

  // 获取可见节点（考虑折叠状态）
  const getVisibleNodes = (nodeList: MindMapNode[]): MindMapNode[] => {
    const visible: MindMapNode[] = [];

    const traverse = (nodes: MindMapNode[]) => {
      for (const node of nodes) {
        visible.push(node);
        if (node.children && expandedNodeIds.value.has(node.id)) {
          traverse(node.children);
        }
      }
    };

    traverse(nodeList);
    return visible;
  };

  // 获取需要渲染的节点（考虑性能限制）
  const getRenderNodes = (visibleNodes: MindMapNode[]): MindMapNode[] => {
    if (!isOptimizedMode.value) {
      return visibleNodes;
    }

    return visibleNodes.slice(0, options.maxRenderNodes);
  };

  // 切换节点展开/折叠状态
  const toggleNodeExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodeIds.value);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    expandedNodeIds.value = newExpanded;
  };

  // 展开全部节点
  const expandAll = () => {
    const allIds = new Set<string>();

    const collectIds = (nodeList: MindMapNode[]) => {
      for (const node of nodeList) {
        allIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      }
    };

    collectIds(nodes);
    expandedNodeIds.value = allIds;
  };

  // 收起全部节点（只保留根节点）
  const collapseAll = () => {
    if (nodes.length > 0) {
      expandedNodeIds.value = new Set([nodes[0].id]);
    } else {
      expandedNodeIds.value = new Set();
    }
  };

  // 加载更多节点
  const loadMore = () => {
    loadedCount.value = Math.min(
      loadedCount.value + options.loadIncrement,
      countTotalNodes(nodes)
    );
  };

  // 重置加载状态
  const reset = () => {
    loadedCount.value = options.initialLoadCount;
    initializeExpandedNodes(nodes);
  };

  // 性能监控
  const startRender = () => {
    renderStartTime.value = performance.now();
  };

  const endRender = () => {
    if (renderStartTime.value) {
      const duration = performance.now() - renderStartTime.value;
      console.log(`[MindMap] 渲染耗时：${duration.toFixed(2)}ms`);

      if (duration > 100) {
        console.warn('[MindMap] 渲染时间过长，考虑减少节点数量或启用优化模式');
      }
    }
  };

  // 初始化
  onMounted(() => {
    checkOptimizationMode();
    initializeExpandedNodes(nodes);
  });

  // 监听节点变化
  watch(() => nodes.length, () => {
    checkOptimizationMode();
    reset();
  });

  return {
    // 状态
    isOptimizedMode,
    expandedNodeIds,
    visibleNodeIds,
    loadedCount,

    // 方法
    toggleNodeExpand,
    expandAll,
    collapseAll,
    loadMore,
    reset,
    getVisibleNodes,
    getRenderNodes,
    startRender,
    endRender,
    checkOptimizationMode
  };
}

/**
 * 脑图节点池化 Hook
 * 复用节点 DOM 元素，减少创建销毁开销
 */
export function useNodePool(
  nodes: MindMapNode[],
  poolSize: number = 100
) {
  const pool = ref<Array<{
    id: string;
    element: HTMLElement | null;
    data: MindMapNode | null;
  }>>([]);
  const usedIds = ref<Set<string>>(new Set());

  // 初始化节点池
  const initializePool = () => {
    pool.value = Array.from({ length: poolSize }, () => ({
      id: '',
      element: null,
      data: null
    }));
  };

  // 获取空闲节点
  const getFreeNode = (): { id: string; element: HTMLElement | null; data: MindMapNode | null } | null => {
    const freeNode = pool.value.find(node => !usedIds.value.has(node.id));
    return freeNode || null;
  };

  // 标记节点为已使用
  const markAsUsed = (nodeId: string) => {
    usedIds.value.add(nodeId);
  };

  // 释放节点
  const releaseNode = (nodeId: string) => {
    usedIds.value.delete(nodeId);
    const poolNode = pool.value.find(n => n.id === nodeId);
    if (poolNode) {
      poolNode.data = null;
    }
  };

  // 更新节点数据
  const updateNodeData = (poolNodeId: string, data: MindMapNode) => {
    const poolNode = pool.value.find(n => n.id === poolNodeId);
    if (poolNode) {
      poolNode.data = data;
    }
  };

  onMounted(() => {
    initializePool();
  });

  return {
    pool,
    usedIds,
    getFreeNode,
    markAsUsed,
    releaseNode,
    updateNodeData
  };
}

/**
 * 脑图视口优化 Hook
 * 只渲染可见区域的节点
 */
export function useMindMapViewPort(
  containerRef: Ref<HTMLElement | null>,
  nodePositions: Map<string, { x: number; y: number }>
) {
  const viewport = ref({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: 1
  });

  const visibleNodeIds = ref<Set<string>>(new Set());

  // 更新视口信息
  const updateViewport = () => {
    if (!containerRef.value) return;

    const rect = containerRef.value.getBoundingClientRect();
    viewport.value = {
      x: -viewport.value.x,
      y: -viewport.value.y,
      width: rect.width / viewport.value.scale,
      height: rect.height / viewport.value.scale,
      scale: viewport.value.scale
    };

    // 计算可见节点
    computeVisibleNodes();
  };

  // 计算可见节点
  const computeVisibleNodes = () => {
    const visible = new Set<string>();
    const padding = 100; // 视口外额外渲染的范围

    for (const [id, pos] of nodePositions.entries()) {
      if (
        pos.x >= viewport.value.x - padding &&
        pos.x <= viewport.value.x + viewport.value.width + padding &&
        pos.y >= viewport.value.y - padding &&
        pos.y <= viewport.value.y + viewport.value.height + padding
      ) {
        visible.add(id);
      }
    }

    visibleNodeIds.value = visible;
  };

  // 检查节点是否可见
  const isNodeVisible = (nodeId: string): boolean => {
    return visibleNodeIds.value.has(nodeId);
  };

  return {
    viewport,
    visibleNodeIds,
    updateViewport,
    isNodeVisible
  };
}

export default useMindMapPerformance;
