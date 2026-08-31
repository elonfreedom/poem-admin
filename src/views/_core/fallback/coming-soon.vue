<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Construction } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <Construction class="h-16 w-16 text-muted-foreground/30" />
    <h1 class="mt-4 text-xl font-semibold">即将上线</h1>
    <p class="mt-2 text-sm text-muted-foreground">该功能正在开发中，敬请期待</p>
    <Button class="mt-6" @click="router.push('/')">返回首页</Button>
  </div>
</template>
