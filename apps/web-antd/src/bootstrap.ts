import { createApp, watchEffect } from 'vue';

import { preferences, usePreferencesStore } from '#/stores/preferences';
import { initStores } from '#/lib/stores';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';

import App from './app.vue';

async function bootstrap() {
  const app = createApp(App);

  // 配置 pinia-store（必须在最前面，因为后续所有 store 访问都依赖它）
  const pinia = initStores(app);

  // 获取偏好设置 store 并设置引用（必须在 setupI18n 和路由导入之前）
  const preferencesStore = usePreferencesStore(pinia);
  preferences.setStore(preferencesStore);

  // 国际化 i18n 配置（依赖 preferences store 的语言设置）
  await setupI18n(app);

  // 动态导入路由（必须在 setStore 之后，因为路由定义中引用了 preferences.app.defaultHomePath）
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
