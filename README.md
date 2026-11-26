# WorkEasy

WorkEasy 是面向 `henan.xmf119.cn` 管理后台的 Tampermonkey / Violentmonkey 辅助脚本，使用 Vue 3、Element Plus、Vite 与 `vite-plugin-monkey` 构建。

## 安装最新版

<https://github.com/nekox41/WorkEasy/releases/latest/download/workeasy.user.js>

点击上面的链接即可打开油猴安装页面。后续版本会通过同一个链接自动获取最新版脚本。

## 3.1.1

### 项目任务统计（已完成）

- 归属地筛选非空时，统计表及未完成明细标题优先显示输入的归属地关键词。

- 首页仅增加「项目任务统计」按钮，点击后在弹窗面板中查看统计内容。
- 地区、负责人下拉框及归属地 fire_agency 模糊搜索，组合实时筛选，无需选择汇总方式。
- 按用户验证的请求查询：key3[]=5&key3[]=6、key5[]=5、key6=0、key7=（空），完整分页。
- 只要符合查询条件的任务 contract_name 匹配项目名称，即标记完成。
- 项目按任务 `contract_name` 与合同名称匹配，不使用 `header_name`。
- IndexedDB 保留 3.0.6 当月缓存；打开面板仅读取本地数据，不自动请求服务器。
- 刷新任务进度仅请求当月任务，复用项目缓存；刷新全部数据同时更新项目与任务。分别显示更新时间。
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

- 用户脚本版本：`3.1.1`
- 目标站点：`*://*.xmf119.cn/*`
- 构建入口：`src/main.js`
- 最新安装链接：<https://github.com/nekox41/WorkEasy/releases/latest/download/workeasy.user.js>

请在具备权限的账号下使用；退回、审核通过、计划新建和计划下发均为实际写操作，执行前请确认目标项目。
