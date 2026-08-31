import type { App } from 'vue';

import {
  $t,
  setupI18n as coreSetupI18n,
} from '#/plugins/i18n';
import { usePreferencesStore } from '#/stores/preferences';

import dayjs from 'dayjs';

/**
 * 加载 dayjs 的语言包
 */
async function loadDayjsLocale(lang: string) {
  let locale;
  switch (lang) {
    case 'en-US': {
      locale = await import('dayjs/locale/en');
      break;
    }
    case 'zh-CN': {
      locale = await import('dayjs/locale/zh-cn');
      break;
    }
    default: {
      locale = await import('dayjs/locale/en');
    }
  }
  if (locale) {
    dayjs.locale(locale);
  } else {
    console.error(`Failed to load dayjs locale for ${lang}`);
  }
}

/**
 * 初始化国际化
 */
async function setupI18n(app: App) {
  await coreSetupI18n(app);
  const preferencesStore = usePreferencesStore();
  await loadDayjsLocale(preferencesStore.app.locale);
}

export { $t, setupI18n };
