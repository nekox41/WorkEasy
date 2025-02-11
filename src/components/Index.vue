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
import { onMounted, ref, h } from 'vue';
import axios from 'axios';

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

function checkIframe() {
    const iframe = $('.J_iframe').filter(function () {
        return $(this).css('display') !== 'none';
    });
    
    // 检查 iframe 是否存在且有 src 属性
    const src = iframe.attr('src');
    if (!src) return;
    
    if (src.includes('contract')) {
        if (noti.value !== null) {
            return;
        }
        noti.value = ElNotification({
            title: '提示',
            message: '跳转到TaskInfo组件'
        });
    }
}

async function checkExpiredContract() {
    // 获取下个月最后一天
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    // 格式化为 YYYY-MM-DD
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const baseUrl = 'https://www.xmf119.cn/admin/contract/index.html';
    let allContracts = [];
    let currentPage = 1;

    try {
        // 获取第一页数据以确定总页数
        const firstPageResponse = await axios.get(baseUrl, {
            params: {
                page: 1,
                end: formattedDate,
                sign_end_end: formattedDate,
            }
        });

        const totalPages = firstPageResponse.data.all_page;
        allContracts = [...firstPageResponse.data.list];

        // 获取剩余页数的数据
        for (let page = 2; page <= totalPages; page++) {
            const response = await axios.get(baseUrl, {
                params: {
                    page,
                    end: formattedDate,
                    sign_end_end: formattedDate,
                }
            });
            allContracts = [...allContracts, ...response.data.list];
        }

        contracts.value = allContracts;
        drawerVisible.value = true;
    } catch (error) {
        console.error(error);
        ElMessage({
            message: '获取到期合同数据失败',
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