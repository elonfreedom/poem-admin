<script lang="ts" setup>
import type { CreatePoetryParams, ImportError } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { importPoetryApi } from '#/api';

const router = useRouter();

// 原始诗歌数据类型
interface RawPoem {
  [key: string]: unknown;
}

// 数据库字段定义
interface TargetField {
  key: keyof CreatePoetryParams;
  label: string;
  required?: boolean;
  isArray?: boolean; // 是否需要将数组转为字符串
}

const targetFields: TargetField[] = [
  { key: 'title', label: '标题', required: true },
  { key: 'author', label: '作者', required: true },
  { key: 'content', label: '内容', required: true },
  { key: 'dynasty', label: '朝代' },
  { key: 'category_id', label: '分类ID' },
  { key: 'tags', label: '标签', isArray: true },
  { key: 'cover_url', label: '封面图URL' },
  { key: 'source', label: '来源' },
  { key: 'status', label: '状态' },
  { key: 'translation', label: '翻译' },
  { key: 'appreciation', label: '赏析' },
];

// 默认映射：每个目标字段对应的候选源字段名（按优先级排序）
const defaultMappingCandidates: Record<string, string[]> = {
  title: ['title', 'name', '标题', '诗题'],
  author: ['author', '诗人', '作者'],
  content: ['content', 'body', 'text', '内容', '正文', '诗句'],
  dynasty: ['dynasty', 'dynasty_name', '朝代', '年代'],
  category_id: ['category_id', 'category', '分类ID', '分类'],
  tags: ['tags', 'tag', '标签', '类别'],
  cover_url: ['cover_url', 'cover', 'image', '封面', '图片'],
  source: ['source', '来源', '出处', '来源书籍', '书目'],
  status: ['status', '状态'],
  translation: ['translation', '翻译', '译文'],
  appreciation: ['appreciation', 'appreciate', 'note', '赏析', '注释', '备注'],
};

// 根据映射配置，从原始数据提取字段值
function extractValue(raw: RawPoem, sourceField: string): unknown {
  const val = raw[sourceField];
  if (val === undefined || val === null) return '';
  return val;
}

function applyMapping(
  raw: RawPoem,
  mapping: Record<string, string>,
): CreatePoetryParams {
  const getStr = (key: string) => {
    const sourceField = mapping[key];
    if (!sourceField) return '';
    const val = extractValue(raw, sourceField);
    if (Array.isArray(val)) return val.join('\n');
    return String(val || '');
  };

  const getNum = (key: string) => {
    const sourceField = mapping[key];
    if (!sourceField) return undefined;
    const val = extractValue(raw, sourceField);
    return Number(val) || undefined;
  };

  const getArr = (key: string) => {
    const sourceField = mapping[key];
    if (!sourceField) return undefined;
    const val = extractValue(raw, sourceField);
    if (Array.isArray(val)) return val as string[];
    return val ? [String(val)] : undefined;
  };

  return {
    title: getStr('title'),
    author: getStr('author'),
    content: getStr('content'),
    dynasty: getStr('dynasty'),
    category_id: getNum('category_id'),
    tags: getArr('tags'),
    cover_url: getStr('cover_url'),
    source: getStr('source'),
    status: getStr('status') || 'draft',
    translation: getStr('translation'),
    appreciation: getStr('appreciation'),
  };
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const importFile = ref<File | null>(null);
const rawPoems = ref<RawPoem[]>([]);
const parsedPoems = ref<CreatePoetryParams[]>([]);
const parseErrors = ref<string[]>([]);
const importing = ref(false);
const importResult = ref<null | {
  errors: ImportError[];
  failed: number;
  success: number;
  total: number;
}>(null);

// 统一来源：应用到本次导入的所有诗文
const defaultSource = ref('');
// 字段映射配置：目标字段 -> 源字段
const fieldMapping = ref<Record<string, string>>({});
// 源文件中的所有字段名
const sourceFields = ref<string[]>([]);
// 是否已应用映射（用于控制预览表格显示）
const mappingApplied = ref(false);
// 是否展开完整 JSON
const showRawJson = ref(false);

// 初始化映射：自动匹配源字段
function initMapping(rawData: RawPoem[]) {
  // 收集所有源字段名
  const fieldSet = new Set<string>();
  for (const item of rawData) {
    Object.keys(item).forEach((k) => fieldSet.add(k));
  }
  sourceFields.value = [...fieldSet].toSorted();

  // 自动匹配：优先使用候选字段名，否则留空
  const newMapping: Record<string, string> = {};
  for (const target of targetFields) {
    const candidates = defaultMappingCandidates[target.key as string] || [];
    const matched = candidates.find((c) => sourceFields.value.includes(c));
    newMapping[target.key as string] = matched || '';
  }
  fieldMapping.value = newMapping;
  mappingApplied.value = false;
}

// 应用映射，生成 parsedPoems
function applyMappingAndParse() {
  parsedPoems.value = rawPoems.value.map((raw) =>
    applyMapping(raw, fieldMapping.value),
  );
  mappingApplied.value = true;
}

const validatedPoems = computed(() => {
  if (!mappingApplied.value) return [];
  return parsedPoems.value.map((poem, index) => {
    const errors: string[] = [];
    if (!poem.title?.trim()) errors.push('缺少标题');
    if (!poem.author?.trim()) errors.push('缺少作者');
    if (!poem.content?.trim()) errors.push('缺少内容');
    return { index, poem, errors, valid: errors.length === 0 };
  });
});

const validCount = computed(
  () => validatedPoems.value.filter((p) => p.valid).length,
);
const invalidCount = computed(
  () => validatedPoems.value.filter((p) => !p.valid).length,
);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) parseFile(file);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) parseFile(file);
}

async function parseFile(file: File) {
  importFile.value = file;
  parseErrors.value = [];
  parsedPoems.value = [];
  rawPoems.value = [];
  importResult.value = null;
  mappingApplied.value = false;

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json)) {
      parseErrors.value = ['JSON 格式错误：根节点必须是数组'];
      return;
    }
    rawPoems.value = json as RawPoem[];
    initMapping(rawPoems.value);
  } catch {
    parseErrors.value = ['JSON 解析失败，请检查文件格式'];
  }
}

async function handleBatchImport() {
  let validPoems = parsedPoems.value.filter(
    (_, index) => validatedPoems.value[index]?.valid,
  );
  if (validPoems.length === 0) return;

  // 如果有统一来源，应用到未填写来源的诗文
  if (defaultSource.value.trim()) {
    validPoems = validPoems.map((poem) => ({
      ...poem,
      source: poem.source || defaultSource.value.trim(),
    }));
  }

  importing.value = true;
  try {
    // 支持统一来源时发送新格式 { source, poems }
    const payload = defaultSource.value.trim()
      ? { source: defaultSource.value.trim(), poems: validPoems }
      : validPoems;
    importResult.value = await importPoetryApi(payload as CreatePoetryParams[]);
    if (importResult.value.failed === 0) {
      setTimeout(() => router.push('/poetry/list'), 1500);
    }
  } finally {
    importing.value = false;
  }
}

function downloadTemplate() {
  // 模板示例 - 支持多种字段名格式
  const template = [
    {
      title: '静夜思',
      author: '李白',
      dynasty: '唐',
      paragraphs: ['床前明月光，疑是地上霜。', '举头望明月，低头思故乡。'],
      translation: '明亮的月光洒在床前的窗户纸上...',
      note: ['这首诗写的是在寂静的月夜思念家乡的感受...'],
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'poetry_import_template.json';
  a.click();
  URL.revokeObjectURL(url);
}

function resetBatch() {
  importFile.value = null;
  parsedPoems.value = [];
  rawPoems.value = [];
  parseErrors.value = [];
  importResult.value = null;
  mappingApplied.value = false;
  fieldMapping.value = {};
  sourceFields.value = [];
  showRawJson.value = false;
  defaultSource.value = '';
}
</script>

<template>
  <Page title="批量导入">
    <template #extra>
      <div class="flex gap-2">
        <VbenButton @click="router.push('/poetry/create')">单个录入</VbenButton>
        <VbenButton @click="router.push('/poetry/list')">返回列表</VbenButton>
      </div>
    </template>

    <div class="mb-4 flex items-center justify-between">
      <VbenButton size="small" variant="outline" @click="downloadTemplate">
        下载模板
      </VbenButton>
      <VbenButton
        v-if="parsedPoems.length > 0"
        size="small"
        variant="outline"
        @click="resetBatch"
      >
        重新上传
      </VbenButton>
    </div>

    <!-- 上传区域 -->
    <div
      class="mb-6 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-10 text-center hover:border-blue-400"
      @drop="handleDrop"
      @dragover.prevent
      @click="fileInputRef?.click()"
    >
      <input
        id="batchFileInput"
        ref="fileInputRef"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileChange"
      />
      <div class="text-gray-500">
        <div class="mb-2 text-lg">拖拽 JSON 文件到此处，或点击上传</div>
        <div class="text-sm">支持 .json 格式，根节点为数组</div>
      </div>
    </div>

    <!-- 解析错误 -->
    <div
      v-if="parseErrors.length > 0"
      class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
    >
      {{ parseErrors[0] }}
    </div>

    <!-- 字段映射配置 -->
    <div v-if="rawPoems.length > 0 && !importResult" class="mb-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <span class="mr-2 text-base font-semibold">字段映射</span>
          <span class="text-sm text-gray-500">
            共解析 {{ rawPoems.length }} 首，请确认字段对应关系
          </span>
        </div>
        <VbenButton size="small" @click="applyMappingAndParse">
          应用映射
        </VbenButton>
      </div>

      <!-- 统一来源输入 -->
      <div
        class="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3"
      >
        <label class="shrink-0 text-sm font-medium text-blue-700">
          统一来源
        </label>
        <input
          v-model="defaultSource"
          type="text"
          placeholder="设置后应用到本次导入的所有诗文（如《唐诗三百首》）"
          class="h-8 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <span class="shrink-0 text-xs text-gray-500">
          优先级低于字段映射中的来源列
        </span>
      </div>

      <div class="rounded-lg border border-gray-200 p-4">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div
            v-for="field in targetFields"
            :key="field.key"
            class="flex items-center gap-2"
          >
            <span class="w-20 shrink-0 text-right text-sm text-gray-600">
              <span v-if="field.required" class="mr-1 text-red-500">*</span>
              {{ field.label }}
            </span>
            <select
              v-model="fieldMapping[field.key]"
              class="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">不映射</option>
              <option v-for="f in sourceFields" :key="f" :value="f">
                {{ f }}
              </option>
            </select>
          </div>
        </div>

        <!-- 第一条原始数据 + 映射预览 - 左右布局 -->
        <div v-if="rawPoems.length > 0" class="mt-4 border-t pt-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500">第一条数据映射对照：</span>
            <button
              class="text-xs text-blue-500 hover:text-blue-700"
              @click="showRawJson = !showRawJson"
            >
              {{ showRawJson ? '收起完整 JSON' : '展开完整 JSON' }}
            </button>
          </div>

          <!-- 左右布局容器 -->
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <!-- 左侧：原始数据 -->
            <div class="rounded border bg-white p-2 text-xs">
              <div class="mb-2 font-medium text-gray-600">原始数据</div>
              <div class="max-h-72 overflow-auto">
                <table class="w-full border-collapse">
                  <tbody>
                    <tr
                      v-for="(value, key) in rawPoems[0]"
                      :key="key"
                      class="border-b last:border-b-0"
                    >
                      <td
                        class="w-24 shrink-0 bg-gray-50 px-2 py-1 font-medium text-gray-600"
                      >
                        {{ key }}
                      </td>
                      <td
                        class="max-w-[200px] truncate px-2 py-1 text-gray-800"
                      >
                        {{ JSON.stringify(value)?.slice(0, 50) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 右侧：映射结果预览 -->
            <div class="rounded border bg-blue-50/50 p-2 text-xs">
              <div class="mb-2 font-medium text-gray-600">映射结果</div>
              <div class="max-h-72 overflow-auto">
                <table class="w-full border-collapse">
                  <thead class="sticky top-0 bg-blue-50/90">
                    <tr class="border-b border-blue-200">
                      <th
                        class="w-16 shrink-0 px-2 py-1 text-left text-gray-500"
                      >
                        目标
                      </th>
                      <th
                        class="w-20 shrink-0 px-2 py-1 text-left text-gray-500"
                      >
                        源字段
                      </th>
                      <th class="px-2 py-1 text-left text-gray-500">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="field in targetFields"
                      :key="field.key"
                      class="border-b border-blue-100 last:border-b-0"
                    >
                      <td class="px-2 py-1 font-medium">
                        {{ field.label }}
                        <span v-if="field.required" class="text-red-500">*</span>
                      </td>
                      <td class="px-2 py-1 text-gray-500">
                        {{ fieldMapping[field.key] || '—' }}
                      </td>
                      <td class="max-w-[180px] truncate px-2 py-1">
                        <span
                          v-if="fieldMapping[field.key]"
                          class="text-gray-800"
                        >
                          {{
                            JSON.stringify(
                              rawPoems[0]?.[fieldMapping[field.key]],
                            )?.slice(0, 40) || '(空)'
                          }}
                        </span>
                        <span v-else class="text-gray-400 italic">(未映射)</span>
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
              class="max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400"
              >{{ JSON.stringify(rawPoems[0], null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览 -->
    <div v-if="mappingApplied && parsedPoems.length > 0 && !importResult">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <span class="text-gray-600">共解析 {{ parsedPoems.length }} 首</span>
          <span class="ml-4 text-green-600">可导入 {{ validCount }} 首</span>
          <span v-if="invalidCount > 0" class="ml-4 text-red-500">
            校验失败 {{ invalidCount }} 首
          </span>
        </div>
        <VbenButton
          size="small"
          :disabled="validCount === 0 || importing"
          @click="handleBatchImport"
        >
          <span v-if="importing">导入中...</span>
          <span v-else>确认导入</span>
        </VbenButton>
      </div>

      <div class="overflow-x-auto rounded-md border">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-14 px-3 py-2 text-left font-medium">序号</th>
              <th class="px-3 py-2 text-left font-medium">标题</th>
              <th class="w-24 px-3 py-2 text-left font-medium">作者</th>
              <th class="w-20 px-3 py-2 text-left font-medium">朝代</th>
              <th class="px-3 py-2 text-left font-medium">内容</th>
              <th class="w-32 px-3 py-2 text-left font-medium">来源</th>
              <th class="w-20 px-3 py-2 text-left font-medium">状态</th>
              <th class="w-16 px-3 py-2 text-left font-medium">校验</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in validatedPoems"
              :key="record.index"
              class="border-t"
            >
              <td class="px-3 py-2">{{ record.index + 1 }}</td>
              <td class="px-3 py-2">{{ record.poem.title || '-' }}</td>
              <td class="px-3 py-2">{{ record.poem.author || '-' }}</td>
              <td class="px-3 py-2">{{ record.poem.dynasty || '-' }}</td>
              <td class="max-w-xs truncate px-3 py-2">
                {{ record.poem.content || '-' }}
              </td>
              <td class="max-w-[120px] truncate px-3 py-2">
                <span v-if="record.poem.source">{{ record.poem.source }}</span>
                <span v-else-if="defaultSource" class="italic text-blue-500">
                  {{ defaultSource }}（默认）
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-3 py-2">
                <span
                  v-if="record.poem.status === 'draft'"
                  class="inline-block rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  草稿
                </span>
                <span
                  v-else-if="record.poem.status === 'published'"
                  class="inline-block rounded-md bg-green-500 px-2 py-0.5 text-xs text-white"
                >
                  发布
                </span>
                <span
                  v-else-if="record.poem.status === 'archived'"
                  class="inline-block rounded-md bg-yellow-500 px-2 py-0.5 text-xs text-white"
                >
                  归档
                </span>
                <span v-else>-</span>
              </td>
              <td class="px-3 py-2">
                <span
                  v-if="record.valid"
                  class="inline-block rounded-md bg-green-500 px-2 py-0.5 text-xs text-white"
                >
                  通过
                </span>
                <span
                  v-else
                  class="inline-block rounded-md bg-destructive px-2 py-0.5 text-xs text-white"
                  :title="record.errors.join('；')"
                >
                  失败
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 导入结果 -->
    <div
      v-if="importResult"
      class="rounded-md border p-6"
      :class="
        importResult.failed === 0
          ? 'border-green-200 bg-green-50'
          : 'border-yellow-200 bg-yellow-50'
      "
    >
      <div class="mb-2 text-lg font-semibold">导入完成</div>
      <div class="text-gray-600">
        共 {{ importResult.total }} 首，成功 {{ importResult.success }} 首，失败
        {{ importResult.failed }} 首
      </div>

      <div
        v-if="importResult.errors.length > 0"
        class="mx-auto mt-4 max-w-lg text-left"
      >
        <div class="mb-2 font-semibold text-red-500">失败详情：</div>
        <div
          v-for="err in importResult.errors"
          :key="err.index"
          class="text-sm text-gray-600"
        >
          第 {{ err.index + 1 }} 首「{{ err.title }}」：{{ err.error }}
        </div>
      </div>

      <div class="mt-4">
        <VbenButton v-if="importResult.failed > 0" @click="resetBatch">
          重新上传
        </VbenButton>
      </div>
    </div>
  </Page>
</template>
