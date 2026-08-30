<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button, Result } from 'ant-design-vue';

const router = useRouter();
</script>

<template>
  <Result
    status="warning"
    title="网络异常"
    sub-title="请检查您的网络连接后重试"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
