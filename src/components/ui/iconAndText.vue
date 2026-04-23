<template>
    <div :class="[`iconAndText`, addClass]" :chainNo="chainNo ? chainNo : null">
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
        props: ['icon', 'text', 'addClass', 'chainNo'],
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
        &.rewards {
            img {margin-right: 2px;}
            p {margin-right: 6px;}
        }

        &[chainno] {
            img {opacity: 0.7;}
            &::before {
                @extend .inheritChainNo;
            }
        }

        
    }
</style>