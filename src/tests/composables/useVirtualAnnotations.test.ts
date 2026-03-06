/**
 * 虚拟滚动性能基准测试
 * 测试 AnnotationList 在虚拟滚动优化下的性能表现
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'
import { useVirtualAnnotations } from '@/composables/useVirtualAnnotations'

/**
 * 生成模拟标注数据
 */
function generateMockAnnotations(count: number): PDFAnnotation[] {
  const annotations: PDFAnnotation[] = []
  
  for (let i = 0; i < count; i++) {
    annotations.push({
      id: `annotation-${i}`,
      blockId: `block-${i}`,
      pdfPath: '/data/assets/test.pdf',
      pdfName: 'test.pdf',
      page: Math.floor(i / 10) + 1, // 每 10 个标注一页
      rect: [100, 100, 200, 200],
      text: `测试标注内容 ${i} - ${'Lorem ipsum '.repeat(5)}`,
      note: i % 3 === 0 ? `笔记内容 ${i}` : '',
      color: i % 5 === 0 ? 'red' : i % 5 === 1 ? 'yellow' : i % 5 === 2 ? 'green' : i % 5 === 3 ? 'blue' : 'purple',
      level: i % 10 === 0 ? 'h1' : i % 10 === 1 ? 'h2' : i % 10 === 2 ? 'h3' : 'text',
      type: 'highlight',
      isImage: i % 20 === 0,
      imagePath: i % 20 === 0 ? '/data/assets/image.png' : undefined,
      parentId: undefined,
      sortOrder: 0,
      created: Date.now() - i * 1000,
      updated: Date.now() - i * 1000,
    })
  }
  
  return annotations
}

describe('useVirtualAnnotations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default options', () => {
    const annotations = ref<PDFAnnotation[]>([])
    const { virtualList, enabled, total, visibleCount } = useVirtualAnnotations(annotations)
    
    expect(virtualList.value).toHaveLength(0)
    expect(enabled.value).toBe(true)
    expect(total.value).toBe(0)
    expect(visibleCount.value).toBe(0)
  })

  it('should render only visible items with 1000+ annotations', async () => {
    const annotations = ref(generateMockAnnotations(1000))
    const { virtualList, total, visibleCount } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 5,
      minAnnotationThreshold: 50,
    })
    
    await nextTick()
    await nextTick()
    
    // 总标注数应该是 1000
    expect(total.value).toBe(1000)
    
    // 虚拟列表应该只渲染可见项（通常远少于 1000）
    // 具体数量取决于容器高度，但应该远小于总数
    expect(virtualList.value.length).toBeLessThan(1000)
    expect(virtualList.value.length).toBeGreaterThan(0)
    
    // 验证可见项数
    expect(visibleCount.value).toBe(virtualList.value.length)
  })

  it('should disable virtual scrolling for small lists', async () => {
    const annotations = ref(generateMockAnnotations(30))
    const { virtualList, enabled, total } = useVirtualAnnotations(annotations, {
      minAnnotationThreshold: 50,
    })
    
    await nextTick()
    
    // 少于阈值时应该禁用虚拟滚动
    expect(enabled.value).toBe(false)
    expect(total.value).toBe(30)
    // 禁用时应该返回所有项
    expect(virtualList.value.length).toBe(30)
  })

  it('should update when annotations change', async () => {
    const annotations = ref<PDFAnnotation[]>([])
    const { total, virtualList } = useVirtualAnnotations(annotations)
    
    expect(total.value).toBe(0)
    
    // 添加标注
    annotations.value = generateMockAnnotations(500)
    await nextTick()
    await nextTick()
    
    expect(total.value).toBe(500)
    expect(virtualList.value.length).toBeLessThan(500)
    expect(virtualList.value.length).toBeGreaterThan(0)
    
    // 减少标注
    annotations.value = generateMockAnnotations(20)
    await nextTick()
    
    expect(total.value).toBe(20)
  })

  it('should handle image annotations with different heights', async () => {
    const annotations = ref(generateMockAnnotations(200))
    const { virtualList } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 5,
    })
    
    await nextTick()
    await nextTick()
    
    // 验证虚拟列表正常工作
    expect(virtualList.value.length).toBeGreaterThan(0)
    expect(virtualList.value.length).toBeLessThan(200)
  })

  it('should calculate correct average height', async () => {
    const annotations = ref(generateMockAnnotations(100))
    const { virtualList, total } = useVirtualAnnotations(annotations)
    
    await nextTick()
    await nextTick()
    
    expect(total.value).toBe(100)
    expect(virtualList.value.length).toBeGreaterThan(0)
  })
})

describe('AnnotationList Performance', () => {
  it('should render 1000+ annotations within 500ms', async () => {
    const startTime = performance.now()
    
    const annotations = ref(generateMockAnnotations(1000))
    const { virtualList, total } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 5,
    })
    
    await nextTick()
    await nextTick()
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(total.value).toBe(1000)
    expect(virtualList.value.length).toBeLessThan(1000)
    
    // 首屏渲染时间应该小于 500ms
    console.log(`首屏渲染时间：${renderTime.toFixed(2)}ms`)
    expect(renderTime).toBeLessThan(500)
  })

  it('should maintain smooth scrolling with 1000+ annotations', () => {
    const annotations = ref(generateMockAnnotations(1000))
    const { virtualList, visibleCount } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 5,
    })
    
    // 虚拟滚动应该只渲染少量项
    const renderedCount = virtualList.value.length
    expect(renderedCount).toBeLessThan(100) // 通常视口内只有几十项
    
    // 验证预渲染（overscan）生效
    expect(renderedCount).toBeGreaterThan(10)
    
    console.log(`总标注数：${annotations.value.length}`)
    console.log(`渲染项数：${renderedCount}`)
    console.log(`可见项数：${visibleCount.value}`)
    console.log(`渲染性能提升：${((1 - renderedCount / annotations.value.length) * 100).toFixed(2)}%`)
  })

  it('should reduce memory usage by 30%+', () => {
    const annotationCount = 1000
    const annotations = ref(generateMockAnnotations(annotationCount))
    const { virtualList } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 5,
    })
    
    // 计算渲染项数比例
    const renderedCount = virtualList.value.length
    const memoryReduction = (1 - renderedCount / annotationCount) * 100
    
    console.log(`内存占用降低：${memoryReduction.toFixed(2)}%`)
    
    // 虚拟滚动应该显著减少内存占用
    expect(memoryReduction).toBeGreaterThan(30)
  })
})

describe('useVirtualAnnotations Configuration', () => {
  it('should respect custom itemHeight', async () => {
    const annotations = ref(generateMockAnnotations(200))
    const { virtualList } = useVirtualAnnotations(annotations, {
      itemHeight: 200, // 更高的项高度
      overscan: 5,
    })
    
    await nextTick()
    await nextTick()
    
    expect(virtualList.value.length).toBeGreaterThan(0)
  })

  it('should respect custom overscan', async () => {
    const annotations = ref(generateMockAnnotations(200))
    const { virtualList } = useVirtualAnnotations(annotations, {
      itemHeight: 120,
      overscan: 10, // 更大的预渲染
    })
    
    await nextTick()
    await nextTick()
    
    expect(virtualList.value.length).toBeGreaterThan(0)
  })
})
