<template>
    <div :class="[`sightseeVistas`, windowWidth]">

        <div class="filterbar">
            <div class="filterbar_group group1">
                <buttonFilter 
                    v-for="(d, index) in filters" :key="d[1]" 
                    :name="`${d[1]}`" 
                    :disabled="d[2]"
                    @click="changeFilter(index)"/>
            </div>
        </div>

        <div class="vistaNote">
            <p v-if="filterSelected == 'A Realm Reborn'">To Unlock vista's 21-80, you MUST complete all 20 in the log.</p>
            <br v-if="filterSelected == 'A Realm Reborn'"/>
            <p>
                Each vista discovered will grant you <span class="expColor">{{ fetchVistaData('vista_exp') }}</span> <img class="iconSize" :src="getIconImageURL('exp')" />
                when you're between levels <span class="levelColor">{{ fetchVistaData('vista_min') }}-{{ fetchVistaData('vista_max') }}</span>.
            </p>
        </div>

        <div class="body_content">

            <ul class="rdrTable header">
                <li>
                    <p class="rdrTable_col-tracking">Tracker</p>
                    <p class="rdrTable_col-no">No</p>
                    <p class="rdrTable_col-name">Name</p>
                    <p class="rdrTable_col-time">Time</p>
                    <p class="rdrTable_col-weather">Weather</p>
                    <p class="rdrTable_col-emote">Emote</p>
                    <p class="rdrTable_col-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable split" />

            <ul :class="[`rdrTable body`]">
                <li v-for="d in allVistaNodes[filterSelected]" :key="d.ID" :data-rowActive="checkRowActive(d)">

                    <!-- TRACKER -->
                    <div class="rdrTable_col-tracking">
                        <img :class="[`iconSize trackingIcon`, {'remove': d.tracked}]" :src="getIconImageURL('alarm')"" @click="$emit('changeTracked', d)"/>
                    </div>

                    <!-- NO -->
                    <div class="rdrTable_col-no">
                        <p >{{ d.no }}</p>
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_col-name" @click="$emit('sendToDetails', d)">
                        <img v-if="windowWidth == 'mobile'" :class="[`iconSize trackingIcon`, {'remove': d.tracked}]" :src="getIconImageURL('alarm')" @click="$emit('changeTracked', d)"/>
                        <p>{{ d.name }}</p>
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_col-time">
                        <p :data-timeActive="checkTimeActive('time', d)">{{ fetchTimerCountdown(d.time) }}</p>
                    </div>

                    <!-- WEATHER -->
                    <div class="rdrTable_col-weather">
                        <p v-if="d.weather1" :data-timeActive="checkTimeActive('weather1', d)">{{ d.weather1 }}</p>
                        <p v-if="d.weather2" :data-timeActive="checkTimeActive('weather2', d)">{{ d.weather2 }}</p>
                        <p v-if="!d.weather1">Any Weather</p>
                    </div>

                    <!-- EMOTE -->
                    <div class="rdrTable_col-emote">
                        <iconAndText :icon="d.emote" :text="d.emote"/>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_col-area">
                        <displayAreaText @click="$emit('sendToDetails', d)" :areaObj="d" :excludeBackground="true" />
                    </div>
                </li>
            </ul>
            
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
    import iconAndText from '../ui/iconAndText.vue';

    export default {
        name: "Sightseeing Vistas",
        components: {displayAreaText, buttonFilter, seachBar, iconAndText},
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked', 'sendToDetails'],
        data() {
            return {
                allVistaNodes: {} as any,
                showDetails: '' as string,
                showOnlyActive: false as boolean,
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
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
            this.createFilterList() //Run Once
            this.groupVistaLogsByExpansion() //Run Once
        },
        methods: {
            createFilterList() {
                //Search for all Expansion names within Sightseeing Logs
                const expansionList = this.ffxivData.sightseeing.filter((obj: any, index: any) => 
                    index === this.ffxivData.sightseeing.findIndex((o: any) => obj.expansion === o.expansion)
                );

                //Append and set default filter list
                for (const d in expansionList) {
                    this.filters[d] = ['expansion', expansionList[d].expansion, true]
                }

                //Set defaualt filer value
                this.filters[0][2] = false
                this.filterSelected = this.filters[0][1]
            },
            groupVistaLogsByExpansion() {
                //Create list of easch Expansion name
                let vistaList = this.ffxivData.sightseeing
                const expansionList = vistaList.filter((obj: any, index: any) => 
                    index === vistaList.findIndex((o: any) => obj.expansion === o.expansion)
                );

                //Group each vista by found expansion name
                for (const d in expansionList) {
                    this.allVistaNodes[expansionList[d].expansion] = vistaList.filter((o: any) => o.expansion == expansionList[d].expansion)
                }
            },
            changeFilter(arrayIndex: any) {
                //Set all values to Disabled
                for (const d in this.filters) {this.filters[d][2] = true}

                //Set new filter to enable
                this.filters[arrayIndex][2] = false
                this.filterSelected = this.filters[arrayIndex][1]

            },
            fetchVistaData(type: string) {
                let results = this.ffxivData.expansion.find((o: any) => o.expansion == this.filterSelected)
                return results[type]
            },
            fetchTimerCountdown(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
            },
            checkTimeActive(type: string, arr: any) {

                if (type == 'weather1' || type == 'weather2') {
                    let curWeather = this.weatherList[arr.area.mapcode]
                    let triggerWeather = arr[type]
                    if (curWeather == triggerWeather) {return true}
                    return null
                }

                if (type == 'time' && arr.time) {
                    let results = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    results = results ? true : null
                    return results
                }
                return null
            },
            checkRowActive(arr: any) {
                let match1: boolean
                let match2: boolean

                //Match1 - Get Time State
                if (arr.time) {
                    let currentTimeState = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    match1 = currentTimeState ? true : null
                }

                //Match2 - Get Weather State
                if (arr.weather1) {
                    let curWeather = this.weatherList[arr.area.mapcode]
                    let condition1 = arr.weather1 == curWeather ? true :  false
                    let condition2 = (arr.weather2 == curWeather) && arr.weather2 ? true :  false
                    match2 = condition1 || condition2 ? true : false
                }

                if (!arr.weather1) {return match1}
                return match1 == match2 ? true : null
            }
        }
    }
</script>

<style scoped lang="scss">
    .sightseeVistas.tablet {
        .rdrTable li {grid-template-columns: 80px 300px 120px auto;}
        .rdrTable_col-no, .rdrTable_col-time, .rdrTable_col-weather {display: none}
    }

    .sightseeVistas.mobile {
        .rdrTable li {
            grid-template-columns: auto;
            justify-content: center;
        }
        .rdrTable_col-tracking, .rdrTable_col-no, .rdrTable_col-time, .rdrTable_col-weather, .rdrTable_col-emote {display: none}
        .rdrTable.header {display: none;}
        .rdrTable.body li {
            padding: 6px;
            .rdrTable_col-name {
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

    .rdrTable li {grid-template-columns: 80px 80px 300px 100px 120px 120px auto;}
    .vistaNote {
        text-align: center;
        p {
            display: inline-flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            span {margin-left: 4px;}
            img {margin: 0 2px 0 2px;}
        }
    }
</style>