<template>
    <div class="trackingbar">
        <div class="trackingbar_header">
            <router-link :to="`/`">
                <h1>FFXIV Radar</h1>
            </router-link>
        </div>
        <div :class="[`trackingbar_items`]">
            <ul :class="[
                {'grid4': windowWidth == 'desktop-large'},
                {'grid3': windowWidth == 'desktop-small'},
                {'grid2': windowWidth == 'tablet'},
                {'grid1': windowWidth == 'mobile'}
                ]">
                <li v-for="d in trackinglist" :key="d.ID" :class="[`trackingbar_item`]" :data-activeNodeAnimation="checkActiveState(d.time)">
                    <div class="content">
                        <iconAndText class="itemname" :icon="d.job_sub" :text="d.name" />
                        <displayTimer class="timer" :timerID="d.time" :timerList="timerList"/>
                        <displayAreaText class="areaname" :areaObj="d"/>
                    </div>
                    <div class="options">
                        <div class="view"  @click="$emit('openDetails', d)">
                            <p>View</p>
                        </div>
                        <div class="remove" @click="$emit('changeTracked', d)">
                            <p>Remove</p>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import menuButton from '../ui/ButtonMenu.vue';
import iconAndText from '../ui/iconAndText.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import displayTimer from '../ui/displayTimer.vue';

    export default {
        name: 'Tracking Bar',
        components: {menuButton, iconAndText, displayAreaText, displayTimer},
        props: ['windowWidth', 'trackinglist', 'timerList'],
        emits: ['openDetails','changeTracked'],
        methods: {
            checkActiveState(timerID: string) {
                return this.timerList.find(o=> o.ID === timerID).stateActive ? true : null;
            }
        }
    }
</script>

<style scoped lang="scss">
    .trackingbar {
        background-color: $bodyBackgroundColor;
        display: grid;
        grid-template-columns: calc(1rem + 230px) auto;
        width: 100%;
        border-bottom: 1px solid $borderColor;
        overflow: hidden;

        &_header {
            padding: $paddingSize;
            padding-left: 2rem;
            display: inline-flex;
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
            padding: $paddingSize;
            padding-right: 1rem;
            width: 100%;
            overflow-Y: auto;
            
            ul {
                display: grid;
                &.grid4 {grid-template-columns: 1fr 1fr 1fr 1fr;}
                &.grid3 {grid-template-columns: 1fr 1fr 1fr;}
                &.grid2 {grid-template-columns: 1fr 1fr;}
                &.grid1 {grid-template-columns: 1fr;}
                gap: 20px;
            }
        }

        &_item {
            overflow: hidden;
            height: 55px;
            .options {
                transition: opacity 0.23s ease;
                
            }
            &:hover {
                    .content {opacity: 0.2}
                    .options {opacity: 1;}
                }
            

            .content {
                display: grid;
                grid-template-columns: 1.5fr 0.5fr;
                border: 1px solid $borderColor;
                border-radius: $borderRadius;
                height: 55px;
                width: 100%;
                padding: 0.3rem;
                .areaname {
                    grid-column: 1 / span 2;
                    margin-top: 4px;
                }
                .timer {justify-self: center;}
            }

            .options {
                width: 100%;
                height: 55px;
                position: relative;
                border: 1px solid transparent;
                display: flex;
                justify-content: space-between;
                opacity: 0;
                transform: translateY(-55px);
                .view {
                    padding-left: 1rem;
                    background: linear-gradient(90deg, $trackingOptionsView 0%, $trackingOptionsView 50%, rgba(0, 0, 0, 0) 100%);
                }
                .remove {
                    padding-right: 1rem;
                    justify-self: end;
                    background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, $trackingOptionsRemove 50%, $trackingOptionsRemove 100%);
                    p {justify-content: flex-end;}
                }
                div {
                    cursor: pointer;
                    width: 40%;
                    p {
                        display: flex;
                        align-items: center;
                        height: 100%;
                        user-select: none;
                    }
                }
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