<template>
  <div class="floating-container" :style="{ left: position.x + 'px', top: position.y + 'px' }" @mousedown="startDrag">
    <button class="floating-btn" @click="toggleDialog">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="feather feather-clipboard">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      待生成报告 ({{ count }})
    </button>

    <Teleport to="body">
      <el-dialog v-model="dialogVisible" title="待生成报告的任务" width="60%" :close-on-click-modal="false" class="report-dialog">
        <el-table :data="generatable" stripe>
          <el-table-column prop="contract_name" label="项目名" />
          <el-table-column prop="plan_name" label="计划" />
          <el-table-column prop="commit_time" label="提交时间" />
        </el-table>
      </el-dialog>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { getUngeneratedProject } from '../../api/Index/table'

// 浮动按钮位置状态
const position = reactive({
  x: window.innerWidth - 250,
  y: 100
})

// 拖拽相关变量
let isDragging = false
let offsetX = 0
let offsetY = 0

// 对话框和数据状态
const dialogVisible = ref(false)
const generatable = ref([])
const count = ref(0)

// 初始化数据
async function init() {
  try {
    generatable.value = await getUngeneratedProject()
    count.value = generatable.value.length
  } catch (error) {
    console.error('获取待生成报告任务失败：', error)
  }
}

// 开始拖拽
function startDrag(event) {
  isDragging = true
  const rect = event.currentTarget.getBoundingClientRect()
  offsetX = event.clientX - rect.left
  offsetY = event.clientY - rect.top

  event.preventDefault(); // 防止拖拽时选中文本

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 处理拖拽过程
function handleDrag(event) {
  if (!isDragging) return

  position.x = event.clientX - offsetX
  position.y = event.clientY - offsetY

  // 边界检测
  if (position.x < 0) position.x = 0
  if (position.y < 0) position.y = 0
  if (position.x + 200 > window.innerWidth) {
    position.x = window.innerWidth - 200
  }
  if (position.y + 50 > window.innerHeight) {
    position.y = window.innerHeight - 50
  }
}

// 停止拖拽
function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 切换对话框显示/隐藏
function toggleDialog() {
  dialogVisible.value = !dialogVisible.value
}

// 组件挂载时初始化数据
onMounted(() => {
  init()
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.floating-container {
  position: fixed;
  z-index: 9999;
  cursor: move;
  transition: none;
}

.floating-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.floating-btn:hover {
  background-color: #2a78d6;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.report-dialog {
  z-index: 10000;
}

/* 隐藏默认的el-dialog头部关闭按钮 */
.report-dialog .el-dialog__header {
  padding: 10px 20px;
}
</style>