<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Loader2Icon } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { cn } from '#/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  /** 加载状态：显示 spinner 并禁用点击 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  loading: false,
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :data-loading="loading"
    :as="as"
    :as-child="asChild"
    :aria-busy="loading"
    :disabled="loading ? true : undefined"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <Loader2Icon
      v-if="loading"
      class="mr-2 h-4 w-4 animate-spin"
    />
    <slot />
  </Primitive>
</template>
