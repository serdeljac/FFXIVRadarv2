<template>
    <div class="Eorzea Overview">
        <promotionBanner length="wide"/>

        <div class="body_content">
            <div class="mapDisplay">
                PLACE MAP HERE
            </div>
            <div class="mapContext">
                <div class="filterbar isZoneSelect">
                    <h2>{{ filterAreaSelected.zone }}</h2>
                    <h3>{{ filterAreaSelected.expansion }}</h3>
                    <div class="group">
                        <buttonFilter 
                        :name="`Change Zone`" 
                        @click="openChangeZoneMenu()"/>
                        <iconAndText class="searchIcon" :icon="'sq_search'" @click="openSearchMenu()"/>
                    </div>
                </div>

                <div class="filterbar isTabBar">
                    <div :class="[`filterbar-tab`, {'disabled': d[3].length == 0}]" 
                        v-for="(d, index) in filtersByType" :key="d[1]" >
                        <iconAndText :icon="d[1]" @click="changeFilter(Number(index))"/>
                    </div>
                </div>
                {{ ffxivData.areas[0] }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';
import iconAndText from '../ui/iconAndText.vue';

    export default {
        name: "Eorzea Overview",
        components: {promotionBanner, displayAreaText, buttonFilter, seachBar, iconAndText},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        data() {
            return {
                filtersByZone: [] as any, 
                filtersByType: [
                    ['type', 'all', true, 1], //[Group, Name, State, Data]
                    ['type', 'miner', false, []],
                    ['type', 'botany', false, []],
                    ['type', 'sightseeing', false, []],
                    ['type', 'fates', false, []],
                    ['type', 'hunts', false, []],
                    ['type', 'current', false, []],
                ] as any,
                filterAreaSelected: {} as any,
                filterTypeSelected: '' as string,
                changeZoneMenu: false as boolean,
                searchMenu: false as boolean,
            }
        },
        created() {
            this.createFilterListForZone() //Run Once
            this.filterAreaSelected = this.filtersByZone['A Realm Reborn']['La Noscea'][0]
            this.createFilterListForType() //Run Once
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
                // for (const d in this.filtersByType) {
                //     let f[d] = this.filtersByType
                //     let data = this.ffxivData
                //     f[d][3] = data.miner.filter((o: any) => o.job == 'miner')
                // }
                // this.filtersByType
            },
            openChangeZoneMenu() {
                console.log('open: openChangeZoneMenu')
                this.changeZoneMenu = true
            },
            openSearchMenu() {
                console.log('open: openSearchMenu')
                this.searchMenu = true
            },
            changeFilter(index: number) {
                console.log('open: changeFilter')
            }
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
}


</style>