<template>
    <div v-if="type == 'timer'">
        <p>{{ getTimerCountdown() }}</p>
    </div>
    <div v-if="type == 'weather'" class="weatherDisplay">
        <p :class="[{'activeWeather': ismatch}]" v-if="this.node.weather1">{{ this.node.weather1 }}</p>
        <p v-if="this.node.weather2">{{ this.node.weather2 }}</p>
        <p class="noWeather" v-if="!this.node.weather1">None</p>
    </div>
</template>

<script>
    import EorzeaWeather from 'eorzea-weather';

    export default {
        name: "Display Timer",
        props: ['type', 'node', 'timerList'],
        emits: ['timerState', 'weaatherState'],
        data() {
            return {
                currentState: false,
                ismatch: true
            }
        },
        methods: {
            getTimerCountdown() {
                let r = this.timerList.find(o => o.ID == this.node.time)
                if (!r) {return '--:--'}

                // if (node.mapcode) {
                //     let x = EorzeaWeather.getWeather(node.mapcode, new Date());
                    
                // }


                return r.countdown
            }
        }
    }
</script>

<style scoped lang="scss">
    .weatherDisplay {
        display: flex;
        gap: 6px;
        p {
            transition: all .07s linear;
            border-radius: 4px;
            padding: 4px 8px;
            opacity: 0.6;
            &.activeWeather {color: rgb(43, 234, 113)}

            
        }
    }
</style>