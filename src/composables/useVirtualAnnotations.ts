// src/composables/useVirtualAnnotations.ts
/**
 * 虚拟标注列表组合式函数
 * 基于 @vueuse/core 的 useVirtualList 实现虚拟滚动
 * 优化大量标注下的性能表现
 */

import type { ComputedRef, Ref } from 'vue'
import type { PDFAnnotation } from '@/types/annotation'
import { computed, ref, watch } from 'vue'
import { useVirtualList } from '@vueuse/core'

/**
 * 虚拟滚动配置
 */
export interface UseVirtualAnnotationsOptions {
  /** 每项的基础高度（像素）- 用于计算滚动位置 */
  itemHeight?: number
  /** 预渲染项数（视口上下各渲染多少项） */
  overscan?: number
  /** 是否启用虚拟滚动（少于阈值时禁用） */
  enabled?: boolean
  /** 最小标注数量阈值（少于这个数量时禁用虚拟滚动） */
  minAnnotationThreshold?: number
}

/**
 * 虚拟滚动返回值
 */
export interface UseVirtualAnnotationsReturn {
  /** 虚拟列表数据（仅包含可见项） */
  virtualList: Ref<Array<{ data: PDFAnnotation, index: number }>>
  /** 容器属性（绑定到滚动容器） */
  containerProps: {
    ref: Ref<HTMLElement | null>
    onScroll: () => void
    style: any
  }
  /** 包装器属性（绑定到列表包装器） */
  wrapperProps: ComputedRef<{
    style: {
      width: string
      height: string
      marginTop?: string
      marginLeft?: string
      display?: string
    }
  }>
  /** 是否启用虚拟滚动 */
  enabled: Ref<boolean>
  /** 总项数 */
  total: Ref<number>
  /** 可见项数 */
  visibleCount: Ref<number>
}

/**
 * 估算标注项高度
 * 根据节点类型返回不同的高度
 */
function estimateItemHeight(annotation: PDFAnnotation): number {
  // 图片标注通常更高
  if (annotation.isImage) {
    return 200
  }
  
  // 标题节点高度
  if (annotation.level && annotation.level !== 'text') {
    return 40
  }
  
  // 普通文本标注
  const textLines = Math.ceil(annotation.text.length / 80) // 假设每行 80 字符
  const baseHeight = 60
  const noteHeight = annotation.note ? 40 : 0
  const childrenHeight = (annotation.children?.length || 0) * 50
  
  return baseHeight + (textLines * 20) + noteHeight + childrenHeight
}

/**
 * 虚拟标注列表组合式函数
 * @param annotationsRef 标注列表引用
 * @param options 配置选项
 */
export function useVirtualAnnotations(
  annotationsRef: Ref<PDFAnnotation[]>,
  options: UseVirtualAnnotationsOptions = {},
): UseVirtualAnnotationsReturn {
  const {
    itemHeight = 120, // 默认平均高度
    overscan = 5, // 预渲染 5 项
    enabled = true,
    minAnnotationThreshold = 50, // 少于 50 项时不启用
  } = options

  /** 是否启用虚拟滚动 */
  const enabledRef = ref(enabled)
  
  /** 动态计算平均高度 */
  const averageHeight = ref(itemHeight)

  /**
   * 使用 useVirtualList
   * 注意：useVirtualList 需要固定高度或动态高度函数
   */
  const { list, wrapperProps, containerProps } = useVirtualList(
    annotationsRef,
    {
      itemHeight: (index: number) => {
        const annotation = annotationsRef.value[index]
        if (!annotation) return averageHeight.value
        
        // 使用估算高度，但不超过平均高度的 2 倍
        const estimated = estimateItemHeight(annotation)
        return Math.min(estimated, averageHeight.value * 2)
      },
      overscan,
    },
  )

  /** 计算可见项数 */
  const visibleCount = computed(() => list.value.length)

  /** 总项数 */
  const total = computed(() => annotationsRef.value.length)

  /**
   * 监听标注列表变化，动态调整平均高度
   */
  watch(annotationsRef, (newAnnotations) => {
    if (newAnnotations.length === 0) return
    
    // 计算实际平均高度
    const totalHeight = newAnnotations.reduce((sum, ann) => {
      return sum + estimateItemHeight(ann)
    }, 0)
    averageHeight.value = totalHeight / newAnnotations.length
    
    // 少于阈值时禁用虚拟滚动
    enabledRef.value = enabled && newAnnotations.length >= minAnnotationThreshold
  }, { immediate: true })

  return {
    virtualList: list,
    containerProps: {
      ref: containerProps.ref,
      onScroll: containerProps.onScroll,
      style: containerProps.style,
    },
    wrapperProps,
    enabled: enabledRef,
    total,
    visibleCount,
  }
}
