import { loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue(), vueJsx()],
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
          target: 'http://localhost:8081',
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
