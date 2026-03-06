<template>
  <div
    v-if="visible"
    class="association-panel-overlay"
    @click="close"
  >
    <div
      class="association-panel"
      @click.stop
    >
      <!-- 面板头部 -->
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="title-icon">🔗</span>
          知识关联推荐
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
        v-if="hasAnalyzed"
        class="analysis-summary"
      >
        <div class="summary-item">
          <span class="summary-icon">📊</span>
          <span class="summary-value">{{ nodeCount }}</span>
          <span class="summary-label">个节点</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">💡</span>
          <span class="summary-value">{{ recommendationCount }}</span>
          <span class="summary-label">个潜在关联</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="isAnalyzing"
        class="loading-state"
      >
        <div class="loading-spinner"></div>
        <p class="loading-text">
          正在分析知识关联...
        </p>
      </div>

      <!-- 推荐列表 -->
      <div
        v-if="hasAnalyzed && !isAnalyzing"
        class="recommendation-list"
      >
        <div
          v-for="(rec, index) in recommendations"
          :key="`${rec.sourceNodeId}-${rec.targetNodeId}`"
          class="recommendation-card"
          :class="{
            'high-confidence': rec.confidence > 0.8,
            'selected': selectedRecommendations.has(`${rec.sourceNodeId}-${rec.targetNodeId}`),
          }"
        >
          <!-- 选择框 -->
          <div class="rec-checkbox">
            <input
              type="checkbox"
              :checked="selectedRecommendations.has(`${rec.sourceNodeId}-${rec.targetNodeId}`)"
              @change="toggleSelection(rec)"
            />
          </div>

          <!-- 推荐头部 -->
          <div class="rec-header">
            <span class="rec-type">
              <span class="type-icon">{{ getAssociationTypeIcon(rec.associationType) }}</span>
              {{ getAssociationTypeName(rec.associationType) }}
            </span>
            <span class="rec-confidence">{{ (rec.confidence * 100).toFixed(0) }}%</span>
          </div>

          <!-- 推荐内容 -->
          <div class="rec-content">
            <div
              class="source-node"
              :title="getNodeName(rec.sourceNodeId)"
            >
              {{ getNodeName(rec.sourceNodeId) }}
            </div>
            <div class="association-arrow">
              →
            </div>
            <div
              class="target-node"
              :title="getNodeName(rec.targetNodeId)"
            >
              {{ getNodeName(rec.targetNodeId) }}
            </div>
          </div>

          <!-- 推荐理由 -->
          <div class="rec-reason">
            {{ rec.reason }}
          </div>

          <!-- 操作按钮 -->
          <div class="rec-actions">
            <button
              class="btn-primary"
              @click="createAssociation(rec)"
            >
              创建关联
            </button>
            <button
              class="btn-secondary"
              @click="ignoreRecommendation(rec)"
            >
              忽略
            </button>
          </div>
        </div>
      </div>

      <!-- 面板底部 -->
      <div
        v-if="hasAnalyzed && !isAnalyzing"
        class="panel-footer"
      >
        <button
          class="apply-all-btn"
          :disabled="!hasSelection"
          @click="applyAll"
        >
          批量创建关联（{{ selectedRecommendations.size }}）
        </button>
      </div>

      <!-- 无数据提示 -->
      <div
        v-if="hasAnalyzed && !isAnalyzing && recommendations.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          🔍
        </div>
        <p class="empty-text">
          暂无关联推荐
        </p>
        <p class="empty-hint">
          节点之间关联度较低，建议手动建立关联
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识关联推荐面板组件
 * 基于标签/关键词/内容相似度推荐潜在关联的节点
 */

import type { AssociationRecommendation } from '@/services/knowledgeGraphService'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import {
  computed,
  ref,
  watch,
} from 'vue'
import {
  analyzeAssociations,
  getAssociationTypeIcon,
  getAssociationTypeName,
} from '@/services/knowledgeGraphService'

interface Props {
  /** 是否可见 */
  visible: boolean
  /** 节点列表 */
  nodes: FreeMindMapNode[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'create-association', recommendation: AssociationRecommendation): void
  (e: 'ignore-recommendation', recommendation: AssociationRecommendation): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

/** 关联推荐列表 */
const recommendations = ref<AssociationRecommendation[]>([])

/** 是否正在分析 */
const isAnalyzing = ref(false)

/** 是否已分析 */
const hasAnalyzed = ref(false)

/** 已忽略的推荐 ID 列表 */
const ignoredRecommendations = ref<Set<string>>(new Set())

/** 选中的推荐 ID 列表（用于批量操作） */
const selectedRecommendations = ref<Set<string>>(new Set())

// 监听可见性变化，自动分析
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !hasAnalyzed.value) {
      analyze()
    }
  },
)

// 监听节点变化，重置分析状态
watch(
  () => props.nodes.length,
  () => {
    hasAnalyzed.value = false
    recommendations.value = []
    ignoredRecommendations.value.clear()
    selectedRecommendations.value.clear()
  },
)

/** 获取推荐数量 */
const recommendationCount = computed(() => recommendations.value.length)

/** 获取节点数量 */
const nodeCount = computed(() => props.nodes.length)

/** 是否有选中的推荐 */
const hasSelection = computed(() => selectedRecommendations.value.size > 0)

/** 获取节点名称 */
function getNodeName(nodeId: string): string {
  const node = props.nodes.find((n) => n.id === nodeId)
  return node?.data?.title || '未知节点'
}

/**
 * 分析关联并生成推荐
 */
function analyze() {
  isAnalyzing.value = true

  // 异步分析，避免阻塞 UI
  setTimeout(() => {
    recommendations.value = analyzeAssociations(props.nodes)
    hasAnalyzed.value = true
    isAnalyzing.value = false
  }, 100)
}

/**
 * 创建关联
 */
function createAssociation(rec: AssociationRecommendation) {
  emit('create-association', rec)
  // 从列表中移除
  recommendations.value = recommendations.value.filter(
    (r) => !(r.sourceNodeId === rec.sourceNodeId && r.targetNodeId === rec.targetNodeId),
  )
}

/**
 * 忽略推荐
 */
function ignoreRecommendation(rec: AssociationRecommendation) {
  const key = `${rec.sourceNodeId}-${rec.targetNodeId}`
  ignoredRecommendations.value.add(key)
  recommendations.value = recommendations.value.filter(
    (r) => !(r.sourceNodeId === rec.sourceNodeId && r.targetNodeId === rec.targetNodeId),
  )
}

/**
 * 切换选中状态
 */
function toggleSelection(rec: AssociationRecommendation) {
  const key = `${rec.sourceNodeId}-${rec.targetNodeId}`
  if (selectedRecommendations.value.has(key)) {
    selectedRecommendations.value.delete(key)
  } else {
    selectedRecommendations.value.add(key)
  }
}

/**
 * 批量创建关联
 */
function applyAll() {
  const toCreate = recommendations.value.filter((rec) => {
    const key = `${rec.sourceNodeId}-${rec.targetNodeId}`
    return selectedRecommendations.value.has(key)
  })

  toCreate.forEach((rec) => {
    emit('create-association', rec)
  })

  // 清空选中并移除已创建的推荐
  recommendations.value = recommendations.value.filter((rec) => {
    const key = `${rec.sourceNodeId}-${rec.targetNodeId}`
    return !selectedRecommendations.value.has(key)
  })
  selectedRecommendations.value.clear()
}

/**
 * 重新分析
 */
function reanalyze() {
  hasAnalyzed.value = false
  ignoredRecommendations.value.clear()
  selectedRecommendations.value.clear()
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
.association-panel-overlay {
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

.association-panel {
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 520px;
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

/* 分析摘要 */
.analysis-summary {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background: var(--siyuan-bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-icon {
  font-size: 16px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--siyuan-primary, #409eff);
}

.summary-label {
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
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
.recommendation-list {
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
  transition: all 0.2s;
  position: relative;
}

.recommendation-card:hover {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f7ff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.recommendation-card.high-confidence {
  border-color: #52c41a;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.05), rgba(82, 196, 26, 0.1));
}

.recommendation-card.selected {
  border-color: var(--siyuan-primary, #409eff);
  background: var(--siyuan-hover-bg, #f5f7ff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.rec-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
}

.rec-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.rec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-left: 24px;
}

.rec-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
}

.type-icon {
  font-size: 14px;
}

.rec-confidence {
  padding: 2px 8px;
  background: rgba(64, 158, 255, 0.1);
  color: var(--siyuan-primary, #409eff);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.high-confidence .rec-confidence {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.rec-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 24px;
  margin-bottom: 8px;
}

.source-node,
.target-node {
  flex: 1;
  padding: 6px 10px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-radius: 6px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-node {
  background: rgba(64, 158, 255, 0.1);
  color: var(--siyuan-primary, #409eff);
}

.association-arrow {
  font-size: 16px;
  color: var(--siyuan-secondary-text, #999);
}

.rec-reason {
  padding: 6px 10px;
  margin-left: 24px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
  background: var(--siyuan-bg-secondary, #f8f9fa);
  border-radius: 4px;
  margin-bottom: 10px;
}

.rec-actions {
  display: flex;
  gap: 8px;
  padding-left: 24px;
}

.btn-primary {
  flex: 1;
  padding: 8px 16px;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #3a8ee6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.btn-secondary {
  flex: 1;
  padding: 8px 16px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--siyuan-hover-bg, #ececec);
  border-color: var(--siyuan-border, #d0d0d0);
}

/* 面板底部 */
.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.apply-all-btn {
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

.apply-all-btn:hover:not(:disabled) {
  background: #3a8ee6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.apply-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
.recommendation-list::-webkit-scrollbar {
  width: 6px;
}

.recommendation-list::-webkit-scrollbar-track {
  background: transparent;
}

.recommendation-list::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 3px;
}

.recommendation-list::-webkit-scrollbar-thumb:hover {
  background: var(--siyuan-secondary-text, #999);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .association-panel {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .panel-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .analysis-summary {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .summary-label,
  .rec-reason,
  .empty-hint {
    color: var(--siyuan-secondary-text, #999);
  }

  .summary-value {
    color: var(--siyuan-primary, #409eff);
  }

  .recommendation-card {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .recommendation-card:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .source-node,
  .target-node {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .target-node {
    background: rgba(64, 158, 255, 0.15);
  }

  .rec-reason {
    background: var(--siyuan-bg-secondary, #2a2a2a);
  }

  .btn-secondary {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .btn-secondary:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }
}
</style>
