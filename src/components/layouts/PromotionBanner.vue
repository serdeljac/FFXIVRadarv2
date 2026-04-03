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
        width: 100%;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        
        &_wide {
            width: 728px;
            height: 90px;
            aspect-ratio: 1 / 1;
            background-color: white;
        }
    }
</style>