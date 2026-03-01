<template>
  <div class="pdf-outline">
    <div v-if="loading" class="outline-loading">
      <span>加载目录...</span>
    </div>
    <div v-else-if="outline.length === 0" class="outline-empty">
      <span>暂无目录</span>
    </div>
    <div v-else class="outline-list">
      <OutlineItem
        v-for="item in outline"
        :key="item.id"
        :item="item"
        :current-page="currentPage"
        @page-click="$emit('page-click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfViewerService } from '@/services/pdfViewerService';
import type { PDFOutlineItem } from '@/types/pdfViewer';

interface Props {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'page-click', pageNum: number): void;
}>();

const outline = ref<PDFOutlineItem[]>([]);
const loading = ref(false);

const loadOutline = async () => {
  if (!props.pdfDocument) return;

  loading.value = true;
  try {
    const items = await pdfViewerService.parseOutline(props.pdfDocument);
    outline.value = items;
  } catch (error) {
    console.error('Failed to load outline:', error);
    outline.value = [];
  } finally {
    loading.value = false;
  }
};

watch(() => props.pdfDocument, () => {
  if (props.pdfDocument) {
    loadOutline();
  } else {
    outline.value = [];
  }
}, { immediate: true });

onMounted(() => {
  if (props.pdfDocument) {
    loadOutline();
  }
});
</script>

<script lang="ts">
// OutlineItem 子组件
import { defineComponent, h } from 'vue';
import type { PDFOutlineItem } from '@/types/pdfViewer';

const OutlineItem = defineComponent({
  name: 'OutlineItem',
  props: {
    item: {
      type: Object as () => PDFOutlineItem,
      required: true
    },
    currentPage: {
      type: Number,
      required: true
    }
  },
  emits: ['page-click'],
  setup(props, { emit }) {
    const expanded = ref(false);

    const handleClick = () => {
      emit('page-click', props.item.pageNumber);
      if (props.item.children && props.item.children.length > 0) {
        expanded.value = !expanded.value;
      }
    };

    const renderChildren = () => {
      if (!props.item.children || !expanded.value) return null;

      return h(
        'div',
        { class: 'outline-children' },
        props.item.children.map(child =>
          h(OutlineItem, {
            key: child.id,
            item: child,
            currentPage: props.currentPage,
            'onPage-click': (page: number) => emit('page-click', page)
          })
        )
      );
    };

    return () => h(
      'div',
      {
        class: [
          'outline-item',
          {
            active: props.currentPage === props.item.pageNumber,
            'has-children': props.item.children && props.item.children.length > 0,
            expanded: expanded.value
          }
        ],
        style: { paddingLeft: `${(props.item.level || 0) * 16 + 8}px` }
      },
      [
        h(
          'div',
          {
            class: 'outline-item-content',
            onClick: handleClick
          },
          [
            props.item.children && props.item.children.length > 0
              ? h('span', { class: 'expand-icon' }, expanded.value ? '▼' : '▶')
              : h('span', { class: 'expand-icon placeholder' }),
            h('span', { class: 'outline-title' }, props.item.title),
            h('span', { class: 'outline-page' }, `P.${props.item.pageNumber}`)
          ]
        ),
        renderChildren()
      ]
    );
  }
});
</script>

<style scoped lang="scss">
.pdf-outline {
  height: 100%;
  overflow: auto;
  background: var(--b3-theme-background);
}

.outline-loading,
.outline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--b3-theme-text-secondary);
  font-size: 13px;
}

.outline-list {
  padding: 8px 0;
}

.outline-item {
  display: flex;
  flex-direction: column;

  &.active {
    background: var(--b3-theme-primary-light);

    .outline-title {
      color: var(--b3-theme-primary);
      font-weight: 500;
    }
  }
}

.outline-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: var(--b3-theme-text-secondary);
  transition: transform 0.2s;

  &.placeholder {
    visibility: hidden;
  }
}

.outline-title {
  flex: 1;
  font-size: 13px;
  color: var(--b3-theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.outline-page {
  font-size: 11px;
  color: var(--b3-theme-text-secondary);
  white-space: nowrap;
}

.outline-children {
  overflow: hidden;
}
</style>
