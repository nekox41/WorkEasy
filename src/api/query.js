import axios from 'axios';

export function getBaseUrl() {
  const url = window.location.href;
  return new URL(url).origin;
}

const baseUrl = getBaseUrl();

// 查询项目
export async function queryProject(projectName) {
  try {
    const response = await axios.get(`${baseUrl}/admin/contract/index.html?page=1&key=${projectName}`);
    return response.data;
  } catch (error) {
    throw new Error('获取项目数据失败');
  }
}

// 查询项目建筑物
export async function queryProjectBuilding(projectId){
  const result = [];
  try {
    const response = await axios.get(`${baseUrl}/admin/contract/building.html?id=${projectId}`);
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
    const response = await axios.get(`${baseUrl}/admin/contract/getwaterfacility.html?id=${buildingId}`);
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

// 查询到期合同
export async function queryExpiredContract(formattedDate) {
  const baseUrl = `${getBaseUrl()}/admin/contract/index.html`;
  let allContracts = [];

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

    return allContracts;
  } catch (error) {
    throw new Error('获取到期合同数据失败');
  }
}