<template>
    <div 
        @click="menuBtn = !menuBtn; $emit('menuCondition', menuBtn)"
        class="btn_menu"
        :style="`background-image:url('../../assets/icons/menu.svg')`">
    </div>
</template>

<script lang="ts">

    export default {
        name: "Title",
        emits: ['menuCondition'],
        data() {
            return {
                menuBtn: true,
            }
        },
    }
</script>

<style scoped lang="scss">
.btn_menu {
    width: 32px;
    aspect-ratio: 1/1;
    cursor: pointer;
    border: 1px solid $borderColor;
    border-radius: 100%;
    background-size: 32px;
    background-position: center;

    &:hover {
        border: 2px solid $borderColor;
    }
}
</style>