<template>
  <div class="app">
    <canvas ref="canvasRef" class="background-canvas"></canvas>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Earth3D from './components/Earth3D.vue'
import Sidebar from './components/Sidebar.vue'
import ProjectList from './components/ProjectList.vue'
import ContractList from './components/ContractList.vue'
import InvoiceList from './components/InvoiceList.vue'
import PaymentList from './components/PaymentList.vue'
import AcceptanceList from './components/AcceptanceList.vue'
import PeopleList from './components/PeopleList.vue'

const canvasRef = ref(null)
const earthRef = ref(null)
const activeModule = ref(null)
const sidebarWidth = ref(200)
const viewProjectData = ref(null)
const projects = ref([])

const modules = {
  projects: ProjectList,
  contracts: ContractList,
  invoices: InvoiceList,
  payments: PaymentList,
  acceptances: AcceptanceList,
  people: PeopleList
}

const currentModuleComponent = computed(() => modules[activeModule.value])

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
      else if (type === 'delete') { if (confirm('确定要删除此项目吗？')) await api.deleteProject(data.id) }
      await loadProjects()
    } else if (module === 'contracts') {
      if (type === 'add') await api.createContract(data)
      else if (type === 'edit') await api.updateContract(data)
      else if (type === 'delete') { if (confirm('确定要删除此合同吗？')) await api.deleteContract(data.id) }
    } else if (module === 'invoices') {
      if (type === 'add') await api.createInvoice(data)
      else if (type === 'edit') await api.updateInvoice(data)
      else if (type === 'delete') { if (confirm('确定要删除此发票吗？')) await api.deleteInvoice(data.id) }
    } else if (module === 'payments') {
      if (type === 'add') await api.createPayment(data)
      else if (type === 'edit') await api.updatePayment(data)
      else if (type === 'delete') { if (confirm('确定要删除此付款吗？')) await api.deletePayment(data.id) }
    } else if (module === 'acceptances') {
      if (type === 'add') await api.createAcceptance(data)
      else if (type === 'edit') await api.updateAcceptance(data)
      else if (type === 'delete') { if (confirm('确定要删除此验收吗？')) await api.deleteAcceptance(data.id) }
    } else if (module === 'people') {
      if (type === 'add') await api.createPerson(data)
      else if (type === 'edit') await api.updatePerson(data)
      else if (type === 'delete') { if (confirm('确定要删除此人员吗？')) await api.deletePerson(data.id) }
    } else if (module === 'budgets') {
      if (type === 'add') await api.createBudget(data)
      else if (type === 'edit') await api.updateBudget(data)
      else if (type === 'delete') { if (confirm('确定要删除此预算吗？')) await api.deleteBudget(data.id) }
    } else if (module === 'tasks') {
      if (type === 'add') await api.createTask(data)
      else if (type === 'edit') await api.updateTask(data)
      else if (type === 'delete') { if (confirm('确定要删除此任务吗？')) await api.deleteTask(data.id) }
    } else if (module === 'management_fees') {
      if (type === 'add') await api.createManagementFee(data)
      else if (type === 'edit') await api.updateManagementFee(data)
      else if (type === 'delete') { if (confirm('确定要删除此管理费用吗？')) await api.deleteManagementFee(data.id) }
    }
  } catch (err) {
    console.error('Action failed:', err)
  }
}

const handleModuleAction = (module) => {
  activeModule.value = module
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

.background-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.earth-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
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
