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
      location TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT '进行中',
      manager TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      contract_type TEXT DEFAULT '销售合同',
      amount REAL,
      signed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

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
      name TEXT,
      status TEXT DEFAULT '待验收',
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

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

  // 插入模拟数据
  seedData()

  saveDatabase()
}

function seedData() {
  // 检查是否已有数据
  const existingProjects = db.exec("SELECT COUNT(*) FROM projects")[0]
  if (existingProjects && existingProjects.values[0][0] > 0) return

  // 项目数据
  const projects = [
    { code: 'PRJ2024001', name: '北京大兴国际机场智慧园区项目', location: '中国 / 北京市 / 大兴区', start_date: '2024-01-15', end_date: '2025-06-30', status: '进行中', manager: '张伟' },
    { code: 'PRJ2024002', name: '上海自贸区数据中心建设', location: '中国 / 上海市 / 浦东新区', start_date: '2024-03-01', end_date: '2025-03-01', status: '进行中', manager: '李娜' },
    { code: 'PRJ2023001', name: '深圳地铁14号线智能化系统', location: '中国 / 广东省 / 深圳市', start_date: '2023-06-01', end_date: '2024-12-31', status: '已完成', manager: '王强' },
    { code: 'PRJ2024003', name: '成都天府国际机场配套工程', location: '中国 / 四川省 / 成都市', start_date: '2024-02-01', end_date: '2026-12-31', status: '已延期', manager: '刘洋' },
    { code: 'PRJ2024004', name: '杭州亚运会场馆智能化改造', location: '中国 / 浙江省 / 杭州市', start_date: '2024-04-01', end_date: '2025-08-31', status: '已暂停', manager: '陈明' }
  ]

  projects.forEach(p => {
    db.run("INSERT INTO projects (code, name, location, start_date, end_date, status, manager) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [p.code, p.name, p.location, p.start_date, p.end_date, p.status, p.manager])
  })

  // 合同数据
  const contracts = [
    { project_id: 1, name: '智慧园区系统采购合同', contract_type: '采购合同', amount: 28000000, signed_date: '2024-01-20' },
    { project_id: 1, name: '网络基础设施建设合同', contract_type: '采购合同', amount: 15000000, signed_date: '2024-02-15' },
    { project_id: 2, name: '数据中心设备采购合同', contract_type: '采购合同', amount: 45000000, signed_date: '2024-03-10' },
    { project_id: 3, name: '信号系统采购安装合同', contract_type: '采购合同', amount: 32000000, signed_date: '2023-06-15' },
    { project_id: 4, name: '机场配套设施建设合同', contract_type: '销售合同', amount: 68000000, signed_date: '2024-02-20' }
  ]

  contracts.forEach(c => {
    db.run("INSERT INTO contracts (project_id, name, contract_type, amount, signed_date) VALUES (?, ?, ?, ?, ?)",
      [c.project_id, c.name, c.contract_type || '销售合同', c.amount, c.signed_date])
  })

  // 发票数据
  const invoices = [
    { contract_id: 1, invoice_no: 'INV20240001', amount: 8000000, date: '2024-02-28' },
    { contract_id: 1, invoice_no: 'INV20240002', amount: 10000000, date: '2024-04-15' },
    { contract_id: 2, invoice_no: 'INV20240003', amount: 15000000, date: '2024-03-20' },
    { contract_id: 3, invoice_no: 'INV20240004', amount: 22000000, date: '2024-05-10' },
    { contract_id: 4, invoice_no: 'INV20230001', amount: 32000000, date: '2023-08-15' }
  ]

  invoices.forEach(i => {
    db.run("INSERT INTO invoices (contract_id, invoice_no, amount, date) VALUES (?, ?, ?, ?)",
      [i.contract_id, i.invoice_no, i.amount, i.date])
  })

  // 付款凭证数据
  const payments = [
    { invoice_id: 1, amount: 8000000, date: '2024-03-15', receipt_no: 'PAY20240315001' },
    { invoice_id: 2, amount: 10000000, date: '2024-05-20', receipt_no: 'PAY20240520001' },
    { invoice_id: 3, amount: 15000000, date: '2024-04-10', receipt_no: 'PAY20240410001' },
    { invoice_id: 4, amount: 22000000, date: '2024-06-05', receipt_no: 'PAY20240605001' },
    { invoice_id: 5, amount: 32000000, date: '2023-09-01', receipt_no: 'PAY20230901001' }
  ]

  payments.forEach(p => {
    db.run("INSERT INTO payments (invoice_id, amount, date, receipt_no) VALUES (?, ?, ?, ?)",
      [p.invoice_id, p.amount, p.date, p.receipt_no])
  })

  // 验收数据
  const acceptances = [
    { project_id: 1, name: '园区网络基础设施验收', status: '待验收', date: '2024-12-31' },
    { project_id: 2, name: '数据中心机房验收', status: '已验收', date: '2024-10-15' },
    { project_id: 3, name: '信号系统初步验收', status: '已验收', date: '2024-06-30' },
    { project_id: 4, name: '航站楼配套工程验收', status: '不通过', date: '2024-11-20' }
  ]

  acceptances.forEach(a => {
    db.run("INSERT INTO acceptances (project_id, name, status, date) VALUES (?, ?, ?, ?)",
      [a.project_id, a.name, a.status, a.date])
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
    { name: '周婷', position: '行政主管', phone: '13800138008', email: 'zhouting@company.com' }
  ]

  people.forEach(p => {
    db.run("INSERT INTO people (name, position, phone, email) VALUES (?, ?, ?, ?)",
      [p.name, p.position, p.phone, p.email])
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
  return queryAll('SELECT * FROM projects ORDER BY created_at DESC')
})

ipcMain.handle('db:projects:create', (_, data) => {
  return runQuery('INSERT INTO projects (name, code, status) VALUES (?, ?, ?)',
    [data.name, data.code, data.status || '进行中'])
})

ipcMain.handle('db:projects:update', (_, data) => {
  runQuery('UPDATE projects SET name = ?, code = ?, status = ? WHERE id = ?',
    [data.name, data.code, data.status, data.id])
  return data
})

ipcMain.handle('db:projects:delete', (_, id) => {
  runQuery('DELETE FROM projects WHERE id = ?', [id])
  return { success: true }
})

// Contracts
ipcMain.handle('db:contracts:getAll', () => {
  return queryAll(`
    SELECT c.*, p.name as project_name
    FROM contracts c
    LEFT JOIN projects p ON c.project_id = p.id
    ORDER BY c.created_at DESC
  `)
})

ipcMain.handle('db:contracts:create', (_, data) => {
  return runQuery('INSERT INTO contracts (project_id, name, contract_type, amount, signed_date) VALUES (?, ?, ?, ?, ?)',
    [data.project_id, data.name, data.contract_type || '销售合同', data.amount, data.signed_date])
})

ipcMain.handle('db:contracts:update', (_, data) => {
  runQuery('UPDATE contracts SET project_id = ?, name = ?, contract_type = ?, amount = ?, signed_date = ? WHERE id = ?',
    [data.project_id, data.name, data.contract_type, data.amount, data.signed_date, data.id])
  return data
})

ipcMain.handle('db:contracts:delete', (_, id) => {
  runQuery('DELETE FROM contracts WHERE id = ?', [id])
  return { success: true }
})

// Invoices
ipcMain.handle('db:invoices:getAll', () => {
  return queryAll(`
    SELECT i.*, c.name as contract_name
    FROM invoices i
    LEFT JOIN contracts c ON i.contract_id = c.id
    ORDER BY i.created_at DESC
  `)
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
    SELECT a.*, p.name as project_name
    FROM acceptances a
    LEFT JOIN projects p ON a.project_id = p.id
    ORDER BY a.created_at DESC
  `)
})

ipcMain.handle('db:acceptances:create', (_, data) => {
  return runQuery('INSERT INTO acceptances (project_id, name, status, date) VALUES (?, ?, ?, ?)',
    [data.project_id, data.name, data.status || '待验收', data.date])
})

ipcMain.handle('db:acceptances:update', (_, data) => {
  runQuery('UPDATE acceptances SET project_id = ?, name = ?, status = ?, date = ? WHERE id = ?',
    [data.project_id, data.name, data.status, data.date, data.id])
  return data
})

ipcMain.handle('db:acceptances:delete', (_, id) => {
  runQuery('DELETE FROM acceptances WHERE id = ?', [id])
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
