import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'WorkEasy',
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.xmf119.cn/*'],
        connect: ['gitee.com'],
        description: '一键检查任务、退回与审核通过、报告填写、计划着色及一键新建下发',
        version: '3.0.3',
        author: 'aameow',
        'run-at': 'document-end',
        updateURL: 'https://gitee.com/nekox41/work-easy/raw/main/dist/workeasy.user.js',
        downloadURL: 'https://gitee.com/nekox41/work-easy/raw/main/dist/workeasy.user.txt'
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(util.dataUrl(';window.Vue=Vue;')),
          axios: cdn.jsdelivr('axios', 'dist/axios.min.js'),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js')
        },
        externalResources: {
          'element-plus/dist/index.css': cdn.jsdelivr()
        }
      }
    })
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
