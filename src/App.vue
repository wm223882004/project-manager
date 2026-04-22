<template>
  <div class="app">
    <Earth3D ref="earthRef" class="earth-layer" :projects="projects" @showProject="handleShowProject" />

    <Sidebar
      :activeModule="activeModule"
      :sidebarWidth="sidebarWidth"
      :viewProject="viewProjectData"
      @select="selectModule"
      @update:sidebarWidth="sidebarWidth = $event"
      @action="handleAction"
      @view="handleViewProject"
    />

    <Dashboard
      v-if="activeModule === 'dashboard'"
      ref="dashboardRef"
      class="dashboard-layer"
      @selectProject="handleShowProject"
      @viewAll="selectModule('projects')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Earth3D from './components/Earth3D.vue'
import Sidebar from './components/Sidebar.vue'
import Dashboard from './components/Dashboard.vue'

const earthRef = ref(null)
const dashboardRef = ref(null)
const activeModule = ref(null)
const sidebarWidth = ref(200)
const viewProjectData = ref(null)
const projects = ref([])

const loadProjects = async () => {
  try {
    projects.value = await window.electronAPI.getProjects()
    // Trigger Earth3D to update markers
    if (earthRef.value) {
      earthRef.value.forceUpdateMarkers && earthRef.value.forceUpdateMarkers()
    }
  } catch (err) {
    console.error('Failed to load projects:', err)
  }
}

const selectModule = (module) => {
  activeModule.value = module
}

const handleAction = async (payload) => {
  const { type, module, data } = payload
  const api = window.electronAPI
  try {
    if (module === 'projects') {
      if (type === 'add') await api.createProject(data)
      else if (type === 'edit') await api.updateProject(data)
      else if (type === 'delete') await api.deleteProject(data.id)
    } else if (module === 'contracts') {
      if (type === 'add') await api.createContract(data)
      else if (type === 'edit') await api.updateContract(data)
      else if (type === 'delete') await api.deleteContract(data.id)
    } else if (module === 'invoices') {
      if (type === 'add') await api.createInvoice(data)
      else if (type === 'edit') await api.updateInvoice(data)
      else if (type === 'delete') await api.deleteInvoice(data.id)
    } else if (module === 'payments') {
      if (type === 'add') await api.createPayment(data)
      else if (type === 'edit') await api.updatePayment(data)
      else if (type === 'delete') await api.deletePayment(data.id)
    } else if (module === 'acceptances') {
      if (type === 'add') await api.createAcceptance(data)
      else if (type === 'edit') await api.updateAcceptance(data)
      else if (type === 'delete') await api.deleteAcceptance(data.id)
    } else if (module === 'people') {
      if (type === 'add') await api.createPerson(data)
      else if (type === 'edit') await api.updatePerson(data)
      else if (type === 'delete') await api.deletePerson(data.id)
    } else if (module === 'budgets') {
      if (type === 'add') await api.createBudget(data)
      else if (type === 'edit') await api.updateBudget(data)
      else if (type === 'delete') await api.deleteBudget(data.id)
    } else if (module === 'tasks') {
      if (type === 'add') await api.createTask(data)
      else if (type === 'edit') await api.updateTask(data)
      else if (type === 'delete') await api.deleteTask(data.id)
    } else if (module === 'management_fees') {
      if (type === 'add') await api.createManagementFee(data)
      else if (type === 'edit') await api.updateManagementFee(data)
      else if (type === 'delete') await api.deleteManagementFee(data.id)
    }
    // 刷新项目数据（合同/发票/任务/预算/费用等变化都会影响项目统计）
    await loadProjects()
    if (dashboardRef.value) {
      dashboardRef.value.refresh()
    }
  } catch (err) {
    console.error('Action failed:', err)
  }
}

const handleViewProject = (project) => {
  viewProjectData.value = project
  activeModule.value = 'projects'
}

const handleShowProject = (project) => {
  viewProjectData.value = project
  activeModule.value = 'projects'
}

onMounted(() => {
  loadProjects()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: #000;
  font-family: 'Microsoft YaHei', sans-serif;
}

.app {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
}

.earth-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.dashboard-layer {
  position: absolute;
  top: 0;
  left: 52px;
  right: 0;
  bottom: 0;
  z-index: 2;
  overflow-y: auto;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 217, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 217, 0.7);
}
</style>
