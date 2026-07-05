<template>
    <div>
        <p :class="[`timeDisplay`, {'active' : weather1Active}]">{{ fetchWeather1 }}</p>
        <p :class="[`timeDisplay`, {'active' : weather2Active}]">{{ fetchWeather2 }}</p>
        {{ $emit('weatherActive', weather1Active || weather2Active ? true : null) }}
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isWeatherMatch } from '../../hooks/hooks'

const props = defineProps(['node', 'weatherList'])
defineEmits(['weatherActive'])

const weather1Active = computed(() => isWeatherMatch(props.weatherList, props.node.area.mapcode, props.node.weather1))
const weather2Active = computed(() => isWeatherMatch(props.weatherList, props.node.area.mapcode, props.node.weather2))
const fetchWeather1 = computed(() => (props.node.weather1 ? props.node.weather1 : 'Any Weather'))
const fetchWeather2 = computed(() => (props.node.weather2 ? props.node.weather2 : ''))
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: limegreen;}
        50% {color: rgb(255, 255, 255);}
        100% {color: limegreen;}
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>