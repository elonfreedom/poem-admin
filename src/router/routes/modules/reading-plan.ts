import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:book-marked',
      order: 4,
      title: 'page.readingPlan.title',
    },
    name: 'ReadingPlan',
    path: '/reading-plan',
    redirect: 'list',
    children: [
      {
        name: 'ReadingPlanList',
        path: 'list',
        component: () => import('#/views/reading-plan/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: 'page.readingPlan.list',
        },
      },
      {
        name: 'ReadingPlanCreate',
        path: 'create',
        component: () => import('#/views/reading-plan/edit.vue'),
        meta: {
          hideInMenu: true,
          title: 'page.readingPlan.create',
        },
      },
      {
        name: 'ReadingPlanEdit',
        path: ':id/edit',
        component: () => import('#/views/reading-plan/edit.vue'),
        meta: {
          hideInMenu: true,
          title: 'page.readingPlan.edit',
        },
      },
    ],
  },
];

export default routes;
