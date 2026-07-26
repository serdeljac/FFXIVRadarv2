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
                :nowMs="nowMs"
                :class="[`trackingbar_item`]"
                @changeTracked="e => $emit('changeTracked', e)"
                @openDetails="e => $emit('openDetails', e)"/>
        </div>
    </header>
</template>

<script lang="ts" setup>
import trackingbarItem from './parts/trackingbarItem.vue'
import { isNodeWindowActive, useNow } from '../../hooks/hooks.ts'

const props = defineProps(['windowWidth', 'trackinglist', 'timerList', 'weatherList'])
defineEmits(['openDetails', 'changeTracked'])

// Vista and fishing countdowns come from real time rather than the timer list.
// The clock is shared with the pages so the bar can't disagree with them.
const nowMs = useNow()

function sortTracklingList() {
    const newTrackingList: any[] = []

    for (const d in props.trackinglist) {
        const state = isNodeWindowActive(props.trackinglist[d], props.timerList, props.weatherList, nowMs.value)
        if (state) { newTrackingList.unshift(props.trackinglist[d]) }
        else { newTrackingList.push(props.trackinglist[d]) }
    }
    return newTrackingList
}
</script>