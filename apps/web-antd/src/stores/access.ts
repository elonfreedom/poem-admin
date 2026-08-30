/**
 * 权限访问 Store
 * 替代 @vben/stores 中的 useAccessStore
 *
 * 管理 accessToken、accessCodes、登录过期状态等
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

import { TOKEN_KEY } from '#/constants';

import type { AccessCode } from '#/constants';

export const useAccessStore = defineStore('access', () => {
  /** 访问令牌 */
  const accessToken = ref<string | null>(
    localStorage.getItem(TOKEN_KEY) || null,
  );

  /** 权限码列表 */
  const accessCodes = ref<AccessCode[]>([]);

  /** 登录是否过期 */
  const loginExpired = ref(false);

  /** 是否已检查过权限（用于路由守卫） */
  const isAccessChecked = ref(false);

  /** 可访问的路由 */
  const accessRoutes = ref<any[]>([]);

  /** 可访问的菜单 */
  const accessMenus = ref<any[]>([]);

  /** 设置 accessToken */
  function setAccessToken(token: string | null): void {
    accessToken.value = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  /** 设置权限码 */
  function setAccessCodes(codes: AccessCode[]): void {
    accessCodes.value = codes;
  }

  /** 设置登录过期状态 */
  function setLoginExpired(expired: boolean): void {
    loginExpired.value = expired;
  }

  /** 设置权限检查状态 */
  function setIsAccessChecked(checked: boolean): void {
    isAccessChecked.value = checked;
  }

  /** 设置可访问路由 */
  function setAccessRoutes(routes: any[]): void {
    accessRoutes.value = routes;
  }

  /** 设置可访问菜单 */
  function setAccessMenus(menus: any[]): void {
    accessMenus.value = menus;
  }

  /** 检查是否有指定权限码 */
  function hasAccessCode(code: AccessCode): boolean {
    return accessCodes.value.includes(code);
  }

  /** 重置 store */
  function $reset(): void {
    accessToken.value = null;
    accessCodes.value = [];
    loginExpired.value = false;
    isAccessChecked.value = false;
    accessRoutes.value = [];
    accessMenus.value = [];
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    accessCodes,
    accessMenus,
    accessRoutes,
    accessToken,
    isAccessChecked,
    loginExpired,
    $reset,
    hasAccessCode,
    setAccessCodes,
    setAccessMenus,
    setAccessRoutes,
    setAccessToken,
    setIsAccessChecked,
    setLoginExpired,
  };
});
