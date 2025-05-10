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

/**
 * 
 * @param {number} page 页码
 * @param {string} startDate 开始时间，默认本月1号
 * @param {string} projectName 项目名字，默认为空
 * @param {string} taskType 任务类型，默认为空
 * @param {string} taskStatus 任务状态，默认为空
 * @param {string} headerName 操作员，默认为空
 * @returns {{Nowpage: number, allpage: number, list: Array<Object>, page_str: string, total: number}}
 */
async function getTaskList({ 
    page = 1, 
    startDate = `${formattedDate}-01`,
    projectName = '',
    taskType = '0',
    taskStatus = '0',
    headerName = '' 
} = {}) {
    // 请求列表数据
    const res = await axios.get(BASE_URL + `/admin/task/index.html?page=${page}&key=${startDate}&key3[]=${taskStatus}&key4=${projectName}&key5=${taskType}&key6=0&header_name=${headerName}`
        , {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

/**
 * 根据合同ID获取关联项目信息
 * 
 * 该函数通过合同ID向管理后台接口发起请求，获取对应的项目数据。适用于需要根据合同ID关联项目信息的场景。
 * 
 * @param {string} contract_id - 需要查询的合同唯一标识符。应为有效的合同ID字符串
 * @returns {{list: Array, all_page: number, page_str: string}} 返回对象：
 *   - 成功时解析接口返回的项目数据对象
 *   - 失败或异常时返回null（当前实现未显式处理异常情况）
 */
async function getProjectByContractID(contract_id) {
    const res = await axios.get(BASE_URL + `/admin/contract/index.html?page=1&get_contract_id=${contract_id}`,
        {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }
    )
    if (res.status === 200) {
        return res.data;
    }
}

export {
    getWaterInfo,
    getTaskList,
    getProjectByContractID
}