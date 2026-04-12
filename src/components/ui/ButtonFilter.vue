<template>
    <div :class="[`btn`, {'disable': disabled}]">
        {{ fetchName }}
    </div>
</template>

<script lang="ts">

    export default {
        name: "Button Filter",
        props: ['name', 'icon', 'disabled'],
        computed: {
            fetchName() {
                let properName = this.name.charAt(0).toUpperCase() + this.name.slice(1)
                return properName
            }
        },
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
        position: relative;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-width: 2px;
        border-radius: 4px;
        background-color: $buttonBackgroundColor;
        padding: 8px 12px;
        margin: 0.5rem;
        min-width: 120px;
        cursor: pointer;
        user-select: none;
        transition: background-color .07s linear;
        letter-spacing: 2px;
        font-style: italic;
        &.disable {opacity: 0.5}

        &:hover {
            background-color: $buttonBackgroundColorHover;
        }
    }
</style>