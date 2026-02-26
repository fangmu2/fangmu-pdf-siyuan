<!-- src/components/ConceptMap.vue -->
<template>
  <div class="concept-map">
    <!-- 工具栏 -->
    <div class="concept-map-toolbar">
      <div class="toolbar-group">
        <button @click="fitView" class="toolbar-btn" title="适应视图">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
        <button @click="zoomIn" class="toolbar-btn" title="放大">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button @click="zoomOut" class="toolbar-btn" title="缩小">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          :class="['toolbar-btn', { active: showLinksOnly }]"
          @click="showLinksOnly = !showLinksOnly"
          title="只显示链接"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
        <button
          :class="['toolbar-btn', { active: showBacklinks }]"
          @click="showBacklinks = !showBacklinks"
          title="显示反向链接"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V5h-2v2H5v2h3v7h2v-2h3v-2z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索概念..."
          class="toolbar-search"
        />
      </div>
    </div>

    <!-- 概念图内容 -->
    <div class="concept-map-content" ref="contentRef">
      <svg
        ref="svgRef"
        class="concept-map-svg"
        :width="svgWidth"
        :height="svgHeight"
        @mousedown="startPan"
        @mousemove="pan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @wheel="handleWheel"
      >
        <defs>
          <!-- 箭头标记 -->
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--b3-theme-primary)" />
          </marker>
          <!-- 高亮箭头标记 -->
          <marker
            id="arrowhead-highlight"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--b3-theme-warning)" />
          </marker>
        </defs>

        <g :transform="transformString">
          <!-- 连接线 -->
          <g class="concept-links">
            <path
              v-for="link in visibleLinks"
              :key="link.id"
              :d="getLinkPath(link)"
              :class="['concept-link', { 'concept-link--highlighted': isHighlightedLink(link) }]"
              :stroke="getLinkColor(link)"
              @click="handleLinkClick(link)"
              @mouseenter="handleLinkEnter(link)"
              @mouseleave="handleLinkLeave"
            />
          </g>

          <!-- 概念节点 -->
          <g
            v-for="node in visibleNodes"
            :key="node.id"
            :class="['concept-node', {
              'concept-node--selected': selectedNodeId === node.id,
              'concept-node--highlighted': highlightedNodeIds.has(node.id),
            }]"
            :transform="`translate(${node.x}, ${node.y})`"
            @click.stop="handleNodeClick(node)"
            @dblclick.stop="handleNodeDoubleClick(node)"
          >
            <!-- 节点背景 -->
            <rect
              :width="node.width"
              :height="node.height"
              rx="8"
              ry="8"
              :fill="getNodeColor(node)"
              :stroke="getNodeStrokeColor(node)"
              stroke-width="2"
            />

            <!-- 节点文本 -->
            <text
              x="12"
              y="20"
              class="concept-node__text"
              :fill="getNodeTextColor(node)"
            >
              {{ node.label }}
            </text>

            <!-- 节点类型图标 -->
            <text
              :x="node.width - 20"
              y="-8"
              class="concept-node__icon"
              fill="var(--b3-theme-on-surface-light)"
            >
              {{ getNodeIcon(node) }}
            </text>

            <!-- 链接数量标签 -->
            <circle
              v-if="node.linkCount > 0"
              :cx="node.width - 8"
              :cy="-8"
              r="10"
              fill="var(--b3-theme-primary)"
            />
            <text
              v-if="node.linkCount > 0"
              :x="node.width - 8"
              :y="-5"
              class="concept-node__link-count"
              fill="white"
              font-size="10"
              text-anchor="middle"
            >
              {{ node.linkCount }}
            </text>
          </g>
        </g>
      </svg>

      <!-- 空状态 -->
      <div v-if="nodes.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
        <p>暂无概念链接</p>
        <p class="empty-state-hint">概念链接将显示概念之间的关联关系</p>
      </div>
    </div>

    <!-- 侧边面板 - 显示选中节点的链接信息 -->
    <div v-if="selectedNode" class="concept-side-panel">
      <div class="side-panel-header">
        <h3 class="side-panel-title">{{ selectedNode.label }}</h3>
        <button @click="closeSidePanel" class="side-panel-close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="side-panel-content">
        <div class="link-section">
          <h4 class="link-section-title">相关链接</h4>
          <div class="link-list">
            <div
              v-for="link in getNodeLinks(selectedNode.id)"
              :key="link.id"
              class="link-item"
              @click="handleLinkClick(link)"
            >
              <div class="link-item__from">
                <span class="link-item__dot" :style="{ backgroundColor: getLinkColor(link) }"></span>
                {{ getLinkFromLabel(link) }}
              </div>
              <div class="link-item__arrow">↓</div>
              <div class="link-item__to">{{ getLinkToLabel(link) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { Card } from '../types/card';
import type { StudySet } from '../types/studySet';

interface ConceptNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'card' | 'studySet' | 'keyword' | 'tag';
  data?: Card | StudySet | any;
  linkCount: number;
}

interface ConceptLink {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'related' | 'contains' | 'tagged';
  weight: number;
}

interface Props {
  cards: Card[];
  studySets?: StudySet[];
}

const props = withDefaults(defineProps<Props>(), {
  cards: () => [],
  studySets: () => []
});

const emit = defineEmits<{
  (e: 'node-click', node: ConceptNode): void;
  (e: 'link-click', link: ConceptLink): void;
}>();

const contentRef = ref<HTMLDivElement>();
const svgRef = ref<SVGSVGElement>();

// 状态
const nodes = ref<ConceptNode[]>([]);
const links = ref<ConceptLink[]>([]);
const selectedNodeId = ref<string | null>(null);
const selectedNode = ref<ConceptNode | null>(null);
const highlightedNodeIds = ref<Set<string>>(new Set());
const hoveredLinkId = ref<string | null>(null);
const showLinksOnly = ref(false);
const showBacklinks = ref(true);
const searchQuery = ref('');

// 视图控制
const svgWidth = ref(1200);
const svgHeight = ref(800);
const viewBox = ref({ x: 0, y: 0, width: 1200, height: 800 });
const zoomLevel = ref(1);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

// 变换字符串
const transformString = computed(() => {
  return `translate(${-viewBox.value.x}, ${-viewBox.value.y}) scale(${zoomLevel.value})`;
});

// 可见节点
const visibleNodes = computed(() => {
  if (!searchQuery.value) return nodes.value;
  const query = searchQuery.value.toLowerCase();
  return nodes.value.filter(node =>
    node.label.toLowerCase().includes(query)
  );
});

// 可见链接
const visibleLinks = computed(() => {
  if (!showLinksOnly.value) return links.value;
  return links.value.filter(link =>
    highlightedNodeIds.value.has(link.source) ||
    highlightedNodeIds.value.has(link.target)
  );
});

// 根据卡片生成概念节点
const generateConceptNodes = () => {
  const newNodes: ConceptNode[] = [];
  const newLinks: ConceptLink[] = [];

  // 为每个学习集创建节点
  const studySetMap = new Map<string, ConceptNode>();
  props.studySets?.forEach((set, index) => {
    const node: ConceptNode = {
      id: `studySet-${set.id}`,
      label: set.name,
      x: 100 + (index % 5) * 200,
      y: 100 + Math.floor(index / 5) * 150,
      width: 120,
      height: 40,
      type: 'studySet',
      data: set,
      linkCount: 0,
    };
    newNodes.push(node);
    studySetMap.set(set.id, node);
  });

  // 为每张卡片创建节点
  const keywordMap = new Map<string, ConceptNode>();
  const tagMap = new Map<string, ConceptNode>();

  props.cards.forEach((card, index) => {
    // 卡片节点
    const cardNode: ConceptNode = {
      id: `card-${card.id}`,
      label: (card.content || card.front || '').slice(0, 20) + '...',
      x: 200 + (index % 8) * 150,
      y: 200 + Math.floor(index / 8) * 100,
      width: 140,
      height: 50,
      type: 'card',
      data: card,
      linkCount: 0,
    };
    newNodes.push(cardNode);

    // 如果卡片属于学习集，创建链接
    if (card.studySetId && studySetMap.has(card.studySetId)) {
      newLinks.push({
        id: `link-${card.studySetId}-${card.id}`,
        source: `studySet-${card.studySetId}`,
        target: `card-${card.id}`,
        type: 'contains',
        weight: 1,
      });
      studySetMap.get(card.studySetId)!.linkCount++;
    }

    // 为卡片内容提取关键词并创建节点
    const content = card.content || card.front || '';
    const keywords = extractKeywords(content);
    keywords.forEach(keyword => {
      if (!keywordMap.has(keyword)) {
        keywordMap.set(keyword, {
          id: `keyword-${keyword}`,
          label: keyword,
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: 80,
          height: 30,
          type: 'keyword',
          linkCount: 0,
        });
      }

      const keywordNode = keywordMap.get(keyword)!;
      keywordNode.linkCount++;

      // 创建卡片与关键词的链接
      newLinks.push({
        id: `link-${card.id}-${keyword}`,
        source: `card-${card.id}`,
        target: `keyword-${keyword}`,
        type: 'related',
        weight: 1,
      });
    });

    // 为卡片标签创建节点
    card.tags?.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, {
          id: `tag-${tag}`,
          label: `#${tag}`,
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: 60,
          height: 30,
          type: 'tag',
          linkCount: 0,
        });
      }

      const tagNode = tagMap.get(tag)!;
      tagNode.linkCount++;

      // 创建卡片与标签的链接
      newLinks.push({
        id: `link-${card.id}-tag-${tag}`,
        source: `card-${card.id}`,
        target: `tag-${tag}`,
        type: 'tagged',
        weight: 1,
      });
    });
  });

  // 添加关键词节点
  newNodes.push(...Array.from(keywordMap.values()));
  // 添加标签节点
  newNodes.push(...Array.from(tagMap.values()));

  // 如果启用了反向链接，添加跨学习集的关联
  if (showBacklinks.value) {
    addCrossReferences(newNodes, newLinks);
  }

  nodes.value = newNodes;
  links.value = newLinks;
};

// 提取关键词
const extractKeywords = (text: string): string[] => {
  // 简单实现：提取 2-4 个字符的中文词组
  const keywords = new Set<string>();
  const matches = text.match(/[\u4e00-\u9fa5]{2,4}/g);
  if (matches) {
    matches.slice(0, 5).forEach(k => keywords.add(k));
  }
  return Array.from(keywords);
};

// 添加跨引用链接
const addCrossReferences = (nodeList: ConceptNode[], linkList: ConceptLink[]) => {
  // 查找共享相同关键词的卡片，建立关联
  const keywordToCards = new Map<string, string[]>();

  props.cards.forEach(card => {
    const content = card.content || card.front || '';
    const keywords = extractKeywords(content);
    keywords.forEach(keyword => {
      if (!keywordToCards.has(keyword)) {
        keywordToCards.set(keyword, []);
      }
      keywordToCards.get(keyword)!.push(card.id);
    });
  });

  // 为共享关键词的卡片建立链接
  keywordToCards.forEach((cardIds, keyword) => {
    if (cardIds.length > 1) {
      for (let i = 0; i < cardIds.length - 1; i++) {
        for (let j = i + 1; j < cardIds.length; j++) {
          linkList.push({
            id: `cross-${cardIds[i]}-${cardIds[j]}`,
            source: `card-${cardIds[i]}`,
            target: `card-${cardIds[j]}`,
            type: 'related',
            weight: 2,
          });
        }
      }
    }
  });
};

// 获取链接路径
const getLinkPath = (link: ConceptLink): string => {
  const source = nodes.value.find(n => n.id === link.source);
  const target = nodes.value.find(n => n.id === link.target);

  if (!source || !target) return '';

  const startX = source.x + source.width / 2;
  const startY = source.y + source.height / 2;
  const endX = target.x + target.width / 2;
  const endY = target.y + target.height / 2;

  // 使用贝塞尔曲线
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const offset = 50;

  return `M ${startX} ${startY} Q ${midX + offset} ${midY - offset} ${endX} ${endY}`;
};

// 获取节点颜色
const getNodeColor = (node: ConceptNode): string => {
  const colors: Record<string, string> = {
    card: 'var(--b3-theme-surface)',
    studySet: 'var(--b3-theme-primary-light)',
    keyword: 'var(--b3-theme-background)',
    tag: 'var(--b3-theme-warning-light)',
  };
  return colors[node.type] || 'var(--b3-theme-surface)';
};

// 获取节点描边颜色
const getNodeStrokeColor = (node: ConceptNode): string => {
  if (selectedNodeId.value === node.id) {
    return 'var(--b3-theme-primary)';
  }
  const colors: Record<string, string> = {
    card: 'var(--b3-theme-border)',
    studySet: 'var(--b3-theme-primary)',
    keyword: 'var(--b3-theme-border)',
    tag: 'var(--b3-theme-warning)',
  };
  return colors[node.type] || 'var(--b3-theme-border)';
};

// 获取节点文字颜色
const getNodeTextColor = (node: ConceptNode): string => {
  return 'var(--b3-theme-on-surface)';
};

// 获取链接颜色
const getLinkColor = (link: ConceptLink): string => {
  const colors: Record<string, string> = {
    reference: 'var(--b3-theme-primary)',
    related: 'var(--b3-theme-success)',
    contains: 'var(--b3-theme-primary)',
    tagged: 'var(--b3-theme-warning)',
  };
  return colors[link.type] || 'var(--b3-theme-primary)';
};

// 判断链接是否高亮
const isHighlightedLink = (link: ConceptLink): boolean => {
  return hoveredLinkId.value === link.id;
};

// 获取节点图标
const getNodeIcon = (node: ConceptNode): string => {
  const icons: Record<string, string> = {
    card: '📝',
    studySet: '📚',
    keyword: '🔑',
    tag: '🏷️',
  };
  return icons[node.type] || '📄';
};

// 获取节点的链接
const getNodeLinks = (nodeId: string): ConceptLink[] => {
  return links.value.filter(
    link => link.source === nodeId || link.target === nodeId
  );
};

// 获取链接来源标签
const getLinkFromLabel = (link: ConceptLink): string => {
  const node = nodes.value.find(n => n.id === link.source);
  return node?.label || '';
};

// 获取链接目标标签
const getLinkToLabel = (link: ConceptLink): string => {
  const node = nodes.value.find(n => n.id === link.target);
  return node?.label || '';
};

// 节点点击
const handleNodeClick = (node: ConceptNode) => {
  selectedNodeId.value = node.id;
  selectedNode.value = node;
  highlightedNodeIds.value.clear();

  // 高亮相连的节点
  const connectedLinks = getNodeLinks(node.id);
  connectedLinks.forEach(link => {
    const otherId = link.source === node.id ? link.target : link.source;
    highlightedNodeIds.value.add(otherId);
  });

  emit('node-click', node);
};

// 节点双击
const handleNodeDoubleClick = (node: ConceptNode) => {
  // 可以打开详细视图
  console.log('Double click node:', node);
};

// 链接点击
const handleLinkClick = (link: ConceptLink) => {
  emit('link-click', link);
};

// 链接悬停
const handleLinkEnter = (link: ConceptLink) => {
  hoveredLinkId.value = link.id;
  highlightedNodeIds.value.clear();
  highlightedNodeIds.value.add(link.source);
  highlightedNodeIds.value.add(link.target);
};

// 链接离开
const handleLinkLeave = () => {
  hoveredLinkId.value = null;
};

// 关闭侧边面板
const closeSidePanel = () => {
  selectedNode.value = null;
  selectedNodeId.value = null;
  highlightedNodeIds.value.clear();
};

// 适应视图
const fitView = () => {
  viewBox.value = { x: 0, y: 0, width: 1200, height: 800 };
  zoomLevel.value = 1;
};

// 放大
const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value + 0.2);
};

// 缩小
const zoomOut = () => {
  zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.2);
};

// 滚轮缩放
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoomLevel.value = Math.max(0.3, Math.min(3, zoomLevel.value + delta));
};

// 开始平移
const startPan = (e: MouseEvent) => {
  isPanning.value = true;
  panStart.value = {
    x: e.clientX + viewBox.value.x,
    y: e.clientY + viewBox.value.y,
  };
};

// 平移
const pan = (e: MouseEvent) => {
  if (!isPanning.value) return;
  viewBox.value.x = panStart.value.x - e.clientX;
  viewBox.value.y = panStart.value.y - e.clientY;
};

// 结束平移
const endPan = () => {
  isPanning.value = false;
};

// 监听数据变化
watch(
  () => [props.cards, props.studySets, showBacklinks.value],
  () => {
    generateConceptNodes();
  },
  { immediate: true, deep: true }
);
</script>

<style scoped lang="scss">
.concept-map {
  display: flex;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.concept-map-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  margin-right: 8px;
  border-right: 1px solid var(--b3-border-color);

  &:last-child {
    border-right: none;
  }
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.toolbar-search {
  padding: 6px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  width: 200px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

/* 内容区域 */
.concept-map-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.concept-map-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 连接线 */
.concept-link {
  fill: none;
  stroke-width: 2;
  opacity: 0.6;
  cursor: pointer;
  transition: all 0.2s ease;

  &--highlighted {
    stroke-width: 3;
    opacity: 1;
    stroke: var(--b3-theme-warning) !important;
  }

  &:hover {
    opacity: 1;
    stroke-width: 3;
  }
}

/* 概念节点 */
.concept-node {
  cursor: pointer;
  transition: all 0.2s ease;

  &--selected {
    filter: drop-shadow(0 0 8px var(--b3-theme-primary));
  }

  &--highlighted {
    opacity: 1;
  }

  &__text {
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__icon {
    font-size: 14px;
  }

  &__link-count {
    font-weight: 600;
  }
}

/* 侧边面板 */
.concept-side-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.side-panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-color);
}

.side-panel-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--b3-theme-background);
  }
}

.side-panel-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.link-section {
  margin-bottom: 16px;
}

.link-section-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-color-light);
  text-transform: uppercase;
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  padding: 10px 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-primary-light);
  }

  &__from,
  &__to {
    font-size: 12px;
    color: var(--b3-theme-on-surface);
  }

  &__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }

  &__arrow {
    font-size: 12px;
    color: var(--b3-theme-primary);
    margin: 4px 0;
  }
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

  svg {
    margin-bottom: 16px;
  }

  p {
    margin: 8px 0;
  }

  &-hint {
    font-size: 12px;
    opacity: 0.7;
  }
}
</style>
