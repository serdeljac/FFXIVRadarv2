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

                <div class="stats">
                    {{ `Total Items found: ${compiledDataForTable.flat().length}` }}
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

                        <span class="hasContext" v-if="d.usage" :data-context="fetchUsageAttrName(d.usage, d.usage_info)">
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
                    botany: ['job', true],
                    purple: ['usage_info', true],
                    orange: ['usage_info', true],
                    aetherial: ['usage', true],
                    customdelivery: ['usage', true],
                    "A Realm Reborn": ['expansion', true],
                    "Heavensward": ['expansion', true],
                    "Stormblood": ['expansion', true],
                    "Shadowbringers": ['expansion', true],
                    "Endwalker": ['expansion', true],
                    "Dawntrail": ['expansion', true]
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
                console.log(d)
                this.filters[d[1]] = !this.filters[d[1]]
                let allArr = this.allTimedNodes

                for (const f in this.filters) {
                    if (this.filters[f][1] == false) {
                        allArr = allArr.filter(o => o[this.filters[f][0]] != f)
                    }
                }
                this.sortNodesIntoGroup(allArr)
            },
            resetFilters() {
                for (const n in this.filters) {
                    this.filters[n][1] = true;
                }
                this.sortNodesIntoGroup(this.allTimedNodes)
            },
            checkActiveState(timerID: string) {
                return this.timerList.find(o => o.ID === timerID).stateActive ? true : null;
            },
            fetchUsageImgName(usage: any) {
                if (usage == 'aetherial' || usage == 'customdelivery') {return usage}
                if (usage == 'scripts') {return `${usage}gatherscripts`}
                console.error(`Unknown usage type: ${usage}`)
            },
            fetchUsageAttrName(usage: string, info: string) {
                if (usage == 'aetherial') {return `${usage.charAt(0).toUpperCase() + usage.slice(1)}`}
                if (usage == 'customdelivery') {return `Deliver to ${info}`}
                if (usage == 'scripts') {return `${info.charAt(0).toUpperCase() + info.slice(1)} Gather Scripts`}
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