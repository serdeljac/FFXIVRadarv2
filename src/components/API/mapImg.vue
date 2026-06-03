<template>
    <img 
        class="mapDisplay_background" 
        :src="mapImageUrl" 
        :alt="resolvedMapName"
        v-if="mapImageUrl" 
        :id="`originalFrom_${originClass}`"
        :style="{ transform: `scale(${mapScale})` }"/>
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
  }
})

const BASE_URL = 'https://v2.xivapi.com'

const mapImageUrl = ref(null)
const resolvedMapName = ref('')

async function loadMap(name) {
  mapImageUrl.value = null
  resolvedMapName.value = ''

  if (!name) return

  const query = encodeURIComponent(`PlaceName.Name~"${name}"`)
  const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,PlaceName.Name&limit=1`

  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) return

  const searchData = await searchRes.json()
  const firstResult = searchData?.results?.[0]
  if (!firstResult) return

  const rawId = firstResult.fields?.Id
  if (!rawId) return

  const idBase = rawId.split('/')[0]
  resolvedMapName.value = firstResult.fields?.PlaceName?.fields?.Name ?? name
  mapImageUrl.value = `${BASE_URL}/api/asset/map/${idBase}/${props.variant}`
}

onMounted(() => loadMap(props.mapName))
watch(() => [props.mapName, props.variant], ([name]) => loadMap(name))
</script>

<style scoped>
.ffxiv-map-image {
    display: block;
    max-width: 100%;
    height: auto;
}

img {
    width: 800px;
    height: 800px;
    aspect-ratio: 1 / 1;
    position: absolute;
    transform-origin: top left;
}
</style>