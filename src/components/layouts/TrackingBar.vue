<template>
    <div class="trackingbar">

        <!-- Header -->
        <div class="trackingbar_header">
            <router-link :to="`/`">
                <h1>FFXIV Radar</h1>
            </router-link>
        </div>

        <!-- List items area -->
        <ul :class="[`trackingbar_items`,
            {'grid4': windowWidth == 'desktop-large'},
            {'grid3': windowWidth == 'desktop-small'},
            {'grid2': windowWidth == 'tablet'},
            {'grid1': windowWidth == 'mobile'}
            ]">

            <!-- Individual Listed Items -->
            <li v-for="d in sortTracklingList()" :key="d.ID" 
                :class="[`trackingbar_item`]" 
                :data-rowAndTimeActive="checkActiveState(d)">

                    <!-- Show Content -->
                    <div class="content_area" @click="$emit('openDetails', d)">
                        <iconAndText class="itemname" :icon="d.job_sub" :text="d.name" />
                        <div class="rdrTable_col-time timer">
                            <p class="timeDisplay">{{ fetchTimerCountdown(d.time) }}</p>
                        </div> 
                        <displayAreaText class="areaname" :areaObj="d"/>
                    </div>
                    
                    <!-- Close Button -->
                    <div class="close_area" @click="$emit('changeTracked', d)">
                        <trashButton class="trash" :addClass="'simple'"/>
                    </div>

            </li>
        </ul>
    </div>
</template>

<script lang="ts">
    import menuButton from '../ui/ButtonMenu.vue';
    import iconAndText from '../ui/iconAndText.vue';
    import displayAreaText from '../ui/displayAreaText.vue';
    import trashButton from '../ui/trashButton.vue'

    export default {
        name: 'Tracking Bar',
        components: {menuButton, iconAndText, displayAreaText, trashButton},
        props: ['windowWidth', 'trackinglist', 'timerList', 'weatherList'],
        emits: ['openDetails','changeTracked'],
        methods: {
            checkActiveState(arr: any) {
                let timerState = this.timerList.find((o: any) => o.ID === arr.time).stateActive ? true : null;

                if (arr.job == 'sightseeing') {
                    let curW = this.weatherList[arr.area.mapcode]
                    let weather1 = arr.weather1
                    let weather2 = arr.weather2

                    let weatherState = curW == weather1 || curW == weather2 ? true : null
                    let compare = timerState && weatherState ? true : null
                    return compare
                }
                return timerState
            },
            fetchTimerCountdown(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return '--:--'
            },
            sortTracklingList() {
                let newTrackingList = []
                
                for (const d in this.trackinglist) {
                    let state = this.checkActiveState(this.trackinglist[d])
                    if (state) {newTrackingList.unshift(this.trackinglist[d])}
                    else {newTrackingList.push(this.trackinglist[d])}
                }
                return newTrackingList
            }
        }
    }
</script>

<style scoped lang="scss">
    .trackingbar {
        background-color: $bodyBackgroundColor;
        display: grid;
        grid-template-columns: calc(230px + 2rem) 100%;
        width: 100%;
        border-bottom: 1px solid $borderColor;
        overflow: hidden;

        &_header {
            padding-left: 2rem;
            display: flex;
            align-items: center;
            width: $sidebarWidthExpand;
            height: $trackingbarHeight;
            h1 {
                font-size: 1.5rem;
                margin-left: 0.5rem;
            }
            .btn_menu {
                width: 32px;
                aspect-ratio: 1/1;
            }
        }

        &_items {
            width: calc(100% - $sidebarWidthExpand);
            overflow: auto;
            display: grid;
            height: 70px;
            padding-right: 1rem;
            &.grid4 {grid-template-columns: 1fr 1fr 1fr 1fr;}
            &.grid3 {grid-template-columns: 1fr 1fr 1fr;}
            &.grid2 {grid-template-columns: 1fr 1fr;}
            &.grid1 {grid-template-columns: 1fr;}
            gap: 0 20px;
        }

        &_item {
            display: inline-flex;
            margin: 0.3rem 0;
            border: 1px solid $borderColor;
            border-radius: $borderRadius;
            height: calc(70px - 0.6rem);
            overflow: hidden;
            cursor: pointer;

            &:hover {
                .close_area .trash {transform: translateX(-15px)}
            }

            .content_area {
                height: calc(70px - 0.6rem);
                padding: 0.1rem 0.2rem;
                width: 100%;
                display: grid;
                grid-template-columns: 1.5fr 0.5fr;
                position: relative;
            }

            .close_area {
                height: calc(70px - 0.6rem);
                width: 5%;
                .trash {
                    transform: translateX(20px);
                    transition: all .07s linear;
                }
            }

            .itemname, .timer {
                justify-self: center;
                align-self: center;
            }
            .areaname {
                grid-column: 1 / span 2;
                justify-self: center;
            }
        }

        &_adjust {
            width: 50px;
            margin-left: 1rem;
            display: flex;
            flex-direction: column;
            gap: 6px;
            img {
                width: 20px;
                cursor: pointer;
                &.inactive {
                    opacity: 0.3;
                    cursor: default;
                }
                &:first-child {
                    transform: rotate(180deg);
                }
            }
        }
    }
</style>