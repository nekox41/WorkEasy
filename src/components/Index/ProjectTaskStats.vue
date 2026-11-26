<template>
  <section class="project-task-stats">
    <div class="stats-heading">
      <div>
        <div class="stats-title">项目任务统计</div>
        <div class="stats-subtitle">{{ monthLabel }} · 进行中合同 · 河南省</div>
      </div>
      <el-button type="primary" plain :loading="loading" @click="loadStats">刷新统计</el-button>
    </div>

    <div v-if="error" class="stats-error">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>

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
          <template #default="{ row }">
            <el-tag type="success" effect="light">{{ row.completed }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uncompleted" label="未完成" width="115" align="center">
          <template #default="{ row }">
            <el-button v-if="row.uncompleted" text type="danger" @click="showUncompleted(row)">{{ row.uncompleted }}</el-button>
            <span v-else class="zero-value">0</span>
          </template>
        </el-table-column>
        <el-table-column label="完成率" width="130" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.total ? Math.round(row.completed / row.total * 100) : 0" :stroke-width="8" />
          </template>
        </el-table-column>
      </el-table>

      <div class="stats-footnote">
        完成判定：当月任一测试任务状态为“待审核”或“审核通过”，该项目即视为已完成。
        <span>任务日期：{{ dateRangeLabel }}</span>
      </div>
    </template>
    <el-skeleton v-else-if="loading" :rows="3" animated />
    <el-empty v-else description="点击“刷新统计”加载当月项目任务统计" :image-size="70" />

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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjectTaskStatistics } from '../../api/Index/projectTaskStats'

const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const dimension = ref('region')
const projects = ref([])
const month = ref('')
const detailVisible = ref(false)
const detailProjects = ref([])
const detailTitle = ref('')
let monthCheckTimer = null

const monthLabel = computed(() => month.value ? `${month.value.slice(0, 4)}年${Number(month.value.slice(5, 7))}月` : '当月')
const dateRangeLabel = computed(() => month.value ? `${month.value}-01 至 ${month.value}-${new Date(Number(month.value.slice(0,4)), Number(month.value.slice(5,7)), 0).getDate()}` : '—')
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

async function loadStats() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await getProjectTaskStatistics()
    projects.value = result.projects
    month.value = result.month
    loaded.value = true
    if (!result.projects.length) ElMessage.info('当前月份没有查到进行中合同')
  } catch (err) {
    console.error('项目任务统计加载失败：', err)
    error.value = err?.response?.data?.msg || err?.message || '加载项目任务统计失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

function showAllUncompleted() {\n  detailProjects.value = projects.value.filter(project => !project.completed)\n  detailTitle.value = `全部未完成项目（${detailProjects.value.length}）`\n  detailVisible.value = true\n}\n\nfunction showUncompleted(row) {
  detailProjects.value = row.projects
  detailTitle.value = `${row.label} · 未完成项目（${row.uncompleted}）`
  detailVisible.value = true
}

function checkMonthChanged() {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (loaded.value && month.value && month.value !== current) loadStats()
}

onMounted(() => {
  loadStats()
  monthCheckTimer = window.setInterval(checkMonthChanged, 60 * 1000)
  document.addEventListener('visibilitychange', checkMonthChanged)
})
onBeforeUnmount(() => {
  if (monthCheckTimer) window.clearInterval(monthCheckTimer)
  document.removeEventListener('visibilitychange', checkMonthChanged)
})
</script>

<style scoped>
.project-task-stats{margin:18px 0 12px;padding:18px;background:var(--el-bg-color-overlay,#fff);border:1px solid var(--el-border-color-lighter,#ebeef5);border-radius:8px}
.stats-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.stats-title{font-size:17px;font-weight:650;color:#51495E}
.stats-subtitle{margin-top:4px;font-size:12px;color:#909399}
.stats-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}
.overview-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#F3F5F8;border-radius:6px;color:#6A6374;font-size:13px}
.overview-item strong{font-size:22px;color:#51495E;font-weight:650;font-variant-numeric:tabular-nums}
.overview-item.is-completed{background:#F0F7F2}.overview-item.is-completed strong{color:#2E9E5B}
.overview-item.is-pending{background:#FEF1F4}.overview-item.is-pending strong,.overview-item.is-pending :deep(.overview-count){color:#C65B7B;font-size:22px;font-weight:650;font-variant-numeric:tabular-nums;padding:0;height:auto}
.stats-tabs{margin-bottom:4px}
.zero-value{color:#B6B1B7}
.stats-footnote{display:flex;justify-content:space-between;gap:12px;margin-top:12px;color:#909399;font-size:12px;line-height:1.6}
.stats-error{margin-bottom:12px}
@media(max-width:680px){.project-task-stats{padding:12px}.stats-overview{gap:6px}.overview-item{padding:10px;display:block}.overview-item strong{display:block;margin-top:4px}.stats-footnote{display:block}.stats-footnote span{display:block;margin-top:4px}}
</style>
