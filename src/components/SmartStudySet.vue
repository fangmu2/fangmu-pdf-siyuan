<!-- src/components/SmartStudySet.vue -->
<template>
  <div class="smart-study-set">
    <!-- 智能学习集头部 -->
    <div class="smart-header">
      <div class="header-left">
        <svg class="smart-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <div class="header-info">
          <h3 class="header-title">智能学习集</h3>
          <p class="header-desc">根据规则自动筛选和管理卡片</p>
        </div>
      </div>
      <button @click="showRuleEditor = true" class="add-rule-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        添加规则
      </button>
    </div>

    <!-- 规则列表 -->
    <div class="rules-section">
      <h4 class="section-title">筛选规则</h4>
      <div class="rules-list">
        <div v-if="rules.length === 0" class="empty-rules">
          <p>暂无规则，点击"添加规则"创建</p>
        </div>
        <div
          v-for="(rule, index) in rules"
          :key="rule.id"
          class="rule-item"
        >
          <div class="rule-content">
            <span class="rule-operator" v-if="index > 0">{{ rule.operator === 'and' ? '且' : '或' }}</span>
            <div class="rule-condition">
              <span class="rule-field">{{ getFieldLabel(rule.field) }}</span>
              <span class="rule-comparator">{{ getComparatorLabel(rule.comparator) }}</span>
              <span class="rule-value">{{ formatValue(rule.value) }}</span>
            </div>
          </div>
          <div class="rule-actions">
            <button @click="editRule(rule)" class="action-btn" title="编辑">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button @click="removeRule(rule)" class="action-btn delete" title="删除">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 匹配结果预览 -->
    <div class="preview-section">
      <h4 class="section-title">
        匹配预览
        <span class="match-count">{{ matchedCards.length }} 张卡片</span>
      </h4>
      <div class="preview-cards">
        <div v-if="matchedCards.length === 0" class="empty-preview">
          <p>没有卡片匹配当前规则</p>
        </div>
        <div
          v-for="card in matchedCards.slice(0, 10)"
          :key="card.id"
          class="preview-card"
        >
          <div class="preview-card-content">{{ truncateText(card.content, 50) }}</div>
          <div class="preview-card-meta">
            <span class="card-status" :class="card.status">{{ getStatusLabel(card.status) }}</span>
            <span class="card-date">{{ formatDate(card.createdAt) }}</span>
          </div>
        </div>
        <div v-if="matchedCards.length > 10" class="more-cards">
          还有 {{ matchedCards.length - 10 }} 张卡片...
        </div>
      </div>
    </div>

    <!-- 保存选项 -->
    <div class="save-section">
      <button @click="saveAsSmartSet" class="save-btn">
        保存为智能学习集
      </button>
      <button @click="addToExistingSet" class="add-to-set-btn">
        添加到现有学习集
      </button>
    </div>

    <!-- 规则编辑器对话框 -->
    <div v-if="showRuleEditor" class="dialog-overlay" @click="closeRuleEditor">
      <div class="dialog rule-editor" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingRule ? '编辑规则' : '添加规则' }}</h3>
          <button @click="closeRuleEditor" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <!-- 逻辑运算符 -->
          <div class="form-group" v-if="rules.length > 0 && !editingRule">
            <label>逻辑关系</label>
            <div class="operator-options">
              <label class="operator-option">
                <input type="radio" v-model="newRule.operator" value="and" />
                <span>且 (同时满足)</span>
              </label>
              <label class="operator-option">
                <input type="radio" v-model="newRule.operator" value="or" />
                <span>或 (满足任一)</span>
              </label>
            </div>
          </div>

          <!-- 字段选择 -->
          <div class="form-group">
            <label>筛选字段</label>
            <select v-model="newRule.field" class="form-select">
              <option value="status">卡片状态</option>
              <option value="type">卡片类型</option>
              <option value="createdAt">创建日期</option>
              <option value="updatedAt">更新日期</option>
              <option value="srs.nextReview">下次复习时间</option>
              <option value="srs.interval">复习间隔</option>
              <option value="srs.ease">难度系数</option>
              <option value="tags">标签</option>
              <option value="content">内容包含</option>
            </select>
          </div>

          <!-- 比较器选择 -->
          <div class="form-group">
            <label>比较方式</label>
            <select v-model="newRule.comparator" class="form-select">
              <option v-for="comp in availableComparators" :key="comp.value" :value="comp.value">
                {{ comp.label }}
              </option>
            </select>
          </div>

          <!-- 值输入 -->
          <div class="form-group">
            <label>值</label>
            <component
              :is="getValueInputType()"
              v-model="newRule.value"
              class="form-input"
              :placeholder="getValuePlaceholder()"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeRuleEditor" class="btn-cancel">取消</button>
          <button @click="saveRule" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Card, CardStatus, CardType } from '../types/card';
import type { FlashCard } from '../types/card';

interface Rule {
  id: string;
  field: string;
  comparator: string;
  value: any;
  operator?: 'and' | 'or';
}

interface Comparator {
  value: string;
  label: string;
  applicableFields: string[];
}

const props = defineProps<{
  cards: Card[];
  studySetId?: string;
}>();

const emit = defineEmits<{
  (e: 'save', rules: Rule[]): void;
  (e: 'add-to-set', rules: Rule[], studySetId: string): void;
}>();

// 状态
const rules = ref<Rule[]>([]);
const showRuleEditor = ref(false);
const editingRule = ref<Rule | null>(null);

const newRule = ref<Rule>({
  id: '',
  field: 'status',
  comparator: 'equals',
  value: '',
  operator: 'and',
});

// 比较器定义
const comparators: Comparator[] = [
  { value: 'equals', label: '等于', applicableFields: ['status', 'type'] },
  { value: 'not_equals', label: '不等于', applicableFields: ['status', 'type'] },
  { value: 'contains', label: '包含', applicableFields: ['content', 'tags'] },
  { value: 'not_contains', label: '不包含', applicableFields: ['content', 'tags'] },
  { value: 'greater_than', label: '大于', applicableFields: ['srs.interval', 'srs.ease', 'createdAt', 'updatedAt', 'srs.nextReview'] },
  { value: 'less_than', label: '小于', applicableFields: ['srs.interval', 'srs.ease', 'createdAt', 'updatedAt', 'srs.nextReview'] },
  { value: 'before', label: '早于', applicableFields: ['createdAt', 'updatedAt', 'srs.nextReview'] },
  { value: 'after', label: '晚于', applicableFields: ['createdAt', 'updatedAt', 'srs.nextReview'] },
  { value: 'is_empty', label: '为空', applicableFields: ['tags'] },
  { value: 'is_not_empty', label: '不为空', applicableFields: ['tags'] },
];

// 可用比较器
const availableComparators = computed(() => {
  return comparators.filter(c => c.applicableFields.includes(newRule.value.field));
});

// 匹配结果预览
const matchedCards = computed(() => {
  if (rules.value.length === 0) return [];

  return props.cards.filter(card => {
    return rules.value.every((rule, index) => {
      const matches = evaluateRule(card, rule);

      if (index === 0) return matches;

      if (rule.operator === 'and') {
        return matches;
      } else {
        return matches;
      }
    });
  });
});

// 评估规则
const evaluateRule = (card: Card, rule: Rule): boolean => {
  const value = getFieldValue(card, rule.field);

  switch (rule.comparator) {
    case 'equals':
      return value === rule.value;
    case 'not_equals':
      return value !== rule.value;
    case 'contains':
      return String(value).includes(String(rule.value));
    case 'not_contains':
      return !String(value).includes(String(rule.value));
    case 'greater_than':
      return Number(value) > Number(rule.value);
    case 'less_than':
      return Number(value) < Number(rule.value);
    case 'before':
      return new Date(value) < new Date(rule.value);
    case 'after':
      return new Date(value) > new Date(rule.value);
    case 'is_empty':
      return !value || (Array.isArray(value) && value.length === 0);
    case 'is_not_empty':
      return !!value && (!Array.isArray(value) || value.length > 0);
    default:
      return false;
  }
};

// 获取字段值
const getFieldValue = (card: Card, field: string): any => {
  const parts = field.split('.');
  let value: any = card;

  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  return value;
};

// 字段标签
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    'status': '状态',
    'type': '类型',
    'createdAt': '创建日期',
    'updatedAt': '更新日期',
    'srs.nextReview': '下次复习',
    'srs.interval': '复习间隔',
    'srs.ease': '难度系数',
    'tags': '标签',
    'content': '内容',
  };
  return labels[field] || field;
};

// 比较器标签
const getComparatorLabel = (comparator: string): string => {
  const comp = comparators.find(c => c.value === comparator);
  return comp?.label || comparator;
};

// 格式化值
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toLocaleDateString('zh-CN');
  return JSON.stringify(value);
};

// 状态标签
const getStatusLabel = (status: CardStatus): string => {
  const labels: Record<CardStatus, string> = {
    'new': '新学',
    'learning': '学习',
    'review': '复习',
    'mastered': '已掌握',
  };
  return labels[status] || status;
};

// 获取值输入类型
const getValueInputType = (): string => {
  const field = newRule.value.field;
  if (['createdAt', 'updatedAt', 'srs.nextReview'].includes(field)) {
    return 'input type="date"';
  }
  if (['status', 'type'].includes(field)) {
    return 'select';
  }
  return 'input';
};

// 获取值占位符
const getValuePlaceholder = (): string => {
  const field = newRule.value.field;
  if (field === 'status') return '选择状态...';
  if (field === 'type') return '选择类型...';
  if (['createdAt', 'updatedAt', 'srs.nextReview'].includes(field)) return '选择日期...';
  return '输入值...';
};

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

// 编辑规则
const editRule = (rule: Rule) => {
  editingRule.value = rule;
  newRule.value = { ...rule };
  showRuleEditor.value = true;
};

// 移除规则
const removeRule = (rule: Rule) => {
  const index = rules.value.findIndex(r => r.id === rule.id);
  if (index >= 0) {
    rules.value.splice(index, 1);
  }
};

// 关闭规则编辑器
const closeRuleEditor = () => {
  showRuleEditor.value = false;
  editingRule.value = null;
  newRule.value = {
    id: '',
    field: 'status',
    comparator: 'equals',
    value: '',
    operator: 'and',
  };
};

// 保存规则
const saveRule = () => {
  if (!newRule.value.value && newRule.value.comparator !== 'is_empty' && newRule.value.comparator !== 'is_not_empty') {
    alert('请输入值');
    return;
  }

  if (editingRule.value) {
    const index = rules.value.findIndex(r => r.id === editingRule.value?.id);
    if (index >= 0) {
      rules.value[index] = { ...newRule.value, id: editingRule.value.id };
    }
  } else {
    rules.value.push({
      ...newRule.value,
      id: `rule_${Date.now()}`,
    });
  }

  closeRuleEditor();
};

// 保存为智能学习集
const saveAsSmartSet = () => {
  if (rules.value.length === 0) {
    alert('请至少添加一条规则');
    return;
  }
  emit('save', rules.value);
};

// 添加到现有学习集
const addToExistingSet = () => {
  if (rules.value.length === 0) {
    alert('请至少添加一条规则');
    return;
  }
  // TODO: 显示学习集选择器
  emit('add-to-set', rules.value, props.studySetId || '');
};
</script>

<style scoped>
.smart-study-set {
  padding: 16px;
  background: var(--b3-theme-background);
}

/* 头部样式 */
.smart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.smart-icon {
  color: var(--b3-theme-primary);
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.header-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.add-rule-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-rule-btn:hover {
  opacity: 0.9;
}

/* 规则列表 */
.rules-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--b3-theme-primary);
}

.rules-list {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  padding: 8px;
}

.empty-rules {
  padding: 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
  font-size: 13px;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-bottom: 8px;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.rule-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-operator {
  font-size: 12px;
  font-weight: 500;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.rule-condition {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.rule-field {
  color: var(--b3-theme-on-surface);
}

.rule-comparator {
  color: var(--b3-theme-on-surface-light);
}

.rule-value {
  color: var(--b3-theme-primary);
  font-weight: 500;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.rule-item:hover .rule-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--b3-theme-surface-hover);
}

.action-btn.delete:hover {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

/* 预览区域 */
.preview-section {
  margin-bottom: 20px;
}

.preview-cards {
  background: var(--b3-theme-surface);
  border-radius: 8px;
  padding: 8px;
}

.empty-preview {
  padding: 24px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
  font-size: 13px;
}

.preview-card {
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 6px;
  margin-bottom: 8px;
}

.preview-card:last-child {
  margin-bottom: 0;
}

.preview-card-content {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  margin-bottom: 8px;
  line-height: 1.5;
}

.preview-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--b3-theme-surface-hover);
}

.card-status.new {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.card-status.learning {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

.card-status.review {
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
}

.card-status.mastered {
  background: rgba(158, 158, 158, 0.15);
  color: #9E9E9E;
}

.card-date {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  margin-left: auto;
}

.more-cards {
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

/* 保存选项 */
.save-section {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--b3-border-color);
}

.save-btn {
  flex: 1;
  padding: 10px 20px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.save-btn:hover {
  opacity: 0.9;
}

.add-to-set-btn {
  flex: 1;
  padding: 10px 20px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-to-set-btn:hover {
  background: var(--b3-theme-surface-hover);
}

/* 对话框样式 */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b3-border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--b3-theme-surface);
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  background: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  font-size: 14px;
  font-family: inherit;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--b3-theme-primary);
}

.operator-options {
  display: flex;
  gap: 16px;
}

.operator-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--b3-border-color);
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

.btn-cancel:hover {
  background: var(--b3-theme-surface);
}

.btn-confirm {
  background: var(--b3-theme-primary);
  border: 1px solid var(--b3-theme-primary);
  color: white;
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
