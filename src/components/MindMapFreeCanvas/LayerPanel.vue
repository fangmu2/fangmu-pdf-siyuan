<template>
  <teleport to="body">
    <transition name="slide-right">
      <div
        v-if="visible"
        class="layer-panel-overlay"
        @click="closePanel"
      >
        <div
          class="layer-panel"
          @click.stop
        >
          <!-- 面板头部 -->
          <div class="layer-panel-header">
            <h3 class="layer-panel-title">
              <span class="title-icon">📑</span>
              图层
            </h3>
            <div class="header-actions">
              <button
                class="btn-icon btn-add"
                title="添加图层"
                @click="addNewLayer"
              >
                <span>+</span>
              </button>
              <button
                class="btn-icon btn-close"
                title="关闭"
                @click="closePanel"
              >
                <span>×</span>
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div
            v-if="isLoading"
            class="layer-panel-loading"
          >
            <span class="loading-spinner">⏳</span>
            <span>加载中...</span>
          </div>

          <!-- 错误提示 -->
          <div
            v-else-if="errorMessage"
            class="layer-panel-error"
          >
            <span class="error-icon">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- 图层列表 -->
          <div
            v-else-if="layers.length > 0"
            class="layer-list"
          >
            <div
              v-for="layer in [...layers].sort((a, b) => b.order - a.order)"
              :key="layer.id"
              class="layer-item"
              :class="{
                dragging: draggingLayerId === layer.id,
                locked: layer.locked,
              }"
              draggable
              @dragstart="handleDragStart($event, layer)"
              @dragend="handleDragEnd"
              @dragover="handleDragOver"
              @drop="handleDrop($event, layer)"
            >
              <!-- 拖拽手柄 -->
              <div
                class="layer-drag-handle"
                title="拖拽调整顺序"
              >
                <span>⋮⋮</span>
              </div>

              <!-- 图层信息 -->
              <div class="layer-info">
                <div
                  class="layer-icon"
                  :style="{ color: layer.color || '#999' }"
                >
                  {{ layerTypeIcons[layer.type] || '📁' }}
                </div>
                <div class="layer-text">
                  <span class="layer-name">{{ layer.name }}</span>
                  <span class="layer-type">{{ layerTypeNames[layer.type] || '自定义层' }}</span>
                </div>
              </div>

              <!-- 图层控制 -->
              <div class="layer-controls">
                <!-- 可见性切换 -->
                <button
                  class="btn-icon btn-visibility"
                  :class="{ hidden: !layer.visible }"
                  :title="layer.visible ? '隐藏图层' : '显示图层'"
                  @click="toggleLayerVisible(layer)"
                >
                  <span v-if="layer.visible">👁️</span>
                  <span v-else>🚫</span>
                </button>

                <!-- 锁定切换 -->
                <button
                  class="btn-icon btn-lock"
                  :class="{ locked: layer.locked }"
                  :title="layer.locked ? '解锁图层' : '锁定图层'"
                  @click="toggleLayerLocked(layer)"
                >
                  <span v-if="layer.locked">🔒</span>
                  <span v-else>🔓</span>
                </button>

                <!-- 更多操作 -->
                <div class="layer-more">
                  <button
                    class="btn-icon btn-more"
                    title="更多选项"
                  >
                    <span>⋯</span>
                  </button>
                  <div class="layer-more-menu">
                    <button
                      class="menu-item"
                      @click="renameLayer(layer)"
                    >
                      <span>✏️</span> 重命名
                    </button>
                    <button
                      v-if="layer.type === 'custom'"
                      class="menu-item menu-item-danger"
                      @click="deleteLayer(layer)"
                    >
                      <span>🗑️</span> 删除
                    </button>
                  </div>
                </div>
              </div>

              <!-- 不透明度滑块 -->
              <div class="layer-opacity">
                <input
                  type="range"
                  :min="0"
                  :max="100"
                  :value="Math.round(layer.opacity * 100)"
                  :disabled="layer.locked"
                  @input="updateLayerOpacity(layer, Number(($event.target as HTMLInputElement).value))"
                />
                <span class="opacity-value">{{ Math.round(layer.opacity * 100) }}%</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="layer-panel-empty"
          >
            <span class="empty-icon">📭</span>
            <span>暂无图层</span>
          </div>

          <!-- 面板底部提示 -->
          <div class="layer-panel-footer">
            <span class="tip-icon">💡</span>
            <span class="tip-text">拖拽图层可调整顺序</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
/**
 * 图层面板组件
 * 提供图层可见性控制、锁定、顺序调整等功能
 */

import type { LayerConfig } from '@/types/canvas'
import { storeToRefs } from 'pinia'
import {
  ref,
  watch,
} from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'

interface Props {
  /** 是否可见 */
  visible: boolean
  /** 学习集 ID */
  studySetId: string
  /** 当前画布 ID */
  canvasId: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'layer-change', layer: LayerConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

const canvasStore = useCanvasStore()
const {
  layers,
  isLoading,
  errorMessage,
} = storeToRefs(canvasStore)

/** 是否正在拖拽图层 */
const draggingLayerId = ref<string | null>(null)

// 图层类型图标
const layerTypeIcons: Record<string, string> = {
  background: '🖼️',
  nodes: '📌',
  handwriting: '✏️',
  annotations: '🏷️',
  custom: '📁',
}

// 图层类型名称
const layerTypeNames: Record<string, string> = {
  background: '背景层',
  nodes: '节点层',
  handwriting: '手绘层',
  annotations: '标注层',
  custom: '自定义层',
}

// 监听画布 ID 变化，加载图层
watch(
  () => props.canvasId,
  async (newCanvasId) => {
    if (newCanvasId) {
      await canvasStore.loadLayers(newCanvasId)
    }
  },
  { immediate: true },
)

// 切换图层可见性
async function toggleLayerVisible(layer: LayerConfig) {
  const newVisible = !layer.visible
  await canvasStore.updateLayerConfig({
    id: layer.id,
    visible: newVisible,
  })
  emit('layer-change', {
    ...layer,
    visible: newVisible,
  })
}

// 切换图层锁定
async function toggleLayerLocked(layer: LayerConfig) {
  const newLocked = !layer.locked
  await canvasStore.updateLayerConfig({
    id: layer.id,
    locked: newLocked,
  })
  emit('layer-change', {
    ...layer,
    locked: newLocked,
  })
}

// 调整图层不透明度
async function updateLayerOpacity(layer: LayerConfig, opacity: number) {
  await canvasStore.updateLayerConfig({
    id: layer.id,
    opacity: opacity / 100,
  })
  emit('layer-change', {
    ...layer,
    opacity: opacity / 100,
  })
}

// 重命名图层
async function renameLayer(layer: LayerConfig) {
  const newName = prompt('请输入图层名称:', layer.name)
  if (newName && newName.trim() && newName !== layer.name) {
    await canvasStore.updateLayerConfig({
      id: layer.id,
      name: newName.trim(),
    })
    emit('layer-change', {
      ...layer,
      name: newName.trim(),
    })
  }
}

// 删除图层
async function deleteLayer(layer: LayerConfig) {
  // 不允许删除默认图层
  if (['background', 'nodes', 'handwriting', 'annotations'].includes(layer.type)) {
    alert('默认图层不能删除')
    return
  }

  if (!confirm(`确定要删除图层 "${layer.name}" 吗？`)) return

  const success = await canvasStore.removeLayerConfig(layer.id)
  if (success) {
    emit('layer-change', layer)
  }
}

// 添加新图层
async function addNewLayer() {
  const name = prompt('请输入图层名称:')
  if (!name || !name.trim()) return

  const success = await canvasStore.addLayerConfig({
    name: name.trim(),
    type: 'custom',
    visible: true,
    locked: false,
    order: layers.value.length,
    opacity: 1,
    color: '#999999',
  })

  if (success) {
    emit('layer-change', layers.value[layers.value.length - 1])
  }
}

// 拖拽开始
function handleDragStart(event: DragEvent, layer: LayerConfig) {
  draggingLayerId.value = layer.id
  event.dataTransfer?.setData('text/plain', layer.id)
  event.dataTransfer!.effectAllowed = 'move'
}

// 拖拽结束
function handleDragEnd() {
  draggingLayerId.value = null
}

// 拖拽进入
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

// 拖拽放置
async function handleDrop(event: DragEvent, targetLayer: LayerConfig) {
  event.preventDefault()

  const sourceId = draggingLayerId.value
  if (!sourceId || sourceId === targetLayer.id) return

  const sourceIndex = layers.value.findIndex((l) => l.id === sourceId)
  const targetIndex = layers.value.findIndex((l) => l.id === targetLayer.id)

  if (sourceIndex === -1 || targetIndex === -1) return

  // 交换两个图层的 order
  const sourceLayer = layers.value[sourceIndex]
  const tempOrder = sourceLayer.order

  // 更新源图层顺序
  await canvasStore.updateLayerConfig({
    id: sourceId,
    order: targetLayer.order,
  })

  // 更新目标图层顺序
  await canvasStore.updateLayerConfig({
    id: targetLayer.id,
    order: tempOrder,
  })

  draggingLayerId.value = null
}

// 关闭面板
function closePanel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.layer-panel-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1500;
}

.layer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  max-width: 90vw;
  background: var(--siyuan-bg, #fff);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.layer-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--siyuan-border, #e0e0e0);
}

.layer-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
}

.title-icon {
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.btn-add {
  color: var(--siyuan-primary, #409eff);
}

.btn-add:hover {
  background: #e6f4ff;
}

.btn-close:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.layer-panel-loading,
.layer-panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--siyuan-secondary-text, #999);
}

.loading-spinner,
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.layer-panel-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #cc0000;
  background: #fff3f3;
  margin: 16px;
  border-radius: 8px;
}

.error-icon {
  font-size: 20px;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.layer-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background: var(--siyuan-bg-secondary, #f9f9f9);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  transition: all 0.2s;
}

.layer-item:hover {
  background: var(--siyuan-hover-bg, #f0f0f0);
  border-color: var(--siyuan-primary, #409eff);
}

.layer-item.dragging {
  opacity: 0.5;
  border: 2px dashed var(--siyuan-primary, #409eff);
}

.layer-item.locked {
  opacity: 0.7;
}

.layer-drag-handle {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
  user-select: none;
}

.layer-drag-handle:active {
  cursor: grabbing;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.layer-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.layer-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--siyuan-text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-type {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
}

.layer-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-visibility.hidden {
  opacity: 0.5;
}

.btn-lock.locked {
  color: var(--siyuan-warning, #ff9800);
}

.layer-more {
  position: relative;
  margin-left: auto;
}

.btn-more {
  font-size: 16px;
  color: var(--siyuan-secondary-text, #999);
}

.layer-more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 140px;
  background: var(--siyuan-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 100;
  display: none;
}

.layer-more:hover .layer-more-menu {
  display: block;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--siyuan-text, #333);
  text-align: left;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

.menu-item-danger:hover {
  background: #ffe6e6;
  color: #cc0000;
}

.layer-opacity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-opacity input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: var(--siyuan-border, #e0e0e0);
  border-radius: 2px;
  outline: none;
}

.layer-opacity input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--siyuan-primary, #409eff);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.layer-opacity input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.opacity-value {
  font-size: 11px;
  color: var(--siyuan-secondary-text, #999);
  min-width: 35px;
  text-align: right;
}

.layer-panel-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border-top: 1px solid var(--siyuan-border, #e0e0e0);
  font-size: 12px;
  color: var(--siyuan-secondary-text, #999);
}

.tip-icon {
  font-size: 14px;
}

/* 过渡动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(300px);
}

.slide-right-enter-from .layer-panel,
.slide-right-leave-to .layer-panel {
  opacity: 0;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .layer-panel {
    background: var(--siyuan-bg, #1e1e1e);
  }

  .layer-panel-header {
    border-color: var(--siyuan-border, #444);
  }

  .layer-panel-title {
    color: var(--siyuan-text, #e0e0e0);
  }

  .btn-icon:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .btn-add:hover {
    background: #1a3a52;
  }

  .layer-item {
    background: var(--siyuan-bg-secondary, #2a2a2a);
    border-color: var(--siyuan-border, #444);
  }

  .layer-item:hover {
    background: var(--siyuan-hover-bg, #3a3a3a);
    border-color: var(--siyuan-primary, #409eff);
  }

  .layer-name {
    color: var(--siyuan-text, #e0e0e0);
  }

  .layer-type {
    color: var(--siyuan-secondary-text, #666);
  }

  .layer-more-menu {
    background: var(--siyuan-bg, #1e1e1e);
    border-color: var(--siyuan-border, #444);
  }

  .menu-item {
    color: var(--siyuan-text, #e0e0e0);
  }

  .menu-item:hover {
    background: var(--siyuan-hover-bg, #2a2a2a);
  }

  .layer-panel-footer {
    border-color: var(--siyuan-border, #444);
  }

  .layer-panel-error {
    background: #2a1a1a;
    color: #ff6666;
  }

  .menu-item-danger:hover {
    background: #3a1a1a;
  }
}
</style>
