<template>
    <div :data-activeState="getTimerState()">
        {{ getTimerCountdown() }}
    </div>
</template>

<script>
    export default {
        name: "Display Timer",
        props: ['timerID', 'timerList'],
        methods: {
            getTimerState() {
                let r = this.timerList.find(o => o.ID == this.timerID)
                return r.activeState
            },
            getTimerCountdown() {
                let r = this.timerList.find(o => o.ID == this.timerID)
                return r.countdown
            }
        }
    }
</script>

<style scoped lang="scss">

</style>