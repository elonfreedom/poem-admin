<script lang="ts" setup>
import type { Category } from '#/api';

import { ref } from 'vue';

import { Pencil, Plus, Trash2 } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';

import PageHeader from '#/components/PageHeader.vue';
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';
import { toast } from 'vue-sonner';

const categoryList = ref<Category[]>([]);
const editingId = ref<null | number>(null);
const modalVisible = ref(false);
const submitting = ref(false);

// 表单数据
const formData = ref({
  name: '',
  sort: 0,
});

const errors = ref<Record<string, string>>({});

async function fetchList() {
  try {
    categoryList.value = await getCategoryListApi();
  } catch {
    // error handled by interceptor
  }
}

function handleAdd() {
  editingId.value = null;
  formData.value = { name: '', sort: 0 };
  errors.value = {};
  modalVisible.value = true;
}

function handleEdit(category: Category) {
  editingId.value = category.id;
  formData.value = { name: category.name, sort: category.sort };
  errors.value = {};
  modalVisible.value = true;
}

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.name) {
    errors.value.name = '请输入分类名称';
    return;
  }

  try {
    submitting.value = true;
    if (editingId.value) {
      await updateCategoryApi(editingId.value, formData.value);
      toast.success('分类更新成功');
    } else {
      await createCategoryApi(formData.value);
      toast.success('分类创建成功');
    }
    modalVisible.value = false;
    await fetchList();
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await deleteCategoryApi(id);
    toast.success('删除成功');
    await fetchList();
  } catch {
    // error handled by interceptor
  }
}

// 初始加载
fetchList();
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="分类管理">
      <template #extra>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新建分类
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/50">
              <TableHead class="w-[80px]">ID</TableHead>
              <TableHead>分类名称</TableHead>
              <TableHead class="w-[100px]">排序</TableHead>
              <TableHead class="w-[100px]">诗歌数</TableHead>
              <TableHead class="w-[150px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in categoryList" :key="row.id">
              <TableCell>{{ row.id }}</TableCell>
              <TableCell>{{ row.name }}</TableCell>
              <TableCell>{{ row.sort }}</TableCell>
              <TableCell>{{ row.poem_count ?? 0 }}</TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" @click="handleEdit(row as Category)">
                    <Pencil class="mr-1 h-4 w-4" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="handleDelete(row.id)">
                    <Trash2 class="mr-1 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="categoryList.length === 0">
              <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
                暂无数据
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:open="modalVisible">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑分类' : '新建分类' }}</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">
              分类名称 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="请输入分类名称"
              :class="errors.name ? 'border-destructive' : ''" />
            <p v-if="errors.name" class="text-sm text-destructive">
              {{ errors.name }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="sort">排序值</Label>
            <Input
              id="sort"
              v-model.number="formData.sort"
              type="number"
              :min="0"
              placeholder="请输入排序值" />
          </div>
          <DialogFooter>
            <Button variant="outline" @click="modalVisible = false">
              取消
            </Button>
            <Button type="submit" :loading="submitting">
              确定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
