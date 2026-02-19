<!-- src/App.vue -->
<template>
  <div class="pdf-mindmap-container">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-title">
        <span>PDF 思维导图摘录</span>
        <span class="version-badge">v0.6.0</span>
      </div>
      <div class="header-actions">
        <button
          @click="showProjectManager = !showProjectManager"
          class="b3-button b3-button--outline"
          title="项目管理"
        >
          📚 项目
        </button>
        <button
          @click="toggleFullscreen"
          class="b3-button b3-button--outline"
          :title="isFullscreen ? '退出全屏' : '全屏'"
        >
          <svg><use :xlink:href="isFullscreen ? '#iconMin' : '#iconFullscreen'"></use></svg>
        </button>
        <button
          @click="toggleView"
          class="b3-button b3-button--outline"
          :title="viewMode === 'split' ? '切换到列表视图' : '切换到分屏视图'"
        >
          <svg><use :xlink:href="viewMode === 'split' ? '#iconList' : '#iconSplit'"></use></svg>
        </button>
        <button @click="handleClose" class="b3-button b3-button--outline">
          <svg><use xlink:href="#iconClose"></use></svg>
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
                <span>📚 {{ proj.pdfCount }}本PDF</span>
                <span>📝 {{ proj.annotationCount }}条标注</span>
                <span>{{ formatDate(proj.updated) }}</span>
              </div>
              <!-- PDF列表 -->
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
                title="添加PDF"
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
              placeholder="例如：MySQL学习笔记"
            />
          </div>
          <div class="form-group">
            <label>导入第一个PDF：</label>
            <button @click="selectPdfForNewProject" class="b3-button b3-button--outline">
              {{ newProjectDialog.pdfName || '选择PDF文件' }}
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
    <div class="toolbar">
      <!-- 当前项目信息 + PDF切换 -->
      <div class="toolbar-section project-section">
        <button
          v-if="currentProject"
          @click="triggerAddPdf"
          class="b3-button b3-button--outline"
          title="添加PDF到当前项目"
        >
          + PDF
        </button>
        <button
          v-else
          @click="showNewProjectDialog"
          class="b3-button b3-button--outline"
          :disabled="uploading"
        >
          {{ uploading ? '导入中...' : '+ 新项目' }}
        </button>

        <!-- PDF切换下拉框 -->
        <div v-if="currentProject && currentProject.pdfs.length > 0" class="pdf-switcher">
          <select
            v-model="currentPdfId"
            class="pdf-select b3-select"
            @change="onPdfSwitch"
          >
            <option v-for="pdf in currentProject.pdfs" :key="pdf.id" :value="pdf.id">
              📄 {{ pdf.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 标注级别选择 -->
      <div class="toolbar-section level-section" v-if="currentProject">
        <label class="level-label">级别:</label>
        <select v-model="currentLevel" class="level-select b3-select">
          <option v-for="level in ANNOTATION_LEVELS" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
      </div>

      <!-- 目标文档选择 -->
      <div class="toolbar-section doc-section" v-if="currentProject">
        <label class="level-label">目标:</label>
        <div class="doc-input-wrapper">
          <input
            v-model="targetDocSearch"
            class="doc-search-input b3-text-field"
            placeholder="输入搜索文档..."
            list="doc-list"
            @input="onDocSearchInput"
            @change="onDocSelect"
          />
          <datalist id="doc-list">
            <option v-for="doc in targetDocOptions" :key="doc.id" :value="doc.name" :data-id="doc.id" />
          </datalist>
          <button v-if="targetDoc" @click="clearTargetDoc" class="clear-btn" title="清除">✕</button>
        </div>
      </div>

      <!-- 摘录模式切换 -->
      <div class="toolbar-section mode-section" v-if="currentProject">
        <button
          @click="extractMode = 'text'"
          class="b3-button"
          :class="extractMode === 'text' ? 'b3-button--primary' : 'b3-button--outline'"
          title="文字摘录模式"
        >
          📝 文字
        </button>
        <button
          @click="extractMode = 'image'"
          class="b3-button"
          :class="extractMode === 'image' ? 'b3-button--primary' : 'b3-button--outline'"
          title="图片摘录模式"
        >
          📷 图片
        </button>
      </div>

      <!-- 页码控制 -->
      <div class="toolbar-section" v-if="totalPages > 0">
        <button
          @click="prevPage"
          class="b3-button b3-button--outline"
          :disabled="currentPage <= 1"
        >
          <svg><use xlink:href="#iconLeft"></use></svg>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          @click="nextPage"
          class="b3-button b3-button--outline"
          :disabled="currentPage >= totalPages"
        >
          <svg><use xlink:href="#iconRight"></use></svg>
        </button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="panel-body" :class="viewMode">
      <!-- PDF预览区 -->
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
          <p>创建项目，导入多本PDF，统一管理标注</p>
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
      <div class="annotation-area" v-if="currentProject" :style="{ width: `${annotationWidth}px` }">
        <div class="annotation-header">
          <span>📝 标注列表</span>
          <span class="annotation-count">{{ annotations.length }}条</span>
        </div>
        <AnnotationList
          :annotations="annotations"
          :loading="loadingAnnotations"
          @annotation-click="handleAnnotationClick"
          @annotation-edit="handleAnnotationEdit"
          @refresh="loadAnnotations"
        />
      </div>
    </div>

    <!-- 文本选择提示 -->
    <div v-if="selectedText" class="selection-toast">
      <span class="selected-text">已选择: "{{ selectedText.substring(0, 30) }}{{ selectedText.length > 30 ? '...' : '' }}"</span>
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
  addAnnotationToCache,
  saveAnnotationToProject,
  initProjectStorage,
  getProjectAnnotationsAsync
} from './api/projectApi';
import type { PDFAnnotation, AnnotationLevel, ExtractMode } from './types/annotaion';
import { ANNOTATION_LEVELS } from './types/annotaion';
import type { PDFProject, ProjectListItem, ProjectPdf } from './types/project';

const props = defineProps<{ plugin: Plugin }>();

// 项目管理状态
const projects = ref<ProjectListItem[]>([]);
const currentProject = ref<PDFProject | null>(null);
const currentPdfId = ref<string | null>(null);
const showProjectManager = ref(false);

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
const viewMode = ref<'split' | 'list'>('split');
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
let docSearchTimer: ReturnType<typeof setTimeout> | null = null;

// 搜索文档（防抖）
const onDocSearchInput = () => {
  if (docSearchTimer) clearTimeout(docSearchTimer);
  docSearchTimer = setTimeout(async () => {
    try {
      const results = await searchSiyuanDocs(targetDocSearch.value);
      targetDocOptions.value = results;
    } catch (e) {
      console.error('[onDocSearchInput] 搜索失败:', e);
    }
  }, 300);
};

// 选择文档
const onDocSelect = () => {
  const doc = targetDocOptions.value.find(d => d.name === targetDocSearch.value);
  if (doc) {
    targetDoc.value = doc;
    console.log('[onDocSelect] 已选择目标文档:', doc.name, doc.id);
  }
};

// 清除选择
const clearTargetDoc = () => {
  targetDoc.value = null;
  targetDocSearch.value = '';
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

// 当前PDF
const currentPdf = computed(() => {
  if (!currentProject.value) return null;
  if (!currentPdfId.value) return currentProject.value.pdfs[0] || null;
  return currentProject.value.pdfs.find(p => p.id === currentPdfId.value) || currentProject.value.pdfs[0] || null;
});

// 当前PDF的标注
const currentPdfAnnotations = computed(() => {
  if (!currentPdf.value) return [];
  return annotations.value.filter(a => a.pdfPath === currentPdf.value!.path);
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
  // 先初始化存储（从思源加载数据）
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
    // 异步加载标注
    annotations.value = await getProjectAnnotationsAsync(current.id);
  }
};

// 切换项目
const switchProject = async (projectId: string) => {
  // 先保存当前项目状态
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
    // 异步加载标注
    annotations.value = await getProjectAnnotationsAsync(proj.id);
    showProjectManager.value = false;
  }
};

// PDF切换
const onPdfSwitch = () => {
  if (!currentProject.value || !currentPdfId.value) return;

  // 保存当前PDF状态
  if (currentPdf.value) {
    updateProjectPdf(currentProject.value.id, currentPdf.value.id, {
      currentPage: currentPage.value,
      totalPages: totalPages.value
    });
  }

  // 切换PDF
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

// 为新项目选择PDF
const selectPdfForNewProject = () => {
  fileSelectMode = 'newProject';
  fileInput.value?.click();
};

// 添加PDF到项目对话框
const addPdfToProjectDialog = (projectId: string) => {
  addTargetProjectId = projectId;
  fileSelectMode = 'addPdf';
  fileInput.value?.click();
};

// 向当前项目添加PDF
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
    // 上传文件到思源
    const result = await uploadFileToAssets(file);

    if (fileSelectMode === 'newProject') {
      // 为新项目记录PDF信息
      newProjectDialog.value.pdfPath = result.path;
      newProjectDialog.value.pdfName = result.name;
    } else if (fileSelectMode === 'addPdf') {
      // 添加到现有项目
      const projectId = addTargetProjectId || currentProject.value?.id;
      if (projectId) {
        const pdf = await addPdfToProject(projectId, {
          pdfPath: result.path,
          pdfName: result.name
        });

        if (pdf) {
          // 刷新项目数据
          await loadProjects();

          // 如果添加到当前项目，切换到新PDF
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

    console.log('[createNewProject] 创建项目成功:', project);
  } catch (error) {
    console.error('创建项目失败:', error);
    alert('创建项目失败，请查看控制台');
  } finally {
    uploading.value = false;
  }
};

// 删除项目确认
const deleteProjectConfirm = async (proj: ProjectListItem) => {
  if (!confirm(`确定删除项目「${proj.name}」？\n\n这将删除：\n- ${proj.pdfCount}个PDF文件关联\n- ${proj.annotationCount}条标注数据\n- 标注文档\n\n此操作不可撤销！`)) {
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
    alert(`删除失败: ${error.message || '未知错误'}`);
  }
};

// 加载标注
const loadAnnotations = async () => {
  if (!currentProject.value) return;
  annotations.value = getProjectAnnotations(currentProject.value.id);
};

// PDF加载完成
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

// 翻页
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// 点击标注
const handleAnnotationClick = (ann: PDFAnnotation) => {
  highlightAnnotation.value = ann;
  // 切换到标注所属的PDF
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
  
  if (!confirm(`确定要删除这条标注吗？\n\n"${ann.text.substring(0, 50)}${ann.text.length > 50 ? '...' : ''}"`)) {
    return;
  }

  try {
    // 如果有 blockId，删除思源中的块
    if (ann.blockId) {
      await deleteAnnotationApi(ann.blockId);
    }
    
    // 从本地列表中移除
    annotations.value = annotations.value.filter(a => a.id !== ann.id);
    
    // 更新项目存储
    saveProjectAnnotations(currentProject.value.id, annotations.value);
    updateProject(currentProject.value.id, {
      annotationCount: annotations.value.length
    });
    
    console.log('[handleAnnotationDelete] 删除成功:', ann.id);
  } catch (error: any) {
    console.error('删除标注失败:', error);
    alert(`删除失败: ${error.message || '未知错误'}`);
  }
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
  viewMode.value = viewMode.value === 'split' ? 'list' : 'split';
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

// 处理图片选择
const handleImageSelected = async (data: {
  canvasRect: { x: number; y: number; width: number; height: number };
  pdfRect: [number, number, number, number];
  page: number
}) => {
  if (!currentProject.value || !currentPdf.value) return;

  if (currentLevel.value !== 'text') {
    const savedLevel = currentLevel.value;
    alert(`已选择"${getLevelLabel(savedLevel)}"，请使用文字模式选择文本内容。`);
    extractMode.value = 'text';
    pendingTitleLevel.value = savedLevel;
    return;
  }

  creatingAnnotation.value = true;

  try {
    const pdfViewerEl = document.querySelector('.pdf-viewer-container') as HTMLElement;
    const canvas = pdfViewerEl?.querySelector('.pdf-canvas') as HTMLCanvasElement;

    if (!canvas) throw new Error('找不到PDF画布');

    const scaleX = canvas.width / canvas.offsetWidth;
    const scaleY = canvas.height / canvas.offsetHeight;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.round(data.canvasRect.width * scaleX));
    tempCanvas.height = Math.max(1, Math.round(data.canvasRect.height * scaleY));
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) throw new Error('无法创建画布上下文');

    ctx.drawImage(
      canvas,
      data.canvasRect.x * scaleX,
      data.canvasRect.y * scaleY,
      data.canvasRect.width * scaleX,
      data.canvasRect.height * scaleY,
      0, 0,
      tempCanvas.width,
      tempCanvas.height
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob(b => b ? resolve(b) : reject(new Error('无法创建图片')), 'image/png');
    });

    const fileName = `pdf-excerpt-${Date.now()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const uploadResult = await uploadFileToAssets(file);

    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}`,
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
      console.log('[handleImageSelected] 标注已保存到思源文档:', result.blockId);
    } else if (result.error) {
      alert(result.error);
      creatingAnnotation.value = false;
      return;
    } else {
      console.warn('[handleImageSelected] 保存到思源文档失败，仅保存到本地');
    }

    // 只添加到缓存，不重复 push
    addAnnotationToCache(currentProject.value.id, newAnnotation);
    // 更新当前显示的标注列表
    annotations.value = [...annotations.value, newAnnotation];

  } catch (error: any) {
    console.error('创建图片摘录失败:', error);
    alert(`创建失败: ${error.message || '未知错误'}`);
  } finally {
    creatingAnnotation.value = false;
  }
};

// 从选择创建标注
const createAnnotationFromSelection = async () => {
  if (!selectedText.value || !currentProject.value || !currentPdf.value) return;

  creatingAnnotation.value = true;

  try {
    const rect = selectedRect.value || [0, 0, 100, 20];
    const annotationLevel = pendingTitleLevel.value || currentLevel.value;

    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}`,
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
      console.log('[createAnnotation] 标注已保存到思源文档:', result.blockId);
    } else if (result.error) {
      alert(result.error);
      creatingAnnotation.value = false;
      return;
    } else {
      console.warn('[createAnnotation] 保存到思源文档失败，仅保存到本地');
    }

    // 只添加到缓存，不重复 push
    addAnnotationToCache(currentProject.value.id, newAnnotation);
    // 更新当前显示的标注列表
    annotations.value = [...annotations.value, newAnnotation];

    selectedText.value = '';
    selectedRect.value = null;
    window.getSelection()?.removeAllRanges();

    if (pendingTitleLevel.value) {
      pendingTitleLevel.value = null;
      extractMode.value = 'image';
    }

  } catch (error: any) {
    console.error('创建标注失败:', error);
    alert(`创建失败: ${error.message || '未知错误'}`);
  } finally {
    creatingAnnotation.value = false;
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
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const container = document.querySelector('.panel-body') as HTMLElement;
  if (!container) return;
  const newWidth = container.getBoundingClientRect().right - e.clientX;
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

// 定时更新缓存的文档ID（每3秒检查一次）
let docIdUpdateTimer: ReturnType<typeof setInterval> | null = null;

// 初始化
onMounted(async () => {
  await loadProjects();
  // 初始化时缓存当前文档ID
  updateCachedDocId();
  // 定时更新缓存的文档ID
  docIdUpdateTimer = setInterval(() => {
    updateCachedDocId();
  }, 3000);
  // 加载文档列表
  loadDocOptions();
});

// 卸载时保存
onUnmounted(() => {
  saveCurrentState();
  if (docIdUpdateTimer) {
    clearInterval(docIdUpdateTimer);
  }
});
</script>

<style scoped>
.pdf-mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 16px;
}

.version-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--b3-theme-primary-light);
  border-radius: 10px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* 项目管理面板 */
.project-manager-overlay,
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.project-manager-panel,
.dialog-panel {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 550px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.panel-title,
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: bold;
  font-size: 16px;
}

.project-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.no-projects {
  text-align: center;
  padding: 40px;
  color: var(--b3-theme-on-surface-light);
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 8px;
  border: 1px solid var(--b3-border-color);
}

.project-item:hover {
  background: var(--b3-theme-background);
}

.project-item.active {
  background: var(--b3-theme-primary-light);
  border-color: var(--b3-theme-primary);
}

.project-info {
  flex: 1;
}

.project-name {
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 4px;
}

.project-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 8px;
}

.project-pdfs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pdf-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--b3-theme-background);
  border-radius: 3px;
  color: var(--b3-theme-on-surface-light);
}

.project-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: var(--b3-card-error-background);
  color: var(--b3-card-error-color);
}

.panel-footer,
.dialog-footer {
  padding: 16px;
  border-top: 1px solid var(--b3-border-color);
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dialog-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.b3-text-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 14px;
}

.b3-text-field:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-section {
  flex: 1;
  min-width: 200px;
}

.pdf-switcher {
  flex: 1;
  max-width: 300px;
}

.pdf-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 13px;
}

.level-section {
  background: var(--b3-theme-background);
  padding: 4px 8px;
  border-radius: 4px;
}

.mode-section {
  display: flex;
  gap: 4px;
}

.mode-section .b3-button {
  font-size: 12px;
  padding: 4px 10px;
}

.level-label {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.level-select {
  padding: 4px 8px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 13px;
  min-width: 100px;
}

/* 目标文档选择器 */
.doc-section {
  position: relative;
}

.doc-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.doc-search-input {
  width: 180px;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
}

.doc-search-input:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

.clear-btn {
  padding: 2px 6px;
  font-size: 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
}

.clear-btn:hover {
  background: var(--b3-theme-error);
  color: white;
  border-color: var(--b3-theme-error);
}

.level-select {
  padding: 4px 8px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 13px;
  min-width: 100px;
}

.page-info {
  font-size: 13px;
  min-width: 60px;
  text-align: center;
}

/* 主体区域 */
.panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
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
}

.panel-body.list .pdf-area {
  display: none;
}

.resize-handle {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--b3-theme-primary-light);
}

.resize-line {
  position: absolute;
  left: 2px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--b3-border-color);
}

/* 欢迎页 */
.welcome-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
}

.welcome-content p {
  color: var(--b3-theme-on-surface-light);
  margin: 0 0 24px 0;
}

.recent-pdfs {
  margin-top: 24px;
  text-align: left;
}

.recent-pdfs p {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 8px;
}

.recent-pdf-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 4px 0;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.recent-pdf-item:hover {
  background: var(--b3-theme-primary-light);
}

.project-icon {
  font-size: 18px;
}

.project-title {
  flex: 1;
}

.project-pdf-count {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

/* 标注区域 */
.annotation-area {
  flex-shrink: 0;
  min-width: 280px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--b3-border-color);
  font-size: 13px;
  font-weight: 500;
}

.annotation-count {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  font-weight: normal;
}

.panel-body.list .annotation-area {
  width: 100% !important;
  flex: 1;
  max-width: none;
}

/* 选择提示 */
.selection-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  max-width: 90vw;
  flex-wrap: wrap;
  justify-content: center;
}

.selected-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-hint {
  font-size: 12px;
  color: var(--b3-theme-primary);
  font-weight: bold;
}

.b3-button--small {
  padding: 4px 12px;
  font-size: 12px;
}
</style>
