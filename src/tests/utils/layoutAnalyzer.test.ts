/**
 * 布局分析器测试
 * 测试智能布局推荐功能的分析算法和评分系统
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'
import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  analyzeGraph,
  getLayoutIcon,
  getLayoutName,
  recommendLayout,
} from '@/utils/layoutAnalyzer'

describe('layoutAnalyzer', () => {
  // 辅助函数：创建测试节点
  function createNode(
    id: string,
    title: string,
    parentId?: string,
    data: Partial<FreeMindMapNode['data']> = {},
  ): FreeMindMapNode {
    return {
      id,
      type: 'textCard',
      position: {
        x: 0,
        y: 0,
      },
      data: {
        title,
        childrenIds: [],
        ...data,
      },
      parentId,
    } as FreeMindMapNode
  }

  // 辅助函数：创建测试连线
  function createEdge(
    id: string,
    source: string,
    target: string,
  ): FreeMindMapEdge {
    return {
      id,
      source,
      target,
      type: 'default',
    } as FreeMindMapEdge
  }

  describe('analyzeGraph', () => {
    it('should analyze empty graph', () => {
      const analysis = analyzeGraph([], [])

      expect(analysis.nodeCount).toBe(0)
      expect(analysis.maxDepth).toBe(0)
      expect(analysis.avgConnections).toBe(0)
      expect(analysis.hasTimestamps).toBe(false)
      expect(analysis.isHierarchical).toBe(false)
      expect(analysis.clusterCount).toBe(0)
    })

    it('should analyze single node', () => {
      const nodes = [createNode('1', 'Root')]
      const analysis = analyzeGraph(nodes, [])

      expect(analysis.nodeCount).toBe(1)
      expect(analysis.maxDepth).toBe(0)
      expect(analysis.avgConnections).toBe(0)
      expect(analysis.isHierarchical).toBe(false)
    })

    it('should analyze tree structure', () => {
      const nodes = [
        createNode('1', 'Root'),
        createNode('2', 'Child 1', '1'),
        createNode('3', 'Child 2', '1'),
        createNode('4', 'Grandchild', '2'),
      ]
      const edges = [
        createEdge('e1', '1', '2'),
        createEdge('e2', '1', '3'),
        createEdge('e3', '2', '4'),
      ]

      const analysis = analyzeGraph(nodes, edges)

      expect(analysis.nodeCount).toBe(4)
      expect(analysis.maxDepth).toBeGreaterThanOrEqual(2)
      expect(analysis.avgConnections).toBe(1.5)
      expect(analysis.isHierarchical).toBe(true)
    })

    it('should detect timestamps', () => {
      const nodes = [
        createNode('1', 'Node 1', undefined, { timestamp: Date.now() }),
        createNode('2', 'Node 2'),
      ]
      const analysis = analyzeGraph(nodes, [])

      expect(analysis.hasTimestamps).toBe(true)
    })

    it('should detect clusters', () => {
      const nodes = [
        createNode('1', 'Root 1'),
        createNode('2', 'Child 1', '1'),
        createNode('3', 'Root 2'),
        createNode('4', 'Child 2', '3'),
      ]
      const edges = [
        createEdge('e1', '1', '2'),
        createEdge('e2', '3', '4'),
      ]

      const analysis = analyzeGraph(nodes, edges)

      expect(analysis.clusterCount).toBe(2)
    })
  })

  describe('recommendLayout', () => {
    it('should recommend tree layout for hierarchical structure', () => {
      const analysis = {
        nodeCount: 20,
        maxDepth: 4,
        avgConnections: 1.5,
        hasTimestamps: false,
        isHierarchical: true,
        clusterCount: 1,
      }

      const recommendations = recommendLayout(analysis)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0].layoutType).toBe('tree')
      expect(recommendations[0].confidence).toBeGreaterThan(0.5)
    })

    it('should recommend timeline layout when timestamps exist', () => {
      const analysis = {
        nodeCount: 15,
        maxDepth: 2,
        avgConnections: 1.2,
        hasTimestamps: true,
        isHierarchical: false,
        clusterCount: 1,
      }

      const recommendations = recommendLayout(analysis)

      const timelineRec = recommendations.find((r) => r.layoutType === 'timeline')
      expect(timelineRec).toBeDefined()
      expect(timelineRec!.confidence).toBeGreaterThan(0.5)
    })

    it('should recommend concept layout for high connectivity', () => {
      const analysis = {
        nodeCount: 15,
        maxDepth: 2,
        avgConnections: 3.5,
        hasTimestamps: false,
        isHierarchical: false,
        clusterCount: 3,
      }

      const recommendations = recommendLayout(analysis)

      const conceptRec = recommendations.find((r) => r.layoutType === 'concept')
      expect(conceptRec).toBeDefined()
      expect(conceptRec!.score).toBeGreaterThan(30)
    })

    it('should return sorted recommendations by score', () => {
      const analysis = {
        nodeCount: 30,
        maxDepth: 4,
        avgConnections: 1.8,
        hasTimestamps: true,
        isHierarchical: true,
        clusterCount: 2,
      }

      const recommendations = recommendLayout(analysis)

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score)
      }
    })

    it('should provide default recommendation for empty graph', () => {
      const analysis = {
        nodeCount: 0,
        maxDepth: 0,
        avgConnections: 0,
        hasTimestamps: false,
        isHierarchical: false,
        clusterCount: 0,
      }

      const recommendations = recommendLayout(analysis)

      expect(recommendations.length).toBe(0)
    })
  })

  describe('getLayoutName', () => {
    it('should return Chinese names for layout types', () => {
      expect(getLayoutName('tree')).toBe('树状布局')
      expect(getLayoutName('fishbone')).toBe('鱼骨图')
      expect(getLayoutName('timeline')).toBe('时间轴')
      expect(getLayoutName('concept')).toBe('概念图')
    })

    it('should return unknown layout type as is', () => {
      expect(getLayoutName('unknown')).toBe('unknown')
    })
  })

  describe('getLayoutIcon', () => {
    it('should return emoji icons for layout types', () => {
      expect(getLayoutIcon('tree')).toBe('🌳')
      expect(getLayoutIcon('fishbone')).toBe('🐟')
      expect(getLayoutIcon('timeline')).toBe('📅')
      expect(getLayoutIcon('concept')).toBe('💡')
    })

    it('should return default icon for unknown type', () => {
      expect(getLayoutIcon('unknown')).toBe('📊')
    })
  })
})
