<template>
  <div class="pdf-mindmap-container">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-title">PDF 思维导图摘录</div>
      <div class="header-actions">
        <button class="b3-button b3-button--outline" @click="handleClose">
          <svg><use xlink:href="#iconClose"></use></svg>
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-item">
        <button
          class="b3-button b3-button--outline"
          @click="triggerFileSelect"
          :disabled="uploading"
        >
          {{ uploading ? '正在导入...' : '选择本地 PDF 并导入' }}
        </button>
        <span v-if="pdfPath" class="file-path">已加载: {{ getFileName(pdfPath) }}</span>
      </div>
    </div>

    <!-- PDF 预览区域 -->
    <div class="panel-body">
      <PDFViewer
        v-if="pdfPath"
        :pdf-path="pdfPath"
        :current-page="currentPage"
        @loaded="handlePdfLoaded"
      />
      <div v-else class="welcome-message">
        <h2>📄 请选择 PDF 文件</h2>
        <p>点击上方按钮选择本地 PDF 文件。</p>
        <p>文件将自动导入到思源资源目录。</p>
      </div>
    </div>

    <!-- 隐藏的 file input -->
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      style="display: none;"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Plugin } from "siyuan";
import PDFViewer from "./components/PDFViewer.vue";
import { uploadFileToAssets } from "./api/siyuanApi"; // 导入上传方法

const props = defineProps<{ plugin: Plugin }>();

const pdfPath = ref("");
const currentPage = ref(1);
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);

// 触发文件选择框
const triggerFileSelect = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;

  try {
    console.log(`开始导入文件: ${file.name}`);

    // 1. 调用 API 上传到思源 assets
    const savedPath = await uploadFileToAssets(file);

    // 2. 更新状态，触发 PDFViewer 加载
    pdfPath.value = savedPath;
    currentPage.value = 1; // 重置页码

    console.log(`导入成功，路径: ${savedPath}`);
  } catch (error) {
    console.error("导入失败", error);
    alert("导入失败，请查看控制台日志。");
  } finally {
    uploading.value = false;
    // 清空 input value，允许重复选择同名文件
    if (target) target.value = "";
  }
};

// 提取文件名用于显示
const getFileName = (path: string) => {
  return path.split("/").pop() || path;
};

const handleClose = () => {
  (props.plugin as any).closePanel();
};

// 接收 PDFViewer 加载完成的信号
const handlePdfLoaded = (numPages: number) => {
  console.log(`PDF 加载完成，共 ${numPages} 页`);
  // 这里以后可以用来初始化总页码等
};
</script>

<style scoped>
/* 样式保持不变 */
.toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background-color: var(--b3-theme-surface);
}
.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.file-path {
  margin-left: 8px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
