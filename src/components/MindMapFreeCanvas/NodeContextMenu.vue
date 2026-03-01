<script setup lang="ts">
/**
 * 节点右键菜单组件
 * 提供节点操作的快捷菜单
 */

import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { FreeMindMapNode } from '@/types/mindmapFree'

interface Props {
  /** 是否显示菜单 */
  modelValue: boolean
  /** 菜单位置 X */
  x: number
  /** 菜单位置 Y */
  y: number
  /** 选中的节点 */
  selectedNodes: FreeMindMapNode[]
  /** 是否只读模式 */
  readOnly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'duplicate'): void
  (e: 'color', color: string): void
  (e: 'level', level: string): void
  (e: 'addGroup'): void
  (e: 'createConnection'): void
  (e: 'zoomToFit'): void
  (e: 'centerView'): void
  // MarginNote4 风格增强功能
  (e: 'mergeToParent'): void
  (e: 'splitFromParent'): void
  (e: 'mergeSelected'): void
  (e: 'extractChildren'): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  selectedNodes: () => []
})

const emit = defineEmits<Emits>()

// 菜单内部状态
const internalVisible = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const menuPosition = ref({ x: 0, y: 0 })

// 颜色选项
const colorOptions = [
  { value: '', label: '默认', color: 'transparent' },
  { value: '#fef0f0', label: '红色', color: '#fef0f0' },
  { value: '#fdf6ec', label: '橙色', color: '#fdf6ec' },
  { value: '#fdf5e6', label: '黄色', color: '#fdf5e6' },
  { value: '#f0f9ff', label: '蓝色', color: '#f0f9ff' },
  { value: '#f0fff4', label: '绿色', color: '#f0fff4' },
  { value: '#fcf5f5', label: '紫色', color: '#fcf5f5' }
]

// 层级选项
const levelOptions = [
  { value: 'title', label: '🎯 标题' },
  { value: 'h1', label: '📌 H1' },
  { value: 'h2', label: '📍 H2' },
  { value: 'h3', label: '📎 H3' },
  { value: 'h4', label: '🏷️ H4' },
  { value: 'h5', label: '🔖 H5' },
  { value: 'text', label: '💬 正文' }
]

// 计算是否有父节点（用于合并功能）
const hasParent = computed(() => {
  if (!isSingleSelection.value) return false
  const node = props.selectedNodes[0]
  return node.data?.parentId !== undefined && node.data?.parentId !== null
})

// 计算是否有子节点（用于提取功能）
const hasChildren = computed(() => {
  if (!isSingleSelection.value) return false
  const node = props.selectedNodes[0]
  return node.data?.hasChildren === true
})

// 计算是否可以合并（多个选中节点）
const canMergeSelected = computed(() => {
  return props.selectedNodes.length >= 2
})

// 计算选中节点数量
const selectedCount = computed(() => props.selectedNodes.length)

// 是否有选中节点
const hasSelection = computed(() => selectedCount.value > 0)

// 是否单个节点选中
const isSingleSelection = computed(() => selectedCount.value === 1)

// 监听显示状态
watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    if (val) {
      // 计算菜单位置，确保不超出屏幕
      const menuWidth = 200
      const menuHeight = 300
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      menuPosition.value = {
        x: Math.min(props.x, screenWidth - menuWidth - 10),
        y: Math.min(props.y, screenHeight - menuHeight - 10)
      }
    }
  },
  { immediate: true }
)

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 菜单项点击处理
function handleEdit(): void {
  emit('edit')
  emit('update:modelValue', false)
}

function handleDelete(): void {
  emit('delete')
  emit('update:modelValue', false)
}

function handleDuplicate(): void {
  emit('duplicate')
  emit('update:modelValue', false)
}

function handleColor(color: string): void {
  emit('color', color)
  emit('update:modelValue', false)
}

function handleLevel(level: string): void {
  emit('level', level)
  emit('update:modelValue', false)
}

function handleAddGroup(): void {
  emit('addGroup')
  emit('update:modelValue', false)
}

function handleCreateConnection(): void {
  emit('createConnection')
  emit('update:modelValue', false)
}

function handleZoomToFit(): void {
  emit('zoomToFit')
  emit('update:modelValue', false)
}

function handleCenterView(): void {
  emit('centerView')
  emit('update:modelValue', false)
}

// MarginNote4 风格增强功能
function handleMergeToParent(): void {
  emit('mergeToParent')
  emit('update:modelValue', false)
}

function handleSplitFromParent(): void {
  emit('splitFromParent')
  emit('update:modelValue', false)
}

function handleMergeSelected(): void {
  emit('mergeSelected')
  emit('update:modelValue', false)
}

function handleExtractChildren(): void {
  emit('extractChildren')
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="internalVisible"
        ref="menuRef"
        class="freemind-context-menu"
        :style="{
          left: menuPosition.x + 'px',
          top: menuPosition.y + 'px'
        }"
      >
        <!-- 节点操作菜单 -->
        <div class="freemind-menu-section">
          <div class="freemind-menu-header">
            <span v-if="isSingleSelection">
              {{ selectedNodes[0]?.data?.title || '节点' }}
            </span>
            <span v-else-if="hasSelection">
              已选择 {{ selectedCount }} 个节点
            </span>
            <span v-else>
              画布菜单
            </span>
          </div>
        </div>

        <!-- 选中节点时的操作 -->
        <template v-if="hasSelection && !readOnly">
          <div class="freemind-menu-section">
            <button
              v-if="isSingleSelection"
              class="freemind-menu-item"
              @click="handleEdit"
            >
              <span class="freemind-menu-icon">✏️</span>
              <span>编辑节点</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleDuplicate"
            >
              <span class="freemind-menu-icon">📋</span>
              <span>复制节点</span>
            </button>
            <button
              class="freemind-menu-item freemind-menu-item-danger"
              @click="handleDelete"
            >
              <span class="freemind-menu-icon">🗑️</span>
              <span>删除节点</span>
            </button>
          </div>

          <!-- 颜色选择 -->
          <div class="freemind-menu-section">
            <div class="freemind-menu-label">背景颜色</div>
            <div class="freemind-color-options">
              <button
                v-for="option in colorOptions"
                :key="option.value"
                class="freemind-color-btn"
                :style="{
                  backgroundColor: option.color,
                  border: selectedNodes[0]?.data?.color === option.value
                    ? '2px solid var(--siyuan-primary)'
                    : '1px solid var(--siyuan-border)'
                }"
                @click="handleColor(option.value)"
                :title="option.label"
              >
                <span v-if="selectedNodes[0]?.data?.color === option.value">✓</span>
              </button>
            </div>
          </div>

          <!-- 层级设置（仅文本卡片） -->
          <template v-if="isSingleSelection && selectedNodes[0]?.type === 'textCard'">
            <div class="freemind-menu-section">
              <div class="freemind-menu-label">节点层级</div>
              <div class="freemind-level-options">
                <button
                  v-for="option in levelOptions"
                  :key="option.value"
                  class="freemind-level-btn"
                  :class="{
                    active: selectedNodes[0]?.data?.level === option.value
                  }"
                  @click="handleLevel(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </template>

          <!-- 分组操作 -->
          <div class="freemind-menu-section">
            <button
              class="freemind-menu-item"
              @click="handleAddGroup"
            >
              <span class="freemind-menu-icon">📁</span>
              <span>创建分组</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleCreateConnection"
            >
              <span class="freemind-menu-icon">🔗</span>
              <span>创建连线</span>
            </button>
          </div>

          <!-- MarginNote4 风格：合并/拆分操作 -->
          <div class="freemind-menu-section">
            <div class="freemind-menu-label">📊 合并/拆分</div>
            <button
              class="freemind-menu-item"
              @click="handleMergeToParent"
              :disabled="!hasParent"
              :class="{ 'freemind-menu-item-disabled': !hasParent }"
            >
              <span class="freemind-menu-icon">⬆️</span>
              <span>合并到父节点</span>
              <span class="freemind-shortcut">Ctrl+M</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleSplitFromParent"
              :disabled="!hasParent"
              :class="{ 'freemind-menu-item-disabled': !hasParent }"
            >
              <span class="freemind-menu-icon">⬇️</span>
              <span>拆分为独立节点</span>
              <span class="freemind-shortcut">Ctrl+S</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleMergeSelected"
              :disabled="!canMergeSelected"
              :class="{ 'freemind-menu-item-disabled': !canMergeSelected }"
            >
              <span class="freemind-menu-icon">🔀</span>
              <span>合并选中节点</span>
              <span class="freemind-shortcut">Ctrl+Shift+M</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleExtractChildren"
              :disabled="!hasChildren"
              :class="{ 'freemind-menu-item-disabled': !hasChildren }"
            >
              <span class="freemind-menu-icon">🔽</span>
              <span>提取子节点</span>
              <span class="freemind-shortcut">Ctrl+E</span>
            </button>
          </div>
        </template>

        <!-- 画布操作（无选中节点） -->
        <template v-if="!hasSelection">
          <div class="freemind-menu-section">
            <button
              class="freemind-menu-item"
              @click="handleZoomToFit"
            >
              <span class="freemind-menu-icon">🔍</span>
              <span>适应视图</span>
            </button>
            <button
              class="freemind-menu-item"
              @click="handleCenterView"
            >
              <span class="freemind-menu-icon">📍</span>
              <span>居中视图</span>
            </button>
          </div>
        </template>

        <!-- 只读模式提示 -->
        <div
          v-if="readOnly"
          class="freemind-menu-section freemind-readonly-hint"
        >
          <span class="freemind-menu-icon">🔒</span>
          <span>只读模式</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.freemind-context-menu {
  position: fixed;
  min-width: 200px;
  max-width: 280px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  overflow: hidden;
  padding: 8px 0;
}

.freemind-menu-section {
  padding: 4px 0;
}

.freemind-menu-section:not(:last-child) {
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.freemind-menu-header {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
  background: var(--siyuan-bg-secondary, #f5f5f5);
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.freemind-menu-item {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  transition: all 0.15s;
  text-align: left;
}

.freemind-menu-item:hover {
  background: var(--siyuan-hover-bg, #f0f0f0);
}

.freemind-menu-item-danger {
  color: var(--siyuan-error, #f56c6c);
}

.freemind-menu-item-danger:hover {
  background: var(--siyuan-error-bg, #fef0f0);
}

.freemind-menu-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.freemind-menu-label {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-secondary-text, #666);
}

.freemind-color-options,
.freemind-level-options {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  flex-wrap: wrap;
}

.freemind-color-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--siyuan-primary, #409eff);
  transition: all 0.2s;
}

.freemind-color-btn:hover {
  transform: scale(1.1);
}

.freemind-level-btn {
  padding: 4px 10px;
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  background: var(--siyuan-bg, #fff);
  cursor: pointer;
  font-size: 12px;
  color: var(--siyuan-text, #333);
  transition: all 0.2s;
}

.freemind-level-btn:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.freemind-level-btn.active {
  background: var(--siyuan-primary, #409eff);
  color: #fff;
  border-color: var(--siyuan-primary, #409eff);
}

.freemind-readonly-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
  background: var(--siyuan-bg-secondary, #f5f5f5);
}

.freemind-menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.freemind-menu-item-disabled:hover {
  background: transparent !important;
}

.freemind-shortcut {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 6px;
  background: var(--siyuan-gray-bg, #f0f0f0);
  color: var(--siyuan-secondary-text, #999);
  border-radius: 4px;
  font-family: monospace;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .freemind-shortcut {
    background: var(--siyuan-gray-bg, #3a3a3a);
    color: var(--siyuan-tertiary-text, #666);
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .freemind-context-menu {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .freemind-menu-header {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-menu-item {
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-menu-item:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .freemind-menu-label {
    color: var(--siyuan-secondary-text, #aaa);
  }

  .freemind-level-btn {
    background: var(--siyuan-bg, #2a2a2a);
    border-color: var(--siyuan-border, #444);
    color: var(--siyuan-text, #e0e0e0);
  }

  .freemind-level-btn:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
  }

  .freemind-readonly-hint {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    color: var(--siyuan-secondary-text, #888);
  }
}
</style>
