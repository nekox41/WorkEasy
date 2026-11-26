import axios from 'axios'
import { BASE_URL } from '../constants'

const HEADERS = { 'X-Requested-With': 'XMLHttpRequest' }
const PROVINCE_CODE = '410000'
const PAGE_SIZE = 10
const DB_NAME = 'workeasy-project-task-stats'
const DB_VERSION = 1
const STORE_NAME = 'monthly-cache'

function getMonthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
  return { start, end, key: `${year}-${String(month + 1).padStart(2, '0')}` }
}

function openCacheDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('当前浏览器不支持 IndexedDB，无法保存本地统计缓存'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'month' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('打开本地缓存失败'))
    request.onblocked = () => reject(new Error('本地缓存升级被其他页面阻塞，请关闭其他 WorkEasy 页面后重试'))
  })
}

async function readMonthlyCache(month) {
  const db = await openCacheDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(month)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error || new Error('读取本地统计缓存失败'))
      transaction.onabort = () => reject(transaction.error || new Error('读取本地统计缓存失败'))
    })
  } finally {
    db.close()
  }
}

async function writeMonthlyCache(record) {
  const db = await openCacheDatabase()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(record)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error || new Error('写入本地统计缓存失败'))
      transaction.onabort = () => reject(transaction.error || new Error('写入本地统计缓存失败'))
    })
  } finally {
    db.close()
  }
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

async function fetchAllPages(urlBuilder) {
  const firstResponse = await axios.get(urlBuilder(1), { headers: HEADERS, withCredentials: true })
  const firstData = firstResponse.data
  const all = [...readList(firstData)]
  const pageCount = readPageCount(firstData, 1)
  if (pageCount <= 1) return all

  // 每次最多并发 2 页，避免手动刷新时给业务服务器造成突发压力。
  for (let page = 2; page <= pageCount; page += 2) {
    const batch = [page, page + 1].filter(number => number <= pageCount)
    const results = await Promise.all(batch.map(async number => {
      const response = await axios.get(urlBuilder(number), { headers: HEADERS, withCredentials: true })
      return readList(response.data)
    }))
    results.forEach(items => all.push(...items))
  }
  return all
}

function buildQuery(values) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value))
  })
  return params.toString()
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
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

  const cityName = normalizeText(contract?.city_str ?? contract?.city_name)
  if (cityName) return cityName
  const cityCode = normalizeText(contract?.key8 ?? contract?.city_code ?? contract?.city_id ?? contract?.city_uuid ?? contract?.city)
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
    task?.task_status_str, task?.status_name, task?.task_status_name,
    task?.task_status_int
  ].filter(value => value !== undefined && value !== null)
  for (const value of candidates) {
    const text = normalizeText(value)
    if (text === '5' || text.includes('待审核')) return 'pending'
    if (text === '6' || text.includes('审核通过')) return 'approved'
  }
  return 'other'
}

async function fetchFreshStatistics(date = new Date()) {
  const { start, end, key } = getMonthRange(date)

  // 合同列表：河南省、进行中合同，作为项目全集。
  const contracts = await fetchAllPages(
    page => `${BASE_URL}/admin/contract/index.html?${buildQuery({
      page, key: '', key2: '', key3: 0, key5: '', key6: 1, key7: PROVINCE_CODE,
      key8: '', key9: '', key10: '', project_leader: '', expireC: '', unexpireC: '',
      id: '', uuid: '', start: '', end: '', contract_type: '', contract_wb_name: '',
      sign_end_start: '', sign_end_end: '', project_leader_name: '', get_contract_id: ''
    })}`
  )

  // 当月测试类型任务。header_name/header_uuid 不参与负责人归属判断。
  const tasks = await fetchAllPages(
    page => `${BASE_URL}/admin/task/index.html?${buildQuery({
      page, key: start, key2: end, 'key3[]': 0, key4: '', key5: '', 'key5[]': 5,
      key6: 0, key7: PROVINCE_CODE, key8: '', fire_g_uuid: '', fire_p_uuid: '',
      fire_uuid: '', header_name: ''
    })}`
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
        id: normalizeText(contract?.id ?? contract?.contract_id ?? contract?.uuid) || name,
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

/** 只读取当前月份的本地缓存，不发起任何网络请求。 */
export async function getCachedProjectTaskStatistics(date = new Date()) {
  const { key } = getMonthRange(date)
  return readMonthlyCache(key)
}

/** 仅由用户主动点击刷新时调用；请求完成后写入当前月份缓存。 */
export async function refreshProjectTaskStatistics(date = new Date()) {
  const fresh = await fetchFreshStatistics(date)
  const record = { ...fresh, refreshedAt: new Date().toISOString() }
  try {
    await writeMonthlyCache(record)
    return { ...record, cacheSaved: true, cacheError: '' }
  } catch (error) {
    console.error('统计数据已获取，但写入 IndexedDB 缓存失败：', error)
    return { ...record, cacheSaved: false, cacheError: error?.message || '本地缓存写入失败' }
  }
}
