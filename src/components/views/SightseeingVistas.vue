<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">
            <div class="filterbar_group group1">
                <buttonFilter 
                    v-for="(value, index) in filters['Expansion']" :key="index" 
                    :name="`${index}`" 
                    :state="filters['Expansion'][index][1]"
                    @click="appendFilters('Expansion', index)"/>
            </div>
        </div>

        <div class="main_content">
            <ul class="rdrTable header">
                <li>Tracker</li>
                <li>No</li>
                <li>Name</li>
                <li>Area</li>
                <li>Weather</li>
                <li>Emote</li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`]" v-for="d in compiledDataForTable" :key="d.ID" :data-activeNodeAnimation="checkActiveState(d.time)">

            </ul>
        </div>

    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayTimer from '../ui/displayTimer.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';

    export default {
        name: "Sightseeing Vistas",
        components: {promotionBanner, displayTimer, displayAreaText, buttonFilter, seachBar},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
        data() {
            return {
                compiledDataForTable: [] as any,
                allTimedNodes: [] as any,
                totalArraySets: 0 as number,
                arraySet: 0 as number,
                displayNoNodesFound: false as boolean,
                searchName: '' as string,
                showDetails: '' as string,
                showOnlyActive: false as boolean,
                filters: {
                    "Expansion": {
                        "A Realm Reborn": ['expansion', true],
                        "Heavensward": ['expansion', false],
                        "Stormblood": ['expansion', false],
                        "Shadowbringers": ['expansion', false],
                        "Endwalker": ['expansion', false],
                        "Dawntrail": ['expansion', false]
                    },
                }
            }
        },
        created() {
            this.sortNodesIntoGroup(this.ffxivData.sightseeing)
        },
        methods: {
            appendFilters(filterType: string, arrayIndex: string) {
                let filt = this.filters[filterType]

                //Set All Filters to false
                for (const n in filt) {filt[n][1] = false}
                
                //Switch Values
                filt[arrayIndex][1] = true
            },
            sortNodesIntoGroup(array: any) {
                
            }
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable {grid-template-columns: 80px 80px 400px auto 200px 200px;}
</style>