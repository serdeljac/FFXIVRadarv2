<template>
    <div class="menu" :style="`background-image:url('/src/assets/icons/menu.svg')`"></div>
</template>

<script lang="ts">
    export default {
        name: "Menu Button",
    }
</script>

<style scoped lang="scss">
.menu {
    width: 32px;
    aspect-ratio: 1/1;
    cursor: pointer;
    border: 1px solid $borderColor;
    border-radius: 100%;
    background-size: 32px;
    background-position: center;
    &:hover {border: 2px solid $borderColor;}
}
</style>