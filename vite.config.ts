import { loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // devprod 模式：本地开发，代理到生产 API
  const isDevProd = mode === 'devprod';
  const apiTarget = isDevProd
    ? 'https://admin-api.poem.simpledefine.fun'
    : 'http://localhost:8081';

  return {
    plugins: [vue(), vueJsx(), tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 5666,
      open: false,
      proxy: {
        '/api': {
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api/admin'),
          target: apiTarget,
          ws: true,
        },
      },
    },
    base: env.VITE_BASE || '/',
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
    },
  };
});
