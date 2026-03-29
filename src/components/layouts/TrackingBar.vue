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
                    <p class="itemname">{{ d.name }}</p>
                    <p class="jobicon">{{ d.job_sub }}</p>
                    <p class="areaname">{{ d.area.area }}</p>
                    <p class="timer">{{ d.time }}</p>
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

    export default {
        name: 'Tracking Bar',
        components: {menuButton},
        props: ['windowWidth', 'trackinglist']
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
            height: 100%;
            width: 100%;
            padding: 0.3rem;
            p {font-size: 0.9rem;}
        }

        &_adjust {
            width: 50px;
            margin-left: 1rem;
        }
    }

</style>