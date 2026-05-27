<template>
    <div :class="[`blueMageAbilties body_content`, windowWidth]">

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn 
                    v-for="(d, index) in filters" :key="d[1]"
                    :name="d[1]" 
                    :enabled="d[2] ? true : null"
                    @click="changeFilter(index)"/>
            </div>
        </div>

        <!-- Table -->
        <div :class="[`body_content-group rdrTable`, windowWidth]">

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

            <ul :class="[`rdrTable_body`]">
                <li v-for="d in appendData" :key="d.ID" class="rdrTable_row">

                    <!-- NAME -->
                    <div class="rdrTable_row-name">{{ d.name }}</div>

                    <!-- LEVEL -->
                    <div class="rdrTable_row-level">{{`Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}`}}</div>

                    <!-- ENEMY/NPC -->
                    <div class="rdrTable_row-enemy">
                        <div v-for="e in d.npc" :key="e[1]">
                            <p v-if="filterSelected == 'All' || filterSelected == e[0]">{{ e[2] }}</p>
                        </div>
                    </div>

                    <!-- NOTES -->
                    <div class="rdrTable_row-notes">
                        <div v-for="e in d.notes" :key="e[1]">
                            <p v-if="filterSelected == 'All' || filterSelected == e[0]">
                                {{ e[2] ? e[2] : '-' }}</p>
                        </div>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <div v-for="e in d.location" :key="e[1]">
                            <areaDisplayBM v-if="filterSelected == 'All' || filterSelected == e[0]" :bmData="e" />
                        </div>
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
        components: {toggleFilterBtn, areaDisplayBM},
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        data() {
            return {
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
                allBlueMageSkills: [] as any,
                appendData: [] as any
            }
        },
        created() {
            this.createFilterList() //Run Once
            this.fetchBlueMageData()
        },
        methods: {
            createFilterList() {
                this.filters = this.ffxivData.bluemageFilters
                for (const d in this.filters) {this.filters[d][2] = false}
                this.filters[0][2] = true
                this.filterSelected = 'All'
            },
            changeFilter(arrayIndex: any) {
               //Set all values to Disabled
                for (const d in this.filters) {this.filters[d][2] = false}

                //Set new filter to enable
                this.filters[arrayIndex][2] = true
                this.filterSelected = this.filters[arrayIndex][1]

                this.fetchBlueMageData()
            },
            fetchBlueMageData() {
                let bmData = new Set(this.ffxivData.bluemageData)
                let filt = this.filterSelected 
                if (filt != 'All') {
                    for (const d of bmData) {
                        
                        let foundType = d['category'].indexOf(filt)
                        if (foundType == -1) {
                            bmData.delete(d)
                        }
                    }
                }
                this.appendData = bmData
            }
        }
    }
</script>