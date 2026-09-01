<script lang="ts" setup>
import type { Announcement } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Pencil, Plus, Trash2 } from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { Textarea } from '#/components/ui/textarea';

import PageHeader from '#/components/PageHeader.vue';
import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementListApi,
  updateAnnouncementApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const loading = ref(false);
const list = ref<Announcement[]>([]);
const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
});

async function fetchList() {
  loading.value = true;
  try {
    list.value = await getAnnouncementListApi();
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  form.title = '';
  form.content = '';
  form.status = 'draft';
  modalVisible.value = true;
}

function handleEdit(item: Announcement) {
  editingId.value = item.id;
  form.title = item.title;
  form.content = item.content;
  form.status = item.status;
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!form.title.trim() || !form.content.trim()) {
    toast.error('请填写标题和内容');
    return;
  }
  submitting.value = true;
  try {
    editingId.value
      ? await updateAnnouncementApi(editingId.value, form)
      : await createAnnouncementApi(form);
    toast.success(editingId.value ? '更新成功' : '创建成功');
    modalVisible.value = false;
    await fetchList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteAnnouncementApi(id);
  toast.success('删除成功');
  fetchList();
}

onMounted(fetchList);

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
};

const statusVariants: Record<string, string> = {
  draft: 'secondary',
  published: 'default',
};
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="公告管理">
      <template #extra>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新建公告
        </Button>
      </template>
    </PageHeader>

    <!-- 表格 -->
    <div class="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50">
            <TableHead class="w-[80px]">ID</TableHead>
            <TableHead>标题</TableHead>
            <TableHead class="w-[100px]">状态</TableHead>
            <TableHead class="w-[180px]">创建时间</TableHead>
            <TableHead class="w-[150px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in list" :key="row.id">
            <TableCell>{{ row.id }}</TableCell>
            <TableCell>{{ row.title }}</TableCell>
            <TableCell>
              <Badge :variant="statusVariants[row.status] as any">
                {{ statusLabels[row.status] }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDateTime(row.created_at) }}</TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="handleEdit(row)">
                  <Pencil class="mr-1 h-3.5 w-3.5" />
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  @click="handleDelete(row.id)"
                >
                  <Trash2 class="mr-1 h-3.5 w-3.5" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="list.length === 0 && !loading">
            <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-if="loading">
            <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:open="modalVisible">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑公告' : '新建公告' }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="ann-title">
              标题 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="ann-title"
              v-model="form.title"
              placeholder="请输入公告标题"
            />
          </div>
          <div class="space-y-2">
            <Label for="ann-content">
              内容 <span class="text-destructive">*</span>
            </Label>
            <Textarea
              id="ann-content"
              v-model="form.content"
              placeholder="请输入公告内容"
              :rows="4"
            />
          </div>
          <div class="space-y-2">
            <Label for="ann-status">状态</Label>
            <Select v-model="form.status">
              <SelectTrigger id="ann-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">发布</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="modalVisible = false">
            取消
          </Button>
          <Button :loading="submitting" @click="handleSubmit">
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
