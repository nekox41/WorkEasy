import axios from "axios";

/**
 * 通过页面中的数据读取，不经过网络IO。
 */
function GetTaskUrl() {
    return document.querySelector(".long-td").children[5].children[0].href;
}

export { GetTaskUrl }