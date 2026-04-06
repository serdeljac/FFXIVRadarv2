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
                <li>Time</li>
                <li>Weather</li>
                <li>Emote</li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`]" v-for="d in compiledDataForTable" :key="d.ID" :data-activeNodeAnimation="checkActiveState(d.time, d.weather1, d.weather2)">
                <!-- TRACKING -->
                <li class="rdrTable_col-tracking">
                    <img :src="`../../assets/icons/${d.tracked ? 'remove' : 'add'}.webp`" @click="$emit('changeTracked', d)"/>
                </li>

                <!-- NO -->
                <li>
                    <p>{{ d.no }}</p>
                </li>

                <!-- NAME -->
                <li class="rdrTable_col-name" @click="copyToClipboard(d.name)">
                    {{ d.name }}
                </li>

                <!-- AREA -->
                <li>
                    <displayAreaText class="areaname" :areaObj="d" :excludeBackground="true" @click="$emit('sendToDetails', d)"/>
                </li>

                <!-- TIMER -->
                <li>
                    <displayTimer :timerID="d.time" :timerList="timerList"/>
                </li>

                <!-- WEATHER -->
                <li>
                    {{ d.weather1 }} {{ d.weather2  }}
                </li>

                <!-- EMOTE -->
                <li>
                    {{ d.emote }}
                </li>
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
                allVistaNodes: {} as any,
                showDetails: '' as string,
                showOnlyActive: false as boolean,
                filters: {} as any
            }
        },
        created() {
            this.createFilterList()
            this.compileData()
            this.appendData()
        },
        methods: {
            createFilterList() {
                //Create Filter Group
                let vistaList = this.ffxivData.sightseeing
                this.filters['Expansion'] = {}
                //Search for all Expansion names
                const expansionList = vistaList.filter((obj: any, index: any) => 
                    index === vistaList.findIndex((o: any) => obj.expansion === o.expansion)
                );
                //Append and set default filter list
                for (const d in expansionList) {
                    this.filters['Expansion'][expansionList[d].expansion] = ['expansion', false]
                }
                this.filters['Expansion'][expansionList[0].expansion][1] = true
            },
            compileData() {
                let vistaList = this.ffxivData.sightseeing
                const expansionList = vistaList.filter((obj: any, index: any) => 
                    index === vistaList.findIndex((o: any) => obj.expansion === o.expansion)
                );

                for (const d in expansionList) {
                    this.allVistaNodes[expansionList[d].expansion] = vistaList.filter((o: any) => o.expansion == expansionList[d].expansion)
                }
            },
            appendData() {
                for (const d in this.filters['Expansion']) {
                    if (this.filters['Expansion'][d][1]) {
                        this.compiledDataForTable = this.allVistaNodes[d]
                    }
                }
            },
            appendFilters(filterType: string, arrayIndex: string) {
                this.compiledDataForTable = this.allVistaNodes[arrayIndex]
                for (const d in this.filters['Expansion']) {this.filters['Expansion'][d][1] = false}
                this.filters['Expansion'][arrayIndex][1] = !this.filters['Expansion'][arrayIndex][1]
            },
            async copyToClipboard(text: string) {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (err) {console.error('cannot copy: ', err)}
            },
            checkActiveState(timerID: string, weather1: string, weather2: string) {
                return this.timerList.find((o: any) => o.ID === timerID).stateActive ? true : null;
            },
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable {grid-template-columns: 80px 80px 400px auto  100px 200px 200px;}
</style>