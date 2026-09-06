<script lang="ts" setup name="PoetryContentInput">
import { computed, ref, watch } from 'vue';

import { getToneOptions, removeTone } from '#/lib/pinyin';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入诗歌内容，每句一行',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:pinyinValue': [value: string[][]];
}>();

// 当前文本（按行拆分）
const lines = ref<string[]>([]);

// 每行的拼音数组
const pinyinLines = ref<string[][]>([]);

// 同步外部 modelValue 到内部 lines
watch(
  () => props.modelValue,
  (val) => {
    const newLines = val ? val.split('\n') : [''];
    lines.value = newLines;
    // 同步拼音数组长度
    const oldPinyin = pinyinLines.value;
    pinyinLines.value = newLines.map((line, i) => {
      const chars = [...line];
      const oldLine = oldPinyin[i] || [];
      return chars.map((_, ci) => oldLine[ci] || '');
    });
  },
  { immediate: true },
);

// 同步内部 lines 到外部 modelValue
function updateLine(index: number, value: string) {
  const newLines = [...lines.value];
  newLines[index] = value;
  lines.value = newLines;

  // 同步该行的拼音数组长度
  const chars = [...value];
  const oldPinyin = pinyinLines.value[index] || [];
  const newPinyin = chars.map((_, i) => oldPinyin[i] || '');
  const newPinyinLines = [...pinyinLines.value];
  newPinyinLines[index] = newPinyin;
  pinyinLines.value = newPinyinLines;

  emit('update:modelValue', newLines.join('\n'));
  emit('update:pinyinValue', pinyinLines.value);
}

// 更新单个拼音
function updatePinyin(lineIndex: number, charIndex: number, value: string) {
  const newPinyinLines = [...pinyinLines.value];
  const linePinyin = [...(newPinyinLines[lineIndex] || [])];
  linePinyin[charIndex] = value;
  newPinyinLines[lineIndex] = linePinyin;
  pinyinLines.value = newPinyinLines;
  emit('update:pinyinValue', newPinyinLines);
}

// 添加新行
function addLine(index: number) {
  const newLines = [...lines.value];
  newLines.splice(index + 1, 0, '');
  lines.value = newLines;

  const newPinyinLines = [...pinyinLines.value];
  newPinyinLines.splice(index + 1, 0, []);
  pinyinLines.value = newPinyinLines;

  emit('update:modelValue', newLines.join('\n'));
  emit('update:pinyinValue', newPinyinLines);
}

// 删除当前行（合并到上一行）
function removeLine(index: number) {
  if (lines.value.length <= 1) return;
  const newLines = [...lines.value];
  newLines.splice(index, 1);
  lines.value = newLines;

  const newPinyinLines = [...pinyinLines.value];
  newPinyinLines.splice(index, 1);
  pinyinLines.value = newPinyinLines;

  emit('update:modelValue', newLines.join('\n'));
  emit('update:pinyinValue', newPinyinLines);

  // 聚焦到上一行末尾
  setTimeout(() => {
    const prevIndex = Math.max(0, index - 1);
    const inputs = document.querySelectorAll(`.poetry-line-input-${prevIndex}`);
    const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
    if (lastInput) {
      lastInput.focus();
      lastInput.setSelectionRange(lastInput.value.length, lastInput.value.length);
    }
  }, 0);
}

// 处理按键
function handleKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addLine(index);
    // 聚焦到新行
    setTimeout(() => {
      const inputs = document.querySelectorAll(`.poetry-line-input-${index + 1}`);
      const firstInput = inputs[0] as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 0);
  } else if (e.key === 'Backspace' && !lines.value[index] && lines.value.length > 1) {
    e.preventDefault();
    removeLine(index);
  }
}

// 音调选择器状态
const tonePickerVisible = ref<{ line: number; char: number } | null>(null);
const tonePickerX = ref(0);
const tonePickerY = ref(0);

function openTonePicker(lineIndex: number, charIndex: number, e: MouseEvent) {
  tonePickerVisible.value = { line: lineIndex, char: charIndex };
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tonePickerX.value = rect.left;
  tonePickerY.value = rect.bottom + 4;
}

function selectTone(toneIndex: number) {
  if (!tonePickerVisible.value) return;
  const { line, char } = tonePickerVisible.value;
  const currentPinyin = pinyinLines.value[line]?.[char] || '';
  const plain = removeTone(currentPinyin);
  const options = getToneOptions(plain);
  const newPinyin = options[toneIndex];
  if (newPinyin) {
    updatePinyin(line, char, newPinyin);
  }
  tonePickerVisible.value = null;
}

function handleClickOutside(e: MouseEvent) {
  const picker = document.querySelector('.poetry-tone-popup');
  const target = e.target as Node;
  if (picker && !picker.contains(target)) {
    tonePickerVisible.value = null;
  }
}

// 当前音调选项
const currentToneOptions = computed(() => {
  if (!tonePickerVisible.value) return [];
  const { line, char } = tonePickerVisible.value;
  const plain = removeTone(pinyinLines.value[line]?.[char] || '');
  return getToneOptions(plain);
});

const currentPlainSyllable = computed(() => {
  if (!tonePickerVisible.value) return '';
  const { line, char } = tonePickerVisible.value;
  return removeTone(pinyinLines.value[line]?.[char] || '');
});

// 判断是否为标点
function isPunctuation(char: string): boolean {
  return /[，。、；：！？""''（）《》【】\s]/.test(char);
}

// 获取拼音字符串（空格分隔，行间用 | 分隔）
function getPinyinString(): string {
  return pinyinLines.value
    .map((line) => line.filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' | ');
}

// 设置拼音数组（编辑页回显）
function setPinyinLines(linesPinyin: string[][]) {
  pinyinLines.value = linesPinyin;
}

defineExpose({
  getPinyinString,
  setPinyinLines,
});
</script>

<template>
  <div class="poetry-content-input">
    <!-- 逐行输入 -->
    <div class="space-y-1">
      <div
        v-for="(line, lineIndex) in lines"
        :key="lineIndex"
        class="poetry-line"
      >
        <!-- 拼音行 -->
        <div class="flex flex-wrap items-center gap-0.5 min-h-[1.5rem]">
          <template v-if="[...line].length > 0">
            <div
              v-for="(char, charIndex) in [...line]"
              :key="charIndex"
              class="char-cell flex flex-col items-center"
              :class="{ 'char-cell-punct': isPunctuation(char) }"
            >
              <input
                v-if="!isPunctuation(char)"
                :value="pinyinLines[lineIndex]?.[charIndex] || ''"
                :disabled="disabled"
                class="pinyin-input"
                :class="`poetry-line-input-${lineIndex}`"
                placeholder="·"
                @input="updatePinyin(lineIndex, charIndex, ($event.target as HTMLInputElement).value)"
                @dblclick="openTonePicker(lineIndex, charIndex, $event)"
              />
              <span
                v-if="!isPunctuation(char)"
                class="text-[10px] text-primary/60 cursor-pointer leading-none"
                title="双击拼音框或点击此处选择音调"
                @click="openTonePicker(lineIndex, charIndex, $event)"
              >
                调
              </span>
            </div>
          </template>
          <span v-else class="text-xs text-muted-foreground italic">
            {{ lineIndex === 0 ? placeholder : '…' }}
          </span>
        </div>

        <!-- 文字行 -->
        <div class="flex items-center gap-1">
          <input
            :value="line"
            :disabled="disabled"
            class="line-input flex-1"
            :placeholder="lineIndex === 0 ? '请输入诗句' : '继续输入下一句'"
            @input="updateLine(lineIndex, ($event.target as HTMLInputElement).value)"
            @keydown="handleKeydown(lineIndex, $event)"
          />
          <button
            v-if="lines.length > 1"
            type="button"
            class="delete-line-btn shrink-0"
            title="删除此行"
            @click="removeLine(lineIndex)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 添加行按钮 -->
    <button
      type="button"
      class="add-line-btn mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      @click="addLine(lines.length - 1)"
    >
      <span>+</span>
      <span>添加一行</span>
    </button>

    <!-- 辅助提示 -->
    <div class="mt-2 text-xs text-muted-foreground">
      按回车换行，双击拼音框或点击「调」选择音调，退格删除空行
    </div>

    <!-- 音调选择器 -->
    <Teleport to="body">
      <div
        v-if="tonePickerVisible"
        class="poetry-tone-popup fixed z-[9999] flex gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl"
        :style="{ left: `${tonePickerX}px`, top: `${tonePickerY}px` }"
        @mousedown="
          ($event) => {
            $event.stopPropagation();
            handleClickOutside($event);
          }
        "
      >
        <span class="flex items-center px-1 text-xs text-muted-foreground">
          {{ currentPlainSyllable }}:
        </span>
        <button
          v-for="(option, idx) in currentToneOptions"
          :key="idx"
          class="min-w-[2.5rem] rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
          :class="[
            option === pinyinLines[tonePickerVisible.line]?.[tonePickerVisible.char]
              ? 'bg-primary font-medium text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          ]"
          type="button"
          @click="selectTone(idx)"
        >
          {{ option }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.poetry-line {
  padding: 4px 0;
  border-bottom: 1px dashed oklch(0.9 0.01 70 / 0.5);
}

.poetry-line:last-child {
  border-bottom: none;
}

.char-cell {
  min-width: 2rem;
  margin-bottom: 2px;
}

.char-cell-punct {
  min-width: 0.8rem;
}

.pinyin-input {
  width: 2rem;
  height: 1.25rem;
  font-size: 0.7rem;
  color: var(--color-primary, oklch(0.45 0.08 30));
  text-align: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  transition: all 0.15s;
}

.pinyin-input:hover {
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.05);
  border-color: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.2);
}

.pinyin-input:focus {
  outline: none;
  background: oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.08);
  border-color: var(--color-primary, oklch(0.45 0.08 30));
}

.pinyin-input::placeholder {
  color: oklch(0.7 0.005 60 / 0.5);
}

.line-input {
  width: 100%;
  padding: 6px 8px;
  font-size: 1rem;
  line-height: 1.6;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s;
}

.line-input:hover {
  background: oklch(0.98 0.005 80 / 0.5);
  border-color: oklch(0.85 0.01 70 / 0.3);
}

.line-input:focus {
  outline: none;
  background: oklch(1 0 0);
  border-color: var(--color-ring, oklch(0.6 0.05 60 / 0.5));
  box-shadow: 0 0 0 2px oklch(from var(--color-primary, oklch(0.45 0.08 30)) l c h / 0.1);
}

.dark .line-input:focus {
  background: oklch(0.15 0.01 60 / 0.5);
}

.delete-line-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 10px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s;
}

.poetry-line:hover .delete-line-btn {
  opacity: 1;
}

.delete-line-btn:hover {
  background: oklch(from var(--color-destructive, oklch(0.5 0.15 25)) l c h / 0.1);
  color: var(--color-destructive, oklch(0.5 0.15 25));
}

.add-line-btn {
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}

.add-line-btn:hover {
  background: oklch(0.97 0.005 80 / 0.5);
}

.dark .add-line-btn:hover {
  background: oklch(0.18 0.01 60 / 0.5);
}

.poetry-tone-popup {
  animation: fade-in 0.1s ease-out;
}

@keyframes fade-in {
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
