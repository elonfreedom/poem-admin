/**
 * 全局类型定义
 * 替代 @vben/types 和 @vben-core/typings
 */

import type { RouteRecordRaw } from 'vue-router';

/** 通用键值对记录类型 */
export type Recordable<T = any> = Record<string, T>;

/** 只读键值对记录类型 */
export interface ReadonlyRecordable<T = any> {
  readonly [key: string]: T;
}

/** 基础选项类型（select/tab 通用） */
export interface BasicOption {
  label: string;
  value: string;
}

/** 选择器选项 */
export type SelectOption = BasicOption;

/** Tab 选项 */
export type TabOption = BasicOption;

/** 用户基础信息 */
export interface BasicUserInfo {
  [key: string]: any;
  /** 头像 */
  avatar: string;
  /** 用户昵称 */
  realName: string;
  /** 用户角色 */
  roles?: string[];
  /** 用户id */
  userId: string;
  /** 用户名 */
  username: string;
}

/** 用户信息 */
export interface UserInfo extends BasicUserInfo {
  /** 用户描述 */
  desc: string;
  /** 首页地址 */
  homePath: string;
  /** accessToken */
  token: string;
}

/** 任意函数类型 */
export type AnyFunction<T extends any[] = any[], R = void> = (
  ...args: T
) => R | Promise<R>;

/** 深层可选 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 可空类型 */
export type Nullable<T> = T | null;

/** 路由记录（组件为字符串懒加载） */
export type RouteRecordStringComponent<T = string> = Omit<
  RouteRecordRaw,
  'children' | 'component'
> & {
  children?: RouteRecordStringComponent<T>[];
  component: string;
};
