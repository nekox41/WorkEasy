import axios from 'axios'
import { BASE_URL } from '../constants'

const HEADERS = { 'X-Requested-With': 'XMLHttpRequest' }
const PROVINCE_CODE = '410000'
const PAGE_SIZE = 10

function getMonthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
  return { start, end, key: `${year}-${String(month + 1).padStart(2, '0')}` }
}

function readList(data) {
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data?.list)) return data.data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}

function readPageCount(data, currentPage) {
  const direct = Number(data?.allpage ?? data?.all_page ?? data?.total_page ?? data?.data?.allpage ?? data?.data?.all_page)
  if (Number.isFinite(direct) && direct > 0) return direct
  const total = Number(data?.total ?? data?.data?.total)
  if (Number.isFinite(total) && total > 0) return Math.ceil(total / PAGE_SIZE)
  return readList(data).length < PAGE_SIZE ? currentPage : currentPage + 1
}

async function fetchAllPages(urlBuilder, label) {
  const firstResponse = await axios.get(urlBuilder(1), { headers: HEADERS })
  const firstData = firstResponse.data
  const all = [...readList(firstData)]
  const pageCount = readPageCount(firstData, 1)
  if (pageCount <= 1) return all

  const pageNumbers = Array.from({ length: pageCount - 1 }, (_, index) => index + 2)
  // 控制并发，避免一次性对业务系统发起过多请求
  for (let offset = 0; offset < pageNumbers.length; offset += 5) {
    const batch = pageNumbers.slice(offset, offset + 5)
    const results = await Promise.all(batch.map(async page => {
      const response = await axios.get(urlBuilder(page), { headers: HEADERS })
      return readList(response.data)
    }))
    results.forEach(items => all.push(...items))
  }
  return all
}

function buildQuery(values) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  return params.toString()
}

function normalizeText(value) {
  return String(value ?? '').replace(/\\s+/g, ' ').trim()
}

function getContractName(contract) {
  return normalizeText(contract?.name ?? contract?.contract_name ?? contract?.project_name)
}

function getRegion(contract) {
  const county = normalizeText(
    contract?.key10 ?? contract?.county_name ?? contract?.district_name ??
    contract?.area_name ?? contract?.county ?? contract?.district ??
    contract?.fire_county_name ?? contract?.region_name
  )
  if (county) return county

  const cityCode = normalizeText(
    contract?.key8 ?? contract?.city_code ?? contract?.city_id ??
    contract?.city_uuid ?? contract?.city
  )
  return cityCode ? `城市编码 ${cityCode}` : '地区未填写'
}

function getContractNumber(contract) {
  return normalizeText(
    contract?.contract_no ?? contract?.contract_number ?? contract?.contract_num ??
    contract?.contract_code ?? contract?.number ?? contract?.code
  ) || '—'
}

function getTaskStatus(task) {
  const candidates = [
    task?.task_status, task?.task_status_code, task?.status,
    task?.task_status_str, task?.status_name, task?.task_status_name
  ].filter(value => value !== undefined && value !== null)
  for (const value of candidates) {
    const text = normalizeText(value)
    if (text === '5' || text.includes('待审核')) return 'pending'
    if (text === '6' || text.includes('审核通过')) return 'approved'
  }
  return 'other'
}

export async function getProjectTaskStatistics(date = new Date()) {
  const { start, end, key } = getMonthRange(date)

  // 进行中合同作为项目全集；河南省固定使用 410000。
  const contracts = await fetchAllPages(
    page => `${BASE_URL}/admin/contract/index.html?${buildQuery({
      page, key: '', key3: 0, key6: 1, key7: PROVINCE_CODE
    })}`,
    '进行中合同'
  )

  // 只查当月测试类型任务，不按状态过滤，以便同时识别“待审核”和“审核通过”。
  const tasks = await fetchAllPages(
    page => `${BASE_URL}/admin/task/index.html?${buildQuery({
      page, key: start, key2: end, 'key5[]': 5, key7: PROVINCE_CODE,
      key8: '', key10: ''
    })}`,
    '当月测试任务'
  )

  const taskGroups = new Map()
  tasks.forEach(task => {
    const name = normalizeText(task?.contract_name)
    if (!name) return
    if (!taskGroups.has(name)) taskGroups.set(name, [])
    taskGroups.get(name).push(task)
  })

  const projects = contracts
    .filter(contract => getContractName(contract))
    .map(contract => {
      const name = getContractName(contract)
      const projectTasks = taskGroups.get(name) || []
      const completed = projectTasks.some(task => {
        const status = getTaskStatus(task)
        return status === 'pending' || status === 'approved'
      })
      return {
        id: normalizeText(contract?.id ?? contract?.contract_id ?? contract?.contract_uuid) || name,
        name,
        leader: normalizeText(contract?.project_leader_name) || '负责人未填写',
        region: getRegion(contract),
        contractNumber: getContractNumber(contract),
        completed,
        taskCount: projectTasks.length,
        matchedTaskCount: projectTasks.filter(task => getTaskStatus(task) !== 'other').length
      }
    })

  return {
    month: key,
    start,
    end,
    provinceCode: PROVINCE_CODE,
    projects,
    sourceCounts: { contracts: contracts.length, tasks: tasks.length }
  }
}
