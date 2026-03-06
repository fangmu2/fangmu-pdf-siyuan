<!-- src/components/PDFViewer/PDFOutlineSidebar.vue -->
<template>
  <div
    v-if="visible"
    class="outline-sidebar"
  >
    <div class="outline-header">
      <span>目录</span>
      <button
        class="outline-close"
        @click="$emit('close')"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
    <div class="outline-content">
      <div
        v-if="loading"
        class="outline-loading"
      >
        <div class="b3-spin"></div>
      </div>
      <div
        v-else-if="outline.length === 0"
        class="outline-empty"
      >
        此文档没有目录
      </div>
      <div
        v-else
        class="outline-tree"
      >
        <OutlineItem
          v-for="(item, index) in outline"
          :key="index"
          :item="item"
          :level="0"
          @navigate="handleNavigate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h } from 'vue'

interface Props {
  visible: boolean
  outline: any[]
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', item: any): void
}>()

// 目录项组件
const OutlineItem = defineComponent({
  name: 'OutlineItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
    level: {
      type: Number,
      default: 0,
    },
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const handleClick = () => {
      emit('navigate', props.item)
    }
    return () => {
      const children = props.item.items?.map((child: any, index: number) =>
        h(OutlineItem, {
          key: index,
          item: child,
          level: props.level + 1,
          onNavigate: (item: any) => emit('navigate', item),
        }),
      )
      return h('div', { class: 'outline-item-wrapper' }, [
        h('div', {
          class: 'outline-item',
          style: { paddingLeft: `${props.level * 16 + 8}px` },
          onClick: handleClick,
        }, [
          h('span', { class: 'outline-item-title' }, props.item.title),
        ]),
        children?.length ? h('div', { class: 'outline-children' }, children) : null,
      ])
    }
  },
})

const handleNavigate = (item: any) => {
  emit('navigate', item)
}
</script>

<style scoped lang="scss">
.outline-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 150;
  display: flex;
  flex-direction: column;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.outline-close {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--b3-theme-surface-light);
    color: var(--b3-theme-on-surface);
  }
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.outline-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.outline-empty {
  text-align: center;
  padding: 32px;
  color: var(--b3-theme-on-surface-light);
  font-size: 13px;
}

.outline-tree {
  width: 100%;
}

.outline-item-wrapper {
  width: 100%;
}

.outline-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--b3-theme-surface-light);
  }
}

.outline-item-title {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.4;
}

.outline-children {
  width: 100%;
}
</style>
