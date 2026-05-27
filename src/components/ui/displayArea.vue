<template>
    <div class="displayArea">
        <img :src="getIconImageURL(node.area.icon)" />
        <p>
            {{ `${node.area.region} > ${node.area.area}` }}
            <span class="cord">{{ `(x${node.x}, y${node.y})` }}</span>
        </p>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Area Display",
        props: ['node']
    }
</script>

<style scoped lang="scss">
    .displayArea {
        display: inline-flex;
        align-items: center;

        img {
            margin-right: 6px;
            width: 20px;
            height: 20px;
            aspect-ratio: 1 / 1;
        }

        .cord {
            color: rgb(123, 123, 238);
            margin-left: 4px;
        }
    }
</style>