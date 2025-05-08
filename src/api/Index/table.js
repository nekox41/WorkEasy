import { formattedDate, BASE_URL } from '../constants'
import axios from 'axios'

/**
 * 获取项目页面数据
 * @param {number} page - 页码
 * @returns {Object} 返回axios响应对象
 */
async function getProjectPage(page) {
    // 构建基础URL
    const url = `${BASE_URL}/admin/statreport/index.html`;

    // 构建查询参数
    // page: 页码
    // type=1: 项目类型
    // o: 公司名称
    // start/end: 开始和结束日期
    // ct=4: 内容类型
    // search_show_stime/search_show_etime: 搜索显示的开始和结束时间
    // search_show=1: 显示搜索
    const queryParams = `?page=${page}&type=1&o=河南众基消防技术有限公司&start=${formattedDate}&end=${formattedDate}&ct=4&search_show_stime=${formattedDate}&search_show_etime=${formattedDate}&search_show=1`;

    // 发送GET请求获取数据
    const res = await axios.get(url + queryParams);

    // 如果请求成功则返回响应数据
    if (res.status === 200) {
        return res.data;
    }
}

async function getUncreatedProject() {
    const res = await axios.get(BASE_URL + '/admin/contractplan/index.html?page=1&key=&key2=&plan_status=1&contract_status=1',
        {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

async function getUnissuedProject() {
    const res = await axios.get(BASE_URL + '/admin/contractplan/index.html?page=1&key=&key2=&plan_status=2&contract_status=1',
        {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

async function getUnfinishedProject() {
    const res = await axios.get(BASE_URL + '/admin/contractplan/index.html?page=1&key=&key2=&plan_status=3&contract_status=1',
        {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

async function getUncheckedProject(page) {
    const res = await axios.get(BASE_URL + `/admin/task/index.html?page=${page}&key=${formattedDate}-01&key3[]=5&key5[]=5&key6=3`,
        {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

async function getUngeneratedProject() {
    // 创建一个列表，返回所有待生成报告的项目
    const allProject = [];
    // 1. 获取审核通过的项目（第一页）
    const res = await axios.get(BASE_URL + `/admin/task/index.html?page=1&key=${formattedDate}-01&key3[]=6&key5[]=5&key6=3`, { headers: { 'X-Requested-With': 'XMLHttpRequest', } });
    if (res.total === 0) {
        return allProject;
    }
    let currentPage = 1;
    let totalPage = res.data.allpage;
    // 检查当前页面的所有项目，先使用isReported函数检查是否已经生成报告
    for (let i = 0; i < res.data.list.length; i++) {
        if (!isReported(res.data.list[i])) {
            // 如果未生成报告，则检查是否可以生成报告
            if (await isGeneratable(res.data.list[i].contract_uuid)) {
                allProject.push(res.data.list[i]);
            }
        }
    }
    // 2. 对于其他页面重复上面的处理过程
    while (currentPage < totalPage) {
        currentPage++;
        const res = await axios.get(BASE_URL + `/admin/task/index.html?page=${currentPage}&key=${formattedDate}-01&key3[]=6&key5[]=5&key6=3`, { headers: { 'X-Requested-With': 'XMLHttpRequest', } });
        totalPage = res.data.allpage;
        for (let i = 0; i < res.data.list.length; i++) {
            if (!isReported(res.data.list[i])) {
                if (await isGeneratable(res.data.list[i].contract_uuid)) {
                    allProject.push(res.data.list[i]);
                }
            }
        }
    }
    return allProject;
}

function isReported(object) {
    // 检查项目是否已经生成报告
    if (object.is_report === 1) {
        return true;
    }
    return false;
}

async function isGeneratable(uuid) {
    const res = await axios.get(BASE_URL + `/admin/report/index.html?page=1&contract_uuid=${uuid}&contract_type=4&plan_date=${formattedDate}`)
    if (res.status === 200) {
        if (res.data[0].is_finish === -1) {
            return true;
        }
        return false;
    }
}

async function getUnrecordedProject() {
    // 直接请求API获取未备案数量
    const res = await axios.get(BASE_URL + `/admin/reportdocument/recordlist.html?page=1&key1=-1&key2=0&start=${formattedDate}-01`,
        {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        }
    );
    if (res.status === 200) {
        return res.data;
    }
}

export {
    getProjectPage,
    getUncreatedProject,
    getUnissuedProject,
    getUnfinishedProject,
    getUncheckedProject,
    getUngeneratedProject,
    getUnrecordedProject
}