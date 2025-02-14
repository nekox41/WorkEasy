<template>
  <!-- 保持模板为空 -->
</template>

<script setup>
import { onMounted, ref, h } from 'vue';
import { ElNotification, ElMessage, ElButton, ElTag } from 'element-plus';
import { queryProject, queryPreServiceReport, baseUrl } from '../api/query';
import axios from 'axios';

// 状态管理
const currentRow = ref(-1);
const lastRow = ref(null);
const lines = ref([]);
const count = ref({
  total: 0, // 总数
  pass: 0, // 合格
  none: 0, // 不存在
  waring: 0, // 不能检查
  fail: 0 // 不合格
});

// 项目信息展示组件
const showProjectInfo = (project) => {
  ElNotification({
    title: '项目信息',
    message: h('p', null, [
      createInfoButton('项目名字', project.name),
      h('br'),
      createInfoButton('负责人', project.project_leader_name),
      h('br'),
      createReportButton(project.name)
    ]),
    type: 'success',
    duration: 0
  });
};

// 创建可复制的信息按钮
const createInfoButton = (label, text) => {
  return [
    h('span', null, `${label}:`),
    h(ElButton, {
      text: true,
      onClick: () => copyToClipboard(text, label)
    }, text)
  ];
};

// 创建报告按钮
const createReportButton = (projectName) => {
  return h(ElButton, {
    type: "info",
    onClick: async () => {
      try {
        const result = await queryPreServiceReport(projectName);
        if (!result) throw new Error('未找到上月报告');

        const url = `${baseUrl}/admin/reportdocument/index.html?page=1&key=${result[0].contract_uuid}&key2=${result[0].report_date_s}&key3=${result[0].report_date_e}`;
        const rep = await axios.get(url);
        window.open(rep.data.list[0].main_path);
      } catch (error) {
        showError(error.message);
      }
    }
  }, "点击打开上月报告");
};

// 复制到剪贴板
const copyToClipboard = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage({
      message: `${label}已复制到剪贴板`,
      type: 'success',
      duration: 2000
    });
  } catch {
    showError('复制失败');
  }
};

// 设置行样式
const setRowStyle = (row) => {
  const styles = {
    '不符合': 'darkred',
    '不能检查': 'Chocolate',
    '不存在': 'darkgray',
    '符合': 'darkgreen'
  };
  const status = row.children[4].innerText;
  if (styles[status]) {
    $(row).css({ 'background-color': styles[status], 'color': 'white' });
  }
};

// 为每一行添加点击事件
const setClickEvent = (index, row) => {
  $(row).find('a').on('click', (e) => {
    // 清除上一次选择
    if (lastRow.value) {
      lastRow.value.css("border", "none");
    }
    // 更新索引
    currentRow.value = index;
    // 高亮选中行
    lastRow.value = $(row);
    lastRow.value.css("border", "3px solid yellow");
    // 缓存数据
    localStorage.setItem("projectName", $('#taskAudit > div:nth-child(6) > div > input').val());
  })
}

// 处理行选择
const handleRowSelection = (direction) => {
  // 清除上一次选择
  if (lastRow.value) {
    lastRow.value.css("border", "none");
  }

  // 更新当前行索引
  if (direction === 'up') {
    currentRow.value = (currentRow.value - 1 + lines.value.length) % lines.value.length;
  } else {
    currentRow.value = (currentRow.value + 1) % lines.value.length;
  }

  // 跳过"不存在"的行
  while (lines.value[currentRow.value].children[4].innerText === "不存在") {
    currentRow.value = direction === 'up'
      ? (currentRow.value - 1 + lines.value.length) % lines.value.length
      : (currentRow.value + 1) % lines.value.length;
  }

  // 高亮并点击选中的行
  const selectedRow = lines.value[currentRow.value];
  lastRow.value = $(selectedRow);
  lastRow.value.css("border", "3px solid yellow");
  lastRow.value.get(0).scrollIntoView( {behavior: "smooth", block: "center"} );
  $(selectedRow.children[3]).children("a")[0].click();

  // 保存项目名称到本地存储
  localStorage.setItem("projectName", $('#taskAudit > div:nth-child(6) > div > input').val());
};

// 错误提示
const showError = (message) => {
  ElNotification({
    title: '错误',
    message,
    type: 'error',
    duration: 5000
  });
};

// 初始化
onMounted(async () => {
  try {
    const projectName = $('#taskAudit > div:nth-child(6) > div > input').val();
    const data = await queryProject(projectName);

    if (data.list?.length > 0) {
      showProjectInfo(data.list[0]);
    } else {
      throw new Error('未找到相关项目');
    }

    // 初始化表格
    lines.value = $('#taskAudit > div > table > tbody > tr');
    lines.value.each((_, row) => {
      setRowStyle(row);
      setClickEvent(_, row);
      if (row.children[4].innerText === "符合") {
        count.value.total += 1;
        count.value.pass += 1;
      } else if (row.children[4].innerText === "不存在") {
        count.value.total += 1;
        count.value.none += 1;
      } else if (row.children[4].innerText === "不能检查") {
        count.value.total += 1;
        count.value.uncheck += 1;
      } else if (row.children[4].innerText === "不符合") {
        count.value.total += 1;
        count.value.fail += 1;
      }
    });
    // 添加键盘事件监听
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleRowSelection('down');
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handleRowSelection('up');
      }
    });

  } catch (error) {
    showError(error.message);
  }
  ElMessage({
    message: h('p', null, [
    h(ElTag, { type: 'primary'}, `${count.value.total} 总项`),
    h(ElTag, { type: 'success'}, `${count.value.pass} 符合`),
    h(ElTag, { type: 'info'}, `${count.value.none} 不存在`),
    h(ElTag, { type: 'warning'}, `${count.value.waring} 不能检查`),
    h(ElTag, { type: 'danger'}, `${count.value.fail} 不符合`),
    ]),
    duration: 10000
  })
});
</script>

<style scoped>
.el-notification {
  width: auto;
}
</style>