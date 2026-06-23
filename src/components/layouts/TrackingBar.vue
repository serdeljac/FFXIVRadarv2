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

<script lang="ts" setup>
import trackingbarItem from './parts/trackingbarItem.vue'

const props = defineProps(['windowWidth', 'trackinglist', 'timerList', 'weatherList'])
defineEmits(['openDetails', 'changeTracked'])

function checkActiveState(arr: any) {
    const timerState = props.timerList.find((o: any) => o.ID === arr.time).stateActive ? true : null

    if (arr.job == 'sightseeing') {
        const curW = props.weatherList[arr.area.mapcode]
        const weatherState = curW == arr.weather1 || curW == arr.weather2 ? true : null
        return timerState && weatherState ? true : null
    }
    return timerState
}

function sortTracklingList() {
    const newTrackingList: any[] = []

    for (const d in props.trackinglist) {
        const state = checkActiveState(props.trackinglist[d])
        if (state) { newTrackingList.unshift(props.trackinglist[d]) }
        else { newTrackingList.push(props.trackinglist[d]) }
    }
    return newTrackingList
}
</script>