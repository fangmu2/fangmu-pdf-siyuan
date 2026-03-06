<template>
  <div class="card-editor">
    <!-- 卡片类型切换 -->
    <div class="card-editor__header">
      <div class="card-editor__type-tabs">
        <button
          class="card-editor__tab"
          :class="[{ active: modelValue.type === 'card' }]"
          @click="switchType('card')"
        >
          普通卡片
        </button>
        <button
          class="card-editor__tab"
          :class="[{ active: modelValue.type === 'flashcard' }]"
          @click="switchType('flashcard')"
        >
          闪卡
        </button>
      </div>

      <div class="card-editor__actions">
        <button
          class="card-editor__action-btn"
          @click="handleSave"
        >
          保存
        </button>
        <button
          class="card-editor__action-btn card-editor__action-btn--danger"
          @click="handleDelete"
        >
          删除
        </button>
      </div>
    </div>

    <!-- 卡片内容编辑 -->
    <div class="card-editor__content">
      <!-- 来源信息 -->
      <div class="card-editor__source">
        <span class="card-editor__source-label">来源：</span>
        <span class="card-editor__source-info">
          <template v-if="modelValue.sourceLocation.pdfPath">
            {{ getFileName(modelValue.sourceLocation.pdfPath) }} - P{{ modelValue.sourceLocation.page }}
          </template>
          <template v-else>
            文档块 {{ modelValue.sourceLocation.blockId?.slice(0, 8) }}
          </template>
        </span>
      </div>

      <!-- 普通卡片编辑 -->
      <template v-if="modelValue.type === 'card'">
        <div class="card-editor__field">
          <label class="card-editor__label">卡片内容</label>
          <textarea
            v-model="contentDraft"
            class="card-editor__textarea"
            placeholder="输入卡片内容..."
            rows="6"
          ></textarea>
        </div>
      </template>

      <!-- 闪卡编辑 -->
      <template v-if="modelValue.type === 'flashcard'">
        <div class="card-editor__field">
          <label class="card-editor__label">正面（问题）</label>
          <textarea
            v-model="frontDraft"
            class="card-editor__textarea"
            placeholder="输入问题..."
            rows="3"
          ></textarea>
        </div>

        <div class="card-editor__field">
          <label class="card-editor__label">反面（答案）</label>
          <textarea
            v-model="backDraft"
            class="card-editor__textarea"
            placeholder="输入答案..."
            rows="3"
          ></textarea>
        </div>

        <!-- SRS 状态显示 -->
        <div
          v-if="isFlashCard(modelValue)"
          class="card-editor__srs-status"
        >
          <div class="srs-status__item">
            <span class="srs-status__label">间隔</span>
            <span class="srs-status__value">{{ modelValue.srs.interval }} 天</span>
          </div>
          <div class="srs-status__item">
            <span class="srs-status__label">重复</span>
            <span class="srs-status__value">{{ modelValue.srs.repetitions }} 次</span>
          </div>
          <div class="srs-status__item">
            <span class="srs-status__label">难度</span>
            <span class="srs-status__value">{{ modelValue.srs.easeFactor.toFixed(2) }}</span>
          </div>
          <div class="srs-status__item">
            <span class="srs-status__label">下次复习</span>
            <span class="srs-status__value">{{ formatNextReview(modelValue.srs.nextReview) }}</span>
          </div>
        </div>
      </template>

      <!-- 标签编辑 -->
      <div class="card-editor__field">
        <label class="card-editor__label">标签</label>
        <div class="card-editor__tags">
          <div class="tag-input">
            <span
              v-for="(tag, index) in tagsDraft"
              :key="index"
              class="tag-input__tag"
            >
              {{ tag }}
              <button
                class="tag-input__remove"
                @click="removeTag(index)"
              >×</button>
            </span>
            <input
              v-model="tagInput"
              class="tag-input__input"
              placeholder="输入标签后按回车"
              @keydown.enter="addTag"
            />
          </div>
        </div>
      </div>

      <!-- 状态和难度 -->
      <div class="card-editor__row">
        <div class="card-editor__field card-editor__field--half">
          <label class="card-editor__label">状态</label>
          <select
            v-model="statusDraft"
            class="card-editor__select"
          >
            <option value="new">
              新卡片
            </option>
            <option value="learning">
              学习中
            </option>
            <option value="review">
              复习中
            </option>
            <option value="suspended">
              已暂停
            </option>
          </select>
        </div>

        <div class="card-editor__field card-editor__field--half">
          <label class="card-editor__label">难度</label>
          <div class="card-editor__difficulty">
            <button
              v-for="i in 5"
              :key="i"
              class="card-editor__difficulty-btn"
              :class="[{ active: difficultyDraft >= i }]"
              @click="difficultyDraft = i"
            >
              {{ i }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 来源内容预览（如果有） -->
    <div
      v-if="modelValue.content"
      class="card-editor__source-preview"
    >
      <label class="card-editor__label">来源内容</label>
      <div class="card-editor__source-text">
        {{ modelValue.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Card,
  FlashCard,
} from '../types/card'
import {
  ref,
  watch,
} from 'vue'
import { formatNextReview } from '../review/sm2'

interface Props {
  modelValue: Card | FlashCard
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Card | FlashCard): void
  (e: 'save', value: Card | FlashCard): void
  (e: 'delete', value: Card | FlashCard): void
}>()

// 编辑草稿
const contentDraft = ref(props.modelValue.content)
const frontDraft = ref((props.modelValue as FlashCard).front || '')
const backDraft = ref((props.modelValue as FlashCard).back || '')
const tagsDraft = ref([...props.modelValue.tags])
const statusDraft = ref(props.modelValue.status)
const difficultyDraft = ref(props.modelValue.difficulty)
const tagInput = ref('')

// 监听属性变化
watch(() => props.modelValue, (newVal) => {
  contentDraft.value = newVal.content
  frontDraft.value = (newVal as FlashCard).front || ''
  backDraft.value = (newVal as FlashCard).back || ''
  tagsDraft.value = [...newVal.tags]
  statusDraft.value = newVal.status
  difficultyDraft.value = newVal.difficulty
}, { deep: true })

// 切换卡片类型
function switchType(type: 'card' | 'flashcard') {
  if (type === 'flashcard' && props.modelValue.type === 'card') {
    // 升级为闪卡
    emit('update:modelValue', {
      ...props.modelValue,
      type: 'flashcard',
      front: frontDraft.value || props.modelValue.content,
      back: backDraft.value,
      srs: {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: 0,
      },
    } as FlashCard)
  } else if (type === 'card' && props.modelValue.type === 'flashcard') {
    // 降级为普通卡片
    const {
      srs,
      front,
      back,
      ...rest
    } = props.modelValue as FlashCard
    emit('update:modelValue', {
      ...rest,
      type: 'card',
    } as Card)
  }
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !tagsDraft.value.includes(tag)) {
    tagsDraft.value.push(tag)
    tagInput.value = ''
    updateTags()
  }
}

// 移除标签
function removeTag(index: number) {
  tagsDraft.value.splice(index, 1)
  updateTags()
}

// 更新标签
function updateTags() {
  emit('update:modelValue', {
    ...props.modelValue,
    tags: tagsDraft.value,
  })
}

// 获取文件名
function getFileName(path: string): string {
  return path.split('/').pop() || path
}

// 判断是否是闪卡
function isFlashCard(card: Card | FlashCard): card is FlashCard {
  return card.type === 'flashcard'
}

// 保存处理
function handleSave() {
  const updated = {
    ...props.modelValue,
    content: contentDraft.value,
    front: frontDraft.value,
    back: backDraft.value,
    tags: tagsDraft.value,
    status: statusDraft.value,
    difficulty: difficultyDraft.value,
    updatedAt: Date.now(),
  }
  emit('save', updated as Card | FlashCard)
}

// 删除处理
function handleDelete() {
  emit('delete', props.modelValue)
}
</script>

<style scoped lang="scss">
.card-editor {
  padding: 16px;
  background: var(--b3-theme-background);
  border-radius: 8px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--b3-theme-border);
  }

  &__type-tabs {
    display: flex;
    gap: 8px;
  }

  &__tab {
    padding: 8px 16px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-background-light);
    }

    &.active {
      background: var(--b3-theme-primary);
      color: white;
      border-color: var(--b3-theme-primary);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__action-btn {
    padding: 8px 16px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--b3-theme-background-light);
    }

    &--danger {
      border-color: var(--b3-theme-error);
      color: var(--b3-theme-error);

      &:hover {
        background: var(--b3-theme-error);
        color: white;
      }
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__source {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--b3-theme-background-light);
    border-radius: 4px;
    font-size: 12px;

    &-label {
      color: var(--b3-theme-color-light);
    }

    &-info {
      color: var(--b3-theme-color);
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &--half {
      flex: 1;
    }
  }

  &__row {
    display: flex;
    gap: 16px;
  }

  &__label {
    font-size: 12px;
    color: var(--b3-theme-color-light);
    font-weight: 500;
  }

  &__textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 14px;
    resize: vertical;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__select {
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 14px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__difficulty {
    display: flex;
    gap: 4px;
  }

  &__difficulty-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--b3-theme-border);
    border-radius: 4px;
    background: transparent;
    color: var(--b3-theme-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--b3-theme-primary);
      color: var(--b3-theme-primary);
    }

    &.active {
      background: var(--b3-theme-primary);
      color: white;
      border-color: var(--b3-theme-primary);
    }
  }

  &__tags {
    .tag-input {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px 12px;
      border: 1px solid var(--b3-theme-border);
      border-radius: 4px;
      background: var(--b3-theme-background);
      min-height: 40px;
      align-items: center;

      &__tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: var(--b3-theme-primary-light);
        color: var(--b3-theme-primary);
        border-radius: 4px;
        font-size: 12px;

        &:hover {
          background: var(--b3-theme-primary);
          color: white;
        }
      }

      &__remove {
        width: 16px;
        height: 16px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      }

      &__input {
        flex: 1;
        min-width: 80px;
        border: none;
        outline: none;
        background: transparent;
        color: var(--b3-theme-color);
        font-size: 14px;
      }
    }
  }

  &__srs-status {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px;
    background: var(--b3-theme-background-light);
    border-radius: 4px;

    .srs-status {
      &__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      &__label {
        font-size: 11px;
        color: var(--b3-theme-color-light);
      }

      &__value {
        font-size: 16px;
        font-weight: 600;
        color: var(--b3-theme-primary);
      }
    }
  }

  &__source-preview {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--b3-theme-border);

    &-text {
      margin-top: 8px;
      padding: 12px;
      background: var(--b3-theme-background-light);
      border-radius: 4px;
      font-size: 13px;
      color: var(--b3-theme-color-light);
      line-height: 1.6;
    }
  }
}
</style>
