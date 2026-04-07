<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">

            <div class="filterbar_group group1">
                <p>Class: </p>
                <buttonFilter 
                    v-for="(value, index) in filters['Class']" :key="index" 
                    :name="`${index}`" 
                    :state="filters['Class'][index][1]"
                    @click="appendFilters('Class', index)"/>
            </div>

            <div class="filterbar_group group2">
                <p>Usage: </p>
                <buttonFilter 
                    v-for="(value, index) in filters['Usage']" :key="index" 
                    :name="index == 'orange' || index == 'purple' ? `${index} Scripts` : `${index}`" 
                    :state="filters['Usage'][index][1]"
                    @click="appendFilters('Usage', index)"/>
            </div>

            <div class="filterbar_group group3">
                <p>Expansion: </p>
                <buttonFilter 
                    v-for="(value, index) in filters['Expansion']" :key="index" 
                    :name="`${index}`" 
                    :state="filters['Expansion'][index][1]"
                    @click="appendFilters('Expansion', index)"/>
            </div>

            <div class="filterbar_group group4">
                <p>Search: </p>
                <seachBar :modelValue="searchName" @selected="filterByInputValue"/>
                <buttonFilter 
                    :name="'Reset'" 
                    :state="true"
                    @click="resetFilters()"/>
                <buttonFilter 
                    :name="'Active Only'" 
                    :state="showOnlyActive"
                    @click="showOnlyActive = !showOnlyActive"/>
            </div>
        </div>

        <div class="main_content">
            <div class="pagenation" v-if="totalArraySets > 1">
                <div v-for="(d, index) in compiledDataForTable" :key="d.ID" 
                    @click="arraySet = Number(index)"
                    :class="{'pageActive': arraySet == Number(index)}">
                    {{ Number(index) + 1 }}
                </div>
            </div>

            <ul class="rdrTable header">
                <li>Tracker</li>
                <li>Name</li>
                <li>Attributes</li>
                <li>Area</li>
                <li>Level</li>
                <li>Timer</li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`, {'activeOnly': !checkActiveState(d.time) && showOnlyActive}]" v-for="d in compiledDataForTable[arraySet]" :key="d.ID" :data-activeNodeAnimation="checkActiveState(d.time)">
                
                <!-- TRACKING -->
                <li class="rdrTable_col-tracking">
                    <img :src="`../../assets/icons/${d.tracked ? 'remove' : 'add'}.webp`" @click="$emit('changeTracked', d)"/>
                </li>
                
                <!-- NAME -->
                <li class="rdrTable_col-name" @click="copyToClipboard(d.name)">
                    <p>{{d.name}}</p>
                    <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                </li>

                <!-- ATTRIBUTES -->
                <li class="rdrTable_col-attributes">
                    <!-- JOB NAME -->
                    <span class="hasContext" :data-context="`${d.job_sub.charAt(0).toUpperCase() + d.job_sub.slice(1)}`">
                        <img :src="`../../assets/icons/${d.job_sub}.webp`"  />
                    </span>
                    
                    <!-- USAGE -->
                    <span class="hasContext" v-if="d.usage" :data-context="fetchUsageAttrName(d.usage, d.usage_info)">
                        <img :src="`../../assets/icons/${fetchUsageImgName(d.usage, d.usage_info)}.webp`" />
                    </span>

                    <!-- FOLKLORE -->
                    <span class="hasContext" :data-context="`Requires ${d.tomb}`" v-if="d.node_name == 'Legendary'">
                        <img :src="`../../assets/icons/folklore.webp`"/>
                    </span>
                </li>

                <!-- AREA -->
                <li>
                    <displayAreaText class="areaname" :areaObj="d" :excludeBackground="true" @click="$emit('sendToDetails', d)"/>
                </li>

                <!-- LEVEL -->
                <li>
                    {{`Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}`}}
                </li>

                <!-- TIMER -->
                <li>
                    <displayTimer :type="'timer'" :node="d" :timerList="timerList"/>
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

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayTimer from '../ui/displayTimer.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';

    export default {
        name: "Timed Mining/Botany",
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
                showOnlyActive: false as boolean,
                filters: {
                    "Class": {
                        "miner": ['job', true],
                        "botany": ['job', true],
                    },
                    "Usage": {
                        "crafting": ['usage', true],
                        "purple": ['usage_info', true],
                        "orange": ['usage_info', true],
                        "aetherial": ['usage', true],
                    },
                    "Expansion": {
                        "A Realm Reborn": ['expansion', true],
                        "Heavensward": ['expansion', true],
                        "Stormblood": ['expansion', true],
                        "Shadowbringers": ['expansion', true],
                        "Endwalker": ['expansion', true],
                        "Dawntrail": ['expansion', true]
                    },
                }
            }
        },
        created() {
            let r = this.ffxivData.miner.filter((o: any) => o.time)
            let b = this.ffxivData.botany.filter((o: any) => o.time)
            this.allTimedNodes = [...r, ...b]
            this.sortNodesIntoGroup(this.allTimedNodes)
        },
        methods: {
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
            appendFilters(filterType: string, arrayIndex: string) {

                let hold = this.allTimedNodes
                let filt = this.filters
                
                //Switch Values
                filt[filterType][arrayIndex][1] = !filt[filterType][arrayIndex][1]

                for (const d in this.filters) {
                    for (const n in this.filters[d]) {
                        if (!filt[d][n][1]) {
                            hold = hold.filter((o: any) => o[filt[d][n][0]] != n)
                        }
                    }
                }
                this.sortNodesIntoGroup(hold)
                this.arraySet = 0
            },
            resetFilters() {
                for (const d in this.filters) {
                    for (const n in this.filters[d]) {
                        this.filters[d][n][1] = true
                    }
                }
                this.sortNodesIntoGroup(this.allTimedNodes)
            },
            checkActiveState(timerID: string) {
                return this.timerList.find((o: any) => o.ID === timerID).stateActive ? true : null;
            },
            fetchUsageImgName(usage: any, info: any) {
                console.log(usage)
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
                this.resetFilters()
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
                        }
                    }
                    let hold = [...new Set([...foundName, ...foundAetherial])];
                    this.sortNodesIntoGroup(hold)
                }
            },
            async copyToClipboard(text: string) {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (err) {console.error('cannot copy: ', err)}
            }
        }
    }
</script>

<style scoped lang="scss">
    .main_content ul {margin-bottom: 6px;}

    .filterbar {
        width: 100%;

        &_group {
            border-radius: $borderRadius;
            margin: 4px 0 0 ;
            padding: 0px 6px;
            align-items: center;
            margin-right: 2rem;
            &.group1, &.group2 {display: inline-flex;}
            &.group3, &.group4 {display: flex;}
        }
    }

    .rdrTable {grid-template-columns: 80px 400px 100px auto 100px 120px;}
    .activeOnly {display: none;}
    .rdrTable_col-name p {
        cursor: pointer;
        &:hover {text-decoration: underline;}
    }
    .rdrTable_col-attributes {
        img {margin-right: 4px;}
    }
    .details {
        padding-left: 4rem;
        grid-column: 1 / span all;
        ul {
            width: 100%;
            display: flex;
            li {margin-right: 20px;}
        }
    }

    .pagenation {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80%;
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
            margin: 0 1rem;
            cursor: pointer;
            &.pageActive {background-color: $borderColor;}
            &:hover {background-color: $borderColorFade;}
        }
    }
</style>