<template>
    <div class="sightseeVistas">
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

        <div class="body_content">

            <ul class="rdrTable header">
                <li>
                    <p v-if="responsive.tracking">Tracker</p>
                    <p v-if="responsive.no">No</p>
                    <p v-if="responsive.name">Name</p>
                    <p v-if="responsive.area">Area</p>
                    <p v-if="responsive.timer">Time</p>
                    <p v-if="responsive.weather">Weather</p>
                    <p v-if="responsive.emote">Emote</p>
                </li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`, windowWidth]">
                <li v-for="d in compiledDataForTable" :key="d.ID" 
                    :data-activeTableRowAnimation="timerState[d.ID] && weatherState[d.ID] ? true : null">

                    <div v-if="responsive.tracking" class="rdrTable_col-tracking" >
                        <img :src="`../../assets/icons/${d.tracked ? 'remove' : 'add'}.webp`" @click="$emit('changeTracked', d)"/>
                    </div>

                    <!-- NO -->
                    <p v-if="responsive.no" class="rdrTable_col-no">{{ d.no }}</p>

                    <!-- NAME -->
                    <p v-if="responsive.name" class="rdrTable_col-name" @click="copyToClipboard(d.name)">{{ d.name }}</p>

                    <!-- AREA -->
                    <displayAreaText v-if="responsive.area" :areaObj="d" :excludeBackground="true" @click="$emit('sendToDetails', d)"/>

                    <!-- TIMER -->
                    <displayTimer v-if="responsive.timer" :type="'timer'" :node="d" :timerList="timerList" @timerState="(e: boolean) => timerState[d.ID] = e"/>

                    <!-- WEATHER -->
                    <displayTimer v-if="responsive.weather" :type="'weather'" :node="d" @weatherState="(e: boolean) => weatherState[d.ID] = e"/>

                    <!-- EMOTE -->
                    <iconAndText v-if="responsive.emote" :icon="d.emote" :text="d.emote"/>

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
import iconAndText from '../ui/iconAndText.vue';

    export default {
        name: "Sightseeing Vistas",
        components: {promotionBanner, displayTimer, displayAreaText, buttonFilter, seachBar, iconAndText},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
        data() {
            return {
                compiledDataForTable: [] as any,
                allVistaNodes: {} as any,
                showDetails: '' as string,
                showOnlyActive: false as boolean,
                filters: {} as any,
                timerState: {} as any,
                weatherState: {} as any,
                responsive: {
                    "tracking": true,
                    "no": true,
                    "name": true,
                    "area": true,
                    "timer": true,
                    "weather": true,
                    "emote": true
                }
            }
        },

        created() {
            this.createFilterList()
            this.compileData()
            this.appendData()
        },
        updated() {
            // let size = this.windowWidth

            // if (size == 'desktop-large' || size == 'desktop-small') {
            //     this.responsive.no = true
            //     this.responsive.emote = true
            // }
            

            // if (size == 'tablet') {
            //     this.responsive.no = false
            //     this.responsive.emote = false
            // }

            // if (size == 'mobile') {
            //     this.responsive.no = false
            //     this.responsive.emote = false
            // }
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
                this.timerState = {}
                this.weatherState = {}
                this.compiledDataForTable = this.allVistaNodes[arrayIndex]
                for (const d in this.filters['Expansion']) {this.filters['Expansion'][d][1] = false}
                this.filters['Expansion'][arrayIndex][1] = !this.filters['Expansion'][arrayIndex][1]
            },
            async copyToClipboard(text: string) {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (err) {console.error('cannot copy: ', err)}
            },
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable li {grid-template-columns: 80px 80px minmax(auto, 400px) auto 100px 200px 200px;}
</style>