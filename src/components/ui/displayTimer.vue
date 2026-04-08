<template>
    <!-- 
    PROPS: 
        timerList: [Object] Reactive array of timers
        node: [Object] Current Node info
        type: [String] {Timer, Weather} Which div to display
    EMiTS:
        timerActive: [Boolean] State of the node's Timer
        weatherActive: [Boolean] Satte of the node's weather
    -->
    <div v-if="type == 'timer'" class="timerDisplay" :data-activeTimerAnimation="getTimerState()">
        <p>{{ timerCountdown }}</p>
    </div>

    <div v-if="type == 'weather'" :class="[`weatherDisplay`]" :data-activeWeatherAnimation="getWeatherState()">
        <p v-if="node.weather1">{{ node.weather1 }}</p>
        <p v-if="node.weather2">{{ node.weather2 }}</p>
        <p v-if="!node.weather1" class="noWeather">No Weather</p>
    </div>
</template>

<script lang="ts">
    import EorzeaWeather from 'eorzea-weather';

    export default {
        name: "Display Timer",
        props: ['type', 'node', 'timerList'],
        emits: ['timerState', 'weatherState'],
        data() {
            return {
                timerCountdown: '' as string
            }
        },
        methods: {
            getTimerState() {
                let r = this.timerList.find(o => o.ID == this.node.time)
                if (!r) {this.timerCountdown = '--:--'}
                this.$emit('timerState', r.stateActive)
                this.timerCountdown = r.countdown
            },
            getWeatherState() {
                let n = this.node
                if (!n.weather1) {return null}
                let x = EorzeaWeather.getWeather(n.area.mapcode, new Date());
                if (x == n.weather1 || x == n.weather2) {this.$emit('weatherState', true)}
                if (x == n.weather1) {return 'weather1'}
                else if (x == n.weather2) {return 'weather2'}
                this.$emit('weatherState', false)
                return null
            }
        }
    }
</script>

<style scoped lang="scss">
    .weatherDisplay, .timerDisplay {
        display: flex;
        gap: 6px;
        p {
            transition: all .07s linear;
            border-radius: 4px;
            padding: 4px 8px;
            opacity: 0.6;
            user-select: none;
            background-color: $buttonBackgroundColorHover;
            &.noWeather {
                background-color: transparent;
                opacity: 1
            }
        }
    }
</style>