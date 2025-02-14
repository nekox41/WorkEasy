<script setup>
import { ElNotification } from 'element-plus';
import { de } from 'element-plus/es/locales.mjs';
import { onMounted } from 'vue';


function determineNextPlan() {
  const next = $(".long-td").length + 1;

  if (next % 12 === 0) {
    return "年度计划";
  } else if (next % 3 === 0) {
    return "季度计划";
  } else {
    return "月度计划";
  }
}

onMounted(() => {

  if (window.location.href.includes('contractplan/planlist.html')) {
    $("button").first().on("click", function () {
      localStorage.setItem('planType', determineNextPlan());
    });
  }

  if (window.location.href.includes('contractplan/plancontent')) {
    const planType = localStorage.getItem('planType');
    ElNotification({
      title: '计划类型',
      message: `下一个计划类型为：${planType}`,
      type: 'success',
      duration: 0,
      position: 'top-left'
    })
  }
})

</script>