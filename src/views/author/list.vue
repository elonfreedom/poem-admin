<script lang="ts" setup>
import type { Author, AuthorListParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { ArrowDown, ArrowDownUp, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { Pagination } from '#/components/ui/pagination';
import { useTable } from '#/composables/useTable';
import { deleteAuthorApi, getAuthorListApi } from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

/** 搜索筛选 */
const keyword = ref('');

/** 排序状态 */
type SortField = 'poem_count' | 'created_at' | 'id' | 'name';
type SortOrder = 'asc' | 'desc';

const sortField = ref<SortField | null>(null);
const sortOrder = ref<SortOrder>('desc');

/** 表格数据 */
const { data, loading, pagination, refresh, setFilters } = useTable<Author>({
  fetchData: async ({ page, pageSize }) => {
    const params: AuthorListParams = {
      page,
      page_size: pageSize,
      keyword: keyword.value || undefined,
      ...(sortField.value && { sort_field: sortField.value, sort_order: sortOrder.value }),
    };
    return await getAuthorListApi(params);
  },
  immediate: true,
});

/** 点击表头排序 */
function handleSort(field: SortField) {
  if (sortField.value === field) {
    // 同一字段：升 → 降 → 取消
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc';
    } else {
      sortField.value = null;
      sortOrder.value = 'desc';
    }
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  refresh();
}

/** 搜索 */
function handleSearch() {
  setFilters({});
}

/** 重置筛选 */
function handleReset() {
  keyword.value = '';
  sortField.value = null;
  sortOrder.value = 'desc';
  setFilters({});
}

/** 排序图标 */
function sortIcon(field: SortField) {
  if (sortField.value !== field) return ArrowDownUp;
  return sortOrder.value === 'asc' ? ArrowUp : ArrowDown;
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

/** 手动加载数据 */
async function loadListData() {
  const params: AuthorListParams = {
    page: pagination.value.current,
    page_size: pagination.value.pageSize,
    keyword: keyword.value || undefined,
  };
  const result = await getAuthorListApi(params);
  data.value = result.items;
  pagination.value.total = result.total;
}

function onCreate() {
  router.push('/author/create');
}

function onEdit(row: Author) {
  router.push(`/author/${row.id}/edit`);
}

function onDelete(row: Author) {
  deleteAuthorApi(row.id)
    .then(() => {
      toast.success(`「${row.name}」已删除`);
      refresh();
    })
    .catch(() => {});
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="作者管理">
      <template #extra>
        <Button @click="onCreate">
          <Plus class="mr-2 h-4 w-4" />
          添加作者
        </Button>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Input
        v-model="keyword"
        placeholder="搜索姓名或朝代"
        class="w-48"
        @keyup.enter="handleSearch" />
      <Button variant="outline" @click="handleReset">重置</Button>
      <Button @click="handleSearch">搜索</Button>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50">
            <TableHead class="w-[80px] cursor-pointer select-none" @click="handleSort('id')">
              <span class="inline-flex items-center gap-1">
                ID
                <component :is="sortIcon('id')" class="h-3.5 w-3.5" :class="sortField === 'id' ? 'text-primary' : 'text-muted-foreground/50'" />
              </span>
            </TableHead>
            <TableHead class="w-[120px] cursor-pointer select-none" @click="handleSort('name')">
              <span class="inline-flex items-center gap-1">
                姓名
                <component :is="sortIcon('name')" class="h-3.5 w-3.5" :class="sortField === 'name' ? 'text-primary' : 'text-muted-foreground/50'" />
              </span>
            </TableHead>
            <TableHead class="w-[120px]">繁体</TableHead>
            <TableHead class="w-[100px]">朝代</TableHead>
            <TableHead class="w-[100px] cursor-pointer select-none" @click="handleSort('poem_count')">
              <span class="inline-flex items-center gap-1">
                诗歌数
                <component :is="sortIcon('poem_count')" class="h-3.5 w-3.5" :class="sortField === 'poem_count' ? 'text-primary' : 'text-muted-foreground/50'" />
              </span>
            </TableHead>
            <TableHead>简介</TableHead>
            <TableHead class="w-[180px] cursor-pointer select-none" @click="handleSort('created_at')">
              <span class="inline-flex items-center gap-1">
                创建时间
                <component :is="sortIcon('created_at')" class="h-3.5 w-3.5" :class="sortField === 'created_at' ? 'text-primary' : 'text-muted-foreground/50'" />
              </span>
            </TableHead>
            <TableHead class="w-[150px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="8" class="h-32 text-center text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="data.length === 0">
            <TableCell colspan="8" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-else v-for="row in data" :key="row.id">
            <TableCell>{{ row.id }}</TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.name_traditional || '-' }}</TableCell>
            <TableCell>{{ row.dynasty }}</TableCell>
            <TableCell>
              <span class="font-medium tabular-nums">{{ row.poem_count ?? 0 }}</span>
            </TableCell>
            <TableCell>{{ row.biography || '-' }}</TableCell>
            <TableCell>{{ formatDateTime(row.created_at) }}</TableCell>
            <TableCell class="text-right">
              <TableAction
                :actions="[
                  {
                    text: '编辑',
                    icon: Pencil,
                    onClick: () => onEdit(row as Author),
                  },
                ]"
                :dropdown-actions="[
                  {
                    text: '删除',
                    icon: Trash2,
                    danger: true,
                    confirm: {
                      title: `确定删除「${row.name}」吗？`,
                      confirm: () => onDelete(row as Author),
                    },
                  },
                ]"
                align="center" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <div v-if="data.length > 0" class="flex justify-end">
      <Pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-size-options="[10, 20, 50, 100]"
        @update:current="handlePageChange"
        @update:page-size="handlePageSizeChange" />
    </div>
  </div>
</template>
