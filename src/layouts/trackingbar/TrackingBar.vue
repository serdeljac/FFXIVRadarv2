<template>
    <header aria-label="Site header and tracked nodes">

        <div class="trackingbar_header">
            <router-link :to="`/`">
                <p class="trackingbar_title">FFXIV Radar</p>
            </router-link>
        </div>

        <div class="trackingbar_items">
            <TrackingBarItem
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
    const props = defineProps(['windowWidth', 'trackinglist', 'timerList', 'weatherList'])
    defineEmits(['openDetails', 'changeTracked'])
    import TrackingBarItem from './TrackingBarItem.vue'
    import { isNodeWindowActive, useNow } from '../../hooks/hooks.ts'

    const nowMs = useNow()

    function sortTracklingList() {
        const newTrackingList: any[] = []

        for (const d in props.trackinglist) {
            const state = isNodeWindowActive(props.trackinglist[d], nowMs.value)
            if (state) { newTrackingList.unshift(props.trackinglist[d]) }
            else { newTrackingList.push(props.trackinglist[d]) }
        }
        return newTrackingList
    }
</script>