/**
 * 类型定义索引
 * MarginNote 4 风格学习插件 - 类型导出
 */

// 思源基础类型
export type {
  DocumentId,
  BlockId,
  NotebookId,
  PreviousID,
  ParentID,
  Notebook,
  NotebookConf,
  BlockType,
  BlockSubType,
  Block,
  doOperation,
} from './index.d';

// 现有标注类型
export type {
  PDFAnnotation,
  AnnotationLevel,
  AnnotationColor,
  ExtractMode,
  AnnotationGroup,
  AnnotationStats,
} from './annotation';

// 卡片系统类型
export type {
  CardType,
  CardStatus,
  CardSourceLocation,
  Card,
  FlashCard,
  SRSParams,
  CardBlockAttributes,
  CardFilter,
  CardSortOptions,
  BoardView,
  SmartStudySet,
  ReviewStats,
  SM2Params,
  SM2Result,
} from './card';

// 学习集类型
export type {
  ReviewAlgorithm,
  StudySet,
  ReviewSettings,
  StudySetBlockAttributes,
  StudySetStats,
  StudySetListItem,
  CreateStudySetOptions,
  UpdateStudySetOptions,
} from './studySet';

// 脑图类型
export type {
  MindMapLayout,
  MindMapNode,
  MindMap,
  MindMapBlockAttributes,
  CreateMindMapOptions,
  MindMapNodeOperation,
  MindMapStats,
} from './mindmap';

// 复习类型
export type {
  ReviewQuality,
  ReviewQualityLabel,
  ReviewRecord,
  ReviewQueueItem,
  ReviewSession,
  ReviewSessionStats,
  DailyReviewStats,
  ReviewCalendarItem,
  LearningProgress,
  ReviewPreferences,
  ForgettingCurvePoint,
} from './review';

// 项目类型
export type {
  PDFProject,
  ProjectConfig,
} from './project';

// 思源 API 类型
export type {
  SiYuanAPI,
  BlockAttr,
} from './siyuan';

// API 类型
export type {
  APIResponse,
  NotebookInfo,
  DocInfo,
  BlockInfo,
  CreateDocRequest,
  CreateBlockRequest,
  UpdateBlockRequest,
  DeleteBlockRequest,
  SetBlockAttrsRequest,
  GetBlockAttrsResponse,
  SQLQueryRequest,
  SQLQueryResponse,
} from './api.d';
