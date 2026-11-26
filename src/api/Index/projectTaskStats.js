import axios from 'axios'
import { BASE_URL } from '../constants'

const HEADERS = { 'X-Requested-With': 'XMLHttpRequest' }
const PROVINCE_CODE = '410000'
const PAGE_SIZE = 10
const DB_NAME = 'workeasy-project-task-stats'
const DB_VERSION = 2
const STORE_NAME = 'monthly-cache'
const CACHE_REVISION = '3.0.5'

function monthRange(date = new Date()) {
  const year = date.getFullYear(), month = date.getMonth()
  const key = `${year}-${String(month + 1).padStart(2, '0')}`
  return { start: `${key}-01`, end: `${key}-${new Date(year, month + 1, 0).getDate()}`, key }
}
const cacheKey = month => `${month}:${CACHE_REVISION}`

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('当前浏览器不支持 IndexedDB'))
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (db.objectStoreNames.contains(STORE_NAME)) db.deleteObjectStore(STORE_NAME)
      db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('打开本地缓存失败'))
    req.onblocked = () => reject(new Error('缓存升级被阻塞，请关闭其他 WorkEasy 页面后重试'))
  })
}
async function readCache(month) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(cacheKey(month))
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error || new Error('读取缓存失败'))
      tx.onabort = () => reject(tx.error || new Error('读取缓存失败'))
    })
  } finally { db.close() }
}
async function writeCache(record) {
  const db = await openDb()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ ...record, cacheKey: cacheKey(record.month), cacheRevision: CACHE_REVISION })
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('写入缓存失败'))
      tx.onabort = () => reject(tx.error || new Error('写入缓存失败'))
    })
  } finally { db.close() }
}
function listOf(data) {
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.data?.list)) return data.data.list
  if (Array.isArray(data?.data)) return data.data
  return []
}
function pagesOf(data) {
  const direct = Number(data?.allpage ?? data?.all_page ?? data?.total_page ?? data?.data?.allpage ?? data?.data?.all_page)
  if (Number.isFinite(direct) && direct > 0) return direct
  const total = Number(data?.total ?? data?.data?.total)
  return Number.isFinite(total) && total > 0 ? Math.ceil(total / PAGE_SIZE) : 1
}
async function fetchPages(urlForPage) {
  const first = await axios.get(urlForPage(1), { headers: HEADERS, withCredentials: true })
  const all = [...listOf(first.data)], totalPages = pagesOf(first.data)
  for (let page = 2; page <= totalPages; page += 2) {
    const batch = [page, page + 1].filter(p => p <= totalPages)
    const rows = await Promise.all(batch.map(async p => listOf((await axios.get(urlForPage(p), { headers: HEADERS, withCredentials: true })).data)))
    rows.forEach(rowsForPage => all.push(...rowsForPage))
  }
  return all
}
function query(values) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, String(v)) })
  return params.toString()
}
const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
const projectKey = value => clean(value).replace(/[\u3000\s]+/g, '')
const getContractName = row => clean(row?.name ?? row?.contract_name ?? row?.project_name)
function getRegion(row) {
  const county = clean(row?.key10 ?? row?.county_name ?? row?.district_name ?? row?.area_name ?? row?.county ?? row?.district ?? row?.fire_county_name ?? row?.region_name)
  if (county) return county
  const city = clean(row?.city_str ?? row?.city_name)
  if (city) return city
  const code = clean(row?.key8 ?? row?.city_code ?? row?.city_id ?? row?.city_uuid ?? row?.city)
  return code ? `城市编码 ${code}` : '地区未填写'
}
function getTaskStatus(task) {
  for (const value of [task?.task_status_int, task?.task_status, task?.task_status_code, task?.status]) {
    if (value === undefined || value === null || value === '') continue
    const s = clean(value)
    if (s === '5' || s.includes('待审核')) return 'pending'
    if (s === '6' || s.includes('审核通过')) return 'approved'
    if (s === '4' || s.includes('执行中')) return 'executing'
  }
  return 'other'
}

async function fetchFresh(date = new Date()) {
  const { start, end, key } = monthRange(date)
  const contracts = await fetchPages(page => `${BASE_URL}/admin/contract/index.html?${query({
    page, key: '', key2: '', key3: 0, key5: '', key6: 1, key7: PROVINCE_CODE,
    key8: '', key9: '', key10: '', project_leader: '', expireC: '', unexpireC: '',
    id: '', uuid: '', start: '', end: '', contract_type: '', contract_wb_name: '',
    sign_end_start: '', sign_end_end: '', project_leader_name: '', get_contract_id: ''
  })}`)
  // key3[]=0 不限制审核状态；key5[]=5 只取测试任务；key6=3 沿用后台任务列表的有效查询组合。
  const tasks = await fetchPages(page => `${BASE_URL}/admin/task/index.html?${query({
    page, key: start, key2: end, 'key3[]': 0, key4: '', 'key5[]': 5,
    key6: 3, key7: PROVINCE_CODE, key8: '', fire_g_uuid: '', fire_p_uuid: '',
    fire_uuid: '', header_name: ''
  })}`)
  const groups = new Map()
  const statusCounts = { pending: 0, approved: 0, executing: 0, other: 0 }
  for (const task of tasks) {
    const status = getTaskStatus(task)
    statusCounts[status] = (statusCounts[status] || 0) + 1
    const name = projectKey(task?.contract_name)
    if (!name) continue
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(task)
  }
  let matchedTasks = 0
  const projects = contracts.filter(c => getContractName(c)).map(contract => {
    const name = getContractName(contract), matched = groups.get(projectKey(name)) || []
    matchedTasks += matched.length
    return {
      id: clean(contract?.id ?? contract?.contract_id ?? contract?.uuid) || name,
      name,
      leader: clean(contract?.project_leader_name) || '负责人未填写',
      region: getRegion(contract),
      contractNumber: clean(contract?.contract_no ?? contract?.contract_number ?? contract?.contract_num ?? contract?.contract_code ?? contract?.number ?? contract?.code) || '—',
      completed: matched.some(task => ['pending', 'approved'].includes(getTaskStatus(task))),
      taskCount: matched.length
    }
  })
  return { month: key, start, end, provinceCode: PROVINCE_CODE, projects,
    sourceCounts: { contracts: contracts.length, tasks: tasks.length, matchedTasks }, statusCounts }
}

export async function getCachedProjectTaskStatistics(date = new Date()) {
  return readCache(monthRange(date).key)
}
export async function refreshProjectTaskStatistics(date = new Date()) {
  const record = { ...await fetchFresh(date), refreshedAt: new Date().toISOString() }
  try {
    await writeCache(record)
    return { ...record, cacheSaved: true, cacheError: '' }
  } catch (error) {
    console.error('统计数据已获取，但写入 IndexedDB 缓存失败：', error)
    return { ...record, cacheSaved: false, cacheError: error?.message || '本地缓存写入失败' }
  }
}
