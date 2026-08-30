import { requestClient } from '#/api/request';

/**
 * 打卡记录
 */
export interface CheckinRecord {
  id: string;
  user_id: string;
  nickname: string;
  checkin_date: string;
  poem_id: number;
  poem_title: string;
  consecutive_days: number;
  created_at: string;
}

/**
 * 打卡记录列表请求参数
 */
export interface CheckinListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 打卡记录列表响应
 */
export interface CheckinListResponse {
  items: CheckinRecord[];
  total: number;
}

/**
 * 热门打卡诗文
 */
export interface HotPoem {
  poem_id: number;
  poem_title: string;
  checkin_count: number;
}

/**
 * 打卡数据统计响应
 */
export interface CheckinStats {
  daily_avg_rate: number;
  retention_7d: number;
  total_checkins: number;
  total_users: number;
  hot_poems: HotPoem[];
}

/**
 * 获取打卡记录列表
 */
export async function getCheckinListApi(params?: CheckinListParams) {
  return requestClient.get<CheckinListResponse>('/checkins', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
      keyword: params?.keyword,
      start_date: params?.start_date,
      end_date: params?.end_date,
    },
  });
}

/**
 * 获取打卡数据统计
 */
export async function getCheckinStatsApi(params?: {
  end_date?: string;
  start_date?: string;
}) {
  return requestClient.get<CheckinStats>('/stats/checkin', { params });
}
