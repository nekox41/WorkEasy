// main.js
import { createApp } from 'vue'
import Welcome from './components/Index/Welcome.vue';
import Table from './components/Index/Table.vue';
import Task from './components/Task/Task.vue';
import OpenReport from './components/Report/OpenReport.vue';
import PlanListStyle from './components/Task/PlanListStyle.vue';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const url = document.URL;

function mountVueComponent(Component, targetElement, appId = 'app') {
    if (!targetElement) return null;

    const container = document.createElement('div');
    container.id = appId;
    targetElement.appendChild(container);

    const app = createApp(Component);
    // 应用插件
    app.use(ElementPlus);

    app.mount(`#${appId}`)
    return app;
}

// 检测网址
if (document.URL.includes("/admin/index/indexpage.html")) {
    // 欢迎弹窗
    const welcomeApp = mountVueComponent(Welcome, document.body);

    // 信息看板
    const tableTarget = document.querySelector("body > div.example-wrap > div")
    if (tableTarget) {
        mountVueComponent(Table, tableTarget);
    } else {
        console.error("无法找到信息看板容器")
    }
}

// 任务页面
if (document.URL.includes("/admin/task/taskInfo")) {
    // 展示任务信息
    mountVueComponent(Task, document.body)
}

// 报告页面
if (document.URL.includes("/admin/reportmiddleware")) {
    const reportFormArea = document.querySelector("body > div.wrapper.wrapper-content.animated.fadeInRight > div > div.ibox-content > div.row > div:nth-child(1) > form > div:nth-child(6)").appendChild(container);
    if (reportFormArea) {
        mountVueComponent(OpenReport, reportFormArea);
    } else {
        console.error("无法找到报告表单容器")
    }
}

// 计划列表的样式优化
if (document.URL.includes("/admin/contractplan/planlist")) {
    mountVueComponent(PlanListStyle, document.body);
}