<template>
    <div class="vista_enlarge">
        <img id="imgDisplay" ></img>
    </div>
</template>

<script lang="ts">
import axios from 'axios'
    export default {
        name: "Expand Vista Image",
        props: ['node'],
        mounted() {
            this.loadVistaImg()
        },
        methods: {
            async loadVistaImg(): Promise<void> {
                let expansion = this.node.expansion.replace(/[-,'\s]/g, '').toLowerCase()
                let no = this.node.no.toString()
                const imageUrl = `https://ffxivradarvista.s3.ca-central-1.amazonaws.com/${expansion}/large/${no}.webp`            
                const el = document.getElementById('imgDisplay') as HTMLImageElement | null
                const CACHE_NAME = 'ffxivmap_vista'
                
                if (!el) return

                try {
                    const cache = await caches.open(CACHE_NAME)
                    const cached = await cache.match(imageUrl)

                    if (cached) {
                        const blob = await cached.blob()
                        const url = URL.createObjectURL(blob)
                        if (el) el.src = url
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
                    const url = URL.createObjectURL(blob)
                    if (el) el.src = url
                } catch (error: any) {
                    if (el) el.src = '/src/assets/blankmap.webp'
                    console.error(`EorzeaMap: failed to vista image map for "${this.node.no}": ${error?.message}`)
                }
            },
        }

    }
</script>

<style scoped lang="scss">

    .vista_enlarge {
        width: 100%;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.816);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    #imgDisplay {
        border: 3px solid #fff;
        width: 100%;
        max-width: 1000px;
        margin: 1rem;
    }

</style>