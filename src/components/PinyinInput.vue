<script lang="ts" setup name="PinyinInput">
import { computed, ref, watch } from 'vue';

import { RefreshCw } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { getToneOptions, removeTone } from '#/lib/pinyin';
import { generatePinyinApi } from '#/api/core/pinyin';

interface Props {
  /** 汉字文本（用于拼音生成，通常是繁体） */
  textValue?: string;
  /** 显示的汉字文本（用于网格显示，通常是简体） */
  displayText?: string;
  /** 拼音值（空格分隔） */
  modelValue?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  textValue: '',
  displayText: '',
  modelValue: '',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// 当前聚焦的拼音格索引
const focusedIndex = ref(-1);

// 显示的汉字数组（优先用 displayText，否则用 textValue）
const displayChars = computed(() => {
  const text = props.displayText || props.textValue;
  if (!text) return [];
  return [...text].filter((c) => c.trim());
});

// 汉字数组（保留标点，用于显示）
const chars = displayChars;

// 非标点字符的索引映射（拼音输入格用）
const charIndices = computed(() => {
  return chars.value.map((c, i) => (!isPinyinChar(c) ? -1 : i)).filter((i) => i >= 0);
});

// 拼音数组（仅非标点字符）
const pinyinList = ref<string[]>([]);

// 按行分组的网格（每行是一个字符数组）
const gridLines = computed(() => {
  const text = props.displayText || props.textValue;
  if (!text) return [];
  const lines = text.split('\n');
  return lines.map((line) => [...line].filter((c) => c.trim()));
});

// 同步汉字长度到拼音数组（仅非标点）
watch(
  charIndices,
  (newIndices) => {
    const old = pinyinList.value;
    pinyinList.value = newIndices.map((_, i) => old[i] || '');
    emitValue();
  },
  { immediate: true },
);

// 同步外部 modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      pinyinList.value = charIndices.value.map(() => '');
      return;
    }
    const syllables = val.trim().split(/\s+/);
    pinyinList.value = charIndices.value.map((_: number, i: number) => syllables[i] || '');
  },
);

// 从行号和行内索引计算全局 charIndex
function getCharIndex(lineIdx: number, charIdx: number): number {
  let count = 0;
  for (let i = 0; i < lineIdx; i++) {
    count += gridLines.value[i]?.length || 0;
  }
  return count + charIdx;
}

// 获取字符在 pinyinList 中的索引（非标点索引），如果是标点返回 -1
function getPinyinIndex(charIndex: number): number {
  return charIndices.value.indexOf(charIndex);
}

// 从行号和行内索引计算 pinyinList 索引
function getPinyinIndexFromLine(lineIdx: number, charIdx: number): number {
  const globalIdx = getCharIndex(lineIdx, charIdx);
  return getPinyinIndex(globalIdx);
}

// 更新单个拼音（charIndex 是 chars 中的索引）
function updatePinyin(charIndex: number, value: string) {
  const pinyinIdx = getPinyinIndex(charIndex);
  if (pinyinIdx === -1) return;
  pinyinList.value[pinyinIdx] = value;
  emitValue();
}

// 发出拼音字符串
function emitValue() {
  emit('update:modelValue', pinyinList.value.filter(Boolean).join(' '));
}

// 聚焦（charIndex 是 chars 中的索引）
function handleFocus(charIndex: number) {
  const pinyinIdx = getPinyinIndex(charIndex);
  if (pinyinIdx !== -1) {
    focusedIndex.value = pinyinIdx;
  }
}

// 失焦（延迟一点，让点击音调选项生效）
function handleBlur() {
  setTimeout(() => {
    focusedIndex.value = -1;
  }, 150);
}

// 选择音调
function selectTone(toneIndex: number) {
  const pinyinIdx = focusedIndex.value;
  if (pinyinIdx === -1) return;
  const current = pinyinList.value[pinyinIdx] || '';
  const plain = removeTone(current);
  const options = getToneOptions(plain);
  const toned = options[toneIndex];
  if (toned && toned !== current) {
    pinyinList.value[pinyinIdx] = toned;
    emitValue();
  }
  // 自动跳到下一格
  const inputs = document.querySelectorAll('.pinyin-cell-input') as NodeListOf<HTMLInputElement>;
  const next = inputs[pinyinIdx + 1];
  if (next) {
    setTimeout(() => next.focus(), 0);
  }
}

// 当前聚焦格的音调选项
const currentToneOptions = computed(() => {
  if (focusedIndex.value === -1) return [];
  const current = pinyinList.value[focusedIndex.value] || '';
  const plain = removeTone(current);
  if (!plain) return [];
  return getToneOptions(plain);
});

// 当前聚焦格的无声调拼音
const currentPlainSyllable = computed(() => {
  if (focusedIndex.value === -1) return '';
  return removeTone(pinyinList.value[focusedIndex.value] || '');
});

// 自动生成拼音
const generating = ref(false);

async function handleGenerate() {
  if (!props.textValue?.trim()) return;
  generating.value = true;
  try {
    const result = await generatePinyinApi(props.textValue);
    if (result) {
      const syllables = result.trim().split(/\s+/);
      pinyinList.value = charIndices.value.map((_: number, i: number) => syllables[i] || '');
      emitValue();
    }
  } catch {
    // error handled by interceptor
  } finally {
    generating.value = false;
  }
}

// 判断是否为需要拼音的字符（仅中文汉字）
function isPinyinChar(char: string): boolean {
  return /[一-鿿㐀-䶿]/.test(char);
}

// 格式化拼音（chars 变化后 watch 自动重映射，此处触发 emit）
function formatPinyin(_text: string) {
  emitValue();
}

// 暴露方法
defineExpose({
  getValue: () => pinyinList.value.filter(Boolean).join(' '),
  setValue: (val: string) => {
    if (!val) {
      pinyinList.value = charIndices.value.map(() => '');
      return;
    }
    const syllables = val.trim().split(/\s+/);
    pinyinList.value = charIndices.value.map((_: number, i: number) => syllables[i] || '');
  },
  formatPinyin,
});
</script>

<template>
  <div class="pinyin-input">
    <!-- 有汉字时显示逐字拼音 -->
    <div v-if="chars.length > 0" class="pinyin-mapping">
      <!-- 音调选择器（浮动在拼音格下方） -->
      <div
        v-if="focusedIndex !== -1 && currentPlainSyllable && currentToneOptions.length > 0"
        class="tone-picker"
      >
        <span class="tone-picker-label">{{ currentPlainSyllable }}:</span>
        <button
          v-for="(option, idx) in currentToneOptions"
          :key="idx"
          type="button"
          class="tone-option"
          :class="{ active: option === pinyinList[focusedIndex] }"
          :title="`${idx + 1}声${idx === 4 ? '（轻声）' : ''}`"
          @mousedown.prevent="selectTone(idx)"
        >
          {{ option || '○' }}
        </button>
      </div>

      <!-- 拼音 + 汉字网格（按行分组） -->
      <div class="char-pinyin-grid space-y-1">
        <div
          v-for="(line, lineIdx) in gridLines"
          :key="lineIdx"
          class="pinyin-line flex flex-wrap gap-y-1"
        >
          <div
            v-for="(char, charIdx) in line"
            :key="charIdx"
            class="char-pinyin-cell flex flex-col items-center"
            :class="{ 'is-focused': focusedIndex === getPinyinIndexFromLine(lineIdx, charIdx) }"
          >
            <!-- 非标点：拼音输入 -->
            <input
              v-if="isPinyinChar(char)"
              :value="pinyinList[getPinyinIndexFromLine(lineIdx, charIdx)] || ''"
              :disabled="disabled"
              class="pinyin-cell-input"
              placeholder="·"
              @input="updatePinyin(getCharIndex(lineIdx, charIdx), ($event.target as HTMLInputElement).value)"
              @focus="handleFocus(getCharIndex(lineIdx, charIdx))"
              @blur="handleBlur"
            />
            <!-- 标点：占位空白 -->
            <span v-else class="pinyin-cell-punct">&nbsp;</span>
            <!-- 汉字/标点 -->
            <span class="pinyin-cell-char" :class="{ 'punct': !isPinyinChar(char) }">{{ char }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="pinyin-empty rounded-md border border-dashed border-border bg-muted/10 px-3 py-3 text-center text-xs text-muted-foreground"
    >
      输入汉字后将显示逐字拼音
    </div>

    <!-- 操作栏 -->
    <div class="mt-2 flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        :disabled="disabled || chars.length === 0 || generating"
        @click="handleGenerate"
      >
        <RefreshCw
          class="mr-1.5 h-3.5 w-3.5"
          :class="{ 'animate-spin': generating }"
        />
        自动生成
      </Button>
      <span v-if="chars.length > 0" class="text-xs text-muted-foreground">
        点击拼音框选择音调，自动生成后可手动修正
      </span>
    </div>
  </div>
</template>

<style scoped>
.char-pinyin-grid {
  gap: 0;
}

.pinyin-line {
  gap: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid oklch(0.85 0.01 70 / 0.15);
}

.pinyin-line:last-child {
  border-bottom: none;
}

.dark .pinyin-line {
  border-bottom-color: oklch(0.3 0.02 60 / 0.2);
}

.char-pinyin-cell {
  min-width: 2.2rem;
  margin-bottom: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.char-pinyin-cell.is-focused {
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.05);
}

.dark .char-pinyin-cell.is-focused {
  background: oklch(from var(--color-primary, oklch(0.7 0.06 60)) l c h / 0.08);
}

.pinyin-cell-input {
  width: 2.2rem;
  height: 1.4rem;
  font-size: 0.7rem;
  color: var(--color-primary, oklch(0.45 0.08 30));
  text-align: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  transition: all 0.15s;
}

.pinyin-cell-input:hover {
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.05);
  border-color: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.2);
}

.pinyin-cell-input:focus {
  outline: none;
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.1);
  border-color: var(--color-primary, oklch(0.45 0.08 30));
  box-shadow: 0 0 0 2px oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.1);
}

.pinyin-cell-input::placeholder {
  color: oklch(0.7 0.005 60 / 0.4);
}

.dark .pinyin-cell-input {
  background: transparent;
}

.dark .pinyin-cell-input:focus {
  background: oklch(from var(--color-primary, oklch(0.7 0.06 60)) l c h / 0.1);
}

.pinyin-cell-char {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  color: var(--color-foreground);
}

.pinyin-cell-char.punct {
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  font-weight: 400;
}

.pinyin-cell-punct {
  width: 2.2rem;
  height: 1.4rem;
  display: block;
}

/* ===== 音调选择器 ===== */
.tone-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.06);
  border: 1px solid oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.15);
  animation: slide-down 0.15s ease-out;
}

.dark .tone-picker {
  background: oklch(from var(--color-primary, oklch(0.7 0.06 60)) l c h / 0.1);
  border-color: oklch(from var(--color-primary, oklch(0.7 0.06 60)) l c h / 0.2);
}

.tone-picker-label {
  font-size: 0.7rem;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  margin-right: 4px;
  white-space: nowrap;
}

.tone-option {
  min-width: 2rem;
  padding: 2px 6px;
  font-size: 0.7rem;
  border-radius: 4px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.tone-option:hover {
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.1);
  color: var(--color-primary, oklch(0.45 0.08 30));
}

.tone-option.active {
  background: var(--color-primary, oklch(0.45 0.08 30));
  color: var(--color-primary-foreground, oklch(0.98 0.005 80));
  font-weight: 600;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
