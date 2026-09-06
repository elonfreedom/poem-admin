<script lang="ts" setup >
import { computed, ref } from 'vue';

import { Check, ChevronDown, FolderOpen, Loader2 } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import type { Category } from '#/api/core/category';
import { getCategoryListApi } from '#/api/core/category';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    placeholder: '选择分类',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const open = ref(false);
const keyword = ref('');
const categories = ref<Category[]>([]);
const loading = ref(false);
const loaded = ref(false);

// 构建树形结构
interface CategoryNode extends Category {
  children?: CategoryNode[];
  level?: number;
}

function buildTree(items: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [], level: 0 });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      const parent = map.get(node.parent_id)!;
      parent.children = parent.children || [];
      node.level = (parent.level || 0) + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 按 sort 排序
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort);
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

// 扁平化树用于搜索过滤
function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const traverse = (list: CategoryNode[]) => {
    list.forEach((node) => {
      result.push(node);
      if (node.children?.length) traverse(node.children);
    });
  };
  traverse(nodes);
  return result;
}

const tree = computed(() => buildTree(categories.value));

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return flattenTree(tree.value);
  return flattenTree(tree.value).filter((c) =>
    c.name.toLowerCase().includes(kw),
  );
});

// 当前选中的分类
const selectedCategory = computed(() => {
  if (!props.modelValue) return undefined;
  return flattenTree(tree.value).find((c) => c.id === props.modelValue);
});

// 加载分类列表
async function ensureLoaded() {
  if (loaded.value) return;
  loading.value = true;
  try {
    categories.value = await getCategoryListApi();
    loaded.value = true;
  } catch {
    categories.value = [];
  } finally {
    loading.value = false;
  }
}

// 选择分类
function handleSelect(category: CategoryNode) {
  emit('update:modelValue', category.id);
  open.value = false;
}

// 清空选择
function handleClear(e: MouseEvent) {
  e.stopPropagation();
  emit('update:modelValue', undefined);
}

// 显示值
const displayValue = computed(() => {
  if (selectedCategory.value) return selectedCategory.value.name;
  return '';
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between font-normal"
        @click="ensureLoaded"
      >
        <span
          class="truncate"
          :class="{ 'text-muted-foreground': !selectedCategory }"
        >
          {{ displayValue || placeholder }}
        </span>
        <div class="ml-2 flex items-center gap-1">
          <Button
            v-if="selectedCategory"
            variant="ghost"
            size="icon"
            class="h-4 w-4"
            @click="handleClear"
          >
            <span class="text-xs">✕</span>
          </Button>
          <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[var(--radix-popover-trigger-width)] p-2" align="start">
      <!-- 搜索框 -->
      <Input
        v-model="keyword"
        placeholder="搜索分类..."
        class="mb-2 h-8"
      />

      <!-- 分类列表 -->
      <div class="max-h-60 overflow-y-auto">
        <div v-if="loading" class="flex items-center justify-center py-6">
          <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="filteredList.length === 0" class="py-4 text-center text-sm text-muted-foreground">
          {{ keyword.trim() ? '未找到匹配分类' : '暂无分类数据' }}
        </div>
        <button
          v-for="category in filteredList"
          :key="category.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          :class="{ 'bg-accent': selectedCategory?.id === category.id }"
          :style="{ paddingLeft: `${(category.level || 0) * 16 + 8}px` }"
          @click="handleSelect(category)"
        >
          <Check
            v-if="selectedCategory?.id === category.id"
            class="h-4 w-4 shrink-0"
          />
          <span v-else class="w-4 shrink-0" />
          <FolderOpen class="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span class="flex-1 truncate">{{ category.name }}</span>
          <span v-if="category.poem_count" class="text-xs text-muted-foreground">
            {{ category.poem_count }}
          </span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
