import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:user-pen',
      order: 20,
      title: '作者管理',
    },
    name: 'Author',
    path: '/author',
    children: [
      {
        name: 'AuthorList',
        path: 'list',
        component: () => import('#/views/author/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '作者列表',
        },
      },
    ],
  },
];

export default routes;
