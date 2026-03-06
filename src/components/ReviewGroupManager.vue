<template>
  <div class="review-group-manager">
    <div class="group-header">
      <h3 class="group-title">
        复习分组
      </h3>
      <button
        class="btn-add"
        @click="showCreateDialog = true"
      >
        <span>+</span> 新建分组
      </button>
    </div>

    <div class="group-list">
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-item"
        :class="[{
          active: selectedGroupId === group.id, disabled: !group.enabled,
        }]"
        @click="selectGroup(group.id)"
      >
        <div class="group-info">
          <div class="group-name">
            {{ group.name }}
          </div>
          <div class="group-meta">
            <span class="group-card-count">{{ group.cardIds.length }} 张卡片</span>
            <span
              class="group-status"
              :class="{ enabled: group.enabled }"
            >
              {{ group.enabled ? '启用' : '禁用' }}
            </span>
          </div>
        </div>
        <div class="group-actions">
          <button
            class="btn-action"
            title="启用/禁用"
            @click.stop="toggleGroup(group)"
          >
            {{ group.enabled ? '👁️' : '👁️‍🗨️' }}
          </button>
          <button
            class="btn-action"
            title="编辑"
            @click.stop="editGroup(group)"
          >
            ✏️
          </button>
          <button
            class="btn-action btn-delete"
            title="删除"
            @click.stop="deleteGroup(group)"
          >
            🗑️
          </button>
        </div>
      </div>

      <div
        v-if="groups.length === 0"
        class="empty-state"
      >
        <span class="empty-icon">📁</span>
        <p>暂无分组，点击"新建分组"创建</p>
      </div>
    </div>

    <!-- 创建/编辑分组对话框 -->
    <div
      v-if="showCreateDialog || showEditDialog"
      class="dialog-overlay"
      @click="closeDialogs"
    >
      <div
        class="dialog"
        @click.stop
      >
        <h3 class="dialog-title">
          {{ showCreateDialog ? '新建分组' : '编辑分组' }}
        </h3>

        <div class="form-group">
          <label>分组名称</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="输入分组名称"
            class="sy-input"
          />
        </div>

        <div class="form-group">
          <label>描述（可选）</label>
          <textarea
            v-model="formData.description"
            placeholder="输入分组描述"
            class="sy-textarea"
            rows="3"
          />
        </div>

        <div class="form-group">
          <label>选择学习集</label>
          <select
            v-model="formData.studySetId"
            class="sy-select"
          >
            <option value="">
              请选择学习集
            </option>
            <option
              v-for="set in studySets"
              :key="set.id"
              :value="set.id"
            >
              {{ set.name }}
            </option>
          </select>
        </div>

        <div
          v-if="formData.studySetId"
          class="form-group"
        >
          <label>选择卡片</label>
          <div class="card-selector">
            <div class="card-filter">
              <input
                v-model="cardFilter"
                type="text"
                placeholder="搜索卡片..."
                class="sy-input"
              />
            </div>
            <div class="card-list">
              <label
                v-for="card in filteredCards"
                :key="card.id"
                class="card-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="formData.cardIds.includes(card.id)"
                  @change="toggleCard(card.id)"
                />
                <span class="card-label">{{ truncateText(card.content, 50) }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button
            class="btn-cancel"
            @click="closeDialogs"
          >
            取消
          </button>
          <button
            class="btn-confirm"
            @click="saveGroup"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewGroup } from '../services/reviewEnhancedService'
import type { Card } from '../types/card'
import type { StudySet } from '../types/studySet'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { cardService } from '../services/cardService'
import { ReviewGroupService } from '../services/reviewEnhancedService'
import { studySetService } from '../services/studySetService'

const props = defineProps<{
  studySetId?: string
}>()

const emit = defineEmits<{
  (e: 'group-select', groupId: string | null): void
}>()

const groups = ref<ReviewGroup[]>([])
const studySets = ref<StudySet[]>([])
const availableCards = ref<Card[]>([])
const selectedGroupId = ref<string | null>(null)

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const cardFilter = ref('')

const formData = ref({
  id: '',
  name: '',
  description: '',
  studySetId: '',
  cardIds: [] as string[],
  enabled: true,
})

// 加载数据
onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  // 加载分组
  groups.value = ReviewGroupService.getAllGroups()

  // 加载学习集
  studySets.value = await studySetService.getAllStudySets()

  // 如果有指定的学习集 ID，加载该学习集的卡片
  if (props.studySetId) {
    availableCards.value = await cardService.getCardsByStudySet(props.studySetId)
  }
}

// 过滤后的卡片列表
const filteredCards = computed(() => {
  if (!cardFilter.value) return availableCards.value
  const filter = cardFilter.value.toLowerCase()
  return availableCards.value.filter((card) =>
    card.content?.toLowerCase().includes(filter),
  )
})

// 选择分组
const selectGroup = (groupId: string) => {
  selectedGroupId.value = groupId === selectedGroupId.value ? null : groupId
  emit('group-select', selectedGroupId.value)
}

// 切换分组状态
const toggleGroup = (group: ReviewGroup) => {
  ReviewGroupService.updateGroup(group.id, { enabled: !group.enabled })
  groups.value = ReviewGroupService.getAllGroups()
}

// 编辑分组
const editGroup = (group: ReviewGroup) => {
  formData.value = {
    id: group.id,
    name: group.name,
    description: group.description || '',
    studySetId: group.studySetId,
    cardIds: [...group.cardIds],
    enabled: group.enabled,
  }
  showEditDialog.value = true

  // 加载该学习集的卡片
  loadCardsForStudySet(group.studySetId)
}

// 删除分组
const deleteGroup = (group: ReviewGroup) => {
  if (confirm(`确定要删除分组"${group.name}"吗？`)) {
    ReviewGroupService.deleteGroup(group.id)
    groups.value = ReviewGroupService.getAllGroups()
    if (selectedGroupId.value === group.id) {
      selectedGroupId.value = null
      emit('group-select', null)
    }
  }
}

// 关闭对话框
const closeDialogs = () => {
  showCreateDialog.value = false
  showEditDialog.value = false
  resetFormData()
}

// 保存分组
const saveGroup = () => {
  if (!formData.value.name.trim()) {
    alert('请输入分组名称')
    return
  }

  if (!formData.value.studySetId) {
    alert('请选择学习集')
    return
  }

  if (showCreateDialog.value) {
    // 创建新分组
    ReviewGroupService.createGroup(
      formData.value.name,
      formData.value.studySetId,
      formData.value.cardIds,
      formData.value.description,
    )
  } else {
    // 更新分组
    ReviewGroupService.updateGroup(formData.value.id, {
      name: formData.value.name,
      description: formData.value.description,
      studySetId: formData.value.studySetId,
      cardIds: formData.value.cardIds,
    })
  }

  groups.value = ReviewGroupService.getAllGroups()
  closeDialogs()
}

// 切换卡片选择
const toggleCard = (cardId: string) => {
  const index = formData.value.cardIds.indexOf(cardId)
  if (index === -1) {
    formData.value.cardIds.push(cardId)
  } else {
    formData.value.cardIds.splice(index, 1)
  }
}

// 重置表单
const resetFormData = () => {
  formData.value = {
    id: '',
    name: '',
    description: '',
    studySetId: '',
    cardIds: [],
    enabled: true,
  }
}

// 加载学习集的卡片
const loadCardsForStudySet = async (studySetId: string) => {
  if (studySetId) {
    availableCards.value = await cardService.getCardsByStudySet(studySetId)
  } else {
    availableCards.value = []
  }
}

// 截断文本
const truncateText = (text: string, length: number): string => {
  if (!text) return ''
  if (text.length <= length) return text
  return `${text.substring(0, length)}...`
}

// 监听学习集变化
watch(() => props.studySetId, async (newVal) => {
  if (newVal) {
    availableCards.value = await cardService.getCardsByStudySet(newVal)
  }
})
</script>

<style scoped lang="scss">
.review-group-manager {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  border: 1px solid var(--b3-theme-primary);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-surface-light);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &.disabled {
    opacity: 0.6;
  }
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
  margin-bottom: 4px;
}

.group-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.group-status {
  &.enabled {
    color: var(--b3-theme-success);
  }
}

.group-actions {
  display: flex;
  gap: 4px;
}

.btn-action {
  padding: 4px 8px;
  font-size: 14px;
  background: transparent;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface);
    border-color: var(--b3-theme-primary);
  }

  &.btn-delete:hover {
    background: var(--b3-theme-error);
    border-color: var(--b3-theme-error);
    color: var(--b3-theme-on-error);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--b3-theme-on-surface-light);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--b3-theme-background);
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  margin: 0 0 20px;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-background);
    margin-bottom: 6px;
  }
}

.sy-input,
.sy-select,
.sy-textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--b3-theme-on-background);
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.card-selector {
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.card-filter {
  padding: 8px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.card-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.card-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface);
  }

  input[type="checkbox"] {
    cursor: pointer;
  }
}

.card-label {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-background);

  &:hover {
    background: var(--b3-theme-surface);
  }
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: var(--b3-theme-on-primary);

  &:hover {
    background: var(--b3-theme-primary-dark);
  }
}
</style>
