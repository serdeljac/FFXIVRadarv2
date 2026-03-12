<template>
    <div :class="[`trackingbar`]">
        <p>Tracking Bar</p>
    </div>
</template>

<script lang="ts">
    export default {
        name: 'Tracking Bar',
    }
</script>

<style scoped lang="scss">
    .trackingbar {
        padding: $paddingSize;
        background: blue;
    }

</style>