import { requestClient } from '#/api/request';

export interface Category {
  id: number;
  name: string;
  sort: number;
  poem_count?: number;
  created_at?: string;
}

export async function getCategoryListApi() {
  return requestClient.get<Category[]>('/categories');
}

export async function createCategoryApi(data: { name: string; sort?: number }) {
  return requestClient.post<Category>('/categories', data);
}

export async function updateCategoryApi(
  id: number,
  data: { name: string; sort?: number },
) {
  return requestClient.put<Category>(`/categories/${id}`, data);
}

export async function deleteCategoryApi(id: number) {
  return requestClient.delete(`/categories/${id}`);
}
