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

    <!-- 主体内容区域 -->
    <div class="panel-body">
      <div class="welcome-message">
        <h2>🚀 欢迎使用</h2>
        <p>点击顶栏图标即可重新打开此面板。</p>
        <p>下一阶段将在这里加载 PDF 文件。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
// 引入 Plugin 类型，用于接收父组件传递的插件实例
import type { Plugin } from "siyuan";

// 定义组件属性，接收来自 index.ts 的 plugin 实例
const props = defineProps<{
  plugin: Plugin;
}>();

// 点击关闭按钮的事件处理
const handleClose = () => {
  // 通过 plugin 实例调用我们在 index.ts 中定义的关闭方法
  // 这里我们利用了 JS 的特性，直接在当前实例上调用方法
  (props.plugin as any).closePanel();
};
</script>

<style scoped>
/* 使用 Scoped CSS，确保样式只作用于当前组件 */
.pdf-mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--b3-theme-background); /* 使用思源内置的背景色变量 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header-title {
  font-weight: bold;
  color: var(--b3-theme-on-background);
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
  color: var(--b3-theme-on-background);
}

.welcome-message {
  text-align: center;
  margin-top: 50px;
}
</style>
