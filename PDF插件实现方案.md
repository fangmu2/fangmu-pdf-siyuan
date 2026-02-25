# PDF思维导图摘录插件实现方案

## 1. 整体架构
- 前端：Vue 3 + TypeScript + Vite
- PDF渲染：PDF.js
- 思源集成：思源API
- 数据存储：localStorage + 思源文档系统
- 思维导图可视化：D3.js

## 2. 功能模块

### 2.1 PDF渲染模块
- PDF文件加载和解析
- 页面渲染和缩放
- 文本选择和高亮
- 图片选择和提取
- 注释标记和显示

### 2.2 标注管理模块
- 标注创建、编辑、删除
- 标注分类（文字、图片、链接等）
- 标注与PDF位置关联
- 标注同步到思源笔记
- 标注层级管理（父子关系）

### 2.3 项目管理模块
- 多项目创建和管理
- 项目内多PDF文档管理
- 项目统计信息展示
- 项目数据持久化

### 2.4 思维导图模块
- 标注层级关系可视化
- D3.js力导向图布局
- 交互式节点操作
- 导图导出功能

### 2.5 用户界面模块
- PDF预览区域
- 标注列表区域
- 思维导图区域
- 工具栏和控制面板
- 项目管理面板

## 3. 数据结构

### 3.1 标注对象
```typescript
interface Annotation {
  id: string;
  blockId: string; // 思源块ID
  pdfPath: string; // PDF文件路径
  pdfName: string; // PDF文件名
  page: number; // 页码
  rect: [number, number, number, number]; // 区域坐标 [x, y, width, height]
  text: string; // 标注文本
  note: string; // 补充说明
  color: string; // 高亮颜色
  level: 'title' | 'heading' | 'paragraph' | 'sentence' | 'text'; // 标注级别
  isImage?: boolean; // 是否为图片标注
  imagePath?: string; // 图片路径
  parentId?: string; // 父标注ID（用于层级关系）
  sortOrder?: number; // 排序序号
  created: number; // 创建时间戳
  updated: number; // 更新时间戳
}
```

### 3.2 项目结构
```typescript
interface Project {
  id: string;
  name: string;
  pdfs: PDFInfo[];
  currentPdfId: string;
  annotationCount: number;
  created: number;
  updated: number;
}

interface PDFInfo {
  id: string;
  path: string;
  name: string;
  currentPage: number;
  totalPages: number;
}
```

### 3.3 项目列表项
```typescript
interface ProjectListItem {
  id: string;
  name: string;
  pdfCount: number;
  annotationCount: number;
  pdfNames: string[]; // PDF文件名列表
  updated: number; // 最后更新时间戳
}
```

## 4. API设计

### 4.1 思源API封装
- 文件上传到资源库
- 文档块创建和更新
- 搜索和查询接口
- 文档ID缓存管理

### 4.2 项目管理API
- 项目创建、删除、切换
- PDF添加到项目
- 标注数据管理
- 项目数据持久化

### 4.3 PDF处理API
- PDF加载和渲染
- 文本选择处理
- 图片选择和提取
- 注释数据管理

### 4.4 思维导图API
- 标注层级关系构建
- D3.js图表数据准备
- 导图节点和连接生成

## 5. UI组件设计

### 5.1 主界面组件 (App.vue)
- 顶部工具栏（项目管理、视图切换、全屏等）
- PDF预览区域
- 标注列表区域
- 可拖拽分隔条
- 文本选择提示
- 标注编辑弹窗
- 项目管理面板

### 5.2 PDF查看器组件 (PDFViewer.vue)
- PDF渲染容器
- 页面导航控件
- 选择和标注工具
- 图片提取功能
- 高亮显示

### 5.3 标注列表组件 (AnnotationList.vue)
- 标注项展示（支持层级结构）
- 编辑和删除功能
- 分类和筛选
- 合并与拆分功能
- 加载更多功能

### 5.4 标注编辑组件 (AnnotationEditor.vue)
- 标注内容编辑
- 级别选择
- 补充说明输入
- 保存和取消

### 5.5 思维导图查看器组件 (MindMapViewer.vue)
- D3.js力导向图渲染
- 节点交互（点击、拖拽）
- 缩放和平移
- 图例和说明

### 5.6 PDF资源选择器组件 (PDFAssetSelector.vue)
- PDF文件选择
- 文件预览
- 上传进度显示

## 6. 实现要点

### 6.1 PDF.js集成
- 动态加载PDF.js库
- Canvas渲染PDF页面
- 鼠标事件处理和坐标转换
- 文本层叠加以支持文本选择
- 图片提取功能实现

### 6.2 标注同步机制
- 实时保存到思源文档
- 冲突检测和解决
- 增量更新策略
- 防重复创建机制

### 6.3 层级关系管理
- 父子标注关系建立
- 树形结构数据组织
- 层级展开/收起功能
- 拖拽排序支持

### 6.4 思维导图实现
- D3.js力导向图布局算法
- 节点和链接数据结构
- 交互式操作（缩放、平移、点击）
- 响应式设计

### 6.5 用户体验优化
- 流畅的页面切换
- 快速的文本选择
- 直观的标注管理
- 拖拽调整界面宽度
- 多视图模式切换

## 7. 技术挑战及解决方案

### 7.1 PDF渲染性能
- 使用Web Workers处理PDF解析
- 实现页面懒加载
- 优化Canvas渲染
- 图片缓存机制

### 7.2 坐标系统转换
- PDF坐标到Canvas坐标的精确映射
- 高分辨率屏幕适配
- 缩放和平移支持
- 文本选择区域计算

### 7.3 数据一致性
- 本地缓存与思源数据同步
- 并发编辑冲突处理
- 数据备份和恢复
- 防重复创建机制

### 7.4 大规模数据渲染
- 标注列表虚拟滚动
- 思维导图节点优化
- 数据分批加载
- 内存泄漏防护

### 7.5 跨平台兼容性
- 不同浏览器的PDF.js兼容性
- 思源API版本适配
- 移动设备响应式设计
- 深色/浅色主题适配

## 8. 特色功能

### 8.1 多项目管理
- 支持创建多个独立的PDF项目
- 每个项目可包含多本PDF
- 项目间数据隔离

### 8.2 智能标注
- 多级标注体系
- 标注层级关系管理
- 自动同步到思源笔记

### 8.3 视图多样化
- 分屏模式：PDF与标注并排
- 列表模式：专注标注管理
- 思维导图模式：可视化层级关系

### 8.4 图片摘录
- PDF图片圈选提取
- 自动上传到思源资源库
- 图片标注管理

### 8.5 交互式思维导图
- 基于标注层级的可视化
- 力导向图布局
- 节点交互操作
- 导图导出功能
