<script lang="ts" setup>
import type { CheckinListParams, CheckinRecord } from '#/api';

import { ref } from 'vue';

import {
  Button,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import PageHeader from '#/components/PageHeader.vue';
import { useTable } from '#/composables/useTable';
import { getCheckinListApi } from '#/api';

/** 搜索筛选 */
const keyword = ref('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(undefined);

/** 表格列定义 */
const columns = [
  {
    title: '用户昵称',
    dataIndex: 'nickname',
    minWidth: 120,
    key: 'nickname',
  },
  {
    title: '打卡日期',
    dataIndex: 'checkin_date',
    width: 140,
    key: 'checkin_date',
  },
  {
    title: '关联诗文',
    dataIndex: 'poem_title',
    minWidth: 160,
    key: 'poem_title',
  },
  {
    title: '连续天数',
    dataIndex: 'consecutive_days',
    width: 100,
    key: 'consecutive_days',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
    key: 'created_at',
  },
];

/** 表格数据 */
const { data, pagination, loading, setFilters, onTableChange } =
  useTable<CheckinRecord>({
    fetchData: async ({ page, pageSize }) => {
      const params: CheckinListParams = {
        page,
        pageSize,
        keyword: keyword.value || undefined,
      };
      // 将日期范围拆分为 start_date / end_date
      if (dateRange.value && dateRange.value.length === 2) {
        params.start_date = dateRange.value[0]
          ? dayjs(dateRange.value[0]).format('YYYY-MM-DD')
          : undefined;
        params.end_date = dateRange.value[1]
          ? dayjs(dateRange.value[1]).format('YYYY-MM-DD')
          : undefined;
      }
      return await getCheckinListApi(params);
    },
    immediate: true,
  });

/** 搜索 */
function handleSearch() {
  setFilters({});
}

/** 重置筛选 */
function handleReset() {
  keyword.value = '';
  dateRange.value = undefined;
  setFilters({});
}
</script>

<template>
  <div>
    <PageHeader title="打卡记录" />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <Row :gutter="16" align="middle">
        <Col>
          <Input
            v-model:value="keyword"
            placeholder="请输入用户昵称"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
        </Col>
        <Col>
          <DatePicker.RangePicker
            v-model:value="dateRange"
            value-format="YYYY-MM-DD"
          />
        </Col>
        <Col>
          <Space>
            <Button @click="handleReset">重置</Button>
            <Button type="primary" @click="handleSearch">搜索</Button>
          </Space>
        </Col>
      </Row>
    </div>

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: CheckinRecord) => record.id"
      bordered
      size="middle"
      @change="onTableChange"
    />
  </div>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
</style>
