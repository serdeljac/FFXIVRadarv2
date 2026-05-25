<template>
    <div :class="[`timedNodes`, windowWidth]">

        <div class="filterbar">
            <div v-for="d in groupFilter()" :key="d[1]" :class="[`filterbar_group`]">
                <buttonFilter 
                    v-for="e in d" :key="e[1]"
                    :name="e[1]" 
                    :disabled="!e[2]"
                    @click="changeFilter(e)"/>
            </div>

            <div :class="[`filterbar_group`]">
                <seachBar :modelValue="searchName" @selected="filterByInputValue"/>
                <buttonFilter 
                    :name="'Reset'" 
                    :state="true"
                    :noicon="true"
                    @click="resetFilters()"/>
            </div>
        </div>

        <div class="body_content">

            <div class="pagenation" v-if="totalArraySets > 1">
                <div v-for="(d, index) in compiledDataForTable" :key="d.ID" 
                    @click="arraySet = Number(index)"
                    :class="{'pageActive': arraySet == Number(index)}">
                    {{ Number(index) + 1 }}
                </div>
            </div>

            <ul class="rdrTable header">
                <li>
                    <p class="rdrTable_col-tracking">Tracker</p>
                    <p class="rdrTable_col-name">Name</p>
                    <p class="rdrTable_col-attributes">Attributes</p>
                    <p class="rdrTable_col-level">Level</p>
                    <p class="rdrTable_col-time">Timer</p>
                    <p class="rdrTable_col-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`]">
                <li v-for="d in compiledDataForTable[arraySet]" :key="d.ID"  
                    :data-rowAndTimeActive="checkRowActive(d)">

                    <!-- TRACKER -->
                    <div class="rdrTable_col-tracking">
                        <img :class="[`iconSize trackingIcon`, {'remove': d.tracked}]" :src="getIconImageURL('alarm')" @click="$emit('changeTracked', d)"/>
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_col-name" @click="$emit('sendToDetails', d)">
                        <div>
                            <img v-if="windowWidth == 'mobile'" :class="[`iconSize trackingIcon`, {'remove': d.tracked}]" :src="getIconImageURL('alarm')" @click="$emit('changeTracked', d)"/>
                            <p>{{ d.name }}</p>
                            <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                            <img class="iconSize2" v-if="d.usage == 'aetherial'" :src="getIconImageURL('collectability')" />
                            <img class="iconSize2" v-if="d.usage == 'customdelivery'" :src="getIconImageURL('customdelivery')" />
                        </div>
                    </div>

                    <!-- ATTRIBUTES -->
                    <div class="rdrTable_col-attributes">
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
                    <div class="rdrTable_col-level">
                        {{`Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}`}}
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_col-time">
                        <p class="timeDisplay">{{ fetchTimerCountdown(d.time) }}</p>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_col-area">
                        <displayAreaText class="areaname" :areaObj="d" :excludeBackground="true" @click="$emit('sendToDetails', d)"/>
                    </div>
                </li>
            </ul>

            <div v-if="displayNoNodesFound">
                <p class="noResults">No nodes found with the current filter selection.</p>
            </div>

            <div class="pagenation" v-if="totalArraySets > 1">
                <div v-for="(d, index) in compiledDataForTable" :key="d.ID" 
                    @click="arraySet = Number(index)"
                    :class="{'pageActive': arraySet == Number(index)}">
                    {{ Number(index) + 1 }}
                </div>
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
    import displayAreaText from '../ui/displayAreaText.vue';
    import buttonFilter from '../ui/ButtonFilter.vue';
    import seachBar from '../ui/searchBar.vue';

    export default {
        name: "Timed Mining/Botany",
        components: {displayAreaText, buttonFilter, seachBar},
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked', 'sendToDetails'],
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
                const jobList = this.allTimedNodes.filter((obj: any, index: any) => 
                    index === this.allTimedNodes.findIndex((o: any) => obj.job === o.job)
                );

                //Search for all Job names within AllTimedNodes
                const usageList = this.allTimedNodes.filter((obj: any, index: any) => 
                    index === this.allTimedNodes.findIndex((o: any) => obj.usage === o.usage)
                );

                //Search for all Expansion names within AllTimedNodes
                const expansionList = this.ffxivData.expansion.filter((obj: any, index: any) => 
                    index === this.ffxivData.expansion.findIndex((o: any) => obj.expansion === o.expansion)
                );

                //Append and set default filter list
                for (const d in jobList) {
                    this.filters.push(['job', jobList[d].job, true])
                }

                for (const d in usageList) {
                    this.filters.push(['usage', usageList[d].usage, true])
                }
                for (const d in expansionList) {
                    this.filters.push(['expansion', expansionList[d].expansion, true])
                }

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
            fetchTimerCountdown(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return '--:--'
            },
            checkTimeActive(type: string, arr: any) {
                if (type == 'time' && arr.time) {
                    let results = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    results = results ? true : null
                    return results
                }
                return null
            },
            checkRowActive(arr: any) {
                let currentTime = arr.time ? this.timerList.find((o: any) => o.ID == arr.time).stateActive : null
                if (currentTime) {return true}
                return null
            }
        }
    }
</script>

<style scoped lang="scss">
    .timedNodes.tablet {
        .rdrTable li {grid-template-columns: 80px 250px 120px auto;}
        .rdrTable_col-attributes, .rdrTable_col-level {display: none}
    }

    .timedNodes.mobile {
        .rdrTable li {
            grid-template-columns: auto;
            justify-content: center;
        }
        .rdrTable_col-tracking, .rdrTable_col-attributes, .rdrTable_col-level, .rdrTable_col-time {display: none}
        .rdrTable.header {display: none;}
        .rdrTable.body li {
            .rdrTable_col-name > div {
                display: flex;
                width: 400px;
                align-items: center;
                justify-content: center;
                margin: auto;
                
            }
            .rdrTable_col-area {grid-column: 1 / span 2}
            & > div {margin: 4px auto;}
        }
    }


    .rdrTable li {grid-template-columns: 80px 400px 100px 100px 120px auto;}

    .pagenation {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        width: 90%;
        margin: 2rem auto;

        div {
            width: 32px;
            user-select: none;
            aspect-ratio: 1/1;
            border-radius: 4px;
            background-color: $bodyBackgroundColor;
            border: 1px solid $borderColor;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            margin: 0.5rem 1rem;
            cursor: pointer;
            &.pageActive {background-color: $borderColor;}
            &:hover {background-color: $borderColorHover;}
        }
    }
</style>