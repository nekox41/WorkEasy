import axios from 'axios';

// 查询项目
export async function queryProject(projectName) {
  try {
    const response = await axios.get(`https://www.xmf119.cn/admin/contract/index.html?page=1&key=${projectName}`);
    return response.data;
  } catch (error) {
    throw new Error('获取项目数据失败');
  }
}

// 查询项目建筑物
export async function queryProjectBuilding(projectId){
  const result = [];
  try {
    const response = await axios.get(`https://www.xmf119.cn/admin/contract/building.html?id=${projectId}`);
    $(response.data).find(".long-td").each( function() {
      result.push({
        buildingId: this.children[0].innerText,
        buildingName: this.children[1].innerText,
        buildingArea: this.children[2].innerText,
        groundArea: this.children[3].innerText,
        undergroundArea: this.children[4].innerText,
        groundNumber: this.children[5].innerText,
        undergroundNumber: this.children[6].innerText,
        buildingHeight: this.children[7].innerText,
        buildingWater: this.children[8].innerText.trim() === "详情" ? true : false,
        comment: this.children[9].innerText,
      })
    })
    return result;
  } catch (error) {
    throw new Error('获取建筑物数据失败');
  }
}

export async function queryBuildingWater(buildingId){
  try {
    const response = await axios.get(`https://www.xmf119.cn/admin/contract/getwaterfacility.html?id=${buildingId}`);
    if(response.data.data.is_water_facility === -1){
      return [];
    }
    return response.data.data.list;
  } catch (error) {
    throw new Error('获取建筑物水数据失败');
  }
}

// 查询图片
export async function queryImage(url) {
  const result = [];
  try {
    const response = await axios.get(url);
    $(response.data).find("img").each( function() {
      result.push(this.src);
    });
  } catch (error) {
    throw new Error('获取图片失败');
  }
  return result;
}