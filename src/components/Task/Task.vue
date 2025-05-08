<script setup>
import { onMounted, ref } from 'vue';
import Panel from './Panel.vue';
import { getTaskDetails, getImages } from "../../api/Task/task"
import { generateKey } from '../../api/utils';

// 用于Panel的数据
const dataList = ref([]);
const dataIndex = ref(0);
const isActivate = ref(false);
const isLoading = ref(false);
const pageData = ref([]);

// 进度条控制
const progressW = ref(0);
const totalItem = ref(0);
const currentProgress = ref(1);
// 生成项目key
const projectKey = generateKey(document.querySelector("#taskAudit > div:nth-child(6) > div > input").value);
/**
 * 恢复30天内的缓存数据
 * @param {string} key - 缓存的键（项目名加上月份）
 * @returns 
 */
function restoreFromCache(key) {
    const cachedItem = localStorage.getItem(key);
    console.log(cachedItem)
    if (!cachedItem) return false;

    try {
        const { dataList: data, timestamp } = JSON.parse(cachedItem);
        const now = Date.now();

        // 缓存过期（30天）
        if (now - timestamp > 24 * 60 * 60 * 1000 * 30) {
            console.log('缓存过期')
            localStorage.removeItem(key);
            return false;
        }
        // 验证缓存
        const rightLength = pageData.value.length + 3;
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
            progressW.value += 100 / pageData.value.length;
            totalItem.value = dataList.value.length;
        } catch (error) {
            console.error(error);
        }
    }
    saveToCache(projectKey);
    isLoading.value = false;
}

onMounted(async () => {
    await getBaseData()

    // 初始化pageData（从DOM提取分页链接）
    pageData.value = Array.from(document.querySelectorAll('.long-td')).map(line =>
        line.children[3].firstElementChild.href
    );

    document.addEventListener("keydown", async (event) => {
        // 如果面板未打开，直接返回
        if (!isActivate.value) return

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
    <Panel v-bind="{
        ...dataList[dataIndex],
        currentProgress,
        totalItem
    }" v-if="isActivate" @close="isActivate = false" />
    <button class="btn btn-w-m btn-primary" @click="isActivate = true" type="button">一键检查</button>

    <div class="progress-container" v-if="isLoading">
        <span class="alert alert-info">数据加载中...</span>
        <hr>
        <div class="progress progress-striped">
            <div :style="{ width: progressW + '%' }" class="progress-bar progress-bar-success"></div>
        </div>
    </div>

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