<template>
    <div class="trackingbar">
        <div class="trackingbar_header">
            <router-link :to="`/`">
            <h1>FFXIV Radar</h1>
            </router-link>
        </div>
        <div class="trackingbar_items">
            <ul>
                <li v-for="d in trackinglist" :key="d.ID">
                    {{ d.name }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import menuButton from '../ui/ButtonMenu.vue';

    export default {
        name: 'Tracking Bar',
        components: {menuButton},
        props: ['trackinglist']
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

        &_items {padding: $paddingSize;}
    }

</style>