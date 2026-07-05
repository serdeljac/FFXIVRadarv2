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
import { isNodeActive } from '../../hooks/hooks.ts'

const props = defineProps(['windowWidth', 'trackinglist', 'timerList', 'weatherList'])
defineEmits(['openDetails', 'changeTracked'])

function sortTracklingList() {
    const newTrackingList: any[] = []

    for (const d in props.trackinglist) {
        const state = isNodeActive(props.trackinglist[d], props.timerList, props.weatherList)
        if (state) { newTrackingList.unshift(props.trackinglist[d]) }
        else { newTrackingList.push(props.trackinglist[d]) }
    }
    return newTrackingList
}
</script>