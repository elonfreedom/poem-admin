<script lang="ts" setup >
import { computed, ref, watch } from 'vue';

import { Check, ChevronDown, Loader2, UserPlus } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import type { AuthorOption } from '#/api/core/author';
import { getAuthorOptionsApi } from '#/api/core/author';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    authorName?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: undefined,
    authorName: '',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
  select: [author: AuthorOption];
}>();

const open = ref(false);
const keyword = ref('');
const loading = ref(false);
const options = ref<AuthorOption[]>([]);
const selectedAuthor = ref<AuthorOption | undefined>(undefined);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 远程搜索
function handleSearch(val: string) {
  keyword.value = val;
  if (searchTimer) clearTimeout(searchTimer);
  if (!val.trim()) {
    options.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    loading.value = true;
    try {
      const data = await getAuthorOptionsApi(val.trim());
      options.value = data;
    } catch {
      options.value = [];
    } finally {
      loading.value = false;
    }
  }, 300);
}

// 选中作者
function handleSelect(author: AuthorOption) {
  selectedAuthor.value = author;
  emit('update:modelValue', author.id);
  emit('select', author);
  open.value = false;
}

// 清空选择
function handleClear() {
  selectedAuthor.value = undefined;
  keyword.value = '';
  options.value = [];
  emit('update:modelValue', undefined);
}

// 展示值
const displayValue = computed(() => {
  if (selectedAuthor.value) {
    const { name, dynasty } = selectedAuthor.value;
    return dynasty ? `${name}（${dynasty}）` : name;
  }
  return keyword.value;
});

// 外部 modelValue 变化时同步选中
watch(
  () => props.modelValue,
  async (val) => {
    if (!val) {
      // 无 id 但有名字（仅 authorName 传入时）
      if (props.authorName) {
        selectedAuthor.value = {
          id: 0,
          name: props.authorName,
          dynasty: '',
        };
      } else {
        selectedAuthor.value = undefined;
      }
      return;
    }
    // 若当前已选中且 id 一致，跳过
    if (selectedAuthor.value?.id === val) return;
    // 尝试从 options 找
    const found = options.value.find((a) => a.id === val);
    if (found) {
      selectedAuthor.value = found;
      return;
    }
    // 远程加载（编辑页回显）
    try {
      const data = await getAuthorOptionsApi('');
      const author = data.find((a) => a.id === val);
      if (author) selectedAuthor.value = author;
    } catch {
      // ignore
    }
  },
  { immediate: true },
);
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between font-normal"
        :disabled="disabled"
      >
        <span
          class="truncate"
          :class="{ 'text-muted-foreground': !selectedAuthor }"
        >
          {{ selectedAuthor ? displayValue : '搜索或选择作者' }}
        </span>
        <div class="ml-2 flex items-center gap-1">
          <Button
            v-if="selectedAuthor"
            variant="ghost"
            size="icon"
            class="h-4 w-4"
            @click.stop="handleClear"
          >
            <span class="sr-only">清空</span>
            <span class="text-xs">✕</span>
          </Button>
          <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[var(--radix-popover-trigger-width)] p-0" align="start">
      <div class="p-2">
        <Input
          :value="keyword"
          placeholder="输入作者名搜索..."
          @input="handleSearch(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="max-h-60 overflow-y-auto border-t">
        <div v-if="loading" class="flex items-center justify-center py-4">
          <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="options.length === 0" class="px-2 py-4 text-center text-sm text-muted-foreground">
          <template v-if="keyword.trim()">
            未找到匹配作者
          </template>
          <template v-else>
            请输入关键词搜索
          </template>
        </div>
        <button
          v-for="author in options"
          :key="author.id"
          type="button"
          class="flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          :class="{ 'bg-accent': selectedAuthor?.id === author.id }"
          @click="handleSelect(author)"
        >
          <Check
            v-if="selectedAuthor?.id === author.id"
            class="h-4 w-4 shrink-0"
          />
          <span v-else class="w-4 shrink-0" />
          <span class="flex-1 truncate">
            {{ author.name }}
            <span v-if="author.dynasty" class="text-muted-foreground">
              （{{ author.dynasty }}）
            </span>
          </span>
        </button>
      </div>
      <div class="border-t p-2">
        <Button variant="ghost" size="sm" class="w-full" @click="open = false">
          <UserPlus class="mr-2 h-4 w-4" />
          或手动输入新作者
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
