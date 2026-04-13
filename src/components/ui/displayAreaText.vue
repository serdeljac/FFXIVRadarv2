<template>
    <div :class="[`btn_area hasContext`, {'hasBackground': excludeBackground}]" :data-context="`${areaObj.expansion.charAt(0).toUpperCase() + areaObj.expansion.slice(1)} > ${areaObj.area.zone}`">
        <img class="iconSize" :src="getIconImageURL(areaObj.area.icon)"/>
        <p>{{ `${areaObj.area.area}` }}</p>
        <span class="cord">{{ `(x${areaObj.x}, y${areaObj.y})` }}</span>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Display Area in Text",
        props: ['areaObj', 'excludeBackground']
    }
</script>

<style scoped lang="scss">
.btn_area {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    
    &.hasBackground {
        transition: all .07s linear;
        border-radius: 4px;
        padding: 4px 8px;
        background-color: $buttonBackgroundColor;
        &:hover {background-color: $buttonBackgroundColorHover;}
    }
    
    img {
        margin-right: 6px;
        width: 20px;
        aspect-ratio: 1 / 1;
    }

    .cord {
        color: rgb(123, 123, 238);
        margin-left: 4px;
    }
}
</style>