<template>
    <div class="iconAndText">
        <img class="iconSize" :src="getIconImageURL(fetchIconName)"/>
        <p v-if="text">{{ text }}</p>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Icon & Text",
        props: ['icon', 'text'],
        computed: {
            fetchIconName() {
                if (this.icon == 'Crafting') {return `sq_${this.icon}`}
                else if (this.icon == 'eliteHunts') {return 'hunts'}
                let toLowerCaseName = this.icon.toLowerCase()
                return toLowerCaseName
            }
        },
    }
</script>

<style scoped lang="scss">
    .iconAndText {
        display: inline-flex;
        align-items: center;
    }
</style>