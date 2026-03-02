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

function changeDefaultSelect() {
    console.log("开始搜索上月执行人员...")
    const allLine = document.querySelectorAll('.long-td');
    let firstMatch = null;
    for (let i = 0; i < allLine.length; i++) {
        if (allLine[i].children[1].textContent != "") {
            firstMatch = allLine[i].children[1].textContent;
            break;
        }
    }
    console.log("找到上月执行人员：" + firstMatch );
    localStorage.setItem('defaultSelect', firstMatch);
    return;
}
changeDefaultSelect();
</script>