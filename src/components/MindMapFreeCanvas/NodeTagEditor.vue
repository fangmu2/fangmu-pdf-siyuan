<template>
  <Teleport to="body">
    <Transition name="tag-editor-fade">
      <div
        v-if="internalVisible"
        ref="editorRef"
        class="node-tag-editor"
        :style="{
          left: `${x}px`,
          top: `${y}px`,
        }"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <div class="tag-editor-header">
          <span class="tag-editor-title">🏷️ 标签管理</span>
        </div>

        <!-- 标签列表 -->
        <div class="tag-editor-content">
          <!-- 标签搜索框 -->
          <div
            v-if="hasTags"
            class="tag-search-box"
          >
            <input
              v-model="searchQuery"
              type="text"
              class="tag-search-input"
              placeholder="搜索标签..."
            />
          </div>

          <div
            v-if="hasTags"
            class="tags-list"
          >
            <TransitionGroup name="tag-list">
              <div
                v-for="tag in filteredTags"
                :key="tag"
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }"
              >
                <span class="tag-text">{{ tag }}</span>
                <button
                  class="tag-remove"
                  title="删除标签"
                  @click.stop="handleRemoveTag(tag)"
                >
                  ×
                </button>
              </div>
            </TransitionGroup>
            <!-- 搜索无结果提示 -->
            <div
              v-if="filteredTags.length === 0 && searchQuery"
              class="tags-empty"
            >
              <span>无匹配标签</span>
            </div>
          </div>
          <div
            v-else
            class="tags-empty"
          >
            <span>暂无标签</span>
          </div>
        </div>

        <!-- 添加标签 -->
        <div class="tag-editor-footer">
          <div class="add-tag-input">
            <input
              v-model="newTag"
              type="text"
              class="tag-input"
              placeholder="输入标签名称..."
              @keyup.enter="handleAddTag"
            />
            <button
              class="add-tag-btn"
              :disabled="!newTag.trim()"
              @click="handleAddTag"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 节点标签编辑器组件
 * 用于添加、删除和管理节点标签
 */

import {
  computed,
  ref,
  watch,
} from 'vue'

interface Props {
  /** 是否显示编辑器 */
  modelValue: boolean
  /** 节点标签列表 */
  tags: string[]
  /** 菜单位置 X */
  x: number
  /** 菜单位置 Y */
  y: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'add-tag', tag: string): void
  (e: 'remove-tag', tag: string): void
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
})

const emit = defineEmits<Emits>()

// 内部状态
const internalVisible = ref(false)
const newTag = ref('')
const searchQuery = ref('')
const editorRef = ref<HTMLElement | null>(null)

// 标签颜色映射（8 种颜色）
const tagColors = [
  '#fef0f0', // 红
  '#fdf6ec', // 橙
  '#fdf5e6', // 黄
  '#f0f9ff', // 蓝
  '#f0fff4', // 绿
  '#fcf5f5', // 紫
  '#f4f4f5', // 灰
  '#fff5e6', // 浅橙
]

// 计算标签颜色
function getTagColor(tag: string): string {
  const index = tag.length % tagColors.length
  return tagColors[index]
}

// 计算是否有标签
const hasTags = computed(() => props.tags.length > 0)

// 计算过滤后的标签列表（支持模糊搜索）
const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.tags

  return props.tags.filter((tag) =>
    tag.toLowerCase().includes(query),
  )
})

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (val) {
      newTag.value = ''
    }
  },
  { immediate: true },
)

// 点击外部关闭
function handleClickOutside(event: MouseEvent): void {
  if (editorRef.value && !editorRef.value.contains(event.target as Node)) {
    emit('update:modelValue', false)
  }
}

// 添加标签
function handleAddTag(): void {
  const tag = newTag.value.trim()
  if (!tag) return

  if (!props.tags.includes(tag)) {
    emit('add-tag', tag)
  }
  newTag.value = ''
}

// 删除标签
function handleRemoveTag(tag: string): void {
  emit('remove-tag', tag)
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('update:modelValue', false)
  }
}
</script>

<style scoped>
.tag-editor-fade-enter-active,
.tag-editor-fade-leave-active {
  transition: all 0.15s ease;
}

.tag-editor-fade-enter-from,
.tag-editor-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.node-tag-editor {
  position: fixed;
  min-width: 220px;
  max-width: 300px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  overflow: hidden;
}

.tag-editor-header {
  padding: 10px 12px;
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.tag-editor-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.tag-editor-content {
  padding: 8px 12px;
  max-height: 200px;
  overflow-y: auto;
}

.tag-search-box {
  margin-bottom: 8px;
}

.tag-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg, #fff);
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.tag-search-input:focus {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  gap: 8px;
  transition: all 0.2s;
}

.tag-item:hover {
  transform: translateX(2px);
}

.tag-text {
  flex: 1;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  word-break: break-word;
}

.tag-remove {
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: var(--siyuan-text, #333);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tag-remove:hover {
  background: rgba(245, 108, 108, 0.2);
  color: var(--siyuan-error, #f56c6c);
}

.tags-empty {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--siyuan-secondary-text, #999);
}

.tag-editor-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
}

.add-tag-input {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg, #fff);
  outline: none;
  transition: all 0.2s;
}

.tag-input:focus {
  border-color: var(--siyuan-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.add-tag-btn {
  padding: 6px 14px;
  border: none;
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-tag-btn:hover:not(:disabled) {
  background: var(--siyuan-primary-dark, #337ecc);
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 标签列表动画 */
.tag-list-enter-active,
.tag-list-leave-active {
  transition: all 0.3s ease;
}

.tag-list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.tag-list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 滚动条样式 */
.tag-editor-content::-webkit-scrollbar {
  width: 4px;
}

.tag-editor-content::-webkit-scrollbar-track {
  background: transparent;
}

.tag-editor-content::-webkit-scrollbar-thumb {
  background: var(--siyuan-border, #ccc);
  border-radius: 2px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .node-tag-editor {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .tag-editor-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .tag-editor-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .tag-text {
    color: var(--siyuan-text, #e0e0e0);
  }

  .tag-input {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .tag-input:focus {
    border-color: var(--siyuan-primary, #409eff);
  }

  .tag-search-input {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .tag-search-input:focus {
    border-color: var(--siyuan-primary, #409eff);
  }
}
</style>
