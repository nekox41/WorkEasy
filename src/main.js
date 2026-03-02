// main.js
import { createApp } from 'vue'
import Welcome from './components/Index/Welcome.vue';
import Table from './components/Index/Table.vue';
import FloatingButton from './components/Index/FloatingButton.vue'; // 新增浮动按钮组件
import Task from './components/Task/Task.vue';
import OpenReport from './components/Report/OpenReport.vue';
import PlanListStyle from './components/Plan/PlanListStyle.vue';
import GenerateReport from './components/Report/GenerateReport.vue';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import DefaultSelected from './components/Plan/DefaultSelected.vue';

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

    // 添加浮动按钮 - 直接添加到body，但使用不同的app ID避免冲突
    mountVueComponent(FloatingButton, document.body, 'floating-button-app');
}

// 任务页面
if (document.URL.includes("/admin/task/taskInfo")) {
    // 展示任务信息
    mountVueComponent(Task, document.body)
}

// 报告页面
if (document.URL.includes("/admin/reportmiddleware")) {
    const reportFormArea = document.querySelector("body > div.wrapper.wrapper-content.animated.fadeInRight > div > div.ibox-content > div.row > div:nth-child(1) > form > div:nth-child(6)");
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

// 下发任务
if (document.URL.includes("/admin/contractplan/contractplandetail")) {
    mountVueComponent(DefaultSelected, document.body);
}

// 报告生成
if (document.URL.includes("/admin/report/index")) {
    const target = document.querySelector("[name=admin_list_sea]");
    mountVueComponent(GenerateReport, target);
}
