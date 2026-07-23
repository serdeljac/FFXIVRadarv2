<template>
    <div :class="[`map-wrapper`, {'loadOrError': isLoading || hasError}]" :style="{ transform: `scale(${mapScale})` }">
      
        <!-- Loading state -->
        <div class="mapDisplay_background map-loader" v-if="isLoading" >
            <div class="loader-spinner"></div>
            <span class="loader-text">Loading map…</span>
        </div>

        <!-- Error state -->
        <div class="mapDisplay_background map-error" v-else-if="hasError">
            <span>⚠ Failed to load map</span>
        </div>

        <!-- Map image -->
        <img
            class="mapDisplay_background"
            :src="mapImageUrl"
            :alt="resolvedMapName"
            v-if="mapImageUrl"
            @load="onImageLoad"
            @error="onImageError"
        />
    </div>
</template>

<script lang="ts" setup>

  import { ref, watch, onMounted } from 'vue'

  const BASE_URL = 'https://v2.xivapi.com'
  const mapImageUrl = ref<string | null>(null)
  const resolvedMapName = ref('')
  const isLoading = ref(false)
  const hasError = ref(false)
  const imageReady = ref(false)

  const props = defineProps({
    mapName: {type: String, required: true},
    variant: {type: String, default: '00'},
    mapScale: {type: Number, default: 1},
  })

  onMounted(() => loadMap(props.mapName))
  watch(() => [props.mapName, props.variant], ([name]) => loadMap(name))

  // Looks a zone's map up by PlaceName through the xivapi search endpoint, then
  // builds the asset URL from its ID. Sets the loading/error flags along the way;
  // the actual image swap is finalized by onImageLoad / onImageError.
  async function loadMap(name: string) {
    mapImageUrl.value = null
    resolvedMapName.value = ''
    isLoading.value = true
    hasError.value = false
    imageReady.value = false

    if (!name) {
      console.error('Failed to find map: missing map name')
      isLoading.value = false
      hasError.value = true
      return
    }

    try {
      const query = encodeURIComponent(`PlaceName.Name~"${name}"`)
      const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,PlaceName.Name&limit=1`

      const searchRes = await fetch(searchUrl)
      if (!searchRes.ok) throw new Error('Search request failed, possible fault with the API, network, or Name')

      const searchData = await searchRes.json()
      const firstResult = searchData?.results?.[0]
      if (!firstResult) throw new Error(`No results found, using name: ${name}`);

      const rawId = firstResult.fields?.Id
      if (!rawId) throw new Error('Missing map ID, possible fault with the API')

      const idBase = rawId.split('/')[0]
      resolvedMapName.value = firstResult.fields?.PlaceName?.fields?.Name ?? name
      mapImageUrl.value = `${BASE_URL}/api/asset/map/${idBase}/${props.variant}`
    } catch (err) {
      console.error('[loadMap]', err)
      hasError.value = true
      isLoading.value = false
    }
  }

  function onImageLoad() {
    imageReady.value = true
    isLoading.value = false
  }

  function onImageError() {
    hasError.value = true
    isLoading.value = false
    mapImageUrl.value = null
  }
</script>

<style scoped lang="scss">
.loadOrError {z-index: 80;}

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
    z-index: 120;
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