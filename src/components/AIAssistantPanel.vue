<!-- src/components/AIAssistantPanel.vue - AI 助手面板组件 -->
<template>
  <div class="ai-assistant-panel">
    <!-- 工具栏 -->
    <div class="ai-assistant-panel__toolbar">
      <h3 class="ai-assistant-panel__title">
        🤖 AI 助手
      </h3>
      <div class="ai-assistant-panel__actions">
        <button
          class="preset-btn"
          :class="[{ active: activePreset === 'summary' }]"
          @click="activePreset = 'summary'"
        >
          摘要
        </button>
        <button
          class="preset-btn"
          :class="[{ active: activePreset === 'tags' }]"
          @click="activePreset = 'tags'"
        >
          标签
        </button>
        <button
          class="preset-btn"
          :class="[{ active: activePreset === 'flashcard' }]"
          @click="activePreset = 'flashcard'"
        >
          闪卡
        </button>
        <button
          class="preset-btn"
          :class="[{ active: activePreset === 'chat' }]"
          @click="activePreset = 'chat'"
        >
          对话
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ai-assistant-panel__content">
      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-section__header">
          <label class="input-section__label">输入内容</label>
          <button
            v-if="selectedCard"
            class="use-card-btn"
            @click="loadCardContent"
          >
            使用选中卡片
          </button>
        </div>
        <textarea
          v-model="inputContent"
          class="input-textarea"
          placeholder="输入或粘贴要处理的内容..."
          :rows="6"
        ></textarea>
        <div
          v-if="selectedCard"
          class="input-section__meta"
        >
          <span class="meta-tag">已选择：{{ selectedCard.title }}</span>
        </div>
      </div>

      <!-- AI 功能区域 -->
      <div class="ai-function-section">
        <!-- 摘要生成 -->
        <div
          v-if="activePreset === 'summary'"
          class="function-card"
        >
          <div class="function-card__header">
            <h4>📝 智能摘要</h4>
            <select
              v-model="summaryLength"
              class="length-select"
            >
              <option value="short">
                简短 (1-2 句)
              </option>
              <option value="medium">
                中等 (3-5 句)
              </option>
              <option value="long">
                详细 (5 句以上)
              </option>
            </select>
          </div>
          <button
            class="generate-btn"
            :disabled="isProcessing || !inputContent"
            @click="generateSummary"
          >
            {{ isProcessing ? '生成中...' : '生成摘要' }}
          </button>
          <div
            v-if="aiResult"
            class="result-box"
          >
            <div class="result-box__content">
              {{ aiResult }}
            </div>
            <button
              class="copy-btn"
              title="复制"
              @click="copyResult"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 标签生成 -->
        <div
          v-else-if="activePreset === 'tags'"
          class="function-card"
        >
          <div class="function-card__header">
            <h4>🏷️ 自动标签</h4>
            <div class="tag-count-selector">
              <span>标签数量：</span>
              <input
                v-model.number="tagCount"
                type="number"
                min="1"
                max="10"
                class="tag-count-input"
              />
            </div>
          </div>
          <button
            class="generate-btn"
            :disabled="isProcessing || !inputContent"
            @click="generateTags"
          >
            {{ isProcessing ? '生成中...' : '生成标签' }}
          </button>
          <div
            v-if="aiTags.length > 0"
            class="tags-result"
          >
            <div class="tags-result__list">
              <span
                v-for="tag in aiTags"
                :key="tag"
                class="generated-tag"
                @click="addTag(tag)"
              >
                {{ tag }} +
              </span>
            </div>
          </div>
        </div>

        <!-- 闪卡生成 -->
        <div
          v-else-if="activePreset === 'flashcard'"
          class="function-card"
        >
          <div class="function-card__header">
            <h4>🃏 闪卡生成</h4>
          </div>
          <button
            class="generate-btn"
            :disabled="isProcessing || !inputContent"
            @click="generateFlashcard"
          >
            {{ isProcessing ? '生成中...' : '生成闪卡' }}
          </button>
          <div
            v-if="flashcard"
            class="flashcard-result"
          >
            <div class="flashcard-preview">
              <div class="flashcard-preview__front">
                <span class="flashcard-label">正面：</span>
                <p>{{ flashcard.front }}</p>
              </div>
              <div class="flashcard-preview__back">
                <span class="flashcard-label">反面：</span>
                <p>{{ flashcard.back }}</p>
              </div>
            </div>
            <button
              class="use-flashcard-btn"
              @click="useFlashcard"
            >
              使用此闪卡
            </button>
          </div>
        </div>

        <!-- AI 对话 -->
        <div
          v-else-if="activePreset === 'chat'"
          class="function-card chat-card"
        >
          <div class="chat-messages">
            <div
              v-for="(message, index) in chatMessages"
              :key="index"
              class="chat-message"
              :class="[`chat-message--${message.role}`]"
            >
              <div class="chat-message__content">
                {{ message.content }}
              </div>
            </div>
            <div
              v-if="isProcessing"
              class="chat-message chat-message--ai"
            >
              <div class="chat-message__content chat-message__content--loading">
                <span class="loading-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          </div>
          <div class="chat-input-area">
            <input
              v-model="chatInput"
              type="text"
              class="chat-input"
              placeholder="输入问题..."
              @keyup.enter="sendChat"
            />
            <button
              class="send-btn"
              :disabled="isProcessing || !chatInput"
              @click="sendChat"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="ai-assistant-panel__settings">
      <details class="settings-details">
        <summary class="settings-summary">
          ⚙️ AI 设置
        </summary>
        <div class="settings-content">
          <div class="setting-item">
            <label class="setting-item__label">API 提供商</label>
            <select
              v-model="aiConfig.provider"
              class="setting-select"
            >
              <option value="openai">
                OpenAI
              </option>
              <option value="claude">
                Claude
              </option>
              <option value="custom">
                自定义
              </option>
            </select>
          </div>
          <div class="setting-item">
            <label class="setting-item__label">API Key</label>
            <input
              v-model="aiConfig.apiKey"
              type="password"
              class="setting-input"
              placeholder="sk-..."
            />
          </div>
          <div class="setting-item">
            <label class="setting-item__label">模型</label>
            <input
              v-model="aiConfig.model"
              type="text"
              class="setting-input"
              placeholder="gpt-3.5-turbo"
            />
          </div>
          <div class="setting-item">
            <label class="setting-item__label">API 端点（可选）</label>
            <input
              v-model="aiConfig.endpoint"
              type="text"
              class="setting-input"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <button
            class="save-settings-btn"
            @click="saveSettings"
          >
            保存设置
          </button>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../types/card'
import {
  onMounted,
  ref,
  watch,
} from 'vue'

interface Props {
  selectedCard?: Card | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedCard: null,
})

const emit = defineEmits<{
  (e: 'tags-added', tags: string[]): void
  (e: 'flashcard-created', flashcard: { front: string, back: string }): void
}>()

// 状态
const activePreset = ref<'summary' | 'tags' | 'flashcard' | 'chat'>('summary')
const inputContent = ref('')
const aiResult = ref('')
const isProcessing = ref(false)
const selectedCard = ref<Card | null>(null)

// 摘要设置
const summaryLength = ref<'short' | 'medium' | 'long'>('medium')

// 标签设置
const tagCount = ref(5)
const aiTags = ref<string[]>([])

// 闪卡
const flashcard = ref<{ front: string, back: string } | null>(null)

// 聊天
const chatInput = ref('')
const chatMessages = ref<Array<{ role: 'user' | 'ai', content: string }>>([])

// AI 配置
const aiConfig = ref({
  provider: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  endpoint: 'https://api.openai.com/v1',
})

// 方法
function loadCardContent() {
  if (props.selectedCard) {
    selectedCard.value = props.selectedCard
    inputContent.value = props.selectedCard.content || ''
  }
}

async function generateSummary() {
  if (!inputContent.value) return

  isProcessing.value = true
  try {
    // 模拟 API 调用（实际使用时替换为真实 API）
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const content = inputContent.value
    const lengthMap = {
      short: 50,
      medium: 100,
      long: 200,
    }
    const maxLength = lengthMap[summaryLength.value]

    // 简单摘要（实际使用 AI API）
    aiResult.value = content.slice(0, maxLength) + (content.length > maxLength ? '...' : '')
  } catch (error) {
    console.error('生成摘要失败:', error)
    aiResult.value = '生成失败，请检查 API 配置'
  } finally {
    isProcessing.value = false
  }
}

async function generateTags() {
  if (!inputContent.value) return

  isProcessing.value = true
  try {
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 简单关键词提取（实际使用 AI API）
    const words = inputContent.value
      .split(/[\s,，.。!?！？]+/)
      .filter((w) => w.length > 1 && w.length < 10)
      .slice(0, tagCount.value)

    aiTags.value = [...new Set(words)]
  } catch (error) {
    console.error('生成标签失败:', error)
  } finally {
    isProcessing.value = false
  }
}

async function generateFlashcard() {
  if (!inputContent.value) return

  isProcessing.value = true
  try {
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 简单闪卡生成（实际使用 AI API）
    const lines = inputContent.value.split('\n').filter((l) => l.trim())
    flashcard.value = {
      front: lines[0]?.slice(0, 50) || '问题',
      back: lines.slice(1).join('\n').slice(0, 200) || '答案',
    }
  } catch (error) {
    console.error('生成闪卡失败:', error)
  } finally {
    isProcessing.value = false
  }
}

async function sendChat() {
  if (!chatInput.value) return

  const userMessage = chatInput.value
  chatMessages.value.push({
    role: 'user',
    content: userMessage,
  })
  chatInput.value = ''
  isProcessing.value = true

  try {
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 简单回复（实际使用 AI API）
    chatMessages.value.push({
      role: 'ai',
      content: '这是一个模拟回复。请配置真实的 AI API 以获取实际回答。',
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isProcessing.value = false
  }
}

function addTag(tag: string) {
  aiTags.value = aiTags.value.filter((t) => t !== tag)
  emit('tags-added', [tag])
}

function useFlashcard() {
  if (flashcard.value) {
    emit('flashcard-created', flashcard.value)
  }
}

function copyResult() {
  if (aiResult.value) {
    navigator.clipboard.writeText(aiResult.value)
  }
}

function saveSettings() {
  localStorage.setItem('ai-assistant-config', JSON.stringify(aiConfig.value))
  alert('设置已保存')
}

function loadSettings() {
  const stored = localStorage.getItem('ai-assistant-config')
  if (stored) {
    try {
      aiConfig.value = JSON.parse(stored)
    } catch (e) {
      console.error('加载 AI 配置失败:', e)
    }
  }
}

// 监听选中的卡片变化
watch(() => props.selectedCard, (newCard) => {
  if (newCard) {
    selectedCard.value = newCard
  }
})

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--b3-theme-divider);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--b3-theme-color);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__settings {
    padding: 12px 16px;
    border-top: 1px solid var(--b3-theme-divider);
  }
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;
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
}

.input-section {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-color);
  }

  .input-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 8px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-color);
    font-size: 13px;
    font-family: inherit;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  &__meta {
    margin-top: 8px;
  }

  .meta-tag {
    font-size: 11px;
    color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.use-card-btn {
  padding: 4px 10px;
  border: 1px solid var(--b3-theme-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.ai-function-section {
  flex: 1;
}

.function-card {
  background: var(--b3-theme-surface);
  border-radius: 12px;
  padding: 16px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--b3-theme-color);
      margin: 0;
    }
  }

  .length-select,
  .tag-count-input {
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-color);
    font-size: 12px;
  }

  .tag-count-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--b3-theme-color-light);
  }
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.result-box {
  margin-top: 12px;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  border: 1px solid var(--b3-theme-divider);
  position: relative;

  &__content {
    font-size: 13px;
    color: var(--b3-theme-color);
    line-height: 1.6;
  }
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
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

.tags-result {
  margin-top: 12px;

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.generated-tag {
  display: inline-block;
  padding: 6px 12px;
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
  }
}

.flashcard-result {
  margin-top: 12px;
}

.flashcard-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__front,
  &__back {
    padding: 12px;
    background: var(--b3-theme-background);
    border-radius: 8px;
    border: 1px solid var(--b3-theme-divider);

    p {
      margin: 8px 0 0;
      font-size: 13px;
      color: var(--b3-theme-color);
      line-height: 1.6;
    }
  }

  .flashcard-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
    text-transform: uppercase;
  }
}

.use-flashcard-btn {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: var(--b3-theme-success);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-success-dark);
  }
}

.chat-card {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
  margin-bottom: 12px;
}

.chat-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;

  &--user {
    align-self: flex-end;
    background: var(--b3-theme-primary);
    color: white;
  }

  &--ai {
    align-self: flex-start;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-color);
  }

  &__content--loading {
    display: flex;
    align-items: center;
  }
}

.loading-dots {
  display: flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    background: var(--b3-theme-color-light);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  display: flex;
  gap: 8px;

  .chat-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 20px;
    background: var(--b3-theme-surface);
    color: var(--b3-theme-color);
    font-size: 13px;

    &:focus {
      outline: none;
      border-color: var(--b3-theme-primary);
    }
  }

  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: var(--b3-theme-primary);
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: var(--b3-theme-primary-dark);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.settings-details {
  summary {
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-color);
    padding: 8px 0;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--b3-theme-color-light);
  }
}

.setting-input,
.setting-select {
  padding: 8px 12px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 6px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-color);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }
}

.save-settings-btn {
  padding: 8px 16px;
  background: var(--b3-theme-success);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-success-dark);
  }
}
</style>
