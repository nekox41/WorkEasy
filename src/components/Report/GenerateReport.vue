<script setup>
// 当脚本被插入后，会在生成报告的页面加载

// ver1：basic
// 使用最简单的方式优先实现功能；仅实现日期的选择与备注的说明；添加白名单以实现不同的备注

import axios from 'axios';
import { GetTaskUrl } from '../../api/Report/report';
import { ParseTaskDetail, ParseTaskPage } from '../../api/Task/task';
import { onMounted } from 'vue';

async function GetDate(itemUrl) {
    // 获取任务详情页
    const detailRes = await axios.get(itemUrl);
    const itemDetails = ParseTaskDetail(detailRes.data);
    return itemDetails[0].startTime.split(" ")[0];
}

function GetComment(key) {
    const comment = {
        fault: "建议贵单位及时采取整改措施，保证消防设施正常运行。",
        normal: "建议贵单位加强日常消防巡检，保证消防设施正常运行。"
    }
    return comment[key];
}

async function SetInfo() {
    const url = GetTaskUrl();
    const res = await axios.get(url);
    const taskPage = ParseTaskPage(res.data);
    // 获取任务时间
    const taskDate = await GetDate(taskPage.itemList[0].itemDetailUrl);
    // 设置日期
    document.querySelector("#test_date").value = taskDate;
    // 检查任务是否存在不符合
    const hasFault = taskPage.itemList.some(item => item.itemResult === "不符合");
    const commentKey = hasFault ? "fault" : "normal";
    const commentText = GetComment(commentKey);
    document.querySelector("#explain").value = commentText;
}


</script>

<template>
    <button type="button" class="btn btn-primary" @click="SetInfo">Set Info</button>
</template>