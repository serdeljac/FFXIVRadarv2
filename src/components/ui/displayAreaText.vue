<template>
    <p>
        <span class="hasContext" :data-context="`${areaObj.expansion.charAt(0).toUpperCase() + areaObj.expansion.slice(1)} > ${areaObj.area.zone}`">
            <img :src="`../../assets/icons/${areaObj.area.icon}.webp`"/>
        
        {{ `${areaObj.area.area}` }}
        <span class="cord">{{ `(x${areaObj.x}, y${areaObj.y})` }}</span>
        </span>
    </p>
</template>

<script>
    export default {
        name: "Display Area in Text",
        props: ['areaObj']
    }
</script>

<style scoped lang="scss">
    p {
        display:inline-flex;
        align-items: center;
        
        img {
            margin-right: 6px;
            width: 20px;
            aspect-ratio: 1/1;
        }
        .cord {
            color: rgb(123, 123, 238);
            margin-left: 4px;
        }
    }
</style>