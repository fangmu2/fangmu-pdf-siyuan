<template>
  <div class="pdf-viewer-wrapper" ref="containerRef">
    <div v-if="loading" class="loading-tip">
      <div class="b3-spin"></div>
      <span>正在加载 PDF...</span>
    </div>
    <!-- 增加错误提示，避免白屏 -->
    <div v-if="error" class="error-tip">
      <span>加载失败：{{ error }}</span>
    </div>
    <canvas ref="canvasRef" class="pdf-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { loadPdfDocument, renderPage } from "../utils/pdf";
import { getFileAsBlob } from "../api/siyuanApi";

const props = defineProps<{
  pdfPath: string;   // 现在接收的是标准路径，如 /data/assets/xxx.pdf
  currentPage: number;
}>();

// 定义事件，用于通知父组件
const emit = defineEmits<{
  (e: "loaded", numPages: number): void;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLElement>();
const loading = ref(false);
const error = ref("");
let pdfDoc: any = null;

const loadPdf = async () => {
  if (!props.pdfPath || !canvasRef.value || !containerRef.value) return;

  loading.value = true;
  error.value = "";

  try {
    // 核心修复：确保路径格式正确
    let apiPath = props.pdfPath;

    // 如果传入的是 /assets/xxx.pdf (旧格式或错误格式)，自动修正为 /data/assets/xxx.pdf
    if (apiPath.startsWith("/assets/")) {
      console.warn("检测到旧格式路径，自动修正为 /data/assets/...");
      apiPath = apiPath.replace("/assets/", "/data/assets/");
    }

    // 1. 通过内核 API 获取文件 Blob
    // 这里的 apiPath 必须是 /data/assets/xxx.pdf 格式
    const blob = await getFileAsBlob(apiPath);

    // 2. 生成临时 URL 供 PDF.js 使用
    const url = URL.createObjectURL(blob);

    // 3. 加载 PDF 文档
    if (!pdfDoc || pdfDoc._path !== apiPath) {
      if (pdfDoc) {
        // 清理旧的文档对象
        pdfDoc.cleanup();
        pdfDoc.destroy();
      }
      pdfDoc = await loadPdfDocument(url);
      pdfDoc._path = apiPath; // 挂载自定义属性标记路径

      // 通知父组件总页数
      emit("loaded", pdfDoc.numPages);
    }

    // 4. 渲染当前页
    const page = await pdfDoc.getPage(props.currentPage);
    const containerWidth = containerRef.value.clientWidth;

    await renderPage(page, canvasRef.value, containerWidth);

    // 释放临时 URL
    URL.revokeObjectURL(url);

  } catch (e: any) {
    console.error("PDF 渲染失败", e);
    error.value = e.message || "未知错误";
  } finally {
    loading.value = false;
  }
};

// 监听路径或页码变化
watch([() => props.pdfPath, () => props.currentPage], () => {
  nextTick(() => loadPdf());
});

onMounted(() => {
  loadPdf();
});
</script>

<style scoped>
/* 保持原样式不变 */
.pdf-viewer-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: var(--b3-theme-background);
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 顶部对齐 */
  position: relative;
}
.loading-tip, .error-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--b3-theme-on-surface);
  z-index: 10;
}
.error-tip {
  color: var(--b3-card-error-color);
  text-align: center;
  padding: 16px;
}
.pdf-canvas {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
