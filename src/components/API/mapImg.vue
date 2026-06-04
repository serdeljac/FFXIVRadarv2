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

<script setup>

  //Imports
  import { ref, watch, onMounted } from 'vue'

  //Variables and constants
  const BASE_URL = 'https://v2.xivapi.com'
  const CACHE_NAME = 'ffxivmap_maps'
  const mapImageUrl = ref(null)
  const resolvedMapName = ref('')
  const isLoading = ref(false)
  const hasError = ref(false)
  const imageReady = ref(false)
  //Remember, when using ref(), the value stored is in <variable name>.value

  //Props with default values
  const props = defineProps({
    mapName: {type: String, required: true},
    variant: {type: String, default: '00'},
    mapScale: {type: Number, default: 1},
  })

  //Lifecycle hooks
  onMounted(() => loadMap(props.mapName))
  watch(() => [props.mapName, props.variant], ([name]) => loadMap(name))

  //Methods

  async function loadMap(name) {
    //Set default values for the loading state
    mapImageUrl.value = null
    resolvedMapName.value = ''
    isLoading.value = true
    hasError.value = false
    imageReady.value = false

    //Validate there's a name to be sent before checking the API
    if (!name) {
      console.error('Failed to find map: missing map name')
      isLoading.value = false
      hasError.value = true
      return
    }

    try {
      const query = encodeURIComponent(`PlaceName.Name~"${name}"`)
      const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,PlaceName.Name&limit=1`

      //Check to see if image can be searched
      const searchRes = await fetch(searchUrl)
      if (!searchRes.ok) throw new Error('Search request failed, possible fault with the API, network, or Name')

      //Check if there's any results
      const searchData = await searchRes.json()
      const firstResult = searchData?.results?.[0]
      if (!firstResult) throw new Error(`No results found, using name: ${name}`);

      //Check the searched map for it's ID. It is needed to be pulled from the server
      const rawId = firstResult.fields?.Id
      if (!rawId) throw new Error('Missing map ID, possible fault with the API')


      //When all is OK, assign the following values to trigger the image load. 
      // The ID is used to pull the image from the server, and the name is used for the alt text of the image. 
      // The mapScale is used to scale the image up or down depending on the zoom level of the mapDisplay component. 
      // The isLoading state will stay true until the onImageLoad method is triggered, which happens when the image is fully loaded. 
      // If there's an error during this process, the onImageError method will be triggered, which will set the hasError state to true and display an error message instead of the image.
      const idBase = rawId.split('/')[0]
      resolvedMapName.value = firstResult.fields?.PlaceName?.fields?.Name ?? name
      mapImageUrl.value = `${BASE_URL}/api/asset/map/${idBase}/${props.variant}`
    } catch (err) {
      console.error('[loadMap]', err)
      hasError.value = true
      isLoading.value = false
    }
  }

  //Triggered @load when the image is fully loaded, then change the following values
  function onImageLoad() {
    imageReady.value = true
    isLoading.value = false
  }

  //Triggered @error when the image cannot load, then change the following values
  function onImageError() {
    hasError.value = true
    isLoading.value = false
    mapImageUrl.value = null
  }
</script>

<style scoped>
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