<template>
    <p :class="[`timeDisplay`, {'active': active}]">
        {{ countdown }}
    </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { nodeCountdown, isNodeWindowActive, useNow } from '../../hooks/hooks.ts'

// The node carries everything the countdown needs: hooks.ts routes it by job and
// reads the timer and weather lists App.vue registered, so no page has to pass
// them down. Ticking off the shared clock keeps every countdown on screen — this
// one, the tracking bar, the details pane — showing the identical second.
const props = defineProps<{ node: any }>()
const nowMs = useNow()

const countdown = computed(() => nodeCountdown(props.node, nowMs.value))
const active = computed(() => isNodeWindowActive(props.node, nowMs.value))
</script>

<script lang="ts">
    export default {
        name: "Timer Display"
    }
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: $green;}
        50% {color: $fontColor;}
        100% {color: $green;}
    }

    .timeDisplay {
        font-family: 'Share Tech Mono', monospace;
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>
