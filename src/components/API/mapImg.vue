<template>
    <div class="map-wrapper">
        <!-- Loading state -->
        <div class="mapDisplay_background map-loader" v-if="isLoading" :style="{ transform: `scale(${mapScale})` }">
            <div class="loader-spinner"></div>
            <span class="loader-text">Loading map…</span>
        </div>

        <!-- Error state -->
        <div class="mapDisplay_background  map-error" v-else-if="hasError" :style="{ transform: `scale(${mapScale})`}">
            <span>⚠ Failed to load map</span>
        </div>

        <!-- Map image -->
        <img
            class="mapDisplay_background"
            :src="mapImageUrl"
            :alt="resolvedMapName"
            v-if="mapImageUrl"
            :id="`originalFrom_${originClass}`"
            :style="{ transform: `scale(${mapScale})`, opacity: imageReady ? 1 : 0 }"
            @load="onImageLoad"
            @error="onImageError"
        />
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  mapName: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: '00',
  },
  mapScale: {
    type: Number,
    default: 1,
  },
  originClass: {
    type: String,
    default: '',
  },
})

const BASE_URL = 'https://v2.xivapi.com'
const CACHE_NAME = 'ffxivmap_maps'

const mapImageUrl = ref(null)
const resolvedMapName = ref('')
const isLoading = ref(false)
const hasError = ref(false)
const imageReady = ref(false)

function onImageLoad() {
  imageReady.value = true
  isLoading.value = false
}

function onImageError() {
  hasError.value = true
  isLoading.value = false
  mapImageUrl.value = null
}

async function loadMap(name) {
  mapImageUrl.value = null
  resolvedMapName.value = ''
  isLoading.value = true
  hasError.value = false
  imageReady.value = false

  if (!name) {
    isLoading.value = false
    return
  }

  try {
    
    const query = encodeURIComponent(`PlaceName.Name~"${name}"`)
    const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,PlaceName.Name&limit=1`

    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) throw new Error('Search request failed')

    const searchData = await searchRes.json()
    const firstResult = searchData?.results?.[0]
    if (!firstResult) throw new Error('No results found')

    const rawId = firstResult.fields?.Id
    if (!rawId) throw new Error('Missing map ID')

    const idBase = rawId.split('/')[0]
    resolvedMapName.value = firstResult.fields?.PlaceName?.fields?.Name ?? name
    mapImageUrl.value = `${BASE_URL}/api/asset/map/${idBase}/${props.variant}`
    // isLoading stays true until onImageLoad fires
  } catch (err) {
    console.error('[loadMap]', err)
    hasError.value = true
    isLoading.value = false
  }
}

onMounted(() => loadMap(props.mapName))
watch(() => [props.mapName, props.variant], ([name]) => loadMap(name))
</script>

<style scoped>
.map-wrapper {
    position: relative;
    width: 800px;
    height: 800px;
}

.map-loader,
.map-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(0, 0, 0, 1);
    color: #e0d6c2;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 999;
}

.loader-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #c8a96e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.loader-text {
    letter-spacing: 0.05em;
    opacity: 0.8;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.mapDisplay_background {
    width: 800px;
    height: 800px;
    aspect-ratio: 1 / 1;
    position: absolute;
    transform-origin: top left;
    transition: opacity 0.3s ease;
}
</style>