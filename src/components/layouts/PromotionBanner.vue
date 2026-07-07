<template>
  <div class="promotion_banner">
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
import { onMounted } from 'vue'

onMounted(() => {
  try {
    const w = window as any
    ;(w.adsbygoogle = w.adsbygoogle || []).push({})
  } catch (e) {
    console.error('AdSense error:', e)
  }
})
</script>

<style scoped lang="scss">
  .promotion_banner {
    display: block;
    width: 100%;
    max-width: 728px;
    aspect-ratio: 728 / 90;
    text-align: center;
    margin: 1rem auto;

    &-ins {
      width: 100%;
      height: 100%;
    }
  }
</style>
