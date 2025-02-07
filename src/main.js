// main.js
import { createApp } from 'vue'
import App from './App.vue'
import Image from './components/Image.vue'

// 创建一个函数来检查目标元素是否存在并获取href
function checkTargetElement() {
  const targetElement = document.querySelector('#taskAudit > div:nth-child(1) > table > tbody > tr > td:nth-child(11) > a')
  if (targetElement) {
    return targetElement.href
  }
  return null
}

// 创建Vue应用并传入href数据
const imageHref = checkTargetElement()
const app = createApp(App, {
  imageHref: imageHref
})

// 全局注册Image组件
app.component('Image', Image)

// 创建并挂载应用
const mountPoint = document.createElement('div')
document.body.appendChild(mountPoint)
app.mount(mountPoint)