<template>
  <div class="sidebar-wrapper" :class="{ expanded: (activeModule && !panelCollapsed) || showListPanel }">
    <button
      class="toggle-btn"
      @click="toggleSidebar"
      :title="panelCollapsed ? '展开' : '隐藏'"
      :style="{ left: panelCollapsed ? '0px' : '52px' }"
    >
      <span class="toggle-arrow" :class="{ expanded: !panelCollapsed }">&#9654;</span>
    </button>

    <div
      class="sidebar-tabs"
      :class="{ collapsed: panelCollapsed }"
    >
      <button
        v-for="item in menuItems"
        :key="item.key"
        :class="['tab-item', { active: activeModule === item.key }]"
        @click="handleTabClick(item.key)"
      >
        <span class="tab-icon">{{ item.icon }}</span>
        <span class="tab-tooltip">{{ item.label }}</span>
      </button>
    </div>

    <!-- 项目详情面板 - 显示在右侧 -->
    <div
      class="detail-panel"
      :style="{ width: detailWidth + 'px' }"
      v-if="showDetailView && selectedItem"
    >
      <div class="panel-header">
        <button class="back-btn" @click="closeDetailView">←</button>
        <h3>{{ selectedItem.name }}</h3>
        <button class="close-btn" @click="closeDetailView">×</button>
      </div>
      <div class="sub-tabs">
        <button
          v-for="sub in projectSubTabs"
          :key="sub.key"
          :class="['sub-tab-item', { active: activeSubTab === sub.key }]"
          @click="selectSubTab(sub.key)"
        >
          {{ sub.label }}
        </button>
      </div>
      <div class="detail-content">
        <div class="detail-section" v-if="activeSubTab === 'contracts'">
          <div class="section-header">
            <span class="section-title">关联合同</span>
            <button class="section-btn" @click="handleDetailAction('addContract')">＋ 新增</button>
          </div>
          <!-- 销售合同 -->
          <div class="contract-category">
            <div class="category-title">销售合同</div>
            <div class="contract-list">
              <div v-if="salesContracts.length === 0" class="no-data">暂无销售合同</div>
              <div
                v-for="c in salesContracts"
                :key="c.id"
                :class="['contract-item', { selected: selectedContract && selectedContract.id === c.id }]"
                @click="selectContract(c)"
              >
                <div class="contract-info">
                  <span class="contract-name">{{ c.name }}</span>
                  <span class="contract-type">{{ c.contract_type }}</span>
                </div>
                <span class="contract-amount">¥{{ formatAmount(c.amount) }}</span>
              </div>
            </div>
          </div>
          <!-- 采购合同 -->
          <div class="contract-category">
            <div class="category-title">采购合同</div>
            <div class="contract-list">
              <div v-if="purchaseContracts.length === 0" class="no-data">暂无采购合同</div>
              <div
                v-for="c in purchaseContracts"
                :key="c.id"
                :class="['contract-item', { selected: selectedContract && selectedContract.id === c.id }]"
                @click="selectContract(c)"
              >
                <div class="contract-info">
                  <span class="contract-name">{{ c.name }}</span>
                  <span class="contract-type">{{ c.contract_type }}</span>
                </div>
                <span class="contract-amount">¥{{ formatAmount(c.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="activeSubTab === 'invoices'">
          <div class="section-header">
            <span class="section-title">关联发票</span>
            <button class="section-btn" @click="handleDetailAction('addInvoice')">＋ 新增</button>
          </div>
          <!-- 收款发票 -->
          <div class="contract-category">
            <div class="category-title">收款发票</div>
            <div class="contract-list">
              <div v-if="receiptInvoices.length === 0" class="no-data">暂无收款发票</div>
              <div
                v-for="i in receiptInvoices"
                :key="i.id"
                class="contract-item"
              >
                <div class="contract-info">
                  <span class="contract-name">{{ i.invoice_no }}</span>
                </div>
                <span class="contract-amount">¥{{ formatAmount(i.amount) }}</span>
              </div>
            </div>
          </div>
          <!-- 付款发票 -->
          <div class="contract-category">
            <div class="category-title">付款发票</div>
            <div class="contract-list">
              <div v-if="paymentInvoices.length === 0" class="no-data">暂无付款发票</div>
              <div
                v-for="i in paymentInvoices"
                :key="i.id"
                class="contract-item"
              >
                <div class="contract-info">
                  <span class="contract-name">{{ i.invoice_no }}</span>
                </div>
                <span class="contract-amount">¥{{ formatAmount(i.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="activeSubTab === 'budgets'">
          <div class="section-header">
            <span class="section-title">项目预算</span>
            <button class="section-btn" @click="handleDetailAction('addBudget')">＋ 新增</button>
          </div>
          <div class="contract-list">
            <div v-if="projectBudgets.length === 0" class="no-data">暂无预算记录</div>
            <div
              v-for="b in projectBudgets"
              :key="b.id"
              class="contract-item"
            >
              <div class="contract-info">
                <span class="contract-name">{{ b.category }}</span>
                <span class="contract-type">{{ b.description || '-' }}</span>
              </div>
              <span class="contract-amount">¥{{ formatAmount(b.amount) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="activeSubTab === 'tasks'">
          <div class="section-header">
            <span class="section-title">项目任务</span>
            <button class="section-btn" @click="handleDetailAction('addTask')">＋ 新增</button>
          </div>
          <div class="contract-list">
            <div v-if="projectTasks.length === 0" class="no-data">暂无任务</div>
            <div
              v-for="t in projectTasks"
              :key="t.id"
              :class="['contract-item', { completed: t.status === '已完成' }]"
            >
              <div class="contract-info">
                <span class="contract-name">{{ t.name }}</span>
                <span class="contract-type">{{ t.due_date || '无截止日期' }}</span>
              </div>
              <span :class="['task-status', t.status]">{{ t.status }}</span>
            </div>
          </div>
        </div>

        <div class="detail-info" v-if="activeSubTab === 'info'">
          <div class="info-row">
            <span class="info-label">项目编号</span>
            <span class="info-value">{{ selectedItem.code }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">项目名称</span>
            <span class="info-value">{{ selectedItem.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">项目地点</span>
            <span class="info-value">{{ selectedItem.location }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">负责人</span>
            <span class="info-value">{{ selectedItem.manager }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">项目状态</span>
            <span :class="['info-status', selectedItem.status]">{{ selectedItem.status }}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn edit-btn" @click="handleDetailAction('editProject')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handleDetailAction('deleteProject')">✕ 删除</button>
      </div>
      <div class="resize-handle-detail" @mousedown="startDetailResize"></div>
    </div>

    <!-- 合同详情面板 - 显示在项目详情右侧 -->
    <div
      class="contract-detail-panel"
      :style="{ width: sidebarWidth + 'px' }"
      v-if="selectedContract"
    >
      <div class="panel-header">
        <button class="back-btn" @click="closeContractDetail">←</button>
        <h3>{{ selectedContract.name }}</h3>
        <button class="close-btn" @click="closeContractDetail">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-section">
          <div class="section-title">合同信息</div>
          <div class="info-row">
            <span class="info-label">合同类型</span>
            <span class="info-value">{{ selectedContract.contract_type }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">合同金额</span>
            <span class="info-value amount">¥{{ formatAmount(selectedContract.amount) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">签订日期</span>
            <span class="info-value">{{ selectedContract.signed_date }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">关联项目</span>
            <span class="info-value">{{ selectedContract.project_name }}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn edit-btn" @click="handleContractAction('edit')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handleContractAction('delete')">✕ 删除</button>
      </div>
    </div>

    <!-- 发票详情面板 -->
    <div
      class="contract-detail-panel"
      :style="{ width: sidebarWidth + 'px' }"
      v-if="selectedInvoice"
    >
      <div class="panel-header">
        <button class="back-btn" @click="selectedInvoice = null">←</button>
        <h3>{{ selectedInvoice.invoice_no }}</h3>
        <button class="close-btn" @click="selectedInvoice = null">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-section">
          <div class="section-title">发票信息</div>
          <div class="info-row">
            <span class="info-label">发票号码</span>
            <span class="info-value">{{ selectedInvoice.invoice_no }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">发票金额</span>
            <span class="info-value amount">¥{{ formatAmount(selectedInvoice.amount) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">已收金额</span>
            <span class="info-value amount">¥{{ formatAmount(selectedInvoice.paid_amount) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">开票日期</span>
            <span class="info-value">{{ selectedInvoice.date }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">收款状态</span>
            <span :class="['info-status', selectedInvoice.payment_status]">{{ selectedInvoice.payment_status || '未收款' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">关联合同</span>
            <span class="info-value">{{ selectedInvoice.contract_name }}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn edit-btn" @click="handleInvoiceAction('edit')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handleInvoiceAction('delete')">✕ 删除</button>
      </div>
    </div>

    <!-- 付款凭证详情面板 -->
    <div
      class="contract-detail-panel"
      :style="{ width: sidebarWidth + 'px' }"
      v-if="selectedPayment"
    >
      <div class="panel-header">
        <button class="back-btn" @click="selectedPayment = null">←</button>
        <h3>{{ selectedPayment.receipt_no || '付款凭证' }}</h3>
        <button class="close-btn" @click="selectedPayment = null">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-section">
          <div class="section-title">付款信息</div>
          <div class="info-row">
            <span class="info-label">付款金额</span>
            <span class="info-value amount">¥{{ formatAmount(selectedPayment.amount) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">付款日期</span>
            <span class="info-value">{{ selectedPayment.date }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">凭证号</span>
            <span class="info-value">{{ selectedPayment.receipt_no || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">关联发票</span>
            <span class="info-value">{{ selectedPayment.invoice_no }}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn edit-btn" @click="handlePaymentAction('edit')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handlePaymentAction('delete')">✕ 删除</button>
      </div>
    </div>

    <!-- 验收详情面板 -->
    <div
      class="contract-detail-panel"
      :style="{ width: sidebarWidth + 'px' }"
      v-if="selectedAcceptance"
    >
      <div class="panel-header">
        <button class="back-btn" @click="selectedAcceptance = null">←</button>
        <h3>{{ selectedAcceptance.name }}</h3>
        <button class="close-btn" @click="selectedAcceptance = null">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-section">
          <div class="section-title">验收信息</div>
          <div class="info-row">
            <span class="info-label">验收名称</span>
            <span class="info-value">{{ selectedAcceptance.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">验收状态</span>
            <span :class="['info-status', selectedAcceptance.status]">{{ selectedAcceptance.status }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">验收日期</span>
            <span class="info-value">{{ selectedAcceptance.date || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">关联项目</span>
            <span class="info-value">{{ selectedAcceptance.project_name }}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn edit-btn" @click="handleAcceptanceAction('edit')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handleAcceptanceAction('delete')">✕ 删除</button>
      </div>
    </div>

    <div
      class="sidebar-panel"
      :style="{ width: sidebarWidth + 'px' }"
      v-if="activeModule && showListPanel"
    >
      <div class="panel-header">
        <h3>{{ currentLabel }}</h3>
        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <nav class="panel-nav">
        <div class="search-box">
          <input v-model="searchKeyword" :placeholder="searchPlaceholder" class="search-input" />
        </div>
        <div class="item-list">
          <div v-if="filteredItems.length === 0" class="no-data">{{ emptyText }}</div>
          <div
            v-for="item in filteredItems"
            :key="item.id"
            :class="['item-row', { selected: selectedItem && selectedItem.id === item.id }]"
            @click="console.log('item-row clicked:', item.id), selectItem(item)"
          >
            <div class="item-info">
              <span class="item-title">{{ item.name || item.invoice_no || item.receipt_no || item.title }}</span>
              <span class="item-sub">{{ getItemSub(item) }}</span>
            </div>
            <span v-if="item.status" :class="['item-status', item.status]">{{ item.status }}</span>
          </div>
        </div>
      </nav>
      <div class="panel-actions">
        <button class="action-btn add-btn" @click="handleAction('add')">＋ 新增</button>
        <button class="action-btn edit-btn" @click="handleAction('edit')">✎ 修改</button>
        <button class="action-btn delete-btn" @click="handleAction('delete')">✕ 删除</button>
      </div>
      <div class="resize-handle" @mousedown="startResize"></div>
    </div>

    <div
      class="form-panel"
      :style="{ width: formWidth + 'px', transform: showForm ? 'translateX(0)' : `translateX(100%)` }"
      v-show="showForm"
    >
      <div class="form-header">
        <h3>{{ formTitle }}</h3>
        <button class="close-btn" @click="closeForm">×</button>
      </div>
      <form class="form-content" @submit.prevent="saveForm">
        <!-- 项目表单 -->
        <template v-if="activeModule === 'projects'">
          <div class="form-group">
            <label>项目编号</label>
            <input v-model="formData.code" required placeholder="请输入项目编号" />
          </div>
          <div class="form-group">
            <label>项目名称</label>
            <input v-model="formData.name" required placeholder="请输入项目名称" />
          </div>
          <div class="form-group">
            <label>项目地点</label>
            <CityPicker v-model="formData.cityObj" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间</label>
              <input type="date" v-model="formData.start_date" />
            </div>
            <div class="form-group">
              <label>结束时间</label>
              <input type="date" v-model="formData.end_date" />
            </div>
          </div>
          <div class="form-group">
            <label>项目状态</label>
            <select v-model="formData.status">
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="已暂停">已暂停</option>
              <option value="已延期">已延期</option>
            </select>
          </div>
          <div class="form-group">
            <label>负责人</label>
            <input v-model="formData.manager" placeholder="请输入负责人" />
          </div>
        </template>

        <!-- 合同表单 -->
        <template v-else-if="activeModule === 'contracts'">
          <div class="form-group">
            <label>关联项目</label>
            <select v-model="formData.project_id" required>
              <option value="">请选择项目</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>合同类型</label>
            <select v-model="formData.contract_type">
              <option value="销售合同">销售合同</option>
              <option value="采购合同">采购合同</option>
            </select>
          </div>
          <div class="form-group">
            <label>合同名称</label>
            <input v-model="formData.name" required placeholder="请输入合同名称" />
          </div>
          <div class="form-group">
            <label>合同金额</label>
            <input type="number" v-model="formData.amount" placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>签订日期</label>
            <input type="date" v-model="formData.signed_date" />
          </div>
        </template>

        <!-- 发票表单 -->
        <template v-else-if="activeModule === 'invoices'">
          <div class="form-group">
            <label>关联合同</label>
            <select v-model="formData.contract_id" required>
              <option value="">请选择合同</option>
              <option v-for="c in contracts" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>发票类型</label>
            <select v-model="formData.invoice_type">
              <option value="收款">收款</option>
              <option value="付款">付款</option>
            </select>
          </div>
          <div class="form-group">
            <label>发票号码</label>
            <input v-model="formData.invoice_no" required placeholder="请输入发票号码" />
          </div>
          <div class="form-group">
            <label>发票金额</label>
            <input type="number" v-model="formData.amount" placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>开票日期</label>
            <input type="date" v-model="formData.date" />
          </div>
        </template>

        <!-- 预算表单 (从项目详情添加) -->
        <template v-else-if="formData && formData.category !== undefined && formData.amount !== undefined && formData.description !== undefined && formData.name === undefined">
          <div class="form-group">
            <label>预算类别</label>
            <input v-model="formData.category" required placeholder="如：设备采购、人员成本" />
          </div>
          <div class="form-group">
            <label>预算金额</label>
            <input type="number" v-model="formData.amount" required placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>说明</label>
            <input v-model="formData.description" placeholder="预算说明" />
          </div>
        </template>

        <!-- 任务表单 (从项目详情添加) -->
        <template v-else-if="formData && formData.status !== undefined && formData.name !== undefined && formData.category === undefined">
          <div class="form-group">
            <label>任务名称</label>
            <input v-model="formData.name" required placeholder="请输入任务名称" />
          </div>
          <div class="form-group">
            <label>任务状态</label>
            <select v-model="formData.status">
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input type="date" v-model="formData.due_date" />
          </div>
        </template>

        <!-- 付款凭证表单 -->
        <template v-else-if="activeModule === 'payments'">
          <div class="form-group">
            <label>关联发票</label>
            <select v-model="formData.invoice_id" required>
              <option value="">请选择发票</option>
              <option v-for="i in invoices" :key="i.id" :value="i.id">{{ i.invoice_no }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>付款金额</label>
            <input type="number" v-model="formData.amount" placeholder="请输入金额" />
          </div>
          <div class="form-group">
            <label>付款日期</label>
            <input type="date" v-model="formData.date" />
          </div>
          <div class="form-group">
            <label>凭证号</label>
            <input v-model="formData.receipt_no" placeholder="请输入凭证号" />
          </div>
        </template>

        <!-- 验收确认表单 -->
        <template v-else-if="activeModule === 'acceptances'">
          <div class="form-group">
            <label>关联项目</label>
            <select v-model="formData.project_id" required>
              <option value="">请选择项目</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>验收名称</label>
            <input v-model="formData.name" required placeholder="请输入验收名称" />
          </div>
          <div class="form-group">
            <label>验收状态</label>
            <select v-model="formData.status">
              <option value="待验收">待验收</option>
              <option value="已验收">已验收</option>
              <option value="不通过">不通过</option>
            </select>
          </div>
          <div class="form-group">
            <label>验收日期</label>
            <input type="date" v-model="formData.date" />
          </div>
        </template>

        <!-- 人员表单 -->
        <template v-else-if="activeModule === 'people'">
          <div class="form-group">
            <label>姓名</label>
            <input v-model="formData.name" required placeholder="请输入姓名" />
          </div>
          <div class="form-group">
            <label>职位</label>
            <input v-model="formData.position" placeholder="请输入职位" />
          </div>
          <div class="form-group">
            <label>电话</label>
            <input v-model="formData.phone" placeholder="请输入电话" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="formData.email" placeholder="请输入邮箱" />
          </div>
        </template>

        <div class="form-group" v-if="showDeleteConfirm">
          <label>确认删除此{{ moduleName }}吗？</label>
          <div class="confirm-text">此操作不可撤销</div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="closeForm">取消</button>
          <button type="submit" class="btn-save">{{ showDeleteConfirm ? '确认删除' : '保存' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import CityPicker from './CityPicker.vue'

const props = defineProps({
  activeModule: {
    type: String,
    default: null
  },
  sidebarWidth: {
    type: Number,
    default: 220
  },
  viewProject: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select', 'update:sidebarWidth', 'update:sidebarOffset', 'action'])

const sidebarCollapsed = ref(true)
const panelCollapsed = ref(false)
const showListPanel = ref(false)
const showForm = ref(false)
const formAction = ref('')
const showDeleteConfirm = ref(false)
const formWidth = ref(340)
const searchKeyword = ref('')

// 数据
const projects = ref([])
const contracts = ref([])
const invoices = ref([])
const payments = ref([])
const acceptances = ref([])
const people = ref([])
const selectedItem = ref(null)
const showDetailView = ref(false)
const selectedContract = ref(null)
const selectedInvoice = ref(null)
const selectedPayment = ref(null)
const selectedAcceptance = ref(null)
const projectContracts = ref([])
const projectInvoices = ref([])
const projectBudgets = ref([])
const projectTasks = ref([])
const activeSubTab = ref('contracts')

const salesContracts = computed(() => {
  return projectContracts.value.filter(c => c.contract_type === '销售合同')
})

const purchaseContracts = computed(() => {
  return projectContracts.value.filter(c => c.contract_type === '采购合同')
})

// 收款发票和付款发票
const receiptInvoices = computed(() => {
  return projectInvoices.value.filter(i => i.invoice_type === '收款')
})

const paymentInvoices = computed(() => {
  return projectInvoices.value.filter(i => i.invoice_type === '付款')
})

// 根据模块获取数据
const currentData = computed(() => {
  switch (props.activeModule) {
    case 'projects': return projects.value
    case 'contracts': return contracts.value
    case 'invoices': return invoices.value
    case 'payments': return payments.value
    case 'acceptances': return acceptances.value
    case 'people': return people.value
    default: return []
  }
})

const filteredItems = computed(() => {
  if (!searchKeyword.value) return currentData.value
  const kw = searchKeyword.value.toLowerCase()
  return currentData.value.filter(item => {
    const name = item.name || item.invoice_no || ''
    return name.toLowerCase().includes(kw)
  })
})

const searchPlaceholder = computed(() => {
  switch (props.activeModule) {
    case 'projects': return '搜索项目...'
    case 'contracts': return '搜索合同...'
    case 'invoices': return '搜索发票...'
    case 'payments': return '搜索付款...'
    case 'acceptances': return '搜索验收...'
    case 'people': return '搜索人员...'
    default: return '搜索...'
  }
})

const emptyText = computed(() => {
  switch (props.activeModule) {
    case 'projects': return '暂无项目'
    case 'contracts': return '暂无合同'
    case 'invoices': return '暂无发票'
    case 'payments': return '暂无付款'
    case 'acceptances': return '暂无验收'
    case 'people': return '暂无人员'
    default: return '暂无数据'
  }
})

const moduleName = computed(() => {
  switch (props.activeModule) {
    case 'projects': return '项目'
    case 'contracts': return '合同'
    case 'invoices': return '发票'
    case 'payments': return '付款'
    case 'acceptances': return '验收'
    case 'people': return '人员'
    default: return ''
  }
})

const getItemSub = (item) => {
  if (props.activeModule === 'contracts') {
    return item.project_name ? `项目: ${item.project_name}` : (item.amount ? `¥${item.amount}` : '')
  }
  if (props.activeModule === 'invoices') {
    return item.contract_name ? `合同: ${item.contract_name}` : (item.amount ? `¥${item.amount}` : '')
  }
  if (props.activeModule === 'payments') {
    return item.invoice_no ? `发票: ${item.invoice_no}` : (item.amount ? `¥${item.amount}` : '')
  }
  if (props.activeModule === 'acceptances') {
    return item.project_name ? `项目: ${item.project_name}` : ''
  }
  if (props.activeModule === 'people') {
    return item.position || ''
  }
  return item.code || ''
}

const menuItems = [
  { key: 'projects', label: '项目管理', icon: '📁' },
  { key: 'contracts', label: '合同管理', icon: '📄' },
  { key: 'invoices', label: '发票管理', icon: '🧾' },
  { key: 'payments', label: '付款凭证', icon: '💳' },
  { key: 'acceptances', label: '验收确认', icon: '✅' },
  { key: 'people', label: '人员管理', icon: '👥' }
]

const currentLabel = computed(() => {
  return menuItems.find(m => m.key === props.activeModule)?.label || ''
})

const formTitle = computed(() => {
  if (showDeleteConfirm.value) return `删除${moduleName.value}`
  return formAction.value === 'add' ? `新增${moduleName.value}` : `修改${moduleName.value}`
})

const loadProjects = async () => {
  try {
    const data = await window.electronAPI.getProjects()
    projects.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load projects:', err)
  }
}

const loadContracts = async () => {
  try {
    const data = await window.electronAPI.getContracts()
    contracts.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load contracts:', err)
  }
}

const loadInvoices = async () => {
  try {
    const data = await window.electronAPI.getInvoices()
    invoices.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load invoices:', err)
  }
}

const loadPayments = async () => {
  try {
    const data = await window.electronAPI.getPayments()
    payments.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load payments:', err)
  }
}

const loadAcceptances = async () => {
  try {
    const data = await window.electronAPI.getAcceptances()
    acceptances.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load acceptances:', err)
  }
}

const loadPeople = async () => {
  try {
    const data = await window.electronAPI.getPeople()
    people.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (err) {
    console.error('Failed to load people:', err)
  }
}

const selectItem = (item) => {
  console.log('selectItem called with:', item)
  console.log('activeModule:', props.activeModule)
  selectedItem.value = item
  console.log('selectedItem set to:', selectedItem.value)
  if (props.activeModule === 'projects') {
    console.log('Setting showDetailView to true')
    showDetailView.value = true
    activeSubTab.value = 'contracts'
    // Load project related data
    loadProjectContracts(item.id)
    loadProjectInvoices(item.id)
    loadProjectBudgets(item.id)
    loadProjectTasks(item.id)
  } else if (props.activeModule === 'contracts') {
    selectedContract.value = item
  } else if (props.activeModule === 'invoices') {
    selectedInvoice.value = item
  } else if (props.activeModule === 'payments') {
    selectedPayment.value = item
  } else if (props.activeModule === 'acceptances') {
    selectedAcceptance.value = item
  } else {
    // For other modules, also show detail view if item supports it
    if (item.name) {
      showDetailView.value = true
    }
  }
  console.log('showDetailView is now:', showDetailView.value)
}

const loadProjectContracts = async (projectId) => {
  try {
    const allContracts = await window.electronAPI.getContracts()
    projectContracts.value = allContracts.filter(c => c.project_id === projectId)
  } catch (err) {
    console.error('Failed to load project contracts:', err)
  }
}

const loadProjectInvoices = async (projectId) => {
  try {
    const allInvoices = await window.electronAPI.getInvoices()
    const projectContractIds = projectContracts.value.map(c => c.id)
    projectInvoices.value = allInvoices.filter(i => projectContractIds.includes(i.contract_id))
  } catch (err) {
    console.error('Failed to load project invoices:', err)
  }
}

const loadProjectBudgets = async (projectId) => {
  try {
    projectBudgets.value = await window.electronAPI.getBudgetsByProject(projectId)
  } catch (err) {
    console.error('Failed to load project budgets:', err)
  }
}

const loadProjectTasks = async (projectId) => {
  try {
    projectTasks.value = await window.electronAPI.getTasksByProject(projectId)
  } catch (err) {
    console.error('Failed to load project tasks:', err)
  }
}

const selectContract = (contract) => {
  selectedContract.value = contract
}

const closeContractDetail = () => {
  selectedContract.value = null
}

const handleContractAction = (action) => {
  if (action === 'edit') {
    formAction.value = 'edit'
    showDeleteConfirm.value = false
    formData.value = { ...selectedContract.value }
    selectedItem.value = projects.value.find(p => p.id === selectedContract.value.project_id)
    showForm.value = true
  } else if (action === 'delete') {
    formAction.value = 'delete'
    showDeleteConfirm.value = true
    showForm.value = true
  }
}

const handleInvoiceAction = (action) => {
  if (action === 'edit') {
    formAction.value = 'edit'
    showDeleteConfirm.value = false
    formData.value = { ...selectedInvoice.value }
    showForm.value = true
  } else if (action === 'delete') {
    formAction.value = 'delete'
    showDeleteConfirm.value = true
    showForm.value = true
  }
}

const handlePaymentAction = (action) => {
  if (action === 'edit') {
    formAction.value = 'edit'
    showDeleteConfirm.value = false
    formData.value = { ...selectedPayment.value }
    showForm.value = true
  } else if (action === 'delete') {
    formAction.value = 'delete'
    showDeleteConfirm.value = true
    showForm.value = true
  }
}

const handleAcceptanceAction = (action) => {
  if (action === 'edit') {
    formAction.value = 'edit'
    showDeleteConfirm.value = false
    formData.value = { ...selectedAcceptance.value }
    selectedItem.value = projects.value.find(p => p.id === selectedAcceptance.value.project_id)
    showForm.value = true
  } else if (action === 'delete') {
    formAction.value = 'delete'
    showDeleteConfirm.value = true
    showForm.value = true
  }
}

const closeDetailView = () => {
  showDetailView.value = false
  selectedContract.value = null
  selectedInvoice.value = null
  selectedPayment.value = null
  selectedAcceptance.value = null
}

const handleDetailAction = (action) => {
  if (action === 'addContract') {
    formAction.value = 'add'
    showDeleteConfirm.value = false
    formData.value = { project_id: selectedItem.value.id, contract_type: '销售合同', name: '', amount: '', signed_date: '' }
    showForm.value = true
  } else if (action === 'addBudget') {
    formAction.value = 'add'
    showDeleteConfirm.value = false
    formData.value = { project_id: selectedItem.value.id, category: '', amount: '', description: '' }
    showForm.value = true
  } else if (action === 'addTask') {
    formAction.value = 'add'
    showDeleteConfirm.value = false
    formData.value = { project_id: selectedItem.value.id, name: '', status: '进行中', due_date: '' }
    showForm.value = true
  } else if (action === 'editProject') {
    formAction.value = 'edit'
    showDeleteConfirm.value = false
    formData.value = { ...selectedItem.value }
    if (formData.value.locationObj === undefined) {
      formData.value.locationObj = {}
    }
    showForm.value = true
  } else if (action === 'deleteProject') {
    formAction.value = 'delete'
    showDeleteConfirm.value = true
    showForm.value = true
  }
}

const projectSubTabs = [
  { key: 'contracts', label: '合同' },
  { key: 'invoices', label: '发票' },
  { key: 'budgets', label: '预算' },
  { key: 'tasks', label: '任务' },
  { key: 'info', label: '信息' }
]

const selectSubTab = (key) => {
  activeSubTab.value = key
  // Load data when switching to budgets or tasks tabs
  if (key === 'budgets' && selectedItem.value) {
    loadProjectBudgets(selectedItem.value.id)
  } else if (key === 'tasks' && selectedItem.value) {
    loadProjectTasks(selectedItem.value.id)
  }
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

const handleTabClick = (key) => {
  if (panelCollapsed.value) {
    panelCollapsed.value = false
    showListPanel.value = true
    emit('select', key)
    loadModuleData(key)
  } else if (props.activeModule === key) {
    closePanel()
  } else {
    showListPanel.value = true
    emit('select', key)
    loadModuleData(key)
  }
}

const loadModuleData = (key) => {
  switch (key) {
    case 'projects': loadProjects(); break
    case 'contracts': loadContracts(); break
    case 'invoices': loadInvoices(); break
    case 'payments': loadPayments(); break
    case 'acceptances': loadAcceptances(); break
    case 'people': loadPeople(); break
  }
}

const toggleSidebar = () => {
  if (panelCollapsed.value) {
    panelCollapsed.value = false
    showListPanel.value = true
  } else {
    panelCollapsed.value = true
    showListPanel.value = false
  }
}

const closePanel = () => {
  showListPanel.value = false
}

const getDefaultFormData = () => {
  switch (props.activeModule) {
    case 'projects':
      return { name: '', code: '', city_id: null, cityObj: null, start_date: '', end_date: '', status: '进行中', manager: '' }
    case 'contracts':
      return { project_id: '', name: '', amount: '', signed_date: '' }
    case 'invoices':
      return { contract_id: '', invoice_type: '收款', invoice_no: '', amount: '', date: '' }
    case 'payments':
      return { invoice_id: '', amount: '', date: '', receipt_no: '' }
    case 'acceptances':
      return { project_id: '', name: '', status: '待验收', date: '' }
    case 'people':
      return { name: '', position: '', phone: '', email: '' }
    default:
      return {}
  }
}

const handleAction = (action) => {
  formAction.value = action
  showDeleteConfirm.value = false
  if (action === 'add') {
    formData.value = getDefaultFormData()
    selectedItem.value = null
  } else if (action === 'edit' && selectedItem.value) {
    formData.value = { ...selectedItem.value }
    if (formData.value.cityObj === undefined) {
      formData.value.cityObj = null
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  showDeleteConfirm.value = false
}

const formData = ref(getDefaultFormData())

const saveForm = async () => {
  const saveData = { ...formData.value }

  // 判断是预算还是任务表单
  const isBudgetForm = formData.value.category !== undefined && formData.value.amount !== undefined && formData.value.description !== undefined && formData.value.name === undefined
  const isTaskForm = formData.value.status !== undefined && formData.value.name !== undefined && formData.value.category === undefined

  // 项目处理地点 - 使用cityObj
  if (props.activeModule === 'projects' && formData.value.cityObj) {
    saveData.city_id = formData.value.cityObj.id
    saveData.location = formData.value.cityObj.display_name
    delete saveData.cityObj
  }

  // 删除不需要的字段
  delete saveData.project_name
  delete saveData.contract_name
  delete saveData.invoice_no

  // 处理预算和任务
  if (isBudgetForm) {
    emit('action', { type: formAction.value, module: 'budgets', data: saveData })
    closeForm()
    if (selectedItem.value) {
      loadProjectBudgets(selectedItem.value.id)
    }
    return
  }

  if (isTaskForm) {
    emit('action', { type: formAction.value, module: 'tasks', data: saveData })
    closeForm()
    if (selectedItem.value) {
      loadProjectTasks(selectedItem.value.id)
    }
    return
  }

  if (formAction.value === 'delete') {
    emit('action', { type: 'delete', module: props.activeModule, data: saveData })
  } else {
    emit('action', { type: formAction.value, module: props.activeModule, data: saveData })
  }

  closeForm()
  loadModuleData(props.activeModule)
}

let isResizing = false
let isDetailResizing = false
const detailWidth = ref(320)

const startResize = (e) => {
  isResizing = true
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

const startDetailResize = (e) => {
  isDetailResizing = true
  document.addEventListener('mousemove', doDetailResize)
  document.addEventListener('mouseup', stopDetailResize)
  e.preventDefault()
}

const doResize = (e) => {
  if (!isResizing) return
  const newWidth = Math.max(160, Math.min(500, e.clientX))
  emit('update:sidebarWidth', newWidth)
}

const doDetailResize = (e) => {
  if (!isDetailResizing) return
  const newWidth = Math.max(240, Math.min(600, window.innerWidth - e.clientX))
  detailWidth.value = newWidth
  updateSidebarOffset()
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
}

const stopDetailResize = () => {
  isDetailResizing = false
  document.removeEventListener('mousemove', doDetailResize)
  document.removeEventListener('mouseup', stopDetailResize)
}

watch(() => props.activeModule, () => {
  selectedItem.value = null
  showDetailView.value = false
  selectedContract.value = null
  selectedInvoice.value = null
  selectedPayment.value = null
  selectedAcceptance.value = null
  searchKeyword.value = ''
  formData.value = getDefaultFormData()
})

watch(panelCollapsed, (val) => {
  if (val) {
    showDetailView.value = false
    showListPanel.value = false
    selectedContract.value = null
    selectedInvoice.value = null
    selectedPayment.value = null
    selectedAcceptance.value = null
  }
  updateSidebarOffset()
})

watch(() => props.activeModule, () => {
  selectedInvoice.value = null
  selectedPayment.value = null
  selectedAcceptance.value = null
  updateSidebarOffset()
})

watch(() => props.viewProject, (project) => {
  if (project) {
    selectItem(project)
  }
}, { immediate: true })

watch([showDetailView, selectedItem], ([show, item]) => {
  console.log('Detail panel visibility:', { showDetailView: show, selectedItem: item })
  console.log('detail-panel should render:', show && item !== null)
  updateSidebarOffset()
})

watch(() => props.sidebarWidth, () => {
  updateSidebarOffset()
})

watch(panelCollapsed, () => {
  updateSidebarOffset()
})

const updateSidebarOffset = () => {
  const tabsWidth = 52
  const sidebarPanelWidth = (props.activeModule && showListPanel.value) ? 200 : 0
  // detail-panel 是 fixed 定位，覆盖在地球上，不需要计入偏移量
  const totalOffset = tabsWidth + sidebarPanelWidth
  emit('update:sidebarOffset', totalOffset)
}

onMounted(() => {
  updateSidebarOffset()
})
</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  display: flex;
  z-index: 100;
  width: 52px;
  flex-shrink: 0;
  transition: width 0.25s ease;
  position: relative;
  left: 0;
  top: 0;
  overflow: visible;
}

.sidebar-wrapper.expanded {
  width: 252px;
}

.sidebar-tabs {
  width: 52px;
  height: 100%;
  background: rgba(5, 12, 24, 0.95);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(100, 150, 255, 0.12);
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  flex-shrink: 0;
  transition: transform 0.25s ease, width 0.25s ease, opacity 0.25s ease;
  z-index: 10;
}

.sidebar-tabs.collapsed {
  transform: translateX(-100%);
  width: 0;
  opacity: 0;
  border-right: none;
  overflow: visible;
}

.tab-item {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-item:hover {
  color: #fff;
  background: rgba(100, 150, 255, 0.08);
}

.tab-item.active {
  color: #fff;
  background: rgba(100, 150, 255, 0.12);
}

.tab-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 28px;
  background: linear-gradient(180deg, #4a90d9, #81c3ff);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(74, 144, 217, 0.5);
}

.tab-icon {
  font-size: 24px;
}

.tab-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(10, 20, 40, 0.95);
  border: 1px solid rgba(100, 150, 255, 0.3);
  padding: 8px 14px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 14px;
  color: #fff;
  margin-left: 8px;
  pointer-events: none;
  z-index: 100;
}

.tab-item:hover .tab-tooltip {
  display: block;
}

.toggle-btn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 44px;
  background: rgba(74, 144, 217, 0.2);
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.25s ease, background 0.2s;
  z-index: 200;
}

.toggle-btn:hover {
  background: rgba(74, 144, 217, 0.4);
}

.toggle-arrow {
  color: rgba(200, 220, 255, 0.9);
  font-size: 10px;
  transition: transform 0.25s ease;
}

.toggle-arrow.expanded {
  transform: rotate(180deg);
}

.toggle-arrow:not(.expanded) {
  transform: rotate(0deg);
}

.sidebar-panel {
  height: 100%;
  background: rgba(8, 18, 36, 0.92);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(100, 150, 255, 0.15);
  display: flex;
  flex-direction: column;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.25s ease;
  z-index: 15;
  width: 200px;
}

.sidebar-panel.hidden {
  transform: translateX(-100%);
}

/* Detail Panel - 项目详情显示在右侧 */
.detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 320px;
  background: rgba(8, 18, 36, 0.98);
  border-left: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 50;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
}

.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(20, 40, 70, 0.3);
  gap: 10px;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #fff;
  letter-spacing: 0.5px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back-btn {
  background: rgba(74, 144, 217, 0.2);
  border: 1px solid rgba(74, 144, 217, 0.3);
  color: #4a90d9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(74, 144, 217, 0.3);
  color: #fff;
}

.sub-tabs {
  display: flex;
  border-bottom: 1px solid rgba(100, 150, 255, 0.15);
}

.sub-tab-item {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.sub-tab-item:hover {
  color: #fff;
  background: rgba(100, 150, 255, 0.08);
}

.sub-tab-item.active {
  color: #4a90d9;
  border-bottom-color: #4a90d9;
}

.close-btn {
  width: 26px;
  height: 26px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.2);
  color: rgba(255, 150, 150, 0.7);
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.25);
  color: #fff;
  border-color: rgba(255, 100, 100, 0.5);
}

.panel-nav {
  padding: 10px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-nav .search-box {
  padding: 0 12px 10px;
}

.panel-nav .search-input {
  width: 100%;
  padding: 8px 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(100,150,255,0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  box-sizing: border-box;
}

.panel-nav .search-input:focus {
  outline: none;
  border-color: rgba(74,144,217,0.5);
}

.panel-nav .search-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.item-list {
  flex: 1;
  overflow-y: auto;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(100,150,255,0.08);
}

.item-row:hover {
  background: rgba(100,150,255,0.1);
}

.item-row.selected {
  background: rgba(74,144,217,0.2);
  border-left: 2px solid #4a90d9;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.item-title {
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-status.进行中 {
  background: rgba(74,144,217,0.2);
  color: #4a90d9;
}

.item-status.已完成 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.item-status.已暂停 {
  background: rgba(237,137,54,0.2);
  color: #ed8936;
}

.item-status.已延期 {
  background: rgba(237,100,100,0.2);
  color: #ef6461;
}

.item-status.待验收 {
  background: rgba(74,144,217,0.2);
  color: #4a90d9;
}

.item-status.已验收 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.item-status.不通过 {
  background: rgba(237,100,100,0.2);
  color: #ef6461;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: rgba(255,255,255,0.4);
  font-size: 13px;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  width: 5px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 5;
}

.resize-handle:hover {
  background: rgba(100, 150, 255, 0.5);
}

.panel-actions {
  padding: 12px;
  border-top: 1px solid rgba(100, 150, 255, 0.15);
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px 2px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}

.add-btn {
  background: rgba(74, 144, 217, 0.25);
  color: #4a90d9;
  border: 1px solid rgba(74, 144, 217, 0.4);
}

.add-btn:hover {
  background: rgba(74, 144, 217, 0.4);
  color: #fff;
}

.edit-btn {
  background: rgba(72, 187, 120, 0.25);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.4);
}

.edit-btn:hover {
  background: rgba(72, 187, 120, 0.4);
  color: #fff;
}

.delete-btn {
  background: rgba(237, 137, 54, 0.25);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.4);
}

.delete-btn:hover {
  background: rgba(237, 137, 54, 0.4);
  color: #fff;
}

/* Form Panel */
.form-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 340px;
  max-width: 90vw;
  height: 100%;
  background: rgba(10, 22, 42, 0.96);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  flex-direction: column;
  color: #fff;
  box-shadow: -4px 0 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
}

.form-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(20, 40, 70, 0.4);
}

.form-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.form-content {
  padding: 20px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(100, 150, 255, 0.25);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: rgba(74, 144, 217, 0.6);
  background: rgba(255, 255, 255, 0.12);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group input[type="date"] {
  color: #fff;
}

.form-group input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.form-group select option {
  background: #1a2744;
  color: #fff;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row .form-group {
  flex: 1;
  min-width: 0;
}

.form-row .form-group input {
  width: 100%;
  min-width: 0;
}

.confirm-text {
  color: rgba(255, 150, 150, 0.9);
  font-size: 13px;
  padding: 10px 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
}

.btn-cancel, .btn-save {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-save {
  background: linear-gradient(135deg, #4a90d9, #3a7bc8);
  color: #fff;
}

.btn-save:hover {
  background: linear-gradient(135deg, #5a9fe9, #4a8bd8);
}

/* Detail View */
.detail-container {
  position: absolute;
  left: 100%;
  top: 0;
  height: 100%;
  z-index: 15;
}

.detail-view {
  width: 320px;
  height: 100%;
  background: rgba(8, 18, 36, 0.98);
  border-right: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
}

.detail-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(20, 40, 70, 0.3);
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.detail-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-btn {
  background: rgba(74, 144, 217, 0.15);
  border: 1px solid rgba(74, 144, 217, 0.3);
  color: #4a90d9;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.section-btn:hover {
  background: rgba(74, 144, 217, 0.3);
  color: #fff;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(100, 150, 255, 0.08);
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.info-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.info-status.进行中 {
  background: rgba(74,144,217,0.2);
  color: #4a90d9;
}

.info-status.已完成 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.info-status.已暂停 {
  background: rgba(237,137,54,0.2);
  color: #ed8936;
}

.info-status.已延期 {
  background: rgba(237,100,100,0.2);
  color: #ef6461;
}

.info-status.已收款 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.info-status.部分收款 {
  background: rgba(237,137,54,0.2);
  color: #ed8936;
}

.info-status.未收款 {
  background: rgba(150,150,150,0.2);
  color: #999;
}

.info-status.待验收 {
  background: rgba(74,144,217,0.2);
  color: #4a90d9;
}

.contract-list {
  max-height: 200px;
  overflow-y: auto;
}

.contract-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(100,150,255,0.08);
  transition: all 0.15s;
}

.contract-item:hover {
  background: rgba(100,150,255,0.1);
}

.contract-item.selected {
  background: rgba(74,144,217,0.2);
  border-left: 2px solid #4a90d9;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.contract-name {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contract-type {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}

.contract-amount {
  font-size: 11px;
  color: #48bb78;
  flex-shrink: 0;
}

.detail-actions {
  padding: 12px;
  border-top: 1px solid rgba(100, 150, 255, 0.15);
  display: flex;
  gap: 8px;
}

.resize-handle-detail {
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 5;
}

.resize-handle-detail:hover {
  background: rgba(100, 150, 255, 0.5);
}

.contract-category {
  margin-bottom: 16px;
}

.contract-category .category-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 0;
  border-bottom: 1px solid rgba(100, 150, 255, 0.1);
  margin-bottom: 8px;
}

/* Contract Detail Panel */
.contract-detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 320px;
  background: rgba(8, 18, 36, 0.98);
  border-left: 1px solid rgba(100, 150, 255, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 60;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
}

.info-value.amount {
  color: #48bb78;
  font-size: 14px;
}

.task-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.task-status.进行中 {
  background: rgba(74,144,217,0.2);
  color: #4a90d9;
}

.task-status.已完成 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.task-status.已验收 {
  background: rgba(72,187,120,0.2);
  color: #48bb78;
}

.contract-item.completed {
  opacity: 0.7;
}

.contract-item.completed .contract-name {
  text-decoration: line-through;
}
</style>
