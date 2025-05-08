<template>
    <div class="modal fade in" id="WelcomeModal" tabindex="-1" role="dialog" aria-hiden="true" style="display: block;">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">众基小蜜蜂助手</h5>
                </div>
                <div class="modal-body">
                    <p><strong>众基小蜜蜂助手</strong>已成功加载，感谢您的使用！</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="hideModal">关闭</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

const hideModal = () => {
    const modal = document.getElementById('WelcomeModal')
    modal?.setAttribute('style', 'display: none;')
}

</script>

<style scoped>
.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.show {
    opacity: 1;
}
</style>