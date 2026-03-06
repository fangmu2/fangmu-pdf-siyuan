<template>
  <div
    v-if="visible"
    class="pdf-linkage-settings"
  >
    <!-- 标签页 -->
    <div class="panel-tabs">
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'config' }]"
        @click="activeTab = 'config'"
      >
        ⚙️ 配置
      </button>
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'highlight' }]"
        @click="activeTab = 'highlight'"
      >
        ✨ 高亮
        <span
          v-if="hasHighlightedNodes"
          class="badge"
        >{{ highlightedNodes.size }}</span>
      </button>
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'color' }]"
        @click="activeTab = 'color'"
      >
        🎨 颜色映射
        <span
          v-if="hasColorMappings"
          class="badge"
        >{{ colorMappings.size }}</span>
      </button>
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'layout' }]"
        @click="activeTab = 'layout'"
      >
        💡 布局建议
        <span
          v-if="hasLayoutSuggestions"
          class="badge"
        >{{ layoutSuggestions.length }}</span>
      </button>
    </div>

    <!-- 配置面板 -->
    <div
      v-if="activeTab === 'config'"
      class="panel-content"
    >
      <div class="config-list">
        <div
          v-for="(description, key) in configDescriptions"
          :key="key"
          class="config-item"
        >
          <div class="config-info">
            <span class="config-name">{{ key.replace('enable', '') }}</span>
            <p class="config-description">
              {{ description }}
            </p>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config[key as keyof typeof config.value]"
              @change="handleConfigChange(key as keyof typeof config.value)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="config-actions">
        <button
          class="btn-reset"
          @click="resetConfig"
        >
          🔄 重置配置
        </button>
      </div>
    </div>

    <!-- 高亮面板 -->
    <div
      v-if="activeTab === 'highlight'"
      class="panel-content"
    >
      <!-- 空状态 -->
      <div
        v-if="!hasHighlightedNodes"
        class="empty-state"
      >
        <span class="empty-icon">✨</span>
        <p>暂无高亮节点</p>
        <p class="empty-hint">
          在 PDF 中选中文本或创建标注时，对应节点会在此显示
        </p>
      </div>

      <!-- 高亮列表 -->
      <div
        v-else
        class="highlight-list"
      >
        <div class="list-header">
          <span>当前高亮节点</span>
          <button
            class="btn-clear"
            @click="handleClearHighlights"
          >
            清除全部
          </button>
        </div>
        <div
          v-for="[nodeId, state] in highlightedNodes"
          :key="nodeId"
          class="highlight-item"
          :style="{ borderLeftColor: state.color }"
        >
          <div class="highlight-info">
            <span
              class="highlight-color"
              :style="{ backgroundColor: state.color }"
            ></span>
            <span class="highlight-node-id">{{ nodeId }}</span>
            <span class="highlight-reason">{{ state.reason }}</span>
          </div>
          <div class="highlight-actions">
            <button
              class="btn-icon"
              title="取消高亮"
              @click="unhighlightNode(nodeId)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 颜色映射面板 -->
    <div
      v-if="activeTab === 'color'"
      class="panel-content"
    >
      <!-- 空状态 -->
      <div
        v-if="!hasColorMappings"
        class="empty-state"
      >
        <span class="empty-icon">🎨</span>
        <p>暂无颜色映射</p>
        <p class="empty-hint">
          PDF 标注颜色会自动同步到导图节点
        </p>
      </div>

      <!-- 颜色映射列表 -->
      <div
        v-else
        class="color-mapping-list"
      >
        <div class="list-header">
          <span>颜色映射</span>
          <button
            class="btn-clear"
            @click="handleClearColorMappings"
          >
            清除全部
          </button>
        </div>
        <div
          v-for="[annotationId, mapping] in colorMappings"
          :key="annotationId"
          class="color-mapping-item"
        >
          <div class="color-preview">
            <span
              class="color-box"
              :style="{ backgroundColor: mapping.annotationColor }"
            ></span>
            <span class="color-value">{{ mapping.annotationColor }}</span>
          </div>
          <span class="arrow">→</span>
          <div class="color-preview">
            <span
              class="color-box"
              :style="{ backgroundColor: mapping.nodeBackgroundColor || mapping.nodeBorderColor }"
            ></span>
            <span class="color-value">{{ mapping.nodeBackgroundColor || mapping.nodeBorderColor }}</span>
          </div>
          <span class="mapping-node-id">{{ mapping.nodeId }}</span>
        </div>
      </div>
    </div>

    <!-- 布局建议面板 -->
    <div
      v-if="activeTab === 'layout'"
      class="panel-content"
    >
      <!-- 空状态 -->
      <div
        v-if="!hasLayoutSuggestions"
        class="empty-state"
      >
        <span class="empty-icon">💡</span>
        <p>暂无布局建议</p>
        <button
          class="btn-primary"
          @click="handleRefreshSuggestions"
        >
          刷新建议
        </button>
      </div>

      <!-- 建议列表 -->
      <div
        v-else
        class="suggestion-list"
      >
        <div
          v-for="(suggestion, index) in layoutSuggestions"
          :key="suggestion.id"
          class="suggestion-item"
        >
          <div class="suggestion-header">
            <span class="suggestion-type">{{ suggestion.type }}</span>
            <span class="suggestion-confidence">
              置信度：{{ Math.round(suggestion.confidence * 100) }}%
            </span>
          </div>
          <p class="suggestion-description">
            {{ suggestion.description }}
          </p>
          <div class="suggestion-actions">
            <button
              class="btn-primary"
              @click="handleApplySuggestion(index)"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PDF 与思维导图联动配置组件
 * 提供实时高亮同步、拖拽创建节点、智能布局建议、标注颜色映射等功能的配置
 */

import type { Ref } from 'vue'
import type {
  FreeMindMapEdge,
  FreeMindMapNode,
  PdfLinkageConfig,
} from '@/types/mindmapFree'

import {
  computed,
  ref,
  watch,
} from 'vue'
import { usePdfMindMapLinkage } from '@/composables/usePdfMindMapLinkage'

// Props
interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 节点列表（用于拖拽创建） */
  nodes?: Ref<FreeMindMapNode[]>
  /** 连线列表 */
  edges?: Ref<FreeMindMapEdge[]>
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})

const emit = defineEmits<Emits>()

// Emit
interface Emits {
  /** 配置变更 */
  (e: 'config-change', config: PdfLinkageConfig): void
  /** 节点创建 */
  (e: 'node-create', params: {
    title: string
    content: string
    type: 'textCard' | 'imageCard'
    position: { x: number, y: number }
    annotationId?: string
  }): void
}

// 使用组合式函数
const {
  config,
  updateConfig,
  resetConfig,
  highlightedNodes,
  handleTextSelection,
  handleAnnotationCreated,
  unhighlightNode,
  clearHighlights,
  handleDragStart,
  handleDragEnter,
  handleDrop,
  layoutSuggestions,
  refreshLayoutSuggestions,
  applySuggestion,
  colorMappings,
  clearColorMappings,
  setupEventListeners,
  cleanupEventListeners,
} = usePdfMindMapLinkage({
  enabled: true,
  nodes: props.nodes,
  edges: props.edges,
})

// 本地状态
const activeTab = ref<'config' | 'highlight' | 'color' | 'layout'>('config')

// 配置项说明
const configDescriptions = {
  enableRealtimeHighlight: 'PDF 选中/标注时，导图对应节点自动高亮',
  enableDragToCreate: '从 PDF 拖拽选中文本到画布自动创建节点',
  enableSmartLayout: '根据内容和 PDF 页码自动推荐节点布局',
  enableColorMapping: 'PDF 标注颜色自动同步到节点边框/背景',
  enableAutoSyncEnhanced: '批量同步、防抖处理，优化大量标注时的性能',
}

// 计算属性
const hasHighlightedNodes = computed(() => highlightedNodes.value.size > 0)
const hasColorMappings = computed(() => colorMappings.value.size > 0)
const hasLayoutSuggestions = computed(() => layoutSuggestions.value.length > 0)

// 处理配置变更
function handleConfigChange(key: keyof typeof config.value): void {
  updateConfig({
    [key]: !config.value[key],
  })
  emit('config-change', config.value)
}

// 清除高亮
function handleClearHighlights(): void {
  clearHighlights()
}

// 清除颜色映射
function handleClearColorMappings(): void {
  clearColorMappings()
}

// 刷新布局建议
function handleRefreshSuggestions(): void {
  refreshLayoutSuggestions()
}

// 应用布局建议
function handleApplySuggestion(index: number): void {
  const suggestion = layoutSuggestions.value[index]
  const updates = applySuggestion(suggestion)
  console.log('[PdfLinkageSettings] 应用布局建议:', updates)
}

// 监听配置变化
watch(config, (newConfig) => {
  emit('config-change', newConfig)
}, { deep: true })

// 暴露方法
defineExpose({
  handleTextSelection,
  handleAnnotationCreated,
  handleDragStart,
  handleDragEnter,
  handleDrop,
  setupEventListeners,
  cleanupEventListeners,
})
</script>

<style scoped>
.pdf-linkage-settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--siyuan-bg, #fff);
}

/* 标签页 */
.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  padding: 8px;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.tab-btn.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--siyuan-primary, #409eff);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.tab-btn.active .badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 配置列表 */
.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--siyuan-block-bg, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
}

.config-info {
  flex: 1;
}

.config-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  margin-bottom: 4px;
}

.config-description {
  margin: 0;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
}

/* 开关切换 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--siyuan-border, #ccc);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--siyuan-primary, #409eff);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* 配置操作 */
.config-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn-reset {
  padding: 8px 16px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--siyuan-border, #e0e0e0);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 8px;
  color: var(--siyuan-secondary-text, #666);
}

.empty-hint {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
}

/* 高亮列表 */
.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
}

.btn-clear {
  padding: 4px 12px;
  background: var(--siyuan-error-bg, #ffe6e6);
  color: var(--siyuan-error, #f56c6c);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--siyuan-error, #f56c6c);
  color: #fff;
}

.highlight-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--siyuan-block-bg, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-left: 3px solid;
  border-radius: 6px;
}

.highlight-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.highlight-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.highlight-node-id {
  font-size: 13px;
  color: var(--siyuan-text, #333);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.highlight-reason {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
  padding: 2px 6px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  border-radius: 4px;
  text-transform: capitalize;
}

.highlight-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: var(--siyuan-secondary-text, #666);
}

.btn-icon:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
  color: var(--siyuan-text, #333);
}

/* 颜色映射列表 */
.color-mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--siyuan-block-bg, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--siyuan-border, #ddd);
}

.color-value {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #666);
  font-family: monospace;
}

.arrow {
  color: var(--siyuan-secondary-text, #999);
}

.mapping-node-id {
  margin-left: auto;
  font-size: 12px;
  color: var(--siyuan-text, #333);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 建议列表 */
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  padding: 12px;
  background: var(--siyuan-block-bg, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.suggestion-type {
  display: inline-block;
  padding: 2px 8px;
  background: var(--siyuan-primary, #409eff);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  text-transform: capitalize;
}

.suggestion-confidence {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
}

.suggestion-description {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  line-height: 1.5;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

/* 按钮 */
.btn-primary {
  padding: 8px 16px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--siyuan-primary-hover, #66b1ff);
}

/* 深色主题适配 */
:deep(.dark-mode) {
  --siyuan-bg: #1e1e1e;
  --siyuan-block-bg: #2d2d2d;
  --siyuan-border: #444;
  --siyuan-hover-bg: #3d3d3d;
  --siyuan-text: #e0e0e0;
  --siyuan-secondary-text: #999;
}
</style>
