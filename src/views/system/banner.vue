<script lang="ts" setup>
import type { Banner } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Pencil, Plus, Trash2 } from 'lucide-vue-next';

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

import PageHeader from '#/components/PageHeader.vue';
import {
  createBannerApi,
  deleteBannerApi,
  getBannerListApi,
  updateBannerApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const loading = ref(false);
const bannerList = ref<Banner[]>([]);
const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  image_url: '',
  link_type: 'url' as 'poem' | 'url',
  link_value: '',
  sort: 0,
  status: 'active' as 'active' | 'inactive',
});

async function fetchList() {
  loading.value = true;
  try {
    bannerList.value = await getBannerListApi();
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  resetForm();
  modalVisible.value = true;
}

function handleEdit(banner: Banner) {
  editingId.value = banner.id;
  Object.assign(form, banner);
  modalVisible.value = true;
}

function resetForm() {
  form.title = '';
  form.image_url = '';
  form.link_type = 'url';
  form.link_value = '';
  form.sort = 0;
  form.status = 'active';
}

async function handleSubmit() {
  if (!form.title.trim() || !form.image_url.trim() || !form.link_value.trim()) {
    toast.error('请填写完整信息');
    return;
  }
  submitting.value = true;
  try {
    editingId.value
      ? await updateBannerApi(editingId.value, form)
      : await createBannerApi(form as Omit<Banner, 'created_at' | 'id'>);
    toast.success(editingId.value ? '更新成功' : '创建成功');
    modalVisible.value = false;
    await fetchList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteBannerApi(id);
  toast.success('删除成功');
  fetchList();
}

async function handleStatusChange(id: number, status: 'active' | 'inactive') {
  await updateBannerApi(id, { status });
  fetchList();
}

onMounted(fetchList);
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="Banner 管理">
      <template #extra>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新建 Banner
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
            <TableHead class="w-[120px]">图片</TableHead>
            <TableHead class="w-[100px]">链接类型</TableHead>
            <TableHead class="w-[80px]">排序</TableHead>
            <TableHead class="w-[100px]">状态</TableHead>
            <TableHead class="w-[180px]">创建时间</TableHead>
            <TableHead class="w-[150px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in bannerList" :key="row.id">
            <TableCell>{{ row.id }}</TableCell>
            <TableCell>{{ row.title }}</TableCell>
            <TableCell>
              <img
                :src="row.image_url"
                alt="banner"
                class="h-10 w-20 rounded object-cover"
              />
            </TableCell>
            <TableCell>{{ row.link_type === 'poem' ? '诗歌' : '外链' }}</TableCell>
            <TableCell>{{ row.sort }}</TableCell>
            <TableCell>
              <Button
                :variant="row.status === 'active' ? 'default' : 'secondary'"
                size="sm"
                class="h-7 px-2 text-xs"
                @click="
                  handleStatusChange(
                    row.id,
                    row.status === 'active' ? 'inactive' : 'active',
                  )
                "
              >
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </Button>
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
          <TableRow v-if="bannerList.length === 0 && !loading">
            <TableCell colspan="8" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-if="loading">
            <TableCell colspan="8" class="h-32 text-center text-muted-foreground">
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
          <DialogTitle>{{ editingId ? '编辑 Banner' : '新建 Banner' }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="banner-title">
              标题 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="banner-title"
              v-model="form.title"
              placeholder="请输入标题"
            />
          </div>
          <div class="space-y-2">
            <Label for="banner-image">
              图片URL <span class="text-destructive">*</span>
            </Label>
            <Input
              id="banner-image"
              v-model="form.image_url"
              placeholder="请输入图片地址"
            />
            <img
              v-if="form.image_url"
              :src="form.image_url"
              alt="preview"
              class="mt-2 h-20 w-40 rounded object-cover"
            />
          </div>
          <div class="space-y-2">
            <Label for="banner-link-type">链接类型</Label>
            <Select v-model="form.link_type">
              <SelectTrigger id="banner-link-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">外链</SelectItem>
                <SelectItem value="poem">诗歌</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="banner-link-value">
              链接值 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="banner-link-value"
              v-model="form.link_value"
              :placeholder="form.link_type === 'poem' ? '请输入诗歌ID' : '请输入URL'"
            />
          </div>
          <div class="space-y-2">
            <Label for="banner-sort">排序值</Label>
            <Input
              id="banner-sort"
              v-model.number="form.sort"
              type="number"
              :min="0"
            />
          </div>
          <div class="space-y-2">
            <Label for="banner-status">状态</Label>
            <Select v-model="form.status">
              <SelectTrigger id="banner-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
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
