<template>
    <div :class="[`btn_area hasContext`, {'hasBackground': excludeBackground}]" :data-context="`${areaObj.expansion.charAt(0).toUpperCase() + areaObj.expansion.slice(1)} > ${areaObj.area.zone}`">
        <iconImgAPI :name="areaObj.area.icon"/>
        <p>{{ `${areaObj.area.area}` }}</p>
        <span class="cord">{{ `(x${areaObj.x}, y${areaObj.y})` }}</span>
    </div>
</template>

<script lang="ts">
    import iconImgAPI from '../API/iconImg.vue';
    export default {
        name: "Display Area in Text",
        props: ['areaObj', 'excludeBackground'],
        components: {iconImgAPI},
    }
</script>

<style scoped lang="scss">
.btn_area {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;
    &:active {
        box-shadow: inset rgba(0, 0, 0, 0.22) 0px 1px 3px, inset rgba(0, 0, 0, 0.44) 0px 1px 2px;
    }
    
    &.hasBackground {
        transition: all .07s linear;
        border-radius: 4px;
        padding: 4px 8px;
        background-color: $buttonBackgroundColor;
        &:hover {background-color: $buttonBackgroundColorHover;}
    }
}
</style>