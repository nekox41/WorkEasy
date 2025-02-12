import { GM_xmlhttpRequest } from '$';

const localVersion = 1.1;

export async function checkUpdate() {
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://gitee.com/nekox41/work-helper/raw/master/version.json',
      onload: (res) => {
        const remoteVersion = JSON.parse(res.responseText).version;
        if (remoteVersion > localVersion) {
          window.open(JSON.parse(res.responseText).updateUrl);
        }
      }
  
    })
  }