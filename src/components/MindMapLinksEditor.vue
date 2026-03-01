<template>
  <div class="mindmap-links-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        class="tool-btn"
        :class="{ active: tool === 'select' }"
        @click="tool = 'select'"
        title="选择工具"
      >
        <span>🖱️</span>
        选择
      </button>
      <button
        class="tool-btn"
        :class="{ active: tool === 'link' }"
        @click="tool = 'link'"
        title="连线工具"
      >
        <span>🔗</span>
        连线
      </button>
      <button
        class="tool-btn"
        :class="{ active: tool === 'free' }"
        @click="tool = 'free'"
        title="自由节点工具"
      >
        <span>📌</span>
        自由节点
      </button>
      <div class="divider"></div>
      <button
        class="tool-btn"
        @click="showThemeSelector = !showThemeSelector"
        title="切换主题"
      >
        <span>🎨</span>
        主题
      </button>
      <button
        class="tool-btn"
        @click="exportSVG"
        title="导出 SVG"
      >
        <span>📤</span>
        导出
      </button>
    </div>

    <!-- 主题选择器 -->
    <div v-if="showThemeSelector" class="theme-selector">
      <div class="theme-grid">
        <button
          v-for="theme in themes"
          :key="theme.id"
          :class="['theme-btn', { active: currentTheme === theme.id }]"
          @click="selectTheme(theme.id)"
        >
          <div
            class="theme-preview"
            :style="{ backgroundColor: theme.colors.background }"
          >
            <div
              class="theme-node root"
              :style="{ backgroundColor: theme.colors.root }"
            ></div>
            <div
              class="theme-node branch"
              :style="{ backgroundColor: theme.colors.branch }"
            ></div>
            <div
              class="theme-node free"
              :style="{ backgroundColor: theme.colors.free }"
            ></div>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </button>
      </div>
    </div>

    <!-- 连线设置面板 -->
    <div v-if="selectedLink" class="link-settings">
      <h4>连线设置</h4>
      <div class="setting-row">
        <label>类型</label>
        <select v-model="selectedLink.type" @change="updateLink">
          <option value="default">默认</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
          <option value="curved">曲线</option>
          <option value="straight">直线</option>
        </select>
      </div>
      <div class="setting-row">
        <label>颜色</label>
        <input type="color" v-model="selectedLink.color" @change="updateLink" />
      </div>
      <div class="setting-row">
        <label>线宽</label>
        <input type="range" min="1" max="10" v-model.number="selectedLink.strokeWidth" @change="updateLink" />
        <span>{{ selectedLink.strokeWidth }}px</span>
      </div>
      <div class="setting-row">
        <label>标签</label>
        <input type="text" v-model="selectedLink.label" @change="updateLink" placeholder="输入关系说明" />
      </div>
      <button class="delete-btn" @click="deleteSelectedLink">删除连线</button>
    </div>

    <!-- 自由节点列表 -->
    <div class="free-nodes-panel">
      <h4>自由节点 ({{ freeNodes.length }})</h4>
      <div class="free-nodes-list">
        <div
          v-for="node in freeNodes"
          :key="node.id"
          :class="['free-node-item', { selected: selectedNodeId === node.id }]"
          @click="selectNode(node.id)"
        >
          <span class="node-content">{{ node.content }}</span>
          <div class="node-actions">
            <button @click.stop="convertToBranch(node)" title="转换为分支节点">🌿</button>
            <button @click.stop="deleteFreeNode(node.id)" title="删除">🗑️</button>
          </div>
        </div>
      </div>
      <button class="add-free-node-btn" @click="startAddFreeNode">
        + 添加自由节点
      </button>
    </div>

    <!-- SVG 画布 -->
    <div class="canvas-container" ref="canvasContainer">
      <svg
        ref="svgCanvas"
        class="mindmap-canvas"
        :style="{
          backgroundColor: currentThemeData.colors.background,
          cursor: canvasCursor
        }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @click="handleCanvasClick"
      >
        <!-- 连线层 -->
        <g class="links-layer">
          <path
            v-for="link in links"
            :key="link.id"
            :d="getLinkPath(link)"
            :stroke="link.color || currentThemeData.colors.link"
            :stroke-width="link.strokeWidth || 2"
            :stroke-dasharray="getLinkDashArray(link.type)"
            fill="none"
            :class="['link-path', { selected: selectedLink?.id === link.id }]"
            @click.stop="selectLink(link)"
          />
        </g>

        <!-- 节点层 -->
        <g class="nodes-layer">
          <!-- 树形节点 -->
          <g
            v-for="node in treeNodes"
            :key="node.id"
            :transform="`translate(${node.position.x}, ${node.position.y})`"
            :class="['tree-node', { selected: selectedNodeId === node.id }]"
            @click.stop="selectNode(node.id)"
          >
            <rect
              :width="node.size?.width || 100"
              :height="node.size?.height || 40"
              :rx="node.style?.borderRadius || 8"
              :fill="node.style?.backgroundColor || getNodeColor(node.type)"
              :stroke="node.style?.borderColor || 'transparent'"
              :stroke-width="node.style?.borderWidth || 0"
            />
            <text
              :x="(node.size?.width || 100) / 2"
              :y="(node.size?.height || 40) / 2"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="node.style?.color || currentThemeData.colors.text"
            >
              {{ node.content }}
            </text>
          </g>

          <!-- 自由节点 -->
          <g
            v-for="node in freeNodes"
            :key="node.id"
            :transform="`translate(${node.position.x}, ${node.position.y})`"
            :class="['free-node', { selected: selectedNodeId === node.id, dragging: draggingNodeId === node.id }]"
            @mousedown.stop="startDragNode($event, node.id)"
            @click.stop="selectNode(node.id)"
          >
            <rect
              :width="node.size?.width || 100"
              :height="node.size?.height || 40"
              :rx="node.style?.borderRadius || 8"
              :fill="node.style?.backgroundColor || currentThemeData.colors.free"
              :stroke="node.style?.borderColor || '#5a9f5a'"
              :stroke-width="node.style?.borderWidth || 2"
            />
            <text
              :x="(node.size?.width || 100) / 2"
              :y="(node.size?.height || 40) / 2"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="node.style?.color || currentThemeData.colors.text"
            >
              {{ node.content }}
            </text>
          </g>
        </g>

        <!-- 拖拽连线预览 -->
        <g v-if="dragLink" class="drag-link-preview">
          <path
            :d="dragLinkPath"
            :stroke="currentThemeData.colors.link"
            stroke-width="2"
            stroke-dasharray="5,5"
            fill="none"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  MindMapLink,
  MindMapLinkType,
  EnhancedMindMapNode,
  EnhancedMindMapData,
  MindMapNodeType,
  MindMapTheme,
  MINDMAP_THEMES,
  createId,
  createMindMapLink,
  createEnhancedNode,
  calculateLinkPath,
  getNodeCanvasPosition
} from '@/types/mindmapEnhanced';
import { mindMapLinkService } from '@/services/mindmapLinkService';

interface Props {
  mindMap: EnhancedMindMapData;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:mindMap', value: EnhancedMindMapData): void;
  (e: 'node-select', nodeId: string): void;
  (e: 'link-select', linkId: string): void;
}>();

// 工具状态
const tool = ref<'select' | 'link' | 'free'>('select');

// 主题相关
const showThemeSelector = ref(false);
const currentTheme = ref<string>('default');
const themes = MINDMAP_THEMES;

const currentThemeData = computed(() => {
  return themes.find(t => t.id === currentTheme.value) || themes[0];
});

const selectTheme = (themeId: string) => {
  currentTheme.value = themeId;
  if (props.mindMap) {
    props.mindMap.theme = currentThemeData.value;
    emit('update:mindMap', { ...props.mindMap });
  }
};

// 节点和连线
const treeNodes = computed(() => Object.values(props.mindMap?.nodes || {}));
const freeNodes = computed(() => props.mindMap?.freeNodes || []);
const links = computed(() => props.mindMap?.links || []);

// 选中状态
const selectedNodeId = ref<string | null>(null);
const selectedLink = ref<MindMapLink | null>(null);

// 拖拽状态
const draggingNodeId = ref<string | null>(null);
const dragLink = ref<{
  sourceId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null>(null);

const dragLinkPath = computed(() => {
  if (!dragLink.value) return '';
  const { startX, startY, endX, endY } = dragLink.value;
  // 简单的直线路径
  return `M ${startX} ${startY} L ${endX} ${endY}`;
});

// 画布引用
const canvasContainer = ref<HTMLElement | null>(null);
const svgCanvas = ref<SVGSVGElement | null>(null);

// 画布光标
const canvasCursor = computed(() => {
  if (tool.value === 'link') return 'crosshair';
  if (draggingNodeId.value) return 'grabbing';
  return 'default';
});

// 选择节点
const selectNode = (nodeId: string) => {
  selectedNodeId.value = nodeId;
  selectedLink.value = null;
  emit('node-select', nodeId);
};

// 选择连线
const selectLink = (link: MindMapLink) => {
  selectedLink.value = link;
  selectedNodeId.value = null;
  emit('link-select', link.id);
};

// 更新连线
const updateLink = () => {
  if (selectedLink.value && props.mindMap) {
    mindMapLinkService.updateLink(props.mindMap, selectedLink.value.id, {
      type: selectedLink.value.type,
      color: selectedLink.value.color,
      strokeWidth: selectedLink.value.strokeWidth,
      label: selectedLink.value.label
    });
    emit('update:mindMap', { ...props.mindMap });
  }
};

// 删除选中的连线
const deleteSelectedLink = () => {
  if (selectedLink.value && props.mindMap) {
    mindMapLinkService.removeLink(props.mindMap, selectedLink.value.id);
    selectedLink.value = null;
    emit('update:mindMap', { ...props.mindMap });
  }
};

// 获取连线路径
const getLinkPath = (link: MindMapLink) => {
  if (!props.mindMap) return '';
  return mindMapLinkService.getLinkPath(props.mindMap, link);
};

// 获取虚线样式
const getLinkDashArray = (type: MindMapLinkType) => {
  switch (type) {
    case MindMapLinkType.DASHED:
      return '5,5';
    case MindMapLinkType.DOTTED:
      return '2,2';
    default:
      return 'none';
  }
};

// 获取节点颜色
const getNodeColor = (type: MindMapNodeType) => {
  switch (type) {
    case MindMapNodeType.ROOT:
      return currentThemeData.value.colors.root;
    case MindMapNodeType.BRANCH:
      return currentThemeData.value.colors.branch;
    case MindMapNodeType.FREE:
      return currentThemeData.value.colors.free;
    default:
      return currentThemeData.value.colors.branch;
  }
};

// 开始添加自由节点
const startAddFreeNode = () => {
  tool.value = 'free';
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect();
    const node = mindMapLinkService.addFreeNode(
      props.mindMap,
      '新节点',
      {
        x: rect.width / 2 - 50,
        y: rect.height / 2 - 20
      }
    );
    selectNode(node.id);
    emit('update:mindMap', { ...props.mindMap });
  }
};

// 删除自由节点
const deleteFreeNode = (nodeId: string) => {
  if (props.mindMap) {
    mindMapLinkService.removeFreeNode(props.mindMap, nodeId);
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null;
    }
    emit('update:mindMap', { ...props.mindMap });
  }
};

// 转换自由节点为分支节点
const convertToBranch = (node: EnhancedMindMapNode) => {
  if (!props.mindMap || !props.mindMap.rootId) return;
  mindMapLinkService.convertToBranchNode(props.mindMap, node.id, props.mindMap.rootId);
  emit('update:mindMap', { ...props.mindMap });
};

// 鼠标事件处理
const handleMouseDown = (e: MouseEvent) => {
  if (tool.value === 'link' && selectedNodeId.value) {
    // 开始拖拽连线
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      dragLink.value = {
        sourceId: selectedNodeId.value,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top
      };
    }
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (dragLink.value) {
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      dragLink.value.endX = e.clientX - rect.left;
      dragLink.value.endY = e.clientY - rect.top;
    }
  }

  if (draggingNodeId.value && props.mindMap) {
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mindMapLinkService.moveFreeNode(props.mindMap, draggingNodeId.value, { x, y });
      emit('update:mindMap', { ...props.mindMap });
    }
  }
};

const handleMouseUp = (e: MouseEvent) => {
  if (dragLink.value) {
    // 检查是否释放到另一个节点上
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      // 查找目标节点
      const targetNode = [...treeNodes.value, ...freeNodes.value].find(node => {
        const pos = node.type === MindMapNodeType.FREE
          ? node.position
          : getNodeCanvasPosition(node, props.mindMap?.nodes || {});
        const width = node.size?.width || 100;
        const height = node.size?.height || 40;
        return endX >= pos.x && endX <= pos.x + width &&
               endY >= pos.y && endY <= pos.y + height;
      });

      if (targetNode && targetNode.id !== dragLink.value.sourceId) {
        // 创建连线
        if (!mindMapLinkService.hasLink(props.mindMap, dragLink.value.sourceId, targetNode.id)) {
          mindMapLinkService.addLink(
            props.mindMap,
            dragLink.value.sourceId,
            targetNode.id,
            MindMapLinkType.CURVED
          );
          emit('update:mindMap', { ...props.mindMap });
        }
      }
    }

    dragLink.value = null;
  }

  draggingNodeId.value = null;
};

const handleCanvasClick = (e: MouseEvent) => {
  if (tool.value === 'free') {
    const rect = svgCanvas.value?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = mindMapLinkService.addFreeNode(
        props.mindMap,
        '新节点',
        { x, y }
      );
      selectNode(node.id);
      emit('update:mindMap', { ...props.mindMap });
    }
  } else {
    selectedNodeId.value = null;
    selectedLink.value = null;
  }
};

// 开始拖拽节点
const startDragNode = (e: MouseEvent, nodeId: string) => {
  if (tool.value === 'select') {
    draggingNodeId.value = nodeId;
    selectNode(nodeId);
  }
};

// 导出 SVG
const exportSVG = () => {
  if (!props.mindMap || !canvasContainer.value) return;

  const svgContent = mindMapLinkService.exportToSVG(props.mindMap, canvasContainer.value.id);
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.mindMap.title || 'mindmap'}.svg`;
  a.click();

  URL.revokeObjectURL(url);
};
</script>

<style scoped lang="scss">
.mindmap-links-editor {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-background);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-theme-divider);
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
  }

  span {
    font-size: 14px;
  }
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--b3-theme-divider);
  margin: 0 8px;
}

.theme-selector {
  position: absolute;
  top: 50px;
  right: 8px;
  z-index: 100;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 2px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .theme-preview {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 4px;
  }

  .theme-node {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .theme-name {
    font-size: 11px;
  }
}

.link-settings {
  position: absolute;
  top: 50px;
  left: 8px;
  z-index: 100;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .setting-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    label {
      font-size: 12px;
      min-width: 50px;
    }

    select, input[type="text"] {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid var(--b3-theme-divider);
      border-radius: 4px;
      background: var(--b3-theme-background);
      font-size: 12px;
    }

    input[type="color"] {
      width: 40px;
      height: 28px;
      border: 1px solid var(--b3-theme-divider);
      border-radius: 4px;
      cursor: pointer;
    }

    input[type="range"] {
      flex: 1;
    }

    span {
      font-size: 12px;
      min-width: 40px;
    }
  }

  .delete-btn {
    width: 100%;
    padding: 8px;
    margin-top: 8px;
    border: 1px solid #ff4444;
    border-radius: 4px;
    background: #ff4444;
    color: white;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: #ff6666;
    }
  }
}

.free-nodes-panel {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 100;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .free-nodes-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 150px;
    overflow-y: auto;
  }

  .free-node-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    cursor: pointer;
    font-size: 12px;

    &:hover {
      border-color: var(--b3-theme-primary);
    }

    &.selected {
      border-color: var(--b3-theme-primary);
      background: var(--b3-theme-primary-light);
    }

    .node-content {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-actions {
      display: flex;
      gap: 4px;

      button {
        padding: 2px 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        font-size: 12px;

        &:hover {
          background: var(--b3-theme-divider);
        }
      }
    }
  }

  .add-free-node-btn {
    width: 100%;
    padding: 8px;
    margin-top: 8px;
    border: 1px dashed var(--b3-theme-primary);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-primary);
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: var(--b3-theme-primary-light);
    }
  }
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.mindmap-canvas {
  width: 100%;
  height: 100%;
}

.link-path {
  cursor: pointer;
  transition: stroke-width 0.2s;

  &:hover {
    stroke-width: 4;
  }

  &.selected {
    stroke: var(--b3-theme-primary) !important;
    stroke-width: 3;
  }
}

.tree-node,
.free-node {
  cursor: pointer;

  &:hover rect {
    stroke: var(--b3-theme-primary);
    stroke-width: 2;
  }

  &.selected rect {
    stroke: var(--b3-theme-primary);
    stroke-width: 3;
  }

  &.dragging {
    opacity: 0.8;
  }
}

.free-node {
  cursor: grab;

  &.dragging {
    cursor: grabbing;
  }
}
</style>
