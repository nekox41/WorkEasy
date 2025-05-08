// 获取当前日期并格式化为YYYY-MM格式
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');

// 格式化日期字符串
const formattedDate = `${year}-${month}`;
// BASE URL
const BASE_URL = document.location.origin;


// 导出数据
export {
    formattedDate,
    BASE_URL
}