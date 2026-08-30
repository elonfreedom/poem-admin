<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button, Result } from 'ant-design-vue';

const router = useRouter();
</script>

<template>
  <Result
    status="info"
    title="即将上线"
    sub-title="该功能正在开发中，敬请期待"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/')">返回首页</Button>
    </template>
  </Result>
</template>
