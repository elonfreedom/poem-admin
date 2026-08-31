<script lang="ts" setup >
/**
 * 页面标题 + 操作区组件
 * 页面标题 + 操作区
 */
defineProps<{
  /** 页面标题 */
  title?: string;
  /** 副标题/描述 */
  description?: string;
}>();

defineSlots<{
  default?: () => any;
  extra?: () => any;
  /** 标题右侧操作区 */
  actions?: () => any;
}>();
</script>

<template>
  <div class="page-header">
    <div class="page-header-main">
      <div v-if="title || $slots.default" class="page-header-title">
        <slot>
          <h2 class="title-text">{{ title }}</h2>
        </slot>
      </div>
      <div v-if="description" class="page-header-description">
        {{ description }}
      </div>
    </div>
    <div v-if="$slots.extra || $slots.actions" class="page-header-extra">
      <slot name="extra" />
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header-main {
  flex: 1;
  min-width: 0;
}

.title-text {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-foreground);
}

.page-header-description {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
}

.page-header-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}
</style>
