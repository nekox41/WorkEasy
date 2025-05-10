<script setup>
import { onMounted, ref } from 'vue';
import Panel from './Panel.vue';
import { getTaskDetails, getImages } from "../../api/Task/task"
import { ElMessage } from 'element-plus';
import { getTaskList, getProjectByContractID } from '../../api/utils';

const submissionTime = document.querySelector("#taskAudit > div:nth-child(16) > div > input").value

// 用于Panel的数据
const dataList = ref([]);
const dataIndex = ref(0);
const dialogVisible = ref(false);
const isLoading = ref(false);
const pageData = ref([]); // 任务小项

// 进度条控制
const progressPercent = ref(0);
const totalItem = ref(0);
const currentProgress = ref(1);
// 生成项目key
const projectKey = document.querySelector("#taskAudit > div:nth-child(6) > div > input").value + "_" + document.querySelector("#taskAudit > div:nth-child(4) > div > input").value
/**
 * 恢复30天内的缓存数据
 * @param {string} key - 缓存的键（项目名加上月份）
 * @returns 
 */
function restoreFromCache(key) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return false;

    try {
        const { dataList: data, timestamp, rightLength, submissionTime: cacheSubmissionTime } = JSON.parse(cachedItem);
        const now = Date.now();

        // 缓存过期（30天）
        if (now - timestamp > 24 * 60 * 60 * 1000 * 30) {
            console.log('缓存过期')
            localStorage.removeItem(key);
            return false;
        }
        if (submissionTime !== cacheSubmissionTime) {
            console.log('任务已经重新提交')
            localStorage.removeItem(key);
            return false;
        }
        // 验证缓存
        if (data.length !== rightLength) {
            console.log('缓存错误')
            localStorage.removeItem(key);
            return false;
        }
        dataList.value = data;
        totalItem.value = dataList.value.length;
        return true;
    } catch (e) {
        console.error('缓存解析失败', e);
        return false;
    }
}

/**
 * 
 * @param {string} key - 缓存的键（项目名加上月份）
 */
function saveToCache(key) {
    const cacheData = {
        dataList: dataList.value,
        timestamp: Date.now(),
        rightLength: totalItem.value,
        submissionTime: submissionTime
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
}

async function getBaseData() {
    const startTime = new Date(document.querySelector("#taskAudit > div:nth-child(14) > div > input").value);
    const endTime = new Date(document.querySelector("#taskAudit > div:nth-child(16) > div > input").value);
    const timeDiff = endTime.getTime() - startTime.getTime();

    // 计算时间差的小时、分钟和秒
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // 操作员照片
    dataList.value.push({
        system: "基本信息",
        item: "操作员自拍",
        content: document.querySelector("#taskAudit > div:nth-child(18) > div > input").value,
        start: document.querySelector("#taskAudit > div:nth-child(14) > div > input").value,
        end: document.querySelector("#taskAudit > div:nth-child(16) > div > input").value,
        time: `${hours}小时${minutes}分钟${seconds}秒`,
        images: await getImages(document.querySelector("#taskAudit > div:nth-child(20) > a").href),
        type: "基本信息"
    })
    // 控制器照片
    dataList.value.push({
        system: "基本信息",
        item: "控制器照片",
        content: document.querySelector("#taskAudit > div:nth-child(19) > div > input").value,
        start: document.querySelector("#taskAudit > div:nth-child(14) > div > input").value,
        end: document.querySelector("#taskAudit > div:nth-child(16) > div > input").value,
        time: `${hours}小时${minutes}分钟${seconds}秒`,
        images: await getImages(document.querySelector("#taskAudit > div:nth-child(19) > a").href),
        type: "基本信息"
    })
    // 签到照片
    dataList.value.push({
        system: "基本信息",
        item: "签到照片",
        content: "签到照片",
        start: document.querySelector("#taskAudit > div:nth-child(14) > div > input").value,
        end: document.querySelector("#taskAudit > div:nth-child(16) > div > input").value,
        time: `${hours}小时${minutes}分钟${seconds}秒`,
        images: [document.querySelector("#taskAudit > div:nth-child(24) > div > a > img").src],
        type: "基本信息"
    })
}

async function loadAllData() {
    isLoading.value = true;
    for (let i = 0; i < pageData.value.length; i++) {
        try {
            const data = await getTaskDetails(pageData.value[i]);
            dataList.value.push(...data);
            progressPercent.value = ((i + 1) / pageData.value.length * 100).toFixed(2);
            totalItem.value = dataList.value.length;
        } catch (error) {
            console.error(error);
        }
    }
    saveToCache(projectKey);
    isLoading.value = false;
}

// 退回任务
async function taskGoBack() {
    const form = document.querySelector("#taskAudit");
    form.task_status.value = "-1"; // -1 = 审核不通过；6 = 审核通过
    form.mark.value = "修改"; // 备注
    // 获取项目负责人
    const taskData = await getTaskList({
        page: 1,
        projectName: document.querySelector("#taskAudit > div:nth-child(6) > div > input").value
    })
    const contractId = taskData.list[0].contract_id
    const projectData = await getProjectByContractID(contractId)
    form.audit_user_name.value = projectData.list[0].project_leader_name; // 项目负责人
    form.submit(); // 提交表单
}


onMounted(async () => {
    await getBaseData()

    // 初始化pageData（从DOM提取分页链接）
    pageData.value = Array.from(document.querySelectorAll('.long-td')).map(line =>
        line.children[3].firstElementChild.href
    );

    document.addEventListener("keydown", async (event) => {
        // 如果面板未打开，直接返回
        if (!dialogVisible.value || document.querySelector('.el-image-viewer__wrapper')) {
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault()
            // 翻页
            dataIndex.value++;
            currentProgress.value++;
            // 已到达最后一页
            // 回到首页
            if (dataIndex.value === dataList.value.length) {
                dataIndex.value = 0;
                currentProgress.value = 1;
            }
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault()
            if (dataIndex.value > 0) {
                dataIndex.value--;
                currentProgress.value--;
            } else {
                dataIndex.value = 0;
                currentProgress.value = 1;
            }
        }
    })

    const restored = restoreFromCache(projectKey);
    if (!restored) {
        await loadAllData();
    }
})
</script>

<template>
    <Panel v-model:dialogVisible="dialogVisible" v-bind="{
        ...dataList[dataIndex],
        currentProgress,
        totalItem,
    }" />
    <el-button @click="dialogVisible = true" type="primary">一键检查</el-button>
    <el-popconfirm
        class="box-item"
        title="是否确认退回？"
        placement="top"
        @confirm="taskGoBack"
      >
      <template #reference>
        <el-button type="danger">退回任务</el-button>
      </template>
    </el-popconfirm>
    <Teleport to="body">
        <div class="progress-container" v-if="isLoading">
            <el-alert type="success" center>数据加载中...</el-alert>
            <hr>
            <el-progress :percentage="progressPercent" :stroke-width="15" />
        </div>
    </Teleport>

</template>

<style scoped>
.progress-container {
    text-align: center;
    font-size: 16px;
    position: fixed;
    top: 40%;
    left: 25%;
    color: black;
    width: 50%;
}
</style>