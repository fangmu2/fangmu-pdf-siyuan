<template>
  <div
    v-if="visible"
    class="concept-map-settings"
  >
    <!-- 预设选择 -->
    <div class="preset-section">
      <h3 class="section-title">
        🎨 预设配置
      </h3>
      <div class="preset-buttons">
        <button
          v-for="preset in presets"
          :key="preset.name"
          class="preset-btn"
          :class="{ active: currentPreset === preset.name }"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- 配置滑块 -->
    <div class="config-section">
      <h3 class="section-title">
        ⚙️ 参数调整
      </h3>

      <div
        v-for="(desc, key) in configDescriptions"
        :key="key"
        class="config-item"
      >
        <div class="config-header">
          <span class="config-label">{{ desc.label }}</span>
          <span class="config-value">
            {{ localConfig[key as keyof ConceptMapConfig] }}{{ desc.unit }}
          </span>
        </div>
        <p class="config-description">
          {{ desc.description }}
        </p>
        <input
          type="range"
          class="config-slider"
          :min="desc.min"
          :max="desc.max"
          :step="desc.step"
          :value="localConfig[key as keyof ConceptMapConfig]"
          @input="handleConfigChange(key as keyof ConceptMapConfig, Number(($event.target as HTMLInputElement).value))"
        />
        <div class="slider-labels">
          <span>{{ desc.min }}</span>
          <span>{{ desc.max }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="config-actions">
      <button
        class="btn-primary"
        :disabled="isLayoutInProgress"
        @click="handleApplyLayout"
      >
        {{ isLayoutInProgress ? '🔄 布局中...' : '✨ 重新布局' }}
      </button>
      <button
        class="btn-secondary"
        @click="handlePauseResume"
      >
        ⏸️ 暂停/继续
      </button>
      <button
        class="btn-reset"
        @click="handleReset"
      >
        🔄 重置配置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 概念图布局配置面板
 * 提供力导向布局参数调整功能
 */

import type { ConceptMapConfig } from '@/utils/conceptMapLayout'
import {
  computed,
  ref,
  watch,
} from 'vue'

// Props
interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 当前配置 */
  config?: Partial<ConceptMapConfig>
  /** 是否正在布局 */
  isLayoutInProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  isLayoutInProgress: false,
})

const emit = defineEmits<Emits>()

// Emit
interface Emits {
  (e: 'config-change', config: ConceptMapConfig): void
  (e: 'apply-layout'): void
  (e: 'pause-resume'): void
  (e: 'reset-config'): void
}

// 配置默认值
const defaultConfig: ConceptMapConfig = {
  repulsion: 500,
  springLength: 100,
  springStrength: 0.1,
  damping: 0.9,
  maxIterations: 300,
  canvasWidth: 2000,
  canvasHeight: 2000,
}

// 本地配置状态
const localConfig = ref<ConceptMapConfig>({
  ...defaultConfig,
  ...props.config,
})

// 配置项说明
const configDescriptions = {
  repulsion: {
    label: '排斥力',
    description: '节点之间的排斥强度，值越大节点分布越稀疏',
    min: 100,
    max: 1000,
    step: 50,
    unit: '',
  },
  springLength: {
    label: '弹簧长度',
    description: '相连节点之间的理想距离',
    min: 50,
    max: 300,
    step: 10,
    unit: 'px',
  },
  springStrength: {
    label: '弹簧强度',
    description: '弹簧的弹性系数，值越大节点拉近/推远越快',
    min: 0.01,
    max: 0.5,
    step: 0.01,
    unit: '',
  },
  damping: {
    label: '阻尼',
    description: '速度衰减系数，值越大运动越平缓',
    min: 0.5,
    max: 0.99,
    step: 0.01,
    unit: '',
  },
  maxIterations: {
    label: '迭代次数',
    description: '力导向计算的最大迭代次数，值越大布局越精确但越慢',
    min: 100,
    max: 1000,
    step: 50,
    unit: '次',
  },
}

// 预设配置
const presets = [
  {
    name: '默认',
    config: { ...defaultConfig },
  },
  {
    name: '稀疏分布',
    config: {
      ...defaultConfig,
      repulsion: 800,
      springLength: 150,
    },
  },
  {
    name: '紧密聚类',
    config: {
      ...defaultConfig,
      repulsion: 300,
      springLength: 80,
      springStrength: 0.2,
    },
  },
  {
    name: '快速布局',
    config: {
      ...defaultConfig,
      maxIterations: 150,
      damping: 0.85,
    },
  },
  {
    name: '精确布局',
    config: {
      ...defaultConfig,
      maxIterations: 500,
      damping: 0.95,
    },
  },
]

// 计算属性
const currentPreset = computed(() => {
  const index = presets.findIndex((preset) =>
    preset.config.repulsion === localConfig.value.repulsion
    && preset.config.springLength === localConfig.value.springLength
    && preset.config.springStrength === localConfig.value.springStrength
    && preset.config.damping === localConfig.value.damping
    && preset.config.maxIterations === localConfig.value.maxIterations,
  )
  return index >= 0 ? presets[index].name : '自定义'
})

// 处理配置变更
function handleConfigChange(key: keyof ConceptMapConfig, value: number): void {
  localConfig.value[key] = value
  emit('config-change', localConfig.value)
}

// 应用预设
function applyPreset(preset: typeof presets[0]): void {
  localConfig.value = { ...preset.config }
  emit('config-change', localConfig.value)
}

// 重置配置
function handleReset(): void {
  localConfig.value = { ...defaultConfig }
  emit('config-change', localConfig.value)
  emit('reset-config')
}

// 应用布局
function handleApplyLayout(): void {
  emit('apply-layout')
}

// 暂停/继续
function handlePauseResume(): void {
  emit('pause-resume')
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    localConfig.value = {
      ...defaultConfig,
      ...newConfig,
    }
  }
}, { deep: true })
</script>

<style scoped>
.concept-map-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--siyuan-bg, #fff);
  height: 100%;
  overflow-y: auto;
}

/* 预设区域 */
.preset-section {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  padding: 6px 12px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--siyuan-border, #e0e0e0);
}

.preset-btn.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-color: var(--siyuan-primary, #409eff);
}

/* 配置区域 */
.config-section {
  flex: 1;
}

.config-item {
  margin-bottom: 20px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.config-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
}

.config-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--siyuan-primary, #409eff);
  min-width: 60px;
  text-align: right;
}

.config-description {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
  line-height: 1.4;
}

/* 滑块 */
.config-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--siyuan-border, #e0e0e0);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.config-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--siyuan-primary, #409eff);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.config-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.config-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--siyuan-primary, #409eff);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.config-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: var(--siyuan-secondary-text, #999);
}

/* 操作按钮 */
.config-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.btn-primary {
  padding: 10px 16px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--siyuan-primary-hover, #66b1ff);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 16px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--siyuan-border, #e0e0e0);
}

.btn-reset {
  padding: 10px 16px;
  background: transparent;
  color: var(--siyuan-secondary-text, #666);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--siyuan-error-bg, #ffe6e6);
  color: var(--siyuan-error, #f56c6c);
  border-color: var(--siyuan-error, #f56c6c);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .concept-map-settings {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .section-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .preset-btn {
    background: #2d2d2d;
    color: #e0e0e0;
    border-color: #444;
  }

  .preset-btn:hover {
    background: #3d3d3d;
  }

  .config-description {
    color: #999;
  }

  .slider-labels span {
    color: #666;
  }

  .btn-secondary {
    background: #2d2d2d;
    color: #e0e0e0;
    border-color: #444;
  }

  .btn-secondary:hover {
    background: #3d3d3d;
  }
}
</style>
