<template>
  <component :is="modules[currentModule]" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TaskInfo from './components/TaskInfo.vue';
import Detail from './components/Detail.vue';
import Index from './components/Index.vue';
import Plan from './components/Plan.vue';

const currentModule = ref('None');
const modules = {
  TaskInfo,
  Detail,
  Index,
  Plan
};

onMounted(() => {

  const url = window.location.href;

  if (url.includes('taskInfo')) {
    currentModule.value = 'TaskInfo';
  } else if (url.includes('showtestdetail')) {
    currentModule.value = 'Detail';
  } else if (url.includes('index/index.html')) {
    currentModule.value = 'Index';
  } else if (url.includes('contractplan')) {
    currentModule.value = "Plan"
  }
});

</script>

<style>
#app {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>