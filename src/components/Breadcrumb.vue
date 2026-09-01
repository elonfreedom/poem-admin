<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { ChevronRight, Home } from 'lucide-vue-next';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb';
import { $t } from '#/locales';

const route = useRoute();

/** 面包屑数据 */
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(
    (item) => item.meta?.title && !item.meta?.hideInBreadcrumb,
  );

  return matched.map((item) => ({
    path: item.path,
    title: $t(item.meta?.title as string),
    clickable: item.path !== route.path,
  }));
});
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink
          class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          @click="$router.push('/')">
          <Home class="h-3.5 w-3.5" />
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>
        <ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
      </BreadcrumbSeparator>
      <BreadcrumbItem v-for="(item, index) in breadcrumbs" :key="item.path">
        <template v-if="index < breadcrumbs.length - 1 && item.clickable">
          <BreadcrumbLink
            class="text-muted-foreground hover:text-foreground"
            @click="$router.push(item.path)">
            {{ item.title }}
          </BreadcrumbLink>
          <BreadcrumbSeparator>
            <ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
          </BreadcrumbSeparator>
        </template>
        <BreadcrumbPage v-else>
          {{ item.title }}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>
