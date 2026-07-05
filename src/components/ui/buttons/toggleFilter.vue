<template>
    <button :class="[`btn`]" :disabled="disabled" :enabled="enabled">
        <iconImgAPI :name="getIconImageURL(icon)" v-if="!noicon"/>
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
        return name
    }
</script>

<script lang="ts">
import iconImgAPI from '../../API/iconImg.vue';
    export default {
        name: "Filter Toggle Button",
        props: ['name', 'icon', 'disabled', 'enabled', 'noicon'],
        components: { iconImgAPI },
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
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0 0.5rem;
        transition: all 0.1s linear;
        border-radius: $borderRadius;
        height: 40px;
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