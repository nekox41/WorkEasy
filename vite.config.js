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
        noframes: true,
        description: '添加计划提示。',
        version: '1.5',
        author: 'aameow',
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(util.dataUrl(';window.Vue=Vue;')),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.js'),
        },
        externalResources: {
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.css'),
        }
      },
    }),
  ],
});
