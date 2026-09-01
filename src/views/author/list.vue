<script lang="ts" setup>
import type { Author, AuthorListParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Pencil, Plus, Trash2 } from 'lucide-vue-next';

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
import { useTable } from '#/composables/useTable';
import { deleteAuthorApi, getAuthorListApi } from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

/** 搜索筛选 */
const keyword = ref('');

/** 表格数据 */
const { data, refresh, setFilters } = useTable<Author>({
  fetchData: async ({ page, pageSize }) => {
    const params: AuthorListParams = {
      page,
      page_size: pageSize,
      keyword: keyword.value || undefined,
    };
    return await getAuthorListApi(params);
  },
  immediate: true,
});

/** 搜索 */
function handleSearch() {
  setFilters({});
}

/** 重置筛选 */
function handleReset() {
  keyword.value = '';
  setFilters({});
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
            <TableHead class="w-[80px]">ID</TableHead>
            <TableHead class="w-[120px]">姓名</TableHead>
            <TableHead class="w-[120px]">繁体</TableHead>
            <TableHead class="w-[100px]">朝代</TableHead>
            <TableHead>简介</TableHead>
            <TableHead class="w-[180px]">创建时间</TableHead>
            <TableHead class="w-[150px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in data" :key="row.id">
            <TableCell>{{ row.id }}</TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.name_traditional || '-' }}</TableCell>
            <TableCell>{{ row.dynasty }}</TableCell>
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
          <TableRow v-if="data.length === 0">
            <TableCell colspan="7" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
