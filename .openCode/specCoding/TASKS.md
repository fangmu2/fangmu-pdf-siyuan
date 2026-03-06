# 任务清单 (TASKS.md)

**最后更新**: 2026-03-06  
**项目版本**: v1.4.3  
**来源**: CODE-REVIEW-REPORT.md, UNIFIED-TASK-LIST.md, TASKS.md, P0-FIX-REPORT.md

> **说明**: 本文档仅包含**待完成任务**，已完成任务归档至 `COMPLETED-TASKS.md`

---

## 一、任务总览

### 1.1 任务统计

| 优先级 | 任务数 | 状态 | 修复期限 |
|--------|--------|------|----------|
| **P0 - 严重** | 6 | 🔴 紧急 | 第 1 周 |
| **P1 - 重要** | 13 | 🟠 高优 | 第 2-3 周 |
| **P2 - 中等** | 22 | 🟡 中优 | 第 4-6 周 |
| **P3 - 低** | 8 | 🟢 低优 | 后续迭代 |
| **总计** | **49** | | **77-117 天工时** |

### 1.2 任务来源

- **代码审查缺陷**: 62 个（来自 CODE-REVIEW-REPORT.md）
- **MarginNote4 差距**: 29 项功能差距
- **技术债务**: 17 项代码质量问题

---

## 二、P0 优先级任务（严重 - 立即修复）

### 2.1 思维导图打不开问题（4 个）

#### 🔴 P0-1: 思维导图数据加载无错误边界
- **状态**: ⏳ 待开始
- **位置**: `FreeCanvasViewer.vue:8-23`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 错误显示条件苛刻，无重试机制
- **修复方案**: 独立错误状态 + 重试按钮 + 详细错误信息
- **预计工时**: 2-3 小时

#### 🔴 P0-2: 临时 ID 处理不当导致数据丢失
- **状态**: ⏳ 待开始
- **位置**: `freeMindMapDataIntegrationService.ts:54-89`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 临时 ID 验证缺失，localStorage 损坏无降级
- **修复方案**: 正则验证 + 默认数据降级
- **预计工时**: 1-2 小时

#### 🔴 P0-3: Store 保存无验证和重试
- **状态**: ⏳ 待开始
- **位置**: `freeMindMapStore.ts:1320-1360`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 保存失败静默，数据丢失
- **修复方案**: ID 验证 + 3 次重试 + 用户提示
- **预计工时**: 2-3 小时

#### 🔴 P0-4: PDF 跳转服务无超时处理
- **状态**: ⏳ 待开始
- **位置**: `pdfJumpService.ts:30-55`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: API 调用无超时，思源无响应时插件假死
- **修复方案**: 打开超时 10 秒 + 跳转超时 5 秒
- **预计工时**: 2-3 小时

### 2.2 巨型组件拆分（2 个）

#### 🔴 P0-5: PDFViewer.vue 拆分
- **状态**: ⏳ 待开始
- **位置**: `src/components/PDFViewer.vue` (3,490 行)
- **来源**: P0-FIX-REPORT.md, UNIFIED-TASK-LIST.md
- **目标**: 拆分为 8 个子组件（PDFRenderer, AnnotationOverlay, ShapeOverlay, PDFToolbar, OutlinePanel, BookmarkPanel, SearchPanel）
- **验收**: 主组件<600 行，构建成功
- **预计工时**: 5-7 天

#### 🔴 P0-6: FreeCanvasViewer.vue 拆分
- **状态**: ⏳ 待开始
- **位置**: `src/components/MindMapFreeCanvas/FreeCanvasViewer.vue` (2,979 行)
- **来源**: P0-FIX-REPORT.md, UNIFIED-TASK-LIST.md
- **目标**: 拆分为 5 个子组件（CanvasCore, NodeRegistry, MindMapToolbar, MindMapDialogs）
- **验收**: 主组件<800 行，思维导图正常
- **预计工时**: 3-4 天

---

## 三、P1 优先级任务（重要 - 近期完成）

### 3.1 内存泄漏与竞态条件（4 个）

#### 🟠 P1-1: 事件监听器未清理
- **状态**: ⏳ 待开始
- **位置**: `PDFViewer.vue:2420-2422`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: document/window 事件监听器可能累积
- **修复**: 使用命名函数或保存引用
- **预计工时**: 1-2 小时

#### 🟠 P1-2: 异步操作缺少 try-catch
- **状态**: ⏳ 待开始
- **位置**: `PDFViewer.vue:1907-1923`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: pdfDoc.getDestination() 可能抛出异常
- **修复**: 添加 try-catch + 用户反馈
- **预计工时**: 1-2 小时

#### 🟠 P1-3: 竞态条件 - PDF 加载与组件卸载
- **状态**: ⏳ 待开始
- **位置**: `usePDFLoader.ts:20-60`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 组件卸载后 Blob URL 不释放
- **修复**: 添加 isCancelled 标志
- **预计工时**: 2-3 小时

#### 🟠 P1-4: 同步队列无错误重试
- **状态**: ⏳ 待开始
- **位置**: `realtimeSyncService.ts:243-269`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 同步失败项永久丢失
- **修复**: 失败项重新入队 + 重试计数
- **预计工时**: 2-3 小时

### 3.2 功能完善（5 个）

#### 🟠 P1-5: 双向跳转无失败降级
- **状态**: ⏳ 待开始
- **位置**: `bidirectionalJumpService.ts:59-79`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 节点数据不完整时无提示
- **修复**: 添加 onFail 回调
- **预计工时**: 1-2 小时

#### 🟠 P1-6: ID 映射无持久化
- **状态**: ⏳ 待开始
- **位置**: `realtimeSyncService.ts:50-54`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 页面刷新后联动关系丢失
- **修复**: localStorage 持久化
- **预计工时**: 1-2 小时

#### 🟠 P1-7: 定时器未清理
- **状态**: ⏳ 待开始
- **位置**: `PDFViewer.vue:2248-2265`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: renderTimer 在组件卸载时未清理
- **修复**: onBeforeUnmount 清理
- **预计工时**: 1 小时

#### 🟠 P1-8: 标注移动功能
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W6-T5)
- **详情**: 拖拽流畅，位置持久化
- **预计工时**: 1-2 天

#### 🟠 P1-9: 标注复制/粘贴功能
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W6-T6)
- **详情**: Ctrl+C/V 快捷键，跨 PDF 复制
- **预计工时**: 1-2 天

### 3.3 架构优化（4 个）

#### 🟠 P1-10: App.vue 拆分
- **状态**: ⏳ 待开始
- **位置**: `src/App.vue` (3,453 行)
- **来源**: P0-FIX-REPORT.md, UNIFIED-TASK-LIST.md
- **目标**: 拆分为 10+ 子组件（AppHeader, AppToolbar, PdfArea, MindMapSidebar 等）
- **验收**: 主组件<600 行，功能正常
- **预计工时**: 5-7 天

#### 🟠 P1-11: 标注批注竞态条件修复
- **状态**: ⏳ 待开始
- **位置**: `AnnotationList.legacy.vue:1905-1940`
- **来源**: P0-FIX-REPORT.md, UNIFIED-TASK-LIST.md
- **问题**: 快速添加多个批注时数据覆盖
- **修复**: 使用队列或乐观更新策略
- **预计工时**: 1 天

#### 🟠 P1-12: 虚拟滚动实现
- **状态**: ⏳ 待开始
- **位置**: `CardList.vue`, `AnnotationList.vue`
- **来源**: AUDIT_REPORT.md, UNIFIED-TASK-LIST.md
- **方案**: vue-virtual-scroller
- **预计工时**: 3-5 天

#### 🟠 P1-13: 统一错误处理
- **状态**: ⏳ 待开始
- **来源**: AUDIT_REPORT.md, UNIFIED-TASK-LIST.md
- **方案**: 统一错误处理函数 + 错误边界组件
- **预计工时**: 3-5 天

---

## 四、P2 优先级任务（中等 - 本周完成）

### 4.1 代码质量（6 个）

#### 🟡 P2-1: composables 未使用导入修复
- **状态**: ⏳ 待开始
- **数量**: ~64 个未使用导入
- **来源**: AUDIT_REPORT.md, UNIFIED-TASK-LIST.md
- **预计工时**: 2-3 天

#### 🟡 P2-2: 空值访问 - currentViewport 可能为 null
- **状态**: ⏳ 待开始
- **位置**: `PDFViewer.vue:1412-1427`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 高亮位置计算错误
- **预计工时**: 1 小时

#### 🟡 P2-3: 类型安全 - `any` 类型滥用
- **状态**: ⏳ 待开始
- **位置**: 多处
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: IDE 提示不准确
- **预计工时**: 4 小时

#### 🟡 P2-4: 状态同步问题 - props.currentPage 与本地 value
- **状态**: ⏳ 待开始
- **位置**: `PDFViewer.vue:2242-2265`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 无限更新循环风险
- **预计工时**: 2 小时

#### 🟡 P2-5: 图片框选坐标转换错误
- **状态**: ⏳ 待开始
- **位置**: `usePDFSelection.ts:228-237`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 框选区域偏移
- **预计工时**: 2 小时

#### 🟡 P2-6: PDF 缓存无上限
- **状态**: ⏳ 待开始
- **位置**: `utils/pdf.ts:14-28`
- **来源**: CODE-REVIEW-REPORT.md
- **问题**: 内存持续增长
- **预计工时**: 2 小时

### 4.2 功能完善（4 个）

#### 🟡 P2-7: 图章标注
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W6-T7)
- **详情**: 预定义图章库、自定义上传、大小可调、旋转支持
- **预计工时**: 2-3 天

#### 🟡 P2-8: OCR 文字识别
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W6-T8)
- **技术选型**: Tesseract.js
- **预计工时**: 3-5 天

#### 🟡 P2-9: 标注链接（关联线）
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W6-T9)
- **详情**: SVG 连接线渲染
- **预计工时**: 2-3 天

#### 🟡 P2-10: 全文搜索 UI 完善
- **状态**: ⏳ 待开始
- **来源**: UNIFIED-TASK-LIST.md (W7-T1)
- **预计工时**: 1-2 天

### 4.3 其他 P2 任务（12 个）

详见 CODE-REVIEW-REPORT.md P2 缺陷清单（P2-11 ~ P2-22）

---

## 五、P3 优先级任务（低 - 可延后）

| 编号 | 任务 | 来源 | 预计工时 |
|------|------|------|----------|
| P3-1 | 提取公共工具函数 | AUDIT_REPORT.md | 2-3 天 |
| P3-2 | 添加性能监控 | AUDIT_REPORT.md | 2-3 天 |
| P3-3 | 完善测试覆盖 | AUDIT_REPORT.md | 3-5 天 |
| P3-4 | 完善文档 | AUDIT_REPORT.md | 1 周 |
| P3-5 | 记忆曲线 | UNIFIED-TASK-LIST.md | 2-3 天 |
| P3-6 | 学习报告 | UNIFIED-TASK-LIST.md | 2-3 天 |
| P3-7 | 文档收藏 | UNIFIED-TASK-LIST.md | 1-2 天 |
| P3-8 | 导入外部导图 | UNIFIED-TASK-LIST.md | 2-3 天 |

---

## 六、依赖关系图

```
Wave 6 (P0 修复)
├── T1:PDFViewer 拆分 ──→ T2:App.vue 拆分
├── T1:PDFViewer 拆分 ──→ T3:FreeCanvas 拆分
├── T5:标注移动 ──→ T6:标注复制/粘贴
└── T4:竞态修复 (独立)

关键路径：PDFViewer 拆分 (5-7 天) → App.vue 拆分 (5-7 天) = 12-14 天
```

---

## 七、执行建议

### 第 1 阶段（第 1 周）- P0 修复
```
并行执行：
- P0-1 ~ P0-4: 思维导图打不开问题修复（8-11 小时）
- P0-5: PDFViewer.vue 拆分启动
```

### 第 2 阶段（第 2 周）- P1 修复
```
并行执行：
- P1-1 ~ P1-7: 内存泄漏与竞态条件（10-14 小时）
- P0-6: FreeCanvasViewer.vue 拆分
```

### 第 3 阶段（第 3 周）- P1 功能
```
并行执行：
- P1-8 ~ P1-9: 标注移动/复制功能
- P1-10: App.vue 拆分
```

---

## 八、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 组件拆分后功能回归 | 中 | 高 | 充分测试 + 逐步拆分 |
| OCR API 不兼容 | 中 | 中 | Tesseract.js 降级方案 |
| 虚拟滚动性能不达标 | 低 | 中 | 原型验证 + 备选方案 |

---

## 九、任务变更历史

| 日期 | 变更内容 |
|------|----------|
| 2026-03-06 | 整合 CODE-REVIEW-REPORT.md 62 个缺陷 + UNIFIED-TASK-LIST.md 任务 |
| 2026-03-06 | 分离已完成任务至 COMPLETED-TASKS.md |

---

**文档维护**: 任务完成后更新状态，每周更新进展
