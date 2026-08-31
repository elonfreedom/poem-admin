<script lang="ts" setup>
import type { CheckinListParams, CheckinRecord } from '#/api';

import { ref } from 'vue';

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
import { useTable } from '#/composables/useTable';
import { getCheckinListApi } from '#/api';

/** 搜索筛选 */
const keyword = ref('');
const startDate = ref('');
const endDate = ref('');

/** 表格数据 */
const { data, setFilters } = useTable<CheckinRecord>({
  fetchData: async ({ page, pageSize }) => {
    const params: CheckinListParams = {
      page,
      pageSize,
      keyword: keyword.value || undefined,
    };
    if (startDate.value) {
      params.start_date = startDate.value;
    }
    if (endDate.value) {
      params.end_date = endDate.value;
    }
    return await getCheckinListApi(params);
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
  startDate.value = '';
  endDate.value = '';
  setFilters({});
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="打卡记录" />

    <!-- 筛选栏 -->
    <div class="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Input
        v-model="keyword"
        placeholder="请输入用户昵称"
        class="w-48"
        @keyup.enter="handleSearch" />
      <div class="flex items-center gap-2">
        <Input
          v-model="startDate"
          type="date" />
        <span class="text-muted-foreground">至</span>
        <Input
          v-model="endDate"
          type="date" />
      </div>
      <Button variant="outline" @click="handleReset">重置</Button>
      <Button @click="handleSearch">搜索</Button>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50">
            <TableHead>用户昵称</TableHead>
            <TableHead class="w-[140px]">打卡日期</TableHead>
            <TableHead>关联诗文</TableHead>
            <TableHead class="w-[100px]">连续天数</TableHead>
            <TableHead class="w-[180px]">创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in data" :key="row.id">
            <TableCell>{{ row.nickname }}</TableCell>
            <TableCell>{{ row.checkin_date }}</TableCell>
            <TableCell>{{ row.poem_title }}</TableCell>
            <TableCell>{{ row.consecutive_days }}</TableCell>
            <TableCell>{{ row.created_at }}</TableCell>
          </TableRow>
          <TableRow v-if="data.length === 0">
            <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
