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
                    <vistaSmallAPI :node="node" :size="'medium'" @click="$emit('openVistaImg', node)"/>

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
import { computed } from 'vue'
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'
import closeDetailsBtn from '../ui/buttons/closeMenu.vue'
import vistaSmallAPI from '../API/vistaImg.vue'

const props = defineProps(['ffxivData', 'node', 'timerList', 'weatherList'])
defineEmits(['openDetails', 'openVistaImg'])

function stars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}

const isGathering = computed(() => props.node.job === 'miner' || props.node.job === 'botany')

const otherMaterials = computed<any[]>(() => {
    const { node_code, name, job } = props.node
    const matches = props.ffxivData[job].filter((o: any) => o.node_code === node_code && o.name !== name)
    return matches.length ? matches : [{ name: 'None', ID: '000' }]
})

const isTimeActive = computed(() => (props.timerList.find((o: any) => o.ID === props.node.time)?.stateActive ? true : null))
const isWeather1Active = computed(() => (props.weatherList[props.node.area.mapcode] == props.node.weather1 ? true : null))
const isWeather2Active = computed(() => (props.weatherList[props.node.area.mapcode] == props.node.weather2 ? true : null))

const isTimeAndWeatherActive = computed(() => {
    const timeState = props.timerList.find((o: any) => o.ID === props.node.time)?.stateActive ? true : false
    const weatherState1 = props.weatherList[props.node.area.mapcode] == props.node.weather1
    const weatherState2 = props.weatherList[props.node.area.mapcode] == props.node.weather2
    return timeState && (weatherState1 || weatherState2) ? true : null
})

function timerCountdown(time: string): string {
    if (!time) return 'Any Time'
    return props.timerList.find((o: any) => o.ID === time)?.countdown ?? 'Any Time'
}

function getVistaInfo(type: string) {
    const expFound = props.ffxivData.expansion.find((o: any) => o.expansion == props.node.expansion)
    if (type == 'exp') return expFound.vista_exp == 0 ? 'None' : expFound.vista_exp
    if (type == 'level') return `LV. ${expFound.vista_min} - ${expFound.vista_max}`
}
</script>