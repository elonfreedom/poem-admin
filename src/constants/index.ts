/**
 * 全局常量定义
 * 路由常量、权限码等
 */

/** 登录页路径 */
export const LOGIN_PATH = '/auth/login';

/** 首页路径 */
export const HOME_PATH = '/dashboard';

/** 登录成功后默认跳转路径 */
export const LOGIN_REDIRECT_PATH = '/dashboard/overview';

/** 路由白名单（无需登录即可访问） */
export const ROUTE_WHITE_LIST: string[] = [LOGIN_PATH, '/register', '/forgot-password'];

/** 权限码定义 */
export const ACCESS_CODES = {
  /** 诗歌管理 */
  POEM_VIEW: 'poem:view',
  POEM_CREATE: 'poem:create',
  POEM_EDIT: 'poem:edit',
  POEM_DELETE: 'poem:delete',
  /** 用户管理 */
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  /** 系统配置 */
  CONFIG_EDIT: 'config:edit',
} as const;

/** 权限码类型 */
export type AccessCode = (typeof ACCESS_CODES)[keyof typeof ACCESS_CODES];

/** Token 存储 key */
export const TOKEN_KEY = 'admin_token';

/** 用户信息存储 key */
export const USER_INFO_KEY = 'admin_user_info';

/** 偏好设置存储 key */
export const PREFERENCES_KEY = 'app_preferences';

/** 记住用户名存储 key */
export const REMEMBER_USERNAME_KEY = 'admin_remember_username';

/** 默认语言 */
export const DEFAULT_LOCALE = 'zh-CN';

/** 支持的语言列表 */
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;

/** 语言类型 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
