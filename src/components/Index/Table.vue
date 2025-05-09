<template>
    <div class="kanban">
        <table class="table table-bordered table-hover">
            <thead>
                <tr class="long-tr">
                    <th rowspan="2">项目数量</th>
                    <th colspan="3">计划</th>
                    <th colspan="3">已下发计划</th>
                </tr>
                <tr class="long-tr">
                    <th>未创建</th>
                    <th>未下发</th>
                    <th>未完成</th>
                    <th>待审核</th>
                    <th>待生成</th>
                    <th>待备案</th>
                </tr>
            </thead>
            <tbody>
                <tr class="long-td">
                    <td>{{ tableData.total }}</td>
                    <td>{{ tableData.uncreated }}</td>
                    <td>{{ tableData.unissued }}</td>
                    <td>{{ tableData.unfinished }}</td>
                    <td>{{ tableData.unchecked }}</td>
                    <td>
                        <el-button text @click="showUngenerated">
                            {{ tableData.ungenerated }}
                        </el-button>
                    </td>
                    <td>{{ tableData.unrecorded }}</td>
                </tr>
            </tbody>
        </table>
        <div class="alert alert-warning tips">
            <ul>
                <li>由于计划会统计非维保项目，即将到期项目，所以通常比总项目数量要多。总项目数量是本月应出报告数量，更具参考价值。</li>
            </ul>
        </div>
        <div class="alert alert-danger tips">
            <span>助手尚在实验中，不要盲目相信。建议每间隔两天手动检查一次项目状况。</span>
        </div>
    </div>
    <el-dialog
        v-model="dialogVisible"
        top="20vh"
        width="60%">
        <el-table :data="generatable" stripe>
            <el-table-column prop="contract_name" label="项目名"/>
            <el-table-column prop="plan_name" label="计划"/>
            <el-table-column prop="commit_time" label="提交时间"/>
        </el-table>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUnrecordedProject, getUncreatedProject, getUnissuedProject, getUnfinishedProject, getUncheckedProject, getUngeneratedProject } from '../../api/Index/table'

const tableData = ref({
    total: 0,
    uncreated: 0,
    unissued: 0,
    unfinished: 0,
    unchecked: 0,
    ungenerated: 0,
    unrecorded: 0,
});
const dialogVisible = ref(false);
const generatable = ref([]);
async function fetchData() {
    try {
        tableData.value.total = parseInt(document.querySelector("body > div.example-wrap > div > table > tbody > tr > td:nth-child(5) > a").textContent)

        const uncreatedRes = await getUncreatedProject();
        if (uncreatedRes && uncreatedRes.page_str) {
            const match = uncreatedRes.page_str.match(/共(\d+)条$/);
            if (match) {
                tableData.value.uncreated = parseInt(match[1]);
            } else {
                console.error('未能从page_str中提取数字：', uncreatedRes.page_str);
            }
        }

        const unissuedRes = await getUnissuedProject();
        if (unissuedRes && unissuedRes.page_str) {
            const match = unissuedRes.page_str.match(/共(\d+)条$/);
            if (match) {
                tableData.value.unissued = parseInt(match[1]);
            } else {
                console.error('未能从page_str中提取数字：', unissuedRes.page_str);
            }
        }

        const unfinishedRes = await getUnfinishedProject();
        if (unfinishedRes && unfinishedRes.page_str) {
            const match = unfinishedRes.page_str.match(/共(\d+)条$/);
            if (match) {
                tableData.value.unfinished = parseInt(match[1]);
            } else {
                console.error('未能从page_str中提取数字：', unfinishedRes.page_str);
            }
        }

        const uncheckedRes = await getUncheckedProject();
        tableData.value.unchecked = uncheckedRes.total;

        generatable.value = await getUngeneratedProject();
        tableData.value.ungenerated = generatable.value.length
        console.log(tableData.value.ungenerated);
        const unrecordedRes = await getUnrecordedProject();
        if (unrecordedRes && unrecordedRes.page_str) {
            const match = unrecordedRes.page_str.match(/共(\d+)条$/);
            if (match) {
                tableData.value.unrecorded = parseInt(match[1]);
            } else {
                console.error('未能从page_str中提取数字：', unrecordedRes.page_str);
            }
        }
    } catch (error) {
        console.error('获取项目状态数据失败：', error);
    }
}

function showUngenerated() {
    dialogVisible.value = true;

}

onMounted(() => {
    fetchData();
});
</script>

<style>
.tips {
    width: 60%;
    margin: 0 auto;
    margin-top: 10px;
}
</style>