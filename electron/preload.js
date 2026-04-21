const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  close: () => ipcRenderer.invoke('window:close'),

  // Projects
  getProjects: () => ipcRenderer.invoke('db:projects:getAll'),
  createProject: (data) => ipcRenderer.invoke('db:projects:create', data),
  updateProject: (data) => ipcRenderer.invoke('db:projects:update', data),
  deleteProject: (id) => ipcRenderer.invoke('db:projects:delete', id),

  // Contracts
  getContracts: () => ipcRenderer.invoke('db:contracts:getAll'),
  createContract: (data) => ipcRenderer.invoke('db:contracts:create', data),
  updateContract: (data) => ipcRenderer.invoke('db:contracts:update', data),
  deleteContract: (id) => ipcRenderer.invoke('db:contracts:delete', id),

  // Invoices
  getInvoices: () => ipcRenderer.invoke('db:invoices:getAll'),
  createInvoice: (data) => ipcRenderer.invoke('db:invoices:create', data),
  updateInvoice: (data) => ipcRenderer.invoke('db:invoices:update', data),
  deleteInvoice: (id) => ipcRenderer.invoke('db:invoices:delete', id),

  // Payments
  getPayments: () => ipcRenderer.invoke('db:payments:getAll'),
  createPayment: (data) => ipcRenderer.invoke('db:payments:create', data),
  updatePayment: (data) => ipcRenderer.invoke('db:payments:update', data),
  deletePayment: (id) => ipcRenderer.invoke('db:payments:delete', id),

  // Acceptances
  getAcceptances: () => ipcRenderer.invoke('db:acceptances:getAll'),
  createAcceptance: (data) => ipcRenderer.invoke('db:acceptances:create', data),
  updateAcceptance: (data) => ipcRenderer.invoke('db:acceptances:update', data),
  deleteAcceptance: (id) => ipcRenderer.invoke('db:acceptances:delete', id),

  // People
  getPeople: () => ipcRenderer.invoke('db:people:getAll'),
  createPerson: (data) => ipcRenderer.invoke('db:people:create', data),
  updatePerson: (data) => ipcRenderer.invoke('db:people:update', data),
  deletePerson: (id) => ipcRenderer.invoke('db:people:delete', id),

  // Cities
  getCities: () => ipcRenderer.invoke('db:cities:getAll'),
  searchCities: (keyword) => ipcRenderer.invoke('db:cities:search', keyword),
  getCityById: (id) => ipcRenderer.invoke('db:cities:getById', id),

  // Project Budgets
  getBudgets: () => ipcRenderer.invoke('db:budgets:getAll'),
  getBudgetsByProject: (projectId) => ipcRenderer.invoke('db:budgets:getByProject', projectId),
  createBudget: (data) => ipcRenderer.invoke('db:budgets:create', data),
  updateBudget: (data) => ipcRenderer.invoke('db:budgets:update', data),
  deleteBudget: (id) => ipcRenderer.invoke('db:budgets:delete', id),

  // Project Tasks
  getTasks: () => ipcRenderer.invoke('db:tasks:getAll'),
  getTasksByProject: (projectId) => ipcRenderer.invoke('db:tasks:getByProject', projectId),
  createTask: (data) => ipcRenderer.invoke('db:tasks:create', data),
  updateTask: (data) => ipcRenderer.invoke('db:tasks:update', data),
  deleteTask: (id) => ipcRenderer.invoke('db:tasks:delete', id),

  // Management Fees
  getManagementFees: () => ipcRenderer.invoke('db:management_fees:getAll'),
  getManagementFeesByProject: (projectId) => ipcRenderer.invoke('db:management_fees:getByProject', projectId),
  createManagementFee: (data) => ipcRenderer.invoke('db:management_fees:create', data),
  updateManagementFee: (data) => ipcRenderer.invoke('db:management_fees:update', data),
  deleteManagementFee: (id) => ipcRenderer.invoke('db:management_fees:delete', id),

  // Clients
  getClients: () => ipcRenderer.invoke('db:clients:getAll'),
  getClientById: (id) => ipcRenderer.invoke('db:clients:getById', id),
  createClient: (data) => ipcRenderer.invoke('db:clients:create', data),
  updateClient: (data) => ipcRenderer.invoke('db:clients:update', data),
  deleteClient: (id) => ipcRenderer.invoke('db:clients:delete', id),

  // Project Income
  getProjectIncome: () => ipcRenderer.invoke('db:project_income:getAll'),
  getProjectIncomeByProject: (projectId) => ipcRenderer.invoke('db:project_income:getByProject', projectId),
  createProjectIncome: (data) => ipcRenderer.invoke('db:project_income:create', data),
  updateProjectIncome: (data) => ipcRenderer.invoke('db:project_income:update', data),
  deleteProjectIncome: (id) => ipcRenderer.invoke('db:project_income:delete', id),

  // Project Expense
  getProjectExpenses: () => ipcRenderer.invoke('db:project_expense:getAll'),
  getProjectExpensesByProject: (projectId) => ipcRenderer.invoke('db:project_expense:getByProject', projectId),
  createProjectExpense: (data) => ipcRenderer.invoke('db:project_expense:create', data),
  updateProjectExpense: (data) => ipcRenderer.invoke('db:project_expense:update', data),
  deleteProjectExpense: (id) => ipcRenderer.invoke('db:project_expense:delete', id)
})
