<template>
    <div :data-rowAndTimeActive="getActiveState">

        <div class="toprow">
            <btnTracking :trackingEnabled="node.tracked" remove @click="$emit('changeTracked', node)"/>
            <p v-if="hasLevelAndStars">{{ `${node.name} - Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}` }}</p>
            <p v-if="node.job == 'sightseeing'">{{ node.name }}</p>
            <btnToggleDetails :direction="'open'" @click="$emit('openDetails', node)"/>
        </div>

        <div class="bottomrow">
            <p>{{ areaLabel }}</p>
            <p class="timeAppend">
                {{ nodeTimeChecker(node, timerList, false) }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import btnToggleDetails from '../../ui/buttons/toggleDetailMenu.vue'
import btnTracking from '../../ui/buttons/toggleTracking.vue'
import { isNodeActive, formatAreaLabel, nodeTimeChecker } from '../../../hooks/hooks.ts'

const props = defineProps(['timerList', 'weatherList', 'node'])
defineEmits(['changeTracked', 'openDetails'])

const getActiveState = computed(() => isNodeActive(props.node, props.timerList, props.weatherList))

const hasLevelAndStars = computed(() => ['miner', 'botany', 'fishing'].includes(props.node.job))

const areaLabel = computed(() => formatAreaLabel(props.node.area))
</script>