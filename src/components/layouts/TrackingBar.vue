<template>
    <header>

        <!-- Title -->
        <div class="trackingbar_header">
            <router-link :to="`/`">
                <h1>FFXIV Radar</h1>
            </router-link>
        </div>

        <!-- Tracking Bar List -->
        <div class="trackingbar_items">
            <trackingbarItem 
                v-for="d in sortTracklingList()" :key="d.ID"
                :node="d"
                :timerList="timerList"
                :weatherList="weatherList"
                :class="[`trackingbar_item`]"
                @changeTracked="e => $emit('changeTracked', e)"
                @openDetails="e => $emit('openDetails', e)"/>
        </div>
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