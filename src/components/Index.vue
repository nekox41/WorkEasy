<template>
  <el-drawer
    v-model="drawerVisible"
    title="即将到期的合同"
    direction="rtl"
    size="700px"
  >
    <el-table :data="contracts" style="width: 100%">
      <el-table-column prop="name" label="项目名称" width="280">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.name)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="end_time" label="到期时间">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.end_time)">
            {{ scope.row.end_time }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="project_leader_name" label="项目负责人">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.project_leader_name)">
            {{ scope.row.project_leader_name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="contract_status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.contract_status === 1 ? 'success' : 'danger'">
            {{ scope.row.contract_status === 1 ? '进行中' : '已到期' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup>
import { ElDrawer, ElNotification, ElTable, ElTableColumn, ElButton, ElMessage, ElTag } from 'element-plus';
import { onMounted, ref } from 'vue';
import { queryExpiredContract } from '../api/query';


const noti = ref(null);
const currentIframe = ref(null);
const drawerVisible = ref(false);
const contracts = ref([]);

// Copy text function
const copyText = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage({
      message: '复制成功',
      type: 'success',
      duration: 2000
    });
  }).catch(() => {
    ElMessage({
      message: '复制失败',
      type: 'error',
      duration: 2000
    });
  });
};

onMounted(() => {
    // 设置一个定时器，每隔1秒检查一次当前显示的iframe
    // setInterval(checkIframe, 1000);
    checkExpiredContract();
})

async function checkExpiredContract() {
    // 获取下个月最后一天
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    // 格式化为 YYYY-MM-DD
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    try {
        const allContracts = await queryExpiredContract(formattedDate);
        contracts.value = allContracts;
        drawerVisible.value = true;
    } catch (error) {
        console.error(error);
        ElMessage({
            message: error.message,
            type: 'error',
            duration: 2000
        });
    }
}
</script>

<style scoped>
.el-table {
  width: 100%;
}
</style>