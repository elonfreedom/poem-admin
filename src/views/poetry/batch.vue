<script lang="ts" setup >
import type { CharsType, CreatePoetryParams, ImportError } from '#/api';

import { computed, ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileX2,
  History,
  Info,
  Plus,
  RotateCcw,
  X,
} from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { Badge } from '#/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip';

import PageHeader from '#/components/PageHeader.vue';
import {
  batchConvertCharsApi,
  detectCharsTypeApi,
  importPoetryApi,
  type ImportPoetryPayload,
} from '#/api';
import { toast } from 'vue-sonner';

const router = useRouter();

// ============================================================
// 类型定义
// ============================================================

/** 原始诗歌数据 */
interface RawPoem {
  [key: string]: unknown;
}

/** 数据库字段定义 */
interface TargetField {
  key: keyof CreatePoetryParams;
  label: string;
  required?: boolean;
}

/** 步骤定义 */
type Step = 'upload' | 'mapping' | 'preview' | 'result';

/** 重复处理策略 */
type DuplicateStrategy = 'skip' | 'update' | 'create';

// ============================================================
// 字段定义
// ============================================================

const targetFields: TargetField[] = [
  { key: 'title', label: '标题', required: true },
  { key: 'author', label: '作者', required: true },
  { key: 'content', label: '内容', required: true },
  { key: 'dynasty', label: '朝代' },
  { key: 'category_id', label: '分类ID' },
  { key: 'tags', label: '标签' },
  { key: 'cover_url', label: '封面图URL' },
  { key: 'source', label: '来源' },
  { key: 'status', label: '状态' },
  { key: 'translation', label: '翻译' },
  { key: 'appreciation', label: '赏析' },
];

/** 默认映射候选字段名（按优先级排序） */
const defaultMappingCandidates: Record<string, string[]> = {
  title: ['title', 'name', '标题', '诗题'],
  author: ['author', '诗人', '作者'],
  content: ['paragraphs', 'content', 'body', 'text', '内容', '正文', '诗句'],
  dynasty: ['dynasty', 'dynasty_name', '朝代', '年代'],
  category_id: ['category_id', 'category', '分类ID', '分类'],
  tags: ['tags', 'tag', '标签', '类别'],
  cover_url: ['cover_url', 'cover', 'image', '封面', '图片'],
  source: ['source', '来源', '出处', '来源书籍', '书目'],
  status: ['status', '状态'],
  translation: ['translation', '翻译', '译文'],
  appreciation: ['appreciation', 'appreciate', 'note', '赏析', '注释', '备注'],
};

// ============================================================
// 状态
// ============================================================

/** 单次导入上限 */
const MAX_IMPORT_COUNT = 5000;

/** 当前步骤 */
const currentStep = ref<Step>('upload');

/** 步骤列表 */
const steps: { key: Step; label: string }[] = [
  { key: 'upload', label: '选择文件' },
  { key: 'mapping', label: '字段映射' },
  { key: 'preview', label: '数据预览' },
  { key: 'result', label: '导入结果' },
];

/** 文件相关 */
const fileInputRef = ref<HTMLInputElement | null>(null);
const importFile = ref<File | null>(null);
const rawPoems = ref<RawPoem[]>([]);
const parseErrors = ref<string[]>([]);
const isDragging = ref(false);
const isParsing = ref(false);

/** 映射配置 */
const fieldMapping = ref<Record<string, string>>({});
const sourceFields = ref<string[]>([]);

/** 空值标记（reka-ui Select 不支持空字符串作为有效值） */
const NONE_MAPPING = '__none__';

/** 判断映射值是否有效（非空） */
function hasMapping(key: string): boolean {
  const val = fieldMapping.value[key];
  return val !== undefined && val !== null && val !== '' && val !== NONE_MAPPING;
}

/** 字段合并配置 */
interface MergeConfig {
  enabled: boolean;
  fields: string[];
  separator: string;
}

/** 各目标字段的合并配置 */
const mergeConfigs: Ref<Record<string, MergeConfig>> = ref({});

/** 获取或初始化合并配置 */
function getMergeConfig(key: string): MergeConfig {
  if (!mergeConfigs.value[key]) {
    mergeConfigs.value[key] = { enabled: false, fields: [], separator: '·' };
  }
  return mergeConfigs.value[key]!;
}

/** 切换合并启用状态 */
function toggleMerge(key: string) {
  const cfg = getMergeConfig(key);
  cfg.enabled = !cfg.enabled;
}

/** 添加合并源字段 */
function addMergeField(key: string, field: string) {
  const cfg = getMergeConfig(key);
  if (field && !cfg.fields.includes(field)) {
    cfg.fields.push(field);
  }
}

/** 移除合并源字段 */
function removeMergeField(key: string, field: string) {
  const cfg = getMergeConfig(key);
  cfg.fields = cfg.fields.filter((f) => f !== field);
}

/** 分隔符预设 */
const separatorPresets = [
  { label: '·', value: '·' },
  { label: '-', value: '-' },
  { label: '/', value: '/' },
  { label: '空格', value: ' ' },
  { label: '|', value: '|' },
];

/** 计算合并预览结果（取第一条数据） */
function getMergePreview(key: string): string {
  const cfg = getMergeConfig(key);
  if (!cfg.enabled || rawPoems.value.length === 0) {
    return '';
  }
  const raw = rawPoems.value[0]!;
  // 合并字段 = 主字段 + 额外添加的字段
  const mergeFields = [...cfg.fields];
  const mainField = fieldMapping.value[key];
  if (mainField && mainField !== NONE_MAPPING && !mergeFields.includes(mainField)) {
    mergeFields.unshift(mainField);
  }
  if (mergeFields.length === 0) return '';
  const parts = mergeFields
    .map((f) => {
      const val = raw[f];
      if (val === undefined || val === null) return '';
      if (Array.isArray(val)) return val.join(' ');
      return String(val);
    })
    .filter(Boolean);
  return parts.join(cfg.separator);
}

/** 批量默认设置 */
const defaultStatus = ref('draft');
const defaultDynasty = ref('');
const defaultTags = ref<string[]>([]);
const defaultSource = ref('');
const tagInput = ref('');

/** 重复处理策略 */
const duplicateStrategy = ref<DuplicateStrategy>('skip');

/** 导入相关 */
const parsedPoems = ref<CreatePoetryParams[]>([]);
const validatedPoems = ref<
  { index: number; poem: CreatePoetryParams; errors: string[]; valid: boolean }[]
>([]);
const importing = ref(false);
const importProgress = ref(0);
const importResult = ref<null | {
  errors: ImportError[];
  failed: number;
  success: number;
  total: number;
  ids?: number[];
}>(null);

/** 简繁体转换状态 */
const converting = ref(false);
const convertInfo = ref<null | {
  detected: CharsType;
  target: 'simplified' | 'traditional';
  result: { total: number; converted: number };
}>(null);

/** 字符类型检测 */
const detectedCharsType = ref<CharsType | null>(null);
const charsTypeLoading = ref(false);
/** 用户手动指定的字符类型（null 表示未手动指定，使用自动检测结果） */
const manualCharsType = ref<'simplified' | 'traditional' | null>(null);

/** 是否展开完整 JSON */
const showRawJson = ref(false);

// ============================================================
// 计算属性
// ============================================================

const validCount = computed(
  () => validatedPoems.value.filter((p) => p.valid).length,
);
const invalidCount = computed(
  () => validatedPoems.value.filter((p) => !p.valid).length,
);

const stepIndex = computed(() =>
  steps.findIndex((s) => s.key === currentStep.value),
);

// ============================================================
// 文件解析
// ============================================================

/** 解析文件（支持 JSON 和 CSV） */
async function parseFile(file: File) {
  importFile.value = file;
  parseErrors.value = [];
  rawPoems.value = [];
  parsedPoems.value = [];
  validatedPoems.value = [];
  importResult.value = null;
  isParsing.value = true;

  try {
    const text = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      parseJson(text);
    } else if (ext === 'csv') {
      parseCsv(text);
    } else {
      parseErrors.value = ['不支持的文件格式，请上传 JSON 或 CSV 文件'];
    }

    // 校验数量上限
    if (rawPoems.value.length > MAX_IMPORT_COUNT) {
      parseErrors.value = [
        `单次导入上限为 ${MAX_IMPORT_COUNT.toLocaleString()} 首，当前文件包含 ${rawPoems.value.length.toLocaleString()} 首，请拆分后分批导入`,
      ];
      rawPoems.value = [];
      return;
    }

    if (rawPoems.value.length > 0) {
      initMapping();
      currentStep.value = 'mapping';
    }
  } catch {
    parseErrors.value = ['文件解析失败，请检查文件格式'];
  } finally {
    isParsing.value = false;
  }
}

/** 解析 JSON */
function parseJson(text: string) {
  const json = JSON.parse(text);
  if (!Array.isArray(json)) {
    parseErrors.value = ['JSON 格式错误：根节点必须是数组'];
    return;
  }
  rawPoems.value = json as RawPoem[];
}

/** 解析 CSV（简单实现，支持引号） */
function parseCsv(text: string) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    parseErrors.value = ['CSV 格式错误：至少需要标题行和一行数据'];
    return;
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]!);
  const rows: RawPoem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]!);
    const row: RawPoem = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  rawPoems.value = rows;
}

// ============================================================
// 字段映射
// ============================================================

/** 初始化映射：自动匹配源字段 */
function initMapping(rawData: RawPoem[] = rawPoems.value) {
  const fieldSet = new Set<string>();
  for (const item of rawData) {
    Object.keys(item).forEach((k) => fieldSet.add(k));
  }
  sourceFields.value = [...fieldSet].toSorted();

  const newMapping: Record<string, string> = {};
  for (const target of targetFields) {
    const candidates = defaultMappingCandidates[target.key as string] || [];
    const matched = candidates.find((c) => sourceFields.value.includes(c));
    newMapping[target.key as string] = matched || NONE_MAPPING;
  }
  fieldMapping.value = newMapping;
}

/** 根据映射配置，从原始数据提取字段值 */
function applyMapping(
  raw: RawPoem,
  mapping: Record<string, string>,
): CreatePoetryParams {
  const getSourceField = (key: string) => {
    const val = mapping[key];
    if (!val || val === NONE_MAPPING) return undefined;
    return val;
  };

  const getStr = (key: string) => {
    // 优先处理合并字段
    const mergeCfg = mergeConfigs.value[key];
    if (mergeCfg?.enabled) {
      // 合并字段 = 主字段 + 额外添加的字段
      const mergeFields = [...mergeCfg.fields];
      const mainField = mapping[key];
      if (mainField && mainField !== NONE_MAPPING && !mergeFields.includes(mainField)) {
        mergeFields.unshift(mainField);
      }
      if (mergeFields.length > 0) {
        const parts = mergeFields
          .map((f) => {
            const val = raw[f];
            if (val === undefined || val === null) return '';
            if (Array.isArray(val)) return val.join(' ');
            return String(val);
          })
          .filter(Boolean);
        if (parts.length > 0) return parts.join(mergeCfg.separator);
      }
    }

    // 单字段映射
    const sourceField = getSourceField(key);
    if (!sourceField) return '';
    const val = raw[sourceField];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join('\n');
    return String(val || '');
  };

  const getNum = (key: string) => {
    const sourceField = getSourceField(key);
    if (!sourceField) return undefined;
    const val = raw[sourceField];
    return Number(val) || undefined;
  };

  const getArr = (key: string) => {
    const sourceField = getSourceField(key);
    if (!sourceField) return undefined;
    const val = raw[sourceField];
    if (Array.isArray(val)) return val as string[];
    const str = String(val || '');
    return str ? str.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean) : undefined;
  };

  return {
    title: getStr('title'),
    author: getStr('author'),
    content: getStr('content'),
    dynasty: getStr('dynasty') || (defaultDynasty.value === NONE_MAPPING ? '' : defaultDynasty.value) || undefined,
    category_id: getNum('category_id'),
    tags: getArr('tags'),
    cover_url: getStr('cover_url'),
    source: getStr('source') || defaultSource.value || undefined,
    status: getStr('status') || defaultStatus.value,
    translation: getStr('translation'),
    appreciation: getStr('appreciation'),
  };
}

/** 应用映射并进入预览 */
async function applyMappingAndPreview() {
  parsedPoems.value = rawPoems.value.map((raw) =>
    applyMapping(raw, fieldMapping.value),
  );
  validatedPoems.value = parsedPoems.value.map((poem, index) => {
    const errors: string[] = [];
    if (!poem.title?.trim()) errors.push('缺少标题');
    if (!poem.author?.trim()) errors.push('缺少作者');
    if (!poem.content?.trim()) errors.push('缺少内容');
    return { index, poem, errors, valid: errors.length === 0 };
  });
  currentStep.value = 'preview';

  // 自动检测字符类型
  await autoDetectCharsType();
}

/** 自动检测字符类型 */
async function autoDetectCharsType() {
  charsTypeLoading.value = true;
  detectedCharsType.value = null;
  manualCharsType.value = null;

  try {
    const samplePoem = parsedPoems.value.find(
      (_, index) => validatedPoems.value[index]?.valid,
    );
    if (samplePoem?.content) {
      detectedCharsType.value = await detectCharsTypeApi(samplePoem.content);
    }
  } catch {
    // 检测失败不阻塞流程
  } finally {
    charsTypeLoading.value = false;
  }
}

/** 获取有效的字符类型（用户手动指定优先于自动检测） */
function getEffectiveCharsType(): CharsType | null {
  return manualCharsType.value || detectedCharsType.value || null;
}

/** 字符类型标签 */
const charsTypeLabels: Record<CharsType, string> = {
  simplified: '简体',
  traditional: '繁体',
  mixed: '混合',
  no_diff: '无差异',
  unknown: '未知',
};

// ============================================================
// 标签输入
// ============================================================

function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !defaultTags.value.includes(tag)) {
    defaultTags.value.push(tag);
  }
  tagInput.value = '';
}

function removeTag(index: number) {
  defaultTags.value.splice(index, 1);
}

// ============================================================
// 导入
// ============================================================

async function handleBatchImport() {
  const validPoems = parsedPoems.value.filter(
    (_, index) => validatedPoems.value[index]?.valid,
  );
  if (validPoems.length === 0) return;

  // 应用默认标签
  const poemsWithDefaults = validPoems.map((poem) => ({
    ...poem,
    tags: [...(poem.tags || []), ...defaultTags.value],
  }));

  importing.value = true;
  importProgress.value = 0;

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += Math.random() * 15;
      }
    }, 200);

    const poems = poemsWithDuplicatesStrategy(poemsWithDefaults);
    const payload: ImportPoetryPayload = defaultSource.value.trim()
      ? { source: defaultSource.value.trim(), poems }
      : { poems };

    importResult.value = await importPoetryApi(payload);

    clearInterval(progressInterval);
    importProgress.value = 100;

    if (importResult.value.failed === 0) {
      toast.success(`成功导入 ${importResult.value.success} 首诗歌`);
    } else {
      toast.warning(
        `导入完成：成功 ${importResult.value.success} 首，失败 ${importResult.value.failed} 首`,
      );
    }

    // 自动识别简繁体并转换
    const importedIds = importResult.value.ids || [];
    if (importedIds.length > 0) {
      currentStep.value = 'result';
      await autoConvertChars(importedIds);
    } else {
      currentStep.value = 'result';
    }
  } catch (err: any) {
    // 区分超时和其他错误
    const isTimeout =
      err?.code === 'ECONNABORTED' ||
      err?.message?.includes('timeout') ||
      err?.message?.includes('Network Error');
    if (isTimeout) {
      toast.error('导入超时，部分数据可能已导入，请查看导入记录确认', {
        duration: 6000,
      });
    } else {
      toast.error(`导入失败：${err?.message || '请重试'}`);
    }
  } finally {
    importing.value = false;
  }
}

/** 自动识别简繁体并转换 */
async function autoConvertChars(ids: number[]) {
  converting.value = true;
  convertInfo.value = null;

  try {
    // 使用用户在预览步骤指定的类型（优先）或自动检测结果
    const effectiveType = getEffectiveCharsType();

    let target: 'simplified' | 'traditional' | null = null;
    if (effectiveType === 'traditional') {
      target = 'simplified';
    } else if (effectiveType === 'simplified') {
      target = 'traditional';
    }

    if (!target || !effectiveType) {
      // mixed / no_diff / unknown 不需要转换
      return;
    }

    // 批量转换
    const result = await batchConvertCharsApi(ids, target);
    convertInfo.value = { detected: effectiveType, target, result };
    toast.success(
      `已识别为${effectiveType === 'traditional' ? '繁体' : '简体'}，自动生成${target === 'simplified' ? '简体' : '繁体'}版本`,
    );
  } catch {
    // 转换失败不影响导入结果
  } finally {
    converting.value = false;
  }
}

/** 根据重复处理策略处理数据 */
function poemsWithDuplicatesStrategy(poems: CreatePoetryParams[]): CreatePoetryParams[] {
  if (duplicateStrategy.value === 'create') {
    return poems;
  }
  // skip 和 update 目前由后端处理，这里直接返回
  return poems;
}

/** 仅重试失败项 */
async function retryFailed() {
  const failedPoems = parsedPoems.value.filter(
    (_, index) => validatedPoems.value[index]?.valid,
  );
  if (failedPoems.length === 0) return;

  importing.value = true;
  importProgress.value = 0;

  try {
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += Math.random() * 15;
      }
    }, 200);

    const payload: ImportPoetryPayload = defaultSource.value.trim()
      ? { source: defaultSource.value.trim(), poems: failedPoems }
      : { poems: failedPoems };

    importResult.value = await importPoetryApi(payload);

    clearInterval(progressInterval);
    importProgress.value = 100;

    if (importResult.value.failed === 0) {
      toast.success(`成功导入 ${importResult.value.success} 首诗歌`);
    }
  } catch {
    toast.error('重试失败，请重试');
  } finally {
    importing.value = false;
  }
}

// ============================================================
// 文件处理
// ============================================================

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) parseFile(file);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) parseFile(file);
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

// ============================================================
// 模板下载
// ============================================================

function downloadTemplate(format: 'json' | 'csv') {
  if (format === 'json') {
    const template = [
      {
        title: '静夜思',
        author: '李白',
        dynasty: '唐',
        content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
        translation: '明亮的月光洒在床前的窗户纸上...',
        appreciation: '这首诗写的是在寂静的月夜思念家乡的感受...',
        category_id: 1,
        tags: ['思乡', '月亮'],
        cover_url: '',
        source: '《唐诗三百首》',
        status: 'draft',
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'poetry_import_template.json');
  } else {
    const headers = 'title,author,dynasty,content,translation,appreciation,category_id,tags,cover_url,source,status';
    const row =
      '静夜思,李白,唐,"床前明月光，疑是地上霜。\n举头望明月，低头思故乡。","明亮的月光洒在床前的窗户纸上...","这首诗写的是在寂静的月夜思念家乡的感受...",1,"思乡,月亮",,《唐诗三百首》,draft';
    const csv = `${headers}\n${row}`;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'poetry_import_template.csv');
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 下载失败记录 */
function downloadFailedRecords() {
  if (!importResult.value?.errors.length) return;

  const failedIndices = new Set(importResult.value.errors.map((e) => e.index));
  const failedPoems = rawPoems.value.filter((_, i) => failedIndices.has(i));
  const blob = new Blob([JSON.stringify(failedPoems, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, 'poetry_import_failed.json');
}

// ============================================================
// 重置
// ============================================================

function resetBatch() {
  importFile.value = null;
  parsedPoems.value = [];
  rawPoems.value = [];
  parseErrors.value = [];
  importResult.value = null;
  currentStep.value = 'upload';
  fieldMapping.value = {};
  mergeConfigs.value = {};
  sourceFields.value = [];
  showRawJson.value = false;
  defaultSource.value = '';
  defaultDynasty.value = NONE_MAPPING;
  defaultTags.value = [];
  defaultStatus.value = 'draft';
  duplicateStrategy.value = 'skip';
  importProgress.value = 0;
  detectedCharsType.value = null;
  manualCharsType.value = null;
  convertInfo.value = null;
}

/** 返回上一步 */
function goBack() {
  const idx = stepIndex.value;
  if (idx > 0) {
    currentStep.value = steps[idx - 1]!.key;
  }
}

/** 截断文本 */
function truncate(text: string, len: number): string {
  if (!text) return '-';
  return text.length > len ? text.slice(0, len) + '...' : text;
}

/** 格式化预览值（安全处理 undefined/null） */
function formatPreview(value: unknown, maxLen = 40): string {
  if (value === undefined || value === null) return '(空)';
  const str = JSON.stringify(value);
  if (str === undefined) return '(空)';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="批量导入">
      <template #description>
        支持 JSON / CSV 格式，自动匹配字段映射，批量导入诗词数据
      </template>
      <template #extra>
        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/poetry/list')">
            <ArrowLeft class="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </div>
      </template>
    </PageHeader>

    <!-- 步骤指示器 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors"
              :class="
                currentStep === step.key
                  ? 'bg-primary text-primary-foreground'
                  : index < stepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
              "
            >
              <Check v-if="index < stepIndex" class="h-4 w-4" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span
              class="text-sm font-medium"
              :class="
                currentStep === step.key
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              "
            >
              {{ step.label }}
            </span>
          </div>
          <ChevronRight
            v-if="index < steps.length - 1"
            class="mx-3 h-4 w-4 shrink-0 text-muted-foreground/40"
          />
        </div>
      </div>
    </div>

    <!-- ========== 步骤 1：选择文件 ========== -->
    <template v-if="currentStep === 'upload'">
      <!-- 模板下载 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" @click="downloadTemplate('json')">
            <Download class="mr-2 h-4 w-4" />
            JSON 模板
          </Button>
          <Button size="sm" variant="outline" @click="downloadTemplate('csv')">
            <Download class="mr-2 h-4 w-4" />
            CSV 模板
          </Button>
        </div>
      </div>

      <!-- 文件选择区域 -->
      <div
        class="cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all"
        :class="
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        "
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="fileInputRef?.click()"
      >
        <input
          id="batchFileInput"
          ref="fileInputRef"
          type="file"
          accept=".json,.csv"
          class="hidden"
          @change="handleFileChange"
        />

        <!-- 解析中 -->
        <div v-if="isParsing" class="flex flex-col items-center gap-3">
          <div class="loading-spinner" />
          <span class="text-sm text-muted-foreground">正在解析文件...</span>
        </div>

        <!-- 默认状态 -->
        <div v-else class="flex flex-col items-center gap-3">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            <FileText class="h-8 w-8 text-primary" />
          </div>
          <div>
            <div class="text-lg font-medium">
              拖拽文件到此处，或点击选择
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              文件仅在本地浏览器中处理，不会上传到服务器
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <FileJson class="h-3.5 w-3.5" />
              .json
            </span>
            <span class="flex items-center gap-1">
              <FileSpreadsheet class="h-3.5 w-3.5" />
              .csv
            </span>
            <span class="flex items-center gap-1">
              <Info class="h-3.5 w-3.5" />
              单次最多 {{ MAX_IMPORT_COUNT.toLocaleString() }} 首
            </span>
          </div>
        </div>
      </div>

      <!-- 解析错误 -->
      <div
        v-if="parseErrors.length > 0"
        class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
      >
        <FileX2 class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <div class="font-medium text-destructive">文件解析失败</div>
          <div class="mt-1 text-sm text-destructive/80">
            {{ parseErrors[0] }}
          </div>
        </div>
      </div>

      <!-- 导入说明 -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-start gap-3">
            <Info class="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div class="space-y-2 text-sm text-muted-foreground">
              <div class="font-medium text-foreground">导入说明</div>
              <ul class="list-inside list-disc space-y-1">
                <li>
                  首次使用请先下载模板，按示例格式填写数据
                </li>
                <li>
                  文件在本地浏览器中解析预览，确认无误后才会导入
                </li>
                <li>
                  必填字段：标题、作者、内容（映射时需指定）
                </li>
                <li>
                  支持批量设置默认值：状态、朝代、来源、标签
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- ========== 步骤 2：字段映射 ========== -->
    <template v-else-if="currentStep === 'mapping'">
      <Card>
        <CardContent class="pt-6">
          <!-- 标题 -->
          <div class="mb-4 flex items-center justify-between">
            <div>
              <span class="font-semibold">字段映射</span>
              <span class="ml-2 text-sm text-muted-foreground">
                共解析 {{ rawPoems.length }} 首，请确认字段对应关系
              </span>
            </div>
            <div class="flex gap-2">
              <Button size="sm" variant="outline" @click="goBack">
                重新选择
              </Button>
              <Button size="sm" @click="applyMappingAndPreview">
                下一步
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- 批量默认设置 -->
          <div class="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div class="mb-3 text-sm font-medium text-primary">
              批量默认设置
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <!-- 默认状态 -->
              <div class="space-y-1.5">
                <Label class="text-xs text-muted-foreground">默认状态</Label>
                <Select v-model="defaultStatus">
                  <SelectTrigger class="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <!-- 默认朝代 -->
              <div class="space-y-1.5">
                <Label class="text-xs text-muted-foreground">默认朝代</Label>
                <Select v-model="defaultDynasty">
                  <SelectTrigger class="h-9">
                    <SelectValue placeholder="选择朝代" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="NONE_MAPPING">不设置</SelectItem>
                    <SelectItem value="先秦">先秦</SelectItem>
                    <SelectItem value="汉">汉</SelectItem>
                    <SelectItem value="魏晋">魏晋</SelectItem>
                    <SelectItem value="南北朝">南北朝</SelectItem>
                    <SelectItem value="隋">隋</SelectItem>
                    <SelectItem value="唐">唐</SelectItem>
                    <SelectItem value="五代">五代</SelectItem>
                    <SelectItem value="宋">宋</SelectItem>
                    <SelectItem value="元">元</SelectItem>
                    <SelectItem value="明">明</SelectItem>
                    <SelectItem value="清">清</SelectItem>
                    <SelectItem value="近代">近代</SelectItem>
                    <SelectItem value="现代">现代</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <!-- 默认来源 -->
              <div class="space-y-1.5">
                <Label class="text-xs text-muted-foreground">默认来源</Label>
                <Input
                  v-model="defaultSource"
                  placeholder="如：《唐诗三百首》"
                  class="h-9"
                />
              </div>
              <!-- 默认标签 -->
              <div class="space-y-1.5">
                <Label class="text-xs text-muted-foreground">默认标签</Label>
                <div class="flex gap-1">
                  <Input
                    v-model="tagInput"
                    placeholder="输入后回车"
                    class="h-9"
                    @keyup.enter="addTag"
                  />
                  <Button size="sm" variant="outline" @click="addTag">
                    <Plus class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <!-- 已添加的标签 -->
            <div v-if="defaultTags.length > 0" class="mt-2 flex flex-wrap gap-1">
              <Badge
                v-for="(tag, index) in defaultTags"
                :key="index"
                variant="secondary"
                class="gap-1"
              >
                {{ tag }}
                <X
                  class="h-3 w-3 cursor-pointer"
                  @click="removeTag(index)"
                />
              </Badge>
            </div>
          </div>

          <!-- 字段映射选择器 -->
          <div class="rounded-lg border border-border p-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="field in targetFields"
                :key="field.key"
                class="flex items-center gap-2"
              >
                <Label class="w-16 shrink-0 text-right text-sm">
                  <span v-if="field.required" class="mr-1 text-destructive">*</span>
                  {{ field.label }}
                </Label>
                <Select v-model="fieldMapping[field.key]">
                  <SelectTrigger class="h-8 flex-1">
                    <SelectValue placeholder="选择源字段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="NONE_MAPPING">不映射</SelectItem>
                    <SelectItem v-for="f in sourceFields" :key="f" :value="f">
                      {{ f }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <!-- 合并字段按钮 -->
                <button
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors"
                  :title="getMergeConfig(field.key).enabled ? '取消字段合并' : '合并多个字段'"
                  :class="
                    getMergeConfig(field.key).enabled
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                  "
                  @click="toggleMerge(field.key)"
                >
                  <Plus class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <!-- 字段合并配置区域 -->
            <div
              v-for="field in targetFields.filter((f) => getMergeConfig(f.key).enabled)"
              :key="'merge-' + field.key"
              class="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium">
                  {{ field.label }} — 字段合并
                </span>
                <button
                  class="text-xs text-muted-foreground hover:text-destructive"
                  @click="toggleMerge(field.key)"
                >
                  取消合并
                </button>
              </div>

              <!-- 已选源字段标签 -->
              <div class="mb-2 flex flex-wrap gap-1.5">
                <Badge
                  v-for="(f, idx) in getMergeConfig(field.key).fields"
                  :key="f"
                  variant="secondary"
                  class="gap-1.5 pr-1"
                >
                  <span class="text-xs text-muted-foreground">{{ idx + 1 }}</span>
                  {{ f }}
                  <X
                    class="h-3 w-3 cursor-pointer hover:text-destructive"
                    @click="removeMergeField(field.key, f)"
                  />
                </Badge>
                <span
                  v-if="getMergeConfig(field.key).fields.length === 0"
                  class="text-xs text-muted-foreground"
                >
                  请选择要合并的源字段
                </span>
              </div>

              <!-- 添加源字段 + 分隔符 -->
              <div class="flex items-center gap-2">
                <Select
                  :model-value="''"
                  @update:model-value="
                    ($e) => {
                      if ($e && $e !== NONE_MAPPING) addMergeField(field.key, $e as string);
                    }
                  "
                >
                  <SelectTrigger class="h-8 flex-1">
                    <SelectValue placeholder="添加源字段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="sf in sourceFields.filter(
                        (s) => !getMergeConfig(field.key).fields.includes(s),
                      )"
                      :key="sf"
                      :value="sf"
                    >
                      {{ sf }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <span class="text-xs text-muted-foreground">分隔符</span>
                <div class="flex gap-1">
                  <button
                    v-for="preset in separatorPresets"
                    :key="preset.value"
                    class="flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors"
                    :class="
                      getMergeConfig(field.key).separator === preset.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    "
                    @click="getMergeConfig(field.key).separator = preset.value"
                  >
                    {{ preset.label }}
                  </button>
                  <Input
                    v-model="getMergeConfig(field.key).separator"
                    class="h-8 w-16 text-center"
                    placeholder="自定义"
                    maxlength="5"
                  />
                </div>
              </div>

              <!-- 合并预览 -->
              <div
                v-if="getMergePreview(field.key)"
                class="mt-2 flex items-center gap-2 text-xs"
              >
                <span class="text-muted-foreground">预览：</span>
                <span class="rounded bg-card px-2 py-0.5 font-medium text-foreground">
                  {{ getMergePreview(field.key) }}
                </span>
              </div>
            </div>

            <!-- 第一条数据映射对照 -->
            <div v-if="rawPoems.length > 0" class="mt-4 border-t border-border pt-3">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground">
                  第一条数据映射对照
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-xs text-primary"
                  @click="showRawJson = !showRawJson"
                >
                  {{ showRawJson ? '收起完整 JSON' : '展开完整 JSON' }}
                </Button>
              </div>

              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <!-- 原始数据 -->
                <div class="rounded border border-border bg-muted/30 p-2 text-xs">
                  <div class="mb-2 font-medium text-muted-foreground">原始数据</div>
                  <div class="max-h-72 overflow-auto">
                    <table class="w-full border-collapse">
                      <tbody>
                        <tr
                          v-for="(value, key) in rawPoems[0]"
                          :key="key"
                          class="border-b border-border last:border-b-0"
                        >
                          <td class="w-24 shrink-0 bg-muted/50 px-2 py-1 font-medium text-muted-foreground">
                            {{ key }}
                          </td>
                          <td class="max-w-[200px] truncate px-2 py-1">
                            {{ formatPreview(value, 50) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 映射结果 -->
                <div class="rounded border border-primary/20 bg-primary/5 p-2 text-xs">
                  <div class="mb-2 font-medium text-muted-foreground">映射结果</div>
                  <div class="max-h-72 overflow-auto">
                    <table class="w-full border-collapse">
                      <thead class="sticky top-0 bg-card">
                        <tr class="border-b border-primary/20">
                          <th class="w-16 shrink-0 px-2 py-1 text-left text-muted-foreground">
                            目标
                          </th>
                          <th class="w-20 shrink-0 px-2 py-1 text-left text-muted-foreground">
                            源字段
                          </th>
                          <th class="px-2 py-1 text-left text-muted-foreground">结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="field in targetFields"
                          :key="field.key"
                          class="border-b border-primary/10 last:border-b-0"
                        >
                          <td class="px-2 py-1 font-medium">
                            {{ field.label }}
                            <span v-if="field.required" class="text-destructive">*</span>
                          </td>
                          <td class="px-2 py-1 text-muted-foreground">
                            <!-- 合并模式显示 -->
                            <span v-if="getMergeConfig(field.key).enabled">
                              <span class="text-primary">合并:</span>
                              {{ getMergeConfig(field.key).fields.join(' + ') }}
                            </span>
                            <span v-else>
                              {{ hasMapping(field.key) ? fieldMapping[field.key] : '—' }}
                            </span>
                          </td>
                          <td class="max-w-[180px] truncate px-2 py-1">
                            <!-- 合并预览 -->
                            <span
                              v-if="getMergeConfig(field.key).enabled && getMergePreview(field.key)"
                              class="text-primary"
                            >
                              {{ formatPreview(getMergePreview(field.key), 50) }}
                            </span>
                            <span v-else-if="hasMapping(field.key) && rawPoems[0]">
                              {{
                                formatPreview(
                                  rawPoems[0][fieldMapping[field.key]!],
                                )
                              }}
                            </span>
                            <span v-else class="italic text-muted-foreground/50">
                              (未映射)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- 完整 JSON 展开 -->
              <div v-if="showRawJson" class="mt-3">
                <pre
                  class="max-h-60 overflow-auto rounded bg-muted p-3 text-xs text-foreground"
                  >{{ JSON.stringify(rawPoems[0], null, 2) }}</pre
                >
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- ========== 步骤 3：数据预览 ========== -->
    <template v-else-if="currentStep === 'preview'">
      <!-- 统计摘要 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div class="text-sm text-muted-foreground">总计解析</div>
          <div class="mt-1 text-2xl font-bold">{{ parsedPoems.length }}</div>
          <div class="text-xs text-muted-foreground">首诗歌</div>
        </div>
        <div class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 shadow-sm">
          <div class="text-sm text-green-700 dark:text-green-400">校验通过</div>
          <div class="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {{ validCount }}
          </div>
          <div class="text-xs text-green-600/70 dark:text-green-400/70">首可导入</div>
        </div>
        <div
          v-if="invalidCount > 0"
          class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 shadow-sm"
        >
          <div class="text-sm text-destructive">校验失败</div>
          <div class="mt-1 text-2xl font-bold text-destructive">
            {{ invalidCount }}
          </div>
          <div class="text-xs text-destructive/70">首需修正</div>
        </div>
      </div>

      <!-- 简繁体检测与确认 -->
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium">字符类型</span>
            <span v-if="charsTypeLoading" class="flex items-center gap-2 text-sm text-muted-foreground">
              <div class="loading-spinner-sm" />
              检测中...
            </span>
            <template v-else-if="detectedCharsType">
              <Badge variant="secondary" class="text-xs">
                自动检测：{{ charsTypeLabels[detectedCharsType] }}
              </Badge>
              <span v-if="manualCharsType" class="text-xs text-muted-foreground">
                （已手动修正）
              </span>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">当前导入为：</span>
            <Select
              :model-value="manualCharsType || detectedCharsType || NONE_MAPPING"
              @update:model-value="
                manualCharsType = $event === NONE_MAPPING ? null : ($event as 'simplified' | 'traditional')
              "
            >
              <SelectTrigger class="w-32 h-8">
                <SelectValue placeholder="自动判断" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="NONE_MAPPING">自动判断</SelectItem>
                <SelectItem value="simplified">简体中文</SelectItem>
                <SelectItem value="traditional">繁体中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div
          v-if="getEffectiveCharsType()"
          class="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Info class="h-3.5 w-3.5" />
          导入后将自动生成{{ getEffectiveCharsType() === 'simplified' ? '繁体' : '简体' }}版本
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="flex items-center justify-between">
        <Button size="sm" variant="outline" @click="goBack">
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回映射
        </Button>
        <Button
          size="sm"
          :disabled="validCount === 0 || importing"
          @click="handleBatchImport"
        >
          <span v-if="importing" class="flex items-center gap-2">
            <div class="loading-spinner-sm" />
            导入中 {{ Math.round(importProgress) }}%
          </span>
          <span v-else>
            确认导入 {{ validCount }} 首
          </span>
        </Button>
      </div>

      <!-- 导入进度条 -->
      <div v-if="importing" class="rounded-lg border border-border bg-card p-4">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="text-muted-foreground">导入进度</span>
          <span class="font-medium">{{ Math.round(importProgress) }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: `${importProgress}%` }"
          />
        </div>
      </div>

      <!-- 预览表格 -->
      <div class="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/50">
              <th class="w-14 px-3 py-2 text-left font-medium">序号</th>
              <th class="px-3 py-2 text-left font-medium">标题</th>
              <th class="w-24 px-3 py-2 text-left font-medium">作者</th>
              <th class="w-20 px-3 py-2 text-left font-medium">朝代</th>
              <th class="px-3 py-2 text-left font-medium">内容</th>
              <th class="w-20 px-3 py-2 text-left font-medium">状态</th>
              <th class="w-16 px-3 py-2 text-left font-medium">校验</th>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr
              v-for="record in validatedPoems"
              :key="record.index"
              class="border-t border-border transition-colors"
              :class="{
                'bg-destructive/5': !record.valid,
                'bg-green-500/5': record.valid,
              }"
            >
              <td class="px-3 py-2 text-muted-foreground">
                {{ record.index + 1 }}
              </td>
              <td class="px-3 py-2">
                {{ record.poem.title || '-' }}
              </td>
              <td class="px-3 py-2">
                {{ record.poem.author || '-' }}
              </td>
              <td class="px-3 py-2">
                {{ record.poem.dynasty || '-' }}
              </td>
              <td class="max-w-xs truncate px-3 py-2">
                {{ truncate(record.poem.content, 40) }}
              </td>
              <td class="px-3 py-2">
                <Badge
                  v-if="record.poem.status === 'draft'"
                  variant="secondary"
                  class="text-xs"
                >
                  草稿
                </Badge>
                <Badge
                  v-else-if="record.poem.status === 'published'"
                  variant="default"
                  class="text-xs"
                >
                  发布
                </Badge>
                <Badge
                  v-else-if="record.poem.status === 'archived'"
                  variant="outline"
                  class="text-xs"
                >
                  归档
                </Badge>
                <span v-else>-</span>
              </td>
              <td class="px-3 py-2">
                <Tooltip v-if="!record.valid">
                  <TooltipTrigger>
                    <Badge variant="destructive" class="text-xs">
                      <AlertTriangle class="mr-1 h-3 w-3" />
                      失败
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">{{ record.errors.join('；') }}</p>
                  </TooltipContent>
                </Tooltip>
                <Badge
                  v-else
                  variant="outline"
                  class="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 text-xs"
                >
                  <Check class="mr-1 h-3 w-3" />
                  通过
                </Badge>
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>
    </template>

    <!-- ========== 步骤 4：导入结果 ========== -->
    <template v-else-if="currentStep === 'result' && importResult">
      <div
        class="rounded-xl border p-8 text-center"
        :class="
          importResult.failed === 0
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-yellow-500/30 bg-yellow-500/5'
        "
      >
        <!-- 成功图标 -->
        <div class="flex justify-center">
          <div
            class="flex h-20 w-20 items-center justify-center rounded-full"
            :class="
              importResult.failed === 0
                ? 'bg-green-500/10'
                : 'bg-yellow-500/10'
            "
          >
            <CheckCircle2
              v-if="importResult.failed === 0"
              class="h-10 w-10 text-green-500"
            />
            <AlertTriangle
              v-else
              class="h-10 w-10 text-yellow-500"
            />
          </div>
        </div>

        <div class="mt-4 text-xl font-semibold">
          {{ importResult.failed === 0 ? '导入成功' : '部分导入成功' }}
        </div>

        <!-- 统计 -->
        <div class="mt-4 flex justify-center gap-8">
          <div>
            <div class="text-3xl font-bold text-foreground">
              {{ importResult.total }}
            </div>
            <div class="text-sm text-muted-foreground">总计</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-green-500">
              {{ importResult.success }}
            </div>
            <div class="text-sm text-muted-foreground">成功</div>
          </div>
          <div v-if="importResult.failed > 0">
            <div class="text-3xl font-bold text-destructive">
              {{ importResult.failed }}
            </div>
            <div class="text-sm text-muted-foreground">失败</div>
          </div>
        </div>

        <!-- 简繁体转换状态 -->
        <div v-if="converting" class="mx-auto mt-6 max-w-md">
          <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div class="loading-spinner-sm" />
            正在识别简繁体并自动生成另一版本...
          </div>
        </div>
        <div
          v-if="convertInfo && !converting"
          class="mx-auto mt-6 max-w-md rounded-lg border border-blue-500/30 bg-blue-500/5 p-4"
        >
          <div class="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <CheckCircle2 class="h-4 w-4" />
            简繁体自动转换完成
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            检测到{{ convertInfo.detected === 'traditional' ? '繁体' : '简体' }}中文，
            已自动生成{{ convertInfo.target === 'simplified' ? '简体' : '繁体' }}版本
            （{{ convertInfo.result.converted }} 首）
          </div>
        </div>

        <!-- 失败详情 -->
        <div
          v-if="importResult.errors.length > 0"
          class="mx-auto mt-6 max-w-lg"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="font-medium text-destructive">失败详情</span>
            <Button size="sm" variant="outline" @click="downloadFailedRecords">
              <Download class="mr-2 h-4 w-4" />
              下载失败记录
            </Button>
          </div>
          <div class="max-h-48 overflow-auto rounded-lg border border-border bg-card p-3">
            <div
              v-for="err in importResult.errors"
              :key="err.index"
              class="flex items-start gap-2 border-b border-border py-2 text-sm last:border-b-0"
            >
              <Badge variant="destructive" class="shrink-0 text-xs">
                #{{ err.index + 1 }}
              </Badge>
              <div class="text-left">
                <span class="font-medium">{{ err.title || '未知' }}</span>
                <span class="text-muted-foreground"> — {{ err.error }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-6 flex justify-center gap-3">
          <Button
            v-if="importResult.failed > 0"
            variant="outline"
            @click="retryFailed"
            :disabled="importing"
          >
            <RotateCcw class="mr-2 h-4 w-4" />
            重试失败项
          </Button>
          <Button variant="outline" @click="resetBatch">
            <Plus class="mr-2 h-4 w-4" />
            继续导入
          </Button>
          <Button variant="outline" @click="router.push('/poetry/import-records')">
            <History class="mr-2 h-4 w-4" />
            查看导入记录
          </Button>
          <Button @click="router.push('/poetry/list')">
            <FileText class="mr-2 h-4 w-4" />
            查看诗歌列表
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ===== 加载动画 ===== */
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
