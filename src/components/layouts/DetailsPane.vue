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
                :originClass="'details'"
                />
        </div>

        <div class="details_location">
            <h3>{{ node.area.region }} &gt; {{ node.area.zone }}<br />
                <span v-if="node.area.issubarea">{{node.point}}</span>
            </h3>
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
                    <div class="vistaPreviewImg" id="vistapreview" @click="$emit('openVistaImg', node)"></div>

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

<script lang="ts">
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'
import closeDetailsBtn from '../ui/buttons/closeMenu.vue'
import axios from 'axios'

const CACHE_NAME = 'ffxivmap_vista'


function stars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}

export default {
    name: 'DetailsPane',
    components: { mapDisplay, iconAndText, closeDetailsBtn },
    props: ['ffxivData', 'node', 'timerList', 'weatherList'],
    emits: ['openDetails', 'openVistaImg'],
    computed: {
        isGathering(): boolean {
            return this.node.job === 'miner' || this.node.job === 'botany'
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
        stars,

        async loadVistaPreviewImg(): Promise<void> {
            let expansion = this.node.expansion.replace(/[-,'\s]/g, '').toLowerCase()
            let no = this.node.no.toString()
            const imageUrl = `https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/${expansion}/small/${no}.webp`            
            const el = document.getElementById('vistapreview')
            
            if (!el) return

            try {
                const cache = await caches.open(CACHE_NAME)
                const cached = await cache.match(imageUrl)

                if (cached) {
                    const blob = await cached.blob()
                    const url = `url('${URL.createObjectURL(blob)}')`
                    el.style.backgroundImage = url
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
                el.style.backgroundImage = `url('/src/assets/blankmap.webp')`
                console.error(`EorzeaMap: failed to vista image map for "${this.node.no}": ${error.message}`)
            }
        },

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
    mounted() {
        this.loadVistaPreviewImg()
    },
    watch: {
        'node.ID'() {
            this.loadVistaPreviewImg()
        },
    }
}
</script>