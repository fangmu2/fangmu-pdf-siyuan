<!-- src/App.vue -->
<template>
  <div class="pdf-mindmap-container">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-title">
        <span>PDF 思维导图摘录</span>
        <span class="version-badge">v0.2.0</span>
      </div>
      <div class="header-actions">
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- PDF选择 -->
      <div class="toolbar-section">
        <button
          @click="triggerFileSelect"
          class="b3-button b3-button--outline"
          :disabled="uploading"
        >
          {{ uploading ? '导入中...' : '选择 PDF' }}
        </button>
        <span v-if="pdfPath" class="pdf-name">{{ getFileName(pdfPath) }}</span>
      </div>

      <!-- 标注级别选择 - 移到工具栏 -->
      <div class="toolbar-section level-section" v-if="pdfPath">
        <label class="level-label">标注级别:</label>
        <select v-model="currentLevel" class="level-select b3-select">
          <option v-for="level in ANNOTATION_LEVELS" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
      </div>

      <!-- 摘录模式切换 -->
      <div class="toolbar-section mode-section" v-if="pdfPath">
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
      <div class="pdf-area" v-if="pdfPath" :style="{ width: `calc(100% - ${annotationWidth}px)` }">
        <PDFViewer
          :pdf-path="pdfPath"
          :current-page="currentPage"
          :annotations="annotations"
          :highlight-annotation="highlightAnnotation"
          :extract-mode="extractMode"
          @loaded="handlePdfLoaded"
          @page-change="handlePageChange"
          @text-selected="handleTextSelected"
          @image-selected="handleImageSelected"
        />
      </div>

      <!-- 欢迎页 -->
      <div v-else class="welcome-area">
        <div class="welcome-content">
          <div class="welcome-icon">📄</div>
          <h2>欢迎使用 PDF 思维导图摘录</h2>
          <p>请选择一个 PDF 文件开始</p>
          <button @click="triggerFileSelect" class="b3-button b3-button--primary">
            选择 PDF 文件
          </button>
          <!-- 显示最近的 PDF -->
          <div v-if="recentPdfs.length > 0" class="recent-pdfs">
            <p>最近的文件:</p>
            <div 
              v-for="pdf in recentPdfs" 
              :key="pdf.path" 
              class="recent-pdf-item"
              @click="loadRecentPdf(pdf)"
            >
              {{ pdf.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- 可拖拽分隔条 -->
      <div 
        v-if="pdfPath && viewMode === 'split'" 
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-line"></div>
      </div>

      <!-- 标注列表区 -->
      <div class="annotation-area" v-if="pdfPath || annotations.length > 0" :style="{ width: `${annotationWidth}px` }">
        <AnnotationList
          :annotations="annotations"
          :loading="loadingAnnotations"
          @annotation-click="handleAnnotationClick"
          @annotation-edit="handleAnnotationEdit"
          @refresh="loadAnnotations"
        />
      </div>
    </div>

    <!-- 文本选择提示 - 简化为只有创建和取消按钮 -->
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

    <!-- 标题输入对话框 -->
    <div v-if="titleInputDialog.visible" class="title-input-overlay" @click.self="cancelTitleInput">
      <div class="title-input-dialog">
        <div class="dialog-header">
          <span>输入{{ getLevelLabel(titleInputDialog.level) }}内容</span>
        </div>
        <div class="dialog-body">
          <input
            ref="titleInputRef"
            v-model="titleInputDialog.text"
            type="text"
            class="title-input b3-text-field"
            :placeholder="`请输入${getLevelLabel(titleInputDialog.level)}的文字内容`"
            @keyup.enter="confirmTitleInput"
            @keyup.escape="cancelTitleInput"
          />
        </div>
        <div class="dialog-footer">
          <button @click="cancelTitleInput" class="b3-button b3-button--outline">取消</button>
          <button @click="confirmTitleInput" class="b3-button b3-button--primary">确定</button>
        </div>
      </div>
    </div>

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
import { ref, onMounted, watch, onUnmounted } from 'vue';
import type { Plugin } from 'siyuan';
import PDFViewer from './components/PDFViewer.vue';
import AnnotationList from './components/AnnotationList.vue';
import AnnotationEditor from './components/AnnotationEditor.vue';
import { uploadFileToAssets, postApi } from './api/siyuanApi';
import { getAnnotationsForPdf, createAnnotation } from './api/annotationApi';
import type { PDFAnnotation, AnnotationLevel, ExtractMode } from './types/annotaion';
import { ANNOTATION_LEVELS } from './types/annotaion';

const STORAGE_KEY = 'pdf-mindmap-state';
const ANNOTATIONS_STORAGE_PREFIX = 'pdf-annotations-';
const MAX_RECENT_PDFS = 5;

const props = defineProps<{ plugin: Plugin }>();

// 状态
const pdfPath = ref('');
const pdfName = ref('');
const currentPage = ref(1);
const totalPages = ref(0);
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const loadingAnnotations = ref(false);
const annotations = ref<PDFAnnotation[]>([]);
const highlightAnnotation = ref<PDFAnnotation | null>(null);
const editingAnnotation = ref<PDFAnnotation | null>(null);
const editorVisible = ref(false);
const viewMode = ref<'split' | 'list'>('split');
const isFullscreen = ref(false);
const selectedText = ref('');
const selectedPage = ref(1);
const selectedRect = ref<[number, number, number, number] | null>(null);
const creatingAnnotation = ref(false);
const currentLevel = ref<AnnotationLevel>('text');
const extractMode = ref<ExtractMode>('text');
const recentPdfs = ref<Array<{ path: string; name: string }>>([]);
const annotationWidth = ref(360);

// 待处理的标题级别（用于图片模式选择标题后切换到文字模式）
const pendingTitleLevel = ref<AnnotationLevel | null>(null);

// 标题输入对话框状态
const titleInputRef = ref<HTMLInputElement>();
const titleInputDialog = ref<{
  visible: boolean;
  level: AnnotationLevel;
  text: string;
  callback: ((text: string) => void) | null;
}>({
  visible: false,
  level: 'text',
  text: '',
  callback: null
});

// 显示标题输入对话框
const showTitleInputDialog = (level: AnnotationLevel): Promise<string | null> => {
  return new Promise((resolve) => {
    titleInputDialog.value = {
      visible: true,
      level,
      text: '',
      callback: (text: string) => resolve(text)
    };
    // 延迟聚焦输入框
    setTimeout(() => {
      titleInputRef.value?.focus();
    }, 100);
  });
};

// 确认标题输入
const confirmTitleInput = () => {
  const text = titleInputDialog.value.text.trim();
  if (text && titleInputDialog.value.callback) {
    titleInputDialog.value.callback(text);
  }
  titleInputDialog.value.visible = false;
};

// 取消标题输入
const cancelTitleInput = () => {
  if (titleInputDialog.value.callback) {
    titleInputDialog.value.callback('');
  }
  titleInputDialog.value.visible = false;
};

// 拖拽调整大小相关
const isResizing = ref(false);

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  
  const container = document.querySelector('.panel-body') as HTMLElement;
  if (!container) return;
  
  const containerRect = container.getBoundingClientRect();
  const newWidth = containerRect.right - e.clientX;
  
  // 限制最小和最大宽度
  if (newWidth >= 280 && newWidth <= 600) {
    annotationWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  saveState();
};

// 获取级别标签
const getLevelLabel = (level: AnnotationLevel): string => {
  const found = ANNOTATION_LEVELS.find(l => l.value === level);
  return found ? found.label : '正文标注';
};

// 生成本地标注数据的存储键
const getAnnotationsStorageKey = (path: string): string => {
  const fileName = path.split('/').pop() || '';
  return ANNOTATIONS_STORAGE_PREFIX + fileName.replace(/[^a-zA-Z0-9]/g, '_');
};

// 保存标注数据到 localStorage
const saveAnnotationsLocal = () => {
  if (!pdfPath.value) return;
  const key = getAnnotationsStorageKey(pdfPath.value);
  localStorage.setItem(key, JSON.stringify(annotations.value));
};

// 从 localStorage 加载标注数据
const loadAnnotationsLocal = (): PDFAnnotation[] | null => {
  if (!pdfPath.value) return null;
  const key = getAnnotationsStorageKey(pdfPath.value);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('加载本地标注失败:', e);
    }
  }
  return null;
};

// 保存状态到 localStorage
const saveState = () => {
  const state = {
    pdfPath: pdfPath.value,
    pdfName: pdfName.value,
    currentPage: currentPage.value,
    viewMode: viewMode.value,
    currentLevel: currentLevel.value,
    extractMode: extractMode.value,
    annotationWidth: annotationWidth.value,
    recentPdfs: recentPdfs.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveAnnotationsLocal();
};

// 从 localStorage 加载状态
const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      recentPdfs.value = state.recentPdfs || [];
      currentLevel.value = state.currentLevel || 'text';
      extractMode.value = state.extractMode || 'text';
      annotationWidth.value = state.annotationWidth || 360;
      
      if (state.pdfPath) {
        pdfPath.value = state.pdfPath;
        pdfName.value = state.pdfName || getFileName(state.pdfPath);
        currentPage.value = state.currentPage || 1;
        viewMode.value = state.viewMode || 'split';
        
        // 先加载本地标注
        const localAnnotations = loadAnnotationsLocal();
        if (localAnnotations && localAnnotations.length > 0) {
          annotations.value = localAnnotations;
          console.log('从本地加载了', localAnnotations.length, '条标注');
        }
      }
    }
  } catch (e) {
    console.error('加载状态失败:', e);
  }
};

// 添加到最近文件列表
const addToRecentPdfs = (path: string, name: string) => {
  const filtered = recentPdfs.value.filter(p => p.path !== path);
  recentPdfs.value = [{ path, name }, ...filtered].slice(0, MAX_RECENT_PDFS);
  saveState();
};

// 加载最近的 PDF
const loadRecentPdf = async (pdf: { path: string; name: string }) => {
  pdfPath.value = pdf.path;
  pdfName.value = pdf.name;
  currentPage.value = 1;
  
  // 加载本地标注
  const localAnnotations = loadAnnotationsLocal();
  if (localAnnotations && localAnnotations.length > 0) {
    annotations.value = localAnnotations;
  }
  
  saveState();
};

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  const panel = document.getElementById('plugin-pdf-mindmap-panel');
  if (panel) {
    panel.classList.toggle('fullscreen', isFullscreen.value);
  }
};

// 文件选择
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;

  try {
    const result = await uploadFileToAssets(file);
    pdfPath.value = result.path;
    pdfName.value = result.name;  // 使用实际文件名（包含时间戳）
    currentPage.value = 1;

    addToRecentPdfs(result.path, result.name);

    // 加载本地标注
    const localAnnotations = loadAnnotationsLocal();
    if (localAnnotations && localAnnotations.length > 0) {
      annotations.value = localAnnotations;
    } else {
      // 尝试从思源加载标注
      await loadAnnotations();
    }
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败，请查看控制台');
  } finally {
    uploading.value = false;
    if (target) target.value = '';
  }
};

// 加载标注（从思源）
const loadAnnotations = async () => {
  if (!pdfPath.value) return;

  loadingAnnotations.value = true;

  try {
    const anns = await getAnnotationsForPdf(pdfPath.value);
    annotations.value = anns;
    
    // 保存到本地
    saveAnnotationsLocal();
    
    console.log(`加载了 ${anns.length} 条标注`);
  } catch (error) {
    console.error('加载标注失败:', error);
  } finally {
    loadingAnnotations.value = false;
  }
};

// PDF加载完成
const handlePdfLoaded = (numPages: number) => {
  totalPages.value = numPages;
  console.log(`PDF加载完成，共 ${numPages} 页`);
};

// 页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 翻页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 点击标注
const handleAnnotationClick = (ann: PDFAnnotation) => {
  highlightAnnotation.value = ann;
  currentPage.value = ann.page;
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

// 切换视图
const toggleView = () => {
  viewMode.value = viewMode.value === 'split' ? 'list' : 'split';
  saveState();
};

// 获取文件名
const getFileName = (path: string) => {
  return path.split('/').pop() || path;
};

// 关闭面板
const handleClose = () => {
  saveState();
  (props.plugin as any).closePanel();
};

// 处理文本选择
const handleTextSelected = (data: { text: string; page: number; rect: [number, number, number, number] | null }) => {
  selectedText.value = data.text;
  selectedPage.value = data.page;
  selectedRect.value = data.rect;
  console.log(`选择了文本: ${data.text}, 页码: ${data.page}, 级别: ${currentLevel.value}`);
};

// 处理图片选择
const handleImageSelected = async (data: { 
  canvasRect: { x: number; y: number; width: number; height: number }; 
  pdfRect: [number, number, number, number];
  page: number 
}) => {
  console.log('选择了图片区域:', data);
  
  if (!pdfPath.value) return;
  
  // 如果选择的是标题级别，自动切换到文字模式
  if (currentLevel.value !== 'text') {
    // 保存当前级别
    const savedLevel = currentLevel.value;
    
    // 提示用户
    alert(`已选择"${getLevelLabel(savedLevel)}"，请使用文字模式选择文本内容。\n将自动切换到文字摘录模式...`);
    
    // 切换到文字模式
    extractMode.value = 'text';
    
    // 保存切换前的级别，等文字选择完成后恢复
    pendingTitleLevel.value = savedLevel;
    
    return;
  }
  
  // 正文标注：保存图片
  creatingAnnotation.value = true;
  
  try {
    // 获取PDF canvas截图
    const pdfViewerEl = document.querySelector('.pdf-viewer-container') as HTMLElement;
    const canvas = pdfViewerEl?.querySelector('.pdf-canvas') as HTMLCanvasElement;
    
    if (!canvas) {
      throw new Error('找不到PDF画布');
    }
    
    // 获取canvas的实际像素尺寸和CSS尺寸
    const canvasPixelWidth = canvas.width;
    const canvasPixelHeight = canvas.height;
    const canvasCssWidth = canvas.offsetWidth;
    const canvasCssHeight = canvas.offsetHeight;
    
    // 计算从CSS像素到Canvas像素的缩放比例
    const scaleX = canvasPixelWidth / canvasCssWidth;
    const scaleY = canvasPixelHeight / canvasCssHeight;
    
    // 从canvas上裁剪选中区域（canvasRect是CSS坐标）
    const sourceX = data.canvasRect.x * scaleX;
    const sourceY = data.canvasRect.y * scaleY;
    const sourceWidth = data.canvasRect.width * scaleX;
    const sourceHeight = data.canvasRect.height * scaleY;
    
    console.log('截图参数:', {
      canvasSize: { w: canvasPixelWidth, h: canvasPixelHeight },
      cssSize: { w: canvasCssWidth, h: canvasCssHeight },
      scale: { x: scaleX, y: scaleY },
      source: { x: sourceX, y: sourceY, w: sourceWidth, h: sourceHeight },
      pdfRect: data.pdfRect
    });
    
    // 创建临时canvas用于裁剪
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.round(sourceWidth));
    tempCanvas.height = Math.max(1, Math.round(sourceHeight));
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }
    
    // 绘制裁剪区域
    ctx.drawImage(
      canvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    
    // 转换为Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('无法创建图片'));
      }, 'image/png');
    });
    
    // 生成文件名
    const timestamp = Date.now();
    const fileName = `pdf-excerpt-${timestamp}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    
    console.log('准备上传图片:', fileName, '大小:', blob.size);
    
    // 上传到思源
    const uploadResult = await uploadFileToAssets(file);
    console.log('图片上传成功:', uploadResult);
    
    // 使用PDF坐标（从PDFViewer转换好的）
    const pdfRect = data.pdfRect;
    
    // 保存标注到思源 - 图片标注不保存文字
    await createAnnotation({
      text: '',  // 图片标注不需要文字
      pdfPath: pdfPath.value,
      pdfName: pdfName.value || getFileName(pdfPath.value),
      page: data.page,
      rect: pdfRect,
      color: 'yellow',
      level: 'text',
      isImage: true,
      imagePath: uploadResult.path
    });
    
    // 保存到本地标注列表
    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}`,
      blockId: '',
      pdfPath: pdfPath.value,
      pdfName: pdfName.value || getFileName(pdfPath.value),
      page: data.page,
      rect: pdfRect,
      text: '',  // 图片标注不需要文字
      note: '',
      color: 'yellow',
      level: 'text',
      isImage: true,
      imagePath: uploadResult.path,
      created: Date.now(),
      updated: Date.now()
    };
    
    annotations.value.push(newAnnotation);
    saveAnnotationsLocal();
    
    console.log('图片摘录创建成功:', newAnnotation);
    
  } catch (error: any) {
    console.error('创建图片摘录失败:', error);
    alert(`创建图片摘录失败: ${error.message || '未知错误'}`);
  } finally {
    creatingAnnotation.value = false;
  }
};

// 从选择创建标注
const createAnnotationFromSelection = async () => {
  if (!selectedText.value || !pdfPath.value) return;

  creatingAnnotation.value = true;

  try {
    const rect: [number, number, number, number] = selectedRect.value || [0, 0, 100, 20];
    
    // 检查是否有待处理的标题级别（从图片模式切换过来的）
    const annotationLevel = pendingTitleLevel.value || currentLevel.value;

    // 创建标注到思源
    await createAnnotation({
      text: selectedText.value,
      pdfPath: pdfPath.value,
      pdfName: pdfName.value || getFileName(pdfPath.value),
      page: selectedPage.value,
      rect: rect,
      color: 'yellow',
      level: annotationLevel
    });

    // 同时保存到本地
    const newAnnotation: PDFAnnotation = {
      id: `ann-${Date.now()}`,
      blockId: '',
      pdfPath: pdfPath.value,
      pdfName: pdfName.value || getFileName(pdfPath.value),
      page: selectedPage.value,
      rect: rect,
      text: selectedText.value,
      note: '',
      color: 'yellow',
      level: annotationLevel,
      created: Date.now(),
      updated: Date.now()
    };
    
    annotations.value.push(newAnnotation);
    saveAnnotationsLocal();
    
    console.log('本地标注已添加:', newAnnotation);
    console.log('当前标注列表:', annotations.value);

    // 清除选择
    selectedText.value = '';
    selectedRect.value = null;
    window.getSelection()?.removeAllRanges();

    // 如果有待处理的标题级别，说明是从图片模式切换过来的
    // 创建完成后切换回图片模式
    if (pendingTitleLevel.value) {
      console.log('标注创建完成，切换回图片模式');
      pendingTitleLevel.value = null;
      extractMode.value = 'image';
    }

    console.log('标注创建成功');
  } catch (error: any) {
    console.error('创建标注失败:', error);
    alert(`创建标注失败: ${error.message || '未知错误'}`);
  } finally {
    creatingAnnotation.value = false;
  }
};

// 取消选择
const cancelSelection = () => {
  selectedText.value = '';
  selectedRect.value = null;
  window.getSelection()?.removeAllRanges();
  
  // 如果有待处理的标题级别，切换回图片模式
  if (pendingTitleLevel.value) {
    pendingTitleLevel.value = null;
    extractMode.value = 'image';
  }
};

// 监听PDF路径变化
watch(pdfPath, () => {
  // 不自动加载，因为我们在 loadState 中已经处理
});

// 监听页码变化
watch(currentPage, () => {
  saveState();
});

// 监听标注级别变化
watch(currentLevel, () => {
  saveState();
});

// 初始化
onMounted(() => {
  loadState();
});

// 卸载时保存状态
onUnmounted(() => {
  saveState();
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
  cursor: pointer;
  min-width: 100px;
}

.pdf-name {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-info {
  font-size: 13px;
  min-width: 60px;
  text-align: center;
}

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

.resize-handle:hover .resize-line {
  background: var(--b3-theme-primary);
}

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
  padding: 8px 12px;
  margin: 4px 0;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.recent-pdf-item:hover {
  background: var(--b3-theme-primary-light);
}

.annotation-area {
  flex-shrink: 0;
  min-width: 280px;
  max-width: 600px;
}

.panel-body.list .annotation-area {
  width: 100% !important;
  flex: 1;
  max-width: none;
}

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

/* 标题输入对话框样式 */
.title-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.title-input-dialog {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 320px;
  max-width: 90vw;
}

.dialog-header {
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: bold;
  font-size: 15px;
}

.dialog-body {
  padding: 16px;
}

.title-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
}

.title-input:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

.dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
