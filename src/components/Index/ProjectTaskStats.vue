<template>
  <section class="project-task-stats">
    <div class="stats-heading">
      <div>
        <div class="stats-title">项目任务统计</div>
        <div class="stats-subtitle">
          {{ monthLabel }} · 进行中合同 · 河南省
          <span v-if="refreshedAt">· 缓存更新于 {{ refreshedAtLabel }}</span>
          <span v-else>· 尚无本月缓存</span>
        </div>
      </div>
      <el-button type="primary" plain :loading="loading" :disabled="loading" @click="refreshStats">
        {{ loading ? '正在刷新…' : '手动刷新统计' }}
      </el-button>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="stats-alert" />
    <el-alert v-if="cacheWarning" :title="cacheWarning" type="warning" show-icon :closable="false" class="stats-alert" />

    <template v-if="loaded">
      <div class="stats-overview">
        <div class="overview-item">
          <span>项目总数</span><strong>{{ currentSummary.total }}</strong>
        </div>
        <div class="overview-item is-completed">
          <span>已完成</span><strong>{{ currentSummary.completed }}</strong>
        </div>
        <div class="overview-item is-pending">
          <span>未完成</span><el-button text type="danger" class="overview-count" @click="showAllUncompleted">{{ currentSummary.uncompleted }}</el-button>
        </div>
      </div>

      <el-tabs v-model="dimension" class="stats-tabs">
        <el-tab-pane label="按地区" name="region" />
        <el-tab-pane label="按负责人" name="leader" />
        <el-tab-pane label="负责人 + 地区" name="leaderRegion" />
      </el-tabs>

      <el-table :data="groupRows" border stripe size="default" empty-text="当前月份没有进行中合同">
        <el-table-column prop="label" :label="groupLabel" min-width="180" show-overflow-tooltip />
        <el-table-column prop="total" label="项目总数" width="105" align="center" />
        <el-table-column prop="completed" label="已完成" width="105" align="center">
          <template #default="{ row }"><el-tag type="success" effect="light">{{ row.completed }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="uncompleted" label="未完成" width="115" align="center">
          <template #default="{ row }">
            <el-button v-if="row.uncompleted" text type="danger" @click="showUncompleted(row)">{{ row.uncompleted }}</el-button>
            <span v-else class="zero-value">0</span>
          </template>
        </el-table-column>
        <el-table-column label="完成率" width="130" align="center">
          <template #default="{ row }"><el-progress :percentage="row.total ? Math.round(row.completed / row.total * 100) : 0" :stroke-width="8" /></template>
        </el-table-column>
      </el-table>

      <div class="stats-footnote">
        完成判定：当月任一测试任务状态为“待审核”或“审核通过”，该项目即视为已完成。
        <span>任务日期：{{ dateRangeLabel }} · 合同 {{ sourceCounts.contracts }} 条 / 任务 {{ sourceCounts.tasks }} 条</span>
      </div>
    </template>
    <el-skeleton v-else-if="loading" :rows="3" animated />
    <el-empty v-else :description="emptyDescription" :image-size="70">
      <el-button type="primary" plain :loading="loading" @click="refreshStats">首次加载 / 手动刷新</el-button>
    </el-empty>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="min(900px, 92vw)" append-to-body>
      <el-table :data="detailProjects" border stripe max-height="55vh" empty-text="没有未完成项目">
        <el-table-column prop="name" label="项目名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="leader" label="项目负责人" min-width="130" />
        <el-table-column prop="region" label="地区" min-width="130" />
        <el-table-column prop="contractNumber" label="合同编号" min-width="150" />
        <el-table-column prop="taskCount" label="当月测试任务" width="115" align="center" />
      </el-table>
      <template #footer><el-button type="primary" @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getCachedProjectTaskStatistics,
  refreshProjectTaskStatistics
} from '../../api/Index/projectTaskStats'

const loading = ref(false)
const cacheReady = ref(false)
const loaded = ref(false)
const error = ref('')
const cacheWarning = ref('')
const dimension = ref('region')
const projects = ref([])
const month = ref('')
const refreshedAt = ref('')
const sourceCounts = ref({ contracts: 0, tasks: 0 })
const detailVisible = ref(false)
const detailProjects = ref([])
const detailTitle = ref('')

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const monthLabel = computed(() => `${currentMonth.slice(0, 4)}年${Number(currentMonth.slice(5, 7))}月`)
const dateRangeLabel = computed(() => {
  const year = Number(currentMonth.slice(0, 4))
  const monthNumber = Number(currentMonth.slice(5, 7))
  return `${currentMonth}-01 至 ${currentMonth}-${new Date(year, monthNumber, 0).getDate()}`
})
const refreshedAtLabel = computed(() => {
  if (!refreshedAt.value) return ''
  const date = new Date(refreshedAt.value)
  return Number.isNaN(date.getTime()) ? refreshedAt.value : date.toLocaleString('zh-CN', { hour12: false })
})
const emptyDescription = computed(() => cacheReady.value
  ? '本月还没有本地缓存，请点击上方按钮手动获取数据'
  : '正在读取本地缓存…')
const groupLabel = computed(() => ({
  region: '地区', leader: '项目负责人', leaderRegion: '项目负责人 / 地区'
}[dimension.value]))

const currentSummary = computed(() => ({
  total: projects.value.length,
  completed: projects.value.filter(project => project.completed).length,
  uncompleted: projects.value.filter(project => !project.completed).length
}))

const groupRows = computed(() => {
  const groups = new Map()
  projects.value.forEach(project => {
    const key = dimension.value === 'region'
      ? project.region
      : dimension.value === 'leader'
        ? project.leader
        : `${project.leader} / ${project.region}`
    if (!groups.has(key)) groups.set(key, { label: key, total: 0, completed: 0, uncompleted: 0, projects: [] })
    const group = groups.get(key)
    group.total += 1
    group[project.completed ? 'completed' : 'uncompleted'] += 1
    if (!project.completed) group.projects.push(project)
  })
  return [...groups.values()].sort((a, b) => b.uncompleted - a.uncompleted || b.total - a.total || a.label.localeCompare(b.label, 'zh-CN'))
})

function applyCache(record) {
  if (!record || record.month !== currentMonth) return false
  projects.value = Array.isArray(record.projects) ? record.projects : []
  month.value = record.month
  refreshedAt.value = record.refreshedAt || ''
  sourceCounts.value = record.sourceCounts || { contracts: 0, tasks: 0 }
  loaded.value = true
  return true
}

async function loadLocalCache() {
  try {
    const record = await getCachedProjectTaskStatistics(now)
    applyCache(record)
  } catch (err) {
    console.error('读取项目任务本地缓存失败：', err)
    cacheWarning.value = `读取本地缓存失败：${err?.message || '未知错误'}`
  } finally {
    cacheReady.value = true
  }
}

async function refreshStats() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  cacheWarning.value = ''
  try {
    const result = await refreshProjectTaskStatistics(now)
    applyCache(result)
    if (!result.cacheSaved) {
      cacheWarning.value = `数据已刷新，但未能保存到本地：${result.cacheError}`
      ElMessage.warning('数据已获取，但本地缓存保存失败')
    } else {
      ElMessage.success('统计数据已刷新并保存到本地')
    }
  } catch (err) {
    console.error('项目任务统计刷新失败：', err)
    error.value = err?.response?.data?.msg || err?.message || '刷新项目任务统计失败'
    ElMessage.error(error.value)
    // 刷新失败时不清空已有数据和缓存。
  } finally {
    loading.value = false
  }
}

function showAllUncompleted() {
  detailProjects.value = projects.value.filter(project => !project.completed)
  detailTitle.value = `全部未完成项目（${detailProjects.value.length}）`
  detailVisible.value = true
}

function showUncompleted(row) {
  detailProjects.value = row.projects
  detailTitle.value = `${row.label} · 未完成项目（${row.uncompleted}）`
  detailVisible.value = true
}

onMounted(loadLocalCache)
</script>

<style scoped>
.project-task-stats{margin:18px 0 12px;padding:18px;background:var(--el-bg-color-overlay,#fff);border:1px solid var(--el-border-color-lighter,#ebeef5);border-radius:8px}
.stats-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.stats-title{font-size:17px;font-weight:650;color:#51495E}
.stats-subtitle{margin-top:4px;font-size:12px;color:#909399;line-height:1.6}
.stats-alert{margin:8px 0}
.stats-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}
.overview-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#F3F5F8;border-radius:6px;color:#6A6374;font-size:13px}
.overview-item strong{font-size:22px;color:#51495E;font-weight:650;font-variant-numeric:tabular-nums}
.overview-item.is-completed{background:#F0F7F2}.overview-item.is-completed strong{color:#2E9E5B}
.overview-item.is-pending{background:#FEF1F4}.overview-item.is-pending strong,.overview-item.is-pending :deep(.overview-count){color:#C65B7B;font-size:22px;font-weight:650;font-variant-numeric:tabular-nums;padding:0;height:auto}
.stats-tabs{margin-bottom:4px}
.zero-value{color:#B6B1B7}
.stats-footnote{display:flex;justify-content:space-between;gap:12px;margin-top:12px;color:#909399;font-size:12px;line-height:1.6}
@media(max-width:680px){.project-task-stats{padding:12px}.stats-overview{gap:6px}.overview-item{padding:10px;display:block}.overview-item strong{display:block;margin-top:4px}.stats-footnote{display:block}.stats-footnote span{display:block;margin-top:4px}.stats-heading{align-items:flex-start}.stats-heading :deep(.el-button){flex-shrink:0}}
</style>
