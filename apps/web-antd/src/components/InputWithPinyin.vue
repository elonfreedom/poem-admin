<script lang="ts" setup name="InputWithPinyin">
import { computed, ref, watch } from 'vue';

import { getToneOptions, removeTone } from '@vben/utils';

interface Props {
  modelValue?: string;
  /** 自动生成的简体/繁体文本（用于修正） */
  simplifiedValue?: string;
  disabled?: boolean;
  placeholder?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  /** 是否显示简繁修正功能 */
  showConvert?: boolean;
  /** 是否显示拼音标注 */
  showPinyin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: '',
  placeholder: '',
  simplifiedValue: '',
  type: 'input',
  rows: 4,
  showConvert: false,
  showPinyin: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:simplifiedValue': [value: string];
}>();

// 当前输入的文字（原文/繁体）
const text = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val),
});

// 简体/繁体文本（可修正）
const simplifiedText = computed({
  get: () => props.simplifiedValue || '',
  set: (val) => emit('update:simplifiedValue', val),
});

// 拼音跟随简体文字（有简体时标注简体，无简体时标注原文）
const pinyinTarget = computed(() => simplifiedText.value || text.value);

// 拼音数组（与目标文字一一对应）
const pinyinList = ref<string[]>([]);

// 同步文字长度到拼音数组
watch(
  () => pinyinTarget.value,
  (newText) => {
    const chars = [...newText];
    const oldList = pinyinList.value;
    const newList = chars.map((_, i) => oldList[i] || '');
    pinyinList.value = newList;
  },
  { immediate: true },
);

// 更新单个拼音
function updatePinyin(index: number, value: string) {
  const newList = [...pinyinList.value];
  newList[index] = value;
  pinyinList.value = newList;
}

// 音调选择器状态
const tonePickerVisible = ref(-1);
const tonePickerX = ref(0);
const tonePickerY = ref(0);

// 打开音调选择器
function openTonePicker(index: number, e: MouseEvent) {
  tonePickerVisible.value = index;
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tonePickerX.value = rect.left;
  tonePickerY.value = rect.bottom + 4;
}

// 选择音调
function selectTone(toneIndex: number) {
  const index = tonePickerVisible.value;
  if (index === -1) return;

  const currentPinyin = pinyinList.value[index] || '';
  const plain = removeTone(currentPinyin);
  const options = getToneOptions(plain);
  const newPinyin = options[toneIndex];

  if (newPinyin) {
    updatePinyin(index, newPinyin);
  }
  tonePickerVisible.value = -1;
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  const picker = document.querySelector('.pinyin-tone-popup');
  const target = e.target as Node;
  if (picker && !picker.contains(target)) {
    tonePickerVisible.value = -1;
  }
}

// 判断是否为标点
function isPunctuation(char: string): boolean {
  return /[，。、；：！？""''（）《》【】\s]/.test(char);
}

// 当前音调选项
const currentToneOptions = computed(() => {
  const index = tonePickerVisible.value;
  if (index === -1) return [];
  const plain = removeTone(pinyinList.value[index] || '');
  return getToneOptions(plain);
});

// 当前无声调拼音
const currentPlainSyllable = computed(() => {
  const index = tonePickerVisible.value;
  if (index === -1) return '';
  return removeTone(pinyinList.value[index] || '');
});

// 暴露方法给父组件
defineExpose({
  getPinyinString: () => pinyinList.value.filter(Boolean).join(' '),
  getPinyinList: () => [...pinyinList.value],
  setPinyinList: (list: string[]) => {
    const chars = [...pinyinTarget.value];
    pinyinList.value = chars.map((_, i) => list[i] || '');
  },
  getSimplifiedString: () => simplifiedText.value,
});
</script>

<template>
  <div class="input-with-pinyin space-y-2">
    <!-- 繁体/原文输入框 -->
    <div>
      <div class="mb-1 text-xs text-muted-foreground">繁體</div>
      <input
        v-if="type === 'input'"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <textarea
        v-else
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder"
        :rows="rows"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      ></textarea>
    </div>

    <!-- 简体修正（可编辑） -->
    <div v-if="showConvert">
      <div class="mb-1 text-xs text-muted-foreground">简体（可修正）</div>
      <input
        v-if="type === 'input'"
        v-model="simplifiedText"
        :disabled="disabled"
        class="w-full rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <textarea
        v-else
        v-model="simplifiedText"
        :disabled="disabled"
        :rows="rows"
        class="w-full rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      ></textarea>
    </div>

    <!-- 拼音标注层 -->
    <div
      v-if="showPinyin && pinyinTarget"
      class="rounded-md border border-border bg-muted/20 p-2"
    >
      <div class="mb-1 text-xs text-muted-foreground">拼音</div>
      <div class="char-grid flex flex-wrap">
        <div
          v-for="(char, index) in [...pinyinTarget]"
          :key="index"
          class="char-cell flex flex-col items-center"
          :class="{ 'char-cell-punct': isPunctuation(char) }"
        >
          <!-- 拼音输入区 -->
          <div class="pinyin-input-wrap">
            <input
              v-if="!isPunctuation(char)"
              :value="pinyinList[index] || ''"
              :disabled="disabled"
              class="pinyin-input"
              placeholder="·"
              @input="
                updatePinyin(index, ($event.target as HTMLInputElement).value)
              "
              @dblclick="openTonePicker(index, $event)"
            />
            <!-- 音调按钮 -->
            <button
              v-if="!isPunctuation(char)"
              class="tone-btn absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground opacity-0 transition-opacity"
              :class="{ 'opacity-100': tonePickerVisible === index }"
              type="button"
              title="选择音调（或双击拼音框）"
              @click="openTonePicker(index, $event)"
            >
              调
            </button>
            <div v-else class="pinyin-input-wrap-inner"></div>
          </div>
          <!-- 汉字 -->
          <div
            class="char-display"
            :class="{ 'text-muted-foreground': isPunctuation(char) }"
          >
            {{ char === ' ' ? '　' : char }}
          </div>
        </div>
      </div>
      <div class="mt-1 text-xs text-muted-foreground">
        双击拼音框或点击「调」按钮选择音调
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="showPinyin && !pinyinTarget"
      class="rounded-md border border-dashed border-border bg-muted/10 px-3 py-3 text-center text-xs text-muted-foreground"
    >
      输入文字后将显示拼音标注
    </div>

    <!-- 音调选择器 -->
    <Teleport to="body">
      <div
        v-if="tonePickerVisible !== -1"
        class="pinyin-tone-popup fixed z-[9999] flex gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl"
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
            option === pinyinList[tonePickerVisible]
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
.char-grid {
  gap: 0;
  line-height: 1.4;
}

.char-cell {
  min-width: 2.2rem;
  margin-bottom: 0.25rem;
}

.char-cell-punct {
  min-width: 1.2rem;
}

.pinyin-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.8rem;
}

.pinyin-input {
  width: 2.2rem;
  height: 1.5rem;
  font-size: 0.75rem;
  color: hsl(var(--primary));
  text-align: center;
  background: hsl(var(--background));
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s;
}

.pinyin-input:hover {
  background: hsl(var(--primary-background-lighter));
  border-color: hsl(var(--primary-border-light));
}

.pinyin-input:focus {
  outline: none;
  background: hsl(var(--background));
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 10%);
}

.pinyin-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.char-cell:hover .tone-btn {
  opacity: 1;
}

.char-display {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

.pinyin-tone-popup {
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
