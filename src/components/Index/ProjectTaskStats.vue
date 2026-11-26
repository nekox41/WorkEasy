<template>
  <div class="project-task-stats-trigger">
    <el-button type="primary" plain @click="openPanel"><el-icon><DataAnalysis /></el-icon>项目任务统计</el-button>
    <el-dialog v-model="panelVisible" title="项目任务统计" width="min(1180px, 94vw)" top="4vh" append-to-body>
      <div class="panel-toolbar">
        <div>
          <div class="panel-month">{{ monthLabel }} · 河南省进行中合同</div>
          <div class="panel-cache">
            <template v-if="refreshedAt">本地缓存更新于 {{ refreshedAtLabel }}</template>
            <template v-else>当前月份尚无缓存</template>
            <span v-if="loaded"> · 合同 {{ sourceCounts.contracts }} 条 / 任务 {{ sourceCounts.tasks }} 条 / 匹配 {{ sourceCounts.matchedTasks }} 条</span>
          </div>
        </div>
        <el-button type="primary" :loading="loading" :disabled="loading" @click="refreshStats"><el-icon><Refresh /></el-icon>{{ loading ? '正在刷新…' : '手动刷新' }}</el-button>
      </div>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="stats-alert" />
      <el-alert v-if="cacheWarning" :title="cacheWarning" type="warning" show-icon :closable="false" class="stats-alert" />
      <el-alert v-if="loaded && sourceCounts.tasks > 0 && sourceCounts.matchedTasks === 0"
        title="已获取任务数据，但没有任务匹配到合同名称。请检查任务列表 contract_name 字段；当前统计不应作为完成情况依据。"
        type="warning" show-icon :closable="false" class="stats-alert" />
      <el-alert v-if="loaded && sourceCounts.tasks === 0" title="接口返回 0 条符合条件的任务，请确认后台任务列表是否一致。" type="warning" show-icon :closable="false" class="stats-alert" />
      <template v-if="loaded">
        <div class="stats-overview">
          <div class="overview-item"><span>项目总数</span><strong>{{ summary.total }}</strong></div>
          <div class="overview-item is-completed"><span>已完成</span><strong>{{ summary.completed }}</strong></div>
          <div class="overview-item is-pending"><span>未完成</span><strong>{{ summary.uncompleted }}</strong></div>
        </div>
        <div class="stats-filters">
          <div class="filter-item"><label>地区筛选</label>
            <el-select v-model="selectedRegion" class="filter-select" clearable filterable placeholder="全部地区">
              <el-option v-for="item in regionOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
          <div class="filter-item"><label>项目负责人</label>
            <el-select v-model="selectedLeader" class="filter-select" clearable filterable placeholder="全部负责人">
              <el-option v-for="item in leaderOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
          <div class="filter-item"><label>归属地</label><el-input v-model="agencySearch" clearable placeholder="输入归属地关键词" /></div>
          <el-button text @click="resetFilters">重置筛选</el-button>
        </div>
        <el-table :data="groupRows" border stripe size="default" max-height="52vh" empty-text="没有符合筛选条件的项目">
          <el-table-column prop="label" :label="groupLabel" min-width="200" show-overflow-tooltip />
          <el-table-column prop="total" label="项目总数" width="110" align="center" />
          <el-table-column prop="completed" label="已完成" width="110" align="center">
            <template #default="{ row }"><el-tag type="success" effect="light">{{ row.completed }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="uncompleted" label="未完成" width="115" align="center">
            <template #default="{ row }">
              <el-button v-if="row.uncompleted" text type="danger" @click="showUncompleted(row)">{{ row.uncompleted }}</el-button>
              <span v-else class="zero-value">0</span>
            </template>
          </el-table-column>
          <el-table-column label="完成率" width="145" align="center">
            <template #default="{ row }"><el-progress :percentage="row.total ? Math.round(row.completed / row.total * 100) : 0" :stroke-width="8" /></template>
          </el-table-column>
        </el-table>
        <div class="stats-footnote">
          完成判定：当月待审核或审核通过的测试任务，其 contract_name 匹配项目名称即视为完成。
          <span>任务日期：{{ dateRangeLabel }}</span>
        </div>
      </template>
      <el-skeleton v-else-if="loading" :rows="4" animated />
      <el-empty v-else :description="cacheReady ? '本月没有本地缓存，请点击手动刷新获取数据' : '正在读取本地缓存…'" :image-size="76">
        <el-button type="primary" plain :loading="loading" @click="refreshStats">首次加载 / 手动刷新</el-button>
      </el-empty>
      <template #footer><el-button @click="panelVisible = false">关闭</el-button></template>
    </el-dialog>
    <el-dialog v-model="detailVisible" :title="detailTitle" width="min(900px, 92vw)" append-to-body>
      <el-table :data="detailProjects" border stripe max-height="55vh" empty-text="没有未完成项目">
        <el-table-column prop="name" label="项目名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="leader" label="项目负责人" min-width="130" />
        <el-table-column prop="region" label="地区" min-width="130" />
        <el-table-column prop="fireAgency" label="归属地" min-width="150" />
        <el-table-column prop="taskCount" label="当月测试任务" width="115" align="center" />
      </el-table>
      <template #footer><el-button type="primary" @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Refresh } from '@element-plus/icons-vue'
import { getCachedProjectTaskStatistics, refreshProjectTaskStatistics } from '../../api/Index/projectTaskStats'

const loading = ref(false), cacheReady = ref(false), loaded = ref(false), panelVisible = ref(false)
const error = ref(''), cacheWarning = ref(''), agencySearch = ref('')
const selectedRegion = ref(''), selectedLeader = ref('')
const projects = ref([]), refreshedAt = ref('')
const sourceCounts = ref({ contracts: 0, tasks: 0, matchedTasks: 0 })
const detailVisible = ref(false), detailProjects = ref([]), detailTitle = ref('')
const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const monthLabel = computed(() => `${currentMonth.slice(0, 4)}年${Number(currentMonth.slice(5, 7))}月`)
const dateRangeLabel = computed(() => `${currentMonth}-01 至 ${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`)
const refreshedAtLabel = computed(() => {
  if (!refreshedAt.value) return ''
  const date = new Date(refreshedAt.value)
  return Number.isNaN(date.getTime()) ? refreshedAt.value : date.toLocaleString('zh-CN', { hour12: false })
})
const regionOptions = computed(() => [...new Set(projects.value.map(p => p.region).filter(Boolean))].sort((a,b) => a.localeCompare(b,'zh-CN')))
const leaderOptions = computed(() => [...new Set(projects.value.map(p => p.leader).filter(Boolean))].sort((a,b) => a.localeCompare(b,'zh-CN')))
const filteredProjects = computed(() => projects.value.filter(p =>
  (!selectedRegion.value || p.region === selectedRegion.value) &&
  (!selectedLeader.value || p.leader === selectedLeader.value) &&
  String(p.fireAgency || '').normalize('NFKC').toLowerCase().includes(String(agencySearch.value || '').normalize('NFKC').trim().toLowerCase())
))
const summary = computed(() => ({
  total: filteredProjects.value.length,
  completed: filteredProjects.value.filter(p => p.completed).length,
  uncompleted: filteredProjects.value.filter(p => !p.completed).length
}))
const groupLabel = '地区 / 项目负责人'
const groupRows = computed(() => {
  const groups = new Map()
  filteredProjects.value.forEach(project => {
    const label = `${project.region} / ${project.leader}`
    if (!groups.has(label)) groups.set(label, { label, total:0, completed:0, uncompleted:0, projects:[] })
    const group = groups.get(label)
    group.total++
    group[project.completed ? 'completed' : 'uncompleted']++
    if (!project.completed) group.projects.push(project)
  })
  return [...groups.values()].sort((a,b) => b.uncompleted-a.uncompleted || b.total-a.total || a.label.localeCompare(b.label,'zh-CN'))
})
function applyRecord(record) {
  if (!record || record.month !== currentMonth || record.cacheRevision !== '3.0.6') return false
  projects.value = Array.isArray(record.projects) ? record.projects : []
  refreshedAt.value = record.refreshedAt || ''
  sourceCounts.value = record.sourceCounts || { contracts:0, tasks:0, matchedTasks:0 }
  loaded.value = true
  return true
}
async function loadLocalCache() {
  try { applyRecord(await getCachedProjectTaskStatistics(now)) }
  catch (err) {
    console.error('读取项目任务本地缓存失败：',err)
    cacheWarning.value = `读取本地缓存失败：${err?.message || '未知错误'}`
  } finally { cacheReady.value = true }
}
async function openPanel() {
  panelVisible.value = true
  if (!cacheReady.value) await loadLocalCache()
}
async function refreshStats() {
  if (loading.value) return
  loading.value = true; error.value = ''; cacheWarning.value = ''
  try {
    const result = await refreshProjectTaskStatistics(now)
    applyRecord({ ...result, cacheRevision:'3.0.6' })
    if (!result.cacheSaved) {
      cacheWarning.value = `数据已刷新，但未能保存到本地：${result.cacheError}`
      ElMessage.warning('数据已获取，但本地缓存保存失败')
    } else ElMessage.success('统计数据已刷新并保存到本地')
  } catch (err) {
    console.error('项目任务统计刷新失败：',err)
    error.value = err?.response?.data?.msg || err?.message || '刷新项目任务统计失败'
    ElMessage.error(error.value)
  } finally { loading.value = false }
}
function resetFilters() {
  selectedRegion.value = ''; selectedLeader.value = ''; agencySearch.value = ''
}
function showUncompleted(row) {
  detailProjects.value = row.projects
  detailTitle.value = `${row.label} · 未完成项目（${row.uncompleted}）`
  detailVisible.value = true
}
onMounted(loadLocalCache)
</script>

<style scoped>
.project-task-stats-trigger{display:flex;justify-content:flex-start;margin:10px 0}
.panel-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.panel-month{font-size:14px;font-weight:650;color:#51495E}
.panel-cache{margin-top:5px;color:#909399;font-size:12px;line-height:1.5}
.stats-alert{margin:8px 0}
.stats-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
.overview-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#F3F5F8;border-radius:6px;color:#6A6374;font-size:13px}
.overview-item strong{font-size:22px;color:#51495E;font-weight:650;font-variant-numeric:tabular-nums}
.overview-item.is-completed{background:#F0F7F2}.overview-item.is-completed strong{color:#2E9E5B}
.overview-item.is-pending{background:#FEF1F4}.overview-item.is-pending strong{color:#C65B7B}
.stats-filters{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:14px;padding:12px;background:#F7F8FA;border-radius:7px}
.filter-item{display:flex;flex-direction:column;gap:6px;min-width:180px}
.filter-item label{font-size:12px;color:#77717F}
.filter-select{width:100%}
.zero-value{color:#B6B1B7}
.stats-footnote{display:flex;justify-content:space-between;gap:12px;margin-top:12px;color:#909399;font-size:12px;line-height:1.6}
@media(max-width:680px){.stats-overview{gap:6px}.overview-item{padding:10px;display:block}.overview-item strong{display:block;margin-top:4px}.panel-toolbar{align-items:flex-start}.stats-footnote{display:block}.stats-footnote span{display:block;margin-top:4px}}
</style>
