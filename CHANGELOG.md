# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-24

### Added
- 思维导图可视化功能：新增MindMapViewer组件，使用D3.js展示标注间的层级关系
- 项目管理功能：支持创建和管理多个PDF项目，每个项目可包含多本PDF文档
- 图片摘录功能：支持圈选PDF中的图片并提取到思源笔记
- 多视图模式：支持分屏模式、列表模式和思维导图模式三种视图切换
- 标注层级管理：支持标注间的父子关系，构建树形结构
- 拖拽调整界面：支持拖拽调整PDF预览区和标注列表区的宽度比例
- 全屏模式：支持插件面板全屏显示
- 目标文档选择：支持选择特定思源文档作为标注保存目标
- 防重复创建机制：避免相同内容的标注被重复创建

### Changed
- 重构了项目整体架构，采用模块化设计提高代码可维护性
- 优化了PDFViewer组件，增加了图片选择和提取功能
- 改进了AnnotationList组件，支持层级结构展示和管理
- 升级了UI界面，采用现代化设计风格，提升用户体验
- 优化了数据存储机制，支持多项目数据隔离和管理
- 改进了标注同步机制，增加冲突检测和解决策略

### Fixed
- 修复了多个TypeScript类型错误
- 解决了组件卸载时的内存泄漏问题
- 修复了PDF渲染过程中的性能问题
- 解决了标注数据同步的时序问题
- 修复了UI组件在不同主题下的显示问题
- 解决了大量标注数据时的渲染性能问题

## [0.0.17] - 2026-02-22

### Fixed
- Fixed `indexOf` error when selecting SiYuan documents in dropdown
- Fixed issue where document list doesn't show after clearing selection
- Added proper null/undefined value handling for document search results

### Changed
- Updated plugin metadata for marketplace compatibility
- Improved document list refresh behavior

## [0.0.16] - 2026-02-21

### Changed
- Removed all debug console.log statements from production code
- Kept console.error and console.warn for error reporting

## [0.0.13] - 2026-02-20

### Added
- Hover to show delete button on PDF highlight markers
- Click to select + Delete key to remove annotations in PDF
- 📷 badge for image excerpts in PDF
- Delete confirmation dialog distinguishes between image/text excerpts

### Optimized
- Annotation list rendering performance, fixed duplicate display issue

### Fixed
- PDF highlight markers not responding to clicks (z-index layer fix)
- Bidirectional sync issue for annotation deletion

## [0.0.8] - 2026-02-19

### Added
- PDF annotation click selection feature - click on annotation to select it
- Delete key support - press Delete to remove selected annotation
- Annotation deletion now syncs with SiYuan block removal

### Fixed
- Error when annotation color property is undefined in markdown generator
- Annotation height too small displaying as a line - now ensures minimum height

### Optimized
- Better visual feedback for selected annotations (thicker border, dashed inner border)

## [0.0.7] - 2026-02-18

### Added
- Multi-PDF project management
- Image excerpt feature with area selection
- Annotation level classification (Title, H1-H5, Text)
- Target document selection for saving annotations
- Annotation list with edit and delete functions
- PDF zoom controls

### Changed
- Improved UI/UX design
- Better PDF rendering with PDF.js

## [0.0.1] - 2026-02-15

### Added
- Initial release
- Basic PDF viewing functionality
- Simple plugin framework
