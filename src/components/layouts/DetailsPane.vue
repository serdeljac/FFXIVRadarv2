<template>
    <aside class="details">

        <div class="details_close">
            <div class="details_close-btn">
                <closeDetailsBtn
                    class="hasContext"
                    data-context="Close"
                    @click="$emit('openDetails', node)"/>
            </div>

            <div class="details_close-name">
                <p v-if="isGathering" class="details_content-name">
                    <iconAndText :text="`${node.name} - Lv. ${node.level} ${stars(node.stars)}`" :icon="node.job_sub" />
                </p>
                <p v-else-if="node.job === 'sightseeing'" class="details_content-name">
                    <iconAndText :text="`${node.name}`" :icon="node.job_sub" />
                </p>
                <p v-else-if="node.job === 'aethercurrents'" class="details_content-name">
                    <iconAndText :text="`Aether Current #${node.order}`" :icon="node.job_sub" />
                </p>
            </div>
        </div>

        <div class="details_map">
            <mapDisplay
                v-if="node"
                class="miniMap"
                :ffxivData="ffxivData"
                :focusNode="node"
                :singleOnly="true"/>
        </div>

        <div class="details_location">
            <h3>{{ node.area.region }} &gt; {{ node.area.zone }}</h3>
            <h4>(x{{ node.x }}, y{{ node.y }})</h4>
        </div>

        <div class="details_content">

            <!-- ── Gathering (Miner / Botany) ───────────────────────── -->
            <template v-if="isGathering">

                <div class="details_content-requirements">
                    <ul>
                        <li>
                            <p>{{ `${node.job_sub}:` }}</p>
                            <p> {{ node.node_level }}</p>
                        </li>
                        <li v-if="node.perception">
                            <p>Perception: </p>
                            <p>{{ node.perception }}</p>
                        </li>
                        <li :data-rowActive="isTimeActive">
                            <p>Active:</p>
                            <p :data-timeActive="isTimeActive">{{ timerCountdown(node.time) }}</p>
                        </li>
                        <li v-if="node.tomb">
                            <p>Tomb:</p>
                            <p>{{ node.tomb }}</p>
                        </li>
                    </ul>
                </div>

                <div class="isBlock" v-if="node.usage === 'aetherial'">
                    <h3>Aetherial Reduction Materials:</h3>
                    <ul>
                        <li v-if="node.usage_info.result1">{{ node.usage_info.result1 }}</li>
                        <li v-if="node.usage_info.result2">{{ node.usage_info.result2 }}</li>
                        <li v-if="node.usage_info.result3">{{ node.usage_info.result3 }}</li>
                    </ul>
                </div>

                <div class="isBlock">
                    <h3>Other Materials:</h3>
                    <ul>
                        <li v-for="d in otherMaterials" :key="d.ID">
                            {{ d.name }} – Lv. {{ d.level }} {{ stars(d.stars) }}
                        </li>
                    </ul>
                </div>

            </template>

            <!-- ── Sightseeing ─────────────────────────────────────── -->
            <template v-else-if="node.job === 'sightseeing'">

                <div class="details_content-requirements">
                    <ul>
                        <li>
                            <p>EXP Earned: </p>
                            <p>{{ getVistaInfo('exp') }}</p>
                        </li>
                        <li>
                            <p>Level Range: </p>
                            <p>{{ getVistaInfo('level')}}</p>
                        </li>
                        <li :data-rowActive="isTimeAndWeatherActive">
                            <p>Active:</p>
                            <p class="timeAndWeather">
                                <span :data-timeActive="isTimeActive">{{ timerCountdown(node.time) }}</span>
                                <span :data-timeActive="isWeather1Active">{{ node.weather1 }}</span>
                                <span v-if="node.weather2" :data-timeActive="isWeather2Active">{{ node.weather2 }}</span>
                            </p>
                        </li>
                        <li>
                            <p>Emote:</p>
                            <p><iconAndText :text="node.emote" :icon="node.emote" /></p>
                        </li>
                    </ul>
                </div>

                <div class="details_content-previewAndGuide">
                    <div>
                        <img :src="vistaPreviewImg" />
                    </div>

                    <p>
                        <span v-if="node.mount">[Flying Mount Required]</span>
                        {{ node.notes }}
                    </p>

                </div>


            </template>

            <!-- ── Aether Currents ─────────────────────────────────── -->
            <template v-else-if="node.job === 'aethercurrents'">

                <div class="details_content-name">
                    
                </div>

                <div class="details_content-questName isBlock" v-if="node.name">
                    <h3>Acquired from quest:</h3>
                    <iconAndText :icon="`quest_${node.name_type}`" :text="`${node.name} – Lv.${node.name_level}`" />
                </div>

                <div class="details_content-unlockName isBlock" v-if="node.unlock">
                    <h3>Must complete:</h3>
                    <iconAndText :icon="`quest_${node.unlock_type}`" :text="`${node.unlock} – Lv.${node.unlock_level}`" />
                </div>

            </template>

        </div>
    </aside>
</template>

<script lang="ts" setup>
// function getVistaPreviewImgSmall(expansion: string, no: number): string {
//     return new URL(
//         `/src/assets/sightseeing/${expansion}/ss${expansion}${no}.webp`,
//         import.meta.url
//     ).href
// }
</script>

<script lang="ts">
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'
import closeDetailsBtn from '../ui/buttons/closeMenu.vue'

// Module-level pure helper — no need to recreate per instance
function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function stars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}


export default {
    name: 'DetailsPane',

    components: { mapDisplay, iconAndText, closeDetailsBtn },

    props: ['ffxivData', 'node', 'timerList', 'weatherList'],

    emits: ['openDetails'],

    computed: {
        // Avoids repeating the two-job OR condition across template and logic
        isGathering(): boolean {
            return this.node.job === 'miner' || this.node.job === 'botany'
        },

        // Cached image URL — only recalculated when node changes
        vistaPreviewImg(): string {
            return ''
            // return getVistaPreviewImgSmall(this.node.area.icon, this.node.no)
        },


        otherMaterials(): any[] {
            const { node_code, name, job } = this.node
            const matches = this.ffxivData[job].filter(
                (o: any) => o.node_code === node_code && o.name !== name
            )
            return matches.length ? matches : [{ name: 'None', ID: '000' }]
        },

        isTimeActive(): boolean {
            const timeState = this.timerList.find((o: any) => o.ID === this.node.time).stateActive ? true : null
            return timeState
        },

        isWeather1Active(): boolean {
            const weatherState = this.weatherList[this.node.area.mapcode] == this.node.weather1 ? true : null
            return weatherState
        },

        isWeather2Active(): boolean {
            const weatherState = this.weatherList[this.node.area.mapcode] == this.node.weather2 ? true : null
            return weatherState
        },

        isTimeAndWeatherActive(): boolean {
            const timeState = this.timerList.find((o: any) => o.ID === this.node.time).stateActive ? true : false
            const weatherState1 = this.weatherList[this.node.area.mapcode] == this.node.weather1 ? true : false
            const weatherState2 = this.weatherList[this.node.area.mapcode] == this.node.weather2 ? true : false
            let match = timeState && (weatherState1 || weatherState2) ? true : null
            return match
        }


    },

    methods: {
        capitalize,
        stars,

        timerCountdown(time: string): string {
            if (!time) return 'Any Time'
            return this.timerList.find((o: any) => o.ID === time)?.countdown ?? 'Any Time'
        },

        
        getVistaInfo(type: string) {
            let expFound = this.ffxivData.expansion.find((o: any) => o.expansion == this.node.expansion)
            if (type == 'exp') {
                return expFound.vista_exp == 0 ? 'None' : expFound.vista_exp
            }
            else if (type == 'level') {
                return `LV. ${expFound.vista_min} - ${expFound.vista_max}`
            }
        },

        isRowActive(node: any, type: 'time' | 'weather'): boolean {
            if (type === 'time') {
                if (!node.time) return false
                return !!this.timerList.find((o: any) => o.ID === node.time)?.stateActive
            }
            if (type === 'weather') {
                const cur = this.weatherList[node.area.mapcode]
                return cur === node.weather1 || cur === node.weather2
            }
            return false
        },

        isWeatherActive(field: 'weather1' | 'weather2', node: any): boolean {
            return this.weatherList[node.area.mapcode] === node[field]
        },
    },
}
</script>