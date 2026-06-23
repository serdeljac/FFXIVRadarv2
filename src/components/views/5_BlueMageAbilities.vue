<template>
    <div :class="['blueMageAbilties body_content', windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Bluemage Abilities`" :tagline="pageTagLine"/>

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