<template>
    <div class="kanban">
        <el-table :data="tableDataArray" border style="width: 100%">
            <!-- 表头 -->
            <el-table-column label="项目数量" :render-header="renderMergedHeader">
                <template #default>
                    <span>{{ tableData.total }}</span>
                </template>
            </el-table-column>

            <!-- 计划 -->
            <el-table-column label="计划">
                <el-table-column label="未创建">
                    <template #default>
                        <span>{{ tableData.uncreated }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="未下发">
                    <template #default>
                        <span>{{ tableData.unissued }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="未完成">
                    <template #default>
                        <span>{{ tableData.unfinished }}</span>
                    </template>
                </el-table-column>
            </el-table-column>

            <!-- 已下发计划 -->
            <el-table-column label="已下发计划">
                <el-table-column label="待审核">
                    <template #default>
                        <span>{{ tableData.unchecked }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="待生成">
                    <template #default>
                        <el-button text @click="showUngenerated">{{ tableData.ungenerated }}</el-button>
                    </template>
                </el-table-column>
                <el-table-column label="待备案">
                    <template #default>
                        <span>{{ tableData.unrecorded }}</span>
                    </template>
                </el-table-column>
            </el-table-column>
        </el-table>

        <!-- 使用 el-alert 替代原生 alert -->
        <el-alert title="由于计划会统计非维保项目，即将到期项目，所以通常比总项目数量要多。总项目数量是本月应出报告数量，更具参考价值。" type="warning" effect="dark" show-icon
            :closable="false" style="margin: 10px auto; max-width: 60%" />

        <el-alert title="助手尚在实验中，不要盲目相信。建议每间隔两天手动检查一次项目状况。" type="error" effect="dark" show-icon :closable="false"
            style="margin: 10px auto; max-width: 60%" />

        <!-- 弹窗 -->
        <el-dialog v-model="dialogVisible" top="20vh" width="60%">
            <el-table :data="generatable" stripe>
                <el-table-column prop="contract_name" label="项目名" />
                <el-table-column prop="plan_name" label="计划" />
                <el-table-column prop="commit_time" label="提交时间" />
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    getUnrecordedProject,
    getUncreatedProject,
    getUnissuedProject,
    getUnfinishedProject,
    getUncheckedProject,
    getUngeneratedProject
} from '../../api/Index/table'

const tableData = ref({
    total: 0,
    uncreated: 0,
    unissued: 0,
    unfinished: 0,
    unchecked: 0,
    ungenerated: 0,
    unrecorded: 0
})

const dialogVisible = ref(false)
const generatable = ref([])

// 模拟一行数据用于 el-table 渲染
const tableDataArray = computed(() => [tableData.value])

async function fetchData() {
    try {
        const element = document.querySelector("body > div.example-wrap > div > table > tbody > tr > td:nth-child(5) > a")
        if (element) {
            tableData.value.total = parseInt(element.textContent)
        }

        const uncreatedRes = await getUncreatedProject()
        if (uncreatedRes && uncreatedRes.page_str) {
            const match = uncreatedRes.page_str.match(/共(\d+)条$/)
            if (match) {
                tableData.value.uncreated = parseInt(match[1])
            }
        }

        const unissuedRes = await getUnissuedProject()
        if (unissuedRes && unissuedRes.page_str) {
            const match = unissuedRes.page_str.match(/共(\d+)条$/)
            if (match) {
                tableData.value.unissued = parseInt(match[1])
            }
        }

        const unfinishedRes = await getUnfinishedProject()
        if (unfinishedRes && unfinishedRes.page_str) {
            const match = unfinishedRes.page_str.match(/共(\d+)条$/)
            if (match) {
                tableData.value.unfinished = parseInt(match[1])
            }
        }

        const uncheckedRes = await getUncheckedProject()
        tableData.value.unchecked = uncheckedRes.total

        generatable.value = await getUngeneratedProject()
        tableData.value.ungenerated = generatable.value.length

        const unrecordedRes = await getUnrecordedProject()
        if (unrecordedRes && unrecordedRes.page_str) {
            const match = unrecordedRes.page_str.match(/共(\d+)条$/)
            if (match) {
                tableData.value.unrecorded = parseInt(match[1])
            }
        }
    } catch (error) {
        console.error('获取项目状态数据失败：', error)
    }
}

function showUngenerated() {
    dialogVisible.value = true
}

onMounted(() => {
    fetchData()
})
</script>

<style>
.tips {
    width: 60%;
    margin: 0 auto;
    margin-top: 10px;
}

.el-table .cell {
    text-align: center;
}
</style>