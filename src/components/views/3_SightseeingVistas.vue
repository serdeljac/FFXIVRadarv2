<template>
    <div :class="[`sightseeVistas body_content`, windowWidth]">

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn 
                    v-for="(d, index) in filters" :key="d[1]" 
                    :name="d[1]" 
                    :icon="d[1]"
                    :enabled="!d[2] ? true : null"
                    @click="changeFilter(index)"/>
            </div>
        </div>

        <!-- Expansion Notes -->
        <div class="body_content-group vistaNote">
            <p v-if="filterSelected == 'A Realm Reborn'">To Unlock vista's 21-80, you MUST complete all 20 in the log.</p>
            <br v-if="filterSelected == 'A Realm Reborn'"/>
            <p>
                Each vista discovered will grant you <span class="expColor">{{ fetchVistaData('vista_exp') }}</span> <img class="iconSize" :src="getIconImageURL('exp')" />
                when you're between levels <span class="levelColor">{{ fetchVistaData('vista_min') }}-{{ fetchVistaData('vista_max') }}</span>.
            </p>
        </div>

        <!-- Table -->
        <div :class="[`body_content-group rdrTable`, windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-no">No</p>
                    <p class="rdrTable_row-name">Name</p>
                    <p class="rdrTable_row-time">Time</p>
                    <p class="rdrTable_row-weather">Weather</p>
                    <p class="rdrTable_row-emote">Emote</p>
                    <p class="rdrTable_row-area">Area</p>
                </li>
            </ul>

            <hr class="rdrTable_split" />

            <ul class="rdrTable_body">
                <li v-for="d in allVistaNodes[filterSelected]" :key="d.ID" 
                :data-rowActive="activeTime[d.ID] && activeWeather[d.ID] ? true : null"
                class="rdrTable_row">

                    <!-- TRACKER -->
                    <div class="rdrTable_row-tracking">
                        <toggleTrackingBtn 
                            :trackingEnabled="d.tracked" 
                            v-if="d.time"
                            class="hasContext"
                            :data-context="`Track Node`"
                            @click="$emit('changeTracked', d)"/>
                        <toggleDetailsBtn 
                            v-if="windowWidth != 'mobile'" 
                            @click="$emit('openDetails', d)"
                            class="hasContext"
                            :data-context="`View Details`"/>
                    </div>

                    <!-- NO -->
                    <div class="rdrTable_row-no">
                        <p>{{ d.no }}</p>
                    </div>

                    <!-- NAME -->
                    <div class="rdrTable_row-name">
                        <p>{{ d.name }}</p>
                    </div>

                    <!-- TIMER -->
                    <div class="rdrTable_row-time">
                        <timeDisplay 
                            :timerList="timerList" 
                            :timeId="d.time" 
                            @timeActive="(e: any) => sendTimerState(e, d.ID, 'timer')"/>
                    </div>

                    <!-- WEATHER -->
                    <div class="rdrTable_row-weather">
                        <weatherDisplay 
                            :weatherList="weatherList" 
                            :node="d" 
                            @weatherActive="(e: any) => sendTimerState(e, d.ID, 'weather')"/>
                    </div>

                    <!-- EMOTE -->
                    <div class="rdrTable_row-emote">
                        <img class="iconSize" :src="getIconImageURL(d.emote)" />
                        <p>{{ d.emote }}</p>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d"/>
                    </div>
                </li>
            </ul>
            
        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        name = name.toLocaleLowerCase()
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import timeDisplay from '../ui/displayTime.vue'
    import weatherDisplay from '../ui/displayWeather.vue'
    import areaDisplay from '../ui/displayArea.vue'

    export default {
        name: "Sightseeing Vistas",
        components: {toggleFilterBtn, toggleTrackingBtn, toggleDetailsBtn, timeDisplay, weatherDisplay, areaDisplay},
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['changeTracked', 'openDetails'],
        data() {
            return {
                allVistaNodes: {} as any,
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
                activeTime: {} as any,
                activeWeather: {} as any,
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
            },
            sendTimerState(timeState: any, id: string, type: string) {
                if (type == 'timer') {
                    this.activeTime[id] = timeState
                } else if (type == 'weather') {
                    this.activeWeather[id] = timeState
                }
            }
        }
    }
</script>