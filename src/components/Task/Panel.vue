<template>
  <el-dialog id="dialog" v-model="dialogVisible" title="Tips" width="90%" :close-on-press-escape="false" append-to-body top="10px">
    <template #header="{ titleId, titleClass }">
      <div class="header-left"><h4 :id="titleId" :class="titleClass">{{ system }}</h4><span id="subtitle">{{ item }}</span></div>
      <div class="header-right"><small>快捷键：空格=预览图 | C=储水信息 | ←/→ 翻页</small></div>
    </template>
    <div class="dialog-content">
      <div class="test-content">
        <el-tag :type="tagType" effect="dark" class="wk-status-tag" :style="statusStyle">测试内容（{{ tagText }}）</el-tag>
        <span v-html="content"></span>
      </div>
      <el-divider />
      <div v-if="remark"><b>备注：</b><span class="test-remark" v-html="remark"></span><el-divider /></div>
      <div class="test-images">
        <el-image v-for="(image,index) in processedImages" :key="index" :src="image" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" :preview-src-list="processedImages" :initial-index="index" fit="cover" class="image-item" show-progress />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-progress :percentage="currentPercent" color="#F3B9CA" :stroke-width="15"><span>{{ currentProgress }}页/{{ totalItem }}页</span></el-progress>
        <div class="button-group"><el-button type="primary" @click="showWaterInfo">查看储水信息</el-button><el-button type="danger" @click="dialogVisible=false">关闭</el-button></div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, h, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { getWaterInfo } from '../../api/utils'
import { replaceUrl } from '../../api/util/sourceHelper'

const props = defineProps({
  system:{type:String,default:''}, item:{type:String,default:''}, content:{type:String,default:''},
  start:{type:String,default:''}, end:{type:String,default:''}, time:{type:String,default:''},
  images:{type:Array,default:()=>[]}, totalItem:{type:Number,default:0}, currentProgress:{type:Number,default:1},
  remark:{type:String,default:''}, type:{type:String,default:''}
})
const dialogVisible = defineModel('dialogVisible',{type:Boolean,default:false})
const config = {
  '基本信息':{text:'基本信息',type:'primary'},
  '符合':{text:'符合',type:'success'},
  '不符合':{text:'不符合',type:'danger'},
  '不能检查':{text:'不能检查',type:'warning'},
  '不存在':{text:'不存在',type:'info'}
}
const tagType = computed(()=>config[props.type]?.type || 'info')
const tagText = computed(()=>config[props.type]?.text || '未定义')
const currentPercent = computed(()=>props.totalItem ? Number((props.currentProgress/props.totalItem*100).toFixed(2)) : 0)
const colors = {'符合':'#2E9E5B','不符合':'#D93A3A','不能检查':'#F08A1C','不存在':'#8A8F98'}
const statusStyle = computed(()=>{
  const color=colors[props.type]
  return color ? {'--el-tag-bg-color':color,'--el-tag-border-color':color,'--el-tag-text-color':'#fff',backgroundColor:color,borderColor:color,color:'#fff',fontSize:'16px',fontWeight:'bold'} : {fontSize:'16px'}
})
const processedImages = computed(()=>props.images.map(replaceUrl))
async function showWaterInfo() {
  const name = document.querySelector('#taskAudit > div:nth-child(6) > div > input')?.value || ''
  const list = await getWaterInfo(name)
  list.forEach(item=>ElNotification({
    title:item.name,
    message:h('div',null,item.data.map(info=>h('p',null,`${info.position}的${info.container_type_str}容量${info.capacity}m³`))),
    duration:5000
  }))
}
function handleKeyDown(event) {
  if (!dialogVisible.value) return
  if (event.key === ' ') {
    event.preventDefault()
    document.querySelector('.el-image__preview')?.click()
  } else if (event.key.toLowerCase() === 'c') showWaterInfo()
}
onMounted(()=>document.addEventListener('keydown',handleKeyDown))
onUnmounted(()=>document.removeEventListener('keydown',handleKeyDown))
</script>

<style scoped>
.dialog-content :deep(b){font-size:16px;color:#51495E}
.header-left{display:flex;flex-direction:row;align-items:flex-end}
#subtitle{margin-left:10px}
.image-item{width:22.5%;margin:3px}
.dialog-footer{display:flex;align-items:center;justify-content:space-between;width:100%}
.el-progress{flex-grow:1;margin-right:12px}
.button-group{display:flex;gap:8px}
.test-content{display:flex;flex-direction:row;align-items:flex-end;justify-content:flex-start;gap:12px}
</style>
