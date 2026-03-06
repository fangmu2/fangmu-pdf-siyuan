/**
 * MarginNote 风格自由画布思维导图组件导出
 * @fileoverview 导出所有自由画布思维导图相关组件
 */

// 组合式函数
export {
  createShortcut,
  useKeyboardShortcuts,
} from '../../composables/useKeyboardShortcuts'
export type {
  KeyboardShortcutsOptions,
  ShortcutConfig,
} from '../../composables/useKeyboardShortcuts'
// 工具栏
export { default as CanvasToolbar } from './CanvasToolbar.vue'
export { default as FloatingToolbar } from './FloatingToolbar.vue'

// 核心组件
export { default as FreeCanvasViewer } from './FreeCanvasViewer.vue'
export { default as GroupNode } from './GroupNode.vue'

export { default as ImageCardNode } from './ImageCardNode.vue'
// 功能面板
export { default as LinksGraphPanel } from './LinksGraphPanel.vue'

export { default as MindMapSearch } from './MindMapSearch.vue'
export { default as NodeContextMenu } from './NodeContextMenu.vue'
// 对话框和菜单
export { default as NodeEditDialog } from './NodeEditDialog.vue'
export { default as NodeFilterPanel } from './NodeFilterPanel.vue'

export { default as PdfLinkageSettings } from './PdfLinkageSettings.vue'
export { default as TextCardNode } from './TextCardNode.vue'

// 导出类型
export type {
  CreateEdgeParams,
  CreateNodeParams,
  ExportOptions,
  ExportResult,
  FreeMindMapEdge,
  FreeMindMapGroupData,
  FreeMindMapLayout,
  FreeMindMapNode,
  FreeMindMapNodeData,
  FreeMindMapNodeType,
  MindMapViewport,
  UpdateNodeParams,
} from '@/types/mindmapFree'
