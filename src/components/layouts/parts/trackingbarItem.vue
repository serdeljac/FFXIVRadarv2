<template>
    <div :data-rowAndTimeActive="getActiveState">

        <div class="toprow">
            <btnTracking :trackingEnabled="node.tracked" remove @click="$emit('changeTracked', node)"/>
            <p v-if="isGathering">{{ `${node.name} - Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}` }}</p>
            <p v-if="node.job == 'sightseeing'">{{ node.name }}</p>
            <btnToggleDetails :direction="'open'" @click="$emit('openDetails', node)"/>
        </div>

        <div class="bottomrow">
            <p>{{ `${node.area.region} > ${node.area.zone}` }}</p>
            <timeDisplay :timeId="node.time" :timerList="timerList"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import btnToggleDetails from '../../ui/buttons/toggleDetailMenu.vue'
import btnTracking from '../../ui/buttons/toggleTracking.vue'
import timeDisplay from '../../ui/displayTime.vue'
import { isNodeActive } from '../../../hooks/hooks.ts'

const props = defineProps(['timerList', 'weatherList', 'node'])
defineEmits(['changeTracked', 'openDetails'])

const getActiveState = computed(() => isNodeActive(props.node, props.timerList, props.weatherList))

const isGathering = computed(() => props.node.job === 'miner' || props.node.job === 'botany')
</script>