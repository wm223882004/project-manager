<template>
  <div class="city-picker">
    <div class="city-input-wrapper">
      <input
        ref="inputRef"
        v-model="searchText"
        @focus="showDropdown = true"
        @input="onSearch"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="showDropdown = false"
        :placeholder="placeholder"
        class="city-input"
      />
      <button v-if="selectedCity" class="clear-btn" @click="clearSelection">×</button>
    </div>
    <div v-if="showDropdown && filteredCities.length > 0" class="city-dropdown">
      <div
        v-for="(city, index) in filteredCities"
        :key="city.id"
        :class="['city-option', { highlighted: index === highlightIndex, selected: selectedCity && selectedCity.id === city.id }]"
        @click="selectCity(city)"
        @mouseenter="highlightIndex = index"
      >
        <span class="city-name">{{ city.display_name }}</span>
        <span v-if="city.level === 'province'" class="city-level">省</span>
        <span v-else-if="city.level === 'city'" class="city-level">市</span>
        <span v-else class="city-level">区/县</span>
      </div>
    </div>
    <div v-if="showDropdown && searchText && filteredCities.length === 0" class="city-no-result">
      未找到匹配的城市
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  placeholder: {
    type: String,
    default: '搜索城市...'
  }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const searchText = ref('')
const showDropdown = ref(false)
const allCities = ref([])
const filteredCities = ref([])
const highlightIndex = ref(0)
const selectedCity = ref(props.modelValue)

const loadCities = async () => {
  try {
    allCities.value = await window.electronAPI.getCities()
    filteredCities.value = allCities.value
  } catch (err) {
    console.error('Failed to load cities:', err)
  }
}

const onSearch = async () => {
  if (!searchText.value) {
    filteredCities.value = allCities.value
    return
  }
  try {
    filteredCities.value = await window.electronAPI.searchCities(searchText.value)
    highlightIndex.value = 0
  } catch (err) {
    console.error('Failed to search cities:', err)
  }
}

const selectCity = (city) => {
  selectedCity.value = city
  searchText.value = city.display_name
  showDropdown.value = false
  emit('update:modelValue', city)
}

const clearSelection = () => {
  selectedCity.value = null
  searchText.value = ''
  emit('update:modelValue', null)
  loadCities()
}

const moveDown = () => {
  if (highlightIndex.value < filteredCities.value.length - 1) {
    highlightIndex.value++
  }
}

const moveUp = () => {
  if (highlightIndex.value > 0) {
    highlightIndex.value--
  }
}

const selectHighlighted = () => {
  if (filteredCities.value.length > 0 && highlightIndex.value >= 0) {
    selectCity(filteredCities.value[highlightIndex.value])
  }
}

watch(() => props.modelValue, (val) => {
  selectedCity.value = val
  if (val) {
    searchText.value = val.display_name
  }
})

onMounted(() => {
  loadCities()
})
</script>

<style scoped>
.city-picker {
  position: relative;
}

.city-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.city-input {
  width: 100%;
  padding: 11px 14px;
  padding-right: 30px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(100, 150, 255, 0.25);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.city-input:focus {
  outline: none;
  border-color: rgba(74, 144, 217, 0.6);
  background: rgba(255, 255, 255, 0.12);
}

.city-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.clear-btn {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  background: rgba(255, 100, 100, 0.3);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: rgba(255, 100, 100, 0.5);
}

.city-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 280px;
  overflow-y: auto;
  background: rgba(20, 35, 60, 0.98);
  border: 1px solid rgba(100, 150, 255, 0.25);
  border-radius: 8px;
  margin-top: 4px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.city-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(100, 150, 255, 0.08);
}

.city-option:last-child {
  border-bottom: none;
}

.city-option:hover,
.city-option.highlighted {
  background: rgba(74, 144, 217, 0.2);
}

.city-option.selected {
  background: rgba(74, 144, 217, 0.3);
}

.city-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.city-level {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(100, 150, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.city-no-result {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  background: rgba(20, 35, 60, 0.98);
  border: 1px solid rgba(100, 150, 255, 0.25);
  border-radius: 8px;
  margin-top: 4px;
}
</style>
