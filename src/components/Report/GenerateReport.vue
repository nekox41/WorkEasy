<template>
  <el-button type="primary" :loading="loading" @click="handleGenerate">一键填写报告</el-button>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const projectRemarkMap = {
  // '示例项目名称': '固定备注内容',
}
const isUnqualified = text => text.trim() === '不符合'

async function parseTaskPage(taskUrl) {
  const response = await axios.get(taskUrl)
  const doc = new DOMParser().parseFromString(response.data, 'text/html')
  return Array.from(doc.querySelectorAll('.long-td')).map(row => {
    const taskId = row.querySelector('td:nth-child(1)')?.textContent.trim() || ''
    const result = row.querySelector('td:nth-child(5)')?.textContent.trim() || ''
    const href = row.querySelector('td:nth-child(4) a')?.getAttribute('href')
    return { taskId, result, detailUrl: href ? new URL(href, taskUrl).href : '' }
  }).filter(item => item.taskId && item.detailUrl)
}
async function parseDetailPage(url) {
  const response = await axios.get(url)
  const doc = new DOMParser().parseFromString(response.data, 'text/html')
  const text = doc.querySelector('.long-td:first-child td:nth-child(8)')?.textContent.trim() || ''
  return text ? text.split(' ')[0] : null
}
async function handleGenerate() {
  if (loading.value) return
  loading.value = true
  try {
    document.querySelector('#chk_all')?.click()
    const rows = Array.from(document.querySelectorAll('#tack_list > tr'))
    if (!rows.length) { ElMessage.warning('未找到任务列表'); return }
    const projectName = rows[0].querySelector('td:nth-child(3)')?.textContent.trim() || ''
    const urls = rows.map(row => {
      const href = row.querySelector('td:nth-child(6) > a')?.getAttribute('href')
      return href ? new URL(href, location.href).href : null
    }).filter(Boolean)
    if (!urls.length) { ElMessage.warning('未找到任务链接'); return }
    const allRows = (await Promise.all(urls.map(parseTaskPage))).flat()
    if (!allRows.length) { ElMessage.warning('未获取到任何小任务行'); return }
    const fullPass = !allRows.some(row => isUnqualified(row.result))
    const unique = new Map()
    allRows.forEach(row => { if (!unique.has(row.taskId)) unique.set(row.taskId, row.detailUrl) })
    const dates = await Promise.all(Array.from(unique.values()).map(parseDetailPage))
    const validDates = dates.filter(Boolean)
    if (!validDates.length) { ElMessage.warning('未获取到任何结束日期'); return }
    const maxDate = validDates.reduce((a, b) => a > b ? a : b)
    const dateInput = document.querySelector('#test_date')
    if (dateInput) {
      dateInput.value = maxDate
      dateInput.dispatchEvent(new Event('input', { bubbles: true }))
      dateInput.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const remark = projectName && projectRemarkMap[projectName]
      ? projectRemarkMap[projectName]
      : fullPass
        ? '建议贵单位加强日常消防巡检，保证消防设施正常运行。'
        : '建议贵单位及时采取整改措施，保证消防设施正常运行。'
    const explain = document.querySelector('#explain')
    if (explain) {
      explain.value = remark
      explain.dispatchEvent(new Event('input', { bubbles: true }))
      explain.dispatchEvent(new Event('change', { bubbles: true }))
    }
    ElMessage.success('填写完成')
  } catch (error) {
    console.error(error)
    ElMessage.error(`操作失败：${error.message}`)
  } finally { loading.value = false }
}
</script>
