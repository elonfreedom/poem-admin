<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button, Result } from 'ant-design-vue';

defineOptions({ name: 'Fallback500Demo' });

const router = useRouter();
</script>

<template>
  <Result
    status="500"
    title="500"
    sub-title="抱歉，服务器发生错误"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
