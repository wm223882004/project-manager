<template>
  <div class="location-picker" v-click-outside="closeDropdown">
    <div class="selected-display" @click="toggleDropdown">
      <span v-if="selectedPath.length === 0" class="placeholder">请选择国家/省/市/县/镇</span>
      <span v-else class="selected-text">{{ selectedPath.join(' / ') }}</span>
      <span class="arrow" :class="{ open: isOpen }">▼</span>
    </div>

    <div class="dropdown-panel" v-if="isOpen">
      <div class="search-box">
        <input v-model="searchQuery" placeholder="搜索地点..." @input="handleSearch" ref="searchInput" />
      </div>

      <div class="cascaded-levels">
        <div class="level-item" v-for="(level, levelIndex) in levels" :key="levelIndex">
          <div class="level-header">{{ levelNames[levelIndex] }}</div>
          <div class="level-options">
            <div v-if="getFilteredOptions(levelIndex).length === 0" class="no-data">无匹配结果</div>
            <div
              v-for="option in getFilteredOptions(levelIndex)"
              :key="option.code"
              :class="['option-item', { selected: selectedValues[levelIndex] === option.code }]"
              @click="selectOption(levelIndex, option)"
            >{{ option.name }}</div>
          </div>
        </div>
      </div>

      <div class="dropdown-footer">
        <button class="btn-clear" @click="clearSelection">清空</button>
        <button class="btn-confirm" @click="confirmSelection">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)
const selectedValues = ref(['', '', '', '', ''])
const selectedPath = ref([])

const levelNames = ['国家', '省/州', '城市', '县/区', '街道/镇']

const locationData = {
  '156': {
    name: '中国',
    children: {
      '110000': { name: '北京市', children: { '110101': '东城区', '110102': '西城区', '110105': '朝阳区' } },
      '310000': { name: '上海市', children: { '310101': '黄浦区', '310104': '徐汇区', '310105': '长宁区' } },
      '440000': { name: '广东省', children: { '440100': '广州市', '440300': '深圳市', '440400': '珠海市' } },
      '330000': { name: '浙江省', children: { '330100': '杭州市', '330200': '宁波市' } },
      '510000': { name: '四川省', children: { '510100': '成都市', '510300': '自贡市' } },
      '370000': { name: '山东省', children: { '370100': '济南市', '370200': '青岛市' } },
      '320000': { name: '江苏省', children: { '320100': '南京市', '320200': '苏州市' } },
      '410000': { name: '河南省', children: { '410100': '郑州市' } },
      '420000': { name: '湖北省', children: { '420100': '武汉市' } }
    }
  },
  '840': {
    name: '美国',
    children: {
      'NY': { name: '纽约州', children: { 'NYC': '纽约市' } },
      'CA': { name: '加利福尼亚州', children: { 'LA': '洛杉矶市', 'SF': '旧金山市' } },
      'TX': { name: '得克萨斯州', children: { 'HT': '休斯顿市', 'DL': '达拉斯市' } },
      'WA': { name: '华盛顿州', children: { 'SEA': '西雅图市' } }
    }
  },
  '826': {
    name: '英国',
    children: {
      'ENG': { name: '英格兰', children: { 'LDN': '大伦敦', 'MAN': '曼彻斯特市' } },
      'SCT': { name: '苏格兰', children: { 'EDH': '爱丁堡市', 'GLG': '格拉斯哥市' } }
    }
  },
  '392': {
    name: '日本',
    children: {
      '13': { name: '东京都', children: { '13101': '千代田区', '13102': '中央区' } },
      '14': { name: '神奈川县', children: { '14101': '横滨市鹤见区' } },
      '27': { name: '大阪府', children: { '27100': '大阪市北区' } }
    }
  },
  '250': {
    name: '法国',
    children: {
      '75': { name: '法兰西岛大区', children: { '751': '巴黎市' } },
      '13': { name: '普罗旺斯大区', children: { '132': '马赛市' } }
    }
  },
  '276': {
    name: '德国',
    children: {
      'BE': { name: '柏林州', children: { '11000': '米特区' } },
      'BY': { name: '巴伐利亚州', children: { '09162': '慕尼黑市', '09163': '纽伦堡市' } }
    }
  },
  '380': {
    name: '意大利',
    children: {
      'LOM': { name: '伦巴第大区', children: { '015': '米兰市' } },
      'LAZ': { name: '拉齐奥大区', children: { '058': '罗马市' } }
    }
  },
  '724': {
    name: '西班牙',
    children: {
      'MD': { name: '马德里自治区', children: { '079': '马德里市' } },
      'CT': { name: '加泰罗尼亚自治区', children: { '080': '巴塞罗那市' } }
    }
  },
  '410': {
    name: '韩国',
    children: {
      '11': { name: '首尔特别市', children: { '11110': '钟路区', '11140': '龙山区' } },
      '26': { name: '京畿道', children: { '41210': '水原市' } }
    }
  },
  '036': {
    name: '澳大利亚',
    children: {
      'NSW': { name: '新南威尔士州', children: { '127': '悉尼市' } },
      'VIC': { name: '维多利亚州', children: { '206': '墨尔本市' } }
    }
  },
  '124': {
    name: '加拿大',
    children: {
      'ON': { name: '安大略省', children: { '351': '多伦多市' } },
      'BC': { name: '不列颠哥伦比亚省', children: { '933': '温哥华市' } }
    }
  },
  '643': {
    name: '俄罗斯',
    children: {
      'MOW': { name: '莫斯科', children: { '453': '莫斯科市中心' } },
      'SPB': { name: '圣彼得堡', children: { '570': '圣彼得堡市中心' } }
    }
  },
  '702': {
    name: '新加坡',
    children: { 'SG': { name: '新加坡', children: { '014': '市中心', '015': '滨海湾' } } }
  }
}

const flattenData = (data, prefix = '') => {
  const result = {}
  for (const code in data) {
    const item = data[code]
    if (typeof item === 'string') {
      result[code] = { name: item, parent: prefix }
    } else if (item.name && item.children) {
      result[code] = { name: item.name, parent: prefix }
      Object.assign(result, flattenData(item.children, code))
    }
  }
  return result
}

const flatLocationData = flattenData(locationData)

const levels = ref([
  Object.keys(locationData).map(code => ({ code, name: locationData[code].name })),
  [], [], [], []
])

const getFilteredOptions = (levelIndex) => {
  if (levelIndex === 0) {
    return levels.value[0].filter(item => item.name.includes(searchQuery.value))
  }
  const parentCode = selectedValues.value[levelIndex - 1]
  if (!parentCode) return []
  return Object.entries(flatLocationData)
    .filter(([code, info]) => info.parent === parentCode)
    .map(([code, info]) => ({ code, name: info.name }))
}

const selectOption = (levelIndex, option) => {
  selectedValues.value[levelIndex] = option.code
  selectedPath.value[levelIndex] = option.name
  for (let i = levelIndex + 1; i < 5; i++) {
    selectedValues.value[i] = ''
    selectedPath.value[i] = ''
    levels.value[i] = []
  }
  const children = Object.entries(flatLocationData)
    .filter(([code, info]) => info.parent === option.code)
    .map(([code, info]) => ({ code, name: info.name }))
  if (children.length > 0) {
    levels.value[levelIndex + 1] = children
  }
  updateModelValue()
}

const handleSearch = () => {}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) nextTick(() => searchInput.value?.focus())
}

const closeDropdown = () => { isOpen.value = false }

const clearSelection = () => {
  selectedValues.value = ['', '', '', '', '']
  selectedPath.value = []
  levels.value = [Object.keys(locationData).map(code => ({ code, name: locationData[code].name })), [], [], [], []]
  updateModelValue()
}

const confirmSelection = () => { isOpen.value = false }

const updateModelValue = () => {
  emit('update:modelValue', {
    country: selectedValues.value[0] || '',
    countryName: selectedPath.value[0] || '',
    province: selectedValues.value[1] || '',
    provinceName: selectedPath.value[1] || '',
    city: selectedValues.value[2] || '',
    cityName: selectedPath.value[2] || '',
    district: selectedValues.value[3] || '',
    districtName: selectedPath.value[3] || '',
    street: selectedValues.value[4] || '',
    streetName: selectedPath.value[4] || ''
  })
}

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value() }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside) }
}
</script>

<style scoped>
.location-picker { position: relative; }

.selected-display {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; background: rgba(255,255,255,0.08);
  border: 1px solid rgba(100,150,255,0.25); border-radius: 8px; cursor: pointer;
}

.selected-display:hover { border-color: rgba(100,150,255,0.4); }
.selected-text { color: #fff; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.placeholder { color: rgba(255,255,255,0.4); }
.arrow { font-size: 10px; color: rgba(255,255,255,0.5); margin-left: 8px; transition: transform 0.2s; }
.arrow.open { transform: rotate(180deg); }

.dropdown-panel {
  position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px;
  background: rgba(15,30,55,0.98); border: 1px solid rgba(100,150,255,0.3);
  border-radius: 10px; z-index: 1000; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.search-box { padding: 12px; border-bottom: 1px solid rgba(100,150,255,0.15); }
.search-box input {
  width: 100%; padding: 9px 12px; background: rgba(255,255,255,0.08);
  border: 1px solid rgba(100,150,255,0.2); border-radius: 6px;
  color: #fff; font-size: 13px; box-sizing: border-box;
}
.search-box input:focus { outline: none; border-color: rgba(74,144,217,0.6); }
.search-box input::placeholder { color: rgba(255,255,255,0.4); }

.cascaded-levels { display: flex; max-height: 280px; overflow-x: auto; }
.level-item {
  flex: 1; min-width: 90px; border-right: 1px solid rgba(100,150,255,0.15);
}
.level-item:last-child { border-right: none; }
.level-header {
  padding: 10px 12px; font-size: 12px; color: rgba(255,255,255,0.5);
  background: rgba(100,150,255,0.08); border-bottom: 1px solid rgba(100,150,255,0.1);
}
.level-options { max-height: 220px; overflow-y: auto; }
.option-item {
  padding: 9px 12px; font-size: 13px; color: rgba(255,255,255,0.8);
  cursor: pointer; transition: all 0.15s;
}
.option-item:hover { background: rgba(100,150,255,0.15); color: #fff; }
.option-item.selected { background: rgba(74,144,217,0.3); color: #4a90d9; }
.no-data { padding: 20px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }

.dropdown-footer {
  display: flex; gap: 10px; padding: 12px;
  border-top: 1px solid rgba(100,150,255,0.15); background: rgba(100,150,255,0.05);
}
.dropdown-footer button { flex: 1; padding: 9px 12px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-clear { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.btn-clear:hover { background: rgba(255,255,255,0.15); color: #fff; }
.btn-confirm { background: rgba(74,144,217,0.3); color: #4a90d9; }
.btn-confirm:hover { background: rgba(74,144,217,0.5); color: #fff; }
</style>
