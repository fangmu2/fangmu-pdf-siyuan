<template>
  <div class="pdf-asset-selector">
    <div class="selector-row">
      <label>选择已上传到思源的 PDF：</label>
      <select v-model="selectedPath" class="b3-select fn__block">
        <option value="" disabled>请选择 PDF 文件</option>
        <option
          v-for="file in files"
          :key="file.name"
          :value="`/data/assets/${file.name}`"
        >
          {{ file.name }}
        </option>
      </select>
      <button
        class="b3-button b3-button--outline"
        @click="handleRefresh"
        title="刷新列表"
      >
        <svg><use xlink:href="#iconRefresh"></use></svg>
      </button>
    </div>

    <div v-if="loading" class="b3-spin fn__center" style="margin-top: 16px;">
      正在加载 PDF 列表...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { readDir, FileInfo } from "../api/siyuanApi";

const emit = defineEmits<{
  (e: "select", path: string): void;
}>();

const files = ref<FileInfo[]>([]);
const selectedPath = ref("");
const loading = ref(false);

const loadAssets = async () => {
  loading.value = true;
  try {
    // 列出 data/assets 目录
    const list = await readDir("/data/assets");
    // 只保留 .pdf 文件
    files.value = list.filter(f => !f.isDir && f.name.toLowerCase().endsWith(".pdf"));
  } catch (e) {
    console.error("读取 assets 失败", e);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadAssets();
};

// 自动触发选择事件
const onSelect = () => {
  if (selectedPath.value) {
    emit("select", selectedPath.value);
  }
};

onMounted(() => {
  loadAssets();
});
</script>

<style scoped>
.pdf-asset-selector {
  padding: 12px 0;
}
.selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
