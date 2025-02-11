// main.js
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import jQuery from 'jquery';
import { checkUpdate } from './api/update';


checkUpdate();

const app = createApp(App);

// 使用ElementPlus
app.use(ElementPlus);

// 添加 jQuery 到全局
app.config.globalProperties.$ = jQuery;

// 创建 div
const div = document.createElement('div');
div.id = 'app';
document.body.appendChild(div);

// 挂载
app.mount('#app');