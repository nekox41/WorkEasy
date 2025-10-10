<!-- 对于计划列表样式的修改 -->
<script setup>
const planList = document.querySelectorAll('.long-td');
planList.forEach(item => {
    const text = item.children[0].textContent;
    if (text.includes("月维护")) {
        item.style.backgroundColor = 'rgba(0, 153, 0, 0.75)'; // 75%不透明的绿色
        item.style.color = 'white';
    } else if (text.includes("季维护")) {
        item.style.backgroundColor = 'rgba(204, 120, 0, 0.75)'; // 75%不透明的橙色
        item.style.color = 'white';
    } else if (text.includes("年维护")) {
        item.style.backgroundColor = 'rgba(204, 0, 0, 0.75)'; // 75%不透明的红色
        item.style.color = 'white';
    }
})
</script>