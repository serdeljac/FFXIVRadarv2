<template>
    <div 
        class="btn_menu"
        :style="`background-image:url('../../assets/icons/menu.svg')`">
        <!-- <img class="btn_menu" :src="`../../assets/icons/menu.svg`" /> -->
    </div>
</template>

<script lang="ts">
// import SOMETHING from '../../components/something.vue';

    export default {
        name: "Title",
        props: ['propname'],
        emits: ['eventname'],
        data() {
            return {
                key: 'value' as String,
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