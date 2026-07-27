<template>
    <div :class="[`timedNodes body_content`, windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Timed Mining & Botany`" :tagline="pageTagLine" icon="gathering"/>

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
                        :action="true"
                        @click="resetFilters" />
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <nav aria-label="Pagination">
            <ul class="body_content-group pagenation">
                <li v-for="(_, index) in compiledDataForTable" :key="index">
                    <button
                        type="button"
                        class="pagenation_item"
                        :class="{ pageActive: arraySet === index }"
                        :aria-current="arraySet === index ? 'page' : null"
                        :aria-label="`Page ${index + 1}`"
                        @click="arraySet = index">
                        {{ index + 1 }}
                    </button>
                </li>
            </ul>
        </nav>

        <!-- Table -->
        <!-- ARIA table roles over the existing <ul>/<li> markup: without them a
             screen reader announces "list, 50 items" and reads each cell with no
             indication of which column it belongs to. Roles are used rather than a
             real <table> so the CSS-grid row layout is untouched. -->
        <div
            :class="[`body_content-group rdrTable`, windowWidth]"
            role="table"
            aria-label="Timed mining and botany nodes">

            <ul class="rdrTable_header" role="rowgroup">
                <li class="rdrTable_row" role="row">
                    <p class="rdrTable_row-tracking" role="columnheader"><span class="visuallyHidden">Actions</span></p>
                    <p class="rdrTable_row-name" role="columnheader">Name</p>
                    <p class="rdrTable_row-attributes" role="columnheader">Attributes</p>
                    <p class="rdrTable_row-time" role="columnheader">Timer</p>
                    <p class="rdrTable_row-area" role="columnheader">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split" />

            <ul class="rdrTable_body" role="rowgroup">
                <li
                    v-for="d in compiledDataForTable[arraySet]" :key="d.ID"
                    
                    role="row"
                    :class="[`rdrTable_row`, {'nodeIsActive': nodeTimeChecker(d, timerList, true)}]">

                    <!-- TRACKER -->
                    <div class="rdrTable_row-tracking" role="cell">
                        <toggleTrackingBtn
                            :trackingEnabled="d.tracked"
                            :label="d.tracked ? `Untrack ${d.name}` : `Track ${d.name}`"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', d)" />
                        <toggleDetailsBtn
                            :label="`View details for ${d.name}`"
                            class="hasContext"
                            data-context="View Details"
                            @click="$emit('openDetails', d)" />
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_row-name" role="cell">
                            <displayItemName :item="d.name" :node="d"/>
                    </div>

                    <!-- ATTRIBUTES -->
                    <!-- The data-context tooltip is hover-only, so each chip also
                         carries the same string as an accessible name. -->
                    <div class="rdrTable_row-attributes" role="cell">
                        <span class="hasContext" role="img" :aria-label="capitalize(d.job_sub)" :data-context="capitalize(d.job_sub)">
                                <iconImgAPI :name="d.job_sub"/>
                            </span>

                            <span v-if="d.usage" class="hasContext" role="img" :aria-label="fetchUsageAttrName(d)" :data-context="fetchUsageAttrName(d)">
                                <iconImgAPI :name="fetchUsageImgName(d)"/>
                            </span>

                            <iconImgAPI v-if="d.usage === 'customdelivery'" class="iconSize2" :name="'customdelivery'" alt="Custom delivery"/>

                            <span v-if="d.node_name === 'Legendary'" class="hasContext" role="img" :aria-label="`Requires ${d.tomb}`" :data-context="`Requires ${d.tomb}`">
                                <iconImgAPI :name="'folklore'"/>
                            </span>
                    </div>



                    <!-- TIMER -->
                    <div class="rdrTable_row-time" role="cell">
                        <displayTime :node="d"/>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area" role="cell">
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
import toggleFilterBtn from '../components/buttons/toggleFilter.vue'
import toggleTrackingBtn from '../components/buttons/toggleTracking.vue'
import toggleDetailsBtn from '../components/buttons/toggleDetailMenu.vue'
import inputSearchBar from '../components/buttons/inputSearchBar.vue'
import displayItemName from '../components/display/displayItemName.vue'
import areaDisplay from '../components/display/displayArea.vue'
import iconImgAPI from '../modules/FetchIconImage.vue'
import displayTime from '../components/display/displayTime.vue'
import PageHeader from '../components/PageHeader.vue'
import { nodeTimeChecker, capitalize, getUniqueByKey, fetchUsageAttrName, fetchUsageImgName } from '../hooks/hooks.ts'

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
const pageTagLine = 'Unspoiled and ephemeral gathering nodes in Final Fantasy XIV only appear during specific Eorzea time windows — usually for just two hours out of every twenty-four. This tracker lists every timed Mining and Botany node across all expansions, showing the spawn time, zone, coordinates, item yields, and aetherial reduction results. Use the filters to narrow by expansion or resource type, or search by item name to find a specific material quickly.'

const groupedFilters = computed<Record<string, Filter[]>>(() => ({
    job: filters.value.filter(f => f.group === 'job'),
    usage: filters.value.filter(f => f.group === 'usage'),
    expansion: filters.value.filter(f => f.group === 'expansion'),
}))

// Builds the job/usage/expansion toggle list from the loaded nodes. Empty group
// values are dropped so nodes without a usage don't add a blank toggle.
function createFilterList() {
    const toFilters = (arr: any[], group: string): Filter[] =>
        getUniqueByKey(arr, group)
            .filter(o => o[group])
            .map(o => ({ group, name: o[group], enabled: true }))

    const jobFilters = toFilters(allTimedNodes.value, 'job')
    const usageFilters = toFilters(allTimedNodes.value, 'usage')
    const expansionFilters = toFilters(props.ffxivData.expansion, 'expansion')

    filters.value = [...jobFilters, ...usageFilters, ...expansionFilters]
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

// Searches nodes by item name and, for aetherial nodes, by reduction-result names.
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
    const byAetherial = allTimedNodes.value.filter((o: any) => {
        if (o.usage !== 'aetherial') return false
        const { result1, result2, result3 } = o.usage_info
        return [result1, result2, result3].some(
            (r: string) => r?.toLowerCase().includes(search)
        )
    })

    sortNodesIntoGroup([...new Set([...byName, ...byAetherial])])
}

const miner = props.ffxivData.miner.filter((o: any) => o.time)
const botany = props.ffxivData.botany.filter((o: any) => o.time)
allTimedNodes.value = [...miner, ...botany]
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
            // border-radius: 10px;
            // border: 1px solid $buttonBorder;
            max-width: 1200px;
            // background: rgba(255, 255, 255, 0.03);

            :deep(.btn) {
                border: 1px solid $buttonBorder;
                background: rgba(255, 255, 255, 0.03);
                color: $fontColor;
                font-family: 'Rajdhani', sans-serif;
                // font-weight: 600;
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
                // Native <button> reset — was a bare <li> before it became focusable.
                appearance: none;
                font-size: inherit;

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


        // Default layout
        .rdrTable_row {
            grid-template-columns: 80px 400px 200px 120px auto;
        }

        // Tablet view
        .rdrTable.tablet {
            .rdrTable_row {
                grid-template-columns: 60px 200px 80px 80px auto;
            }
        }

        // Mobile view
        .rdrTable.mobile {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            // 88px, not 60px: the track and details buttons each get a 44x44
            // touch target, and at 26px apart those targets overlapped by 18px
            // so edge taps hit the wrong control. The gap below spaces their
            // centres a full 44px apart, and the column has to fit that.
            .rdrTable_row {
                grid-template-columns: 88px auto;
            }

            .rdrTable_row-tracking {
                gap: 18px;
            }

            .rdrTable_row-attributes,
            .rdrTable_row-level {
                display: none;
            }
        }
    }
</style>