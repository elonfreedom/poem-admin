import { createApp, watchEffect } from 'vue';

import { usePreferencesStore } from '#/stores/preferences';
import { initStores } from '#/lib/stores';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';

import App from './app.vue';

async function bootstrap() {
  const app = createApp(App);

  // 全局错误处理器 - 捕获路由切换时的组件卸载错误
  app.config.errorHandler = (err, instance, info) => {
    // 忽略路由切换时的 null type 错误（已知的 Vue 3 问题）
    if (err instanceof TypeError && err.message.includes('Cannot read properties of null')) {
      console.warn('[Vue Error] Ignored during route transition:', err.message);
      return;
    }
    console.error('[Vue Error]', err, info);
  };

  // 配置 pinia-store（必须在最前面，因为后续所有 store 访问都依赖它）
  const pinia = initStores(app);

  // 获取偏好设置 store（必须在 setupI18n 和路由导入之前）
  const preferencesStore = usePreferencesStore(pinia);

  // 国际化 i18n 配置（依赖 preferences store 的语言设置）
  await setupI18n(app);

  // 动态导入路由
  const { router } = await import('./router');

  // 配置路由及路由守卫
  app.use(router);

  // 动态更新标题
  watchEffect(() => {
    if (preferencesStore.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title as
        | string
        | undefined;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferencesStore.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
