<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button } from '#/components/ui/button';

defineOptions({ name: 'NotFound' });

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <div class="text-6xl font-bold text-muted-foreground/30">404</div>
    <h1 class="mt-4 text-xl font-semibold">页面不存在</h1>
    <p class="mt-2 text-sm text-muted-foreground">抱歉，您访问的页面不存在</p>
    <Button class="mt-6" @click="router.push('/')">返回首页</Button>
  </div>
</template>
