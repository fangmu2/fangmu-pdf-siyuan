<!-- src/components/VirtualCardList.vue -->
<template>
  <div class="virtual-card-list" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-list-content" :style="{ height: totalHeight + 'px' }">
      <div
        class="virtual-list-items"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="card in visibleCards"
          :key="card.id"
          class="virtual-card-item"
          :class="{ 'selected': selectedCardId === card.id }"
          @click="selectCard(card)"
        >
          <div class="card-header">
            <span class="card-title">{{ card.title || '无标题卡片' }}</span>
            <span class="card-type" :class="card.type">
              {{ cardTypeLabels[card.type] || '卡片' }}
            </span>
          </div>
          <div class="card-content">
            {{ truncateText(card.content, 100) }}
          </div>
          <div class="card-footer">
            <span class="card-tag" v-for="tag in card.tags?.slice(0, 3)" :key="tag">
              #{{ tag }}
            </span>
            <span class="card-status" :class="card.status">
              {{ statusLabels[card.status] || card.status }}
            </span>
            <span class="card-difficulty">
              难度：{{ '★'.repeat(card.difficulty || 1) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="cards.length === 0" class="empty-state">
      <div class="empty-state-icon">📭</div>
      <p>暂无卡片</p>
      <p class="empty-state-hint">添加标注或创建卡片后将显示在这里</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { Card } from '../types/card';

interface Props {
  cards: Card[];
  selectedCardId?: string;
  itemHeight?: number;
  bufferSize?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedCardId: '',
  itemHeight: 120,
  bufferSize: 5,
  loading: false
});

interface Emits {
  (e: 'card-select', card: Card): void;
  (e: 'scroll-bottom'): void;
}

const emit = defineEmits<Emits>();

const containerRef = ref<HTMLDivElement | null>(null);
const containerHeight = ref(0);
const scrollTop = ref(0);

// 卡片类型标签
const cardTypeLabels: Record<string, string> = {
  card: '卡片',
  flashcard: '闪卡',
  excerpt: '摘录'
};

// 状态标签
const statusLabels: Record<string, string> = {
  new: '新学',
  learning: '学习中',
  review: '复习中',
  suspended: '已暂停'
};

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// 计算总高度
const totalHeight = computed(() => {
  return props.cards.length * props.itemHeight;
});

// 计算可见区域
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize;
  return Math.max(0, index);
});

const endIndex = computed(() => {
  const index = Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.bufferSize;
  return Math.min(props.cards.length, index);
});

// 可见的卡片
const visibleCards = computed(() => {
  return props.cards.slice(startIndex.value, endIndex.value);
});

// Y 轴偏移量
const offsetY = computed(() => {
  return startIndex.value * props.itemHeight;
});

// 选择卡片
const selectCard = (card: Card) => {
  emit('card-select', card);
};

// 处理滚动
const handleScroll = () => {
  if (!containerRef.value) return;
  scrollTop.value = containerRef.value.scrollTop;

  // 触发滚动到底部事件
  const { scrollHeight, clientHeight, scrollTop } = containerRef.value;
  if (scrollHeight - clientHeight - scrollTop < 100) {
    emit('scroll-bottom');
  }
};

// 更新容器高度
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
};

// 监听卡片数量变化
watch(() => props.cards.length, () => {
  updateContainerHeight();
});

onMounted(() => {
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight);
});

// 暴露方法
defineExpose({
  scrollTo: (index: number) => {
    if (containerRef.value) {
      containerRef.value.scrollTop = index * props.itemHeight;
    }
  },
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0;
    }
  }
});
</script>

<style scoped>
.virtual-card-list {
  flex: 1;
  overflow-y: auto;
  position: relative;
  height: 100%;
}

.virtual-list-content {
  position: relative;
  width: 100%;
}

.virtual-list-items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-card-item {
  height: v-bind('itemHeight + "px"');
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.virtual-card-item:hover {
  background: var(--b3-theme-surface-hover);
}

.virtual-card-item.selected {
  background: var(--b3-theme-primary-light);
  border-left: 3px solid var(--b3-theme-primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--b3-theme-surface-hover);
  color: var(--b3-theme-on-surface);
  flex-shrink: 0;
}

.card-type.flashcard {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.card-type.excerpt {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.card-content {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.card-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-status.new {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.card-status.learning {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.card-status.review {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.card-status.suspended {
  background: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.card-difficulty {
  font-size: 11px;
  color: #ff9800;
  margin-left: auto;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state-hint {
  font-size: 12px;
  opacity: 0.7;
}

/* 加载状态 */
.loading-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--b3-border-color);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
