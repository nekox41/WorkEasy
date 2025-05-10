<template>
    <el-dialog v-model="dialogVisible" title="小蜜蜂助手" width="500" :before-close="handleClose">
        <span>小蜜蜂助手已加载。</span>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogVisible = false">
                    关闭
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref } from 'vue'
    const dialogVisible = ref(true);
</script>

<style scoped></style>