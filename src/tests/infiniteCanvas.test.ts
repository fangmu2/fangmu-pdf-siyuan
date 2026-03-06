/**
 * 无限画布功能测试
 * 测试动态边界、虚拟渲染和网格渲染功能
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'
import {
  describe,
  expect,
  it,
} from 'vitest'
import { ref } from 'vue'
import { useVirtualRendering } from '@/composables/useVirtualRendering'
import {
  calculateGridRange,
  getGridStats,
  renderInfiniteGrid,
} from '@/utils/gridRenderer'

describe('无限画布功能', () => {
  describe('useVirtualRendering', () => {
    it('should filter visible nodes based on viewport', () => {
      const nodes = ref<FreeMindMapNode[]>([
        {
          id: '1',
          type: 'textCard',
          data: { title: 'Node 1' },
          position: {
            x: 0,
            y: 0,
          },
          style: {
            width: '200px',
            height: '60px',
          },
        },
        {
          id: '2',
          type: 'textCard',
          data: { title: 'Node 2' },
          position: {
            x: 1000,
            y: 1000,
          },
          style: {
            width: '200px',
            height: '60px',
          },
        },
        {
          id: '3',
          type: 'textCard',
          data: { title: 'Node 3' },
          position: {
            x: 5000,
            y: 5000,
          }, // 超出视口
          style: {
            width: '200px',
            height: '60px',
          },
        },
      ])

      const {
        visibleNodes,
        updateViewport,
      } = useVirtualRendering(nodes, {
        bufferSize: 100,
        enabled: true,
        minNodeThreshold: 1,
      })

      // 设置视口
      updateViewport({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      })

      // 应该只显示视口内的节点
      expect(visibleNodes.value.length).toBe(2)
      expect(visibleNodes.value.map((n) => n.id)).toContain('1')
      expect(visibleNodes.value.map((n) => n.id)).toContain('2')
      expect(visibleNodes.value.map((n) => n.id)).not.toContain('3')
    })

    it('should disable virtual rendering when node count is low', () => {
      const nodes = ref<FreeMindMapNode[]>([
        {
          id: '1',
          type: 'textCard',
          data: { title: 'Node 1' },
          position: {
            x: 0,
            y: 0,
          },
          style: {
            width: '200px',
            height: '60px',
          },
        },
      ])

      const { visibleNodes } = useVirtualRendering(nodes, {
        bufferSize: 100,
        enabled: true,
        minNodeThreshold: 50, // 阈值设为 50
      })

      // 节点数量少于阈值，应该返回所有节点
      expect(visibleNodes.value.length).toBe(1)
    })
  })

  describe('gridRenderer', () => {
    it('should calculate grid range correctly', () => {
      const viewport = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      }

      const {
        startCol,
        endCol,
        startRow,
        endRow,
      } = calculateGridRange(viewport, 20)

      // 计算网格范围
      expect(startCol).toBe(-1)
      expect(endCol).toBe(41)
      expect(startRow).toBe(-1)
      expect(endRow).toBe(31)
    })

    it('should render infinite grid lines', () => {
      const viewport = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      }

      const result = renderInfiniteGrid(viewport, { gridSize: 20 })

      // 应该有垂直线和水平线
      expect(result.verticalLines.length).toBeGreaterThan(0)
      expect(result.horizontalLines.length).toBeGreaterThan(0)
      expect(result.totalLines).toBe(result.verticalLines.length + result.horizontalLines.length)
    })

    it('should calculate grid stats', () => {
      const viewport = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      }

      const stats = getGridStats(viewport, 20)

      expect(stats.visibleCols).toBeGreaterThan(0)
      expect(stats.visibleRows).toBeGreaterThan(0)
      expect(stats.totalLines).toBe(stats.visibleCols + stats.visibleRows)
    })
  })

  describe('canvas bounds', () => {
    it('should expand bounds when position is near edge', () => {
      const bounds = {
        minX: -1000,
        minY: -1000,
        maxX: 1000,
        maxY: 1000,
      }

      const threshold = 200
      const expandAmount = 2000

      // 模拟位置在左边界附近
      const position = {
        x: bounds.minX + 100,
        y: 0,
      }

      let expanded = false
      if (position.x < bounds.minX + threshold) {
        bounds.minX = position.x - expandAmount
        expanded = true
      }

      expect(expanded).toBe(true)
      expect(bounds.minX).toBeLessThan(-1000)
    })
  })
})
