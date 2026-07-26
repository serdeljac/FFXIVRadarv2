<template>
    <p :class="[`timeDisplay`, {'active' : active}]">
        {{ fetchTimer }}
        {{ $emit('timeActive', active ? true : null)  }}
    </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isTimerActive, getTimerCountdown } from '../../hooks/hooks.ts'

const props = defineProps(['timeId', 'timerList'])
defineEmits(['timeActive'])

const active = computed(() => isTimerActive(props.timerList, props.timeId))
const fetchTimer = computed(() => getTimerCountdown(props.timerList, props.timeId))
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: $green;}
        50% {color: $fontColor;}
        100% {color: $green;}
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>