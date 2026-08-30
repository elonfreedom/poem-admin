<script lang="ts" setup>
import type { CheckinStats } from '#/api';

import { onMounted, ref } from 'vue';

import { getCheckinStatsApi } from '#/api';

import dayjs from 'dayjs';

const loading = ref(false);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(29, 'day'),
  dayjs(),
]);

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
    const [start, end] = dateRange.value;
    stats.value = await getCheckinStatsApi({
      start_date: start ? start.format('YYYY-MM-DD') : undefined,
      end_date: end ? end.format('YYYY-MM-DD') : undefined,
    });
  } finally {
    loading.value = false;
  }
}

function onDateChange(value: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) {
  if (value && value[0] && value[1]) {
    dateRange.value = [value[0], value[1]];
    fetchStats();
  }
}

const statCards = [
  {
    key: 'daily_avg_rate',
    label: '日均打卡率',
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    color: '#1677ff',
  },
  {
    key: 'retention_7d',
    label: '7日留存',
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    color: '#52c41a',
  },
  {
    key: 'total_checkins',
    label: '总打卡次数',
    format: (v: number) => v.toLocaleString(),
    color: '#faad14',
  },
  {
    key: 'total_users',
    label: '打卡用户数',
    format: (v: number) => v.toLocaleString(),
    color: '#13c2c2',
  },
];

onMounted(fetchStats);
</script>

<template>
  <div class="p-5">
    <h2 class="mb-4 text-lg font-semibold">打卡数据统计</h2>

    <!-- 日期范围筛选 -->
    <div class="mb-4">
      <a-range-picker
        :value="dateRange"
        value-format="YYYY-MM-DD"
        @change="onDateChange"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <a-spin />
    </div>

    <template v-else>
      <!-- 统计卡片 -->
      <a-row :gutter="[16, 16]">
        <a-col v-for="card in statCards" :key="card.key" :span="6">
          <a-card :bordered="false" class="text-center">
            <div class="text-2xl font-bold" :style="{ color: card.color }">
              {{ card.format(stats[card.key as keyof CheckinStats] as number) }}
            </div>
            <div class="mt-1 text-gray-500">{{ card.label }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 热门打卡诗文排行 -->
      <a-card :bordered="false" class="mt-4" title="热门打卡诗文">
        <a-table
          :data-source="stats.hot_poems"
          :pagination="false"
          row-key="poem_id"
          size="middle"
        >
          <a-table-column title="排名" :width="80" align="center">
            <template #default="{ index }">
              {{ index + 1 }}
            </template>
          </a-table-column>
          <a-table-column
            title="诗文"
            data-index="poem_title"
            key="poem_title"
          />
          <a-table-column
            title="打卡次数"
            data-index="checkin_count"
            key="checkin_count"
            :width="120"
            align="center"
          />
        </a-table>
      </a-card>
    </template>
  </div>
</template>
