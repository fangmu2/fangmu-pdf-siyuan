<!-- src/components/AnnotationList.vue -->
<template>
  <div class="annotation-list-container">
    <!-- 目录侧边栏 -->
    <div
      v-if="showToc && tocItems.length > 0"
      class="toc-sidebar"
      :style="{ width: tocWidth + 'px' }"
    >
      <div class="toc-header">
        <span>📑 目录</span>
        <button class="toc-toggle" @click="showToc = false" title="隐藏目录">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="toc-body">
        <div
          v-for="item in tocItems"
          :key="item.id"
          class="toc-item"
          :class="`toc-level-${item.level}`"
          @click="scrollToAnnotation(item.id)"
          :title="item.text"
        >
          <span class="toc-marker"></span>
          <span class="toc-text">{{ item.text }}</span>
        </div>
      </div>
      <!-- 拖动调整大小的手柄 -->
      <div
        class="toc-resize-handle"
        @mousedown="startTocResize"
      ></div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content" :class="{ 'with-toc': showToc && tocItems.length > 0 }">
      <!-- 头部 -->
      <div class="list-header">
        <div class="header-title">
          <span class="title-text">标注列表</span>
          <span class="count-badge">{{ annotations.length }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="header-actions">
          <button
            v-if="tocItems.length > 0"
            @click="showToc = !showToc"
            class="action-btn"
            :class="{ active: showToc }"
            title="显示/隐藏目录"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
          <button
            v-if="annotations.length > 0"
            @click="exportMarkdown"
            class="action-btn"
            title="导出为Markdown"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button
            @click="refresh"
            class="action-btn"
            title="刷新"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 拖拽提示 -->
      <div v-if="dragTip" class="drag-tip">
        {{ dragTip }}
      </div>

      <!-- 标注列表 -->
      <div class="list-body" ref="listBodyRef">
        <div v-if="loading" class="loading-tip">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="annotations.length === 0" class="empty-tip">
          <div class="empty-icon">📝</div>
          <div class="empty-title">暂无标注</div>
          <div class="empty-hint">在 PDF 中选择文本或图片<br>标注会自动显示在这里</div>
        </div>

        <!-- 连贯的文档式标注列表 -->
        <div v-else class="document-view">
        <!-- 插入光标指示器（顶部） -->
        <div
          v-if="!props.cursorAfterId"
          class="insert-cursor active"
          @click="setCursor(null, $event)"
          title="点击此处，新摘录将插入到最前面"
        >
          <div class="cursor-line"></div>
          <span class="cursor-label">↑ 新摘录将插入此处</span>
        </div>

        <template v-for="(node, index) in documentTree" :key="node.isPageBreak ? `page-${node.page}-${index}` : node.annotation.id">
          <!-- 页码分隔 -->
          <div v-if="node.isPageBreak" class="page-separator">
            <span class="page-num">第 {{ node.page }} 页</span>
          </div>

          <!-- 标题节点（有Typora风格折叠功能） -->
          <template v-else-if="isHeadingNode(node)">
            <div
              class="doc-heading"
              :class="[
                `heading-${node.annotation.level}`,
                `color-accent-${node.annotation.color}`,
                {
                  'drag-over': dragOverId === node.annotation.id,
                  'dragging': draggingId === node.annotation.id,
                  'is-foldable': canFold(node),
                  'is-collapsed': isCollapsed(node),
                  'selected': selectedAnnotationId === node.annotation.id
                }
              ]"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
              :data-annotation-id="node.annotation.id"
              draggable="true"
              @dragstart="onDragStart($event, node.annotation)"
              @dragend="onDragEnd"
              @dragover="onDragOver($event, node.annotation)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, node.annotation)"
              @click="handleHeadingClick(node, $event)"
              @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
            >
              <!-- 折叠指示器（Typora风格） -->
              <div
                v-if="canFold(node)"
                class="fold-indicator"
                @click.stop="toggleHeadingFold(node.annotation.id, $event)"
                :title="isCollapsed(node) ? '点击展开' : '点击折叠'"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <div class="heading-prefix">{{ getHeadingPrefix(node.annotation.level!) }}</div>
              <div class="heading-content">
                <span class="heading-text">{{ node.annotation.text }}</span>
                <span v-if="hasChildren(node.annotation)" class="merged-count">
                  +{{ getChildren(node.annotation.id).length }}
                </span>
              </div>
              <div class="hover-actions">
                <button class="action-icon" @click.stop="editAnnotation(node.annotation)" title="编辑">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="action-icon" @click.stop="unmergeAnnotation(node.annotation)" v-if="node.annotation.parentId" title="取消合并">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
                <button class="action-icon delete" @click.stop="deleteAnnotation(node.annotation)" title="删除">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 合并到标题的子块（直接显示，不折叠） -->
            <div
              v-if="hasChildren(node.annotation) && !isCollapsed(node)"
              class="merged-children"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
            >
              <ChildBlock
                v-for="child in getChildren(node.annotation.id)"
                :key="child.id"
                :annotation="child"
                :all-annotations="props.annotations"
                :dragging-id="draggingId"
                :drag-over-id="dragOverId"
                :image-status="imageStatus"
                @click="handleDoubleClick"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
                @edit="editAnnotation"
                @unmerge="unmergeAnnotation"
                @delete="deleteAnnotation"
                @image-load="handleImageLoad"
                @image-error="handleImageError"
              />
            </div>
          </template>

          <!-- 正文标注节点（直接显示合并的子块） -->
          <template v-else-if="isTextNode(node)">
            <div
              class="doc-paragraph"
              :class="[
                `color-accent-${node.annotation.color}`,
                {
                  'drag-over': dragOverId === node.annotation.id,
                  'dragging': draggingId === node.annotation.id,
                  'selected': selectedAnnotationId === node.annotation.id
                }
              ]"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
              :data-annotation-id="node.annotation.id"
              draggable="true"
              @dragstart="onDragStart($event, node.annotation)"
              @dragend="onDragEnd"
              @dragover="onDragOver($event, node.annotation)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, node.annotation)"
              @click="handleDoubleClick(node.annotation)"
              @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
            >
              <div class="paragraph-marker"></div>
              <div class="paragraph-content">
                <p class="paragraph-text">{{ node.annotation.text }}</p>
                <div v-if="node.annotation.note" class="paragraph-note">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                  </svg>
                  <span>{{ node.annotation.note }}</span>
                </div>
              </div>
              <div class="hover-actions">
                <button class="action-icon" @click.stop="editAnnotation(node.annotation)" title="编辑">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="action-icon" @click.stop="unmergeAnnotation(node.annotation)" v-if="node.annotation.parentId" title="取消合并">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
                <button class="action-icon delete" @click.stop="deleteAnnotation(node.annotation)" title="删除">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 合并到正文的子块（直接显示） -->
            <div
              v-if="hasChildren(node.annotation) && !isCollapsed(node)"
              class="merged-children"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
            >
              <ChildBlock
                v-for="child in getChildren(node.annotation.id)"
                :key="child.id"
                :annotation="child"
                :all-annotations="props.annotations"
                :dragging-id="draggingId"
                :drag-over-id="dragOverId"
                :image-status="imageStatus"
                @click="handleDoubleClick"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
                @edit="editAnnotation"
                @unmerge="unmergeAnnotation"
                @delete="deleteAnnotation"
                @image-load="handleImageLoad"
                @image-error="handleImageError"
              />
            </div>
          </template>

          <!-- 图片标注节点（直接显示合并的子块） -->
          <template v-else-if="isImageNode(node)">
            <div
              class="doc-image"
              :class="{
                'drag-over': dragOverId === node.annotation.id,
                'dragging': draggingId === node.annotation.id,
                'selected': selectedAnnotationId === node.annotation.id
              }"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
              :data-annotation-id="node.annotation.id"
              draggable="true"
              @dragstart="onDragStart($event, node.annotation)"
              @dragend="onDragEnd"
              @dragover="onDragOver($event, node.annotation)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, node.annotation)"
              @click="handleDoubleClick(node.annotation)"
              @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
            >
              <div class="image-container">
                <img
                  v-if="node.annotation.imagePath && imageStatus[node.annotation.id] !== 'error'"
                  :src="getImageUrl(node.annotation.imagePath)"
                  class="excerpt-image"
                  @load="handleImageLoad(node.annotation.id)"
                  @error="handleImageError($event, node.annotation)"
                />
                <div v-else class="image-placeholder">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span>图片加载失败</span>
                </div>
              </div>
              <div class="image-actions">
                <button class="action-icon" @click.stop="editAnnotation(node.annotation)" title="编辑">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="action-icon" @click.stop="unmergeAnnotation(node.annotation)" v-if="node.annotation.parentId" title="取消合并">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
                <button class="action-icon delete" @click.stop="deleteAnnotation(node.annotation)" title="删除">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 合并到图片的子块（直接显示） -->
            <div
              v-if="hasChildren(node.annotation) && !isCollapsed(node)"
              class="merged-children"
              :style="{ paddingLeft: getIndent(node) + 'px' }"
            >
              <ChildBlock
                v-for="child in getChildren(node.annotation.id)"
                :key="child.id"
                :annotation="child"
                :all-annotations="props.annotations"
                :dragging-id="draggingId"
                :drag-over-id="dragOverId"
                :image-status="imageStatus"
                @click="handleDoubleClick"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
                @edit="editAnnotation"
                @unmerge="unmergeAnnotation"
                @delete="deleteAnnotation"
                @image-load="handleImageLoad"
                @image-error="handleImageError"
              />
            </div>
          </template>

          <!-- 插入光标指示器（在每个块之后） -->
          <div
            v-if="!node.annotation.parentId"
            class="insert-cursor"
            :class="{ active: props.cursorAfterId === node.annotation.id }"
            @click="setCursor(node.annotation.id, $event)"
            :title="props.cursorAfterId === node.annotation.id ? '当前插入位置' : '点击此处，新摘录将插入到此块之后'"
          >
            <div class="cursor-line"></div>
            <span class="cursor-label" v-if="props.cursorAfterId === node.annotation.id">↑ 新摘录将插入此处</span>
          </div>
        </template>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PDFAnnotation, AnnotationLevel } from '../types/annotaion';
import { deleteAnnotation as deleteAnnotationApi } from '../api/annotationApi';
import { generateMarkdown } from '../utils/markdownGenerator';
import { getKernelBase } from '../api/siyuanApi';
import ChildBlock from './ChildBlock.vue';

// 文档树节点类型
interface DocumentNode {
  annotation: PDFAnnotation;
  indent: number;        // 缩进级别
  isPageBreak?: boolean; // 是否是页码分隔
  page?: number;         // 页码（用于分隔）
}

// 目录项类型
interface TocItem {
  id: string;
  text: string;
  level: string;
}

const props = defineProps<{
  annotations: PDFAnnotation[];
  loading?: boolean;
  cursorAfterId?: string | null;  // 插入光标位置（在哪个标注之后）
}>();

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void;
  (e: 'annotation-edit', annotation: PDFAnnotation): void;
  (e: 'annotation-delete', annotation: PDFAnnotation): void;
  (e: 'refresh'): void;
  (e: 'merge', sourceId: string, targetId: string): void;
  (e: 'unmerge', annotationId: string): void;
  (e: 'cursor-change', afterId: string | null): void;  // 光标位置变化
}>();

const listBodyRef = ref<HTMLElement>();

// 目录显示状态
const showToc = ref(true);
const tocWidth = ref(200);
let isResizingToc = false;

// 目录拖动调整大小
const startTocResize = (e: MouseEvent) => {
  isResizingToc = true;
  document.addEventListener('mousemove', handleTocResize);
  document.addEventListener('mouseup', stopTocResize);
  document.body.style.cursor = 'col-resize';
  e.preventDefault();
};

const handleTocResize = (e: MouseEvent) => {
  if (!isResizingToc) return;
  const newWidth = window.innerWidth - e.clientX - 20; // 右侧偏移
  if (newWidth >= 150 && newWidth <= 400) {
    tocWidth.value = newWidth;
  }
};

const stopTocResize = () => {
  isResizingToc = false;
  document.removeEventListener('mousemove', handleTocResize);
  document.removeEventListener('mouseup', stopTocResize);
  document.body.style.cursor = '';
};

// 图片加载状态
const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>({});

// 拖拽状态
const draggingId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dragTip = ref<string>('');

// 选中的标注（用于键盘删除）
const selectedAnnotationId = ref<string | null>(null);

// 合并块展开状态（用于正文合并，已不需要展开/折叠）
const expandedGroups = reactive<Set<string>>(new Set());

// 标题折叠状态（Typora风格）- 使用 ref 确保 Vue 能追踪变化
const collapsedHeadings = ref<Set<string>>(new Set());

// 切换标题折叠状态
const toggleHeadingFold = (annotationId: string, e: Event) => {
  e.stopPropagation();

  const newSet = new Set(collapsedHeadings.value);
  if (newSet.has(annotationId)) {
    newSet.delete(annotationId);
  } else {
    newSet.add(annotationId);
  }
  collapsedHeadings.value = newSet;
};

// 判断标题是否可以折叠（下面有内容或子块）
const canFold = (node: DocumentNode): boolean => {
  // 如果有合并的子块，可以折叠
  if (hasChildren(node.annotation)) {
    return true;
  }
  
  // 标题下面有其他内容也能折叠
  const nodeIndex = documentTree.value.findIndex(n => n.annotation.id === node.annotation.id);
  if (nodeIndex === -1) return false;

  const currentLevel = levelWeight[node.annotation.level!] ?? 6;

  // 检查后面是否有比当前标题级别更低的内容
  for (let i = nodeIndex + 1; i < documentTree.value.length; i++) {
    const nextNode = documentTree.value[i];
    if (nextNode.annotation.level) {
      const nextLevel = levelWeight[nextNode.annotation.level] ?? 6;
      // 如果遇到同级或更高级标题，停止检查
      if (nextLevel <= currentLevel) break;
    }
    // 如果有内容，可以折叠
    return true;
  }
  return false;
};

// 判断标题是否已折叠
const isCollapsed = (node: DocumentNode): boolean => {
  return collapsedHeadings.value.has(node.annotation.id);
};

// 获取子标注（使用去重后的数据，支持嵌套合并）
const getChildren = (parentId: string): PDFAnnotation[] => {
  const seenIds = new Set<string>();
  const result: PDFAnnotation[] = [];
  
  // 递归获取所有子块（包括嵌套的孙子块）
  const collectChildren = (pId: string) => {
    for (const a of props.annotations) {
      if (a.parentId === pId && !seenIds.has(a.id)) {
        seenIds.add(a.id);
        result.push(a);
        // 递归获取这个子块的子块
        collectChildren(a.id);
      }
    }
  };
  
  collectChildren(parentId);
  
  // 按 sortOrder 排序
  return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

// 判断是否有子标注
const hasChildren = (annotation: PDFAnnotation): boolean => {
  return props.annotations.some(a => a.parentId === annotation.id);
};

// 设置光标位置
const setCursor = (afterId: string | null, e: Event) => {
  e.stopPropagation();
  emit('cursor-change', afterId);
};

// 点击合并块（只展开/折叠，不跳转）- 已废弃
const handleMergedBlockClick = (annotation: PDFAnnotation, e: Event) => {
  e.stopPropagation();
};

// 处理标题点击（折叠/展开，不跳转）
const handleHeadingClick = (node: DocumentNode, e: Event) => {
  e.stopPropagation();
  if (canFold(node)) {
    toggleHeadingFold(node.annotation.id, e);
  }
};

// 统一处理块点击 - 正文和图片直接跳转
const handleBlockClick = (annotation: PDFAnnotation, e: Event) => {
  handleDoubleClick(annotation);
};

// 选中标注（用于键盘删除）
const selectAnnotation = (annotation: PDFAnnotation, e: Event) => {
  e.stopPropagation();
  if (selectedAnnotationId.value === annotation.id) {
    selectedAnnotationId.value = null;
  } else {
    selectedAnnotationId.value = annotation.id;
  }
};

// 键盘删除处理
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId.value) {
    const ann = props.annotations.find(a => a.id === selectedAnnotationId.value);
    if (ann) {
      e.preventDefault();
      deleteAnnotation(ann);
      selectedAnnotationId.value = null;
    }
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// 获取图片URL
const getImageUrl = (imagePath: string): string => {
  const kernelBase = getKernelBase();
  
  let path = imagePath;
  if (path.startsWith('/data/')) {
    path = path.slice(6);
  }
  
  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`;
  }
  
  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent('/data/' + path)}`;
};

// 图片加载错误处理
const handleImageError = (e: Event, ann: PDFAnnotation) => {
  imageStatus[ann.id] = 'error';
};

// 图片加载成功
const handleImageLoad = (annId: string) => {
  imageStatus[annId] = 'loaded';
};

// 标题级别权重
const levelWeight: Record<string, number> = {
  'title': 0,
  'h1': 1,
  'h2': 2,
  'h3': 3,
  'h4': 4,
  'h5': 5,
  'text': 6
};

// 获取标题前缀符号
const getHeadingPrefix = (level: AnnotationLevel): string => {
  const prefixes: Record<string, string> = {
    'title': '¶',
    'h1': '#',
    'h2': '##',
    'h3': '###',
    'h4': '####',
    'h5': '#####'
  };
  return prefixes[level] || '';
};

// 判断节点类型
const isHeadingNode = (node: DocumentNode): boolean => {
  return !!node.annotation.level && node.annotation.level !== 'text' && !node.annotation.isImage;
};

const isTextNode = (node: DocumentNode): boolean => {
  return !node.annotation.isImage && (!node.annotation.level || node.annotation.level === 'text');
};

const isImageNode = (node: DocumentNode): boolean => {
  return !!node.annotation.isImage;
};

// 获取缩进值
const getIndent = (node: DocumentNode): number => {
  return node.indent * 20; // 每级20px
};

// 构建文档树结构（支持手动合并的嵌套）
const documentTree = computed<DocumentNode[]>(() => {
  // 【第一步：去重】同一 ID 只保留第一个
  const seenIds = new Set<string>();
  const uniqueAnnotations: PDFAnnotation[] = [];
  
  for (const a of props.annotations) {
    if (!seenIds.has(a.id)) {
      seenIds.add(a.id);
      uniqueAnnotations.push(a);
    } else {
      console.warn('[documentTree] 发现重复标注ID，已过滤:', a.id, a.text?.substring(0, 20));
    }
  }

  // 【第二步：排序】按页码和创建时间排序，同时考虑 parentId 和 sortOrder
  const sorted = [...uniqueAnnotations].sort((a, b) => {
    // 如果有 parentId，放在父级后面
    if (a.parentId && !b.parentId) return 1;
    if (!a.parentId && b.parentId) return -1;

    // 如果都有 parentId，按父级分组
    if (a.parentId && b.parentId) {
      if (a.parentId !== b.parentId) {
        // 找到父级的位置来决定排序（使用去重后的数组）
        const parentA = uniqueAnnotations.find(p => p.id === a.parentId);
        const parentB = uniqueAnnotations.find(p => p.id === b.parentId);
        if (parentA && parentB) {
          if (parentA.page !== parentB.page) return parentA.page - parentB.page;
          return parentA.created - parentB.created;
        }
      }
      // 同一父级下按 sortOrder 排序
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    }

    // 没有 parentId 的按页码和时间排序
    if (a.page !== b.page) return a.page - b.page;
    return a.created - b.created;
  });

  const result: DocumentNode[] = [];
  let currentPage = -1;
  let headingStack: { level: string; indent: number; id: string }[] = [];

  // 记录被折叠的标题及其级别
  // 当标题被折叠时，跳过它后面所有比它级别低的内容
  let collapsedLevel: number | null = null;

  for (const ann of sorted) {
    // 如果是子标注（有 parentId），跳过，不作为独立节点显示
    if (ann.parentId) {
      continue;
    }

    // 检查是否有折叠的标题
    if (collapsedLevel !== null) {
      // 如果当前是标题，检查是否结束了折叠范围
      if (ann.level && ann.level !== 'text' && !ann.isImage) {
        const currentLevel = levelWeight[ann.level] || 6;
        // 如果遇到同级或更高级标题，结束折叠
        if (currentLevel <= collapsedLevel) {
          collapsedLevel = null;
        }
      }
      // 如果还在折叠范围内，跳过
      if (collapsedLevel !== null) {
        continue;
      }
    }

    // 页码分隔
    if (ann.page !== currentPage) {
      if (currentPage !== -1) {
        result.push({
          annotation: ann,
          indent: 0,
          isPageBreak: true,
          page: ann.page
        });
      }
      currentPage = ann.page;
      headingStack = [];
      // 换页时重置折叠状态
      collapsedLevel = null;
    }

    // 计算缩进
    let indent = 0;

    if (ann.level && ann.level !== 'text' && !ann.isImage) {
      // 标题：根据级别计算缩进
      const currentLevel = levelWeight[ann.level] || 6;

      while (headingStack.length > 0 && levelWeight[headingStack[headingStack.length - 1].level] >= currentLevel) {
        headingStack.pop();
      }

      indent = headingStack.length;
      headingStack.push({ level: ann.level, indent, id: ann.id });

      // 检查这个标题是否被折叠
      if (collapsedHeadings.value.has(ann.id)) {
        collapsedLevel = currentLevel;
      }
    } else if (ann.isImage || !ann.level || ann.level === 'text') {
      // 正文或图片：跟随最近标题的缩进
      indent = headingStack.length;
    }

    result.push({
      annotation: ann,
      indent
    });
  }

  return result;
});

// 目录项（提取所有标题）
const tocItems = computed<TocItem[]>(() => {
  return documentTree.value
    .filter(node => !node.isPageBreak && node.annotation.level && node.annotation.level !== 'text')
    .map(node => ({
      id: node.annotation.id,
      text: node.annotation.text,
      level: node.annotation.level!
    }));
});

// 滚动到指定标注
const scrollToAnnotation = (annotationId: string) => {
  const element = listBodyRef.value?.querySelector(`[data-annotation-id="${annotationId}"]`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 高亮效果
    element.classList.add('highlight-flash');
    setTimeout(() => {
      element.classList.remove('highlight-flash');
    }, 1500);
  }
};

// 拖拽开始
const onDragStart = (e: DragEvent, annotation: PDFAnnotation) => {
  draggingId.value = annotation.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', annotation.id);
  }
  dragTip.value = `拖动到目标标注上方释放以合并`;
};

// 拖拽结束
const onDragEnd = () => {
  draggingId.value = null;
  dragOverId.value = null;
  dragTip.value = '';
};

// 拖拽悬停
const onDragOver = (e: DragEvent, annotation: PDFAnnotation) => {
  e.preventDefault();
  if (draggingId.value && draggingId.value !== annotation.id) {
    e.dataTransfer!.dropEffect = 'move';
    dragOverId.value = annotation.id;
  }
};

// 拖拽离开
const onDragLeave = () => {
  dragOverId.value = null;
};

// 放置
const onDrop = (e: DragEvent, targetAnnotation: PDFAnnotation) => {
  e.preventDefault();

  const sourceId = e.dataTransfer?.getData('text/plain');
  if (!sourceId || sourceId === targetAnnotation.id) {
    dragOverId.value = null;
    draggingId.value = null;
    dragTip.value = '';
    return;
  }

  // 检查是否会造成循环引用（目标不能是源的子节点）
  let current = targetAnnotation;
  while (current.parentId) {
    if (current.parentId === sourceId) {
      dragTip.value = '不能将标注合并到它自己的子标注中';
      setTimeout(() => { dragTip.value = ''; }, 2000);
      dragOverId.value = null;
      draggingId.value = null;
      return;
    }
    const parent = props.annotations.find(a => a.id === current.parentId);
    if (!parent) break;
    current = parent;
  }

  // 检查源标注的所有子节点（如果源是父节点，不允许合并到子节点）
  const sourceAnnotation = props.annotations.find(a => a.id === sourceId);
  if (sourceAnnotation) {
    // 检查目标是否是源的后代
    let checkTarget = targetAnnotation;
    while (checkTarget.parentId) {
      if (checkTarget.parentId === sourceId) {
        dragTip.value = '不能将子标注合并到其父标注中';
        setTimeout(() => { dragTip.value = ''; }, 2000);
        dragOverId.value = null;
        draggingId.value = null;
        return;
      }
      const parent = props.annotations.find(a => a.id === checkTarget.parentId);
      if (!parent) break;
      checkTarget = parent;
    }
  }

  // 发出合并事件
  emit('merge', sourceId, targetAnnotation.id);

  dragTip.value = '合并成功！';
  setTimeout(() => { dragTip.value = ''; }, 1500);

  dragOverId.value = null;
  draggingId.value = null;
};

// 取消合并
const unmergeAnnotation = (annotation: PDFAnnotation) => {
  if (annotation.parentId) {
    emit('unmerge', annotation.id);
  }
};

// 双击跳转
const handleDoubleClick = (ann: PDFAnnotation) => {
  emit('annotation-click', ann);
};

// 编辑标注
const editAnnotation = (ann: PDFAnnotation) => {
  emit('annotation-edit', ann);
};

// 删除标注
const deleteAnnotation = async (ann: PDFAnnotation) => {
  // 发出删除事件，让父组件处理确认和删除逻辑
  emit('annotation-delete', ann);
};

// 导出Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown(props.annotations, {
    groupBy: 'hierarchy',
    includeNotes: true,
    includeLocation: true
  });

  navigator.clipboard.writeText(markdown).then(() => {
    alert('Markdown 已复制到剪贴板！');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败');
  });
};

// 刷新
const refresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.annotation-list-container {
  display: flex;
  height: 100%;
  background: var(--b3-theme-background);
  font-size: 14px;
}

/* 目录侧边栏 */
.toc-sidebar {
  min-width: 150px;
  max-width: 400px;
  flex-shrink: 0;
  border-right: 1px solid var(--b3-border-color);
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-surface);
  position: relative;
}

.toc-resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}

.toc-resize-handle:hover {
  background: var(--b3-theme-primary);
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: 600;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  background: var(--b3-theme-background);
}

.toc-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--b3-theme-on-surface-light);
  border-radius: 4px;
  transition: all 0.15s;
}

.toc-toggle:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-on-surface);
}

.toc-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  margin: 1px 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  border-radius: 4px;
  transition: all 0.15s;
  position: relative;
}

.toc-item:hover {
  background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.1));
  color: var(--b3-theme-primary);
}

.toc-marker {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
  background: var(--b3-theme-primary-light);
}

.toc-item:hover .toc-marker {
  background: var(--b3-theme-primary);
}

.toc-level-h1 .toc-marker { background: #ef4444; }
.toc-level-h2 .toc-marker { background: #f97316; }
.toc-level-h3 .toc-marker { background: #eab308; }
.toc-level-h4 .toc-marker { background: #22c55e; }
.toc-level-h5 .toc-marker { background: #3b82f6; }
.toc-level-title .toc-marker { background: #8b5cf6; }

.toc-level-h1 { font-weight: 600; }
.toc-level-h2 { padding-left: 12px; font-weight: 500; }
.toc-level-h3 { padding-left: 24px; }
.toc-level-h4 { padding-left: 36px; font-size: 11px; opacity: 0.9; }
.toc-level-h5 { padding-left: 48px; font-size: 11px; opacity: 0.8; }
.toc-level-title { font-weight: 700; }

.toc-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content.with-toc {
  border-left: none;
}

/* 高亮闪烁动画 */
@keyframes highlight-flash {
  0% { background: var(--b3-theme-primary-light); }
  100% { background: transparent; }
}

.highlight-flash {
  animation: highlight-flash 1.5s ease-out;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 600;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.count-badge {
  padding: 2px 8px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--b3-theme-surface-light);
}

/* 拖拽提示 */
.drag-tip {
  padding: 8px 16px;
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid var(--b3-border-color);
}

.list-body {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
}

.loading-tip,
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--b3-theme-on-surface-light);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--b3-theme-surface-light);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.empty-hint {
  font-size: 12px;
  text-align: center;
  opacity: 0.6;
  line-height: 1.6;
}

/* 文档视图样式 */
.document-view {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--b3-theme-on-background);
}

/* 页码分隔 */
.page-separator {
  display: flex;
  align-items: center;
  margin: 24px 0 16px 0;
  padding-top: 16px;
  border-top: 1px dashed var(--b3-border-color);
}

.page-separator:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.page-num {
  font-size: 11px;
  font-weight: 500;
  color: var(--b3-theme-on-surface-light);
  background: var(--b3-theme-surface);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 拖拽状态 */
.dragging {
  opacity: 0.5;
  background: var(--b3-theme-surface-light) !important;
}

.drag-over {
  background: var(--b3-theme-primary-light) !important;
  border-left-color: var(--b3-theme-primary) !important;
  box-shadow: 0 0 0 2px var(--b3-theme-primary);
}

/* Typora风格折叠指示器 */
.fold-indicator {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--b3-theme-on-surface-light);
  border-radius: 3px;
  margin-right: 2px;
  transition: all 0.2s ease;
}

.fold-indicator:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.fold-indicator svg {
  transition: transform 0.2s ease;
}

.is-collapsed .fold-indicator svg {
  transform: rotate(-90deg);
}

/* 可折叠块样式 */
.is-foldable {
  cursor: pointer;
}

.is-collapsed {
  opacity: 0.7;
}

.is-collapsed::after {
  content: '...';
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
  margin-left: 8px;
}

/* 合并子块容器（不折叠，直接显示） */
.merged-children {
  margin-left: 16px;
  border-left: 2px solid var(--b3-theme-surface-light);
  padding-left: 4px;
  pointer-events: auto;
}

/* 合并子块样式 */
.merged-child-block {
  display: flex;
  align-items: flex-start;
  padding: 6px 10px;
  margin: 2px 0;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}

.merged-child-block:active {
  cursor: grabbing;
}

.merged-child-block:hover {
  background: var(--b3-theme-primary-light);
}

.merged-child-block.drag-over {
  background: var(--b3-theme-primary-light) !important;
  box-shadow: 0 0 0 2px var(--b3-theme-primary);
  border-radius: 4px;
}

.merged-child-block.dragging {
  opacity: 0.5;
  background: var(--b3-theme-surface-light) !important;
}

.merged-child-block .child-marker {
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  background: var(--b3-theme-primary);
  border-radius: 50%;
  margin-right: 10px;
  margin-top: 8px;
}

.merged-child-block .child-content {
  flex: 1;
  min-width: 0;
}

.merged-child-block .paragraph-text {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
  line-height: 1.6;
}

.merged-child-block .excerpt-image {
  max-height: 150px;
  width: auto;
  border-radius: 4px;
}

/* 合并数量标签 */
.merged-count {
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

/* 标题样式 - 模仿 Typora 风格 */
.doc-heading {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  margin: 12px 0 8px 0;
  cursor: grab;
  transition: all 0.15s;
  border-left: 3px solid transparent;
  user-select: none;
}

.doc-heading:active {
  cursor: grabbing;
}

.doc-heading:hover {
  background: var(--b3-theme-surface-light);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.doc-heading:hover .hover-actions {
  opacity: 1;
}

/* 选中状态样式 */
.doc-heading.selected,
.doc-paragraph.selected,
.doc-image.selected {
  background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.1));
  border-left-color: var(--b3-theme-primary);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.heading-prefix {
  flex-shrink: 0;
  width: 24px;
  margin-right: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  opacity: 0.7;
  font-family: monospace;
}

.heading-content {
  flex: 1;
  min-width: 0;
}

.heading-text {
  font-weight: 600;
  line-height: 1.4;
  color: var(--b3-theme-on-background);
}

/* 不同级别标题 */
.heading-title .heading-text { 
  font-size: 20px; 
  color: var(--b3-theme-primary);
}
.heading-title .heading-prefix { font-size: 16px; }

.heading-h1 .heading-text { 
  font-size: 18px; 
  border-bottom: 1px solid var(--b3-border-color);
  padding-bottom: 6px;
  margin-bottom: 4px;
}
.heading-h1 .heading-prefix { font-size: 14px; }

.heading-h2 .heading-text { 
  font-size: 16px;
  color: var(--b3-theme-on-background);
}
.heading-h2 .heading-prefix { font-size: 13px; }

.heading-h3 .heading-text { font-size: 15px; }
.heading-h3 .heading-prefix { font-size: 12px; }

.heading-h4 .heading-text { 
  font-size: 14px;
  font-weight: 500;
}
.heading-h4 .heading-prefix { font-size: 11px; }

.heading-h5 .heading-text { 
  font-size: 13px;
  font-weight: 500;
}
.heading-h5 .heading-prefix { font-size: 11px; }

/* 颜色主题 */
.color-accent-red { border-left-color: #ef4444 !important; }
.color-accent-yellow { border-left-color: #f59e0b !important; }
.color-accent-green { border-left-color: #10b981 !important; }
.color-accent-blue { border-left-color: #3b82f6 !important; }
.color-accent-purple { border-left-color: #8b5cf6 !important; }

/* 正文段落样式 */
.doc-paragraph {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 6px 0;
  margin: 4px 0;
  cursor: grab;
  transition: all 0.15s;
  border-left: 3px solid transparent;
  user-select: none;
}

.doc-paragraph:active {
  cursor: grabbing;
}

.doc-paragraph:hover {
  background: var(--b3-theme-surface-light);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.doc-paragraph:hover .hover-actions {
  opacity: 1;
}

.paragraph-marker {
  flex-shrink: 0;
  width: 3px;
  height: auto;
  min-height: 20px;
  background: linear-gradient(135deg, var(--b3-theme-primary-light) 0%, var(--b3-theme-primary) 100%);
  border-radius: 2px;
  margin-right: 12px;
  margin-top: 2px;
  opacity: 0.5;
}

.doc-paragraph:hover .paragraph-marker {
  opacity: 1;
}

.paragraph-content {
  flex: 1;
  min-width: 0;
}

.paragraph-text {
  margin: 0;
  line-height: 1.75;
  color: var(--b3-theme-on-background);
  word-break: break-word;
  text-align: justify;
}

.paragraph-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-radius: 6px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.5;
  border-left: 2px solid var(--b3-theme-primary-light);
}

.paragraph-note svg {
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.6;
  color: var(--b3-theme-primary);
}

/* 图片样式 */
.doc-image {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin: 12px 0;
  padding: 8px 0;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}

.doc-image:active {
  cursor: grabbing;
}

.doc-image:hover {
  background: var(--b3-theme-surface-light);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}

.doc-image:hover .image-actions {
  opacity: 1;
}

.image-container {
  border-radius: 8px;
  overflow: hidden;
  background: var(--b3-theme-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.excerpt-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  gap: 8px;
  color: var(--b3-theme-on-surface-light);
  opacity: 0.5;
}

.image-placeholder span {
  font-size: 12px;
}

.image-actions {
  position: absolute;
  top: 12px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

/* 悬浮操作按钮 */
.hover-actions {
  position: absolute;
  top: 4px;
  right: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-icon:hover {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}

.action-icon.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* 子块样式 */
.child-block {
  background: var(--b3-theme-surface);
  border-radius: 4px;
  margin: 2px 0;
  padding: 8px 12px;
  border-left: 2px solid var(--b3-theme-primary-light);
  transition: all 0.15s;
}

.child-block:hover {
  background: var(--b3-theme-primary-light);
}

.child-marker {
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  background: var(--b3-theme-primary);
  border-radius: 50%;
  margin-right: 10px;
  margin-top: 8px;
}

.child-content {
  flex: 1;
  min-width: 0;
}

.child-block .paragraph-text {
  font-size: 13px;
  opacity: 0.85;
}

.child-block.is-image .excerpt-image {
  max-height: 200px;
}

/* 插入光标样式 */
.insert-cursor {
  position: relative;
  height: 6px;
  margin: 4px 0;
  cursor: pointer;
  transition: all 0.15s;
}

.insert-cursor .cursor-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: transparent;
  border-radius: 1px;
  transition: all 0.15s;
}

.insert-cursor .cursor-label {
  position: absolute;
  left: 50%;
  top: -20px;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-surface);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.insert-cursor:hover .cursor-line,
.insert-cursor.active .cursor-line {
  background: var(--b3-theme-primary-light);
  height: 2px;
}

.insert-cursor.active .cursor-line {
  background: var(--b3-theme-primary);
  height: 3px;
}

.insert-cursor.active .cursor-label {
  opacity: 1;
}

.insert-cursor:hover .cursor-label {
  opacity: 0.7;
}
</style>
