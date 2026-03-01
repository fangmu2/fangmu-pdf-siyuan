<template>
  <div class="node-filter-panel" :class="{ 'is-open': showPanel }">
    <!-- 面板头部 -->
    <div class="filter-header">
      <h4 class="filter-title">{{ t('mindmap.filter.title') }}</h4>
      <button class="close-btn" @click="closePanel">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- 快速预设 -->
    <div class="quick-presets">
      <button
        v-for="preset in quickPresets"
        :key="preset.id"
        class="preset-btn"
        :class="{ 'is-active': isActivePreset(preset) }"
        @click="applyPreset(preset)"
      >
        <span class="preset-icon">{{ getPresetIcon(preset.icon) }}</span>
        <span class="preset-name">{{ t(preset.name) }}</span>
      </button>
    </div>

    <!-- 活动过滤条件 -->
    <div v-if="activeFilters.length > 0" class="active-filters">
      <div class="active-filters-title">{{ t('mindmap.filter.activeFilters') }}</div>
      <div class="filter-tags">
        <span
          v-for="(filter, index) in activeFilters"
          :key="index"
          class="filter-tag"
        >
          <span class="filter-tag-text">{{ formatFilter(filter) }}</span>
          <button class="remove-filter-btn" @click="removeFilter(index)">
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </span>
      </div>
      <button class="clear-all-btn" @click="clearAllFilters">
        {{ t('mindmap.filter.clearAll') }}
      </button>
    </div>

    <!-- 过滤条件添加 -->
    <div class="add-filter-section">
      <div class="add-filter-title">{{ t('mindmap.filter.addFilter') }}</div>

      <!-- 字段选择 -->
      <div class="filter-row">
        <label class="filter-label">{{ t('mindmap.filter.field') }}</label>
        <select v-model="newFilter.field" class="filter-select">
          <option value="tag">{{ t('mindmap.filter.fields.tag') }}</option>
          <option value="page">{{ t('mindmap.filter.fields.page') }}</option>
          <option value="color">{{ t('mindmap.filter.fields.color') }}</option>
          <option value="status">{{ t('mindmap.filter.fields.status') }}</option>
          <option value="annotation">{{ t('mindmap.filter.fields.annotation') }}</option>
        </select>
      </div>

      <!-- 操作符选择 -->
      <div class="filter-row">
        <label class="filter-label">{{ t('mindmap.filter.operator') }}</label>
        <select v-model="newFilter.operator" class="filter-select">
          <option v-for="op in availableOperators" :key="op.value" :value="op.value">
            {{ t(`mindmap.filter.operators.${op.value}`) }}
          </option>
        </select>
      </div>

      <!-- 值输入 -->
      <div class="filter-row">
        <label class="filter-label">{{ t('mindmap.filter.value') }}</label>

        <!-- 标签输入 -->
        <input
          v-if="newFilter.field === 'tag'"
          v-model="newFilter.value"
          type="text"
          class="filter-input"
          :placeholder="t('mindmap.filter.placeholder.tag')"
          list="tag-options"
        />
        <datalist v-if="newFilter.field === 'tag'" id="tag-options">
          <option v-for="tag in allTags" :key="tag" :value="tag" />
        </datalist>

        <!-- 页码输入 -->
        <input
          v-else-if="newFilter.field === 'page'"
          v-model.number="newFilter.value"
          type="number"
          class="filter-input"
          :placeholder="t('mindmap.filter.placeholder.page')"
        />

        <!-- 颜色选择 -->
        <div v-else-if="newFilter.field === 'color'" class="color-picker">
          <button
            v-for="color in availableColors"
            :key="color"
            class="color-btn"
            :class="{ 'is-selected': newFilter.value === color }"
            :style="{ backgroundColor: color }"
            @click="newFilter.value = color"
          />
        </div>

        <!-- 状态选择 -->
        <select v-else-if="newFilter.field === 'status'" v-model="newFilter.value" class="filter-select">
          <option value="new">{{ t('mindmap.filter.status.new') }}</option>
          <option value="learning">{{ t('mindmap.filter.status.learning') }}</option>
          <option value="reviewing">{{ t('mindmap.filter.status.reviewing') }}</option>
          <option value="mastered">{{ t('mindmap.filter.status.mastered') }}</option>
        </select>

        <!-- 标注布尔值 -->
        <select v-else-if="newFilter.field === 'annotation'" v-model="newFilter.value" class="filter-select">
          <option :value="true">{{ t('mindmap.filter.annotation.with') }}</option>
          <option :value="false">{{ t('mindmap.filter.annotation.without') }}</option>
        </select>
      </div>

      <!-- 添加按钮 -->
      <button class="add-filter-action-btn" @click="addFilterAction">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        {{ t('mindmap.filter.addFilterBtn') }}
      </button>
    </div>

    <!-- 统计信息 -->
    <div v-if="filterStats" class="filter-stats">
      <div class="stats-row">
        <span class="stats-label">{{ t('mindmap.filter.stats.total') }}</span>
        <span class="stats-value">{{ filterStats.totalNodes }}</span>
      </div>
      <div class="stats-row">
        <span class="stats-label">{{ t('mindmap.filter.stats.filtered') }}</span>
        <span class="stats-value">{{ filterStats.filteredNodes }}</span>
      </div>
      <div class="stats-row">
        <span class="stats-label">{{ t('mindmap.filter.stats.hidden') }}</span>
        <span class="stats-value">{{ filterStats.hiddenNodes }}</span>
      </div>
    </div>

    <!-- 标签云 -->
    <div class="tag-cloud-section">
      <div class="section-title">
        <span>{{ t('mindmap.filter.tags') }}</span>
        <span class="section-count">{{ tagStats.length }}</span>
      </div>
      <div class="tag-cloud">
        <button
          v-for="tagStat in tagStats.slice(0, 20)"
          :key="tagStat.tag"
          class="tag-cloud-item"
          @click="addTagFilter(tagStat.tag)"
        >
          <span class="tag-name">{{ tagStat.tag }}</span>
          <span class="tag-count">{{ tagStat.count }}</span>
        </button>
      </div>
    </div>

    <!-- 页码分布 -->
    <div class="page-distribution-section">
      <div class="section-title">
        <span>{{ t('mindmap.filter.pages') }}</span>
      </div>
      <div class="page-distribution">
        <button
          v-for="[page, count] in Object.entries(pageDistribution).sort((a, b) => Number(a[0]) - Number(b[0]))"
          :key="page"
          class="page-item"
          @click="addPageFilter(Number(page))"
        >
          <span class="page-num">P{{ page }}</span>
          <span class="page-count">{{ count }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMindMapSearch } from '@/composables/useMindMapSearch'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import type { MindMapFilter, QuickFilterPreset } from '@/types/mindMapSearch'

const props = defineProps<{
  nodes: FreeMindMapNode[]
  showPanel: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showPanel', value: boolean): void
  (e: 'filter-change', filters: MindMapFilter[]): void
}>()

const { t } = useI18n()

// 使用组合式函数
const {
  filters,
  filterStats,
  quickPresets,
  applyFilter,
  addFilter,
  removeFilter,
  clearFilter,
  applyQuickPreset,
  getNodeStats
} = useMindMapSearch(() => props.nodes)

// 新过滤条件
const newFilter = ref<MindMapFilter>({
  field: 'tag',
  value: '',
  operator: 'contains'
})

// 可用颜色
const availableColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
]

// 可用操作符
const availableOperators = ref([
  { value: 'equals', label: '=' },
  { value: 'notEquals', label: '≠' },
  { value: 'contains', label: '包含' },
  { value: 'notContains', label: '不包含' },
  { value: 'in', label: '在...中' },
  { value: 'notIn', label: '不在...中' }
])

// 计算属性
const activeFilters = computed(() => filters.value)

const allTags = computed(() => {
  const tags = new Set<string>()
  props.nodes.forEach(node => {
    node.data.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
})

const tagStats = computed(() => {
  const stats = getNodeStats()
  return stats.tagStats
})

const pageDistribution = computed(() => {
  const stats = getNodeStats()
  return stats.pageDistribution
})

// 检查是否是活动预设
function isActivePreset(preset: QuickFilterPreset): boolean {
  if (preset.filters.length === 0) {
    return filters.value.length === 0
  }
  if (filters.value.length !== preset.filters.length) {
    return false
  }
  return preset.filters.every((f, i) =>
    f.field === filters.value[i]?.field &&
    f.value === filters.value[i]?.value &&
    f.operator === filters.value[i]?.operator
  )
}

// 获取预设图标
function getPresetIcon(icon: string): string {
  const icons: Record<string, string> = {
    'all': '⊞',
    'annotation': '📝',
    'tag': '🏷️',
    'page': '📄'
  }
  return icons[icon] || '📋'
}

// 应用预设
function applyPreset(preset: QuickFilterPreset) {
  applyQuickPreset(preset)
  emit('filter-change', filters.value)
}

// 添加过滤条件
function addFilterAction() {
  if (!newFilter.value && newFilter.field !== 'annotation') {
    return
  }
  addFilter({ ...newFilter.value })
  emit('filter-change', filters.value)

  // 重置值
  newFilter.value = newFilter.field === 'annotation' ? true : ''
}

// 移除过滤条件
function removeFilterAction(index: number) {
  removeFilter(index)
  emit('filter-change', filters.value)
}

// 清除所有
function clearAllFilters() {
  clearFilter()
  emit('filter-change', [])
}

// 添加标签过滤
function addTagFilter(tag: string) {
  newFilter.value = { field: 'tag', value: tag, operator: 'contains' }
  addFilter({ field: 'tag', value: tag, operator: 'contains' })
  emit('filter-change', filters.value)
}

// 添加页码过滤
function addPageFilter(page: number) {
  newFilter.value = { field: 'page', value: page, operator: 'equals' }
  addFilter({ field: 'page', value: page, operator: 'equals' })
  emit('filter-change', filters.value)
}

// 格式化过滤条件显示
function formatFilter(filter: MindMapFilter): string {
  const fieldMap: Record<string, string> = {
    'tag': t('mindmap.filter.fields.tag'),
    'page': t('mindmap.filter.fields.page'),
    'color': t('mindmap.filter.fields.color'),
    'status': t('mindmap.filter.fields.status'),
    'annotation': t('mindmap.filter.fields.annotation')
  }

  const operatorMap: Record<string, string> = {
    'equals': '=',
    'notEquals': '≠',
    'contains': t('mindmap.filter.operators.contains'),
    'notContains': t('mindmap.filter.operators.notContains'),
    'in': t('mindmap.filter.operators.in'),
    'notIn': t('mindmap.filter.operators.notIn')
  }

  let valueStr = String(filter.value)
  if (filter.field === 'annotation') {
    valueStr = filter.value ? t('mindmap.filter.annotation.with') : t('mindmap.filter.annotation.without')
  }

  return `${fieldMap[filter.field]} ${operatorMap[filter.operator]} ${valueStr}`
}

// 关闭面板
function closePanel() {
  emit('update:showPanel', false)
}

// 监听节点变化
watch(() => props.nodes, () => {
  if (filters.value.length > 0) {
    applyFilter(filters.value)
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.node-filter-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 280px;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--siyuan-block-bg);
  border: 1px solid var(--siyuan-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 12px;

  &.is-open {
    display: block;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .filter-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--siyuan-text);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--siyuan-text-secondary);
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background: var(--siyuan-hover-bg);
    }
  }
}

.quick-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--siyuan-border);
  background: transparent;
  color: var(--siyuan-text-secondary);
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-hover-bg);
  }

  &.is-active {
    background: var(--siyuan-primary-light);
    border-color: var(--siyuan-primary);
    color: var(--siyuan-primary);
  }

  .preset-icon {
    font-size: 14px;
  }
}

.active-filters {
  margin-bottom: 12px;
  padding: 8px;
  background: var(--siyuan-hover-bg);
  border-radius: 6px;
}

.active-filters-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-text-secondary);
  margin-bottom: 8px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--siyuan-primary-light);
  color: var(--siyuan-primary);
  font-size: 12px;
  border-radius: 12px;

  .filter-tag-text {
    white-space: nowrap;
  }

  .remove-filter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: none;
    background: transparent;
    color: var(--siyuan-primary);
    cursor: pointer;
    border-radius: 50%;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}

.clear-all-btn {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--siyuan-border);
  background: transparent;
  color: var(--siyuan-text-secondary);
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-hover-bg);
  }
}

.add-filter-section {
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid var(--siyuan-border);
  border-radius: 6px;
}

.add-filter-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-text);
  margin-bottom: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .filter-label {
    font-size: 12px;
    color: var(--siyuan-text-secondary);
    min-width: 50px;
  }

  .filter-select {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--siyuan-border);
    background: var(--siyuan-input-bg);
    color: var(--siyuan-text);
    font-size: 12px;
    border-radius: 4px;
    outline: none;

    &:focus {
      border-color: var(--siyuan-primary);
    }
  }

  .filter-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--siyuan-border);
    background: var(--siyuan-input-bg);
    color: var(--siyuan-text);
    font-size: 12px;
    border-radius: 4px;
    outline: none;

    &:focus {
      border-color: var(--siyuan-primary);
    }
  }
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.color-btn {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }

  &.is-selected {
    border-color: var(--siyuan-text);
    box-shadow: 0 0 0 2px var(--siyuan-primary-light);
  }
}

.add-filter-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--siyuan-border);
  background: var(--siyuan-primary);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-primary-hover);
  }
}

.filter-stats {
  padding: 8px;
  background: var(--siyuan-hover-bg);
  border-radius: 6px;
  margin-bottom: 12px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--siyuan-text-secondary);
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  .stats-value {
    font-weight: 600;
    color: var(--siyuan-text);
  }
}

.tag-cloud-section,
.page-distribution-section {
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--siyuan-text-secondary);
  margin-bottom: 8px;

  .section-count {
    font-size: 11px;
    padding: 1px 6px;
    background: var(--siyuan-border);
    border-radius: 10px;
  }
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-cloud-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--siyuan-hover-bg);
  color: var(--siyuan-text);
  font-size: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-primary-light);
    color: var(--siyuan-primary);
  }

  .tag-count {
    font-size: 11px;
    opacity: 0.7;
  }
}

.page-distribution {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.page-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--siyuan-hover-bg);
  color: var(--siyuan-text);
  font-size: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: var(--siyuan-primary-light);
    color: var(--siyuan-primary);
  }

  .page-num {
    font-weight: 500;
  }

  .page-count {
    font-size: 11px;
    opacity: 0.7;
  }
}
</style>
