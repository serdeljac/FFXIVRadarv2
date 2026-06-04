<template>
    <div :class="['blueMageAbilties body_content', windowWidth]">

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

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import areaDisplayBM from '../ui/displayAreaForBm.vue';

    export default {
        name: "Blue Mage Abilities",
        components: { toggleFilterBtn, areaDisplayBM },
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        data() {
            return {
                filters: [] as [string, string, boolean][],
                filterSelected: 'All' as string,
                appendData: [] as any[]
            }
        },
        created() {
            this.createFilterList()
        },
        methods: {
            createFilterList() {
                this.filters = this.ffxivData.bluemageFilters.map(
                    (d: [string, string, boolean], i: number) => [d[0], d[1], i === 0]
                )
                this.filterSelected = 'All'
                this.fetchBlueMageData()
            },
            changeFilter(arrayIndex: number) {
                this.filters.forEach((d, i) => { d[2] = i === arrayIndex })
                this.filterSelected = this.filters[arrayIndex][1]
                this.fetchBlueMageData()
            },
            isVisibleEntry(entryType: string): boolean {
                return this.filterSelected === 'All' || this.filterSelected === entryType
            },
            fetchBlueMageData() {
                const filt = this.filterSelected
                this.appendData = filt === 'All'
                    ? [...this.ffxivData.bluemageData]
                    : this.ffxivData.bluemageData.filter(
                        (d: any) => d.category.includes(filt)
                    )
            }
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable_row-area, .rdrTable_row-notes, .rdrTable_row-enemy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        justify-items: center;
        &>p {
            height: 24px;
            display: flex;
            align-items: center;
        }
    }
</style>