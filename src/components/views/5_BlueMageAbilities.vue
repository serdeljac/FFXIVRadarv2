<template>
    <div :class="['blueMageAbilties body_content', windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Bluemage Abilities`" :tagline="pageTagLine" icon="bluemage"/>

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn
                    v-for="(d, index) in filters"
                    :key="d[1]"
                    :name="d[1]"
                    :noicon="true"
                    :enabled="d[2] || null"
                    @click="changeFilter(index)"
                />
            </div>
        </div>

        <!-- Table -->
        <div :class="['body_content-group rdrTable', windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-name">Name</p>
                    <p class="rdrTable_row-level">Min Lv</p>
                    <p class="rdrTable_row-enemy">Enemy/NPC</p>
                    <p class="rdrTable_row-notes">Notes</p>
                    <p class="rdrTable_row-area">Location</p>
                </li>
            </ul>

            <hr class="rdrTable_split"/>

            <ul class="rdrTable_body">
                <li v-for="d in appendData" :key="d.ID" class="rdrTable_row">

                    <!-- NAME -->
                    <div class="rdrTable_row-name">{{ d.name }}</div>

                    <!-- LEVEL -->
                    <div class="rdrTable_row-level">{{ `Lv. ${d.level} ${'★'.repeat(d.stars)}` }}</div>

                    <!-- ENEMY/NPC -->
                    <div class="rdrTable_row-enemy">
                        <template v-for="e in d.npc" :key="e[1]">
                            <p v-if="isVisibleEntry(e[0])">{{ e[2] }}</p>
                        </template>
                    </div>

                    <!-- NOTES -->
                    <div class="rdrTable_row-notes">
                        <template v-for="e in d.notes" :key="e[1]">
                            <p v-if="isVisibleEntry(e[0])">{{ e[2] || '-' }}</p>
                        </template>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <template v-for="e in d.location" :key="e[1]">
                            <areaDisplayBM v-if="isVisibleEntry(e[0])" :bmData="e" />
                        </template>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
import areaDisplayBM from '../ui/displayAreaForBm.vue'
import PageHeader from '../ui/displayPageHeader.vue'

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const filters = ref<[string, string, boolean][]>([])
const filterSelected = ref('All')
const appendData = ref<any[]>([])
const pageTagLine = "Blue Mage is FFXIV's Limited Job that learns spells by witnessing enemies use them in battle. With over 100 actions to collect, tracking down the right enemy in the right zone can be a challenge. This reference table lists every Blue Magic spell with the enemy or NPC to learn it from, the minimum Blue Mage level required to enter that area, and the exact zone and location. Filter by spell category or scroll through the full list to plan your learning route."

function createFilterList() {
    filters.value = props.ffxivData.bluemageFilters.map(
        (d: [string, string, boolean], i: number) => [d[0], d[1], i === 0]
    )
    filterSelected.value = 'All'
    fetchBlueMageData()
}

function changeFilter(arrayIndex: number) {
    filters.value.forEach((d, i) => { d[2] = i === arrayIndex })
    filterSelected.value = filters.value[arrayIndex][1]
    fetchBlueMageData()
}

function isVisibleEntry(entryType: string): boolean {
    return filterSelected.value === 'All' || filterSelected.value === entryType
}

function fetchBlueMageData() {
    const filt = filterSelected.value
    appendData.value = filt === 'All'
        ? [...props.ffxivData.bluemageData]
        : props.ffxivData.bluemageData.filter((d: any) => d.category.includes(filt))
}

createFilterList()
</script>

<style scoped lang="scss">
    .blueMageAbilties {
        font-family: 'Rajdhani', sans-serif;
        // max-width: 1200px;
        margin: 0 auto;

        /* ── Filter bar ── */
        .filterbar {
            padding: 16px 20px;

            :deep(.btn) {
                min-width: 80px;
                justify-content: center;
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
        }

        .rdrTable_row {
            grid-template-columns: 140px 100px 300px 300px auto;
        }

        .rdrTable.mobile,
        .rdrTable.tablet {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: auto auto;
            }

            .rdrTable_row-area {
                grid-column: 1 / span 2;
            }
        }
    }

    .rdrTable_row-area,
    .rdrTable_row-notes,
    .rdrTable_row-enemy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        justify-items: center;

        & > p {
            height: 24px;
            display: flex;
            align-items: center;
        }
    }
</style>