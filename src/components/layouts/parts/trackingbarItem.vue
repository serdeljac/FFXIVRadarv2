<template>
    <div :data-rowAndTimeActive="getActiveState">

        <div class="toprow">
            <btnTracking :trackingEnabled="node.tracked" @click="$emit('changeTracked', node)"/>
            <p>{{ `${node.name} - Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}` }}</p>
            <btnToggleDetails :direction="'open'" @click="$emit('openDetails', node)"/>
        </div>

        <div class="bottomrow">
            <p>{{ `${node.area.region} > ${node.area.zone}` }}</p>
            <p>{{ getTimer }}</p>
        </div>
    </div>
</template>

<script lang="ts">
    import btnToggleDetails from '../../ui/buttons/toggleDetailMenu.vue'
    import btnTracking from '../../ui/buttons/toggleTracking.vue'

    export default {
        name: "Trackingbar Item",
        props: ['timerList', 'weatherList', 'node'],
        emits: ['changeTracked', 'openDetails'],
        components: {btnToggleDetails,btnTracking},
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