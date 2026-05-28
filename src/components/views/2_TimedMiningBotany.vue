<template>
    <div :class="[`timedNodes body_content`, windowWidth]">

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <div v-for="(group, groupKey) in groupedFilters" :key="groupKey" class="filterbar_group">
                    <toggleFilterBtn
                        v-for="filter in group" :key="filter.name"
                        :name="filter.name"
                        :icon="filter.name"
                        :enabled="filter.enabled || null"
                        @click="changeFilter(filter)" />
                </div>

                <div class="filterbar_group">
                    <inputSearchBar :modelValue="searchName" @selected="filterByInputValue" />
                    <toggleFilterBtn
                        name="Reset"
                        :enabled="true"
                        @click="resetFilters" />
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <ul class="body_content-group pagenation">
            <li
                v-for="(_, index) in compiledDataForTable" :key="index"
                class="pagenation_item"
                :class="{ pageActive: arraySet === index }"
                @click="arraySet = index">
                {{ index + 1 }}
            </li>
        </ul>

        <!-- Table -->
        <div :class="[`body_content-group rdrTable`, windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-name">Name</p>
                    <p class="rdrTable_row-attributes">Attributes</p>
                    <p class="rdrTable_row-level">Level</p>
                    <p class="rdrTable_row-time">Timer</p>
                    <p class="rdrTable_row-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split" />

            <ul class="rdrTable_body">
                <li
                    v-for="d in compiledDataForTable[arraySet]" :key="d.ID"
                    :data-rowAndTimeActive="activeList[d.ID]"
                    class="rdrTable_row">

                    <!-- TRACKER -->
                    <div class="rdrTable_row-tracking">
                        <toggleTrackingBtn
                            :trackingEnabled="d.tracked"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', d)" />
                        <toggleDetailsBtn
                            v-if="windowWidth !== 'mobile'"
                            class="hasContext"
                            data-context="View Details"
                            @click="$emit('openDetails', d)" />
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_row-name">
                        <div>
                            <p>{{ d.name }}</p>
                            <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                            <img v-if="d.usage === 'aetherial'" class="iconSize2" :src="getIconImageURL('collectability')" />
                            <img v-if="d.usage === 'customdelivery'" class="iconSize2" :src="getIconImageURL('customdelivery')" />
                        </div>
                    </div>

                    <!-- ATTRIBUTES -->
                    <div class="rdrTable_row-attributes">
                        <div>
                            <span class="hasContext" :data-context="capitalize(d.job_sub)">
                                <img class="iconSize" :src="getIconImageURL(d.job_sub)" />
                            </span>

                            <span v-if="d.usage" class="hasContext" :data-context="fetchUsageAttrName(d.usage, d.usage_info)">
                                <img class="iconSize" :src="getIconImageURL(fetchUsageImgName(d.usage, d.usage_info))" />
                            </span>

                            <span v-if="d.node_name === 'Legendary'" class="hasContext" :data-context="`Requires ${d.tomb}`">
                                <img class="iconSize" :src="getIconImageURL('folklore')" />
                            </span>
                        </div>
                    </div>

                    <!-- LEVEL -->
                    <div class="rdrTable_row-level">
                        {{ `Lv. ${d.level} ${'★'.repeat(d.stars)}` }}
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_row-time">
                        <timeDisplay :timerList="timerList" :timeId="d.time" @timeActive="(e) => sendTimerState(e, d.ID)" />
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d" />
                    </div>
                </li>
            </ul>

            <div v-if="displayNoNodesFound">
                <p class="noResults">No nodes found with the current filter selection.</p>
            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string): string {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import inputSearchBar from '../ui/buttons/inputSearchBar.vue'
    import timeDisplay from '../ui/displayTime.vue'
    import areaDisplay from '../ui/displayArea.vue'

    // Filter shape for clarity and type safety
    interface Filter {
        group: string
        name: string
        enabled: boolean
    }

    const PAGE_SIZE = 50

    export default {
        name: "Timed Mining/Botany",
        components: { toggleFilterBtn, toggleTrackingBtn, toggleDetailsBtn, inputSearchBar, timeDisplay, areaDisplay },
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked', 'openDetails'],

        data() {
            return {
                compiledDataForTable: [] as any[][],
                allTimedNodes: [] as any[],
                arraySet: 0 as number,
                displayNoNodesFound: false as boolean,
                searchName: '' as string,
                filters: [] as Filter[],
                activeList: {} as Record<string, any>,
            }
        },

        computed: {
            // Build grouped filter object once; recomputed only when filters change
            groupedFilters(): Record<string, Filter[]> {
                return {
                    job: this.filters.filter(f => f.group === 'job'),
                    usage: this.filters.filter(f => f.group === 'usage'),
                    expansion: this.filters.filter(f => f.group === 'expansion'),
                }
            },
        },

        created() {
            const miner = this.ffxivData.miner.filter((o: any) => o.time)
            const botany = this.ffxivData.botany.filter((o: any) => o.time)
            this.allTimedNodes = [...miner, ...botany]
            this.createFilterList()
            this.sortNodesIntoGroup(this.allTimedNodes)
        },

        methods: {
            // ─── Helpers ────────────────────────────────────────────────────────

            capitalize(str: string): string {
                return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
            },

            getUniqueByKey(array: any[], key: string): any[] {
                const seen = new Set()
                return array.filter(obj => {
                    if (seen.has(obj[key])) return false
                    seen.add(obj[key])
                    return true
                })
            },

            // ─── Filter Initialisation ───────────────────────────────────────────

            createFilterList() {
                const toFilters = (arr: any[], group: string): Filter[] =>
                    this.getUniqueByKey(arr, group).map(o => ({ group, name: o[group], enabled: true }))

                const jobFilters = toFilters(this.allTimedNodes, 'job')
                const usageFilters = toFilters(this.allTimedNodes, 'usage')
                const expansionFilters = toFilters(this.ffxivData.expansion, 'expansion')

                this.filters = [...jobFilters, ...usageFilters, ...expansionFilters]
            },

            // ─── Pagination ──────────────────────────────────────────────────────

            sortNodesIntoGroup(array: any[]) {
                const result: any[][] = []
                for (let i = 0; i < array.length; i += PAGE_SIZE) {
                    result.push(array.slice(i, i + PAGE_SIZE))
                }
                this.compiledDataForTable = result
                this.displayNoNodesFound = result.length === 0
            },

            // ─── Filter Actions ──────────────────────────────────────────────────

            changeFilter(filter: Filter) {
                filter.enabled = !filter.enabled
                this.searchName = ''
                this.arraySet = 0
                this.applyFilters()
            },

            resetFilters() {
                this.filters.forEach(f => { f.enabled = true })
                this.searchName = ''
                this.arraySet = 0
                this.sortNodesIntoGroup(this.allTimedNodes)
            },

            applyFilters() {
                const disabledFilters = this.filters.filter(f => !f.enabled)
                if (disabledFilters.length === 0) {
                    this.sortNodesIntoGroup(this.allTimedNodes)
                    return
                }
                const filtered = this.allTimedNodes.filter(node =>
                    disabledFilters.every(f => node[f.group] !== f.name)
                )
                this.sortNodesIntoGroup(filtered)
            },

            filterByInputValue(value: string) {
                this.searchName = value
                this.arraySet = 0
                this.filters.forEach(f => { f.enabled = true })

                if (!value || !value.trim()) {
                    this.sortNodesIntoGroup(this.allTimedNodes)
                    return
                }

                const search = value.trim().toLowerCase()
                const byName = this.allTimedNodes.filter(
                    (o: any) => o.name?.toLowerCase().includes(search)
                )
                const byAetherial = this.allTimedNodes.filter((o: any) => {
                    if (o.usage !== 'aetherial') return false
                    const { result1, result2, result3 } = o.usage_info
                    return [result1, result2, result3].some(
                        (r: string) => r?.toLowerCase().includes(search)
                    )
                })

                this.sortNodesIntoGroup([...new Set([...byName, ...byAetherial])])
            },

            // ─── Display Helpers ─────────────────────────────────────────────────

            fetchUsageImgName(usage: string, info: any): string {
                if (usage === 'scripts') return `${info}gatherscripts`
                if (usage === 'crafting') return 'sq_crafting'
                return usage
            },

            fetchUsageAttrName(usage: string, info: any): string {
                if (usage === 'aetherial') {
                    const { result1, result2, result3 } = info
                    return [result1, result2, result3].map(this.capitalize).join(', ')
                }
                if (usage === 'customdelivery') return `Deliver to ${info}`
                if (usage === 'scripts') return `${this.capitalize(info)} Gather Scripts`
                return this.capitalize(usage)
            },

            sendTimerState(timeState: any, id: string) {
                this.activeList[id] = timeState
            },
        },
    }
</script>