# 项目管理器 - 3D地球版

一款基于 Electron + Vue3 的桌面项目管理软件，以 3D 地球可视化方式展示项目分布，支持项目全生命周期管理（合同、发票、付款、验收、任务、预算、人员）。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 29 |
| 前端框架 | Vue 3.4 (Composition API) |
| 构建工具 | Vite 5 |
| 3D可视化 | Three.js + OrbitControls |
| 数据库 | sql.js (SQLite 内存数据库，持久化到本地文件) |
| UI风格 | 暗色主题 / 毛玻璃效果 |

---

## 功能特性

### 核心模块

| 模块 | 功能说明 |
|------|----------|
| **项目概览 (Dashboard)** | 统计卡片（项目总数/进行中/已完成/已暂停/已延期）、财务概览（合同收入/支出/利润）、任务统计、项目进度卡片、即将到期预警 |
| **项目管理** | 项目列表（搜索+卡片视图）、项目详情面板（信息/合同/发票/预算/管理费用/任务）、预算使用率进度条（绿/黄/橙/红预警）、新增/修改/删除 |
| **合同管理** | 合同列表、合同详情（含关联发票）、支持销售/采购/施工/服务四种合同类型 |
| **发票管理** | 发票列表、发票详情（含付款状态：已收款/部分收款/未收款）、显示有/无付款凭证 |
| **付款凭证** | 付款记录列表、关联发票 |
| **验收确认** | 验收记录列表、关联项目 |
| **管理费用** | 费用记录列表、关联项目、费用类别（人员工资/报销/办公/交通/其他） |
| **人员管理** | 人员列表、人员详情（姓名/职位/电话/邮箱） |

### 项目详情面板

打开项目后，右侧详情面板提供 6 个子标签：

1. **信息**（默认显示）
   - 项目基本信息（编号、名称、地点、负责人、状态）
   - 财务概览：合同收入、合同支出、管理费用支出 + 费用预警进度条
   - 预算概览：项目预算、已支出、剩余预算 + 预算使用率进度条

2. **合同** - 按销售/采购/其他分类显示关联合同，可新增/编辑/删除合同
3. **发票** - 按收款/付款分类显示关联发票，显示有/无凭证
4. **预算** - 项目预算列表
5. **管理费用** - 项目相关费用列表
6. **任务** - 任务列表，支持一键标记完成（进行中 → 已完成）

### 3D 地球可视化

- Three.js 渲染地球，项目以标记点形式分布在对应城市位置
- 支持状态筛选（进行中/已完成/已暂停/已延期）
- 支持显示/隐藏地名、自动旋转、显示/隐藏项目标记
- 鼠标悬停显示项目信息浮层
- 点击标记点可直接打开项目详情

---

## 安装与运行

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

或分别启动：

```bash
# 终端1：启动 Vite 开发服务器
npm run dev

# 终端2：启动 Electron
npx electron .
```

### 生产构建

```bash
npm run electron:build
```

构建产物输出到 `dist-electron/` 目录。

---

## 项目结构

```
project-manager/
├── electron/                 # Electron 主进程
│   ├── main.js              # 主进程入口（窗口创建 + SQLite 数据库 + IPC）
│   └── preload.js           # 预加载脚本（安全暴露 API）
├── src/
│   ├── App.vue              # 根组件（Earth3D + Sidebar + Dashboard）
│   ├── components/
│   │   ├── Sidebar.vue      # 侧边栏（导航 + 列表 + 详情 + 表单）
│   │   ├── Dashboard.vue    # 项目概览面板
│   │   ├── Earth3D.vue      # 3D 地球组件
│   │   ├── CityPicker.vue   # 城市选择器
│   │   └── ...              # 其他列表组件
│   └── main.js              # Vue 应用入口
├── docs/                    # 文档
├── public/                  # 静态资源
├── index.html               # 入口 HTML
├── vite.config.js           # Vite 配置
└── package.json
```

---

## 数据库模型

使用 SQLite (sql.js) 内存数据库，应用退出时自动保存到 `%APPDATA%/project-manager/project-manager.db`。

### 核心数据表

| 表名 | 说明 |
|------|------|
| `projects` | 项目主表（编号、名称、城市、地点、状态、负责人、时间） |
| `contracts` | 合同表（项目ID、合同类型、名称、金额、签订日期） |
| `invoices` | 发票表（合同ID、发票号、类型、金额、日期、收款状态） |
| `payments` | 付款凭证表（发票ID、金额、日期、凭证号） |
| `acceptances` | 验收表（项目ID、任务ID、名称、状态、日期） |
| `people` | 人员表（姓名、职位、电话、邮箱） |
| `project_budgets` | 预算表（项目ID、类别、金额、说明） |
| `project_tasks` | 任务表（项目ID、名称、状态、负责人、截止日期） |
| `management_fees` | 管理费用表（项目ID、类别、金额、负责人、日期） |
| `cities` | 城市表（名称、显示名、经纬度、层级） |

### 数据关联关系

```
项目 → 合同 → 发票 → 付款凭证
项目 → 预算
项目 → 任务 → 验收
项目 → 管理费用
```

---

## 开发注意事项

### 1. 开发前确认无 `dist/` 目录残留

Electron `main.js` 通过判断 `dist/index.html` 是否存在来切换开发/生产模式。如果 `dist/` 目录残留，Electron 会加载生产构建文件而非 Vite 开发服务器，导致代码修改不生效。

**建议**：每次开发前删除 `dist/` 目录。

```bash
rm -rf dist
npm run electron:dev
```

### 2. 修改代码后不生效的排查

1. 检查是否来自 `localhost:5173`（开发模式）还是 `file://`（生产模式）
2. 强制刷新：`Ctrl + Shift + R`
3. 删除 `dist/` 目录并重启

### 3. 缓存清理

- `main.js` 中已添加 `mainWindow.webContents.session.clearCache()`
- `index.html` 中已添加 `Cache-Control: no-cache` 元标签

### 4. 数据库调试

数据库文件保存在：
- Windows: `%APPDATA%/project-manager/project-manager.db`
- macOS: `~/Library/Application Support/project-manager/project-manager.db`
- Linux: `~/.config/project-manager/project-manager.db`

首次启动会自动生成 20 个示例项目、26 个合同、27 个发票、10 个人员等模拟数据。

---

## 常见问题

### Q: 导航栏图标点击第三下后没反应？
A: 已修复。点击当前激活的图标会关闭列表面板，再次点击会重新打开。

### Q: 人员详情显示的是项目详情？
A: 已修复。根本原因是 `dist/` 目录残留导致 Electron 加载旧代码。删除 `dist/` 即可解决。

### Q: 表单标题显示错误（如"新增项目"应为"新增合同"）？
A: 已修复。引入 `formModule` 机制追踪表单所属模块，避免依赖 `activeModule` 的响应式延迟。

---

## 许可证

MIT License
