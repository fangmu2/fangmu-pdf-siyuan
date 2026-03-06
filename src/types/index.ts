/**
 * 类型定义索引
 * MarginNote 4 风格学习插件 - 类型导出
 */

// 现有标注类型
export type {
  AnnotationColor,
  AnnotationGroup,
  AnnotationLevel,
  AnnotationStats,
  ExtractMode,
  PDFAnnotation,
} from './annotation'

// API 类型
export type {
  APIResponse,
  BlockInfo,
  CreateBlockRequest,
  CreateDocRequest,
  DeleteBlockRequest,
  DocInfo,
  GetBlockAttrsResponse,
  NotebookInfo,
  SetBlockAttrsRequest,
  SQLQueryRequest,
  SQLQueryResponse,
  UpdateBlockRequest,
} from './api.d'

// 画布与图层类型
export type {
  CanvasConfig,
  CanvasListItem,
  CanvasReference,
  CanvasStats,
  CanvasSwitchEvent,
  CreateCanvasParams,
  CrossCanvasNodeLink,
  LayerConfig,
  LayerType,
  LayerVisibilityChangeEvent,
  UpdateCanvasParams,
  UpdateLayerParams,
} from './canvas'

// 卡片系统类型
export type {
  BoardView,
  Card,
  CardBlockAttributes,
  CardFilter,
  CardSortOptions,
  CardSourceLocation,
  CardStatus,
  CardType,
  FlashCard,
  ReviewStats,
  SM2Params,
  SM2Result,
  SmartStudySet,
  SRSParams,
} from './card'

// 思源基础类型
export type {
  Block,
  BlockId,
  BlockSubType,
  BlockType,
  DocumentId,
  doOperation,
  Notebook,
  NotebookConf,
  NotebookId,
  ParentID,
  PreviousID,
} from './index.d'

// 双向跳转类型
export type {
  BiDirectionalLink,
  CardHighlightEventDetail,
  JumpConfig,
  JumpEventDetail,
  JumpHistoryItem,
  JumpResult,
  JumpTarget,
  JumpTargetType,
  MindMapHighlightEventDetail,
  PdfRect,
} from './jump'

// 布局模板类型
export type {
  ConceptMapConfig,
  FishboneConfig,
  LayoutConfig,
  LayoutTemplate,
  LayoutType,
  TemplateConfig,
  TimelineConfig,
  TreeConfig,
} from './layoutTemplate'

// 脑图类型
export type {
  CreateMindMapOptions,
  MindMap,
  MindMapBlockAttributes,
  MindMapLayout,
  MindMapNode,
  MindMapNodeOperation,
  MindMapStats,
} from './mindmap'

// 自由画布思维导图类型
export type {
  AnnotationColorMapping,
  AutoLayoutOptions,
  CreateEdgeParams,
  CreateNodeParams,
  CrossBranchLink,
  CrossLinkType,
  ExportOptions,
  ExportResult,
  FreeMindMapEdge,
  FreeMindMapGroupData,
  FreeMindMapLayout,
  FreeMindMapNode,
  FreeMindMapNodeData,
  FreeMindMapNodeType,
  HighlightState,
  LayoutSuggestion,
  MindMapViewport,
  NodeAnnotation,
  NodeLinkRelation,
  NodeRelation,
  PdfLinkageConfig,
  RemoteKnowledgeLink,
  SubMindMap,
  UpdateNodeParams,
  ViewportFocusConfig,
} from './mindmapFree'

// 思维导图搜索类型
export type {
  MindMapFilter,
  MindMapSearchOptions,
  MindMapSearchResult,
} from './mindMapSearch'

// PDF 标注批注类型
export type {
  AnnotationComment,
  AnnotationCommentBase,
  AnnotationCommentType,
  AnnotationPriority,
  CommentExportOptions,
  CommentFilter,
  CommentStats,
  CommentStatus,
  CommentThread,
  CreateCommentParams,
  ImageAnnotationComment,
  ImageCommentContent,
  ReplyToCommentParams,
  TextAnnotationComment,
  TextCommentContent,
  UpdateCommentParams,
  VoiceAnnotationComment,
  VoiceCommentContent,
} from './pdfAnnotation'

// PDF 摘录类型
export type {
  ExcerptConfig,
  ExcerptType,
  PDFExcerpt,
} from './pdfExcerpt'

// PDF 跳转服务类型
export type {
  PDFJumpServiceOptions,
  PDFLocation,
} from './pdfJumpService'

// PDF 嵌入式思维导图侧边栏类型
export type {
  AnnotationNodeMapping,
  CompactNodeStyle,
  CoordinateTransformResult,
  ExcerptNodeData,
  NodeClickEvent,
  PdfMindMapSidebarConfig,
  PdfMindMapSidebarEvents,
  PdfMindMapSidebarExpose,
  PdfMindMapSidebarOptions,
  PdfMindMapSidebarProps,
  PdfMindMapSidebarState,
  RealtimeSyncConfig,
  SidebarTheme,
  SyncQueueItem,
  SyncRequestEvent,
  SyncRequestType,
  UseRealtimeSyncOptions,
  UseRealtimeSyncReturn,
} from './pdfMindMapSidebar'

// PDF 查看器类型
export type {
  PDFViewerConfig,
  PDFViewerEvents,
  PDFViewerState,
} from './pdfViewer'

// 项目类型
export type {
  PDFProject,
  ProjectConfig,
} from './project'

// 复习类型
export type {
  DailyReviewStats,
  ForgettingCurvePoint,
  LearningProgress,
  ReviewCalendarItem,
  ReviewPreferences,
  ReviewQuality,
  ReviewQualityLabel,
  ReviewQueueItem,
  ReviewRecord,
  ReviewSession,
  ReviewSessionStats,
} from './review'

// 搜索与导航类型
export type {
  BreadcrumbItem,
  BreadcrumbState,
  BreadcrumbType,
  GlobalSearchConfig,
  GlobalSearchResult,
  SearchHistoryConfig,
  SearchHistoryItem,
  SearchOptions,
  SearchResultItem,
  SearchResultMeta,
  SearchResultSource,
  SearchResultType,
  SearchScope,
  TagCloudConfig,
  TagCloudItem,
  TagStatistics,
} from './search'

// 思源 API 类型
export type {
  BlockAttr,
  SiYuanAPI,
} from './siyuan'

// 学习集类型
export type {
  CreateStudySetOptions,
  ReviewAlgorithm,
  ReviewSettings,
  StudySet,
  StudySetBlockAttributes,
  StudySetListItem,
  StudySetStats,
  UpdateStudySetOptions,
} from './studySet'
