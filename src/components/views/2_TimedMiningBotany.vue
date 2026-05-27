<template>
    <div :class="[`timedNodes body_content`, windowWidth]">

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <div v-for="d in groupFilter()" :key="d[1]" :class="[`filterbar_group`]">
                    <toggleFilterBtn 
                        v-for="e in d" :key="e[1]"
                        :name="e[1]"
                        :icon="e[1]"
                        :enabled="e[2] ? true : null"
                        @click="changeFilter(e)"/>
                </div>

                <div :class="[`filterbar_group`]">
                    <inputSearchBar :modelValue="searchName" @selected="filterByInputValue"/>
                    <toggleFilterBtn 
                        :name="'Reset'"
                        :enabled="true"
                        @click="resetFilters()"/>
                </div>
            </div>
        </div>

        <!-- Pagenation -->
        <ul class="body_content-group pagenation">
            <li class="pagenation_item" v-for="(d, index) in compiledDataForTable" :key="d.ID" 
                @click="arraySet = Number(index)"
                :class="{'pageActive': arraySet == Number(index)}">
                {{ Number(index) + 1 }}
            </li>
        </ul>

        <!-- Table -->
        <div :class="[`body_content-group rdrTable`, windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-name">Name</p>
                    <p class="rdrTable_row-attributes">Attributes</p>
                    <p class="rdrTable_row-level">Level</p>
                    <p class="rdrTable_row-time">Timer</p>
                    <p class="rdrTable_row-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split"/>

            <ul class="rdrTable_body">
                <li v-for="d in compiledDataForTable[arraySet]" :key="d.ID" 
                    :data-rowAndTimeActive="activeList[d.ID]"
                    class="rdrTable_row">

                    <!-- TRACKER -->
                    <div class="rdrTable_row-tracking" >
                        <toggleTrackingBtn 
                            :trackingEnabled="d.tracked" 
                            class="hasContext"
                            :data-context="`Track Node`"
                            @click="$emit('changeTracked', d)"/>
                        <toggleDetailsBtn 
                            v-if="windowWidth != 'mobile'" 
                            @click="$emit('openDetails', d)"
                            class="hasContext"
                            :data-context="`View Details`"/>
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_row-name" >
                        <div>
                            <p>{{ d.name }}</p>
                            <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                            <img class="iconSize2" v-if="d.usage == 'aetherial'" :src="getIconImageURL('collectability')" />
                            <img class="iconSize2" v-if="d.usage == 'customdelivery'" :src="getIconImageURL('customdelivery')" />
                        </div>
                    </div>

                    <!-- ATTRIBUTES -->
                    <div class="rdrTable_row-attributes">
                        <div>
                            <!-- JOB NAME -->
                            <span class="hasContext" :data-context="`${d.job_sub.charAt(0).toUpperCase() + d.job_sub.slice(1)}`">
                                <img class="iconSize" :src="getIconImageURL(d.job_sub)"  />
                            </span>
                            
                            <!-- USAGE -->
                            <span class="hasContext" v-if="d.usage" :data-context="fetchUsageAttrName(d.usage, d.usage_info)">
                                <img class="iconSize" :src="getIconImageURL(fetchUsageImgName(d.usage, d.usage_info))" />
                            </span>

                            <!-- FOLKLORE -->
                            <span class="hasContext" :data-context="`Requires ${d.tomb}`" v-if="d.node_name == 'Legendary'">
                                <img class="iconSize" :src="getIconImageURL('folklore')" />
                            </span>
                        </div>
                    </div>

                    <!-- LEVEL -->
                    <div class="rdrTable_row-level">
                        {{`Lv. ${d.level} ${'★'.repeat(d.stars)}`}}
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_row-time">
                        <timeDisplay :timerList="timerList" :timeId="d.time" @timeActive="(e: any) => sendTimerState(e, d.ID)"/>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d"/>
                    </div>
                </li>
            </ul>

            <div v-if="displayNoNodesFound">
                <p class="noResults">No nodes found with the current filter selection.</p>
            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import inputSearchBar from '../ui/buttons/inputSearchBar.vue';
    import timeDisplay from '../ui/displayTime.vue'
    import areaDisplay from '../ui/displayArea.vue'

    export default {
        name: "Timed Mining/Botany",
        components: {toggleFilterBtn, toggleTrackingBtn, toggleDetailsBtn, inputSearchBar, timeDisplay, areaDisplay},
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked', 'openDetails'],
        data() {
            return {
                compiledDataForTable: [] as any,
                allTimedNodes: [] as any,
                totalArraySets: 0 as number,
                arraySet: 0 as number,
                displayNoNodesFound: false as boolean,
                searchName: '' as string,
                showOnlyActive: false as boolean,
                filters: [] as any, //[Group, Name, State]
                filterList: {} as any,
                activeList: {} as any
            }
        },
        created() {
            let r = this.ffxivData.miner.filter((o: any) => o.time)
            let b = this.ffxivData.botany.filter((o: any) => o.time)
            this.allTimedNodes = [...r, ...b]
            this.createFilterList() //Run Once
            this.sortNodesIntoGroup(this.allTimedNodes)
        },
        methods: {
            createFilterList() {
                //Search for all Job names within AllTimedNodes
                let jobList = this.allTimedNodes.filter((obj: any, index: any) => 
                    index === this.allTimedNodes.findIndex((o: any) => obj.job === o.job)
                );

                //Search for all Job names within AllTimedNodes
                let usageList = this.allTimedNodes.filter((obj: any, index: any) => 
                    index === this.allTimedNodes.findIndex((o: any) => obj.usage === o.usage)
                );

                //Search for all Expansion names within AllTimedNodes
                let expansionList = this.ffxivData.expansion.filter((obj: any, index: any) => 
                    index === this.ffxivData.expansion.findIndex((o: any) => obj.expansion === o.expansion)
                );

                jobList = jobList.map((o => ['job', o.job, true]))
                usageList = usageList.map((o => ['usage', o.usage, true]))
                expansionList = expansionList.map((o => ['expansion', o.expansion, true]))
                this.filters = [...jobList, ...usageList, ...expansionList]
            },
            sortNodesIntoGroup(array: any) {
                const result = [];
                let arrayLength = array.length;
                for (let i = 0; i < arrayLength; i += 50) {
                    result.push(array.slice(i, i + 50));
                }
                this.compiledDataForTable = result;
                this.displayNoNodesFound = result.length == 0 ? true : false;
                this.totalArraySets = this.compiledDataForTable.length
            },
            groupFilter() {
                let newArr = []
                let arr = this.filters
                let jobBundle = arr.filter((o: any) => o[0] == 'job')
                let usageBundle = arr.filter((o: any) => o[0] == 'usage')
                let expansionBundle = arr.filter((o: any) => o[0] == 'expansion')
                newArr = [jobBundle, usageBundle, expansionBundle]
                return newArr
            },
            changeFilter(filterArray: any) {

                let hold = this.allTimedNodes
                this.searchName = '';
                for (const d in this.filters) {
                    if (this.filters[d][1] == filterArray[1]) {
                        this.filters[d][2] = !this.filters[d][2]
                    }
                }
                
                //Switch Values
                for (const d in this.filters) {
                    if (!this.filters[d][2]) {
                        hold = hold.filter((o: any) => o[this.filters[d][0]] != this.filters[d][1])
                    }
                }
                this.sortNodesIntoGroup(hold)
                this.arraySet = 0
            },
            resetFilters() {
                for (const d in this.filters) {
                    this.filters[d][2] = true
                }
                this.searchName = '';
                this.sortNodesIntoGroup(this.allTimedNodes)
            },
            checkIfNewGroup(index: number) {
                if (index == 0) {return this.filters[0][0]}
                let sendGroupName = this.filters[index][0] != this.filters[index - 1][0] ? this.filters[index][0] : null
                return sendGroupName
            },
            checkActiveState(timerID: string) {
                return this.timerList.find((o: any) => o.ID === timerID).stateActive ? true : null;
            },
            fetchUsageImgName(usage: any, info: any) {
                if (usage == 'scripts') {return `${info}gatherscripts`}
                if (usage == 'crafting') {return `sq_crafting`}
                return usage
            },
            fetchUsageAttrName(usage: string, info: any) {
                if (usage == 'aetherial') {
                    let resultName1 = info.result1.charAt(0).toUpperCase() + info.result1.slice(1)
                    let resultName2 = info.result2.charAt(0).toUpperCase() + info.result2.slice(1)
                    let resultName3 = info.result3.charAt(0).toUpperCase() + info.result3.slice(1)
                    return `${resultName1}, ${resultName2}, ${resultName3}`
                }
                if (usage == 'customdelivery') {return `Deliver to ${info}`}
                if (usage == 'scripts') {return `${info.charAt(0).toUpperCase() + info.slice(1)} Gather Scripts`}
                return usage.charAt(0).toUpperCase() + usage.slice(1)
            },
            filterByInputValue(e: any) {
                this.searchName = e;
                this.arraySet = 0
                for (const d in this.filters) {
                    this.filters[d][2] = true
                }
                
                if (this.searchName && this.searchName.trim() !== "") {
                    const search = this.searchName.trim().toLowerCase();
                    let foundName = this.allTimedNodes.filter((o: any) => o.name && o.name.toLowerCase().includes(search));
                    let aetherialList = this.allTimedNodes.filter((o: any) => o.usage == 'aetherial');
                    let foundAetherial = []
                    if (aetherialList.length > 0) {
                        for (const d in aetherialList) {
                            let usageGroup = aetherialList[d].usage_info
                            if (usageGroup.result1.toLowerCase().includes(search)) {
                                foundAetherial.push(aetherialList[d])
                            }
                            if (usageGroup.result2.toLowerCase().includes(search)) {
                                foundAetherial.push(aetherialList[d])
                            }
                            if (usageGroup.result3.toLowerCase().includes(search)) {
                                foundAetherial.push(aetherialList[d])
                            }
                        }
                    }
                    let hold = [...new Set([...foundName, ...foundAetherial])];
                    this.sortNodesIntoGroup(hold)
                }
            },
            sendTimerState(timeState: any, id: string) {
                this.activeList[id] = timeState
            }
        }
    }
</script>

