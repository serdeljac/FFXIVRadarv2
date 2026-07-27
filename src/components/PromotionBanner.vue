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
      // Reveals the banner only once AdSense actually injects an ad — detected
      // either by its iframe or a rendered ad node — so an empty slot stays hidden.
      const checkForAd = () => {
        const hasIframe = adsContainer.querySelector('iframe') !== null
        const hasContent = adsContainer.querySelector('[data-google-query-id]') !== null

        if (hasIframe || hasContent) {
          adLoaded.value = true
          observer.disconnect()
        }
      }

      const observer = new MutationObserver(checkForAd)
      observer.observe(adsContainer, { childList: true, subtree: true })

      ;(w.adsbygoogle = w.adsbygoogle || []).push({})

      setTimeout(checkForAd, 500)
    }
  } catch (e) {
    console.error('AdSense error:', e)
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
