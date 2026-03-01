<template>
  <div class="mindmap-backlinks">
    <!-- 卡片反向链接 -->
    <div v-if="cardId" class="backlinks-section">
      <div class="section-header">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
          脑图引用
        </h4>
        <span class="backlink-count">{{ backlinks.length }}</span>
      </div>

      <div v-if="backlinks.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" class="empty-icon">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
        <p>暂无脑图引用此卡片</p>
      </div>

      <div v-else class="backlinks-list">
        <div
          v-for="backlink in backlinks"
          :key="`${backlink.mindMapId}-${backlink.nodeId}`"
          class="backlink-item"
          @click="navigateToMindMap(backlink)"
        >
          <div class="backlink-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div class="backlink-content">
            <div class="backlink-name">{{ backlink.mindMapName }}</div>
            <div class="backlink-node">
              <span class="node-label">节点：</span>
              <span class="node-title">{{ backlink.nodeTitle }}</span>
            </div>
            <div class="backlink-path" v-if="backlink.nodePath.length > 1">
              <span class="path-label">路径：</span>
              <span class="path-items">
                <span v-for="(item, idx) in backlink.nodePath.slice(0, -1)" :key="idx" class="path-item">
                  {{ item }}
                  <span class="path-separator">/</span>
                </span>
              </span>
            </div>
          </div>
          <div class="backlink-action">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点反向链接（显示哪些卡片关联了这个节点） -->
    <div v-if="mindMapId && nodeId" class="node-backlinks-section">
      <div class="section-header">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          关联的卡片
        </h4>
        <span class="backlink-count">{{ nodeCards.length }}</span>
      </div>

      <div v-if="nodeCards.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" class="empty-icon">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
        <p>暂无卡片关联到此节点</p>
        <sy-button @click="showCardSelector = true" size="small" type="primary">
          关联卡片
        </sy-button>
      </div>

      <div v-else class="node-cards-list">
        <div class="cards-header">
          <sy-button @click="showCardSelector = true" size="small" icon="plus">
            添加关联
          </sy-button>
          <sy-button @click="showManageCards = true" size="small" icon="edit">
            管理
          </sy-button>
        </div>

        <div
          v-for="card in nodeCards"
          :key="card.id"
          class="card-item"
        >
          <div class="card-content">
            <div class="card-text">{{ card.content.slice(0, 80) }}{{ card.content.length > 80 ? '...' : '' }}</div>
            <div class="card-meta">
              <span class="card-tag" v-if="card.tags?.length">{{ card.tags[0] }}</span>
              <span class="card-status" :class="card.status">{{ formatStatus(card.status) }}</span>
            </div>
          </div>
          <button @click="removeCardAssociation(card.id)" class="remove-card" title="移除关联">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片选择器 -->
    <div v-if="showCardSelector" class="dialog-overlay" @click.self="showCardSelector = false">
      <div class="dialog card-selector-dialog">
        <div class="dialog-header">
          <h3>选择要关联的卡片</h3>
          <button @click="showCardSelector = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <sy-input
            v-model="cardSearchQuery"
            placeholder="搜索卡片..."
            prefix-icon="search"
          />
          <div class="card-list">
            <div
              v-for="card in filteredCards"
              :key="card.id"
              class="card-option"
              :class="{ selected: selectedCardIds.includes(card.id) }"
              @click="toggleCardSelection(card.id)"
            >
              <div class="card-option-content">
                <div class="card-option-text">{{ card.content.slice(0, 60) }}{{ card.content.length > 60 ? '...' : '' }}</div>
                <div class="card-option-meta">
                  <span class="card-tag" v-if="card.tags?.length">{{ card.tags[0] }}</span>
                  <span class="card-status" :class="card.status">{{ formatStatus(card.status) }}</span>
                </div>
              </div>
              <sy-checkbox :modelValue="selectedCardIds.includes(card.id)" />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <sy-button @click="showCardSelector = false">取消</sy-button>
          <sy-button @click="confirmCardSelection" type="primary" :disabled="selectedCardIds.length === 0">
            确认关联 ({{ selectedCardIds.length }})
          </sy-button>
        </div>
      </div>
    </div>

    <!-- 管理卡片对话框 -->
    <div v-if="showManageCards" class="dialog-overlay" @click.self="showManageCards = false">
      <div class="dialog manage-cards-dialog">
        <div class="dialog-header">
          <h3>管理关联卡片</h3>
          <button @click="showManageCards = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="selected-cards-list">
            <div
              v-for="card in nodeCards"
              :key="card.id"
              class="selected-card-item"
            >
              <sy-checkbox
                :modelValue="!cardsToRemove.includes(card.id)"
                @change="toggleCardToRemove(card.id)"
              />
              <div class="card-content">
                <div class="card-text">{{ card.content.slice(0, 60) }}{{ card.content.length > 60 ? '...' : '' }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <sy-button @click="showManageCards = false">取消</sy-button>
          <sy-button @click="confirmRemoveCards" type="danger" :disabled="cardsToRemove.length === 0">
            移除选中 ({{ cardsToRemove.length }})
          </sy-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SyButton from './SiyuanTheme/SyButton.vue';
import SyInput from './SiyuanTheme/SyInput.vue';
import SyCheckbox from './SiyuanTheme/SyCheckbox.vue';
import { mindmapEnhanceService, type MindMapBacklink } from '../services/mindmapEnhanceService';
import type { Card } from '../types/card';
import { cardService } from '../services/cardService';
import { studySetService } from '../services/studySetService';

const props = defineProps<{
  cardId?: string;
  mindMapId?: string;
  nodeId?: string;
  studySetId?: string;
}>();

const emit = defineEmits<{
  (e: 'navigate', data: { type: 'mindmap'; mindMapId: string; nodeId?: string }): void;
  (e: 'update'): void;
}>();

// 反向链接数据
const backlinks = ref<MindMapBacklink[]>([]);
const nodeCards = ref<Card[]>([]);

// 卡片选择器
const showCardSelector = ref(false);
const showManageCards = ref(false);
const cardSearchQuery = ref('');
const availableCards = ref<Card[]>([]);
const selectedCardIds = ref<string[]>([]);
const cardsToRemove = ref<string[]>([]);

// 加载卡片反向链接
const loadCardBacklinks = async () => {
  if (!props.cardId) return;

  backlinks.value = await mindmapEnhanceService.getCardBacklinks(props.cardId);
};

// 加载节点关联的卡片
const loadNodeCards = async () => {
  if (!props.mindMapId || !props.nodeId) return;

  nodeCards.value = await mindmapEnhanceService.getNodeBacklinks(
    props.mindMapId,
    props.nodeId
  );
};

// 加载可用卡片列表
const loadAvailableCards = async () => {
  if (!props.studySetId) return;

  try {
    const studySet = await studySetService.getStudySet(props.studySetId);
    availableCards.value = studySet.cardIds.map(id => ({
      id,
      type: 'card',
      content: '',
      sourceLocation: { docId: '', blockId: '' },
      studySetId: props.studySetId!,
      tags: [],
      status: 'new',
      difficulty: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    // 查询卡片详情
    for (const card of availableCards.value) {
      try {
        const block = await cardService.getCard(card.id);
        if (block) {
          card.content = block.content || '';
          card.tags = block.tags || [];
          card.status = block.status || 'new';
        }
      } catch (e) {
        console.error('[loadAvailableCards] 加载卡片失败:', e);
      }
    }
  } catch (error) {
    console.error('[loadAvailableCards] 加载卡片列表失败:', error);
  }
};

// 过滤卡片
const filteredCards = computed(() => {
  if (!cardSearchQuery.value) return availableCards.value;

  const query = cardSearchQuery.value.toLowerCase();
  return availableCards.value.filter(card =>
    card.content.toLowerCase().includes(query) ||
    card.tags?.some(tag => tag.toLowerCase().includes(query))
  );
});

// 格式化状态显示
const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'new': '新学',
    'learning': '学习中',
    'review': '待复习',
    'suspended': '已暂停'
  };
  return map[status] || status;
};

// 跳转到脑图
const navigateToMindMap = (backlink: MindMapBacklink) => {
  emit('navigate', {
    type: 'mindmap',
    mindMapId: backlink.mindMapId,
    nodeId: backlink.nodeId
  });
};

// 切换卡片选择
const toggleCardSelection = (cardId: string) => {
  const index = selectedCardIds.value.indexOf(cardId);
  if (index > -1) {
    selectedCardIds.value.splice(index, 1);
  } else {
    selectedCardIds.value.push(cardId);
  }
};

// 确认卡片选择
const confirmCardSelection = async () => {
  if (!props.mindMapId || !props.nodeId) return;

  for (const cardId of selectedCardIds.value) {
    await mindmapEnhanceService.addNodeCard(props.mindMapId, props.nodeId, cardId);
  }

  showCardSelector.value = false;
  selectedCardIds.value = [];
  await loadNodeCards();
  emit('update');
};

// 移除卡片关联
const removeCardAssociation = async (cardId: string) => {
  if (!props.mindMapId || !props.nodeId) return;

  if (confirm('确定要移除这个卡片的关联吗？')) {
    await mindmapEnhanceService.removeNodeCard(props.mindMapId, props.nodeId, cardId);
    await loadNodeCards();
    emit('update');
  }
};

// 切换移除选择
const toggleCardToRemove = (cardId: string) => {
  const index = cardsToRemove.value.indexOf(cardId);
  if (index > -1) {
    cardsToRemove.value.splice(index, 1);
  } else {
    cardsToRemove.value.push(cardId);
  }
};

// 确认移除卡片
const confirmRemoveCards = async () => {
  if (!props.mindMapId || !props.nodeId) return;

  for (const cardId of cardsToRemove.value) {
    await mindmapEnhanceService.removeNodeCard(props.mindMapId, props.nodeId, cardId);
  }

  showManageCards.value = false;
  cardsToRemove.value = [];
  await loadNodeCards();
  emit('update');
};

// 监听属性变化
watch(() => props.cardId, loadCardBacklinks, { immediate: true });
watch([() => props.mindMapId, () => props.nodeId], loadNodeCards, { immediate: true });
watch(() => props.studySetId, loadAvailableCards, { immediate: true });
</script>

<style scoped lang="scss">
.mindmap-backlinks {
  padding: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.backlink-count {
  padding: 2px 8px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: var(--b3-theme-on-surface-light);
  text-align: center;

  .empty-icon {
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    margin: 0 0 16px 0;
  }
}

// 反向链接列表
.backlinks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backlink-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
    transform: translateX(4px);
  }
}

.backlink-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--b3-theme-primary-light, rgba(0, 123, 255, 0.1));
  color: var(--b3-theme-primary);
  border-radius: 8px;
  flex-shrink: 0;
}

.backlink-content {
  flex: 1;
  min-width: 0;
}

.backlink-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
  margin-bottom: 4px;
}

.backlink-node {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);

  .node-label {
    margin-right: 4px;
  }

  .node-title {
    font-weight: 500;
    color: var(--b3-theme-primary);
  }
}

.backlink-path {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin-top: 4px;

  .path-label {
    margin-right: 4px;
  }

  .path-items {
    display: inline;
  }

  .path-item {
    display: inline;

    .path-separator {
      margin: 0 4px;
      color: var(--b3-theme-on-surface-lighter);
    }
  }
}

.backlink-action {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface-light);
}

// 节点卡片列表
.node-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cards-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  margin-bottom: 6px;
}

.card-meta {
  display: flex;
  gap: 6px;
}

.card-tag {
  padding: 2px 8px;
  background: var(--b3-theme-surface-hover);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
}

.card-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;

  &.new { background: #e8f5e9; color: #4CAF50; }
  &.learning { background: #e3f2fd; color: #2196F3; }
  &.review { background: #fff3e0; color: #FF9800; }
  &.suspended { background: #f5f5f5; color: #9E9E9E; }
}

.remove-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: rgba(var(--b3-theme-danger-rgb), 0.2);
    color: var(--b3-theme-danger);
  }
}

// 对话框
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
  background: var(--b3-theme-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
  }
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

// 卡片选择器
.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.card-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &.selected {
    border: 2px solid var(--b3-theme-primary);
  }
}

.card-option-content {
  flex: 1;
  min-width: 0;
}

.card-option-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  margin-bottom: 6px;
}

.card-option-meta {
  display: flex;
  gap: 6px;
}

// 管理卡片
.selected-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
}
</style>
