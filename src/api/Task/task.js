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

export {
    getTaskDetails,
    getImages,
};