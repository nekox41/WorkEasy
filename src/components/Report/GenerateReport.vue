<script setup>
// 当脚本被插入后，会在生成报告的页面加载

// ver1：basic
// 使用最简单的方式优先实现功能；仅实现日期的选择与备注的说明；添加白名单以实现不同的备注

import axios from 'axios';
import { GetTaskUrl } from '../../api/Report/report';

const comment = {
    fault: "建议贵单位及时采取整改措施，保证消防设施正常运行。",
    normal: "建议贵单位加强日常消防巡检，保证消防设施正常运行。"
}

function SelectDate(){
    // 获取任务详情页
    const url = GetTaskUrl();
    axios.get(url).then(res => {
        
    })
    
}

function AddComment(){}

</script>