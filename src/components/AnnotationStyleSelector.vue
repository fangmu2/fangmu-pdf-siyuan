<template>
  <div class="annotation-style-selector">
    <!-- 标注类型选择 -->
    <div class="style-section">
      <label class="style-label">标注类型</label>
      <div class="type-buttons">
        <button
          v-for="type in annotationTypes"
          :key="type.value"
          :class="['type-btn', { active: modelValue.type === type.value }]"
          @click="selectType(type.value)"
          :title="type.description"
        >
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-name">{{ type.label }}</span>
        </button>
      </div>
    </div>

    <!-- 颜色选择 -->
    <div class="style-section">
      <label class="style-label">颜色</label>
      <div class="color-picker">
        <button
          v-for="color in colors"
          :key="color.hex"
          :class="['color-btn', { active: modelValue.color === color.hex }]"
          :style="{ backgroundColor: color.hex }"
          @click="selectColor(color.hex)"
          :title="color.label"
        >
          <span v-if="modelValue.color === color.hex" class="check-icon">✓</span>
        </button>
        <input
          type="color"
          :value="modelValue.color"
          @input="selectColor($event.target.value)"
          class="custom-color"
          title="自定义颜色"
        />
      </div>
    </div>

    <!-- 不透明度滑块（仅高亮类型） -->
    <div v-if="showOpacitySlider" class="style-section">
      <label class="style-label">不透明度：{{ Math.round(modelValue.opacity * 100) }}%</label>
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        :value="modelValue.opacity || 0.4"
        @input="selectOpacity(Number($event.target.value))"
        class="opacity-slider"
      />
      <div class="opacity-preview" :style="{ backgroundColor: modelValue.color, opacity: modelValue.opacity }">
        预览效果
      </div>
    </div>

    <!-- 线宽滑块（仅线条类型） -->
    <div v-if="showStrokeWidthSlider" class="style-section">
      <label class="style-label">线宽：{{ modelValue.strokeWidth || 2 }}px</label>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        :value="modelValue.strokeWidth || 2"
        @input="selectStrokeWidth(Number($event.target.value))"
        class="stroke-slider"
      />
      <div class="stroke-preview">
        <span
          :style="{
            borderBottom: `${modelValue.strokeWidth || 2}px solid ${modelValue.color}`,
            padding: '0 10px'
          }"
        >
          预览效果
        </span>
      </div>
    </div>

    <!-- 样式预设 -->
    <div class="style-section">
      <label class="style-label">预设样式</label>
      <div class="preset-buttons">
        <button
          v-for="(preset, index) in presets"
          :key="index"
          :class="['preset-btn', { active: isPresetActive(preset) }]"
          @click="applyPreset(preset)"
        >
          <span
            class="preset-preview"
            :style="getPresetStyle(preset)"
          >
            {{ preset.type === AnnotationType.HIGHLIGHT ? '高亮' : '标注' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  AnnotationType,
  AnnotationStyle,
  ANNOTATION_PRESETS,
  ANNOTATION_COLORS,
  ANNOTATION_TYPE_CONFIG
} from '@/types/annotation';

interface Props {
  modelValue: AnnotationStyle;
  showAllTypes?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAllTypes: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: AnnotationStyle): void;
}>();

// 显示的标注类型
const annotationTypes = computed(() => {
  const types = [
    { value: AnnotationType.HIGHLIGHT, label: ANNOTATION_TYPE_CONFIG.highlight.label, icon: ANNOTATION_TYPE_CONFIG.highlight.icon, description: ANNOTATION_TYPE_CONFIG.highlight.description },
    { value: AnnotationType.UNDERLINE, label: ANNOTATION_TYPE_CONFIG.underline.label, icon: ANNOTATION_TYPE_CONFIG.underline.icon, description: ANNOTATION_TYPE_CONFIG.underline.description },
    { value: AnnotationType.STRIKETHROUGH, label: ANNOTATION_TYPE_CONFIG.strikethrough.label, icon: ANNOTATION_TYPE_CONFIG.strikethrough.icon, description: ANNOTATION_TYPE_CONFIG.strikethrough.description },
    { value: AnnotationType.SQUIGGLY, label: ANNOTATION_TYPE_CONFIG.squiggly.label, icon: ANNOTATION_TYPE_CONFIG.squiggly.icon, description: ANNOTATION_TYPE_CONFIG.squiggly.description },
  ];

  if (props.showAllTypes) {
    types.push(
      { value: AnnotationType.RECTANGLE, label: ANNOTATION_TYPE_CONFIG.rectangle.label, icon: ANNOTATION_TYPE_CONFIG.rectangle.icon, description: ANNOTATION_TYPE_CONFIG.rectangle.description },
      { value: AnnotationType.CIRCLE, label: ANNOTATION_TYPE_CONFIG.circle.label, icon: ANNOTATION_TYPE_CONFIG.circle.icon, description: ANNOTATION_TYPE_CONFIG.circle.description },
      { value: AnnotationType.FREEHAND, label: ANNOTATION_TYPE_CONFIG.freehand.label, icon: ANNOTATION_TYPE_CONFIG.freehand.icon, description: ANNOTATION_TYPE_CONFIG.freehand.description },
      { value: AnnotationType.NOTE, label: ANNOTATION_TYPE_CONFIG.note.label, icon: ANNOTATION_TYPE_CONFIG.note.icon, description: ANNOTATION_TYPE_CONFIG.note.description },
      { value: AnnotationType.TEXT, label: ANNOTATION_TYPE_CONFIG.text.label, icon: ANNOTATION_TYPE_CONFIG.text.icon, description: ANNOTATION_TYPE_CONFIG.text.description }
    );
  }

  return types;
});

// 颜色列表
const colors = ANNOTATION_COLORS;

// 预设样式
const presets = ANNOTATION_PRESETS;

// 是否显示不透明度滑块
const showOpacitySlider = computed(() => {
  return props.modelValue.type === AnnotationType.HIGHLIGHT;
});

// 是否显示线宽滑块
const showStrokeWidthSlider = computed(() => {
  const lineTypes = [
    AnnotationType.UNDERLINE,
    AnnotationType.STRIKETHROUGH,
    AnnotationType.SQUIGGLY,
    AnnotationType.RECTANGLE,
    AnnotationType.CIRCLE
  ];
  return lineTypes.includes(props.modelValue.type);
});

// 选择标注类型
const selectType = (type: AnnotationType) => {
  const newStyle: AnnotationStyle = {
    ...props.modelValue,
    type,
    color: type === AnnotationType.HIGHLIGHT ? '#ffff00' : '#ff0000',
    opacity: type === AnnotationType.HIGHLIGHT ? 0.4 : 1
  };
  emit('update:modelValue', newStyle);
};

// 选择颜色
const selectColor = (color: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    color
  });
};

// 选择不透明度
const selectOpacity = (opacity: number) => {
  emit('update:modelValue', {
    ...props.modelValue,
    opacity
  });
};

// 选择线宽
const selectStrokeWidth = (strokeWidth: number) => {
  emit('update:modelValue', {
    ...props.modelValue,
    strokeWidth
  });
};

// 应用预设样式
const applyPreset = (preset: AnnotationStyle) => {
  emit('update:modelValue', { ...preset });
};

// 检查预设是否激活
const isPresetActive = (preset: AnnotationStyle) => {
  return props.modelValue.type === preset.type &&
         props.modelValue.color === preset.color &&
         (preset.opacity === undefined || props.modelValue.opacity === preset.opacity) &&
         (preset.strokeWidth === undefined || props.modelValue.strokeWidth === preset.strokeWidth);
};

// 获取预设样式
const getPresetStyle = (preset: AnnotationStyle) => {
  if (preset.type === AnnotationType.HIGHLIGHT) {
    return {
      backgroundColor: preset.color,
      opacity: preset.opacity
    };
  }
  if (preset.type === AnnotationType.UNDERLINE) {
    return {
      borderBottom: `${preset.strokeWidth || 2}px solid ${preset.color}`,
      display: 'inline-block',
      padding: '0 5px'
    };
  }
  if (preset.type === AnnotationType.STRIKETHROUGH) {
    return {
      textDecoration: 'line-through',
      color: preset.color
    };
  }
  if (preset.type === AnnotationType.SQUIGGLY) {
    return {
      borderBottom: `2px wavy ${preset.color}`,
      display: 'inline-block',
      padding: '0 5px'
    };
  }
  if (preset.type === AnnotationType.RECTANGLE) {
    return {
      border: `${preset.strokeWidth || 2}px solid ${preset.color}`,
      padding: '2px 5px'
    };
  }
  return {};
};
</script>

<style scoped lang="scss">
.annotation-style-selector {
  padding: 12px;
  background: var(--b3-theme-background);
  border-radius: 8px;
}

.style-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.style-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-on-background);
  margin-bottom: 8px;
}

.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border: 2px solid var(--b3-theme-background-light);
  border-radius: 8px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .type-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .type-name {
    font-size: 11px;
    color: var(--b3-theme-on-background);
  }
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.color-btn {
  width: 32px;
  height: 32px;
  border: 2px solid var(--b3-theme-background-light);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px var(--b3-theme-primary-light);
  }

  .check-icon {
    color: white;
    font-size: 16px;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
}

.custom-color {
  width: 32px;
  height: 32px;
  border: 2px solid var(--b3-theme-background-light);
  border-radius: 50%;
  cursor: pointer;
  padding: 2px;
  background: var(--b3-theme-background);

  &:hover {
    border-color: var(--b3-theme-primary);
  }
}

.opacity-slider,
.stroke-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, transparent, var(--b3-theme-primary));
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--b3-theme-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--b3-theme-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    border: none;
  }
}

.opacity-preview {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
  color: rgba(0, 0, 0, 0.8);
  font-size: 12px;
}

.stroke-preview {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--b3-theme-background-light);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  padding: 6px 10px;
  border: 2px solid var(--b3-theme-background-light);
  border-radius: 6px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--b3-theme-primary);
  }

  &.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .preset-preview {
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 2px;
  }
}
</style>
