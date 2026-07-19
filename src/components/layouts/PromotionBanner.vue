<template>
  <div class="promotion_banner" :class="{ 'promotion_banner--loaded': adLoaded }">
    <ins
      class="adsbygoogle promotion_banner-ins"
      style="display:block"
      data-ad-client="ca-pub-4825113460804714"
      data-ad-slot="3669528090"
      data-ad-format="auto"
      data-full-width-responsive="true" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const adLoaded = ref(false)

onMounted(() => {
  try {
    const w = window as any
    const adsContainer = document.querySelector('.adsbygoogle')

    if (adsContainer) {
      const observer = new MutationObserver(() => {
        const iframePresent = adsContainer.querySelector('iframe') !== null
        const adContentPresent = (adsContainer as any).innerText?.length > 0
        if (iframePresent || adContentPresent) {
          adLoaded.value = true
          observer.disconnect()
        }
      })

      observer.observe(adsContainer, { childList: true, subtree: true })

      ;(w.adsbygoogle = w.adsbygoogle || []).push({})

      // Fallback: assume ad loaded after 3 seconds
      setTimeout(() => {
        if (!adLoaded.value) {
          adLoaded.value = true
          observer.disconnect()
        }
      }, 3000)
    }
  } catch (e) {
    console.error('AdSense error:', e)
    adLoaded.value = true
  }
})
</script>

<style scoped lang="scss">
  .promotion_banner {
    display: none;

    &--loaded {
      display: block;
      width: 100%;
      max-width: 728px;
      aspect-ratio: 728 / 90;
      text-align: center;
      margin: 1rem auto;
    }

    &-ins {
      width: 100%;
      height: 100%;
    }
  }
</style>
