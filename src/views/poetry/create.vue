<script lang="ts" setup>
import type { CreatePoetryParams } from '#/api';

import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import { ArrowLeft, ChevronDown, Save, Upload, Wand2 } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Textarea } from '#/components/ui/textarea';

import PageHeader from '#/components/PageHeader.vue';
import AuthorSelect from '#/components/AuthorSelect.vue';
import CategorySelect from '#/components/CategorySelect.vue';
import PinyinInput from '#/components/PinyinInput.vue';
import TagInput from '#/components/TagInput.vue';
import { createPoetryApi } from '#/api';
import type { AuthorOption } from '#/api/core/author';
import { formatPoetryContent } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

// ========== 单个录入 ==========
const submitting = ref(false);

// 拼音组件的 ref
const titlePinyinRef = useTemplateRef('titlePinyin');
const contentPinyinRef = useTemplateRef('contentPinyin');

// 作者相关
const selectedAuthorId = ref<number | undefined>(undefined);
const authorText = ref('');

// 标签
const tags = ref<string[]>([]);

// 辅助内容折叠状态
const auxiliaryOpen = ref(false);

// 表单数据
const formData = ref({
  title: '',
  title_sc: '',
  author: '',
  author_sc: '',
  dynasty: '',
  category_id: undefined as number | undefined,
  content: '',
  content_sc: '',
  translation: '',
  appreciation: '',
  cover_url: '',
  source: '',
  status: 'draft',
});

// 表单错误
const errors = ref<Record<string, string>>({});

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
];

// 选择作者
function handleAuthorSelect(author: AuthorOption) {
  selectedAuthorId.value = author.id;
  authorText.value = author.name;
  formData.value.author = author.name;
  formData.value.dynasty = author.dynasty;
}

// 作者 ID 变化（清空时）
function handleAuthorIdChange(value: number | undefined) {
  if (!value) {
    selectedAuthorId.value = undefined;
  }
}

// 内容字数统计
const contentLength = computed(() => {
  return [...formData.value.content].length;
});

// 统计一行中的汉字数（仅中文字符）
function countChars(line: string): number {
  return [...line].filter((c) => /[一-鿿㐀-䶿]/.test(c)).length;
}

// 格式化内容（简体同步，拼音按行重组）
async function handleFormatContent() {
  const tc = formatPoetryContent(formData.value.content);
  const sc = formatPoetryContent(formData.value.content_sc);

  // 获取当前拼音音节
  const syllables = (contentPinyinRef.value?.getValue() || '').trim().split(/\s+/).filter(Boolean);

  const tcLines = tc.split('\n');
  const scLines = sc.split('\n');
  const maxLines = Math.max(tcLines.length, scLines.length);
  while (tcLines.length < maxLines) tcLines.push('');
  while (scLines.length < maxLines) scLines.push('');

  formData.value.content = tcLines.join('\n');
  formData.value.content_sc = scLines.join('\n');

  // 按繁体行重新分组拼音
  let idx = 0;
  const linePinyin: string[] = [];
  for (const line of tcLines) {
    const n = countChars(line);
    if (n === 0) {
      linePinyin.push('');
    } else {
      const slice = syllables.slice(idx, idx + n);
      linePinyin.push(slice.join(' '));
      idx += n;
    }
  }
  // 等待 PinyinInput 的 chars 更新后，调用其内置格式化方法
  await nextTick();
  contentPinyinRef.value?.formatPinyin(tcLines.join('\n'));
}

// 标记：是否正在同步中（防止循环触发）
const syncingContent = ref(false);

/**
 * 将 sourceText 的 line 结构应用到 targetText 上
 * 例如 source 有 3 行 [5字, 5字, 7字]，则 target 也按 [5,5,7] 分行
 */
function applyLineStructure(sourceText: string, targetText: string): string {
  const sourceLines = sourceText.split('\n');
  const targetChars = [...targetText].filter((c) => c !== '\n');
  const result: string[] = [];
  let charIdx = 0;

  for (const line of sourceLines) {
    const lineCharCount = [...line].filter((c) => c !== '\r').length;
    if (lineCharCount === 0) {
      result.push('');
      continue;
    }
    const slice = targetChars.slice(charIdx, charIdx + lineCharCount);
    result.push(slice.join(''));
    charIdx += slice.length;
  }

  // 如果 target 还有剩余字符，追加到最后一行
  if (charIdx < targetChars.length) {
    const remaining = targetChars.slice(charIdx).join('');
    if (result.length > 0) {
      result[result.length - 1] += remaining;
    } else {
      result.push(remaining);
    }
  }

  return result.join('\n');
}

// 监听繁体内容变化，同步简体行结构
watch(() => formData.value.content, (newVal) => {
  if (syncingContent.value) return;
  if (!formData.value.content_sc) return;
  syncingContent.value = true;
  const synced = applyLineStructure(newVal, formData.value.content_sc);
  if (synced !== formData.value.content_sc) {
    formData.value.content_sc = synced;
  }
  nextTick(() => { syncingContent.value = false; });
});

// 监听简体内容变化，同步繁体行结构
watch(() => formData.value.content_sc, (newVal) => {
  if (syncingContent.value) return;
  if (!formData.value.content) return;
  syncingContent.value = true;
  const synced = applyLineStructure(newVal, formData.value.content);
  if (synced !== formData.value.content) {
    formData.value.content = synced;
  }
  nextTick(() => { syncingContent.value = false; });
});

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.title?.trim()) {
    errors.value.title = '请输入标题';
  }
  if (!authorText.value?.trim()) {
    errors.value.author = '请输入作者';
  }
  if (!formData.value.content?.trim()) {
    errors.value.content = '请输入内容';
  }
  if (Object.keys(errors.value).length > 0) {
    return;
  }

  try {
    submitting.value = true;
    await createPoetryApi({
      ...formData.value,
      author: authorText.value,
      author_sc: formData.value.author_sc,
      author_id: selectedAuthorId.value,
      title_pinyin: titlePinyinRef.value?.getValue() || '',
      content_pinyin: contentPinyinRef.value?.getValue() || '',
      tags: tags.value,
    } as CreatePoetryParams);
    toast.success('诗歌创建成功');
    router.push('/poetry/list');
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="诗歌录入">
      <template #extra>
        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/poetry/batch')">
            <Upload class="mr-2 h-4 w-4" />
            批量导入
          </Button>
          <Button variant="outline" @click="router.push('/poetry/list')">
            <ArrowLeft class="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </div>
      </template>
    </PageHeader>

    <form @submit.prevent="handleSubmit">
      <!-- 核心内容 -->
      <Card class="mb-4">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">核心内容</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 标题 + 拼音 -->
          <div class="space-y-2">
            <Label for="title">
              标题 <span class="text-destructive">*</span>
            </Label>
            <div class="flex items-center gap-2">
              <span class="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">繁体</span>
              <Input
                id="title"
                v-model="formData.title"
                placeholder="请输入标题"
                class="flex-1"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">简体</span>
              <Input
                id="title_sc"
                v-model="formData.title_sc"
                placeholder="简体标题（可选）"
                class="flex-1 text-sm"
              />
            </div>
            <PinyinInput
              ref="titlePinyin"
              :text-value="formData.title"
              type="input"
              placeholder="标题拼音（自动生成或手动输入）"
            />
            <p v-if="errors.title" class="text-sm text-destructive">
              {{ errors.title }}
            </p>
          </div>

          <!-- 内容 + 拼音 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="content">
                内容 <span class="text-destructive">*</span>
              </Label>
              <Button type="button" variant="ghost" size="xs" class="h-6 text-xs text-muted-foreground" @click="handleFormatContent">
                <Wand2 class="mr-1 h-3 w-3" />
                一键格式化
              </Button>
            </div>
            <div class="flex items-start gap-2">
              <span class="mt-2 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">繁体</span>
              <Textarea
                id="content"
                v-model="formData.content"
                :rows="6"
                placeholder="请输入诗歌内容，每句一行"
                class="resize-y flex-1"
              />
            </div>
            <div class="flex items-start gap-2">
              <span class="mt-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">简体</span>
              <Textarea
                id="content_sc"
                v-model="formData.content_sc"
                :rows="6"
                placeholder="简体内容（可选），行数与繁体自动对应"
                class="resize-y flex-1 text-sm"
              />
            </div>
            <PinyinInput
              ref="contentPinyin"
              :text-value="formData.content"
              :display-text="formData.content_sc || formData.content"
              type="textarea"
              placeholder="内容拼音（自动生成或手动输入），每行对应一行文字"
            />
            <div class="flex items-center justify-between">
              <p v-if="errors.content" class="text-sm text-destructive">
                {{ errors.content }}
              </p>
              <span class="ml-auto text-xs text-muted-foreground">
                {{ contentLength }} 字
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 作者 + 分类标签（双列） -->
      <div class="mb-4 grid gap-4 md:grid-cols-2">
        <!-- 作者信息 -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">作者信息</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 作者（搜索选择） -->
            <div class="space-y-2">
              <Label>
                作者 <span class="text-destructive">*</span>
              </Label>
              <AuthorSelect
                v-model="selectedAuthorId"
                @select="handleAuthorSelect"
                @update:model-value="handleAuthorIdChange"
              />
              <p v-if="errors.author" class="text-sm text-destructive">
                {{ errors.author }}
              </p>
            </div>

            <!-- 简体作者 -->
            <div class="space-y-2">
              <Label for="author_sc">简体作者</Label>
              <Input
                id="author_sc"
                v-model="formData.author_sc"
                placeholder="如：李白（可选）"
              />
            </div>

            <!-- 朝代（随作者绑定，选择作者后自动填充） -->
            <div class="space-y-2">
              <Label for="dynasty">朝代</Label>
              <Input
                id="dynasty"
                v-model="formData.dynasty"
                :disabled="!!selectedAuthorId"
                placeholder="选择作者后自动填充"
              />
            </div>
          </CardContent>
        </Card>

        <!-- 分类与标签 -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">分类与标签</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 分类 -->
            <div class="space-y-2">
              <Label>分类</Label>
              <CategorySelect v-model="formData.category_id" />
            </div>

            <!-- 标签 -->
            <div class="space-y-2">
              <Label>标签</Label>
              <TagInput v-model="tags" />
            </div>

            <!-- 状态 -->
            <div class="space-y-2">
              <Label for="status">状态</Label>
              <Select v-model="formData.status">
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 辅助内容（可折叠） -->
      <Card class="mb-4">
        <Collapsible v-model:open="auxiliaryOpen">
          <CollapsibleTrigger as-child>
            <CardHeader class="cursor-pointer pb-3 hover:bg-muted/50">
              <CardTitle class="flex items-center justify-between text-base">
                <span>辅助内容</span>
                <span class="flex items-center gap-2">
                  <span class="text-xs font-normal text-muted-foreground">
                    翻译 / 赏析
                  </span>
                  <ChevronDown
                    class="h-4 w-4 text-muted-foreground transition-transform"
                    :class="{ 'rotate-180': auxiliaryOpen }"
                  />
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent class="space-y-4">
              <!-- 翻译 -->
              <div class="space-y-2">
                <Label for="translation">翻译</Label>
                <Textarea
                  id="translation"
                  v-model="formData.translation"
                  :rows="6"
                  placeholder="请输入翻译（可选）"
                  class="resize-y"
                />
              </div>

              <!-- 赏析 -->
              <div class="space-y-2">
                <Label for="appreciation">赏析</Label>
                <Textarea
                  id="appreciation"
                  v-model="formData.appreciation"
                  :rows="6"
                  placeholder="请输入赏析（可选）"
                  class="resize-y"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <!-- 附加信息 -->
      <Card class="mb-4">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">附加信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-2">
            <!-- 来源 -->
            <div class="space-y-2">
              <Label for="source">来源</Label>
              <Input
                id="source"
                v-model="formData.source"
                placeholder="如《唐诗三百首》《宋词三百首》"
              />
            </div>

            <!-- 封面图URL -->
            <div class="space-y-2">
              <Label for="cover_url">封面图URL</Label>
              <Input
                id="cover_url"
                v-model="formData.cover_url"
                placeholder="请输入封面图URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 提交按钮 -->
      <div class="flex items-center gap-2">
        <Button type="submit" :loading="submitting">
          <Save class="mr-2 h-4 w-4" />
          保存
        </Button>
        <Button variant="outline" @click="router.push('/poetry/list')">
          取消
        </Button>
      </div>
    </form>
  </div>
</template>
