<template><span ref="buttonHolder"><OneClickPlan /></span></template>
<script setup>
import { onMounted,onBeforeUnmount,ref } from 'vue'
import OneClickPlan from './OneClickPlan.vue'
const types={
  '年':{label:'年度计划',bg:'#E7E6E8',bar:'#51495E'},
  '季':{label:'季度计划',bg:'#FBEAEF',bar:'#F3B9CA'},
  '月':{label:'月度计划',bg:'#E8EEF5',bar:'#899DBD'}
}
const regex=/(\d{4})年(\d{1,2})月(年|季|月)维护保养计划/
let observer
const buttonHolder=ref(null)
const cls=t=>t==='年'?'year':t==='季'?'quarter':'month'
function colorize(){
  document.querySelectorAll('table tbody tr').forEach(row=>{
    const cells=row.querySelectorAll('td')
    if(cells.length<5)return
    const match=cells[0].textContent.trim().match(regex)
    if(!match)return
    row.classList.add('plan-type-'+cls(match[3]))
    if(Number.parseInt(cells[4].textContent.trim(),10)>0)row.classList.add('plan-unfinished')
  })
}
function addLegend(){
  if(document.querySelector('.plan-legend'))return
  const table=document.querySelector('table')
  if(!table?.parentNode)return
  const legend=document.createElement('div')
  legend.className='plan-legend'
  legend.innerHTML=Object.values(types).map(v=>`<span><i style="background:${v.bg};border:1px solid ${v.bar};box-shadow:inset 4px 0 0 ${v.bar}"></i>${v.label}</span>`).join('')+'<span><i style="background:#F3B9CA;border:1px solid #51495E"></i>粉色格 = 有未完成任务</span>'
  table.parentNode.insertBefore(legend,table)
}
onMounted(()=>{
  const style=document.createElement('style')
  style.id='workeasy-plan-style'
  style.textContent=Object.entries(types).map(([t,v])=>`tr.plan-type-${cls(t)}>td{background-color:${v.bg}!important}tr.plan-type-${cls(t)}>td:first-child{box-shadow:inset 6px 0 0 ${v.bar}}`).join('')+`
    tr.plan-unfinished>td:nth-child(5){background:#F3B9CA!important;color:#51495E!important;font-weight:bold}
    .plan-legend{display:inline-flex;gap:12px;margin:6px 0 6px 25px;font-size:13px;color:#51495E}
    .plan-legend span{display:inline-flex;align-items:center;gap:4px}
    .plan-legend i{display:inline-block;width:14px;height:14px;border-radius:3px}`
  document.head.appendChild(style)
  colorize();addLegend()
  const native=Array.from(document.querySelectorAll('button,a')).find(el=>el.textContent.trim()==='新建')
  if(native?.parentNode&&buttonHolder.value){buttonHolder.value.style.marginRight='8px';native.parentNode.insertBefore(buttonHolder.value,native)}
  else if(buttonHolder.value)buttonHolder.value.style.cssText='position:fixed;top:12px;right:120px;z-index:2000'
  const tbody=document.querySelector('table tbody')
  if(tbody){observer=new MutationObserver(()=>{colorize();addLegend()});observer.observe(tbody,{childList:true})}
})
onBeforeUnmount(()=>{observer?.disconnect();document.querySelector('#workeasy-plan-style')?.remove();document.querySelector('.plan-legend')?.remove()})
</script>
