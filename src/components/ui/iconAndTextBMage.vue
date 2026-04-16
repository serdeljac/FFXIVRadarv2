<template>
    <div class="iconToText">
        <img class="iconSize" :src="getIconImageURL(fetchIconName)"/>
        <p>{{ bmData[0] }}</p>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Icon & Text Blue Mage",
        props: ['bmData'],
        computed: {
            fetchIconName() {
                let type = this.bmData[0]
                return type
            }
        },
    }
</script>

<style scoped lang="scss">
    .iconToText {
        display: inline-flex;
        align-items: center;
    }
</style>