<template>
  <div class="mindmap-empty-state">
    <!-- 插图画区域 -->
    <div class="empty-illustration">
      <div class="demo-card card-1">
        <div
          class="card-header"
          :style="{ background: 'var(--b3-theme-primary)' }"
        ></div>
        <div class="card-body">
          <div class="card-line line-1"></div>
          <div class="card-line line-2"></div>
        </div>
      </div>
      <div class="demo-card card-2">
        <div
          class="card-header"
          :style="{ background: 'var(--b3-theme-secondary)' }"
        ></div>
        <div class="card-body">
          <div class="card-line line-1"></div>
          <div class="card-line line-2"></div>
        </div>
      </div>
      <div class="demo-arrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>

    <!-- 标题 -->
    <h3 class="empty-title">
      从 PDF 创建思维导图
    </h3>

    <!-- 步骤说明 -->
    <div class="empty-steps">
      <div class="step">
        <span class="step-num">1</span>
        <span class="step-text">在左侧 PDF 中选择文本</span>
      </div>
      <div class="step">
        <span class="step-num">2</span>
        <span class="step-text">点击"创建标注"按钮</span>
      </div>
      <div class="step">
        <span class="step-num">3</span>
        <span class="step-text">卡片将自动出现在这里</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="empty-actions">
      <button
        class="action-btn primary"
        @click="handleAddDemoNode"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        添加示例卡片
      </button>
      <button
        class="action-btn secondary"
        @click="handleImportExisting"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        导入已有摘录
      </button>
    </div>

    <!-- 提示信息 -->
    <div class="empty-tips">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>自动同步已开启，新创建的摘录将实时显示在思维导图中</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'add-demo-node'): void
  (e: 'import-existing'): void
}

const emit = defineEmits<Emits>()

const handleAddDemoNode = () => {
  emit('add-demo-node')
}

const handleImportExisting = () => {
  emit('import-existing')
}
</script>

<style scoped lang="scss">
.mindmap-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
  background: var(--b3-theme-background);
}

.empty-illustration {
  position: relative;
  width: 200px;
  height: 140px;
  margin-bottom: 24px;
}

.demo-card {
  position: absolute;
  width: 100px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: var(--b3-theme-surface);

  &.card-1 {
    left: 0;
    top: 0;
    transform: rotate(-5deg);
  }

  &.card-2 {
    right: 0;
    top: 20px;
    transform: rotate(5deg);
  }

  .card-header {
    height: 24px;
    opacity: 0.8;
  }

  .card-body {
    padding: 8px;

    .card-line {
      height: 4px;
      background: var(--b3-border-color);
      border-radius: 2px;
      margin-bottom: 4px;

      &.line-1 {
        width: 90%;
      }

      &.line-2 {
        width: 70%;
      }
    }
  }
}

.demo-arrow {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  color: var(--b3-theme-primary);
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-primary);
}

.empty-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 240px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--b3-theme-secondary);

  .step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }

  &.primary {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);

    &:hover {
      background: var(--b3-theme-primary-light);
    }
  }

  &.secondary {
    background: var(--b3-theme-surface);
    color: var(--b3-theme-primary);
    border: 1px solid var(--b3-border-color);

    &:hover {
      background: var(--b3-theme-background);
      border-color: var(--b3-theme-primary);
    }
  }
}

.empty-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  font-size: 12px;
  color: var(--b3-theme-secondary);

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--b3-theme-primary);
  }
}
</style>
