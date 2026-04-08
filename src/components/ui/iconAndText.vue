<template>
    <div class="itt">
        <img :src="`../../assets/icons/${checkImgName(icon)}.webp`"/>
        <p>{{ text }}</p>
    </div>
</template>

<script lang="ts">
    export default {
        name: "Icon & Text",
        props: ['icon', 'text'],
        methods: {
            checkImgName(name: string) {
                if (name == 'Crafting') {return `sq_${name}`}
                return name
            }
        }
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