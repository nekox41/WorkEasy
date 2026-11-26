<template>
  <Panel
    v-model:dialog-visible="dialogVisible"
    v-bind="dataList[dataIndex] || emptyPanelData"
    :current-progress="currentProgress"
    :total-item="totalItem"
  />
  <div class="floating-buttons">
    <el-button type="primary" @click="handleCheck">一键检查</el-button>
    <el-button :loading="isLoading" :disabled="isDataLoaded" @click="loadAllData">{{ isDataLoaded ? '数据已加载' : '加载数据' }}</el-button>
    <el-popconfirm title="是否确认退回？" placement="top" @confirm="taskGoBack">
      <template #reference><el-button type="danger">退回任务</el-button></template>
    </el-popconfirm>
    <el-popconfirm title="是否确认通过？" placement="top" @confirm="taskPass">
      <template #reference><el-button type="success">审核通过</el-button></template>
    </el-popconfirm>
  </div>
  <Teleport to="body">
    <div v-if="isLoading && !dialogVisible" class="vertical-progress-wrapper">
      <div class="vertical-progress-track"><div class="vertical-progress-fill" :style="{ height: progressPercent + '%' }"></div></div>
      <div class="vertical-progress-text">{{ progressPercent }}%</div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Panel from './Panel.vue'
import { getImages, getTaskDetails } from '../../api/Task/task'
import { getTaskList, getProjectByContractID } from '../../api/utils'

const dataList = ref([])
const dataIndex = ref(0)
const dialogVisible = ref(false)
const isLoading = ref(false)
const pageData = ref([])
const isDataLoaded = ref(false)
const progressPercent = ref(0)
const totalItem = ref(0)
const currentProgress = ref(1)
const elapsedTime = ref(0)
let timerInterval = null
let keydownHandler = null
const emptyPanelData = { system:'', item:'', content:'', start:'', end:'', time:'', images:[], type:'', remark:'' }

async function getBaseData() {
  const form = document.querySelector('#taskAudit')
  if (!form) return
  const startValue = form.querySelector('div:nth-child(14) input')?.value || ''
  const endValue = form.querySelector('div:nth-child(16) input')?.value || ''
  const diff = new Date(endValue).getTime() - new Date(startValue).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff % 3600000 / 60000)
  const seconds = Math.floor(diff % 60000 / 1000)
  const time = `${hours}小时${minutes}分钟${seconds}秒`
  const links = [form.querySelector('div:nth-child(20) > a')?.href, form.querySelector('div:nth-child(19) > a')?.href]
  const sign = form.querySelector('div:nth-child(24) > div > a > img')?.src
  const [operatorImages, controllerImages] = await Promise.all([
    links[0] ? getImages(links[0]) : Promise.resolve([]),
    links[1] ? getImages(links[1]) : Promise.resolve([])
  ])
  dataList.value.push(
    { system:'基本信息', item:'操作员自拍', content:form.querySelector('div:nth-child(18) input')?.value || '', start:startValue, end:endValue, time, images:operatorImages, type:'基本信息' },
    { system:'基本信息', item:'控制器照片', content:form.querySelector('div:nth-child(19) input')?.value || '', start:startValue, end:endValue, time, images:controllerImages, type:'基本信息' },
    { system:'基本信息', item:'签到照片', content:'签到照片', start:startValue, end:endValue, time, images:sign ? [sign] : [], type:'基本信息' }
  )
}
async function loadAllData() {
  if (isLoading.value || isDataLoaded.value) return
  isLoading.value = true
  progressPercent.value = 0
  let completed = 0
  try {
    const results = await Promise.all(pageData.value.map(async url => {
      try { return await getTaskDetails(url) }
      catch (error) { console.error(error); return [] }
      finally {
        completed += 1
        progressPercent.value = pageData.value.length ? Number((completed / pageData.value.length * 100).toFixed(2)) : 100
      }
    }))
    dataList.value.push(...results.flat())
    totalItem.value = dataList.value.length
    isDataLoaded.value = true
  } catch (error) {
    console.error('加载任务数据失败：', error)
    ElMessage.error(`加载任务数据失败：${error.message}`)
  } finally { isLoading.value = false }
}
async function submitAudit(status, mark) {
  const form = document.querySelector('#taskAudit')
  if (!form) { ElMessage.error('未找到任务表单'); return }
  try {
    const formData = new FormData(form)
    formData.set('task_status', status)
    formData.set('mark', mark)
    const projectName = form.querySelector('div:nth-child(6) input')?.value || ''
    const taskData = await getTaskList({ page:1, projectName })
    const contractId = taskData?.list?.[0]?.contract_id
    if (!contractId) throw new Error('未找到对应合同')
    const projectData = await getProjectByContractID(contractId)
    const auditName = projectData?.list?.[0]?.project_leader_name
    if (!auditName) throw new Error('未找到项目负责人姓名')
    formData.set('audit_user_name', auditName)
    const response = await fetch(form.action || '/admin/task/taskaudit.html', {
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With':'XMLHttpRequest' },
      body:new URLSearchParams(formData).toString(),
      credentials:'include'
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const result = await response.json()
    const success = result.code === 1 || (typeof result.msg === 'string' && result.msg.includes('成功'))
    if (success) ElMessage.success(result.msg || (status === '6' ? '任务已通过' : '任务已退回'))
    else ElMessage.error(result.msg || '操作失败')
  } catch (error) {
    console.error(error)
    ElMessage.error(`操作失败：${error.message}`)
  }
}
const taskGoBack = () => submitAudit('-1', '修改')
const taskPass = () => submitAudit('6', '通过')
async function handleCheck() {
  if (!isDataLoaded.value) await loadAllData()
  if (isDataLoaded.value) dialogVisible.value = true
}
watch(dialogVisible, visible => {
  if (visible) {
    elapsedTime.value = 0
    timerInterval = window.setInterval(() => elapsedTime.value += 1, 1000)
  } else {
    window.clearInterval(timerInterval)
    elapsedTime.value = 0
  }
})
onMounted(async () => {
  try {
    await getBaseData()
    pageData.value = Array.from(document.querySelectorAll('.long-td'))
      .map(line => line.children[3]?.firstElementChild?.href).filter(Boolean)
    keydownHandler = event => {
      if (!dialogVisible.value || document.querySelector('.el-image-viewer__wrapper')) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        dataIndex.value = (dataIndex.value + 1) % Math.max(dataList.value.length, 1)
        currentProgress.value = dataIndex.value + 1
        elapsedTime.value = 0
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        dataIndex.value = Math.max(0, dataIndex.value - 1)
        currentProgress.value = dataIndex.value + 1
        elapsedTime.value = 0
      }
    }
    document.addEventListener('keydown', keydownHandler)
  } catch (error) { console.error('初始化任务检查数据失败：', error) }
})
onBeforeUnmount(() => {
  window.clearInterval(timerInterval)
  if (keydownHandler) document.removeEventListener('keydown', keydownHandler)
})
</script>

<style scoped>
.floating-buttons{position:fixed;top:20px;right:20px;z-index:9999;display:flex;gap:10px}
.vertical-progress-wrapper{position:fixed;left:0;top:0;height:100vh;width:20px;z-index:9998;display:flex;flex-direction:column;align-items:center}
.vertical-progress-track{height:100%;width:6px;background:#E8EEF5;border-radius:4px;overflow:hidden;display:flex;align-items:flex-end}
.vertical-progress-fill{width:100%;background:#F3B9CA;transition:height .15s}
.vertical-progress-text{position:absolute;top:50%;left:22px;transform:translateY(-50%);font-size:12px;color:#51495E}
</style>
