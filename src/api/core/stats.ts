import { requestClient } from '#/api/request';

export interface OverviewStats {
  total_users: number;
  total_poems: number;
  total_views: number;
  today_active: number;
  today_checkin: number;
}

export interface DailyStat {
  date: string;
  new_users: number;
  active_users: number;
  views: number;
  checkin: number;
}

export interface HotPoetry {
  id: number;
  title: string;
  author: string;
  views: number;
}

export interface UserGrowth {
  date: string;
  new_users: number;
  total_users: number;
}

export async function getOverviewStatsApi() {
  return requestClient.get<OverviewStats>('/stats/overview');
}

export async function getDailyStatsApi(params: {
  end_date?: string;
  start_date?: string;
}) {
  return requestClient.get<DailyStat[]>('/stats/daily', { params });
}

export async function getHotPoetryApi(params?: {
  end_date?: string;
  start_date?: string;
}) {
  return requestClient.get<HotPoetry[]>('/stats/poems/hot', { params });
}

export async function getUserGrowthApi(params?: {
  end_date?: string;
  start_date?: string;
}) {
  return requestClient.get<UserGrowth[]>('/stats/users/growth', { params });
}
