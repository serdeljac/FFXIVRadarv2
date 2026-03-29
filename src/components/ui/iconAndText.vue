<template>
    <div class="itt">
        <img :src="`../../assets/icons/${icon}.webp`"/>
        <p>{{ text }}</p>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Icon & Text",
        props: ['icon', 'text']
    }
</script>

<style scoped lang="scss">
    .itt {
        display: inline-flex;
        align-items: center;
        img {
            width: 20px;
            margin-right: 6px;
        }
    }
</style>