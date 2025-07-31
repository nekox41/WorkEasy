// ==UserScript==
// @name         批量打开报告
// @namespace    http://tampermonkey.net/
// @version      1
// @description  输入名字列表并进行逻辑操作
// @author       aa
// @match        http*://*.xmf119.cn/admin/reportmiddleware/index.html
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // 存储名字的数组
    let names = [];

    // 注册菜单命令：输入名字
    GM_registerMenuCommand('输入名字', function() {
        createInputPopup();
    });

    // 注册菜单命令：开始处理
    GM_registerMenuCommand('开始处理', function() {
        if (names.length > 0) {
            processNames(names);
        } else {
            alert('请先输入名字列表');
        }
    });

    // 创建输入弹出窗口
    function createInputPopup() {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = '#fff';
        popup.style.padding = '20px';
        popup.style.border = '1px solid #ccc';
        popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        popup.style.zIndex = '10000';

        const textarea = document.createElement('textarea');
        textarea.rows = '10';
        textarea.cols = '30';
        textarea.placeholder = '请输入名字列表（每行一个名字）';
        popup.appendChild(textarea);

        const button = document.createElement('button');
        button.innerText = '确定';
        button.onclick = function() {
            const inputValue = textarea.value;
            console.log('Input Value:', inputValue); // 调试信息
            names = inputValue.split('\n').map(name => name.trim()).filter(name => name);
            console.log('Processed Names:', names); // 调试信息
            alert('名字已成功导入！');
            document.body.removeChild(popup);
        };
        popup.appendChild(button);

        document.body.appendChild(popup);
    }

    // 定义逻辑操作函数
    async function processNames(names) {
        for (const name of names) {
            await fetchFirstRequest(name);
        }
    }

    // 获取当前月份的开始日期和结束日期
    function getMonthStartEndDates() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    }

    // 发送第一个请求
    async function fetchFirstRequest(name) {
        const { start, end } = getMonthStartEndDates();
        try {
            const response = await fetch(`https://henan.xmf119.cn/admin/reportmiddleware/index.html?page=1&key=${encodeURIComponent(name)}&key2=2025-07-01&key3=2025-07-30&key4=&key7=&key8=&key9=&key10=1&contract_type=0`, {
                headers: {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
                    "sec-ch-ua": "\"Chromium\";v=\"136\", \"Microsoft Edge\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                referrer: "https://henan.xmf119.cn/admin/reportmiddleware/index.html",
                referrerPolicy: "strict-origin-when-cross-origin",
                method: "GET",
                mode: "cors",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.list && data.list.length > 0) {
                for (const item of data.list) {
                    const contract_uuid = item.contract_uuid;
                    const report_attr = item.report_attr;
                    const report_date_s = item.report_date_s;
                    const report_date_e = item.report_date_e;

                    let key5;
                    switch (report_attr) {
                        case 1:
                            key5 = 'month';
                            break;
                        case 2:
                            key5 = 'season';
                            break;
                        case 3:
                            key5 = 'year';
                            break;
                        case 4:
                            key5 = 'half';
                            break;
                        default:
                            key5 = '';
                    }

                    if (key5) {
                        await fetchSecondRequest(contract_uuid, key5, report_date_s, report_date_e);
                    }
                }
            }
        } catch (error) {
            console.error('Error in fetchFirstRequest:', error);
        }
    }

    // 发送第二个请求
    async function fetchSecondRequest(contract_uuid, key5, report_date_s, report_date_e) {
        try {
            const response = await fetch(`https://henan.xmf119.cn/admin/reportdocument/index.html?page=1&key=${encodeURIComponent(contract_uuid)}&key5=${encodeURIComponent(key5)}&key2=${encodeURIComponent(report_date_s)}&key3=${encodeURIComponent(report_date_e)}`, {
                headers: {
                    "sec-ch-ua": "\"Chromium\";v=\"136\", \"Microsoft Edge\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "x-requested-with": "XMLHttpRequest"
                },
                referrer: "https://henan.xmf119.cn/admin/reportmiddleware/index.html",
                referrerPolicy: "strict-origin-when-cross-origin",
                method: "GET",
                mode: "cors",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            let path = responseData.list[0].main_path;
            path = path.replace("www", "static");
            path = path.replace("oss/", "");
            window.open(path);
            console.log('Second Request Response:', responseData); // 调试信息
        } catch (error) {
            console.error('Error in fetchSecondRequest:', error);
        }
    }

})();