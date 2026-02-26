/**
 * 脑图类型定义
 * MarginNote 4 风格学习插件 - 思维导图数据结构
 */

/** 脑图布局类型 */
export type MindMapLayout = 'mindmap' | 'tree' | 'fishbone' | 'timeline';

/** 脑图节点 */
export interface MindMapNode {
  /** 节点 ID */
  id: string;
  /** 关联的卡片块 ID */
  cardId: string;
  /** 节点标题 */
  title: string;
  /** 节点位置 */
  position: {
    x: number;
    y: number;
  };
  /** 是否折叠 */
  collapsed: boolean;
  /** 父节点 ID */
  parentId?: string;
  /** 子节点列表 */
  children: MindMapNode[];
  /** 样式 */
  style?: {
    color?: string;
    icon?: string;
  };
}

/** 脑图容器 */
export interface MindMap {
  /** 脑图块 ID */
  id: string;
  /** 所属学习集 ID */
  studySetId: string;
  /** 根节点 */
  root: MindMapNode;
  /** 布局类型 */
  layout: MindMapLayout;
  /** 视口状态 */
  viewport: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

/** 脑图块属性（思源块属性） */
export interface MindMapBlockAttributes {
  /** 类型标识 */
  type: 'mindmap';
  /** 所属学习集 ID */
  'mindmap_study_set_id': string;
  /** 布局类型 */
  'mindmap_layout': string;
  /** 节点数据（JSON 字符串） */
  'mindmap_data': string;
  /** 创建时间 */
  'mindmap_created'?: string;
  /** 更新时间 */
  'mindmap_updated'?: string;
}

/** 脑图创建选项 */
export interface CreateMindMapOptions {
  /** 所属学习集 ID */
  studySetId: string;
  /** 布局类型 */
  layout?: MindMapLayout;
  /** 根节点标题 */
  rootTitle?: string;
}

/** 脑图节点操作 */
export interface MindMapNodeOperation {
  /** 操作类型 */
  type: 'add' | 'remove' | 'update' | 'move';
  /** 节点 ID */
  nodeId: string;
  /** 父节点 ID（添加/移动时使用） */
  parentId?: string;
  /** 新位置索引（移动时使用） */
  newIndex?: number;
  /** 更新的数据（update 时使用） */
  data?: Partial<MindMapNode>;
}

/** 脑图统计 */
export interface MindMapStats {
  /** 总节点数 */
  totalNodes: number;
  /** 最大深度 */
  maxDepth: number;
  /** 折叠节点数 */
  collapsedNodes: number;
  /** 关联卡片数 */
  linkedCards: number;
}
