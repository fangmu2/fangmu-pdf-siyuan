<template>
  <div class="pdf-thumbnails" :class="{ 'vertical': scrollMode === 'vertical' }">
    <div
      v-for="page in visiblePages"
      :key="page.num"
      :class="['thumbnail-item', { active: currentPage === page.num }]"
      @click="$emit('page-click', page.num)"
    >
      <div class="thumbnail-number">{{ page.num }}</div>
      <div
        ref="thumbnailRefs"
        class="thumbnail-canvas"
        :style="{
          width: `${thumbnailWidth}px`,
          height: `${thumbnailHeight}px`
        }"
      >
        <canvas
          v-if="page.loaded"
          :ref="el => setCanvasRef(el, page.num)"
          :width="thumbnailWidth * window.devicePixelRatio"
          :height="thumbnailHeight * window.devicePixelRatio"
          :style="{
            width: `${thumbnailWidth}px`,
            height: `${thumbnailHeight}px`
          }"
        ></canvas>
        <div v-else class="thumbnail-loading">
          <span>加载中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface Props {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  scrollMode: 'vertical' | 'horizontal';
  thumbnailScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  thumbnailScale: 0.2
});

const emit = defineEmits<{
  (e: 'page-click', pageNum: number): void;
}>();

const thumbnailRefs = ref<HTMLElement[]>([]);
const canvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map());
const renderedPages = ref<Set<number>>(new Set());

const thumbnailWidth = 120;
const thumbnailHeight = 160;

// 计算可见页面（虚拟滚动）
const visiblePages = computed(() => {
  if (!props.pdfDocument) return [];

  const totalPages = props.pdfDocument.numPages;
  const pages = [];

  // 加载当前页附近的页面
  const range = 5;
  const start = Math.max(1, props.currentPage - range);
  const end = Math.min(totalPages, props.currentPage + range);

  for (let i = start; i <= end; i++) {
    pages.push({
      num: i,
      loaded: renderedPages.value.has(i)
    });
  }

  return pages;
});

const setCanvasRef = (el: HTMLCanvasElement | null, pageNum: number) => {
  if (el) {
    canvasRefs.value.set(pageNum, el);
    renderThumbnail(pageNum);
  }
};

const renderThumbnail = async (pageNum: number) => {
  if (!props.pdfDocument || renderedPages.value.has(pageNum)) return;

  try {
    const page = await props.pdfDocument.getPage(pageNum);
    const canvas = canvasRefs.value.get(pageNum);

    if (!canvas) return;

    const viewport = page.getViewport({ scale: props.thumbnailScale });
    const scale = window.devicePixelRatio || 1;

    canvas.width = viewport.width * scale;
    canvas.height = viewport.height * scale;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    renderedPages.value.add(pageNum);
  } catch (error) {
    console.error(`Failed to render thumbnail for page ${pageNum}:`, error);
  }
};

// 监听当前页变化
watch(() => props.currentPage, () => {
  // 预加载附近页面
  visiblePages.value.forEach(page => {
    if (!page.loaded) {
      renderThumbnail(page.num);
    }
  });
}, { immediate: true });

// 监听 PDF 文档变化
watch(() => props.pdfDocument, () => {
  if (props.pdfDocument) {
    renderedPages.value.clear();
    canvasRefs.value.clear();
    // 加载初始页面
    nextTick(() => {
      renderThumbnail(props.currentPage);
    });
  }
}, { immediate: true });

onMounted(() => {
  if (props.pdfDocument) {
    renderThumbnail(props.currentPage);
  }
});
</script>

<style scoped lang="scss">
.pdf-thumbnails {
  display: flex;
  gap: 12px;
  padding: 12px;
  overflow: auto;
  background: var(--b3-theme-background);

  &.vertical {
    flex-direction: column;
  }
}

.thumbnail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface);
  }

  &.active {
    background: var(--b3-theme-primary-light);
    border: 2px solid var(--b3-theme-primary);
  }
}

.thumbnail-number {
  font-size: 11px;
  color: var(--b3-theme-text-secondary);
}

.thumbnail-canvas {
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-loading {
  font-size: 11px;
  color: var(--b3-theme-text-secondary);
}

canvas {
  display: block;
}
</style>
