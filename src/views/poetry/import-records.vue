<script lang="ts" setup >
import type {
  ImportRecord,
  ImportRecordStatus,
} from '#/api';

import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  ChevronRight,
  Download,
  FileUp,
  History,
  Inbox,
  Percent,
  Plus,
  RotateCcw,
  TriangleAlert,
} from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
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
  Pagination,
} from '#/components/ui/pagination';

import PageHeader from '#/components/PageHeader.vue';
import { useTable } from '#/composables/useTable';
import {
  getImportRecordsApi,
  getImportStatsApi,
} from '#/api';
import { downloadCsv, formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

// ==================== 状态选项 ====================

const statusOptions = [
  { label: '全部', value: '__all__' },
  { label: '处理中', value: 'processing' },
  { label: '成功', value: 'success' },
  { label: '部分成功', value: 'partial' },
  { label: '失败', value: 'failed' },
];

const statusLabels: Record<ImportRecordStatus, string> = {
  processing: '处理中',
  success: '成功',
  partial: '部分成功',
  failed: '失败',
};

const statusDotColor: Record<ImportRecordStatus, string> = {
  processing: 'bg-blue-500',
  success: 'bg-emerald-500',
  partial: 'bg-amber-500',
  failed: 'bg-red-500',
};

const statusTextColor: Record<ImportRecordStatus, string> = {
  processing: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  partial: 'text-amber-600 dark:text-amber-400',
  failed: 'text-red-600 dark:text-red-400',
};

// ==================== 筛选条件 ====================

const filterStatus = ref<string>('__all__');
const startDate = ref('');
const endDate = ref('');

// ==================== 统计数据 ====================

const stats = ref({
  total_imports: 0,
  total_poems: 0,
  total_success: 0,
  total_failed: 0,
  success_rate: 0,
});

const statsLoading = ref(false);

async function loadStats() {
  statsLoading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filterStatus.value !== '__all__') params.status = filterStatus.value;
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    stats.value = await getImportStatsApi(params);
  } catch {
    // error handled by interceptor
  } finally {
    statsLoading.value = false;
  }
}

// ==================== 表格数据 ====================

const {
  data,
  loading,
  pagination,
  refresh,
  setFilters,
} = useTable<ImportRecord>({
  fetchData: async ({ page, pageSize }) => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
    };
    if (filterStatus.value !== '__all__') {
      params.status = filterStatus.value as ImportRecordStatus;
    }
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    const result = await getImportRecordsApi(params);
    return result;
  },
  defaultPageSize: 20,
  immediate: false,
});

// 加载统计数据
loadStats();

// 初始加载表格数据
refresh();

// ==================== 自动刷新（处理中的记录） ====================

/** 是否有处理中的记录 */
const hasProcessing = computed(() => data.value.some((r) => r.status === 'processing'));

/** 自动刷新定时器 */
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

/** 有处理中记录时自动刷新 */
watch(hasProcessing, (processing) => {
  if (processing && !autoRefreshTimer) {
    autoRefreshTimer = setInterval(() => {
      refresh();
      loadStats();
    }, 3000);
  } else if (!processing && autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
});

// 页面卸载时清理定时器
onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
});

// ==================== 筛选操作 ====================

function handleSearch() {
  setFilters({});
  loadStats();
}

function handleReset() {
  filterStatus.value = '__all__';
  startDate.value = '';
  endDate.value = '';
  setFilters({});
  loadStats();
}

// ==================== 展开行 ====================

const expandedKeys = ref<Set<number>>(new Set());

function toggleExpand(id: number) {
  if (expandedKeys.value.has(id)) {
    expandedKeys.value.delete(id);
  } else {
    expandedKeys.value.add(id);
  }
}

function isExpanded(id: number): boolean {
  return expandedKeys.value.has(id);
}

// ==================== CSV 下载 ====================

function downloadFailedCsv(record: ImportRecord) {
  if (!record.errors.length) return;

  const header = ['行号', '标题', '错误原因'];
  const rows = record.errors.map((err) => [
    String(err.index + 1),
    err.title || '未知',
    err.error,
  ]);

  // CSV 转义：含逗号/引号/换行的字段用引号包裹
  const escape = (val: string) => {
    if (/[",\n]/.test(val)) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n');

  const timestamp = formatDateTime(record.created_at, 'YYYYMMDD_HHmm');
  downloadCsv(csv, `导入失败_${timestamp}.csv`);
  toast.success('下载成功');
}

// ==================== 分页 ====================

function handlePageChange(page: number) {
  pagination.value.current = page;
}

function handlePageSizeChange(size: number) {
  pagination.value.pageSize = size;
  pagination.value.current = 1;
}

// ==================== 辅助 ====================

function getSourceLabel(record: ImportRecord): string {
  if (record.file_name) return record.file_name;
  if (record.source) return record.source;
  return '手动导入';
}

/** 统计卡片配置 */
const statCards = computed(() => [
  {
    label: '导入次数',
    value: stats.value.total_imports,
    icon: History,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: '导入诗词',
    value: stats.value.total_poems,
    icon: FileUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    label: '成功率',
    value: `${stats.value.success_rate}%`,
    icon: Percent,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    label: '失败总数',
    value: stats.value.total_failed,
    icon: TriangleAlert,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
]);
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="导入记录">
      <template #description>
        查看历史导入记录，下载失败数据
      </template>
      <template #extra>
        <Button size="sm" @click="router.push('/poetry/batch')">
          <Plus class="mr-2 h-4 w-4" />
          新建导入
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        v-for="card in statCards"
        :key="card.label"
        class="border-border"
      >
        <CardContent class="flex items-center gap-4 p-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            :class="card.bg"
          >
            <component :is="card.icon" :class="['h-6 w-6', card.color]" />
          </div>
          <div class="min-w-0">
            <div class="truncate text-2xl font-bold tabular-nums">
              {{ card.value }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ card.label }}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 筛选栏 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 状态筛选 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">状态</span>
          <Select
            v-model="filterStatus"
            @update:model-value="handleSearch"
          >
            <SelectTrigger class="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in statusOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 日期范围 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">日期</span>
          <Input
            v-model="startDate"
            type="date"
            class="h-9 w-40"
          />
          <span class="text-muted-foreground">至</span>
          <Input
            v-model="endDate"
            type="date"
            class="h-9 w-40"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-2">
          <Button size="sm" class="h-9" @click="handleSearch">
            搜索
          </Button>
          <Button size="sm" variant="outline" class="h-9" @click="handleReset">
            <RotateCcw class="mr-1.5 h-3.5 w-3.5" />
            重置
          </Button>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="rounded-xl border border-border bg-card shadow-sm">
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12" />
              <TableHead>导入时间</TableHead>
              <TableHead>文件名/来源</TableHead>
              <TableHead class="text-right">总计</TableHead>
              <TableHead>进度</TableHead>
              <TableHead class="text-right">失败</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- 空状态 -->
            <TableRow v-if="!loading && data.length === 0">
              <TableCell colspan="8" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <Inbox class="h-12 w-12 text-muted-foreground/40" />
                  <div>
                    <div class="font-medium text-foreground">暂无导入记录</div>
                    <div class="mt-1 text-sm text-muted-foreground">
                      还没有进行过批量导入
                    </div>
                  </div>
                  <Button size="sm" variant="outline" @click="router.push('/poetry/batch')">
                    <Plus class="mr-2 h-4 w-4" />
                    开始导入
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <!-- 数据行 -->
            <template v-for="record in data" :key="record.id">
              <TableRow
                class="cursor-pointer hover:bg-muted/50"
                @click="toggleExpand(record.id)"
              >
                <TableCell>
                  <ChevronRight
                    class="h-4 w-4 text-muted-foreground transition-transform duration-200"
                    :class="{ 'rotate-90': isExpanded(record.id) }"
                  />
                </TableCell>
                <TableCell class="whitespace-nowrap text-sm tabular-nums">
                  {{ formatDateTime(record.created_at) }}
                </TableCell>
                <TableCell class="max-w-[200px] truncate text-sm">
                  {{ getSourceLabel(record) }}
                </TableCell>
                <TableCell class="text-right tabular-nums">
                  {{ record.total }}
                </TableCell>
                <TableCell class="min-w-[120px]">
                  <!-- 处理中：进度条 -->
                  <div v-if="record.status === 'processing'" class="flex items-center gap-2">
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-blue-500 transition-all duration-300"
                        :style="{ width: `${record.total > 0 ? Math.round((record.processed / record.total) * 100) : 0}%` }"
                      />
                    </div>
                    <span class="w-10 text-right text-xs tabular-nums text-blue-600 dark:text-blue-400">
                      {{ record.total > 0 ? Math.round((record.processed / record.total) * 100) : 0 }}%
                    </span>
                  </div>
                  <!-- 已完成：成功数 -->
                  <span v-else class="tabular-nums text-emerald-600 dark:text-emerald-400">
                    {{ record.success }}
                  </span>
                </TableCell>
                <TableCell class="text-right tabular-nums">
                  <span :class="record.failed > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''">
                    {{ record.failed }}
                  </span>
                </TableCell>
                <TableCell>
                  <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full" :class="statusDotColor[record.status]" />
                    <span :class="statusTextColor[record.status]">
                      {{ statusLabels[record.status] }}
                    </span>
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    v-if="record.errors.length > 0"
                    size="sm"
                    variant="ghost"
                    class="h-8"
                    @click.stop="downloadFailedCsv(record)"
                  >
                    <Download class="mr-1.5 h-3.5 w-3.5" />
                    下载失败
                  </Button>
                  <span v-else class="text-xs text-muted-foreground">
                    全部成功
                  </span>
                </TableCell>
              </TableRow>

              <!-- 展开详情行 -->
              <TableRow
                v-if="isExpanded(record.id)"
                class="bg-muted/30"
              >
                <td colspan="8" class="p-0">
                  <div class="grid grid-rows-[1fr] transition-[grid-template-rows] duration-200">
                    <div class="overflow-hidden">
                      <div class="border-t border-border p-4">
                        <div class="mb-3 flex items-center justify-between">
                          <span class="text-sm font-medium">
                            失败记录
                            <span class="text-muted-foreground">({{ record.errors.length }})</span>
                          </span>
                          <Button
                            v-if="record.errors.length > 0"
                            size="sm"
                            variant="outline"
                            @click="downloadFailedCsv(record)"
                          >
                            <Download class="mr-2 h-3.5 w-3.5" />
                            下载 CSV
                          </Button>
                        </div>
                        <div class="max-h-60 overflow-auto rounded-lg border border-border">
                          <table class="w-full text-sm">
                            <thead class="sticky top-0 bg-muted">
                              <tr>
                                <th class="px-3 py-2 text-left font-medium text-muted-foreground">行号</th>
                                <th class="px-3 py-2 text-left font-medium text-muted-foreground">标题</th>
                                <th class="px-3 py-2 text-left font-medium text-muted-foreground">错误原因</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="err in record.errors"
                                :key="err.index"
                                class="border-t border-border"
                              >
                                <td class="px-3 py-2 tabular-nums text-muted-foreground">
                                  #{{ err.index + 1 }}
                                </td>
                                <td class="px-3 py-2 font-medium">
                                  {{ err.title || '未知' }}
                                </td>
                                <td class="px-3 py-2 text-red-600 dark:text-red-400">
                                  {{ err.error }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>

      <!-- 分页 -->
      <div
        v-if="pagination.total > 0"
        class="flex items-center justify-end border-t border-border px-4 py-3"
      >
        <Pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @update:current="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>
