<script lang="ts" setup>
import type { CreateAuthorParams } from '#/api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import { getAuthorDetailApi, updateAuthorApi } from '#/api';
import { dynastyOptions } from './data';

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const loading = ref(false);
const id = Number(route.params.id);
const formRef = ref();

// 表单数据
const formData = ref({
  name: '',
  name_traditional: '',
  dynasty: '',
  biography: '',
});

async function loadDetail() {
  loading.value = true;
  try {
    const data = await getAuthorDetailApi(id);
    formData.value = {
      name: data.name || '',
      name_traditional: data.name_traditional || '',
      dynasty: data.dynasty || '',
      biography: data.biography || '',
    };
  } catch {
    message.error('获取作者详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    submitting.value = true;
    await updateAuthorApi(id, formData.value as CreateAuthorParams);
    message.success('作者更新成功');
    router.push('/author/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}

onMounted(loadDetail);
</script>

<template>
  <div>
    <PageHeader title="编辑作者">
      <template #extra>
        <Button @click="router.push('/author/list')">
          <ArrowLeftOutlined />
          返回列表
        </Button>
      </template>
    </PageHeader>

    <Card>
      <div v-if="loading" class="py-10 text-center text-gray-500">
        加载中...
      </div>
      <Form
        v-else
        ref="formRef"
        :model="formData"
        layout="vertical"
        @finish="handleSubmit"
      >
        <FormItem label="姓名" name="name" required>
          <Input v-model:value="formData.name" placeholder="请输入作者姓名（简体）" />
        </FormItem>

        <FormItem label="繁体姓名" name="name_traditional">
          <Input
            v-model:value="formData.name_traditional"
            placeholder="繁体姓名（如与简体相同可留空）"
          />
        </FormItem>

        <FormItem label="朝代" name="dynasty" required>
          <Select
            v-model:value="formData.dynasty"
            :options="dynastyOptions"
            allow-clear
            placeholder="请选择朝代"
          />
        </FormItem>

        <FormItem label="简介" name="biography">
          <Input.TextArea
            v-model:value="formData.biography"
            :rows="4"
            placeholder="作者简介（可选）"
          />
        </FormItem>

        <FormItem>
          <Space>
            <Button type="primary" :loading="submitting" html-type="submit">
              <SaveOutlined />
              保存
            </Button>
            <Button @click="router.push('/author/list')">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
