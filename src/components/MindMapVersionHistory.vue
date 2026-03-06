<!-- src/components/MindMapVersionHistory.vue -->
<template>
  <div class="mindmap-version-history">
    <!-- 头部 -->
    <div class="version-header">
      <h3>版本历史</h3>
      <div class="version-actions">
        <button
          class="btn-primary"
          :disabled="!mindMapId"
          @click="createNewVersion"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          保存版本
        </button>
        <button
          class="btn-toggle"
          :class="[{ active: autoSaveEnabled }]"
          @click="toggleAutoSave"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
          </svg>
          自动保存: {{ autoSaveEnabled ? '开' : '关' }}
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="version-stats">
      <div class="stat-item">
        <span class="stat-label">总版本</span>
        <span class="stat-value">{{ stats.totalVersions }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总变更</span>
        <span class="stat-value">{{ stats.totalChanges }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最新版本</span>
        <span class="stat-value">{{ stats.newestVersion?.name || '-' }}</span>
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="version-list">
      <div
        v-if="versions.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        <p>暂无版本历史</p>
        <p class="hint">
          点击"保存版本"创建第一个版本
        </p>
      </div>

      <div
        v-for="version in versions"
        :key="version.id"
        class="version-item"
        :class="{ selected: selectedVersionId === version.id }"
        @click="selectVersion(version)"
      >
        <div class="version-icon">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </div>
        <div class="version-info">
          <div class="version-name">
            {{ version.name }}
          </div>
          <div class="version-meta">
            <span class="version-time">{{ formatTime(version.createdAt) }}</span>
            <span
              v-if="version.description"
              class="version-desc"
            >{{ version.description }}</span>
          </div>
          <div
            v-if="version.changes.length > 0"
            class="version-changes"
          >
            <span
              v-if="getChangeCount(version, 'add') > 0"
              class="change-badge add"
            >
              +{{ getChangeCount(version, 'add') }}
            </span>
            <span
              v-if="getChangeCount(version, 'remove') > 0"
              class="change-badge remove"
            >
              -{{ getChangeCount(version, 'remove') }}
            </span>
            <span
              v-if="getChangeCount(version, 'update') > 0"
              class="change-badge update"
            >
              ~{{ getChangeCount(version, 'update') }}
            </span>
          </div>
        </div>
        <div class="version-actions-item">
          <button
            class="btn-icon"
            title="恢复此版本"
            @click.stop="restoreVersion(version)"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>
          <button
            class="btn-icon"
            title="与当前对比"
            @click.stop="compareWithCurrent(version)"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
          <button
            class="btn-icon danger"
            title="删除版本"
            @click.stop="deleteVersion(version)"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 对比面板 -->
    <div
      v-if="showDiffPanel"
      class="diff-panel"
    >
      <div class="diff-header">
        <h4>版本对比</h4>
        <button
          class="btn-close"
          @click="closeDiffPanel"
        >
          ×
        </button>
      </div>
      <div class="diff-content">
        <div class="diff-summary">
          <span class="diff-item add">+{{ diffResult?.stats.addedCount || 0 }} 新增</span>
          <span class="diff-item remove">-{{ diffResult?.stats.removedCount || 0 }} 删除</span>
          <span class="diff-item update">~{{ diffResult?.stats.modifiedCount || 0 }} 修改</span>
        </div>
        <div class="diff-details">
          <div
            v-for="item in diffResult?.added"
            :key="item.nodeId"
            class="diff-row add"
          >
            <span class="diff-type">+ 新增</span>
            <span class="diff-path">{{ item.path.join(' > ') }}</span>
          </div>
          <div
            v-for="item in diffResult?.removed"
            :key="item.nodeId"
            class="diff-row remove"
          >
            <span class="diff-type">- 删除</span>
            <span class="diff-path">{{ item.path.join(' > ') }}</span>
          </div>
          <div
            v-for="item in diffResult?.modified"
            :key="item.nodeId"
            class="diff-row update"
          >
            <span class="diff-type">~ 修改</span>
            <span class="diff-path">{{ item.path.join(' > ') }}</span>
            <span class="diff-changes">({{ item.changes.join(', ') }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  MindMapVersion,
  VersionDiff,
} from '../services/mindmapVersionService'
import type { MindMap } from '../types/mindmap'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import {

  mindmapVersionService,

} from '../services/mindmapVersionService'

interface Props {
  mindMapId: string
  mindMap?: MindMap | null
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Emits {
  (e: 'restore', mindMap: MindMap): void
  (e: 'create-version', version: MindMapVersion): void
}

// 状态
const versions = ref<MindMapVersion[]>([])
const selectedVersionId = ref<string | null>(null)
const autoSaveEnabled = ref(false)
const showDiffPanel = ref(false)
const diffResult = ref<VersionDiff | null>(null)

// 统计
const stats = computed(() => mindmapVersionService.getVersionStats(props.mindMapId))

// 加载版本列表
const loadVersions = () => {
  versions.value = mindmapVersionService.getVersions(props.mindMapId)
}

// 创建新版本
const createNewVersion = () => {
  if (!props.mindMap) return

  const version = mindmapVersionService.createVersion(
    props.mindMap,
    undefined,
    '手动保存',
  )
  emit('create-version', version)
  loadVersions()
}

// 切换自动保存
const toggleAutoSave = () => {
  autoSaveEnabled.value = !autoSaveEnabled.value

  if (autoSaveEnabled.value) {
    mindmapVersionService.startAutoSave(props.mindMapId, () => props.mindMap || null)
  } else {
    mindmapVersionService.stopAutoSave(props.mindMapId)
  }
}

// 选择版本
const selectVersion = (version: MindMapVersion) => {
  selectedVersionId.value = version.id
}

// 恢复版本
const restoreVersion = (version: MindMapVersion) => {
  const restored = mindmapVersionService.restoreVersion(props.mindMapId, version.id)
  if (restored) {
    emit('restore', restored)
    loadVersions()
  }
}

// 与当前对比
const compareWithCurrent = (version: MindMapVersion) => {
  const latest = mindmapVersionService.getLatestVersion(props.mindMapId)
  if (latest) {
    diffResult.value = mindmapVersionService.compareVersions(version, latest)
    showDiffPanel.value = true
  }
}

// 关闭对比面板
const closeDiffPanel = () => {
  showDiffPanel.value = false
  diffResult.value = null
}

// 删除版本
const deleteVersion = (version: MindMapVersion) => {
  if (confirm(`确定要删除版本 "${version.name}" 吗？`)) {
    mindmapVersionService.deleteVersion(props.mindMapId, version.id)
    loadVersions()
  }
}

// 获取变更数量
const getChangeCount = (version: MindMapVersion, type: string): number => {
  return version.changes.filter((c) => c.type === type).length
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 监听 mindMapId 变化
watch(
  () => props.mindMapId,
  () => {
    loadVersions()
  },
  { immediate: true },
)

onMounted(() => {
  loadVersions()
})

onUnmounted(() => {
  mindmapVersionService.stopAutoSave(props.mindMapId)
})
</script>

<style scoped lang="scss">
.mindmap-version-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  border-radius: 8px;
  overflow: hidden;

  .version-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--b3-border-color);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .version-actions {
      display: flex;
      gap: 8px;
    }
  }

  .version-stats {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-border-color);

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .stat-label {
        font-size: 11px;
        color: var(--b3-theme-on-surface-light);
      }

      .stat-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--b3-theme-primary);
      }
    }
  }

  .version-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--b3-theme-on-surface-light);
      text-align: center;

      .hint {
        font-size: 12px;
        margin-top: 8px;
        opacity: 0.7;
      }
    }

    .version-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--b3-theme-surface);
      }

      &.selected {
        background: var(--b3-theme-primary-light);
      }

      .version-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--b3-theme-surface);
        border-radius: 50%;
        color: var(--b3-theme-primary);
      }

      .version-info {
        flex: 1;
        min-width: 0;

        .version-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .version-meta {
          font-size: 12px;
          color: var(--b3-theme-on-surface-light);

          .version-time {
            margin-right: 8px;
          }

          .version-desc {
            opacity: 0.8;
          }
        }

        .version-changes {
          display: flex;
          gap: 4px;
          margin-top: 6px;

          .change-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;

            &.add {
              background: rgba(76, 175, 80, 0.15);
              color: #4caf50;
            }

            &.remove {
              background: rgba(244, 67, 54, 0.15);
              color: #f44336;
            }

            &.update {
              background: rgba(255, 152, 0, 0.15);
              color: #ff9800;
            }
          }
        }
      }

      .version-actions-item {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }

      &:hover .version-actions-item {
        opacity: 1;
      }
    }
  }

  .diff-panel {
    border-top: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface);

    .diff-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--b3-border-color);

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .diff-content {
      padding: 12px 16px;

      .diff-summary {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;

        .diff-item {
          font-size: 12px;
          font-weight: 500;

          &.add {
            color: #4caf50;
          }

          &.remove {
            color: #f44336;
          }

          &.update {
            color: #ff9800;
          }
        }
      }

      .diff-details {
        max-height: 200px;
        overflow-y: auto;

        .diff-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 12px;

          .diff-type {
            flex-shrink: 0;
            width: 48px;
            font-weight: 500;
          }

          .diff-path {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .diff-changes {
            color: var(--b3-theme-on-surface-light);
          }

          &.add {
            .diff-type {
              color: #4caf50;
            }
          }

          &.remove {
            .diff-type {
              color: #f44336;
            }
          }

          &.update {
            .diff-type {
              color: #ff9800;
            }
          }
        }
      }
    }
  }

  // 按钮样式
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: var(--b3-theme-primary);
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;

    &.active {
      background: var(--b3-theme-primary-light);
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-surface);
    }

    &.danger:hover {
      background: rgba(244, 67, 54, 0.15);
      color: #f44336;
    }
  }

  .btn-close {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    font-size: 18px;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--b3-theme-surface);
    }
  }
}
</style>
