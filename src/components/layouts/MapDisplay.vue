<template>
    <div class="mapDisplay" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">
        <div
            class="mapDisplay_background"
            :style="{ transform: `scale(${mapScale})` }"
        ></div>

        <div class="mapDisplay_overlay" :style="{ transform: `scale(${mapScale})` }">

            <div class="mapDisplay_pointSelect" v-if="focusNode.area.issubarea">
                <div v-for="d in pointSelection" :key="d.ID">
                    <input @click="pointSelected = d.point" type="radio" :id="d.ID" :name="d.area" :value="d.point" class="radio_point" :checked="d.point == pointSelected ? true : null">
                    <label :for="d.ID">{{ d.point }}</label><br>
                </div>
            </div>


            <div
                v-for="d in aetheryteNodes"
                :key="d.ID"
                class="mapIcon aetheryte"
                :style="{ transform: `translate(${getCoordinates(d)})` }"
            >
                <img :src="getIconImg(d.job, 'aetheryte')" />
            </div>

            <div
                v-for="d in unchainedNodes"
                :key="d.ID"
                class="mapIcon"
                :data-map-icon-active="d.node_code === focusNode.node_code || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }"
            >
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div
                v-for="d in chainedNodes"
                :key="d.ID"
                class="mapIcon"
                :data-map-icon-active="d.chain_set === focusNode.chain_set || null"
                :data-chain-no="d.chain_no"
                :style="{ transform: `translate(${getCoordinates(d)})` }"
            >
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div
                v-for="d in huntNodes"
                :key="`${d.transx}-${d.transy}`"
                class="mapIcon"
                :data-map-icon-active="isActiveRank(d.ranks) || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }"
            >
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
// Pure function — no reactive dependencies, safe as a module-level utility
function getIconImg(jobName: string, subJob: string): string {
    let name: string
    if (jobName === 'fates') {
        name = `fate_${subJob}`
    } else if (jobName === 'eliteHunts') {
        name = subJob === 'SS' ? 'hunts_ss' : 'hunts'
    } else {
        name = subJob
    }
    return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
}
</script>

<script lang="ts">
import axios from 'axios'

const CACHE_NAME = 'ffxivmap_cache'

// Normalise a zone name to the S3 key format
function toS3Key(zone: string): string {
    return zone.replace(/[-,'\s]/g, '').toLowerCase()
}

export default {
    name: 'EorzeaMap',

    props: ['ffxivData', 'focusNode', 'singleOnly', 'mapSize'],

    data() {
        return {
            pointSelection: [] as any,
            pointSelected: '' as string
        }
    },

    computed: {
        // Derived scalar used in multiple bindings — computed once per change
        mapScale(): number {
            return this.mapSize / 800
        },

        pointArea(): any[] {
            let results = this.ffxivData.areas.filter((o: any) => o.area == this.focusNode.area.area)
            return results
        },

        aetheryteNodes(): any[] {
            return this.ffxivData.aetheryte.filter(
                (o: any) => o.zone === this.focusNode.area.zone
            )
        },

        unchainedNodes(): any[] {
            if (this.focusNode.job === 'eliteHunts') return []
            return this.ffxivData[this.focusNode.job].filter(
                (o: any) =>
                    o.area.zone === this.focusNode.area.zone && !o.chain_set
            )
        },

        chainedNodes(): any[] {
            if (this.focusNode.job === 'eliteHunts') return []
            return this.ffxivData[this.focusNode.job].filter(
                (o: any) =>
                    o.area.zone === this.focusNode.area.zone && !!o.chain_set
            )
        },

        huntNodes(): any[] {
            if (this.focusNode.job !== 'eliteHunts') return []

            // Collect all spawn points for this zone
            const rawPoints: any[] = this.ffxivData.eliteHunts
                .filter((o: any) => o.area.zone === this.focusNode.area.zone)
                .flatMap((o: any) =>
                    o.points.map((p: any) => ({
                        ...p,
                        job: 'eliteHunts',
                        job_sub: o.rank,
                    }))
                )

            // Deduplicate by pixel position using a Map keyed on "x,y"
            const seen = new Map<string, any>()
            for (const p of rawPoints) {
                const key = `${p.transx},${p.transy}`
                if (!seen.has(key)) seen.set(key, p)
            }
            return [...seen.values()]
        },
    },

    methods: {
        getCoordinates(node: any): string {
            if (node.transx != null) {
                return `${node.transx}px, ${node.transy}px`
            }
            const { mapsize } = node.area
            const x = Math.floor((node.x / mapsize) * 800)
            const y = Math.floor((node.y / mapsize) * 800)
            return `${x}px, ${y}px`
        },

        isActiveRank(rank: string): boolean {
            return rank.includes(this.focusNode.rank)
        },

        async loadMap(zone: string): Promise<void> {
            if (this.focusNode.area.issubarea) {
                zone = `${zone}${this.pointSelected.toString().toLowerCase().replace(/\s/g, '')}`
            }

            const imageUrl = `https://ffxivradarmaps.s3.ca-central-1.amazonaws.com/${toS3Key(zone)}.webp`
            const els = Array.from(document.getElementsByClassName('mapDisplay_background')) as HTMLElement[]
            if (!els.length) return

            try {
                const cache = await caches.open(CACHE_NAME)
                const cached = await cache.match(imageUrl)

                if (cached) {
                    const blob = await cached.blob()
                    const url = `url('${URL.createObjectURL(blob)}')`
                    for (const el of els) {
                        el.style.backgroundImage = url
                    }
                    
                    return
                }

                const response = await axios.get<Blob>(imageUrl, {
                    responseType: 'blob',
                    timeout: 5000,
                })
                const blob = response.data
                // Store in cache before creating the object URL to avoid a
                // second blob allocation for the cache.put call
                await cache.put(
                    imageUrl,
                    new Response(blob, { headers: { 'Content-Type': blob.type } })
                )
                const url = `url('${URL.createObjectURL(blob)}')`
                for (const el of els) {
                    el.style.backgroundImage = url
                }
            } catch (error: any) {
                for (const el of els) {
                    el.style.backgroundImage = `url('/src/assets/blankmap.webp')`
                }
                console.error(`EorzeaMap: failed to load map for "${zone}": ${error.message}`)
            }
        },
    },

    mounted() {
        this.loadMap(this.focusNode.area.zone)
    },

    // Use a watcher instead of updated() so we only reload when the zone
    // actually changes, not on every re-render triggered by anything else.
    watch: {
        'focusNode.area.point'(newZone: string) {
            if (this.focusNode.area.issubarea) {
                console.log('found!')
                this.pointSelection = this.ffxivData.areas.filter((o: any) => o.area == this.focusNode.area.area)
                this.pointSelected = this.pointSelection[0].point
            } else {
                this.pointSelection = []
                this.pointSelected = ''
            }
            this.loadMap(newZone)
        },
        'pointSelected'() {
            let mapSelect = this.focusNode.area.zone
            this.loadMap(mapSelect)
        }
    },
}
</script>

<style scoped lang="scss">
.mapDisplay {
    position: relative;

    .mapDisplay_background {
        background-size: cover;
    }

    &_pointSelect > div{
        padding: 4px 2rem 4px 0;
        display: flex;
        justify-content: end;
        width: 100%;
        cursor: pointer;
    }

    & > div {
        width: 800px;
        height: 800px;
        aspect-ratio: 1 / 1;
        position: absolute;
        transform-origin: top left;
    }

    .mapIcon {
        z-index: 10;
        position: absolute;

        img {
            width: $iconSize;
            margin-left: calc($iconSize / -2);
            margin-top: calc($iconSize / -2);
            filter: drop-shadow(0px 0px 2px #000);
        }

        &::before {
            @extend .inheritChainNo;
            content: attr(data-chain-no);
            transform: translate(2px, -1px);
        }

        &:not([data-map-icon-active]):not(.aetheryte) {
            filter: brightness(0.7);
        }
    }
}
</style>