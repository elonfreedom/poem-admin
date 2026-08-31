<script lang="ts" setup>
import type { CreateAuthorParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { ArrowLeft, Save } from 'lucide-vue-next';

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
import { Textarea } from '#/components/ui/textarea';

import PageHeader from '#/components/PageHeader.vue';
import { createAuthorApi } from '#/api';
import { dynastyOptions } from './data';
import { toast } from 'vue-sonner';

const router = useRouter();
const submitting = ref(false);

// 表单数据
const formData = ref({
  name: '',
  name_traditional: '',
  dynasty: '',
  biography: '',
});

const errors = ref<Record<string, string>>({});

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.name) {
    errors.value.name = '请输入作者姓名';
  }
  if (!formData.value.dynasty) {
    errors.value.dynasty = '请选择朝代';
  }
  if (Object.keys(errors.value).length > 0) {
    return;
  }

  try {
    submitting.value = true;
    await createAuthorApi(formData.value as CreateAuthorParams);
    toast.success('作者创建成功');
    router.push('/author/list');
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="添加作者">
      <template #extra>
        <Button variant="outline" @click="router.push('/author/list')">
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回列表
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="pt-6">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">
              姓名 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="请输入作者姓名（简体）"
              :class="errors.name ? 'border-destructive' : ''" />
            <p v-if="errors.name" class="text-sm text-destructive">
              {{ errors.name }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="name_traditional">繁体姓名</Label>
            <Input
              id="name_traditional"
              v-model="formData.name_traditional"
              placeholder="繁体姓名（如与简体相同可留空）" />
          </div>

          <div class="space-y-2">
            <Label for="dynasty">
              朝代 <span class="text-destructive">*</span>
            </Label>
            <Select v-model="formData.dynasty">
              <SelectTrigger :class="errors.dynasty ? 'border-destructive' : ''">
                <SelectValue placeholder="请选择朝代" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in dynastyOptions"
                  :key="opt.value"
                  :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.dynasty" class="text-sm text-destructive">
              {{ errors.dynasty }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="biography">简介</Label>
            <Textarea
              id="biography"
              v-model="formData.biography"
              :rows="4"
              placeholder="作者简介（可选）" />
          </div>

          <div class="flex gap-2">
            <Button type="submit" :loading="submitting">
              <Save class="mr-2 h-4 w-4" />
              保存
            </Button>
            <Button variant="outline" @click="router.push('/author/list')">
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
