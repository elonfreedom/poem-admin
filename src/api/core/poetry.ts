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
  search_scope?: 'title' | 'author';
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
  skipped?: number;
  ids?: number[];
  errors: ImportError[];
  record_id?: number;
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

/** 字符类型 */
export type CharsType = 'simplified' | 'traditional' | 'mixed' | 'no_diff' | 'unknown';

/** 检测字符类型 */
export async function detectCharsTypeApi(text: string) {
  return requestClient.post<CharsType>('/tools/detect-chars-type', { text });
}

/** 转换字符 */
export async function convertCharsApi(text: string, target: 'simplified' | 'traditional') {
  return requestClient.post<string>('/tools/convert-chars', { text, target });
}

/** 批量转换字符（按诗歌 ID） */
export async function batchConvertCharsApi(poetryIds: number[], target: 'simplified' | 'traditional') {
  return requestClient.post<BatchConvertResult>('/tools/batch-convert-chars', {
    poetry_ids: poetryIds,
    target,
  });
}

// ============================================================
// 导入记录
// ============================================================

/** 导入记录状态 */
export type ImportRecordStatus = 'processing' | 'success' | 'partial' | 'failed';

/** 导入记录 */
export interface ImportRecord {
  id: number;
  file_name: string | null;
  source: string | null;
  total: number;
  processed: number;
  success: number;
  failed: number;
  status: ImportRecordStatus;
  created_at: string;
  created_by?: string;
  errors: ImportError[];
}

/** 导入记录列表查询参数 */
export interface ImportRecordListParams {
  page?: number;
  page_size?: number;
  status?: ImportRecordStatus;
  start_date?: string;
  end_date?: string;
}

/** 导入记录列表响应 */
export interface ImportRecordListResponse {
  items: ImportRecord[];
  total: number;
}

/** 导入统计 */
export interface ImportStats {
  total_imports: number;
  total_poems: number;
  total_success: number;
  total_failed: number;
  success_rate: number;
}

/** 获取导入记录列表 */
export async function getImportRecordsApi(params: ImportRecordListParams) {
  return requestClient.get<ImportRecordListResponse>('/poems/import-records', { params });
}

/** 获取导入记录详情 */
export async function getImportRecordDetailApi(id: number) {
  return requestClient.get<ImportRecord>(`/poems/import-records/${id}`);
}

/** 获取导入统计 */
export async function getImportStatsApi(params?: { start_date?: string; end_date?: string; status?: ImportRecordStatus }) {
  return requestClient.get<ImportStats>('/poems/import-records/stats', { params });
}

// ============================================================
// 诗文去重工具
// ============================================================

/** 去重扫描参数 */
export interface DedupScanParams {
  match_fields: ('title' | 'author' | 'content')[];
  status_filter?: string;
  dynasty_filter?: string;
  page?: number;
  page_size?: number;
}

/** 去重组 */
export interface DedupGroup {
  group_id: string;
  match_reason: string;
  match_key: string;
  poems: Poetry[];
  recommended_keep_id: number;
}

/** 去重扫描结果 */
export interface DedupScanResult {
  total_scanned: number;
  total_groups: number;
  total_duplicates: number;
  page: number;
  page_size: number;
  groups: DedupGroup[];
}

/** 去重执行参数 */
export interface DedupExecuteParams {
  archive_ids: number[];
  delete_ids: number[];
}

/** 去重执行结果 */
export interface DedupExecuteResult {
  archived: number;
  deleted: number;
  message: string;
}

/** 扫描重复诗文 */
export function scanDuplicatesApi(params: DedupScanParams) {
  return requestClient.post<DedupScanResult>('/tools/dedup/scan', params);
}

/** 执行去重（归档/删除） */
export function executeDedupApi(params: DedupExecuteParams) {
  return requestClient.post<DedupExecuteResult>('/tools/dedup/execute', params);
}
