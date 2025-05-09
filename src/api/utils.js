import { formattedDate, BASE_URL } from "./constants"
import axios from "axios";

/**
 * 根据项目名称获取所有关联建筑的储水设施信息
 * @param {string} name - 项目名称
 * @returns {Promise<Array<{name: string, data: Array<any>}>>} 返回包含建筑名称及储水设施数据的数组
 */
async function getWaterInfo(name) {
    // 1. 获取项目ID
    const projectRes = await axios.get(BASE_URL + `/admin/contract/index.html?page=1&key=${name}&key3=0&key6=1`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    const projectId = projectRes.data.list[0].id;

    // 2. 获取建筑列表
    const buildingRes = await axios.get(BASE_URL + `/admin/contract/building.html?id=${projectId}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });

    // 3. 检查储水设施
    const parser = new DOMParser();
    const doc = parser.parseFromString(buildingRes.data, 'text/html');
    const lines = doc.querySelectorAll('.long-td');

    // 使用 Promise.all 等待所有请求完成
    const results = await Promise.all(
        Array.from(lines).map(async (line) => {
            const aTag = line.children[8]?.querySelector('a');
            if (aTag) {
                const buildingName = line.children[1]?.textContent.trim();
                const buildingId = line.children[0]?.textContent.trim();

                try {
                    const waterInfo = await axios.get(
                        BASE_URL + `/admin/contract/getwaterfacility.html?id=${buildingId}`,
                        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
                    );

                    return {
                        name: buildingName,
                        data: waterInfo.data?.data?.list || []
                    };
                } catch (err) {
                    console.error(`获取 ${buildingId} 的储水信息失败`, err);
                    return null;
                }
            }
            return null;
        })
    );

    // 过滤掉 null 值（即无效或无储水设施的建筑）
    return results.filter(item => item !== null);
}

export {
    getWaterInfo
}