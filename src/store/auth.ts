import type { Recordable } from '#/types';
import type { UserInfo } from '#/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { toast } from 'vue-sonner';

import { type AccessCode, LOGIN_PATH, LOGIN_REDIRECT_PATH } from '#/constants';
import { resetAllStores } from '#/lib/stores';
import { useAccessStore } from '#/stores/access';
import { useUserStore } from '#/stores/user';

import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

/** 登录错误类型 */
interface LoginError {
  message: string;
}

/**
 * 解析登录错误为友好提示
 * 根据后端返回的状态码/错误码映射到差异化提示
 */
function parseLoginError(error: any): LoginError {
  const status = error?.response?.status;
  const code = error?.response?.data?.code ?? error?.data?.code;
  const backendMsg = error?.response?.data?.error || error?.response?.data?.message;

  // 根据 HTTP 状态码判断
  if (status === 401 || code === 401) {
    return { message: '密码错误，请重试' };
  }
  if (status === 404 || code === 404) {
    return { message: '该用户名不存在' };
  }
  if (status === 403 || code === 403) {
    return { message: '账号已被锁定，请联系管理员' };
  }
  // 无响应 = 网络异常
  if (!error?.response) {
    return { message: '网络异常，请检查网络连接' };
  }
  // 兜底：使用后端返回的消息
  return { message: backendMsg || '登录失败，请稍后重试' };
}

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * @param params 登录表单数据
   * @returns { userInfo, error } 成功时 error 为 null，失败时 userInfo 为 null
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ): Promise<{ userInfo: UserInfo | null; error: LoginError | null }> {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { access_token } = await loginApi(params);

      if (access_token) {
        accessStore.setAccessToken(access_token);

        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes as AccessCode[]);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(LOGIN_REDIRECT_PATH);
        }

        if (userInfo?.realName) {
          toast.success($t('authentication.loginSuccess'), {
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
          });
        }
      }

      return { userInfo, error: null };
    } catch (error: any) {
      const loginError = parseLoginError(error);
      return { userInfo: null, error: loginError };
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
