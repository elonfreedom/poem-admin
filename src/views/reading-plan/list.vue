<script lang="ts" setup>
import type {
  ReadingPlan,
  ReadingPlanListParams,
} from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Eye,
  Pencil,
  Plus,
  Trash2,
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
  batchUpdateReadingPlanStatusApi,
  deleteReadingPlanApi,
  getReadingPlanListApi,
  updateReadingPlanStatusApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

// 状态选项（"__all__" 表示全部，避免 reka-ui SelectItem 空字符串问题）
const statusOptions = [
  { label: '全部状态', value: '__all__' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

// 难度选项（"__all__" 表示全部，避免 reka-ui SelectItem 空字符串问题）
const difficultyOptions = [
  { label: '全部难度', value: '__all__' },
  { label: '入门', value: 'beginner' },
  { label: '进阶', value: 'intermediate' },
  { label: '高级', value: 'advanced' },
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

const difficultyLabels: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

const difficultyVariant: Record<string, string> = {
  beginner: 'outline',
  intermediate: 'secondary',
  advanced: 'default',
};

// 搜索筛选
const keyword = ref('');
const status = ref<string>('');
const difficulty = ref<string>('');

// 选中行
const selectedRowKeys = ref<number[]>([]);

// 表格数据
const { data, loading, pagination, refresh, setFilters } = useTable<ReadingPlan>({
  fetchData: async ({ page, pageSize }) => {
    const params: ReadingPlanListParams = {
      page,
      page_size: pageSize,
      keyword: keyword.value || undefined,
      status: status.value === '__all__' ? undefined : status.value,
      difficulty: difficulty.value === '__all__' ? undefined : difficulty.value,
    };
    return await getReadingPlanListApi(params);
  },
  defaultPageSize: 20,
  immediate: true,
});

// 是否全选
const isAllSelected = computed({
  get: () =>
    data.value.length > 0 &&
    selectedRowKeys.value.length === data.value.length,
  set: (val: boolean) => {
    selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
  },
});

// 处理全选 Checkbox 变化
function setAllSelected(val: boolean) {
  selectedRowKeys.value = val ? data.value.map((r) => r.id) : [];
}

// 是否有选中
const hasSelection = computed(() => selectedRowKeys.value.length > 0);

// 处理单行 Checkbox 变化
function setRowSelected(row: ReadingPlan, val: boolean) {
  const index = selectedRowKeys.value.indexOf(row.id);
  if (val && index === -1) {
    selectedRowKeys.value.push(row.id);
  } else if (!val && index > -1) {
    selectedRowKeys.value.splice(index, 1);
  }
}

// 是否某行已选中
function isRowSelected(row: ReadingPlan): boolean {
  return selectedRowKeys.value.includes(row.id);
}

// 搜索
function handleSearch() {
  setFilters({});
}

// 重置筛选
function handleReset() {
  keyword.value = '';
  status.value = '__all__';
  difficulty.value = '__all__';
  selectedRowKeys.value = [];
  setFilters({});
}

// 筛选变化自动搜索
watch([status, difficulty], () => {
  setFilters({});
});

// 操作处理
function onCreate() {
  router.push('/reading-plan/create');
}

function onEdit(row: ReadingPlan) {
  router.push(`/reading-plan/${row.id}/edit`);
}

// 查看弹窗
const viewDialogOpen = ref(false);
const viewDetail = ref<ReadingPlan | null>(null);

function onView(row: ReadingPlan) {
  viewDetail.value = row;
  viewDialogOpen.value = true;
}

async function onPublish(row: ReadingPlan) {
  try {
    await updateReadingPlanStatusApi(row.id, 'published');
    toast.success('发布成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onArchive(row: ReadingPlan) {
  try {
    await updateReadingPlanStatusApi(row.id, 'archived');
    toast.success('归档成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

function onDelete(row: ReadingPlan) {
  deleteReadingPlanApi(row.id)
    .then(() => {
      toast.success(`「${row.title}」已删除`);
      refresh();
    })
    .catch(() => {});
}

async function onBatchPublish() {
  if (selectedRowKeys.value.length === 0) {
    toast.warning('请先选择要发布的计划');
    return;
  }
  try {
    await batchUpdateReadingPlanStatusApi(selectedRowKeys.value, 'published');
    toast.success('批量发布成功');
    selectedRowKeys.value = [];
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onBatchArchive() {
  if (selectedRowKeys.value.length === 0) {
    toast.warning('请先选择要归档的计划');
    return;
  }
  try {
    await batchUpdateReadingPlanStatusApi(selectedRowKeys.value, 'archived');
    toast.success('批量归档成功');
    selectedRowKeys.value = [];
    refresh();
  } catch {
    // error handled by interceptor
  }
}

// 分页变化
function handlePageChange(page: number) {
  pagination.value.current = page;
  loadListData();
}

// 每页条数变化
function handlePageSizeChange(size: number) {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
  loadListData();
}

// 手动加载数据（分页变化时调用）
async function loadListData() {
  const params: ReadingPlanListParams = {
    page: pagination.value.current,
    page_size: pagination.value.pageSize,
    keyword: keyword.value || undefined,
    status: status.value === '__all__' ? undefined : status.value,
    difficulty: difficulty.value === '__all__' ? undefined : difficulty.value,
  };
  const result = await getReadingPlanListApi(params);
  data.value = result.items;
  pagination.value.total = result.total;
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="阅读计划">
      <template #description>
        创建和管理主题化诗词阅读计划，引导用户系统学习
      </template>
      <template #extra>
        <Button size="sm" @click="onCreate">
          <Plus class="mr-2 h-4 w-4" />
          创建计划
        </Button>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <div class="search-wrap">
          <Input
            v-model="keyword"
            placeholder="搜索计划名称..."
            class="search-input"
            @keyup.enter="handleSearch" />
        </div>
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
        <Select v-model="difficulty">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in difficultyOptions"
              :key="opt.value"
              :value="opt.value">
              {{ opt.label }}
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
            <TableHead>计划名称</TableHead>
            <TableHead class="w-[80px]">难度</TableHead>
            <TableHead class="w-[80px] text-center">诗词数</TableHead>
            <TableHead class="w-[90px] text-center">参与人数</TableHead>
            <TableHead class="w-[90px]">状态</TableHead>
            <TableHead class="w-[160px]">创建时间</TableHead>
            <TableHead class="w-[180px] text-right">操作</TableHead>
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
                  <div class="font-medium truncate" :title="row.title">
                    {{ row.title }}
                  </div>
                  <div
                    v-if="row.description"
                    class="mt-0.5 text-xs text-muted-foreground truncate"
                    :title="row.description">
                    {{ row.description }}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge v-if="row.difficulty" :variant="difficultyVariant[row.difficulty] as any" class="difficulty-badge">
                  {{ difficultyLabels[row.difficulty] || row.difficulty }}
                </Badge>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-center font-medium">
                {{ row.poem_count }}
              </TableCell>
              <TableCell class="text-center">
                <span class="font-medium">{{ row.participant_count }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant[row.status] as any" class="status-badge">
                  {{ statusLabels[row.status] || row.status }}
                </Badge>
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
                      onClick: () => onView(row as ReadingPlan),
                    },
                    {
                      text: '编辑',
                      icon: Pencil,
                      onClick: () => onEdit(row as ReadingPlan),
                    },
                    {
                      text: '发布',
                      ifShow: row.status === 'draft',
                      onClick: () => onPublish(row as ReadingPlan),
                    },
                    {
                      text: '归档',
                      ifShow: row.status === 'published',
                      onClick: () => onArchive(row as ReadingPlan),
                    },
                  ]"
                  :dropdown-actions="[
                    {
                      text: '删除',
                      icon: Trash2,
                      danger: true,
                      confirm: {
                        title: `确定删除「${row.title}」吗？`,
                        confirm: () => onDelete(row as ReadingPlan),
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
                  <Pencil class="h-12 w-12 text-muted-foreground/30" />
                  <p class="empty-title">暂无阅读计划</p>
                  <p class="empty-desc">
                    {{ keyword || status || difficulty ? '没有找到匹配的计划，试试调整筛选条件' : '创建第一个阅读计划，让用户系统学习诗词' }}
                  </p>
                  <Button
                    v-if="!keyword && !status && !difficulty"
                    size="sm"
                    class="mt-4"
                    @click="onCreate">
                    <Plus class="mr-2 h-4 w-4" />
                    创建计划
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
            {{ viewDetail.title }}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 元信息 -->
          <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Badge :variant="difficultyVariant[viewDetail.difficulty] as any">
              {{ difficultyLabels[viewDetail.difficulty] || viewDetail.difficulty }}
            </Badge>
            <Badge :variant="statusVariant[viewDetail.status] as any">
              {{ statusLabels[viewDetail.status] || viewDetail.status }}
            </Badge>
          </div>
          <!-- 描述 -->
          <div v-if="viewDetail.description" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">计划描述</h4>
            <p class="text-sm whitespace-pre-wrap">{{ viewDetail.description }}</p>
          </div>
          <!-- 标签 -->
          <div v-if="viewDetail.tags && viewDetail.tags.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">标签</h4>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="tag in viewDetail.tags" :key="tag" variant="outline">
                {{ tag }}
              </Badge>
            </div>
          </div>
          <!-- 统计 -->
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-lg bg-muted p-3 text-center">
              <div class="text-lg font-semibold">{{ viewDetail.poem_count }}</div>
              <div class="text-xs text-muted-foreground">诗词数量</div>
            </div>
            <div class="rounded-lg bg-muted p-3 text-center">
              <div class="text-lg font-semibold">{{ viewDetail.participant_count }}</div>
              <div class="text-xs text-muted-foreground">参与人数</div>
            </div>
            <div class="rounded-lg bg-muted p-3 text-center">
              <div class="text-lg font-semibold">{{ viewDetail.completion_count }}</div>
              <div class="text-xs text-muted-foreground">完成人数</div>
            </div>
          </div>
          <!-- 时间 -->
          <div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>创建时间：{{ formatDateTime(viewDetail.created_at) }}</span>
            <span>更新时间：{{ formatDateTime(viewDetail.updated_at) }}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* ===== 搜索框 ===== */
.search-wrap {
  width: 240px;
}

.search-input {
  padding-left: 12px;
}

/* ===== 难度标签 ===== */
.difficulty-badge {
  font-size: 11px;
}

/* ===== 状态标签 ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
</style>
