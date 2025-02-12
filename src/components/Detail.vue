<template>
  <div class="image-container">
    <el-button
      v-if="images.length > 1"
      type="info"
      class="nav-button prev-button"
      @click="prevImage"
      :icon="ArrowLeft"
    />

    <el-image
      v-if="firstImage"
      :src="firstImage"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
      :preview-src-list="images"
      show-progress
      :initial-index="0"
      fit="cover"
    />

    <el-button
      v-if="images.length > 1"
      type="info"
      class="nav-button next-button"
      @click="nextImage"
      :icon="ArrowRight"
    />
  </div>
</template>

<script setup>
import { onMounted, h, ref } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { queryProject, queryProjectBuilding, queryBuildingWater, queryImage } from '../api/query';
import { ElNotification, ElTable, ElTableColumn, ElButton, ElIcon } from 'element-plus';

const firstImage = ref(null);
const images = ref([]);
const currentIndex = ref(0);

// 添加翻页方法
const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % images.value.length;
  firstImage.value = images.value[currentIndex.value];
};

const prevImage = () => {
  currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length;
  firstImage.value = images.value[currentIndex.value];
};

onMounted(async () => {
  $(".long-td").each(async function () {
    // 检查维保内容是否核对储水量
    if (this.children[2].innerText.includes("核对储水量")) {
      // 查询项目ID
      const data = await queryProject(localStorage.getItem("projectName"));
      const projectId = data.list[0].id;
      // 查询建筑列表
      const buildings = await queryProjectBuilding(projectId);
      buildings.forEach(async (building) => {
        if (building.buildingWater) {
          const waterInfo = await queryBuildingWater(building.buildingId);
          const content = waterInfo.map(item => {
            // return h('p', null, `${item.position}(${item.container_type_str}): ${item.capacity}m³`)
            return {
              position: item.position,
              type: item.container_type_str,
              capacity: `${item.capacity}m³`
            }
          });

          ElNotification({
            title: localStorage.getItem("projectName"),
            message: h('div', null, [
              h(ElTable, { data: content }, [
                h(ElTableColumn, { prop: 'position', label: '位置' }),
                h(ElTableColumn, { prop: 'type', label: '类型' }),
                h(ElTableColumn, { prop: 'capacity', label: '容量' }),
                h("p", null, '如果项目错误请返回任务页面使用方向键查看详情。')
              ]),
              h("p", null, '如果项目错误请返回任务页面使用方向键查看详情。')
            ]),
            position: 'bottom-left',
            duration: 0
          })
        }
      })
    };
    // 检查是否存在图片
    if (this.children[10].children.length != 0) {
      const imageList = await queryImage(this.children[10].children[0].href)
      images.value = [...images.value, ...imageList];
      firstImage.value = images.value[0];
    }
  });
});

function resetImage() {
  images.value = [];
}
</script>

<style scoped>
.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.nav-button {
  position: absolute;
  z-index: 1;
}

.prev-button {
  left: 20px;
}

.next-button {
  right: 20px;
}

.el-image {
  max-width: 90%;
  margin: 0 auto;
}
</style>