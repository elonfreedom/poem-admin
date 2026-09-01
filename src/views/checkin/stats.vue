<script lang="ts" setup>
import type { CheckinStats } from '#/api';

import { onMounted, ref } from 'vue';

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
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
import { getCheckinStatsApi } from '#/api';
import dayjs from 'dayjs';

const loading = ref(false);
const startDate = ref(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
const endDate = ref(dayjs().format('YYYY-MM-DD'));

const stats = ref<CheckinStats>({
  daily_avg_rate: 0,
  retention_7d: 0,
  total_checkins: 0,
  total_users: 0,
  hot_poems: [],
});

async function fetchStats() {
  loading.value = true;
  try {
    stats.value = await getCheckinStatsApi({
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
    });
  } finally {
    loading.value = false;
  }
}

function handleDateChange() {
  fetchStats();
}

const statCards = [
  {
    key: 'daily_avg_rate',
    label: '日均打卡率',
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    color: 'text-blue-600',
  },
  {
    key: 'retention_7d',
    label: '7日留存',
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    color: 'text-green-600',
  },
  {
    key: 'total_checkins',
    label: '总打卡次数',
    format: (v: number) => v.toLocaleString(),
    color: 'text-amber-600',
  },
  {
    key: 'total_users',
    label: '打卡用户数',
    format: (v: number) => v.toLocaleString(),
    color: 'text-cyan-600',
  },
];

onMounted(fetchStats);
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="打卡数据统计" />

    <!-- 日期范围筛选 -->
    <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <span class="text-sm text-muted-foreground">日期范围：</span>
      <Input
        v-model="startDate"
        type="date"
        class="w-40"
        @change="handleDateChange"
      />
      <span class="text-muted-foreground">至</span>
      <Input
        v-model="endDate"
        type="date"
        class="w-40"
        @change="handleDateChange"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <template v-else>
      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card v-for="card in statCards" :key="card.key" class="text-center">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">
              {{ card.label }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold" :class="card.color">
              {{ card.format(stats[card.key as keyof CheckinStats] as number) }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 热门打卡诗文排行 -->
      <Card>
        <CardHeader>
          <CardTitle>热门打卡诗文</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[80px] text-center">排名</TableHead>
                <TableHead>诗文</TableHead>
                <TableHead class="w-[120px] text-center">打卡次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(poem, index) in stats.hot_poems" :key="poem.poem_id">
                <TableCell class="text-center font-medium">{{ index + 1 }}</TableCell>
                <TableCell>{{ poem.poem_title }}</TableCell>
                <TableCell class="text-center">{{ poem.checkin_count.toLocaleString() }}</TableCell>
              </TableRow>
              <TableRow v-if="stats.hot_poems.length === 0">
                <TableCell colspan="3" class="h-32 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
