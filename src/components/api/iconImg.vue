<template>
    <img :id="imgID" :class="`ffxiv_icon iconSize`"/>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import axios from 'axios'

const props = defineProps(['name'])

const imgID = ref('img')

function generateID() {
    const dateString = Date.now().toString(36)
    const randomness = Math.random().toString(36).substr(2)
    imgID.value = dateString + randomness
}

async function loadVistaPreviewImg(): Promise<void> {
    
    const CACHE_NAME = 'ffxivmap_icons'
    const imageUrl = `https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons/${props.name}.webp`
    await nextTick()
    const el = document.getElementById(imgID.value) as HTMLImageElement | null
    if (!el) return

    try {
        if (!props.name) { return }
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(imageUrl)

        if (cached) {
            const blob = await cached.blob()
            el.src = URL.createObjectURL(blob)
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
        el.src = URL.createObjectURL(blob)
    } catch (error: any) {
        el.src = ``
        console.error(`EorzeaMap: failed to load vistaSmall Img for "${props.name}": ${error.message}`)
    }
}

generateID()
loadVistaPreviewImg()

watch(() => props.name, () => loadVistaPreviewImg())
</script>