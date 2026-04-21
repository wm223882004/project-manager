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
  deletePerson: (id) => ipcRenderer.invoke('db:people:delete', id)
})
