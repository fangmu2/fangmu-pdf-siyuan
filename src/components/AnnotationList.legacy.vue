<!-- src/components/AnnotationList.vue -->
<template>
  <div class="annotation-list-container">
    <!-- 目录侧边栏 -->
    <div
      v-if="showToc && tocItems.length > 0"
      class="toc-sidebar"
      :style="{ width: `${tocWidth}px` }"
    >
      <div class="toc-header">
        <span>📑 目录</span>
        <button
          class="toc-toggle"
          title="隐藏目录"
          @click="showToc = false"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
      <div class="toc-body">
        <div
          v-for="item in tocItems"
          :key="item.id"
          class="toc-item"
          :class="`toc-level-${item.level}`"
          :title="item.text"
          @click="scrollToAnnotation(item.id)"
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
    <div
      class="main-content"
      :class="{ 'with-toc': showToc && tocItems.length > 0 }"
    >
      <!-- 头部 -->
      <div class="list-header">
        <div class="header-title">
          <span class="title-text">标注列表</span>
          <span class="count-badge">{{ annotations.length }}</span>
        </div>

        <!-- 批量操作工具栏（有选择时显示） -->
        <div
          v-if="selection && selection.selectionCount.value > 0"
          class="bulk-toolbar"
        >
          <label
            class="select-all-label"
            title="全选/取消全选"
          >
            <input
              type="checkbox"
              :checked="selection.selectionCount.value === annotations.length && annotations.length > 0"
              class="select-all-checkbox"
              @change="toggleSelectAll"
            />
          </label>
          <span class="selection-count">已选择 {{ selection.selectionCount.value }} 个标注</span>
          <button
            class="bulk-btn"
            title="批量导出"
            @click="handleBatchExport"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            导出
          </button>
          <button
            class="bulk-btn"
            title="批量移动"
            @click="handleBatchMove"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M9.01 14H9v4h6v-4h-.01c-.55 0-1 .45-1 1v1h-4v-1c0-.55-.45-1-1-1zM9 3v4h6V3H9zm10 15.41l-1.41-1.42L19 15.5V9h-2v6.5l-1.41 1.41L17 18.41V21h2v-2.59zm-2-13.41l1.41 1.41L17 7.91V5h2V2.41l1.41 1.42L19 5.25V11h2V9h-2V5.25z" />
            </svg>
            移动
          </button>
          <button
            class="bulk-btn delete"
            title="批量删除"
            @click="handleBatchDelete"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            删除
          </button>
          <button
            class="bulk-btn"
            title="取消选择"
            @click="handleClearSelection"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            取消
          </button>
        </div>

        <!-- 操作按钮 -->
        <div
          v-else
          class="header-actions"
        >
          <button
            v-if="tocItems.length > 0"
            class="action-btn"
            :class="{ active: showToc }"
            title="显示/隐藏目录"
            @click="showToc = !showToc"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>
          <button
            v-if="annotations.length > 0"
            class="action-btn"
            title="导出为 Markdown"
            @click="exportMarkdown"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </button>
          <button
            class="action-btn"
            title="刷新"
            @click="refresh"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 拖拽提示 -->
      <div
        v-if="dragTip"
        class="drag-tip"
      >
        {{ dragTip }}
      </div>

      <!-- 标注列表 -->
      <div
        v-if="!useVirtual || !virtualEnabled"
        ref="listBodyRef"
        class="list-body"
      >
        <div
          v-if="loading"
          class="loading-tip"
        >
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div
          v-else-if="annotations.length === 0"
          class="empty-tip"
        >
          <div class="empty-icon">
            📝
          </div>
          <div class="empty-title">
            暂无标注
          </div>
          <div class="empty-hint">
            在 PDF 中选择文本或图片<br>标注会自动显示在这里
          </div>
        </div>

        <!-- 连贯的文档式标注列表（非虚拟滚动） -->
        <div
          v-else
          class="document-view"
        >
          <!-- 插入光标指示器（顶部） -->
          <div
            v-if="!props.cursorAfterId"
            class="insert-cursor active"
            title="点击此处，新摘录将插入到最前面"
            @click="setCursor(null, $event)"
          >
            <div class="cursor-line"></div>
            <span class="cursor-label">↑ 新摘录将插入此处</span>
          </div>

          <template
            v-for="(node, index) in documentTree"
            :key="node.isPageBreak ? `page-${node.page}-${index}` : node.annotation.id"
          >
            <!-- 页码分隔 -->
            <div
              v-if="node.isPageBreak"
              class="page-separator"
            >
              <span class="page-num">第 {{ node.page }} 页</span>
            </div>

            <!-- 标题节点（有 Typora 风格折叠功能） -->
            <template v-else-if="isHeadingNode(node)">
              <div
                class="doc-heading"
                :class="[
                  `heading-${node.annotation.level}`,
                  `color-accent-${node.annotation.color}`,
                  {
                    'drag-over': dragOverId === node.annotation.id,
                    'dragging': draggingId === node.annotation.id,
                    'selected': selection?.isSelected(node.annotation),
                  },
                ]"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
                :data-annotation-id="node.annotation.id"
                draggable="true"
                @dragstart="onDragStart($event, node.annotation)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, node.annotation)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, node.annotation)"
                @click="(e) => handleAnnotationClick(node.annotation, e)"
                @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
              >
                <!-- 复选框（批量选择） -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(node.annotation)"
                    @change="toggleAnnotationSelection(node.annotation, $event)"
                  />
                </label>
                <!-- 折叠指示器（Typora 风格） -->
                <div
                  v-if="canFold(node)"
                  class="fold-indicator"
                  :title="isCollapsed(node) ? '点击展开' : '点击折叠'"
                  @click.stop="toggleHeadingFold(node.annotation.id, $event)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
                <div class="heading-prefix">
                  {{ getHeadingPrefix(node.annotation.level!) }}
                </div>
                <div class="heading-content">
                  <span class="heading-text">{{ node.annotation.text }}</span>
                  <span
                    v-if="hasChildren(node.annotation)"
                    class="merged-count"
                  >
                    +{{ getChildren(node.annotation.id).length }}
                  </span>
                </div>
                <div class="hover-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    v-if="node.annotation.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并到标题的子块（直接显示，不折叠） -->
              <div
                v-if="hasChildren(node.annotation) && !isCollapsed(node)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
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
                    'selected': selection?.isSelected(node.annotation),
                  },
                ]"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
                :data-annotation-id="node.annotation.id"
                draggable="true"
                @dragstart="onDragStart($event, node.annotation)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, node.annotation)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, node.annotation)"
                @click="(e) => handleAnnotationClick(node.annotation, e)"
                @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
              >
                <!-- 复选框（批量选择） -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(node.annotation)"
                    @change="toggleAnnotationSelection(node.annotation, $event)"
                  />
                </label>
                <div class="paragraph-marker"></div>
                <div class="paragraph-content">
                  <p class="paragraph-text">
                    {{ node.annotation.text }}
                  </p>
                  <div
                    v-if="node.annotation.note"
                    class="paragraph-note"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                    <span>{{ node.annotation.note }}</span>
                  </div>
                </div>
                <div class="hover-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    v-if="node.annotation.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并到正文的子块（直接显示） -->
              <div
                v-if="hasChildren(node.annotation) && !isCollapsed(node)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
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
                  'selected': selection?.isSelected(node.annotation),
                }"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
                :data-annotation-id="node.annotation.id"
                draggable="true"
                @dragstart="onDragStart($event, node.annotation)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, node.annotation)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, node.annotation)"
                @click="(e) => handleAnnotationClick(node.annotation, e)"
                @contextmenu.prevent="selectAnnotation(node.annotation, $event)"
              >
                <!-- 复选框（批量选择） -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(node.annotation)"
                    @change="toggleAnnotationSelection(node.annotation, $event)"
                  />
                </label>
                <div class="image-container">
                  <img
                    v-if="isValidImagePath(node.annotation.imagePath) && imageStatus[node.annotation.id] !== 'error'"
                    :src="getImageUrl(node.annotation.imagePath!)"
                    class="excerpt-image"
                    @load="handleImageLoad(node.annotation.id)"
                    @error="handleImageError($event, node.annotation)"
                  />
                  <div
                    v-else
                    class="image-placeholder"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="currentColor"
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    <span>图片加载失败</span>
                  </div>
                </div>
                <div class="image-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon"
                    title="智能裁剪"
                    @click.stop="openCropEditor(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
                    </svg>
                  </button>
                  <button
                    v-if="node.annotation.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(node.annotation)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并到图片的子块（直接显示） -->
              <div
                v-if="hasChildren(node.annotation) && !isCollapsed(node)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndent(node)}px` }"
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
              :title="props.cursorAfterId === node.annotation.id ? '当前插入位置' : '点击此处，新摘录将插入到此块之后'"
              @click="setCursor(node.annotation.id, $event)"
            >
              <div class="cursor-line"></div>
              <span
                v-if="props.cursorAfterId === node.annotation.id"
                class="cursor-label"
              >↑ 新摘录将插入此处</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 虚拟滚动标注列表（100+ 项时启用） -->
      <div
        v-else
        ref="listBodyRef"
        v-bind="containerProps"
        class="list-body virtual-list"
      >
        <div
          v-if="loading"
          class="loading-tip"
        >
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div
          v-else-if="annotations.length === 0"
          class="empty-tip"
        >
          <div class="empty-icon">
            📝
          </div>
          <div class="empty-title">
            暂无标注
          </div>
          <div class="empty-hint">
            在 PDF 中选择文本或图片<br>标注会自动显示在这里
          </div>
        </div>

        <!-- 虚拟滚动列表 -->
        <div
          v-else
          class="virtual-wrapper"
          :style="wrapperProps.style"
        >
          <!-- 插入光标指示器（顶部） -->
          <div
            v-if="!props.cursorAfterId"
            class="insert-cursor active"
            title="点击此处，新摘录将插入到最前面"
            @click="setCursor(null, $event)"
          >
            <div class="cursor-line"></div>
            <span class="cursor-label">↑ 新摘录将插入此处</span>
          </div>

          <template
            v-for="item in virtualList"
            :key="item.data.isPageBreak ? `page-${item.data.page}-${item.index}` : item.data.id"
          >
            <!-- 页码分隔（虚拟滚动中通过 documentTree 映射） -->
            <div
              v-if="item.data.isPageBreak"
              class="page-separator"
              v-memo="[item.data.page]"
            >
              <span class="page-num">第 {{ item.data.page }} 页</span>
            </div>

            <!-- 标题节点 -->
            <template v-else-if="item.data.level && item.data.level !== 'text' && !item.data.isImage">
              <div
                class="doc-heading"
                :class="[
                  `heading-${item.data.level}`,
                  `color-accent-${item.data.color}`,
                  {
                    'drag-over': dragOverId === item.data.id,
                    'dragging': draggingId === item.data.id,
                    'selected': selection?.isSelected(item.data),
                  },
                ]"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
                :data-annotation-id="item.data.id"
                draggable="true"
                @dragstart="onDragStart($event, item.data)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, item.data)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item.data)"
                @click="(e) => handleAnnotationClick(item.data, e)"
                @contextmenu.prevent="selectAnnotation(item.data, $event)"
                v-memo="[item.data.id, item.data.text, item.data.level, item.data.color, dragOverId === item.data.id, draggingId === item.data.id, selection?.isSelected(item.data)]"
              >
                <!-- 复选框 -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(item.data)"
                    @change="toggleAnnotationSelection(item.data, $event)"
                  />
                </label>
                <!-- 折叠指示器 -->
                <div
                  v-if="canFoldForAnnotation(item.data)"
                  class="fold-indicator"
                  :title="isCollapsedForAnnotation(item.data) ? '点击展开' : '点击折叠'"
                  @click.stop="toggleHeadingFold(item.data.id, $event)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
                <div class="heading-prefix">
                  {{ getHeadingPrefix(item.data.level!) }}
                </div>
                <div class="heading-content">
                  <span class="heading-text">{{ item.data.text }}</span>
                  <span
                    v-if="hasChildren(item.data)"
                    class="merged-count"
                  >
                    +{{ getChildren(item.data.id).length }}
                  </span>
                </div>
                <div class="hover-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    v-if="item.data.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并的子块 -->
              <div
                v-if="hasChildren(item.data) && !isCollapsedForAnnotation(item.data)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
              >
                <ChildBlock
                  v-for="child in getChildren(item.data.id)"
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

            <!-- 正文标注节点 -->
            <template v-else-if="!item.data.isImage && (!item.data.level || item.data.level === 'text')">
              <div
                class="doc-paragraph"
                :class="[
                  `color-accent-${item.data.color}`,
                  {
                    'drag-over': dragOverId === item.data.id,
                    'dragging': draggingId === item.data.id,
                    'selected': selection?.isSelected(item.data),
                  },
                ]"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
                :data-annotation-id="item.data.id"
                draggable="true"
                @dragstart="onDragStart($event, item.data)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, item.data)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item.data)"
                @click="(e) => handleAnnotationClick(item.data, e)"
                @contextmenu.prevent="selectAnnotation(item.data, $event)"
                v-memo="[item.data.id, item.data.text, item.data.color, dragOverId === item.data.id, draggingId === item.data.id, selection?.isSelected(item.data)]"
              >
                <!-- 复选框 -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(item.data)"
                    @change="toggleAnnotationSelection(item.data, $event)"
                  />
                </label>
                <div class="paragraph-marker"></div>
                <div class="paragraph-content">
                  <p class="paragraph-text">
                    {{ item.data.text }}
                  </p>
                  <div
                    v-if="item.data.note"
                    class="paragraph-note"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                    <span>{{ item.data.note }}</span>
                  </div>
                </div>
                <div class="hover-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    v-if="item.data.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并的子块 -->
              <div
                v-if="hasChildren(item.data) && !isCollapsedForAnnotation(item.data)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
              >
                <ChildBlock
                  v-for="child in getChildren(item.data.id)"
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

            <!-- 图片标注节点 -->
            <template v-else-if="item.data.isImage">
              <div
                class="doc-image"
                :class="{
                  'drag-over': dragOverId === item.data.id,
                  'dragging': draggingId === item.data.id,
                  'selected': selection?.isSelected(item.data),
                }"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
                :data-annotation-id="item.data.id"
                draggable="true"
                @dragstart="onDragStart($event, item.data)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, item.data)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item.data)"
                @click="(e) => handleAnnotationClick(item.data, e)"
                @contextmenu.prevent="selectAnnotation(item.data, $event)"
              >
                <!-- 复选框 -->
                <label
                  v-if="selection"
                  class="annotation-checkbox"
                  title="选择此标注"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="selection.isSelected(item.data)"
                    @change="toggleAnnotationSelection(item.data, $event)"
                  />
                </label>
                <div class="image-container">
                  <img
                    v-if="isValidImagePath(item.data.imagePath) && imageStatus[item.data.id] !== 'error'"
                    :src="getImageUrl(item.data.imagePath!)"
                    class="excerpt-image"
                    @load="handleImageLoad(item.data.id)"
                    @error="handleImageError(item.data)"
                  />
                  <div
                    v-else
                    class="image-placeholder"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="currentColor"
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    <span>图片加载失败</span>
                  </div>
                </div>
                <div class="image-actions">
                  <button
                    class="action-icon"
                    title="编辑"
                    @click.stop="editAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon"
                    title="智能裁剪"
                    @click.stop="openCropEditor(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
                    </svg>
                  </button>
                  <button
                    v-if="item.data.parentId"
                    class="action-icon"
                    title="取消合并"
                    @click.stop="unmergeAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <button
                    class="action-icon delete"
                    title="删除"
                    @click.stop="deleteAnnotation(item.data)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 合并的子块 -->
              <div
                v-if="hasChildren(item.data) && !isCollapsedForAnnotation(item.data)"
                class="merged-children"
                :style="{ paddingLeft: `${getIndentForAnnotation(item.data)}px` }"
              >
                <ChildBlock
                  v-for="child in getChildren(item.data.id)"
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

            <!-- 插入光标指示器 -->
            <div
              v-if="!item.data.parentId"
              class="insert-cursor"
              :class="{ active: props.cursorAfterId === item.data.id }"
              :title="props.cursorAfterId === item.data.id ? '当前插入位置' : '点击此处，新摘录将插入到此块之后'"
              @click="setCursor(item.data.id, $event)"
            >
              <div class="cursor-line"></div>
              <span
                v-if="props.cursorAfterId === item.data.id"
                class="cursor-label"
              >↑ 新摘录将插入此处</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 导出设置面板 -->
      <ExportSettingsPanel
        v-if="showExportSettings"
        :selected-count="selection?.selectedAnnotations.value.length || 0"
        @close="showExportSettings = false"
        @export="handleExportWithOptions"
      />

      <!-- 导出进度面板 -->
      <ExportProgressPanel
        v-if="showExportProgress"
        :items="exportProgressItems"
        :export-fn="executeExportItem"
        @close="showExportProgress = false"
        @complete="handleExportComplete"
      />

      <!-- 智能裁剪编辑器 -->
      <SmartCropEditor
        v-if="showCropEditor"
        :image-src="currentCropImage"
        @crop-apply="handleCropApply"
        @crop-cancel="handleCropCancel"
      />

      <!-- 批量裁剪面板 -->
      <BatchCropPanel
        v-if="showBatchCrop"
        :items="batchCropItems"
        @close="showBatchCrop = false"
        @crop-result="handleBatchCropResult"
        @crop-revert="handleBatchCropRevert"
      />
    </div>
  </div></template>

<script setup lang="ts">
import type { ExportOptions } from '../../services/batchExportService'
import type { CropRegion } from '../../services/smartCropService'
import type {
  AnnotationLevel,
  PDFAnnotation,
} from '../types/annotation'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'
import { batchExportAnnotations } from '../../services/batchExportService'
import { getKernelBase } from '../api/siyuanApi'
import { usePdfAnnotationSelection } from '../composables/usePdfAnnotationSelection'
import { useVirtualAnnotations } from '../composables/useVirtualAnnotations'
import { navigateToAnnotationPdf } from '../services/pdfExcerptService'
import { generateMarkdown } from '../utils/markdownGenerator'
import ExportProgressPanel from './AnnotationList/ExportProgressPanel.vue'
import ExportSettingsPanel from './AnnotationList/ExportSettingsPanel.vue'
import ChildBlock from './ChildBlock.vue'
import BatchCropPanel from './PdfAnnotationList/BatchCropPanel.vue'
import SmartCropEditor from './PdfAnnotationList/SmartCropEditor.vue'

// 文档树节点类型
interface DocumentNode {
  annotation: PDFAnnotation
  indent: number // 缩进级别
  isPageBreak?: boolean // 是否是页码分隔
  page?: number // 页码（用于分隔）
}

// 目录项类型
interface TocItem {
  id: string
  text: string
  level: string
}

const props = defineProps<{
  annotations: PDFAnnotation[]
  loading?: boolean
  cursorAfterId?: string | null // 插入光标位置（在哪个标注之后）
}>()

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void
  (e: 'annotation-edit', annotation: PDFAnnotation): void
  (e: 'annotation-delete', annotation: PDFAnnotation): void
  (e: 'refresh'): void
  (e: 'merge', sourceId: string, targetId: string): void
  (e: 'unmerge', annotationId: string): void
  (e: 'cursor-change', afterId: string | null): void // 光标位置变化
  (e: 'batch-delete', annotationIds: string[]): void // 批量删除
  (e: 'batch-export'): void // 批量导出
  (e: 'batch-move', annotationIds: string[]): void // 批量移动
}>()

const listBodyRef = ref<HTMLElement>()

// 虚拟滚动相关
const useVirtual = ref(true) // 是否使用虚拟滚动
const {
  virtualList,
  containerProps,
  wrapperProps,
  enabled: virtualEnabled,
  total: virtualTotal,
  visibleCount,
} = useVirtualAnnotations(
  computed(() => props.annotations),
  {
    itemHeight: 120,
    overscan: 5,
    enabled: true,
    minAnnotationThreshold: 100, // 100 项以上启用虚拟滚动
  },
)

// 导出相关状态
const showExportSettings = ref(false)
const showExportProgress = ref(false)
const exportProgressItems = ref<Array<{ id: string, name: string, data: any }>>([])
const currentExportOptions = ref<ExportOptions | null>(null)

// 裁剪相关状态
const showCropEditor = ref(false)
const showBatchCrop = ref(false)
const currentCropImage = ref<string>('')
const currentCropAnnotation = ref<PDFAnnotation | null>(null)
const batchCropItems = ref<Array<{ id: string, name: string, imageSrc: string }>>([])

// 导出项执行函数
const executeExportItem = async (data: any) => {
  if (!currentExportOptions.value) throw new Error('导出选项未设置')
  await batchExportAnnotations(data.annotations, currentExportOptions.value)
}

// 导出完成处理
const handleExportComplete = (successCount: number, errorCount: number) => {
  if (errorCount === 0) {
    showMessage(`成功导出 ${successCount} 个标注`, 'success')
  } else {
    showMessage(`导出完成：成功 ${successCount}，失败 ${errorCount}`, 'warning')
  }
}

// 消息提示
const showMessage = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // 思源笔记通知系统（如果可用）
  if ((window as any).siyuan?.notification) {
    (window as any).siyuan.notification.push(msg, type)
  } else {
    alert(msg)
  }
}

// 批量选择功能 - 在 onMounted 中初始化
let selection: ReturnType<typeof usePdfAnnotationSelection> | null = null

// 目录显示状态
const showToc = ref(true)
const tocWidth = ref(200)
let isResizingToc = false

// 目录拖动调整大小
const startTocResize = (e: MouseEvent) => {
  isResizingToc = true
  document.addEventListener('mousemove', handleTocResize)
  document.addEventListener('mouseup', stopTocResize)
  document.body.style.cursor = 'col-resize'
  e.preventDefault()
}

const handleTocResize = (e: MouseEvent) => {
  if (!isResizingToc) return
  const newWidth = window.innerWidth - e.clientX - 20 // 右侧偏移
  if (newWidth >= 150 && newWidth <= 400) {
    tocWidth.value = newWidth
  }
}

const stopTocResize = () => {
  isResizingToc = false
  document.removeEventListener('mousemove', handleTocResize)
  document.removeEventListener('mouseup', stopTocResize)
  document.body.style.cursor = ''
}

// 图片加载状态
const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>({})

// 拖拽状态
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dragTip = ref<string>('')

// 选中的标注（用于键盘删除）
const selectedAnnotationId = ref<string | null>(null)


// 标题折叠状态（Typora 风格）- 使用 ref 确保 Vue 能追踪变化
const collapsedHeadings = ref<Set<string>>(new Set())

// 切换标题折叠状态
const toggleHeadingFold = (annotationId: string, _e: Event) => {
  const newSet = new Set(collapsedHeadings.value)
  if (newSet.has(annotationId)) {
    newSet.delete(annotationId)
  } else {
    newSet.add(annotationId)
  }
  collapsedHeadings.value = newSet
}

// 判断标题是否可以折叠（下面有内容或子块）
const canFold = (node: DocumentNode): boolean => {
  // 如果有合并的子块，可以折叠
  if (hasChildren(node.annotation)) {
    return true
  }

  // 标题下面有其他内容也能折叠
  const nodeIndex = documentTree.value.findIndex((n) => n.annotation.id === node.annotation.id)
  if (nodeIndex === -1) return false

  const currentLevel = levelWeight[node.annotation.level!] ?? 6

  // 检查后面是否有比当前标题级别更低的内容
  for (let i = nodeIndex + 1; i < documentTree.value.length; i++) {
    const nextNode = documentTree.value[i]
    if (nextNode.annotation.level) {
      const nextLevel = levelWeight[nextNode.annotation.level] ?? 6
      // 如果遇到同级或更高级标题，停止检查
      if (nextLevel <= currentLevel) break
    }
    // 如果有内容，可以折叠
    return true
  }
  return false
}

// 判断标题是否已折叠
const isCollapsed = (node: DocumentNode): boolean => {
  return collapsedHeadings.value.has(node.annotation.id)
}

// 获取子标注（使用去重后的数据，支持嵌套合并）
const getChildren = (parentId: string): PDFAnnotation[] => {
  const seenIds = new Set<string>()
  const result: PDFAnnotation[] = []

  // 递归获取所有子块（包括嵌套的孙子块）
  const collectChildren = (pId: string) => {
    for (const a of props.annotations) {
      if (a.parentId === pId && !seenIds.has(a.id)) {
        seenIds.add(a.id)
        result.push(a)
        // 递归获取这个子块的子块
        collectChildren(a.id)
      }
    }
  }

  collectChildren(parentId)

  // 按 sortOrder 排序
  return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

// 判断是否有子标注
const hasChildren = (annotation: PDFAnnotation): boolean => {
  return props.annotations.some((a) => a.parentId === annotation.id)
}

// 设置光标位置
const setCursor = (afterId: string | null, e: Event) => {
  e.stopPropagation()
  emit('cursor-change', afterId)
}

// 处理标题点击（折叠/展开，不跳转）
const handleHeadingClick = (node: DocumentNode, e: Event) => {
  e.stopPropagation()
  // 如果按住了 Ctrl/Cmd，不触发折叠，让选择功能处理
  if (e.ctrlKey || e.metaKey) {
    return
  }
  if (canFold(node)) {
    toggleHeadingFold(node.annotation.id, e)
  }
}

// 选中标注（用于键盘删除）
const selectAnnotation = (annotation: PDFAnnotation, e: Event) => {
  e.stopPropagation()
  if (selectedAnnotationId.value === annotation.id) {
    selectedAnnotationId.value = null
  } else {
    selectedAnnotationId.value = annotation.id
  }
}

// 键盘删除处理
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId.value) {
    const ann = props.annotations.find((a) => a.id === selectedAnnotationId.value)
    if (ann) {
      e.preventDefault()
      deleteAnnotation(ann)
      selectedAnnotationId.value = null
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)

  // 初始化批量选择功能
  if (listBodyRef.value) {
    selection = usePdfAnnotationSelection({
      annotations: props.annotations,
      containerRef: listBodyRef.value,
    })
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 检查图片路径是否有效（排除 blob URL、临时文件等无效路径）
const isValidImagePath = (path: string | undefined): boolean => {
  if (!path) return false
  // 排除 blob URL
  if (path.startsWith('blob:')) return false
  // 排除 file:// 协议
  if (path.startsWith('file://')) return false
  // 排除 Windows 临时文件路径（以 @ 开头）
  if (path.startsWith('@')) return false
  // 排除 localhost 临时地址
  if (path.includes('localhost') || path.includes('127.0.0.1')) return false
  return true
}

// 获取图片 URL
const getImageUrl = (imagePath: string): string => {
  const kernelBase = getKernelBase()

  let path = imagePath
  if (path.startsWith('/data/')) {
    path = path.slice(6)
  }

  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`
  }

  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent(`/data/${path}`)}`
}

// 图片加载错误处理
const handleImageError = (ann: PDFAnnotation) => {
  imageStatus[ann.id] = 'error'
}

// 图片加载成功
const handleImageLoad = (annId: string) => {
  imageStatus[annId] = 'loaded'
}

// 标题级别权重
const levelWeight: Record<string, number> = {
  title: 0,
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  text: 6,
}

// 获取标题前缀符号
const getHeadingPrefix = (level: AnnotationLevel): string => {
  const prefixes: Record<string, string> = {
    title: '¶',
    h1: '#',
    h2: '##',
    h3: '###',
    h4: '####',
    h5: '#####',
  }
  return prefixes[level] || ''
}

// 判断节点类型
const isHeadingNode = (node: DocumentNode): boolean => {
  return !!node.annotation.level && node.annotation.level !== 'text' && !node.annotation.isImage
}

const isTextNode = (node: DocumentNode): boolean => {
  return !node.annotation.isImage && (!node.annotation.level || node.annotation.level === 'text')
}

const isImageNode = (node: DocumentNode): boolean => {
  return !!node.annotation.isImage
}

// 获取缩进值
const getIndent = (node: DocumentNode): number => {
  return node.indent * 20 // 每级 20px
}

// 虚拟滚动辅助函数：获取标注的缩进值
const getIndentForAnnotation = (annotation: PDFAnnotation): number => {
  // 简单实现：根据 parentId 判断层级
  if (!annotation.parentId) return 0
  
  // 递归计算父级深度
  let depth = 0
  let current = annotation
  while (current.parentId) {
    depth++
    const parent = props.annotations.find(a => a.id === current.parentId)
    if (!parent) break
    current = parent
  }
  return depth * 20
}

// 虚拟滚动辅助函数：判断标注是否可以折叠
const canFoldForAnnotation = (annotation: PDFAnnotation): boolean => {
  // 如果不是标题，不能折叠
  if (!annotation.level || annotation.level === 'text' || annotation.isImage) {
    return false
  }
  
  // 如果有合并的子块，可以折叠
  if (hasChildren(annotation)) {
    return true
  }
  
  // 简单实现：标题都可以折叠
  return true
}

// 虚拟滚动辅助函数：判断标注是否已折叠
const isCollapsedForAnnotation = (annotation: PDFAnnotation): boolean => {
  return collapsedHeadings.value.has(annotation.id)
}

// 构建文档树结构（支持手动合并的嵌套）
const documentTree = computed<DocumentNode[]>(() => {
  // 【第一步：去重】同一 ID 只保留第一个
  const seenIds = new Set<string>()
  const uniqueAnnotations: PDFAnnotation[] = []

  for (const a of props.annotations) {
    if (!seenIds.has(a.id)) {
      seenIds.add(a.id)
      uniqueAnnotations.push(a)
    } else {
      console.warn('[documentTree] 发现重复标注 ID，已过滤:', a.id, a.text?.substring(0, 20))
    }
  }

  // 【第二步：排序】按页码和创建时间排序，同时考虑 parentId 和 sortOrder
  const sorted = [...uniqueAnnotations].sort((a, b) => {
    // 如果有 parentId，放在父级后面
    if (a.parentId && !b.parentId) return 1
    if (!a.parentId && b.parentId) return -1

    // 如果都有 parentId，按父级分组
    if (a.parentId && b.parentId) {
      if (a.parentId !== b.parentId) {
        // 找到父级的位置来决定排序（使用去重后的数组）
        const parentA = uniqueAnnotations.find((p) => p.id === a.parentId)
        const parentB = uniqueAnnotations.find((p) => p.id === b.parentId)
        if (parentA && parentB) {
          if (parentA.page !== parentB.page) return parentA.page - parentB.page
          return parentA.created - parentB.created
        }
      }
      // 同一父级下按 sortOrder 排序
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    }

    // 没有 parentId 的按页码和时间排序
    if (a.page !== b.page) return a.page - b.page
    return a.created - b.created
  })

  const result: DocumentNode[] = []
  let currentPage = -1
  let headingStack: { level: string, indent: number, id: string }[] = []

  // 记录被折叠的标题及其级别
  // 当标题被折叠时，跳过它后面所有比它级别低的内容
  let collapsedLevel: number | null = null

  for (const ann of sorted) {
    // 如果是子标注（有 parentId），跳过，不作为独立节点显示
    if (ann.parentId) {
      continue
    }

    // 检查是否有折叠的标题
    if (collapsedLevel !== null) {
      // 如果当前是标题，检查是否结束了折叠范围
      if (ann.level && ann.level !== 'text' && !ann.isImage) {
        const currentLevel = levelWeight[ann.level] || 6
        // 如果遇到同级或更高级标题，结束折叠
        if (currentLevel <= collapsedLevel) {
          collapsedLevel = null
        }
      }
      // 如果还在折叠范围内，跳过
      if (collapsedLevel !== null) {
        continue
      }
    }

    // 页码分隔
    if (ann.page !== currentPage) {
      if (currentPage !== -1) {
        result.push({
          annotation: ann,
          indent: 0,
          isPageBreak: true,
          page: ann.page,
        })
      }
      currentPage = ann.page
      headingStack = []
      // 换页时重置折叠状态
      collapsedLevel = null
    }

    // 计算缩进
    let indent = 0

    if (ann.level && ann.level !== 'text' && !ann.isImage) {
      // 标题：根据级别计算缩进
      const currentLevel = levelWeight[ann.level] || 6

      while (headingStack.length > 0 && levelWeight[headingStack[headingStack.length - 1].level] >= currentLevel) {
        headingStack.pop()
      }

      indent = headingStack.length
      headingStack.push({
        level: ann.level,
        indent,
        id: ann.id,
      })

      // 检查这个标题是否被折叠
      if (collapsedHeadings.value.has(ann.id)) {
        collapsedLevel = currentLevel
      }
    } else if (ann.isImage || !ann.level || ann.level === 'text') {
      // 正文或图片：跟随最近标题的缩进
      indent = headingStack.length
    }

    result.push({
      annotation: ann,
      indent,
    })
  }

  return result
})

// 目录项（提取所有标题）
const tocItems = computed<TocItem[]>(() => {
  return documentTree.value
    .filter((node) => !node.isPageBreak && node.annotation.level && node.annotation.level !== 'text')
    .map((node) => ({
      id: node.annotation.id,
      text: node.annotation.text,
      level: node.annotation.level!,
    }))
})

// 滚动到指定标注
const scrollToAnnotation = (annotationId: string) => {
  const element = listBodyRef.value?.querySelector(`[data-annotation-id="${annotationId}"]`)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    // 高亮效果
    element.classList.add('highlight-flash')
    setTimeout(() => {
      element.classList.remove('highlight-flash')
    }, 1500)
  }
}

// 拖拽开始
const onDragStart = (e: DragEvent, annotation: PDFAnnotation) => {
  draggingId.value = annotation.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', annotation.id)
  }
  dragTip.value = `拖动到目标标注上方释放以合并`
}

// 拖拽结束
const onDragEnd = () => {
  draggingId.value = null
  dragOverId.value = null
  dragTip.value = ''
}

// 拖拽悬停
const onDragOver = (e: DragEvent, annotation: PDFAnnotation) => {
  e.preventDefault()
  if (draggingId.value && draggingId.value !== annotation.id) {
    e.dataTransfer!.dropEffect = 'move'
    dragOverId.value = annotation.id
  }
}

// 拖拽离开
const onDragLeave = () => {
  dragOverId.value = null
}

// 放置
const onDrop = (e: DragEvent, targetAnnotation: PDFAnnotation) => {
  e.preventDefault()

  const sourceId = e.dataTransfer?.getData('text/plain')
  if (!sourceId || sourceId === targetAnnotation.id) {
    dragOverId.value = null
    draggingId.value = null
    dragTip.value = ''
    return
  }

  // 检查是否会造成循环引用（目标不能是源的子节点）
  let current = targetAnnotation
  while (current.parentId) {
    if (current.parentId === sourceId) {
      dragTip.value = '不能将标注合并到它自己的子标注中'
      setTimeout(() => { dragTip.value = '' }, 2000)
      dragOverId.value = null
      draggingId.value = null
      return
    }
    const parent = props.annotations.find((a) => a.id === current.parentId)
    if (!parent) break
    current = parent
  }

  // 检查源标注的所有子节点（如果源是父节点，不允许合并到子节点）
  const sourceAnnotation = props.annotations.find((a) => a.id === sourceId)
  if (sourceAnnotation) {
    // 检查目标是否是源的后代
    let checkTarget = targetAnnotation
    while (checkTarget.parentId) {
      if (checkTarget.parentId === sourceId) {
        dragTip.value = '不能将子标注合并到其父标注中'
        setTimeout(() => { dragTip.value = '' }, 2000)
        dragOverId.value = null
        draggingId.value = null
        return
      }
      const parent = props.annotations.find((a) => a.id === checkTarget.parentId)
      if (!parent) break
      checkTarget = parent
    }
  }

  // 发出合并事件
  emit('merge', sourceId, targetAnnotation.id)

  dragTip.value = '合并成功！'
  setTimeout(() => { dragTip.value = '' }, 1500)

  dragOverId.value = null
  draggingId.value = null
}

// 取消合并
const unmergeAnnotation = (annotation: PDFAnnotation) => {
  if (annotation.parentId) {
    emit('unmerge', annotation.id)
  }
}

// 双击跳转 - 跳转到 PDF 对应位置
const handleDoubleClick = async (ann: PDFAnnotation) => {
  // 尝试跳转到 PDF
  const success = await navigateToAnnotationPdf(ann)
  if (!success) {
    // 如果跳转失败（可能不是 PDF 标注），仍然发出点击事件
    emit('annotation-click', ann)
  }
}

// 编辑标注
const editAnnotation = (ann: PDFAnnotation) => {
  emit('annotation-edit', ann)
}

// 打开裁剪编辑器
const openCropEditor = (ann: PDFAnnotation) => {
  if (!ann.imagePath) return
  currentCropAnnotation.value = ann
  currentCropImage.value = getImageUrl(ann.imagePath)
  showCropEditor.value = true
}

// 应用裁剪
const handleCropApply = (croppedImage: string, region: CropRegion) => {
  // TODO: 保存裁剪结果到标注
  console.log('应用裁剪:', region)
  showMessage('裁剪已应用', 'success')
  showCropEditor.value = false
  currentCropImage.value = ''
  currentCropAnnotation.value = null
}

// 取消裁剪
const handleCropCancel = () => {
  showCropEditor.value = false
  currentCropImage.value = ''
  currentCropAnnotation.value = null
}

// 打开批量裁剪
const openBatchCrop = () => {
  const imageAnnotations = props.annotations.filter((ann) => ann.isImage && ann.imagePath)
  batchCropItems.value = imageAnnotations.map((ann) => ({
    id: ann.id,
    name: `图片 ${ann.page}-${ann.id.slice(0, 4)}`,
    imageSrc: getImageUrl(ann.imagePath!),
  }))
  showBatchCrop.value = true
}

// 批量裁剪结果处理
const handleBatchCropResult = (id: string, croppedImage: string, region: CropRegion) => {
  console.log('批量裁剪结果:', id, region)
  // TODO: 保存裁剪结果到标注
}

// 批量裁剪还原
const handleBatchCropRevert = (id: string) => {
  console.log('还原裁剪:', id)
  // TODO: 还原裁剪结果
}

// 删除标注
const deleteAnnotation = async (ann: PDFAnnotation) => {
  // 发出删除事件，让父组件处理确认和删除逻辑
  emit('annotation-delete', ann)
}

// 导出 Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown(props.annotations, {
    groupBy: 'page',
    includeNotes: true,
    includeLocation: true,
  })

  navigator.clipboard.writeText(markdown).then(() => {
    alert('Markdown 已复制到剪贴板！')
  }).catch((err) => {
    console.error('复制失败:', err)
    alert('复制失败')
  })
}

// 批量导出
const handleBatchExport = () => {
  if (selection && selection.selectedAnnotations.value.length > 0) {
    emit('batch-export')
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (selection && selection.selectedAnnotations.value.length > 0) {
    const ids = selection.selectedAnnotations.value.map((ann) => ann.id)
    if (confirm(`确定要删除选中的 ${ids.length} 个标注吗？`)) {
      emit('batch-delete', ids)
      selection.clearSelection()
    }
  }
}

// 批量移动
const handleBatchMove = () => {
  if (selection && selection.selectedAnnotations.value.length > 0) {
    const ids = selection.selectedAnnotations.value.map((ann) => ann.id)
    emit('batch-move', ids)
  }
}

// 取消选择
const handleClearSelection = () => {
  if (selection) {
    selection.clearSelection()
  }
}

// 切换单个标注的选择状态（复选框）
const toggleAnnotationSelection = (annotation: PDFAnnotation, event: Event) => {
  if (!selection) return
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    selection.selectedIds.value.add(annotation.id)
  } else {
    selection.selectedIds.value.delete(annotation.id)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (!selection) return
  if (selection.selectionCount.value === props.annotations.length) {
    selection.clearSelection()
  } else {
    selection.selectAll()
  }
}

// 处理标注点击（集成选择功能）
const handleAnnotationClick = (annotation: PDFAnnotation, event: MouseEvent) => {
  if (selection) {
    selection.toggleSelection(annotation, event)
  }
  emit('annotation-click', annotation)
}

// 刷新
const refresh = () => {
  emit('refresh')
}
</script>

<style scoped lang="scss">
// CSS 隔离：所有样式嵌套在根类名下
.annotation-list-container {
  display: flex;
  height: 100%;
  background: var(--b3-theme-background);
  font-size: 14px;

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

  /* 批量操作工具栏样式 */
  .bulk-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.1));
    border-radius: 6px;
    border: 1px solid var(--b3-theme-primary-light);
    animation: slide-down 0.2s ease-out;
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .selection-count {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-primary);
    padding: 0 8px;
  }

  /* 全选复选框样式 */
  .select-all-label {
    display: flex;
    align-items: center;
    padding: 0 4px;
    cursor: pointer;
  }

  .select-all-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--b3-theme-primary);
  }

  /* 标注项复选框样式 */
  .annotation-checkbox {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-right: 8px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .annotation-checkbox:hover {
    background: var(--b3-theme-surface-light);
  }

  .annotation-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--b3-theme-primary);
  }

  .bulk-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .bulk-btn:hover {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .bulk-btn.delete:hover {
    background: var(--b3-theme-danger, #ef4444);
    border-color: var(--b3-theme-danger, #ef4444);
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
  
  /* 虚拟滚动列表样式 */
  .list-body.virtual-list {
    padding: 0;
    overflow-y: auto;
    contain: strict;
  }
  
  .virtual-wrapper {
    width: 100%;
    contain: strict;
  }
  
  .virtual-wrapper .insert-cursor {
    margin: 8px 0;
  }
  
  .virtual-wrapper .page-separator {
    margin: 24px 0 16px 0;
  }
  
  .virtual-wrapper .doc-heading,
  .virtual-wrapper .doc-paragraph,
  .virtual-wrapper .doc-image {
    margin-bottom: 8px;
  }
  
  .virtual-wrapper .merged-children {
    margin-top: 8px;
    margin-bottom: 16px;
  }

  .loading-tip,
  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: 40px 20px;
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

  /* Typora 风格折叠指示器 */
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
    background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.15));
    border-left-color: var(--b3-theme-primary);
    margin-left: -8px;
    margin-right: -8px;
    padding-left: 8px;
    padding-right: 8px;
    border-radius: 4px;
    box-shadow: 0 0 0 2px var(--b3-theme-primary-lightest);
    position: relative;
  }

  /* 选中状态的勾选标记 */
  .doc-heading.selected::before,
  .doc-paragraph.selected::before,
  .doc-image.selected::before {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: var(--b3-theme-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    animation: checkmark-appear 0.2s ease-out;
  }

  @keyframes checkmark-appear {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
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
}
</style>
