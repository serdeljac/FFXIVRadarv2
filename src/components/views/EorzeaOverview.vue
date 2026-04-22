<template>
    <div class="Eorzea Overview">
        <promotionBanner length="wide"/>

        <div class="body_content">

            <div class="mapDisplay">
                {{ focusNode.length == 0 ? filterAreaSelected: focusNode }}
            </div>

            <div class="mapContext">
                <div class="filterbar isZoneSelect">
                    <h2>{{ filterAreaSelected.zone }}</h2>
                    <h3>{{ filterAreaSelected.expansion }}</h3>
                    <div class="group">
                        <buttonFilter :name="`Change Zone`" @click="changeZoneMenu = true"/>
                        <iconAndText class="searchIcon" :icon="'sq_search'" @click="openSearchMenu()"/>
                    </div>
                </div>

                <div class="filterbar isTabBar">
                    <div 
                        :class="[
                            `filterbar-tab`, 
                            {'disabled': d[3].length == 0},
                            {'activeTab': filterTypeSelected == d[1]}
                            ]" 
                        v-for="d in filtersByType" :key="d[1]"
                        @click="d[3].length != 0 ? filterTypeSelected = d[1] : false;">
                        <iconAndText :icon="d[1]" />
                    </div>
                </div>

                <gatheringList 
                    v-if="filterTypeSelected == filtersByType[0][1]" 
                    :data="filtersByType[0][3]" 
                    :timerList="timerList"
                    @changeTracked="(e: any) => $emit('changeTracked', e)"
                    @focusNode="(e: any) => focusNode = e[0]"/>

                <gatheringList 
                    v-if="filterTypeSelected == filtersByType[1][1]" 
                    :data="filtersByType[1][3]" 
                    :timerList="timerList"
                    @changeTracked="(e: any) => $emit('changeTracked', e)"
                    @focusNode="(e: any) => focusNode = e[0]"/>
                    
                <sightseeingList 
                    v-if="filterTypeSelected == filtersByType[2][1]" 
                    :data="filtersByType[2][3]" 
                    :timerList="timerList"
                    @changeTracked="(e: any) => $emit('changeTracked', e)"
                    @focusNode="(e: any) => focusNode = e"/>

                <fatesList 
                    v-if="filterTypeSelected == filtersByType[3][1]" 
                    :data="filtersByType[3][3]" 
                    @focusNode="(e: any) => focusNode = e"/>

            </div>
        </div>
        <zoneSelect 
            v-if="changeZoneMenu" 
            :zoneList="filtersByZone" 
            :windowWidth="windowWidth" 
            @zoneSelected="newZoneSelected"
            @closeMenu="(e: any) => changeZoneMenu = e"/>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';
import iconAndText from '../ui/iconAndText.vue';
import zoneSelect from '../layouts/zoneSelection.vue';
import gatheringList from '../ui/overviewListItem/gathering.vue';
import sightseeingList from '../ui/overviewListItem/sightseeing.vue';
import fatesList from '../ui/overviewListItem/fates.vue';

    export default {
        name: "Eorzea Overview",
        components: {
            promotionBanner, 
            buttonFilter, 
            seachBar, 
            iconAndText, 
            zoneSelect, 
            gatheringList, 
            sightseeingList, 
            fatesList},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked'],
        data() {
            return {
                filtersByZone: [] as any, 
                filtersByType: [
                    ['type', 'miner', false, []],
                    ['type', 'botany', false, []],
                    ['type', 'sightseeing', false, []],
                    ['type', 'fates', false, []],
                    ['type', 'eliteHunts', false, []],
                    ['type', 'aethercurrents', false, []],
                ] as any,
                filterAreaSelected: {} as any,
                filterTypeSelected: '' as string,
                changeZoneMenu: false as boolean,
                searchMenu: false as boolean,
                focusNode: [] as Array<object>,
            }
        },
        computed: {
            appendTabSelectedArray() {
                let tabSelected = this.filterTypeSelected
                for (const d in this.filtersByType) {
                    let tabName = this.filtersByType[d][1]
                    if (tabSelected == tabName) {return this.filtersByType[d][3]}
                }
            },
        },
        created() {
            this.createFilterListForZone() //Run Once

            let regions = this.filtersByZone[Object.keys(this.filtersByZone)[0]]
            let zone = regions[Object.keys(regions)[0]]
            this.filterAreaSelected = zone[3]

            this.createFilterListForType()
            this.selectTabWithData()
        },
        methods: {
            createFilterListForZone() {
                let finalList: any = {}
                let allUsableAreas: Array<any> = []
                allUsableAreas = this.ffxivData.areas.filter((o: any) => o.inOverview)

                for (const d in this.ffxivData.expansionData) {
                    let expName = this.ffxivData.expansionData[d].expansion

                    let fetchRegions = allUsableAreas.filter(o => o.expansion == expName)
                    fetchRegions = fetchRegions.filter((obj: any, index: any) => 
                        index === fetchRegions.findIndex((o: any) => obj.region === o.region)
                    );

                    finalList[expName] = {}

                    for (const e in fetchRegions) {
                        let regionName = fetchRegions[e].region

                        let fetchZones = allUsableAreas.filter(o => o.region == regionName)
                        fetchZones = fetchZones.filter((obj: any, index: any) => 
                            index === fetchZones.findIndex((o: any) => obj.zone === o.zone)
                        );

                        finalList[expName][regionName] = fetchZones
                    }
                }
                this.filtersByZone = finalList
            },
            createFilterListForType() {
                for (const d in this.filtersByType) {
                    let searchtype = this.filtersByType[d][1]
                    let results: any = []
                    if (searchtype == 'miner' || searchtype == 'botany') {
                        results = this.ffxivData[searchtype].filter((o: any) => o.area.zone == this.filterAreaSelected.zone)
                    } else {
                        results = this.ffxivData[searchtype].filter((o: any) => o.zone == this.filterAreaSelected.zone)
                    }
                    
                    this.filtersByType[d][3] = results
                }
            },
            newZoneSelected(e: any) {
                this.changeZoneMenu = false;
                this.filterAreaSelected = e;
                this.createFilterListForType()
                this.selectTabWithData()
            },
            selectTabWithData() {
                //Select the first tab that contains data
                for (const d in this.filtersByType) {
                    if (this.filtersByType[d][3].length != 0) {
                        this.filterTypeSelected = this.filtersByType[d][1]
                        break;
                    }
                }
            },
            openSearchMenu() {
                console.log('open: openSearchMenu')
                this.searchMenu = true
            },
        }
    }
</script>

<style scoped lang="scss">
.body_content {
    display: flex;
    gap: 20px;

    .mapDisplay {
        max-width: 800px;
        width: 100%;
    }

    .mapContext {
        width: 90%;
    }

}
</style>