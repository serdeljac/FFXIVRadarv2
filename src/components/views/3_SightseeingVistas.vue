<template>
    <div :class="['sightseeVistas body_content', windowWidth]">

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

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import timeDisplay from '../ui/displayTime.vue'
    import weatherDisplay from '../ui/displayWeather.vue'
    import areaDisplay from '../ui/displayArea.vue'
    import iconImgAPI from '../API/iconImg.vue';

    // Filter shape kept explicit; replaces opaque tuple indexing.
    interface Filter {
        group: string
        name: string
        enabled: boolean
    }

    export default {
        name: "SightseeingVistas",

        components: { toggleFilterBtn, toggleTrackingBtn, toggleDetailsBtn, timeDisplay, weatherDisplay, areaDisplay, iconImgAPI },

        props: ['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'],

        emits: ['changeTracked', 'openDetails'],

        data() {
            return {
                filters: [] as Filter[],
                filterSelected: '' as string,
                activeTime: {} as Record<string, boolean>,
                activeWeather: {} as Record<string, boolean>,
            }
        },

        computed: {
            // Derives unique expansion list once; no duplicate logic between old methods.
            uniqueExpansions(): string[] {
                const seen = new Set<string>()
                const result: string[] = []
                for (const item of this.ffxivData.sightseeing) {
                    if (!seen.has(item.expansion)) {
                        seen.add(item.expansion)
                        result.push(item.expansion)
                    }
                }
                return result
            },

            // Groups all vista nodes by expansion name, computed once and cached.
            allVistaNodes(): Record<string, any[]> {
                const grouped: Record<string, any[]> = {}
                for (const expansion of this.uniqueExpansions) {
                    grouped[expansion] = this.ffxivData.sightseeing.filter(
                        (o: any) => o.expansion === expansion
                    )
                }
                return grouped
            },

            // Active vista list for the selected filter; avoids repeated map lookups in the template.
            currentVistaNodes(): any[] {
                return this.allVistaNodes[this.filterSelected] ?? []
            },

            // Replaces fetchVistaData(); recomputes only when filterSelected changes.
            currentExpansionData(): any {
                return this.ffxivData.expansion.find(
                    (o: any) => o.expansion === this.filterSelected
                ) ?? {}
            },
        },

        created() {
            this.initFilters()
        },

        methods: {
            initFilters() {
                this.filters = this.uniqueExpansions.map((name, i) => ({
                    group: 'expansion',
                    name,
                    enabled: i === 0,
                }))
                this.filterSelected = this.filters[0]?.name ?? ''
            },

            changeFilter(arrayIndex: number) {
                this.filters.forEach((f, i) => { f.enabled = i === arrayIndex })
                this.filterSelected = this.filters[arrayIndex].name
            },

            sendTimerState(timeState: boolean, id: string, type: 'timer' | 'weather') {
                if (type === 'timer') {
                    this.activeTime[id] = timeState
                } else {
                    this.activeWeather[id] = timeState
                }
            },
        },
    }
</script>