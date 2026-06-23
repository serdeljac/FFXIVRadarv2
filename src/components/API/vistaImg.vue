<template>
    <div :id="`vista-${size == 'large' ? 'large' : 'small'}${node.ID}`" :class="`vista size-${size}`"></div>
</template>

<script lang="ts" setup>
import { watch, nextTick } from 'vue'
import axios from 'axios'

const props = defineProps(['node', 'size'])

async function loadVistaPreviewImg(): Promise<void> {
    const CACHE_NAME = 'ffxivmap_vistas'
    const expansion = props.node.expansion.replace(/[-,'\s]/g, '').toLowerCase()
    const no = props.node.no.toString()
    const size = props.size == 'large' ? 'large' : 'small'
    const imageUrl = `https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/vistas/${expansion}/${size}/${no}.webp`
    await nextTick()
    const el = document.getElementById(`vista-${size}${props.node.ID}`) as HTMLElement | null
    if (!el) return

    try {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(imageUrl)

        if (cached) {
            const blob = await cached.blob()
            el.style.backgroundImage = `url('${URL.createObjectURL(blob)}')`
            return
        }

        const response = await axios.get<Blob>(imageUrl, {
            responseType: 'blob',
            timeout: 5000,
        })
        const blob = response.data
        await cache.put(
            imageUrl,
            new Response(blob, { headers: { 'Content-Type': blob.type } })
        )
        el.style.backgroundImage = `url('${URL.createObjectURL(blob)}')`
    } catch (error: any) {
        el.style.backgroundImage = `url('/src/assets/blankmap.webp')`
        console.error(`EorzeaMap: failed to load vistaSmall Img for "${props.node.id}": ${error.message}`)
    }
}

loadVistaPreviewImg()

watch(() => props.node.ID, () => loadVistaPreviewImg())
watch(() => props.size, () => loadVistaPreviewImg())
</script>

<style scoped lang="scss">

.vista {
    border: 1px solid #fff;
    border-radius: $borderRadius;
    background-size: cover;
    background-position: center;
    width: 100%;

    &.size-small {
        min-width: 100px;
        max-width: 160px;
        height: 100px;
    }

    &.size-medium {
        min-width: 160px;
        max-width: 160px;
        height: 100px;
    }

    &.size-large {
        min-width: 160px;
        max-width: 1000px;
        height: 600px;
    }
}
</style>