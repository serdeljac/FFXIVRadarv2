<template>
    <img :id="imgID" :class="`ffxiv_icon iconSize`"/>
</template>

<script lang="ts">
    import axios from 'axios'

    export default {
        name: "Icon Img",
        props: ['name'],
        created() {
            this.generateID()
            this.loadVistaPreviewImg()
        },
        data() {
            return {
                imgID: 'img' as string
            }
        },
        watch: {
            'name'() {
                this.$nextTick(() => {
                    this.loadVistaPreviewImg()
                })
            },
        },
        methods: {
            generateID() {
                const dateString = Date.now().toString(36);
                const randomness = Math.random().toString(36).substr(2);
                this.imgID = dateString + randomness;
            },
            async loadVistaPreviewImg(): Promise<void> {
                const CACHE_NAME = 'ffxivmap_icons'
                const imageUrl = `https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons/${this.name}.webp`
                await this.$nextTick()
                const el = document.getElementById(this.imgID) as HTMLImageElement | null
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
                el.src = url
            } catch (error: any) {
                if (el) el.src = ``
                console.error(`EorzeaMap: failed to load vistaSmall Img for "${this.name}": ${error.message}`)
                }
            },
        }
    }
</script>