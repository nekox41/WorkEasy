import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const latestScript = 'https://github.com/nekox41/WorkEasy/releases/latest/download/workeasy.user.js'

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
        description: '一键检查任务、项目任务统计（本地缓存/手动刷新）、报告填写及计划管理',
        version: '3.0.5',
        author: 'aameow',
        'run-at': 'document-end',
        updateURL: latestScript,
        downloadURL: latestScript
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(util.dataUrl(';window.Vue=Vue;')),
          axios: cdn.jsdelivr('axios', 'dist/axios.min.js'),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js')
        },
        externalResources: { 'element-plus/dist/index.css': cdn.jsdelivr() }
      }
    })
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
