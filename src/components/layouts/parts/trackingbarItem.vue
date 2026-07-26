<template>
    <div :data-rowActive="getActiveState">

        <div class="toprow">
            <btnTracking :trackingEnabled="node.tracked" remove @click="$emit('changeTracked', node)"/>
            <p v-if="hasLevelAndStars">{{ `${node.name} - Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}` }}</p>
            <p v-if="node.job == 'sightseeing'">{{ node.name }}</p>
            <btnToggleDetails :direction="'open'" @click="$emit('openDetails', node)"/>
        </div>

        <div class="bottomrow">
            <p>{{ areaLabel }}</p>
            <p class="timeAppend">
                {{ nodeTimer }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import btnToggleDetails from '../../ui/buttons/toggleDetailMenu.vue'
import btnTracking from '../../ui/buttons/toggleTracking.vue'
import { formatAreaLabel, isTrackedNodeActive, trackedNodeTimer } from '../../../hooks/hooks.ts'

const props = defineProps(['timerList', 'weatherList', 'node', 'nowMs'])
defineEmits(['changeTracked', 'openDetails'])

// `|| null` because Vue keeps a literal `false` on a non-boolean attribute, which
// would leave every row matching the global [data-rowActive] pulse.
const getActiveState = computed(() =>
    isTrackedNodeActive(props.node, props.timerList, props.weatherList, props.nowMs) || null)

const nodeTimer = computed(() =>
    trackedNodeTimer(props.node, props.timerList, props.weatherList, props.nowMs))

const hasLevelAndStars = computed(() => ['miner', 'botany', 'fishing'].includes(props.node.job))

const areaLabel = computed(() => formatAreaLabel(props.node.area))
</script>