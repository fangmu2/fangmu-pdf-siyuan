<!-- src/components/MindMapEditor.vue -->
<template>
  <div class="mindmap-editor" ref="editorRef">
    <!-- 工具栏 -->
    <div class="mindmap-toolbar">
      <!-- 布局选择器 -->
      <div class="toolbar-group">
        <select v-model="currentLayout" @change="changeLayout" class="layout-select" title="选择布局">
          <option value="mindmap">🧠 思维导图</option>
          <option value="tree">🌳 树状图</option>
          <option value="fishbone">🐟 鱼骨图</option>
          <option value="timeline">📅 时间轴</option>
          <option value="vertical">⬇️ 垂直图</option>
        </select>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button @click="fitView" class="toolbar-btn" title="适应视图 (F)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
        <button @click="zoomIn" class="toolbar-btn" title="放大 (+)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button @click="zoomOut" class="toolbar-btn" title="缩小 (-)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="expandAll" class="toolbar-btn" title="展开全部">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        </button>
        <button @click="collapseAll" class="toolbar-btn" title="收起全部">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="addNode" class="toolbar-btn" title="添加子节点 (Tab)" :disabled="!selectedNode">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button @click="addSiblingNode" class="toolbar-btn" title="添加兄弟节点 (Enter)" :disabled="!selectedNode">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" transform="rotate(90 12 12)"/>
          </svg>
        </button>
        <button @click="deleteNode" class="toolbar-btn toolbar-btn-danger" title="删除节点 (Delete)" :disabled="!selectedNode || selectedNode.isRoot">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="editNode" class="toolbar-btn" title="编辑节点 (E)" :disabled="!selectedNode">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button @click="toggleNodeColor" class="toolbar-btn" title="切换节点颜色" :disabled="!selectedNode">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="exportPNG" class="toolbar-btn" title="导出为 PNG">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
        <button @click="exportSVG" class="toolbar-btn" title="导出为 SVG">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group toolbar-info">
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <span class="layout-indicator" :title="layoutNames[currentLayout]">
          {{ layoutNames[currentLayout] }}
        </span>
      </div>
    </div>

    <!-- 布局提示 -->
    <transition name="fade">
      <div v-if="showLayoutTip" class="layout-tip">
        <span>已切换到{{ layoutNames[currentLayout] }}</span>
      </div>
    </transition>

    <!-- 编辑对话框 -->
    <div v-if="showEditDialog" class="edit-dialog-overlay" @click="closeEditDialog">
      <div class="edit-dialog" @click.stop>
        <div class="edit-dialog-header">
          <h3>编辑节点</h3>
          <button @click="closeEditDialog" class="close-btn">×</button>
        </div>
        <div class="edit-dialog-body">
          <textarea
            ref="editTextareaRef"
            v-model="editContent"
            placeholder="输入节点内容..."
            rows="4"
          ></textarea>
        </div>
        <div class="edit-dialog-footer">
          <button @click="closeEditDialog" class="btn-cancel">取消</button>
          <button @click="saveNodeEdit" class="btn-confirm">保存</button>
        </div>
      </div>
    </div>

    <!-- 思维导图内容 -->
    <div class="mindmap-content" ref="svgContainerRef"></div>

    <!-- 空状态提示 -->
    <div v-if="!annotations || annotations.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
      </div>
      <p>暂无内容</p>
      <p class="empty-state-hint">添加标注后，思维导图将自动显示在这里</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import type { PDFAnnotation } from '../types/annotation';
import { generateMindmapMarkdown, generateMindmapStructure, MindmapNode } from '../utils/mindmapGenerator';

// 动态导入 markmap 库
const { Transformer } = await import('markmap-lib');
const { Markmap } = await import('markmap-view');

interface Props {
  annotations: PDFAnnotation[];
  studySetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: ''
});

interface Emits {
  (e: 'node-click', annotation: PDFAnnotation): void;
  (e: 'node-add', parentNode: PDFAnnotation | null): void;
  (e: 'node-edit', annotation: PDFAnnotation, newContent: string): void;
  (e: 'node-delete', annotation: PDFAnnotation): void;
  (e: 'node-reorder', annotations: PDFAnnotation[]): void;
}

const emit = defineEmits<Emits>();

const editorRef = ref<HTMLDivElement>();
const svgContainerRef = ref<HTMLDivElement>();
const editTextareaRef = ref<HTMLTextAreaElement>();
let mm: any = null;
let transformer: any = null;

// 状态
const selectedNode = ref<MindmapNode | null>(null);
const selectedAnnotationId = ref<string | null>(null);
const zoomLevel = ref(1);
const showEditDialog = ref(false);
const editContent = ref('');
const editNodeId = ref<string | null>(null);

// 布局相关
const currentLayout = ref<string>('mindmap');
const showLayoutTip = ref(false);

// 布局名称映射
const layoutNames: Record<string, string> = {
  mindmap: '思维导图',
  tree: '树状图',
  fishbone: '鱼骨图',
  timeline: '时间轴',
  vertical: '垂直图'
};

// 不同布局的配置
const layoutConfigs: Record<string, any> = {
  mindmap: {
    direction: 'right',
    spacingHorizontal: 120,
    spacingVertical: 12,
    nodeMinHeight: 24,
    paddingX: 20,
    paddingY: 10,
    lineWidth: 2,
    lineCurve: 0.5
  },
  tree: {
    direction: 'down',
    spacingHorizontal: 50,
    spacingVertical: 60,
    nodeMinHeight: 24,
    paddingX: 24,
    paddingY: 8,
    lineWidth: 1.5,
    lineCurve: 0.3
  },
  fishbone: {
    direction: 'right',
    spacingHorizontal: 80,
    spacingVertical: 40,
    nodeMinHeight: 28,
    paddingX: 20,
    paddingY: 12,
    lineWidth: 2,
    lineCurve: 0.2,
    fishbone: true
  },
  timeline: {
    direction: 'right',
    spacingHorizontal: 150,
    spacingVertical: 60,
    nodeMinHeight: 32,
    paddingX: 16,
    paddingY: 10,
    lineWidth: 3,
    lineCurve: 0,
    timeline: true
  },
  vertical: {
    direction: 'down',
    spacingHorizontal: 40,
    spacingVertical: 50,
    nodeMinHeight: 22,
    paddingX: 20,
    paddingY: 8,
    lineWidth: 1.5,
    lineCurve: 0.4
  }
};

// 获取当前布局配置
const getCurrentLayoutConfig = () => {
  return layoutConfigs[currentLayout.value] || layoutConfigs.mindmap;
};

// 节点颜色
const nodeColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];
const currentNodeColorIndex = ref(0);

// 初始化 Markmap
const initMarkmap = async () => {
  if (!svgContainerRef.value) return;

  try {
    // 创建 Transformer 实例
    transformer = new Transformer();

    // 获取当前布局配置
    const config = getCurrentLayoutConfig();

    // 创建 Markmap 实例
    mm = Markmap.create(svgContainerRef.value, {
      // 配置项
      color: (d: any) => {
        const levelColors: Record<string, string> = {
          'title': nodeColors[0],
          'h1': nodeColors[1],
          'h2': nodeColors[2],
          'h3': nodeColors[3],
          'h4': nodeColors[4],
          'h5': nodeColors[5],
          'text': nodeColors[6]
        };
        return levelColors[d.data?.level || 'text'] || nodeColors[6];
      },
      nodeMinHeight: config.nodeMinHeight,
      spacingVertical: config.spacingVertical,
      spacingHorizontal: config.spacingHorizontal,
      duration: 500,
      autoFit: false,
      fitRatio: 0.9,
      initialExpandLevel: 2,

      // 布局方向
      direction: config.direction,

      // 线条样式
      lineWidth: config.lineWidth,
      lineCurve: config.lineCurve,

      // 特殊布局标记
      isFishbone: config.fishbone || false,
      isTimeline: config.timeline || false,

      // 交互事件
      onClickNode: (node: any) => {
        handleNodeClick(node);
      },
      onDblClickNode: (node: any) => {
        handleNodeDoubleClick(node);
      }
    });

    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 添加拖拽支持
    setupDragAndDrop();

    updateMindmap();
  } catch (error) {
    console.error('Failed to initialize markmap:', error);
    createErrorState();
  }
};

// 创建错误状态
const createErrorState = () => {
  if (!svgContainerRef.value) return;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-state';
  errorDiv.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--b3-theme-on-surface-light);
      text-align: center;
      padding: 20px;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">🧠</div>
      <div>思维导图组件加载失败</div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
        请确保已安装 markmap-lib 和 markmap-view 依赖
      </div>
      <div style="margin-top: 16px; font-size: 11px; opacity: 0.5;">
        npm install markmap-lib markmap-view
      </div>
    </div>
  `;
  svgContainerRef.value.appendChild(errorDiv);
};

// 处理节点点击
const handleNodeClick = (node: any) => {
  if (node.data && node.data.annotationId) {
    selectedNode.value = node.data;
    selectedAnnotationId.value = node.data.annotationId;

    const annotation = props.annotations.find(a => a.id === node.data.annotationId);
    if (annotation) {
      emit('node-click', annotation);
    }
  }
};

// 处理节点双击
const handleNodeDoubleClick = (node: any) => {
  if (node.data && node.data.annotationId) {
    editNodeId.value = node.data.annotationId;
    const annotation = props.annotations.find(a => a.id === node.data.annotationId);
    if (annotation) {
      editContent.value = annotation.text || annotation.excerpt || '';
      showEditDialog.value = true;
      nextTick(() => {
        editTextareaRef.value?.focus();
      });
    }
  }
};

// 设置拖拽支持
const setupDragAndDrop = () => {
  if (!svgContainerRef.value) return;

  const svg = svgContainerRef.value.querySelector('svg');
  if (!svg) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  svg.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.target === svg || e.target.tagName === 'rect') {
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      svg.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    svg.style.transform = `translate(${translateX}px, ${translateY}px)`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    svg.style.cursor = 'grab';
  });

  // 滚轮缩放
  svg.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomBy(delta);
  }, { passive: false });
};

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (!selectedNode.value) return;

  // 如果正在编辑，不处理快捷键
  if (showEditDialog.value) return;

  switch (e.key) {
    case 'Delete':
    case 'Backspace':
      if (!selectedNode.value.isRoot) {
        e.preventDefault();
        deleteNode();
      }
      break;
    case 'Enter':
      e.preventDefault();
      addSiblingNode();
      break;
    case 'Tab':
      e.preventDefault();
      addNode();
      break;
    case 'e':
    case 'E':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        editNode();
      }
      break;
    case 'f':
    case 'F':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fitView();
      }
      break;
    case '+':
    case '=':
      e.preventDefault();
      zoomIn();
      break;
    case '-':
      e.preventDefault();
      zoomOut();
      break;
  }
};

// 更新思维导图
const updateMindmap = () => {
  if (!mm || !transformer) return;

  const markdown = generateMindmapMarkdown(props.annotations);
  const { root, features } = transformer.transform(markdown);

  // 为每个节点添加数据关联
  const addAnnotationData = (node: any) => {
    if (node.data && node.data.annotationId) {
      const annotation = props.annotations.find(a => a.id === node.data.annotationId);
      if (annotation) {
        node.data.annotation = annotation;
      }
    }
    if (node.children) {
      node.children.forEach(addAnnotationData);
    }
  };

  addAnnotationData(root);

  // 加载额外资源
  const { styles, scripts } = transformer.getUsedAssets(features);

  mm.setData(root);

  // 恢复选中状态
  if (selectedAnnotationId.value) {
    highlightNode(selectedAnnotationId.value);
  }
};

// 高亮节点
const highlightNode = (annotationId: string) => {
  if (!mm) return;

  // 查找并高亮节点
  const findAndHighlight = (node: any): boolean => {
    if (node.data?.annotationId === annotationId) {
      node.highlighted = true;
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndHighlight(child)) {
          node.highlighted = true;
          return true;
        }
      }
    }
    return false;
  };

  findAndHighlight(mm.state?.root);
  mm.setData(mm.state?.root);
};

// 工具栏功能
const fitView = () => {
  if (mm) {
    mm.fit();
    zoomLevel.value = 1;
  }
};

const zoomIn = () => {
  zoomBy(0.2);
};

const zoomOut = () => {
  zoomBy(-0.2);
};

const zoomBy = (delta: number) => {
  if (!mm) return;
  zoomLevel.value = Math.max(0.2, Math.min(3, zoomLevel.value + delta));
  mm.setOptions({ zoomLevel: zoomLevel.value });
};

const expandAll = () => {
  if (mm && mm.state?.root) {
    const expandNode = (node: any) => {
      node.folded = false;
      if (node.children) {
        node.children.forEach(expandNode);
      }
    };
    expandNode(mm.state.root);
    mm.setData(mm.state.root);
    mm.fit();
  }
};

const collapseAll = () => {
  if (mm && mm.state?.root) {
    const collapseNode = (node: any) => {
      if (!node.isRoot) {
        node.folded = true;
      }
      if (node.children) {
        node.children.forEach(collapseNode);
      }
    };
    collapseNode(mm.state.root);
    mm.setData(mm.state.root);
    mm.fit();
  }
};

// 添加节点
const addNode = () => {
  if (!selectedNode.value) return;
  emit('node-add', selectedNode.value.annotation || null);
};

const addSiblingNode = () => {
  if (!selectedNode.value) return;
  // 找到父节点
  emit('node-add', null); // TODO: 传递父节点
};

// 删除节点
const deleteNode = () => {
  if (!selectedNode.value || !selectedNode.value.annotation) return;
  emit('node-delete', selectedNode.value.annotation);
  selectedNode.value = null;
  selectedAnnotationId.value = null;
};

// 编辑节点
const editNode = () => {
  if (!selectedNode.value || !selectedNode.value.annotation) return;
  editNodeId.value = selectedNode.value.annotation.id;
  editContent.value = selectedNode.value.annotation.text || selectedNode.value.annotation.excerpt || '';
  showEditDialog.value = true;
  nextTick(() => {
    editTextareaRef.value?.focus();
  });
};

// 切换节点颜色
const toggleNodeColor = () => {
  currentNodeColorIndex.value = (currentNodeColorIndex.value + 1) % nodeColors.length;
  // TODO: 应用颜色到选中节点
};

// 保存编辑
const saveNodeEdit = () => {
  if (!editNodeId.value) return;
  const annotation = props.annotations.find(a => a.id === editNodeId.value);
  if (annotation) {
    emit('node-edit', annotation, editContent.value);
  }
  closeEditDialog();
};

// 关闭编辑对话框
const closeEditDialog = () => {
  showEditDialog.value = false;
  editContent.value = '';
  editNodeId.value = null;
};

// 导出为 PNG
const exportPNG = () => {
  if (!mm) return;

  const svgElement = mm.svg?.node();
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // 创建临时图片
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pngBlob);
        link.download = `mindmap-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.click();
      }
    }, 'image/png');
  };
  img.src = url;
};

// 导出为 SVG
const exportSVG = () => {
  if (!mm) return;

  const svgElement = mm.svg?.node();
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mindmap-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.svg`;
  link.click();
};

// 切换布局
const changeLayout = () => {
  // 显示布局提示
  showLayoutTip.value = true;
  setTimeout(() => {
    showLayoutTip.value = false;
  }, 1500);

  // 重新初始化 markmap 以应用新布局
  if (mm) {
    mm.destroy?.();
    mm = null;
  }

  nextTick(() => {
    initMarkmap();
  });
};

// 监听数据变化
watch(() => props.annotations, () => {
  nextTick(() => {
    updateMindmap();
  });
}, { deep: true });

onMounted(() => {
  initMarkmap();
});

// 暴露方法
defineExpose({
  getCurrentLayout: () => currentLayout.value,
  setLayout: (layout: string) => {
    currentLayout.value = layout;
    changeLayout();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  if (mm) {
    mm.destroy?.();
  }
  mm = null;
  transformer = null;
});
</script>

<style scoped lang="scss">
// CSS 隔离：所有样式嵌套在根类名下
.mindmap-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;

  /* 工具栏样式 */
  .mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  margin-right: 8px;
  border-right: 1px solid var(--b3-border-color);
}

  .toolbar-group:last-child {
    border-right: none;
  }

  .toolbar-spacer {
  flex: 1;
}

  .toolbar-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--b3-theme-on-surface);
    font-size: 12px;
  }

  .zoom-level {
  min-width: 45px;
  text-align: center;
}

  .layout-indicator {
    padding: 2px 8px;
    background: var(--b3-theme-surface-hover);
    border-radius: 4px;
    font-size: 11px;
    color: var(--b3-theme-primary);
  }

  /* 布局选择器 */
  .layout-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  font-size: 12px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: var(--b3-theme-primary);
  }

    &:hover {
      border-color: var(--b3-theme-primary);
    }
  }

  .toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--b3-border-color);
  margin: 0 4px;
}

  /* 布局提示 */
  .layout-tip {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

  .fade-enter-active,
  .fade-leave-active {
  transition: opacity 0.3s ease;
}

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

  .toolbar-btn-danger:hover:not(:disabled) {
    background: rgba(244, 67, 54, 0.15);
    color: #f44336;
  }

  /* 内容区域 */
  .mindmap-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

  :deep(svg) {
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  :deep(svg:active) {
    cursor: grabbing;
  }

  :deep(.mm-node) {
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.mm-node:hover) {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

:deep(.mm-node.selected) {
  stroke: var(--b3-theme-primary);
  stroke-width: 3px;
}

  :deep(.mm-node.highlighted) {
    stroke: #FF9800;
    stroke-width: 3px;
    filter: drop-shadow(0 0 8px rgba(255, 152, 0, 0.5));
  }

  /* 空状态 */
  .empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

  .empty-state-icon {
    margin-bottom: 16px;
  }

  .empty-state-hint {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}

  /* 编辑对话框 */
  .edit-dialog-overlay {
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

  .edit-dialog {
    background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

  .edit-dialog-header {
    display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

  .edit-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

  .close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

  .close-btn:hover {
    background: var(--b3-theme-surface);
  }

  .edit-dialog-body {
  padding: 20px;
}

  .edit-dialog-body textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

  .edit-dialog-body textarea:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

  .edit-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

  .btn-cancel,
  .btn-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

  .btn-cancel:hover {
  background: var(--b3-theme-surface);
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;
}

  .btn-confirm:hover {
    opacity: 0.9;
  }
}
</style>
