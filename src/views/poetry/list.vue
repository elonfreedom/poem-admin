<script lang="ts" setup >
import type { Poetry, PoetryListParams } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  BookOpen,
  Calendar,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Checkbox } from '#/components/ui/checkbox';
import { Input } from '#/components/ui/input';
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

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { Pagination } from '#/components/ui/pagination';
import { useTable } from '#/composables/useTable';
import {
  batchUpdatePoetryStatusApi,
  deletePoetryApi,
  getPoetryListApi,
  updatePoetryStatusApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

/** 状态选项（"__all__" 表示全部，避免 reka-ui SelectItem 空字符串问题） */
const statusOptions = [
  { label: '全部', value: '__all__' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

const statusVariant: Record<string, string> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

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

/** 朝代选项（"__all__" 表示全部，避免 reka-ui SelectItem 空字符串问题） */
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

/** 搜索类型 */
type SearchScope = 'all' | 'title' | 'author';

const searchScopeOptions: { label: string; value: SearchScope }[] = [
  { label: '全部', value: 'all' },
  { label: '标题', value: 'title' },
  { label: '作者', value: 'author' },
];

/** 搜索筛选 */
const keyword = ref('');
const searchScope = ref<SearchScope>('all');
const dynasty = ref<string>('');
const status = ref<string>('');
const hasTranslation = ref<string>('__all__');
const hasAppreciation = ref<string>('__all__');

const completenessOptions = [
  { label: '全部', value: '__all__' },
  { label: '有', value: 'true' },
  { label: '无', value: 'false' },
];

/** 选中行 */
const selectedRowKeys = ref<number[]>([]);

/** 表格数据 */
const { data, loading, pagination, refresh, setFilters } = useTable<Poetry>({
  fetchData: async ({ page, pageSize }) => {
    const params: PoetryListParams = {
      page,
      page_size: pageSize,
      keyword: keyword.value || undefined,
      search_scope: searchScope.value === 'all' ? undefined : searchScope.value,
      dynasty: dynasty.value === '__all__' ? undefined : dynasty.value,
      status: status.value === '__all__' ? undefined : status.value,
      has_translation: hasTranslation.value === '__all__' ? undefined : (hasTranslation.value as 'true' | 'false'),
      has_appreciation: hasAppreciation.value === '__all__' ? undefined : (hasAppreciation.value as 'true' | 'false'),
    };
    return await getPoetryListApi(params);
  },
  defaultPageSize: 20,
  immediate: true,
});

/** 是否全选 */
const isAllSelected = computed({
  get: () =>
    data.value.length > 0 &&
    selectedRowKeys.value.length === data.value.length,
  set: (val: boolean) => {
    selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
  },
});

/** 处理全选 Checkbox 变化（reka-ui 可能发出 "indeterminate"） */
function setAllSelected(val: boolean) {
  selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
}

/** 是否有选中 */
const hasSelection = computed(() => selectedRowKeys.value.length > 0);

/** 处理单行 Checkbox 变化 */
function setRowSelected(row: Poetry, val: boolean) {
  const index = selectedRowKeys.value.indexOf(row.id);
  if (val && index === -1) {
    selectedRowKeys.value.push(row.id);
  } else if (!val && index > -1) {
    selectedRowKeys.value.splice(index, 1);
  }
}

/** 是否某行已选中 */
function isRowSelected(row: Poetry): boolean {
  return selectedRowKeys.value.includes(row.id);
}

/** 搜索框 placeholder */
const searchPlaceholder = computed(() => {
  const map: Record<SearchScope, string> = {
    all: '搜索标题或作者...',
    title: '搜索标题...',
    author: '搜索作者...',
  };
  return map[searchScope.value];
});

/** 搜索 */
function handleSearch() {
  setFilters({});
}

/** 重置筛选 */
function handleReset() {
  keyword.value = '';
  searchScope.value = 'all';
  dynasty.value = '__all__';
  status.value = '__all__';
  hasTranslation.value = '__all__';
  hasAppreciation.value = '__all__';
  selectedRowKeys.value = [];
  setFilters({});
}

/** 筛选变化自动搜索 */
watch([dynasty, status, hasTranslation, hasAppreciation], () => {
  setFilters({});
});

/** 操作处理 */
function onCreate() {
  router.push('/poetry/create');
}

function onEdit(row: Poetry) {
  router.push(`/poetry/${row.id}/edit`);
}

/** 查看弹窗 */
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

function onBatchConvert() {
  router.push('/tools');
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
  const params: PoetryListParams = {
    page: pagination.value.current,
    page_size: pagination.value.pageSize,
    keyword: keyword.value || undefined,
    search_scope: searchScope.value === 'all' ? undefined : searchScope.value,
    dynasty: dynasty.value || undefined,
    status: status.value || undefined,
  };
  const result = await getPoetryListApi({
    ...params,
    has_translation: hasTranslation.value === '__all__' ? undefined : (hasTranslation.value as 'true' | 'false'),
    has_appreciation: hasAppreciation.value === '__all__' ? undefined : (hasAppreciation.value as 'true' | 'false'),
  });
  data.value = result.items;
  pagination.value.total = result.total;
}

/** 截断内容 */
function truncate(text: string, len: number): string {
  if (!text) return '-';
  return text.length > len ? text.slice(0, len) + '...' : text;
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="诗歌管理">
      <template #description>
        管理诗词内容，支持录入、编辑、发布、归档等操作
      </template>
      <template #extra>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="onBatchConvert">
            <Wrench class="mr-2 h-4 w-4" />
            工具
          </Button>
          <Button size="sm" @click="onCreate">
            <Plus class="mr-2 h-4 w-4" />
            录入诗歌
          </Button>
        </div>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="search-wrap">
            <Search class="search-icon" />
            <Input
              v-model="keyword"
              :placeholder="searchPlaceholder"
              class="search-input"
              @keyup.enter="handleSearch" />
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
          <Button size="sm" class="h-9" @click="handleSearch">
            <Search class="mr-1.5 h-3.5 w-3.5" />
            搜索
          </Button>
        </div>
        <Select v-model="dynasty">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="朝代" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in dynastyOptions"
              :key="opt.value"
              :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="status">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="hasTranslation">
          <SelectTrigger class="w-24">
            <SelectValue placeholder="翻译" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in completenessOptions"
              :key="opt.value"
              :value="opt.value">
              {{ opt.label === '全部' ? '翻译' : '翻译' + opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="hasAppreciation">
          <SelectTrigger class="w-24">
            <SelectValue placeholder="赏析" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in completenessOptions"
              :key="opt.value"
              :value="opt.value">
              {{ opt.label === '全部' ? '赏析' : '赏析' + opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" @click="handleReset">
          重置
        </Button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <!-- 批量操作栏（grid 模板行始终占位，避免跳动） -->
      <div class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out"
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
            <TableHead class="w-[50px]">
              <Checkbox
                :modelValue="isAllSelected"
                @update:modelValue="setAllSelected($event as boolean)" />
            </TableHead>
            <TableHead class="w-[60px]">ID</TableHead>
            <TableHead>标题</TableHead>
            <TableHead class="w-[90px]">作者</TableHead>
            <TableHead class="w-[70px]">朝代</TableHead>
            <TableHead class="w-[80px]">分类</TableHead>
            <TableHead class="w-[90px]">状态</TableHead>
            <TableHead class="w-[80px]">翻译/赏析</TableHead>
            <TableHead class="w-[160px]">创建时间</TableHead>
            <TableHead class="w-[160px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- 加载态 -->
          <TableRow v-if="loading">
            <TableCell colspan="9" class="h-64">
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
              <TableCell class="text-muted-foreground">{{ row.id }}</TableCell>
              <TableCell>
                <div class="max-w-[280px]">
                  <div class="font-medium truncate" :title="row.title_sc || row.title">
                    {{ row.title_sc || row.title }}
                  </div>
                  <div
                    v-if="row.content_sc || row.content"
                    class="mt-0.5 text-xs text-muted-foreground truncate"
                    :title="row.content_sc || row.content">
                    {{ truncate((row.content_sc || row.content).replace(/\n/g, ' '), 40) }}
                  </div>
                </div>
              </TableCell>
              <TableCell>{{ row.author_sc || row.author || '-' }}</TableCell>
              <TableCell>
                <span v-if="row.dynasty" class="dynasty-tag">{{ row.dynasty }}</span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>{{ row.category_name || '-' }}</TableCell>
              <TableCell>
                <Badge :variant="statusVariant[row.status] as any" class="status-badge">
                  <span class="status-dot" :class="statusDotColor[row.status]" />
                  {{ statusLabels[row.status] || row.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5">
                  <span
                    class="completeness-tag"
                    :class="row.translation ? 'has' : 'missing'"
                    :title="row.translation ? '有翻译' : '无翻译'">
                    译
                  </span>
                  <span
                    class="completeness-tag"
                    :class="row.appreciation ? 'has' : 'missing'"
                    :title="row.appreciation ? '有赏析' : '无赏析'">
                    赏
                  </span>
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
              <TableCell colspan="9" class="h-64">
                <div class="empty-state">
                  <Search class="h-12 w-12 text-muted-foreground/30" />
                  <p class="empty-title">暂无数据</p>
                  <p class="empty-desc">
                    {{ keyword || dynasty || status ? '没有找到匹配的诗歌，试试调整筛选条件' : '还没有录入任何诗歌' }}
                  </p>
                  <Button
                    v-if="!keyword && !dynasty && !status"
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
          <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1">
              <Calendar class="h-4 w-4" />
              {{ viewDetail.dynasty || '未知朝代' }}
            </span>
            <span>{{ viewDetail.author_sc || viewDetail.author || '佚名' }}</span>
            <Badge :variant="statusVariant[viewDetail.status] as any">
              {{ statusLabels[viewDetail.status] || viewDetail.status }}
            </Badge>
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
  width: 240px;
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

/* ===== 朝代标签 ===== */
.dynasty-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: oklch(0.95 0.01 75);
  color: oklch(0.4 0.02 60);
}

.dark .dynasty-tag {
  background: oklch(0.2 0.01 60);
  color: oklch(0.75 0.02 70);
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
/* grid rows 0fr→1fr 过渡，空间平滑展开/收起，不遮挡表头、不跳动 */
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

/* ===== 完整度标签（翻译/赏析） ===== */
.completeness-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 11px;
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
