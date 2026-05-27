<template>
    <button :class="[`btn`]" :disabled="disabled" :enabled="enabled">
        <img v-if="icon" :src="getIconImageURL(icon)"/>
        {{ fetchName }}
    </button>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        name = name.toLowerCase().replace(/ /g,'')
        name = name == 'crafting' ? 'sq_crafting' : name
        name = name == 'scripts' ? 'purplegatherscripts' : name
        name = name == 'arealmreborn' ? 'arr' : name
        name = name == 'heavensward' ? 'hwd' : name
        name = name == 'stormblood' ? 'sbd' : name
        name = name == 'shadowbringers' ? 'sbs' : name
        name = name == 'endwalker' ? 'ewr' : name
        name = name == 'dawntrail' ? 'dtl' : name
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Filter Toggle Button",
        props: ['name', 'icon', 'disabled', 'enabled'],
        computed: {
            fetchName() {
                let properName = this.name.charAt(0).toUpperCase() + this.name.slice(1)
                return properName
            }
        },
    }
</script>

<style scoped lang="scss">
    .btn {
        border: 1px solid $buttonBackgroundColor;
        background-color: $bodyBackgroundColor;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0 0.5rem;
        transition: all 0.1s linear;
        border-radius: $borderRadius;
        height: 40px;
        font-weight: bold;
        margin: 10px 0.5rem;
        box-shadow: inset 0.4px 1px 2px rgba(255, 255, 255, 0.116),
                0px 0px 3px $buttonBackgroundColorHover;
        &[enabled] {background-color: $buttonBackgroundColor !important;}
        &[disabled] {
            opacity: 0.1;
            cursor: not-allowed;
        }
        img {
            width: 20px;
            height: 20px;
            margin-right: 6px;
        }
        &:hover:not([disabled]) {
            background-color: $buttonBackgroundColorHover;
            box-shadow: inset 0.4px 1px 2px rgba(255, 255, 255, 0.116),
                0px 0px 3px $buttonBackgroundColorHover;
            transform: scale(1.05);
        }
    }
</style>