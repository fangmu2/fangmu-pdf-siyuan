<!-- src/components/AnnotationList.vue -->
<template>
  <div class="annotation-list-container">
    <!-- 头部 -->
    <div class="list-header">
      <div class="header-title">
        <span>📝 标注列表</span>
        <span class="count-badge">{{ annotations.length }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="header-actions">
        <button
          v-if="annotations.length > 0"
          @click="exportMarkdown"
          class="b3-button b3-button--outline"
          title="导出为Markdown"
        >
          <svg><use xlink:href="#iconDownload"></use></svg>
        </button>
        <button
          @click="refresh"
          class="b3-button b3-button--outline"
          title="刷新"
        >
          <svg><use xlink:href="#iconRefresh"></use></svg>
        </button>
      </div>
    </div>

    <!-- 分组选择 -->
    <div class="group-selector">
      <label>显示模式：</label>
      <select v-model="groupBy" class="b3-select">
        <option value="hierarchy">层级结构</option>
        <option value="color">按颜色</option>
        <option value="page">按页码</option>
      </select>
    </div>

    <!-- 标注列表 -->
    <div class="list-body">
      <div v-if="loading" class="loading-tip">
        <div class="b3-spin"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="annotations.length === 0" class="empty-tip">
        <span class="empty-icon">📭</span>
        <span>暂无标注</span>
        <span class="hint">在PDF中选择文本并高亮，标注会自动显示在这里</span>
      </div>

      <div v-else class="markdown-preview">
        <template v-for="(ann, index) in sortedAnnotations" :key="ann.id">
          <!-- 标题级别 -->
          <div
            v-if="ann.level && ann.level !== 'text' && !ann.isImage"
            class="md-heading"
            :class="`md-${ann.level}`"
            @click="handleClick(ann)"
          >
            <span class="md-prefix">{{ getLevelPrefix(ann.level) }}</span>
            <span class="md-heading-text">{{ ann.text }}</span>
            <span class="md-actions">
              <button @click.stop="editAnnotation(ann)" title="编辑">✏️</button>
              <button @click.stop="deleteAnnotation(ann)" title="删除">🗑️</button>
            </span>
          </div>

          <!-- 图片标注 -->
          <div
            v-else-if="ann.isImage"
            class="md-image-block"
            @click="handleClick(ann)"
          >
            <img 
              v-if="ann.imagePath && imageStatus[ann.id] !== 'error'" 
              :src="getImageUrl(ann.imagePath)" 
              class="md-image"
              @load="handleImageLoad(ann.id)"
              @error="handleImageError($event, ann)"
            />
            <div v-else class="md-image-error">📷 图片加载失败</div>
            <span class="md-actions">
              <button @click.stop="editAnnotation(ann)" title="编辑">✏️</button>
              <button @click.stop="deleteAnnotation(ann)" title="删除">🗑️</button>
            </span>
          </div>

          <!-- 正文标注 -->
          <div
            v-else-if="ann.text"
            class="md-paragraph"
            @click="handleClick(ann)"
          >
            <div class="md-text" :class="`color-${ann.color}`">{{ ann.text }}</div>
            <div v-if="ann.note" class="md-note">💡 {{ ann.note }}</div>
            <span class="md-actions">
              <button @click.stop="editAnnotation(ann)" title="编辑">✏️</button>
              <button @click.stop="deleteAnnotation(ann)" title="删除">🗑️</button>
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import type { PDFAnnotation, AnnotationColor, AnnotationGroup, AnnotationLevel } from '../types/annotaion';
import { ANNOTATION_LEVELS } from '../types/annotaion';
import { deleteAnnotation as deleteAnnotationApi } from '../api/annotationApi';
import { generateMarkdown } from '../utils/markdownGenerator';

const props = defineProps<{
  annotations: PDFAnnotation[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void;
  (e: 'annotation-edit', annotation: PDFAnnotation): void;
  (e: 'refresh'): void;
}>();

const groupBy = ref<'hierarchy' | 'color' | 'page'>('hierarchy');

// 图片加载状态: 'loading' | 'loaded' | 'error'
const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>({});

// 颜色到十六进制的映射
const COLOR_HEX: Record<AnnotationColor, string> = {
  red: '#ff6b6b',
  yellow: '#ffd93d',
  green: '#6bcb77',
  blue: '#4d96ff',
  purple: '#9b59b6'
};

const getColorHex = (color: AnnotationColor) => COLOR_HEX[color];

// 获取图片URL
const getImageUrl = (imagePath: string): string => {
  // 动态获取思源内核地址
  let kernelBase = "http://127.0.0.1:6806";
  if ((window as any).siyuan?.config?.system?.kernelAddr) {
    kernelBase = (window as any).siyuan.config.system.kernelAddr;
  }
  
  // 处理路径格式
  let path = imagePath;
  if (path.startsWith('/data/')) {
    path = path.slice(6); // 移除 /data/ 前缀
  }
  
  // 使用 assets 静态资源路径
  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`;
  }
  
  // 使用 getFile API 获取文件
  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent(path)}`;
};

// 图片加载错误处理
const handleImageError = (e: Event, ann: PDFAnnotation) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  imageStatus[ann.id] = 'error';
};

// 图片加载成功
const handleImageLoad = (annId: string) => {
  imageStatus[annId] = 'loaded';
};

// 获取级别标签
const getLevelLabel = (level: AnnotationLevel): string => {
  const found = ANNOTATION_LEVELS.find(l => l.value === level);
  return found ? found.label : '';
};

// 获取级别前缀（markdown格式）
const getLevelPrefix = (level: AnnotationLevel): string => {
  const found = ANNOTATION_LEVELS.find(l => l.value === level);
  return found ? found.prefix : '';
};

// 排序后的标注（按页码+创建时间）
const sortedAnnotations = computed<PDFAnnotation[]>(() => {
  return [...props.annotations].sort((a, b) => {
    // 先按页码排序
    if (a.page !== b.page) return a.page - b.page;
    // 同页按创建时间排序
    return a.created - b.created;
  });
});

// 分组标注
const groupedAnnotations = computed<AnnotationGroup[]>(() => {
  const groups: AnnotationGroup[] = [];
  const groupMap = new Map<string, PDFAnnotation[]>();

  if (groupBy.value === 'hierarchy') {
    // 层级结构模式：按创建时间排序，保持文档阅读顺序
    const sorted = [...props.annotations].sort((a, b) => {
      // 先按页码排序
      if (a.page !== b.page) return a.page - b.page;
      // 同页按创建时间排序
      return a.created - b.created;
    });
    
    return [{
      title: '',
      annotations: sorted
    }];
  }

  // 分组
  for (const ann of props.annotations) {
    let key: string;
    let title: string;

    if (groupBy.value === 'color') {
      key = ann.color;
      title = getColorLabel(ann.color);
    } else {
      key = `page-${ann.page}`;
      title = `第 ${ann.page} 页`;
    }

    const group = groupMap.get(key) || [];
    group.push(ann);
    groupMap.set(key, group);
  }

  // 转换为数组
  for (const [key, items] of groupMap) {
    let title: string;

    if (groupBy.value === 'color') {
      title = getColorLabel(key as AnnotationColor);
    } else {
      const pageNum = parseInt(key.replace('page-', ''));
      title = `第 ${pageNum} 页`;
    }

    groups.push({
      title,
      color: groupBy.value === 'color' ? key as AnnotationColor : undefined,
      page: groupBy.value === 'page' ? parseInt(key.replace('page-', '')) : undefined,
      annotations: items.sort((a, b) => a.created - b.created)
    });
  }

  // 排序
  if (groupBy.value === 'color') {
    const colorOrder: AnnotationColor[] = ['red', 'green', 'blue', 'yellow', 'purple'];
    groups.sort((a, b) => colorOrder.indexOf(a.color!) - colorOrder.indexOf(b.color!));
  } else if (groupBy.value === 'page') {
    groups.sort((a, b) => a.page! - b.page!);
  }

  return groups;
});

// 颜色标签
function getColorLabel(color: AnnotationColor): string {
  const labels: Record<AnnotationColor, string> = {
    red: '🔴 关键内容',
    yellow: '🟡 普通高亮',
    green: '🟢 重要概念',
    blue: '🔵 方法/数据',
    purple: '🟣 评论/思考'
  };
  return labels[color];
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 点击标注
const handleClick = (ann: PDFAnnotation) => {
  emit('annotation-click', ann);
};

// 编辑标注
const editAnnotation = (ann: PDFAnnotation) => {
  emit('annotation-edit', ann);
};

// 删除标注
const deleteAnnotation = async (ann: PDFAnnotation) => {
  if (!confirm('确定要删除这条标注吗？')) {
    return;
  }

  try {
    await deleteAnnotationApi(ann.blockId);
    emit('refresh');
  } catch (e) {
    console.error('删除失败:', e);
    alert('删除失败');
  }
};

// 导出Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown(props.annotations, {
    groupBy: groupBy.value,
    includeNotes: true,
    includeLocation: true
  });

  // 复制到剪贴板
  navigator.clipboard.writeText(markdown).then(() => {
    alert('Markdown已复制到剪贴板！');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败');
  });
};

// 刷新
const refresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.annotation-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--b3-theme-background);
}

.list-header {
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
}

.count-badge {
  padding: 2px 8px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 10px;
  font-size: 11px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.group-selector {
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: var(--b3-theme-surface);
}

.list-body {
  flex: 1;
  overflow: auto;
}

.loading-tip,
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 8px;
  color: var(--b3-theme-on-surface-light);
}

.empty-icon {
  font-size: 32px;
}

.hint {
  font-size: 11px;
  text-align: center;
  padding: 0 20px;
}

/* Markdown 预览样式 */
.markdown-preview {
  padding: 16px;
  line-height: 1.8;
}

.md-heading {
  position: relative;
  padding: 8px 0;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
  padding-right: 60px;
}

.md-heading:hover {
  background: var(--b3-theme-surface-light);
}

.md-heading:hover .md-actions {
  opacity: 1;
}

.md-prefix {
  color: var(--b3-theme-primary);
  margin-right: 4px;
  font-weight: bold;
}

.md-heading-text {
  font-weight: bold;
  color: var(--b3-theme-on-background);
}

.md-title {
  font-size: 20px;
  padding: 12px 0;
  border-bottom: 2px solid var(--b3-theme-primary);
  margin-bottom: 16px;
}

.md-title .md-heading-text {
  font-size: 20px;
}

.md-h1 {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--b3-border-color);
}

.md-h1 .md-heading-text {
  font-size: 18px;
}

.md-h2 {
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--b3-theme-primary);
}

.md-h2 .md-heading-text {
  font-size: 16px;
}

.md-h3 {
  font-size: 15px;
  margin-top: 12px;
  margin-bottom: 6px;
  padding-left: 16px;
}

.md-h3 .md-heading-text {
  font-size: 15px;
}

.md-h4 {
  font-size: 14px;
  margin-top: 10px;
  margin-bottom: 4px;
  padding-left: 24px;
}

.md-h4 .md-heading-text {
  font-size: 14px;
}

.md-h5 {
  font-size: 13px;
  margin-top: 8px;
  margin-bottom: 4px;
  padding-left: 32px;
}

.md-h5 .md-heading-text {
  font-size: 13px;
}

.md-paragraph {
  position: relative;
  padding: 6px 60px 6px 40px;
  margin: 4px 0;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}

.md-paragraph::before {
  content: '›';
  position: absolute;
  left: 20px;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
}

.md-paragraph:hover {
  background: var(--b3-theme-surface-light);
}

.md-paragraph:hover .md-actions {
  opacity: 1;
}

.md-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--b3-theme-on-background);
  word-break: break-word;
}

.md-text.color-red {
  border-left: 3px solid #ff6b6b;
  padding-left: 8px;
}

.md-text.color-yellow {
  border-left: 3px solid #ffd93d;
  padding-left: 8px;
}

.md-text.color-green {
  border-left: 3px solid #6bcb77;
  padding-left: 8px;
}

.md-text.color-blue {
  border-left: 3px solid #4d96ff;
  padding-left: 8px;
}

.md-text.color-purple {
  border-left: 3px solid #9b59b6;
  padding-left: 8px;
}

.md-note {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--b3-theme-surface-light);
  border-radius: 4px;
}

.md-image-block {
  position: relative;
  padding: 8px 0;
  margin: 8px 0;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
  padding-right: 60px;
}

.md-image-block:hover {
  background: var(--b3-theme-surface-light);
}

.md-image-block:hover .md-actions {
  opacity: 1;
}

.md-image {
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.md-image-error {
  width: 100%;
  height: 80px;
  background: var(--b3-theme-surface-light);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface-light);
}

.md-actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.md-actions button {
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.md-actions button:hover {
  background: var(--b3-theme-primary-light);
}
</style>
