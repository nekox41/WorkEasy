<template>
  <div class="kanban">
    <el-table :data="tableData" border style="width:100%">
      <el-table-column label="待生成报告">
        <template #default>
          <el-button text type="primary" :disabled="loading" @click="dialogVisible = true">{{ ungeneratedCount }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="待备案数量">
        <template #default>{{ unrecordedCount }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default>
          <el-button type="primary" size="small" :loading="loading" @click="loadData">加载数据</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" top="20vh" width="70%" append-to-body>
      <el-table :data="generatableList" stripe :row-class-name="rowClassName">
        <el-table-column prop="contract_name" label="项目名" />
        <el-table-column prop="commit_time" label="提交时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const recordUrl = 'https://henan.xmf119.cn/admin/reportdocument/recordlist.html?page=1&key=&key4=&key1=-1&key2=0&start=2025-08-01&end='
const ungeneratedCount = ref(0)
const unrecordedCount = ref(0)
const generatableList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const tableData = ref([{}])

function getFirstDayOfMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
function parseCountFromPageStr(pageStr) {
  const match = (pageStr || '').match(/共(\d+)条/)
  return match ? Number.parseInt(match[1], 10) : 0
}
function getDayDiff(commitTime) {
  if (!commitTime) return 0
  const date = new Date(commitTime)
  if (Number.isNaN(date.getTime())) return 0
  date.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - date) / 86400000)
}
function rowClassName({ row }) {
  const diff = getDayDiff(row.commit_time)
  if (diff > 5) return 'danger-row'
  if (diff > 3) return 'warning-row'
  return ''
}
function buildTaskUrl(page) {
  const params = new URLSearchParams({
    page: String(page), key: getFirstDayOfMonth(), key2: '', 'key3[]': '6',
    key4: '', 'key5[]': '5', key6: '3', key7: '', key8: '',
    fire_g_uuid: '', fire_p_uuid: '', fire_uuid: '', header_name: ''
  })
  return `https://henan.xmf119.cn/admin/task/index.html?${params.toString()}`
}
async function loadData() {
  if (loading.value) return
  loading.value = true
  try {
    const headers = { 'x-requested-with': 'XMLHttpRequest' }
    const firstResponse = await fetch(buildTaskUrl(1), { credentials: 'include', headers })
    if (!firstResponse.ok) throw new Error(`任务列表请求失败：HTTP ${firstResponse.status}`)
    const firstPage = await firstResponse.json()
    const totalPages = Math.ceil(Number(firstPage.total || 0) / 10)
    let allTasks = firstPage.list || []
    if (totalPages > 1) {
      const pages = await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) =>
        fetch(buildTaskUrl(i + 2), { credentials: 'include', headers }).then(async response => {
          if (!response.ok) throw new Error(`任务列表第 ${i + 2} 页请求失败：HTTP ${response.status}`)
          return response.json()
        })
      ))
      pages.forEach(page => { allTasks = allTasks.concat(page.list || []) })
    }
    generatableList.value = allTasks.filter(item => item.report_name === '')
    ungeneratedCount.value = generatableList.value.length
    const recordResponse = await fetch(recordUrl, { credentials: 'include', headers })
    if (!recordResponse.ok) throw new Error(`备案列表请求失败：HTTP ${recordResponse.status}`)
    unrecordedCount.value = parseCountFromPageStr((await recordResponse.json()).page_str)
  } catch (error) {
    console.error('加载数据失败：', error)
    ElMessage.error(`加载数据失败：${error.message}`)
  } finally { loading.value = false }
}
</script>

<style scoped>
.kanban { margin:10px 0; }
:deep(.warning-row) { background-color:#F3B9CA !important;color:#51495E; }
:deep(.danger-row) { background-color:#51495E !important;color:#FAF6F3; }
</style>
