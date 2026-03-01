<!-- src/App.vue -->
<template>
  <div class="pdf-mindmap-plugin">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-left">
        <button
          @click="showLearningSetManager = !showLearningSetManager"
          class="header-btn learning-set-btn"
          :class="{ active: showLearningSetManager }"
          title="学习集管理"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
          <span class="btn-text">学习集</span>
        </button>
        <button
          @click="showCardBox = !showCardBox"
          class="header-btn card-box-btn"
          :class="{ active: showCardBox }"
          title="卡片盒"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"/>
          </svg>
          <span class="btn-text">卡片</span>
        </button>
        <button
          @click="startReview"
          class="header-btn review-btn"
          :class="{ active: showReviewSession }"
          title="开始复习"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          <span class="btn-text">复习</span>
        </button>
        <button
          @click="showSmartStudySet = !showSmartStudySet"
          class="header-btn smart-btn"
          :class="{ active: showSmartStudySet }"
          title="智能学习集"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span class="btn-text">智能</span>
        </button>
        <button
          @click="showContextView = !showContextView"
          class="header-btn context-btn"
          :class="{ active: showContextView }"
          title="上下文搜索"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span class="btn-text">搜索</span>
        </button>
        <button
          @click="showKeywordLibrary = !showKeywordLibrary"
          class="header-btn keyword-btn"
          :class="{ active: showKeywordLibrary }"
          title="关键词库"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 14H7v-2h10v2zm0-5H7V9h10v2z"/>
          </svg>
          <span class="btn-text">词库</span>
        </button>
        <button
          @click="showMemoryContext = !showMemoryContext"
          class="header-btn memory-btn"
          :class="{ active: showMemoryContext }"
          title="场景记忆"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span class="btn-text">记忆</span>
        </button>
        <button
          @click="toggleMindMapView"
          class="header-btn mindmap-btn"
          :class="{ active: viewMode === 'mindmap' }"
          title="思维导图（树状）"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span class="btn-text">导图</span>
        </button>
        <button
          @click="showPdfMindMapLink = true"
          class="header-btn link-view-btn"
          :class="{ active: showPdfMindMapLink }"
          title="PDF+ 思维导图联动（MarginNote 风格）"
          :disabled="!currentPdf"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span class="btn-text">联动</span>
        </button>
        <button
          @click="showSettings = !showSettings"
          class="header-btn settings-btn"
          :class="{ active: showSettings }"
          title="设置"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span class="btn-text">设置</span>
        </button>
        <div class="header-divider"></div>
        <div class="header-title">
          <span class="title-main">{{ currentLearningSet?.name || 'MarginNote 学习' }}</span>
          <span v-if="currentPdf" class="title-sub">{{ currentPdf.name }}</span>
        </div>
      </div>
      <div class="header-right">
        <div v-if="todayReviewCount > 0" class="header-review-count">
          <span class="review-count-icon">✓</span>
          <span class="review-count-text">{{ todayReviewCount }}</span>
        </div>
        <button
          @click="toggleView"
          class="header-btn icon-btn"
          :title="viewMode === 'split' ? '切换到列表视图' : '切换到分屏视图'"
        >
          <svg v-if="viewMode === 'split'" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/>
          </svg>
        </button>
        <button
          @click="toggleFullscreen"
          class="header-btn icon-btn"
          :title="isFullscreen ? '退出全屏' : '全屏'"
        >
          <svg v-if="isFullscreen" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>
        <button @click="handleClose" class="header-btn icon-btn close-btn" title="关闭">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 学习集管理器 -->
    <LearningSetManager
      v-if="showLearningSetManager"
      :current-pdf-path="currentPdf?.path || ''"
      @set-selected="handleLearningSetSelected"
      @pdf-open-request="handlePdfOpenRequest"
      @annotation-focus-request="handleAnnotationFocusRequest"
      @page-jump-request="handlePageJumpRequest"
    />

    <!-- 工具栏 -->
    <div class="toolbar" v-if="currentLearningSet && currentPdf">
      <div class="toolbar-left">
        <select
          v-if="currentLearningSet.pdfs?.length > 1"
          v-model="currentPdfId"
          class="pdf-select"
          @change="onPdfSwitch"
        >
          <option v-for="pdf in currentLearningSet.pdfs" :key="pdf.id" :value="pdf.id">
            {{ pdf.name }}
          </option>
        </select>
        <button
          @click="triggerAddPdf"
          class="toolbar-btn"
          title="添加 PDF 到当前学习集"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>PDF</span>
        </button>
      </div>

      <div class="toolbar-center">
        <div class="toolbar-group">
          <select v-model="currentLevel" class="level-select">
            <option v-for="level in ANNOTATION_LEVELS" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group mode-group">
          <button
            @click="extractMode = 'text'"
            class="mode-btn"
            :class="{ active: extractMode === 'text' }"
            title="文字摘录"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span>文字</span>
          </button>
          <button
            @click="extractMode = 'image'"
            class="mode-btn"
            :class="{ active: extractMode === 'image' }"
            title="图片摘录"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>图片</span>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="doc-selector">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="doc-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <input
            v-model="targetDocSearch"
            class="doc-input"
            :placeholder="targetDoc ? targetDoc.name : '目标文档'"
            list="doc-list"
            @input="onDocSearchInput"
            @change="onDocSelect"
            @focus="onDocFocus"
            :disabled="docSearchLoading"
          />
          <datalist id="doc-list">
            <option v-for="doc in targetDocOptions" :key="doc.id" :value="doc.name || ''" :data-id="doc.id" />
          </datalist>
          <button v-if="targetDoc" @click="clearTargetDoc" class="doc-clear" title="清除">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="panel-body" :class="viewMode">
      <div class="pdf-area" v-if="currentPdf">
        <PDFViewer
          :pdf-path="currentPdf.path"
          :current-page="currentPage"
          :annotations="currentPdfAnnotations"
          :highlight-annotation="highlightAnnotation"
          :extract-mode="extractMode"
          @loaded="handlePdfLoaded"
          @page-change="handlePageChange"
          @text-selected="handleTextSelected"
          @image-selected="handleImageSelected"
          @annotation-delete="handleAnnotationDelete"
        />
      </div>

      <div v-else class="welcome-area">
        <div class="welcome-content">
          <div class="welcome-icon">📚</div>
          <h2>欢迎使用 MarginNote 学习</h2>
          <p>创建学习集，导入多本 PDF，统一管理标注和卡片</p>
          <button @click="showNewSetDialog" class="b3-button b3-button--primary">
            创建新学习集
          </button>
          <div v-if="learningSets.length > 0" class="recent-sets">
            <p>最近的学习集:</p>
            <div
              v-for="set in learningSets.slice(0, 5)"
              :key="set.id"
              class="recent-set-item"
              @click="switchLearningSet(set.id)"
            >
              <span class="set-icon">📖</span>
              <span class="set-title">{{ set.name }}</span>
              <span class="set-pdf-count">{{ set.pdfCount }}本 PDF</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分隔条：在 split 和 mindmap 模式下显示 -->
      <div
        v-if="currentPdf && (viewMode === 'split' || viewMode === 'mindmap')"
        class="resize-handle"
        @mousedown="handleResizeStart"
      >
        <div class="resize-line"></div>
      </div>

      <!-- 右侧区域：根据模式切换显示内容 -->
      <!-- 标注列表模式 (split) - 现在改为显示思维导图 -->
      <div v-if="viewMode === 'split'" class="annotation-area mindmap-sidebar-area" :style="{ width: `${annotationWidth}px` }">
        <div v-if="currentLearningSet && currentPdf" class="mindmap-sidebar-compact">
          <!-- 头部工具栏 -->
          <div class="mindmap-sidebar-header">
            <h3 class="mindmap-sidebar-title">
              <svg class="title-icon" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              思维导图
            </h3>
            <div class="mindmap-header-actions">
              <button class="action-btn" :title="mindMapAutoSync ? '自动同步已开启' : '自动同步已关闭'" @click="toggleMindMapAutoSync">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button class="action-btn" title="立即同步" @click="handleMindMapSync">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button class="action-btn" title="清空导图" @click="confirmMindMapClear">
                <svg viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- 画布区域 -->
          <div class="mindmap-sidebar-body" :data-debug="`mindMapBlockId=${mindMapBlockId}`">
            <div v-if="!mindMapBlockId" class="mindmap-loading">
              <span class="loading-icon">🔄</span>
              <span class="loading-text">初始化思维导图...</span>
            </div>
            <FreeCanvasViewer
              v-else
              :key="mindMapBlockId"
              :block-id="mindMapBlockId"
              :study-set-id="currentLearningSet?.id"
              :read-only="false"
              :show-grid="true"
              :show-controls="true"
              :show-mini-map="false"
              :show-toolbar="true"
              :show-search="false"
              :show-filter="false"
              @node-click="handleMindMapNodeClick"
            />
          </div>
          <!-- 底部状态栏 -->
          <div class="mindmap-sidebar-footer">
            <span class="status-text">{{ mindMapNodeCount }} 个节点</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>请先选择或创建一个学习集</p>
          <button @click="showLearningSetManager = true" class="b3-button b3-button--primary">
            选择学习集
          </button>
        </div>
      </div>

      <!-- 思维导图模式 (mindmap) - 左 PDF 右思维导图布局 -->
      <div v-else-if="viewMode === 'mindmap'" class="mindmap-area" :style="{ width: `${mindmapWidth}px` }">
        <div v-if="currentLearningSet && currentPdf" class="mindmap-sidebar-compact">
          <!-- 头部工具栏 -->
          <div class="mindmap-sidebar-header">
            <h3 class="mindmap-sidebar-title">
              <svg class="title-icon" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              思维导图
            </h3>
            <div class="mindmap-header-actions">
              <button class="action-btn" :title="'自动同步'" @click="toggleMindMapAutoSync">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button class="action-btn" title="立即同步" @click="handleMindMapSync">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button class="action-btn" title="清空导图" @click="confirmMindMapClear">
                <svg viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- 画布区域 -->
          <div class="mindmap-sidebar-body" :data-debug="`mindMapBlockId=${mindMapBlockId}`">
            <div v-if="!mindMapBlockId" class="mindmap-loading">
              <span class="loading-icon">🔄</span>
              <span class="loading-text">初始化思维导图...</span>
            </div>
            <FreeCanvasViewer
              v-else
              :key="mindMapBlockId"
              :block-id="mindMapBlockId"
              :study-set-id="currentLearningSet?.id"
              :read-only="false"
              :show-grid="true"
              :show-controls="true"
              :show-mini-map="false"
              :show-toolbar="true"
              :show-search="false"
              :show-filter="false"
              @node-click="handleMindMapNodeClick"
            />
          </div>
          <!-- 底部状态栏 -->
          <div class="mindmap-sidebar-footer">
            <span class="status-text">{{ mindMapNodeCount }} 个节点</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>请先选择或创建一个学习集</p>
          <button @click="showLearningSetManager = true" class="b3-button b3-button--primary">
            选择学习集
          </button>
        </div>
      </div>
    </div>

    <!-- 文本选择提示 -->
    <div v-if="selectedText" class="selection-toast">
      <span class="selected-text">已选择："{{ selectedText.substring(0, 30) }}{{ selectedText.length > 30 ? '...' : '' }}"</span>
      <span class="level-hint">→ {{ getLevelLabel(currentLevel) }}</span>
      <button
        @click="createAnnotationFromSelection"
        class="b3-button b3-button--primary b3-button--small"
        :disabled="creatingAnnotation"
      >
        {{ creatingAnnotation ? '创建中...' : '创建标注' }}
      </button>
      <button
        @click="cancelSelection"
        class="b3-button b3-button--outline b3-button--small"
        :disabled="creatingAnnotation"
      >
        取消
      </button>
    </div>

    <!-- 标注编辑弹窗 -->
    <AnnotationEditor
      :annotation="editingAnnotation"
      :visible="editorVisible"
      @update:visible="editorVisible = $event"
      @saved="handleAnnotationSaved"
    />

    <!-- 卡片盒 -->
    <div v-if="showCardBox" class="side-panel-overlay" @click.self="showCardBox = false">
      <div class="side-panel-content">
        <CardBoxBoard
          :cards="allCards"
          :study-set-id="currentLearningSet?.id"
        />
      </div>
    </div>

    <!-- 复习会话 -->
    <div v-if="showReviewSession" class="side-panel-overlay" @click.self="showReviewSession = false">
      <div class="side-panel-content">
        <ReviewSession
          :study-set-id="currentLearningSet?.id"
          @close="showReviewSession = false"
        />
      </div>
    </div>

    <!-- 智能学习集 -->
    <div v-if="showSmartStudySet" class="side-panel-overlay" @click.self="showSmartStudySet = false">
      <div class="side-panel-content">
        <SmartStudySet
          :cards="allCards"
          :study-set-id="currentLearningSet?.id"
          @save="handleSmartSetSave"
          @add-to-set="handleSmartSetAddToSet"
        />
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="side-panel-overlay" @click.self="showSettings = false">
      <div class="side-panel-content">
        <SettingsPanel
          @save="handleSettingsSave"
          @export="handleDataExport"
          @import="handleDataImport"
          @clear-cache="handleClearCache"
        />
      </div>
    </div>

    <!-- 第五阶段高级功能面板 -->
    <div v-if="showContextView" class="side-panel-overlay" @click.self="showContextView = false">
      <div class="side-panel-content">
        <ContextView
          :selected-text="selectedText"
          @result-select="handleContextResultSelect"
        />
      </div>
    </div>

    <div v-if="showKeywordLibrary" class="side-panel-overlay" @click.self="showKeywordLibrary = false">
      <div class="side-panel-content">
        <KeywordLibrary
          :cards="allCards"
          @keyword-select="handleKeywordSelect"
          @note-click="handleCardNavigate"
        />
      </div>
    </div>

    <div v-if="showMemoryContext" class="side-panel-overlay" @click.self="showMemoryContext = false">
      <div class="side-panel-content">
        <MemoryContext
          :cards="allCards"
          :current-pdf="currentPdf?.path || ''"
          :current-page="currentPage"
          :current-doc="targetDoc?.name || ''"
          @memory-select="handleMemorySelect"
          @memory-replay="handleMemoryReplay"
          @note-click="handleCardNavigate"
        />
      </div>
    </div>

    <SearchPanel
      :cards="allCards"
      :study-set-id="currentLearningSet?.id"
      @result-select="handleSearchResultSelect"
      @navigate-to="handleSearchNavigate"
    />

    <QuickCaptureMenu
      :visible="showQuickCaptureMenu"
      :x="quickCaptureMenuPosition.x"
      :y="quickCaptureMenuPosition.y"
      :selected-text="selectedText"
      :study-sets="studySetsList"
      :source-location="quickCaptureSourceLocation"
      @update:visible="showQuickCaptureMenu = $event"
      @captured="handleQuickCapture"
      @open-editor="handleOpenCardEditor"
      @closed="handleQuickCaptureClosed"
    />

    <CardEditorDialog
      :model-value="editingCard"
      :visible="showCardEditorDialog"
      :study-sets="studySetsList"
      @update:visible="showCardEditorDialog = $event"
      @saved="handleCardEditorSaved"
      @deleted="handleCardEditorDeleted"
      @closed="handleCardEditorClosed"
    />

    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 自由画布思维导图 (MarginNote 风格) -->
    <div v-if="showFreeMindMap" class="side-panel-overlay free-mindmap-overlay" @click.self="showFreeMindMap = false">
      <div class="free-mindmap-panel">
        <div class="free-mindmap-header">
          <span class="free-mindmap-title">🧠 自由画布思维导图</span>
          <button @click="showFreeMindMap = false" class="free-mindmap-close" title="关闭">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="free-mindmap-content">
          <FreeCanvasViewer
            :block-id="freeMindMapBlockId"
            :study-set-id="currentLearningSet?.id"
            :show-grid="true"
            :show-controls="true"
            :show-toolbar="true"
          />
        </div>
      </div>
    </div>

    <!-- PDF+ 思维导图联动视图 (MarginNote 风格核心功能) -->
    <div v-if="showPdfMindMapLink" class="side-panel-overlay pdf-mindmap-link-overlay" @click.self="showPdfMindMapLink = false">
      <div class="pdf-mindmap-link-panel">
        <div class="link-panel-header">
          <span class="link-panel-title">📖 PDF+🧠 思维导图联动</span>
          <button @click="showPdfMindMapLink = false" class="link-panel-close" title="关闭">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="link-panel-content">
          <PdfMindMapLinkViewer
            :pdf-doc-id="currentPdf?.path || ''"
            :study-set-id="currentLearningSet?.id || ''"
            @close="showPdfMindMapLink = false"
          />
        </div>
      </div>
    </div>

    <div v-if="newSetDialog.visible" class="dialog-overlay" @click.self="newSetDialog.visible = false">
      <div class="dialog-panel">
        <div class="dialog-header">创建新学习集</div>
        <div class="dialog-body">
          <div class="form-group">
            <label>学习集名称：</label>
            <input
              v-model="newSetDialog.name"
              type="text"
              class="b3-text-field"
              placeholder="例如：MySQL 学习笔记"
            />
          </div>
          <div class="form-group">
            <label>描述（可选）：</label>
            <textarea
              v-model="newSetDialog.description"
              class="b3-text-field"
              placeholder="描述这个学习集的目的和内容"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>添加第一个 PDF：</label>
            <div class="pdf-add-options">
              <button @click="selectPdfForNewSet" class="b3-button b3-button--outline">
                {{ newSetDialog.pdfName || '选择 PDF 文件' }}
              </button>
              <span class="pdf-hint">或从思源工作空间选择</span>
              <select v-model="newSetDialog.workspacePdfPath" class="b3-text-field pdf-select-workspace">
                <option value="">-- 从工作空间选择 PDF --</option>
                <option v-for="pdf in workspacePdfs" :key="pdf.path" :value="pdf.path">
                  {{ pdf.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="newSetDialog.visible = false" class="b3-button b3-button--outline">取消</button>
          <button
            @click="createNewLearningSet"
            class="b3-button b3-button--primary"
            :disabled="!newSetDialog.name"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import type { Plugin } from 'siyuan';
import PDFViewer from './components/PDFViewer.vue';
import AnnotationList from './components/AnnotationList.vue';
import AnnotationEditor from './components/AnnotationEditor.vue';
import FreeCanvasViewer from './components/MindMapFreeCanvas/FreeCanvasViewer.vue';
import PdfMindMapLinkViewer from './components/PdfMindMapLinkViewer.vue';
import PdfMindMapSidebar from './components/PdfMindMapSidebar.vue';
import LearningSetManager from './components/LearningSetManager.vue';
import CardBoxBoard from './components/CardBoxBoard.vue';
import ReviewSession from './components/ReviewSession.vue';
import CardEditorDialog from './components/CardEditorDialog.vue';
import QuickCaptureMenu from './components/QuickCaptureMenu.vue';
import ContextView from './components/ContextView.vue';
import KeywordLibrary from './components/KeywordLibrary.vue';
import MemoryContext from './components/MemoryContext.vue';
import SearchPanel from './components/SearchPanel.vue';
import { LearningSetService, type LearningSet, type LearningSetListItem } from './services/learningSetService';
import { uploadFileToAssets, updateCachedDocId, searchSiyuanDocs, insertBlock } from './api/siyuanApi';
import { deleteAnnotation as deleteAnnotationApi } from './api/annotationApi';
import type { PDFAnnotation, AnnotationLevel, ExtractMode } from './types/annotation';
import { ANNOTATION_LEVELS } from './types/annotation';
import type { CardType, CardStatus } from './types/card';

const props = defineProps<{ plugin: Plugin }>();

const learningSets = ref<LearningSetListItem[]>([]);
const currentLearningSet = ref<LearningSet | null>(null);
const currentPdfId = ref<string | null>(null);
const showLearningSetManager = ref(false);

const newSetDialog = ref({
  visible: false,
  name: '',
  description: '',
  pdfPath: '',
  pdfName: '',
  workspacePdfPath: ''
});

const workspacePdfs = ref<{ path: string; name: string }[]>([]);

const showCardBox = ref(false);
const showReviewSession = ref(false);
const showSmartStudySet = ref(false);
const showSettings = ref(false);
const showContextView = ref(false);
const showKeywordLibrary = ref(false);
const showMemoryContext = ref(false);
const todayReviewCount = ref(0);

const showQuickCaptureMenu = ref(false);
const quickCaptureMenuPosition = ref({ x: 0, y: 0 });
const quickCaptureSourceLocation = ref<any>(null);

const showCardEditorDialog = ref(false);
const editingCard = ref<any>(null);
const cardEditorPendingData = ref<any>(null);

const studySetsList = ref<any[]>([]);

let fileSelectMode: 'newSet' | 'addPdf' | 'none' = 'none';
let addTargetSetId: string | null = null;

const currentPage = ref(1);
const totalPages = ref(0);
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const loadingAnnotations = ref(false);
const annotations = ref<PDFAnnotation[]>([]);

const highlightAnnotation = ref<PDFAnnotation | null>(null);
const editingAnnotation = ref<PDFAnnotation | null>(null);
const editorVisible = ref(false);
const viewMode = ref<'split' | 'list' | 'mindmap'>('split');
const isFullscreen = ref(false);
const isResizing = ref(false);
const annotationWidth = ref(360);
const mindmapWidth = ref(400);
const currentLevel = ref<AnnotationLevel>('text');
const extractMode = ref<ExtractMode>('text');

const selectedText = ref('');
const selectedPage = ref(1);
const selectedRect = ref<[number, number, number, number] | null>(null);
const creatingAnnotation = ref(false);
const pendingTitleLevel = ref<AnnotationLevel | null>(null);

const cursorAfterId = ref<string | null>(null);

interface SiyuanDoc {
  id: string;
  name: string;
  box: string;
  hpath: string;
}
const targetDoc = ref<SiyuanDoc | null>(null);
const targetDocSearch = ref('');
const targetDocOptions = ref<SiyuanDoc[]>([]);
const docSearchLoading = ref(false);
let docSearchTimer: ReturnType<typeof setTimeout> | null = null;

const onDocSearchInput = () => {
  if (docSearchTimer) clearTimeout(docSearchTimer);
  docSearchTimer = setTimeout(async () => {
    docSearchLoading.value = true;
    try {
      const results = await searchSiyuanDocs(targetDocSearch.value);
      targetDocOptions.value = results;
    } catch (e) {
      console.error('[onDocSearchInput] 搜索失败:', e);
    } finally {
      docSearchLoading.value = false;
    }
  }, 300);
};

const onDocFocus = () => {
  loadDocOptions();
};

const onDocSelect = () => {
  const doc = targetDocOptions.value.find(d => d.name === targetDocSearch.value);
  if (doc) {
    targetDoc.value = doc;
  }
};

const clearTargetDoc = () => {
  targetDoc.value = null;
  targetDocSearch.value = '';
  loadDocOptions();
};

const loadDocOptions = async () => {
  try {
    const results = await searchSiyuanDocs('');
    targetDocOptions.value = results;
  } catch (e) {
    console.error('[loadDocOptions] 加载文档列表失败:', e);
  }
};

const currentPdf = computed(() => {
  if (!currentLearningSet.value) return null;
  if (!currentPdfId.value) return currentLearningSet.value.pdfs[0] || null;
  return currentLearningSet.value.pdfs.find(p => p.id === currentPdfId.value) || currentLearningSet.value.pdfs[0] || null;
});

const currentPdfAnnotations = computed(() => {
  if (!currentPdf.value) return [];
  return annotations.value.filter(a => a.pdfPath === currentPdf.value!.path);
});

const allCards = computed(() => {
  return annotations.value.map(ann => ({
    id: ann.id,
    content: ann.isImage ? '[图片摘录]' : ann.text,
    type: 'excerpt' as CardType,
    status: 'new' as CardStatus,
    createdAt: ann.created,
    updatedAt: ann.updated,
    pdfPath: ann.pdfPath,
    page: ann.page,
    note: ann.note,
    sourceLocation: {
      pdfPath: ann.pdfPath,
      page: ann.page,
      rect: ann.rect,
      docId: '',
      blockId: ann.blockId || ''
    },
    studySetId: currentLearningSet.value?.id || '',
    tags: [],
    difficulty: 1
  }));
});

const getLevelLabel = (level: AnnotationLevel): string => {
  const found = ANNOTATION_LEVELS.find(l => l.value === level);
  return found ? found.label : '正文标注';
};

const loadLearningSets = async () => {
  await LearningSetService.initStorage();
  learningSets.value = LearningSetService.getAllLearningSets();
  const current = LearningSetService.getCurrentLearningSet();
  if (current) {
    currentLearningSet.value = current;

    // 初始化思维导图块 ID
    await initMindMapBlockId();

    const pdf = LearningSetService.getCurrentPdf(current);
    if (pdf) {
      currentPdfId.value = pdf.id;
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    }
    annotations.value = current.annotations || [];
  }
};

const switchLearningSet = async (setId: string) => {
  saveCurrentState();
  const set = LearningSetService.switchLearningSet(setId);
  if (set) {
    currentLearningSet.value = set;

    // 重新初始化思维导图块 ID
    await initMindMapBlockId();

    const pdf = LearningSetService.getCurrentPdf(set);
    if (pdf) {
      currentPdfId.value = pdf.id;
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    } else {
      currentPdfId.value = null;
      totalPages.value = 0;
      currentPage.value = 1;
    }
    annotations.value = set.annotations || [];
    showLearningSetManager.value = false;
    targetDoc.value = null;
    targetDocSearch.value = '';
    targetDocOptions.value = [];
  }
};

const onPdfSwitch = () => {
  if (!currentLearningSet.value || !currentPdfId.value) return;
  if (currentPdf.value) {
    LearningSetService.updateLearningSetPdf(currentLearningSet.value.id, currentPdf.value.id, {
      currentPage: currentPage.value,
      totalPages: totalPages.value
    });
  }
  const set = LearningSetService.switchLearningSetPdf(currentLearningSet.value.id, currentPdfId.value);
  if (set) {
    currentLearningSet.value = set;
    const pdf = LearningSetService.getCurrentPdf(set);
    if (pdf) {
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    }
  }
};

const saveCurrentState = () => {
  if (currentLearningSet.value && currentPdf.value) {
    LearningSetService.updateLearningSetPdf(currentLearningSet.value.id, currentPdf.value.id, {
      currentPage: currentPage.value,
      totalPages: totalPages.value
    });
    LearningSetService.updateLearningSet(currentLearningSet.value.id, {
      annotationCount: annotations.value.length
    });
  }
};

const showNewSetDialog = () => {
  newSetDialog.value = {
    visible: true,
    name: '',
    description: '',
    pdfPath: '',
    pdfName: '',
    workspacePdfPath: ''
  };
};

const selectPdfForNewSet = () => {
  fileSelectMode = 'newSet';
  fileInput.value?.click();
};

const triggerAddPdf = () => {
  if (!currentLearningSet.value) return;
  addTargetSetId = currentLearningSet.value.id;
  fileSelectMode = 'addPdf';
  fileInput.value?.click();
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;

  try {
    const result = await uploadFileToAssets(file);

    if (fileSelectMode === 'newSet') {
      newSetDialog.value.pdfPath = result.path;
      newSetDialog.value.pdfName = result.name;
    } else if (fileSelectMode === 'addPdf') {
      const setId = addTargetSetId || currentLearningSet.value?.id;
      if (setId) {
        const pdf = await LearningSetService.addPdfToLearningSet(setId, result.path, result.name);

        if (pdf) {
          await loadLearningSets();
          if (currentLearningSet.value?.id === setId) {
            currentPdfId.value = pdf.id;
            currentPage.value = 1;
            totalPages.value = 0;
          }
        }
      }
      addTargetSetId = null;
    }

    fileSelectMode = 'none';
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败，请查看控制台');
  } finally {
    uploading.value = false;
    if (target) target.value = '';
  }
};

watch(() => newSetDialog.value.workspacePdfPath, async (newPath) => {
  if (newPath) {
    const pdf = workspacePdfs.value.find(p => p.path === newPath);
    if (pdf) {
      newSetDialog.value.pdfPath = pdf.path;
      newSetDialog.value.pdfName = pdf.name;
    }
  }
});

const createNewLearningSet = async () => {
  if (!newSetDialog.value.name) return;

  const pdfPath = newSetDialog.value.workspacePdfPath || newSetDialog.value.pdfPath;
  const pdfName = newSetDialog.value.workspacePdfPath
    ? workspacePdfs.value.find(p => p.path === newSetDialog.value.workspacePdfPath)?.name
    : newSetDialog.value.pdfName;

  uploading.value = true;

  try {
    const set = await LearningSetService.createLearningSet(
      newSetDialog.value.name,
      newSetDialog.value.description,
      pdfPath,
      pdfName
    );

    currentLearningSet.value = set;
    currentPdfId.value = set.pdfs[0]?.id || null;
    currentPage.value = 1;
    totalPages.value = 0;
    annotations.value = [];

    // 初始化思维导图块 ID
    await initMindMapBlockId();

    await loadLearningSets();
    newSetDialog.value.visible = false;
    showLearningSetManager.value = false;
  } catch (error) {
    console.error('创建学习集失败:', error);
    alert('创建学习集失败，请查看控制台');
  } finally {
    uploading.value = false;
  }
};

const loadAnnotations = async () => {
  if (!currentLearningSet.value) return;
  annotations.value = currentLearningSet.value.annotations || [];
};

const handlePdfLoaded = (numPages: number) => {
  totalPages.value = numPages;
  if (currentLearningSet.value && currentPdf.value) {
    LearningSetService.updateLearningSetPdf(currentLearningSet.value.id, currentPdf.value.id, { totalPages: numPages });
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  if (currentLearningSet.value && currentPdf.value) {
    LearningSetService.saveProgress(currentLearningSet.value.id, currentPdf.value.path, page);
  }
};

const handleAnnotationClick = (ann: PDFAnnotation) => {
  highlightAnnotation.value = ann;
  if (currentLearningSet.value) {
    const pdf = currentLearningSet.value.pdfs.find(p => p.path === ann.pdfPath);
    if (pdf && pdf.id !== currentPdfId.value) {
      currentPdfId.value = pdf.id;
      currentPage.value = ann.page;
    } else {
      currentPage.value = ann.page;
    }
  }
};

const handleAnnotationEdit = (ann: PDFAnnotation) => {
  editingAnnotation.value = ann;
  editorVisible.value = true;
};

const handleAnnotationSaved = () => {
  loadAnnotations();
};

const handleAnnotationDelete = async (ann: PDFAnnotation) => {
  if (!currentLearningSet.value) return;

  let confirmContent: string;
  if (ann.isImage) {
    confirmContent = `确定要删除这张图片摘录吗？\n\n图片路径：${ann.imagePath || '未知'}`;
  } else {
    const displayText = ann.text || '(空内容)';
    confirmContent = `确定要删除这条标注吗？\n\n"${displayText.substring(0, 50)}${displayText.length > 50 ? '...' : ''}"`;
  }

  if (!confirm(confirmContent)) {
    return;
  }

  try {
    if (ann.blockId) {
      await deleteAnnotationApi(ann.blockId);
    }

    annotations.value = annotations.value.filter(a => a.id !== ann.id);
    LearningSetService.removeAnnotationFromLearningSet(currentLearningSet.value.id, ann.id);
  } catch (error: any) {
    console.error('删除标注失败:', error);
    alert(`删除失败：${error.message || '未知错误'}`);
  }
};

const handleAnnotationMerge = (sourceId: string, targetId: string) => {
  if (!currentLearningSet.value) return;

  const sourceIndex = annotations.value.findIndex(a => a.id === sourceId);
  const targetIndex = annotations.value.findIndex(a => a.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    console.error('[handleAnnotationMerge] 找不到标注');
    return;
  }

  const siblingsUnderTarget = annotations.value.filter(a => a.parentId === targetId);
  let nextSortOrder = siblingsUnderTarget.length > 0
    ? Math.max(...siblingsUnderTarget.map(a => a.sortOrder || 0)) + 1
    : 0;

  annotations.value[sourceIndex] = {
    ...annotations.value[sourceIndex],
    parentId: targetId,
    sortOrder: nextSortOrder,
    updated: Date.now()
  };
  nextSortOrder++;

  const sourceChildren = annotations.value.filter(a => a.parentId === sourceId);
  for (const child of sourceChildren) {
    const childIndex = annotations.value.findIndex(a => a.id === child.id);
    if (childIndex !== -1) {
      annotations.value[childIndex] = {
        ...annotations.value[childIndex],
        parentId: targetId,
        sortOrder: nextSortOrder,
        updated: Date.now()
      };
      nextSortOrder++;
    }
  }

  currentLearningSet.value.annotations = annotations.value;
  LearningSetService.updateLearningSet(currentLearningSet.value.id, {
    annotations: annotations.value
  });
};

const handleAnnotationUnmerge = (annotationId: string) => {
  if (!currentLearningSet.value) return;

  const index = annotations.value.findIndex(a => a.id === annotationId);
  if (index === -1) {
    console.error('[handleAnnotationUnmerge] 找不到标注');
    return;
  }

  annotations.value[index] = {
    ...annotations.value[index],
    parentId: null,
    sortOrder: undefined,
    updated: Date.now()
  };

  annotations.value = annotations.value.map(a => {
    if (a.parentId === annotationId) {
      return {
        ...a,
        parentId: null,
        sortOrder: undefined,
        updated: Date.now()
      };
    }
    return a;
  });

  currentLearningSet.value.annotations = annotations.value;
  LearningSetService.updateLearningSet(currentLearningSet.value.id, {
    annotations: annotations.value
  });
};

const handleCursorChange = (afterId: string | null) => {
  cursorAfterId.value = afterId;
};

const insertAnnotationAtPosition = (newAnnotation: PDFAnnotation): { success: boolean; reason?: string } => {
  if (!currentLearningSet.value) return { success: false, reason: '无学习集' };

  const currentAnnotations = annotations.value;

  const seenIds = new Set<string>();
  const deduplicatedAnnotations: PDFAnnotation[] = [];
  for (const ann of currentAnnotations) {
    if (!seenIds.has(ann.id)) {
      seenIds.add(ann.id);
      deduplicatedAnnotations.push(ann);
    }
  }

  if (seenIds.has(newAnnotation.id)) {
    return { success: false, reason: '标注 ID 已存在' };
  }

  let isDuplicate = false;
  const now = Date.now();
  const DUPLICATE_TIME_WINDOW = 10000;

  if (newAnnotation.isImage && newAnnotation.imagePath) {
    isDuplicate = deduplicatedAnnotations.some(a =>
      a.isImage && a.imagePath === newAnnotation.imagePath
    );
  } else if (newAnnotation.text) {
    isDuplicate = deduplicatedAnnotations.some(a => {
      if (a.isImage || !a.text) return false;

      if (a.text === newAnnotation.text &&
          a.page === newAnnotation.page &&
          a.pdfPath === newAnnotation.pdfPath) {
        if (a.rect && newAnnotation.rect) {
          const [ax1, ay1, ax2, ay2] = a.rect;
          const [bx1, by1, bx2, by2] = newAnnotation.rect;
          const centerDist = Math.sqrt(Math.pow((ax1 + ax2) / 2 - (bx1 + bx2) / 2, 2) + Math.pow((ay1 + ay2) / 2 - (by1 + by2) / 2, 2));
          if (centerDist < 10) {
            return true;
          }
        }
        if ((now - (a.created || 0)) < DUPLICATE_TIME_WINDOW) {
          return true;
        }
      }
      return false;
    });
  }

  if (isDuplicate) {
    return { success: false, reason: '该标注已存在，请勿重复创建' };
  }

  let newAnnotations: PDFAnnotation[];

  if (cursorAfterId.value === null) {
    newAnnotations = [newAnnotation, ...deduplicatedAnnotations];
  } else {
    const targetIndex = deduplicatedAnnotations.findIndex(a => a.id === cursorAfterId.value);
    if (targetIndex !== -1) {
      newAnnotations = [
        ...deduplicatedAnnotations.slice(0, targetIndex + 1),
        newAnnotation,
        ...deduplicatedAnnotations.slice(targetIndex + 1)
      ];
    } else {
      newAnnotations = [...deduplicatedAnnotations, newAnnotation];
    }
  }

  const finalIds = newAnnotations.map(a => a.id);
  const finalUniqueIds = new Set(finalIds);
  if (finalIds.length !== finalUniqueIds.size) {
    return { success: false, reason: '数据异常，请刷新页面后重试' };
  }

  cursorAfterId.value = newAnnotation.id;
  annotations.value = newAnnotations;

  currentLearningSet.value.annotations = newAnnotations;
  LearningSetService.updateLearningSet(currentLearningSet.value.id, {
    annotations: newAnnotations,
    annotationCount: newAnnotations.length
  });

  return { success: true };
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  const panel = document.getElementById('plugin-pdf-mindmap-panel');
  if (panel) {
    panel.classList.toggle('fullscreen', isFullscreen.value);
  }
};

const toggleView = () => {
  if (viewMode.value === 'split') {
    viewMode.value = 'list';
  } else if (viewMode.value === 'list') {
    viewMode.value = 'mindmap';
  } else {
    viewMode.value = 'split';
  }
};

const toggleMindMapView = () => {
  console.log('[toggleMindMapView] 开始切换，当前 viewMode:', viewMode.value);

  if (!currentLearningSet.value) {
    showMessage('请先选择或创建一个学习集', 'warning');
    showLearningSetManager.value = true;
    return;
  }

  if (!currentPdf.value) {
    showMessage('请先选择一个 PDF 文档', 'warning');
    return;
  }

  // 切换到思维导图模式：主界面直接显示左侧 PDF + 右侧思维导图布局（MarginNote 风格）
  viewMode.value = 'mindmap';

  // 确保 annotations 已加载
  if (annotations.value.length === 0 && currentLearningSet.value) {
    console.log('[toggleMindMapView] 加载 annotations...');
    loadAnnotations();
  }

  console.log('[toggleMindMapView] 切换到思维导图模式，当前 annotations 数量:', annotations.value.length);
};

// 自由画布思维导图状态
const showFreeMindMap = ref(false);
const freeMindMapBlockId = ref<string>('');

// PDF+ 思维导图联动视图状态
const showPdfMindMapLink = ref(false);

// 思维导图模式相关状态
const mindMapBlockId = ref<string>('');
const mindMapAutoSync = ref(true);
const mindMapNodeCount = ref(0);

// 初始化思维导图块 ID
const initMindMapBlockId = async () => {
  if (!currentLearningSet.value?.id) {
    console.warn('[initMindMapBlockId] 当前学习集为空，跳过初始化');
    return;
  }

  // 从学习集配置中获取或创建思维导图块 ID
  const key = `mindmap_block_${currentLearningSet.value.id}`;
  let blockId = localStorage.getItem(key);

  if (!blockId) {
    // 创建新的思维导图块
    try {
      // 尝试获取学习集的文档 ID 作为父块
      const studySetDocId = currentLearningSet.value.siyuanDocId;
      
      const result = await insertBlock({
        dataType: 'paragraph',
        data: `思维导图数据 - ${currentLearningSet.value.name}`,
        parentID: studySetDocId || undefined
      });
      
      if (result?.[0]?.id) {
        blockId = result[0].id;
        localStorage.setItem(key, blockId);
        console.log('[initMindMapBlockId] 创建思维导图块成功:', blockId);
      } else if (result?.doOperations?.[0]?.id) {
        blockId = result.doOperations[0].id;
        localStorage.setItem(key, blockId);
        console.log('[initMindMapBlockId] 创建思维导图块成功:', blockId);
      }
    } catch (error) {
      console.error('[initMindMapBlockId] 创建思维导图块失败:', error);
      // 如果创建失败，使用临时 ID
      blockId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem(key, blockId);
      console.log('[initMindMapBlockId] 使用临时 ID:', blockId);
    }
  }

  if (blockId) {
    mindMapBlockId.value = blockId;
    console.log('[App] mindMapBlockId 已设置:', blockId);
  } else {
    console.warn('[App] 无法获取或创建 mindMapBlockId');
  }
};

// 监听 mindMapBlockId 变化
watch(() => mindMapBlockId.value, (newVal, oldVal) => {
  console.log('[App] mindMapBlockId 变化:', oldVal, '->', newVal);
});

// 监听 currentLearningSet 变化，自动初始化思维导图块 ID
watch(() => currentLearningSet.value?.id, async (newVal, oldVal) => {
  console.log('[App] currentLearningSet 变化:', oldVal, '->', newVal);
  if (newVal && newVal !== oldVal) {
    await initMindMapBlockId();
  }
});

// 思维导图模式相关方法
const toggleMindMapAutoSync = () => {
  mindMapAutoSync.value = !mindMapAutoSync.value;
  localStorage.setItem('mindMapAutoSync', String(mindMapAutoSync.value));
};

const handleMindMapSync = () => {
  console.log('[App] 手动同步思维导图');
};

const confirmMindMapClear = () => {
  if (confirm('确定要清空当前思维导图吗？此操作不可恢复。')) {
    mindMapBlockId.value = '';
    mindMapNodeCount.value = 0;
    // 重新初始化思维导图块 ID
    initMindMapBlockId();
  }
};

// 显示消息提示（在插件容器内显示，不操作宿主 DOM）
const showMessage = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
  // 在插件容器内查找或创建消息容器
  const pluginRoot = document.querySelector('.pdf-mindmap-plugin');
  if (!pluginRoot) {
    console.warn('[showMessage] 插件容器不存在');
    return;
  }

  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `plugin-message plugin-message--${type}`;
  messageEl.textContent = message;

  // 根据类型设置颜色
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    info: { bg: 'rgba(33, 150, 243, 0.15)', color: '#1976d2', border: 'rgba(33, 150, 243, 0.3)' },
    warning: { bg: 'rgba(255, 152, 0, 0.15)', color: '#f57c00', border: 'rgba(255, 152, 0, 0.3)' },
    error: { bg: 'rgba(244, 67, 54, 0.15)', color: '#d32f2f', border: 'rgba(244, 67, 54, 0.3)' },
    success: { bg: 'rgba(76, 175, 80, 0.15)', color: '#388e3c', border: 'rgba(76, 175, 80, 0.3)' }
  };

  const colorStyle = colors[type] || colors.info;
  messageEl.style.cssText = `
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    z-index: 100;
    max-width: 300px;
    text-align: center;
    background: ${colorStyle.bg};
    color: ${colorStyle.color};
    border: 1px solid ${colorStyle.border};
    animation: slideDown 0.3s ease;
  `;

  pluginRoot.appendChild(messageEl);

  // 3秒后自动消失
  setTimeout(() => {
    messageEl.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
      messageEl.remove();
    }, 300);
  }, 3000);
};

const handleClose = () => {
  saveCurrentState();
  (props.plugin as any).closePanel();
};

const handleTextSelected = (data: { text: string; page: number; rect: [number, number, number, number] | null }) => {
  selectedText.value = data.text;
  selectedPage.value = data.page;
  selectedRect.value = data.rect;
};

let imageSelectLock = false;

const handleImageSelected = async (data: {
  canvasRect: { x: number; y: number; width: number; height: number };
  pdfRect: [number, number, number, number];
  page: number
}) => {
  if (!currentLearningSet.value || !currentPdf.value) return;

  if (imageSelectLock) {
    return;
  }

  if (currentLevel.value !== 'text') {
    const savedLevel = currentLevel.value;
    alert(`已选择"${getLevelLabel(savedLevel)}"，请使用文字模式选择文本内容。`);
    extractMode.value = 'text';
    pendingTitleLevel.value = savedLevel;
    return;
  }

  imageSelectLock = true;
  creatingAnnotation.value = true;

  try {
    if (data.canvasRect.width < 5 || data.canvasRect.height < 5) {
      throw new Error('选择区域太小，请重新选择');
    }

    const pdfViewerEl = document.querySelector('.pdf-viewer-container') as HTMLElement;
    const canvas = pdfViewerEl?.querySelector('.pdf-canvas') as HTMLCanvasElement;

    if (!canvas) {
      throw new Error('找不到 PDF 画布，请等待 PDF 加载完成');
    }

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('PDF 画布未准备好，请稍后重试');
    }

    const scaleX = canvas.width / canvas.offsetWidth;
    const scaleY = canvas.height / canvas.offsetHeight;

    let cropX = Math.max(0, Math.round(data.canvasRect.x * scaleX));
    let cropY = Math.max(0, Math.round(data.canvasRect.y * scaleY));
    let cropWidth = Math.max(1, Math.round(data.canvasRect.width * scaleX));
    let cropHeight = Math.max(1, Math.round(data.canvasRect.height * scaleY));

    if (cropX + cropWidth > canvas.width) {
      cropWidth = canvas.width - cropX;
    }
    if (cropY + cropHeight > canvas.height) {
      cropHeight = canvas.height - cropY;
    }

    if (cropWidth < 1 || cropHeight < 1) {
      throw new Error('裁剪区域无效，请重新选择');
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }

    ctx.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0, 0,
      cropWidth,
      cropHeight
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob(b => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('无法创建图片，可能是画布内容为空'));
        }
      }, 'image/png', 0.92);
    });

    if (blob.size < 100) {
      throw new Error('生成的图片太小，可能选择区域无效');
    }

    const fileName = `pdf-excerpt-${Date.now()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    const uploadResult = await uploadFileToAssets(file);

    if (!uploadResult || !uploadResult.path) {
      throw new Error('图片上传失败');
    }

    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      blockId: '',
      pdfPath: currentPdf.value.path,
      pdfName: currentPdf.value.name,
      page: data.page,
      rect: data.pdfRect,
      text: '',
      note: '',
      color: 'yellow',
      level: 'text',
      isImage: true,
      imagePath: uploadResult.path,
      created: Date.now(),
      updated: Date.now()
    };

    // 如果没有选择目标文档，使用学习集的思源文档ID
    const docId = targetDoc.value?.id || currentLearningSet.value.siyuanDocId;
    if (!docId) {
      alert('请先选择一个目标文档，或在工具栏中输入文档名称搜索');
      creatingAnnotation.value = false;
      return;
    }

    const result = await LearningSetService.saveAnnotationToLearningSet(currentLearningSet.value, newAnnotation, docId);
    if (result.blockId) {
      newAnnotation.blockId = result.blockId;
    } else if (result.error) {
      alert(result.error);
      creatingAnnotation.value = false;
      return;
    }

    const insertResult = insertAnnotationAtPosition(newAnnotation);
    if (!insertResult.success) {
      if (insertResult.reason) {
        alert(insertResult.reason);
      }
      return;
    }

  } catch (error: any) {
    console.error('创建图片摘录失败:', error);
    alert(`创建失败：${error.message || '未知错误'}`);
  } finally {
    creatingAnnotation.value = false;
    imageSelectLock = false;
  }
};

const getCreateAnnotationLock = () => {
  if (typeof window === 'undefined') return { locked: false, text: '', level: '', time: 0 };
  (window as any).__PDF_CREATE_ANNOTATION_LOCK__ ||= { locked: false, text: '', level: '', time: 0 };
  return (window as any).__PDF_CREATE_ANNOTATION_LOCK__;
};
const CREATE_LOCK_DURATION = 3000;

const createAnnotationFromSelection = async () => {
  if (!selectedText.value || !currentLearningSet.value || !currentPdf.value) return;

  const lock = getCreateAnnotationLock();
  const annotationLevel = pendingTitleLevel.value || currentLevel.value;
  const now = Date.now();

  if (lock.locked) {
    return;
  }

  if (selectedText.value === lock.text &&
      annotationLevel === lock.level &&
      (now - lock.time) < CREATE_LOCK_DURATION) {
    return;
  }

  if (creatingAnnotation.value) {
    return;
  }

  lock.locked = true;
  lock.text = selectedText.value;
  lock.level = annotationLevel;
  lock.time = now;
  creatingAnnotation.value = true;

  try {
    const rect = selectedRect.value || [0, 0, 100, 20];

    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      blockId: '',
      pdfPath: currentPdf.value.path,
      pdfName: currentPdf.value.name,
      page: selectedPage.value,
      rect,
      text: selectedText.value,
      note: '',
      color: 'yellow',
      level: annotationLevel,
      created: Date.now(),
      updated: Date.now()
    };

    // 如果没有选择目标文档，使用学习集的思源文档ID
    const docId = targetDoc.value?.id || currentLearningSet.value.siyuanDocId;
    if (!docId) {
      alert('请先选择一个目标文档，或在工具栏中输入文档名称搜索');
      lock.locked = false;
      creatingAnnotation.value = false;
      return;
    }

    const result = await LearningSetService.saveAnnotationToLearningSet(currentLearningSet.value, newAnnotation, docId);
    if (result.blockId) {
      newAnnotation.blockId = result.blockId;
    } else if (result.error) {
      alert(result.error);
      lock.locked = false;
      creatingAnnotation.value = false;
      return;
    }

    const insertResult = insertAnnotationAtPosition(newAnnotation);
    if (!insertResult.success) {
      if (insertResult.reason) {
        alert(insertResult.reason);
      }
      lock.locked = false;
      creatingAnnotation.value = false;
      return;
    }

    // 触发标注创建事件，通知思维导图侧边栏
    window.dispatchEvent(new CustomEvent('annotation-created', {
      detail: { annotation: newAnnotation }
    }));

    selectedText.value = '';
    selectedRect.value = null;
    window.getSelection()?.removeAllRanges();

    if (pendingTitleLevel.value) {
      pendingTitleLevel.value = null;
      extractMode.value = 'image';
    }

  } catch (error: any) {
    console.error('创建标注失败:', error);
    alert(`创建失败：${error.message || '未知错误'}`);
    const lock = getCreateAnnotationLock();
    lock.text = '';
    lock.level = '';
  } finally {
    creatingAnnotation.value = false;
    setTimeout(() => {
      const lock = getCreateAnnotationLock();
      lock.locked = false;
    }, 500);
  }
};

const cancelSelection = () => {
  selectedText.value = '';
  selectedRect.value = null;
  window.getSelection()?.removeAllRanges();

  if (pendingTitleLevel.value) {
    pendingTitleLevel.value = null;
    extractMode.value = 'image';
  }
};

watch(currentPage, () => {
  if (currentLearningSet.value && currentPdf.value) {
    LearningSetService.updateLearningSetPdf(currentLearningSet.value.id, currentPdf.value.id, { currentPage: currentPage.value });
  }
});

let docIdUpdateTimer: ReturnType<typeof setInterval> | null = null;

const loadStudySetsList = async () => {
  try {
    studySetsList.value = [];
  } catch (error) {
    console.error('加载学习集列表失败:', error);
  }
};

const loadWorkspacePdfs = async () => {
  workspacePdfs.value = await LearningSetService.getAvailablePdfs();
};

const showQuickCapture = (event?: MouseEvent) => {
  if (!selectedText.value) return;

  if (event) {
    quickCaptureMenuPosition.value = { x: event.clientX, y: event.clientY };
  } else {
    quickCaptureMenuPosition.value = {
      x: window.innerWidth / 2 - 160,
      y: window.innerHeight / 2 - 140
    };
  }

  quickCaptureSourceLocation.value = {
    pdfPath: currentPdf.value?.path,
    page: selectedPage.value,
    rect: selectedRect.value || undefined
  };

  showQuickCaptureMenu.value = true;
};

const handleQuickCapture = (card: any) => {
  console.log('快速捕获创建卡片:', card);
  selectedText.value = '';
  selectedRect.value = null;
  loadAnnotations();
};

const handleQuickCaptureClosed = () => {
  quickCaptureSourceLocation.value = null;
};

const handleOpenCardEditor = (data: { text: string; sourceLocation: any }) => {
  cardEditorPendingData.value = data;
  editingCard.value = {
    id: '',
    content: data.text,
    type: 'card',
    status: 'new',
    tags: [],
    difficulty: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sourceLocation: data.sourceLocation || {},
  };
  showCardEditorDialog.value = true;
};

const handleCardEditorSaved = (card: any) => {
  console.log('卡片编辑器保存:', card);
  loadAnnotations();
  cardEditorPendingData.value = null;
};

const handleCardEditorDeleted = (card: any) => {
  console.log('卡片编辑器删除:', card);
  loadAnnotations();
  cardEditorPendingData.value = null;
};

const handleCardEditorClosed = () => {
  editingCard.value = null;
  cardEditorPendingData.value = null;
};

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (event.altKey && event.key === 'c' && selectedText.value) {
    event.preventDefault();
    showQuickCapture();
  }
};

onMounted(async () => {
  await loadLearningSets();
  await loadWorkspacePdfs();
  updateCachedDocId();
  docIdUpdateTimer = setInterval(() => {
    updateCachedDocId();
  }, 3000);
  loadDocOptions();
  loadStudySetsList();

  // 初始化思维导图块 ID
  console.log('[App] onMounted 调用 initMindMapBlockId, currentLearningSet:', currentLearningSet.value?.id);
  await initMindMapBlockId();
  console.log('[App] onMounted initMindMapBlockId 完成, mindMapBlockId:', mindMapBlockId.value);

  document.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  saveCurrentState();
  if (docIdUpdateTimer) {
    clearInterval(docIdUpdateTimer);
  }
  document.removeEventListener('keydown', handleGlobalKeyDown);
});

const startReview = () => {
  showReviewSession.value = true;
  console.log('开始复习');
};

const handleLearningSetSelected = async (studySet: any) => {
  currentLearningSet.value = studySet;
  console.log('选择学习集:', studySet);

  // 重新初始化思维导图块 ID
  await initMindMapBlockId();
};

const handlePdfOpenRequest = (pdfPath: string) => {
  console.log('打开 PDF:', pdfPath);
};

const handleAnnotationFocusRequest = (annotationId: string) => {
  console.log('聚焦标注:', annotationId);
};

const handlePageJumpRequest = (_pdfPath: string, page: number) => {
  console.log('跳转到页码:', page);
  currentPage.value = page;
};

const handleSmartSetSave = (rules: any[]) => {
  console.log('保存智能学习集规则:', rules);
  showSmartStudySet.value = false;
};

const handleSmartSetAddToSet = (rules: any[], studySetId: string) => {
  console.log('添加到学习集:', rules, studySetId);
  showSmartStudySet.value = false;
};

const handleSettingsSave = (settings: any) => {
  console.log('保存设置:', settings);
};

const handleDataExport = () => {
  console.log('导出数据');
};

const handleDataImport = (data: any) => {
  console.log('导入数据:', data);
};

const handleClearCache = () => {
  console.log('清除缓存');
};

const handleSearchResultSelect = (result: any) => {
  console.log('选择搜索结果:', result);
};

const handleSearchNavigate = (_page: number, cardId: string) => {
  console.log('导航到卡片:', cardId);
};

const handleContextResultSelect = (result: { url: string; title: string }) => {
  console.log('选择搜索结果:', result.title);
  window.open(result.url, '_blank');
};

const handleKeywordSelect = (keyword: any) => {
  console.log('选择关键词:', keyword.name);
};

const handleMemorySelect = (memory: any) => {
  console.log('选择场景:', memory.title);
};

const handleMemoryReplay = async (memory: any) => {
  console.log('回放场景:', memory);
  if (memory.context?.page) {
    currentPage.value = memory.context.page;
  }
};

const handleCardNavigate = (card: { id: string }) => {
  console.log('导航到卡片:', card.id);
};

// 思维导图相关方法
const handleMindMapNodeClick = (node: any) => {
  console.log('思维导图节点点击:', node);
  if (node.annotationId) {
    const annotation = annotations.value.find(a => a.id === node.annotationId);
    if (annotation) {
      handleAnnotationClick(annotation);
    }
  }
};

// 重命名 resize 方法以匹配模板中的事件处理
const handleResizeStart = (_e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeStop);
  document.body.style.cursor = 'col-resize';
};

const handleResizeMove = (_e: MouseEvent) => {
  if (!isResizing.value) return;
  const container = document.querySelector('.panel-body') as HTMLElement;
  if (!container) return;
  const newWidth = container.getBoundingClientRect().right - _e.clientX;
  if (newWidth >= 280 && newWidth <= 600) {
    if (viewMode.value === 'mindmap') {
      mindmapWidth.value = newWidth;
    } else {
      annotationWidth.value = newWidth;
    }
  }
};

const handleResizeStop = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeStop);
  document.body.style.cursor = '';
};
</script>

<style scoped lang="scss">
@import './styles/variables.scss';

// CSS 隔离：所有样式嵌套在唯一根类名下，防止污染思源主界面
.pdf-mindmap-plugin {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 14px;
  position: relative;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    height: 48px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-border-color);
    flex-shrink: 0;
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    &.active {
      background: var(--b3-theme-primary-light);
      color: var(--b3-theme-primary);
    }

    &.icon-btn {
      padding: 8px;
    }

    &.close-btn:hover {
      background: var(--b3-theme-error-light);
      color: var(--b3-theme-error);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .header-divider {
    width: 1px;
    height: 20px;
    background: var(--b3-border-color);
    margin: 0 4px;
  }

  .header-title {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;

    .title-main {
      font-weight: 600;
      font-size: 14px;
      color: var(--b3-theme-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .title-sub {
      font-size: 11px;
      color: var(--b3-theme-on-surface-light);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
  }

  .toolbar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-border-color);
    gap: 12px;
    flex-shrink: 0;
    height: 44px;

    .toolbar-left,
    .toolbar-center,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-left {
      flex-shrink: 0;
    }

    .toolbar-center {
      flex: 1;
      justify-content: center;
    }

    .toolbar-right {
      flex-shrink: 0;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: var(--b3-border-color);
      flex-shrink: 0;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border: 1px solid var(--b3-border-color);
      border-radius: 4px;
      background: var(--b3-theme-background);
      color: var(--b3-theme-on-surface);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;

      &:hover {
        background: var(--b3-theme-primary-light);
        border-color: var(--b3-theme-primary);
        color: var(--b3-theme-primary);
      }
    }

    .pdf-select,
    .level-select {
      padding: 5px 8px;
      border: 1px solid var(--b3-border-color);
      border-radius: 4px;
      background: var(--b3-theme-background);
      color: var(--b3-theme-on-background);
      font-size: 12px;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
      }
    }

    .pdf-select {
      min-width: 140px;
      max-width: 200px;
    }

    .level-select {
      min-width: 90px;
    }

    .mode-group {
      display: flex;
      border: 1px solid var(--b3-border-color);
      border-radius: 4px;
      overflow: hidden;

      .mode-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 12px;
        border: none;
        background: var(--b3-theme-background);
        color: var(--b3-theme-on-surface-light);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s;

        &:not(:last-child) {
          border-right: 1px solid var(--b3-border-color);
        }

        &:hover {
          background: var(--b3-theme-surface-light);
          color: var(--b3-theme-on-surface);
        }

        &.active {
          background: var(--b3-theme-primary);
          color: white;
        }
      }
    }
  }

  .doc-selector {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    background: var(--b3-theme-background);
    position: relative;

    .doc-icon {
      color: var(--b3-theme-on-surface-light);
      flex-shrink: 0;
    }

    .doc-input {
      border: none;
      background: transparent;
      color: var(--b3-theme-on-background);
      font-size: 12px;
      padding: 5px 2px;
      width: 100px;

      &:focus {
        outline: none;
      }

      &::placeholder {
        color: var(--b3-theme-on-surface-light);
      }
    }

    .doc-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border: none;
      background: transparent;
      color: var(--b3-theme-on-surface-light);
      cursor: pointer;
      border-radius: 2px;

      &:hover {
        background: var(--b3-theme-error-light);
        color: var(--b3-theme-error);
      }
    }
  }

  .dialog-overlay,
  .side-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .side-panel-content {
    background: var(--b3-theme-surface);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    width: 400px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
  }

  // 自由画布思维导图样式
  .free-mindmap-overlay {
    .free-mindmap-panel {
      width: 90vw;
      height: 85vh;
      max-width: 1600px;
      max-height: 900px;
      background: var(--b3-theme-surface);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .free-mindmap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--b3-theme-background);
        border-bottom: 1px solid var(--b3-border-color);
        flex-shrink: 0;

        .free-mindmap-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--b3-theme-on-surface);
        }

        .free-mindmap-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--b3-theme-on-surface);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;

          &:hover {
            background: var(--b3-theme-error-light);
            color: var(--b3-theme-error);
          }
        }
      }

      .free-mindmap-content {
        flex: 1;
        overflow: hidden;
        background: var(--b3-theme-background);
      }
    }
  }

  // PDF+ 思维导图联动视图样式
  .pdf-mindmap-link-overlay {
    .pdf-mindmap-link-panel {
      width: 95vw;
      height: 90vh;
      max-width: 1800px;
      max-height: 950px;
      background: var(--b3-theme-surface);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .link-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--b3-theme-background);
        border-bottom: 1px solid var(--b3-border-color);
        flex-shrink: 0;

        .link-panel-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--b3-theme-on-surface);
        }

        .link-panel-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--b3-theme-on-surface);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;

          &:hover {
            background: var(--b3-theme-error-light);
            color: var(--b3-theme-error);
          }
        }
      }

      .link-panel-content {
        flex: 1;
        overflow: hidden;
        background: var(--b3-theme-background);
      }
    }
  }

  .dialog-panel {
    background: var(--b3-theme-surface);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    width: 480px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--b3-border-color);
      font-weight: 600;
      font-size: 15px;
      background: var(--b3-theme-background);
    }

    .dialog-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        color: var(--b3-theme-on-surface);
        font-weight: 500;
      }
    }

    .b3-text-field {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--b3-border-color);
      border-radius: 6px;
      background: var(--b3-theme-background);
      color: var(--b3-theme-on-background);
      font-size: 14px;
      transition: border-color 0.15s;

      &:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-lightest);
      }
    }

    .pdf-select-workspace {
      margin-top: 8px;
      width: 100%;
    }

    .pdf-add-options {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .pdf-hint {
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
      }
    }

    .dialog-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--b3-border-color);
      display: flex;
      justify-content: center;
      gap: 8px;
      background: var(--b3-theme-background);
    }
  }

  .panel-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;

    &.split {
      flex-direction: row;
    }

    &.list {
      flex-direction: column;
    }

    &.mindmap {
      flex-direction: row;
    }
  }

  .pdf-area {
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: var(--b3-theme-background);
    display: flex;
    flex-direction: column;
  }

  .panel-body.list .pdf-area {
    display: none;
  }

  .resize-handle {
    width: 4px;
    cursor: col-resize;
    background: transparent;
    position: relative;
    flex-shrink: 0;
    z-index: 10;
    transition: background 0.15s;

    &:hover,
    &:active {
      background: var(--b3-theme-primary);
    }

    .resize-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--b3-border-color);
    }
  }

  .welcome-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;

    .welcome-content {
      text-align: center;
      max-width: 400px;

      .welcome-icon {
        font-size: 56px;
        margin-bottom: 16px;
        opacity: 0.8;
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
      }

      p {
        color: var(--b3-theme-on-surface-light);
        margin: 0 0 24px 0;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .recent-sets {
      margin-top: 32px;
      text-align: left;

      p {
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
        margin-bottom: 8px;
        font-weight: 500;
      }

      .recent-set-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        margin: 4px 0;
        background: var(--b3-theme-surface);
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s;
        border: 1px solid transparent;

        &:hover {
          background: var(--b3-theme-primary-lightest);
          border-color: var(--b3-theme-primary-light);
        }

        .set-icon {
          font-size: 16px;
        }

        .set-title {
          flex: 1;
          font-weight: 500;
        }

        .set-pdf-count {
          font-size: 11px;
          color: var(--b3-theme-on-surface-light);
          padding: 2px 6px;
          background: var(--b3-theme-surface-light);
          border-radius: 3px;
        }
      }
    }
  }

  .annotation-area {
    flex-shrink: 0;
    min-width: 280px;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface);
    min-height: 0;
    height: 100%;

    .annotation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--b3-border-color);
      font-size: 13px;
      font-weight: 500;
      background: var(--b3-theme-background);

      .annotation-count {
        font-size: 11px;
        color: var(--b3-theme-on-surface-light);
        font-weight: 400;
        padding: 2px 8px;
        background: var(--b3-theme-surface-light);
        border-radius: 10px;
      }
    }
  }

  .panel-body.list .annotation-area {
    width: 100% !important;
    flex: 1;
    max-width: none;
    border-left: none;
  }

  // 标注列表区域（现在用于显示思维导图）
  .annotation-area.mindmap-sidebar-area {
    padding: 0;
    overflow: hidden;

    .mindmap-sidebar-compact {
      height: 100%;
    }
  }

  // 思维导图区域样式
  .mindmap-area {
    flex-shrink: 0;
    min-width: 280px;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface);
    min-height: 0;
  }

  // 思维导图简洁视图样式
  .mindmap-sidebar-compact {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--b3-theme-background);
  }

  .mindmap-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-border-color);
    flex-shrink: 0;
  }

  .mindmap-sidebar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
  }

  .mindmap-header-actions {
    display: flex;
    gap: 4px;
  }

  .mindmap-sidebar-body {
    flex: 1;
    overflow: hidden;
    background: var(--b3-theme-background);
    min-height: 200px;
    position: relative;

    > * {
      height: 100%;
    }

    .mindmap-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--b3-theme-on-surface-light);

      .loading-icon {
        font-size: 32px;
        animation: spin 1s linear infinite;
      }

      .loading-text {
        font-size: 13px;
      }
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .mindmap-sidebar-footer {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: var(--b3-theme-surface);
    border-top: 1px solid var(--b3-border-color);
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 40px 20px;
    text-align: center;

    p {
      color: var(--b3-theme-on-surface-light);
      margin-bottom: 16px;
      font-size: 14px;
    }
  }

  .selection-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    max-width: 90vw;

    .selected-text {
      font-size: 13px;
      color: var(--b3-theme-on-surface);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .level-hint {
      font-size: 12px;
      color: var(--b3-theme-primary);
      font-weight: 600;
      padding: 2px 8px;
      background: var(--b3-theme-primary-lightest);
      border-radius: 4px;
    }
  }

  .b3-button--small {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 6px;
  }

  :deep(.b3-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  :deep(.b3-button--primary) {
    background: var(--b3-theme-primary);
    color: white;
    border: none;

    &:hover {
      background: var(--b3-theme-primary-dark);
    }
  }

  :deep(.b3-button--outline) {
    background: transparent;
    border: 1px solid var(--b3-border-color);
    color: var(--b3-theme-on-surface);

    &:hover {
      background: var(--b3-theme-surface-light);
      border-color: var(--b3-theme-primary);
    }
  }

  .context-btn.active {
    background: rgba(66, 165, 245, 0.15);
    color: #42a5f5;
  }

  .keyword-btn.active {
    background: rgba(255, 152, 0, 0.15);
    color: #ff9800;
  }

  .memory-btn.active {
    background: rgba(171, 71, 188, 0.15);
    color: #ab47bc;
  }

  .header-btn {
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: currentColor;
      opacity: 0;
      transform: translate(-50%, -50%);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
    }

    &:hover::before {
      width: 180px;
      height: 180px;
      opacity: 0.08;
    }

    .btn-text {
      position: relative;
      z-index: 1;
    }
  }

  .learning-set-btn.active {
    background: rgba(6, 182, 212, 0.12);
    color: #06b6d4;

    svg {
      filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.4));
    }
  }

  .card-box-btn.active {
    background: rgba(244, 114, 182, 0.12);
    color: #f472b6;

    svg {
      filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.4));
    }
  }

  .review-btn.active {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;

    svg {
      filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4));
    }
  }

  .smart-btn.active {
    background: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;

    svg {
      filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.4));
    }
  }

  .settings-btn.active {
    background: rgba(107, 114, 128, 0.12);
    color: #6b7280;

    svg {
      filter: drop-shadow(0 2px 4px rgba(107, 114, 128, 0.4));
    }
  }

  .mindmap-btn.active {
    background: rgba(236, 72, 153, 0.12);
    color: #ec4899;

    svg {
      filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.4));
    }
  }

  .header-review-count {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
    border-radius: 20px;
    border: 1px solid rgba(16, 185, 129, 0.3);

    .review-count-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      animation: pulse-success 2s infinite;
    }

    .review-count-text {
      font-size: 13px;
      font-weight: 600;
      color: #10b981;
    }
  }

  @keyframes pulse-success {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  // 消息提示动画
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }

  * {
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 3px;

      &:hover {
        background: rgba(156, 163, 175, 0.6);
      }
    }
  }
}
</style>
