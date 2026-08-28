import { requestClient } from '#/api/request';

export interface Poetry {
  id: number;
  title: string;
  title_pinyin?: string;
  title_sc?: string;
  author: string;
  author_id?: number;
  author_pinyin?: string;
  author_sc?: string;
  dynasty?: string;
  content: string;
  content_pinyin?: string;
  content_sc?: string;
  translation?: string;
  appreciation?: string;
  category_id?: number;
  category_name?: string;
  tags?: string[];
  cover_url?: string;
  source?: string;
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
  dynasty?: string;
  author_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface PoetryListResponse {
  items: Poetry[];
  total: number;
}

export interface CreatePoetryParams {
  title: string;
  title_pinyin?: string;
  title_sc?: string;
  author: string;
  author_id?: number;
  author_pinyin?: string;
  author_sc?: string;
  dynasty?: string;
  content: string;
  content_pinyin?: string;
  content_sc?: string;
  translation?: string;
  appreciation?: string;
  category_id?: number;
  tags?: string[];
  cover_url?: string;
  source?: string;
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

export async function batchUpdatePoetryStatusApi(
  ids: number[],
  status: string,
) {
  return requestClient.put('/poems/batch/status', { ids, status });
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

export interface ImportPoetryPayload {
  source?: string;
  poems: CreatePoetryParams[];
}

export async function importPoetryApi(
  data: CreatePoetryParams[] | ImportPoetryPayload,
) {
  return requestClient.post<ImportResult>('/poems/import', data);
}

export interface BatchConvertResult {
  total: number;
  converted: number;
  message: string;
}

export async function batchConvertSimplifiedApi() {
  return requestClient.post<BatchConvertResult>(
    '/tools/convert-simplified',
  );
}

export interface GenerateAuthorsResult {
  total_unique: number;
  created: number;
  skipped: number;
  message: string;
}

export async function generateAuthorsApi() {
  return requestClient.post<GenerateAuthorsResult>(
    '/tools/generate-authors',
  );
}

export interface BatchMatchResult {
  total: number;
  matched: number;
  message: string;
}

export async function batchMatchAuthorsApi(poetryIds?: number[]) {
  return requestClient.post<BatchMatchResult>(
    '/authors/batch/match',
    { poetry_ids: poetryIds ?? [] },
  );
}
