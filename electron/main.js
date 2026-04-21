const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

let mainWindow
let db
let SQL

async function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'project-manager.db')

  SQL = await initSqlJs()

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      city_id INTEGER,
      location TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT '进行中',
      manager TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add city_id column if it doesn't exist (for existing databases)
  try {
    db.run("ALTER TABLE projects ADD COLUMN city_id INTEGER")
  } catch (e) {
    // Column already exists, ignore
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      code TEXT,
      name TEXT NOT NULL,
      contract_type TEXT DEFAULT '销售合同',
      amount REAL,
      signed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

  // Add code column to contracts if not exists
  try {
    db.run("ALTER TABLE contracts ADD COLUMN code TEXT")
  } catch (e) {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER,
      invoice_no TEXT,
      amount REAL,
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      amount REAL,
      date DATE,
      receipt_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS acceptances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      task_id INTEGER,
      name TEXT,
      status TEXT DEFAULT '待验收',
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (task_id) REFERENCES project_tasks(id)
    )
  `)

  // Add task_id column to acceptances if not exists
  try {
    db.run("ALTER TABLE acceptances ADD COLUMN task_id INTEGER")
  } catch (e) {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      parent_id INTEGER,
      level TEXT DEFAULT 'city',
      lat REAL,
      lon REAL,
      country TEXT DEFAULT '中国',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 项目预算表
  db.run(`
    CREATE TABLE IF NOT EXISTS project_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      category TEXT NOT NULL,
      amount REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

  // 项目任务表
  db.run(`
    CREATE TABLE IF NOT EXISTS project_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      status TEXT DEFAULT '待开始',
      due_date DATE,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

  // 插入模拟数据
  seedCitiesData()
  seedData()

  saveDatabase()
}

function seedData() {
  // 检查是否已有数据
  const existingProjects = db.exec("SELECT COUNT(*) FROM projects")[0]
  if (existingProjects && existingProjects.values[0][0] > 0) return

  // 先插入城市数据（如果还没有）
  seedCitiesData()

  // 获取城市ID映射
  const cityMap = {}
  const cities = db.exec("SELECT id, name FROM cities")
  if (cities.length > 0) {
    cities[0].values.forEach(row => {
      cityMap[row[1]] = row[0]
    })
  }

  // 20个项目数据 - 覆盖各种情况
  const projects = [
    // 进行中项目 (8个)
    { code: 'PRJ2024001', name: '北京大兴国际机场智慧园区项目', city_name: '大兴区', start_date: '2024-01-15', end_date: '2025-06-30', status: '进行中', manager: '张伟' },
    { code: 'PRJ2024002', name: '上海自贸区数据中心建设', city_name: '浦东新区', start_date: '2024-03-01', end_date: '2025-03-01', status: '进行中', manager: '李娜' },
    { code: 'PRJ2024005', name: '广州南沙港智能化物流系统', city_name: '广州市', start_date: '2024-05-01', end_date: '2026-02-28', status: '进行中', manager: '王强' },
    { code: 'PRJ2024006', name: '武汉光谷云计算中心', city_name: '武汉市', start_date: '2024-02-15', end_date: '2025-08-15', status: '进行中', manager: '刘洋' },
    { code: 'PRJ2024007', name: '西安航天城指挥系统', city_name: '西安市', start_date: '2024-06-01', end_date: '2025-12-31', status: '进行中', manager: '陈明' },
    { code: 'PRJ2024008', name: '南京软件谷智慧园区', city_name: '南京市', start_date: '2024-04-15', end_date: '2025-10-30', status: '进行中', manager: '赵雪' },
    { code: 'PRJ2024009', name: '苏州工业园区智能制造项目', city_name: '苏州市', start_date: '2024-03-20', end_date: '2025-09-20', status: '进行中', manager: '孙浩' },
    { code: 'PRJ2024010', name: '青岛港自动化码头系统', city_name: '青岛市', start_date: '2024-07-01', end_date: '2026-01-15', status: '进行中', manager: '周婷' },

    // 已完成项目 (5个)
    { code: 'PRJ2023001', name: '深圳地铁14号线智能化系统', city_name: '深圳市', start_date: '2023-06-01', end_date: '2024-06-30', status: '已完成', manager: '王强' },
    { code: 'PRJ2023002', name: '成都天府国际机场配套工程', city_name: '成都市', start_date: '2023-03-01', end_date: '2024-03-01', status: '已完成', manager: '刘洋' },
    { code: 'PRJ2023003', name: '杭州亚运会场馆智能化改造', city_name: '杭州市', start_date: '2023-01-01', end_date: '2024-01-01', status: '已完成', manager: '陈明' },
    { code: 'PRJ2023004', name: '重庆两江新区数据中心', city_name: '重庆市', start_date: '2023-05-01', end_date: '2024-05-31', status: '已完成', manager: '张伟' },
    { code: 'PRJ2023005', name: '天津滨海新区智能交通', city_name: '天津市', start_date: '2023-04-01', end_date: '2024-04-30', status: '已完成', manager: '李娜' },

    // 已暂停项目 (3个)
    { code: 'PRJ2024011', name: '郑州智慧城市大脑项目', city_name: '郑州市', start_date: '2024-08-01', end_date: '2026-06-30', status: '已暂停', manager: '赵雪' },
    { code: 'PRJ2024012', name: '长沙智能电网示范项目', city_name: '长沙市', start_date: '2024-05-15', end_date: '2025-11-15', status: '已暂停', manager: '孙浩' },
    { code: 'PRJ2024013', name: '福州数字政务平台', city_name: '福州市', start_date: '2024-06-01', end_date: '2025-12-31', status: '已暂停', manager: '周婷' },

    // 已延期项目 (4个)
    { code: 'PRJ2024014', name: '厦门海港智慧物流园', city_name: '厦门市', start_date: '2024-01-01', end_date: '2025-06-30', status: '已延期', manager: '王强' },
    { code: 'PRJ2024015', name: '昆明长水机场扩建智能化', city_name: '昆明市', start_date: '2024-02-01', end_date: '2025-08-31', status: '已延期', manager: '刘洋' },
    { code: 'PRJ2024016', name: '哈尔滨新区智慧管廊', city_name: '哈尔滨市', start_date: '2024-03-15', end_date: '2025-09-30', status: '已延期', manager: '陈明' },
    { code: 'PRJ2024017', name: '沈阳工业互联网平台', city_name: '沈阳市', start_date: '2024-04-01', end_date: '2025-10-31', status: '已延期', manager: '赵雪' }
  ]

  projects.forEach(p => {
    const city_id = cityMap[p.city_name] || null
    const location = p.city_name
    db.run("INSERT INTO projects (code, name, city_id, location, start_date, end_date, status, manager) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [p.code, p.name, city_id, location, p.start_date, p.end_date, p.status, p.manager])
  })

  // 合同数据 - 17个项目有合同，3个项目无合同(PRJ2024010,PRJ2024016,PRJ2024017)
  const contracts = [
    // 项目1 - 3个合同
    { project_id: 1, code: 'CT-2024-001', name: '智慧园区系统采购合同', contract_type: '采购合同', amount: 28000000, signed_date: '2024-01-20' },
    { project_id: 1, code: 'CT-2024-002', name: '网络基础设施建设合同', contract_type: '施工合同', amount: 15000000, signed_date: '2024-02-15' },
    { project_id: 1, code: 'CT-2024-003', name: '软件平台开发合同', contract_type: '服务合同', amount: 8000000, signed_date: '2024-03-10' },

    // 项目2 - 2个合同
    { project_id: 2, code: 'CT-2024-004', name: '数据中心设备采购合同', contract_type: '采购合同', amount: 45000000, signed_date: '2024-03-10' },
    { project_id: 2, code: 'CT-2024-005', name: '机房装修合同', contract_type: '施工合同', amount: 12000000, signed_date: '2024-03-25' },

    // 项目3 - 2个合同
    { project_id: 3, code: 'CT-2024-006', name: '物流系统设备采购', contract_type: '采购合同', amount: 22000000, signed_date: '2024-05-15' },
    { project_id: 3, code: 'CT-2024-007', name: '系统集成合同', contract_type: '服务合同', amount: 6000000, signed_date: '2024-06-01' },

    // 项目4 - 1个合同
    { project_id: 4, code: 'CT-2024-008', name: '云计算中心建设合同', contract_type: '施工合同', amount: 35000000, signed_date: '2024-02-20' },

    // 项目5 - 2个合同
    { project_id: 5, code: 'CT-2024-009', name: '指挥系统设备合同', contract_type: '采购合同', amount: 18000000, signed_date: '2024-06-15' },
    { project_id: 5, code: 'CT-2024-010', name: '软件授权合同', contract_type: '服务合同', amount: 5000000, signed_date: '2024-06-20' },

    // 项目6 - 1个合同
    { project_id: 6, code: 'CT-2024-011', name: '智慧园区总包合同', contract_type: '施工合同', amount: 28000000, signed_date: '2024-04-20' },

    // 项目7 - 2个合同
    { project_id: 7, code: 'CT-2024-012', name: '智能制造设备采购', contract_type: '采购合同', amount: 20000000, signed_date: '2024-03-25' },
    { project_id: 7, code: 'CT-2024-013', name: 'MES系统开发合同', contract_type: '服务合同', amount: 7500000, signed_date: '2024-04-10' },

    // 项目8 - 无合同
    // 项目9 (已完成) - 2个合同
    { project_id: 9, code: 'CT-2023-001', name: '信号系统采购安装合同', contract_type: '采购合同', amount: 32000000, signed_date: '2023-06-15' },
    { project_id: 9, code: 'CT-2023-002', name: '系统维护合同', contract_type: '服务合同', amount: 4000000, signed_date: '2023-07-01' },

    // 项目10 (已完成) - 1个合同
    { project_id: 10, code: 'CT-2023-003', name: '机场配套设施合同', contract_type: '施工合同', amount: 55000000, signed_date: '2023-03-15' },

    // 项目11 (已完成) - 2个合同
    { project_id: 11, code: 'CT-2023-004', name: '场馆改造设备采购', contract_type: '采购合同', amount: 15000000, signed_date: '2023-01-15' },
    { project_id: 11, code: 'CT-2023-005', name: '系统调试合同', contract_type: '服务合同', amount: 3000000, signed_date: '2023-02-01' },

    // 项目12 (已完成) - 1个合同
    { project_id: 12, code: 'CT-2023-006', name: '数据中心建设合同', contract_type: '施工合同', amount: 40000000, signed_date: '2023-05-10' },

    // 项目13 (已完成) - 1个合同
    { project_id: 13, code: 'CT-2023-007', name: '智能交通系统合同', contract_type: '采购合同', amount: 25000000, signed_date: '2023-04-15' },

    // 项目14 (已暂停) - 2个合同
    { project_id: 14, code: 'CT-2024-014', name: '城市大脑平台合同', contract_type: '服务合同', amount: 30000000, signed_date: '2024-08-15' },
    { project_id: 14, code: 'CT-2024-015', name: '硬件设备采购', contract_type: '采购合同', amount: 18000000, signed_date: '2024-08-20' },

    // 项目15 (已暂停) - 1个合同
    { project_id: 15, code: 'CT-2024-016', name: '智能电网设备合同', contract_type: '采购合同', amount: 22000000, signed_date: '2024-05-20' },

    // 项目16 (已暂停) - 无合同

    // 项目17 (已延期) - 1个合同
    { project_id: 17, code: 'CT-2024-017', name: '智慧物流系统合同', contract_type: '采购合同', amount: 19000000, signed_date: '2024-01-10' },

    // 项目18 (已延期) - 无合同
    // 项目19 (已延期) - 无合同
    // 项目20 (已延期) - 无合同
  ]

  contracts.forEach(c => {
    db.run("INSERT INTO contracts (project_id, code, name, contract_type, amount, signed_date) VALUES (?, ?, ?, ?, ?, ?)",
      [c.project_id, c.code, c.name, c.contract_type, c.amount, c.signed_date])
  })

  // 发票数据 - 覆盖各种情况：有凭证/无凭证
  const invoices = [
    // 项目1的发票 - 全部有凭证
    { contract_id: 1, invoice_no: 'INV20240001', amount: 10000000, date: '2024-02-28' },
    { contract_id: 1, invoice_no: 'INV20240002', amount: 8000000, date: '2024-04-15' },
    { contract_id: 1, invoice_no: 'INV20240003', amount: 10000000, date: '2024-06-20' },

    // 项目2的发票 - 全部有凭证
    { contract_id: 2, invoice_no: 'INV20240004', amount: 20000000, date: '2024-04-10' },
    { contract_id: 2, invoice_no: 'INV20240005', amount: 15000000, date: '2024-05-15' },
    { contract_id: 2, invoice_no: 'INV20240006', amount: 10000000, date: '2024-06-25' },

    // 项目3的发票 - 部分有凭证
    { contract_id: 3, invoice_no: 'INV20240007', amount: 12000000, date: '2024-07-01' },
    { contract_id: 3, invoice_no: 'INV20240008', amount: 10000000, date: '2024-08-15' },

    // 项目4的发票 - 全部无凭证
    { contract_id: 4, invoice_no: 'INV20240009', amount: 35000000, date: '2024-03-15' },

    // 项目5的发票 - 全部有凭证
    { contract_id: 5, invoice_no: 'INV20240010', amount: 12000000, date: '2024-07-10' },
    { contract_id: 5, invoice_no: 'INV20240011', amount: 6000000, date: '2024-08-05' },

    // 项目6的发票 - 部分有凭证
    { contract_id: 6, invoice_no: 'INV20240012', amount: 15000000, date: '2024-05-20' },
    { contract_id: 6, invoice_no: 'INV20240013', amount: 13000000, date: '2024-07-30' },

    // 项目7的发票 - 全部有凭证
    { contract_id: 7, invoice_no: 'INV20240014', amount: 10000000, date: '2024-04-25' },
    { contract_id: 7, invoice_no: 'INV20240015', amount: 10000000, date: '2024-06-15' },
    { contract_id: 7, invoice_no: 'INV20240016', amount: 7500000, date: '2024-08-20' },

    // 项目9(已完成)的发票 - 全部有凭证
    { contract_id: 9, invoice_no: 'INV20230001', amount: 15000000, date: '2023-08-15' },
    { contract_id: 9, invoice_no: 'INV20230002', amount: 17000000, date: '2023-10-20' },

    // 项目10(已完成)的发票 - 全部有凭证
    { contract_id: 10, invoice_no: 'INV20230003', amount: 28000000, date: '2023-05-20' },
    { contract_id: 10, invoice_no: 'INV20230004', amount: 27000000, date: '2023-07-25' },

    // 项目11(已完成)的发票 - 全部有凭证
    { contract_id: 11, invoice_no: 'INV20230005', amount: 8000000, date: '2023-03-15' },
    { contract_id: 11, invoice_no: 'INV20230006', amount: 7000000, date: '2023-05-10' },

    // 项目12(已完成)的发票 - 部分无凭证
    { contract_id: 12, invoice_no: 'INV20230007', amount: 20000000, date: '2023-06-15' },
    { contract_id: 12, invoice_no: 'INV20230008', amount: 20000000, date: '2023-09-20' },

    // 项目13(已完成)的发票 - 全部有凭证
    { contract_id: 13, invoice_no: 'INV20230009', amount: 25000000, date: '2023-05-20' },

    // 项目14(已暂停)的发票 - 全部无凭证
    { contract_id: 14, invoice_no: 'INV20240101', amount: 15000000, date: '2024-09-10' },
    { contract_id: 14, invoice_no: 'INV20240102', amount: 15000000, date: '2024-10-15' },

    // 项目15(已暂停)的发票 - 部分有凭证
    { contract_id: 15, invoice_no: 'INV20240103', amount: 22000000, date: '2024-06-20' },

    // 项目17(已延期)的发票 - 部分无凭证
    { contract_id: 17, invoice_no: 'INV20240104', amount: 19000000, date: '2024-02-15' },
  ]

  invoices.forEach(i => {
    db.run("INSERT INTO invoices (contract_id, invoice_no, amount, date) VALUES (?, ?, ?, ?)",
      [i.contract_id, i.invoice_no, i.amount, i.date])
  })

  // 付款凭证数据 - 部分发票有凭证，部分无
  const payments = [
    // 项目1的付款
    { invoice_id: 1, amount: 10000000, date: '2024-03-15', receipt_no: 'PAY20240315001' },
    { invoice_id: 2, amount: 8000000, date: '2024-05-20', receipt_no: 'PAY20240520001' },
    { invoice_id: 3, amount: 10000000, date: '2024-07-25', receipt_no: 'PAY20240725001' },

    // 项目2的付款
    { invoice_id: 4, amount: 20000000, date: '2024-05-12', receipt_no: 'PAY20240512001' },
    { invoice_id: 5, amount: 15000000, date: '2024-06-18', receipt_no: 'PAY20240618001' },
    // 发票6无凭证

    // 项目3的付款 - 只有部分有凭证
    { invoice_id: 7, amount: 12000000, date: '2024-08-05', receipt_no: 'PAY20240805001' },
    // 发票8无凭证

    // 项目5的付款
    { invoice_id: 10, amount: 12000000, date: '2024-08-12', receipt_no: 'PAY20240812001' },
    { invoice_id: 11, amount: 6000000, date: '2024-09-08', receipt_no: 'PAY20240908001' },

    // 项目6的付款 - 只有部分有凭证
    { invoice_id: 12, amount: 15000000, date: '2024-06-22', receipt_no: 'PAY20240622001' },
    // 发票13无凭证

    // 项目7的付款
    { invoice_id: 14, amount: 10000000, date: '2024-05-28', receipt_no: 'PAY20240528001' },
    { invoice_id: 15, amount: 10000000, date: '2024-07-18', receipt_no: 'PAY20240718001' },
    { invoice_id: 16, amount: 7500000, date: '2024-09-25', receipt_no: 'PAY20240925001' },

    // 项目9的付款
    { invoice_id: 17, amount: 15000000, date: '2023-09-10', receipt_no: 'PAY20230910001' },
    { invoice_id: 18, amount: 17000000, date: '2023-11-22', receipt_no: 'PAY20231122001' },

    // 项目10的付款
    { invoice_id: 19, amount: 28000000, date: '2023-06-18', receipt_no: 'PAY20230618001' },
    { invoice_id: 20, amount: 27000000, date: '2023-08-28', receipt_no: 'PAY20230828001' },

    // 项目11的付款
    { invoice_id: 21, amount: 8000000, date: '2023-04-18', receipt_no: 'PAY20230418001' },
    { invoice_id: 22, amount: 7000000, date: '2023-06-12', receipt_no: 'PAY20230612001' },

    // 项目12的付款 - 只有部分有凭证
    { invoice_id: 23, amount: 20000000, date: '2023-07-20', receipt_no: 'PAY20230720001' },
    // 发票24无凭证

    // 项目13的付款
    { invoice_id: 25, amount: 25000000, date: '2023-06-22', receipt_no: 'PAY20230622001' },
  ]

  payments.forEach(p => {
    db.run("INSERT INTO payments (invoice_id, amount, date, receipt_no) VALUES (?, ?, ?, ?)",
      [p.invoice_id, p.amount, p.date, p.receipt_no])
  })

  // 验收数据 - 关联任务
  const acceptances = [
    // 项目1 - 待验收 (关联任务4:系统部署)
    { project_id: 1, task_id: 4, name: '一期网络基础设施验收', status: '待验收', date: '2024-12-31' },
    // 项目2 - 已验收 (关联任务4:系统调试)
    { project_id: 2, task_id: 8, name: '数据中心机房验收', status: '已验收', date: '2024-10-15' },
    // 项目3 - 进行中无验收
    // 项目4 - 进行中无验收
    // 项目5 - 进行中无验收
    // 项目6 - 进行中无验收
    // 项目7 - 进行中无验收
    // 项目8 - 进行中无验收
    // 项目9(已完成) - 已验收 (关联任务4:验收交付)
    { project_id: 9, task_id: 36, name: '信号系统验收', status: '已验收', date: '2024-06-30' },
    // 项目10(已完成) - 已验收 (关联任务3:竣工验收)
    { project_id: 10, task_id: 43, name: '机场配套设施验收', status: '已验收', date: '2024-03-15' },
    // 项目11(已完成) - 已验收 (关联任务3:系统验收)
    { project_id: 11, task_id: 46, name: '场馆系统验收', status: '已验收', date: '2024-01-10' },
    // 项目12(已完成) - 不通过 (关联任务4:验收交付)
    { project_id: 12, task_id: 52, name: '数据中心验收', status: '不通过', date: '2024-05-20' },
    // 项目13(已完成) - 已验收 (关联任务3:系统上线)
    { project_id: 13, task_id: 55, name: '智能交通系统验收', status: '已验收', date: '2024-04-25' },
    // 项目14(已暂停) - 待验收 (关联任务1:平台开发)
    { project_id: 14, task_id: 56, name: '平台一期验收', status: '待验收', date: '2024-12-31' },
    // 项目15(已暂停) - 待验收 (关联任务2:设备采购)
    { project_id: 15, task_id: 59, name: '电网设备验收', status: '待验收', date: '2024-11-30' },
    // 项目16(已暂停) - 无验收
    // 项目17(已延期) - 待验收 (关联任务2:方案设计)
    { project_id: 17, task_id: 63, name: '物流系统验收', status: '待验收', date: '2024-10-31' },
    // 项目18-20 - 无验收
  ]

  acceptances.forEach(a => {
    db.run("INSERT INTO acceptances (project_id, task_id, name, status, date) VALUES (?, ?, ?, ?, ?)",
      [a.project_id, a.task_id || null, a.name, a.status, a.date])
  })

  // 人员数据
  const people = [
    { name: '张伟', position: '项目经理', phone: '13800138001', email: 'zhangwei@company.com' },
    { name: '李娜', position: '技术总监', phone: '13800138002', email: 'lina@company.com' },
    { name: '王强', position: '施工经理', phone: '13800138003', email: 'wangqiang@company.com' },
    { name: '刘洋', position: '安全主管', phone: '13800138004', email: 'liuyang@company.com' },
    { name: '陈明', position: '质量经理', phone: '13800138005', email: 'chenming@company.com' },
    { name: '赵雪', position: '财务主管', phone: '13800138006', email: 'zhaoxue@company.com' },
    { name: '孙浩', position: '采购经理', phone: '13800138007', email: 'sunhao@company.com' },
    { name: '周婷', position: '行政主管', phone: '13800138008', email: 'zhouting@company.com' },
    { name: '吴刚', position: '系统架构师', phone: '13800138009', email: 'wugang@company.com' },
    { name: '郑强', position: '运维经理', phone: '13800138010', email: 'zhengqiang@company.com' }
  ]

  people.forEach(p => {
    db.run("INSERT INTO people (name, position, phone, email) VALUES (?, ?, ?, ?)",
      [p.name, p.position, p.phone, p.email])
  })

  // 项目预算数据
  const budgets = [
    // 项目1
    { project_id: 1, category: '设备采购', amount: 20000000, description: '智慧园区系统设备' },
    { project_id: 1, category: '工程施工', amount: 15000000, description: '网络基础设施建设' },
    { project_id: 1, category: '软件开发', amount: 8000000, description: '平台软件开发' },
    // 项目2
    { project_id: 2, category: '设备采购', amount: 35000000, description: '数据中心设备' },
    { project_id: 2, category: '装修工程', amount: 12000000, description: '机房装修' },
    // 项目3
    { project_id: 3, category: '设备采购', amount: 18000000, description: '物流系统设备' },
    { project_id: 3, category: '系统集成', amount: 6000000, description: '系统集成服务' },
    // 项目4
    { project_id: 4, category: '工程建设', amount: 35000000, description: '云计算中心建设' },
    // 项目5
    { project_id: 5, category: '设备采购', amount: 15000000, description: '指挥系统设备' },
    { project_id: 5, category: '软件授权', amount: 5000000, description: '软件授权许可' },
    // 项目6
    { project_id: 6, category: '工程建设', amount: 28000000, description: '智慧园区总包' },
    // 项目7
    { project_id: 7, category: '设备采购', amount: 18000000, description: '智能制造设备' },
    { project_id: 7, category: '软件开发', amount: 7500000, description: 'MES系统开发' },
    // 项目8
    { project_id: 8, category: '设备采购', amount: 22000000, description: '港口自动化设备' },
    { project_id: 8, category: '系统集成', amount: 8000000, description: '系统集成服务' },
    // 项目9
    { project_id: 9, category: '设备采购', amount: 25000000, description: '信号系统设备' },
    { project_id: 9, category: '维保服务', amount: 4000000, description: '系统维护' },
    // 项目10
    { project_id: 10, category: '工程建设', amount: 45000000, description: '机场配套设施' },
    // 项目11
    { project_id: 11, category: '设备采购', amount: 12000000, description: '场馆改造设备' },
    { project_id: 11, category: '调试服务', amount: 3000000, description: '系统调试' },
    // 项目12
    { project_id: 12, category: '工程建设', amount: 40000000, description: '数据中心建设' },
    // 项目13
    { project_id: 13, category: '设备采购', amount: 25000000, description: '智能交通设备' },
    // 项目14
    { project_id: 14, category: '软件开发', amount: 25000000, description: '城市大脑平台' },
    { project_id: 14, category: '设备采购', amount: 15000000, description: '硬件设备' },
    // 项目15
    { project_id: 15, category: '设备采购', amount: 18000000, description: '智能电网设备' },
    // 项目16
    { project_id: 16, category: '工程建设', amount: 30000000, description: '智慧管廊建设' },
    // 项目17
    { project_id: 17, category: '设备采购', amount: 15000000, description: '智慧物流设备' },
    // 项目18
    { project_id: 18, category: '设备采购', amount: 20000000, description: '机场扩建设备' },
    // 项目19
    { project_id: 19, category: '工程建设', amount: 25000000, description: '智慧管廊工程' },
    // 项目20
    { project_id: 20, category: '平台开发', amount: 20000000, description: '工业互联网平台' },
  ]

  budgets.forEach(b => {
    db.run("INSERT INTO project_budgets (project_id, category, amount, description) VALUES (?, ?, ?, ?)",
      [b.project_id, b.category, b.amount, b.description])
  })

  // 项目任务数据
  const tasks = [
    // 项目1 - 5个任务
    { project_id: 1, name: '需求调研', status: '已完成', due_date: '2024-01-31', completed_at: '2024-01-28' },
    { project_id: 1, name: '方案设计', status: '已完成', due_date: '2024-02-28', completed_at: '2024-02-25' },
    { project_id: 1, name: '设备采购', status: '进行中', due_date: '2024-05-31' },
    { project_id: 1, name: '系统部署', status: '待开始', due_date: '2024-08-31' },
    { project_id: 1, name: '验收交付', status: '待开始', due_date: '2025-06-30' },

    // 项目2 - 4个任务
    { project_id: 2, name: '场地准备', status: '已完成', due_date: '2024-02-28', completed_at: '2024-02-20' },
    { project_id: 2, name: '机房装修', status: '已完成', due_date: '2024-04-30', completed_at: '2024-04-25' },
    { project_id: 2, name: '设备安装', status: '进行中', due_date: '2024-07-31' },
    { project_id: 2, name: '系统调试', status: '待开始', due_date: '2024-10-31' },

    // 项目3 - 4个任务
    { project_id: 3, name: '需求分析', status: '已完成', due_date: '2024-04-30', completed_at: '2024-04-20' },
    { project_id: 3, name: '设备采购', status: '进行中', due_date: '2024-06-30' },
    { project_id: 3, name: '系统集成', status: '待开始', due_date: '2024-09-30' },
    { project_id: 3, name: '验收测试', status: '待开始', due_date: '2024-12-31' },

    // 项目4 - 4个任务
    { project_id: 4, name: '土建施工', status: '已完成', due_date: '2024-05-31', completed_at: '2024-05-15' },
    { project_id: 4, name: '机电安装', status: '进行中', due_date: '2024-08-31' },
    { project_id: 4, name: '装修工程', status: '待开始', due_date: '2024-11-30' },
    { project_id: 4, name: '竣工验收', status: '待开始', due_date: '2025-08-15' },

    // 项目5 - 3个任务
    { project_id: 5, name: '设备采购', status: '已完成', due_date: '2024-07-31', completed_at: '2024-07-20' },
    { project_id: 5, name: '软件部署', status: '进行中', due_date: '2024-10-31' },
    { project_id: 5, name: '系统联调', status: '待开始', due_date: '2024-12-31' },

    // 项目6 - 4个任务
    { project_id: 6, name: '总体规划', status: '已完成', due_date: '2024-05-31', completed_at: '2024-05-20' },
    { project_id: 6, name: '基础建设', status: '进行中', due_date: '2024-09-30' },
    { project_id: 6, name: '设备安装', status: '待开始', due_date: '2024-12-31' },
    { project_id: 6, name: '验收交付', status: '待开始', due_date: '2025-10-30' },

    // 项目7 - 3个任务
    { project_id: 7, name: '设备选型', status: '已完成', due_date: '2024-04-30', completed_at: '2024-04-15' },
    { project_id: 7, name: '设备采购', status: '进行中', due_date: '2024-07-31' },
    { project_id: 7, name: '系统上线', status: '待开始', due_date: '2024-09-20' },

    // 项目8 - 3个任务
    { project_id: 8, name: '方案设计', status: '已完成', due_date: '2024-08-31', completed_at: '2024-08-15' },
    { project_id: 8, name: '设备采购', status: '进行中', due_date: '2024-11-30' },
    { project_id: 8, name: '系统调试', status: '待开始', due_date: '2025-01-15' },

    // 项目9 (已完成) - 4个任务
    { project_id: 9, name: '需求调研', status: '已完成', due_date: '2023-07-31', completed_at: '2023-07-20' },
    { project_id: 9, name: '设备采购', status: '已完成', due_date: '2023-09-30', completed_at: '2023-09-25' },
    { project_id: 9, name: '系统安装', status: '已完成', due_date: '2023-12-31', completed_at: '2023-12-20' },
    { project_id: 9, name: '验收交付', status: '已完成', due_date: '2024-06-30', completed_at: '2024-06-28' },

    // 项目10 (已完成) - 3个任务
    { project_id: 10, name: '规划设计', status: '已完成', due_date: '2023-05-31', completed_at: '2023-05-20' },
    { project_id: 10, name: '工程建设', status: '已完成', due_date: '2023-12-31', completed_at: '2023-12-25' },
    { project_id: 10, name: '竣工验收', status: '已完成', due_date: '2024-03-01', completed_at: '2024-02-28' },

    // 项目11 (已完成) - 3个任务
    { project_id: 11, name: '场馆勘察', status: '已完成', due_date: '2023-03-31', completed_at: '2023-03-20' },
    { project_id: 11, name: '设备安装', status: '已完成', due_date: '2023-08-31', completed_at: '2023-08-25' },
    { project_id: 11, name: '系统验收', status: '已完成', due_date: '2024-01-01', completed_at: '2023-12-28' },

    // 项目12 (已完成) - 4个任务
    { project_id: 12, name: '场地准备', status: '已完成', due_date: '2023-06-30', completed_at: '2023-06-20' },
    { project_id: 12, name: '机房建设', status: '已完成', due_date: '2023-10-31', completed_at: '2023-10-25' },
    { project_id: 12, name: '设备部署', status: '已完成', due_date: '2024-02-28', completed_at: '2024-02-20' },
    { project_id: 12, name: '验收交付', status: '已完成', due_date: '2024-05-31', completed_at: '2024-05-28' },

    // 项目13 (已完成) - 3个任务
    { project_id: 13, name: '需求分析', status: '已完成', due_date: '2023-05-31', completed_at: '2023-05-20' },
    { project_id: 13, name: '设备采购', status: '已完成', due_date: '2023-08-31', completed_at: '2023-08-20' },
    { project_id: 13, name: '系统上线', status: '已完成', due_date: '2024-04-30', completed_at: '2024-04-25' },

    // 项目14 (已暂停) - 3个任务
    { project_id: 14, name: '平台开发', status: '进行中', due_date: '2024-12-31' },
    { project_id: 14, name: '硬件部署', status: '待开始', due_date: '2025-03-31' },
    { project_id: 14, name: '系统集成', status: '待开始', due_date: '2025-06-30' },

    // 项目15 (已暂停) - 3个任务
    { project_id: 15, name: '设备选型', status: '已完成', due_date: '2024-07-31', completed_at: '2024-07-20' },
    { project_id: 15, name: '设备采购', status: '已暂停', due_date: '2024-10-31' },
    { project_id: 15, name: '安装调试', status: '待开始', due_date: '2025-01-31' },

    // 项目16 (已暂停) - 3个任务
    { project_id: 16, name: '规划设计', status: '已完成', due_date: '2024-06-30', completed_at: '2024-06-15' },
    { project_id: 16, name: '土建施工', status: '已暂停', due_date: '2024-12-31' },
    { project_id: 16, name: '设备安装', status: '待开始', due_date: '2025-06-30' },

    // 项目17 (已延期) - 4个任务
    { project_id: 17, name: '需求调研', status: '已完成', due_date: '2024-03-31', completed_at: '2024-03-20' },
    { project_id: 17, name: '方案设计', status: '进行中', due_date: '2024-06-30' },
    { project_id: 17, name: '设备采购', status: '待开始', due_date: '2024-10-31' },
    { project_id: 17, name: '系统部署', status: '待开始', due_date: '2025-06-30' },

    // 项目18 (已延期) - 3个任务
    { project_id: 18, name: '项目规划', status: '已完成', due_date: '2024-04-30', completed_at: '2024-04-20' },
    { project_id: 18, name: '设备采购', status: '进行中', due_date: '2024-09-30' },
    { project_id: 18, name: '安装调试', status: '待开始', due_date: '2025-08-31' },

    // 项目19 (已延期) - 3个任务
    { project_id: 19, name: '地质勘察', status: '已完成', due_date: '2024-05-31', completed_at: '2024-05-20' },
    { project_id: 19, name: '施工设计', status: '进行中', due_date: '2024-08-31' },
    { project_id: 19, name: '工程建设', status: '待开始', due_date: '2025-09-30' },

    // 项目20 (已延期) - 3个任务
    { project_id: 20, name: '平台设计', status: '已完成', due_date: '2024-06-30', completed_at: '2024-06-20' },
    { project_id: 20, name: '开发实施', status: '进行中', due_date: '2024-12-31' },
    { project_id: 20, name: '测试上线', status: '待开始', due_date: '2025-10-31' },
  ]

  tasks.forEach(t => {
    db.run("INSERT INTO project_tasks (project_id, name, status, due_date, completed_at) VALUES (?, ?, ?, ?, ?)",
      [t.project_id, t.name, t.status, t.due_date, t.completed_at || null])
  })
}

function seedCitiesData() {
  const existingCities = db.exec("SELECT COUNT(*) FROM cities")[0]
  if (existingCities && existingCities.values[0][0] > 0) return

  // 省级数据
  const provinces = [
    { name: '北京市', display_name: '北京市', lat: 39.9042, lon: 116.4074, level: 'province' },
    { name: '天津市', display_name: '天津市', lat: 39.3434, lon: 117.3616, level: 'province' },
    { name: '河北省', display_name: '河北省', lat: 38.0428, lon: 114.5149, level: 'province' },
    { name: '山西省', display_name: '山西省', lat: 37.8570, lon: 112.5490, level: 'province' },
    { name: '内蒙古自治区', display_name: '内蒙古自治区', lat: 40.8420, lon: 111.7490, level: 'province' },
    { name: '辽宁省', display_name: '辽宁省', lat: 41.7968, lon: 123.4315, level: 'province' },
    { name: '吉林省', display_name: '吉林省', lat: 43.8868, lon: 125.3245, level: 'province' },
    { name: '黑龙江省', display_name: '黑龙江省', lat: 45.7569, lon: 126.6421, level: 'province' },
    { name: '上海市', display_name: '上海市', lat: 31.2304, lon: 121.4737, level: 'province' },
    { name: '江苏省', display_name: '江苏省', lat: 32.0603, lon: 118.7969, level: 'province' },
    { name: '浙江省', display_name: '浙江省', lat: 30.2873, lon: 120.1536, level: 'province' },
    { name: '安徽省', display_name: '安徽省', lat: 31.8612, lon: 117.2830, level: 'province' },
    { name: '福建省', display_name: '福建省', lat: 26.0745, lon: 119.2965, level: 'province' },
    { name: '江西省', display_name: '江西省', lat: 28.6823, lon: 115.8579, level: 'province' },
    { name: '山东省', display_name: '山东省', lat: 36.6512, lon: 117.1201, level: 'province' },
    { name: '河南省', display_name: '河南省', lat: 34.7656, lon: 113.7535, level: 'province' },
    { name: '湖北省', display_name: '湖北省', lat: 30.5928, lon: 114.3055, level: 'province' },
    { name: '湖南省', display_name: '湖南省', lat: 28.2282, lon: 112.9388, level: 'province' },
    { name: '广东省', display_name: '广东省', lat: 23.1291, lon: 113.2644, level: 'province' },
    { name: '广西壮族自治区', display_name: '广西壮族自治区', lat: 22.8170, lon: 108.3665, level: 'province' },
    { name: '海南省', display_name: '海南省', lat: 19.5664, lon: 109.9497, level: 'province' },
    { name: '重庆市', display_name: '重庆市', lat: 29.5630, lon: 106.5516, level: 'province' },
    { name: '四川省', display_name: '四川省', lat: 30.5728, lon: 104.0668, level: 'province' },
    { name: '贵州省', display_name: '贵州省', lat: 26.5980, lon: 106.7073, level: 'province' },
    { name: '云南省', display_name: '云南省', lat: 25.0406, lon: 102.7123, level: 'province' },
    { name: '西藏自治区', display_name: '西藏自治区', lat: 29.6500, lon: 91.1000, level: 'province' },
    { name: '陕西省', display_name: '陕西省', lat: 34.2656, lon: 108.9542, level: 'province' },
    { name: '甘肃省', display_name: '甘肃省', lat: 36.0611, lon: 103.8343, level: 'province' },
    { name: '青海省', display_name: '青海省', lat: 36.6171, lon: 101.7782, level: 'province' },
    { name: '宁夏回族自治区', display_name: '宁夏回族自治区', lat: 38.4872, lon: 106.2309, level: 'province' },
    { name: '新疆维吾尔自治区', display_name: '新疆维吾尔自治区', lat: 43.7930, lon: 87.6270, level: 'province' },
    { name: '台湾省', display_name: '台湾省', lat: 25.0330, lon: 121.5654, level: 'province' },
    { name: '香港特别行政区', display_name: '香港特别行政区', lat: 22.3193, lon: 114.1694, level: 'province' },
    { name: '澳门特别行政区', display_name: '澳门特别行政区', lat: 22.1987, lon: 113.5439, level: 'province' }
  ]

  const cityData = [
    // 北京市
    { name: '东城区', display_name: '北京市东城区', lat: 39.9286, lon: 116.4167 },
    { name: '西城区', display_name: '北京市西城区', lat: 39.9153, lon: 116.3668 },
    { name: '朝阳区', display_name: '北京市朝阳区', lat: 39.9214, lon: 116.4500 },
    { name: '丰台区', display_name: '北京市丰台区', lat: 39.8586, lon: 116.2860 },
    { name: '石景山区', display_name: '北京市石景山区', lat: 39.9073, lon: 116.2223 },
    { name: '海淀区', display_name: '北京市海淀区', lat: 39.9561, lon: 116.3108 },
    { name: '门头沟区', display_name: '北京市门头沟区', lat: 39.9367, lon: 116.1014 },
    { name: '房山区', display_name: '北京市房山区', lat: 39.7420, lon: 115.8930 },
    { name: '通州区', display_name: '北京市通州区', lat: 39.9075, lon: 116.6565 },
    { name: '顺义区', display_name: '北京市顺义区', lat: 40.1285, lon: 116.6537 },
    { name: '昌平区', display_name: '北京市昌平区', lat: 40.2181, lon: 116.2354 },
    { name: '大兴区', display_name: '北京市大兴区', lat: 39.7289, lon: 116.3417 },
    { name: '怀柔区', display_name: '北京市怀柔区', lat: 40.3240, lon: 116.6566 },
    { name: '平谷区', display_name: '北京市平谷区', lat: 40.1408, lon: 117.1124 },
    { name: '密云区', display_name: '北京市密云区', lat: 40.3774, lon: 116.8433 },
    { name: '延庆区', display_name: '北京市延庆区', lat: 40.4630, lon: 115.9747 },
    // 上海市
    { name: '黄浦区', display_name: '上海市黄浦区', lat: 31.2223, lon: 121.4901 },
    { name: '徐汇区', display_name: '上海市徐汇区', lat: 31.1885, lon: 121.4370 },
    { name: '长宁区', display_name: '上海市长宁区', lat: 31.2209, lon: 121.4246 },
    { name: '静安区', display_name: '上海市静安区', lat: 31.2304, lon: 121.4617 },
    { name: '普陀区', display_name: '上海市普陀区', lat: 31.2415, lon: 121.3965 },
    { name: '虹口区', display_name: '上海市虹口区', lat: 31.2611, lon: 121.5096 },
    { name: '杨浦区', display_name: '上海市杨浦区', lat: 31.2599, lon: 121.5254 },
    { name: '闵行区', display_name: '上海市闵行区', lat: 31.1120, lon: 121.3759 },
    { name: '宝山区', display_name: '上海市宝山区', lat: 31.4053, lon: 121.4894 },
    { name: '嘉定区', display_name: '上海市嘉定区', lat: 31.3810, lon: 121.2656 },
    { name: '浦东新区', display_name: '上海市浦东新区', lat: 31.2304, lon: 121.5437 },
    { name: '金山区', display_name: '上海市金山区', lat: 30.7427, lon: 121.3410 },
    { name: '松江区', display_name: '上海市松江区', lat: 31.0307, lon: 121.2265 },
    { name: '青浦区', display_name: '上海市青浦区', lat: 31.1510, lon: 121.1242 },
    { name: '奉贤区', display_name: '上海市奉贤区', lat: 30.9124, lon: 121.4741 },
    { name: '崇明区', display_name: '上海市崇明区', lat: 31.6229, lon: 121.3976 },
    // 广东省 - 广州市
    { name: '荔湾区', display_name: '广州市荔湾区', lat: 23.1288, lon: 113.2430 },
    { name: '越秀区', display_name: '广州市越秀区', lat: 23.1296, lon: 113.2644 },
    { name: '海珠区', display_name: '广州市海珠区', lat: 23.0833, lon: 113.3170 },
    { name: '天河区', display_name: '广州市天河区', lat: 23.1187, lon: 113.3616 },
    { name: '白云区', display_name: '广州市白云区', lat: 23.1623, lon: 113.2620 },
    { name: '黄埔区', display_name: '广州市黄埔区', lat: 23.1033, lon: 113.4508 },
    { name: '番禺区', display_name: '广州市番禺区', lat: 22.9133, lon: 113.3631 },
    { name: '花都区', display_name: '广州市花都区', lat: 23.3922, lon: 113.2208 },
    { name: '南沙区', display_name: '广州市南沙区', lat: 22.8017, lon: 113.5246 },
    { name: '从化区', display_name: '广州市从化区', lat: 23.5459, lon: 113.5817 },
    { name: '增城区', display_name: '广州市增城区', lat: 23.2658, lon: 113.8283 },
    // 广东省 - 深圳市
    { name: '罗湖区', display_name: '深圳市罗湖区', lat: 22.5480, lon: 114.1290 },
    { name: '福田区', display_name: '深圳市福田区', lat: 22.5431, lon: 114.0629 },
    { name: '南山区', display_name: '深圳市南山区', lat: 22.5313, lon: 113.9295 },
    { name: '宝安区', display_name: '深圳市宝安区', lat: 22.5540, lon: 113.8833 },
    { name: '龙岗区', display_name: '深圳市龙岗区', lat: 22.7218, lon: 114.2518 },
    { name: '盐田区', display_name: '深圳市盐田区', lat: 22.5578, lon: 114.2361 },
    { name: '龙华区', display_name: '深圳市龙华区', lat: 22.7013, lon: 114.0453 },
    { name: '坪山区', display_name: '深圳市坪山区', lat: 22.6892, lon: 114.3494 },
    { name: '光明区', display_name: '深圳市光明区', lat: 22.7847, lon: 113.9292 },
    // 浙江省 - 杭州市
    { name: '上城区', display_name: '杭州市上城区', lat: 30.2486, lon: 120.1690 },
    { name: '下城区', display_name: '杭州市下城区', lat: 30.2918, lon: 120.1752 },
    { name: '西湖区', display_name: '杭州市西湖区', lat: 30.2596, lon: 120.1303 },
    { name: '拱墅区', display_name: '杭州市拱墅区', lat: 30.3193, lon: 120.1290 },
    { name: '滨江区', display_name: '杭州市滨江区', lat: 30.2086, lon: 120.2106 },
    { name: '萧山区', display_name: '杭州市萧山区', lat: 30.1600, lon: 120.2550 },
    { name: '余杭区', display_name: '杭州市余杭区', lat: 30.2966, lon: 119.9968 },
    { name: '富阳区', display_name: '杭州市富阳区', lat: 30.0475, lon: 119.9550 },
    { name: '临安区', display_name: '杭州市临安区', lat: 30.2330, lon: 119.7250 },
    { name: '桐庐县', display_name: '杭州市桐庐县', lat: 29.7977, lon: 119.6837 },
    { name: '淳安县', display_name: '杭州市淳安县', lat: 29.6050, lon: 118.8897 },
    // 四川省 - 成都市
    { name: '锦江区', display_name: '成都市锦江区', lat: 30.6302, lon: 104.0833 },
    { name: '青羊区', display_name: '成都市青羊区', lat: 30.6858, lon: 104.0556 },
    { name: '金牛区', display_name: '成都市金牛区', lat: 30.6918, lon: 104.0438 },
    { name: '武侯区', display_name: '成都市武侯区', lat: 30.6429, lon: 104.0433 },
    { name: '成华区', display_name: '成都市成华区', lat: 30.6608, lon: 104.1036 },
    { name: '龙泉驿区', display_name: '成都市龙泉驿区', lat: 30.5706, lon: 104.2697 },
    { name: '青白江区', display_name: '成都市青白江区', lat: 30.8852, lon: 104.2530 },
    { name: '新都区', display_name: '成都市新都区', lat: 30.8242, lon: 104.1573 },
    { name: '温江区', display_name: '成都市温江区', lat: 30.6800, lon: 103.8418 },
    { name: '双流区', display_name: '成都市双流区', lat: 30.4242, lon: 103.9237 },
    { name: '郫都区', display_name: '成都市郫都区', lat: 30.7958, lon: 103.8863 },
    { name: '金堂县', display_name: '成都市金堂县', lat: 30.2863, lon: 104.4113 },
    { name: '大邑县', display_name: '成都市大邑县', lat: 30.5058, lon: 103.5223 },
    { name: '蒲江县', display_name: '成都市蒲江县', lat: 30.1922, lon: 103.5086 },
    { name: '新津区', display_name: '成都市新津区', lat: 30.4117, lon: 103.8183 },
    { name: '都江堰市', display_name: '成都市都江堰市', lat: 30.9897, lon: 103.6380 },
    { name: '彭州市', display_name: '成都市彭州市', lat: 30.9877, lon: 103.9410 },
    { name: '邛崃市', display_name: '成都市邛崃市', lat: 30.4100, lon: 103.4610 },
    { name: '崇州市', display_name: '成都市崇州市', lat: 30.6318, lon: 103.6713 },
    { name: '简阳市', display_name: '成都市简阳市', lat: 30.3787, lon: 104.5477 },
    // 江苏省 - 南京市
    { name: '玄武区', display_name: '南京市玄武区', lat: 32.0603, lon: 118.7969 },
    { name: '秦淮区', display_name: '南京市秦淮区', lat: 32.0044, lon: 118.7894 },
    { name: '建邺区', display_name: '南京市建邺区', lat: 32.0043, lon: 118.7180 },
    { name: '鼓楼区', display_name: '南京市鼓楼区', lat: 32.0660, lon: 118.7690 },
    { name: '浦口区', display_name: '南京市浦口区', lat: 32.0593, lon: 118.6283 },
    { name: '栖霞区', display_name: '南京市栖霞区', lat: 32.1176, lon: 118.8853 },
    { name: '雨花台区', display_name: '南京市雨花台区', lat: 31.9912, lon: 118.7798 },
    { name: '江宁区', display_name: '南京市江宁区', lat: 31.9559, lon: 118.8620 },
    { name: '六合区', display_name: '南京市六合区', lat: 32.3433, lon: 118.8300 },
    { name: '溧水区', display_name: '南京市溧水区', lat: 31.6510, lon: 119.0280 },
    { name: '高淳区', display_name: '南京市高淳区', lat: 31.3270, lon: 118.8770 },
    // 江苏省 - 苏州市
    { name: '虎丘区', display_name: '苏州市虎丘区', lat: 31.2990, lon: 120.4344 },
    { name: '吴中区', display_name: '苏州市吴中区', lat: 31.2628, lon: 120.4556 },
    { name: '相城区', display_name: '苏州市相城区', lat: 31.4175, lon: 120.6422 },
    { name: '姑苏区', display_name: '苏州市姑苏区', lat: 31.3232, lon: 120.6019 },
    { name: '吴江区', display_name: '苏州市吴江区', lat: 31.1438, lon: 120.6420 },
    { name: '常熟市', display_name: '苏州市常熟市', lat: 31.6538, lon: 120.7528 },
    { name: '张家港市', display_name: '苏州市张家港市', lat: 31.8756, lon: 120.5547 },
    { name: '昆山市', display_name: '苏州市昆山市', lat: 31.3846, lon: 120.9580 },
    { name: '太仓市', display_name: '苏州市太仓市', lat: 31.4577, lon: 121.1306 },
    // 湖北省 - 武汉市
    { name: '江岸区', display_name: '武汉市江岸区', lat: 30.6054, lon: 114.3055 },
    { name: '江汉区', display_name: '武汉市江汉区', lat: 30.6018, lon: 114.2712 },
    { name: '硚口区', display_name: '武汉市硚口区', lat: 30.5924, lon: 114.2684 },
    { name: '汉阳区', display_name: '武汉市汉阳区', lat: 30.5498, lon: 114.2036 },
    { name: '武昌区', display_name: '武汉市武昌区', lat: 30.5482, lon: 114.3155 },
    { name: '青山区', display_name: '武汉市青山区', lat: 30.6364, lon: 114.3996 },
    { name: '洪山区', display_name: '武汉市洪山区', lat: 30.5008, lon: 114.3057 },
    { name: '东西湖区', display_name: '武汉市东西湖区', lat: 30.6195, lon: 114.0330 },
    { name: '汉南区', display_name: '武汉市汉南区', lat: 30.3088, lon: 114.0847 },
    { name: '蔡甸区', display_name: '武汉市蔡甸区', lat: 30.5820, lon: 113.9620 },
    { name: '江夏区', display_name: '武汉市江夏区', lat: 30.3494, lon: 114.3136 },
    { name: '黄陂区', display_name: '武汉市黄陂区', lat: 30.8843, lon: 114.3767 },
    { name: '新洲区', display_name: '武汉市新洲区', lat: 30.7922, lon: 114.7947 },
    // 山东省 - 青岛市
    { name: '市南区', display_name: '青岛市市南区', lat: 36.0660, lon: 120.3929 },
    { name: '市北区', display_name: '青岛市市北区', lat: 36.0878, lon: 120.3620 },
    { name: '黄岛区', display_name: '青岛市黄岛区', lat: 35.8693, lon: 120.1840 },
    { name: '崂山区', display_name: '青岛市崂山区', lat: 36.1078, lon: 120.4633 },
    { name: '李沧区', display_name: '青岛市李沧区', lat: 36.1428, lon: 120.4296 },
    { name: '城阳区', display_name: '青岛市城阳区', lat: 36.3072, lon: 120.3926 },
    { name: '胶州市', display_name: '青岛市胶州市', lat: 36.2837, lon: 120.0336 },
    { name: '即墨区', display_name: '青岛市即墨区', lat: 36.3907, lon: 120.4470 },
    { name: '平度市', display_name: '青岛市平度市', lat: 36.7863, lon: 119.9653 },
    { name: '莱西市', display_name: '青岛市莱西市', lat: 36.8858, lon: 120.5170 },
    // 陕西省 - 西安市
    { name: '新城区', display_name: '西安市新城区', lat: 34.2653, lon: 108.9542 },
    { name: '碑林区', display_name: '西安市碑林区', lat: 34.2405, lon: 108.9403 },
    { name: '莲湖区', display_name: '西安市莲湖区', lat: 34.2660, lon: 108.9293 },
    { name: '灞桥区', display_name: '西安市灞桥区', lat: 34.2758, lon: 109.0603 },
    { name: '未央区', display_name: '西安市未央区', lat: 34.2908, lon: 108.9383 },
    { name: '雁塔区', display_name: '西安市雁塔区', lat: 34.2133, lon: 108.9453 },
    { name: '阎良区', display_name: '西安市阎良区', lat: 34.6538, lon: 109.2283 },
    { name: '临潼区', display_name: '西安市临潼区', lat: 34.3660, lon: 109.2200 },
    { name: '长安区', display_name: '西安市长安区', lat: 34.0870, lon: 108.9390 },
    { name: '高陵区', display_name: '西安市高陵区', lat: 34.5330, lon: 109.0880 },
    { name: '鄠邑区', display_name: '西安市鄠邑区', lat: 34.1080, lon: 108.6030 },
    { name: '蓝田县', display_name: '西安市蓝田县', lat: 34.1520, lon: 109.3250 },
    { name: '周至县', display_name: '西安市周至县', lat: 34.0620, lon: 108.2000 },
    // 河南省 - 郑州市
    { name: '中原区', display_name: '郑州市中原区', lat: 34.7466, lon: 113.5230 },
    { name: '二七区', display_name: '郑州市二七区', lat: 34.7388, lon: 113.6320 },
    { name: '管城回族区', display_name: '郑州市管城回族区', lat: 34.7510, lon: 113.6730 },
    { name: '金水区', display_name: '郑州市金水区', lat: 34.8000, lon: 113.6170 },
    { name: '上街区', display_name: '郑州市上街区', lat: 34.8170, lon: 113.3080 },
    { name: '惠济区', display_name: '郑州市惠济区', lat: 34.8670, lon: 113.6170 },
    { name: '中牟县', display_name: '郑州市中牟县', lat: 34.7170, lon: 113.9750 },
    { name: '巩义市', display_name: '郑州市巩义市', lat: 34.7680, lon: 112.9830 },
    { name: '荥阳市', display_name: '郑州市荥阳市', lat: 34.7870, lon: 113.3830 },
    { name: '新密市', display_name: '郑州市新密市', lat: 34.5390, lon: 113.3920 },
    { name: '新郑市', display_name: '郑州市新郑市', lat: 34.3960, lon: 113.7390 },
    { name: '登封市', display_name: '郑州市登封市', lat: 34.4530, lon: 113.0500 },
    // 重庆市
    { name: '万州区', display_name: '重庆市万州区', lat: 30.8078, lon: 108.4087 },
    { name: '渝中区', display_name: '重庆市渝中区', lat: 29.5517, lon: 106.5625 },
    { name: '江北区', display_name: '重庆市江北区', lat: 29.6080, lon: 106.5743 },
    { name: '沙坪坝区', display_name: '重庆市沙坪坝区', lat: 29.5422, lon: 106.4572 },
    { name: '九龙坡区', display_name: '重庆市九龙坡区', lat: 29.5037, lon: 106.4807 },
    { name: '南岸区', display_name: '重庆市南岸区', lat: 29.5360, lon: 106.6440 },
    { name: '北碚区', display_name: '重庆市北碚区', lat: 29.8250, lon: 106.3900 },
    { name: '渝北区', display_name: '重庆市渝北区', lat: 29.7183, lon: 106.6333 },
    { name: '巴南区', display_name: '重庆市巴南区', lat: 29.4030, lon: 106.5190 },
    { name: '涪陵区', display_name: '重庆市涪陵区', lat: 29.7030, lon: 107.3940 },
    { name: '长寿区', display_name: '重庆市长寿区', lat: 29.8570, lon: 107.0810 },
    { name: '璧山区', display_name: '重庆市璧山区', lat: 29.5930, lon: 106.2270 },
    { name: '开州区', display_name: '重庆市开州区', lat: 31.1600, lon: 108.3930 },
    { name: '梁平区', display_name: '重庆市梁平区', lat: 30.6720, lon: 107.8000 },
    { name: '云阳县', display_name: '重庆市云阳县', lat: 30.9890, lon: 108.6970 },
    // 省级城市（直辖市和特别行政区）
    { name: '深圳市', display_name: '深圳市', lat: 22.5431, lon: 114.0629 },
    { name: '成都市', display_name: '成都市', lat: 30.5728, lon: 104.0668 },
    { name: '杭州市', display_name: '杭州市', lat: 30.2873, lon: 120.1536 },
    { name: '广州市', display_name: '广州市', lat: 23.1291, lon: 113.2644 },
    { name: '南京市', display_name: '南京市', lat: 32.0603, lon: 118.7969 },
    { name: '武汉市', display_name: '武汉市', lat: 30.5928, lon: 114.3055 },
    { name: '西安市', display_name: '西安市', lat: 34.2656, lon: 108.9542 },
    { name: '青岛市', display_name: '青岛市', lat: 36.0671, lon: 120.3826 },
    { name: '郑州市', display_name: '郑州市', lat: 34.7466, lon: 113.5230 },
    { name: '苏州市', display_name: '苏州市', lat: 31.2990, lon: 120.4344 },
  ]

  // 插入省份
  const provinceMap = {}
  provinces.forEach(p => {
    db.run("INSERT INTO cities (name, display_name, level, lat, lon, country) VALUES (?, ?, ?, ?, ?, ?)",
      [p.name, p.display_name, p.level, p.lat, p.lon, p.country || '中国'])
    const result = db.exec("SELECT last_insert_rowid()")
    provinceMap[p.name] = result[0]?.values[0][0]
  })

  // 插入城市和区县
  cityData.forEach(c => {
    db.run("INSERT INTO cities (name, display_name, level, lat, lon, country) VALUES (?, ?, ?, ?, ?, ?)",
      [c.name, c.display_name, 'district', c.lat, c.lon, '中国'])
  })
}

function saveDatabase() {
  if (!db) return
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'project-manager.db')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const isDev = !fs.existsSync(path.join(__dirname, '../dist/index.html'))
  if (isDev) {
    const http = require('http')
    const checkPort = (port, callback) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        callback(port)
      })
      req.on('error', () => {
        if (port < 5300) checkPort(port + 1, callback)
      })
      req.setTimeout(200, () => { req.destroy(); if (port < 5300) checkPort(port + 1, callback) })
    }
    checkPort(5173, (availablePort) => {
      mainWindow.loadURL(`http://localhost:${availablePort}`)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  saveDatabase()
})

// Window control handlers
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.handle('window:toggleMaximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('window:toggleFullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
  }
})

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close()
})

// Helper to convert sql.js result to array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function runQuery(sql, params = []) {
  db.run(sql, params)
  saveDatabase()
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] }
}

// Projects
ipcMain.handle('db:projects:getAll', () => {
  const projects = queryAll(`
    SELECT p.*, c.display_name as city_name, c.lat, c.lon
    FROM projects p
    LEFT JOIN cities c ON p.city_id = c.id
    ORDER BY p.created_at DESC
  `)

  // Add task progress and budget info to each project
  projects.forEach(project => {
    // Task progress
    const tasks = queryAll(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) as completed
      FROM project_tasks
      WHERE project_id = ?
    `, [project.id])
    const totalTasks = tasks[0]?.total || 0
    const completedTasks = tasks[0]?.completed || 0
    project.total_tasks = totalTasks
    project.completed_tasks = completedTasks
    project.task_progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Budget info
    const budgets = queryAll(`
      SELECT COALESCE(SUM(amount), 0) as total_budget
      FROM project_budgets
      WHERE project_id = ?
    `, [project.id])
    project.total_budget = budgets[0]?.total_budget || 0
  })

  return projects
})

ipcMain.handle('db:projects:create', (_, data) => {
  return runQuery('INSERT INTO projects (name, code, city_id, location, status, manager, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [data.name, data.code, data.city_id || null, data.location || '', data.status || '进行中', data.manager || '', data.start_date || null, data.end_date || null])
})

ipcMain.handle('db:projects:update', (_, data) => {
  runQuery('UPDATE projects SET name = ?, code = ?, city_id = ?, location = ?, status = ?, manager = ?, start_date = ?, end_date = ? WHERE id = ?',
    [data.name, data.code, data.city_id || null, data.location || '', data.status, data.manager || '', data.start_date || null, data.end_date || null, data.id])
  return data
})

ipcMain.handle('db:projects:delete', (_, id) => {
  runQuery('DELETE FROM projects WHERE id = ?', [id])
  return { success: true }
})

// Contracts
ipcMain.handle('db:contracts:getAll', () => {
  // Get contracts with payment progress
  const contracts = queryAll(`
    SELECT c.*, p.name as project_name
    FROM contracts c
    LEFT JOIN projects p ON c.project_id = p.id
    ORDER BY c.created_at DESC
  `)

  // Get payment amounts for each contract
  contracts.forEach(contract => {
    const payments = queryAll(`
      SELECT COALESCE(SUM(pay.amount), 0) as paid_amount
      FROM payments pay
      JOIN invoices inv ON pay.invoice_id = inv.id
      WHERE inv.contract_id = ?
    `, [contract.id])
    contract.paid_amount = payments[0]?.paid_amount || 0
    contract.payment_status = contract.paid_amount >= contract.amount ? '已收款' :
      contract.paid_amount > 0 ? '部分收款' : '未收款'
  })

  return contracts
})

ipcMain.handle('db:contracts:create', (_, data) => {
  return runQuery('INSERT INTO contracts (project_id, code, name, contract_type, amount, signed_date) VALUES (?, ?, ?, ?, ?, ?)',
    [data.project_id, data.code || '', data.name, data.contract_type || '销售合同', data.amount, data.signed_date])
})

ipcMain.handle('db:contracts:update', (_, data) => {
  runQuery('UPDATE contracts SET project_id = ?, code = ?, name = ?, contract_type = ?, amount = ?, signed_date = ? WHERE id = ?',
    [data.project_id, data.code || '', data.name, data.contract_type, data.amount, data.signed_date, data.id])
  return data
})

ipcMain.handle('db:contracts:delete', (_, id) => {
  runQuery('DELETE FROM contracts WHERE id = ?', [id])
  return { success: true }
})

// Invoices
ipcMain.handle('db:invoices:getAll', () => {
  const invoices = queryAll(`
    SELECT i.*, c.name as contract_name, c.project_id
    FROM invoices i
    LEFT JOIN contracts c ON i.contract_id = c.id
    ORDER BY i.created_at DESC
  `)

  // Add payment status to each invoice
  invoices.forEach(invoice => {
    const payments = queryAll(`
      SELECT COALESCE(SUM(amount), 0) as paid_amount
      FROM payments
      WHERE invoice_id = ?
    `, [invoice.id])
    const paidAmount = payments[0]?.paid_amount || 0
    invoice.paid_amount = paidAmount
    invoice.payment_status = paidAmount >= invoice.amount ? '已收款' :
      paidAmount > 0 ? '部分收款' : '未收款'
  })

  return invoices
})

ipcMain.handle('db:invoices:create', (_, data) => {
  return runQuery('INSERT INTO invoices (contract_id, invoice_no, amount, date) VALUES (?, ?, ?, ?)',
    [data.contract_id, data.invoice_no, data.amount, data.date])
})

ipcMain.handle('db:invoices:update', (_, data) => {
  runQuery('UPDATE invoices SET contract_id = ?, invoice_no = ?, amount = ?, date = ? WHERE id = ?',
    [data.contract_id, data.invoice_no, data.amount, data.date, data.id])
  return data
})

ipcMain.handle('db:invoices:delete', (_, id) => {
  runQuery('DELETE FROM invoices WHERE id = ?', [id])
  return { success: true }
})

// Payments
ipcMain.handle('db:payments:getAll', () => {
  return queryAll(`
    SELECT p.*, i.invoice_no
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    ORDER BY p.created_at DESC
  `)
})

ipcMain.handle('db:payments:create', (_, data) => {
  return runQuery('INSERT INTO payments (invoice_id, amount, date, receipt_no) VALUES (?, ?, ?, ?)',
    [data.invoice_id, data.amount, data.date, data.receipt_no])
})

ipcMain.handle('db:payments:update', (_, data) => {
  runQuery('UPDATE payments SET invoice_id = ?, amount = ?, date = ?, receipt_no = ? WHERE id = ?',
    [data.invoice_id, data.amount, data.date, data.receipt_no, data.id])
  return data
})

ipcMain.handle('db:payments:delete', (_, id) => {
  runQuery('DELETE FROM payments WHERE id = ?', [id])
  return { success: true }
})

// Acceptances
ipcMain.handle('db:acceptances:getAll', () => {
  return queryAll(`
    SELECT a.*, p.name as project_name, t.name as task_name
    FROM acceptances a
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN project_tasks t ON a.task_id = t.id
    ORDER BY a.created_at DESC
  `)
})

ipcMain.handle('db:acceptances:create', (_, data) => {
  return runQuery('INSERT INTO acceptances (project_id, task_id, name, status, date) VALUES (?, ?, ?, ?, ?)',
    [data.project_id, data.task_id || null, data.name, data.status || '待验收', data.date])
})

ipcMain.handle('db:acceptances:update', (_, data) => {
  runQuery('UPDATE acceptances SET project_id = ?, task_id = ?, name = ?, status = ?, date = ? WHERE id = ?',
    [data.project_id, data.task_id || null, data.name, data.status, data.date, data.id])
  return data
})

ipcMain.handle('db:acceptances:delete', (_, id) => {
  runQuery('DELETE FROM acceptances WHERE id = ?', [id])
  return { success: true }
})

// Project Budgets
ipcMain.handle('db:budgets:getAll', () => {
  return queryAll(`
    SELECT b.*, p.name as project_name
    FROM project_budgets b
    LEFT JOIN projects p ON b.project_id = p.id
    ORDER BY b.created_at DESC
  `)
})

ipcMain.handle('db:budgets:getByProject', (_, projectId) => {
  return queryAll(`
    SELECT b.*, p.name as project_name
    FROM project_budgets b
    LEFT JOIN projects p ON b.project_id = p.id
    WHERE b.project_id = ?
    ORDER BY b.created_at DESC
  `, [projectId])
})

ipcMain.handle('db:budgets:create', (_, data) => {
  return runQuery('INSERT INTO project_budgets (project_id, category, amount, description) VALUES (?, ?, ?, ?)',
    [data.project_id, data.category, data.amount, data.description || ''])
})

ipcMain.handle('db:budgets:update', (_, data) => {
  runQuery('UPDATE project_budgets SET project_id = ?, category = ?, amount = ?, description = ? WHERE id = ?',
    [data.project_id, data.category, data.amount, data.description, data.id])
  return data
})

ipcMain.handle('db:budgets:delete', (_, id) => {
  runQuery('DELETE FROM project_budgets WHERE id = ?', [id])
  return { success: true }
})

// Project Tasks
ipcMain.handle('db:tasks:getAll', () => {
  return queryAll(`
    SELECT t.*, p.name as project_name
    FROM project_tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    ORDER BY t.created_at DESC
  `)
})

ipcMain.handle('db:tasks:getByProject', (_, projectId) => {
  return queryAll(`
    SELECT t.*, p.name as project_name
    FROM project_tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `, [projectId])
})

ipcMain.handle('db:tasks:create', (_, data) => {
  return runQuery('INSERT INTO project_tasks (project_id, name, status, due_date) VALUES (?, ?, ?, ?)',
    [data.project_id, data.name, data.status || '待开始', data.due_date || null])
})

ipcMain.handle('db:tasks:update', (_, data) => {
  const completed_at = data.status === '已完成' ? new Date().toISOString() : null
  runQuery('UPDATE project_tasks SET project_id = ?, name = ?, status = ?, due_date = ?, completed_at = ? WHERE id = ?',
    [data.project_id, data.name, data.status, data.due_date, completed_at, data.id])
  return data
})

ipcMain.handle('db:tasks:delete', (_, id) => {
  runQuery('DELETE FROM project_tasks WHERE id = ?', [id])
  return { success: true }
})

// People
ipcMain.handle('db:people:getAll', () => {
  return queryAll('SELECT * FROM people ORDER BY created_at DESC')
})

ipcMain.handle('db:people:create', (_, data) => {
  return runQuery('INSERT INTO people (name, position, phone, email) VALUES (?, ?, ?, ?)',
    [data.name, data.position, data.phone, data.email])
})

ipcMain.handle('db:people:update', (_, data) => {
  runQuery('UPDATE people SET name = ?, position = ?, phone = ?, email = ? WHERE id = ?',
    [data.name, data.position, data.phone, data.email, data.id])
  return data
})

ipcMain.handle('db:people:delete', (_, id) => {
  runQuery('DELETE FROM people WHERE id = ?', [id])
  return { success: true }
})

// Cities
ipcMain.handle('db:cities:getAll', () => {
  return queryAll('SELECT * FROM cities ORDER BY level, name')
})

ipcMain.handle('db:cities:search', (_, keyword) => {
  return queryAll('SELECT * FROM cities WHERE name LIKE ? OR display_name LIKE ? ORDER BY level, name LIMIT 50',
    [`%${keyword}%`, `%${keyword}%`])
})

ipcMain.handle('db:cities:getById', (_, id) => {
  const result = queryAll('SELECT * FROM cities WHERE id = ?', [id])
  return result.length > 0 ? result[0] : null
})
