/**
 * Pinia 初始化和重置
 * Pinia store 初始化与重置
 *
 * 简化版：本项目本地 Store 直接使用 localStorage 持久化，
 * 不需要 pinia-plugin-persistedstate + SecureLS 加密
 */

import type { App } from 'vue';

import { createPinia } from 'pinia';

let pinia: ReturnType<typeof createPinia> | null = null;

/**
 * 初始化 Pinia
 */
export function initStores(app: App) {
  pinia = createPinia();
  app.use(pinia);
  return pinia;
}

/**
 * 重置所有 Store 到初始状态
 */
export function resetAllStores() {
  if (!pinia) {
    console.error('Pinia is not installed');
    return;
  }
  const allStores = (pinia as any)._s;
  for (const [_key, store] of allStores) {
    store.$reset();
  }
}

export { pinia };
