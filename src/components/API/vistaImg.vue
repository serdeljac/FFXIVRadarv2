<template>
    <div :id="`vista-${size == 'large' ? 'large' : 'small'}${node.ID}`" :class="`vista size-${size}`"></div>
</template>

<script lang="ts">
    import axios from 'axios'

    export default {
        name: "Vista Small Img",
        props: ['node', 'size'],
        created() {
            this.loadVistaPreviewImg()
        },
        watch: {
            'node.ID'() {
                this.$nextTick(() => {
                    this.loadVistaPreviewImg()
                })
            },
            'size'() {
                this.$nextTick(() => {
                    this.loadVistaPreviewImg()
                })
            }
        },
        methods: {
            async loadVistaPreviewImg(): Promise<void> {
                const CACHE_NAME = 'ffxivmap_vistas'
                let expansion = this.node.expansion.replace(/[-,'\s]/g, '').toLowerCase()
                let no = this.node.no.toString()
                let size = this.size == 'large' ? 'large' : 'small'
                const imageUrl = `https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/vistas/${expansion}/${size}/${no}.webp`
                await this.$nextTick()
                const el = document.getElementById(`vista-${size}${this.node.ID}`) as HTMLImageElement | null
                if (!el) return

            try {
                const cache = await caches.open(CACHE_NAME)
                const cached = await cache.match(imageUrl)

                if (cached) {
                    const blob = await cached.blob()
                    const url = `url('${URL.createObjectURL(blob)}')`
                    if (el) el.style.backgroundImage = url
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
                const url = `url('${URL.createObjectURL(blob)}')`
                el.style.backgroundImage = url
            } catch (error: any) {
                if (el) el.style.backgroundImage = `url('/src/assets/blankmap.webp')`
                console.error(`EorzeaMap: failed to load vistaSmall Img for "${this.node.id}": ${error.message}`)
            }
            },
        }
    }
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