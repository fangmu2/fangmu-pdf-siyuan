<template>
  <div class="study-set-manager">
    <!-- 学习集列表 -->
    <div class="study-set-manager__header">
      <h3 class="study-set-manager__title">学习集</h3>
      <button class="study-set-manager__create-btn" @click="showCreateDialog = true">
        <span class="icon">+</span>
        新建学习集
      </button>
    </div>

    <!-- 学习集列表 -->
    <div class="study-set-manager__list">
      <div
        v-for="set in learningSets"
        :key="set.id"
        :class="['study-set-manager__item', { active: currentSetId === set.id }]"
        @click="selectSet(set.id)"
      >
        <div class="study-set-manager__item-main">
          <div class="study-set-manager__item-name">{{ set.name }}</div>
          <div class="study-set-manager__item-desc">{{ set.description || '暂无描述' }}</div>
        </div>
        <div class="study-set-manager__item-meta">
          <span class="study-set-manager__item-count">
            {{ set.cardCount }} 张卡片
          </span>
          <span class="study-set-manager__item-due" :class="{ 'is-due': set.dueToday > 0 }">
            {{ set.dueToday }} 到期
          </span>
        </div>
        <div class="study-set-manager__item-actions">
          <button class="study-set-manager__action-btn" @click.stop="editSet(set)" title="编辑">
            ✏️
          </button>
          <button class="study-set-manager__action-btn study-set-manager__action-btn--danger" @click.stop="deleteSet(set.id)" title="删除">
            🗑️
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="learningSets.length === 0" class="study-set-manager__empty">
        <div class="study-set-manager__empty-icon">📚</div>
        <div class="study-set-manager__empty-text">暂无学习集</div>
        <div class="study-set-manager__empty-hint">点击"新建学习集"开始学习</div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <div v-if="showCreateDialog || showEditDialog" class="study-set-dialog-overlay" @click="closeDialogs">
      <div class="study-set-dialog" @click.stop>
        <div class="study-set-dialog__header">
          <h4 class="study-set-dialog__title">{{ isEditing ? '编辑学习集' : '创建学习集' }}</h4>
          <button class="study-set-dialog__close" @click="closeDialogs">×</button>
        </div>

        <div class="study-set-dialog__body">
          <div class="study-set-dialog__field">
            <label class="study-set-dialog__label">名称 <span class="required">*</span></label>
            <input
              v-model="form.name"
              class="study-set-dialog__input"
              placeholder="输入学习集名称"
              :class="{ 'is-error': errors.name }"
            />
            <div v-if="errors.name" class="study-set-dialog__error">{{ errors.name }}</div>
          </div>

          <div class="study-set-dialog__field">
            <label class="study-set-dialog__label">描述</label>
            <textarea
              v-model="form.description"
              class="study-set-dialog__textarea"
              placeholder="输入学习集描述（可选）"
              rows="3"
            ></textarea>
          </div>

          <div class="study-set-dialog__field">
            <label class="study-set-dialog__label">选择笔记本</label>
            <select v-model="form.notebookId" class="study-set-dialog__select">
              <option v-for="nb in notebooks" :key="nb.id" :value="nb.id">
                {{ nb.name }}
              </option>
            </select>
          </div>

          <div class="study-set-dialog__field">
            <label class="study-set-dialog__label">复习设置</label>
            <div class="study-set-dialog__row">
              <div class="study-set-dialog__field study-set-dialog__field--half">
                <label class="study-set-dialog__label-sm">每日新卡数</label>
                <input
                  v-model.number="form.reviewSettings.dailyNewCards"
                  type="number"
                  min="1"
                  max="100"
                  class="study-set-dialog__input study-set-dialog__input--sm"
                />
              </div>
              <div class="study-set-dialog__field study-set-dialog__field--half">
                <label class="study-set-dialog__label-sm">复习算法</label>
                <select v-model="form.reviewSettings.algorithm" class="study-set-dialog__select study-set-dialog__select--sm">
                  <option value="SM2">SM-2</option>
                  <option value="FSRS">FSRS</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 创建模式：选择 PDF -->
          <div v-if="!isEditing" class="study-set-dialog__field">
            <label class="study-set-dialog__label">关联 PDF（可选）</label>
            <select v-model="form.initialPdfPath" class="study-set-dialog__select">
              <option value="">暂不关联</option>
              <option v-for="pdf in availablePdfs" :key="pdf.path" :value="pdf.path">
                {{ pdf.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="study-set-dialog__footer">
          <button class="study-set-dialog__btn" @click="closeDialogs">取消</button>
          <button class="study-set-dialog__btn study-set-dialog__btn--primary" @click="handleSubmit">
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { postApi } from '../api/siyuanApi';
import { useLearningSetStore } from '../stores/learningSetStore';
import type { StudySet, ReviewSettings } from '../types/studySet';

const learningSetStore = useLearningSetStore();

// 状态
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingSetId = ref<string | null>(null);
const notebooks = ref<any[]>([]);
const availablePdfs = ref<any[]>([]);

// 表单数据
const form = ref({
  name: '',
  description: '',
  notebookId: '',
  reviewSettings: {
    dailyNewCards: 20,
    algorithm: 'SM2' as ReviewSettings['algorithm'],
  } as ReviewSettings,
  initialPdfPath: '',
});

// 错误信息
const errors = ref<Record<string, string>>({});

// 计算属性
const learningSets = computed(() => learningSetStore.learningSets);
const currentSetId = computed(() => learningSetStore.currentSetId);
const isEditing = computed(() => showEditDialog.value);

// 加载数据
onMounted(async () => {
  await loadNotebooks();
  await loadAvailablePdfs();
  await learningSetStore.loadLearningSets();
});

// 加载笔记本列表
async function loadNotebooks() {
  try {
    const result = await postApi<any>('/api/notebook/lsNotebooks', {});
    if (Array.isArray(result)) {
      notebooks.value = result.map((nb: any) => ({
        id: nb.id || nb.box || nb.uuid,
        name: nb.name,
      }));
    } else if (result && Array.isArray(result.notebooks)) {
      notebooks.value = result.notebooks.map((nb: any) => ({
        id: nb.id || nb.box || nb.uuid,
        name: nb.name,
      }));
    } else if (result && Array.isArray(result.data)) {
      notebooks.value = result.data.map((nb: any) => ({
        id: nb.id || nb.box || nb.uuid,
        name: nb.name,
      }));
    }

    // 默认选择第一个笔记本
    if (notebooks.value.length > 0 && !form.value.notebookId) {
      form.value.notebookId = notebooks.value[0].id;
    }
  } catch (error) {
    console.error('加载笔记本列表失败:', error);
  }
}

// 加载可用 PDF 列表
async function loadAvailablePdfs() {
  try {
    const result = await postApi<any>('/api/filetree/readDir', {
      path: '/data/assets',
    });
    if (Array.isArray(result)) {
      availablePdfs.value = result
        .filter((f: any) => !f.isDir && f.name.toLowerCase().endsWith('.pdf'))
        .map((f: any) => ({
          path: `/data/assets/${f.name}`,
          name: f.name,
        }));
    }
  } catch (error) {
    console.error('加载 PDF 列表失败:', error);
  }
}

// 选择学习集
function selectSet(setId: string) {
  learningSetStore.setCurrentSet(setId);
}

// 编辑学习集
function editSet(set: StudySet) {
  editingSetId.value = set.id;
  form.value = {
    name: set.name,
    description: set.description || '',
    notebookId: set.notebookId,
    reviewSettings: { ...set.reviewSettings },
    initialPdfPath: '',
  };
  showEditDialog.value = true;
}

// 删除学习集
async function deleteSet(setId: string) {
  if (!confirm('确定要删除这个学习集吗？删除后无法恢复。')) {
    return;
  }
  await learningSetStore.deleteLearningSet(setId);
}

// 关闭对话框
function closeDialogs() {
  showCreateDialog.value = false;
  showEditDialog.value = false;
  editingSetId.value = null;
  resetForm();
}

// 重置表单
function resetForm() {
  form.value = {
    name: '',
    description: '',
    notebookId: notebooks.value[0]?.id || '',
    reviewSettings: {
      dailyNewCards: 20,
      algorithm: 'SM2',
    },
    initialPdfPath: '',
  };
  errors.value = {};
}

// 提交表单
async function handleSubmit() {
  errors.value = {};

  // 验证
  if (!form.value.name.trim()) {
    errors.value.name = '请输入学习集名称';
    return;
  }

  try {
    if (isEditing.value && editingSetId.value) {
      // 更新学习集
      await learningSetStore.updateLearningSet(editingSetId.value, {
        name: form.value.name,
        description: form.value.description,
        reviewSettings: form.value.reviewSettings,
      });
    } else {
      // 创建学习集
      await learningSetStore.createLearningSet(
        form.value.name,
        form.value.description,
        form.value.notebookId,
        form.value.reviewSettings,
        form.value.initialPdfPath || undefined
      );
    }

    closeDialogs();
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败，请重试');
  }
}
</script>

<style scoped lang="scss">
.study-set-manager {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__create-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary-light);
    }

    .icon {
      font-size: 16px;
      font-weight: bold;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--b3-theme-background-light);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;

    &:hover {
      background: var(--b3-theme-background-hover);
    }

    &.active {
      border-color: var(--b3-theme-primary);
      background: var(--b3-theme-primary-light);
    }

    &-main {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--b3-theme-color);
      margin-bottom: 4px;
    }

    &-desc {
      font-size: 12px;
      color: var(--b3-theme-color-light);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;

      .is-due {
        color: var(--b3-theme-error);
        font-weight: 500;
      }
    }

    &-count {
      color: var(--b3-theme-color-light);
    }

    &-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover &-actions {
      opacity: 1;
    }

    &-action-btn {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--b3-theme-background);
      }

      &--danger:hover {
        background: var(--b3-theme-error);
      }
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    text-align: center;

    &-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    &-text {
      font-size: 14px;
      color: var(--b3-theme-color);
      margin-bottom: 8px;
    }

    &-hint {
      font-size: 12px;
      color: var(--b3-theme-color-light);
    }
  }
}

// 对话框样式
.study-set-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.study-set-dialog {
  width: 100%;
  max-width: 480px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-theme-border);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__close {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-background-light);
    }
  }

  &__body {
    padding: 20px;
  }

  &__field {
    margin-bottom: 16px;

    &--half {
      flex: 1;
    }
  }

  &__row {
    display: flex;
    gap: 12px;
  }

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-color);
    margin-bottom: 8px;

    .required {
      color: var(--b3-theme-error);
    }
  }

  &__label-sm {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color);
    margin-bottom: 4px;
  }

  &__input,
  &__textarea,
  &__select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }

    &.is-error {
      border-color: var(--b3-theme-error);
    }

    &--sm {
      padding: 8px 10px;
      font-size: 13px;
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 80px;
  }

  &__select {
    cursor: pointer;
  }

  &__error {
    margin-top: 4px;
    font-size: 12px;
    color: var(--b3-theme-error);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-theme-border);
  }

  &__btn {
    padding: 10px 20px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 6px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-background-light);
    }

    &--primary {
      background: var(--b3-theme-primary);
      color: white;
      border-color: var(--b3-theme-primary);

      &:hover {
        background: var(--b3-theme-primary-light);
      }
    }
  }
}
</style>
