import axios from 'axios';

export function getBaseUrl() {
  const url = window.location.href;
  return new URL(url).origin;
}

export const baseUrl = getBaseUrl();

// 查询项目
export async function queryProject(projectName) {
  try {
    const response = await axios.get(`${baseUrl}/admin/contract/index.html?page=1&key=${projectName}`);
    return response.data;
  } catch (error) {
    throw new Error('获取项目数据失败');
  }
}

// 查询所有项目
export async function queryAllProject() {
  const allProject = [];
  try {
    const firstResponse = await axios.get(`${baseUrl}/admin/contract/index.html`, {
      params: {
        page: 1,
        key3: 0,
        key6: 1,
      }
    });

    const pageNumbers = firstResponse.data.all_page;
    allProject.push(...firstResponse.data.list);
    for (let page = 2; page <= pageNumbers; page++) {
      const response = await axios.get(`${baseUrl}/admin/contract/index.html`, {
        params: {
          page,
          key3: 0,
          key6: 1,
        }
      });
      allProject.push(...response.data.list);
    }
    return allProject;
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
  const url = `${getBaseUrl()}/admin/contract/index.html`;
  let allContracts = [];

  try {
    // 获取第一页数据以确定总页数
    const firstPageResponse = await axios.get(url, {
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
      const response = await axios.get(url, {
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

// 查询服务报告
export async function queryPreServiceReport(projectName) {
  // 以格式化字符串（yyyy-mm-dd)获取上个月的第一天和最后一天
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const firstDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  const formattedFirstDay = `${firstDay.getFullYear()}-${(firstDay.getMonth() + 1).toString().padStart(2, '0')}-${firstDay.getDate().toString().padStart(2, '0')}`;
  const formattedLastDay = `${lastDay.getFullYear()}-${(lastDay.getMonth() + 1).toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;

  try {
    const response = await axios.get(`${baseUrl}/admin/reportmiddleware/index.html`, {
      params: {
        page: 1,
        key: projectName,
        key2: formattedFirstDay,
        key3: formattedLastDay,
      }
    });
    return response.data.list;
  } catch (error) {
    throw new Error('获取服务报告数据失败');
  }
}