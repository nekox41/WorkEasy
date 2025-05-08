<template>
    <div class="kanban">
        <div class="spiner-example kanbanloading" v-if="loading">
            <div class="sk-spinner sk-spinner-circle">
                <div class="sk-circle1 sk-circle"></div>
                <div class="sk-circle2 sk-circle"></div>
                <div class="sk-circle3 sk-circle"></div>
                <div class="sk-circle4 sk-circle"></div>
                <div class="sk-circle5 sk-circle"></div>
                <div class="sk-circle6 sk-circle"></div>
                <div class="sk-circle7 sk-circle"></div>
                <div class="sk-circle8 sk-circle"></div>
                <div class="sk-circle9 sk-circle"></div>
                <div class="sk-circle10 sk-circle"></div>
                <div class="sk-circle11 sk-circle"></div>
                <div class="sk-circle12 sk-circle"></div>
            </div>
        </div>
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
                    <td>{{ tableData.ungenerated }}</td>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUnrecordedProject, getUncreatedProject, getUnissuedProject, getUnfinishedProject, getUncheckedProject, getUngeneratedProject } from '../../api/Index/table'

const loading = ref(true);
const tableData = ref({
    total: 0,
    uncreated: 0,
    unissued: 0,
    unfinished: 0,
    unchecked: 0,
    ungenerated: 0,
    unrecorded: 0,
    generatable: []
});

// async function getAllProject() {
//     try {
//         const res = await getProjectPage(1);
//         if (!res || !res.all_page || !res.list) {
//             console.error('获取项目列表失败：无效的响应数据');
//             return;
//         }
//         const allPage = res.all_page;
//         tableData.value.list.push(...res.list);
//         for (let i = 2; i <= allPage; i++) {
//             const res = await getProjectPage(i);
//             if (res && res.list) {
//                 tableData.value.list.push(...res.list);
//             }
//         }
//         tableData.value.total = tableData.value.list.length;
//     } catch (error) {
//         console.error('获取项目列表失败：', error);
//     }
// }

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

        tableData.value.generatable = getUngeneratedProject();
        tableData.value.ungenerated = tableData.value.generatable.length ? tableData.value.generatable.length : 0;

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
    } finally {
        loading.value = false;
    }
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