<template>
    <div :data-rowAndTimeActive="getActiveState">
        <p>{{ node.name }}</p>
        <p>{{ getTimer }}</p>
    </div>
</template>

<script lang="ts" setup>
</script>

<script lang="ts">
    export default {
        name: "Trackingbar Item",
        props: ['timerList', 'weatherList', 'node'],
        computed: {
            getActiveState() {
                let timerState = this.timerList.find((o: any) => o.ID === this.node.time).stateActive ? true : null;
                
                if (this.node.job == 'sightseeing') {
                    let curW = this.weatherList[this.node.area.mapcode]
                    let weather1 = this.node.weather1
                    let weather2 = this.node.weather2

                    let weatherState = curW == weather1 || curW == weather2 ? true : null
                    let compare = timerState && weatherState ? true : null
                    return compare
                }
                return timerState
            },
            getTimer() {
                if (this.node.time) {
                    let results = this.timerList.find((o: any) => o.ID == this.node.time).countdown
                    return results
                }
                return '--:--'
            }
        }
    }
</script>

<style scoped lang="scss">

</style>