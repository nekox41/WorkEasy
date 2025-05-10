// main.js
import { createApp } from 'vue'
import Welcome from './components/Index/Welcome.vue';
import Table from './components/Index/Table.vue';
import Task from './components/Task/Task.vue';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 检测网址
if (document.URL.includes("/admin/index/indexpage.html")) {
    // 欢迎弹窗
    const welcomeApp = createApp(Welcome);
    const welcomeContainer = document.createElement('div');
    welcomeApp.use(ElementPlus);
    welcomeApp.mount(welcomeContainer);
    document.body.append(welcomeContainer);

    // 信息看板
    const tableApp = createApp(Table);
    const tableContainer = document.createElement('div');
    const tableTarget = document.querySelector("body > div.example-wrap > div")
    if (tableTarget) {
        tableTarget.append(tableContainer);
    }
    tableApp.use(ElementPlus);
    tableApp.mount(tableContainer);
}

// 任务页面
if (document.URL.includes("/admin/task/taskInfo")) {
    // 展示任务信息
    const container = document.createElement('div');
    container.id = "app";
    container.style.display = "block"
    document.querySelector("#taskAudit > div:nth-child(21)").appendChild(container);
    document.querySelector("#taskAudit > div:nth-child(21) > label").className = "col-sm-4 control-label"
    document.querySelector("#taskAudit > div:nth-child(21) > label").textContent = "助手功能："
    const app = createApp(Task)
    app.use(ElementPlus)
    app.mount("#app")
}