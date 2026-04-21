<template>
  <div class="titlebar" @dblclick="toggleMaximize">
    <div class="titlebar-drag">项目管理器</div>
    <div class="titlebar-controls">
      <button class="control-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
        <span class="icon">{{ isFullscreen ? '⤓' : '⤢' }}</span>
      </button>
      <button class="control-btn minimize" @click="minimize" title="最小化">
        <span class="icon">─</span>
      </button>
      <button class="control-btn maximize" @click="toggleMaximize" title="最大化">
        <span class="icon">{{ isMaximized ? '❐' : '□' }}</span>
      </button>
      <button class="control-btn close" @click="closeWindow" title="关闭">
        <span class="icon">×</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMaximized = ref(false)
const isFullscreen = ref(false)

const minimize = () => {
  window.electronAPI?.minimize()
}

const toggleMaximize = () => {
  window.electronAPI?.toggleMaximize()
  isMaximized.value = !isMaximized.value
}

const toggleFullscreen = () => {
  window.electronAPI?.toggleFullscreen()
  isFullscreen.value = !isFullscreen.value
}

const closeWindow = () => {
  window.electronAPI?.close()
}
</script>

<style scoped>
.titlebar {
  height: 32px;
  background: rgba(10, 20, 40, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  user-select: none;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.titlebar-drag {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: default;
}

.titlebar-controls {
  display: flex;
  gap: 2px;
}

.control-btn {
  width: 40px;
  height: 28px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn.close:hover {
  background: #e81123;
  color: #fff;
}

.icon {
  line-height: 1;
}
</style>
