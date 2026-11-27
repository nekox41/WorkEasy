import axios from 'axios';

/**
 * 获取任务详情
 * @param {string} url - 任务详情页面的URL
 * @returns {Promise<Array>} 返回包含任务详情的数组，每个元素包含images的Promise
 * @description 从指定URL获取任务详情，解析HTML内容并提取相关信息
 */
function absoluteUrl(value, base) {
    try { return new URL(value, base).href; } catch { return value || ''; }
}
function isImageUrl(value) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(?:[?#]|$)/i.test(value || '');
}
async function getAttachments(url) {
    if (!url) return [];
    try {
        const res = await axios.get(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.data, 'text/html');
        const files = [], seen = new Set();
        doc.querySelectorAll('a[href]').forEach(anchor => {
            const href = absoluteUrl(anchor.getAttribute('href'), url);
            if (!href || href.startsWith('javascript:') || href === url || seen.has(href)) return;
            const image = anchor.querySelector('img');
            const name = (anchor.getAttribute('download') || anchor.getAttribute('title') || anchor.textContent || image?.alt || href.split('/').pop()?.split('?')[0] || '附件').trim();
            files.push({ url: href, name, isImage: isImageUrl(href) || Boolean(image) });
            seen.add(href);
        });
        doc.querySelectorAll('img[src]').forEach(img => {
            const src = absoluteUrl(img.getAttribute('src'), url);
            if (!src || seen.has(src)) return;
            files.push({ url: src, name: (img.alt || src.split('/').pop()?.split('?')[0] || '图片附件').trim(), isImage: true });
            seen.add(src);
        });
        if (!files.length && !/^text\/html/i.test(res.headers?.['content-type'] || '')) {
            return [{ url, name: url.split('/').pop()?.split('?')[0] || '附件', isImage: isImageUrl(url) }];
        }
        return files;
    } catch (err) {
        console.error(`获取附件失败 (${url}):`, err);
        return [{ url, name: url.split('/').pop()?.split('?')[0] || '附件', isImage: isImageUrl(url) }];
    }
}
async function getTaskDetails(url) {
    try {
        const res = await axios.get(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.data, 'text/html');
        return await Promise.all(Array.from(doc.querySelectorAll('.long-td')).map(async line => {
            const attachmentLink = line.children[10]?.querySelector('a')?.href || '';
            const attachments = await getAttachments(attachmentLink);
            return {
                system: line.children[1]?.textContent?.trim() || '',
                item: line.children[2]?.textContent?.trim() || '',
                content: line.children[4]?.innerHTML || '',
                type: line.children[5]?.textContent?.trim() || '',
                start: line.children[6]?.textContent?.trim() || '',
                end: line.children[7]?.textContent?.trim() || '',
                time: line.children[8]?.textContent?.trim() || '',
                images: attachments.filter(file => file.isImage).map(file => file.url),
                attachments,
                remark: line.children[9]?.innerHTML || ''
            };
        }));
    } catch (err) {
        console.error('获取任务详情失败:', err);
        return [];
    }
}
async function getImages(url) {
    return (await getAttachments(url)).filter(file => file.isImage).map(file => file.url);
}

/**
 * 解析任务列表页面HTML，返回任务及基本信息
 * @param {string} html - 任务列表页面的HTML字符串
 * @returns {{
 *   taskName: string,
 *   taskType: string,
 *   projectName: string,
 *   taskLeader: string,
 *   taskParticipant: string,
 *   taskDate: string,
 *   taskAppointDate: string,
 *   taskAcceptDate: string,
 *   taskExecuteDate: string,
 *   taskSubmitDate: string,
 *   itemList: Array<{
 *     itemId: string,
 *     system: string,
 *     checkContent: string,
 *     itemDetailUrl: string,
 *     itemResult: string
 *   }>,
 *   attachmentList: {
 *     selfie: string,
 *     controllerType: string,
 *     checkImg: string
 *   }
 * }}
 */
function ParseTaskPage(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
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

/**
 * 解析任务详情HTML，返回任务详情数组
 * @param {string} html - 任务详情页面的HTML字符串
 * @returns {Array<{
 *   subitemId: string,
 *   system: string,
 *   checkContent: string,
 *   testContent: string,
 *   testHtml: string,
 *   wholeTest: string,
 *   wholeTestHtml: string,
 *   testResult: string,
 *   startTime: string,
 *   endTime: string,
 *   testTime: string,
 *   remark: string,
 *   attachment: string
 * }>}
 */
function ParseTaskDetail(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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
            attachment: line.children[10].children[0] ? line.children[10].children[0].href : ''
        })
    })

    return result;
}

export {
    getTaskDetails,
    getImages,
    getAttachments,
    ParseTaskPage,
    ParseTaskDetail
};