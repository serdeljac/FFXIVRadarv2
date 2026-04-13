<template>
    <img :src="getIconImageURL()" class="iconSize menu"></img>
</template>

<script lang="ts" setup>
    function getIconImageURL() {
        return new URL(`/src/assets/icons/menu.svg`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Menu Button",
    }
</script>

<style scoped lang="scss">
.menu {
    width: 32px;
    cursor: pointer;
    border: 1px solid $borderColor;
    border-radius: 100%;
    background-size: 32px;
    background-position: center;
    &:hover {border: 2px solid $borderColor;}
}
</style>