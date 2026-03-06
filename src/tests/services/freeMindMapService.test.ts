/**
 * 自由画布思维导图服务测试 - 克隆节点和引用节点功能
 * @fileoverview 测试 MarginNote 4 兼容性功能
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'
import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  createCloneNode,
  createNode,
  createReferenceNode,
  findReferenceNodes,
  syncReferenceNodeUpdates,
  updateNodeWithSync,
} from '@/services/freeMindMapService'

describe('marginNote 4 兼容性功能', () => {
  // 测试用源节点
  const createSourceNode = (): FreeMindMapNode => {
    return createNode({
      type: 'textCard',
      title: '测试知识点',
      content: '这是测试内容',
      position: {
        x: 100,
        y: 100,
      },
    })
  }

  describe('createCloneNode - 克隆节点', () => {
    it('应该创建克隆节点并复制内容', () => {
      const sourceNode = createSourceNode()
      const newPosition = {
        x: 300,
        y: 300,
      }

      const cloneNode = createCloneNode(sourceNode, newPosition)

      // 验证内容被复制
      expect(cloneNode.data.title).toBe('测试知识点')
      expect(cloneNode.data.content).toBe('这是测试内容')
      expect(cloneNode.data.nodeType).toBe('clone')

      // 验证位置更新
      expect(cloneNode.position).toEqual({
        x: 300,
        y: 300,
      })

      // 验证 ID 不同
      expect(cloneNode.id).not.toBe(sourceNode.id)
    })

    it('应该设置 syncChanges 为 false', () => {
      const sourceNode = createSourceNode()
      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })

      expect(cloneNode.data.nodeType).toBe('clone')
      expect(cloneNode.data.syncChanges).toBe(false)
    })

    it('应该清除 annotationId 和 cardId 避免冲突', () => {
      const sourceNode = createNode({
        type: 'textCard',
        title: '测试',
        content: '内容',
        position: {
          x: 0,
          y: 0,
        },
        annotationId: 'ann-123',
        cardId: 'card-456',
      })

      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })

      expect(cloneNode.data.annotationId).toBeUndefined()
      expect(cloneNode.data.cardId).toBeUndefined()
    })

    it('克隆节点修改不应该影响源节点', () => {
      const sourceNode = createSourceNode()
      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })

      // 修改克隆节点
      cloneNode.data.title = '修改后的标题'
      cloneNode.data.content = '修改后的内容'

      // 验证源节点未变
      expect(sourceNode.data.title).toBe('测试知识点')
      expect(sourceNode.data.content).toBe('这是测试内容')
    })
  })

  describe('createReferenceNode - 引用节点', () => {
    it('应该创建引用节点并复制内容', () => {
      const sourceNode = createSourceNode()
      const newPosition = {
        x: 400,
        y: 400,
      }

      const refNode = createReferenceNode(sourceNode, newPosition)

      // 验证内容被复制
      expect(refNode.data.title).toBe('测试知识点')
      expect(refNode.data.content).toBe('这是测试内容')
      expect(refNode.data.nodeType).toBe('reference')

      // 验证位置更新
      expect(refNode.position).toEqual({
        x: 400,
        y: 400,
      })

      // 验证 ID 不同
      expect(refNode.id).not.toBe(sourceNode.id)
    })

    it('应该设置 syncChanges 为 true', () => {
      const sourceNode = createSourceNode()
      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      expect(refNode.data.nodeType).toBe('reference')
      expect(refNode.data.syncChanges).toBe(true)
    })

    it('应该保持 annotationId 和 cardId 用于同步', () => {
      const sourceNode = createNode({
        type: 'textCard',
        title: '测试',
        content: '内容',
        position: {
          x: 0,
          y: 0,
        },
        annotationId: 'ann-123',
        cardId: 'card-456',
      })

      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      expect(refNode.data.annotationId).toBe('ann-123')
      expect(refNode.data.cardId).toBe('card-456')
    })

    it('应该添加 node-reference CSS 类', () => {
      const sourceNode = createSourceNode()
      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      expect(refNode.class).toContain('node-reference')
    })

    it('引用节点修改应该同步到源节点（通过 updateNodeWithSync）', () => {
      const sourceNode = createSourceNode()
      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      const allNodes = [sourceNode, refNode]

      // 更新引用节点
      const updatedNodes = updateNodeWithSync(
        refNode,
        {
          id: refNode.id,
          title: '新标题',
          content: '新内容',
        },
        allNodes,
      )

      const updatedSource = updatedNodes.find((n) => n.id === sourceNode.id)!
      const updatedRef = updatedNodes.find((n) => n.id === refNode.id)!

      // 验证源节点已更新
      expect(updatedSource.data.title).toBe('新标题')
      expect(updatedSource.data.content).toBe('新内容')

      // 验证引用节点也已更新
      expect(updatedRef.data.title).toBe('新标题')
      expect(updatedRef.data.content).toBe('新内容')
    })
  })

  describe('findReferenceNodes - 查找引用节点', () => {
    it('应该找到所有引用指定节点的节点', () => {
      const sourceNode = createSourceNode()
      const refNode1 = createReferenceNode(sourceNode, {
        x: 100,
        y: 0,
      })
      const refNode2 = createReferenceNode(sourceNode, {
        x: 200,
        y: 0,
      })
      const cloneNode = createCloneNode(sourceNode, {
        x: 300,
        y: 0,
      })
      const otherNode = createNode({
        type: 'textCard',
        title: '其他',
        position: {
          x: 400,
          y: 0,
        },
      })

      const allNodes = [sourceNode, refNode1, refNode2, cloneNode, otherNode]

      const references = findReferenceNodes(sourceNode.id, allNodes)

      expect(references).toHaveLength(2)
      expect(references.map((n) => n.id)).toEqual(
        expect.arrayContaining([refNode1.id, refNode2.id]),
      )
    })

    it('不应该包含克隆节点', () => {
      const sourceNode = createSourceNode()
      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })

      const allNodes = [sourceNode, cloneNode]
      const references = findReferenceNodes(sourceNode.id, allNodes)

      expect(references).toHaveLength(0)
    })

    it('空节点列表应该返回空数组', () => {
      const references = findReferenceNodes('non-existent', [])
      expect(references).toHaveLength(0)
    })
  })

  describe('syncReferenceNodeUpdates - 同步引用节点', () => {
    it('应该同步所有引用节点的 title 和 content', () => {
      const sourceNode = createSourceNode()
      const refNode1 = createReferenceNode(sourceNode, {
        x: 100,
        y: 0,
      })
      const refNode2 = createReferenceNode(sourceNode, {
        x: 200,
        y: 0,
      })

      const allNodes = [sourceNode, refNode1, refNode2]

      // 更新源节点
      sourceNode.data.title = '新标题'
      sourceNode.data.content = '新内容'

      const updatedNodes = syncReferenceNodeUpdates(sourceNode, allNodes)

      const updatedRef1 = updatedNodes.find((n) => n.id === refNode1.id)!
      const updatedRef2 = updatedNodes.find((n) => n.id === refNode2.id)!

      expect(updatedRef1.data.title).toBe('新标题')
      expect(updatedRef1.data.content).toBe('新内容')

      expect(updatedRef2.data.title).toBe('新标题')
      expect(updatedRef2.data.content).toBe('新内容')
    })

    it('不应该同步克隆节点', () => {
      const sourceNode = createSourceNode()
      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })

      const allNodes = [sourceNode, cloneNode]

      sourceNode.data.title = '新标题'
      const updatedNodes = syncReferenceNodeUpdates(sourceNode, allNodes)

      const updatedClone = updatedNodes.find((n) => n.id === cloneNode.id)!

      // 克隆节点不应该被同步
      expect(updatedClone.data.title).not.toBe('新标题')
    })

    it('应该保持引用节点的 nodeType 和 sourceNodeId', () => {
      const sourceNode = createSourceNode()
      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      const allNodes = [sourceNode, refNode]
      const updatedNodes = syncReferenceNodeUpdates(sourceNode, allNodes)

      const updatedRef = updatedNodes.find((n) => n.id === refNode.id)!

      expect(updatedRef.data.nodeType).toBe('reference')
      expect(updatedRef.data.sourceNodeId).toBe(sourceNode.id)
      expect(updatedRef.data.syncChanges).toBe(true)
    })

    it('没有引用节点时应该返回原数组', () => {
      const sourceNode = createSourceNode()
      const otherNode = createNode({
        type: 'textCard',
        title: '其他',
        position: {
          x: 0,
          y: 0,
        },
      })

      const allNodes = [sourceNode, otherNode]
      const updatedNodes = syncReferenceNodeUpdates(sourceNode, allNodes)

      expect(updatedNodes).toBe(allNodes)
    })
  })

  describe('updateNodeWithSync - 带同步的节点更新', () => {
    it('更新普通节点应该同步所有引用节点', () => {
      const sourceNode = createSourceNode()
      const refNode1 = createReferenceNode(sourceNode, {
        x: 100,
        y: 0,
      })
      const refNode2 = createReferenceNode(sourceNode, {
        x: 200,
        y: 0,
      })

      const allNodes = [sourceNode, refNode1, refNode2]

      // 更新普通节点（源节点）
      const updatedNodes = updateNodeWithSync(
        sourceNode,
        {
          id: sourceNode.id,
          title: '更新后的标题',
        },
        allNodes,
      )

      const updatedSource = updatedNodes.find((n) => n.id === sourceNode.id)!
      const updatedRef1 = updatedNodes.find((n) => n.id === refNode1.id)!
      const updatedRef2 = updatedNodes.find((n) => n.id === refNode2.id)!

      // 验证所有节点都被更新
      expect(updatedSource.data.title).toBe('更新后的标题')
      expect(updatedRef1.data.title).toBe('更新后的标题')
      expect(updatedRef2.data.title).toBe('更新后的标题')
    })

    it('更新引用节点应该反向同步源节点', () => {
      const sourceNode = createSourceNode()
      const refNode = createReferenceNode(sourceNode, {
        x: 0,
        y: 0,
      })

      const allNodes = [sourceNode, refNode]

      // 更新引用节点
      const updatedNodes = updateNodeWithSync(
        refNode,
        {
          id: refNode.id,
          title: '从引用节点更新',
        },
        allNodes,
      )

      const updatedSource = updatedNodes.find((n) => n.id === sourceNode.id)!
      const updatedRef = updatedNodes.find((n) => n.id === refNode.id)!

      // 验证源节点也被更新
      expect(updatedSource.data.title).toBe('从引用节点更新')
      expect(updatedRef.data.title).toBe('从引用节点更新')
    })

    it('更新引用节点应该同步其他引用节点', () => {
      const sourceNode = createSourceNode()
      const refNode1 = createReferenceNode(sourceNode, {
        x: 100,
        y: 0,
      })
      const refNode2 = createReferenceNode(sourceNode, {
        x: 200,
        y: 0,
      })

      const allNodes = [sourceNode, refNode1, refNode2]

      // 更新 refNode1
      const updatedNodes = updateNodeWithSync(
        refNode1,
        {
          id: refNode1.id,
          title: '从 refNode1 更新',
        },
        allNodes,
      )

      const updatedSource = updatedNodes.find((n) => n.id === sourceNode.id)!
      const updatedRef1 = updatedNodes.find((n) => n.id === refNode1.id)!
      const updatedRef2 = updatedNodes.find((n) => n.id === refNode2.id)!

      // 验证所有节点都被更新
      expect(updatedSource.data.title).toBe('从 refNode1 更新')
      expect(updatedRef1.data.title).toBe('从 refNode1 更新')
      expect(updatedRef2.data.title).toBe('从 refNode1 更新')
    })

    it('更新克隆节点不应该同步其他节点', () => {
      const sourceNode = createSourceNode()
      const cloneNode = createCloneNode(sourceNode, {
        x: 0,
        y: 0,
      })
      const refNode = createReferenceNode(sourceNode, {
        x: 100,
        y: 0,
      })

      const allNodes = [sourceNode, cloneNode, refNode]

      // 更新克隆节点
      const updatedNodes = updateNodeWithSync(
        cloneNode,
        {
          id: cloneNode.id,
          title: '克隆节点更新',
        },
        allNodes,
      )

      const updatedSource = updatedNodes.find((n) => n.id === sourceNode.id)!
      const updatedClone = updatedNodes.find((n) => n.id === cloneNode.id)!
      const updatedRef = updatedNodes.find((n) => n.id === refNode.id)!

      // 只有克隆节点被更新
      expect(updatedClone.data.title).toBe('克隆节点更新')
      expect(updatedSource.data.title).toBe('测试知识点')
      expect(updatedRef.data.title).toBe('测试知识点')
    })

    it('应该返回新数组而不是修改原数组', () => {
      const sourceNode = createSourceNode()
      const allNodes = [sourceNode]

      const originalLength = allNodes.length

      const updatedNodes = updateNodeWithSync(
        sourceNode,
        {
          id: sourceNode.id,
          title: '新标题',
        },
        allNodes,
      )

      expect(updatedNodes).not.toBe(allNodes)
      expect(updatedNodes.length).toBe(originalLength)
    })
  })
})
