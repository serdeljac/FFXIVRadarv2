<template>
    <div class="trackingbar">
        <div class="trackingbar_header">
            <h1>FFXIV Radar</h1>
        </div>
        <div class="trackingbar_items">
            <p>Tracking Bar</p>
        </div>
    </div>
</template>

<script lang="ts">
import menuButton from '../ui/ButtonMenu.vue';

    export default {
        name: 'Tracking Bar',
        components: {menuButton},
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