import axios from 'axios';

/**
 * 获取任务详情
 * @param {string} url - 任务详情页面的URL
 * @returns {Promise<Array>} 返回包含任务详情的数组，每个元素包含images的Promise
 * @description 从指定URL获取任务详情，解析HTML内容并提取相关信息
 */
async function getTaskDetails(url) {
    try {
        const res = await axios.get(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.data, 'text/html');
        
        // 使用Promise.all等待所有图片数据获取完成
        const taskDetails = await Promise.all(
            Array.from(doc.querySelectorAll(".long-td")).map(async (line) => {
                let imageRes = [];
                if (line.children[10].firstElementChild === null) {
                    imageRes = [];
                } else {
                    imageRes = await getImages(line.children[10].firstElementChild.href);
                }
                return {
                    system: line.children[1].textContent,
                    item: line.children[2].textContent,
                    content: line.children[4].innerHTML,
                    type: line.children[5].textContent,
                    start: line.children[6].textContent,
                    end: line.children[7].textContent,
                    time: line.children[8].textContent,
                    images: imageRes,
                    remark: line.children[9].innerHTML
                };
            })
        );
        
        return taskDetails;
    } catch (err) {
        console.error('获取任务详情失败:', err);
        return [];
    }
}

/**
 * 获取图片列表
 * @param {string} url - 包含图片的页面URL
 * @returns {Promise<Array<string>>} 返回图片URL数组
 * @description 从指定URL获取页面内所有图片的源地址
 */
async function getImages(url) {
    try {
        const res = await axios.get(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.data, 'text/html');
        return Array.from(doc.querySelectorAll("img")).map(img => img.src);
    } catch (err) {
        console.error(`获取图片失败 (${url}):`, err);
        return [];
    }
}



function ParseTaskPage(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html);
    // 获取任务列表
    const itemList = []
    doc.querySelectorAll(".long-td").forEach(item => {
        itemList.push({
            itemId: item.children[0].textContent,
            system: item.children[1].textContent,
            checkContent: item.children[2].textContent,
            itemDetailUrl: item.children[3].children[0].href,
            itemResult: item.children[4].textContent
        })
    })

    // 获取任务基本信息
    const taskName = doc.querySelector("#taskAudit > div:nth-child(4) > div > input").value;
    const taskType = doc.querySelector("#taskAudit > div:nth-child(5) > div > input").value;
    const projectName = doc.querySelector("#taskAudit > div:nth-child(6) > div > input").value;
    const taskLeader = doc.querySelector("#taskAudit > div:nth-child(9) > div > input").value;
    const taskParticipant = doc.querySelector("#taskAudit > div:nth-child(10) > div > input").value;
    const taskDate = doc.querySelector("#taskAudit > div:nth-child(11) > div > input").value;
    const taskAppointDate = doc.querySelector("#taskAudit > div:nth-child(13) > div > input").value;
    const taskAcceptDate = doc.querySelector("#taskAudit > div:nth-child(14) > div > input").value;
    const taskExecuteDate = doc.querySelector("#taskAudit > div:nth-child(15) > div > input").value;
    const taskSubmitDate = doc.querySelector("#taskAudit > div:nth-child(16) > div > input").value;

    // 获取附件数据，签到照片、控制器照片、提交人自拍
    const attachment = {
        selfie: doc.querySelector("#taskAudit > div:nth-child(20) > a").href,
        controllerType: doc.querySelector("#taskAudit > div:nth-child(19) > a").href,
        checkImg: doc.querySelector("#taskAudit > div:nth-child(27) > div > a").href
    }

    return {
        taskName: taskName,
        taskType: taskType,
        projectName: projectName,
        taskLeader: taskLeader,
        taskParticipant: taskParticipant,
        taskDate: taskDate,
        taskAppointDate: taskAppointDate,
        taskAcceptDate: taskAcceptDate,
        taskExecuteDate: taskExecuteDate,
        taskSubmitDate: taskSubmitDate,
        itemList: itemList,
        attachmentList: attachment
    }
}

function ParseTaskDetail(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html);

    const lines = doc.querySelectorAll('.long-td');
    const result = []
    lines.forEach(line => {
        result.push({
            subitemId: line.children[0].textContent,
            system: line.children[1].textContent,
            checkContent: line.children[2].textContent,
            testContent: line.children[3].textContent,
            testHtml: line.children[3].innerHTML,
            wholeTest: line.children[4].textContent,
            wholeTestHtml: line.children[4].innerHTML,
            testResult: line.children[5].textContent,
            startTime: line.children[6].textContent,
            endTime: line.children[7].textContent,
            testTime: line.children[8].textContent,
            remark: line.children[9].textContent,
            attachment: line.children[10].children[0].href
        })
    })

    return result;
}

export {
    getTaskDetails,
    getImages,
};