<template>
  <div class="people-panel">
    <div class="panel-header">
      <h3>人员管理</h3>
    </div>
    <div class="panel-content">
      <p style="color: rgba(255,255,255,0.5); text-align: center; margin-top: 40px;">暂无人员数据</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.people-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.15);
  background: rgba(20, 40, 70, 0.3);
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.panel-content {
  flex: 1;
  padding: 16px;
}
</style>
