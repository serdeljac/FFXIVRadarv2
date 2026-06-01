<template>
    <div class="mapDisplay" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">
        <div
            class="mapDisplay_background"
            :id="`originalFrom_${originClass}`"
            :style="{ transform: `scale(${mapScale})` }"
        ></div>

        <div class="mapDisplay_overlay" :style="{ transform: `scale(${mapScale})` }">

            <div class="mapDisplay_pointSelect" v-if="focusNode.area.issubarea && originClass !== 'details'">

                <div class="radio-button" v-for="d in pointSelection" :key="d.ID">
                    <input 
                        type="radio" 
                        @click="pointSelected = d.point"
                        :id="d.ID"
                        :value="d.point"
                        name="radio-group"
                        :checked="d.point == pointSelected ? true : null"
                        class="radio-button__input"  >
                    <label class="radio-button__label" :for="d.ID">
                        <span class="radio-button__custom"></span>
                        {{ d.point }}
                    </label>
                </div>
                
            </div>

            <div v-for="d in aetheryteNodes" :key="d.ID"
                :class="[`mapIcon aetheryte`, {'hide': pointSelected && d.point != pointSelected}]"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <img :src="getIconImg(d.job, 'aetheryte')" />
            </div>

            <div v-for="d in unchainedNodes" :key="d.ID"
                :class="[`mapIcon`, {'hide': pointSelected && d.point != pointSelected}]"
                :data-map-icon-active="d.node_code === focusNode.node_code || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div v-for="d in chainedNodes" :key="d.ID"
                class="mapIcon"
                :data-map-icon-active="d.chain_set === focusNode.chain_set || null"
                :data-chain-no="d.chain_no"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div v-for="d in huntNodes" :key="`${d.transx}-${d.transy}`"
                class="mapIcon"
                :data-map-icon-active="isActiveRank(d.ranks) || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
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

    export default {
    name: 'EorzeaMap',
    props: ['ffxivData', 'focusNode', 'originClass', 'mapSize'],
    data() {
        return {
            pointSelection: [] as any,
            pointSelected: '' as string,
            storeFocusedNode: {} as any
        }
    },

    computed: {
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

        getMapName(node: any): string {
            const name = node.area.zone.replace(/[-,'\s]/g, '').toLowerCase()
            let addPoint = this.pointSelected ? this.pointSelected.toString().toLowerCase().replace(/\s/g, '') : ''
            if (this.originClass == 'details' && this.focusNode.area.issubarea) {
                addPoint = this.focusNode.point.toString().toLowerCase().replace(/\s/g, '')

            }
            return `${name}${addPoint}`
        },

        async loadMap(zone: string): Promise<void> {
            const CACHE_NAME = 'ffxivmap_cache'
            let el = document.getElementById('originalFrom_page')
            const mapname = this.getMapName(this.focusNode)
            const imageUrl = `https://ffxivradarmaps.s3.ca-central-1.amazonaws.com/${mapname}.webp`

            if (this.originClass == 'details') {
                el = document.getElementById('originalFrom_details')
            }

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
                console.error(`EorzeaMap: failed to load map for "${zone}": ${error.message}`)
            }
        },
    },

    mounted() {
        this.storeFocusedNode = this.focusNode
        this.loadMap(this.focusNode.area.zone)
    },

    watch: {
        'focusNode.ID'(newZone: string) {
            if (this.focusNode.area.issubarea) {
                this.pointSelection = this.ffxivData.areas.filter((o: any) => o.area == this.focusNode.area.area)
                this.pointSelected = this.pointSelection[0].point
            } else {
                this.pointSelection = []
                this.pointSelected = ''
            }

            if (this.storeFocusedNode.area.zone !== this.focusNode.area.zone) {
                this.loadMap(newZone)
            }
            this.storeFocusedNode = this.focusNode
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

    &_pointSelect {
        display: flex;
        flex-direction: column;
        position: absolute;
        background-color: rgba(0, 0, 0, 0.502);
        padding: 0.5rem;

        label:hover {text-decoration: underline;}

/* From Uiverse.io by gharsh11032000 */ 
        .radio-button-container {
        display: flex;
        align-items: center;
        gap: 24px;
        }

        .radio-button {
        display: inline-block;
        position: relative;
        cursor: pointer;
        }

        .radio-button__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        }

        .radio-button__label {
        display: inline-block;
        padding-left: 30px;
        margin-bottom: 10px;
        position: relative;
        font-size: 15px;
        color: #f2f2f2;
        font-weight: 600;
        cursor: pointer;
        text-transform: uppercase;
        transition: all 0.3s ease;
        }

        .radio-button__custom {
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #678dff;
        transition: all 0.3s ease;
        }

        .radio-button__input:checked + .radio-button__label .radio-button__custom {
        background-color: #4c8bf5;
        border-color: transparent;
        transform: scale(0.8);
        box-shadow: 0 0 20px #4c8bf580;
        }

        .radio-button__input:checked + .radio-button__label {
        color: #fff;
        }

        .radio-button__label:hover .radio-button__custom {
        transform: scale(1.2);
        border-color: #4c8bf5;
        box-shadow: 0 0 20px #4c8bf580;
        }
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
        &.hide {display: none}

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