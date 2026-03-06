/**
 * 服务层索引
 * MarginNote 4 风格学习插件 - 服务导出
 */

export type {
  BiDirectionalLink,
  CardHighlightEventDetail,
  JumpEventDetail,
  JumpHistoryItem,
  JumpResult,
  JumpTarget,
  MindMapHighlightEventDetail,
  PdfRect,
} from '../types/jump'

// AI 辅助服务（第十六阶段 - AI 辅助功能）
export { aiAssistantService } from './aiAssistantService'

export type {
  AIKnowledgeNode,
  AIQuestionConfig,
  AIStudySuggestion,
  AISummaryConfig,
  AITagConfig,
} from './aiAssistantService'

// 标注增强服务（第十六阶段 - 标注增强）
export * from './annotationEnhanceService'

// 双向跳转服务（第二十阶段 - 双向跳转完善）
export {
  biDirectionalLinkService,
  JUMP_EVENTS,
  jumpFromCardToMindmap,
  jumpFromCardToPdf,
  jumpFromMindmapToCard,
  jumpFromMindmapToPdf,
} from './biDirectionalLinkService'

// 卡片盒看板服务（排除 getAllTags 避免冲突）
export {
  applyFilters,
  applySort,
  cardBoxService,
  deleteFilterPreset,
  generateBoard,
  generateTimeline,
  loadFilterPresets,
  saveFilterPreset,
} from './cardBoxService'

// 卡片增强服务（第十六阶段 - 卡片功能增强）
export * from './cardEnhancedService'

// 卡片增强服务（排除 getAllTags 避免冲突）
export {
  batchDeleteCards,
  batchMoveCards,
  batchSetCardDifficulty,
  cardEnhanceService,
  setCardDifficulty,
} from './cardEnhanceService'

// 卡片管理服务
export { cardService } from './cardService'

// 数据持久化服务
export * from './dataPersistenceService'

// 数据同步与备份服务（第十六阶段 - 数据同步与备份）
export { dataSyncService } from './dataSyncService'

export type {
  BackupConfig,
  BackupMetadata,
  CloudSyncConfig,
  DataVersion,
  IncrementalBackup,
  SyncStatus,
} from './dataSyncService'

// 文档对比服务（第十八阶段 - 文档对比与多文档）
export { documentCompareService } from './documentCompareService'

export type {
  CrossDocAnnotation,
  DocumentRelation,
  DocumentWindowState,
  DualViewConfig,
} from './documentCompareService'

// 自由画布思维导图数据集成服务
export * from './freeMindMapDataIntegrationService'

// 自由画布思维导图基础服务
export * from './freeMindMapService'

// 自由画布思维导图版本历史服务
export * from './freeMindMapVersionService'

// FSRS 复习服务（第十二阶段）
export * from './fsrsReviewService'

// 脑图增强服务（排除 getAllTags 避免冲突）
export {
  addNodeCard,
  exportMindMap,
  getCardBacklinks,
  getLayoutConfig,
  getMindMapStats,
  getNodeBacklinks,
  getNodeCards,
  getSupportedLayouts,
  loadMindMapLayout,
  loadNodePositions,
  mindmapEnhanceService,
  removeNodeCard,
  saveMindMapLayout,
  saveNodePositions,
  saveViewport,
  setNodeNote,
  setNodeStyle,
} from './mindmapEnhanceService'

// 脑图导出服务（第十九阶段 - 脑图高级功能）
export { mindmapExportService } from './mindmapExportService'

export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
} from './mindmapExportService'
// 链接图谱增强服务（第 3 期）
export * from './mindmapLinkEnhanceService'

// 脑图连线服务（第十六阶段 - 脑图增强）
export { mindMapLinkService } from './mindmapLinkService'
// 脑图性能优化服务（第十九阶段 - 脑图高级功能）
export { mindmapPerformanceService } from './mindmapPerformanceService'

export type {
  PerformanceStats,
  ViewportConfig,
  VirtualRenderConfig,
  VisibleNodesResult,
} from './mindmapPerformanceService'
// 脑图模板服务（第十九阶段 - 脑图高级功能）
export { mindmapTemplateService } from './mindmapTemplateService'

export type {
  MindMapTemplate,
  MindMapTemplateType,
} from './mindmapTemplateService'
// 脑图版本服务（第十九阶段 - 脑图高级功能）
export { mindmapVersionService } from './mindmapVersionService'

export type {
  ChangeType,
  MindMapVersion,
  VersionChange,
  VersionDiff,
} from './mindmapVersionService'
// 导航服务（第十三阶段）
export * from './navigationService'

// PDF 与思维导图联动服务（第 4 期）
export * from './pdfMindMapLinkageService'
// PDF 阅读增强服务（第十六阶段 - PDF 增强）
export { pdfViewerService } from './pdfViewerService'

// 性能优化服务（第十四阶段 - 性能优化）
export * from './performanceService'
// 复习增强服务（第十六阶段 - 复习功能增强）
export * from './reviewEnhancedService'

// 复习队列管理服务
export { reviewService } from './reviewService'
// 智能学习集服务
export * from './smartStudySetService'

// ==================== 自由画布思维导图服务（第二十一阶段） ====================

// 学习集增强服务（第十六阶段 - 学习集功能增强）
export * from './studySetEnhancedService'

// 学习集导入导出服务
export * from './studySetExportService'

// 学习集管理服务
export { studySetService } from './studySetService'

// ==================== MarginNote 4 风格升级服务（第二十二阶段） ====================

// 学习集统计服务
export {
  type CardStatusDistribution,
  getCardStatusDistribution,
  getStudySetStats,
  getStudyTimeData,
  getTodayReviewOverview,
  type StudySetStats,
  type StudyTimeData,
} from './studySetStatsService'

// 学习集模板服务（第十四阶段）
export * from './studySetTemplateService'
