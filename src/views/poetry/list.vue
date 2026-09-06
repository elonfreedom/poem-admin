<script lang="ts" setup >
import type { Poetry, PoetryListParams } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  BookOpen,
  Calendar,
  ChevronDown,
  Eye,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Checkbox } from '#/components/ui/checkbox';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { Pagination } from '#/components/ui/pagination';
import { useTable } from '#/composables/useTable';
import {
  batchDeletePoetryApi,
  batchUpdatePoetryStatusApi,
  deletePoetryApi,
  getPoetryListApi,
  updatePoetryStatusApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

// ==================== 常量 ====================

const statusOptions = [
  { label: '全部', value: '__all__' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const statusDotColor: Record<string, string> = {
  draft: 'bg-yellow-500',
  published: 'bg-emerald-500',
  archived: 'bg-gray-400',
};

const dynastyOptions = [
  { label: '全部', value: '__all__' },
  { label: '先秦', value: '先秦' },
  { label: '汉', value: '汉' },
  { label: '魏晋', value: '魏晋' },
  { label: '南北朝', value: '南北朝' },
  { label: '隋', value: '隋' },
  { label: '唐', value: '唐' },
  { label: '五代', value: '五代' },
  { label: '宋', value: '宋' },
  { label: '元', value: '元' },
  { label: '明', value: '明' },
  { label: '清', value: '清' },
  { label: '近代', value: '近代' },
  { label: '现代', value: '现代' },
  { label: '未知', value: '未知' },
];

type SearchScope = 'all' | 'title' | 'author';

const searchScopeOptions: { label: string; value: SearchScope }[] = [
  { label: '全部', value: 'all' },
  { label: '标题', value: 'title' },
  { label: '作者', value: 'author' },
];

/** 生成完整性选项（翻译/赏析通用） */
function completenessOptions(type: '翻译' | '赏析') {
  return [
    { label: '全部', value: '__all__' },
    { label: `有${type}`, value: 'true' },
    { label: `无${type}`, value: 'false' },
  ];
}

// ==================== 状态 ====================

const keyword = ref('');
const searchScope = ref<SearchScope>('all');
const dynasty = ref<string>('__all__');
const status = ref<string>('__all__');
const hasTranslation = ref<string>('__all__');
const hasAppreciation = ref<string>('__all__');
const tagFilter = ref<string>('__all__');

const selectedRowKeys = ref<number[]>([]);
const tagFilterPopoverOpen = ref(false);

// 批量标签弹窗
const batchTagDialogVisible = ref(false);
const batchTagMode = ref<'add' | 'remove'>('add');
const batchTagSubmitting = ref(false);
const batchTagKeyword = ref('');
const batchTagSelected = ref<Set<string>>(new Set());

/** 构建查询参数 */
function buildParams(page: number, pageSize: number): PoetryListParams {
  return {
    page,
    page_size: pageSize,
    keyword: keyword.value || undefined,
    search_scope: searchScope.value === 'all' ? undefined : searchScope.value,
    dynasty: dynasty.value === '__all__' ? undefined : dynasty.value,
    status: status.value === '__all__' ? undefined : status.value,
    has_translation: hasTranslation.value === '__all__' ? undefined : (hasTranslation.value as 'true' | 'false'),
    has_appreciation: hasAppreciation.value === '__all__' ? undefined : (hasAppreciation.value as 'true' | 'false'),
  };
}

// 表格数据
const { data, loading, pagination, refresh, setFilters } = useTable<Poetry>({
  fetchData: async ({ page, pageSize }) => {
    const params = buildParams(page, pageSize);
    const result = await getPoetryListApi(params);

    // 标签筛选在前端过滤（后端暂不支持标签筛选参数）
    if (tagFilter.value !== '__all__') {
      result.items = result.items.filter((p) => p.tags?.includes(tagFilter.value));
    }

    return result;
  },
  defaultPageSize: 20,
  immediate: true,
});

// ==================== 计算属性 ====================

const isAllSelected = computed({
  get: () =>
    data.value.length > 0 &&
    selectedRowKeys.value.length === data.value.length,
  set: (val: boolean) => {
    selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
  },
});

const hasSelection = computed(() => selectedRowKeys.value.length > 0);

const selectedPoems = computed(() =>
  data.value.filter((r) => selectedRowKeys.value.includes(r.id)),
);

const allSelectedArchived = computed(() =>
  selectedPoems.value.length > 0 && selectedPoems.value.every((p) => p.status === 'archived'),
);

const searchPlaceholder = computed(() => {
  const map: Record<SearchScope, string> = {
    all: '搜索标题或作者...',
    title: '搜索标题...',
    author: '搜索作者...',
  };
  return map[searchScope.value];
});

/** 所有标签的统计（从当前数据中提取） */
const allTags = computed(() => {
  const tagMap = new Map<string, number>();
  for (const poem of data.value) {
    for (const tag of poem.tags || []) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
});

/** 是否有激活的筛选 */
const hasActiveFilters = computed(() => {
  return keyword.value || dynasty.value !== '__all__' || status.value !== '__all__' ||
    hasTranslation.value !== '__all__' || hasAppreciation.value !== '__all__' || tagFilter.value !== '__all__';
});

// ==================== 方法 ====================

function setAllSelected(val: boolean) {
  selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
}

function setRowSelected(row: Poetry, val: boolean) {
  const index = selectedRowKeys.value.indexOf(row.id);
  if (val && index === -1) {
    selectedRowKeys.value.push(row.id);
  } else if (!val && index > -1) {
    selectedRowKeys.value.splice(index, 1);
  }
}

function isRowSelected(row: Poetry): boolean {
  return selectedRowKeys.value.includes(row.id);
}

function handleSearch() {
  setFilters({});
}

function handleReset() {
  keyword.value = '';
  searchScope.value = 'all';
  dynasty.value = '__all__';
  status.value = '__all__';
  hasTranslation.value = '__all__';
  hasAppreciation.value = '__all__';
  tagFilter.value = '__all__';
  selectedRowKeys.value = [];
  setFilters({});
}

watch([dynasty, status, hasTranslation, hasAppreciation, tagFilter], () => {
  setFilters({});
});

function onCreate() {
  router.push('/poetry/create');
}

function onEdit(row: Poetry) {
  router.push(`/poetry/${row.id}/edit`);
}

// 查看弹窗
const viewDialogOpen = ref(false);
const viewDetail = ref<Poetry | null>(null);

function onView(row: Poetry) {
  viewDetail.value = row;
  viewDialogOpen.value = true;
}

async function onPublish(row: Poetry) {
  try {
    await updatePoetryStatusApi(row.id, 'published');
    toast.success('发布成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onArchive(row: Poetry) {
  try {
    await updatePoetryStatusApi(row.id, 'archived');
    toast.success('归档成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

function onDelete(row: Poetry) {
  deletePoetryApi(row.id)
    .then(() => {
      toast.success(`「${row.title}」已删除`);
      refresh();
    })
    .catch(() => {});
}

async function onBatchPublish() {
  if (selectedRowKeys.value.length === 0) {
    toast.warning('请先选择要发布的诗歌');
    return;
  }
  try {
    await batchUpdatePoetryStatusApi(selectedRowKeys.value, 'published');
    toast.success('批量发布成功');
    selectedRowKeys.value = [];
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onBatchArchive() {
  if (selectedRowKeys.value.length === 0) {
    toast.warning('请先选择要归档的诗歌');
    return;
  }
  try {
    await batchUpdatePoetryStatusApi(selectedRowKeys.value, 'archived');
    toast.success('批量归档成功');
    selectedRowKeys.value = [];
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    toast.warning('请先选择要删除的诗歌');
    return;
  }
  if (!allSelectedArchived.value) {
    toast.warning('仅已归档的诗歌可批量删除');
    return;
  }
  try {
    await batchDeletePoetryApi(selectedRowKeys.value);
    toast.success(`已删除 ${selectedRowKeys.value.length} 首诗歌`);
    selectedRowKeys.value = [];
    refresh();
  } catch {
    // error handled by interceptor
  }
}

/** 分页变化 */
function handlePageChange(page: number) {
  pagination.value.current = page;
  loadListData();
}

/** 每页条数变化 */
function handlePageSizeChange(size: number) {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  loadListData();
}

/** 手动加载数据（分页变化时调用） */
async function loadListData() {
  const params = buildParams(pagination.value.current, pagination.value.pageSize);
  const result = await getPoetryListApi(params);

  // 标签筛选在前端过滤
  if (tagFilter.value !== '__all__') {
    result.items = result.items.filter((p) => p.tags?.includes(tagFilter.value));
  }

  data.value = result.items;
  pagination.value.total = result.total;
}

/** 截断内容 */
function truncate(text: string, len: number): string {
  if (!text) return '-';
  return text.length > len ? text.slice(0, len) + '...' : text;
}

/** 选中的诗歌已有的所有标签 */
const selectedPoemsTags = computed(() => {
  const tagMap = new Map<string, number>();
  for (const poem of selectedPoems.value) {
    for (const tag of poem.tags || []) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
});

/** 批量标签弹窗中的标签列表 */
const batchTagList = computed(() => {
  if (!batchTagKeyword.value.trim()) return selectedPoemsTags.value;
  const query = batchTagKeyword.value.toLowerCase();
  return selectedPoemsTags.value.filter(([tag]) => tag.toLowerCase().includes(query));
});

function openBatchTagDialog(mode: 'add' | 'remove') {
  batchTagMode.value = mode;
  batchTagKeyword.value = '';
  batchTagSelected.value.clear();
  batchTagDialogVisible.value = true;
}

async function handleBatchTagSubmit() {
  if (batchTagSelected.value.size === 0) {
    toast.warning('请至少选择一个标签');
    return;
  }
  // TODO: 调用后端 API 批量更新标签
  toast.info('批量标签功能待后端 API 支持');
  batchTagDialogVisible.value = false;
}

/** 获取标签展示列表（最多显示 3 个） */
function getDisplayTags(tags: string[]): { display: string[]; overflow: number } {
  const maxDisplay = 3;
  if (tags.length <= maxDisplay) {
    return { display: tags, overflow: 0 };
  }
  return { display: tags.slice(0, maxDisplay), overflow: tags.length - maxDisplay };
}

/** 缓存每行的标签展示结果 */
const tagDisplayCache = new Map<number, { display: string[]; overflow: number }>();
function getCachedDisplayTags(row: Poetry): { display: string[]; overflow: number } {
  if (!row.tags) return { display: [], overflow: 0 };
  let cached = tagDisplayCache.get(row.id);
  if (!cached) {
    cached = getDisplayTags(row.tags);
    tagDisplayCache.set(row.id, cached);
  }
  return cached;
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="诗歌管理">
      <template #description>
        管理诗词内容，支持录入、编辑、发布、归档等操作
      </template>
      <template #extra>
        <Button size="sm" @click="onCreate">
          <Plus class="mr-2 h-4 w-4" />
          录入诗歌
        </Button>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <!-- 第一行：搜索框 + 搜索范围 -->
      <div class="flex items-center gap-3">
        <div class="search-wrap flex-1">
          <Search class="search-icon" />
          <Input
            v-model="keyword"
            :placeholder="searchPlaceholder"
            class="search-input"
            @keyup.enter="handleSearch" />
          <button
            v-if="keyword"
            class="search-clear-btn"
            title="清除"
            @click="keyword = ''; handleSearch()">
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
        <div class="search-scope-group">
          <button
            v-for="opt in searchScopeOptions"
            :key="opt.value"
            type="button"
            class="search-scope-btn"
            :class="{ active: searchScope === opt.value }"
            @click="searchScope = opt.value">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 第二行：常用筛选器 -->
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <Select v-model="dynasty">
          <SelectTrigger class="w-24">
            <SelectValue placeholder="朝代" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in dynastyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="status">
          <SelectTrigger class="w-24">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 标签筛选 -->
        <Popover v-model:open="tagFilterPopoverOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-9"
              :class="tagFilter !== '__all__' ? 'border-primary text-primary' : ''">
              <TagIcon class="mr-1.5 h-3.5 w-3.5" />
              标签
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-56 p-3" align="start">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">按标签筛选</span>
                <Button
                  v-if="tagFilter !== '__all__'"
                  variant="ghost"
                  size="sm"
                  class="h-6 px-2 text-xs"
                  @click="tagFilter = '__all__'">
                  清除
                </Button>
              </div>
              <div class="max-h-48 space-y-1 overflow-y-auto">
                <button
                  v-for="[tag, count] in allTags"
                  :key="tag"
                  class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  :class="tagFilter === tag ? 'bg-primary/10 text-primary' : ''"
                  @click="tagFilter = tagFilter === tag ? '__all__' : tag">
                  <span class="flex items-center gap-1.5">
                    <TagIcon class="h-3 w-3" />
                    {{ tag }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ count }}</span>
                </button>
                <div v-if="allTags.length === 0" class="py-4 text-center text-sm text-muted-foreground">
                  暂无标签数据
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <!-- 更多筛选 -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-9">
              更多筛选
              <ChevronDown class="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-64 p-4" align="start">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label class="text-xs text-muted-foreground">翻译</Label>
                <div class="flex gap-2">
                  <button
                    v-for="opt in completenessOptions('翻译')"
                    :key="opt.value"
                    class="filter-radio-btn"
                    :class="hasTranslation === opt.value ? 'active' : ''"
                    @click="hasTranslation = opt.value">
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <Label class="text-xs text-muted-foreground">赏析</Label>
                <div class="flex gap-2">
                  <button
                    v-for="opt in completenessOptions('赏析')"
                    :key="opt.value"
                    class="filter-radio-btn"
                    :class="hasAppreciation === opt.value ? 'active' : ''"
                    @click="hasAppreciation = opt.value">
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button v-if="hasActiveFilters" variant="ghost" size="sm" class="h-9 text-muted-foreground" @click="handleReset">
          清除全部
        </Button>
      </div>

      <!-- 第三行：激活的筛选标签 -->
      <div v-if="hasActiveFilters" class="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span class="text-xs text-muted-foreground">已筛选：</span>
        <Badge v-if="keyword" variant="secondary" class="filter-tag">
          {{ keyword }}
          <X class="h-3 w-3 cursor-pointer" @click="keyword = ''; handleSearch()" />
        </Badge>
        <Badge v-if="dynasty !== '__all__'" variant="secondary" class="filter-tag">
          {{ dynasty }}
          <X class="h-3 w-3 cursor-pointer" @click="dynasty = '__all__'" />
        </Badge>
        <Badge v-if="status !== '__all__'" variant="secondary" class="filter-tag">
          {{ statusLabels[status] || status }}
          <X class="h-3 w-3 cursor-pointer" @click="status = '__all__'" />
        </Badge>
        <Badge v-if="tagFilter !== '__all__'" variant="secondary" class="filter-tag">
          <TagIcon class="h-3 w-3" />
          {{ tagFilter }}
          <X class="h-3 w-3 cursor-pointer" @click="tagFilter = '__all__'" />
        </Badge>
        <Badge v-if="hasTranslation !== '__all__'" variant="secondary" class="filter-tag">
          翻译{{ hasTranslation === 'true' ? '有' : '无' }}
          <X class="h-3 w-3 cursor-pointer" @click="hasTranslation = '__all__'" />
        </Badge>
        <Badge v-if="hasAppreciation !== '__all__'" variant="secondary" class="filter-tag">
          赏析{{ hasAppreciation === 'true' ? '有' : '无' }}
          <X class="h-3 w-3 cursor-pointer" @click="hasAppreciation = '__all__'" />
        </Badge>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <!-- 批量操作栏 -->
      <div
        class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out"
        :class="hasSelection ? 'grid-rows-[1fr]' : ''">
        <div class="overflow-hidden">
          <div class="batch-bar">
            <span class="text-sm">
              已选中 <span class="font-medium text-foreground">{{ selectedRowKeys.length }}</span> 项
            </span>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="outline" @click="onBatchPublish">
                批量发布
              </Button>
              <Button size="sm" variant="outline" @click="onBatchArchive">
                批量归档
              </Button>
              <Button
                size="sm"
                variant="destructive"
                :disabled="!allSelectedArchived"
                title="仅已归档的诗歌可删除"
                @click="onBatchDelete">
                批量删除
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button size="sm" variant="outline">
                    <TagIcon class="mr-1.5 h-3.5 w-3.5" />
                    标签
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem @click="openBatchTagDialog('add')">
                    <Plus class="mr-2 h-4 w-4" />
                    批量添加标签
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openBatchTagDialog('remove')">
                    <X class="mr-2 h-4 w-4" />
                    批量移除标签
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="ghost"
                @click="selectedRowKeys = []">
                取消选择
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50 hover:bg-muted/50">
            <TableHead class="w-[40px]">
              <Checkbox
                :modelValue="isAllSelected"
                @update:modelValue="setAllSelected($event as boolean)" />
            </TableHead>
            <TableHead class="w-[50px]">ID</TableHead>
            <TableHead>标题 / 内容</TableHead>
            <TableHead class="w-[80px]">作者</TableHead>
            <TableHead class="w-[60px]">朝代</TableHead>
            <TableHead class="w-[90px]">分类</TableHead>
            <TableHead class="w-[140px]">标签</TableHead>
            <TableHead class="w-[70px]">状态</TableHead>
            <TableHead class="w-[70px]">译/赏</TableHead>
            <TableHead class="w-[140px]">创建时间</TableHead>
            <TableHead class="w-[140px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- 加载态 -->
          <TableRow v-if="loading">
            <TableCell colspan="11" class="h-64">
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="loading-spinner" />
                <span class="text-sm text-muted-foreground">加载中...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- 数据行 -->
          <template v-else>
            <TableRow
              v-for="row in data"
              :key="row.id"
              :class="{ 'bg-muted/30': isRowSelected(row) }"
              class="data-row">
              <TableCell>
                <Checkbox
                  :modelValue="isRowSelected(row)"
                  @update:modelValue="setRowSelected(row, $event as boolean)" />
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">{{ row.id }}</TableCell>
              <TableCell>
                <div class="max-w-[260px]">
                  <div class="poetry-title truncate" :title="row.title_sc || row.title">
                    {{ row.title_sc || row.title }}
                  </div>
                  <div
                    v-if="row.content_sc || row.content"
                    class="poetry-excerpt truncate"
                    :title="(row.content_sc || row.content).replace(/\n/g, ' ')">
                    {{ truncate((row.content_sc || row.content).replace(/\n/g, ' '), 50) }}
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-sm">{{ row.author_sc || row.author || '-' }}</TableCell>
              <TableCell>
                <span v-if="row.dynasty" class="dynasty-tag">{{ row.dynasty }}</span>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-sm">
                <span v-if="row.category_name" class="flex items-center gap-1">
                  <FolderOpen class="h-3 w-3 text-muted-foreground" />
                  {{ row.category_name }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <!-- 标签列 -->
              <TableCell>
                <div class="flex items-center gap-1">
                  <template v-if="row.tags && row.tags.length > 0">
                    <span
                      v-for="tag in getCachedDisplayTags(row).display"
                      :key="tag"
                      class="tag-chip"
                      :title="`标签: ${tag}`">
                      {{ tag }}
                    </span>
                    <span
                      v-if="getCachedDisplayTags(row).overflow > 0"
                      class="tag-overflow"
                      :title="`还有 ${getCachedDisplayTags(row).overflow} 个标签`">
                      +{{ getCachedDisplayTags(row).overflow }}
                    </span>
                  </template>
                  <span v-else class="tag-empty">─</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" class="status-badge">
                  <span class="status-dot" :class="statusDotColor[row.status]" />
                  {{ statusLabels[row.status] || row.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          class="completeness-tag"
                          :class="row.translation ? 'has' : 'missing'">
                          译
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {{ row.translation ? '有翻译' : '无翻译' }}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          class="completeness-tag"
                          :class="row.appreciation ? 'has' : 'missing'">
                          赏
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {{ row.appreciation ? '有赏析' : '无赏析' }}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ formatDateTime(row.created_at) }}
              </TableCell>
              <TableCell class="text-right">
                <TableAction
                  :actions="[
                    {
                      text: '查看',
                      icon: Eye,
                      onClick: () => onView(row as Poetry),
                    },
                    {
                      text: '编辑',
                      icon: Pencil,
                      onClick: () => onEdit(row as Poetry),
                    },
                    {
                      text: '发布',
                      ifShow: row.status === 'draft',
                      onClick: () => onPublish(row as Poetry),
                    },
                    {
                      text: '归档',
                      ifShow: row.status === 'published',
                      onClick: () => onArchive(row as Poetry),
                    },
                  ]"
                  :dropdown-actions="[
                    {
                      text: '删除',
                      icon: Trash2,
                      danger: true,
                      confirm: {
                        title: `确定删除「${row.title}」吗？`,
                        confirm: () => onDelete(row as Poetry),
                      },
                    },
                  ]"
                  align="center" />
              </TableCell>
            </TableRow>

            <!-- 空状态 -->
            <TableRow v-if="data.length === 0">
              <TableCell colspan="11" class="h-64">
                <div class="empty-state">
                  <Search class="h-12 w-12 text-muted-foreground/30" />
                  <p class="empty-title">暂无数据</p>
                  <p class="empty-desc">
                    {{ hasActiveFilters ? '没有找到匹配的诗歌，试试调整筛选条件' : '还没有录入任何诗歌' }}
                  </p>
                  <Button
                    v-if="!hasActiveFilters"
                    size="sm"
                    class="mt-4"
                    @click="onCreate">
                    <Plus class="mr-2 h-4 w-4" />
                    录入诗歌
                  </Button>
                  <Button
                    v-else
                    size="sm"
                    variant="outline"
                    class="mt-4"
                    @click="handleReset">
                    重置筛选
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>

      <!-- 分页 -->
      <div v-if="!loading && data.length > 0" class="table-pagination">
        <Pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-size-options="[10, 20, 50, 100]"
          @update:current="handlePageChange"
          @update:page-size="handlePageSizeChange" />
      </div>
    </div>

    <!-- 批量标签弹窗 -->
    <Dialog v-model:open="batchTagDialogVisible">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ batchTagMode === 'add' ? '批量添加标签' : '批量移除标签' }}</DialogTitle>
          <DialogDescription>
            已选 {{ selectedRowKeys.length }} 首诗歌
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 搜索/选择标签 -->
          <div class="space-y-2">
            <Input
              v-model="batchTagKeyword"
              placeholder="搜索标签..."
              class="h-9" />
            <div class="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              <button
                v-for="[tag, count] in batchTagList"
                :key="tag"
                class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                :class="batchTagSelected.has(tag) ? 'bg-primary/10 text-primary' : ''"
                @click="batchTagSelected.has(tag) ? batchTagSelected.delete(tag) : batchTagSelected.add(tag)">
                <span class="flex items-center gap-1.5">
                  <TagIcon class="h-3 w-3" />
                  {{ tag }}
                </span>
                <span class="text-xs text-muted-foreground">{{ count }}首</span>
              </button>
              <div v-if="batchTagList.length === 0" class="py-4 text-center text-sm text-muted-foreground">
                暂无标签数据
              </div>
            </div>
          </div>
          <!-- 已选标签 -->
          <div v-if="batchTagSelected.size > 0" class="flex flex-wrap gap-1">
            <span
              v-for="tag in batchTagSelected"
              :key="tag"
              class="tag-chip cursor-pointer"
              title="点击移除"
              @click="batchTagSelected.delete(tag)">
              {{ tag }}
              <X class="ml-1 h-3 w-3" />
            </span>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="batchTagDialogVisible = false">
            取消
          </Button>
          <Button :loading="batchTagSubmitting" @click="handleBatchTagSubmit">
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 查看弹窗 -->
    <Dialog v-model:open="viewDialogOpen">
      <DialogContent v-if="viewDetail" class="max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <BookOpen class="h-5 w-5" />
            {{ viewDetail.title_sc || viewDetail.title }}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 元信息 -->
          <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span class="flex items-center gap-1">
              <Calendar class="h-4 w-4" />
              {{ viewDetail.dynasty || '未知朝代' }}
            </span>
            <span>{{ viewDetail.author_sc || viewDetail.author || '佚名' }}</span>
            <Badge variant="secondary">
              {{ statusLabels[viewDetail.status] || viewDetail.status }}
            </Badge>
          </div>

          <!-- 分类和标签 -->
          <div class="flex flex-wrap gap-4">
            <div v-if="viewDetail.category_name" class="flex items-center gap-1.5 text-sm">
              <FolderOpen class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">分类：</span>
              <span class="font-medium text-foreground">{{ viewDetail.category_name }}</span>
            </div>
            <div v-if="viewDetail.tags && viewDetail.tags.length > 0" class="flex items-center gap-1.5 text-sm">
              <TagIcon class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">标签：</span>
              <div class="flex items-center gap-1">
                <span v-for="tag in viewDetail.tags" :key="tag" class="tag-chip">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- 内容 -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">诗词内容</h4>
            <div class="poetry-content">
              {{ viewDetail.content_sc || viewDetail.content }}
            </div>
          </div>
          <!-- 翻译 -->
          <div v-if="viewDetail.translation" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">翻译</h4>
            <p class="text-sm whitespace-pre-wrap">{{ viewDetail.translation }}</p>
          </div>
          <!-- 赏析 -->
          <div v-if="viewDetail.appreciation" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">赏析</h4>
            <p class="text-sm whitespace-pre-wrap">{{ viewDetail.appreciation }}</p>
          </div>
          <!-- 来源 -->
          <div v-if="viewDetail.source" class="text-xs text-muted-foreground">
            来源：{{ viewDetail.source }}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* ===== 搜索框 ===== */
.search-wrap {
  position: relative;
  width: 220px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  pointer-events: none;
}

.search-input {
  padding-left: 34px;
  padding-right: 28px;
}

/* ===== 清除按钮 ===== */
.search-clear-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  transition: all 0.15s;
}

.search-clear-btn:hover {
  background: var(--color-muted);
  color: var(--color-foreground);
}

/* ===== 搜索范围切换 ===== */
.search-scope-group {
  display: inline-flex;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
}

.search-scope-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.search-scope-btn:hover {
  background: oklch(0.97 0.005 80 / 0.5);
}

.search-scope-btn.active {
  background: var(--color-primary);
  color: var(--color-primary-foreground, oklch(0.98 0.005 80));
}

/* ===== 筛选单选按钮 ===== */
.filter-radio-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-radio-btn:hover {
  border-color: var(--color-muted-foreground);
  color: var(--color-foreground);
}

.filter-radio-btn.active {
  border-color: var(--color-primary);
  background: oklch(from var(--color-primary) l c h / 0.08);
  color: var(--color-primary);
}

.dark .filter-radio-btn.active {
  background: oklch(from var(--color-primary) l c h / 0.15);
}

/* ===== 筛选标签 ===== */
.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 400;
  height: auto;
}

/* ===== 标题 ===== */
.poetry-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  line-height: 1.4;
}

/* ===== 内容预览 ===== */
.poetry-excerpt {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  line-height: 1.5;
}

/* ===== 朝代标签 ===== */
.dynasty-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: oklch(0.95 0.01 75);
  color: oklch(0.4 0.02 60);
}

.dark .dynasty-tag {
  background: oklch(0.2 0.01 60);
  color: oklch(0.75 0.02 70);
}

/* ===== 标签 Chip ===== */
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  background: oklch(from var(--color-primary) l c h / 0.08);
  color: var(--color-primary);
  white-space: nowrap;
  transition: background-color 0.15s;
}

.tag-chip:hover {
  background: oklch(from var(--color-primary) l c h / 0.15);
}

.dark .tag-chip {
  background: oklch(from var(--color-primary) l c h / 0.15);
}

.dark .tag-chip:hover {
  background: oklch(from var(--color-primary) l c h / 0.25);
}

/* ===== 标签溢出 ===== */
.tag-overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-muted);
  color: var(--color-muted-foreground);
}

/* ===== 无标签占位 ===== */
.tag-empty {
  font-size: 12px;
  color: oklch(0.55 0.005 60 / 0.4);
}

/* ===== 状态标签 ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* ===== 批量操作栏 ===== */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: oklch(0.97 0.005 80 / 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
  min-height: 0;
}

.dark .batch-bar {
  background: oklch(0.15 0.008 60 / 0.95);
}

/* ===== 数据行 ===== */
.data-row {
  transition: background-color 0.15s ease;
}

.data-row:hover {
  background: oklch(0.97 0.005 80 / 0.4);
}

.dark .data-row:hover {
  background: oklch(0.18 0.008 60 / 0.4);
}

/* ===== 加载态 ===== */
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.empty-title {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-foreground);
}

.empty-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  text-align: center;
  max-width: 300px;
}

/* ===== 分页 ===== */
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

/* ===== 完整度标签 ===== */
.completeness-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.completeness-tag.has {
  color: oklch(0.5 0.1 145);
  background: oklch(0.7 0.1 145 / 0.12);
}

.completeness-tag.missing {
  color: oklch(0.55 0.005 60 / 0.4);
  background: oklch(0.95 0.005 60 / 0.4);
}

.dark .completeness-tag.has {
  color: oklch(0.75 0.1 145);
  background: oklch(0.7 0.1 145 / 0.18);
}

.dark .completeness-tag.missing {
  color: oklch(0.5 0.005 60 / 0.4);
  background: oklch(0.2 0.01 60 / 0.4);
}

/* ===== 查看弹窗 ===== */
.poetry-content {
  padding: 16px;
  background: oklch(0.97 0.005 80 / 0.5);
  border-radius: 8px;
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  line-height: 2;
  white-space: pre-wrap;
}

.dark .poetry-content {
  background: oklch(0.18 0.008 60 / 0.5);
}
</style>
