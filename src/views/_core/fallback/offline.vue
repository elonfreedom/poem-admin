<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { WifiOff } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <WifiOff class="h-16 w-16 text-muted-foreground/30" />
    <h1 class="mt-4 text-xl font-semibold">网络异常</h1>
    <p class="mt-2 text-sm text-muted-foreground">请检查您的网络连接后重试</p>
    <Button class="mt-6" @click="router.push('/')">返回首页</Button>
  </div>
</template>
