<template>
  <span class="one-click-plan">
    <el-button type="success" plain @click="open">一键新建并下发</el-button>
    <el-dialog v-model="visible" title="一键新建并下发" width="480px" :close-on-click-modal="false" :close-on-press-escape="!running" append-to-body>
      <el-form label-width="84px">
        <el-form-item label="项目">{{ projectName || '未识别项目名称' }}</el-form-item>
        <el-form-item label="计划月份">{{ monthText }}</el-form-item>
        <el-form-item label="计划类型">
          <div><el-radio-group v-model="type" :disabled="running">
            <el-radio-button value="月">月计划</el-radio-button><el-radio-button value="季">季计划</el-radio-button><el-radio-button value="年">年计划</el-radio-button>
          </el-radio-group><div class="hint">{{ hint }}</div></div>
        </el-form-item>
        <el-form-item label="执行人员">
          <el-select v-model="engineer" filterable clearable :loading="loadingOps" :disabled="running" placeholder="不选则只新建、不下发" style="width:100%">
            <el-option v-for="op in operators" :key="op.value" :label="op.label" :value="op.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert v-if="blockReason" :title="blockReason" type="warning" :closable="false" show-icon style="margin-bottom:8px" />
      <el-alert title="计划一旦下发，将不能删除和更改！" type="info" :closable="false" show-icon />
      <div v-if="status" class="status">{{ status }}</div>
      <template #footer><el-button :disabled="running" @click="visible=false">取消</el-button><el-button type="primary" :loading="running" :disabled="!!blockReason" @click="run">确认新建并下发</el-button></template>
    </el-dialog>
  </span>
</template>
<script setup>
import {ref} from 'vue'
import {ElMessage} from 'element-plus'
import axios from 'axios'
const BASE=location.origin
const HEADERS={'X-Requested-With':'XMLHttpRequest'}
const PROPERTY={'月':1,'季':2,'年':3}
const UUID='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const PLAN=/(\d{4})年(\d{1,2})月(年|季|月)维护保养计划/
const visible=ref(false),running=ref(false),loadingOps=ref(false),type=ref('月'),engineer=ref('')
const operators=ref([]),status=ref(''),hint=ref(''),blockReason=ref('')
const now=new Date()
const monthText=`${now.getFullYear()}年${now.getMonth()+1}月`
function getProjectName(){
  const h=Array.from(document.querySelectorAll('h5')).find(el=>el.textContent.includes('项目名称'))
  return h?.textContent.match(/项目名称[:：]\s*([\s\S]+?)\s*项目类型/)?.[1]?.trim()||''
}
function getContractUuid(){
  const html=document.documentElement.innerHTML
  const m=html.match(new RegExp(`contract_uuid[^0-9a-f]{1,12}(${UUID})`))||html.match(new RegExp(UUID))
  return m?.[1]||m?.[0]||null
}
const projectName=getProjectName(),contractUuid=getContractUuid(),storeKey=`workeasy_engineer_${contractUuid}`
function parseRows(root){
  return Array.from(root.querySelectorAll('table tbody tr')).map(row=>{
    const cells=row.querySelectorAll('td');if(cells.length<5)return null
    const name=cells[0].textContent.trim(),m=name.match(PLAN);if(!m)return null
    return {name,y:+m[1],m:+m[2],type:m[3],executor:cells[1].textContent.trim(),html:row.outerHTML}
  }).filter(Boolean)
}
function parseDetail(rowHtml,fallback){
  const html=rowHtml.replace(/&amp;/g,'&')
  const m=html.match(new RegExp(`contractplandetail\\.html\\?contract_uuid=(${UUID})&id=(\\d+)`))
  if(m)return {uuid:m[1],id:m[2]}
  const ids=html.match(/\b\d{6,}\b/g)
  return ids?.length?{uuid:fallback,id:ids[0]}:null
}
async function detailDoc(uuid,id){
  const r=await axios.get(`${BASE}/admin/contractplan/contractplandetail.html`,{params:{contract_uuid:uuid,id}})
  return new DOMParser().parseFromString(r.data,'text/html')
}
function assertOk(r,action){
  const d=r.data
  if(d&&typeof d==='object'&&d.code!==undefined&&d.code!==1)throw new Error(`${action}失败：${d.msg||JSON.stringify(d)}`)
}
function suggest(rows){
  const current=now.getFullYear()*12+now.getMonth()+1
  const existing=rows.find(r=>r.y*12+r.m===current)
  blockReason.value=existing?`本月已存在：${existing.name}`:''
  if(!rows.length){hint.value='没有历史计划，默认月计划，请自行确认';return '月'}
  const first=rows.reduce((a,b)=>a.y*12+a.m<=b.y*12+b.m?a:b)
  const index=current-(first.y*12+first.m)+1
  const value=index%12===0?'年':index%3===0?'季':'月'
  hint.value=`以最早的计划（${first.y}年${first.m}月）起算，本月是第 ${index} 个月 → 建议${value}计划，可手动修改`
  return value
}
function parseOperators(doc){
  return Array.from(doc.querySelectorAll('#engineer_uuid option')).filter(o=>o.value).map(o=>({value:o.value,label:o.textContent.trim().replace(/-[0-9]{15,17}[0-9Xx]$/,'')}))
}
async function loadOperators(rows){
  operators.value=[];engineer.value=''
  if(!rows.length)return
  const latest=rows.reduce((a,b)=>a.y*12+a.m>=b.y*12+b.m?a:b)
  const ref=parseDetail(latest.html,contractUuid);if(!ref)return
  loadingOps.value=true
  try{
    operators.value=parseOperators(await detailDoc(ref.uuid,ref.id))
    let saved='';try{saved=localStorage.getItem(storeKey)||''}catch{}
    const byName=latest.executor&&operators.value.find(o=>o.label.includes(latest.executor))
    const bySaved=saved&&operators.value.find(o=>o.value===saved)
    engineer.value=(bySaved||byName||{}).value||''
  }catch(e){console.error('读取执行人失败',e)}finally{loadingOps.value=false}
}
function open(){
  if(!contractUuid){ElMessage.error('没找到项目 UUID，无法使用');return}
  status.value='';const rows=parseRows(document);type.value=suggest(rows);visible.value=true;loadOperators(rows)
}
async function createAndSend(){
  const expected=`${now.getFullYear()}年${now.getMonth()+1}月${type.value}维护保养计划`
  status.value='① 检查是否可以新建…'
  const pre=await axios.post(`${BASE}/admin/contractplan/planlist.html`,new URLSearchParams({contract_uuid:contractUuid}),{headers:HEADERS})
  assertOk(pre,'新建前检查')
  const formUrl=pre.data?.data&&typeof pre.data.data==='string'?new URL(pre.data.data,BASE).href:`${BASE}/admin/contractplan/plancontent/contract_uuid/${contractUuid}.html`
  status.value='② 读取新建表单…'
  const formDoc=new DOMParser().parseFromString((await axios.get(formUrl)).data,'text/html')
  const form=formDoc.querySelector('#saveplancontent');if(!form)throw new Error('未读取到新建计划表单')
  const pageProject=(form.querySelector('input.form-control[readonly]')?.value||'').trim()
  if(projectName&&pageProject!==projectName)throw new Error(`项目不一致，已中止（页面：${projectName}，表单：${pageProject}）`)
  const body=new URLSearchParams()
  form.querySelectorAll('input[type=hidden][name]').forEach(input=>body.set(input.name,input.value))
  if(!body.has('contract_uuid'))body.set('contract_uuid',contractUuid)
  if(!body.has('contract_type'))body.set('contract_type','4')
  body.set('plan_property',String(PROPERTY[type.value]))
  status.value=`③ 新建${type.value}计划…`
  const saved=await axios.post(`${BASE}/admin/contractplan/saveplancontent.html`,body,{headers:HEADERS})
  assertOk(saved,'新建计划')
  if(!engineer.value)return {sent:false}
  try{
    status.value='④ 定位刚新建的计划…'
    const listDoc=new DOMParser().parseFromString((await axios.get(location.href)).data,'text/html')
    const row=parseRows(listDoc).find(r=>r.name===expected);if(!row)throw new Error(`列表中没找到「${expected}」`)
    const ref=parseDetail(row.html,contractUuid);if(!ref)throw new Error('没解析到计划详情链接')
    status.value='⑤ 读取计划内容…'
    const doc=await detailDoc(ref.uuid,ref.id)
    const planUuid=doc.querySelector('input[name=cplan_uuid]')?.value
    const planId=doc.querySelector('#cpid')?.value||ref.id
    if(!planUuid)throw new Error('没读取到计划 UUID（cplan_uuid）')
    const items=(await axios.get(`${BASE}/admin/contractplan/getcpdlist.html`,{params:{key:'',key2:'',key3:'',id:planId},headers:HEADERS})).data?.data||[]
    const ids=items.filter(x=>x.send_status!=1).map(x=>x.facility_uuid)
    if(!ids.length)throw new Error('计划下没有可下发的设施')
    status.value=`⑥ 下发 ${ids.length} 项给执行人…`
    const sent=await axios.post(`${BASE}/admin/contractplan/sendplan.html`,new URLSearchParams({engineer_uuid:engineer.value,cpdids:ids.join(',')+',',cplan_uuid:planUuid}),{headers:HEADERS})
    assertOk(sent,'下发')
    return {sent:true,count:ids.length}
  }catch(error){throw new Error(`计划已新建，但下发未完成：${error.message}`,{cause:error})}
}
async function run(){
  if(running.value)return
  running.value=true
  try{
    const result=await createAndSend()
    try{if(engineer.value)localStorage.setItem(storeKey,engineer.value)}catch{}
    ElMessage.success(result.sent?`已新建并下发（${result.count} 项）`:'已新建（未选执行人，未下发）')
    visible.value=false;window.setTimeout(()=>location.reload(),800)
  }catch(error){console.error(error);status.value='❌ '+error.message;ElMessage.error({message:error.message,duration:6000});if(error.cause)window.setTimeout(()=>location.reload(),3000)}
  finally{running.value=false}
}
</script>
<style scoped>
.one-click-plan{display:inline-block}.hint{margin-top:4px;color:#909399;font-size:12px;line-height:1.5}.status{margin-top:10px;color:#606266;font-size:13px}
</style>
