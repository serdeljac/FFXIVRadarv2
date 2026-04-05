<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">

            <buttonFilter 
                v-for="(d, index) in filters" :key="index" 
                :name="index" 
                :state="filters[index][1]"
                @click="filters[index][1] = !filters[index][1]; appendFilters(d)"/>
            <buttonFilter 
                :name="'Reset'" 
                :state="true"
                @click="resetFilters()"/>
            <!-- <ul>
                <li>Miner</li>
                <li>Botanist</li>
                <li>Purple Scripts</li>
                <li>Orange Scripts</li>
                <li>Aetherial</li>
                <li>Custom Delivery</li>
                <li>A Realm Reborn</li>
                <li>Heavensward</li>
                <li>Stormblood</li>
                <li>Shadowbringers</li>
                <li>Endwalker</li>
                <li>Dawntrail</li>
                <li>Search</li>
            </ul> -->
        </div>

        <div class="main_content">
            <div>

                <div class="pagenation">
                    <div v-for="(d, index) in compiledDataForTable" :key="index" 
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

                <ul class="rdrTable body" v-for="d in compiledDataForTable[arraySet]" :key="d.ID" :data-activeNodeAnimation="checkActiveState(d.time)">
                    <li class="rdrTable_col-tracking">
                        <img :src="`../../assets/icons/${d.tracked ? 'remove' : 'add'}.webp`" @click="$emit('changeTracked', d)"/>
                    </li>
                    <li class="rdrTable_col-name">
                        {{d.name}}
                        <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                    </li>
                    <li class="rdrTable_col-attributes">

                        <span class="hasContext" :data-context="`${d.job_sub.charAt(0).toUpperCase() + d.job_sub.slice(1)}`">
                            <img :src="`../../assets/icons/${d.job_sub}.webp`"  />
                        </span>

                        <span class="hasContext" v-if="d.usage" :data-context="fetchUsageAttrName(d.usage)">
                            <img :src="`../../assets/icons/${fetchUsageImgName(d.usage)}.webp`" />
                        </span>
                        <!-- CHANGE THIS INTO FOLKLORE IMG -->
                        <span class="hasContext" :data-context="`Requires ${d.tomb}`" v-if="d.node_name == 'Legendary'">
                            <img :src="`../../assets/icons/aetherial.webp`"/>
                        </span>
                    </li>
                    <li>
                        <displayAreaText class="areaname" :areaObj="d"/>
                    </li>
                    <li>{{ `Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}`  }}</li>
                    <li>
                        <displayTimer :timerID="d.time" :timerList="timerList"/>
                    </li>
                </ul>

                <div class="pagenation">
                    <div v-for="(d, index) in compiledDataForTable" :key="index" 
                        @click="arraySet = Number(index)"
                        :class="{'pageActive': arraySet == Number(index)}">
                        {{ Number(index) + 1 }}
                    </div>
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

    export default {
        name: "Timed Mining/Botany",
        components: {promotionBanner, displayTimer, displayAreaText, buttonFilter},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        data() {
            return {
                compiledDataForTable: [] as any,
                allTimedNodes: [] as any,
                arraySet: 0 as number,
                filters: {
                    miner: ['job', true],
                    botanist: ['job', true],
                    purple: ['usage', true],
                    orange: ['usage', true],
                    aetherial: ['usage', true],
                    customdelivery: ['usage', true],
                    arr: ['expansion', true],
                    hwd: ['expansion', true],
                    sbd: ['expansion', true],
                    sbs: ['expansion', true],
                    ewr: ['expansion', true],
                    dtl: ['expansion', true]
                }
            }
        },
        created() {
            let r = this.ffxivData.miner.filter(o => o.time)
            let b = this.ffxivData.botany.filter(o => o.time)
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
            },
            appendFilters(d: any) {
                let hold = this.allTimedNodes.filter((o: any) => {
                    for (const f in this.filters) {
                        if (this.filters[f][1] == false) {
                            if (o[this.filters[f][0]] == f) {
                                return false
                            }
                        }
                    }
                    return true
                })
                // this.compiledDataForTable = hold
                console.log(hold)
            },
            resetFilters() {
                for (const n in this.filters) {
                    this.filters[n] = true;
                }
                this.sortNodesIntoGroup(this.allTimedNodes)
            },
            checkActiveState(timerID: string) {
                return this.timerList.find(o => o.ID === timerID).stateActive ? true : null;
            },
            fetchUsageImgName(usage: any) {
                if (usage[0] == 'aetherial' || usage[0] == 'customdelivery') {return usage[0]}
                if (usage[0] == 'scripts') {return `${usage[1]}gatherscripts`}
                console.error(`Unknown usage type: ${usage}`)
            },
            fetchUsageAttrName(usage: any) {
                if (usage[0] == 'aetherial') {return `${usage[0].charAt(0).toUpperCase() + usage[0].slice(1)}`}
                if (usage[0] == 'customdelivery') {return `Deliver to ${usage[1]}`}
                if (usage[0] == 'scripts') {return `${usage[1].charAt(0).toUpperCase() + usage[1].slice(1)} Gather Scripts`}
                console.error(`Unknown usage type: ${usage}`)
            }
        }
    }
</script>

<style scoped lang="scss">
    .main_content {

        ul {margin-bottom: 6px;}
    }

    .rdrTable {
        grid-template-columns: 80px 400px 100px auto 100px 120px;
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

            &.pageActive {
                background-color: $borderColor;
            }

            &:hover {
                background-color: $borderColorFade;
            }
        }
    }
</style>