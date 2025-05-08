import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.xmf119.cn/*'],
        connect: ['gitee.com'],
        description: '更新',
        version: '1.7',
        author: 'aameow',
        "run-at": "document-end",
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(util.dataUrl(';window.Vue=Vue;')),
          axios: cdn.jsdelivr('axios', 'dist/axios.min.js'),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js'),
        },
        externalResources: {
          'element-plus/dist/index.css': cdn.jsdelivr(),
        }
      },
    }),
  ],
});
