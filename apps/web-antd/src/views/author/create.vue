<script lang="ts" setup>
import type { CreateAuthorParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

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
import { createAuthorApi } from '#/api';
import { dynastyOptions } from './data';

const router = useRouter();
const submitting = ref(false);
const formRef = ref();

// 表单数据
const formData = ref({
  name: '',
  name_traditional: '',
  dynasty: '',
  biography: '',
});

async function handleSubmit() {
  try {
    await formRef.value.validate();
    submitting.value = true;
    await createAuthorApi(formData.value as CreateAuthorParams);
    message.success('作者创建成功');
    router.push('/author/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="添加作者">
      <template #extra>
        <Button @click="router.push('/author/list')">
          <ArrowLeftOutlined />
          返回列表
        </Button>
      </template>
    </PageHeader>

    <Card>
      <Form
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
