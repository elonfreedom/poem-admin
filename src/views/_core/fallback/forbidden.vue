<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button } from '#/components/ui/button';

defineOptions({ name: 'Forbidden' });

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <div class="text-6xl font-bold text-muted-foreground/30">403</div>
    <h1 class="mt-4 text-xl font-semibold">无权限访问</h1>
    <p class="mt-2 text-sm text-muted-foreground">抱歉，您没有权限访问此页面</p>
    <Button class="mt-6" @click="router.push('/')">返回首页</Button>
  </div>
</template>
