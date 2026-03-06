/**
 * Copyright (c) 2023 frostime. All rights reserved.
 */

/**
 * Frequently used data structures in SiYuan
 */
type DocumentId = string
type BlockId = string
type NotebookId = string
type PreviousID = BlockId
type ParentID = BlockId | DocumentId

interface Notebook {
  id: NotebookId
  name: string
  icon: string
  sort: number
  closed: boolean
}

interface NotebookConf {
  name: string
  closed: boolean
  refCreateSavePath: string
  createDocNameTemplate: string
  dailyNoteSavePath: string
  dailyNoteTemplatePath: string
}

type BlockType =
  | "d"
  | "s"
  | "h"
  | "t"
  | "i"
  | "p"
  | "f"
  | "audio"
  | "video"
  | "other"

type BlockSubType =
  | "d1"
  | "d2"
  | "s1"
  | "s2"
  | "s3"
  | "t1"
  | "t2"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "table"
  | "task"
  | "toggle"
  | "latex"
  | "quote"
  | "html"
  | "code"
  | "footnote"
  | "cite"
  | "collection"
  | "bookmark"
  | "attachment"
  | "comment"
  | "mindmap"
  | "spreadsheet"
  | "calendar"
  | "image"
  | "audio"
  | "video"
  | "other"

interface Block {
  id: BlockId
  parent_id?: BlockId
  root_id: DocumentId
  hash: string
  box: string
  path: string
  hpath: string
  name: string
  alias: string
  memo: string
  tag: string
  content: string
  fcontent?: string
  markdown: string
  length: number
  type: BlockType
  subtype: BlockSubType
  /**
   * string of { [key: string]: string }
   * For instance: "{: custom-type=\"query-code\" id=\"20230613234017-zkw3pr0\" updated=\"20230613234509\"}"
   */
  ial?: string
  sort: number
  created: string
  updated: string
}

interface doOperation {
  action: string
  data: string
  id: BlockId
  parentID: BlockId | DocumentId
  previousID: BlockId
  retData: null
}

// ============ window.siyuan 类型定义 ============

/** 系统配置 */
interface SystemConfig {
  kernelAddr: string
  version: string
}

/** 编辑器配置 */
interface EditorConfig {
  spacing: number
  lineHeight: number
  [key: string]: any
}

/** 用户信息 */
interface UserInfo {
  userName: string
  userId: string
  [key: string]: any
}

/** Notebook 管理 API */
interface NotebooksApi {
  /** 创建笔记本 */
  createNotebook(name: string): Promise<Notebook>
  /** 删除笔记本 */
  deleteNotebook(id: string): Promise<void>
  /** 重命名笔记本 */
  renameNotebook(id: string, name: string): Promise<void>
  /** 打开笔记本 */
  openNotebook(id: string): Promise<void>
  /** 关闭笔记本 */
  closeNotebook(id: string): Promise<void>
  /** 获取笔记本列表 */
  getNotebooks(): Promise<Notebook[]>
  /** 获取笔记本配置 */
  getNotebookConf(id: string): Promise<NotebookConf>
  /** 保存笔记本配置 */
  saveNotebookConf(id: string, conf: NotebookConf): Promise<void>
}

/** 菜单管理 API */
interface MenusApi {
  /** 打开菜单 */
  openMenu(id: string): void
  /** 关闭菜单 */
  closeMenu(id: string): void
  /** 注册菜单项 */
  registerMenuItem(option: {
    key: string
    icon: string
    hint: string
    click: () => void
  }): void
  /** 移除菜单项 */
  removeMenuItem(key: string): void
}

/** 对话框管理 API */
interface DialogsApi {
  /** 显示消息提示 */
  showMessage(msg: string, timeout?: number, type?: 'info' | 'error' | 'warning' | 'success'): void
  /** 显示确认对话框 */
  confirm(message: string, callback: (confirmed: boolean) => void): void
  /** 显示提示对话框 */
  prompt(message: string, defaultValue: string, callback: (value: string) => void): void
  /** 关闭所有对话框 */
  closeAll(): void
}

/** 块面板管理 API */
interface BlockPanelsApi {
  /** 打开块属性面板 */
  openBlockAttrPanel(blockId: string): void
  /** 打开块引用面板 */
  openBlockRefPanel(blockId: string): void
  /** 打开书签面板 */
  openBookmarkPanel(): void
}

/** 存储管理 API */
interface StorageApi {
  /** 获取本地存储数据 */
  get(key: string): Promise<any>
  /** 设置本地存储数据 */
  set(key: string, value: any): Promise<void>
  /** 移除本地存储数据 */
  remove(key: string): Promise<void>
  /** 获取所有键 */
  keys(): Promise<string[]>
}

/** WebSocket 连接 API */
interface WsApi {
  /** 连接 WebSocket */
  connect(): Promise<void>
  /** 断开连接 */
  disconnect(): void
  /** 发送消息 */
  send(data: any): void
  /** 监听消息 */
  on(type: string, callback: (data: any) => void): void
  /** 移除监听 */
  off(type: string, callback: (data: any) => void): void
}

/** 资源管理 API */
interface AssetApi {
  /** 上传文件 */
  upload(file: File, path?: string): Promise<{
    errFiles: string[]
    succMap: { [key: string]: string }
  }>
  /** 获取 assets 目录下的文件列表 */
  listAssets(): Promise<string[]>
  /** 读取 assets 文件 */
  readAsset(path: string): Promise<Blob>
}

/** 编辑器 API */
interface EditorApi {
  /** 聚焦编辑器 */
  focus(): void
  /** 取消聚焦 */
  blur(): void
  /** 获取当前编辑器实例 */
  protyle: any
  /** 插入文本 */
  insertText(text: string): void
  /** 获取选中内容 */
  getSelection(): string
  /** 设置选中内容 */
  setSelection(start: number, end: number): void
  /** 执行命令 */
  execCommand(cmd: string, data?: any): void
}

/** 语言配置 API */
interface LanguagesApi {
  /** 获取当前语言 */
  getCurrent(): string
  /** 获取所有可用语言 */
  getAvailable(): string[]
  /** 设置语言 */
  set(lang: string): void
  /** 获取翻译文本 */
  t(key: string): string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  siyuan: {
    /** 系统配置 */
    config: {
      system: SystemConfig
      editor: EditorConfig
      [key: string]: any
    }
    /** 笔记本管理 */
    notebooks: NotebooksApi
    /** 菜单管理 */
    menus: MenusApi
    /** 对话框管理 */
    dialogs: DialogsApi
    /** 块面板管理 */
    blockPanels: BlockPanelsApi
    /** 存储管理 */
    storage: StorageApi
    /** 用户信息 */
    user: UserInfo
    /** WebSocket 连接 */
    ws: WsApi
    /** 资源管理 */
    asset: AssetApi
    /** 编辑器 API */
    editor: EditorApi
    /** 语言配置 */
    languages: LanguagesApi
    /** 其他可能的属性 */
    [key: string]: any
  }
  _sy_plugin_sample: {
    [key: string]: any
  }
}


enum SyFrontendTypes {
  // 桌面端
  'desktop' = 'desktop',
  'desktop-window' = 'desktop-window',
  // 移动端
  'mobile' = 'mobile',
  // 浏览器 - 桌面端
  'browser-desktop' = 'browser-desktop',
  // 浏览器 - 移动端
  'browser-mobile' = 'browser-mobile',
}

// 导出所有类型以便其他模块使用
export {
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
  SyFrontendTypes,
}
