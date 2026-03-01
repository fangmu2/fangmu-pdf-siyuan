<!-- src/components/QuickCaptureMenu.vue - 快速捕获菜单组件 -->
<template>
  <div v-if="visible" class="quick-capture-menu" :style="positionStyle" @click.stop>
    <!-- 触发按钮 -->
    <button class="quick-capture-menu__trigger" @click="toggleMenu">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-4 4 4h-3v4h-2z"/>
      </svg>
    </button>

    <!-- 菜单面板 -->
    <transition name="slide-fade">
      <div v-if="menuOpen" class="quick-capture-menu__panel">
        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button
            v-for="action in quickActions"
            :key="action.id"
            :class="['quick-action', { active: action.active }]"
            @click="executeAction(action)"
            :title="action.tooltip"
          >
            <span class="quick-action__icon">{{ action.icon }}</span>
            <span class="quick-action__label">{{ action.label }}</span>
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 学习集选择 -->
        <div class="study-set-selector">
          <label class="selector-label">保存到</label>
          <select v-model="selectedStudySetId" class="selector-select">
            <option value="" disabled>选择学习集</option>
            <option
              v-for="studySet in studySets"
              :key="studySet.id"
              :value="studySet.id"
            >
              {{ studySet.name }}
            </option>
          </select>
          <button class="create-btn" @click="showCreateDialog = true" title="创建新学习集">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 卡片类型选择 -->
        <div class="card-type-selector">
          <label class="selector-label">卡片类型</label>
          <div class="type-options">
            <button
              :class="['type-option', { active: selectedCardType === 'normal' }]"
              @click="selectedCardType = 'normal'"
            >
              <span class="type-option__icon">📝</span>
              <span class="type-option__label">普通卡片</span>
            </button>
            <button
              :class="['type-option', { active: selectedCardType === 'flashcard' }]"
              @click="selectedCardType = 'flashcard'"
            >
              <span class="type-option__icon">🃏</span>
              <span class="type-option__label">闪卡</span>
            </button>
            <button
              :class="['type-option', { active: selectedCardType === 'excerpt' }]"
              @click="selectedCardType = 'excerpt'"
            >
              <span class="type-option__icon">📄</span>
              <span class="type-option__label">摘录卡片</span>
            </button>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 标签快速选择 -->
        <div class="quick-tags">
          <label class="selector-label">快速标签</label>
          <div class="tags-list">
            <span
              v-for="tag in recentTags"
              :key="tag"
              :class="['quick-tag', { selected: selectedTags.includes(tag) }]"
              @click="toggleTag(tag)"
            >
              #{{ tag }}
            </span>
            <input
              v-model="newTagInput"
              type="text"
              class="new-tag-input"
              placeholder="输入标签..."
              @keyup.enter="addNewTag"
            />
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="cancel-btn" @click="closeMenu">取消</button>
          <button class="confirm-btn" @click="confirmCapture">
            快速捕获
            <span class="confirm-btn__shortcut">⌘+Enter</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- 创建学习集对话框 -->
    <div v-if="showCreateDialog" class="create-dialog-overlay" @click="showCreateDialog = false">
      <div class="create-dialog" @click.stop>
        <h4 class="create-dialog__title">创建新学习集</h4>
        <div class="create-dialog__form">
          <div class="form-item">
            <label class="form-item__label">名称</label>
            <input
              v-model="newStudySetName"
              type="text"
              class="form-item__input"
              placeholder="输入学习集名称"
            />
          </div>
          <div class="form-item">
            <label class="form-item__label">描述</label>
            <textarea
              v-model="newStudySetDesc"
              class="form-item__textarea"
              placeholder="可选描述"
              rows="2"
            ></textarea>
          </div>
        </div>
        <div class="create-dialog__actions">
          <button class="cancel-btn" @click="showCreateDialog = false">取消</button>
          <button class="confirm-btn" @click="createStudySet">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { StudySet } from '../types/studySet';

interface Props {
  visible?: boolean;
  x?: number;
  y?: number;
  selectedText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  x: 0,
  y: 0,
  selectedText: '',
});

const emit = defineEmits<{
  (e: 'capture', data: {
    type: 'normal' | 'flashcard' | 'excerpt';
    content: string;
    studySetId: string;
    tags: string[];
  }): void;
  (e: 'close'): void;
}>();

// 状态
const menuOpen = ref(false);
const selectedStudySetId = ref('');
const selectedCardType = ref<'normal' | 'flashcard' | 'excerpt'>('normal');
const selectedTags = ref<string[]>([]);
const newTagInput = ref('');
const showCreateDialog = ref(false);
const newStudySetName = ref('');
const newStudySetDesc = ref('');

// 学习集列表
const studySets = ref<StudySet[]>([]);

// 最近使用的标签
const recentTags = ref<string[]>(['重要', '待复习', '难点', '公式', '概念']);

// 快捷操作
const quickActions = ref([
  { id: 'card', icon: '📝', label: '制卡', tooltip: '创建卡片', active: false },
  { id: 'tag', icon: '🏷️', label: '标签', tooltip: '添加标签', active: false },
  { id: 'link', icon: '🔗', label: '链接', tooltip: '创建链接', active: false },
  { id: 'note', icon: '📌', label: '备注', tooltip: '添加备注', active: false },
]);

// 计算属性
const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

// 方法
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
  emit('close');
}

function executeAction(action: typeof quickActions.value[0]) {
  // 执行快捷操作
  console.log('执行操作:', action);
}

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
}

function addNewTag() {
  const tag = newTagInput.value.trim();
  if (tag && !recentTags.value.includes(tag)) {
    recentTags.value.unshift(tag);
  }
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }
  newTagInput.value = '';
}

function confirmCapture() {
  if (!selectedStudySetId.value) {
    alert('请选择学习集');
    return;
  }

  emit('capture', {
    type: selectedCardType.value,
    content: props.selectedText || '',
    studySetId: selectedStudySetId.value,
    tags: selectedTags.value,
  });

  closeMenu();
}

function createStudySet() {
  if (!newStudySetName.value.trim()) {
    alert('请输入学习集名称');
    return;
  }

  const newStudySet: StudySet = {
    id: Date.now().toString(),
    name: newStudySetName.value,
    description: newStudySetDesc.value,
    cardCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  studySets.value.push(newStudySet);
  selectedStudySetId.value = newStudySet.id;
  showCreateDialog.value = false;
  newStudySetName.value = '';
  newStudySetDesc.value = '';
}

function loadStudySets() {
  // 从 localStorage 加载学习集
  const stored = localStorage.getItem('study-sets');
  if (stored) {
    try {
      studySets.value = JSON.parse(stored);
    } catch (e) {
      console.error('加载学习集失败:', e);
    }
  }
}

function loadTags() {
  // 从 localStorage 加载最近使用的标签
  const stored = localStorage.getItem('recent-tags');
  if (stored) {
    try {
      recentTags.value = JSON.parse(stored);
    } catch (e) {
      console.error('加载标签失败:', e);
    }
  }
}

function saveTags() {
  localStorage.setItem('recent-tags', JSON.stringify(recentTags.value));
}

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl + Enter 确认
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    if (menuOpen.value) {
      e.preventDefault();
      confirmCapture();
    }
  }
  // Escape 关闭
  if (e.key === 'Escape' && menuOpen.value) {
    e.preventDefault();
    closeMenu();
  }
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.quick-capture-menu')) {
    closeMenu();
  }
}

// 生命周期
onMounted(() => {
  loadStudySets();
  loadTags();
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.quick-capture-menu {
  position: fixed;
  z-index: 9999;

  &__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 50%;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-primary);
      border-color: var(--b3-theme-primary);
      color: white;
      transform: scale(1.1);
    }
  }

  &__panel {
    position: absolute;
    top: 44px;
    left: 0;
    width: 280px;
    padding: 12px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-theme-divider);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }

  &__icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 11px;
  }
}

.divider {
  height: 1px;
  margin: 12px 0;
  background: var(--b3-theme-divider);
}

.study-set-selector,
.card-type-selector,
.quick-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-color-light);
}

.selector-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.type-options {
  display: flex;
  gap: 8px;
}

.type-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }

  &__icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 11px;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-tag {
  padding: 4px 10px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 12px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    color: var(--b3-theme-primary);
  }

  &.selected {
    background: var(--b3-theme-primary);
    border-color: var(--b3-theme-primary);
    color: white;
  }
}

.new-tag-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px dashed var(--b3-theme-divider);
  border-radius: 12px;
  background: transparent;
  color: var(--b3-theme-color);
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--b3-theme-surface);
  color: var(--b3-theme-color);

  &:hover {
    background: var(--b3-theme-background);
  }
}

.confirm-btn {
  background: var(--b3-theme-primary);
  border-color: var(--b3-theme-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }

  &__shortcut {
    font-size: 11px;
    opacity: 0.8;
  }
}

.create-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.create-dialog {
  width: 320px;
  padding: 20px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0 0 16px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
  }

  &__input,
  &__textarea {
    padding: 10px 12px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 6px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-color);
    font-size: 13px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__textarea {
    resize: vertical;
  }
}
</style>
