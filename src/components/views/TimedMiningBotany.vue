<template>
    <div>
        <promotionBanner length="wide"/>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';

    export default {
        name: "Timed Mining/Botany",
        components: {promotionBanner},
        props: ['ffxivData']
    }
</script>

<style scoped lang="scss">

</style>