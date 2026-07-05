<template>
    <p :class="[`timeDisplay`, {'active' : active}]">
        {{ fetchTimer }}
        {{ $emit('timeActive', active ? true : null)  }}
    </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isTimerActive, getTimerCountdown } from '../../hooks/hooks'

const props = defineProps(['timeId', 'timerList'])
defineEmits(['timeActive'])

const active = computed(() => isTimerActive(props.timerList, props.timeId))
const fetchTimer = computed(() => getTimerCountdown(props.timerList, props.timeId))
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: limegreen;}
        50% {color: rgb(255, 255, 255);}
        100% {color: limegreen;}
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>