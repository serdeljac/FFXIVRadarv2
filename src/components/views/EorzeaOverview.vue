<template>
    <div class="Eorzea Overview">
        <promotionBanner length="wide"/>

        <div class="body_content">

            <div class="mapDisplay">
                <mapDisplay :ffxivData="ffxivData" :focusNode="focusNode" :singleOnly="false" v-if="focusNode"/>
            </div>

            <div class="mapContext">
                <div class="filterbar isZoneSelect">
                    <h2>{{ currentZone.zone }}</h2>
                    <h3>{{ currentZone.expansion }}</h3>
                    <div class="group">
                        <buttonFilter :noicon="true" :name="`Change Zone`" @click="enableZoneMenu = true"/>
                        <iconAndText :class="[`searchIcon`, {'active': enableSearchMenu}]" :icon="'sq_search'" @click="enableSearchMenu = !enableSearchMenu"/>
                    </div>
                </div>

                <div class="filterbar isTabBar" v-if="!enableSearchMenu">
                    <div v-for="(d, index) in zoneNodes" :key="d[1]"
                        :class="[
                            `filterbar-tab`, 
                            {'disabled': d.length == 0},
                            {'activeTab': tabSelected == index}
                            ]" 
                            @click="d.length != 0 ? tabSelected = index.toString() : false; focusNode = zoneNodes[index.toString()][0]"
                        >
                        <iconAndText :icon="index" />
                    </div>
                    
                </div>

                <div class="filterbar isTabBar" v-else>
                    <seachBar :modelValue="searchName" @selected="filterByInputValue"/>
                </div>

                <div v-if="!enableSearchMenu">
                    <gatheringList 
                        v-if="tabSelected == 'miner'" 
                        :data="zoneNodes.miner" 
                        :timerList="timerList"
                        :focusNode="focusNode"
                        @changeTracked="(e: any) => $emit('changeTracked', e)"
                        @focusNode="(e: any) => focusNode = e"/>

                    <gatheringList 
                        v-if="tabSelected == 'botany'" 
                        :data="zoneNodes.botany" 
                        :timerList="timerList"
                        :focusNode="focusNode"
                        @changeTracked="(e: any) => $emit('changeTracked', e)"
                        @focusNode="(e: any) => focusNode = e"/>
                        
                    <sightseeingList 
                        v-if="tabSelected == 'sightseeing'" 
                        :data="zoneNodes.sightseeing"
                        :timerList="timerList"
                        :weatherList="weatherList"
                        :focusNode="focusNode"
                        @changeTracked="(e: any) => $emit('changeTracked', e)"
                        @focusNode="(e: any) => focusNode = e"/>

                    <fatesList 
                        v-if="tabSelected == 'fates'" 
                        :data="zoneNodes.fates"
                        :focusNode="focusNode"
                        @focusNode="(e: any) => focusNode = e"/>
                    
                    <huntsList 
                        v-if="tabSelected == 'eliteHunts'"
                        :data="zoneNodes.eliteHunts"
                        :focusNode="focusNode"
                        @focusNode="(e: any) => focusNode = e"/>

                    <aethercurrentList 
                        v-if="tabSelected == 'aethercurrents'" 
                        :data="zoneNodes.aethercurrents" 
                        :focusNode="focusNode"
                        @focusNode="(e: any) => focusNode = e"/>
                </div>

                <div v-else>
                    <ul>
                        <li v-for="d in searchResults" :key="d.ID">
                            <gatheringList 
                                v-if="d.job == 'miner'" 
                                :data="[d]" 
                                :timerList="timerList"
                                :focusNode="focusNode"
                                @changeTracked="(e: any) => $emit('changeTracked', e)"
                                @focusNode="(e: any) => focusNode = e"/>
                            
                            <gatheringList 
                                v-if="d.job == 'botany'"  
                                :data="[d]" 
                                :timerList="timerList"
                                :focusNode="focusNode"
                                @changeTracked="(e: any) => $emit('changeTracked', e)"
                                @focusNode="(e: any) => focusNode = e"/>

                            <sightseeingList 
                                v-if="d.job == 'sightseeing'" 
                                :data="[d]"
                                :timerList="timerList"
                                :weatherList="weatherList"
                                :focusNode="focusNode"
                                @changeTracked="(e: any) => $emit('changeTracked', e)"
                                @focusNode="(e: any) => focusNode = e"/>

                            <fatesList 
                                v-if="d.job == 'fates'" 
                                :data="[d]" 
                                :focusNode="focusNode"
                                @focusNode="(e: any) => focusNode = e"/>
                            
                            <huntsList 
                                v-if="d.job == 'eliteHunts'"
                                :data="[d]"
                                :focusNode="focusNode" 
                                @focusNode="(e: any) => focusNode = e"/>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <zoneSelect 
            v-if="enableZoneMenu" 
            :zoneList="zoneSelection" 
            :windowWidth="windowWidth" 
            @zoneSelected="changeZone"
            @closeMenu="(e: boolean) => enableZoneMenu = e"/>

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
import huntsList from '../ui/overviewListItem/hunts.vue';
import aethercurrentList from '../ui/overviewListItem/aethercurrents.vue'
import mapDisplay from '../layouts/MapDisplay.vue'

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
            fatesList,
            huntsList,
            aethercurrentList,
            mapDisplay
        },
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked'],
        data() {
            return {
                currentZone: [] as any, //Zone selected on map
                zoneSelection: [] as any, //List of zones for 'Change Zone' menu
                zoneNodes: {
                    miner: [] as any,
                    botany: [] as any,
                    sightseeing: [] as any,
                    fates: [] as any,
                    eliteHunts: [] as any,
                    aethercurrents: [] as any,
                } as any, //List of nodes in the current zone
                tabSelected: '' as string, //Tab that will display the nodes on the table
                focusNode: [] as any, //Node that is focused for displaymap and node table
                enableZoneMenu: false as boolean, 
                enableSearchMenu: false as boolean,
                searchName: '' as string,
                searchResults: [] as any,
            }
        },
        created() {
            //Get the first zone with overview data and set it as default
            this.currentZone = this.ffxivData.areas.find((o: any) => o.inoverview)
            this.currentZone = this.ffxivData.areas[7]

            //Create list of zones based on expantions -> regions -> zones (Run Once)
            this.createZoneSelectionArray()

            //Get all nodes within the current zone selected
            this.fetchNodesInCurrentZone()
        },
        methods: {
            createZoneSelectionArray() {
                let finalList: any = {}
                let allUsableAreas: Array<any> = []

                //Filter only applicable zone data and get unique list of expansions
                allUsableAreas = this.ffxivData.areas.filter((o: any) => o.inoverview)
                let getListOfAllExpansions = allUsableAreas.filter((obj: any, index: any) => 
                    index === allUsableAreas.findIndex((o: any) => obj.expansion === o.expansion)
                );

                //Fetch the regions for each expansion and push the zones into the final list that will be used for the zone selection menu
                for (const d in getListOfAllExpansions) {
                    let expName = getListOfAllExpansions[d].expansion
                    finalList[expName] = {}

                    let fetchRegions = allUsableAreas.filter(o => o.expansion == expName)
                    fetchRegions = fetchRegions.filter((obj: any, index: any) => 
                        index === fetchRegions.findIndex((o: any) => obj.region === o.region)
                    );

                    //Push the list of regions into each expansion
                    for (const e in fetchRegions) {
                        let regionName = fetchRegions[e].region
                        
                        let fetchZones = allUsableAreas.filter(o => o.region == regionName && o.expansion == expName)
                        fetchZones = fetchZones.filter((obj: any, index: any) => 
                            index === fetchZones.findIndex((o: any) => obj.zone === o.zone)
                        );

                        finalList[expName][regionName] = fetchZones
                    }
                }
                this.zoneSelection = finalList
                
            },
            fetchNodesInCurrentZone() {
                //Find all nodes for the selected zones and set them in the zoneNodes object
                let zone = this.currentZone.zone
                this.zoneNodes.miner = this.ffxivData.miner.filter((o: any) => o.area.zone == zone)
                this.zoneNodes.botany = this.ffxivData.botany.filter((o: any) => o.area.zone == zone)
                this.zoneNodes.sightseeing = this.ffxivData.sightseeing.filter((o: any) => o.zone == zone)
                this.zoneNodes.fates = this.ffxivData.fates.filter((o: any) => o.zone == zone)
                this.zoneNodes.eliteHunts = this.ffxivData.eliteHunts.filter((o: any) => o.zone == zone)
                this.zoneNodes.aethercurrents = this.ffxivData.aethercurrents.filter((o: any) => o.zone == zone)

                //Find the first type of the node that has data and set
                for (const d in this.zoneNodes) {
                    if (this.zoneNodes[d].length > 0) {
                        this.tabSelected = d
                        this.focusNode = this.zoneNodes[d][0]
                        break;
                    }
                }
            },
            changeZone(e: any) {
                this.currentZone = e
                this.tabSelected = ''
                this.fetchNodesInCurrentZone()
            },
            filterByInputValue(e: any) {
                this.searchName = e;

                if (this.searchName && this.searchName.trim() !== "" && this.searchName.length > 2) {
                    const search = this.searchName.trim().toLowerCase();
                    let minerData = this.ffxivData.miner.filter((o: any) => o.name && o.name.toLowerCase().includes(search));
                    let botanyData = this.ffxivData.botany.filter((o: any) => o.name && o.name.toLowerCase().includes(search));
                    let minerAetherialData = this.ffxivData.miner.filter((o: any) => o.usage == 'aetherial');
                    minerAetherialData = findAetherialMatches(minerAetherialData);
                    let botanyAetherialData = this.ffxivData.botany.filter((o: any) => o.usage == 'aetherial');
                    botanyAetherialData = findAetherialMatches(botanyAetherialData);
                    let sightseeingData = this.ffxivData.sightseeing.filter((o: any) => o.name && o.name.toLowerCase().includes(search));
                    let huntsData = this.ffxivData.eliteHunts.filter((o: any) => o.name && o.name.toLowerCase().includes(search));
                    let fatesData = this.ffxivData.fates.filter((o: any) => 
                        o.name && o.name.toLowerCase().includes(search) ||
                        o.bossname && o.bossname.toLowerCase().includes(search)
                    );

                    function findAetherialMatches(arr: any) {
                        let foundAetherial = []
                        for (const d in arr) {
                            let usageGroup = arr[d].usage_info
                            if (usageGroup.result1.toLowerCase().includes(search)) {
                                foundAetherial.push(arr[d])
                            }
                            if (usageGroup.result2.toLowerCase().includes(search)) {
                                foundAetherial.push(arr[d])
                            }
                            if (usageGroup.result3.toLowerCase().includes(search)) {
                                foundAetherial.push(arr[d])
                            }
                        }
                        return foundAetherial
                    }

                    this.searchResults = [
                        ...minerData, 
                        ...botanyData, 
                        ...minerAetherialData, 
                        ...botanyAetherialData,
                        ...sightseeingData,
                        ...huntsData,
                        ...fatesData
                    ]

                } else {
                    this.searchResults = []
                }
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

.searchIcon {
    transform: scale(1);
    transition: transform 0.04s linear;
    &.active{
        transform: scale(1.3);
        transform-origin: center;
    }
}
</style>