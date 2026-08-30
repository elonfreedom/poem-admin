<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button, Result } from 'ant-design-vue';

defineOptions({ name: 'Fallback403Demo' });

const router = useRouter();
</script>

<template>
  <Result
    status="403"
    title="403"
    sub-title="抱歉，您没有权限访问此页面"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
