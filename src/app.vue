<script lang="ts" setup>
import { watch } from 'vue';

import { Toaster } from '#/components/ui/sonner';

import { usePreferences } from '#/stores/preferences';

import '#/styles/globals.css';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();

// 同步暗色模式到 document.documentElement
watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle('dark', dark);
  },
  { immediate: true },
);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <RouterView />
    <Toaster />
  </div>
</template>
