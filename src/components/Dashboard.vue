<template>
  <div class="dashboard">
    <!-- 统计卡片区 -->
    <div class="stat-cards">
      <div class="stat-card total" @click="handleStatClick('all')">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">项目总数</div>
        </div>
      </div>
      <div class="stat-card in-progress" @click="handleStatClick('inProgress')">
        <div class="stat-icon">🚀</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card completed" @click="handleStatClick('completed')">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card paused" @click="handleStatClick('paused')">
        <div class="stat-icon">⏸️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.paused }}</div>
          <div class="stat-label">已暂停</div>
        </div>
      </div>
      <div class="stat-card delayed" @click="handleStatClick('delayed')">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.delayed }}</div>
          <div class="stat-label">已延期</div>
        </div>
      </div>
    </div>

    <!-- 财务概览 -->
    <div class="finance-overview">
      <div class="finance-card income">
        <div class="finance-header">
          <span class="finance-icon">💰</span>
          <span class="finance-title">项目总收入</span>
        </div>
        <div class="finance-value">¥{{ formatAmount(stats.totalIncome) }}</div>
      </div>
      <div class="finance-card expense">
        <div class="finance-header">
          <span class="finance-icon">💸</span>
          <span class="finance-title">项目总支出</span>
        </div>
        <div class="finance-value expense">¥{{ formatAmount(stats.totalExpense) }}</div>
      </div>
      <div class="finance-card profit">
        <div class="finance-header">
          <span class="finance-icon">📈</span>
          <span class="finance-title">利润空间</span>
        </div>
        <div class="finance-value" :class="profitClass">{{ formatAmount(stats.profit) }}</div>
      </div>
    </div>

    <!-- 任务统计 -->
    <div class="task-overview">
      <div class="task-stat">
        <div class="task-stat-icon">📋</div>
        <div class="task-stat-info">
          <div class="task-stat-value">{{ stats.totalTasks }}</div>
          <div class="task-stat-label">总任务数</div>
        </div>
      </div>
      <div class="task-stat">
        <div class="task-stat-icon">🔄</div>
        <div class="task-stat-info">
          <div class="task-stat-value">{{ stats.pendingTasks }}</div>
          <div class="task-stat-label">待处理</div>
        </div>
      </div>
      <div class="task-stat">
        <div class="task-stat-icon">⏰</div>
        <div class="task-stat-info">
          <div class="task-stat-value">{{ stats.inProgressTasks }}</div>
          <div class="task-stat-label">进行中</div>
        </div>
      </div>
      <div class="task-stat">
        <div class="task-stat-icon">🏁</div>
        <div class="task-stat-info">
          <div class="task-stat-value">{{ stats.completedTasks }}</div>
          <div class="task-stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 项目进度概览 -->
    <div class="projects-section">
      <div class="section-header">
        <h3>项目进度概览</h3>
        <span class="view-all" @click="$emit('viewAll')">查看全部 →</span>
      </div>
      <div class="projects-grid">
        <div
          v-for="project in topProjects"
          :key="project.id"
          class="project-card"
          @click="$emit('selectProject', project)"
        >
          <div class="card-header">
            <span class="project-name">{{ project.name }}</span>
            <span :class="['status-badge', project.status]">{{ project.status }}</span>
          </div>
          <div class="card-info">
            <span class="project-location">📍 {{ project.location || '未设置' }}</span>
            <span class="project-manager">👤 {{ project.manager || '未指定' }}</span>
          </div>
          <div class="card-progress">
            <div class="progress-header">
              <span>进度</span>
              <span>{{ project.task_progress || 0 }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="getProgressClass(project.task_progress)"
                :style="{ width: (project.task_progress || 0) + '%' }"
              ></div>
            </div>
          </div>
          <div class="card-budget">
            <div class="budget-item">
              <span class="budget-label">预算</span>
              <span class="budget-value">¥{{ formatAmount(project.total_budget) }}</span>
            </div>
            <div class="budget-item">
              <span class="budget-label">支出</span>
              <span class="budget-value expense">¥{{ formatAmount(project.total_expense || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 即将到期项目 -->
    <div class="upcoming-section" v-if="upcomingProjects.length > 0">
      <div class="section-header">
        <h3>⚠️ 即将到期项目</h3>
      </div>
      <div class="upcoming-list">
        <div
          v-for="project in upcomingProjects"
          :key="project.id"
          class="upcoming-item"
          @click="$emit('selectProject', project)"
        >
          <div class="upcoming-info">
            <span class="upcoming-name">{{ project.name }}</span>
            <span class="upcoming-dates">
              {{ project.start_date || '无开始时间' }} ~ {{ project.end_date || '无截止时间' }}
            </span>
          </div>
          <div class="upcoming-status">
            <span :class="['days-left', getDaysClass(project.daysLeft)]">
              {{ project.daysLeft }}天后到期
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['selectProject', 'viewAll', 'filter'])

const projects = ref([])
const tasks = ref([])
const budgets = ref([])
const expenses = ref([])
const contracts = ref([])

const stats = computed(() => {
  const total = projects.value.length
  const inProgress = projects.value.filter(p => p.status === '进行中').length
  const completed = projects.value.filter(p => p.status === '已完成').length
  const paused = projects.value.filter(p => p.status === '已暂停').length
  const delayed = projects.value.filter(p => p.status === '已延期').length

  // 计算总收入（销售合同金额）
  const totalIncome = contracts.value
    .filter(c => c.contract_type === '销售合同')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0)

  // 计算总支出（采购/施工/服务合同 + 管理费用）
  const contractExpense = contracts.value
    .filter(c => c.contract_type !== '销售合同')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0)
  const managementExpense = expenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalExpense = contractExpense + managementExpense

  // 任务统计
  const totalTasks = tasks.value.length
  const pendingTasks = tasks.value.filter(t => t.status === '待开始').length
  const inProgressTasks = tasks.value.filter(t => t.status === '进行中').length
  const completedTasks = tasks.value.filter(t => t.status === '已完成').length

  return {
    total,
    inProgress,
    completed,
    paused,
    delayed,
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks
  }
})

const profitClass = computed(() => {
  if (stats.value.profit > 0) return 'positive'
  if (stats.value.profit < 0) return 'negative'
  return ''
})

const topProjects = computed(() => {
  return projects.value.slice(0, 6)
})

const upcomingProjects = computed(() => {
  const today = new Date()
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return projects.value
    .filter(p => {
      if (p.status !== '进行中') return false
      if (!p.end_date) return false
      const endDate = new Date(p.end_date)
      return endDate >= today && endDate <= thirtyDaysLater
    })
    .map(p => {
      const today = new Date()
      const endDate = new Date(p.end_date)
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
      return { ...p, daysLeft }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)
})

const formatAmount = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

const getProgressClass = (progress) => {
  if (!progress || progress < 25) return 'low'
  if (progress < 50) return 'medium'
  if (progress < 75) return 'high'
  return 'excellent'
}

const getDaysClass = (days) => {
  if (days <= 7) return 'urgent'
  if (days <= 14) return 'warning'
  return 'normal'
}

const handleStatClick = (type) => {
  emit('filter', type)
}

const loadData = async () => {
  try {
    projects.value = await window.electronAPI.getProjects()
    tasks.value = await window.electronAPI.getTasks()
    budgets.value = await window.electronAPI.getBudgets()
    expenses.value = await window.electronAPI.getManagementFees()
    contracts.value = await window.electronAPI.getContracts()

    // Calculate total expense per project (contracts + management fees)
    projects.value.forEach(project => {
      const projectContractExpense = contracts.value
        .filter(c => c.project_id === project.id && c.contract_type !== '销售合同')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0)
      const projectManagementExpense = expenses.value
        .filter(e => e.project_id === project.id)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0)
      project.total_expense = projectContractExpense + projectManagementExpense
    })
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
  }
}

onMounted(() => {
  loadData()
})

defineExpose({
  refresh: loadData
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: rgba(5, 12, 24, 0.92);
  backdrop-filter: blur(12px);
  min-height: 100vh;
  overflow-y: auto;
  color: #e2e8f0;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.15);
  border-color: rgba(100, 150, 255, 0.3);
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.stat-card.in-progress .stat-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.stat-card.completed .stat-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.stat-card.paused .stat-icon {
  background: linear-gradient(135deg, #fa709a, #fee140);
}
.stat-card.delayed .stat-icon {
  background: linear-gradient(135deg, #ff0844, #ffb199);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

/* 财务概览 */
.finance-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.finance-card {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.finance-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.finance-icon {
  font-size: 24px;
}

.finance-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.finance-value {
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
}

.finance-value.expense {
  color: #ef4444;
}

.finance-value.positive {
  color: #10b981;
}

.finance-value.negative {
  color: #ef4444;
}

/* 任务统计 */
.task-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.task-stat {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.task-stat-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 150, 255, 0.1);
  border-radius: 10px;
}

.task-stat-info {
  flex: 1;
}

.task-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.task-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

/* 项目进度概览 */
.projects-section {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.view-all {
  font-size: 13px;
  color: #4a90d9;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.project-card {
  background: rgba(30, 40, 60, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  border-color: rgba(74, 144, 217, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.status-badge.进行中 {
  background: rgba(74, 144, 217, 0.15);
  color: #4a90d9;
}

.status-badge.已完成 {
  background: rgba(72, 187, 120, 0.15);
  color: #48bb78;
}

.status-badge.已暂停 {
  background: rgba(237, 137, 54, 0.15);
  color: #ed8936;
}

.status-badge.已延期 {
  background: rgba(237, 100, 100, 0.15);
  color: #ef6461;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.card-progress {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.low {
  background: linear-gradient(90deg, #ef4444, #fc8181);
}

.progress-fill.medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.high {
  background: linear-gradient(90deg, #2563eb, #60a5fa);
}

.progress-fill.excellent {
  background: linear-gradient(90deg, #10b981, #68d391);
}

.card-budget {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(100, 150, 255, 0.12);
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.budget-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.budget-value {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.budget-value.expense {
  color: #ef4444;
}

/* 即将到期 */
.upcoming-section {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(100, 150, 255, 0.12);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upcoming-item:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.upcoming-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upcoming-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.upcoming-dates {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.days-left {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.days-left.urgent {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.days-left.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.days-left.normal {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}
</style>
