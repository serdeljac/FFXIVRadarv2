<template>
    <div>
        {{ focusNode.length == 0 ? null : focusNode }}
    </div>
</template>

<script lang="ts">
    export default {
        name: 'Eorzea Map',
        props: ['ffxivData', 'focusNode']
    }
</script>

<style scoped lang="scss">

</style>