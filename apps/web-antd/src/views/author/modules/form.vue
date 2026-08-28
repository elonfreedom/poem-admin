<script lang="ts" setup>
import type { CreateAuthorParams } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  createAuthorApi,
  getAuthorDetailApi,
  updateAuthorApi,
} from '#/api';
import { useAuthorFormSchema } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const editingId = ref<number | null>(null);
const submitting = ref(false);

const [Form, formApi] = useVbenModal({
  title: '作者',
  destroyOnClose: true,
  onClosed() {
    editingId.value = null;
  },
  schema: useAuthorFormSchema(),
  handleSubmit(values) {
    return handleSubmit(values as CreateAuthorParams);
  },
});

async function handleSubmit(values: CreateAuthorParams) {
  submitting.value = true;
  try {
    if (editingId.value) {
      await updateAuthorApi(editingId.value, values);
    } else {
      await createAuthorApi(values);
    }
    emit('success');
    formApi.close();
  } finally {
    submitting.value = false;
  }
}

async function loadAuthor(id: number) {
  editingId.value = id;
  const data = await getAuthorDetailApi(id);
  formApi.setValues(data);
  formApi.open();
}

function openCreate() {
  editingId.value = null;
  formApi.setValues({
    name: '',
    name_traditional: '',
    dynasty: '',
    biography: '',
  });
  formApi.open();
}

defineExpose({ openCreate, loadAuthor });
</script>

<template>
  <Form :submitting="submitting" />
</template>
