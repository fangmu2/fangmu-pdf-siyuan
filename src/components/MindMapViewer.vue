<!-- src/components/MindMapViewer.vue -->
<template>
  <div class="mindmap-container" ref="mindmapRef">
    <div class="mindmap-toolbar">
      <button @click="fitView" class="toolbar-btn" title="适应视图">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
      <button @click="zoomIn" class="toolbar-btn" title="放大">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
      <button @click="zoomOut" class="toolbar-btn" title="缩小">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13H5v-2h14v2z"/>
        </svg>
      </button>
      <button @click="expandAll" class="toolbar-btn" title="展开全部">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
        </svg>
      </button>
      <button @click="collapseAll" class="toolbar-btn" title="收起全部">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
        </svg>
      </button>
      <button @click="addNode" class="toolbar-btn" title="添加节点">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
      <button @click="exportPNG" class="toolbar-btn" title="导出为PNG">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </button>
    </div>
    <div class="mindmap-content" ref="svgContainerRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import type { PDFAnnotation } from '../types/annotaion';
import { generateMindmapMarkdown, generateMindmapStructure, MindmapNode } from '../utils/mindmapGenerator';

// 直接导入markmap库
import { Transformer } from 'markmap-lib';
import { Markmap, loadCSS, loadJS } from 'markmap-view';

const props = defineProps<{
  annotations: PDFAnnotation[];
}>();

const emit = defineEmits<{
  (e: 'node-click', annotation: PDFAnnotation): void;
  (e: 'node-add', parentNode: PDFAnnotation | null): void;
  (e: 'node-edit', annotation: PDFAnnotation): void;
  (e: 'node-delete', annotation: PDFAnnotation): void;
}>();

const mindmapRef = ref<HTMLDivElement>();
const svgContainerRef = ref<HTMLDivElement>();
let mm: any = null;
let transformer: any = null;

// 当前选中的节点
const selectedNode = ref<MindmapNode | null>(null);

// 初始化Markmap
const initMarkmap = async () => {
  if (!svgContainerRef.value) return;

  try {
    // 创建Transformer实例
    transformer = new Transformer();

    // 创建Markmap实例
    mm = Markmap.create(svgContainerRef.value, {
      // 配置项
      color: (d: any) => {
        // 根据标注级别返回不同颜色
        const levelColors: Record<string, string> = {
          'title': '#FF6B6B',
          'h1': '#4ECDC4',
          'h2': '#45B7D1',
          'h3': '#96CEB4',
          'h4': '#FFEAA7',
          'h5': '#DDA0DD',
          'text': '#98D8C8'
        };
        return levelColors[d.data?.level || 'text'] || '#98D8C8';
      },
      nodeMinHeight: 20,
      spacingVertical: 10,
      spacingHorizontal: 100,
      duration: 500,
      autoFit: true,
      fitRatio: 0.9,
      // 添加交互事件
      onNodeClick: (node: any) => {
        if (node.data && node.data.annotationId) {
          const annotation = props.annotations.find(a => a.id === node.data.annotationId);
          if (annotation) {
            emit('node-click', annotation);
          }
        }
      }
    });

    updateMindmap();

    // 添加SVG事件监听器
    if (mm.svg) {
      mm.svg.on('dblclick', () => {
        // 双击空白处添加根节点
        emit('node-add', null);
      });
    }
  } catch (error) {
    console.error('Failed to initialize markmap:', error);
    // 创建一个简单的错误提示
    const errorDiv = document.createElement('div');
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
        <div style="font-size: 48px; margin-bottom: 16px;"> Mind Map </div>
        <div>思维导图组件加载失败</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
          请确保已安装 markmap-lib 和 markmap-view 依赖
        </div>
      </div>
    `;
    svgContainerRef.value.appendChild(errorDiv);
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
  if (styles) {
    const loadCSS = (window as any).markmap?.loadCSS;
    if (loadCSS) loadCSS(styles);
  }
  if (scripts) {
    const loadJS = (window as any).markmap?.loadJS;
    if (loadJS) loadJS(scripts);
  }

  mm.setData(root);
  mm.fit();
};

// 工具栏功能
const fitView = () => {
  if (mm) mm.fit();
};

const zoomIn = () => {
  if (mm) mm.zoomBy(0.5);
};

const zoomOut = () => {
  if (mm) mm.zoomBy(-0.5);
};

const expandAll = () => {
  // 展开所有节点
  if (mm && mm.state?.root) {
    mm.setData(mm.state.root);
    mm.fit();
  }
};

const collapseAll = () => {
  // 收起到根节点
  if (mm && mm.state?.root) {
    mm.setData({
      ...mm.state.root,
      children: mm.state.root.children?.map((child: any) => ({
        ...child,
        children: [] // 移除子节点
      }))
    });
    mm.fit();
  }
};

// 添加新节点
const addNode = () => {
  // 触发添加根节点事件
  emit('node-add', null);
};

// 导出为PNG
const exportPNG = () => {
  if (mm) {
    // 获取SVG内容并导出为PNG
    const svgElement = mm.svg?.node();
    if (svgElement) {
      // 创建临时的下载链接
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgElement);

      // 创建Blob对象
      const blob = new Blob([source], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mindmap-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
};

// 监听标注数据变化
watch(() => props.annotations, () => {
  nextTick(() => {
    updateMindmap();
  });
}, { deep: true });

onMounted(() => {
  initMarkmap();
});

onUnmounted(() => {
  // 清理资源
  if (mm) {
    mm.destroy?.();
  }
  mm = null;
  transformer = null;
});
</script>

<style scoped>
.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
}

.mindmap-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: var(--b3-theme-primary-light);
  border-color: var(--b3-theme-primary);
  color: var(--b3-theme-primary);
}

.mindmap-content {
  flex: 1;
  overflow: hidden;
}

/* SVG 样式 */
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
  stroke-width: 1px;
  transition: all 0.2s ease;
}

:deep(.mm-node:hover) {
  stroke: var(--b3-theme-primary);
  stroke-width: 2px;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.2));
}

:deep(.mm-node.selected) {
  stroke: #4CAF50;
  stroke-width: 3px;
  filter: drop-shadow(0 0 6px rgba(76, 175, 80, 0.4));
}

:deep(.mm-link) {
  fill: none;
  stroke-opacity: 0.5;
  transition: stroke 0.2s ease;
}

:deep(.mm-link:hover) {
  stroke-opacity: 0.8;
}

/* 文本样式 */
:deep(.mm-node-text) {
  pointer-events: none;
  user-select: none;
}
</style>
