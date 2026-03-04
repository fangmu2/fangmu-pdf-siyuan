/**
 * 网格吸附组合式函数
 * 提供节点拖拽时的网格吸附功能
 */

import { ref, type Ref } from 'vue'

export interface SnapConfig {
  gridSize: number        // 网格大小（默认 20px）
  snapThreshold: number   // 吸附阈值（默认 10px）
  enabled: boolean        // 是否启用吸附
}

export interface Position {
  x: number
  y: number
}

export interface UseSnapToGridReturn {
  // 配置
  gridSize: Ref<number>
  snapThreshold: Ref<number>
  enabled: Ref<boolean>
  
  // 方法
  snapToGrid: (position: Position) => Position
  isNearGridPoint: (position: Position) => boolean
  toggleEnabled: () => void
  setGridSize: (size: number) => void
  setSnapThreshold: (threshold: number) => void
}

/**
 * 网格吸附组合式函数
 * @param initialConfig 初始配置
 */
export function useSnapToGrid(initialConfig: Partial<SnapConfig> = {}): UseSnapToGridReturn {
  // 响应式配置
  const gridSize = ref(initialConfig.gridSize ?? 20)
  const snapThreshold = ref(initialConfig.snapThreshold ?? 10)
  const enabled = ref(initialConfig.enabled ?? true)

  /**
   * 将位置吸附到最近的网格点
   */
  function snapToGrid(position: Position): Position {
    if (!enabled.value) {
      return { ...position }
    }

    const snappedX = Math.round(position.x / gridSize.value) * gridSize.value
    const snappedY = Math.round(position.y / gridSize.value) * gridSize.value

    return {
      x: snappedX,
      y: snappedY
    }
  }

  /**
   * 检查位置是否接近网格点（用于视觉反馈）
   */
  function isNearGridPoint(position: Position): boolean {
    const remainderX = position.x % gridSize.value
    const remainderY = position.y % gridSize.value

    const nearX = Math.abs(remainderX) < snapThreshold.value ||
                  Math.abs(remainderX - gridSize.value) < snapThreshold.value
    const nearY = Math.abs(remainderY) < snapThreshold.value ||
                  Math.abs(remainderY - gridSize.value) < snapThreshold.value

    return nearX || nearY
  }

  /**
   * 切换吸附启用状态
   */
  function toggleEnabled(): void {
    enabled.value = !enabled.value
  }

  /**
   * 设置网格大小
   */
  function setGridSize(size: number): void {
    if (size > 0) {
      gridSize.value = size
    }
  }

  /**
   * 设置吸附阈值
   */
  function setSnapThreshold(threshold: number): void {
    if (threshold > 0) {
      snapThreshold.value = threshold
    }
  }

  return {
    // 配置
    gridSize,
    snapThreshold,
    enabled,
    
    // 方法
    snapToGrid,
    isNearGridPoint,
    toggleEnabled,
    setGridSize,
    setSnapThreshold
  }
}
