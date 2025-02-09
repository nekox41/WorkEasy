<template>
  <component :is="modules[currentModule]" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TaskInfo from './components/TaskInfo.vue';
import Detail from './components/Detail.vue';
import None from './components/None.vue';


const currentModule = ref('None');
const modules = {
  TaskInfo,
  Detail,
  None
};

onMounted(() => {
  const url = window.location.href;

  if (url.includes('taskInfo')) {
    currentModule.value = 'TaskInfo';
  } else if (url.includes('showtestdetail')) {
    currentModule.value = 'Detail';
  } else {
    currentModule.value = 'None';
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