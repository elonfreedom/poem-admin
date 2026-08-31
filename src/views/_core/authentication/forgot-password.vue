<script lang="ts" setup>
import { Button } from '#/components/ui/button';

import { MailIcon } from '@lucide/vue';
import { useRouter } from 'vue-router';

import { $t } from '#/locales';

defineOptions({ name: 'ForgotPassword' });

const router = useRouter();
</script>

<template>
  <div class="space-y-4">
    <!-- 图标 -->
    <div class="flex justify-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <MailIcon class="h-6 w-6 text-primary" />
      </div>
    </div>

    <!-- 提示文案 -->
    <div class="text-center">
      <p class="text-sm text-muted-foreground">
        {{ $t('page.auth.forgotPasswordDesc') }}
      </p>
    </div>

    <!-- 返回按钮 -->
    <Button variant="outline" class="w-full" @click="router.push('/auth/login')">
      {{ $t('page.auth.login') }}
    </Button>
  </div>
</template>
