<!-- src/components/OutlineView.vue -->
<template>
  <div class="outline-view">
    <!-- 工具栏 -->
    <div class="outline-toolbar">
      <div class="toolbar-group">
        <button @click="expandAll" class="toolbar-btn" title="展开全部">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        </button>
        <button @click="collapseAll" class="toolbar-btn" title="收起全部">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="addNode" class="toolbar-btn" title="添加节点 (Enter)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button @click="addSiblingNode" class="toolbar-btn" title="添加同级节点 (Tab)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" transform="rotate(90 12 12)"/>
          </svg>
        </button>
        <button @click="indentNode" class="toolbar-btn" title="缩进 (Tab)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 17h10v-2H11v2zM11 3v2h10V3H11zM3 3v2h14V3H3z"/>
          </svg>
        </button>
        <button @click="outdentNode" class="toolbar-btn" title="取消缩进 (Shift+Tab)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zM11 3v2h10V3H11zM3 3v2h14V3H3z"/>
          </svg>
        </button>
        <button @click="deleteNode" class="toolbar-btn toolbar-btn-danger" title="删除节点 (Delete)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <button @click="switchToMindMap" class="toolbar-btn" title="切换到思维导图">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-8 10H4V5h10v14zm6-12h-2v2h2v-2zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 大纲内容 -->
    <div class="outline-content" ref="contentRef">
      <div
        v-for="(node, index) in visibleNodes"
        :key="node.id"
        :class="['outline-node', {
          'outline-node--selected': selectedNodeId === node.id,
          'outline-node--editing': editingNodeId === node.id,
        }]"
        :style="{ paddingLeft: `${node.level * 24 + 12}px` }"
        @click="selectNode(node)"
        @dblclick="startEditing(node)"
      >
        <!-- 展开/折叠按钮 -->
        <button
          v-if="node.hasChildren"
          @click.stop="toggleExpand(node)"
          :class="['outline-node__toggle', { 'outline-node__toggle--expanded': node.expanded }]"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        <span v-else class="outline-node__toggle-placeholder"></span>

        <!-- 节点内容 -->
        <div class="outline-node__content">
          <template v-if="editingNodeId === node.id">
            <textarea
              ref="editingTextareaRef"
              v-model="editingText"
              @blur="stopEditing"
              @keydown.enter.stop.prevent="handleEditEnter"
              @keydown.esc.stop="cancelEditing"
              class="outline-node__textarea"
              rows="1"
            ></textarea>
          </template>
          <template v-else>
            <span class="outline-node__text">{{ node.text }}</span>
            <span v-if="node.annotation" class="outline-node__meta">
              <span class="outline-node__badge" :class="`badge--${node.annotation.level}`">
                {{ getLevelLabel(node.annotation.level) }}
              </span>
              <span v-if="node.annotation.page" class="outline-node__page">
                P{{ node.annotation.page }}
              </span>
            </span>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="nodes.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" opacity="0.3">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
        <p>暂无内容</p>
        <p class="empty-state-hint">双击节点或按 Enter 键添加内容</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { PDFAnnotation } from '../types/annotaion';

interface OutlineNode {
  id: string;
  text: string;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  parentId: string | null;
  annotation?: PDFAnnotation;
  children: OutlineNode[];
}

interface Props {
  annotations: PDFAnnotation[];
}

const props = withDefaults(defineProps<Props>(), {
  annotations: () => []
});

const emit = defineEmits<{
  (e: 'node-click', annotation: PDFAnnotation): void;
  (e: 'node-add', parentNode: PDFAnnotation | null): void;
  (e: 'node-edit', annotation: PDFAnnotation, newContent: string): void;
  (e: 'node-delete', annotation: PDFAnnotation): void;
  (e: 'switch-to-mindmap'): void;
}>();

const contentRef = ref<HTMLDivElement>();
const editingTextareaRef = ref<HTMLTextAreaElement>();

// 状态
const nodes = ref<OutlineNode[]>([]);
const selectedNodeId = ref<string | null>(null);
const editingNodeId = ref<string | null>(null);
const editingText = ref('');
const expandedNodeIds = ref<Set<string>>(new Set());

// 将标注转换为大纲节点
const convertAnnotationsToOutline = (): OutlineNode[] => {
  if (!props.annotations || props.annotations.length === 0) {
    return [];
  }

  // 按级别和位置排序
  const sortedAnnotations = [...props.annotations].sort((a, b) => {
    // 首先按级别排序
    const levelOrder = ['title1', 'title2', 'title3', 'title4', 'title5', 'text'];
    const aLevelIndex = levelOrder.indexOf(a.level || 'text');
    const bLevelIndex = levelOrder.indexOf(b.level || 'text');

    if (aLevelIndex !== bLevelIndex) {
      return aLevelIndex - bLevelIndex;
    }

    // 同级别按页码排序
    if (a.page !== b.page) {
      return a.page - b.page;
    }

    // 同页按位置排序
    return (a.startPos || 0) - (b.startPos || 0);
  });

  // 构建树形结构
  const rootNodes: OutlineNode[] = [];
  const nodeStack: OutlineNode[] = [];

  for (const ann of sortedAnnotations) {
    const node: OutlineNode = {
      id: ann.id,
      text: ann.text || ann.excerpt || '',
      level: getLevelNumber(ann.level || 'text'),
      expanded: true,
      hasChildren: false,
      parentId: null,
      annotation: ann,
      children: [],
    };

    // 找到合适的父节点
    while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= node.level) {
      nodeStack.pop();
    }

    if (nodeStack.length > 0) {
      const parent = nodeStack[nodeStack.length - 1];
      node.parentId = parent.id;
      parent.hasChildren = true;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }

    nodeStack.push(node);
  }

  return rootNodes;
};

// 获取级别数字
const getLevelNumber = (level: string): number => {
  const match = level.match(/title(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return 6; // text 级别
};

// 获取级别标签
const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    'title1': 'H1',
    'title2': 'H2',
    'title3': 'H3',
    'title4': 'H4',
    'title5': 'H5',
    'text': '正文',
  };
  return labels[level] || level;
};

// 获取可见节点（扁平化）
const visibleNodes = computed(() => {
  const result: OutlineNode[] = [];
  const visited = new Set<string>();

  const traverse = (nodeList: OutlineNode[], visible: boolean) => {
    for (const node of nodeList) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      if (visible) {
        result.push(node);
      }

      if (node.hasChildren && node.expanded && visible) {
        traverse(node.children, true);
      } else if (node.hasChildren) {
        traverse(node.children, false);
      }
    }
  };

  traverse(nodes.value, true);
  return result;
});

// 选择节点
const selectNode = (node: OutlineNode) => {
  selectedNodeId.value = node.id;
  if (node.annotation) {
    emit('node-click', node.annotation);
  }
};

// 切换展开/折叠
const toggleExpand = (node: OutlineNode) => {
  node.expanded = !node.expanded;
  if (expandedNodeIds.value.has(node.id)) {
    expandedNodeIds.value.delete(node.id);
  } else {
    expandedNodeIds.value.add(node.id);
  }
};

// 展开全部
const expandAll = () => {
  const updateExpanded = (nodeList: OutlineNode[]) => {
    for (const node of nodeList) {
      node.expanded = true;
      if (node.hasChildren) {
        updateExpanded(node.children);
      }
    }
  };
  updateExpanded(nodes.value);
};

// 收起全部
const collapseAll = () => {
  const updateExpanded = (nodeList: OutlineNode[]) => {
    for (const node of nodeList) {
      node.expanded = false;
      if (node.hasChildren) {
        updateExpanded(node.children);
      }
    }
  };
  updateExpanded(nodes.value);
};

// 添加节点
const addNode = () => {
  const selectedNode = nodes.value.find(n => n.id === selectedNodeId.value);
  emit('node-add', selectedNode?.annotation || null);
};

// 添加同级节点
const addSiblingNode = () => {
  emit('node-add', null);
};

// 缩进节点
const indentNode = () => {
  // TODO: 实现节点缩进逻辑
  console.log('Indent node');
};

// 取消缩进节点
const outdentNode = () => {
  // TODO: 实现节点取消缩进逻辑
  console.log('Outdent node');
};

// 删除节点
const deleteNode = () => {
  if (!selectedNodeId.value) return;
  const node = nodes.value.find(n => n.id === selectedNodeId.value);
  if (node?.annotation) {
    emit('node-delete', node.annotation);
  }
  selectedNodeId.value = null;
};

// 开始编辑
const startEditing = (node: OutlineNode) => {
  editingNodeId.value = node.id;
  editingText.value = node.text;
  nextTick(() => {
    editingTextareaRef.value?.focus();
  });
};

// 停止编辑
const stopEditing = () => {
  if (!editingNodeId.value) return;
  const node = nodes.value.find(n => n.id === editingNodeId.value);
  if (node?.annotation && editingText.value.trim()) {
    emit('node-edit', node.annotation, editingText.value.trim());
  }
  editingNodeId.value = null;
  editingText.value = '';
};

// 取消编辑
const cancelEditing = () => {
  editingNodeId.value = null;
  editingText.value = '';
};

// 编辑时按 Enter
const handleEditEnter = () => {
  stopEditing();
  addSiblingNode();
};

// 切换到思维导图
const switchToMindMap = () => {
  emit('switch-to-mindmap');
};

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (editingNodeId.value) return; // 正在编辑时不处理

  if (!selectedNodeId.value) return;

  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      addSiblingNode();
      break;
    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        outdentNode();
      } else {
        indentNode();
      }
      break;
    case 'Delete':
    case 'Backspace':
      e.preventDefault();
      deleteNode();
      break;
    case 'ArrowUp':
      e.preventDefault();
      navigateNode(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      navigateNode(1);
      break;
  }
};

// 导航节点
const navigateNode = (direction: number) => {
  const currentIndex = visibleNodes.value.findIndex(n => n.id === selectedNodeId.value);
  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < visibleNodes.value.length) {
    selectNode(visibleNodes.value[newIndex]);
  }
};

// 监听数据变化
watch(() => props.annotations, () => {
  nodes.value = convertAnnotationsToOutline();
}, { immediate: true, deep: true });

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped lang="scss">
.outline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏样式 */
.outline-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-border-color);
  flex-shrink: 0;
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.toolbar-btn-danger:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

/* 内容区域 */
.outline-content {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.outline-node {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--b3-theme-surface);
  }

  &--selected {
    background: var(--b3-theme-primary-light);
  }

  &--editing {
    background: var(--b3-theme-surface);
  }

  &__toggle {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--b3-theme-on-surface);
    flex-shrink: 0;
    transition: transform 0.15s ease;

    &--expanded {
      transform: rotate(90deg);
    }

    &:hover {
      color: var(--b3-theme-primary);
    }

    &-placeholder {
      width: 20px;
      flex-shrink: 0;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
  }

  &__text {
    color: var(--b3-theme-on-surface);
    word-break: break-word;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-on-surface);

    &--title1 { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    &--title2 { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
    &--title3 { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
    &--title4 { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    &--title5 { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
  }

  &__page {
    font-size: 10px;
    color: var(--b3-theme-on-surface-light);
  }

  &__textarea {
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-primary);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    font-size: 13px;
    resize: none;
    font-family: inherit;
    line-height: 1.5;

    &:focus {
      outline: none;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--b3-theme-on-surface-light);
  text-align: center;
  padding: 40px;

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
