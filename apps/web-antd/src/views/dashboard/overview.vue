<script lang="ts" setup>
import type { OverviewStats } from '#/api';

import { onMounted, ref } from 'vue';

import { getOverviewStatsApi } from '#/api';

const loading = ref(false);
const stats = ref<OverviewStats>({
  total_users: 0,
  total_poems: 0,
  total_views: 0,
  today_active: 0,
  today_checkin: 0,
});

async function fetchStats() {
  loading.value = true;
  try {
    stats.value = await getOverviewStatsApi();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStats);

const statCards = [
  { key: 'total_users', label: '总用户数', color: '#1677ff' },
  { key: 'total_poems', label: '总诗歌数', color: '#52c41a' },
  { key: 'total_views', label: '总浏览量', color: '#faad14' },
  { key: 'today_active', label: '今日活跃', color: '#13c2c2' },
  { key: 'today_checkin', label: '今日打卡', color: '#eb2f96' },
];
</script>

<template>
  <div class="p-5">
    <h2 class="mb-4 text-lg font-semibold">{{ '数据总览' }}</h2>
    <div v-if="loading" class="flex justify-center py-10">
      <a-spin />
    </div>
    <a-row v-else :gutter="[16, 16]">
      <a-col v-for="card in statCards" :key="card.key" :span="4">
        <a-card :bordered="false" class="text-center">
          <div class="text-2xl font-bold" :style="{ color: card.color }">
            {{ stats[card.key as keyof OverviewStats] }}
          </div>
          <div class="mt-1 text-gray-500">{{ card.label }}</div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
