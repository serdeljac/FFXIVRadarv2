<template>
    <div :data-rowActive="getActiveState">

        <div class="toprow">
            <ToggleTracking
                :trackingEnabled="node.tracked"
                :remove="node.tracked"
                :label="`Remove ${node.name} from tracking`"
                @click="$emit('changeTracked', node)"/>

            <DisplayItemName :item="node.name" :node="node" :hideAttr="true"/>

            <ToggleDetails
                :direction="'open'"
                :label="`View details for ${node.name}`"
                @click="$emit('openDetails', node)"/>
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
    const props = defineProps(['timerList', 'weatherList', 'node', 'nowMs'])
    defineEmits(['changeTracked', 'openDetails'])
    import { computed } from 'vue'
    import ToggleTracking from '../../components/buttons/ToggleTracking.vue'
    import DisplayItemName from '../../components/display/DisplayItemName.vue'
    import ToggleDetails from '../../components/buttons/ToggleDetails.vue'
    import { formatAreaLabel, isNodeWindowActive, nodeCountdown } from '../../hooks/hooks.ts'

    const getActiveState = computed(() =>
        isNodeWindowActive(props.node, props.nowMs) || null)

    const nodeTimer = computed(() =>
        nodeCountdown(props.node, props.nowMs))

    const areaLabel = computed(() => formatAreaLabel(props.node.area))
</script>