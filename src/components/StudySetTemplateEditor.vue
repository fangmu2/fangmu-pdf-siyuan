<template>
  <div class="study-set-template-editor" v-if="visible">
    <!-- 遮罩层 -->
    <div class="overlay" @click="close"></div>

    <!-- 编辑器面板 -->
    <div class="editor-panel">
      <!-- 头部 -->
      <div class="panel-header">
        <h2>{{ isEdit ? '编辑模板' : '创建自定义模板' }}</h2>
        <button @click="close" class="close-btn" title="关闭">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="panel-content">
        <!-- 基本信息 -->
        <div class="section">
          <h3>基本信息</h3>
          <div class="form-grid">
            <div class="form-item">
              <label>模板名称</label>
              <input
                v-model="formData.name"
                type="text"
                class="input"
                placeholder="输入模板名称"
              />
            </div>
            <div class="form-item full-width">
              <label>模板描述</label>
              <textarea
                v-model="formData.description"
                class="textarea"
                placeholder="描述这个模板的用途"
                rows="2"
              ></textarea>
            </div>
            <div class="form-item">
              <label>图标</label>
              <input
                v-model="formData.icon"
                type="text"
                class="input"
                placeholder="📚"
              />
            </div>
            <div class="form-item">
              <label>颜色</label>
              <input
                v-model="formData.color"
                type="color"
                class="color-input"
              />
              <span class="color-preview" :style="{ backgroundColor: formData.color }"></span>
            </div>
            <div class="form-item">
              <label>模板类型</label>
              <select v-model="formData.type" class="select">
                <option value="custom">自定义</option>
                <option value="exam-review">考试复习</option>
                <option value="literature-study">文献研读</option>
                <option value="language-learning">语言学习</option>
                <option value="skill-mastery">技能掌握</option>
                <option value="project-research">项目研究</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 复习设置 -->
        <div class="section">
          <h3>复习设置</h3>
          <div class="form-grid">
            <div class="form-item">
              <label>每日新卡数量</label>
              <input
                v-model.number="formData.reviewSettings.newCardsPerDay"
                type="number"
                class="input"
                min="1"
                max="100"
              />
            </div>
            <div class="form-item">
              <label>每日复习上限</label>
              <input
                v-model.number="formData.reviewSettings.reviewLimit"
                type="number"
                class="input"
                min="10"
                max="1000"
              />
            </div>
            <div class="form-item">
              <label>
                <input
                  v-model="formData.reviewSettings.useFSRS"
                  type="checkbox"
                />
                使用 FSRS 算法
              </label>
            </div>
            <div v-if="formData.reviewSettings.useFSRS" class="form-item">
              <label>记忆保留率</label>
              <input
                v-model.number="formData.reviewSettings.fsrsParams.requestRetention"
                type="number"
                class="input"
                min="0.7"
                max="0.95"
                step="0.01"
              />
              <span class="hint">{{ (formData.reviewSettings.fsrsParams.requestRetention * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- 默认标签 -->
        <div class="section">
          <h3>默认标签</h3>
          <div class="tags-editor">
            <div class="tags-list">
              <span
                v-for="(tag, index) in formData.defaultTags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
                <button @click="removeTag(index)" class="tag-remove">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </span>
            </div>
            <div class="tag-input-container">
              <input
                v-model="newTag"
                @keyup.enter="addTag"
                type="text"
                class="input"
                placeholder="输入标签后按回车添加"
              />
              <button @click="addTag" class="add-btn">添加</button>
            </div>
          </div>
        </div>

        <!-- 预设卡片 -->
        <div class="section">
          <h3>
            预设卡片
            <button @click="addCard" class="add-section-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              添加卡片
            </button>
          </h3>
          <div class="cards-list">
            <div
              v-for="(card, index) in formData.cards"
              :key="index"
              class="card-item"
            >
              <div class="card-item-header">
                <div class="card-type-badge" :class="card.cardType">
                  {{ card.cardType === 'flashcard' ? '📇 闪卡' : '📝 普通卡片' }}
                </div>
                <div class="card-actions">
                  <button @click="moveCard(index, -1)" :disabled="index === 0" class="icon-btn" title="上移">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                    </svg>
                  </button>
                  <button @click="moveCard(index, 1)" :disabled="index === formData.cards.length - 1" class="icon-btn" title="下移">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                    </svg>
                  </button>
                  <button @click="removeCard(index)" class="icon-btn delete" title="删除">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="card-item-content">
                <input
                  v-model="card.title"
                  type="text"
                  class="input small"
                  placeholder="卡片标题"
                />
                <textarea
                  v-model="card.content"
                  class="textarea"
                  placeholder="卡片内容"
                  rows="2"
                ></textarea>
                <div v-if="card.cardType === 'flashcard'" class="flashcard-fields">
                  <input
                    v-model="card.front"
                    type="text"
                    class="input"
                    placeholder="正面内容"
                  />
                  <input
                    v-model="card.back"
                    type="text"
                    class="input"
                    placeholder="反面内容"
                  />
                </div>
                <div class="card-meta">
                  <select v-model="card.cardType" class="select small">
                    <option value="normal">普通卡片</option>
                    <option value="flashcard">闪卡</option>
                  </select>
                  <input
                    v-model.number="card.difficulty"
                    type="number"
                    class="input small"
                    placeholder="难度"
                    min="1"
                    max="5"
                  />
                  <span class="label">难度 (1-5)</span>
                </div>
              </div>
            </div>
            <div v-if="formData.cards.length === 0" class="empty-state">
              <p>暂无预设卡片，点击上方按钮添加</p>
            </div>
          </div>
        </div>

        <!-- 脑图结构 -->
        <div class="section">
          <h3>
            脑图结构
            <button @click="addMindMapNode" class="add-section-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              添加节点
            </button>
          </h3>
          <div class="mindmap-nodes">
            <div
              v-for="node in rootNodes"
              :key="node.id"
              class="node-tree"
            >
              <div class="node-item root">
                <div class="node-content">
                  <input
                    v-model="node.text"
                    type="text"
                    class="input small"
                    placeholder="节点文本"
                  />
                  <input
                    v-model="node.style.icon"
                    type="text"
                    class="input icon"
                    placeholder="📌"
                  />
                  <input
                    v-model="node.style.backgroundColor"
                    type="color"
                    class="color-input small"
                  />
                </div>
                <div class="node-actions">
                  <button @click="addChildNode(node.id)" class="icon-btn" title="添加子节点">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </button>
                  <button @click="removeNode(node.id)" class="icon-btn delete" title="删除">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="child-nodes">
                <div
                  v-for="child in getChildNodes(node.id)"
                  :key="child.id"
                  class="node-item child"
                >
                  <div class="node-content">
                    <input
                      v-model="child.text"
                      type="text"
                      class="input small"
                      placeholder="子节点文本"
                    />
                    <input
                      v-model="child.style.icon"
                      type="text"
                      class="input icon"
                      placeholder="📌"
                    />
                    <input
                      v-model="child.style.backgroundColor"
                      type="color"
                      class="color-input small"
                    />
                  </div>
                  <div class="node-actions">
                    <button @click="removeNode(child.id)" class="icon-btn delete" title="删除">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="formData.mindMapNodes.length === 0" class="empty-state">
              <p>暂无脑图节点，点击上方按钮添加</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="panel-footer">
        <button @click="close" class="cancel-btn">取消</button>
        <button @click="saveAsNew" class="save-btn" v-if="isEdit">另存为新模板</button>
        <button @click="save" class="save-btn primary">
          {{ isEdit ? '保存修改' : '创建模板' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { studySetTemplateService, type StudySetTemplate, type TemplateType } from '../services/studySetTemplateService';

const props = defineProps<{
  templateId?: string;
}>();

const emit = defineEmits<{
  (e: 'saved'): void;
  (e: 'close'): void;
}>();

// 可见性
const visible = ref(false);

// 是否编辑模式
const isEdit = computed(() => !!props.templateId);

// 新标签输入
const newTag = ref('');

// 表单数据
const formData = ref<StudySetTemplate>({
  id: '',
  name: '',
  description: '',
  type: 'custom',
  icon: '📋',
  color: '#4285f4',
  cards: [],
  mindMapNodes: [],
  reviewSettings: {
    newCardsPerDay: 20,
    reviewLimit: 200,
    useFSRS: true,
    fsrsParams: {
      requestRetention: 0.9,
      maximumInterval: 365
    }
  },
  defaultTags: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isBuiltIn: false
});

// 根节点
const rootNodes = computed(() => {
  return formData.value.mindMapNodes.filter(n => !n.parentId);
});

// 获取子节点
function getChildNodes(parentId: string) {
  return formData.value.mindMapNodes.filter(n => n.parentId === parentId);
}

// 打开
function open(templateId?: string) {
  if (templateId) {
    const template = studySetTemplateService.getTemplateById(templateId);
    if (template) {
      formData.value = JSON.parse(JSON.stringify(template));
    }
  } else {
    resetForm();
  }
  visible.value = true;
}

// 关闭
function close() {
  visible.value = false;
  emit('close');
}

// 重置表单
function resetForm() {
  formData.value = {
    id: '',
    name: '',
    description: '',
    type: 'custom',
    icon: '📋',
    color: '#4285f4',
    cards: [],
    mindMapNodes: [],
    reviewSettings: {
      newCardsPerDay: 20,
      reviewLimit: 200,
      useFSRS: true,
      fsrsParams: {
        requestRetention: 0.9,
        maximumInterval: 365
      }
    },
    defaultTags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: false
  };
}

// 添加标签
function addTag() {
  if (newTag.value.trim()) {
    formData.value.defaultTags.push(newTag.value.trim());
    newTag.value = '';
  }
}

// 删除标签
function removeTag(index: number) {
  formData.value.defaultTags.splice(index, 1);
}

// 添加卡片
function addCard() {
  formData.value.cards.push({
    title: '新卡片',
    content: '',
    cardType: 'normal',
    difficulty: 3,
    tags: []
  });
}

// 删除卡片
function removeCard(index: number) {
  formData.value.cards.splice(index, 1);
}

// 移动卡片
function moveCard(index: number, direction: number) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= formData.value.cards.length) return;

  const temp = formData.value.cards[index];
  formData.value.cards[index] = formData.value.cards[newIndex];
  formData.value.cards[newIndex] = temp;
}

// 添加脑图节点
function addMindMapNode() {
  formData.value.mindMapNodes.push({
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    text: '新节点',
    style: {
      backgroundColor: '#4285f4',
      color: '#fff',
      icon: '📌'
    }
  });
}

// 添加子节点
function addChildNode(parentId: string) {
  formData.value.mindMapNodes.push({
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    text: '子节点',
    parentId: parentId,
    style: {
      backgroundColor: '#34a853',
      color: '#fff',
      icon: ''
    }
  });
}

// 删除节点
function removeNode(id: string) {
  // 递归删除子节点
  const childIds = formData.value.mindMapNodes
    .filter(n => n.parentId === id)
    .map(n => n.id);

  childIds.forEach(childId => removeNode(childId));

  const index = formData.value.mindMapNodes.findIndex(n => n.id === id);
  if (index !== -1) {
    formData.value.mindMapNodes.splice(index, 1);
  }
}

// 保存
function save() {
  if (!formData.value.name.trim()) {
    alert('请输入模板名称');
    return;
  }

  try {
    if (isEdit.value && props.templateId) {
      studySetTemplateService.updateTemplate(props.templateId, {
        ...formData.value,
        updatedAt: Date.now()
      });
    } else {
      studySetTemplateService.saveTemplate({
        ...formData.value,
        isBuiltIn: false
      });
    }
    emit('saved');
    close();
  } catch (error) {
    console.error('保存模板失败:', error);
    alert('保存失败，请重试');
  }
}

// 另存为新模板
function saveAsNew() {
  formData.value.id = '';
  formData.value.name = formData.value.name + ' (副本)';
  save();
}

// 暴露方法
defineExpose({ open, close });
</script>

<style scoped lang="scss">
.study-set-template-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.editor-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-width: 95vw;
  max-height: 90vh;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

// 头部
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--b3-border-color);
  position: relative;

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--b3-theme-on-background);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

// 内容区域
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.section {
  margin-bottom: 24px;

  h3 {
    margin: 0 0 16px;
    font-size: 15px;
    color: var(--b3-theme-on-background);
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 表单
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-item {
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);

    input[type="checkbox"] {
      margin-right: 6px;
    }
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.input {
  width: 100%;
  height: 36px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  &.small {
    height: 32px;
    font-size: 13px;
  }
}

.textarea {
  width: 100%;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.select {
  width: 100%;
  height: 36px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);

  &.small {
    height: 32px;
    font-size: 13px;
  }
}

.color-input {
  width: 50px;
  height: 36px;
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;

  &.small {
    width: 40px;
    height: 32px;
  }
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
  border: 1px solid var(--b3-border-color);
}

.hint {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  margin-left: 8px;
}

// 标签编辑器
.tags-editor {
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--b3-theme-surface);
    border-radius: 12px;
    font-size: 13px;
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-border-color);

    .tag-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      color: var(--b3-theme-on-surface-light);
      cursor: pointer;
      border-radius: 50%;

      &:hover {
        background: var(--b3-theme-surface-hover);
        color: var(--b3-theme-on-background);
      }
    }
  }

  .tag-input-container {
    display: flex;
    gap: 8px;

    .input {
      flex: 1;
    }

    .add-btn {
      padding: 0 16px;
      border: 1px solid var(--b3-border-color);
      background: var(--b3-theme-surface);
      color: var(--b3-theme-on-background);
      border-radius: 6px;
      cursor: pointer;

      &:hover {
        background: var(--b3-theme-surface-hover);
      }
    }
  }
}

// 卡片列表
.cards-list {
  .card-item {
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    background: var(--b3-theme-surface);
  }

  .card-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .card-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;

    &.normal {
      background: #e3f2fd;
      color: #1976d2;
    }

    &.flashcard {
      background: #fff8e1;
      color: #f57f17;
    }
  }

  .card-actions {
    display: flex;
    gap: 4px;
  }

  .card-item-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .flashcard-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;

    .label {
      color: var(--b3-theme-on-surface-light);
    }
  }
}

// 脑图节点
.mindmap-nodes {
  .node-tree {
    margin-bottom: 12px;
  }

  .node-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    background: var(--b3-theme-surface);
    margin-bottom: 8px;

    &.root {
      border-color: var(--b3-theme-primary);
      background: var(--b3-theme-primary-light);
    }

    &.child {
      margin-left: 24px;
      border-color: var(--b3-border-color);
      background: var(--b3-theme-background);
    }
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .input {
      flex: 1;
    }

    .input.icon {
      width: 50px;
      text-align: center;
    }
  }

  .node-actions {
    display: flex;
    gap: 4px;
  }

  .child-nodes {
    margin-left: 24px;
  }
}

// 图标按钮
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.delete {
    color: #ea4335;

    &:hover {
      background: #ea4335;
      color: #fff;
    }
  }
}

// 添加按钮
.add-section-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px dashed var(--b3-border-color);
  background: transparent;
  color: var(--b3-theme-primary);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--b3-theme-on-surface-light);
  font-size: 14px;
}

// 底部操作栏
.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-background);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-surface-hover);
  }
}

.save-btn {
  padding: 10px 20px;
  border: 1px solid var(--b3-border-color);
  background: var(--b3-theme-primary);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--b3-theme-primary-dark);
  }

  &.primary {
    background: var(--b3-theme-primary);
  }
}
</style>
