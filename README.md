# WorkEasy

WorkEasy 是面向 `henan.xmf119.cn` 管理后台的 Tampermonkey / Violentmonkey 辅助脚本，使用 Vue 3、Element Plus、Vite 与 `vite-plugin-monkey` 构建。

## 安装最新版

<https://github.com/nekox41/WorkEasy/releases/latest/download/workeasy.user.js>

点击上面的链接即可打开油猴安装页面。后续版本会通过同一个链接自动获取最新版脚本。

## 3.0.5

### 项目任务统计

- 首页仅增加「项目任务统计」按钮，点击后在弹窗面板中查看统计内容。
- 汇总方式、地区、项目负责人均使用下拉框；地区与负责人筛选可组合生效。
- 修正当月任务列表查询条件：仅取测试类型 `key5[]=5`，审核状态不限制，使用后台任务列表有效查询参数 `key6=3`。
- 以任务 `task_status_int` 为主要状态字段：5（待审核）或 6（审核通过）视为项目已完成；4（执行中）不计完成。
- 项目按任务 `contract_name` 与合同名称匹配，不使用 `header_name`。
- IndexedDB 缓存升级并清理旧版错误结果；首页打开仅读取本地当月缓存，不自动请求服务器。
- 仅用户点击手动刷新时获取数据；分页请求最多并发 2 页，刷新失败保留现有数据。

### 其他功能

- 首页看板：统计待生成报告、待备案数量；展示待生成报告项目及提交时间。
- 任务审核：加载任务基本信息、检查项和图片；弹窗查看检查结果、备注及照片；左右方向键翻页；查看储水设施信息；一键退回或审核通过；加载时显示纵向进度。
- 报告生成：一键勾选任务，汇总检查结果，自动填写最晚检测结束日期及对应建议备注，支持项目专属备注。
- 计划列表：年度、季度、月度计划着色；标记未完成任务；显示图例；一键新建当月计划并可选执行人员下发。
- 计划创建：根据历史计划推算建议类型；检查当月重复计划；校验项目、计划 UUID 与设施列表；未选择执行人员时仅创建不下发。

## 开发与构建

```bash
npm install
npm run dev
npm run build
```

构建产物位于 `dist/`。GitHub Actions 会在相关源码更新时构建，并发布仅包含 `workeasy.user.js` 的 GitHub Release。

- 用户脚本版本：`3.0.5`
- 目标站点：`*://*.xmf119.cn/*`
- 构建入口：`src/main.js`
- 最新安装链接：<https://github.com/nekox41/WorkEasy/releases/latest/download/workeasy.user.js>

请在具备权限的账号下使用；退回、审核通过、计划新建和计划下发均为实际写操作，执行前请确认目标项目。
