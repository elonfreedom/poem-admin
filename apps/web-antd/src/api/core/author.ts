import { requestClient } from '#/api/request';

export interface Author {
  id: number;
  name: string;
  name_traditional?: string;
  dynasty: string;
  biography?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthorListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface AuthorListResponse {
  items: Author[];
  total: number;
}

export interface CreateAuthorParams {
  name: string;
  name_traditional?: string;
  dynasty: string;
  biography?: string;
}

export async function getAuthorListApi(params: AuthorListParams) {
  return requestClient.get<AuthorListResponse>('/authors', { params });
}

export async function getAuthorDetailApi(id: number) {
  return requestClient.get<Author>(`/authors/${id}`);
}

export async function createAuthorApi(data: CreateAuthorParams) {
  return requestClient.post<Author>('/authors', data);
}

export async function updateAuthorApi(id: number, data: CreateAuthorParams) {
  return requestClient.put<Author>(`/authors/${id}`, data);
}

export async function deleteAuthorApi(id: number) {
  return requestClient.delete(`/authors/${id}`);
}

export interface AuthorOption {
  id: number;
  name: string;
  dynasty: string;
}

export async function getAuthorOptionsApi(keyword?: string) {
  return requestClient.get<AuthorOption[]>('/authors/options', {
    params: { keyword },
  });
}
