<template>
    <div :class="[`btn`, {'inactive': !state}]">
        {{ fetchProperNameDisplay(name) }}
    </div>
</template>

<script lang="ts">
    export default {
        name: "Button Filter",
        props: ['name', 'icon', 'state'],
        methods: {
            fetchProperNameDisplay(rawName: string) {
                if (rawName == 'miner') {return 'Miner'}
                if (rawName == 'botany') {return 'Botanist'}
                if (rawName == 'purple') {return 'Purple Scripts'}
                if (rawName == 'orange') {return 'Orange Scripts'}
                if (rawName == 'aetherial') {return 'Aetherial'}
                if (rawName == 'customdelivery') {return 'Custom Delivery'}
                if (rawName == 'arr') {return 'A Realm Reborn'}
                if (rawName == 'hwd') {return 'Heavensward'}
                if (rawName == 'sbd') {return 'Stormblood'}
                if (rawName == 'sbs') {return 'Shadowbringers'}
                if (rawName == 'ewr') {return 'Endwalker'}
                if (rawName == 'dtl') {return 'Dawntrail'}
                return rawName
            },
        }
    }
</script>

<style scoped lang="scss">
    .btn {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: $bodyBackgroundColor;
        border: 1px solid $borderColor;
        cursor: pointer;
        user-select: none;

        &.inactive {
            opacity: 0.5;
        }

        img {
            width: 20px;
            aspect-ratio: 1/1;
            margin-right: 6px;
        }
    }
</style>