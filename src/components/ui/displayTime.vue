<template>
    <p :class="[`timeDisplay`, {'active' : active}]">
        {{ fetchTimer }}
        {{ $emit('timeActive', active ? true : null)  }}
    </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps(['timeId', 'timerList'])
defineEmits(['timeActive'])

const result = computed(() => (props.timeId ? props.timerList.find((o: any) => o.ID == props.timeId) : null))
const active = computed(() => !!result.value?.stateActive)
const fetchTimer = computed(() => (props.timeId ? result.value?.countdown : 'Any Time'))
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: limegreen;}
        50% {color: rgb(255, 255, 255);}
        100% {color: limegreen;}
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>