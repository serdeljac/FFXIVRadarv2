<template>
    <div :class="[`promotion_banner`]">
        <div :class="[`promotion_banner_wide`]">
            PROMOTION BANNER
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Promotion Banner",
        props: ['length']
    }
</script>

<style scoped lang="scss">
    .promotion_banner {
        
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 728px;
        // height: 90px;
        aspect-ratio: 8 / 1;
        background-color: white;
        margin: auto;
    }
</style>