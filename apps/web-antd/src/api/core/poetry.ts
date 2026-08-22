import { requestClient } from '#/api/request';

export interface Poetry {
  id: number;
  title: string;
  author: string;
  dynasty?: string;
  content: string;
  translation?: string;
  appreciation?: string;
  category_id?: number;
  category_name?: string;
  tags?: string[];
  cover_url?: string;
  status: 'archived' | 'draft' | 'published';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PoetryListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  category_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface PoetryListResponse {
  items: Poetry[];
  total: number;
}

export interface CreatePoetryParams {
  title: string;
  author: string;
  dynasty?: string;
  content: string;
  translation?: string;
  appreciation?: string;
  category_id?: number;
  tags?: string[];
  cover_url?: string;
  status: string;
}

export async function getPoetryListApi(params: PoetryListParams) {
  return requestClient.get<PoetryListResponse>('/poems', { params });
}

export async function getPoetryDetailApi(id: number) {
  return requestClient.get<Poetry>(`/poems/${id}`);
}

export async function createPoetryApi(data: CreatePoetryParams) {
  return requestClient.post<Poetry>('/poems', data);
}

export async function updatePoetryApi(id: number, data: CreatePoetryParams) {
  return requestClient.put<Poetry>(`/poems/${id}`, data);
}

export async function deletePoetryApi(id: number) {
  return requestClient.delete(`/poems/${id}`);
}

export async function updatePoetryStatusApi(id: number, status: string) {
  return requestClient.put<Poetry>(`/poems/${id}/status`, { status });
}

export interface ImportError {
  index: number;
  title: string;
  error: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
}

export async function importPoetryApi(data: CreatePoetryParams[]) {
  return requestClient.post<ImportResult>('/poems/import', data);
}
