/**
 * 偏好设置 Store
 * 替代 @vben/preferences
 *
 * 管理主题、暗色模式、语言、紧凑模式等用户偏好
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { DEFAULT_LOCALE, PREFERENCES_KEY } from '#/constants';
import type { SupportedLocale } from '#/constants';

/** 主题模式 */
type ThemeMode = 'light' | 'dark' | 'system';

/** 应用配置 */
interface AppPreferences {
  /** 应用名称 */
  name: string;
  /** 标题 */
  title: string;
  /** 语言 */
  locale: SupportedLocale;
  /** 主题模式 */
  themeMode: ThemeMode;
  /** 紧凑模式 */
  compact: boolean;
  /** 水印启用 */
  watermark: boolean;
  /** 水印内容 */
  watermarkContent: string;
  /** 默认首页路径 */
  defaultHomePath: string;
  /** 默认头像 */
  defaultAvatar: string;
  /** 动态标题 */
  dynamicTitle: boolean;
  /** 登录过期模式 */
  loginExpiredMode: 'modal' | 'page';
  /** 启用 token 刷新 */
  enableRefreshToken: boolean;
  /** 访问模式 */
  accessMode: 'frontend' | 'backend';
  /** Logo 图片地址 */
  logo: string;
  /** 暗色模式 Logo */
  logoDark: string;
}

/** 过渡动画配置 */
interface TransitionPreferences {
  /** 启用进度条 */
  progress: boolean;
  /** 启用页面切换动画 */
  animation: boolean;
}

/** 默认偏好设置 */
const defaultAppPreferences: AppPreferences = {
  accessMode: 'frontend',
  compact: false,
  defaultAvatar: '',
  defaultHomePath: '/dashboard',
  dynamicTitle: true,
  enableRefreshToken: true,
  locale: DEFAULT_LOCALE,
  loginExpiredMode: 'modal',
  logo: '',
  logoDark: '',
  name: import.meta.env.VITE_APP_TITLE || '晓诗管理后台',
  themeMode: 'system',
  title: import.meta.env.VITE_APP_TITLE || '晓诗管理后台',
  watermark: false,
  watermarkContent: '',
};

const defaultTransitionPreferences: TransitionPreferences = {
  animation: true,
  progress: true,
};

/** 从 localStorage 加载偏好设置 */
function loadPreferences(): {
  app: AppPreferences;
  transition: TransitionPreferences;
} {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        app: { ...defaultAppPreferences, ...parsed.app },
        transition: { ...defaultTransitionPreferences, ...parsed.transition },
      };
    } catch {
      // 解析失败，使用默认值
    }
  }
  return {
    app: { ...defaultAppPreferences },
    transition: { ...defaultTransitionPreferences },
  };
}

export const usePreferencesStore = defineStore('preferences', () => {
  const stored = loadPreferences();

  /** 应用配置 */
  const app = ref<AppPreferences>(stored.app);

  /** 过渡动画配置 */
  const transition = ref<TransitionPreferences>(stored.transition);

  /** 当前主题（计算后的实际主题） */
  const currentTheme = ref<'light' | 'dark'>(resolveTheme(app.value.themeMode));

  /** 设置应用配置 */
  function setAppPreferences(
    partial: Partial<AppPreferences>,
    persist = true,
  ): void {
    app.value = { ...app.value, ...partial };
    if (partial.themeMode) {
      currentTheme.value = resolveTheme(partial.themeMode);
    }
    if (persist) {
      savePreferences();
    }
  }

  /** 设置过渡动画配置 */
  function setTransitionPreferences(
    partial: Partial<TransitionPreferences>,
    persist = true,
  ): void {
    transition.value = { ...transition.value, ...partial };
    if (persist) {
      savePreferences();
    }
  }

  /** 设置语言 */
  function setLocale(locale: SupportedLocale): void {
    app.value.locale = locale;
    savePreferences();
  }

  /** 切换主题模式 */
  function setThemeMode(mode: ThemeMode): void {
    app.value.themeMode = mode;
    currentTheme.value = resolveTheme(mode);
    applyTheme(currentTheme.value);
    savePreferences();
  }

  /** 切换暗色模式 */
  function toggleDarkMode(): void {
    const newMode = currentTheme.value === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  }

  /** 设置紧凑模式 */
  function setCompact(compact: boolean): void {
    app.value.compact = compact;
    document.documentElement.classList.toggle('compact', compact);
    savePreferences();
  }

  /** 设置水印 */
  function setWatermark(enable: boolean, content?: string): void {
    app.value.watermark = enable;
    if (content !== undefined) {
      app.value.watermarkContent = content;
    }
    savePreferences();
  }

  /** 重置为默认设置 */
  function $reset(): void {
    app.value = { ...defaultAppPreferences };
    transition.value = { ...defaultTransitionPreferences };
    currentTheme.value = resolveTheme(app.value.themeMode);
    applyTheme(currentTheme.value);
    savePreferences();
  }

  /** 持久化到 localStorage */
  function savePreferences(): void {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        app: app.value,
        transition: transition.value,
      }),
    );
  }

  /** 应用主题到 DOM */
  function applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.setAttribute('data-theme', theme);
    root.classList.add(theme);
  }

  /** 监听系统主题变化 */
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (app.value.themeMode === 'system') {
        currentTheme.value = resolveTheme('system');
        applyTheme(currentTheme.value);
      }
    });
  }

  // 初始化应用主题
  applyTheme(currentTheme.value);

  return {
    app,
    currentTheme,
    transition,
    $reset,
    setAppPreferences,
    setCompact,
    setLocale,
    setThemeMode,
    setTransitionPreferences,
    setWatermark,
    toggleDarkMode,
  };
});

/** 解析主题模式为实际主题 */
function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

// ==================== 兼容 @vben/preferences 的 API ====================

/**
 * 初始化偏好设置（兼容 @vben/preferences 的 initPreferences）
 * 本项目的 Store 会在首次使用时自动从 localStorage 加载，
 * 此函数仅确保 Store 提前初始化并应用主题
 * @param pinia - 可选的 Pinia 实例（在组件 setup 外使用时传入）
 */
export function initPreferences(pinia?: any) {
  // 触发 Store 初始化（读取 localStorage、应用主题）
  usePreferencesStore(pinia);
}

/**
 * 偏好设置 Composable（兼容 @vben/preferences 的 usePreferences）
 * 返回响应式的 isDark 等常用状态
 * @param pinia - 可选的 Pinia 实例（在组件 setup 外使用时传入）
 */
export function usePreferences(pinia?: any) {
  const store = usePreferencesStore(pinia);
  const isDark = computed(() => store.currentTheme === 'dark');
  const isCompact = computed(() => store.app.compact);
  return { isDark, isCompact };
}

/** 兼容 @vben/preferences 的导出方式 */
export const preferences = {
  _store: undefined as ReturnType<typeof usePreferencesStore> | undefined,
  setStore(store: ReturnType<typeof usePreferencesStore>) {
    preferences._store = store;
  },
  app: {
    get accessMode() {
      return preferences._store!.app.accessMode;
    },
    get compact() {
      return preferences._store!.app.compact;
    },
    get defaultAvatar() {
      return preferences._store!.app.defaultAvatar;
    },
    get defaultHomePath() {
      return preferences._store!.app.defaultHomePath;
    },
    get dynamicTitle() {
      return preferences._store!.app.dynamicTitle;
    },
    get enableRefreshToken() {
      return preferences._store!.app.enableRefreshToken;
    },
    get locale() {
      return preferences._store!.app.locale;
    },
    get loginExpiredMode() {
      return preferences._store!.app.loginExpiredMode;
    },
    get name() {
      return preferences._store!.app.name;
    },
    get logo() {
      const store = preferences._store!;
      return {
        source: store.app.logo,
        sourceDark: store.app.logoDark,
      };
    },
    get themeMode() {
      return preferences._store!.app.themeMode;
    },
    get title() {
      return preferences._store!.app.title;
    },
    get watermark() {
      return preferences._store!.app.watermark;
    },
    get watermarkContent() {
      return preferences._store!.app.watermarkContent;
    },
  },
  transition: {
    get animation() {
      return preferences._store!.transition.animation;
    },
    get progress() {
      return preferences._store!.transition.progress;
    },
  },
};
