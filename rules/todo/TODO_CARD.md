# 模块 2：摘录与卡片系统

> 完成度：**95%** | 状态：🔄 进行中

---

## ✅ 已完成功能

### 核心功能
- [x] 卡片数据结构定义 (types/card.ts)
- [x] 卡片创建/编辑/删除 (CardEditor, CardEditorDialog)
- [x] 卡片列表视图 (CardList, VirtualCardList)
- [x] 卡片看板视图 (CardBoxBoard, CardBoxBoardView)
- [x] 卡片时间线视图 (CardTimelineView, TimelineView)
- [x] 卡片批量操作 (CardBatchOperations)
- [x] 标签管理
- [x] 卡片状态流转
- [x] 快速捕获菜单 (QuickCaptureMenu)
- [x] 标注编辑 (AnnotationEditor)
- [x] 标注列表 (AnnotationList)
- [x] 标注样式选择器 (AnnotationStyleSelector)

### 组件清单
| 组件 | 路径 | 状态 |
|------|------|------|
| CardEditor | `src/components/CardEditor.vue` | ✅ |
| CardEditorDialog | `src/components/CardEditorDialog.vue` | ✅ |
| CardList | `src/components/CardList.vue` | ✅ |
| VirtualCardList | `src/components/VirtualCardList.vue` | ✅ |
| CardBoxBoard | `src/components/CardBoxBoard.vue` | ✅ |
| CardBoxBoardView | `src/components/CardBoxBoardView.vue` | ✅ |
| CardTimelineView | `src/components/CardTimelineView.vue` | ✅ |
| TimelineView | `src/components/TimelineView.vue` | ✅ |
| CardBatchOperations | `src/components/CardBatchOperations.vue` | ✅ |
| QuickCaptureMenu | `src/components/QuickCaptureMenu.vue` | ✅ |
| AnnotationEditor | `src/components/AnnotationEditor.vue` | ✅ |
| AnnotationList | `src/components/AnnotationList.vue` | ✅ |
| AnnotationStyleSelector | `src/components/AnnotationStyleSelector.vue` | ✅ |

### 服务层
| 服务 | 路径 | 状态 |
|------|------|------|
| cardService | `src/services/cardService.ts` | ✅ |
| cardEnhanceService | `src/services/cardEnhanceService.ts` | ✅ |
| cardEnhancedService | `src/services/cardEnhancedService.ts` | ✅ |
| cardBoxService | `src/services/cardBoxService.ts` | ✅ |
| annotationEnhanceService | `src/services/annotationEnhanceService.ts` | ✅ |

### 状态管理
| Store | 路径 | 状态 |
|------|------|------|
| cardStore | `src/stores/cardStore.ts` | ✅ |

### 组合式函数
| Composable | 路径 | 状态 |
|------|------|------|
| useCard | `src/composables/useCard.ts` | ✅ |

---

## 🔄 进行中

### v1.2.29 - PDF 摘录联动增强
- [ ] 富文本编辑支持
- [ ] 公式/代码块优化
- [ ] 原文高亮颜色自定义
- [ ] 批注/笔记附加

---

## 📋 待办事项

### 中优先级
- [ ] 卡片富文本编辑器增强
- [ ] 公式编辑支持（KaTeX）
- [ ] 代码块语法高亮

### 低优先级
- [ ] 卡片版本历史
- [ ] 卡片评论/批注
- [ ] 卡片关联推荐

---

## 📝 历史变更

### v1.2.13 - 2026-02-28
- PDF 摘录回源跳转集成到 CardList 组件
- AnnotationList 组件集成 PDF 跳转功能

### v1.2.11 及之前
- 卡片系统基础功能完成
- 卡片盒看板三种视图完成
- 标注管理功能完成

---

## 📊 功能统计

| 功能类别 | 完成数 | 总数 | 完成度 |
|----------|--------|------|--------|
| 核心功能 | 12/13 | 13 | 92% |
| 组件 | 13/13 | 13 | 100% |
| 服务 | 5/5 | 5 | 100% |
| 状态管理 | 1/1 | 1 | 100% |
| 组合式函数 | 1/1 | 1 | 100% |
