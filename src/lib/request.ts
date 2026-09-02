/**
 * Axios 请求客户端封装
 *
 * 功能：
 * - 请求/响应拦截器
 * - Token 注入
 * - 401 处理 / Token 刷新
 * - 统一错误处理
 *
 * - RequestClient 默认返回 response.data（HTTP 响应体）
 * - requestClient 额外添加拦截器，进一步解包业务数据（code===0 时返回 data.data）
 *
 * 依赖：axios（需安装）
 */

import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import axios from 'axios';
import { toast } from 'vue-sonner';

import { useAccessStore } from '#/stores/access';
import { usePreferencesStore } from '#/stores/preferences';
import { useAuthStore } from '#/store';

/** 响应数据格式 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  error: string | null;
  message: string;
}

/** 请求配置扩展 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否跳过响应拦截器，直接返回完整响应 */
  skipResponseInterceptor?: boolean;
  /** 是否跳过错误提示 */
  skipErrorTip?: boolean;
}

/**
 * 请求客户端类
 * 默认返回 response.data（HTTP 响应体）
 */
export class RequestClient {
  private instance: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    this.instance = axios.create({
      timeout: 180_000,
      headers: { 'Content-Type': 'application/json' },
      ...config,
    });

    // 默认响应拦截器：解包 AxiosResponse → 返回 response.data
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data as any;
      },
      (error) => Promise.reject(error),
    );
  }

  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config) as unknown as Promise<T>;
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config) as unknown as Promise<T>;
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config) as unknown as Promise<T>;
  }

  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config) as unknown as Promise<T>;
  }

  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config) as unknown as Promise<T>;
  }

  /** 获取内部 axios 实例（用于添加额外拦截器） */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

/** 401 处理：尝试刷新 token 或跳转登录 */
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

async function handle401(
  error: AxiosError<ApiResponse>,
  instance: AxiosInstance,
): Promise<any> {
  const accessStore = useAccessStore();
  const preferencesStore = usePreferencesStore();
  const originalRequest = error.config as RequestConfig;

  if (!originalRequest) {
    return Promise.reject(error);
  }

  if (
    preferencesStore.app.enableRefreshToken &&
    !isRefreshing &&
    !originalRequest.skipErrorTip
  ) {
    isRefreshing = true;

    try {
      const newToken = await refreshToken();
      accessStore.setAccessToken(newToken);

      refreshQueue.forEach(({ resolve, config }) => {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
        resolve(instance(config));
      });

      refreshQueue = [];

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return instance(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];

      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  if (isRefreshing && preferencesStore.app.enableRefreshToken) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ config: originalRequest, reject, resolve });
    });
  }

  redirectToLogin();
  return Promise.reject(error);
}

/** 刷新 token */
async function refreshToken(): Promise<string> {
  const { refreshTokenApi } = await import('#/api/core');
  const response = await refreshTokenApi();
  // RefreshTokenResult 结构为 { data: string, status: number }
  const newToken = response?.data || (response as unknown as string);
  if (!newToken || typeof newToken !== 'string') {
    throw new Error('Token refresh failed');
  }
  return newToken;
}

/** 跳转登录页 */
function redirectToLogin(): void {
  const accessStore = useAccessStore();
  const authStore = useAuthStore();
  const preferencesStore = usePreferencesStore();

  accessStore.setAccessToken(null);

  if (
    preferencesStore.app.loginExpiredMode === 'modal' &&
    accessStore.isAccessChecked
  ) {
    accessStore.setLoginExpired(true);
  } else {
    authStore.logout();
  }
}

/** API 基础地址 */
const apiURL =
  import.meta.env.VITE_GLOB_API_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

/** 基础请求客户端（仅解包 AxiosResponse → response.data，用于刷新 token / 登出等） */
export const baseRequestClient = new RequestClient({ baseURL: apiURL });

/** 带完整拦截器的请求客户端 */
export const requestClient = new RequestClient({ baseURL: apiURL });

// 为 requestClient 添加额外的请求/响应拦截器
{
  const axiosInstance = requestClient.getAxiosInstance();

  // ===== 请求拦截器：Token 注入 + 语言头 =====
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessStore = useAccessStore();
      const preferencesStore = usePreferencesStore();

      if (accessStore.accessToken) {
        config.headers.Authorization = `Bearer ${accessStore.accessToken}`;
      }

      config.headers['Accept-Language'] = preferencesStore.app.locale;

      return config;
    },
    (error) => Promise.reject(error),
  );

  // ===== 响应拦截器：业务数据解包 + 错误处理 =====
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response;

      if ((response.config as RequestConfig)?.skipResponseInterceptor) {
        return response as any;
      }

      if (data?.code !== undefined) {
        if (data.code === 0) {
          return data.data as any;
        } else {
          const errorMsg = data.error || data.message || '请求失败';
          if (!(response.config as RequestConfig)?.skipErrorTip) {
            toast.error(errorMsg);
          }
          return Promise.reject(new Error(errorMsg));
        }
      }

      return data as any;
    },
    async (error: AxiosError<ApiResponse>) => {
      const config = error.config as RequestConfig;

      if (error.response?.status === 401) {
        return handle401(error, axiosInstance);
      }

      const responseData = error.response?.data;
      const errorMsg =
        responseData?.error ||
        responseData?.message ||
        error.message ||
        '网络错误';

      if (!config?.skipErrorTip && errorMsg) {
        toast.error(errorMsg);
      }

      return Promise.reject(error);
    },
  );
}

export { requestClient as default };
