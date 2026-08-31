<script lang="ts" setup>
import type { OverviewStats } from '#/api';

import { onMounted, ref } from 'vue';

import { getOverviewStatsApi } from '#/api';

import {
  BookOpen,
  Eye,
  Flame,
  Users,
  Wallet,
} from 'lucide-vue-next';

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
  { key: 'total_users', label: '总用户数', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'total_poems', label: '总诗歌数', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'total_views', label: '总浏览量', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'today_active', label: '今日活跃', icon: Flame, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'today_checkin', label: '今日打卡', icon: Wallet, color: 'text-pink-600', bg: 'bg-pink-50' },
];
</script>

<template>
  <div>
    <h2 class="mb-6 text-lg font-semibold">数据总览</h2>

    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <!-- 统计卡片 -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
        <div :class="['flex h-12 w-12 items-center justify-center rounded-lg', card.bg]">
          <component :is="card.icon" :class="['h-6 w-6', card.color]" />
        </div>
        <div>
          <div class="text-2xl font-bold text-foreground">
            {{ stats[card.key as keyof OverviewStats] }}
          </div>
          <div class="text-sm text-muted-foreground">{{ card.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
