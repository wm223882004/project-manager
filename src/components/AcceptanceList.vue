<template>
  <div class="list-container">
    <div class="list-header">
      <h3>验收确认单</h3>
      <button class="btn-add" @click="showAddModal = true">+ 新增</button>
    </div>

    <div class="search-bar">
      <input v-model="searchKeyword" placeholder="搜索验收确认单..." class="search-input" />
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>确认单名称</th>
            <th>关联项目</th>
            <th>状态</th>
            <th>验收日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredAcceptances" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.project_name || '-' }}</td>
            <td><span :class="['status', item.status]">{{ item.status }}</span></td>
            <td>{{ formatDate(item.date) }}</td>
            <td>
              <button class="btn-edit" @click="editItem(item)">编辑</button>
              <button class="btn-delete" @click="deleteItem(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || editingItem" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h4>{{ editingItem ? '编辑验收确认单' : '新增验收确认单' }}</h4>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label>关联项目</label>
            <select v-model="formData.project_id" required>
              <option value="">请选择项目</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>确认单名称</label>
            <input v-model="formData.name" required />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status">
              <option value="待验收">待验收</option>
              <option value="已验收">已验收</option>
              <option value="不通过">不通过</option>
            </select>
          </div>
          <div class="form-group">
            <label>验收日期</label>
            <input v-model="formData.date" type="date" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">取消</button>
            <button type="submit" class="btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const acceptances = ref([])
const projects = ref([])
const searchKeyword = ref('')
const showAddModal = ref(false)
const editingItem = ref(null)
const formData = ref({ project_id: '', name: '', status: '待验收', date: '' })

const filteredAcceptances = computed(() => {
  if (!searchKeyword.value) return acceptances.value
  const kw = searchKeyword.value.toLowerCase()
  return acceptances.value.filter(a =>
    (a.name && a.name.toLowerCase().includes(kw)) ||
    (a.project_name && a.project_name.toLowerCase().includes(kw))
  )
})

const loadAcceptances = async () => {
  try {
    acceptances.value = await window.electronAPI.getAcceptances()
  } catch (err) {
    console.error('Failed to load acceptances:', err)
  }
}

const loadProjects = async () => {
  try {
    projects.value = await window.electronAPI.getProjects()
  } catch (err) {
    console.error('Failed to load projects:', err)
  }
}

const saveItem = async () => {
  try {
    if (editingItem.value) {
      await window.electronAPI.updateAcceptance({ ...formData.value, id: editingItem.value.id })
    } else {
      await window.electronAPI.createAcceptance(formData.value)
    }
    closeModal()
    await loadAcceptances()
  } catch (err) {
    console.error('Failed to save acceptance:', err)
  }
}

const editItem = (item) => {
  editingItem.value = item
  formData.value = { ...item }
}

const deleteItem = async (id) => {
  if (confirm('确定要删除此验收确认单吗？')) {
    try {
      await window.electronAPI.deleteAcceptance(id)
      await loadAcceptances()
    } catch (err) {
      console.error('Failed to delete acceptance:', err)
    }
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingItem.value = null
  formData.value = { project_id: '', name: '', status: '待验收', date: '' }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadAcceptances()
  loadProjects()
})
</script>

<style scoped>
.list-container { display: flex; flex-direction: column; height: 100%; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h3 { font-size: 18px; color: #fff; margin: 0; }
.btn-add { background: #4a90d9; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.search-bar { margin-bottom: 12px; }
.search-input { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(100,150,255,0.3); border-radius: 6px; color: #fff; font-size: 14px; }
.table-wrapper { flex: 1; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 8px; text-align: left; border-bottom: 1px solid rgba(100,150,255,0.15); }
.data-table th { color: rgba(255,255,255,0.7); font-weight: 500; }
.data-table td { color: rgba(255,255,255,0.9); }
.status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status.待验收 { background: rgba(237,137,54,0.3); color: #ed8936; }
.status.已验收 { background: rgba(72,187,120,0.3); color: #48bb78; }
.status.不通过 { background: rgba(237,68,68,0.3); color: #ed4444; }
.btn-edit, .btn-delete { padding: 4px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px; }
.btn-edit { background: rgba(74,144,217,0.3); color: #4a90d9; }
.btn-delete { background: rgba(237,137,54,0.3); color: #ed8936; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a2744; border-radius: 12px; padding: 24px; width: 380px; border: 1px solid rgba(100,150,255,0.3); }
.modal h4 { margin: 0 0 20px 0; color: #fff; font-size: 18px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; color: rgba(255,255,255,0.8); font-size: 14px; }
.form-group input, .form-group select { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(100,150,255,0.3); border-radius: 6px; color: #fff; font-size: 14px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-cancel, .btn-save { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-cancel { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
.btn-save { background: #4a90d9; color: #fff; }
</style>
