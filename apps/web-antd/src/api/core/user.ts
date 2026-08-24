import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 前端 App 用户（role=user）
 */
export interface FrontendUser {
  id: string;
  nickname: string;
  email?: null | string;
  role?: 'user';
  status?: 'active' | 'disabled' | string;
  created_at: string;
  updated_at?: string;
  // 统计数据（后端详情接口直接返回在用户对象上）
  total_checkin_days?: number;
  consecutive_days?: number;
  favorite_count?: number;
  reading_plan_count?: number;
  passkey_count?: number;
  // 兼容旧格式
  stats?: {
    consecutive_days: number;
    favorites_count: number;
    passkeys_count: number;
    reading_plans_count: number;
    total_checkin_days: number;
  };
}

/**
 * 用户列表请求参数
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'active' | 'disabled';
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  total: number;
  list: FrontendUser[];
}

/**
 * 更新用户状态请求
 */
export interface UpdateUserStatusParams {
  status: 'active' | 'disabled';
}

/**
 * 获取前端用户列表
 */
export async function getFrontendUserListApi(params?: UserListParams) {
  return requestClient.get<UserListResponse>('/users', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
      keyword: params?.keyword,
      status: params?.status,
    },
  });
}

/**
 * 获取前端用户详情
 */
export async function getFrontendUserDetailApi(id: string) {
  return requestClient.get<FrontendUser>(`/users/${id}`);
}

/**
 * 更新用户状态（禁用/启用）
 */
export async function updateUserStatusApi(
  id: string,
  data: UpdateUserStatusParams,
) {
  return requestClient.put<FrontendUser>(`/users/${id}/status`, data);
}

/**
 * 获取用户信息（后台管理员）
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}
