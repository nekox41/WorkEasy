// 合并请求逻辑，发送请求并打开报告路径
async function fetchAndOpenReport(name, start, end) {
    try {
        const firstResponse = await fetch(`https://henan.xmf119.cn/admin/reportmiddleware/index.html?page=1&key=${encodeURIComponent(name)}&key2=${start}&key3=${end}&key4=&key7=&key8=&key9=&key10=1&contract_type=0`, {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
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

        if (!firstResponse.ok) {
            throw new Error(`HTTP error! Status: ${firstResponse.status}`);
        }

        const data = await firstResponse.json();

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
                    const secondResponse = await fetch(`https://henan.xmf119.cn/admin/reportdocument/index.html?page=1&key=${encodeURIComponent(contract_uuid)}&key5=${encodeURIComponent(key5)}&key2=${encodeURIComponent(report_date_s)}&key3=${encodeURIComponent(report_date_e)}`, {
                        headers: {
                            "sec-fetch-dest": "document",
                            "sec-fetch-mode": "navigate",
                            "sec-fetch-site": "same-origin",
                            "x-requested-with": "XMLHttpRequest"
                        },
                        referrer: "https://henan.xmf119.cn/admin/reportmiddleware/index.html",
                        referrerPolicy: "strict-origin-when-cross-origin",
                        method: "GET",
                        mode: "cors",
                        credentials: "include"
                    });

                    if (!secondResponse.ok) {
                        throw new Error(`HTTP error! Status: ${secondResponse.status}`);
                    }

                    const responseData = await secondResponse.json();
                    let path = responseData.list[0].main_path;
                    path = path.replace("www", "static");
                    path = path.replace("oss/", "");
                    window.open(path);
                }
            }
        }
    } catch (error) {
        console.error('Error in fetching and opening report:', error);
    }
}

export { fetchAndOpenReport };