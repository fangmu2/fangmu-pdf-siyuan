/**
 * Composables 导出
 * 遵循 .clinerules.md 规范：
 * - 所有组合式函数必须以 use 开头
 * - 封装通用逻辑供组件使用
 */

export { useCard } from './useCard';
export type { UseCardOptions, UseCardReturn } from './useCard';

export { useLearningSet } from './useLearningSet';
export type { UseLearningSetOptions, UseLearningSetReturn } from './useLearningSet';

export { useMindMap } from './useMindMap';
export type { UseMindMapOptions, UseMindMapReturn } from './useMindMap';

export { useReview } from './useReview';
export type { UseReviewOptions, UseReviewReturn, ReviewRating } from './useReview';

export { useSiyuan } from './useSiyuan';
export type { UseSiyuanReturn, SiyuanConfig } from './useSiyuan';

// ==================== MarginNote 4 风格升级组合式函数（第二十二阶段） ====================

// 链接图谱增强组合式函数（第 3 期）
export { useMindMapLinkEnhance } from './useMindMapLinkEnhance';
export type {
  UseMindMapLinkEnhanceOptions,
  UseMindMapLinkEnhanceReturn
} from './useMindMapLinkEnhance';

// PDF 与思维导图联动组合式函数（第 4 期）
export { usePdfMindMapLinkage } from './usePdfMindMapLinkage';
export type {
  UsePdfMindMapLinkageOptions,
  UsePdfMindMapLinkageReturn
} from './usePdfMindMapLinkage';
