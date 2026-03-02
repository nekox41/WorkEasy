<template>

</template>

<script setup>
    const select = document.querySelector('#engineer_uuid');
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
    // 获取选项的文本内容并转换为小写，以便不区分大小写地查找 'a'
    const text = options[i].text.toLowerCase();

    if (text.includes(localStorage.getItem('defaultSelect'))) {
        // 选中该选项
        options[i].selected = true;
        // 如果需要在旧版IE中触发change事件，可能需要额外处理，现代浏览器通常自动更新UI
        break; // 找到第一个后立即停止循环
    }
}
</script>