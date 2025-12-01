import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';
import path from 'path';

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
        description: '修复打开报告问题；删除首页信息获取',
        version: '3.0.2',
        author: 'aameow',
        "run-at": "document-end",
        updateURL: "https://gitee.com/nekox41/work-easy/raw/main/dist/workeasy.user.js",
        downloadURL: "https://gitee.com/nekox41/work-easy/raw/main/dist/workeasy.user.txt"
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
