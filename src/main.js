// main.js
import { createApp } from 'vue'
import Welcome from './components/Index/Welcome.vue';
import Table from './components/Index/Table.vue';
import Task from './components/Task/Task.vue';
import OpenReport from './components/Report/OpenReport.vue';
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
    document.body.appendChild(container);
    const app = createApp(Task);
    app.use(ElementPlus);
    app.mount("#app");
}

// 报告页面
if (document.URL.includes("/admin/reportmiddleware")) {
    const container = document.createElement('div');
    container.id = "app";
    document.querySelector("body > div.wrapper.wrapper-content.animated.fadeInRight > div > div.ibox-content > div.row > div:nth-child(1) > form > div:nth-child(6)").appendChild(container);
    const app = createApp(OpenReport)
    app.use(ElementPlus)
    app.mount("#app")
}