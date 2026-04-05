<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">
            <ul>
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
            </ul>
        </div>

        <div class="main_content">
            <div>
                <ul class="rdrTable header">
                    <li>Tracker</li>
                    <li>Name</li>
                    <li>Attributes</li>
                    <li>Area</li>
                    <li>Level</li>
                    <li>Timer</li>
                </ul>

                <ul class="rdrTable body" v-for="d in compiledDataForTable" :key="d.ID" :data-activeNodeAnimation="checkActiveState(d.time)">
                    <li class="rdrTable_col-tracking">
                        <img :src="`../../assets/icons/${d.tracked ? 'remove' : 'add'}.webp`" @click="$emit('changeTracked', d)"/>
                    </li>
                    <li class="rdrTable_col-name">
                        {{d.name}}
                        <span v-if="d.attribute && d.attribute !== 'Collectability'">{{ ` [${d.attribute}]` }}</span>
                    </li>
                    <li class="rdrTable_col-attributes">

                        <span class="hasContext" data-context="Job Name">
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
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayTimer from '../ui/displayTimer.vue';
import displayAreaText from '../ui/displayAreaText.vue';

    export default {
        name: "Timed Mining/Botany",
        components: {promotionBanner, displayTimer, displayAreaText},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        data() {
            return {
                compiledDataForTable: [] as any,
            }
        },
        created() {
            this.fetchTimedData()
        },
        methods: {
            fetchTimedData() {
                let r = this.ffxivData.miner.filter(o => o.time)
                let b = this.ffxivData.botany.filter(o => o.time)
                this.compiledDataForTable = [...r, ...b]
            },
            checkActiveState(timerID: string) {
                return this.timerList.find(o=> o.ID === timerID).stateActive ? true : null;
            },
            fetchUsageImgName(usage: any) {
                if (usage[0] == 'aetherial' || usage[0] == 'customdelivery') {return usage[0]}
                if (usage[0] == 'scripts') {return `${usage[1]}gatherscripts`}
                console.error(`Unknown usage type: ${usage}`)
            },
            fetchUsageAttrName(usage: any) {
                if (usage[0] == 'aetherial') {return usage[0]}
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
</style>