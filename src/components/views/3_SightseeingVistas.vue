<template>
    <div :class="['sightseeVistas body_content', windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Sightseeing Vistas`" :tagline="pageTagLine" icon="sightseeing"/>

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn
                    v-for="(d, index) in filters"
                    :key="d.name"
                    :name="d.name"
                    :icon="d.name"
                    :enabled="d.enabled || null"
                    @click="changeFilter(index)"
                />
            </div>
        </div>

        <!-- Expansion Notes -->
        <div class="body_content-group vistaNote">
            <template v-if="filterSelected === 'A Realm Reborn'">
                <p>To Unlock vista's 21-80, you MUST complete all 20 in the log.</p>
                <br />
            </template>
            <p>
                Each vista discovered will grant you
                <span class="expColor">{{ currentExpansionData.vista_exp }}</span>
                <iconImgAPI :name="'exp'"/>
                when you're between levels
                <span class="levelColor">{{ currentExpansionData.vista_min }}-{{ currentExpansionData.vista_max }}</span>.
            </p>
        </div>

        <!-- Table -->
        <div :class="['body_content-group rdrTable', windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-no">No</p>
                    <p class="rdrTable_row-name">Name</p>
                    <p class="rdrTable_row-time">Time</p>
                    <p class="rdrTable_row-weather">Weather</p>
                    <p class="rdrTable_row-emote">Emote</p>
                    <p class="rdrTable_row-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split" />

            <ul class="rdrTable_body">
                <li
                    v-for="d in currentVistaNodes"
                    :key="d.ID"
                    :data-rowActive="activeTime[d.ID] && activeWeather[d.ID] || null"
                    class="rdrTable_row"
                >
                    <!-- TRACKER -->
                    <div class="rdrTable_row-tracking">
                        <toggleTrackingBtn
                            v-if="d.time"
                            :trackingEnabled="d.tracked"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', d)"
                        />
                        <toggleDetailsBtn
                            v-if="windowWidth !== 'mobile'"
                            class="hasContext"
                            data-context="View Details"
                            @click="$emit('openDetails', d)"
                        />
                    </div>

                    <!-- NO -->
                    <div class="rdrTable_row-no">
                        <p>{{ d.no }}</p>
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_row-name">
                        <p>{{ d.name }}</p>
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_row-time">
                        <timeDisplay
                            :timerList="timerList"
                            :timeId="d.time"
                            @timeActive="(e) => sendTimerState(e, d.ID, 'timer')"
                        />
                    </div>

                    <!-- WEATHER -->
                    <div class="rdrTable_row-weather">
                        <weatherDisplay
                            :weatherList="weatherList"
                            :node="d"
                            @weatherActive="(e) => sendTimerState(e, d.ID, 'weather')"
                        />
                    </div>

                    <!-- EMOTE -->
                    <div class="rdrTable_row-emote">
                        <iconImgAPI :name="d.emote.toLowerCase()"/>
                        <p>{{ d.emote }}</p>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d" />
                    </div>
                </li>
            </ul>

        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
import timeDisplay from '../ui/displayTime.vue'
import weatherDisplay from '../ui/displayWeather.vue'
import areaDisplay from '../ui/displayArea.vue'
import iconImgAPI from '../API/iconImg.vue'
import PageHeader from '../ui/displayPageHeader.vue'

// Filter shape kept explicit; replaces opaque tuple indexing.
interface Filter {
    group: string
    name: string
    enabled: boolean
}

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])
defineEmits(['changeTracked', 'openDetails'])

const filters = ref<Filter[]>([])
const filterSelected = ref('')
const activeTime = reactive<Record<string, boolean>>({})
const activeWeather = reactive<Record<string, boolean>>({})
const pageTagLine = "The Sightseeing Log is a collection of scenic vistas hidden across Eorzea that you discover by standing in the right spot, at the right time of day, in the right weather, and performing the correct emote. This tracker covers all expansions — from A Realm Reborn through Dawntrail — and shows each vista's required Eorzea time window, weather condition, emote, zone, and coordinates. Preview images help you identify the exact location. Tick off entries as you find them to track your progress through the log."

// Derives the unique expansion list once; no duplicate logic between methods.
const uniqueExpansions = computed<string[]>(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const item of props.ffxivData.sightseeing) {
        if (!seen.has(item.expansion)) {
            seen.add(item.expansion)
            result.push(item.expansion)
        }
    }
    return result
})

// Groups all vista nodes by expansion name, computed once and cached.
const allVistaNodes = computed<Record<string, any[]>>(() => {
    const grouped: Record<string, any[]> = {}
    for (const expansion of uniqueExpansions.value) {
        grouped[expansion] = props.ffxivData.sightseeing.filter(
            (o: any) => o.expansion === expansion
        )
    }
    return grouped
})

// Active vista list for the selected filter; avoids repeated map lookups in the template.
const currentVistaNodes = computed(() => allVistaNodes.value[filterSelected.value] ?? [])

// Replaces fetchVistaData(); recomputes only when filterSelected changes.
const currentExpansionData = computed(
    () => props.ffxivData.expansion.find((o: any) => o.expansion === filterSelected.value) ?? {}
)

function initFilters() {
    filters.value = uniqueExpansions.value.map((name, i) => ({
        group: 'expansion',
        name,
        enabled: i === 0,
    }))
    filterSelected.value = filters.value[0]?.name ?? ''
}

function changeFilter(arrayIndex: number) {
    filters.value.forEach((f, i) => { f.enabled = i === arrayIndex })
    filterSelected.value = filters.value[arrayIndex].name
}

function sendTimerState(timeState: boolean, id: string, type: 'timer' | 'weather') {
    if (type === 'timer') {
        activeTime[id] = timeState
    } else {
        activeWeather[id] = timeState
    }
}

initFilters()
</script>

<style scoped lang="scss">
    @keyframes sightseeVistasRowPulse {
        0%, 100% { background-color: rgba(45, 212, 191, 0.08); }
        50%      { background-color: rgba(45, 212, 191, 0.22); }
    }

    .sightseeVistas {
        font-family: 'Rajdhani', sans-serif;
        margin: 0 auto;

        /* ── Filter bar ── */
        .filterbar {
            padding: 16px 20px;

            :deep(.btn) {
                border: 1px solid $buttonBorder;
                background: rgba(255, 255, 255, 0.03);
                color: $fontColor;
                font-family: 'Rajdhani', sans-serif;
                letter-spacing: 0.03em;
                border-radius: 8px;
                box-shadow: none;
                transition: all 0.2s;

                &[enabled] {
                    background: rgba(45, 212, 191, 0.12) !important;
                    border-color: rgba(45, 212, 191, 0.4);
                    color: #e8f0ff;
                }

                &:hover:not([disabled]) {
                    background: rgba(45, 212, 191, 0.07);
                    border-color: rgba(45, 212, 191, 0.35);
                    color: #e8f0ff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                }
            }
        }

        /* ── Expansion note panel ── */
        .vistaNote {
            text-align: center;
            width: 100%;
            max-width: 800px;
            padding: 12px 20px;
            border-radius: 10px;
            border: 1px solid $buttonBorder;
            background: rgba(255, 255, 255, 0.03);

            p {
                display: inline-flex;
                align-items: center;
                flex-wrap: wrap;
                justify-content: center;

                span {
                    margin-left: 4px;
                }

                img {
                    margin: 0 2px;
                }
            }
        }

        /* ── Table ── */
        .rdrTable {
            border: 1px solid $buttonBorder;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.02);
            padding: 8px 12px 12px;

            &_header .rdrTable_row p {
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.72rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: $teal;
            }

            &_split {
                border: none;
                border-top: 1px solid rgba(45, 212, 191, 0.15);
                margin: 4px 0 8px;
            }

            &_body .rdrTable_row {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid transparent;
                transition: all 0.15s;

                &:hover {
                    background: rgba(45, 212, 191, 0.05);
                    border-color: rgba(45, 212, 191, 0.15);
                }
            }

            :deep(.trackingTriggerBtn path),
            :deep(.toDetailsBtn path) {
                fill: $dim;
            }
            :deep(.trackingTriggerBtn.tracked path) {
                fill: $teal;
            }
            :deep(.trackingTriggerBtn:hover path),
            :deep(.toDetailsBtn:hover path) {
                fill: $teal !important;
            }

            .hasContext::before {
                background: rgba(11, 18, 32, 0.95);
                border: 1px solid rgba(45, 212, 191, 0.35);
                color: #e8f0ff;
                font-family: 'Rajdhani', sans-serif;
            }
        }

        /* Teal glow for a vista that's currently in its time + weather window */
        [data-rowActive] {
            animation: sightseeVistasRowPulse 0.9s ease-in-out infinite;
        }

        .rdrTable_row {
            grid-template-columns: 80px 80px 300px 100px 120px 120px auto;
        }

        .rdrTable.tablet {
            .rdrTable_row {
                grid-template-columns: 80px 40px 100px 100px 120px 120px auto;
            }
        }

        .rdrTable.mobile {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: 60px 100px auto;
            }

            .rdrTable_row-no {
                display: none;
            }
        }
    }
</style>