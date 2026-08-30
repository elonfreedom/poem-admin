<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { ChevronRight } from 'lucide-vue-next';
import { Breadcrumb as ABreadcrumb, BreadcrumbItem } from 'ant-design-vue';

const route = useRoute();

/** 面包屑数据 */
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(
    (item) => item.meta?.title && !item.meta?.hideInBreadcrumb,
  );

  return matched.map((item) => ({
    path: item.path,
    title: item.meta?.title as string,
    // 最后一项不可点击
    clickable: item.path !== route.path,
  }));
});
</script>

<template>
  <ABreadcrumb class="breadcrumb">
    <BreadcrumbItem v-for="(item, index) in breadcrumbs" :key="item.path">
      <span v-if="index === breadcrumbs.length - 1 || !item.clickable">
        {{ item.title }}
      </span>
      <a
        v-else
        @click="$router.push(item.path)"
      >
        {{ item.title }}
      </a>
      <ChevronRight v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator" />
    </BreadcrumbItem>
  </ABreadcrumb>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.breadcrumb-separator {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin: 0 2px;
  color: rgba(0, 0, 0, 0.45);
  vertical-align: middle;
}
</style>
