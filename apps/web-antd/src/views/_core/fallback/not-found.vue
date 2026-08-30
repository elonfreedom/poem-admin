<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button, Result } from 'ant-design-vue';

defineOptions({ name: 'Fallback404Demo' });

const router = useRouter();
</script>

<template>
  <Result
    status="404"
    title="404"
    sub-title="抱歉，您访问的页面不存在"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
