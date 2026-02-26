<!-- src/App.vue -->
<template>
  <div class="pdf-mindmap-container">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-left">
        <button
          @click="showProjectManager = !showProjectManager"
          class="header-btn project-btn"
          :class="{ active: showProjectManager }"
          title="项目管理"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
          </svg>
          <span class="btn-text">项目</span>
        </button>
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
        <!-- MarginNote 4 风格功能按钮 -->
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
        <!-- 第五阶段高级功能按钮 -->
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
          <span class="title-main">{{ currentProject?.name || 'MarginNote 学习' }}</span>
          <span v-if="currentPdf" class="title-sub">{{ currentPdf.name }}</span>
          <span v-if="currentStudySet" class="title-set">📖 {{ currentStudySet.name }}</span>
        </div>
      </div>
      <div class="header-right">
        <!-- 复习统计 -->
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

    <!-- 项目管理面板 -->
    <div v-if="showProjectManager" class="project-manager-overlay" @click.self="showProjectManager = false">
      <div class="project-manager-panel">
        <div class="panel-title">
          <span>📚 项目管理</span>
          <button @click="showProjectManager = false" class="b3-button b3-button--outline b3-button--small">✕</button>
        </div>
        <div class="project-list">
          <div v-if="projects.length === 0" class="no-projects">
            <p>暂无项目，请导入 PDF 文件创建新项目</p>
          </div>
          <div
            v-for="proj in projects"
            :key="proj.id"
            class="project-item"
            :class="{ active: currentProject?.id === proj.id }"
          >
            <div class="project-info" @click="switchProject(proj.id)">
              <div class="project-name">{{ proj.name }}</div>
              <div class="project-meta">
                <span>📚 {{ proj.pdfCount }}本 PDF</span>
                <span>📝 {{ proj.annotationCount }}条标注</span>
                <span>{{ formatDate(proj.updated) }}</span>
              </div>
              <!-- PDF 列表 -->
              <div v-if="proj.pdfNames.length > 0" class="project-pdfs">
                <div v-for="(name, idx) in proj.pdfNames" :key="idx" class="pdf-tag">
                  📄 {{ name }}
                </div>
              </div>
            </div>
            <div class="project-actions">
              <button
                @click.stop="addPdfToProjectDialog(proj.id)"
                class="b3-button b3-button--outline b3-button--small"
                title="添加 PDF"
              >
                +PDF
              </button>
              <button
                @click.stop="deleteProjectConfirm(proj)"
                class="b3-button b3-button--outline b3-button--small delete-btn"
                title="删除项目"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button @click="showNewProjectDialog" class="b3-button b3-button--primary">
            + 新建项目
          </button>
        </div>
      </div>
    </div>

    <!-- 新建项目对话框 -->
    <div v-if="newProjectDialog.visible" class="dialog-overlay" @click.self="newProjectDialog.visible = false">
      <div class="dialog-panel">
        <div class="dialog-header">新建项目</div>
        <div class="dialog-body">
          <div class="form-group">
            <label>项目名称：</label>
            <input
              v-model="newProjectDialog.name"
              type="text"
              class="b3-text-field"
              placeholder="例如：MySQL 学习笔记"
            />
          </div>
          <div class="form-group">
            <label>导入第一个 PDF：</label>
            <button @click="selectPdfForNewProject" class="b3-button b3-button--outline">
              {{ newProjectDialog.pdfName || '选择 PDF 文件' }}
            </button>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="newProjectDialog.visible = false" class="b3-button b3-button--outline">取消</button>
          <button
            @click="createNewProject"
            class="b3-button b3-button--primary"
            :disabled="!newProjectDialog.name || !newProjectDialog.pdfPath"
          >
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar" v-if="currentProject">
      <!-- 左侧：PDF 切换 + 添加 PDF -->
      <div class="toolbar-left">
        <select
          v-if="currentProject.pdfs.length > 1"
          v-model="currentPdfId"
          class="pdf-select"
          @change="onPdfSwitch"
        >
          <option v-for="pdf in currentProject.pdfs" :key="pdf.id" :value="pdf.id">
            {{ pdf.name }}
          </option>
        </select>
        <button
          @click="triggerAddPdf"
          class="toolbar-btn"
          title="添加 PDF 到当前项目"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>PDF</span>
        </button>
      </div>

      <!-- 中间：标注级别 + 摘录模式 -->
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

      <!-- 右侧：目标文档 + 页码 -->
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
      <!-- PDF 预览区 -->
      <div class="pdf-area" v-if="currentPdf" :style="{ width: `calc(100% - ${annotationWidth}px)` }">
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

      <!-- 欢迎页 -->
      <div v-else class="welcome-area">
        <div class="welcome-content">
          <div class="welcome-icon">📄</div>
          <h2>欢迎使用 PDF 思维导图摘录</h2>
          <p>创建项目，导入多本 PDF，统一管理标注</p>
          <button @click="showNewProjectDialog" class="b3-button b3-button--primary">
            创建新项目
          </button>
          <!-- 显示最近的项目 -->
          <div v-if="projects.length > 0" class="recent-pdfs">
            <p>最近的项目:</p>
            <div
              v-for="proj in projects.slice(0, 5)"
              :key="proj.id"
              class="recent-pdf-item"
              @click="switchProject(proj.id)"
            >
              <span class="project-icon">📚</span>
              <span class="project-title">{{ proj.name }}</span>
              <span class="project-pdf-count">{{ proj.pdfCount }}本</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 可拖拽分隔条 -->
      <div
        v-if="currentPdf && viewMode === 'split'"
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-line"></div>
      </div>

      <!-- 标注列表区 -->
      <div v-if="currentProject && viewMode !== 'mindmap'" class="annotation-area" :style="{ width: `${annotationWidth}px` }">
        <div class="annotation-header">
          <span>📝 标注列表</span>
          <span class="annotation-count">{{ annotations.length }}条</span>
        </div>
        <AnnotationList
          :annotations="annotations"
          :loading="loadingAnnotations"
          :cursor-after-id="cursorAfterId"
          @annotation-click="handleAnnotationClick"
          @annotation-edit="handleAnnotationEdit"
          @annotation-delete="handleAnnotationDelete"
          @refresh="loadAnnotations"
          @merge="handleAnnotationMerge"
          @unmerge="handleAnnotationUnmerge"
          @cursor-change="handleCursorChange"
        />
      </div>

      <!-- 思维导图区 -->
      <div v-if="currentProject && viewMode === 'mindmap'" class="annotation-area" :style="{ width: `${annotationWidth}px` }">
        <div class="annotation-header">
          <span>🧠 思维导图</span>
          <span class="annotation-count">{{ annotations.length }}条</span>
        </div>
        <MindMapViewer
          :annotations="annotations"
          :loading="loadingAnnotations"
          @annotation-click="handleAnnotationClick"
        />
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

    <!-- 学习集管理器 -->
    <LearningSetManager
      v-if="showLearningSetManager"
      :current-pdf-path="currentPdf?.path || ''"
      @set-selected="handleLearningSetSelected"
      @pdf-open-request="handlePdfOpenRequest"
      @annotation-focus-request="handleAnnotationFocusRequest"
      @page-jump-request="handlePageJumpRequest"
    />

    <!-- 智能学习集 -->
    <div v-if="showSmartStudySet" class="side-panel-overlay" @click.self="showSmartStudySet = false">
      <div class="side-panel-content">
        <SmartStudySet
          :cards="allCards"
          :study-set-id="currentStudySet?.id"
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
    <!-- 上下文视图 -->
    <div v-if="showContextView" class="side-panel-overlay" @click.self="showContextView = false">
      <div class="side-panel-content">
        <ContextView
          :selected-text="selectedText"
          @result-select="handleContextResultSelect"
        />
      </div>
    </div>

    <!-- 关键词库 -->
    <div v-if="showKeywordLibrary" class="side-panel-overlay" @click.self="showKeywordLibrary = false">
      <div class="side-panel-content">
        <KeywordLibrary
          :cards="allCards"
          @keyword-select="handleKeywordSelect"
          @note-click="handleCardNavigate"
        />
      </div>
    </div>

    <!-- 场景记忆 -->
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

    <!-- 搜索面板 -->
    <SearchPanel
      :cards="allCards"
      :study-set-id="currentStudySet?.id"
      @result-select="handleSearchResultSelect"
      @navigate-to="handleSearchNavigate"
    />

    <!-- 快速捕获菜单 -->
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

    <!-- 卡片编辑浮层 -->
    <CardEditorDialog
      :model-value="editingCard"
      :visible="showCardEditorDialog"
      :study-sets="studySetsList"
      @update:visible="showCardEditorDialog = $event"
      @saved="handleCardEditorSaved"
      @deleted="handleCardEditorDeleted"
      @closed="handleCardEditorClosed"
    />

    <!-- 隐藏的文件选择框 -->
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import type { Plugin } from 'siyuan';
import PDFViewer from './components/PDFViewer.vue';
import AnnotationList from './components/AnnotationList.vue';
import AnnotationEditor from './components/AnnotationEditor.vue';
import MindMapViewer from './components/MindMapViewer.vue';
import LearningSetManager from './components/LearningSetManager.vue';
import CardBoxBoard from './components/CardBoxBoard.vue';
import ReviewSession from './components/ReviewSession.vue';
import CardEditorDialog from './components/CardEditorDialog.vue';
import QuickCaptureMenu from './components/QuickCaptureMenu.vue';
// 第五阶段高级功能组件
import ContextView from './components/ContextView.vue';
import KeywordLibrary from './components/KeywordLibrary.vue';
import MemoryContext from './components/MemoryContext.vue';
import { cardService } from './services/cardService';
import { reviewService } from './services/reviewService';
import { studySetService } from './services/studySetService';
import type { Card, FlashCard, StudySet } from './types/card';
import type { ReviewQueueItem, ReviewSession as ReviewSessionType } from './types/review';
import { uploadFileToAssets, updateCachedDocId, searchSiyuanDocs } from './api/siyuanApi';
import { deleteAnnotation as deleteAnnotationApi } from './api/annotationApi';
import {
  createProject,
  addPdfToProject,
  getAllProjects,
  getCurrentProject,
  getCurrentPdf,
  switchProject as switchProjectApi,
  switchProjectPdf,
  updateProject,
  updateProjectPdf,
  deleteProject as deleteProjectApi,
  getProjectAnnotations,
  saveProjectAnnotations,
  saveAnnotationToProject,
  initProjectStorage,
  getProjectAnnotationsAsync
} from './api/projectApi';
import type { PDFAnnotation, AnnotationLevel, ExtractMode } from './types/annotaion';
import { ANNOTATION_LEVELS } from './types/annotaion';
import type { PDFProject, ProjectListItem } from './types/project';

const props = defineProps<{ plugin: Plugin }>();

// 项目管理状态
const projects = ref<ProjectListItem[]>([]);
const currentProject = ref<PDFProject | null>(null);
const currentPdfId = ref<string | null>(null);
const showProjectManager = ref(false);

// 学习集管理状态
const showLearningSetManager = ref(false);

// MarginNote 4 风格功能状态
const showCardBox = ref(false);
const showReviewSession = ref(false);
const showSmartStudySet = ref(false);
const showSettings = ref(false);
// 第五阶段高级功能状态
const showContextView = ref(false);
const showKeywordLibrary = ref(false);
const showMemoryContext = ref(false);
const currentStudySet = ref<any>(null);
const todayReviewCount = ref(0);

// 快速捕获菜单状态
const showQuickCaptureMenu = ref(false);
const quickCaptureMenuPosition = ref({ x: 0, y: 0 });
const quickCaptureSourceLocation = ref<any>(null);

// 卡片编辑浮层状态
const showCardEditorDialog = ref(false);
const editingCard = ref<any>(null);
const cardEditorPendingData = ref<any>(null);

// 学习集列表（用于快速捕获菜单）
const studySetsList = ref<any[]>([]);

// 新建项目对话框
const newProjectDialog = ref({
  visible: false,
  name: '',
  pdfPath: '',
  pdfName: ''
});

// 文件选择模式
let fileSelectMode: 'newProject' | 'addPdf' | 'none' = 'none';
let addTargetProjectId: string | null = null;

// PDF 状态
const currentPage = ref(1);
const totalPages = ref(0);
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const loadingAnnotations = ref(false);
const annotations = ref<PDFAnnotation[]>([]);

// UI 状态
const highlightAnnotation = ref<PDFAnnotation | null>(null);
const editingAnnotation = ref<PDFAnnotation | null>(null);
const editorVisible = ref(false);
const viewMode = ref<'split' | 'list' | 'mindmap'>('split');
const isFullscreen = ref(false);
const annotationWidth = ref(360);
const currentLevel = ref<AnnotationLevel>('text');
const extractMode = ref<ExtractMode>('text');

// 文本选择状态
const selectedText = ref('');
const selectedPage = ref(1);
const selectedRect = ref<[number, number, number, number] | null>(null);
const creatingAnnotation = ref(false);
const pendingTitleLevel = ref<AnnotationLevel | null>(null);

// 插入光标位置
const cursorAfterId = ref<string | null>(null);

// 目标文档选择
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

// 防抖相关变量（保留用于未来扩展）
const lastCreatedRef = {
  text: '',
  level: '',
  time: 0
};

// 搜索文档（防抖）
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

// 输入框聚焦时重新搜索
const onDocFocus = () => {
  loadDocOptions();
};

// 选择文档
const onDocSelect = () => {
  const doc = targetDocOptions.value.find(d => d.name === targetDocSearch.value);
  if (doc) {
    targetDoc.value = doc;
  }
};

// 清除选择
const clearTargetDoc = () => {
  targetDoc.value = null;
  targetDocSearch.value = '';
  loadDocOptions();
};

// 加载文档列表
const loadDocOptions = async () => {
  try {
    const results = await searchSiyuanDocs('');
    targetDocOptions.value = results;
  } catch (e) {
    console.error('[loadDocOptions] 加载文档列表失败:', e);
  }
};

// 拖拽调整大小
const isResizing = ref(false);

// 当前 PDF
const currentPdf = computed(() => {
  if (!currentProject.value) return null;
  if (!currentPdfId.value) return currentProject.value.pdfs[0] || null;
  return currentProject.value.pdfs.find(p => p.id === currentPdfId.value) || currentProject.value.pdfs[0] || null;
});

// 当前 PDF 的标注
const currentPdfAnnotations = computed(() => {
  if (!currentPdf.value) return [];
  return annotations.value.filter(a => a.pdfPath === currentPdf.value!.path);
});

// 所有卡片（用于智能学习集和搜索）
const allCards = computed(() => {
  return annotations.value.map(ann => ({
    id: ann.id,
    content: ann.isImage ? '[图片摘录]' : ann.text,
    type: ann.isImage ? 'image' : 'text',
    status: 'new' as const,
    createdAt: ann.created,
    updatedAt: ann.updated,
    pdfPath: ann.pdfPath,
    page: ann.page,
    note: ann.note,
  }));
});

// 获取级别标签
const getLevelLabel = (level: AnnotationLevel): string => {
  const found = ANNOTATION_LEVELS.find(l => l.value === level);
  return found ? found.label : '正文标注';
};

// 格式化日期
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString();
};

// 加载项目列表
const loadProjects = async () => {
  await initProjectStorage();
  projects.value = getAllProjects();
  const current = getCurrentProject();
  if (current) {
    currentProject.value = current;
    const pdf = getCurrentPdf(current);
    if (pdf) {
      currentPdfId.value = pdf.id;
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    }
    annotations.value = await getProjectAnnotationsAsync(current.id);
  }
};

// 切换项目
const switchProject = async (projectId: string) => {
  saveCurrentState();
  const proj = switchProjectApi(projectId);
  if (proj) {
    currentProject.value = proj;
    const pdf = getCurrentPdf(proj);
    if (pdf) {
      currentPdfId.value = pdf.id;
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    } else {
      currentPdfId.value = null;
      totalPages.value = 0;
      currentPage.value = 1;
    }
    annotations.value = await getProjectAnnotationsAsync(proj.id);
    showProjectManager.value = false;
    targetDoc.value = null;
    targetDocSearch.value = '';
    targetDocOptions.value = [];
  }
};

// PDF 切换
const onPdfSwitch = () => {
  if (!currentProject.value || !currentPdfId.value) return;
  if (currentPdf.value) {
    updateProjectPdf(currentProject.value.id, currentPdf.value.id, {
      currentPage: currentPage.value,
      totalPages: totalPages.value
    });
  }
  const proj = switchProjectPdf(currentProject.value.id, currentPdfId.value);
  if (proj) {
    currentProject.value = proj;
    const pdf = getCurrentPdf(proj);
    if (pdf) {
      currentPage.value = pdf.currentPage;
      totalPages.value = pdf.totalPages;
    }
  }
};

// 保存当前状态
const saveCurrentState = () => {
  if (currentProject.value && currentPdf.value) {
    updateProjectPdf(currentProject.value.id, currentPdf.value.id, {
      currentPage: currentPage.value,
      totalPages: totalPages.value
    });
    updateProject(currentProject.value.id, {
      annotationCount: annotations.value.length
    });
    saveProjectAnnotations(currentProject.value.id, annotations.value);
  }
};

// 显示新建项目对话框
const showNewProjectDialog = () => {
  newProjectDialog.value = {
    visible: true,
    name: '',
    pdfPath: '',
    pdfName: ''
  };
};

// 为新项目选择 PDF
const selectPdfForNewProject = () => {
  fileSelectMode = 'newProject';
  fileInput.value?.click();
};

// 添加 PDF 到项目对话框
const addPdfToProjectDialog = (projectId: string) => {
  addTargetProjectId = projectId;
  fileSelectMode = 'addPdf';
  fileInput.value?.click();
};

// 向当前项目添加 PDF
const triggerAddPdf = () => {
  if (!currentProject.value) return;
  addTargetProjectId = currentProject.value.id;
  fileSelectMode = 'addPdf';
  fileInput.value?.click();
};

// 文件选择处理
const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;

  try {
    const result = await uploadFileToAssets(file);

    if (fileSelectMode === 'newProject') {
      newProjectDialog.value.pdfPath = result.path;
      newProjectDialog.value.pdfName = result.name;
    } else if (fileSelectMode === 'addPdf') {
      const projectId = addTargetProjectId || currentProject.value?.id;
      if (projectId) {
        const pdf = await addPdfToProject(projectId, {
          pdfPath: result.path,
          pdfName: result.name
        });

        if (pdf) {
          await loadProjects();
          if (currentProject.value?.id === projectId) {
            currentPdfId.value = pdf.id;
            currentPage.value = 1;
            totalPages.value = 0;
          }
        }
      }
      addTargetProjectId = null;
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

// 创建新项目
const createNewProject = async () => {
  if (!newProjectDialog.value.name || !newProjectDialog.value.pdfPath) return;

  uploading.value = true;

  try {
    const project = await createProject({
      name: newProjectDialog.value.name,
      pdfPath: newProjectDialog.value.pdfPath,
      pdfName: newProjectDialog.value.pdfName
    });

    currentProject.value = project;
    currentPdfId.value = project.currentPdfId;
    currentPage.value = 1;
    totalPages.value = 0;
    annotations.value = [];

    loadProjects();
    newProjectDialog.value.visible = false;
    showProjectManager.value = false;
  } catch (error) {
    console.error('创建项目失败:', error);
    alert('创建项目失败，请查看控制台');
  } finally {
    uploading.value = false;
  }
};

// 删除项目确认
const deleteProjectConfirm = async (proj: ProjectListItem) => {
  if (!confirm(`确定删除项目「${proj.name}」？\n\n这将删除：\n- ${proj.pdfCount}个 PDF 文件关联\n- ${proj.annotationCount}条标注数据\n- 标注文档\n\n此操作不可撤销！`)) {
    return;
  }

  try {
    await deleteProjectApi(proj.id);
    loadProjects();

    if (currentProject.value?.id === proj.id) {
      currentProject.value = null;
      currentPdfId.value = null;
      annotations.value = [];
      totalPages.value = 0;
      currentPage.value = 1;
    }
  } catch (error: any) {
    console.error('删除项目失败:', error);
    alert(`删除失败：${error.message || '未知错误'}`);
  }
};

// 加载标注
const loadAnnotations = async () => {
  if (!currentProject.value) return;
  annotations.value = getProjectAnnotations(currentProject.value.id);
};

// PDF 加载完成
const handlePdfLoaded = (numPages: number) => {
  totalPages.value = numPages;
  if (currentProject.value && currentPdf.value) {
    updateProjectPdf(currentProject.value.id, currentPdf.value.id, { totalPages: numPages });
  }
};

// 页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 点击标注
const handleAnnotationClick = (ann: PDFAnnotation) => {
  highlightAnnotation.value = ann;
  if (currentProject.value) {
    const pdf = currentProject.value.pdfs.find(p => p.path === ann.pdfPath);
    if (pdf && pdf.id !== currentPdfId.value) {
      currentPdfId.value = pdf.id;
      currentPage.value = ann.page;
    } else {
      currentPage.value = ann.page;
    }
  }
};

// 编辑标注
const handleAnnotationEdit = (ann: PDFAnnotation) => {
  editingAnnotation.value = ann;
  editorVisible.value = true;
};

// 标注保存完成
const handleAnnotationSaved = () => {
  loadAnnotations();
};

// 删除标注
const handleAnnotationDelete = async (ann: PDFAnnotation) => {
  if (!currentProject.value) return;

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
    saveProjectAnnotations(currentProject.value.id, annotations.value);
    updateProject(currentProject.value.id, {
      annotationCount: annotations.value.length
    });
  } catch (error: any) {
    console.error('删除标注失败:', error);
    alert(`删除失败：${error.message || '未知错误'}`);
  }
};

// 合并标注
const handleAnnotationMerge = (sourceId: string, targetId: string) => {
  if (!currentProject.value) return;

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

  saveProjectAnnotations(currentProject.value.id, annotations.value);
};

// 取消合并
const handleAnnotationUnmerge = (annotationId: string) => {
  if (!currentProject.value) return;

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

  saveProjectAnnotations(currentProject.value.id, annotations.value);
};

// 处理光标位置变化
const handleCursorChange = (afterId: string | null) => {
  cursorAfterId.value = afterId;
};

// 在指定位置插入标注
const insertAnnotationAtPosition = (newAnnotation: PDFAnnotation): { success: boolean; reason?: string } => {
  if (!currentProject.value) return { success: false, reason: '无项目' };

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
  saveProjectAnnotations(currentProject.value.id, newAnnotations);

  return { success: true };
};

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  const panel = document.getElementById('plugin-pdf-mindmap-panel');
  if (panel) {
    panel.classList.toggle('fullscreen', isFullscreen.value);
  }
};

// 切换视图
const toggleView = () => {
  if (viewMode.value === 'split') {
    viewMode.value = 'list';
  } else if (viewMode.value === 'list') {
    viewMode.value = 'mindmap';
  } else {
    viewMode.value = 'split';
  }
};

// 关闭面板
const handleClose = () => {
  saveCurrentState();
  (props.plugin as any).closePanel();
};

// 处理文本选择
const handleTextSelected = (data: { text: string; page: number; rect: [number, number, number, number] | null }) => {
  selectedText.value = data.text;
  selectedPage.value = data.page;
  selectedRect.value = data.rect;
};

// 图片选择处理锁
let imageSelectLock = false;

// 处理图片选择
const handleImageSelected = async (data: {
  canvasRect: { x: number; y: number; width: number; height: number };
  pdfRect: [number, number, number, number];
  page: number
}) => {
  if (!currentProject.value || !currentPdf.value) return;

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

    const result = await saveAnnotationToProject(currentProject.value, newAnnotation, targetDoc.value?.id);
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

// 使用 window 全局锁防止跨 HMR 重复创建
const getCreateAnnotationLock = () => {
  if (typeof window === 'undefined') return { locked: false, text: '', level: '', time: 0 };
  (window as any).__PDF_CREATE_ANNOTATION_LOCK__ ||= { locked: false, text: '', level: '', time: 0 };
  return (window as any).__PDF_CREATE_ANNOTATION_LOCK__;
};
const CREATE_LOCK_DURATION = 3000;

// 从选择创建标注
const createAnnotationFromSelection = async () => {
  if (!selectedText.value || !currentProject.value || !currentPdf.value) return;

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

    const result = await saveAnnotationToProject(currentProject.value, newAnnotation, targetDoc.value?.id);
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

// 取消选择
const cancelSelection = () => {
  selectedText.value = '';
  selectedRect.value = null;
  window.getSelection()?.removeAllRanges();

  if (pendingTitleLevel.value) {
    pendingTitleLevel.value = null;
    extractMode.value = 'image';
  }
};

// 拖拽调整大小
const startResize = (_e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
};

const handleResize = (_e: MouseEvent) => {
  if (!isResizing.value) return;
  const container = document.querySelector('.panel-body') as HTMLElement;
  if (!container) return;
  const newWidth = container.getBoundingClientRect().right - _e.clientX;
  if (newWidth >= 280 && newWidth <= 600) {
    annotationWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
};

// 监听页码变化
watch(currentPage, () => {
  if (currentProject.value && currentPdf.value) {
    updateProjectPdf(currentProject.value.id, currentPdf.value.id, { currentPage: currentPage.value });
  }
});

// 定时更新缓存的文档 ID
let docIdUpdateTimer: ReturnType<typeof setInterval> | null = null;

// 加载学习集列表
const loadStudySetsList = async () => {
  try {
    studySetsList.value = [];
  } catch (error) {
    console.error('加载学习集列表失败:', error);
  }
};

// 显示快速捕获菜单
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

// 快速捕获处理
const handleQuickCapture = (card: any) => {
  console.log('快速捕获创建卡片:', card);
  selectedText.value = '';
  selectedRect.value = null;
  loadAnnotations();
};

// 快速捕获菜单关闭
const handleQuickCaptureClosed = () => {
  quickCaptureSourceLocation.value = null;
};

// 打开卡片编辑器
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

// 卡片编辑器保存
const handleCardEditorSaved = (card: any) => {
  console.log('卡片编辑器保存:', card);
  loadAnnotations();
  cardEditorPendingData.value = null;
};

// 卡片编辑器删除
const handleCardEditorDeleted = (card: any) => {
  console.log('卡片编辑器删除:', card);
  loadAnnotations();
  cardEditorPendingData.value = null;
};

// 卡片编辑器关闭
const handleCardEditorClosed = () => {
  editingCard.value = null;
  cardEditorPendingData.value = null;
};

// 全局键盘快捷键处理
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (event.altKey && event.key === 'c' && selectedText.value) {
    event.preventDefault();
    showQuickCapture();
  }
};

// 初始化
onMounted(async () => {
  await loadProjects();
  updateCachedDocId();
  docIdUpdateTimer = setInterval(() => {
    updateCachedDocId();
  }, 3000);
  loadDocOptions();
  loadStudySetsList();

  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleGlobalKeyDown);
});

// 卸载时保存
onUnmounted(() => {
  saveCurrentState();
  if (docIdUpdateTimer) {
    clearInterval(docIdUpdateTimer);
  }
  document.removeEventListener('keydown', handleGlobalKeyDown);
});

// ====== MarginNote 4 风格功能方法 ======

// 开始复习
const startReview = () => {
  showReviewSession.value = true;
  console.log('开始复习');
};

// 处理学习集选择
const handleLearningSetSelected = (studySet: any) => {
  currentStudySet.value = studySet;
  console.log('选择学习集:', studySet);
};

// 处理 PDF 打开请求
const handlePdfOpenRequest = (pdfPath: string) => {
  console.log('打开 PDF:', pdfPath);
};

// 处理标注聚焦请求
const handleAnnotationFocusRequest = (annotationId: string) => {
  console.log('聚焦标注:', annotationId);
};

// 处理页码跳转请求
const handlePageJumpRequest = (page: number) => {
  console.log('跳转到页码:', page);
  currentPage.value = page;
};

// 智能学习集相关方法
const handleSmartSetSave = (rules: any[]) => {
  console.log('保存智能学习集规则:', rules);
  showSmartStudySet.value = false;
};

const handleSmartSetAddToSet = (rules: any[], studySetId: string) => {
  console.log('添加到学习集:', rules, studySetId);
  showSmartStudySet.value = false;
};

// 设置面板相关方法
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

// 搜索面板相关方法
const handleSearchResultSelect = (result: any) => {
  console.log('选择搜索结果:', result);
};

const handleSearchNavigate = (cardId: string) => {
  console.log('导航到卡片:', cardId);
};

// 第五阶段高级功能相关方法
// 上下文搜索结果处理
const handleContextResultSelect = (result: { url: string; title: string }) => {
  console.log('选择搜索结果:', result.title);
  window.open(result.url, '_blank');
};

// 关键词选择处理
const handleKeywordSelect = (keyword: any) => {
  console.log('选择关键词:', keyword.name);
};

// 场景选择处理
const handleMemorySelect = (memory: any) => {
  console.log('选择场景:', memory.title);
};

// 场景回放处理
const handleMemoryReplay = async (memory: any) => {
  console.log('回放场景:', memory);
  // 恢复 PDF 位置
  if (memory.context?.pdfPath) {
    // 切换到对应 PDF
  }
  if (memory.context?.page) {
    currentPage.value = memory.context.page;
  }
  // 恢复文档上下文
  if (memory.context?.docId) {
    // 切换到对应文档
  }
};

// 卡片导航处理
const handleCardNavigate = (card: { id: string }) => {
  console.log('导航到卡片:', card.id);
};
</script>

<style scoped lang="scss">
@import './styles/variables.scss';

.pdf-mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 14px;
}

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
}

.header-btn:hover {
  background: var(--b3-theme-surface-light);
}

.header-btn.active {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}

.header-btn.icon-btn {
  padding: 8px;
}

.header-btn.close-btn:hover {
  background: var(--b3-theme-error-light);
  color: var(--b3-theme-error);
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
}

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

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  gap: 12px;
  flex-shrink: 0;
  height: 44px;
}

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
}

.toolbar-btn:hover {
  background: var(--b3-theme-primary-light);
  border-color: var(--b3-theme-primary);
  color: var(--b3-theme-primary);
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
}

.pdf-select:focus,
.level-select:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
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
}

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
}

.mode-btn:not(:last-child) {
  border-right: 1px solid var(--b3-border-color);
}

.mode-btn:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-on-surface);
}

.mode-btn.active {
  background: var(--b3-theme-primary);
  color: white;
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
}

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
}

.doc-input:focus {
  outline: none;
}

.doc-input::placeholder {
  color: var(--b3-theme-on-surface-light);
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
}

.doc-clear:hover {
  background: var(--b3-theme-error-light);
  color: var(--b3-theme-error);
}

.project-manager-overlay,
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

.project-manager-panel,
.dialog-panel {
  background: var(--b3-theme-surface);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  width: 480px;
  max-width: 90vw;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-title,
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

.panel-title button {
  padding: 4px 8px;
  font-size: 12px;
}

.project-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.no-projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.no-projects p {
  margin: 0;
  font-size: 14px;
}

.project-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
  border: 1px solid transparent;
  background: var(--b3-theme-background);
}

.project-item:hover {
  background: var(--b3-theme-surface-light);
  border-color: var(--b3-border-color);
}

.project-item.active {
  background: var(--b3-theme-primary-lightest);
  border-color: var(--b3-theme-primary-light);
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--b3-theme-on-surface);
}

.project-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 6px;
}

.project-pdfs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.pdf-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--b3-theme-surface-light);
  border-radius: 3px;
  color: var(--b3-theme-on-surface-light);
}

.project-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

.project-actions button {
  padding: 4px 8px;
  font-size: 11px;
}

.delete-btn:hover {
  background: var(--b3-theme-error-light) !important;
  border-color: var(--b3-theme-error) !important;
  color: var(--b3-theme-error) !important;
}

.panel-footer,
.dialog-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--b3-border-color);
  display: flex;
  justify-content: center;
  gap: 8px;
  background: var(--b3-theme-background);
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  font-weight: 500;
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
}

.b3-text-field:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
  box-shadow: 0 0 0 2px var(--b3-theme-primary-lightest);
}

.panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.panel-body.split {
  flex-direction: row;
}

.panel-body.list {
  flex-direction: column;
}

.pdf-area {
  flex: 1;
  min-width: 0;
  background: var(--b3-theme-background);
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
}

.resize-handle:hover,
.resize-handle:active {
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

.welcome-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.welcome-content p {
  color: var(--b3-theme-on-surface-light);
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
}

.recent-pdfs {
  margin-top: 32px;
  text-align: left;
}

.recent-pdfs p {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 8px;
  font-weight: 500;
}

.recent-pdf-item {
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
}

.recent-pdf-item:hover {
  background: var(--b3-theme-primary-lightest);
  border-color: var(--b3-theme-primary-light);
}

.project-icon {
  font-size: 16px;
}

.project-title {
  flex: 1;
  font-weight: 500;
}

.project-pdf-count {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  padding: 2px 6px;
  background: var(--b3-theme-surface-light);
  border-radius: 3px;
}

.annotation-area {
  flex-shrink: 0;
  min-width: 280px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--b3-border-color);
  font-size: 13px;
  font-weight: 500;
  background: var(--b3-theme-background);
}

.annotation-count {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  font-weight: 400;
  padding: 2px 8px;
  background: var(--b3-theme-surface-light);
  border-radius: 10px;
}

.panel-body.list .annotation-area {
  width: 100% !important;
  flex: 1;
  max-width: none;
  border-left: none;
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
}

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
}

:deep(.b3-button--primary:hover) {
  background: var(--b3-theme-primary-dark);
}

:deep(.b3-button--outline) {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

:deep(.b3-button--outline:hover) {
  background: var(--b3-theme-surface-light);
  border-color: var(--b3-theme-primary);
}

/* 第五阶段高级功能按钮样式 */
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

/* ======================================== MarginNote 风格优化样式 ======================================== */

/* 头部按钮增强效果 */
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
    transition: width 0.3s $ease-spring, height 0.3s $ease-spring, opacity 0.2s;
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

/* 项目按钮 */
.project-btn.active {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;

  svg {
    filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4));
  }
}

/* 学习集按钮 */
.learning-set-btn.active {
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;

  svg {
    filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.4));
  }
}

/* 卡片盒按钮 */
.card-box-btn.active {
  background: rgba(244, 114, 182, 0.12);
  color: #f472b6;

  svg {
    filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.4));
  }
}

/* 复习按钮 */
.review-btn.active {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;

  svg {
    filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4));
  }
}

/* 智能按钮 */
.smart-btn.active {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;

  svg {
    filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.4));
  }
}

/* 设置按钮 */
.settings-btn.active {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;

  svg {
    filter: drop-shadow(0 2px 4px rgba(107, 114, 128, 0.4));
  }
}

/* 复习统计徽章 */
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

/* 头部标题增强 */
.header-title {
  .title-main {
    font-weight: 600;
    background: linear-gradient(90deg, var(--b3-theme-on-surface), var(--b3-theme-on-surface-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .title-sub {
    font-size: 11px;
    opacity: 0.8;
  }

  .title-set {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 4px;
    font-size: 11px;
    color: #6366f1;
    font-weight: 500;
    margin-top: 2px;
    width: fit-content;
  }
}

/* 工具栏美化 */
.toolbar {
  background: linear-gradient(180deg, var(--b3-theme-surface), rgba(255, 255, 255, 0.5));
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.toolbar-btn {
  transition: all 0.15s $ease-spring;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }

  span {
    font-weight: 500;
  }
}

/* PDF 选择器美化 */
.pdf-select {
  transition: all 0.15s;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }

  &:focus {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

/* 标注头部美化 */
.annotation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent);
  border-bottom: 1px solid var(--b3-border-color);

  span:first-child {
    font-weight: 600;
    font-size: 14px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

/* 选择提示框美化 */
.selection-toast {
  animation: slide-up-fade 0.3s $ease-spring;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(135deg, var(--b3-theme-surface), rgba(255, 255, 255, 0.95));
}

@keyframes slide-up-fade {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 欢迎页美化 */
.welcome-area {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.03));
}

.welcome-content {
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    color: var(--b3-theme-on-surface-light);
    margin-bottom: 24px;
  }
}

.recent-pdfs {
  margin-top: 24px;
  width: 100%;
  max-width: 400px;

  > p {
    font-size: 13px;
    font-weight: 600;
    color: var(--b3-theme-on-surface-light);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.recent-pdf-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--b3-theme-surface);
  border-radius: 10px;
  border: 1px solid var(--b3-border-color);
  cursor: pointer;
  transition: all 0.15s $ease-spring;

  &:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    transform: translateX(4px);
  }

  .project-icon {
    font-size: 20px;
  }

  .project-title {
    flex: 1;
    font-weight: 500;
    font-size: 14px;
  }

  .project-pdf-count {
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-surface-light);
    padding: 2px 8px;
    border-radius: 4px;
  }
}

/* 项目管理器美化 */
.project-manager-panel {
  animation: scale-in-fade 0.2s $ease-spring;
}

@keyframes scale-in-fade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent);
  border-bottom: 1px solid var(--b3-border-color);

  span {
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.project-item {
  transition: all 0.15s;
  border-radius: 10px;
  margin-bottom: 8px;

  &:hover {
    background: rgba(99, 102, 241, 0.04);
  }

  &.active {
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.3);

    .project-name {
      color: #6366f1;
      font-weight: 600;
    }
  }

  .project-info {
    cursor: pointer;
  }

  .project-name {
    font-size: 15px;
    font-weight: 500;
    transition: all 0.15s;
  }

  .project-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-top: 6px;
  }

  .project-pdfs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--b3-border-color);
  }

  .pdf-tag {
    font-size: 11px;
    padding: 4px 10px;
    background: var(--b3-theme-surface-light);
    border-radius: 4px;
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-border-color);
    transition: all 0.15s;

    &:hover {
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
      background: rgba(99, 102, 241, 0.08);
    }
  }
}

/* 对话框美化 */
.dialog-panel {
  animation: dialog-slide-in 0.25s $ease-spring;
}

@keyframes dialog-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent);
  border-bottom: 1px solid var(--b3-border-color);

  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

/* 表单元素美化 */
.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
    margin-bottom: 8px;
  }

  .b3-text-field {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);
    transition: all 0.15s;
    font-size: 14px;

    &:focus {
      border-color: var(--b3-theme-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      outline: none;
    }

    &::placeholder {
      color: var(--b3-theme-on-surface-light);
    }
  }
}

/* 按钮通用美化 */
.b3-button {
  font-weight: 500;
  letter-spacing: 0.2px;
  transition: all 0.15s $ease-spring;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.b3-button--primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

  &:hover {
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }
}

.b3-button--outline {
  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
    background: rgba(99, 102, 241, 0.05);
  }
}

/* 覆盖层美化 */
.side-panel-overlay {
  backdrop-filter: blur(4px);
}

.side-panel-content {
  border-radius: 16px;
  box-shadow: $shadow-2xl;
  overflow: hidden;
}

/* 滚动条美化（全局） */
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
</style>
