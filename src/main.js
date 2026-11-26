import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/theme.css'

import Table from './components/Index/Table.vue'
import Task from './components/Task/Task.vue'
import GenerateReport from './components/Report/GenerateReport.vue'
import PlanListStyle from './components/Plan/PlanListStyle.vue'

const url = document.URL

function mountVueComponent(Component, targetElement, appId) {
  if (!targetElement) return null
  const container = document.createElement('div')
  if (appId) container.id = appId
  targetElement.appendChild(container)
  const app = createApp(Component)
  app.use(ElementPlus)
  app.mount(container)
  return app
}

// 首页看板
if (url.includes('/admin/index/indexpage.html')) {
  mountVueComponent(Table, document.querySelector('body > div.example-wrap > div'))
}

// 任务详情
if (url.includes('/admin/task/taskInfo')) {
  const target = document.querySelector('#taskAudit > div:nth-child(21)')
  if (target) {
    const label = target.querySelector('label')
    if (label) {
      label.className = 'col-sm-4 control-label'
      label.textContent = '助手功能：'
    }
    mountVueComponent(Task, target, 'app')
  }
}

// 报告生成
if (url.includes('/admin/report/index.html')) {
  const searchButton = document.querySelector('body > div.wrapper.wrapper-content.animated.fadeInRight > div > div.ibox-content > div.row > div > form > div.col-sm-2 > span > button')
  if (searchButton?.parentNode) {
    const target = document.createElement('div')
    searchButton.parentNode.insertBefore(target, searchButton.nextSibling)
    mountVueComponent(GenerateReport, target)
  }
}

// 计划列表
if (url.includes('/admin/contractplan/planlist')) {
  mountVueComponent(PlanListStyle, document.body)
}
