<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Button, Form, FormItem, Input, message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const formRef = ref<FormInstance>();

const formData = reactive({
  username: '',
  password: '',
});

async function handleSubmit() {
  console.log('handleSubmit called', formData.username, formData.password);
  try {
    await formRef.value?.validate();
    console.log('validation passed');
  } catch (e) {
    console.log('validation failed', e);
    message.warning('请输入用户名和密码');
    return;
  }
  await authStore.authLogin(formData);
}
</script>

<template>
  <Form ref="formRef" :model="formData" layout="vertical">
    <FormItem label="用户名" name="username" required>
      <Input
        v-model:value="formData.username"
        placeholder="请输入用户名"
        size="large"
        autocomplete="username"
      />
    </FormItem>
    <FormItem label="密码" name="password" required>
      <Input.Password
        v-model:value="formData.password"
        placeholder="请输入密码"
        size="large"
        autocomplete="current-password"
      />
    </FormItem>
    <FormItem>
      <Button
        type="primary"
        :loading="authStore.loginLoading"
        block
        size="large"
        @click="handleSubmit"
      >
        登录
      </Button>
    </FormItem>
  </Form>
</template>
