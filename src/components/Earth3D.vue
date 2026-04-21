<template>
  <div ref="containerRef" class="earth-container">
    <div ref="labelContainer" class="label-container"></div>
    <div ref="tooltipRef" class="project-tooltip" v-if="hoveredProject">
      <div class="tooltip-title">{{ hoveredProject.name }}</div>
      <div class="tooltip-code">{{ hoveredProject.code }}</div>
      <div class="tooltip-status" :class="hoveredProject.status">{{ hoveredProject.status }}</div>
      <div class="tooltip-manager">负责人: {{ hoveredProject.manager }}</div>
    </div>
    <div class="earth-controls" v-if="showControls">
      <label class="control-item">
        <input type="checkbox" v-model="showLabels" />
        <span>显示地名</span>
      </label>
      <label class="control-item">
        <input type="checkbox" v-model="autoRotate" @change="toggleAutoRotate" />
        <span>自动旋转</span>
      </label>
      <label class="control-item">
        <input type="checkbox" v-model="showProjectMarkers" />
        <span>显示项目</span>
      </label>
    </div>
    <div class="status-filter" v-if="showProjectMarkers">
      <span class="filter-label">状态筛选:</span>
      <button
        v-for="status in projectStatuses"
        :key="status"
        :class="['filter-btn', status, { active: activeStatusFilter.includes(status) }]"
        @click="toggleStatusFilter(status)"
      >
        {{ status }}
      </button>
      <button
        :class="['filter-btn', 'all', { active: activeStatusFilter.length === 0 }]"
        @click="clearStatusFilter"
      >
        全部
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import html2canvas from 'html2canvas'

const emit = defineEmits(['showProject'])

const props = defineProps({
  projects: { type: Array, default: () => [] }
})

const containerRef = ref(null)
const labelContainer = ref(null)
const tooltipRef = ref(null)
const showControls = ref(false)
const showLabels = ref(true)
const showProjectMarkers = ref(true)
const autoRotate = ref(true)
const hoveredProject = ref(null)
const projectStatuses = ['进行中', '已完成', '已暂停', '已延期']
const activeStatusFilter = ref([])

const toggleStatusFilter = (status) => {
  const index = activeStatusFilter.value.indexOf(status)
  if (index === -1) {
    activeStatusFilter.value.push(status)
  } else {
    activeStatusFilter.value.splice(index, 1)
  }
  filterProjectMarkers()
}

const clearStatusFilter = () => {
  activeStatusFilter.value = []
  filterProjectMarkers()
}
let scene, camera, renderer, controls, earth, labelSprites = []
let projectMarkers = []
let animationId
let isAutoRotating = true
let sunLight
let raycaster
let mouse

// 城市数据
const cities = [
  { name: '北京', lat: 39.9, lon: 116.4 },
  { name: '上海', lat: 31.2, lon: 121.5 },
  { name: '纽约', lat: 40.7, lon: -74.0 },
  { name: '伦敦', lat: 51.5, lon: -0.1 },
  { name: '巴黎', lat: 48.9, lon: 2.4 },
  { name: '东京', lat: 35.7, lon: 139.7 },
  { name: '悉尼', lat: -33.9, lon: 151.2 },
  { name: '莫斯科', lat: 55.8, lon: 37.6 },
  { name: '迪拜', lat: 25.2, lon: 55.3 },
  { name: '新加坡', lat: 1.4, lon: 103.8 },
  { name: '里约热内卢', lat: -22.9, lon: -43.2 },
  { name: '开普敦', lat: -33.9, lon: 18.4 },
  { name: '孟买', lat: 19.1, lon: 72.9 },
  { name: '首尔', lat: 37.6, lon: 127.0 },
  { name: '开罗', lat: 30.1, lon: 31.2 },
  { name: '洛杉矶', lat: 34.1, lon: -118.2 },
  { name: '芝加哥', lat: 41.9, lon: -87.6 },
  { name: '多伦多', lat: 43.7, lon: -79.4 },
  { name: '柏林', lat: 52.5, lon: 13.4 },
  { name: '罗马', lat: 41.9, lon: 12.6 }
]

// 城市名到经纬度的映射
const cityCoords = {
  '北京': { lat: 39.9, lon: 116.4 },
  '北京市': { lat: 39.9, lon: 116.4 },
  '上海': { lat: 31.2, lon: 121.5 },
  '上海市': { lat: 31.2, lon: 121.5 },
  '广州': { lat: 23.1, lon: 113.3 },
  '广州市': { lat: 23.1, lon: 113.3 },
  '深圳': { lat: 22.5, lon: 114.1 },
  '深圳市': { lat: 22.5, lon: 114.1 },
  '杭州': { lat: 30.3, lon: 120.2 },
  '杭州市': { lat: 30.3, lon: 120.2 },
  '成都': { lat: 30.6, lon: 104.1 },
  '成都市': { lat: 30.6, lon: 104.1 },
  '武汉': { lat: 30.6, lon: 114.3 },
  '武汉市': { lat: 30.6, lon: 114.3 },
  '西安': { lat: 34.3, lon: 108.9 },
  '西安市': { lat: 34.3, lon: 108.9 },
  '重庆': { lat: 29.4, lon: 106.5 },
  '重庆市': { lat: 29.4, lon: 106.5 },
  '天津': { lat: 39.1, lon: 117.2 },
  '天津市': { lat: 39.1, lon: 117.2 },
  '南京': { lat: 32.1, lon: 118.8 },
  '南京市': { lat: 32.1, lon: 118.8 },
  '苏州': { lat: 31.3, lon: 120.6 },
  '苏州市': { lat: 31.3, lon: 120.6 },
  '青岛': { lat: 36.1, lon: 120.4 },
  '青岛市': { lat: 36.1, lon: 120.4 },
  '大连': { lat: 38.9, lon: 121.6 },
  '大连市': { lat: 38.9, lon: 121.6 },
  '沈阳': { lat: 41.8, lon: 123.4 },
  '沈阳市': { lat: 41.8, lon: 123.4 },
  '长沙': { lat: 28.2, lon: 112.9 },
  '长沙市': { lat: 28.2, lon: 112.9 },
  '郑州': { lat: 34.7, lon: 113.6 },
  '郑州市': { lat: 34.7, lon: 113.6 },
  '济南': { lat: 36.6, lon: 117.0 },
  '济南市': { lat: 36.6, lon: 117.0 },
  '福州': { lat: 26.1, lon: 119.3 },
  '福州市': { lat: 26.1, lon: 119.3 },
  '厦门': { lat: 24.5, lon: 118.1 },
  '厦门市': { lat: 24.5, lon: 118.1 },
  '昆明': { lat: 25.0, lon: 102.7 },
  '昆明市': { lat: 25.0, lon: 102.7 },
  '哈尔滨': { lat: 45.8, lon: 126.5 },
  '哈尔滨市': { lat: 45.8, lon: 126.5 },
  '长春': { lat: 43.9, lon: 125.3 },
  '长春市': { lat: 43.9, lon: 125.3 },
  '石家庄': { lat: 38.0, lon: 114.5 },
  '石家庄市': { lat: 38.0, lon: 114.5 },
  '太原': { lat: 37.9, lon: 112.5 },
  '太原市': { lat: 37.9, lon: 112.5 },
  '南昌': { lat: 28.7, lon: 115.9 },
  '南昌市': { lat: 28.7, lon: 115.9 },
  '贵阳': { lat: 26.6, lon: 106.7 },
  '贵阳市': { lat: 26.6, lon: 106.7 },
  '南宁': { lat: 22.8, lon: 108.3 },
  '南宁市': { lat: 22.8, lon: 108.3 },
  '海口': { lat: 20.0, lon: 110.3 },
  '海口市': { lat: 20.0, lon: 110.3 },
  '拉萨': { lat: 29.6, lon: 91.1 },
  '拉萨市': { lat: 29.6, lon: 91.1 },
  '乌鲁木齐': { lat: 43.8, lon: 87.6 },
  '乌鲁木齐市': { lat: 43.8, lon: 87.6 },
  '兰州': { lat: 36.1, lon: 103.8 },
  '兰州市': { lat: 36.1, lon: 103.8 },
  '西宁': { lat: 36.6, lon: 101.8 },
  '西宁市': { lat: 36.6, lon: 101.8 },
  '呼和浩特': { lat: 40.8, lon: 111.7 },
  '呼和浩特市': { lat: 40.8, lon: 111.7 },
  '银川': { lat: 38.5, lon: 106.3 },
  '银川市': { lat: 38.5, lon: 106.3 },
  '乌鲁木齐': { lat: 43.8, lon: 87.6 },
  '东莞': { lat: 23.0, lon: 113.7 },
  '佛山市': { lat: 23.0, lon: 113.1 },
  '宁波': { lat: 29.9, lon: 121.6 },
  '宁波市': { lat: 29.9, lon: 121.6 },
  '无锡': { lat: 31.5, lon: 120.3 },
  '无锡市': { lat: 31.5, lon: 120.3 },
  '常州': { lat: 31.8, lon: 119.9 },
  '常州市': { lat: 31.8, lon: 119.9 },
  '徐州': { lat: 34.2, lon: 117.2 },
  '徐州市': { lat: 34.2, lon: 117.2 },
  '温州': { lat: 28.0, lon: 120.7 },
  '温州市': { lat: 28.0, lon: 120.7 },
  '嘉兴': { lat: 30.7, lon: 120.8 },
  '嘉兴市': { lat: 30.7, lon: 120.8 },
  '湖州': { lat: 30.9, lon: 120.1 },
  '湖州市': { lat: 30.9, lon: 120.1 },
  '绍兴': { lat: 30.0, lon: 120.6 },
  '绍兴市': { lat: 30.0, lon: 120.6 },
  '金华': { lat: 29.1, lon: 119.6 },
  '金华市': { lat: 29.1, lon: 119.6 },
  '台州': { lat: 28.7, lon: 121.0 },
  '台州市': { lat: 28.7, lon: 121.0 },
  '南通': { lat: 32.0, lon: 120.9 },
  '南通市': { lat: 32.0, lon: 120.9 },
  '扬州': { lat: 32.4, lon: 119.4 },
  '扬州市': { lat: 32.4, lon: 119.4 },
  '盐城': { lat: 33.4, lon: 120.1 },
  '盐城市': { lat: 33.4, lon: 120.1 },
  '连云港': { lat: 34.6, lon: 119.2 },
  '连云港市': { lat: 34.6, lon: 119.2 },
  '镇江': { lat: 32.2, lon: 119.5 },
  '镇江市': { lat: 32.2, lon: 119.5 },
  '泰州': { lat: 32.5, lon: 119.9 },
  '泰州市': { lat: 32.5, lon: 119.9 },
  '宿迁': { lat: 33.9, lon: 118.3 },
  '宿迁市': { lat: 33.9, lon: 118.3 },
  '舟山': { lat: 30.0, lon: 122.1 },
  '舟山市': { lat: 30.0, lon: 122.1 },
  '丽水': { lat: 28.5, lon: 119.9 },
  '丽水市': { lat: 28.5, lon: 119.9 },
  '衢州': { lat: 28.9, lon: 118.9 },
  '衢州市': { lat: 28.9, lon: 118.9 },
  '芜湖': { lat: 31.4, lon: 118.4 },
  '芜湖市': { lat: 31.4, lon: 118.4 },
  '蚌埠': { lat: 32.9, lon: 117.4 },
  '蚌埠市': { lat: 32.9, lon: 117.4 },
  '淮南': { lat: 32.6, lon: 117.0 },
  '淮南市': { lat: 32.6, lon: 117.0 },
  '马鞍山': { lat: 31.7, lon: 118.5 },
  '马鞍山市': { lat: 31.7, lon: 118.5 },
  '淮北': { lat: 33.9, lon: 116.8 },
  '淮北市': { lat: 33.9, lon: 116.8 },
  '铜陵': { lat: 30.9, lon: 117.8 },
  '铜陵市': { lat: 30.9, lon: 117.8 },
  '安庆': { lat: 30.5, lon: 117.0 },
  '安庆市': { lat: 30.5, lon: 117.0 },
  '黄山': { lat: 29.7, lon: 118.3 },
  '黄山市': { lat: 29.7, lon: 118.3 },
  '滁州': { lat: 32.3, lon: 118.3 },
  '滁州市': { lat: 32.3, lon: 118.3 },
  '阜阳': { lat: 32.9, lon: 115.8 },
  '阜阳市': { lat: 32.9, lon: 115.8 },
  '宿州': { lat: 33.6, lon: 116.9 },
  '宿州市': { lat: 33.6, lon: 116.9 },
  '六安': { lat: 31.7, lon: 116.5 },
  '六安市': { lat: 31.7, lon: 116.5 },
  '亳州': { lat: 33.8, lon: 115.8 },
  '亳州市': { lat: 33.8, lon: 115.8 },
  '池州': { lat: 30.6, lon: 117.5 },
  '池州市': { lat: 30.6, lon: 117.5 },
  '宣城': { lat: 30.9, lon: 118.8 },
  '宣城市': { lat: 30.9, lon: 118.8 },
  '大兴区': { lat: 39.7, lon: 116.4 },
  '朝阳区': { lat: 39.9, lon: 116.4 },
  '丰台区': { lat: 39.8, lon: 116.3 },
  '海淀区': { lat: 39.9, lon: 116.3 },
  '西城区': { lat: 39.9, lon: 116.4 },
  '东城区': { lat: 39.9, lon: 116.4 },
  '通州区': { lat: 39.9, lon: 116.6 },
  '昌平区': { lat: 40.2, lon: 116.2 },
  '顺义区': { lat: 40.1, lon: 116.6 },
  '房山区': { lat: 39.7, lon: 115.9 },
  '门头沟区': { lat: 39.9, lon: 115.8 },
  '石景山区': { lat: 39.9, lon: 116.2 },
  // 国外城市
  '纽约': { lat: 40.7, lon: -74.0 },
  '洛杉矶': { lat: 34.1, lon: -118.2 },
  '旧金山': { lat: 37.8, lon: -122.4 },
  '芝加哥': { lat: 41.9, lon: -87.6 },
  '伦敦': { lat: 51.5, lon: -0.1 },
  '巴黎': { lat: 48.9, lon: 2.4 },
  '东京': { lat: 35.7, lon: 139.7 },
  '新加坡': { lat: 1.4, lon: 103.8 },
  '悉尼': { lat: -33.9, lon: 151.2 },
  '迪拜': { lat: 25.2, lon: 55.3 },
  '莫斯科': { lat: 55.8, lon: 37.6 },
  '首尔': { lat: 37.6, lon: 127.0 },
  '柏林': { lat: 52.5, lon: 13.4 },
  '罗马': { lat: 41.9, lon: 12.6 }
}

// 经纬度转球面坐标
const lon2xyz = (R, longitude, latitude) => {
  let lon = longitude * Math.PI / 180
  const lat = latitude * Math.PI / 180
  lon = -lon
  const x = R * Math.cos(lat) * Math.cos(lon)
  const y = R * Math.sin(lat)
  const z = R * Math.cos(lat) * Math.sin(lon)
  return new THREE.Vector3(x, y, z)
}

const init = () => {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
  camera.position.z = 4

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 1.5
  controls.maxDistance = 8
  controls.enablePan = false
  controls.addEventListener('start', onControlsStart)

  raycaster = new THREE.Raycaster()
  raycaster.params.Sprite = { threshold: 0.1 }
  mouse = new THREE.Vector2()

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)

  createStarfield()
  createEarth()
  createEarthGlow()
  createAtmosphere()
  createLighting()

  // Create project markers after scene is ready
  nextTick(() => {
    if (props.projects && props.projects.length > 0) {
      createProjectMarkers()
    }
  })

  window.addEventListener('resize', onResize)
  showControls.value = true
  animate()
}

const onMouseMove = (event) => {
  if (!renderer || !camera) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (showProjectMarkers.value && projectMarkers.length > 0) {
    raycaster.setFromCamera(mouse, camera)

    // 获取所有标记的子对象用于检测
    const markerMeshes = []
    projectMarkers.forEach(group => {
      if (group.visible) {
        group.children.forEach(child => {
          if (child.isMesh) {
            markerMeshes.push(child)
          }
        })
      }
    })

    const intersects = raycaster.intersectObjects(markerMeshes)

    if (intersects.length > 0) {
      // 找到对应的group
      const hitMesh = intersects[0].object
      let hitGroup = null
      projectMarkers.forEach(group => {
        if (group.children.includes(hitMesh)) {
          hitGroup = group
        }
      })

      if (hitGroup && hitGroup.userData.project) {
        hoveredProject.value = hitGroup.userData.project

        // Position tooltip
        if (tooltipRef.value) {
          const screenPos = intersects[0].point.clone().project(camera)
          const x = (screenPos.x * 0.5 + 0.5) * rect.width
          const y = (-screenPos.y * 0.5 + 0.5) * rect.height
          tooltipRef.value.style.left = `${x + 15}px`
          tooltipRef.value.style.top = `${y - 10}px`
          tooltipRef.value.style.opacity = '1'
        }
      }
    } else {
      hoveredProject.value = null
      if (tooltipRef.value) {
        tooltipRef.value.style.opacity = '0'
      }
    }
  }
}

const onControlsStart = () => {
  if (isAutoRotating) {
    autoRotate.value = false
    isAutoRotating = false
  }
}

const onClick = (event) => {
  if (!renderer || !camera) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  if (showProjectMarkers.value && projectMarkers.length > 0) {
    raycaster.setFromCamera(mouse, camera)

    // 获取所有可点击对象（mesh和sprite）
    const clickables = []
    projectMarkers.forEach(group => {
      if (group.visible) {
        group.children.forEach(child => {
          if (child.isMesh || child.isSprite) {
            clickables.push(child)
          }
        })
      }
    })

    const intersects = raycaster.intersectObjects(clickables)

    if (intersects.length > 0) {
      const hitObject = intersects[0].object
      let hitGroup = null
      projectMarkers.forEach(group => {
        if (group.children.includes(hitObject)) {
          hitGroup = group
        }
      })

      if (hitGroup && hitGroup.userData.project) {
        emit('showProject', hitGroup.userData.project)
      }
    }
  }
}

const createStarfield = () => {
  // 星空点
  const starsGeometry = new THREE.BufferGeometry()
  const vertices = []
  const colors = []

  for (let i = 0; i < 3000; i++) {
    const x = 800 * Math.random() - 400
    const y = 800 * Math.random() - 400
    const z = 800 * Math.random() - 400
    vertices.push(x, y, z)
    colors.push(1, 1, 1)
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  const starsMaterial = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    color: 0x81ffff,
    transparent: true,
    opacity: 0.8
  })

  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)
}

const createEarth = () => {
  // Load texture using THREE.TextureLoader with correct path
  const loader = new THREE.TextureLoader()
  // Use direct path - works in both dev and production
  const texturePath = import.meta.env.DEV ? '/earth.jpg' : './earth.jpg'
  loader.load(
    texturePath,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      const earthGeometry = new THREE.SphereGeometry(1, 64, 64)
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        specular: new THREE.Color(0x333333),
        shininess: 15
      })
      earth = new THREE.Mesh(earthGeometry, earthMaterial)
      scene.add(earth)
    },
    undefined,
    (error) => {
      console.error('Failed to load earth texture:', error)
      createFallbackEarth()
    }
  )
}

const createFallbackEarth = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1e5d7a'
  ctx.fillRect(0, 0, 512, 256)
  const texture = new THREE.CanvasTexture(canvas)
  const earthGeometry = new THREE.SphereGeometry(1, 64, 64)
  const earthMaterial = new THREE.MeshPhongMaterial({ map: texture })
  earth = new THREE.Mesh(earthGeometry, earthMaterial)
  scene.add(earth)
}

const createEarthGlow = () => {
  // 地球辉光 - 只保留一层淡淡的
  const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x4a90d9,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  scene.add(glow)
}

const createAtmosphere = () => {
  // 大气层效果
  const atmosphereGeometry = new THREE.SphereGeometry(1.01, 64, 64)
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  scene.add(atmosphere)
}

const createMarkupPoints = async () => {
  // 已禁用 - 标记功能暂时移除
}

const createLabels = async () => {
  labelSprites.forEach(sprite => scene.remove(sprite))
  labelSprites = []

  if (!showLabels.value) return

  for (const city of cities) {
    const pos = lon2xyz(1.08, city.lon, city.lat)

    // 创建HTML标签
    const labelDiv = document.createElement('div')
    labelDiv.className = 'city-label'
    labelDiv.textContent = city.name
    labelDiv.style.cssText = `
      color: white;
      background: rgba(0, 50, 80, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
    `

    // 截图并创建纹理
    try {
      const canvas = await html2canvas(labelDiv, {
        backgroundColor: null,
        scale: 2
      })
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      })
      const sprite = new THREE.Sprite(material)
      sprite.position.copy(pos)
      sprite.scale.set(0.15, 0.05, 1)
      scene.add(sprite)
      labelSprites.push(sprite)
    } catch (e) {
      console.warn('Label creation failed:', e)
    }
  }
}

const createLighting = () => {
  const ambientLight = new THREE.AmbientLight(0x334455)
  scene.add(ambientLight)

  sunLight = new THREE.DirectionalLight(0xffffff, 1.8)
  sunLight.position.set(5, 3, 5)
  sunLight.castShadow = true
  scene.add(sunLight)

  // 补光
  const fillLight = new THREE.DirectionalLight(0x6688cc, 0.3)
  fillLight.position.set(-5, -3, -5)
  scene.add(fillLight)
}

const clearProjectMarkers = () => {
  projectMarkers.forEach(marker => scene.remove(marker))
  projectMarkers = []
}

const filterProjectMarkers = () => {
  projectMarkers.forEach(marker => {
    const project = marker.userData.project
    if (activeStatusFilter.value.length === 0) {
      marker.visible = true
    } else {
      marker.visible = activeStatusFilter.value.includes(project.status)
    }
  })
}

// 状态颜色映射
const statusColors = {
  '进行中': 0x4a90d9,  // 蓝色
  '已完成': 0x48bb78,  // 绿色
  '已暂停': 0xed8936,  // 橙色
  '已延期': 0xef6461  // 红色
}

const createProjectMarkers = () => {
  console.log('[Earth3D] createProjectMarkers called, projects:', props.projects.length, 'showProjectMarkers:', showProjectMarkers.value)
  clearProjectMarkers()

  if (!showProjectMarkers.value) {
    console.log('[Earth3D] showProjectMarkers is false, skipping')
    return
  }

  // Group projects by location
  const projectsByLocation = {}
  props.projects.forEach(p => {
    // Try to get lat/lon - from project directly or from cityCoords fallback
    let lat = p.lat
    let lon = p.lon

    if ((!lat || !lon) && p.location) {
      const locationName = p.location.replace(/市|区|县/g, '')
      if (cityCoords[p.location]) {
        lat = cityCoords[p.location].lat
        lon = cityCoords[p.location].lon
      } else if (cityCoords[locationName]) {
        lat = cityCoords[locationName].lat
        lon = cityCoords[locationName].lon
      }
    }

    if ((!lat || !lon) && p.city_name) {
      const cityName = p.city_name.replace(/市|区|县/g, '')
      if (cityCoords[p.city_name]) {
        lat = cityCoords[p.city_name].lat
        lon = cityCoords[p.city_name].lon
      } else if (cityCoords[cityName]) {
        lat = cityCoords[cityName].lat
        lon = cityCoords[cityName].lon
      }
    }

    if (lat && lon) {
      const key = `${lat},${lon}`
      if (!projectsByLocation[key]) {
        projectsByLocation[key] = []
      }
      projectsByLocation[key].push(p)
    }
  })

  console.log('[Earth3D] projects with location:', Object.keys(projectsByLocation).length)

  // Create markers for each location
  Object.entries(projectsByLocation).forEach(([key, projects], locationIndex) => {
    const [lat, lon] = key.split(',').map(Number)

    // 同一位置的多个项目，水平错开（不同角度）
    projects.forEach((project, index) => {
      const angleOffset = (index - (projects.length - 1) / 2) * 0.12 // 角度偏移
      const pos = lon2xyz(1.025, lon, lat)

      // 创建标记组
      const markerGroup = new THREE.Group()
      markerGroup.userData.project = project
      markerGroup.userData.basePosition = pos.clone()
      markerGroup.userData.angleOffset = angleOffset
      markerGroup.userData.locationIndex = locationIndex
      markerGroup.userData.index = index
      markerGroup.userData.label = null // 标签引用

      // 四棱锥（尖朝下）
      const color = statusColors[project.status] || 0x4a90d9
      const coneGeometry = new THREE.ConeGeometry(0.01, 0.02, 4)
      const coneMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        specular: 0x666666
      })
      const cone = new THREE.Mesh(coneGeometry, coneMaterial)
      cone.rotation.x = Math.PI // 尖朝下
      markerGroup.add(cone)

      // 光环（圆环）
      const ringGeometry = new THREE.RingGeometry(0.012, 0.016, 4)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ring.position.y = -0.012
      markerGroup.add(ring)
      markerGroup.userData.ring = ring

      // 创建标签（项目编号+名称）
      const labelCanvas = document.createElement('canvas')
      const ctx = labelCanvas.getContext('2d')
      labelCanvas.width = 320
      labelCanvas.height = 100

      // 解析状态颜色为RGB
      const r = (color >> 16) & 255
      const g = (color >> 8) & 255
      const b = color & 255

      // 状态颜色半透明背景
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`
      ctx.beginPath()
      ctx.roundRect(0, 0, 320, 100, 12)
      ctx.fill()

      // 深色遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.roundRect(2, 2, 316, 96, 10)
      ctx.fill()

      // 内层状态颜色背景
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`
      ctx.beginPath()
      ctx.roundRect(4, 4, 312, 92, 8)
      ctx.fill()

      // 白色边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(4, 4, 312, 92, 8)
      ctx.stroke()

      // 项目编号（更大更醒目）
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(project.code, 160, 35)

      // 项目名称
      ctx.font = '16px Arial'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      const displayName = project.name.length > 16 ? project.name.substring(0, 16) + '...' : project.name
      ctx.fillText(displayName, 160, 65)

      const labelTexture = new THREE.CanvasTexture(labelCanvas)
      labelTexture.needsUpdate = true
      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        depthTest: false
      })
      const label = new THREE.Sprite(labelMaterial)
      label.scale.set(0.08, 0.025, 1)
      label.position.y = 0.04
      label.visible = true
      label.userData.isLabel = true
      markerGroup.add(label)
      markerGroup.userData.label = label

      // 设置位置（带角度偏移）
      const finalPos = new THREE.Vector3(
        pos.x + Math.sin(angleOffset) * 0.015,
        pos.y,
        pos.z + Math.cos(angleOffset) * 0.015
      )
      markerGroup.position.copy(finalPos)

      scene.add(markerGroup)
      projectMarkers.push(markerGroup)
    })
  })
}

watch(() => props.projects, () => {
  nextTick(() => createProjectMarkers())
}, { deep: true })

watch(showProjectMarkers, () => {
  createProjectMarkers()
})

const toggleAutoRotate = () => {
  isAutoRotating = autoRotate.value
}

// Expose method for parent to call
const forceUpdateMarkers = () => {
  console.log('[Earth3D] forceUpdateMarkers called')
  createProjectMarkers()
}

defineExpose({
  forceUpdateMarkers
})

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 太阳光跟随相机，始终照亮视野方向
  if (sunLight) {
    const cameraDir = camera.position.clone().normalize()
    sunLight.position.copy(cameraDir.multiplyScalar(10))
  }

  if (earth && isAutoRotating) {
    earth.rotation.y += 0.002
  }

  // 旋转标签
  if (earth && isAutoRotating && showLabels.value) {
    labelSprites.forEach((sprite, i) => {
      const city = cities[i]
      const pos = lon2xyz(1.08, city.lon, city.lat)
      sprite.position.copy(pos)
    })
  }

  // 旋转项目标记 - 跟随地球
  if (earth && isAutoRotating && showProjectMarkers.value) {
    projectMarkers.forEach((group) => {
      const basePos = group.userData.basePosition
      const angleOffset = group.userData.angleOffset
      if (basePos) {
        // 绕Y轴旋转 (正确的旋转矩阵)
        const angle = earth.rotation.y
        const x = basePos.x * Math.cos(angle) + basePos.z * Math.sin(angle)
        const z = -basePos.x * Math.sin(angle) + basePos.z * Math.cos(angle)

        // 重新应用角度偏移
        const finalX = x + Math.sin(angleOffset) * 0.015
        const finalZ = z + Math.cos(angleOffset) * 0.015
        group.position.set(finalX, basePos.y, finalZ)
      }
    })
  }

  // 标签背面检测 - 转到背面时隐藏
  if (showProjectMarkers.value && camera) {
    projectMarkers.forEach((group) => {
      const label = group.userData.label
      if (label && group.visible) {
        // 计算标签位置（世界坐标）
        const labelWorldPos = new THREE.Vector3()
        label.getWorldPosition(labelWorldPos)

        // 计算从相机到标签的方向
        const toCamera = camera.position.clone().normalize()

        // 如果标签在相机背后（点积为负），隐藏标签
        const dot = labelWorldPos.normalize().dot(toCamera)
        label.visible = dot > 0
      }
    })
  }

  // 光环脉冲动画
  if (showProjectMarkers.value) {
    ringPulseTime += 0.05
    const pulseScale = 1 + Math.sin(ringPulseTime) * 0.3 // 1到1.3之间脉冲
    projectMarkers.forEach((group) => {
      if (group.visible && group.userData.ring) {
        group.userData.ring.scale.set(pulseScale, pulseScale, 1)
        group.userData.ring.material.opacity = 0.3 + Math.sin(ringPulseTime) * 0.3
      }
    })
  }

  controls.update()
  renderer.render(scene, camera)
}

// 光环动画状态
let ringPulseTime = 0

const onResize = () => {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

watch(showLabels, () => {
  labelSprites.forEach(sprite => {
    sprite.visible = showLabels.value
  })
})

onMounted(() => {
  init()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.earth-container {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.label-container {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

.earth-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 20, 40, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(100, 150, 255, 0.3);
  padding: 10px 20px;
  display: flex;
  gap: 20px;
  color: #fff;
  font-size: 14px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.control-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.status-filter {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 20, 40, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(100, 150, 255, 0.3);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 13px;
}

.filter-label {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 4px;
}

.filter-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid rgba(100, 150, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: rgba(74, 144, 217, 0.4);
  border-color: rgba(74, 144, 217, 0.6);
  color: #fff;
}

.filter-btn.进行中.active {
  background: rgba(74, 144, 217, 0.4);
  border-color: rgba(74, 144, 217, 0.6);
}

.filter-btn.已完成.active {
  background: rgba(72, 187, 120, 0.4);
  border-color: rgba(72, 187, 120, 0.6);
}

.filter-btn.已暂停.active {
  background: rgba(237, 137, 54, 0.4);
  border-color: rgba(237, 137, 54, 0.6);
}

.filter-btn.已延期.active {
  background: rgba(237, 100, 100, 0.4);
  border-color: rgba(237, 100, 100, 0.6);
}

.filter-btn.all.active {
  background: rgba(100, 150, 255, 0.4);
  border-color: rgba(100, 150, 255, 0.6);
}

.project-tooltip {
  position: absolute;
  background: rgba(10, 25, 50, 0.95);
  border: 1px solid rgba(100, 150, 255, 0.4);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 13px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1000;
  min-width: 160px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: #fff;
}

.tooltip-code {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.tooltip-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-bottom: 8px;
}

.tooltip-status.进行中 {
  background: rgba(74, 144, 217, 0.3);
  color: #4a90d9;
}

.tooltip-status.已完成 {
  background: rgba(72, 187, 120, 0.3);
  color: #48bb78;
}

.tooltip-status.已暂停 {
  background: rgba(237, 137, 54, 0.3);
  color: #ed8936;
}

.tooltip-status.已延期 {
  background: rgba(237, 100, 100, 0.3);
  color: #ef6461;
}

.tooltip-manager {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>

<style>
.city-label {
  pointer-events: none;
}
</style>
