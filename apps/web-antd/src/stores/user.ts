/**
 * 用户信息 Store
 * 替代 @vben/stores 中的 useUserStore
 *
 * 管理当前登录用户的基本信息
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

import { USER_INFO_KEY } from '#/constants';

import type { UserInfo } from '#/types';

export const useUserStore = defineStore('user', () => {
  /** 用户信息 */
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null'),
  );

  /** 设置用户信息 */
  function setUserInfo(info: UserInfo | null): void {
    userInfo.value = info;
    if (info) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(USER_INFO_KEY);
    }
  }

  /** 重置 store */
  function $reset(): void {
    userInfo.value = null;
    localStorage.removeItem(USER_INFO_KEY);
  }

  return {
    userInfo,
    $reset,
    setUserInfo,
  };
});
