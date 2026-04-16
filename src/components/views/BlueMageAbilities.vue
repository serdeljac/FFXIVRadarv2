<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">
            <div class="filterbar_group">
                <div v-for="(d, index) in filters" :key="d[1]">
                    <buttonFilter 
                        :name="d[1]" 
                        :disabled="!d[2]"
                        @click="changeFilter(index)"/>
                </div>
            </div>
        </div>

        <div class="body_content">
            <ul class="rdrTable header">
                <li>
                    <p>Name</p>
                    <p>Min Lv</p>
                    <p>Enemy/NPC</p>
                    <p>Location</p>
                    <p>Notes</p>
                </li>
            </ul>
            <hr class="rdrTable split"/>
            <ul :class="[`rdrTable body`]">
                <li v-for="d in appendData" :key="d.ID" >

                        <!-- NAME -->
                        <div>{{ d.name }}</div>

                        <!-- LEVEL -->
                        <div>{{`Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}`}}</div>

                        <!-- ENEMY/NPC -->
                        <div>
                            <div v-for="e in d.npc" :key="e[1]">
                                <p v-if="filterSelected == 'All' || filterSelected == e[0]">{{ e[0] }}</p>
                            </div>
                        </div>

                        <div>
                            <div v-for="e in d.location" :key="e[1]">
                                <iconAndTextBM v-if="filterSelected == 'All' || filterSelected == e[0]" :bmData="[e]" />
                            </div>
                        </div>

                        <div>
                            <div v-for="e in d.notes" :key="e[1]">
                                <p v-if="filterSelected == 'All' || filterSelected == e[0]">{{ e[1] }}</p>
                            </div>
                        </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';
import iconAndTextBM from '../ui/iconAndTextBMage.vue';

    export default {
        name: "Blue Mage Abilities",
        components: {promotionBanner, displayAreaText, buttonFilter, seachBar, iconAndTextBM},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
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

<style scoped lang="scss">
    .rdrTable li {grid-template-columns: 140px 100px auto 320px 240px;}
</style>