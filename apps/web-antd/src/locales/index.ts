import type { Locale } from 'ant-design-vue/es/locale';

import type { App } from 'vue';

import { ref } from 'vue';

import {
  $t,
  setupI18n as coreSetupI18n,
} from '#/plugins/i18n';
import { preferences } from '#/stores/preferences';

import antdEnLocale from 'ant-design-vue/es/locale/en_US';
import antdDefaultLocale from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';

const antdLocale = ref<Locale>(antdDefaultLocale);

/**
 * 加载dayjs的语言包
 * @param lang
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
    // 默认使用英语
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
 * 加载antd的语言包
 * @param lang
 */
async function loadAntdLocale(lang: string) {
  switch (lang) {
    case 'en-US': {
      antdLocale.value = antdEnLocale;
      break;
    }
    case 'zh-CN': {
      antdLocale.value = antdDefaultLocale;
      break;
    }
  }
}

/**
 * 加载第三方组件库的语言包
 * @param lang
 */
async function loadThirdPartyMessage(lang: string) {
  await Promise.all([loadAntdLocale(lang), loadDayjsLocale(lang)]);
}

/**
 * 初始化国际化
 * @param app
 */
async function setupI18n(app: App) {
  await coreSetupI18n(app);
  // 加载 antd / dayjs 等第三方语言包
  await loadThirdPartyMessage(preferences.app.locale);
}

export { $t, antdLocale, setupI18n };
