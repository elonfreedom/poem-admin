import { requestClient } from '#/api/request';

export interface Author {
  id: number;
  name: string;
  name_traditional?: string;
  dynasty: string;
  biography?: string;
  poem_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthorListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  sort_field?: 'id' | 'name' | 'poem_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
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

// ==================== 作者查重工具 ====================

/** 作者查重扫描参数 */
export interface AuthorDedupScanParams {
  match_by?: 'name' | 'name_dynasty';
}

/** 作者查重组 */
export interface AuthorDedupGroup {
  group_id: string;
  match_reason: string;
  match_key: string;
  author_count: number;
  authors: Author[];
}

/** 作者查重扫描结果 */
export interface AuthorDedupScanResult {
  total_scanned: number;
  total_groups: number;
  groups: AuthorDedupGroup[];
}

/** 作者查重合并参数 */
export interface AuthorDedupMergeParams {
  keep_id: number;
  merge_ids: number[];
}

/** 作者查重合并结果 */
export interface AuthorDedupMergeResult {
  keep_id: number;
  merged: number;
  reassigned_poems: number;
  message: string;
}

/** 扫描重复作者 */
export function scanAuthorDuplicatesApi(params: AuthorDedupScanParams) {
  return requestClient.get<AuthorDedupScanResult>('/tools/author-dedup/scan', { params });
}

/** 合并重复作者 */
export function mergeAuthorsApi(params: AuthorDedupMergeParams) {
  return requestClient.post<AuthorDedupMergeResult>('/tools/author-dedup/merge', params);
}

/** 清理作者重复繁简名结果 */
export interface CleanupAuthorNamesResult {
  cleaned: number;
  message: string;
}

/** 清理作者重复繁简名（name = name_traditional） */
export function cleanupAuthorNamesApi() {
  return requestClient.post<CleanupAuthorNamesResult>('/tools/cleanup-author-names');
}

/** 作者姓名转简体结果 */
export function cleanupAuthorNamesScApi() {
  return requestClient.post<CleanupAuthorNamesResult>('/tools/cleanup-author-names-sc');
}

/** 作者姓名转繁体（name → name_traditional） */
export function convertAuthorNamesTraditionalApi() {
  return requestClient.post<CleanupAuthorNamesResult>('/tools/convert-author-names-traditional');
}
