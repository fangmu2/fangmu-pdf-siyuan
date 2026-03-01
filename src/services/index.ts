/**
 * 服务层索引
 * MarginNote 4 风格学习插件 - 服务导出
 */

// 卡片管理服务
export { cardService } from './cardService';

// 卡片增强服务（排除 getAllTags 避免冲突）
export { cardEnhanceService, setCardDifficulty, batchMoveCards, batchDeleteCards, batchSetCardDifficulty } from './cardEnhanceService';

// 学习集管理服务
export { studySetService } from './studySetService';

// 学习集统计服务
export { studySetStatsService, StudySetStatsService } from './studySetStatsService';

// 学习集导入导出服务
export * from './studySetExportService';

// 智能学习集服务
export * from './smartStudySetService';

// 复习队列管理服务
export { reviewService } from './reviewService';

// 数据持久化服务
export * from './dataPersistenceService';

// 脑图增强服务（排除 getAllTags 避免冲突）
export { mindmapEnhanceService, saveNodePositions, loadNodePositions, saveViewport, addNodeCard, removeNodeCard, getNodeCards, getCardBacklinks, getNodeBacklinks, setNodeStyle, setNodeNote, getMindMapStats, exportMindMap, saveMindMapLayout, loadMindMapLayout, getSupportedLayouts, getLayoutConfig } from './mindmapEnhanceService';

// 脑图连线服务（第十六阶段 - 脑图增强）
export { mindMapLinkService } from './mindmapLinkService';

// 卡片盒看板服务（排除 getAllTags 避免冲突）
export { cardBoxService, generateBoard, generateTimeline, applyFilters, applySort, saveFilterPreset, loadFilterPresets, deleteFilterPreset } from './cardBoxService';

// FSRS 复习服务（第十二阶段）
export * from './fsrsReviewService';

// 导航服务（第十三阶段）
export * from './navigationService';

// 学习集模板服务（第十四阶段）
export * from './studySetTemplateService';

// 性能优化服务（第十四阶段 - 性能优化）
export * from './performanceService';

// PDF 阅读增强服务（第十六阶段 - PDF 增强）
export { pdfViewerService } from './pdfViewerService';

// 标注增强服务（第十六阶段 - 标注增强）
export * from './annotationEnhanceService';

// 卡片增强服务（第十六阶段 - 卡片功能增强）
export * from './cardEnhancedService';

// 学习集增强服务（第十六阶段 - 学习集功能增强）
export * from './studySetEnhancedService';

// 复习增强服务（第十六阶段 - 复习功能增强）
export * from './reviewEnhancedService';

// AI 辅助服务（第十六阶段 - AI 辅助功能）
export { aiAssistantService } from './aiAssistantService';
export type { AISummaryConfig, AITagConfig, AIQuestionConfig, AIStudySuggestion, AIKnowledgeNode } from './aiAssistantService';

// 数据同步与备份服务（第十六阶段 - 数据同步与备份）
export { dataSyncService } from './dataSyncService';
export type { BackupConfig, BackupMetadata, SyncStatus, CloudSyncConfig, IncrementalBackup, DataVersion } from './dataSyncService';

// 文档对比服务（第十八阶段 - 文档对比与多文档）
export { documentCompareService } from './documentCompareService';
export type { DocumentRelation, CrossDocAnnotation, DualViewConfig, DocumentWindowState } from './documentCompareService';

// 脑图模板服务（第十九阶段 - 脑图高级功能）
export { mindmapTemplateService } from './mindmapTemplateService';
export type { MindMapTemplate, MindMapTemplateType } from './mindmapTemplateService';

// 脑图版本服务（第十九阶段 - 脑图高级功能）
export { mindmapVersionService } from './mindmapVersionService';
export type { MindMapVersion, VersionDiff, VersionChange, ChangeType } from './mindmapVersionService';

// 脑图导出服务（第十九阶段 - 脑图高级功能）
export { mindmapExportService } from './mindmapExportService';
export type { ExportFormat, ExportOptions, ExportResult } from './mindmapExportService';

// 脑图性能优化服务（第十九阶段 - 脑图高级功能）
export { mindmapPerformanceService } from './mindmapPerformanceService';
export type {
  ViewportConfig,
  VisibleNodesResult,
  VirtualRenderConfig,
  PerformanceStats
} from './mindmapPerformanceService';

// 双向跳转服务（第二十阶段 - 双向跳转完善）
export {
  biDirectionalLinkService,
  JUMP_EVENTS,
  jumpFromCardToPdf,
  jumpFromCardToMindmap,
  jumpFromMindmapToCard,
  jumpFromMindmapToPdf
} from './biDirectionalLinkService';
export type {
  JumpTarget,
  JumpResult,
  BiDirectionalLink,
  JumpHistoryItem,
  JumpEventDetail,
  MindMapHighlightEventDetail,
  CardHighlightEventDetail,
  PdfRect
} from '../types/jump';

// ==================== 自由画布思维导图服务（第二十一阶段） ====================

// 自由画布思维导图基础服务
export * from './freeMindMapService';

// 自由画布思维导图数据集成服务
export * from './freeMindMapDataIntegrationService';

// 自由画布思维导图版本历史服务
export * from './freeMindMapVersionService';

// ==================== MarginNote 4 风格升级服务（第二十二阶段） ====================

// 链接图谱增强服务（第 3 期）
export * from './mindmapLinkEnhanceService';

// PDF 与思维导图联动服务（第 4 期）
export * from './pdfMindMapLinkageService';
