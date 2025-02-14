<template>
  <el-dialog title="即将到期的合同" v-model="contractVisible" width="800">
    <el-table :data="currentPageData" style="width: 100%">
      <el-table-column prop="name" label="项目名称" width="500">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.name)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="end_time" label="到期时间" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.end_time)">
            {{ scope.row.end_time }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="project_leader_name" label="项目负责人" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="copyText(scope.row.project_leader_name)">
            {{ scope.row.project_leader_name }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="dialog-footer">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :small="false" :background="true" layout="total, sizes, prev, pager, next, jumper" :total="contracts.length"
        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      <el-button type="primary" @click="exportToTxt">导出到TXT</el-button>
    </div>
  </el-dialog>

  <el-dialog title="计划列表" v-model="planVisible" width="900">
    <!-- 添加筛选栏 -->
    <div class="filter-row">
      <el-input v-model="filter.projectName" placeholder="项目名称" clearable style="width: 40%;"/>
      <el-select v-model="filter.commitTimeOrder" placeholder="提交时间排序">
        <el-option label="升序" value="asc" />
        <el-option label="降序" value="desc" />
      </el-select>
      <el-select v-model="filter.isAudit" clearable placeholder="审核">
        <el-option label="待审核" value="待审核" />
        <el-option label="审核通过" value="审核通过" />
        <el-option label="未下发" value="未下发" />
      </el-select>
      <el-select v-model="filter.isReport" clearable placeholder="报告">
        <el-option label="未生成" value="未生成" />
        <el-option label="已生成" value="已生成" />
        <el-option label="未下发" value="未下发" />
      </el-select>
    </div>

    <el-table :data="planCurrentPageData" style="width: 100%;">
      <el-table-column prop="projectName" label="项目名称" width="300"></el-table-column>
      <el-table-column prop="commit_time" label="提交时间" width="200">
        <template #default="scope">
          <el-tag :type="scope.row.commit_time === '未提交' ? 'warning' : ''">
            {{ scope.row.commit_time }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isAudit" label="审核" width="200">
        <template #default="scope">
          <el-tag :type="scope.row.isAudit === '审核通过' ? 'success' : 'warning'">
            {{ scope.row.isAudit }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isReport" label="报告" width="200">
        <template #default="scope">
          <el-tag :type="scope.row.isReport === '已生成' ? 'success' : 'warning'">
            {{ scope.row.isReport }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="dialog-footer">
      <el-pagination v-model:current-page="planCurrentPage" v-model:page-size="planPageSize" :page-sizes="[10, 20, 50, 100]"
        :small="false" :background="true" layout="total, sizes, prev, pager, next, jumper" :total="filteredPlans.length"
        @size-change="handlePlanSizeChange" @current-change="handlePlanCurrentChange" />
      <el-button type="primary" @click="exportToExcel">导出到Excel</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ElTable, ElTableColumn, ElButton, ElMessage, ElTag, ElNotification, ElLoading, ElPagination, ElInput, ElSelect, ElOption } from 'element-plus';
import { onMounted, ref, computed, h } from 'vue';
import { queryExpiredContract, getAllPlanInfo } from '../api/query';
import XLSX from 'xlsx';

const contractVisible = ref(false);
const contracts = ref([]);
const planVisible = ref(false);
const plans = ref([]);

// 添加筛选条件
const filter = ref({
  projectName: '',
  commitTimeOrder: 'asc',
  isAudit: '',
  isReport: ''
});

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
  ElNotification({
    title: '查看助手',
    message: h('div', null, [
      h(ElButton, {
        type: 'primary',
        onClick: () => checkExpiredContract(),
      }, '查看合同'),
      h(ElButton, {
        type: 'primary',
        onClick: () => checkTaskInfo()
      }, '查看计划')
    ]),
    duration: 0,
  })
})

async function checkExpiredContract() {
  // 创建loading实例
  const loading = ElLoading.service({
    lock: true,
    text: '正在加载合同数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  });

  try {
    // 获取下个月最后一天
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    // 格式化为 YYYY-MM-DD
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const allContracts = await queryExpiredContract(formattedDate);
    // 对合同按到期时间排序
    contracts.value = allContracts.sort((a, b) => {
      const dateA = new Date(a.end_time);
      const dateB = new Date(b.end_time);
      return dateA - dateB;
    });
    contractVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 2000
    });
  } finally {
    // 关闭loading
    loading.close();
  }
}

async function checkTaskInfo() {
  // 创建loading实例
  const loading = ElLoading.service({
    lock: true,
    text: '正在加载计划数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  });

  try {
    const allPlanInfo = await getAllPlanInfo();
    plans.value = allPlanInfo;
    planVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 2000
    });
  } finally {
    // 关闭loading
    loading.close();
  }
}

const currentPage = ref(1);
const pageSize = ref(10);

// 计算当前页的数据
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return contracts.value.slice(start, end);
});

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

// 导出到TXT
const exportToTxt = () => {
  const content = contracts.value.map(contract =>
    `项目名称: ${contract.name}\n到期时间: ${contract.end_time}\n项目负责人: ${contract.project_leader_name}\n-------------------`
  ).join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '即将到期的合同.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  ElMessage({
    message: '导出成功',
    type: 'success',
    duration: 2000
  });
};

// 分页相关的数据属性
const planCurrentPage = ref(1);
const planPageSize = ref(10);

// 计算当前页的计划数据，并根据筛选条件过滤
const filteredPlans = computed(() => {
  let filtered = plans.value;

  // 如果筛选条件不为空，则进行过滤
  if (filter.value.projectName) {
    filtered = filtered.filter(plan => plan.projectName.includes(filter.value.projectName));
  }
  if (filter.value.isAudit) {
    filtered = filtered.filter(plan => plan.isAudit === filter.value.isAudit);
  }
  if (filter.value.isReport) {
    filtered = filtered.filter(plan => plan.isReport === filter.value.isReport);
  }
  if (filter.value.commitTimeOrder) {
    if (filter.value.commitTimeOrder === 'asc') {
      filtered.sort((a, b) => {
        if (a.commit_time === '未下发') return 1;
        if (b.commit_time === '未下发') return -1;
        return new Date(a.commit_time) - new Date(b.commit_time);
      });
    } else {
      filtered.sort((a, b) => {
        if (a.commit_time === '未下发') return 1;
        if (b.commit_time === '未下发') return -1;
        return new Date(b.commit_time) - new Date(a.commit_time);
      });
    }
  }
  return filtered;
});

const planCurrentPageData = computed(() => {
  const start = (planCurrentPage.value - 1) * planPageSize.value;
  const end = start + planPageSize.value;
  return filteredPlans.value.slice(start, end);
});

// 处理计划页码变化
const handlePlanCurrentChange = (val) => {
  planCurrentPage.value = val;
};

// 处理计划每页显示数量变化
const handlePlanSizeChange = (val) => {
  planPageSize.value = val;
  planCurrentPage.value = 1;
};

// 导出到Excel
const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(filteredPlans.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, '计划列表.xlsx');

  ElMessage({
    message: '导出成功',
    type: 'success',
    duration: 2000
  });
};
</script>

<style scoped>
.el-table {
  width: 100%;
}

.dialog-footer {
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-row {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.el-select {
  width: 200px;
}
</style>