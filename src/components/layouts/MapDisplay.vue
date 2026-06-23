<template>
    <div class="mapDisplay" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">

        <mapImgAPI 
            :mapScale="mapScale" 
            :mapName="focusNode.area.zone"
            :variant="focusNode.area.variant ? focusNode.area.variant : '00'" />

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
                <iconImgAPI class="mapIconImg" :name="getIconImg(d.job, 'aetheryte')"/>
            </div>

            <div v-for="d in unchainedNodes" :key="d.ID"
                :class="[`mapIcon`, {'hide': pointSelected && d.point != pointSelected}]"
                :data-map-icon-active="d.node_code === focusNode.node_code || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <iconImgAPI class="mapIconImg" :name="getIconImg(d.job, d.job_sub)"/>
            </div>

            <div v-for="d in chainedNodes" :key="d.ID"
                class="mapIcon"
                :data-map-icon-active="d.chain_set === focusNode.chain_set || null"
                :data-chain-no="d.chain_no"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <iconImgAPI class="mapIconImg" :name="getIconImg(d.job, d.job_sub)"/>
            </div>

            <div v-for="d in huntNodes" :key="`${d.transx}-${d.transy}`"
                class="mapIcon"
                :data-map-icon-active="isActiveRank(d.ranks) || null"
                :style="{ transform: `translate(${getCoordinates(d)})` }">
                <iconImgAPI class="mapIconImg" :name="getIconImg(d.job, d.job_sub)"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import mapImgAPI from '../API/mapImg.vue'
import iconImgAPI from '../API/iconImg.vue'

const props = defineProps(['ffxivData', 'focusNode', 'originClass', 'mapSize'])

const pointSelection = ref<any>([])
const pointSelected = ref('')

const mapScale = computed(() => props.mapSize / 800)

const aetheryteNodes = computed<any[]>(() =>
    props.ffxivData.aetheryte.filter((o: any) => o.zone === props.focusNode.area.zone)
)

const unchainedNodes = computed<any[]>(() => {
    if (props.focusNode.job === 'eliteHunts') return []
    return props.ffxivData[props.focusNode.job].filter(
        (o: any) => o.area.zone === props.focusNode.area.zone && !o.chain_set
    )
})

const chainedNodes = computed<any[]>(() => {
    if (props.focusNode.job === 'eliteHunts') return []
    return props.ffxivData[props.focusNode.job].filter(
        (o: any) => o.area.zone === props.focusNode.area.zone && !!o.chain_set
    )
})

const huntNodes = computed<any[]>(() => {
    if (props.focusNode.job !== 'eliteHunts') return []

    // Collect all spawn points for this zone
    const rawPoints: any[] = props.ffxivData.eliteHunts
        .filter((o: any) => o.area.zone === props.focusNode.area.zone)
        .flatMap((o: any) =>
            o.points.map((p: any) => ({ ...p, job: 'eliteHunts', job_sub: o.rank }))
        )

    // Deduplicate by pixel position using a Map keyed on "x,y"
    const seen = new Map<string, any>()
    for (const p of rawPoints) {
        const key = `${p.transx},${p.transy}`
        if (!seen.has(key)) seen.set(key, p)
    }
    return [...seen.values()]
})

function getIconImg(jobName: string, subJob: string): string {
    if (jobName === 'fates') return `fate_${subJob}`
    if (jobName === 'eliteHunts') return subJob === 'SS' ? 'hunts_ss' : 'hunts'
    return subJob
}

function getCoordinates(node: any): string {
    if (node.transx) {
        return `${node.transx}px, ${node.transy}px`
    }
    const { mapsize } = node.area
    const x = Math.floor((node.x / mapsize) * 800)
    const y = Math.floor((node.y / mapsize) * 800)
    return `${x}px, ${y}px`
}

function isActiveRank(rank: string): boolean {
    return rank.includes(props.focusNode.rank)
}
</script>

<style scoped lang="scss">
.mapDisplay {
    position: relative;

    &_overlay {
        position: relative;
        z-index: 10;
    }

    &_pointSelect {
        display: flex;
        flex-direction: column;
        position: absolute;
        background-color: rgba(0, 0, 0, 0.502);
        padding: 0.5rem;
        label:hover {text-decoration: underline;}

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