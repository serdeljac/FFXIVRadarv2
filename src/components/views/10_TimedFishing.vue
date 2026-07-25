<template>
    <div :class="[`timedNodes body_content`, windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Timed Fishing`" :tagline="pageTagLine" icon="fishing"/>

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
                        :name="'Reset'"
                        :noicon="true"
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
                    <p class="rdrTable_row-weather">Weather</p>
                    <p class="rdrTable_row-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split" />

            <ul class="rdrTable_body">
                <li
                    v-for="d in compiledDataForTable[arraySet]" :key="d.ID"
                    :data-rowAndTimeActive="isFishNodeActive(d, timerList, weatherList)"
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
                        </div>
                    </div>

                    <!-- ATTRIBUTES -->
                    <div class="rdrTable_row-attributes">
                        <div>
                            <span class="hasContext" :data-context="capitalize(d.job_sub)">
                                <iconImgAPI :name="d.job_sub"/>
                            </span>
                        </div>
                    </div>

                    <!-- LEVEL -->
                    <div class="rdrTable_row-level">
                        {{ `Lv. ${d.level} ${'★'.repeat(d.stars)}` }}
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_row-time">
                        <p class="timeAppend">
                            {{ nodeTimeChecker(d, timerList, false) }}
                        </p>
                    </div>

                    <!-- WEATHER -->
                    <div class="rdrTable_row-weather">
                        {{ fishWeatherLabel(d) }}
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
import { ref, computed } from 'vue'
import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
import inputSearchBar from '../ui/buttons/inputSearchBar.vue'
import areaDisplay from '../ui/displayArea.vue'
import iconImgAPI from '../api/iconImg.vue'
import PageHeader from '../ui/displayPageHeader.vue'
import { nodeTimeChecker, capitalize, getUniqueByKey, isFishNodeActive } from '../../hooks/hooks.ts'

interface Filter {
    group: string
    name: string
    enabled: boolean
}

const PAGE_SIZE = 50

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])
defineEmits(['changeTracked', 'openDetails'])

const compiledDataForTable = ref<any[][]>([])
const allTimedNodes = ref<any[]>([])
const arraySet = ref(0)
const displayNoNodesFound = ref(false)
const searchName = ref('')
const filters = ref<Filter[]>([])
const pageTagLine = 'Timed fishing holes in Final Fantasy XIV only become available during specific Eorzea time windows, and some also require the right weather to be active. This tracker lists every timed fishing node across all expansions, showing the spawn time, zone, and coordinates. Use the filters to narrow by expansion, or search by fish name to find a specific catch quickly.'

// "weather1 / weather2 / weather3 > weatherchain1 / weatherchain2 / weatherchain3",
// dropping empty slots and the chain arrow entirely when there's no preceding weather.
function fishWeatherLabel(d: any): string {
    const required = [d.weather1, d.weather2, d.weather3].filter(Boolean)
    if (!required.length) return ''

    const preceding = [d.weatherchain1, d.weatherchain2, d.weatherchain3].filter(Boolean)
    const requiredStr = required.join(' / ')
    return preceding.length ? `${requiredStr} > ${preceding.join(' / ')}` : requiredStr
}

const groupedFilters = computed<Record<string, Filter[]>>(() => ({
    expansion: filters.value.filter(f => f.group === 'expansion'),
}))

// Builds the expansion toggle list from the loaded nodes.
function createFilterList() {
    const toFilters = (arr: any[], group: string): Filter[] =>
        getUniqueByKey(arr, group)
            .filter(o => o[group])
            .map(o => ({ group, name: o[group], enabled: true }))

    filters.value = toFilters(props.ffxivData.expansion, 'expansion')
}

// Chunks the node list into PAGE_SIZE pages for the table and flags the empty state.
function sortNodesIntoGroup(array: any[]) {
    const result: any[][] = []
    for (let i = 0; i < array.length; i += PAGE_SIZE) {
        result.push(array.slice(i, i + PAGE_SIZE))
    }
    compiledDataForTable.value = result
    displayNoNodesFound.value = result.length === 0
}

function changeFilter(filter: Filter) {
    filter.enabled = !filter.enabled
    searchName.value = ''
    arraySet.value = 0
    applyFilters()
}

function resetFilters() {
    filters.value.forEach(f => { f.enabled = true })
    searchName.value = ''
    arraySet.value = 0
    sortNodesIntoGroup(allTimedNodes.value)
}

// Keeps only nodes that don't match any disabled filter (filters are opt-out).
function applyFilters() {
    const disabledFilters = filters.value.filter(f => !f.enabled)
    if (disabledFilters.length === 0) {
        sortNodesIntoGroup(allTimedNodes.value)
        return
    }
    const filtered = allTimedNodes.value.filter(node =>
        disabledFilters.every(f => node[f.group] !== f.name)
    )
    sortNodesIntoGroup(filtered)
}

// Searches nodes by fish name.
function filterByInputValue(value: string) {
    searchName.value = value
    arraySet.value = 0
    filters.value.forEach(f => { f.enabled = true })

    if (!value || !value.trim()) {
        sortNodesIntoGroup(allTimedNodes.value)
        return
    }

    const search = value.trim().toLowerCase()
    const byName = allTimedNodes.value.filter(
        (o: any) => o.name?.toLowerCase().includes(search)
    )

    sortNodesIntoGroup(byName)
}

allTimedNodes.value = props.ffxivData.fishing.filter((o: any) => o.time)
createFilterList()
sortNodesIntoGroup(allTimedNodes.value)
</script>

<style scoped lang="scss">
    @keyframes timedNodesRowPulse {
        0%, 100% { background-color: rgba(45, 212, 191, 0.08); }
        50%      { background-color: rgba(45, 212, 191, 0.22); }
    }

    .timedNodes {
        font-family: 'Rajdhani', sans-serif;

        margin: 0 auto;

        &.mobile {
            .filterbar :deep(.btn) {
                margin: 6px 5px;
            }

            .pagenation_item {
                margin: 3px 5px;
            }
        }

        /* ── Filter bar ── */
        .filterbar {
            padding: 16px 20px;
            max-width: 1200px;

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

            :deep(input[type=text]) {
                border: 1px solid $buttonBorder;
                background: rgba(255, 255, 255, 0.03);
                color: $fontColor;
                font-family: 'Rajdhani', sans-serif;
                border-radius: 8px;
                transition: all 0.2s;

                &:focus {
                    outline: none;
                    border-color: $teal;
                    box-shadow: 0 0 0 1px $tealShadow;
                }

                &::placeholder {
                    color: $dim;
                }
            }
        }

        /* ── Pagination ── */
        .pagenation {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            width: 90%;

            &_item {
                width: 32px;
                user-select: none;
                aspect-ratio: 1 / 1;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid $buttonBorder;
                color: $dim;
                font-family: 'Share Tech Mono', monospace;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                margin: 0.5rem 1rem;
                cursor: pointer;
                transition: all 0.2s;

                &.pageActive {
                    background: rgba(45, 212, 191, 0.18);
                    border-color: rgba(45, 212, 191, 0.45);
                    color: #e8f0ff;
                    box-shadow: 0 0 10px $tealShadow;
                }

                &:hover {
                    background: rgba(45, 212, 191, 0.07);
                    border-color: rgba(45, 212, 191, 0.35);
                    color: #e8f0ff;
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

                &-name span {
                    color: $dim;
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

        .noResults {
            text-align: center;
            padding: 20px;
            color: $dim;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.85rem;
        }

        /* Give the pulsing "currently active" row a teal glow to match the theme,
           instead of the default purple used elsewhere in the app. */
        [data-rowAndTimeActive] {
            animation: timedNodesRowPulse 0.9s ease-in-out infinite;
        }

        // Default layout
        .rdrTable_row {
            grid-template-columns: 80px 400px 100px 100px 120px 180px auto;
        }

        // Tablet view
        .rdrTable.tablet {
            .rdrTable_row {
                grid-template-columns: 60px 200px 80px 80px 80px 140px auto;
            }
        }

        // Mobile view
        .rdrTable.mobile {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: 60px auto;
            }

            .rdrTable_row-attributes,
            .rdrTable_row-level,
            .rdrTable_row-weather {
                display: none;
            }
        }
    }
</style>
