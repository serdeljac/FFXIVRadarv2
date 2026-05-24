<template>
    <header>

        <!-- Title -->
        <div class="trackingbar_header">
            <router-link :to="`/`">
                <h1>FFXIV Radar</h1>
            </router-link>
        </div>

        <div class="trackingbar_items">

            <trackingbarItem 
                v-for="d in sortTracklingList()" :key="d.ID"
                :node="d"
                :timerList="timerList"
                :weatherList="weatherList"
                :class="[`trackingbar_item`]"
            />

        </div>


        <!-- <ul :class="[`trackingbar_items`,
            {'grid4': windowWidth == 'desktop-large'},
            {'grid3': windowWidth == 'desktop-small'},
            {'grid2': windowWidth == 'tablet'},
            {'grid1': windowWidth == 'mobile'}
            ]">

            <li v-for="d in sortTracklingList()" :key="d.ID" 
                :class="[`trackingbar_item`]" 
                :data-rowAndTimeActive="checkActiveState(d)">

   
                    <div class="content_area" @click="$emit('openDetails', d)">
                        <iconAndText class="itemname" :icon="d.job_sub" :text="d.name" />
                        <div class="rdrTable_col-time timer">
                            <p class="timeDisplay">{{ fetchTimerCountdown(d.time) }}</p>
                        </div> 
                        <displayAreaText class="areaname" :areaObj="d"/>
                    </div>
        
                    <div class="close_area" @click="$emit('changeTracked', d)">
                        <trashButton class="trash" :addClass="'simple'"/>
                    </div>

            </li>
        </ul> -->
    </header>
</template>

<script lang="ts">
    import trackingbarItem from './parts/trackingbarItem.vue'

    export default {
        name: 'Tracking Bar',
        components: {trackingbarItem},
        props: ['windowWidth', 'trackinglist', 'timerList', 'weatherList'],
        emits: ['openDetails','changeTracked'],
        methods: {
            checkActiveState(arr: any) {
                let timerState = this.timerList.find((o: any) => o.ID === arr.time).stateActive ? true : null;

                if (arr.job == 'sightseeing') {
                    let curW = this.weatherList[arr.area.mapcode]
                    let weather1 = arr.weather1
                    let weather2 = arr.weather2

                    let weatherState = curW == weather1 || curW == weather2 ? true : null
                    let compare = timerState && weatherState ? true : null
                    return compare
                }
                return timerState
            },
            fetchTimerCountdown(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time)
                    return [results.stateActive, results.countdown]
                }
                return '--:--'
            },
            sortTracklingList() {
                let newTrackingList = []
                
                for (const d in this.trackinglist) {
                    let state = this.checkActiveState(this.trackinglist[d])
                    if (state) {newTrackingList.unshift(this.trackinglist[d])}
                    else {newTrackingList.push(this.trackinglist[d])}
                }
                return newTrackingList
            }
        }
    }
</script>