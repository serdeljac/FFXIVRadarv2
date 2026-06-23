<template>
  <div class="ad-banner promotion_banner">
    <ins
      class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-4825113460804714"
      data-ad-slot="YOUR_AD_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
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