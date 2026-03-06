<template>
  <div
    v-if="visible"
    class="links-graph-panel"
  >
    <!-- 标签页 -->
    <div class="panel-tabs">
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'cross' }]"
        @click="activeTab = 'cross'"
      >
        🔗 跨分支关联
        <span class="badge">{{ crossLinks.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'remote' }]"
        @click="activeTab = 'remote'"
      >
        🌐 远程知识
        <span class="badge">{{ remoteLinks.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="[{ active: activeTab === 'layout' }]"
        @click="activeTab = 'layout'"
      >
        💡 布局建议
        <span class="badge">{{ layoutSuggestions.length }}</span>
      </button>
    </div>

    <!-- 跨分支关联 -->
    <div
      v-if="activeTab === 'cross'"
      class="panel-content"
    >
      <!-- 加载状态 -->
      <div
        v-if="loadingCrossLinks"
        class="loading"
      >
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!hasCrossLinks"
        class="empty-state"
      >
        <span class="empty-icon">🔗</span>
        <p>暂无跨分支关联</p>
        <button
          class="btn-primary"
          @click="creatingLink = true"
        >
          创建关联
        </button>
      </div>

      <!-- 关联列表 -->
      <div
        v-else
        class="link-list"
      >
        <div
          v-for="link in crossLinks"
          :key="link.id"
          class="link-item"
          :style="{ borderLeftColor: crossLinkTypeColors[link.linkType] }"
        >
          <div class="link-header">
            <span
              class="link-type"
              :style="{ backgroundColor: crossLinkTypeColors[link.linkType] }"
            >
              {{ crossLinkTypeLabels[link.linkType] }}
            </span>
            <div class="link-actions">
              <button
                class="btn-icon"
                title="定位源节点"
                @click="handleFocusNode(link.sourceNodeId)"
              >
                📍
              </button>
              <button
                class="btn-icon"
                title="定位目标节点"
                @click="handleFocusNode(link.targetNodeId)"
              >
                📍
              </button>
              <button
                class="btn-icon delete"
                title="删除"
                @click="handleDeleteCrossLink(link.id)"
              >
                🗑️
              </button>
            </div>
          </div>
          <div class="link-content">
            <span class="node-name">{{ getNodeTitle(link.sourceNodeId) }}</span>
            <span class="link-arrow">→</span>
            <span class="node-name">{{ getNodeTitle(link.targetNodeId) }}</span>
          </div>
          <div
            v-if="link.label"
            class="link-label"
          >
            {{ link.label }}
          </div>
        </div>
      </div>

      <!-- 创建关联对话框 -->
      <div
        v-if="creatingLink"
        class="dialog-overlay"
        @click="creatingLink = false"
      >
        <div
          class="dialog"
          @click.stop
        >
          <h3>创建跨分支关联</h3>
          <div class="form-group">
            <label>源节点</label>
            <select v-model="selectedSourceNode">
              <option value="">
                选择节点
              </option>
              <option
                v-for="node in nodes"
                :key="node.id"
                :value="node.id"
              >
                {{ node.data.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>目标节点</label>
            <select v-model="selectedTargetNode">
              <option value="">
                选择节点
              </option>
              <option
                v-for="node in nodes"
                :key="node.id"
                :value="node.id"
                :disabled="node.id === selectedSourceNode"
              >
                {{ node.data.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>关联类型</label>
            <select v-model="newLinkType">
              <option value="relation">
                关联
              </option>
              <option value="seeAlso">
                参见
              </option>
              <option value="contrast">
                对比
              </option>
              <option value="cause">
                因果
              </option>
              <option value="example">
                示例
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>标签（可选）</label>
            <input
              v-model="newLinkLabel"
              type="text"
              placeholder="输入关联描述"
            />
          </div>
          <div class="dialog-actions">
            <button
              class="btn-cancel"
              @click="creatingLink = false"
            >
              取消
            </button>
            <button
              class="btn-primary"
              @click="handleCreateCrossLink"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 远程知识联系 -->
    <div
      v-if="activeTab === 'remote'"
      class="panel-content"
    >
      <!-- 加载状态 -->
      <div
        v-if="loadingRemoteLinks"
        class="loading"
      >
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!hasRemoteLinks"
        class="empty-state"
      >
        <span class="empty-icon">🌐</span>
        <p>暂无远程知识联系</p>
        <button
          class="btn-primary"
          @click="creatingRemoteLink = true"
        >
          创建联系
        </button>
      </div>

      <!-- 联系列表 -->
      <div
        v-else
        class="link-list"
      >
        <div
          v-for="link in remoteLinks"
          :key="link.id"
          class="link-item"
          :style="{ borderLeftColor: remoteLinkTypeColors[link.linkType] }"
        >
          <div class="link-header">
            <span
              class="link-type"
              :style="{ backgroundColor: remoteLinkTypeColors[link.linkType] }"
            >
              {{ remoteLinkTypeLabels[link.linkType] }}
            </span>
            <span class="target-type-badge">{{ link.targetType }}</span>
            <div class="link-actions">
              <button
                class="btn-icon"
                title="定位源节点"
                @click="handleFocusNode(link.sourceNodeId)"
              >
                📍
              </button>
              <button
                class="btn-icon delete"
                title="删除"
                @click="handleDeleteRemoteLink(link.id)"
              >
                🗑️
              </button>
            </div>
          </div>
          <div class="link-content">
            <span class="node-name">{{ getNodeTitle(link.sourceNodeId) }}</span>
            <span class="link-arrow">→</span>
            <span class="node-name">{{ link.targetId }}</span>
          </div>
          <div
            v-if="link.description"
            class="link-label"
          >
            {{ link.description }}
          </div>
        </div>
      </div>

      <!-- 创建远程联系对话框 -->
      <div
        v-if="creatingRemoteLink"
        class="dialog-overlay"
        @click="creatingRemoteLink = false"
      >
        <div
          class="dialog"
          @click.stop
        >
          <h3>创建远程知识联系</h3>
          <div class="form-group">
            <label>源节点</label>
            <select v-model="selectedSourceNode">
              <option value="">
                选择节点
              </option>
              <option
                v-for="node in nodes"
                :key="node.id"
                :value="node.id"
              >
                {{ node.data.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>目标类型</label>
            <select v-model="remoteLinkTargetType">
              <option value="node">
                节点
              </option>
              <option value="annotation">
                标注
              </option>
              <option value="document">
                文档
              </option>
              <option value="external">
                外部资源
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>目标 ID</label>
            <input
              v-model="remoteLinkTargetId"
              type="text"
              placeholder="输入目标 ID"
            />
          </div>
          <div class="form-group">
            <label>描述（可选）</label>
            <input
              v-model="remoteLinkDescription"
              type="text"
              placeholder="输入联系描述"
            />
          </div>
          <div class="dialog-actions">
            <button
              class="btn-cancel"
              @click="creatingRemoteLink = false"
            >
              取消
            </button>
            <button
              class="btn-primary"
              @click="handleCreateRemoteLink"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 布局建议 -->
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
          @click="refreshLayoutSuggestions"
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
 * 链接图谱面板组件
 * 显示跨分支关联和远程知识联系
 */

import type { Ref } from 'vue'
import type {
  CrossBranchLink,
  FreeMindMapEdge,
  FreeMindMapNode,
  RemoteKnowledgeLink,
} from '@/types/mindmapFree'
import {
  computed,
  ref,
  watch,
} from 'vue'
import { useMindMapLinkEnhance } from '@/composables/useMindMapLinkEnhance'

// Props
interface Props {
  /** 思维导图块 ID */
  mindMapBlockId: string
  /** 节点列表 */
  nodes: Ref<FreeMindMapNode[]>
  /** 连线列表 */
  edges: Ref<FreeMindMapEdge[]>
  /** 是否显示 */
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})

// Emit
const emit = defineEmits<{
  /** 点击关联跳转 */
  (e: 'focus-node', nodeId: string): void
  /** 删除关联 */
  (e: 'delete-link', linkId: string): void
  /** 创建新关联 */
  (e: 'create-link', sourceNodeId: string, targetNodeId: string): void
}>()

// 使用组合式函数
const {
  crossLinks,
  remoteLinks,
  loadingCrossLinks,
  loadingRemoteLinks,
  createCrossBranchLink,
  deleteCrossBranchLink,
  createRemoteKnowledgeLink,
  deleteRemoteKnowledgeLink,
  getNodeLinks,
  allNodeLinks,
  focusOnNode,
  layoutSuggestions,
  refreshLayoutSuggestions,
  applySuggestion,
  refreshAll,
} = useMindMapLinkEnhance({
  mindMapBlockId: props.mindMapBlockId,
  nodes: props.nodes,
  edges: props.edges,
  enabled: true,
})

// 本地状态
const activeTab = ref<'cross' | 'remote' | 'layout'>('cross')
const creatingLink = ref(false)
const selectedSourceNode = ref<string | null>(null)
const selectedTargetNode = ref<string | null>(null)
const newLinkType = ref<CrossBranchLink['linkType']>('relation')
const newLinkLabel = ref('')

// 远程知识联系创建状态
const creatingRemoteLink = ref(false)
const remoteLinkTargetType = ref<RemoteKnowledgeLink['targetType']>('node')
const remoteLinkTargetId = ref('')
const remoteLinkDescription = ref('')

// 计算属性
const crossLinkTypeLabels: Record<CrossBranchLink['linkType'], string> = {
  relation: '关联',
  seeAlso: '参见',
  contrast: '对比',
  cause: '因果',
  example: '示例',
}

const crossLinkTypeColors: Record<CrossBranchLink['linkType'], string> = {
  relation: '#409eff',
  seeAlso: '#67c23a',
  contrast: '#e6a23c',
  cause: '#f56c6c',
  example: '#909399',
}

const remoteLinkTypeLabels: Record<RemoteKnowledgeLink['linkType'], string> = {
  reference: '引用',
  relation: '关联',
  seeAlso: '参见',
  quote: '引述',
}

const remoteLinkTypeColors: Record<RemoteKnowledgeLink['linkType'], string> = {
  reference: '#909399',
  relation: '#409eff',
  seeAlso: '#67c23a',
  quote: '#e6a23c',
}

const hasCrossLinks = computed(() => crossLinks.value.length > 0)
const hasRemoteLinks = computed(() => remoteLinks.value.length > 0)
const hasLayoutSuggestions = computed(() => layoutSuggestions.value.length > 0)

// 获取节点标题
function getNodeTitle(nodeId: string): string {
  const node = props.nodes.value.find((n) => n.id === nodeId)
  return node?.data?.title || nodeId
}

// 处理跨分支关联创建
async function handleCreateCrossLink(): Promise<void> {
  if (!selectedSourceNode.value || !selectedTargetNode.value) return

  await createCrossBranchLink(
    selectedSourceNode.value,
    selectedTargetNode.value,
    newLinkType.value,
    newLinkLabel.value || undefined,
  )

  // 重置状态
  selectedSourceNode.value = null
  selectedTargetNode.value = null
  newLinkLabel.value = ''
  creatingLink.value = false
}

// 处理远程知识联系创建
async function handleCreateRemoteLink(): Promise<void> {
  if (!selectedSourceNode.value) return

  await createRemoteKnowledgeLink(
    selectedSourceNode.value,
    remoteLinkTargetId.value,
    remoteLinkTargetType.value,
    'relation',
    remoteLinkDescription.value || undefined,
  )

  // 重置状态
  selectedSourceNode.value = null
  remoteLinkTargetId.value = ''
  remoteLinkDescription.value = ''
  creatingRemoteLink.value = false
}

// 处理删除关联
async function handleDeleteCrossLink(linkId: string): Promise<void> {
  await deleteCrossBranchLink(linkId)
  emit('delete-link', linkId)
}

async function handleDeleteRemoteLink(linkId: string): Promise<void> {
  await deleteRemoteKnowledgeLink(linkId)
  emit('delete-link', linkId)
}

// 处理跳转
function handleFocusNode(nodeId: string): void {
  focusOnNode(nodeId, 1.5, true, '#409eff')
  emit('focus-node', nodeId)
}

// 处理应用布局建议
function handleApplySuggestion(index: number): void {
  const suggestion = layoutSuggestions.value[index]
  const updates = applySuggestion(suggestion)
  // 这里需要通知父组件更新节点位置
  console.log('[LinksGraphPanel] 应用布局建议:', updates)
}

// 监听数据变化
watch([crossLinks, remoteLinks], () => {
  // 数据变化时刷新
}, { deep: true })

// 暴露刷新方法
defineExpose({
  refresh: refreshAll,
})
</script>

<style scoped>
.links-graph-panel {
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
  background: var(--siyuan-block-bg, #f0f0f0);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 500;
}

.tab-btn.active .badge {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  padding: 24px;
  color: var(--siyuan-secondary-text, #666);
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
  margin: 0 0 16px;
  color: var(--siyuan-secondary-text, #666);
}

/* 关联列表 */
.link-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  position: relative;
  padding: 12px;
  background: var(--siyuan-block-bg, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-left: 3px solid;
  border-radius: 6px;
}

.link-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.link-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.target-type-badge {
  display: inline-block;
  padding: 2px 6px;
  background: var(--siyuan-border, #e0e0e0);
  border-radius: 4px;
  font-size: 10px;
  color: var(--siyuan-secondary-text, #666);
}

.link-actions {
  margin-left: auto;
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
}

.btn-icon:hover {
  background: var(--siyuan-hover-bg, #e0e0e0);
}

.btn-icon.delete:hover {
  background: var(--siyuan-error-bg, #ffe6e6);
}

.link-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.node-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-arrow {
  color: var(--siyuan-secondary-text, #999);
}

.link-label {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  border-radius: 4px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
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

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--siyuan-bg, #fff);
  border-radius: 12px;
  padding: 24px;
  min-width: 360px;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog h3 {
  margin: 0 0 20px;
  font-size: 16px;
  color: var(--siyuan-text, #333);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  background: var(--siyuan-bg, #fff);
  color: var(--siyuan-text, #333);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--siyuan-primary, #409eff);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
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

.btn-cancel {
  padding: 8px 16px;
  background: var(--siyuan-hover-bg, #f5f5f5);
  color: var(--siyuan-text, #333);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--siyuan-border, #e0e0e0);
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
