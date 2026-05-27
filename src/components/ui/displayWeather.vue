<template>
    <div>
        <p :class="[`timeDisplay`, {'active' : weather1Active}]">{{ fetchWeather1 }}</p>
        <p :class="[`timeDisplay`, {'active' : weather2Active}]">{{ fetchWeather2 }}</p>
        {{ $emit('weatherActive', weather1Active || weather2Active ? true : null) }}
    </div>
</template>

<script lang="ts">
    export default {
        name: "Time Display",
        props: ['node', 'weatherList'],
        emits: ['weatherActive'],
        data() {
            return {
                weather1Active: false as boolean,
                weather2Active: false as boolean,
                timer: '' as string,
            }
        },
        computed: {
            fetchWeather1() {
                let nodeWeather = this.node.weather1
                let currentWeather = this.weatherList[this.node.area.mapcode]
                let weather = nodeWeather ? nodeWeather : 'Any Weather'
                this.weather1Active = nodeWeather == currentWeather ? true : false
                return weather
            },
            fetchWeather2() {
                let nodeWeather = this.node.weather2
                let currentWeather = this.weatherList[this.node.area.mapcode]
                let weather = nodeWeather ? nodeWeather : ''
                this.weather2Active = nodeWeather == currentWeather ? true : false
                return weather
            },
        }
    }
</script>

<style scoped lang="scss">
    @keyframes timerActiveAnimation {
        0% {color: limegreen;}
        50% {color: rgb(255, 255, 255);}
        100% {color: limegreen;}
    }

    .active {animation: timerActiveAnimation 0.7s linear infinite;}
</style>