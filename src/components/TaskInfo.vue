<template>
</template>

<script setup>
import { onMounted, ref, h } from 'vue';
import { ElNotification, ElMessage, ElButton } from 'element-plus';
import { queryProject } from '../api/query';

const currentRow = ref(-1);


onMounted(async () => {

  // 获取项目负责人
  const projectName = $('#taskAudit > div:nth-child(6) > div > input').val();
  try {
    const data = await queryProject(projectName);
  
    if (data.list && data.list.length > 0) {
      const project = data.list[0];
      const projectName = project.name;
      const projectLeader = project.project_leader_name;

      // 显示项目名字和项目负责人
      ElNotification({
        title: '项目信息',
        message: h('p', null, [
        h('span', null, `项目名字:`),
          h(ElButton, {
            text: true,
            onClick: () => {
              navigator.clipboard.writeText(projectName);
              ElMessage({
                message: '项目名字已复制到剪贴板',
                type: 'success',
                duration: 2000
              });
            }
          }, projectName),
          h('br'),
          h('span', null, `负责人:`),
          h(ElButton, {
            text: true,
            onClick: () => {
              navigator.clipboard.writeText(projectLeader);
              ElMessage({
                message: '项目负责人已复制到剪贴板',
                type: 'success',
                duration: 2000
              });
            }
          }, projectLeader)
        ]),
        type: 'success',
        duration: 0 // 设置为 0 表示通知不会自动消失
      });
    } else {
      ElNotification({
        title: '错误',
        message: '未找到相关项目',
        type: 'error',
        duration: 0 // 设置为 0 表示通知不会自动消失
      });
    }
  } catch (error) {
    ElNotification({
      title: '错误',
      message: '获取项目数据失败',
      type: 'error',
      duration: 5 // 设置为 0 表示通知不会自动消失
    });
  }

  // 获取表格
  const lines = $('#taskAudit > div > table > tbody > tr');

  // 为表格添加样式
  lines.each(function () {
    if (this.children[4].innerText === "不符合") {
      $(this).css({ 'background-color': 'darkred', 'color': 'white' });
    } else if (this.children[4].innerText === "不能检查") {
      $(this).css({ 'background-color': 'Chocolate', 'color': 'white' });
    } else if (this.children[4].innerText === "不存在") {
      $(this).css({ 'background-color': 'darkgray', 'color': 'white' });
    } else if (this.children[4].innerText === "符合") {
      $(this).css({ 'background-color': 'darkgreen', 'color': 'white' });
    }
  })

  // 添加键盘事件监听器
  document.addEventListener('keydown', (event) => {

    if (event.key === 'ArrowDown') {
      // 如果不是第一行，取消上一行的选中状态
      if (currentRow.value > 0) {
        $(lines[currentRow.value - 1]).css("border", "none");
      }

      // 下一行
      currentRow.value++;

      // 确保不超出范围
      if (currentRow.value >= lines.length) {
        currentRow.value = 0; // 回到第一行
      }

      // 检查是否不存在
      while (lines[currentRow.value].children[4].innerText === "不存在") {
        currentRow.value++;
        if (currentRow.value >= lines.length) {
          currentRow.value = 0; // 回到第一行
        }
      }

      // 确保存在后高亮并点击
      const selectedRow = lines[currentRow.value];
      $(selectedRow).css("border", "3px solid yellow");
      $(selectedRow.children[3]).children("a")[0].click()

      // 缓存项目名称到本地，使得在新标签页中的脚本可以使用
      localStorage.setItem("projectName", $('#taskAudit > div:nth-child(6) > div > input').val());
    }
  });
})

</script>

<style scoped></style>