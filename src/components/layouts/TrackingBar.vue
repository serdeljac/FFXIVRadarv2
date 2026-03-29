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
                <li v-for="d in trackinglist" :key="d.ID" class="trackingbar_item">
                    <iconAndText class="itemname" :icon="d.job_sub" :text="d.name" />
                    <displayTimer class="timer" :timerID="d.time" :timerList="timerList"/>
                    <displayAreaText class="areaname" :areaObj="d"/>
                </li>
            </ul>
        </div>
        <div :class="[`trackingbar_adjust`]">
            <div>UP</div>
            <div>DOWN</div>
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
        props: ['windowWidth', 'trackinglist', 'timerList']
    }
</script>

<style scoped lang="scss">
    .trackingbar {
        background-color: $bodyBackgroundColor;
        display: inline-flex;
        align-items: center;
        width: 100%;
        border-bottom: 1px solid $borderColor;

        &_header {
            padding: $paddingSize;
            padding-left: 2rem;
            display: inline-flex;
            align-items: center;
            width: $sidebarWidthExpand;
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
            width: 100%;
            
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
            display: grid;
            grid-template-columns: 1.5fr 0.5fr;
            border: 1px solid $borderColor;
            border-radius: $borderRadius;
            height: 100%;
            width: 100%;
            padding: 0.3rem;
            .areaname {
                grid-column: 1 / span 2;
                justify-self: center;
            }
        }

        &_adjust {
            width: 50px;
            margin-left: 1rem;
        }
    }

</style>