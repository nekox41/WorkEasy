<script setup>
import { onMounted, computed } from 'vue'

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

const typeConfig = {
    "基本信息": { color: "#23c6c8", type: "badge-info" },
    "符合": { color: "#1c84c6", type: "badge-success" },
    "不符合": { color: "#ed5565", type: "badge-danger" },
    "无法检查": { color: "#f8ac59", type: "badge-warning" },
    "不存在": { color: "#5e5e5e", type: "" }
}

const panelBorderColor = computed(() => {
    return typeConfig[props.type].color
})

const panelTag = computed(() => {
    return typeConfig[props.type].type
})

onMounted(() => {
    console.log(props)
})
</script>

<template>
    <div class="panel" :style="{ borderTopColor: panelBorderColor }">
        <div class="panel-heading">
            <!-- 左侧标题 -->
            <div class="title-group">
                <span class="system-title">{{ props.system }}</span>
                <span class="item-title">{{ props.item }}</span>
            </div>

            <!-- 右侧内容：Badge + 按钮 -->
            <div class="right-group">
                <span :class="`badge ${panelTag}`">{{ props.type }}</span>
                <button type="button" class="btn btn-sm btn-info" @click="$emit('close')">关闭</button>
            </div>
        </div>
        <div class="panel-body">
            <b>测试内容：</b>
            <span class="content" v-html="props.content"></span>
            <div v-if="props.remark">
                <hr>
                <b>备注：</b>
                <span class="remark" v-html="props.remark"></span>
            </div>
            <hr>
            <div class="image-container">
                <el-image style="width: 300px; height: 400px;"
                    :src="props.images[0]"
                    :preview-src-list="props.images"
                    show-progress
                    fit="cover"
                    :initial-index="0"
                    preview-teleported="true"/>
                <span class="badge badge-primary image-counter"
                    v-if="props.images.length > 1">
                    {{ props.images.length }}
                </span>
            </div>
        </div>
        <div class="panel-footer">
            <div class="row show-grid">
                <span class="col-sm-3">{{ props.start }}</span>
                <span class="col-sm-3">{{ props.end }}</span>
                <span class="col-sm-3 col-sm-offset-3 ">{{ props.time }}</span>
            </div>
        </div>
        <hr>
        <div class="panel-progress">
            <span style="margin-right: 20px;height: 20px;">【{{ currentProgress }}/{{ totalItem }}】</span>
            <div class="progress progress-striped">
                <div :style="{ width: currentProgress / totalItem * 100 + '%' }"
                    class="progress-bar progress-bar-success"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.panel {
    border: 1px solid #e4e4e4;
    border-radius: 8px;
    border-top: 4px solid;
    position: fixed;
    width: 70%;
    height: 700px;
    top: 100px;
    left: 15%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.panel-heading {
    padding: 16px 20px;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: space-between; /* 左右对齐 */
}

.title-group {
    display: flex;
    align-items: center;
}

.system-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.item-title {
    margin-left: 10px;
    color: #666;
}

.right-group {
    display: flex;
    align-items: center;
    gap: 10px; /* badge 和按钮之间的间距 */
}

.panel-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
}

.image-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.image-counter {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 14px;
}

.content {
    margin-bottom: 15px;
    line-height: 1.5;
}

.time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    /* background-color: #fafafa; */
}

.time-range,
.duration {
    display: flex;
    align-items: center;
    color: #666;
}

.time-range i,
.duration i {
    margin-right: 5px;
}

.panel-progress {
    display: flex;
    justify-content: center;
}

.progress {
    width: 50%;
    height: 20px;
}

.badge {
    font-size: 14px;
    border-radius: 0px;
}
</style>