<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ServerCrash } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';

defineOptions({ name: 'InternalError' });

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <ServerCrash class="h-16 w-16 text-muted-foreground/30" />
    <div class="mt-4 text-6xl font-bold text-muted-foreground/30">500</div>
    <h1 class="mt-4 text-xl font-semibold">服务器错误</h1>
    <p class="mt-2 text-sm text-muted-foreground">抱歉，服务器发生错误</p>
    <Button class="mt-6" @click="router.push('/')">返回首页</Button>
  </div>
</template>
