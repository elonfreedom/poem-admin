import { requestClient } from '#/api/request';

/**
 * 阅读计划
 */
export interface ReadingPlan {
  id: number;
  title: string;
  description?: string;
  cover_url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  poem_count: number;
  participant_count: number;
  completion_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 阅读计划中的诗词
 */
export interface ReadingPlanPoem {
  id: number;
  plan_id: number;
  poem_id: number;
  order: number;
  title?: string;
  author?: string;
  dynasty?: string;
}

/**
 * 阅读计划列表请求参数
 */
export interface ReadingPlanListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: string;
  difficulty?: string;
}

/**
 * 阅读计划列表响应
 */
export interface ReadingPlanListResponse {
  items: ReadingPlan[];
  total: number;
}

/**
 * 创建阅读计划请求
 */
export interface CreateReadingPlanParams {
  title: string;
  description?: string;
  cover_url?: string;
  difficulty: string;
  tags?: string[];
  status: string;
  poems?: { poem_id: number; order: number }[];
}

/**
 * 更新阅读计划请求
 */
export interface UpdateReadingPlanParams extends Partial<CreateReadingPlanParams> {}

/**
 * 获取阅读计划列表
 */
export async function getReadingPlanListApi(params?: ReadingPlanListParams) {
  return requestClient.get<ReadingPlanListResponse>('/reading-plans', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 20,
      keyword: params?.keyword,
      status: params?.status,
      difficulty: params?.difficulty,
    },
  });
}

/**
 * 获取阅读计划详情
 */
export async function getReadingPlanDetailApi(id: number) {
  return requestClient.get<ReadingPlan>(`/reading-plans/${id}`);
}

/**
 * 创建阅读计划
 */
export async function createReadingPlanApi(data: CreateReadingPlanParams) {
  return requestClient.post<ReadingPlan>('/reading-plans', data);
}

/**
 * 更新阅读计划
 */
export async function updateReadingPlanApi(
  id: number,
  data: UpdateReadingPlanParams,
) {
  return requestClient.put<ReadingPlan>(`/reading-plans/${id}`, data);
}

/**
 * 删除阅读计划
 */
export async function deleteReadingPlanApi(id: number) {
  return requestClient.delete(`/reading-plans/${id}`);
}

/**
 * 更新阅读计划状态
 */
export async function updateReadingPlanStatusApi(
  id: number,
  status: string,
) {
  return requestClient.put<ReadingPlan>(`/reading-plans/${id}/status`, {
    status,
  });
}

/**
 * 批量更新阅读计划状态
 */
export async function batchUpdateReadingPlanStatusApi(
  ids: number[],
  status: string,
) {
  return requestClient.put('/reading-plans/batch/status', { ids, status });
}

/**
 * 获取阅读计划中的诗词列表
 */
export async function getReadingPlanPoemsApi(id: number) {
  return requestClient.get<ReadingPlanPoem[]>(`/reading-plans/${id}/poems`);
}

/**
 * 更新阅读计划中的诗词
 */
export async function updateReadingPlanPoemsApi(
  id: number,
  poems: { poem_id: number; order: number }[],
) {
  return requestClient.put(`/reading-plans/${id}/poems`, { poems });
}
