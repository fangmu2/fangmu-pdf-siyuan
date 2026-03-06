/**
 * 布局过渡动画工具
 * 提供平滑的节点位置过渡效果
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/**
 * 节点位置动画配置
 */
export interface PositionAnimationConfig {
  /** 动画持续时间（毫秒） */
  duration: number
  /** 缓动函数 */
  easing: (t: number) => number
}

/**
 * 缓动函数集合
 */
export const EasingFunctions = {
  /** 线性 */
  linear: (t: number) => t,
  /** 慢入慢出 */
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  /** 慢入 */
  easeIn: (t: number) => t * t,
  /** 慢出 */
  easeOut: (t: number) => t * (2 - t),
  /** 弹性 */
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t
    return 2 ** (-10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
  },
}

/** 默认配置 */
const DEFAULT_CONFIG: PositionAnimationConfig = {
  duration: 500,
  easing: EasingFunctions.easeInOut,
}

/**
 * 动画节点位置
 * @param nodes 节点列表
 * @param targetPositions 目标位置映射
 * @param config 动画配置
 * @param onProgress 进度回调（可选）
 * @returns Promise
 */
export function animateNodePositions(
  nodes: FreeMindMapNode[],
  targetPositions: Map<string, { x: number, y: number }>,
  config: Partial<PositionAnimationConfig> = {},
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    }
    const startTime = performance.now()

    // 记录初始位置
    const initialPositions = new Map<string, { x: number, y: number }>()
    nodes.forEach((node) => {
      initialPositions.set(node.id, { ...node.position })
    })

    /**
     * 动画帧
     */
    function animate(currentTime: number): void {
      const elapsed = currentTime - startTime
      const rawProgress = Math.min(elapsed / finalConfig.duration, 1)
      const easedProgress = finalConfig.easing(rawProgress)

      // 更新节点位置
      nodes.forEach((node) => {
        const initial = initialPositions.get(node.id)
        const target = targetPositions.get(node.id)

        if (initial && target) {
          node.position.x = initial.x + (target.x - initial.x) * easedProgress
          node.position.y = initial.y + (target.y - initial.y) * easedProgress
        }
      })

      // 回调
      if (onProgress) {
        onProgress(rawProgress)
      }

      // 继续动画或结束
      if (rawProgress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
}

/**
 * 逐步应用布局（分帧更新，避免卡顿）
 * @param nodes 节点列表
 * @param targetPositions 目标位置映射
 * @param batchSize 每帧更新的节点数量
 * @returns Promise
 */
export function applyLayoutIncrementally(
  nodes: FreeMindMapNode[],
  targetPositions: Map<string, { x: number, y: number }>,
  batchSize: number = 20,
): Promise<void> {
  return new Promise((resolve) => {
    const nodeIds = Array.from(targetPositions.keys())
    let currentIndex = 0

    function updateBatch(): void {
      const endIndex = Math.min(currentIndex + batchSize, nodeIds.length)

      for (let i = currentIndex; i < endIndex; i++) {
        const nodeId = nodeIds[i]
        const node = nodes.find((n) => n.id === nodeId)
        const target = targetPositions.get(nodeId)

        if (node && target) {
          node.position.x = target.x
          node.position.y = target.y
        }
      }

      currentIndex = endIndex

      if (currentIndex < nodeIds.length) {
        requestAnimationFrame(updateBatch)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(updateBatch)
  })
}
