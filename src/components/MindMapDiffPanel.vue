<!-- src/components/MindMapDiffPanel.vue -->
<template>
  <div class="mindmap-diff-panel">
    <!-- 头部 -->
    <div class="diff-panel-header">
      <div class="diff-title">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
        <span>版本对比</span>
      </div>
      <div class="diff-versions">
        <span class="version-tag v1">{{ version1?.name || '版本 1' }}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
        <span class="version-tag v2">{{ version2?.name || '版本 2' }}</span>
      </div>
      <button
        class="btn-close"
        @click="$emit('close')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>

    <!-- 统计摘要 -->
    <div class="diff-summary">
      <div class="summary-item added">
        <span class="summary-icon">+</span>
        <span class="summary-count">{{ diff?.stats.addedCount || 0 }}</span>
        <span class="summary-label">新增节点</span>
      </div>
      <div class="summary-item removed">
        <span class="summary-icon">−</span>
        <span class="summary-count">{{ diff?.stats.removedCount || 0 }}</span>
        <span class="summary-label">删除节点</span>
      </div>
      <div class="summary-item modified">
        <span class="summary-icon">~</span>
        <span class="summary-count">{{ diff?.stats.modifiedCount || 0 }}</span>
        <span class="summary-label">修改节点</span>
      </div>
      <div class="summary-item moved">
        <span class="summary-icon">→</span>
        <span class="summary-count">{{ diff?.stats.movedCount || 0 }}</span>
        <span class="summary-label">移动节点</span>
      </div>
    </div>

    <!-- 过滤标签 -->
    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="[{ active: activeFilter === 'all' }]"
        @click="activeFilter = 'all'"
      >
        全部
        <span class="count">({{ totalCount }})</span>
      </button>
      <button
        class="filter-tab added"
        :class="[{ active: activeFilter === 'added' }]"
        @click="activeFilter = 'added'"
      >
        新增
        <span class="count">({{ diff?.stats.addedCount || 0 }})</span>
      </button>
      <button
        class="filter-tab removed"
        :class="[{ active: activeFilter === 'removed' }]"
        @click="activeFilter = 'removed'"
      >
        删除
        <span class="count">({{ diff?.stats.removedCount || 0 }})</span>
      </button>
      <button
        class="filter-tab modified"
        :class="[{ active: activeFilter === 'modified' }]"
        @click="activeFilter = 'modified'"
      >
        修改
        <span class="count">({{ diff?.stats.modifiedCount || 0 }})</span>
      </button>
      <button
        class="filter-tab moved"
        :class="[{ active: activeFilter === 'moved' }]"
        @click="activeFilter = 'moved'"
      >
        移动
        <span class="count">({{ diff?.stats.movedCount || 0 }})</span>
      </button>
    </div>

    <!-- 变更列表 -->
    <div class="diff-list">
      <div
        v-if="filteredChanges.length === 0"
        class="empty-state"
      >
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="currentColor"
          opacity="0.3"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <p>没有差异</p>
        <p class="hint">
          两个版本完全相同
        </p>
      </div>

      <!-- 新增节点 -->
      <div
        v-for="item in filteredAdded"
        :key="`add-${item.nodeId}`"
        class="diff-item added"
        @click="$emit('select-node', item.nodeId)"
      >
        <div class="item-icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </div>
        <div class="item-content">
          <div class="item-title">
            {{ getNodeText(item.node) }}
          </div>
          <div class="item-path">
            {{ item.path.join(' > ') }}
          </div>
        </div>
        <span class="item-badge add">新增</span>
      </div>

      <!-- 删除节点 -->
      <div
        v-for="item in filteredRemoved"
        :key="`remove-${item.nodeId}`"
        class="diff-item removed"
      >
        <div class="item-icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </div>
        <div class="item-content">
          <div class="item-title deleted">
            {{ getNodeText(item.node) }}
          </div>
          <div class="item-path">
            {{ item.path.join(' > ') }}
          </div>
        </div>
        <span class="item-badge remove">删除</span>
      </div>

      <!-- 修改节点 -->
      <div
        v-for="item in filteredModified"
        :key="`modify-${item.nodeId}`"
        class="diff-item modified"
        @click="$emit('select-node', item.nodeId)"
      >
        <div class="item-icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </div>
        <div class="item-content">
          <div class="item-title">
            {{ getNodeText(item.newNode) }}
          </div>
          <div class="item-path">
            {{ item.path.join(' > ') }}
          </div>
          <div class="item-changes">
            <span
              v-for="change in item.changes"
              :key="change"
              class="change-tag"
            >
              {{ change }}
            </span>
          </div>
          <div
            v-if="showDetails"
            class="item-diff"
          >
            <div class="diff-old">
              <span class="label">旧值:</span>
              {{ getNodeText(item.oldNode) }}
            </div>
            <div class="diff-new">
              <span class="label">新值:</span>
              {{ getNodeText(item.newNode) }}
            </div>
          </div>
        </div>
        <span class="item-badge update">修改</span>
      </div>

      <!-- 移动节点 -->
      <div
        v-for="item in filteredMoved"
        :key="`move-${item.nodeId}`"
        class="diff-item moved"
        @click="$emit('select-node', item.nodeId)"
      >
        <div class="item-icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
          </svg>
        </div>
        <div class="item-content">
          <div class="item-title">
            {{ getNodeText(item.node) }}
          </div>
          <div class="item-path-change">
            <span class="old-path">{{ item.oldPath.join(' > ') }}</span>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
            <span class="new-path">{{ item.newPath.join(' > ') }}</span>
          </div>
        </div>
        <span class="item-badge move">移动</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="diff-actions">
      <button
        class="btn-secondary"
        @click="showDetails = !showDetails"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
        {{ showDetails ? '隐藏详情' : '显示详情' }}
      </button>
      <button
        class="btn-secondary"
        @click="exportDiff"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
        导出报告
      </button>
      <button
        v-if="version2"
        class="btn-primary"
        @click="$emit('restore', version2)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        </svg>
        恢复到 {{ version2.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  MindMapVersion,
  VersionDiff,
} from '../services/mindmapVersionService'
import type { MindMapNode } from '../types/mindmap'
import {
  computed,
  ref,
} from 'vue'

interface Props {
  diff: VersionDiff | null
  version1: MindMapVersion | null
  version2: MindMapVersion | null
}

const props = defineProps<Props>()

defineEmits<Emits>()

interface Emits {
  (e: 'close'): void
  (e: 'select-node', nodeId: string): void
  (e: 'restore', version: MindMapVersion): void
  (e: 'export', diff: VersionDiff): void
}

// 状态
const activeFilter = ref<'all' | 'added' | 'removed' | 'modified' | 'moved'>('all')
const showDetails = ref(false)

// 计算属性
const totalCount = computed(() => {
  if (!props.diff) return 0
  return props.diff.stats.totalChanges
})

const filteredAdded = computed(() => {
  if (!props.diff) return []
  if (activeFilter.value !== 'all' && activeFilter.value !== 'added') return []
  return props.diff.added
})

const filteredRemoved = computed(() => {
  if (!props.diff) return []
  if (activeFilter.value !== 'all' && activeFilter.value !== 'removed') return []
  return props.diff.removed
})

const filteredModified = computed(() => {
  if (!props.diff) return []
  if (activeFilter.value !== 'all' && activeFilter.value !== 'modified') return []
  return props.diff.modified
})

const filteredMoved = computed(() => {
  if (!props.diff) return []
  if (activeFilter.value !== 'all' && activeFilter.value !== 'moved') return []
  return props.diff.moved
})

const filteredChanges = computed(() => {
  return [
    ...filteredAdded.value,
    ...filteredRemoved.value,
    ...filteredModified.value,
    ...filteredMoved.value,
  ]
})

// 方法
const getNodeText = (node: MindMapNode | null | undefined): string => {
  if (!node) return ''
  return node.title || node.text || '未命名节点'
}

const exportDiff = () => {
  if (props.diff) {
    // 生成报告
    const report = generateDiffReport(props.diff)
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mindmap-diff-${Date.now()}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

const generateDiffReport = (diff: VersionDiff): string => {
  const lines: string[] = [
    `# 脑图版本对比报告`,
    ``,
    `**版本 1:** ${diff.version1.name}`,
    `**版本 2:** ${diff.version2.name}`,
    ``,
    `## 统计摘要`,
    ``,
    `| 类型 | 数量 |`,
    `|------|------|`,
    `| 新增 | ${diff.stats.addedCount} |`,
    `| 删除 | ${diff.stats.removedCount} |`,
    `| 修改 | ${diff.stats.modifiedCount} |`,
    `| 移动 | ${diff.stats.movedCount} |`,
    `| **总计** | **${diff.stats.totalChanges}** |`,
    ``,
  ]

  if (diff.added.length > 0) {
    lines.push(`## 新增节点`, ``)
    for (const item of diff.added) {
      lines.push(`- ${item.path.join(' > ')}`)
    }
    lines.push(``)
  }

  if (diff.removed.length > 0) {
    lines.push(`## 删除节点`, ``)
    for (const item of diff.removed) {
      lines.push(`- ${item.path.join(' > ')}`)
    }
    lines.push(``)
  }

  if (diff.modified.length > 0) {
    lines.push(`## 修改节点`, ``)
    for (const item of diff.modified) {
      lines.push(`- ${item.path.join(' > ')}`)
      lines.push(`  - 变更: ${item.changes.join(', ')}`)
    }
    lines.push(``)
  }

  if (diff.moved.length > 0) {
    lines.push(`## 移动节点`, ``)
    for (const item of diff.moved) {
      lines.push(`- ${item.node.title || item.node.text || '未命名'}`)
      lines.push(`  - 从: ${item.oldPath.join(' > ')}`)
      lines.push(`  - 到: ${item.newPath.join(' > ')}`)
    }
    lines.push(``)
  }

  lines.push(`---`, `生成时间: ${new Date().toLocaleString('zh-CN')}`)

  return lines.join('\n')
}
</script>

<style scoped lang="scss">
.mindmap-diff-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  border-radius: 8px;
  overflow: hidden;

  .diff-panel-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid var(--b3-border-color);

    .diff-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--b3-theme-primary);
    }

    .diff-versions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .version-tag {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;

        &.v1 {
          background: rgba(33, 150, 243, 0.15);
          color: #2196f3;
        }

        &.v2 {
          background: rgba(156, 39, 176, 0.15);
          color: #9c27b0;
        }
      }
    }
  }

  .diff-summary {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-border-color);

    .summary-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      background: var(--b3-theme-background);

      .summary-icon {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .summary-count {
        font-size: 24px;
        font-weight: 600;
      }

      .summary-label {
        font-size: 12px;
        color: var(--b3-theme-on-surface-light);
      }

      &.added {
        .summary-icon,
        .summary-count {
          color: #4caf50;
        }
      }

      &.removed {
        .summary-icon,
        .summary-count {
          color: #f44336;
        }
      }

      &.modified {
        .summary-icon,
        .summary-count {
          color: #ff9800;
        }
      }

      &.moved {
        .summary-icon,
        .summary-count {
          color: #2196f3;
        }
      }
    }
  }

  .filter-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--b3-border-color);
    overflow-x: auto;

    .filter-tab {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border: 1px solid var(--b3-border-color);
      border-radius: 16px;
      background: transparent;
      color: var(--b3-theme-on-surface);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;

      .count {
        margin-left: 4px;
        opacity: 0.7;
      }

      &:hover {
        background: var(--b3-theme-surface);
      }

      &.active {
        background: var(--b3-theme-primary);
        border-color: var(--b3-theme-primary);
        color: white;
      }

      &.added.active {
        background: #4caf50;
        border-color: #4caf50;
      }

      &.removed.active {
        background: #f44336;
        border-color: #f44336;
      }

      &.modified.active {
        background: #ff9800;
        border-color: #ff9800;
      }

      &.moved.active {
        background: #2196f3;
        border-color: #2196f3;
      }
    }
  }

  .diff-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: var(--b3-theme-on-surface-light);
      text-align: center;

      .hint {
        font-size: 12px;
        margin-top: 8px;
        opacity: 0.7;
      }
    }

    .diff-item {
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

      .item-icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .item-content {
        flex: 1;
        min-width: 0;

        .item-title {
          font-weight: 500;
          margin-bottom: 4px;

          &.deleted {
            text-decoration: line-through;
            opacity: 0.6;
          }
        }

        .item-path {
          font-size: 11px;
          color: var(--b3-theme-on-surface-light);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-changes {
          display: flex;
          gap: 4px;
          margin-top: 6px;

          .change-tag {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            background: rgba(255, 152, 0, 0.15);
            color: #ff9800;
          }
        }

        .item-diff {
          margin-top: 8px;
          padding: 8px;
          border-radius: 6px;
          background: var(--b3-theme-surface);
          font-size: 12px;

          .diff-old,
          .diff-new {
            display: flex;
            gap: 8px;

            .label {
              color: var(--b3-theme-on-surface-light);
              white-space: nowrap;
            }
          }

          .diff-old {
            color: #f44336;
            text-decoration: line-through;
          }

          .diff-new {
            margin-top: 4px;
            color: #4caf50;
          }
        }

        .item-path-change {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 4px;

          .old-path {
            color: #f44336;
            text-decoration: line-through;
          }

          .new-path {
            color: #4caf50;
          }
        }
      }

      .item-badge {
        flex-shrink: 0;
        padding: 4px 8px;
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

        &.move {
          background: rgba(33, 150, 243, 0.15);
          color: #2196f3;
        }
      }

      &.added .item-icon {
        background: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }

      &.removed .item-icon {
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }

      &.modified .item-icon {
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }

      &.moved .item-icon {
        background: rgba(33, 150, 243, 0.15);
        color: #2196f3;
      }
    }
  }

  .diff-actions {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface);
  }

  // 按钮样式
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: var(--b3-theme-primary);
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-left: auto;

    &:hover {
      opacity: 0.9;
    }
  }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-on-surface);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-background);
    }
  }

  .btn-close {
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
    transition: background 0.15s;

    &:hover {
      background: var(--b3-theme-surface);
    }
  }
}
</style>
