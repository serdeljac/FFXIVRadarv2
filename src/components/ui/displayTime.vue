<template>
    <p :class="[`timeDisplay`, {'active' : active}]">
        {{ fetchTimer }}
        {{ $emit('timeActive', active ? true : null)  }}
    </p>
</template>

<script lang="ts">
    export default {
        name: "Time Display",
        props: ['timeId', 'timerList'],
        emits: ['timeActive'],
        data() {
            return {
                active: false as boolean,
                timer: '' as string
            }
        },
        computed: {
            fetchTimer() {
                if (this.timeId) {
                    let results = this.timerList.find((o: any) => o.ID == this.timeId)
                    this.active = results.stateActive
                    
                    return results.countdown
                }
                return 'Any Time'
            }
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