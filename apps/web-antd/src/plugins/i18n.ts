/**
 * vue-i18n 国际化配置
 * 替代 @vben/locales
 *
 * 依赖：vue-i18n（需安装）
 */

import type { App } from 'vue';
import type { I18nOptions, LocaleMessages, VueMessageType } from 'vue-i18n';

import { createI18n } from 'vue-i18n';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '#/constants';
import { usePreferencesStore } from '#/stores/preferences';

/** i18n 实例 */
let i18n: ReturnType<typeof createI18n> | null = null;

/** 从 JSON 文件加载语言包 */
const loadMessages = async (
  locale: string,
): Promise<LocaleMessages<VueMessageType>> => {
  const messages: LocaleMessages<VueMessageType> = {};

  try {
    // 动态加载所有 JSON 语言文件
    const modules = import.meta.glob('#/locales/langs/**/*.json');
    const pattern = `#/locales/langs/${locale}/.*\\.json$`;

    for (const [path, loader] of Object.entries(modules)) {
      if (new RegExp(pattern).test(path)) {
        const data = (await loader()) as { default: VueMessageType };
        const fileName = path.split('/').pop()?.replace('.json', '') || '';
        messages[fileName] = data.default;
      }
    }
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error);
  }

  return messages;
};

/** 扁平化嵌套的语言包（兼容 $t('page.dashboard.title') 写法） */
const flattenMessages = (
  messages: LocaleMessages<VueMessageType>,
  prefix = '',
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenMessages(value as any, newKey));
    } else {
      result[newKey] = value as string;
    }
  }

  return result;
};

/** 获取当前语言 */
export function getCurrentLocale(): SupportedLocale {
  const preferencesStore = usePreferencesStore();
  return preferencesStore.app.locale;
}

/** 切换语言 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`);
    return;
  }

  if (!i18n) {
    return;
  }

  // 加载语言包
  const messages = await loadMessages(locale);
  const flatMessages = flattenMessages(messages);

  i18n.global.setLocaleMessage(locale, flatMessages);
  i18n.global.locale = locale;

  // 持久化
  const preferencesStore = usePreferencesStore();
  preferencesStore.setLocale(locale);

  // 更新 html lang 属性
  document.querySelector('html')?.setAttribute('lang', locale);
}

/** 翻译函数（兼容 $t 用法） */
export function $t(key: string, defaultValue?: string): string {
  if (!i18n) {
    return defaultValue || key;
  }
  const translate = i18n.global.t as (key: string) => string;
  const translation = translate(key);
  // vue-i18n 找不到翻译时会返回 key 本身
  return translation === key ? defaultValue || key : translation;
}

/** 初始化 i18n */
export async function setupI18n(app: App): Promise<void> {
  const preferencesStore = usePreferencesStore();
  const currentLocale = preferencesStore.app.locale || DEFAULT_LOCALE;

  // 加载初始语言包
  const messages = await loadMessages(currentLocale);
  const flatMessages = flattenMessages(messages);

  const options: I18nOptions = {
    legacy: false,
    locale: currentLocale,
    fallbackLocale: DEFAULT_LOCALE,
    messages: {
      [currentLocale]: flatMessages,
    },
    missingWarn: !import.meta.env.PROD,
    silentTranslationWarn: true,
  };

  i18n = createI18n(options);

  app.use(i18n);

  // 设置 html lang
  document.querySelector('html')?.setAttribute('lang', currentLocale);
}

export { i18n };
export type { SupportedLocale as SupportedLanguagesType } from '#/constants';
