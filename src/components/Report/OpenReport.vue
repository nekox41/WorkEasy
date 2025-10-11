<template>
    <!-- 按钮 -->
    <button type="button" class="btn btn-primary" @click="dialogVisible = true">Open Report</button>
    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" title="批量打开报告" width="500" :append-to-body="true">
        <div class="dialog-body">
            <div class="block">
                <span class="demonstration">选择报告日期</span>
                <el-date-picker v-model="dateRange" type="daterange" unlink-panels range-separator="到"
                    start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" :size="size" />
            </div>
            <div class="block">
                <el-input v-model="textarea" style="width: 300px" :rows="3" type="textarea"
                    placeholder="Please input" />
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleClick">
                    打开报告
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { fetchAndOpenReport } from '@/api/Report/reportService'
import { ElMessage } from 'element-plus'
const dialogVisible = ref(false)
const textarea = ref('')

// 获取当前月的起止时间
function getCurrentMonthRange() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    // 第一天
    const firstDay = new Date(year, month, 1)
    // 最后一天
    const lastDay = new Date(year, month + 1, 0)

    return [
        formatDate(firstDay),
        formatDate(lastDay)
    ]
}

function getLastMonthRange() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    // 第一天
    const firstDay = new Date(year, month - 1, 1)
    // 最后一天
    const lastDay = new Date(year, month, 0)

    return [
        formatDate(firstDay),
        formatDate(lastDay)
    ]
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function handleClick() {
    textarea.value.trim().split("\n").forEach(item => {
        fetchAndOpenReport(item, dateRange.value[0], dateRange.value[1])
    })
    ElMessage({
        message: '处理完成',
        type: 'success',
    })
    dialogVisible.value = false
}

const dateRange = ref(getCurrentMonthRange())
const shortcuts = [
    {
        text: "上个月",
        value: getLastMonthRange(),
    }
]
</script>

<style scoped>
.btn-primary {
    margin-top: 18px;
}

.dialog-body {
    display: flex;
    width: 100%;
    padding: 0;
    flex-wrap: wrap;
}

.dialog-body .block {
    padding: 30px 0;
    text-align: center;
    border-right: solid 1px var(--el-border-color);
    flex: 1;
}

.dialog-body .block:last-child {
    border-right: none;
}

.dialog-body .demonstration {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    margin-bottom: 20px;
}
</style>