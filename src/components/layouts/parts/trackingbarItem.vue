<template>
    <div :data-rowActive="getActiveState">

        <div class="toprow">
            <btnTracking :trackingEnabled="node.tracked" remove @click="$emit('changeTracked', node)"/>
            <displayItemName :item="node.name" :node="node" />
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
import displayItemName from '../../ui/displayItemName.vue'
import { formatAreaLabel, isNodeWindowActive, nodeCountdown } from '../../../hooks/hooks.ts'

const props = defineProps(['timerList', 'weatherList', 'node', 'nowMs'])
defineEmits(['changeTracked', 'openDetails'])

// `|| null` because Vue keeps a literal `false` on a non-boolean attribute, which
// would leave every row matching the global [data-rowActive] pulse.
const getActiveState = computed(() =>
    isNodeWindowActive(props.node, props.nowMs) || null)

const nodeTimer = computed(() =>
    nodeCountdown(props.node, props.nowMs))


const areaLabel = computed(() => formatAreaLabel(props.node.area))
</script>