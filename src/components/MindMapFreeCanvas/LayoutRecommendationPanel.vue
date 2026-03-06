<template>
  <div
    v-if="visible"
    class="recommendation-panel-overlay"
    @click="close"
  >
    <div
      class="recommendation-panel"
      @click.stop
    >
      <!-- 面板头部 -->
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="title-icon">💡</span>
          布局建议
        </h3>
        <div class="header-actions">
          <button
            v-if="hasAnalyzed"
            class="header-btn"
            title="重新分析"
            @click="reanalyze"
          >
            🔄 重新分析
          </button>
          <button
            class="header-btn close-btn"
            @click="close"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 分析结果摘要 -->
      <div
        v-if="analysis && hasAnalyzed"
        class="analysis-result"
      >
        <div class="analysis-summary">
          <div class="summary-item">
            <span class="summary-icon">📊</span>
            <span class="summary-value">{{ analysis.nodeCount }}</span>
            <span class="summary-label">个节点</span>
          </div>
          <div class="summary-item">
            <span class="summary-icon">🌲</span>
            <span class="summary-value">{{ analysis.maxDepth }}</span>
            <span class="summary-label">层深度</span>
          </div>
          <div class="summary-item">
            <span class="summary-icon">🔗</span>
            <span class="summary-value">{{ analysis.avgConnections.toFixed(2) }}</span>
            <span class="summary-label">平均连接</span>
          </div>
          <div class="summary-item">
            <span class="summary-icon">🎯</span>
            <span class="summary-value">{{ analysis.clusterCount }}</span>
            <span class="summary-label">个聚类</span>
          </div>
        </div>
        <div
          v-if="analysis.hasTimestamps"
          class="timestamp-badge"
        >
          📅 包含时间信息
        </div>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="isAnalyzing"
        class="loading-state"
      >
        <div class="loading-spinner"></div>
        <p class="loading-text">
          正在分析图结构...
        </p>
      </div>

      <!-- 推荐列表 -->
      <div
        v-if="hasAnalyzed && !isAnalyzing"
        class="recommendations"
      >
        <div
          v-for="(rec, index) in recommendations"
          :key="rec.layoutType"
          class="recommendation-card"
          :class="{ 'top-recommendation': index === 0 }"
          @click="applyLayout(rec.layoutType)"
        >
          <!-- 推荐头部 -->
          <div class="rec-header">
            <div class="rec-icon">
              {{ getLayoutIcon(rec.layoutType) }}
            </div>
            <div class="rec-info">
              <div class="rec-name">
                {{ getLayoutName(rec.layoutType) }}
              </div>
              <div class="rec-reason">
                {{ rec.reason }}
              </div>
            </div>
            <div
              v-if="index === 0"
              class="badge"
            >
              推荐
            </div>
          </div>

          <!-- 置信度条 -->
          <div class="rec-confidence-bar">
            <div
              class="confidence-fill"
              :style="{ width: `${rec.confidence * 100}%` }"
              :class="{
                high: rec.confidence >= 0.8,
                medium: rec.confidence >= 0.5 && rec.confidence < 0.8,
                low: rec.confidence < 0.5,
              }"
            ></div>
            <span class="confidence-text">{{ (rec.confidence * 100).toFixed(0) }}%</span>
          </div>

          <!-- 推荐得分 -->
          <div class="rec-score">
            推荐指数：<span class="score-value">{{ rec.score }}</span>
          </div>
        </div>
      </div>

      <!-- 应用推荐按钮 -->
      <div
        v-if="topRecommendation && hasAnalyzed"
        class="panel-footer"
      >
        <button
          class="apply-btn"
          @click="applyLayout(topRecommendation.layoutType)"
        >
          应用推荐布局（{{ getLayoutName(topRecommendation.layoutType) }}）
        </button>
      </div>

      <!-- 无数据提示 -->
      <div
        v-if="hasAnalyzed && recommendations.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          📊
        </div>
        <p class="empty-text">
          暂无推荐布局
        </p>
        <p class="empty-hint">
          节点数量较少，建议使用自由布局
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 布局推荐面板组件
 * 提供智能布局推荐功能，根据图结构分析推荐最佳布局
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'
import type {
  LayoutAnalysis,
  LayoutRecommendation,
} from '@/utils/layoutAnalyzer'
import {
  computed,
  ref,
  watch,
} from 'vue'
import {
  analyzeGraph,
  getLayoutIcon,
  getLayoutName,
  recommendLayout,
} from '@/utils/layoutAnalyzer'

interface Props {
  /** 是否可见 */
  visible: boolean
  /** 节点列表 */
  nodes: FreeMindMapNode[]
  /** 连线列表 */
  edges: FreeMindMapEdge[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'apply-layout', layoutType: string): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

/** 布局分析结果 */
const analysis = ref<LayoutAnalysis | null>(null)

/** 布局推荐列表 */
const recommendations = ref<LayoutRecommendation[]>([])

/** 是否正在分析 */
const isAnalyzing = ref(false)

/** 是否已分析 */
const hasAnalyzed = ref(false)

// 监听可见性变化，自动分析
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !hasAnalyzed.value) {
      analyze()
    }
  },
)

// 监听节点和连线变化，重置分析状态
watch(
  () => [props.nodes.length, props.edges.length],
  () => {
    hasAnalyzed.value = false
    analysis.value = null
    recommendations.value = []
  },
)

/** 获取顶级推荐 */
const topRecommendation = computed(() => recommendations.value[0])

/**
 * 分析图结构并生成推荐
 */
function analyze() {
  isAnalyzing.value = true

  // 模拟异步分析（实际计算很快）
  setTimeout(() => {
    analysis.value = analyzeGraph(props.nodes, props.edges)
    recommendations.value = recommendLayout(analysis.value)
    hasAnalyzed.value = true
    isAnalyzing.value = false
  }, 100)
}

/**
 * 应用推荐布局
 */
function applyLayout(layoutType: string) {
  emit('apply-layout', layoutType)
  emit('update:visible', false)
}

/**
 * 重新分析
 */
function reanalyze() {
  hasAnalyzed.value = false
  analyze()
}

/**
 * 关闭面板
 */
function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
.recommendation-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.recommendation-panel {
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
  margin: 0;
}

.title-icon {
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  padding: 6px 12px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: var(--siyuan-hover-bg, #ececec);
  border-color: var(--siyuan-primary, #409eff);
}

.close-btn {
  min-width: 32px;
  padding: 6px 10px;
}

/* 分析结果 */
.analysis-result {
  padding: 16px 20px;
  background: var(--siyuan-bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.analysis-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-icon {
  font-size: 16px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--siyuan-primary, #409eff);
}

.summary-label {
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
}

.timestamp-badge {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(64, 158, 255, 0.1);
  color: var(--siyuan-primary, #409eff);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 加载状态 */
.loading-state {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--siyuan-border, #e0e0e0);
  border-top-color: var(--siyuan-primary, #409eff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--siyuan-secondary-text, #666);
  font-size: 14px;
}

/* 推荐列表 */
.recommendations {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

.recommendation-card {
  padding: 14px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  transition: all 0.2s;
}

.recommendation-card:hover {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f7ff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.top-recommendation {
  border-color: var(--siyuan-primary, #409eff);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05), rgba(64, 158, 255, 0.1));
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.rec-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 8px;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
  margin-bottom: 4px;
}

.rec-reason {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  padding: 2px 8px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

/* 置信度条 */
.rec-confidence-bar {
  position: relative;
  height: 8px;
  background: var(--siyuan-bg-secondary, #f0f0f0);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.confidence-fill {
  height: 100%;
  transition: width 0.3s ease-out;
}

.confidence-fill.high {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.confidence-fill.medium {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.confidence-fill.low {
  background: linear-gradient(90deg, #69c0ff, #91d5ff);
}

.confidence-text {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--siyuan-secondary-text, #666);
}

.rec-score {
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
}

.score-value {
  font-weight: 600;
  color: var(--siyuan-primary, #409eff);
}

/* 面板底部 */
.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.apply-btn {
  width: 100%;
  padding: 12px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  background: #3a8ee6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 空状态 */
.empty-state {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.empty-hint {
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.recommendations::-webkit-scrollbar {
  width: 6px;
}

.recommendations::-webkit-scrollbar-track {
  background: transparent;
}

.recommendations::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 3px;
}

.recommendations::-webkit-scrollbar-thumb:hover {
  background: var(--siyuan-secondary-text, #999);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .recommendation-panel {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .panel-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .analysis-result {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .summary-label,
  .rec-reason,
  .rec-score,
  .loading-text,
  .empty-hint {
    color: var(--siyuan-secondary-text, #999);
  }

  .summary-value,
  .score-value {
    color: var(--siyuan-primary, #409eff);
  }

  .recommendation-card {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .recommendation-card:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .rec-icon {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .rec-name {
    color: var(--siyuan-text, #e0e0e0);
  }

  .confidence-text {
    color: var(--siyuan-secondary-text, #999);
  }

  .top-recommendation {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.15));
  }
}
</style>
