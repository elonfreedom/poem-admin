<script lang="ts" setup >
import { computed, ref, useTemplateRef } from 'vue';

import { Check, Loader2, Plus, X } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import type { Tag } from '#/api/core/tag';
import { getTagListApi } from '#/api/core/tag';

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    maxTags?: number;
    placeholder?: string;
  }>(),
  {
    modelValue: () => [],
    maxTags: 10,
    placeholder: '输入标签后按回车添加',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const open = ref(false);
const keyword = ref('');
const allTags = ref<Tag[]>([]);
const loading = ref(false);
const loaded = ref(false);

// 当前标签列表
const tags = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
});

// 过滤后的建议标签（排除已添加的）
const suggestions = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return allTags.value.filter((t) => {
    if (tags.value.includes(t.name)) return false;
    if (kw && !t.name.toLowerCase().includes(kw)) return false;
    return true;
  }).slice(0, 20);
});

// 加载已有标签
async function ensureLoaded() {
  if (loaded.value) return;
  loading.value = true;
  try {
    allTags.value = await getTagListApi();
    loaded.value = true;
  } catch {
    allTags.value = [];
  } finally {
    loading.value = false;
  }
}

// 添加标签
function addTag(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (tags.value.includes(trimmed)) return;
  if (tags.value.length >= props.maxTags) return;
  tags.value = [...tags.value, trimmed];
  keyword.value = '';
  open.value = false;
}

// 删除标签
function removeTag(name: string) {
  tags.value = tags.value.filter((t) => t !== name);
}

// 输入框按键
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (keyword.value) addTag(keyword.value);
  } else if (e.key === 'Backspace' && !keyword.value && tags.value.length > 0) {
    // 输入框为空时按退格删除最后一个标签
    const lastTag = tags.value[tags.value.length - 1];
    if (lastTag) removeTag(lastTag);
  } else if (e.key === 'Escape') {
    open.value = false;
  }
}

// 选择建议标签
function selectSuggestion(tag: Tag) {
  addTag(tag.name);
  setTimeout(() => inputRef.value?.focus(), 0);
}

// 是否可以添加更多
const canAddMore = computed(() => tags.value.length < props.maxTags);
</script>

<template>
  <div class="tag-input-wrap">
    <!-- 标签展示 + 输入框 -->
    <div
      class="tag-input-container flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1"
      @click="inputRef?.focus()"
    >
      <!-- 已添加的标签 -->
      <span
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      >
        {{ tag }}
        <button
          type="button"
          class="rounded-full p-0.5 transition-colors hover:bg-primary/20"
          @click.stop="removeTag(tag)"
        >
          <X class="h-3 w-3" />
        </button>
      </span>

      <!-- 输入框 -->
      <div v-if="canAddMore" class="relative flex-1 min-w-[120px]">
        <Input
          ref="inputRef"
          v-model="keyword"
          :placeholder="tags.length === 0 ? placeholder : ''"
          class="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          @keydown="handleKeydown"
          @focus="ensureLoaded(); open = true"
          @click="ensureLoaded"
        />

        <!-- 自动完成下拉 -->
        <Popover v-model:open="open" >
          <PopoverTrigger as-child>
            <span />
          </PopoverTrigger>
          <PopoverContent
            class="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            :side-offset="-8"
          >
            <div class="max-h-48 overflow-y-auto">
              <div v-if="loading" class="flex items-center justify-center py-4">
                <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
              <div v-else-if="suggestions.length === 0" class="px-3 py-4 text-center text-xs text-muted-foreground">
                <template v-if="keyword.trim()">
                  无匹配标签，按回车添加「{{ keyword }}」
                </template>
                <template v-else>
                  暂无建议标签
                </template>
              </div>
              <button
                v-for="tag in suggestions"
                :key="tag.id"
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                @click="selectSuggestion(tag)"
              >
                <Check class="h-4 w-4 opacity-0" />
                <span class="flex-1">{{ tag.name }}</span>
                <span v-if="tag.poem_count" class="text-xs text-muted-foreground">
                  {{ tag.poem_count }}
                </span>
              </button>
            </div>
            <div v-if="keyword.trim() && !suggestions.some(s => s.name === keyword.trim())" class="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                class="w-full text-xs"
                @click="addTag(keyword ?? '')"
              >
                <Plus class="mr-1.5 h-3 w-3" />
                添加「{{ keyword }}」
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- 数量提示 -->
      <span v-if="tags.length >= maxTags" class="text-xs text-muted-foreground">
        已达上限
      </span>
    </div>

    <!-- 辅助文字 -->
    <div class="mt-1 flex items-center justify-between text-xs text-muted-foreground">
      <span>按回车添加标签，退格删除</span>
      <span>{{ tags.length }}/{{ maxTags }}</span>
    </div>
  </div>
</template>
