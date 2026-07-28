<template>
    <p :class="[`timeDisplay`, {'active': active}]">
        {{ countdown }}
    </p>
</template>

<script lang="ts" setup>
    import { computed } from 'vue'
    import { nodeCountdown, isNodeWindowActive, useNow } from '../../hooks/hooks.ts'
    const props = defineProps<{ node: any }>()
    const nowMs = useNow()
    const countdown = computed(() => nodeCountdown(props.node, nowMs.value))
    const active = computed(() => isNodeWindowActive(props.node, nowMs.value))
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

    @media (prefers-reduced-motion: reduce) {
        .active {
            color: $green;
            font-weight: 600;
        }
    }
</style>
