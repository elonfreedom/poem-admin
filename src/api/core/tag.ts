import { requestClient } from '#/api/request';

export interface Tag {
  id: number;
  name: string;
  poem_count?: number;
  created_at?: string;
}

export async function getTagListApi() {
  return requestClient.get<Tag[]>('/tags');
}

export async function createTagApi(data: { name: string }) {
  return requestClient.post<Tag>('/tags', data);
}

export async function updateTagApi(id: number, data: { name: string }) {
  return requestClient.put<Tag>(`/tags/${id}`, data);
}

export async function deleteTagApi(id: number) {
  return requestClient.delete(`/tags/${id}`);
}
