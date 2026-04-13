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
                <li v-for="d in allBlueMageSkills" :key="d.ID">
                    <div>{{ d.name }}</div>
                    <div>{{ d.level }} {{ d.stars }}</div>
                    <div>
                        <p v-for="e in d.npc" :key="e[1]" :class="[`filter_${e[0]}`]">
                            {{ e[0] }}
                        </p>
                    </div>
                    <div>{{ d.location }}</div>
                    <div>{{ d.notes }}</div>
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

    export default {
        name: "Blue Mage Abilities",
        components: {promotionBanner, displayAreaText, buttonFilter, seachBar},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
        data() {
            return {
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
                allBlueMageSkills: [] as any
            }
        },
        created() {
            this.createFilterList() //Run Once
            this.allBlueMageSkills = this.ffxivData.bluemageData
        },
        methods: {
            createFilterList() {
                this.filters = this.ffxivData.bluemageFilters
            },
            changeFilter(arrayIndex: any) {
               //Set all values to Disabled
                for (const d in this.filters) {this.filters[d][2] = false}

                //Set new filter to enable
                this.filters[arrayIndex][2] = true
                this.filterSelected = this.filters[arrayIndex][1]
            }
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable li {grid-template-columns: 140px 100px auto 320px 240px;}
</style>