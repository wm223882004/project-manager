# 项目进度记录 - 2026-04-21

## 已完成功能

### 基础架构
1. **Electron + Vue3 项目结构**
   - 主进程: electron/main.js（SQLite 数据库 + IPC 通信）
   - 预加载: electron/preload.js
   - 前端: Vue3 + Three.js 地球可视化

### 侧边栏导航
2. **8个模块入口**（含项目概览 Dashboard）
   - 📊 项目概览（Dashboard）
   - 📁 项目管理
   - 📄 合同管理
   - 🧾 发票管理
   - 💳 付款凭证
   - ✅ 验收确认
   - 💰 管理费用
   - 👥 人员管理

### 项目概览（Dashboard）
3. **Dashboard 面板**
   - 统计卡片：项目总数、进行中、已完成、已暂停、已延期
   - 财务概览：项目总收入、总支出、利润空间
   - 任务统计：总任务数、待处理、进行中、已完成
   - 项目进度概览（前6个项目卡片）
   - 即将到期项目提醒（30天内）
   - 暗色主题适配

### 项目管理模块
4. **项目列表与详情**
   - 搜索框 + 项目卡片列表（含进度条、预算信息）
   - 项目详情面板（右侧 fixed 定位）
     - 合同子标签：按销售/采购分类显示关联合同
     - 发票子标签：按收款/付款分类显示关联发票
     - 预算子标签：显示项目预算列表
     - 管理费用子标签：显示管理费用列表
     - 任务子标签：显示项目任务列表（含状态标记）
     - 信息子标签：项目基本信息 + 预算概览进度条
   - 新增/修改/删除项目
   - 预算使用率进度条（绿/黄/橙/红预警）

### 合同管理模块
5. **合同列表与详情**
   - 合同搜索与列表
   - 合同详情面板：显示合同信息 + 关联发票列表
   - 从合同详情可新增关联发票
   - 从合同详情可编辑/删除合同

### 发票管理模块
6. **发票列表与详情**
   - 发票搜索与列表
   - 支持 invoice_type（收款/付款）分类
   - 发票详情面板：显示发票号码、类型、金额、已收金额、收款状态等
   - 从项目详情/合同详情均可新增/编辑发票

### 其他模块
7. **付款凭证** - 列表 + 详情面板
8. **验收确认** - 列表 + 详情面板
9. **管理费用** - 列表 + 详情面板，支持从项目详情新增
10. **人员管理** - 列表 + 详情面板

### 3D 地球组件
11. **Earth3D.vue** - Three.js 地球可视化，项目标记点

### 数据库
12. **SQLite (sql.js) 完整数据模型**
   - projects, contracts, invoices, payments, acceptances
   - people, cities, project_budgets, project_tasks
   - management_fees, clients, project_income, project_expense
   - 完整的 seed 数据（20个项目、26个合同、27个发票等）

### 关键 Bug 修复
13. **项目详情面板不显示** - 原因：`.sidebar-wrapper` 的 `transition: width 0.25s ease` 创建了新的 containing block，导致 `position: fixed` 的子面板定位错误。修复：移除 transition。
14. **人员详情卡片显示项目详情（代码修改不生效）** - 根因：Electron `main.js` 中通过判断 `dist/index.html` 存在与否来切换开发/生产模式。项目曾构建过一次，导致 `dist/` 目录残留，此后 Electron 始终加载 `dist/index.html`（生产模式），完全绕过 Vite 开发服务器，因此任何代码修改都不生效。修复：删除 `dist/` 目录，确保开发模式走 `loadURL('http://localhost:5173')`。

## 表单系统改进
14. **formModule 机制** - 引入 `formModule` ref 追踪当前表单对应的模块类型，解决从项目详情/合同详情中打开其他模块表单时的模块判断问题

## 开发注意事项

1. **开发前确认无 `dist/` 目录残留**
   - Electron 通过判断 `dist/index.html` 是否存在来切换开发/生产模式。
   - **每次启动开发前**，检查并删除 `dist/` 目录，确保 Electron 走 Vite 开发服务器 (`http://localhost:5173`)。
   - 若代码修改后热更新不生效，首先排查是否加载了旧的 `dist/` 文件。

2. **修改代码后不生效的排查步骤**
   - 检查控制台日志中的文件来源（是否来自 `localhost:5173` 或本地 `file://` 协议）。
   - 强制刷新：`Ctrl + Shift + R`（Windows）或关闭窗口后重新 `npm run dev`。
   - 清理浏览器缓存：Electron 菜单 `View -> Reload` 或 `Ctrl + R`。
   - 终极方案：删除 `dist/` 目录并重启。

3. **Electron 开发模式缓存清理**
   - `main.js` 中已添加 `mainWindow.webContents.session.clearCache()`，确保开发时不会缓存旧资源。
   - `index.html` 中已添加缓存控制 meta 标签（`Cache-Control: no-cache`）。

## 技术细节

- CSS containing block 问题：`transition` 属性会创建新的 containing block，影响 `position: fixed` 子元素
- 侧边栏采用 fixed 定位面板覆盖在 3D 地球上
- 合同→发票的级联关联通过 contract_id 实现
- 项目→发票通过项目关联合同间接关联

## 待优化/后续功能

1. 导出报表功能
2. 更丰富的 Dashboard 图表（ECharts 集成）
3. 项目/合同的审批流程
4. 数据导入功能
5. 消息通知系统
