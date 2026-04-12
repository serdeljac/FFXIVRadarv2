<template>
    <div class="itt">
        <img :src="`../../assets/icons/${fetchIconName}.webp`"/>
        <p>{{ text }}</p>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Icon & Text",
        props: ['icon', 'text'],
        computed: {
            fetchIconName() {
                if (this.text == 'Crafting') {return `sq_${this.text}`}
                return this.text
            }
        },
    }
</script>

<style scoped lang="scss">
    .itt {
        display: inline-flex;
        align-items: center;
        img {
            width: 20px;
            margin-right: 6px;
            aspect-ratio: 1 / 1;
        }
    }
</style>