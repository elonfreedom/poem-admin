<script lang="ts" setup>
import type { FrontendUser, UserListParams } from '#/api';

import { computed, ref } from 'vue';

import { Ban, Eye, UserCheck } from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
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
import TableAction from '#/components/TableAction.vue';
import { useTable } from '#/composables/useTable';
import {
  getFrontendUserDetailApi,
  getFrontendUserListApi,
  updateUserStatusApi,
} from '#/api';
import { toast } from 'vue-sonner';

// 当前选中的用户
const selectedUser = ref<FrontendUser | null>(null);
const detailLoading = ref(false);
const modalVisible = ref(false);

// 获取统计数据
const getStats = computed(() => {
  const u = selectedUser.value;
  if (!u) return null;
  if (u.total_checkin_days !== undefined) {
    return {
      total_checkin_days: u.total_checkin_days || 0,
      consecutive_days: u.consecutive_days || 0,
      favorites_count: u.favorite_count || 0,
      reading_plans_count: u.reading_plan_count || 0,
      passkeys_count: u.passkey_count || 0,
    };
  }
  return u.stats || null;
});

/** 搜索筛选 */
const keyword = ref('');
const status = ref<string | undefined>(undefined);

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '已禁用', value: 'disabled' },
];

/** 表格数据 */
const { data, refresh, setFilters } = useTable<FrontendUser>({
  fetchData: async ({ page, pageSize }) => {
    const params: UserListParams = {
      page,
      pageSize,
      keyword: keyword.value || undefined,
      status: (status.value || undefined) as UserListParams['status'],
    };
    const result = await getFrontendUserListApi(params);
    return { items: result.list, total: result.total };
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
  status.value = undefined;
  setFilters({});
}

async function onViewDetail(row: FrontendUser) {
  selectedUser.value = row;
  detailLoading.value = false;
  modalVisible.value = true;
  detailLoading.value = true;
  try {
    const detail = await getFrontendUserDetailApi(row.id);
    selectedUser.value = detail;
  } catch {
    // 失败时保持使用列表数据
  } finally {
    detailLoading.value = false;
  }
}

async function onToggleStatus(row: FrontendUser) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '禁用';

  try {
    await updateUserStatusApi(row.id, { status: newStatus });
    toast.success(`已${actionText}用户「${row.nickname}」`);
    refresh();
  } catch {
    // error handled by request interceptor
  }
}

/** 邮箱脱敏 */
function maskEmail(email?: null | string): string {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain || !local) return email;
  if (local.length <= 3) return `${local}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="用户管理" />

    <!-- 筛选栏 -->
    <div class="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Input
        v-model="keyword"
        placeholder="请输入昵称或邮箱"
        class="w-48"
        @keyup.enter="handleSearch" />
      <Select v-model="status" @update:model-value="handleSearch">
        <SelectTrigger class="w-28">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" @click="handleReset">重置</Button>
      <Button @click="handleSearch">搜索</Button>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50">
            <TableHead class="w-[200px]">ID</TableHead>
            <TableHead>昵称</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead class="w-[100px]">状态</TableHead>
            <TableHead class="w-[180px]">创建时间</TableHead>
            <TableHead class="w-[140px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in data" :key="row.id">
            <TableCell class="font-mono text-xs">{{ row.id }}</TableCell>
            <TableCell>{{ row.nickname }}</TableCell>
            <TableCell>{{ maskEmail(row.email) }}</TableCell>
            <TableCell>
              <Badge :variant="row.status === 'active' ? 'default' : 'secondary'">
                {{ row.status === 'active' ? '正常' : '已禁用' }}
              </Badge>
            </TableCell>
            <TableCell>{{ row.created_at }}</TableCell>
            <TableCell class="text-right">
              <TableAction
                :actions="[
                  {
                    text: '详情',
                    icon: Eye,
                    onClick: () => onViewDetail(row as FrontendUser),
                  },
                  {
                    text: row.status === 'active' ? '禁用' : '启用',
                    icon: row.status === 'active' ? Ban : UserCheck,
                    danger: row.status === 'active',
                    onClick: () => onToggleStatus(row as FrontendUser),
                  },
                ]"
                align="center" />
            </TableCell>
          </TableRow>
          <TableRow v-if="data.length === 0">
            <TableCell colspan="6" class="h-32 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 用户详情弹窗 -->
    <Dialog v-model:open="modalVisible">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
        </DialogHeader>
        <div v-if="selectedUser" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">ID：</span>
              <span class="font-mono">{{ selectedUser.id }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">昵称：</span>
              {{ selectedUser.nickname }}
            </div>
            <div>
              <span class="text-muted-foreground">邮箱：</span>
              {{ selectedUser.email || '-' }}
            </div>
            <div>
              <span class="text-muted-foreground">状态：</span>
              <Badge :variant="selectedUser.status === 'active' ? 'default' : 'secondary'">
                {{ selectedUser.status === 'active' ? '正常' : '已禁用' }}
              </Badge>
            </div>
            <div>
              <span class="text-muted-foreground">注册时间：</span>
              {{ selectedUser.created_at }}
            </div>
          </div>

          <template v-if="getStats">
            <h4 class="text-sm font-semibold">统计数据</h4>
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.total_checkin_days }}
                </div>
                <div class="text-xs text-muted-foreground">累计打卡(天)</div>
              </div>
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.consecutive_days }}
                </div>
                <div class="text-xs text-muted-foreground">连续打卡(天)</div>
              </div>
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.favorites_count }}
                </div>
                <div class="text-xs text-muted-foreground">收藏数</div>
              </div>
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.reading_plans_count }}
                </div>
                <div class="text-xs text-muted-foreground">阅读计划</div>
              </div>
              <div class="rounded-lg bg-muted p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.passkeys_count }}
                </div>
                <div class="text-xs text-muted-foreground">Passkey数</div>
              </div>
            </div>
          </template>
        </div>
        <div v-else-if="detailLoading" class="flex justify-center py-10">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
