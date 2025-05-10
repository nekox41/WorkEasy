<script setup>
import { onMounted, computed, h } from 'vue'
import { getWaterInfo } from '../../api/utils'
import { ElNotification } from 'element-plus';

const props = defineProps({
    system: { type: String, required: true },
    item: { type: String, required: true },
    content: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    time: { type: String, required: true },
    images: { type: Array, required: false },
    totalItem: { type: Number, required: true },
    currentProgress: { type: Number, required: true },
    remark: { type: String, required: false },
    type: { type: String, required: true },
})
const dialogVisible = defineModel("dialogVisible")
const name = document.querySelector("#taskAudit > div:nth-child(6) > div > input").value;
const typeConfig = {
    "基本信息": { text: "基本信息", type: "primary" },
    "符合": { text: "符合", type: "success" },
    "不符合": { text: "不符合", type: "danger" },
    "不能检查": { text: "不能检查", type: "warning" },
    "不存在": { text: "不存在", type: "info" },
    undefined: { text: "未定义", type: "info" }
}
const tagType = computed(() => {
    console.log(props.type)
    return typeConfig[props.type].type
})
const tagText = computed(() => {
    return typeConfig[props.type].text
})
const currentPercent = computed(() => {
    const num = props.currentProgress / props.totalItem * 100;
    return num.toFixed(2);
})
async function showWaterInfo() {
    const infoArray = await getWaterInfo(name);
    console.log(infoArray);
    infoArray.forEach(item => {
        ElNotification({
            title: item.name,
            message: h('div', null, item.data.map(info => h('p', null, `${info.position}的${info.container_type_str}容量${info.capacity}m³`))),
            duration: 5000
        })
    })
}
</script>

<template>
    <el-dialog id="dialog" v-model="dialogVisible" title="Tips" width="90%" :before-close="handleClose"
        :close-on-press-escape="false" :append-to-body="true" top="10px">
        <!-- 头部内容 -->
        <template #header="{ close, titleId, titleClass }">
            <div class="header-left">
                <h4 :id="titleId" :class="titleClass">{{ props.system }}</h4>
                <span id="subtitle">{{ props.item }}</span>
            </div>
            <div class="header-right">
            </div>
        </template>

        <!-- 内容 -->
        <div class="dialog-content">
            <div class="test-content">
                <el-tag :type="tagType" effect="dark" style="font-size: 16px;">测试内容（{{ tagText }}）</el-tag>
                <span v-html="props.content"></span>
            </div>
            <el-divider />
            <div v-if="props.remark">
                <b>备注：</b>
                <span class="test-remark" v-html="props.remark"></span>
                <el-divider />
            </div>
            <div class="test-images">
                <!-- 展开显示图片 -->
                <el-image v-for="(image, index) in props.images" :key="index" :src="image" :zoom-rate="1.2"
                    :max-scale="7" :min-scale="0.2" :preview-src-list="props.images" :initial-index="index" fit="cover"
                    class="image-item" :show-progress="true" />
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-progress :percentage="currentPercent" color="#67c23a"
                    :stroke-width="15">
                    <span>{{ props.currentProgress }}页/{{ props.totalItem }}页</span>
                </el-progress>
                <div class="button-group">
                    <el-button type="primary" @click="showWaterInfo">查看储水信息</el-button>
                    <el-button type="danger" @click="dialogVisible = false">关闭</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<style scoped>

.dialog-content :deep(b) {
    font-size: 16px;
    color: black;
}

.header-left {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}

#subtitle {
    margin-left: 10px;
}

.image-item {
    width: 22.5%;
    margin: 3px;
}

.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.el-progress {
    flex-grow: 1;
    margin-right: 12px;
}

.button-group {
    display: flex;
    gap: 8px;
}

.test-content {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 12px;
}
</style>